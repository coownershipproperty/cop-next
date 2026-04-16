#!/usr/bin/env node
/**
 * Fetches descriptions, amenities/highlights, and location text
 * for all 86 Myne properties from myne-homes.com.
 * The source URL is stored in each property's `notes` field.
 *
 * Run: node scripts/fetch-myne-descriptions.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROPS_PATH = path.join(__dirname, '../lib/properties.json');

// ── Fetch raw HTML ─────────────────────────────────────────────────────────
function fetchHtml(url) {
  return new Promise((resolve) => {
    const req = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-GB,en;q=0.9',
      }
    }, res => {
      // follow redirects
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        return fetchHtml(res.headers.location).then(resolve);
      }
      let body = '';
      res.setEncoding('utf8');
      res.on('data', d => body += d);
      res.on('end', () => resolve(body));
    });
    req.on('error', () => resolve(''));
    req.setTimeout(15000, () => { req.destroy(); resolve(''); });
  });
}

// ── Strip HTML tags ────────────────────────────────────────────────────────
function stripTags(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&ndash;/g, '–').replace(/&mdash;/g, '—').replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&rsquo;/g, "'")
    .replace(/\n{3,}/g, '\n\n').trim();
}

// ── Parse Myne property page ───────────────────────────────────────────────
function parseMynePage(html) {
  if (!html) return null;

  // ── Description: inside <p class="typo-body line-clamp-...">
  let description = '';
  const descMatch = html.match(/class="typo-body line-clamp[^"]*">([\s\S]*?)<\/p>/);
  if (descMatch) {
    description = stripTags(descMatch[1]);
  }

  // ── Highlights / amenities: text inside the highlights list
  // Structure: data-ontrack-id="property-highlights-list" ... <p class="typo-body">ITEM</p>
  const amenities = [];
  const highlightsStart = html.indexOf('property-highlights-list');
  if (highlightsStart > -1) {
    // Find the end of this section (next major section)
    const highlightsEnd = html.indexOf('data-ontrack-id="property-key-facts"', highlightsStart);
    const highlightSection = html.slice(highlightsStart, highlightsEnd > -1 ? highlightsEnd : highlightsStart + 5000);
    // Extract text from <p class="typo-body"> tags in this section
    const amenityMatches = [...highlightSection.matchAll(/<p class="typo-body">([\s\S]*?)<\/p>/g)];
    for (const m of amenityMatches) {
      const text = stripTags(m[1]).trim();
      if (text && text.length < 120) amenities.push(text);
    }
  }

  return { description, amenities };
}

// ── Main ───────────────────────────────────────────────────────────────────
async function run() {
  const props = JSON.parse(fs.readFileSync(PROPS_PATH, 'utf8'));
  const myneProps = props.filter(p => p.partner === 'myne' && p.notes && p.notes.includes('myne-homes.com'));

  console.log(`\nFetching ${myneProps.length} Myne properties...\n`);

  let updated = 0, failed = 0;

  for (let i = 0; i < myneProps.length; i++) {
    const p = myneProps[i];
    const url = p.notes.trim().split('\n')[0].trim(); // use first URL if multiple

    process.stdout.write(`  [${i+1}/${myneProps.length}] ${p.title.slice(0,50)}...`);

    const html = await fetchHtml(url);

    if (!html) {
      console.log(' ✗ fetch failed');
      failed++;
      await new Promise(r => setTimeout(r, 300));
      continue;
    }

    const data = parseMynePage(html);

    if (!data || !data.description) {
      console.log(' ✗ parse failed');
      failed++;
      await new Promise(r => setTimeout(r, 300));
      continue;
    }

    // Update in main array
    const mainProp = props.find(x => x.slug === p.slug);
    if (mainProp) {
      mainProp.description = data.description;
      if (data.amenities.length > 0) {
        mainProp.amenities = data.amenities;
      }
      updated++;
      console.log(` ✓ ${data.description.length} chars, ${data.amenities.length} amenities`);
    }

    // Polite delay
    await new Promise(r => setTimeout(r, 250));
  }

  fs.writeFileSync(PROPS_PATH, JSON.stringify(props, null, 2), 'utf8');

  console.log(`\n========================================`);
  console.log(`  Updated: ${updated} | Failed: ${failed}`);
  console.log(`  Saved to lib/properties.json`);
  console.log(`========================================\n`);
}

run().catch(console.error);
