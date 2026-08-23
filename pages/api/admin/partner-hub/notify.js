import { requirePartnerHubAccess } from '@/lib/partnerHubAuth';

// Retained temporarily so an old, cached admin bundle cannot send a partner
// email to an address supplied by the browser. The production Partner Hub uses
// /api/partner-hub/leads and /api/partner-hub/partners, where recipients are
// loaded from the server-side partner directory.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const access = await requirePartnerHubAccess(req, res, { adminOnly: true });
  if (!access) return;
  return res.status(410).json({ error: 'This legacy notification endpoint has been retired.' });
}
