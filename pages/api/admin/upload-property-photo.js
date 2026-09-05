import { optimisePhoto } from "@/lib/optimise-photo";
/**
 * POST /api/admin/upload-property-photo
 * Uploads a photo to Supabase Storage and appends its URL to properties.photos[]
 * DELETE /api/admin/upload-property-photo
 * Removes a photo URL from properties.photos[] (and deletes from Storage if hosted there)
 *
 * Auth: Bearer <Supabase access token for CRM admin>
 */
import formidable from 'formidable';
import fs from 'fs';
import { requireCrmAdmin } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

export const config = { api: { bodyParser: false } };

function getDb() {
  return createSupabaseAdminClient();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://cop-crm.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const admin = await requireCrmAdmin(req, res);
  if (!admin) return;

  const db = getDb();

  // ── DELETE: remove a photo URL from the property ──────────────────────────
  if (req.method === 'DELETE') {
    const { propertySlug, photoUrl } = req.body || {};

    // Parse body manually for DELETE (bodyParser is off)
    let body = '';
    for await (const chunk of req) body += chunk;
    const parsed = JSON.parse(body || '{}');
    const { propertySlug: slug, photoUrl: url } = parsed;

    if (!slug || !url) return res.status(400).json({ error: 'propertySlug and photoUrl required' });

    const { data: prop } = await db.from('properties').select('photos').eq('slug', slug).single();
    const photos = Array.isArray(prop?.photos) ? prop.photos : [];
    const updated = photos.filter(p => p !== url);

    await db.from('properties').update({ photos: updated }).eq('slug', slug);

    // If hosted in our Supabase Storage, delete the file too
    const storageBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/property-photos/`;
    if (url.startsWith(storageBase)) {
      const filePath = url.replace(storageBase, '');
      await db.storage.from('property-photos').remove([filePath]);
    }

    return res.status(200).json({ ok: true, photos: updated });
  }

  // ── POST: upload a new photo ───────────────────────────────────────────────
  if (req.method !== 'POST') return res.status(405).end();

  const form = formidable({ maxFileSize: 20 * 1024 * 1024 }); // 20 MB max

  const [fields, files] = await new Promise((resolve, reject) => {
    form.parse(req, (err, f, fi) => err ? reject(err) : resolve([f, fi]));
  });

  const propertySlug = Array.isArray(fields.propertySlug) ? fields.propertySlug[0] : fields.propertySlug;
  const file = Array.isArray(files.photo) ? files.photo[0] : files.photo;

  if (!propertySlug || !file) {
    return res.status(400).json({ error: 'propertySlug and photo file required' });
  }

  // Read file buffer
  let photo;
  try {
    photo = await optimisePhoto(fs.readFileSync(file.filepath));
  } catch {
    return res.status(400).json({ error: 'Could not process this image. Please use a JPG, PNG or WebP photo.' });
  } finally {
    try { fs.unlinkSync(file.filepath); } catch {}
  }
  const { buffer, ext, contentType: mime } = photo;
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const storagePath = `${propertySlug}/${fileName}`;

  // Upload to Supabase Storage
  const { error: uploadError } = await db.storage
    .from('property-photos')
    .upload(storagePath, buffer, { contentType: mime, cacheControl: '31536000', upsert: false });

  if (uploadError) {
    console.error('[Storage] upload error:', uploadError.message);
    return res.status(500).json({ error: uploadError.message });
  }

  // Get public URL
  const { data: urlData } = db.storage.from('property-photos').getPublicUrl(storagePath);
  const publicUrl = urlData?.publicUrl;

  if (!publicUrl) return res.status(500).json({ error: 'Could not get public URL' });

  // Append to properties.photos array
  const { data: prop } = await db.from('properties').select('photos').eq('slug', propertySlug).single();
  const existing = Array.isArray(prop?.photos) ? prop.photos : [];
  const photos   = [...existing, publicUrl];

  await db.from('properties').update({ photos }).eq('slug', propertySlug);

  return res.status(200).json({ ok: true, url: publicUrl, photos });
}
