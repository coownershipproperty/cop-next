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

  const { email, locale: rawLocale } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  // Locale handling — validates against SUPPORTED_LOCALES, falls back to default ('en')
  const locale = SUPPORTED_LOCALES.includes(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  // Rate limit: max 3 submissions from same email in 5 minutes
  const { limited } = await checkRateLimit(email, 'newsletter');
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  // CRM: upsert contact + log activity
  let contact = null;
  try {
    contact = await upsertContact({ email, source: 'newsletter', locale });
    if (contact) {
      await logActivity({
        contactId: contact.id,
        type: 'newsletter_signup',
        description: 'Subscribed to newsletter',
        metadata: {},
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
      html: `<h2>New Newsletter Subscriber</h2><p><strong>Email:</strong> ${email}</p>`,
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
