import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { cleanPartnerHubText, isPartnerHubEmail } from '@/lib/partnerHub';
import { sendPartnerAccessCode } from '@/lib/partnerHubAccessCodes';
import { checkRateLimit } from '@/lib/rateLimit';

const GENERIC_MESSAGE = 'If this email has active Partner Hub access, a secure code has been sent.';

function requestIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  return cleanPartnerHubText(Array.isArray(forwarded) ? forwarded[0] : String(forwarded || '').split(',')[0], 80) || 'unknown';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const email = cleanPartnerHubText(req.body?.email, 254).toLowerCase();
  if (!isPartnerHubEmail(email)) return res.status(400).json({ error: 'Enter a valid email address' });

  const { limited } = await checkRateLimit(`${email}:${requestIp(req)}`, 'partner_login_code', 10 * 60 * 1000, 5);
  if (limited) return res.status(429).json({ error: 'Too many sign-in requests. Please try again shortly.' });

  const db = createSupabaseAdminClient();
  const { data: usersPage, error: usersError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (usersError) return res.status(503).json({ error: 'Secure sign-in is temporarily unavailable' });
  const user = (usersPage.users || []).find((candidate) => candidate.email?.toLowerCase() === email);
  if (!user) return res.json({ ok: true, message: GENERIC_MESSAGE });

  const { data: membership } = await db
    .from('partner_hub_memberships')
    .select('partner_id, active')
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership?.active) return res.json({ ok: true, message: GENERIC_MESSAGE });

  const { data: partner } = await db
    .from('partner_hub_partners')
    .select('id, display_name, active')
    .eq('id', membership.partner_id)
    .maybeSingle();
  if (!partner?.active) return res.json({ ok: true, message: GENERIC_MESSAGE });

  try {
    await sendPartnerAccessCode({ db, partner, email, name: user.user_metadata?.name || '' });
    return res.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (error) {
    console.error('[PartnerHubLogin] code delivery failed:', error.message);
    return res.status(502).json({ error: 'The secure code could not be sent. Please try again.' });
  }
}
