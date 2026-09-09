import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { checkRateLimit } from '@/lib/rateLimit';
import { createLead, logActivity } from '@/lib/crm';
import { sendTeamNotification } from '@/lib/resend';
import { ALL_LOCALES } from '@/lib/i18n';

/**
 * Discreet-sale listings — the full listing behind the enquiry.
 *
 * A discreet home's public page ships ONE photo, the title and the headline
 * numbers; description, amenities and every photo are stripped server-side
 * (see getStaticProps in pages/property/[slug].js). Once a visitor has
 * enquired, the page calls this endpoint with their email and receives the
 * rest. "Has enquired" = a CRM contact exists for that address, which
 * /api/enquiry creates on every submission.
 *
 * One enquiry unlocks every discreet home (David, 9 Sep 2026) — the visitor
 * never fills the form twice. But each further home they open is recorded:
 * the first unlock of a given home creates a lead for that contact + slug,
 * logs a `discreet_unlocked` activity and emails the team, so the CRM always
 * shows exactly which discreet homes each person has looked at.
 *
 * Never returns partner-identifying fields. Never serves hidden rows.
 */

const PUBLIC_STATUSES = ['Live', 'for_sale', 'sold'];

function cleanSlug(v) {
  const s = String(v || '').trim().slice(0, 220);
  return /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(s) ? s : null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const slug = cleanSlug(req.body?.slug);
  const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 200);
  if (!slug || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ error: 'Missing slug or email' });
  }

  // Generous limit — a real visitor opens a handful of discreet homes; a
  // scraper cycling slugs on one address does not get the catalogue.
  const { limited } = await checkRateLimit(`${email}`, 'discreet_listing', 10 * 60 * 1000, 40);
  if (limited) return res.status(429).json({ error: 'Too many requests' });

  const db = createSupabaseAdminClient();

  const { data: contact, error: cErr } = await db
    .from('contacts')
    .select('id, first_name, last_name, phone')
    .ilike('email', email)
    .limit(1)
    .maybeSingle();
  if (cErr) return res.status(500).json({ error: 'Lookup failed' });
  if (!contact) return res.status(403).json({ error: 'Enquire first', code: 'not_enquired' });

  const descCols = ['description', ...ALL_LOCALES.map(l => `description_${l}`)];
  const amenCols = ['amenities', ...ALL_LOCALES.map(l => `amenities_${l}`)];
  const { data: prop, error: pErr } = await db
    .from('properties')
    .select(['slug', 'title', 'status', 'is_discreet', 'region', 'city', 'img', 'images', 'photos', 'extra_photos', 'documents', 'total_images', 'drive_url', ...descCols, ...amenCols].join(','))
    .eq('slug', slug)
    .in('status', PUBLIC_STATUSES)
    .maybeSingle();
  if (pErr) return res.status(500).json({ error: 'Lookup failed' });
  if (!prop) return res.status(404).json({ error: 'Not found' });

  // Only discreet rows are gated here; anything else is already public.
  if (!prop.is_discreet) return res.status(400).json({ error: 'Not a discreet listing' });

  const out = {
    images: Array.isArray(prop.images) ? prop.images : (prop.img ? [prop.img] : []),
    photos: Array.isArray(prop.photos) ? prop.photos : [],
    extra_photos: Array.isArray(prop.extra_photos) ? prop.extra_photos : [],
    documents: Array.isArray(prop.documents) ? prop.documents : [],
    total_images: prop.total_images || (Array.isArray(prop.images) ? prop.images.length : 0),
    driveUrl: prop.drive_url || null,
  };
  for (const c of [...descCols, ...amenCols]) if (prop[c] != null) out[c] = prop[c];

  // Record the unlock. First time this contact opens THIS home → a lead for
  // it + team email (the enquiry that unlocked their first home already made
  // that one's lead). Repeat opens of the same home only log an activity.
  try {
    const { data: existing } = await db
      .from('leads')
      .select('id')
      .eq('contact_id', contact.id)
      .eq('property_slug', slug)
      .limit(1)
      .maybeSingle();

    let leadId = existing?.id || null;
    const firstOpen = !existing;
    if (firstOpen) {
      const lead = await createLead({
        contactId:     contact.id,
        propertySlug:  slug,
        propertyTitle: prop.title || slug,
        mainRegion:    prop.region || null,
        subregion:     prop.city || null,
        message:       'Unlocked the full listing — discreet sale (already-known visitor, no new form)',
        enquiryPageUrl: `https://co-ownership-property.com/property/${slug}/`,
      });
      leadId = lead?.id || null;
    }

    await logActivity({
      contactId:   contact.id,
      leadId,
      type:        'discreet_unlocked',
      description: `${firstOpen ? 'Unlocked' : 'Re-opened'} discreet listing ${prop.title || slug}`,
      metadata:    { slug, first_open: firstOpen },
    });

    if (firstOpen) {
      const who = [contact.first_name, contact.last_name].filter(Boolean).join(' ') || email;
      await sendTeamNotification({
        subject: `Discreet listing unlocked — ${prop.title || slug} by ${who}`,
        html: `
          <h2>Discreet listing unlocked</h2>
          <p><strong>Property:</strong> ${prop.title || slug} — <a href="https://co-ownership-property.com/property/${slug}/">https://co-ownership-property.com/property/${slug}/</a></p>
          <p><strong>Name:</strong> ${who}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${contact.phone || 'Not provided'}</p>
          <p>This visitor had already enquired on another discreet home, so no new form was filled — the unlock itself is the signal. A lead has been created for this home.</p>
        `,
        threadKey: `discreet-${email}`,
      });
    }
  } catch (e) {
    console.error('[discreet-listing] CRM record failed:', e.message);
  }

  res.setHeader('Cache-Control', 'private, no-store');
  return res.status(200).json(out);
}
