import nodemailer from 'nodemailer';
import { upsertContact, createLead, createEmailSend, logActivity, trackingPixel } from '@/lib/crm';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, message, property, url, destination, budget } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const smtpUser = process.env.SMTP_USER || 'a373bb001@smtp-brevo.com';
  const fromEmail = process.env.SMTP_FROM || 'info@domosno.com';

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: { user: smtpUser, pass: process.env.SMTP_PASS },
  });

  // ── Parse name ────────────────────────────────────────────────────────────
  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName  = nameParts.slice(1).join(' ') || null;

  // ── CRM: upsert contact + create lead ─────────────────────────────────────
  let contact = null;
  let lead    = null;
  let emailSend = null;

  try {
    contact = await upsertContact({ email, firstName, lastName, phone, source: 'website_enquiry' });

    if (contact) {
      lead = await createLead({
        contactId:     contact.id,
        propertyTitle: property || null,
        message:       message  || null,
        budget:        budget   || null,
      });

      // Create email_send record BEFORE sending so we have the tracking_id
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

  // ── Send team notification ─────────────────────────────────────────────────
  try {
    await transporter.sendMail({
      from:    `"COP Website" <${fromEmail}>`,
      to:      ['dylan@domosno.com', 'info@co-ownership-property.com', 'dylan@co-ownership-property.com'],
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
      replyTo: email,
    });
  } catch (e) {
    console.error('[Mail] team notification failed:', e.message);
  }

  // ── Send auto-reply to visitor (with tracking pixel) ──────────────────────
  try {
    const pixel = emailSend?.tracking_id ? trackingPixel(emailSend.tracking_id) : '';

    await transporter.sendMail({
      from:    `"Co-Ownership Property" <${fromEmail}>`,
      to:      email,
      subject: `We received your enquiry${property ? ` — ${property}` : ''}`,
      html: `
        <p>Hi ${firstName || name},</p>
        <p>Thanks for getting in touch${property ? ` about <strong>${property}</strong>` : ''}. We typically respond within a few hours.</p>
        <p>Best,<br>The Co-Ownership Property Team</p>
        ${pixel}
      `,
      replyTo: fromEmail,
    });

    if (contact && emailSend) {
      await logActivity({
        contactId:   contact.id,
        leadId:      lead?.id || null,
        type:        'email_sent',
        description: `Auto-reply sent to ${email}`,
        metadata:    { email_send_id: emailSend.id, type: 'enquiry_auto' },
      });
    }
  } catch (e) {
    console.error('[Mail] auto-reply failed:', e.message);
  }

  res.status(200).json({ ok: true });
}
