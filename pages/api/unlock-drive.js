import nodemailer from 'nodemailer';
import { upsertContact, createEmailSend, logActivity, trackingPixel } from '@/lib/crm';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, propertyTitle, driveUrl, propertyUrl } = req.body;
  if (!email || !driveUrl) return res.status(400).json({ error: 'Missing fields' });

  const smtpUser = process.env.SMTP_USER || 'a373bb001@smtp-brevo.com';
  const fromEmail = process.env.SMTP_FROM || 'info@domosno.com';

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: { user: smtpUser, pass: process.env.SMTP_PASS },
  });

  // ── CRM: upsert contact + log email send ──────────────────────────────────
  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName  = nameParts.slice(1).join(' ') || null;

  let contact   = null;
  let emailSend = null;

  try {
    contact = await upsertContact({ email, firstName, lastName, source: 'floor_plan' });

    if (contact) {
      emailSend = await createEmailSend({
        contactId:     contact.id,
        type:          'floor_plan',
        subject:       `Floor Plans & More Photos — ${propertyTitle}`,
        toEmail:       email,
        propertyTitle: propertyTitle || null,
        propertyUrl:   propertyUrl   || null,
      });

      await logActivity({
        contactId:   contact.id,
        type:        'floor_plan_requested',
        description: `Floor plan requested for ${propertyTitle}`,
        metadata:    { propertyTitle, propertyUrl },
      });
    }
  } catch (e) {
    console.error('[CRM] unlock-drive write failed:', e.message);
  }

  try {
    const pixel = emailSend?.tracking_id ? trackingPixel(emailSend.tracking_id) : '';

    // Send the Drive link to the visitor (with tracking pixel)
    await transporter.sendMail({
      from:    `"Co-Ownership Property" <${fromEmail}>`,
      to:      email,
      subject: `Floor Plans & More Photos — ${propertyTitle}`,
      html: `
        <p>Hi ${name || 'there'},</p>
        <p>Thanks for your interest in <strong>${propertyTitle}</strong>.</p>
        <p>Here are the additional photos and floor plans you requested:</p>
        <p><a href="${driveUrl}" style="background:#C9A84C;color:#fff;padding:12px 24px;text-decoration:none;display:inline-block;font-family:sans-serif;font-weight:600;border-radius:2px;">View Photos & Floor Plans →</a></p>
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>Best,<br>The Co-Ownership Property Team</p>
        ${pixel}
      `,
      replyTo: fromEmail,
    });

    if (contact && emailSend) {
      await logActivity({
        contactId:   contact.id,
        type:        'email_sent',
        description: `Floor plan email sent to ${email}`,
        metadata:    { email_send_id: emailSend.id },
      });
    }

    // Notify COP team
    await transporter.sendMail({
      from:    `"COP Website" <${fromEmail}>`,
      to:      ['dylan@domosno.com', 'info@co-ownership-property.com', 'dylan@co-ownership-property.com'],
      subject: `Floor Plan Request — ${name || email}`,
      html: `
        <h2>Floor Plan / Photo Request</h2>
        <p><strong>Property:</strong> ${propertyTitle}${propertyUrl ? ` — <a href="${propertyUrl}">${propertyUrl}</a>` : ''}</p>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>Drive link sent: <a href="${driveUrl}">${driveUrl}</a></p>
      `,
      replyTo: email,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send', detail: err.message });
  }
}
