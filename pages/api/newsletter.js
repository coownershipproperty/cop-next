import { checkRateLimit } from '@/lib/rateLimit';
import { upsertContact, logActivity } from '@/lib/crm';
import { queueEmail, sendTeamNotification, addToAudience } from '@/lib/resend';
import Welcome1 from '@/emails/welcome-1';
import * as React from 'react';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  // Rate limit: max 3 submissions from same email in 5 minutes
  const { limited } = await checkRateLimit(email, 'newsletter');
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  // CRM: upsert contact + log activity
  let contact = null;
  try {
    contact = await upsertContact({ email, source: 'newsletter' });
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

  // Queue welcome email (Day 0)
  try {
    await queueEmail({
      autoSend:     true,
      to:           email,
      subject:      "Welcome — you're on the list",
      template:     React.createElement(Welcome1, {
        unsubscribeUrl: `https://co-ownership-property.com/unsubscribe/?email=${encodeURIComponent(email)}`,
      }),
      templateName:  'welcome-1',
      templateProps: { email },
      trigger:       'newsletter_signup',
      notes:         `Welcome email (Day 0) for new subscriber ${email}`,
      contactId:     contact?.id || null,
    });
  } catch (e) {
    console.error('[Mail] welcome email queue failed:', e.message);
  }

  res.status(200).json({ ok: true });
}
