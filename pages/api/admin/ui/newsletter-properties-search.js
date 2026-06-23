/**
 * POST /api/admin/ui/newsletter-properties-search
 *
 * Body: { q?: string, partner?: string, country?: string, slugs?: string[], limit?: number }
 *
 * If `slugs` is provided, returns those specific properties in the same order
 * (used to load the "selected properties" panel on the edit screen).
 * Otherwise returns a search by title/city/country with date_added desc.
 */
import { requireAdmin } from '@/lib/newsletter/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db } = ctx;

  const { q, partner, country, slugs, limit } = req.body || {};
  const max = Math.min(Number(limit) || 20, 1000);

  const cols = 'slug, title, region, city, country, beds, price, currency, img, partner, date_added, created_at, status';

  if (Array.isArray(slugs) && slugs.length) {
    const { data, error } = await db
      .from('properties')
      .select(cols)
      .in('slug', slugs);
    if (error) return res.status(500).json({ error: error.message });

    // Preserve the input order
    const map = new Map();
    for (const p of data || []) map.set(p.slug, p);
    const ordered = slugs.map(s => map.get(s)).filter(Boolean);

    return res.json({ properties: ordered });
  }

  let query = db
    .from('properties')
    // Match the main admin Properties list: include Live + for-sale (exclude
    // sold/hidden), and use its exact "Newest first" ordering below.
    .select(cols)
    .in('status', ['Live', 'for_sale'])
    .order('date_added', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false, nullsFirst: false })
    .order('slug', { ascending: true })
    .limit(max);

  if (q && q.trim()) {
    const s = q.trim().replace(/[,()]/g, ' ');
    query = query.or(`title.ilike.%${s}%,city.ilike.%${s}%,country.ilike.%${s}%,region.ilike.%${s}%,slug.ilike.%${s}%`);
  }
  if (partner) query = query.eq('partner', partner);
  if (country) query = query.eq('country', country);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  // Sort identically to the main admin Properties page "Newest first":
  // date_added, falling back to created_at, descending (a single coalesced key).
  const dv = (p) => p.date_added || p.created_at || '';
  const sorted = (data || []).slice().sort((a, b) => String(dv(b)).localeCompare(String(dv(a))));
  return res.json({ properties: sorted });
}
