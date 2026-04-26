import { createClient } from '@supabase/supabase-js';
import { upsertContact, createLead, createEmailSend, logActivity, trackingPixel, incrementScore } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { queueEmail, sendTeamNotification } from '@/lib/resend';
import EnquiryAutoreply from '@/emails/enquiry-autoreply';
import * as React from 'react';

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, message, property, url, destination, budget } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  // Rate limit: max 3 enquiries from same email in 5 minutes
  const { limited } = await checkRateLimit(email, 'enquiry');
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  // ── Parse name ──────────────────────────────────────────────────────────────
  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName  = nameParts.slice(1).join(' ') || null;

  // ── CRM: upsert contact + create lead + score ───────────────────────────────
  let contact   = null;
  let lead      = null;
  let emailSend = null;

  try {
    contact = await upsertContact({ email, firstName, lastName, phone, source: 'website_enquiry' });

    if (contact) {
      // +20 points for submitting an enquiry
      await incrementScore(contact.id, 20);

      lead = await createLead({
        contactId:     contact.id,
        propertyTitle: property || null,
        message:       message  || null,
        budget:        budget   || null,
      });

      const subject = `We received your enquiry${property ? ` — ${property}` : ''}`;
      emailSend = await createEmailSend({
        contactId:     contact.id,
        leadId:        lead?.id || null,
        type:          'enquiry_auto',
        subject,
        toEmail:       email,
        propertyTitle: property || null,
        propertyUrl:   url     || null,
      });

      await logActivity({
        contactId:   contact.id,
        leadId:      lead?.id || null,
        type:        'enquiry_submitted',
        description: `Enquiry submitted${property ? ` for ${property}` : ''}`,
        metadata:    { property, url, destination, budget, message },
      });
    }
  } catch (e) {
    console.error('[CRM] enquiry CRM write failed:', e.message);
  }

  // ── Look up property image from DB (authoritative — don't rely on frontend) ──
  let propertyImg = null;
  if (url) {
    try {
      const slug = url.replace(/https?:\/\/[^/]+\/property\//, '').replace(/\/$/, '') || null;
      if (slug) {
        const db = getDb();
        const { data: prop } = await db
          .from('properties')
          .select('img')
          .eq('slug', slug)
          .single();
        propertyImg = prop?.img || null;
      }
    } catch (e) {
      console.error('[enquiry] property img lookup failed:', e.message);
    }
  }

  // ── Send team notification (always immediate — internal only) ───────────────
  try {
    await sendTeamNotification({
      subject: `New Enquiry${property ? ` — ${property}` : ''} from ${name}`,
      html: `
        <h2>New Enquiry</h2>
        ${property ? `<p><strong>Property:</strong> ${property}${url ? ` — <a href="${url}">${url}</a>` : ''}</p>` : ''}
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        ${destination ? `<p><strong>Destinations:</strong> ${destination}</p>` : ''}
        ${budget ? `<p><strong>Budget:</strong> ${budget}</p>` : ''}
        <p><strong>Message:</strong> ${message || 'No message'}</p>
      `,
    });
  } catch (e) {
    console.error('[Mail] team notification failed:', e.message);
  }

  // ── Queue auto-reply to lead ────────────────────────────────────────────────
  try {
    const pixel = emailSend?.tracking_id ? trackingPixel(emailSend.tracking_id) : '';

    await queueEmail({
      to:            email,
      toName:        name || null,
      subject:       `We received your enquiry${property ? ` — ${property}` : ''}`,
      template:      React.createElement(EnquiryAutoreply, {
        firstName:         firstName    || name || undefined,
        propertyTitle:     property     || undefined,
        propertyImg:       propertyImg  || undefined,
        propertyUrl:       url          || undefined,
        trackingPixelHtml: pixel        || undefined,
      }),
      templateName:  'enquiry-autoreply',
      templateProps: { firstName, propertyTitle: property, propertyUrl: url },
      trigger:       'enquiry_submitted',
      notes:         `Auto-reply for enquiry${property ? ` about ${property}` : ''}`,
      contactId:     contact?.id || null,
      leadId:        lead?.id    || null,
    });

    if (contact && emailSend) {
      await logActivity({
        contactId:   contact.id,
        leadId:      lead?.id || null,
        type:        'email_queued',
        description: `Auto-reply queued for ${email}`,
        metadata:    { email_send_id: emailSend.id, type: 'enquiry_auto' },
      });
    }
  } catch (e) {
    console.error('[Mail] auto-reply queue failed:', e.message);
  }

  res.status(200).json({ ok: true });
}
