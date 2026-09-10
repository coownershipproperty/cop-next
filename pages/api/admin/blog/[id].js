import { requireCrmAdmin } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

const POST_FIELDS = [
  'id', 'slug', 'title', 'category', 'date', 'date_formatted', 'subtitle',
  'excerpt', 'hero_image', 'hero_image_alt', 'hero_image_caption', 'content',
  'published', 'key_points', 'updated_at',
].join(',');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function requiredText(value, max) {
  const result = String(value ?? '').trim();
  return result && result.length <= max ? result : null;
}

function optionalText(value, max) {
  const result = String(value ?? '').trim();
  return result ? result.slice(0, max) : null;
}

function normalizeKeyPoints(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 4).map((point) => ({
    icon: ['sun', 'deed', 'price', 'bicycle'].includes(point?.icon) ? point.icon : 'deed',
    eyebrow: optionalText(point?.eyebrow, 80) || '',
    text: requiredText(point?.text, 180),
  })).filter((point) => point.text);
}

async function refreshPaths(res, paths) {
  const failed = [];
  for (const path of [...new Set(paths)]) {
    try {
      await res.revalidate(path);
    } catch (_) {
      failed.push(path);
    }
  }
  return failed;
}

export default async function handler(req, res) {
  if (!['GET', 'PATCH'].includes(req.method)) {
    res.setHeader('Allow', 'GET, PATCH');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const admin = await requireCrmAdmin(req, res);
  if (!admin) return;

  const id = String(req.query.id || '').trim();
  if (!UUID.test(id)) return res.status(400).json({ error: 'Invalid blog post.' });

  const db = createSupabaseAdminClient();
  const { data: existing, error: findError } = await db.from('posts')
    .select(POST_FIELDS).eq('id', id).maybeSingle();

  if (findError) return res.status(500).json({ error: 'Could not load the blog post.' });
  if (!existing) return res.status(404).json({ error: 'Blog post not found.' });
  if (req.method === 'GET') return res.json({ post: existing });

  const title = requiredText(req.body?.title, 240);
  const slug = requiredText(req.body?.slug, 220);
  const category = requiredText(req.body?.category, 120);
  const content = requiredText(req.body?.content, 300000);
  const date = String(req.body?.date || '').trim();

  if (!title || !slug || !category || !content) {
    return res.status(400).json({ error: 'Title, slug, category and content are required.' });
  }
  if (!SLUG.test(slug)) return res.status(400).json({ error: 'Use lowercase words and hyphens for the slug.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Enter a valid publication date.' });

  const patch = {
    title,
    slug,
    category,
    date,
    date_formatted: optionalText(req.body?.date_formatted, 40),
    subtitle: optionalText(req.body?.subtitle, 1200),
    excerpt: optionalText(req.body?.excerpt, 1200),
    hero_image: optionalText(req.body?.hero_image, 2000),
    hero_image_alt: optionalText(req.body?.hero_image_alt, 600),
    hero_image_caption: optionalText(req.body?.hero_image_caption, 1200),
    content,
    key_points: normalizeKeyPoints(req.body?.key_points),
    published: req.body?.published === true,
    updated_at: new Date().toISOString(),
  };

  const { data: post, error: updateError } = await db.from('posts')
    .update(patch).eq('id', id).select(POST_FIELDS).maybeSingle();

  if (updateError?.code === '23505') return res.status(409).json({ error: 'That slug is already in use.' });
  if (updateError) return res.status(500).json({ error: 'Could not save the blog post.' });
  if (!post) return res.status(404).json({ error: 'Blog post not found.' });

  const failedPaths = await refreshPaths(res, [
    '/all-our-blog/', '/',
    `/blog/${existing.slug}/`, `/blog/${post.slug}/`,
  ]);

  return res.json({
    ok: true,
    post,
    warning: failedPaths.length ? 'Saved, but one or more public pages may take up to an hour to refresh.' : null,
  });
}
