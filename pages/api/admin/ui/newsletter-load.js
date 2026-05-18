/**
 * GET /api/admin/ui/newsletter-load?id=<uuid>
 *
 * Returns one campaign + a tiny stats block.
 */
import { requireAdmin } from '@/lib/newsletter/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db } = ctx;

  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'id is required' });

  const { data: campaign, error } = await db
    .from('newsletter_campaigns')
    .select('*')
    .eq('id', id)
    .single();
  if (error || !campaign) return res.status(404).json({ error: 'Campaign not found' });

  // Lightweight stats from newsletter_sends
  const { data: sendRows } = await db
    .from('newsletter_sends')
    .select('status')
    .eq('campaign_id', id);

  const stats = { total: 0, pending: 0, sent: 0, failed: 0 };
  for (const r of sendRows || []) {
    stats.total++;
    if (r.status === 'sent') stats.sent++;
    else if (r.status === 'failed') stats.failed++;
    else stats.pending++;
  }

  return res.json({ campaign, stats });
}
