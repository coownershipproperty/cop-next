/**
 * GET /api/admin/ui/newsletter-list
 *
 * Returns every newsletter campaign ordered by created_at desc.
 * Optional ?status=draft|scheduled|sent filters by status.
 */
import { requireAdmin } from '@/lib/newsletter/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db } = ctx;

  const { status } = req.query;
  let q = db
    .from('newsletter_campaigns')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status && ['draft', 'scheduled', 'sending', 'sent'].includes(status)) {
    q = q.eq('status', status);
  }
  const { data, error } = await q;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ campaigns: data || [] });
}
