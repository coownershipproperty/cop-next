import { requirePartnerHubAccess } from '@/lib/partnerHubAuth';
import { cleanPartnerHubText, isPartnerHubEmail } from '@/lib/partnerHub';

function validTemporaryPassword(value) {
  return typeof value === 'string' && value.length >= 10 && value.length <= 72;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const access = await requirePartnerHubAccess(req, res, { adminOnly: true });
  if (!access) return;

  if (req.body?.action === 'reset_password') {
    const memberId = cleanPartnerHubText(req.body?.memberId, 80);
    const password = String(req.body?.password || '');
    if (!validTemporaryPassword(password)) {
      return res.status(400).json({ error: 'Use a temporary password between 10 and 72 characters' });
    }
    const { data: membership, error: membershipError } = await access.db
      .from('partner_hub_memberships')
      .select('*')
      .eq('id', memberId)
      .maybeSingle();
    if (membershipError) return res.status(500).json({ error: membershipError.message });
    if (!membership?.active) return res.status(400).json({ error: 'Restore this login before resetting its password' });

    const { data: userData, error: userError } = await access.db.auth.admin.getUserById(membership.user_id);
    if (userError || !userData.user?.email) return res.status(404).json({ error: 'Partner identity not found' });
    const { error: updateError } = await access.db.auth.admin.updateUserById(membership.user_id, { password });
    if (updateError) return res.status(502).json({ error: 'The temporary password could not be set' });
    return res.json({ ok: true, message: `Temporary password updated for ${userData.user.email}.` });
  }

  const partnerId = cleanPartnerHubText(req.body?.partnerId, 64);
  const email = cleanPartnerHubText(req.body?.email, 254).toLowerCase();
  const name = cleanPartnerHubText(req.body?.name, 240);
  const password = String(req.body?.password || '');
  if (!partnerId || !isPartnerHubEmail(email) || !validTemporaryPassword(password)) {
    return res.status(400).json({ error: 'Partner, valid email and a 10–72 character temporary password are required' });
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
  let createdUser = false;

  if (!user) {
    const { data, error } = await access.db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, invited_to: 'COP Partner Hub' },
    });
    if (error || !data.user) {
      return res.status(502).json({ error: error?.message || 'Partner identity could not be created' });
    }
    user = data.user;
    createdUser = true;
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
    const { error: passwordError } = await access.db.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { ...user.user_metadata, name, invited_to: 'COP Partner Hub' },
    });
    if (passwordError) return res.status(502).json({ error: 'Could not set the temporary password' });
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
      message: 'Partner access restored. Reset the password if the person no longer knows it.',
    });
  }

  if (!createdUser) {
    const { error: passwordError } = await access.db.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
      user_metadata: { ...user.user_metadata, name, invited_to: 'COP Partner Hub' },
    });
    if (passwordError) return res.status(502).json({ error: 'Could not set the temporary password' });
  }

  const { data: membership, error: membershipError } = await access.db.from('partner_hub_memberships').insert({
    partner_id: partnerId,
    user_id: user.id,
    access_level: 'member',
    active: true,
    invited_by: access.user.id,
  }).select('*').single();
  if (membershipError) {
    if (createdUser) await access.db.auth.admin.deleteUser(user.id).catch(() => {});
    return res.status(500).json({ error: 'Could not assign the partner login' });
  }

  return res.json({
    ok: true,
    invited: true,
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
    message: 'Partner access created. Share the email and temporary password through a secure channel.',
  });
}
