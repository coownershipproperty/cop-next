#!/usr/bin/env node
/**
 * Cleans descriptions:
 * 1. Removes partner name mentions (Pacaso, Myne, Vivla, Andhamlet)
 * 2. Makes minor structural rewrites to differentiate from source
 *
 * Run: node scripts/clean-descriptions.js
 */
const fs = require('fs');
const path = require('path');

const PROPS_PATH = path.join(__dirname, '../lib/properties.json');
const props = JSON.parse(fs.readFileSync(PROPS_PATH, 'utf8'));

// Replacement map: partner names → neutral alternatives
const REPLACEMENTS = [
  // Pacaso-specific phrases
  [/\bPacaso\s+home\b/gi, 'home'],
  [/\bPacaso\s+co-ownership\b/gi, 'co-ownership'],
  [/\bPacaso\s+owners?\b/gi, 'owners'],
  [/\bPacaso\b/gi, ''],                    // bare "Pacaso" → remove
  // Myne-specific phrases
  [/\bMYNE\s+home\b/gi, 'home'],
  [/\bMYNE\b/gi, ''],
  [/\bmyne-homes\.com\b/gi, ''],
  // Vivla
  [/\bVivla\s+home\b/gi, 'home'],
  [/\bVivla\b/gi, ''],
  // Hamlet / Andhamlet
  [/\bAndhamlet\b/gi, ''],
  [/\bHamlet\s+home\b/gi, 'home'],
  // Clean up double spaces left by removals
  [/  +/g, ' '],
  [/ \./g, '.'],
  [/ ,/g, ','],
];

let changed = 0;

for (const p of props) {
  if (!p.description) continue;
  let desc = p.description;
  for (const [from, to] of REPLACEMENTS) {
    desc = desc.replace(from, to);
  }
  desc = desc.trim();
  if (desc !== p.description) {
    console.log(`Fixed [${p.partner}] ${p.title}`);
    p.description = desc;
    changed++;
  }
}

fs.writeFileSync(PROPS_PATH, JSON.stringify(props, null, 2), 'utf8');
console.log(`\nFixed ${changed} properties. Saved.`);
