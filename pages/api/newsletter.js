import { checkRateLimit } from '@/lib/rateLimit';
import { upsertContact, logActivity } from '@/lib/crm';
import { queueEmail, sendTeamNotification, addToAudience } from '@/lib/resend';
import Welcome1 from '@/emails/welcome-1';
import Welcome2 from '@/emails/welcome-2';
import Welcome3 from '@/emails/welcome-3';
import { t, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n';
import * as React from 'react';

const base = 'https://co-ownership-property.com';

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

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

  const unsubscribeUrl = `${base}/unsubscribe/?email=${encodeURIComponent(email)}`;
  const contactId = contact?.id || null;

  // ── Welcome sequence ────────────────────────────────────────────────────────

  // Day 0 — send immediately
  try {
    await queueEmail({
      autoSend:     true,
      to:           email,
      subject:      t('emails.welcome_1.subject', locale),
      template:     React.createElement(Welcome1, { unsubscribeUrl, locale }),
      templateName:  'welcome-1',
      templateProps: { email, locale },
      trigger:       'newsletter_signup',
      notes:         'Welcome sequence — Day 0',
      contactId,
      sequenceType: 'welcome',
    });
  } catch (e) {
    console.error('[Mail] welcome-1 failed:', e.message);
  }

  // Day 3 — scheduled, pending approval
  try {
    await queueEmail({
      to:           email,
      subject:      t('emails.welcome_2.subject', locale),
      template:     React.createElement(Welcome2, { unsubscribeUrl, locale }),
      templateName:  'welcome-2',
      templateProps: { email, locale },
      trigger:       'newsletter_signup',
      notes:         'Welcome sequence — Day 3',
      contactId,
      sendAfter:    daysFromNow(3),
      sequenceType: 'welcome',
    });
  } catch (e) {
    console.error('[Mail] welcome-2 failed:', e.message);
  }

  // Day 7 — scheduled, pending approval
  try {
    await queueEmail({
      to:           email,
      subject:      t('emails.welcome_3.subject', locale),
      template:     React.createElement(Welcome3, { unsubscribeUrl, locale }),
      templateName:  'welcome-3',
      templateProps: { email, locale },
      trigger:       'newsletter_signup',
      notes:         'Welcome sequence — Day 7',
      contactId,
      sendAfter:    daysFromNow(7),
      sequenceType: 'welcome',
    });
  } catch (e) {
    console.error('[Mail] welcome-3 failed:', e.message);
  }

  res.status(200).json({ ok: true });
}
