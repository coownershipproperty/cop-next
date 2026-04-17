import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, phone, message, property, destination, budget } = req.body;

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
    await transporter.sendMail({
      from: '"COP Website" <info@co-ownership-property.com>',
      to: ['info@co-ownership-property.com', 'dylan@co-ownership-property.com'],
      subject: `New Enquiry${property ? ` — ${property}` : ''} from ${name}`,
      html: `
        <h2>New Enquiry</h2>
        ${property ? `<p><strong>Property:</strong> ${property}</p>` : ''}
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        ${destination ? `<p><strong>Destinations:</strong> ${destination}</p>` : ''}
        ${budget ? `<p><strong>Budget:</strong> ${budget}</p>` : ''}
        <p><strong>Message:</strong> ${message || 'No message'}</p>
      `,
      replyTo: email,
    });

    // Auto-reply to visitor
    await transporter.sendMail({
      from: '"Co-Ownership Property" <info@co-ownership-property.com>',
      to: email,
      subject: 'We received your enquiry',
      html: `
        <p>Hi ${name},</p>
        <p>Thanks for getting in touch. We typically respond within a few hours.</p>
        <p>Best,<br>The Co-Ownership Property Team</p>
      `,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send' });
  }
}
