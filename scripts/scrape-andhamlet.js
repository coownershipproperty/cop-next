/**
 * scrape-andhamlet.js
 *
 * Scrapes gallery images, descriptions and m² for all &Hamlet properties
 * directly from andhamlet.com.
 *
 * Gallery: targets section.section_gallery8 — only the property's own photos.
 * Description: extracts div.component_rich-text.w-richtext, strips partner name.
 * Size (m²): reads the aria-current="page" card in the "More homes" section.
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
  const galStart = html.indexOf('section_gallery8');
  if (galStart === -1) return [];

  const sectionStart = html.lastIndexOf('<section', galStart);
  const sectionEnd   = html.indexOf('</section>', galStart) + '</section>'.length;
  const galHtml      = html.slice(sectionStart, sectionEnd);

  const imgRegex = /<img[^>]+\bsrc="(https:\/\/cdn\.prod\.website-files\.com\/[^"]+)"/gi;
  const seen = new Set();
  const images = [];
  let m;
  while ((m = imgRegex.exec(galHtml)) !== null) {
    if (!seen.has(m[1])) { seen.add(m[1]); images.push(m[1]); }
  }
  return images;
}

async function fetchSizeMap() {
  // Scrape andhamlet.com/homes once to get all ahSlug → m² mappings
  const html = await fetchHtml('https://www.andhamlet.com/homes');
  const slugMatches  = [...html.matchAll(/href="\/listings\/([a-z0-9-]+)"/gi)];
  const meterMatches = [...html.matchAll(/class="meters">(\d+)<\/div>/gi)];
  const map = {};
  meterMatches.forEach(mm => {
    const preceding = slugMatches.filter(s => s.index < mm.index);
    if (preceding.length > 0) {
      const slug = preceding[preceding.length - 1][1];
      if (!map[slug]) map[slug] = parseInt(mm[1], 10); // first hit per slug wins
    }
  });
  return map;
}

function extractDescription(html) {
  const rtIdx = html.indexOf('component_rich-text w-richtext');
  if (rtIdx === -1) return '';

  const tagStart = html.lastIndexOf('<', rtIdx);
  const tagEnd   = html.indexOf('>', tagStart);

  let depth = 1, pos = tagEnd + 1;
  while (depth > 0 && pos < html.length) {
    const open  = html.indexOf('<div', pos);
    const close = html.indexOf('</div>', pos);
    if (close === -1) break;
    if (open !== -1 && open < close) { depth++; pos = open + 4; }
    else                              { depth--; pos = close + 6; }
  }

  let text = html.slice(tagEnd + 1, pos - 6)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#[0-9]+;/gi, '')
    .replace(/&[a-z]+;/gi, '')
    .replace(/\u200d/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // ── Partner name & direct orphan cleanup ────────────────────────────────
  const stripPatterns = [
    /&Hamlet/gi,
    /\bAndHamlet\b/gi,
    /Through\s*,/gi,
    /through\s*[.,!]/gi,
    /through\s*!/gi,
    /as\s+a\s+owner/gi,
    /as\s+an?\s+owner/gi,
    /\bis\s+happy\s+to\b[^.]*\./gi,
    /,\s*\bis\s+happy\s+to\b[^,.]*/gi,
    /,?\s+but\s+you\s+can\s+just\s+relax\s+as\s+takes\s+care\s+of\s+the\s+property/gi,
    /\s+as\s+takes\s+\w+/gi,
    /\bWith\s*,/gi,
    /\s*Partner\s*:\s*[^\n.]*/gi,
    // "your family has everything set for unforgettable experiences ... not be postponed."
    /[^.]*your family has everything set for unforgettable experiences[^.]*/gi,
    // "everything is in place. All you need to do is arrive..."
    /everything is in place\.\s*/gi,
    /All you need to do is arrive[^.]*/gi,
    // "every [single] detail is taken care of" (lowercase orphan sentence)
    /\bevery\s+(?:single\s+)?detail\s+is\s+taken\s+care\s+of\b[^.]*/gi,
    // "Please note: Illustrations are for information purposes only..."
    /Please\s+note\s*:\s*Illustrations[^.]*/gi,
    // "We curate every detail" (partner-specific management copy)
    /We curate every detail[^.]*/gi,
  ];
  stripPatterns.forEach(p => { text = text.replace(p, ''); });

  // Remove leading comma/space left after stripping partner from sentence start
  text = text.replace(/^[,\s]+/, '');

  // Remove leading NB: disclaimer
  text = text.replace(/^\s*NB\s*:[^.]*\.\s*/i, '');
  // Also remove the intro sentence right after NB if it still starts with "is happy to"
  text = text.replace(/^\s*is\s+happy\s+to\b[^.]*\.\s*/i, '');

  // Remove whole boilerplate sentences
  const boilerplate = [
    /[^.]*\benough buyers\b[^.]*/gi,
    /[^.]*\bpurchased in its entirety\b[^.]*/gi,
    /[^.]*\bco-owning this\b[^.]*/gi,
    /[^.]*\bwe will ensure it becomes\b[^.]*/gi,
    /[^.]*\bbecomes a\s+\w*\s*property\b[^.]*/gi,
    // "Refer to the floor plan and layout for precise specifications"
    /[^.]*\bRefer to the floor plan\b[^.]*/gi,
  ];
  boilerplate.forEach(p => { text = text.replace(p, ''); });

  // Remove Note:/Please note: and everything after
  const noteIdx = text.search(/\bNote\s*:/i);
  if (noteIdx > 100) text = text.slice(0, noteIdx);

  // Tidy up
  text = text
    .replace(/\s{2,}/g, ' ')
    .replace(/\.\s*\./g, '.')           // double periods
    .replace(/,\s*$/, '')               // trailing comma
    .replace(/^\.\s*/, '')              // leading period
    .trim();

  // Remove trailing sentence fragment that starts with lowercase
  text = text.replace(/\.\s+[a-z][^.]*$/, '.');
  text = text.replace(/\s{2,}/g, ' ').trim();

  return text;
}

async function scrapeProperty(slug, ahSlug, sizeMap) {
  const url = `https://www.andhamlet.com/listings/${ahSlug}`;
  console.log(`\n[${slug}]  →  ${url}`);

  const html   = await fetchHtml(url);
  const images = extractGalleryImages(html);
  const desc   = extractDescription(html);
  const size   = sizeMap[ahSlug] || null;

  console.log(`  ✓ ${images.length} gallery images`);
  if (images.length > 0) console.log(`    hero: ${images[0].split('/').pop()}`);
  console.log(`  ✓ size: ${size ? size + ' m²' : 'not found'}`);
  console.log(`  ✓ description (${desc.length} chars): ${desc.slice(0, 80)}...`);

  return { images, description: desc, size, partnerUrl: url };
}

async function main() {
  const targetSlug = process.argv[2];
  const props      = JSON.parse(fs.readFileSync(PROPS_PATH, 'utf8'));
  const toProcess  = targetSlug
    ? (AH_MAP[targetSlug] ? { [targetSlug]: AH_MAP[targetSlug] } : (() => { throw new Error(`Unknown slug: ${targetSlug}`); })())
    : AH_MAP;

  console.log('Fetching m² data from andhamlet.com/homes...');
  const sizeMap = await fetchSizeMap();
  console.log(`  → ${Object.keys(sizeMap).length} properties with m² data`);

  let updated = 0;

  for (const [slug, ahSlug] of Object.entries(toProcess)) {
    try {
      const { images, description, size, partnerUrl } = await scrapeProperty(slug, ahSlug, sizeMap);

      const prop = props.find(p => p.slug === slug);
      if (!prop) { console.log(`  ✗ slug not in properties.json`); continue; }

      if (images.length > 0) {
        prop.images    = images.slice(0, 3);
        prop.img       = images[0];
        prop.allImages = images;
      }
      if (description.length > 80) prop.description = description;
      if (size) prop.size = size;
      prop.notes = partnerUrl;

      updated++;
      await new Promise(r => setTimeout(r, 1200));

    } catch (err) {
      console.log(`  ✗ Error: ${err.message}`);
    }
  }

  fs.writeFileSync(PROPS_PATH, JSON.stringify(props, null, 2));
  console.log(`\n✅ Done — updated ${updated} / ${Object.keys(toProcess).length} properties.`);
}

main().catch(err => { console.error(err); process.exit(1); });
