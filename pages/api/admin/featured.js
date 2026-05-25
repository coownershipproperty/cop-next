/**
 * POST /api/admin/featured
 *
 * Replaces the homepage featured-properties list with the supplied ordered
 * slugs. Body: { slugs: string[] }.
 *
 * Auth: Bearer <Supabase access token of a CRM admin>. Writes use the service
 * role, so this works regardless of table-level grants on `featured_properties`.
 */
import { requireCrmAdmin } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const admin = await requireCrmAdmin(req, res);
  if (!admin) return; // requireCrmAdmin has already sent the response

  const raw = Array.isArray(req.body?.slugs) ? req.body.slugs : null;
  if (!raw) return res.status(400).json({ error: 'Missing slugs array' });

  // De-duplicate, drop blanks, preserve order.
  const seen = new Set();
  const slugs = [];
  for (const s of raw) {
    const slug = String(s || '').trim();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
  }

  const db = createSupabaseAdminClient();
  try {
    // Replace the whole list.
    const { error: delErr } = await db
      .from('featured_properties')
      .delete()
      .neq('slug', '');
    if (delErr) throw delErr;

    if (slugs.length > 0) {
      const now = new Date().toISOString();
      const rows = slugs.map((slug, i) => ({ slug, position: i, updated_at: now }));
      const { error: insErr } = await db.from('featured_properties').insert(rows);
      if (insErr) throw insErr;
    }

    // Refresh the cached homepages so the change appears straight away
    // instead of waiting for the hourly revalidation.
    for (const path of ['/', '/de', '/es', '/fr']) {
      try {
        await res.revalidate(path);
      } catch (e) {
        console.error('[admin/featured] revalidate failed for ' + path + ':', e.message);
      }
    }

    return res.status(200).json({ ok: true, count: slugs.length });
  } catch (e) {
    console.error('[admin/featured] save failed:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
