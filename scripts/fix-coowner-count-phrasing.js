#!/usr/bin/env node
// Tightens the "up to seven co-owners" phrasing in ES + FR pillars.
//
// Problem: David flagged that "(hasta siete en total)" / "(sept au maximum)"
// reads as if the GROUP totals 7 — when actually max 8 people own (you + 7
// others), and many buyers consolidate multiple shares so the count is
// often even fewer.
//
// Fix: replace the parenthetical with an explicit "otros / autres" framing
// that matches the EN "alongside up to seven other co-owners" wording.

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const ROOT = path.resolve(__dirname, '..');
const files = glob.sync('content/destinations/{es,fr}/**/*.html', { cwd: ROOT, absolute: true });

const REPLACEMENTS = [
  // ── ES ────────────────────────────────────────────────────────────
  // Snippet body: "junto a un pequeño grupo de copropietarios (hasta siete en total)"
  ['junto a un pequeño grupo de copropietarios (hasta siete en total)',
   'junto a un pequeño grupo de hasta siete copropietarios más'],

  // LLC callout body: "tú y un pequeño grupo de propietarios (hasta siete en total) tenéis"
  ['tú y un pequeño grupo de propietarios (hasta siete en total) tenéis',
   'tú y un pequeño grupo de hasta siete propietarios más tenéis'],

  ['tú y un pequeño grupo de copropietarios (hasta siete en total) tenéis',
   'tú y un pequeño grupo de hasta siete copropietarios más tenéis'],

  ['tú y un pequeño grupo de copropietarios (hasta siete en total) sois titulares',
   'tú y un pequeño grupo de hasta siete copropietarios más sois titulares'],

  ['tú y un pequeño grupo de propietarios (hasta siete en total) sois titulares',
   'tú y un pequeño grupo de hasta siete propietarios más sois titulares'],

  // §F legal-nature paragraph (usted form): "usted y un pequeño grupo de copropietarios (hasta siete en total) tienen"
  ['usted y un pequeño grupo de copropietarios (hasta siete en total) tienen',
   'usted y un pequeño grupo de hasta siete copropietarios más tienen'],

  ['usted y un pequeño grupo de propietarios (hasta siete en total) tienen',
   'usted y un pequeño grupo de hasta siete propietarios más tienen'],

  // Generic catch — any remaining "(hasta siete en total)" with surrounding
  // grupo de copropietarios phrasing
  ['(hasta siete en total)', '(siete como máximo, además del comprador)'],

  // ── FR ────────────────────────────────────────────────────────────
  // Snippet body: "aux côtés d'un petit groupe de copropriétaires (sept au maximum)"
  ["aux côtés d'un petit groupe de copropriétaires (sept au maximum)",
   "aux côtés d'un petit groupe d'au plus sept autres copropriétaires"],

  // LLC callout body
  ['vous et un petit groupe de copropriétaires (sept au maximum) détenez',
   "vous et un petit groupe d'au plus sept autres copropriétaires détenez"],

  ['vous et un petit groupe de copropriétaires (sept au maximum) êtes titulaires',
   "vous et un petit groupe d'au plus sept autres copropriétaires êtes titulaires"],

  // Generic catch
  ['(sept au maximum)', "(sept au maximum, en plus de l'acheteur)"],
];

let totalReplacements = 0;
let filesModified = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const before = content;
  let perFile = 0;
  for (const [old, neu] of REPLACEMENTS) {
    let cursor = 0;
    while ((cursor = content.indexOf(old, cursor)) !== -1) {
      content = content.slice(0, cursor) + neu + content.slice(cursor + old.length);
      cursor += neu.length;
      perFile += 1;
    }
  }
  if (content !== before) {
    fs.writeFileSync(file, content, 'utf8');
    filesModified += 1;
    totalReplacements += perFile;
    const rel = path.relative(ROOT, file);
    console.log(`  ✓ ${rel}  (${perFile} replacements)`);
  }
}

console.log(`\nDone. ${filesModified} files modified, ${totalReplacements} total replacements.`);
