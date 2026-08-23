import { requirePartnerHubAccess } from '@/lib/partnerHubAuth';
import { cleanPartnerHubText } from '@/lib/partnerHub';

async function authUsersById(db) {
  const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw new Error(error.message);
  return new Map((data.users || []).map((user) => [user.id, user]));
}

function serialise(row, user) {
  return {
    id: row.id,
    partnerId: row.partner_id,
    userId: row.user_id,
    email: user?.email || 'Unknown auth user',
    name: user?.user_metadata?.name || '',
    accessLevel: row.access_level,
    active: row.active,
    createdAt: row.created_at,
  };
}

export default async function handler(req, res) {
  const access = await requirePartnerHubAccess(req, res, { adminOnly: true });
  if (!access) return;

  if (req.method === 'GET') {
    const { data, error } = await access.db
      .from('partner_hub_memberships')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: 'Could not load partner members' });
    try {
      const users = await authUsersById(access.db);
      return res.json({ members: (data || []).map((row) => serialise(row, users.get(row.user_id))) });
    } catch {
      return res.status(500).json({ error: 'Could not load partner identities' });
    }
  }

  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const id = cleanPartnerHubText(req.body?.id, 80);
  const active = req.body?.active;
  if (!id || typeof active !== 'boolean') return res.status(400).json({ error: 'Member and access state are required' });

  const { data: existing, error: existingError } = await access.db
    .from('partner_hub_memberships')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (existingError) return res.status(500).json({ error: existingError.message });
  if (!existing) return res.status(404).json({ error: 'Partner member not found' });

  if (active) {
    const { data: partner } = await access.db
      .from('partner_hub_partners')
      .select('active')
      .eq('id', existing.partner_id)
      .maybeSingle();
    if (!partner?.active) return res.status(400).json({ error: 'Reactivate the partner before restoring member access' });
  }

  const { data, error } = await access.db
    .from('partner_hub_memberships')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) return res.status(500).json({ error: error.message });
  const users = await authUsersById(access.db);
  return res.json({ ok: true, member: serialise(data, users.get(data.user_id)) });
}
