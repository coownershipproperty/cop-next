/**
 * POST /api/save-search
 * Saves a visitor's search criteria so they can receive alerts when matching
 * properties are added.
 *
 * Body: { email, name?, phone?, regions[], maxPrice?, minBeds? }
 *
 * `phone` is optional and is stored on the CONTACT, not on the saved search —
 * saved_searches has no phone column and does not need one. A number here is
 * what turns an alert subscriber into a lead we can hand to a partner, so it is
 * worth collecting even though nothing in this handler depends on it.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { upsertContact, createLead, incrementScore, logActivity, enrichContactIntelligence } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendHtml, sendTeamNotification } from '@/lib/resend';
import { expandRegions } from '@/lib/regionMap';

function getDb() {
  return createSupabaseAdminClient();
}

/**
 * Fetch up to 3 properties matching the alert criteria.
 * Tries regions against both country and region columns.
 */
const norm = (v) => String(v == null ? '' : v).trim().toLowerCase();

async function getMatchingProperties(regions, maxPrice, minBeds, { email, limit = 4 } = {}) {
  const db = getDb();
  const FIELDS = 'slug, title, img, price, currency, beds, size, city, country, region, date_added';

  const activeRegions = (regions || []).filter(r => r && r !== 'All');

  // ── 1. Candidate pool: every live home inside their criteria ──────────────
  let query = db
    .from('properties')
    .select(FIELDS)
    .in('status', ['Live', 'for_sale']);

  if (maxPrice) query = query.lte('price', parseInt(maxPrice, 10));
  if (minBeds)  query = query.gte('beds',  parseInt(minBeds,  10));

  if (activeRegions.length > 0) {
    // Expand form labels (e.g. "Italian Lakes") to actual DB region values.
    // The map never yields a bare country for a sub-region label.
    const dbTerms = expandRegions(activeRegions);
    const orParts = dbTerms.flatMap(t => [
      `country.ilike.%${t}%`,
      `region.ilike.%${t}%`,
      `city.ilike.%${t}%`,
    ]);
    query = query.or(orParts.join(','));
  }

  const { data } = await query.limit(200);
  const pool = data || [];
  if (!pool.length) return [];

  // ── 2. What have they actually looked at? ────────────────────────────────
  // Gallery unlocks are the strongest preference signal we hold. A home they
  // already unlocked is not a recommendation (they have the photos), but its
  // region and price band are exactly what to recommend more of.
  const seen = new Set();
  const seenRegions = new Map();
  const seenPrices = [];
  try {
    if (email) {
      const { data: c } = await db.from('contacts').select('id').eq('email', String(email).toLowerCase()).maybeSingle();
      if (c?.id) {
        const { data: acts } = await db.from('activities')
          .select('metadata').eq('contact_id', c.id).eq('type', 'floor_plan_requested')
          .order('created_at', { ascending: false }).limit(50);
        const slugs = [...new Set((acts || []).map(a => a.metadata?.propertySlug).filter(Boolean))];
        if (slugs.length) {
          const { data: seenRows } = await db.from('properties').select('slug, region, price').in('slug', slugs);
          for (const r of seenRows || []) {
            seen.add(r.slug);
            if (r.region) seenRegions.set(String(r.region).toLowerCase(), (seenRegions.get(String(r.region).toLowerCase()) || 0) + 1);
            if (r.price) seenPrices.push(Number(r.price));
          }
        }
      }
    }
  } catch (e) {
    console.error('[SaveSearch] preference lookup failed:', e.message);
  }
  const medianSeen = seenPrices.length
    ? seenPrices.sort((a, b) => a - b)[Math.floor(seenPrices.length / 2)]
    : null;

  // ── 3. Score, then diversify one home per region ─────────────────────────
  //   region they unlocked      +60 (+5 per extra unlock there, capped)
  //   price near what they viewed 0–30 (full marks within 10%, zero at 60% out)
  //   has a photo               +6
  //   listed in the last 30 days +4 (alerts are about what is new)
  //   already unlocked          excluded
  const scored = pool
    .filter(p => !seen.has(p.slug))
    .map(p => {
      let score = 0;
      const reg = String(p.region || '').toLowerCase();
      if (seenRegions.has(reg)) score += 60 + Math.min(15, 5 * (seenRegions.get(reg) - 1));
      if (medianSeen && p.price) {
        const delta = Math.abs(Number(p.price) - medianSeen) / medianSeen;
        score += 30 * Math.max(0, 1 - Math.min(1, Math.max(0, delta - 0.1) / 0.5));
      }
      if (p.img) score += 6;
      if (p.date_added && Date.now() - new Date(p.date_added).getTime() < 30 * 864e5) score += 4;
      return { p, score };
    })
    .sort((a, b) => b.score - a.score || Number(a.p.price || 0) - Number(b.p.price || 0) || String(a.p.slug).localeCompare(String(b.p.slug)));

  const picked = [];
  const usedRegions = new Set();
  for (const { p } of scored) {                       // first pass: one per region
    const reg = String(p.region || p.country || '').toLowerCase();
    if (usedRegions.has(reg)) continue;
    usedRegions.add(reg); picked.push(p);
    if (picked.length >= limit) break;
  }
  const sameTitle = (a, b) => norm(a.title) && norm(a.title) === norm(b.title);
  for (const { p } of scored) {                       // second pass: fill up
    if (picked.length >= limit) break;
    // Two listings can share a title (a second release of the same home) —
    // showing both looks like a mistake.
    if (!picked.includes(p) && !picked.some((q) => sameTitle(q, p))) picked.push(p);
  }
  return picked;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, name, phone, regions, maxPrice, minBeds } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  if (!regions || regions.length === 0) return res.status(400).json({ error: 'Select at least one region' });

  const { limited } = await checkRateLimit(email, 'save-search', 10 * 60 * 1000, 5);
  if (limited) return res.status(429).json({ error: 'Too many requests' });

  const db = getDb();

  // Save the search (upsert on email — one saved search per email address)
  const { data: saved, error } = await db
    .from('saved_searches')
    .upsert(
      {
        email:     email.toLowerCase().trim(),
        name:      name   || null,
        regions:   regions,
        max_price: maxPrice ? parseInt(maxPrice, 10) : null,
        min_beds:  minBeds  ? parseInt(minBeds,  10) : null,
        active:    true,
      },
      { onConflict: 'email' }
    )
    .select()
    .single();

  if (error) {
    console.error('[SaveSearch] DB error:', error.message);
    return res.status(500).json({ error: 'Could not save search' });
  }

  // CRM: upsert contact + log activity
  let contact = null;
  try {
    const nameParts = (name || '').trim().split(' ');
    contact = await upsertContact({
      email,
      firstName: nameParts[0] || null,
      lastName:  nameParts.slice(1).join(' ') || null,
      // upsertContact ignores a blank/short value rather than overwriting an
      // existing number with null, so passing it unconditionally is safe.
      phone:     phone || null,
      source:    'saved_search',
    });
    contact = await enrichContactIntelligence({ contact, email, phone, request: req });
    if (contact) {
      // +5 points for setting up an alert (good intent signal)
      await incrementScore(contact.id, 5);

      // Create a lead record so it appears in the CRM leads view
      await createLead({
        contactId:  contact.id,
        mainRegion: regions.filter(r => r !== 'All').join(', ') || null,
        budget:     maxPrice || null,
      });

      await logActivity({
        contactId:   contact.id,
        type:        'search_saved',
        description: `Saved search: ${regions.join(', ')}${maxPrice ? `, max \u20ac${parseInt(maxPrice).toLocaleString()}` : ''}`,
        metadata:    { regions, maxPrice, minBeds, phone: phone || null },
      });
    }
  } catch (e) {
    console.error('[CRM] save-search write failed:', e.message);
  }

  // Fetch matching properties for the email
  let matchingProperties = [];
  try {
    matchingProperties = await getMatchingProperties(regions, maxPrice, minBeds, { email });
  } catch (e) {
    console.error('[SaveSearch] matching properties lookup failed:', e.message);
  }

  // Send confirmation email via Resend
  try {
    const regionList = regions.join(', ');
    const criteriaLines = [
      `<tr><td style="padding:6px 0;font-size:13px;color:#6b7d8d;width:130px">Destinations</td><td style="padding:6px 0;font-size:13px;color:#1E3448;font-weight:600">${regionList}</td></tr>`,
      maxPrice ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7d8d">Max budget</td><td style="padding:6px 0;font-size:13px;color:#1E3448;font-weight:600">\u20ac${parseInt(maxPrice).toLocaleString()}</td></tr>` : '',
      minBeds  ? `<tr><td style="padding:6px 0;font-size:13px;color:#6b7d8d">Min bedrooms</td><td style="padding:6px 0;font-size:13px;color:#1E3448;font-weight:600">${minBeds}+</td></tr>` : '',
    ].filter(Boolean).join('');

    const firstName = (name || '').trim().split(' ')[0] || null;
    const base = 'https://co-ownership-property.com';

    // Build property cards HTML
    const propCardsHtml = matchingProperties.length > 0 ? `
        <!-- Matching Properties -->
        <tr><td style="background:#F7F4EE;padding:40px 48px 8px">
          <p style="margin:0 0 8px;font-size:10px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#C9A84C;font-family:Georgia,serif">Matching your search right now</p>
          <div style="width:36px;height:1px;background:#C9A84C;margin:0 0 24px"></div>
        </td></tr>
        ${matchingProperties.map(p => {
          const sym = { EUR: '\u20ac', USD: '$', GBP: '\u00a3' }[p.currency] || '\u20ac';
          const priceStr = p.price ? `${sym}${Number(p.price).toLocaleString('en-GB')}` : '';
          const dashIdx = (p.title || '').indexOf('\u2014');
          const loc  = dashIdx > -1 ? p.title.slice(0, dashIdx).trim() : (p.city || p.country || '');
          const name = dashIdx > -1 ? p.title.slice(dashIdx + 1).trim() : p.title;
          const img  = p.img || '';
          const href = `${base}/property/${p.slug}`;
          return `
        <tr><td style="background:#F7F4EE;padding:0 48px 16px">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff">
            <tr>
              ${img ? `<td style="width:140px;vertical-align:top">
                <a href="${href}"><img src="${img}" width="140" height="105" alt="${loc}" style="display:block;width:140px;height:105px;object-fit:cover"></a>
              </td>` : ''}
              <td style="vertical-align:top;padding:16px 20px">
                <p style="margin:0 0 5px;font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:#C9A84C">${loc}</p>
                <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:15px;font-weight:400;color:#1E3448;line-height:1.4">${name}</p>
                ${p.beds ? `<p style="margin:0 0 6px;font-size:11px;color:#6B8A9E">${p.beds} beds${p.size ? ` &nbsp;&middot;&nbsp; ${p.size} m\u00b2` : ''}</p>` : ''}
                ${priceStr ? `<p style="margin:0 0 10px;font-family:Georgia,serif;font-size:18px;color:#1E3448">${priceStr}</p>` : ''}
                <a href="${href}" style="font-size:11px;font-weight:600;letter-spacing:0.1em;color:#C9A84C;text-decoration:none">View Property \u2192</a>
              </td>
            </tr>
          </table>
        </td></tr>`;
        }).join('')}
        <tr><td style="background:#F7F4EE;padding:16px 48px 40px;text-align:center">
          <a href="${base}/our-homes/" style="font-size:11px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;color:#C9A84C;text-decoration:none">See All Properties \u2192</a>
        </td></tr>
    ` : '';

    await sendHtml({
      to:      email,
      subject: "Your property alert is set \u2014 we'll notify you of new listings",
      // Recorded in the CRM with the exact homes recommended, so the
      // recommendations can be checked afterwards.
      log: {
        trigger: 'search_saved', type: 'alert_confirmation', contactId: contact?.id || null,
        notes: 'Property alert confirmation',
        templateProps: {
          regions, maxPrice: maxPrice || null, minBeds: minBeds || null,
          recommended: matchingProperties.map(p => ({ slug: p.slug, title: p.title, price: p.price, currency: p.currency })),
        },
      },
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F4EE;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:40px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%">

        <!-- Header -->
        <tr><td style="background:#ffffff;padding:30px 48px 26px;text-align:center;border-bottom:1px solid #E8E3DC">
          <img src="${base}/images/email-logo-dark.png" width="140" alt="Co-Ownership Property" style="display:inline-block;width:140px;height:auto">
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:48px 48px 40px;text-align:center">
          <p style="margin:0 0 8px;font-family:Georgia,serif;font-size:11px;font-weight:400;letter-spacing:0.22em;text-transform:uppercase;color:#C9A84C">Property Alert</p>
          <h1 style="margin:0 0 24px;font-family:Georgia,serif;font-size:28px;font-weight:400;color:#1E3448;line-height:1.3">
            <em>Your alert is active${firstName ? `, ${firstName}` : ''}</em>
          </h1>
          <div style="width:40px;height:1px;background:#C9A84C;margin:0 auto 28px"></div>
          <p style="margin:0 0 28px;font-size:14px;font-weight:300;color:#4A6070;line-height:1.8;text-align:center">
            We'll email you the moment a new property matching your criteria is listed on the site.
          </p>

          <!-- Criteria box -->
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EE;padding:20px 24px;margin-bottom:32px;text-align:left">
            <tr><td colspan="2" style="padding-bottom:10px;font-size:10px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#C9A84C">Your search criteria</td></tr>
            ${criteriaLines}
          </table>

          <!-- CTA -->
          <a href="${base}/our-homes/" style="display:inline-block;background:#1E3448;color:#ffffff;font-size:11px;font-weight:500;letter-spacing:0.18em;text-transform:uppercase;padding:18px 48px;text-decoration:none">
            Browse Properties Now
          </a>
        </td></tr>

        ${propCardsHtml}

        <!-- Footer -->
        <tr><td style="background:#1E3448;border-top:1px solid #C9A84C;padding:36px 48px;text-align:center">
          <p style="margin:0 0 12px;font-family:Georgia,serif;font-size:15px;font-weight:400;letter-spacing:0.12em;text-transform:uppercase;color:#ffffff">Co-Ownership Property</p>
          <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.35);line-height:1.7">
            You're receiving this because you set up a property alert on co-ownership-property.com.<br>
            Reply to this email to update or cancel your alert at any time.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
  } catch (e) {
    console.error('[Resend] save-search confirmation failed:', e.message);
    // Don't fail the request — the alert was saved successfully
  }

  // Team notification
  try {
    await sendTeamNotification({
      subject: `Property Alert Set \u2014 ${name || email}`,
      html: `
        <h2>New Property Alert</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${phone ? phone : '<em>not provided (optional field)</em>'}</p>
        <p><strong>Regions:</strong> ${regions.join(', ')}</p>
        ${maxPrice ? `<p><strong>Max Budget:</strong> \u20ac${parseInt(maxPrice).toLocaleString()}</p>` : ''}
        ${minBeds  ? `<p><strong>Min Beds:</strong> ${minBeds}</p>` : ''}
        <p><strong>Matching properties found:</strong> ${matchingProperties.length}</p>
      `,
    });
  } catch (e) {
    console.error('[Resend] save-search team notification failed:', e.message);
  }

  return res.status(200).json({ ok: true });
}
