/**
 * POST /api/discreet-brochure
 *
 * A Discreet Sale card asks for first name, email and phone, and this sends
 * the person the full brochure by email (lib/discreetBrochure.js). It is a
 * brochure REQUEST, not an enquiry (David, 15 Sep 2026): no "Thanks for your
 * enquiry" auto-reply, no enquiry_submitted activity, no reply drafter, no
 * follow-up sequence, and no one-per-hour guard — two brochures in ten
 * minutes is two brochures. The enquiry only exists when the person uses
 * the "Make an enquiry" button or replies to the brochure, and that arrives
 * in Gmail like any other message.
 *
 * What it does record: the contact (so the person is known), a lead for the
 * home (so the CRM shows which discreet homes each person asked for), an
 * activity `brochure_requested`, an email_sends row for the brochure, and a
 * short team note "Brochure sent — {home} to {name}" on the discreet-<email>
 * thread.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { upsertContact, createLead, createEmailSend, logActivity, trackingPixel, enrichContactIntelligence } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { isHoneypotFilled } from '@/lib/honeypot';
import { sendTeamNotification } from '@/lib/resend';
import { sendDiscreetBrochure } from '@/lib/discreetBrochure';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n';

// The rendered brochure, minus its <html>/<head>/<body> shell, so it can sit
// inside the team note (David: "I like to see everything that gets sent").
function brochureBodyOf(html) {
  if (!html) return '';
  const m = String(html).match(/<body[^>]*>([\s\S]*)<\/body>/i);
  return `<div style="max-width:900px">${(m ? m[1] : String(html)).replace(/<img[^>]*\/api\/track[^>]*>/gi, '')}</div>`;
}

function cleanSlug(v) { return String(v || '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 200); }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email: rawEmail, phone, propertySlug, locale: rawLocale } = req.body || {};
  if (isHoneypotFilled(req.body)) return res.status(200).json({ ok: true }); // bots get a quiet yes
  const email = String(rawEmail || '').trim().toLowerCase().slice(0, 200);
  const slug = cleanSlug(propertySlug);
  const firstName = String(name || '').trim().split(/\s+/)[0]?.slice(0, 80) || null;
  const locale = SUPPORTED_LOCALES.includes(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !slug) {
    return res.status(400).json({ error: 'Missing email or property' });
  }

  // Anti-abuse only — generous, because the same person asking for several
  // brochures in a row is exactly the behaviour we want.
  const { limited } = await checkRateLimit(email, 'discreet_brochure', 10 * 60 * 1000, 15);
  if (limited) return res.status(429).json({ error: 'Too many requests' });

  const db = createSupabaseAdminClient();
  const { data: prop, error: pErr } = await db.from('properties')
    .select('slug, title, city, region, country, partner, is_discreet, status')
    .eq('slug', slug).maybeSingle();
  if (pErr) return res.status(500).json({ error: 'Lookup failed' });
  if (!prop || !prop.is_discreet || !['Live', 'for_sale'].includes(prop.status)) {
    return res.status(404).json({ error: 'Not available' });
  }

  let contact = null, lead = null;
  try {
    contact = await upsertContact({ email, firstName, lastName: null, phone: String(phone || '').trim() || null, source: 'discreet_brochure', locale });
    try { contact = await enrichContactIntelligence({ contact, email, phone, request: req }); } catch (_) {}

    const { data: existing } = await db.from('leads').select('id')
      .eq('contact_id', contact.id).eq('property_slug', slug).limit(1).maybeSingle();
    if (existing) {
      lead = existing;
    } else {
      lead = await createLead({
        contactId:      contact.id,
        propertySlug:   slug,
        propertyTitle:  prop.title || slug,
        mainRegion:     prop.region || null,
        subregion:      prop.city || null,
        partner:        prop.partner || null,
        message:        'Requested the brochure — Discreet Sale',
        enquiryPageUrl: `https://co-ownership-property.com/property/${slug}/`,
      });
    }
  } catch (e) {
    console.error('[discreet-brochure] CRM failed:', e?.message || e);
    // The brochure still goes out; the CRM row is best-effort.
  }

  let emailSend = null;
  try {
    emailSend = await createEmailSend({
      contactId: contact?.id || null, leadId: lead?.id || null, type: 'discreet_brochure',
      subject: `${(prop.city || prop.title || slug)} — the full listing, privately`,
      toEmail: email, propertyTitle: prop.title || slug, propertyUrl: `https://co-ownership-property.com/property/${slug}/`,
    });
  } catch (_) {}

  let sent = null;
  try {
    sent = await sendDiscreetBrochure({
      to: email, firstName, slug, locale,
      contactId: contact?.id || null, leadId: lead?.id || null,
      trackingPixelHtml: emailSend?.tracking_id ? trackingPixel(emailSend.tracking_id) : '',
    });
  } catch (e) {
    console.error('[discreet-brochure] send failed:', e?.message || e);
    if (emailSend?.id) { try { await db.from('email_sends').delete().eq('id', emailSend.id); } catch (_) {} }
    return res.status(502).json({ error: 'Could not send the brochure' });
  }

  try {
    if (contact) await logActivity({
      contactId: contact.id, leadId: lead?.id || null, type: 'brochure_requested',
      description: `Brochure sent — ${prop.title || slug}`,
      metadata: { propertySlug: slug, property: prop.title || slug, locale, enquiryType: 'discreet' },
    });
    await sendTeamNotification({
      subject: `Brochure sent — ${prop.title || slug} to ${firstName || email}`,
      html: `
        <h2>Discreet Sale brochure sent</h2>
        <p><strong>Home:</strong> ${prop.title || slug}</p>
        <p><strong>To:</strong> ${firstName || ''} &lt;${email}&gt;${phone ? ` · ${String(phone).trim()}` : ''}</p>
        <p>This is a brochure request, not an enquiry — nothing to answer yet. If they use "Make an enquiry" or reply to the brochure, it lands in Gmail as a normal message.</p>
        <hr style="border:0;border-top:1px solid #ddd;margin:24px 0">
        <p><strong>What they received</strong> — subject: ${sent?.subject || ''}</p>
        ${brochureBodyOf(sent?.html)}
      `,
      threadKey: `discreet-${email}`,
    });
  } catch (e) { console.warn('[discreet-brochure] logging failed:', e?.message || e); }

  return res.status(200).json({ ok: true });
}
