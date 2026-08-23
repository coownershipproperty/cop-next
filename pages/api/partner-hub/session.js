import { requirePartnerHubAccess } from '@/lib/partnerHubAuth';
import { serialisePartnerHubPartner } from '@/lib/partnerHub';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const access = await requirePartnerHubAccess(req, res);
  if (!access) return;

  let partner = null;
  if (access.role === 'partner') {
    const { data, error } = await access.db
      .from('partner_hub_partners')
      .select('*')
      .eq('id', access.partnerId)
      .eq('active', true)
      .maybeSingle();
    if (error) return res.status(500).json({ error: 'Could not load partner access' });
    if (!data) return res.status(403).json({ error: 'Partner access is inactive' });
    partner = serialisePartnerHubPartner(data);
  }

  return res.json({
    ok: true,
    access: {
      role: access.role,
      email: access.email,
      partnerId: access.partnerId,
      accessLevel: access.accessLevel,
    },
    partner,
  });
}
