/**
 * GET /api/admin/ui/newsletter-tags
 *
 * Aggregates the distinct tags from contacts.tags so the "By tag" audience
 * picker has something to populate from. Also returns distinct regions used
 * across the live properties (for "By region").
 */
import { requireAdmin } from '@/lib/newsletter/auth';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db } = ctx;

  // Pull every contact's tags. With ~few thousand contacts this is fine.
  const { data: contactsTags } = await db
    .from('contacts')
    .select('tags');

  const tagCounts = new Map();
  for (const c of contactsTags || []) {
    for (const t of c.tags || []) {
      tagCounts.set(t, (tagCounts.get(t) || 0) + 1);
    }
  }
  const tags = [...tagCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  // Regions from leads (used to drive the "By region" picker)
  const { data: leadRegions } = await db
    .from('leads')
    .select('main_region, subregion');

  const regionCounts = new Map();
  for (const l of leadRegions || []) {
    for (const r of [l.main_region, l.subregion]) {
      const v = (r || '').trim();
      if (!v) continue;
      regionCounts.set(v, (regionCounts.get(v) || 0) + 1);
    }
  }
  const regions = [...regionCounts.entries()]
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count);

  return res.json({ tags, regions });
}
