import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const smtpUser = process.env.SMTP_USER || 'david@domosno.com';

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    auth: {
      user: smtpUser,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    // Notify the team
    await transporter.sendMail({
      from: `"COP Website" <${smtpUser}>`,
      to: ['info@co-ownership-property.com', 'dylan@co-ownership-property.com'],
      subject: `New Newsletter Subscriber — ${email}`,
      html: `
        <h2>New Newsletter Subscriber</h2>
        <p><strong>Email:</strong> ${email}</p>
      `,
    });

    // Auto-reply to subscriber
    await transporter.sendMail({
      from: `"Co-Ownership Property" <${smtpUser}>`,
      to: email,
      subject: 'Welcome — you\'re on the list',
      html: `
        <p>Hi there,</p>
        <p>Thanks for joining our newsletter. We'll keep you updated with exclusive listings and destination insights.</p>
        <p>In the meantime, browse our current properties at <a href="https://co-ownership-property.com/our-homes/">co-ownership-property.com</a>.</p>
        <p>Best,<br>The Co-Ownership Property Team</p>
      `,
      replyTo: smtpUser,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send', detail: err.message, code: err.code });
  }
}
