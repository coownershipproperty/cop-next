import { createClient } from '@supabase/supabase-js';

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://cop-crm.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${process.env.CRM_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { slugs } = req.body || {};
  if (!Array.isArray(slugs) || slugs.length === 0) {
    return res.status(400).json({ error: 'slugs array required' });
  }

  const db = getDb();
  const { data, error } = await db
    .from('properties')
    .select('id, title, slug, region, subregion, price, currency, img')
    .in('slug', slugs.slice(0, 12));

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ properties: data || [] });
}
