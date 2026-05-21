/**
 * One-time migration: inserts all posts from lib/posts.json into Supabase.
 * Protected by CRON_SECRET. Call once, then remove this file.
 *
 * POST /api/admin/migrate-posts
 * Authorization: Bearer <CRON_SECRET>
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import posts from '@/lib/posts.json';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const auth = req.headers['authorization'] || '';
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const db = createSupabaseAdminClient();

  const rows = posts.map(p => ({
    slug:           p.slug,
    title:          p.title,
    category:       p.category || null,
    date:           p.date || null,
    date_formatted: p.dateFormatted || null,
    subtitle:       p.subtitle || null,
    excerpt:        p.excerpt || null,
    hero_image:     p.heroImage || null,
    content:        p.content || null,
    published:      true,
  }));

  // Upsert in batches of 10 to stay well within Supabase payload limits
  const BATCH = 10;
  let inserted = 0;
  const errors = [];

  for (let i = 0; i < rows.length; i += BATCH) {
    const chunk = rows.slice(i, i + BATCH);
    const { error } = await db
      .from('posts')
      .upsert(chunk, { onConflict: 'slug' });

    if (error) {
      errors.push({ batch: i / BATCH, error: error.message });
    } else {
      inserted += chunk.length;
    }
  }

  return res.status(200).json({
    total: rows.length,
    inserted,
    errors,
  });
}
