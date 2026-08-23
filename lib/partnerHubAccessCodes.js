import { cleanPartnerHubText, isPartnerHubEmail } from '@/lib/partnerHub';
import { sendHtml } from '@/lib/resend';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://co-ownership-property.com';

function escapeHtml(value) {
  return cleanPartnerHubText(value, 1000)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function sendPartnerAccessCode({ db, partner, email, name }) {
  if (!partner?.active || !isPartnerHubEmail(email)) {
    throw new Error('An active partner and valid login email are required');
  }

  const { data, error } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      data: { name: cleanPartnerHubText(name, 240), invited_to: 'COP Partner Hub' },
      redirectTo: `${SITE_URL}/partner/`,
    },
  });
  const code = data?.properties?.email_otp;
  if (error || !code) {
    throw new Error(error?.message || 'Could not generate the secure sign-in code');
  }

  const delivery = await sendHtml({
    to: email,
    subject: `${partner.display_name} Partner Hub sign-in code`,
    idempotencyKey: `partner-login-${data.user.id}-${data.properties.hashed_token.slice(0, 24)}`,
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#183247;max-width:620px;margin:0 auto;padding:28px;">
        <p style="margin:0 0 8px;color:#2c9d7b;font-size:12px;font-weight:700;letter-spacing:.08em;">PRIVATE PARTNER ACCESS</p>
        <h2 style="margin:0 0 12px;font-size:24px;">Your ${escapeHtml(partner.display_name)} sign-in code</h2>
        <p style="margin:0 0 22px;">Use this one-time code to open the partner workspace assigned to <strong>${escapeHtml(email)}</strong>.</p>
        <p style="margin:0 0 22px;padding:18px;border:1px solid #dce5e9;border-radius:10px;background:#f7faf9;text-align:center;font-size:30px;font-weight:800;letter-spacing:.24em;color:#0d2a40;">${escapeHtml(code)}</p>
        <p style="margin:0 0 24px;color:#657785;">The code expires shortly and can only be used once. Do not forward it.</p>
        <p style="margin:0 0 26px;"><a href="${SITE_URL}/partner/login/" style="display:inline-block;background:#0d2a40;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">Enter secure sign-in code</a></p>
        <p style="margin-top:24px;padding-top:16px;border-top:1px solid #e4e9ec;color:#758491;font-size:12px;">Contact details remain inside the secure COP Partner Hub.</p>
      </div>
    `,
  });

  return { status: 'sent', recipient: email, id: delivery?.id || null };
}
