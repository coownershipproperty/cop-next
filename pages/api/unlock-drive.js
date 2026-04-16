import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, propertyTitle, driveUrl } = req.body;
  if (!email || !driveUrl) return res.status(400).json({ error: 'Missing fields' });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER || 'info@co-ownership-property.com',
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    // Send the Drive link to the visitor
    await transporter.sendMail({
      from: '"Co-Ownership Property" <info@co-ownership-property.com>',
      to: email,
      subject: `Floor Plans & More Photos — ${propertyTitle}`,
      html: `
        <p>Hi ${name || 'there'},</p>
        <p>Thanks for your interest in <strong>${propertyTitle}</strong>.</p>
        <p>Here are the additional photos and floor plans you requested:</p>
        <p><a href="${driveUrl}" style="background:#C9A84C;color:#fff;padding:12px 24px;text-decoration:none;display:inline-block;font-family:sans-serif;font-weight:600;border-radius:2px;">View Photos & Floor Plans →</a></p>
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>Best,<br>The Co-Ownership Property Team</p>
      `,
      replyTo: 'info@co-ownership-property.com',
    });

    // Notify COP team
    await transporter.sendMail({
      from: '"COP Website" <info@co-ownership-property.com>',
      to: ['info@co-ownership-property.com', 'dylan@co-ownership-property.com'],
      subject: `Floor Plan Request — ${propertyTitle}`,
      html: `
        <h2>Floor Plan / Photo Request</h2>
        <p><strong>Property:</strong> ${propertyTitle}</p>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>Drive link sent: <a href="${driveUrl}">${driveUrl}</a></p>
      `,
      replyTo: email,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send' });
  }
}
