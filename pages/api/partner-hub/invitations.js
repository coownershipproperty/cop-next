import { requirePartnerHubAccess } from '@/lib/partnerHubAuth';
import { cleanPartnerHubText, isPartnerHubEmail } from '@/lib/partnerHub';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://co-ownership-property.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const access = await requirePartnerHubAccess(req, res, { adminOnly: true });
  if (!access) return;

  const partnerId = cleanPartnerHubText(req.body?.partnerId, 64);
  const email = cleanPartnerHubText(req.body?.email, 254).toLowerCase();
  const name = cleanPartnerHubText(req.body?.name, 240);
  if (!partnerId || !isPartnerHubEmail(email)) {
    return res.status(400).json({ error: 'Partner and a valid email are required' });
  }

  const [{ data: partner }, { data: existingAdmin }] = await Promise.all([
    access.db.from('partner_hub_partners').select('id, display_name, active').eq('id', partnerId).maybeSingle(),
    access.db.from('crm_admins').select('email').eq('email', email).eq('active', true).maybeSingle(),
  ]);
  if (!partner?.active) return res.status(404).json({ error: 'Active partner not found' });
  if (existingAdmin) return res.status(400).json({ error: 'Use a separate partner identity, not a COP administrator account' });

  const { data: usersPage, error: listError } = await access.db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) return res.status(500).json({ error: 'Could not check existing partner users' });
  let user = usersPage.users.find((candidate) => candidate.email?.toLowerCase() === email) || null;
  let invited = false;

  if (!user) {
    const { data, error } = await access.db.auth.admin.inviteUserByEmail(email, {
      data: { name, invited_to: 'COP Partner Hub' },
      redirectTo: `${SITE_URL}/auth/callback?next=/partner/`,
    });
    if (error || !data.user) {
      return res.status(502).json({ error: error?.message || 'Partner invitation could not be sent' });
    }
    user = data.user;
    invited = true;
  }

  const { data: existingMembership } = await access.db
    .from('partner_hub_memberships')
    .select('id, partner_id, active')
    .eq('user_id', user.id)
    .maybeSingle();
  if (existingMembership) {
    if (existingMembership.partner_id !== partnerId) {
      return res.status(409).json({ error: `This login is already assigned to ${existingMembership.partner_id}` });
    }
    if (existingMembership.active) {
      return res.status(409).json({ error: `This login already has access to ${existingMembership.partner_id}` });
    }
    const { data: restored, error: restoreError } = await access.db
      .from('partner_hub_memberships')
      .update({ active: true, updated_at: new Date().toISOString() })
      .eq('id', existingMembership.id)
      .select('*')
      .single();
    if (restoreError) return res.status(500).json({ error: 'Could not restore the partner login' });
    return res.json({
      ok: true,
      invited: false,
      partner: partner.display_name,
      email,
      member: {
        id: restored.id,
        partnerId: restored.partner_id,
        userId: restored.user_id,
        email,
        name,
        accessLevel: restored.access_level,
        active: restored.active,
        createdAt: restored.created_at,
      },
      message: 'Partner access restored. They can request a new magic link.',
    });
  }

  const { data: membership, error: membershipError } = await access.db.from('partner_hub_memberships').insert({
    partner_id: partnerId,
    user_id: user.id,
    access_level: 'member',
    active: true,
    invited_by: access.user.id,
  }).select('*').single();
  if (membershipError) {
    if (invited) await access.db.auth.admin.deleteUser(user.id).catch(() => {});
    return res.status(500).json({ error: 'Could not assign the partner login' });
  }

  return res.json({
    ok: true,
    invited,
    partner: partner.display_name,
    email,
    member: {
      id: membership.id,
      partnerId: membership.partner_id,
      userId: membership.user_id,
      email,
      name,
      accessLevel: membership.access_level,
      active: membership.active,
      createdAt: membership.created_at,
    },
    message: invited
      ? 'Invitation sent. The recipient will create their own secure session.'
      : 'Existing verified user linked. They can request a Partner Hub magic link.',
  });
}
