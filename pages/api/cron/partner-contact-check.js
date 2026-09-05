/**
 * GET/POST /api/cron/partner-contact-check
 *
 * The day after someone is registered with a partner, ask whether the partner
 * actually got in touch.
 *
 * Why this exists: 65 of COP's 131 partner referrals have never moved past
 * their first stage, and nobody found out until someone went looking. The
 * two-week check-in catches a conversation that started and went cold. This
 * catches the worse case — one that never started at all — while it is still
 * a day old and a chase still looks attentive rather than apologetic.
 *
 * It is deliberately answerable in one word, and every "no" is a signal for
 * Dylan, not a task for the lead.
 *
 * Suppression, in order — any one of these stands the email down:
 *   · the address is suppressed or the contact is tagged unsubscribed
 *   · this check has already been sent for this referral
 *   · the referral has moved on (anything other than sent_to_partner)
 *   · ANY activity on the contact since the handover — a reply, an enquiry,
 *     a gallery unlock. If they are already talking to someone, asking
 *     "did they call?" reads as not paying attention.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { sendHtml } from '@/lib/resend';
import { buildEmail } from '@/lib/email/templateStore';
import { resolveUnsubPlaceholder, listUnsubHeaders } from '@/lib/unsub';
import { isSuppressed } from '@/lib/suppressions';

export const maxDuration = 60;

const MIN_AGE_H = 20;   // give the partner a full working day first
const MAX_AGE_H = 72;   // never send a stale one — after this the 2-week check owns it
const MAX_SENDS = 100;
const SITE = 'https://co-ownership-property.com';

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const secret = process.env.CRON_SECRET;
  const auth = req.headers['authorization'] || '';
  const isCron = (secret && auth === `Bearer ${secret}`) || req.headers['x-vercel-cron'] === '1';
  if (!isCron) return res.status(401).json({ error: 'Unauthorised' });

  const dryRun = String(req.query.dry || '') === '1';
  const db = createSupabaseAdminClient();
  const now = Date.now();

  const from = new Date(now - MAX_AGE_H * 3600000).toISOString();
  const to   = new Date(now - MIN_AGE_H * 3600000).toISOString();

  const { data: refs, error } = await db
    .from('partner_referrals')
    .select('id, contact_id, partner, status, payload, sent_at, created_at')
    .eq('status', 'sent_to_partner')
    .not('contact_id', 'is', null)
    .gte('sent_at', from)
    .lte('sent_at', to)
    .limit(300);

  if (error) return res.status(500).json({ error: 'Could not load referrals' });

  const results = [];
  let sent = 0, skipped = 0;

  for (const ref of refs || []) {
    if (sent >= MAX_SENDS) break;
    try {
      // Already checked?
      const { data: already } = await db.from('email_queue')
        .select('id').eq('trigger', 'partner_contact_check')
        .eq('contact_id', ref.contact_id).limit(1);
      if ((already || []).length) { skipped++; continue; }

      const { data: contact } = await db.from('contacts')
        .select('id, email, first_name, tags, locale').eq('id', ref.contact_id).maybeSingle();
      if (!contact || !contact.email) { skipped++; continue; }

      const taggedOut = Array.isArray(contact.tags) && contact.tags.includes('unsubscribed');
      if (taggedOut || await isSuppressed(db, contact.email)) { skipped++; continue; }

      // Anything at all happened since the handover? Then stand down.
      const since = ref.sent_at || ref.created_at;
      const { data: activity } = await db.from('activities')
        .select('id').eq('contact_id', ref.contact_id).gt('created_at', since).limit(1);
      if ((activity || []).length) {
        results.push({ email: contact.email, decision: 'skipped_active' });
        skipped++; continue;
      }

      const propertyTitle = (ref.payload && (ref.payload.property || ref.payload.propertyTitle)) || null;
      const propertyUrl   = (ref.payload && (ref.payload.url || ref.payload.propertyUrl)) || null;
      const propertyLink  = propertyTitle
        ? (propertyUrl
            ? `<a href="${esc(propertyUrl)}" style="color:#1E3448;text-decoration:underline;">${esc(propertyTitle)}</a>`
            : `<strong>${esc(propertyTitle)}</strong>`)
        : 'the home you were interested in';

      const locale = contact.locale || 'en';
      const { subject, html, text } = await buildEmail(
        'partner_contact_check', locale,
        {
          firstName: contact.first_name || '',
          partnerName: ref.partner || 'the team',
          propertyLink,
          locale,
        },
        () => ({
          subject: `Did ${ref.partner || 'the team'} get in touch?`,
          html: `<p>Hi ${esc(contact.first_name || 'there')},</p><p>I passed your details to ${esc(ref.partner || 'the team')} yesterday — did they manage to reach you?</p><p>If you haven't heard anything, tell me and I'll chase them today.</p><p>Dylan</p>`,
        })
      );

      if (dryRun) { results.push({ email: contact.email, decision: 'would_send', subject }); continue; }

      await sendHtml({
        to: contact.email, subject,
        from: 'Dylan Olsson <dylan@co-ownership-property.com>',
        replyTo: 'dylan@co-ownership-property.com',
        html:    resolveUnsubPlaceholder(html, contact.email),
        text:    text ? resolveUnsubPlaceholder(text, contact.email) : undefined,
        headers: listUnsubHeaders(contact.email),
      });

      await db.from('email_queue').insert({
        to_email: contact.email,
        to_name:  contact.first_name || null,
        subject,
        html,
        trigger: 'partner_contact_check',
        contact_id: contact.id,
        status: 'sent',
        sent_at: new Date().toISOString(),
        notes: `Day-after partner contact check — ${ref.partner || 'partner'}`,
      });

      sent++;
      results.push({ email: contact.email, decision: 'sent', partner: ref.partner });
    } catch (e) {
      console.error('[partner-contact-check] failed for referral', ref.id, e.message);
    }
  }

  console.log(`[partner-contact-check] ${refs?.length || 0} candidates, sent ${sent}, skipped ${skipped}`);
  return res.status(200).json({ ok: true, candidates: refs?.length || 0, sent, skipped, dryRun, results });
}
