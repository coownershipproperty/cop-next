/**
 * POST /api/admin/ui/newsletter-contacts-search
 *
 * Body: { q?: string, limit?: number }
 * Returns a small list of contacts for the "render as recipient" picker.
 */
import { requireAdmin } from '@/lib/newsletter/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db } = ctx;

  const { q, limit } = req.body || {};
  const max = Math.min(Number(limit) || 12, 50);

  let query = db
    .from('contacts')
    .select('id, email, first_name, last_name, country')
    .not('email', 'is', null)
    .not('email', 'like', '%@deleted.local')
    .order('created_at', { ascending: false })
    .limit(max);

  if (q && q.trim()) {
    const s = q.trim().replace(/[,()]/g, ' ');
    query = query.or(`email.ilike.%${s}%,first_name.ilike.%${s}%,last_name.ilike.%${s}%`);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ contacts: data || [] });
}
