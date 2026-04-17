/**
 * scrape-andhamlet.js
 * 
 * Scrapes gallery images + descriptions for all &Hamlet properties
 * directly from andhamlet.com.
 *
 * Gallery: targets section.section_gallery8 — only the property's own photos.
 * Description: extracts div.component_rich-text.w-richtext, strips partner name.
 *
 * Usage:
 *   node scripts/scrape-andhamlet.js                          (all properties)
 *   node scripts/scrape-andhamlet.js palma-spain-3-bed-...   (single property)
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PROPS_PATH = path.join(__dirname, '../lib/properties.json');

// COP slug → andhamlet.com listing slug
const AH_MAP = {
  'fayence-france-6-bed-villa':                   'villa-soie',
  'palma-spain-3-bed-villa-with-pool':             'casa-alzina',
  'higueron-spain-3-bed-villa-with-sea-views':     'casa-lomas',
  'mouans-sartoux-france-7-bed-villa':             'villa-castellaras',
  'apricale-italy-3-bed-villa-with-infinity-pool': 'villa-apricus',
  'santanyi-spain-5-bed-villa-with-pool':          'villa-cascada',
  'higueron-spain-3-bed-penthouse-with-sea-views': 'seaviews-penthouse',
  'higueron-spain-3-bed-villa-with-sea-views-2':   'niagara-garden',
  'marbella-spain-4-bed-villa-with-jacuzzi':       'el-madronal',
  'benahavis-spain-3-bed-villa-with-fireplace':    'los-almendros',
  'higueron-spain-5-bed-villa-with-sea-views':     'the-bay',
};

function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; COP-bot/1.0)' } }, res => {
      if ([301, 302].includes(res.statusCode))
        return fetchHtml(res.headers.location).then(resolve).catch(reject);
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function extractGalleryImages(html) {
  // Find the gallery section by its Webflow class name
  const galStart = html.indexOf('section_gallery8');
  if (galStart === -1) return [];

  const sectionStart = html.lastIndexOf('<section', galStart);
  const sectionEnd   = html.indexOf('</section>', galStart) + '</section>'.length;
  const galHtml      = html.slice(sectionStart, sectionEnd);

  // Extract only <img src="..."> attributes within this section
  const imgRegex = /<img[^>]+\bsrc="(https:\/\/cdn\.prod\.website-files\.com\/[^"]+)"/gi;
  const seen = new Set();
  const images = [];
  let m;
  while ((m = imgRegex.exec(galHtml)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); images.push(m[1]); }
  }
  return images;
}

function extractDescription(html) {
  // Target the rich text description block
  const rtIdx = html.indexOf('component_rich-text w-richtext');
  if (rtIdx === -1) return '';

  const tagStart   = html.lastIndexOf('<', rtIdx);
  const tagEnd     = html.indexOf('>', tagStart);

  // Walk forward counting div nesting to find the closing </div>
  let depth = 1, pos = tagEnd + 1;
  while (depth > 0 && pos < html.length) {
    const open  = html.indexOf('<div', pos);
    const close = html.indexOf('</div>', pos);
    if (close === -1) break;
    if (open !== -1 && open < close) { depth++; pos = open + 4; }
    else                              { depth--; pos = close + 6; }
  }

  let text = html.slice(tagEnd + 1, pos - 6)
    .replace(/<[^>]+>/g, ' ')      // strip tags
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&#[0-9a-fx]+;/gi, '')
    .replace(/\u200d/g, '')        // zero-width joiner
    .replace(/\s+/g, ' ')
    .trim();

  // Strip partner name variants (including partial leftovers like "Through , ")
  const stripPatterns = [
    /&Hamlet/gi,
    /\bAndHamlet\b/gi,
    /Through\s*,/gi,              // "Through &Hamlet," → "Through ," → remove
    /through\s*[.,]/gi,           // "through ." / "through ," → remove
    /as\s+a\s+owner/gi,           // "as a &Hamlet owner" → "as a  owner" → clean
    /as\s+an?\s+owner/gi,
    /\bis\s+happy\s+to\b[^.]*\./gi,  // " is happy to welcome you to The Bay." (orphaned verb)
    /,\s*\bis\s+happy\s+to\b[^,.]*/gi,
    // "but you can just relax as [partner] takes care of the property"
    // → after stripping partner → "as takes care of the property"
    /,?\s+but\s+you\s+can\s+just\s+relax\s+as\s+takes\s+care\s+of\s+the\s+property/gi,
    // generic: any leftover "as takes [verb]" orphan
    /\s+as\s+takes\s+\w+/gi,
    // "With , everything..." → "With [partner], everything..." after stripping
    /\bWith\s*,/gi,
    // Remove "Partner: XYZ" attribution lines at the end
    /\s*Partner\s*:\s*[^\n.]*/gi,
  ];
  stripPatterns.forEach(p => { text = text.replace(p, ''); });

  // Remove leading comma+space left by a stripped partner name at sentence start
  text = text.replace(/^[,\s]+/, '');

  // Remove leading NB: disclaimer sentence(s)
  // e.g. "NB: Please note that ... renderings. Real description..."
  text = text.replace(/^\s*NB\s*:[^.]*\.\s*/i, '');

  // Remove disclaimer (Note:...) and everything after
  const noteIdx = text.indexOf('Note:');
  if (noteIdx > 100) text = text.slice(0, noteIdx);

  // Final cleanup — only strip trailing comma (not period — a period ends a real sentence)
  text = text
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*$/, '')
    .trim();

  // Remove any trailing sentence fragment that starts with a lowercase letter
  // (orphaned after partner-name stripping, e.g. "every single detail is taken care of")
  text = text.replace(/\.\s+[a-z][^.]*$/, '.');
  text = text.replace(/\s{2,}/g, ' ').trim();

  return text;
}

async function scrapeProperty(slug, ahSlug) {
  const url = `https://www.andhamlet.com/listings/${ahSlug}`;
  console.log(`\n[${slug}]  →  ${url}`);

  const html   = await fetchHtml(url);
  const images = extractGalleryImages(html);
  const desc   = extractDescription(html);

  console.log(`  ✓ ${images.length} gallery images`);
  if (images.length > 0) console.log(`    hero: ${images[0].split('/').pop()}`);
  console.log(`  ✓ description (${desc.length} chars): ${desc.slice(0, 80)}...`);

  return { images, description: desc, partnerUrl: url };
}

async function main() {
  const targetSlug = process.argv[2];
  const props      = JSON.parse(fs.readFileSync(PROPS_PATH, 'utf8'));
  const toProcess  = targetSlug
    ? (AH_MAP[targetSlug] ? { [targetSlug]: AH_MAP[targetSlug] } : (() => { throw new Error(`Unknown slug: ${targetSlug}`); })())
    : AH_MAP;

  let updated = 0;

  for (const [slug, ahSlug] of Object.entries(toProcess)) {
    try {
      const { images, description, partnerUrl } = await scrapeProperty(slug, ahSlug);

      const prop = props.find(p => p.slug === slug);
      if (!prop) { console.log(`  ✗ slug not in properties.json`); continue; }

      if (images.length > 0) {
        prop.images    = images.slice(0, 3);   // 3 hero images for listing page
        prop.img       = images[0];            // primary card image
        prop.allImages = images;               // full set for Drive upload
      } else {
        console.log(`  ✗ no images — skipping`);
      }

      if (description.length > 80) prop.description = description;
      prop.notes = partnerUrl;

      updated++;
      await new Promise(r => setTimeout(r, 1200)); // rate limit

    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
    }
  }

  fs.writeFileSync(PROPS_PATH, JSON.stringify(props, null, 2));
  console.log(`\n✅ Done — updated ${updated} / ${Object.keys(toProcess).length} properties.`);
}

main().catch(err => { console.error(err); process.exit(1); });
