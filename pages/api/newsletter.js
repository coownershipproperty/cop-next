import { checkRateLimit } from '@/lib/rateLimit';
import { isHoneypotFilled } from '@/lib/honeypot';
import { upsertContact, logActivity } from '@/lib/crm';
import { queueEmail, sendTeamNotification, addToAudience } from '@/lib/resend';
import Welcome1 from '@/emails/welcome-1';
import { t, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n';
import { unsubUrl } from '@/lib/unsub';
import * as React from 'react';

const base = 'https://co-ownership-property.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Honeypot — bots fill hidden fields. Silently accept (no email, no CRM) so
  // the bot sees a normal success response and does not retry or adapt.
  if (isHoneypotFilled(req.body)) return res.status(200).json({ ok: true });

  // `phone` is optional — the signup form asks but never requires. A subscriber
  // who leaves a number is a lead a partner will accept; one who doesn't is
  // still a perfectly good subscriber, so nothing below depends on it.
  const { email, phone, source: rawSource, locale: rawLocale } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  // Every surface that subscribes someone to the list lands here, and each one
  // needs to stay separable in reporting — `popup_cop` in particular is a
  // long-running historical series (181 contacts, 28.7% phone capture) that the
  // rebuilt exit popup rejoins rather than restarts. Allowlisted rather than
  // free-text so a spoofed body cannot invent a channel and poison the numbers.
  const ALLOWED_SOURCES = ['newsletter', 'popup_cop'];
  const source = ALLOWED_SOURCES.includes(rawSource) ? rawSource : 'newsletter';

  // Locale handling — validates against SUPPORTED_LOCALES, falls back to default ('en')
  const locale = SUPPORTED_LOCALES.includes(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  // Rate limit: max 3 submissions from same email in 5 minutes
  const { limited } = await checkRateLimit(email, 'newsletter');
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  // CRM: upsert contact + log activity
  let contact = null;
  try {
    // upsertContact ignores a blank or implausibly short value rather than
    // overwriting an existing number with null, so passing it is always safe.
    contact = await upsertContact({ email, phone: phone || null, source, locale });
    if (contact) {
      await logActivity({
        contactId: contact.id,
        type: 'newsletter_signup',
        description: source === 'popup_cop'
          ? 'Subscribed to newsletter via site popup'
          : 'Subscribed to newsletter',
        metadata: { phone: phone || null, source },
      });
    }
  } catch (e) {
    console.error('[CRM] newsletter write failed:', e.message);
  }

  // Add to Resend Audience
  try {
    await addToAudience({ email });
  } catch (e) {
    console.error('[Resend] addToAudience failed:', e.message);
  }

  // Team notification (always immediate)
  try {
    await sendTeamNotification({
      subject: `New Newsletter Subscriber — ${email}`,
      html: `<h2>New Newsletter Subscriber</h2><p><strong>Email:</strong> ${email}</p>`
        + `<p><strong>Phone:</strong> ${phone ? phone : '<em>not provided (optional field)</em>'}</p>`
        + `<p><strong>Source:</strong> ${source === 'popup_cop' ? 'Site popup' : 'Newsletter signup form'}</p>`,
    });
  } catch (e) {
    console.error('[Mail] team notification failed:', e.message);
  }

  // Tokenised — the plain `?email=` form is rejected by /api/unsubscribe and
  // dead-ends on /unsubscribe. See lib/unsub.js.
  const unsubscribeUrl = unsubUrl(email);
  const contactId = contact?.id || null;

  // ── Welcome email — sent immediately ───────────────────────────────────────
  // The day 3 / day 7 follow-ups were retired; they will return as journeys
  // once the email engine is in place (see docs/email-automation-blueprint.md).
  try {
    await queueEmail({
      autoSend:     true,
      to:           email,
      subject:      t('emails.welcome_1.subject', locale),
      template:     React.createElement(Welcome1, { unsubscribeUrl, locale }),
      templateName:  'welcome-1',
      templateProps: { email, locale },
      trigger:       'newsletter_signup',
      notes:         'Welcome email — sent on signup',
      contactId,
      sequenceType: 'welcome',
    });
  } catch (e) {
    console.error('[Mail] welcome-1 failed:', e.message);
  }

  res.status(200).json({ ok: true });
}
