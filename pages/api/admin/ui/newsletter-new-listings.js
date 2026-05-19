/**
 * GET /api/admin/ui/newsletter-new-listings?days=7
 *
 * Returns up to 12 slugs added in the last N days — used by the "Draft from
 * new listings" button on the campaigns index page.
 */
import { requireAdmin } from '@/lib/newsletter/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db } = ctx;

  const days = Math.min(Number(req.query.days) || 7, 60);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data, error } = await db
    .from('properties')
    .select('slug, title, city, country, region, beds, price, currency, img, partner, date_added')
    .eq('status', 'Live')
    .gte('date_added', since)
    .order('date_added', { ascending: false })
    .order('created_at', { ascending: false, nullsFirst: false })
    .limit(12);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ properties: data || [], days, since });
}
