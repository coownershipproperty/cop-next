import { requireCrmAdmin, setCrmCors } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

function getDb() {
  return createSupabaseAdminClient();
}

export default async function handler(req, res) {
  setCrmCors(res);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await requireCrmAdmin(req, res);
  if (!admin) return;

  const { slugs } = req.body || {};
  if (!Array.isArray(slugs) || slugs.length === 0) {
    return res.status(400).json({ error: 'slugs array required' });
  }

  const db = getDb();
  const { data, error } = await db
    .from('properties')
    .select('id, title, slug, region, city, price, currency, img')
    .in('slug', slugs.slice(0, 12));

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ properties: data || [] });
}
