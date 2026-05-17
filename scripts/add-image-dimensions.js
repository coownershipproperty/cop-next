#!/usr/bin/env node
// Adds width="W" height="H" attributes to all <img> tags whose src points to
// Storyblok URLs that encode dimensions in the path (a.storyblok.com/f/.../WxH/...).
// Eliminates Cumulative Layout Shift (CLS), a Core Web Vital that affects ranking.
//
// Targets all destination editorial files (EN + DE/ES/FR locales). Idempotent —
// skips images that already have width/height attrs.

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'content/destinations');

// All HTML files under content/destinations and its locale subfolders
const files = glob.sync('**/*.html', { cwd: DEST, absolute: true });

console.log(`Found ${files.length} HTML files. Scanning for images…\n`);

// Pattern: <img ... src="https://a.storyblok.com/f/{id}/{W}x{H}/{hash}/{name}" ... />
// We want to inject width="W" height="H" if they're not already present.
const STORYBLOK_RE = /<img\b([^>]*?)\bsrc="https:\/\/a\.storyblok\.com\/f\/\d+\/(\d+)x(\d+)\/[^"]+"([^>]*?)\/?>/g;

let totalImages = 0;
let totalFixed = 0;
let filesModified = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const before = content;
  let fixedInFile = 0;

  content = content.replace(STORYBLOK_RE, (match, pre, w, h, post) => {
    totalImages += 1;
    // Skip if width/height already present (in either pre or post)
    const combined = pre + post;
    if (/\bwidth\s*=/.test(combined) || /\bheight\s*=/.test(combined)) {
      return match;
    }
    fixedInFile += 1;
    totalFixed += 1;
    // Re-emit the img with width/height added before the closing >
    const reconstructed = `<img${pre}src="https://a.storyblok.com/f/__ID__/${w}x${h}/__REST__"${post} width="${w}" height="${h}" />`;
    // But we need the actual ID and rest of URL — re-match against original
    const inner = match.match(/<img\b([^>]*?)\bsrc="(https:\/\/a\.storyblok\.com\/[^"]+)"([^>]*?)\/?>/);
    if (!inner) return match;
    const [, p1, src, p3] = inner;
    return `<img${p1}src="${src}"${p3} width="${w}" height="${h}" />`;
  });

  if (content !== before) {
    fs.writeFileSync(file, content, 'utf8');
    filesModified += 1;
    const rel = path.relative(ROOT, file);
    console.log(`  ✓ ${rel}  (${fixedInFile} images)`);
  }
}

console.log(`\nDone. ${filesModified} files modified, ${totalFixed}/${totalImages} images updated.`);
