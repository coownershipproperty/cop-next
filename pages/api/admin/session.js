import { requirePartnerHubAccess } from '@/lib/partnerHubAuth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const access = await requirePartnerHubAccess(req, res, { adminOnly: true });
  if (!access) return;
  return res.json({ ok: true, email: access.email, role: 'admin' });
}
