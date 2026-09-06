/**
 * POST /api/list-with-cop
 *
 * Applications from the public "List with COP" page. Two kinds:
 *   'resale'  — a private owner wants to sell their co-ownership share
 *   'partner' — a (usually smaller) operator/developer wants their homes on COP
 *
 * Nothing is published automatically — every application lands in
 * `listing_applications` with status 'new' for review in /admin/applications.
 * Dylan's vetting stays the quality bar; this just makes the front door real.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { upsertContact, logActivity } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendHtml, sendTeamNotification } from '@/lib/resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const {
    kind, name, email, phone, company, website, country,
    propertyLocation, propertyTitle, shareFraction, askingPrice,
    portfolioSize, message,
  } = req.body || {};

  const cleanEmail = String(email || '').toLowerCase().trim();
  if (!['resale', 'partner'].includes(kind)) return res.status(400).json({ error: 'Bad request' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Valid email required' });
  }

  const { limited } = await checkRateLimit(cleanEmail, 'list-with-cop', 10 * 60 * 1000, 4);
  if (limited) return res.status(429).json({ error: 'Too many requests' });

  const db = createSupabaseAdminClient();
  const clean = (v, max = 500) => (v ? String(v).slice(0, max).trim() : null);

  const { error } = await db.from('listing_applications').insert({
    kind,
    name: clean(name, 120),
    email: cleanEmail,
    phone: clean(phone, 40),
    company: clean(company, 160),
    website: clean(website, 300),
    country: clean(country, 80),
    property_location: clean(propertyLocation, 200),
    property_title: clean(propertyTitle, 200),
    share_fraction: clean(shareFraction, 20),
    asking_price: clean(askingPrice, 40),
    portfolio_size: clean(portfolioSize, 40),
    message: clean(message, 3000),
  });
  if (error) {
    console.error('[list-with-cop] insert failed:', error.message);
    return res.status(500).json({ error: 'Could not submit' });
  }

  // CRM: applicants are contacts too (sellers often become buyers).
  let contact = null;
  try {
    const parts = String(name || '').trim().split(' ');
    contact = await upsertContact({
      email: cleanEmail,
      firstName: parts[0] || null,
      lastName: parts.slice(1).join(' ') || null,
      phone: phone || null,
      source: kind === 'resale' ? 'resale_application' : 'partner_application',
    });
    if (contact) {
      await logActivity({
        contactId: contact.id,
        type: 'listing_application',
        description: kind === 'resale'
          ? `Resale application: ${propertyTitle || propertyLocation || 'their share'}`
          : `Partner application: ${company || 'unnamed company'}${portfolioSize ? ` (${portfolioSize} homes)` : ''}`,
        metadata: { kind, company, website, propertyLocation, askingPrice },
      });
    }
  } catch (e) {
    console.error('[list-with-cop] CRM write failed:', e.message);
  }

  // Team notification — these deserve a same-day look.
  try {
    const rows = Object.entries({
      Kind: kind, Name: name, Email: cleanEmail, Phone: phone, Company: company,
      Website: website, Country: country, Location: propertyLocation,
      Property: propertyTitle, Share: shareFraction, 'Asking price': askingPrice,
      Portfolio: portfolioSize, Message: message,
    })
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="padding:8px 14px;background:#F5F2EC;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:#6B8A9E;width:120px">${k}</td><td style="padding:8px 14px;background:#FAF8F5;border-bottom:1px solid #E8E3DC;font-family:Arial,sans-serif;font-size:13px;color:#1E3448">${String(v).slice(0, 500)}</td></tr>`)
      .join('');
    await sendTeamNotification({
      subject: `${kind === 'resale' ? 'Resale' : 'Partner'} application — ${name || company || cleanEmail}`,
      html: `<h2 style="font-family:Georgia,serif;color:#1E3448;margin:0 0 18px">New ${kind} application</h2><table style="border-collapse:collapse;width:100%;max-width:560px">${rows}</table><p style="font-family:Arial,sans-serif;font-size:13px;margin:16px 0 0"><a href="https://co-ownership-property.com/admin/applications" style="color:#C9A84C">Review in admin →</a></p>`,
    });
  } catch (e) { /* non-fatal */ }

  // Applicant acknowledgement
  try {
    await sendHtml({
      to: cleanEmail,
      log: { trigger: 'listing_application', type: 'application_ack', contactId: contact?.id || null, templateProps: { kind }, notes: `${kind} application acknowledgement` },
      subject: kind === 'resale'
        ? 'We received your listing — Co-Ownership Properties'
        : 'We received your partnership application — Co-Ownership Properties',
      html: `
      <div style="background:#F7F4EE;padding:40px 16px;font-family:Georgia,'Times New Roman',serif;color:#1E3448">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #E8E3DC">
          <div style="background:#1E3448;padding:26px 32px;text-align:center">
            <span style="color:#F4EFE4;font-size:20px;letter-spacing:0.35em">C O P</span><br/>
            <span style="color:#C9A84C;font-size:10px;letter-spacing:0.2em;text-transform:uppercase">Co-Ownership Properties</span>
          </div>
          <div style="padding:36px 32px 30px">
            <div style="width:36px;border-top:2px solid #C9A84C;margin:0 0 18px"></div>
            <p style="font-size:15px;line-height:1.7;margin:0 0 16px">${name ? `${String(name).split(' ')[0]}, thank` : 'Thank'} you — your ${kind === 'resale' ? 'listing application' : 'partnership application'} has arrived safely.</p>
            <p style="font-size:15px;line-height:1.7;margin:0 0 16px">We review every application personally. Because we curate rather than aggregate, this usually takes a day or two — you'll hear from us either way, and we may come back with a question or two first.</p>
            <p style="font-size:15px;line-height:1.7;margin:0">— The Co-Ownership Property Team</p>
          </div>
        </div>
      </div>`,
    });
  } catch (e) {
    console.error('[list-with-cop] ack send failed:', e.message);
  }

  return res.status(200).json({ ok: true });
}
