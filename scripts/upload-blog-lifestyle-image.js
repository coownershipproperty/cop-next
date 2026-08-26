#!/usr/bin/env node
/**
 * Upload a reusable COP lifestyle image with searchable Supabase metadata.
 *
 * The primary location determines the canonical folder. Other suitable
 * destinations belong in destination-tags so the same object is not duplicated.
 * When --post-slug is supplied, the unpublished/published post receives the
 * image URL, accessible alt text and visible caption in one verified update.
 *
 * Required environment:
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Example:
 *   node scripts/upload-blog-lifestyle-image.js \
 *     --file=/absolute/path/photo.jpg \
 *     --primary-location=mallorca \
 *     --area="Port d'Andratx" \
 *     --country=Spain \
 *     --activity=cycling \
 *     --alt="Couple cycling down a dry-stone lane above Port d'Andratx in south-west Mallorca." \
 *     --caption="A couple cycling early in the morning above Port d'Andratx, south-west Mallorca." \
 *     --tags=cycling,outdoor-lifestyle,summer-activities,couples \
 *     --destination-tags=mallorca,balearic-islands,ibiza \
 *     --seasons=spring,summer,autumn \
 *     --post-slug=mallorca-cycling-nova-santa-ponsa-deeded-co-ownership-2026
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const BUCKET = 'cop_blog_images';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iotzzoxyckpyatzqcjbo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MAX_FILE_SIZE = 3 * 1024 * 1024;

function parseArgs(argv) {
  const values = {};
  for (const argument of argv) {
    if (argument === '--dry-run') {
      values.dryRun = true;
      continue;
    }
    if (argument === '--help') {
      values.help = true;
      continue;
    }
    const match = argument.match(/^--([^=]+)=(.*)$/s);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function csv(value) {
  return [...new Set(String(value || '').split(',').map(item => slugify(item)).filter(Boolean))];
}

function usage() {
  console.log(`Usage:
  node scripts/upload-blog-lifestyle-image.js \\
    --file=/absolute/path/photo.jpg \\
    --primary-location=mallorca \\
    --activity=cycling \\
    --alt="Concise screen-reader description" \\
    --caption="Visible editorial caption" \\
    [--description="Internal library description"] \\
    [--area="Port d'Andratx"] [--country=Spain] \\
    [--tags=cycling,summer-activities] \\
    [--destination-tags=mallorca,balearic-islands,ibiza] \\
    [--seasons=spring,summer,autumn] [--post-slug=slug] [--dry-run]`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const required = ['file', 'primary-location', 'activity', 'alt', 'caption'];
  const missing = required.filter(key => !args[key]);
  if (missing.length > 0) throw new Error(`Missing required options: ${missing.join(', ')}`);

  const absoluteFile = path.resolve(args.file);
  if (!fs.existsSync(absoluteFile)) throw new Error(`File not found: ${absoluteFile}`);

  const extension = path.extname(absoluteFile).toLowerCase();
  const contentTypes = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
  const contentType = contentTypes[extension];
  if (!contentType) throw new Error('Image must be JPEG, PNG or WebP.');

  const stats = fs.statSync(absoluteFile);
  if (stats.size > MAX_FILE_SIZE) {
    throw new Error(`Image is ${stats.size} bytes; ${BUCKET} is limited to ${MAX_FILE_SIZE} bytes.`);
  }

  const primaryLocation = slugify(args['primary-location']);
  const activity = slugify(args.activity);
  if (!primaryLocation || !activity) throw new Error('Primary location and activity must contain letters or numbers.');

  const dateStamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const descriptiveName = slugify(args.caption).slice(0, 90) || 'lifestyle-image';
  const objectPath = `lifestyle-library/${primaryLocation}/${activity}/${dateStamp}-${descriptiveName}${extension}`;
  const destinationTags = [...new Set([primaryLocation, ...csv(args['destination-tags'])])];
  const tags = [...new Set([activity, ...csv(args.tags)])];

  const metadata = {
    alt_text: args.alt.trim(),
    caption: args.caption.trim(),
    description: (args.description || args.caption).trim(),
    country: (args.country || '').trim() || null,
    primary_location: primaryLocation,
    area: (args.area || '').trim() || null,
    activity,
    destination_tags: destinationTags,
    tags,
    seasons: csv(args.seasons),
    source: 'cop-editorial-image-generation',
  };

  console.log(JSON.stringify({ bucket: BUCKET, objectPath, metadata, postSlug: args['post-slug'] || null }, null, 2));
  if (args.dryRun) return;
  if (!SERVICE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set.');

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const fileBuffer = fs.readFileSync(absoluteFile);
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(objectPath, fileBuffer, {
    contentType,
    cacheControl: '31536000',
    upsert: false,
    metadata,
  });
  if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

  const { data: publicData } = supabase.storage.from(BUCKET).getPublicUrl(objectPath);
  const publicUrl = publicData.publicUrl;

  const { data: info, error: infoError } = await supabase.storage.from(BUCKET).info(objectPath);
  if (infoError) throw new Error(`Upload read-back failed: ${infoError.message}`);
  if (!info || info.name !== objectPath) throw new Error('Upload read-back returned the wrong object.');

  if (args['post-slug']) {
    const { data: post, error: updateError } = await supabase
      .from('posts')
      .update({
        hero_image: publicUrl,
        hero_image_alt: metadata.alt_text,
        hero_image_caption: metadata.caption,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', args['post-slug'])
      .select('slug, published, hero_image, hero_image_alt, hero_image_caption')
      .single();
    if (updateError) throw new Error(`Post update failed: ${updateError.message}`);
    if (!post || post.hero_image !== publicUrl) throw new Error('Post read-back did not match the uploaded image.');
    console.log(JSON.stringify({ uploaded: true, publicUrl, post }, null, 2));
    return;
  }

  console.log(JSON.stringify({ uploaded: true, publicUrl, metadata: info.metadata || metadata }, null, 2));
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
