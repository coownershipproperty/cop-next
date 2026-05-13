#!/usr/bin/env node
/**
 * Add anchor content pieces to lib/posts.json.
 *
 * Anchor pieces are long-form, structurally distinctive content designed
 * to (a) give Google something genuinely high-quality to index alongside
 * the lifestyle posts, and (b) function as link-bait for industry coverage
 * and outreach. Each anchor uses a custom HTML structure that doesn't
 * share the templated patterns of the existing post inventory.
 *
 * Usage: node scripts/add-anchor-pieces.js
 */

const fs = require('fs');
const path = require('path');

const POSTS_PATH = path.join(__dirname, '..', 'lib', 'posts.json');
const ANCHOR_PATH = path.join(__dirname, 'audit-output', 'anchor-pieces.json');

const posts = JSON.parse(fs.readFileSync(POSTS_PATH, 'utf-8'));
const anchors = JSON.parse(fs.readFileSync(ANCHOR_PATH, 'utf-8'));

const existingSlugs = new Set(posts.map(p => p.slug));
let added = 0;
anchors.forEach(a => {
  if (existingSlugs.has(a.slug)) {
    console.log(`  skip (exists): ${a.slug}`);
    return;
  }
  posts.unshift(a); // newest first
  added++;
  console.log(`  added: ${a.slug}`);
});

if (added > 0) {
  fs.copyFileSync(POSTS_PATH, POSTS_PATH + '.bak.anchors');
  fs.writeFileSync(POSTS_PATH, JSON.stringify(posts, null, 2));
  console.log(`\nWrote lib/posts.json (${added} anchors added)`);
} else {
  console.log('\nNo new anchors to add.');
}
