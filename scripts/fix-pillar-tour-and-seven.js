#!/usr/bin/env node
// Patches all completed regional pillars to address two issues David flagged:
//
// 1. "From X to Y to Z" property-type-in-place enumeration appears 3 times per page
//    (hero subtitle, mid-CTA, §A snippet). Should appear once — keep hero, simplify the
//    other two.
//
// 2. "alongside seven other co-owners" / "you and seven other owners" is too rigid —
//    buyers often acquire multiple shares, so the actual co-owner count is often <7.
//    Soften to "up to seven" / locale equivalent.
//
// Files affected (20):
//   EN: mallorca, french-alps, italian-lakes, costa-del-sol, sardinia, marbella, lake-como
//   DE: mallorca, french-alps, italian-lakes, costa-del-sol (DE for newer regions hasn't shipped)
//   ES: mallorca, french-alps, italian-lakes, costa-del-sol
//   FR: mallorca, french-alps, italian-lakes, costa-del-sol
//
// Mid-CTA edits are per-file (each has unique content). Snippet em-dash interjection
// + "seven" softening are regex-based.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEST = path.join(ROOT, 'content/destinations');

// All pillars that have been rewritten to the new standard. Includes regional
// pillars + country pillars (Spain/France/Italy/USA/Portugal + Austria/Germany).
const PILLARS = [
  // regions
  'mallorca', 'french-alps', 'italian-lakes', 'costa-del-sol', 'sardinia', 'marbella', 'lake-como',
  // countries (these all use the same snippet/callout/seven patterns)
  'spain', 'france', 'italy', 'usa', 'portugal', 'austria', 'germany',
];

// Slug → file paths to patch
const FILES_TO_PATCH = [];
for (const region of PILLARS) {
  const slug = `${region}-fractional-ownership-properties.html`;
  // EN
  const enPath = path.join(DEST, slug);
  if (fs.existsSync(enPath)) FILES_TO_PATCH.push({ path: enPath, locale: 'en', region });
  // DE / ES / FR
  for (const locale of ['de', 'es', 'fr']) {
    const p = path.join(DEST, locale, slug);
    if (fs.existsSync(p)) FILES_TO_PATCH.push({ path: p, locale, region });
  }
}

console.log(`Found ${FILES_TO_PATCH.length} files to patch:`);
FILES_TO_PATCH.forEach(f => console.log(`  ${f.locale}/${f.region}`));
console.log('');

// ── Patch 1: Soften "seven other co-owners" → "up to seven other co-owners"
// (and locale equivalents). Applies to BOTH the §A LLC paragraph body
// ("alongside seven other co-owners") AND the §A LLC callout
// ("you and seven other owners hold equal").

const SEVEN_PATCHES = {
  en: [
    // §A body: "alongside seven other co-owners"
    [/alongside seven other co-owners/g, 'alongside up to seven other co-owners'],
    // §A callout: "you and seven other owners hold equal LLC membership / equal membership"
    [/you and seven other owners hold equal/g, 'you and up to seven other owners hold equal'],
    // §F legal-nature paragraph: "you and your seven co-owners hold equal LLC membership"
    [/you and your seven co-owners hold/g, 'you and up to seven co-owners hold'],
    // §F mechanics paragraph: "you and seven other owners hold the property"
    [/you and seven other owners hold the property/g, 'you and up to seven other owners hold the property'],
    // §F mechanics variant: "you and seven other owners (across the LLC) hold..."
    [/through which you and seven other owners/g, 'through which you and up to seven other owners'],
  ],
  de: [
    // §A body: "gemeinsam mit sieben weiteren Miteigentümern"
    [/gemeinsam mit sieben weiteren Miteigentümern/g, 'gemeinsam mit bis zu sieben weiteren Miteigentümern'],
    // §A callout: "Sie zusammen mit sieben weiteren Eigentümern gleiche"
    [/Sie zusammen mit sieben weiteren Eigentümern gleiche/g, 'Sie zusammen mit bis zu sieben weiteren Eigentümern gleiche'],
    // §F legal-nature: "Sie und Ihre sieben Miteigentümer halten gleiche"
    [/Sie und Ihre sieben Miteigentümer halten/g, 'Sie und Ihre bis zu sieben Miteigentümer halten'],
    // §F legal-nature variant: "Sie und Ihre sieben Miteigentümer <strong>gleiche LLC-Geschäftsanteile"
    [/Sie und Ihre sieben Miteigentümer <strong>gleiche/g, 'Sie und Ihre bis zu sieben Miteigentümer <strong>gleiche'],
    // §F mechanics: "in der Sie und sieben weitere Eigentümer die Immobilie halten"
    [/Sie und sieben weitere Eigentümer die Immobilie halten/g, 'Sie und bis zu sieben weitere Eigentümer die Immobilie halten'],
    // §F mechanics alt: "Sie zusammen mit sieben weiteren Eigentümern die Immobilie halten"
    [/Sie zusammen mit sieben weiteren Eigentümern die Immobilie halten/g, 'Sie zusammen mit bis zu sieben weiteren Eigentümern die Immobilie halten'],
    // §A body (different variant): "an der Sie und sieben weitere Miteigentümer gleichberechtigt"
    [/an der Sie und sieben weitere Miteigentümer gleichberechtigt/g, 'an der Sie und bis zu sieben weitere Miteigentümer gleichberechtigt'],
    // §A body (Anteil variant): "Sie und sieben weitere Miteigentümer"
    [/(?<!bis zu )Sie und sieben weitere Miteigentümer/g, 'Sie und bis zu sieben weitere Miteigentümer'],
  ],
  es: [
    // §A body (tú): "junto con otros siete copropietarios"
    [/junto con otros siete copropietarios/g, 'junto a un pequeño grupo de copropietarios (hasta siete en total)'],
    // §A callout (tú, propietarios): "tú y otros siete propietarios tenéis participaciones iguales"
    [/tú y otros siete propietarios tenéis participaciones iguales/g, 'tú y un pequeño grupo de propietarios (hasta siete en total) tenéis participaciones iguales'],
    // §A callout (tú, copropietarios variant): "tú y otros siete copropietarios tenéis participaciones iguales"
    [/tú y otros siete copropietarios tenéis participaciones iguales/g, 'tú y un pequeño grupo de copropietarios (hasta siete en total) tenéis participaciones iguales'],
    // §A timeshare callout: "tú y otros siete copropietarios sois titulares"
    [/tú y otros siete copropietarios sois titulares/g, 'tú y un pequeño grupo de copropietarios (hasta siete en total) sois titulares'],
    [/tú y otros siete propietarios sois titulares/g, 'tú y un pequeño grupo de propietarios (hasta siete en total) sois titulares'],
    // §F legal-nature: "tú y tus siete copropietarios tenéis"
    [/tú y tus siete copropietarios tenéis/g, 'tú y un pequeño grupo de copropietarios (hasta siete en total) tenéis'],
    // §F mechanics (usted form): "usted y otros siete copropietarios tienen la casa"
    [/usted y otros siete copropietarios tienen la casa/g, 'usted y un pequeño grupo de copropietarios (hasta siete en total) tienen la casa'],
    [/usted y otros siete copropietarios tienen el bien/g, 'usted y un pequeño grupo de copropietarios (hasta siete en total) tienen el bien'],
    [/usted y otros siete propietarios tienen la casa/g, 'usted y un pequeño grupo de propietarios (hasta siete en total) tienen la casa'],
    // §F legal-nature (usted form): "usted y sus siete copropietarios tienen participaciones iguales"
    [/usted y sus siete copropietarios tienen <strong>participaciones iguales/g, 'usted y un pequeño grupo de copropietarios (hasta siete en total) tienen <strong>participaciones iguales'],
    [/usted y sus siete copropietarios tienen participaciones iguales/g, 'usted y un pequeño grupo de copropietarios (hasta siete en total) tienen participaciones iguales'],
    // §F mechanics (tú form): "tú y otros siete copropietarios tenéis la propiedad"
    [/tú y otros siete copropietarios (sois titulares|tenéis la propiedad|tenéis la casa)/g, 'tú y un pequeño grupo de copropietarios (hasta siete en total) $1'],
  ],
  fr: [
    // §A body: "aux côtés de sept autres copropriétaires"
    [/aux côtés de sept autres copropriétaires/g, "aux côtés d'un petit groupe de copropriétaires (sept au maximum)"],
    // §A callout (propriétaires variant): "vous et sept autres propriétaires détenez des parts égales"
    [/vous et sept autres propriétaires détenez des parts égales/g, 'vous et un petit groupe de copropriétaires (sept au maximum) détenez des parts égales'],
    // §A callout (copropriétaires variant): "vous et sept autres copropriétaires détenez des parts égales"
    [/vous et sept autres copropriétaires détenez des parts égales/g, 'vous et un petit groupe de copropriétaires (sept au maximum) détenez des parts égales'],
    // §F legal-nature: "vous et vos sept copropriétaires détenez"
    [/vous et vos sept copropriétaires détenez/g, "vous et un petit groupe de copropriétaires (sept au maximum) détenez"],
    // §F mechanics: "vous et sept autres copropriétaires êtes titulaires à part égale"
    [/vous et sept autres copropriétaires êtes titulaires à part égale/g, "vous et un petit groupe de copropriétaires (sept au maximum) êtes titulaires à part égale"],
    // §F mechanics: "vous et sept autres propriétaires détenez le bien"
    [/vous et sept autres propriétaires détenez le bien/g, "vous et un petit groupe de copropriétaires (sept au maximum) détenez le bien"],
    // §F mechanics: "par laquelle vous et sept autres copropriétaires détenez"
    [/par laquelle vous et sept autres copropriétaires détenez/g, "par laquelle vous et un petit groupe de copropriétaires (sept au maximum) détenez"],
  ],
};

// ── Patch 2: §A snippet — drop the property-type-place em-dash interjection
// Pattern: "share of a luxury [adjective?] second home — [INTERJECTION] — held in a purpose-built LLC"
// We want to drop just the [INTERJECTION] between the two em-dashes (which is the
// 3rd "from X to Y to Z" instance). Each locale uses different verbs/syntax so we
// match per-locale.
//
// Strategy: lookup the canonical opening phrase + the canonical closing phrase
// and remove everything between them (including the em-dashes).

const SNIPPET_PATCHES = {
  en: [
    // "share of a luxury [adjective?] second home — [INTERJECTION] — held in a purpose-built LLC"
    // The regional adjective is optional. Drops only the [INTERJECTION] between the two em-dashes.
    {
      pattern: /(share of a luxury (?:[^—]*? )?second home) — [^—]*? — (held in a purpose-built LLC alongside)/g,
      replace: '$1 — $2',
    },
  ],
  de: [
    {
      // Handles "an einer Luxus-Ferienimmobilie", "an einer Luxus-Ferienimmobilie am Mittelmeer",
      // and adjective-form "an einer luxuriösen [adj] Ferienimmobilie [trailing-phrase?]"
      pattern: /(1\/8-Anteil an einer (?:Luxus-Ferienimmobilie|luxuriösen (?:[^—]*? )?Ferienimmobilie)(?:[^—]*?)? zu erwerben) — [^—]*? — (gehalten in einer eigens dafür gegründeten LLC)/g,
      replace: '$1 — $2',
    },
  ],
  es: [
    {
      pattern: /(fracción escriturada de 1\/8 de una segunda casa de lujo(?:[^—]*?)?) — [^—]*? — (constituida en una LLC)/g,
      replace: '$1 — $2',
    },
  ],
  fr: [
    {
      pattern: /(part actée de 1\/8 d'une résidence secondaire de luxe(?:[^—]*?)?) — [^—]*? — (détenue au sein d'une LLC)/g,
      replace: '$1 — $2',
    },
  ],
};

// ── Patch 3: Mid-CTA simplification — drop parenthetical sub-zone enumeration.
// Each file has a unique mid-CTA paragraph, so we do per-file replacements.

const MID_CTA_REPLACEMENTS = {
  // ── Mallorca: EN/DE/ES/FR mid-CTAs already lack parenthetical sub-zone lists; skip.

  // ── French Alps
  'french-alps/en': [
    [
      'Fully managed chalets, apartments and farmhouses across <strong>the Trois Vallées</strong> (Courchevel, Méribel, Val Thorens), <strong>the Espace Killy</strong> (Val d\'Isère, Tignes), <strong>Megève</strong>, the <strong>Chamonix-Mont-Blanc valley</strong> and the <strong>Portes du Soleil</strong> (Avoriaz, Morzine, Les Gets)',
      'Fully managed chalets, apartments and farmhouses across <strong>the Trois Vallées, the Espace Killy, Megève, Chamonix-Mont-Blanc and the Portes du Soleil</strong>',
    ],
  ],
  'french-alps/de': [
    [
      "Rundum verwaltete Chalets, Wohnungen und Bergvillen in den <strong>Trois Vallées</strong> rund um Courchevel, Méribel und Val Thorens, im <strong>Espace Killy</strong> rund um Val d'Isère und Tignes, in <strong>Megève</strong> und im Mont-Blanc-Land, in <strong>Chamonix-Mont-Blanc</strong> selbst und in den <strong>Portes du Soleil</strong> rund um Morzine und Avoriaz",
      'Rundum verwaltete Chalets, Wohnungen und Bergvillen in den <strong>Trois Vallées, im Espace Killy, in Megève, in Chamonix-Mont-Blanc und in den Portes du Soleil</strong>',
    ],
  ],
  'french-alps/es': [
    [
      "Chalets, apartamentos y villas totalmente gestionados en <strong>los Tres Valles (Courchevel, Méribel, Val Thorens)</strong>, <strong>el Espace Killy (Val d'Isère y Tignes)</strong>, <strong>Megève y el país del Mont Blanc</strong>, <strong>Chamonix-Mont-Blanc</strong> y <strong>Morzine, Avoriaz y los Portes du Soleil</strong>",
      'Chalets, apartamentos y villas totalmente gestionados en <strong>los Tres Valles, el Espace Killy, Megève, Chamonix-Mont-Blanc y los Portes du Soleil</strong>',
    ],
  ],
  'french-alps/fr': [
    [
      "Chalets, appartements, résidences contemporaines et maisons de village entièrement gérés à travers <strong>les Trois Vallées (Courchevel, Méribel, Val Thorens)</strong>, <strong>l'Espace Killy (le Val d'Isère et Tignes)</strong>, <strong>Megève et le pays du Mont-Blanc</strong>, <strong>Chamonix-Mont-Blanc</strong>, et <strong>les Portes du Soleil (Morzine, Avoriaz, les Gets)</strong>",
      "Chalets, appartements, résidences contemporaines et maisons de village entièrement gérés à travers <strong>les Trois Vallées, l'Espace Killy, Megève, Chamonix-Mont-Blanc et les Portes du Soleil</strong>",
    ],
  ],
  // ── Italian Lakes
  'italian-lakes/en': [
    [
      'Fully managed villas, apartments and townhouses across <strong>Lake Como</strong> (Bellagio, Menaggio, Tremezzina, Como town, Domaso), <strong>Lake Garda</strong> (Sirmione, Salò, Gardone Riviera, Bardolino, Malcesine, Riva del Garda) and <strong>Lago Maggiore</strong> (Stresa, Baveno, the Borromean Islands, Laveno)',
      'Fully managed villas, apartments and townhouses across <strong>Lake Como, Lake Garda and Lago Maggiore</strong>',
    ],
  ],
  'italian-lakes/de': [
    [
      'Rundum verwaltete Villen, Apartments und Bauernhäuser am <strong>Comer See (Lago di Como)</strong> rund um Bellagio, Menaggio und Tremezzo, am <strong>Gardasee</strong> rund um Sirmione, Torri del Benaco und Salò, am <strong>Lago Maggiore</strong> rund um Stresa und die <strong>Borromäischen Inseln</strong> sowie an den kleineren oberitalienischen Seen Iseo, Orta und Lugano',
      'Rundum verwaltete Villen, Apartments und Bauernhäuser am <strong>Comer See, am Gardasee, am Lago Maggiore</strong> und an den kleineren oberitalienischen Seen',
    ],
  ],
  'italian-lakes/es': [
    [
      'Villas, apartamentos y casas totalmente gestionadas en <strong>el Lago de Como (Bellagio, Menaggio, Tremezzina, Varenna)</strong>, <strong>el Lago de Garda (Sirmione, Lazise, Torri del Benaco, Salò)</strong>, <strong>el Lago Mayor (Stresa, Verbania y las Islas Borromeas)</strong> y <strong>los lagos más pequeños del piedemonte alpino (Orta, Iseo, Lugano)</strong>',
      'Villas, apartamentos y casas totalmente gestionadas en <strong>el Lago de Como, el Lago de Garda, el Lago Mayor</strong> y los lagos más pequeños del piedemonte alpino',
    ],
  ],
  'italian-lakes/fr': [
    [
      "Villas historiques, appartements lacustres, demeures Belle Époque et maisons de village entièrement gérées sur <strong>le lac de Côme (Bellagio, Cernobbio, Tremezzo, Menaggio, Varenna)</strong>, <strong>le lac de Garde (Sirmione, Salò, Gardone Riviera, Torri del Benaco, Lazise)</strong>, <strong>le lac Majeur (Stresa, Verbania, Cannobio et les îles Borromées)</strong>, et <strong>le lac d'Orta (Orta San Giulio)</strong>",
      "Villas historiques, appartements lacustres, demeures Belle Époque et maisons de village entièrement gérées sur <strong>le lac de Côme, le lac de Garde, le lac Majeur et le lac d'Orta</strong>",
    ],
  ],
  // ── Costa del Sol
  'costa-del-sol/en': [
    [
      'Fully managed villas, apartments and penthouses across <strong>Marbella and the Golden Mile</strong> (Sierra Blanca, Nueva Andalucía, Puerto Banús), <strong>Sotogrande</strong> (Valderrama, La Reserva, the marina), <strong>Estepona</strong>, <strong>Benahavís</strong> and the inland sierra villages, and the <strong>Mijas Costa</strong> corridor (Fuengirola, El Higuerón, Calahonda)',
      'Fully managed villas, apartments and penthouses across <strong>Marbella and the Golden Mile, Sotogrande, Estepona, Benahavís and the Mijas Costa corridor</strong>',
    ],
  ],
  'costa-del-sol/de': [
    [
      'Rundum verwaltete Villen, Apartments und Penthouse-Wohnungen in <strong>Marbella und an der Goldenen Meile</strong> (Sierra Blanca, Nueva Andalucía, Puerto Banús), in <strong>Sotogrande</strong> (Valderrama, La Reserva, am Yachthafen), in <strong>Estepona</strong>, in <strong>Benahavís</strong> und in den Bergdörfern des Hinterlands sowie entlang des <strong>Mijas-Costa-Korridors</strong> (Fuengirola, El Higuerón, Calahonda)',
      'Rundum verwaltete Villen, Apartments und Penthouse-Wohnungen in <strong>Marbella und an der Goldenen Meile, in Sotogrande, in Estepona, in Benahavís und entlang des Mijas-Costa-Korridors</strong>',
    ],
  ],
  'costa-del-sol/es': [
    [
      'Villas, apartamentos y casas totalmente gestionadas en <strong>Marbella y la Milla de Oro (Puerto Banús, Sierra Blanca, Nueva Andalucía, casco antiguo)</strong>, <strong>Estepona (casco antiguo y nueva costa)</strong>, <strong>Sotogrande (puerto deportivo, Valderrama, La Reserva)</strong>, <strong>Benahavís (La Zagaleta, Los Arqueros, La Quinta)</strong>, <strong>Fuengirola y Mijas Costa (El Higuerón, Reserva del Higuerón, Carvajal)</strong> y los <strong>pueblos blancos del interior (Mijas Pueblo, Casares, Istán, Ojén)</strong>',
      'Villas, apartamentos y casas totalmente gestionadas en <strong>Marbella y la Milla de Oro, Estepona, Sotogrande, Benahavís, Fuengirola y Mijas Costa</strong>, y los <strong>pueblos blancos del interior</strong>',
    ],
  ],
  // costa-del-sol/fr already lacks parens; skip.
};

// ── Patch 4: Per-region snippet — add regional adjective where missing (Mallorca only)
// and ensure ES/FR/DE inflection works after dropping the example list.
// (Most files won't need this — the regex above keeps existing adjectives.)

let totalPatches = 0;
let filesModified = 0;

for (const file of FILES_TO_PATCH) {
  let content = fs.readFileSync(file.path, 'utf8');
  const before = content;
  let patchesInFile = 0;

  // Apply "seven" softening
  const sevenPatches = SEVEN_PATCHES[file.locale] || [];
  for (const [pat, rep] of sevenPatches) {
    const newContent = content.replace(pat, rep);
    if (newContent !== content) patchesInFile += (content.match(pat) || []).length;
    content = newContent;
  }

  // Apply snippet em-dash interjection removal
  const snippetPatches = SNIPPET_PATCHES[file.locale] || [];
  for (const { pattern, replace } of snippetPatches) {
    const newContent = content.replace(pattern, replace);
    if (newContent !== content) patchesInFile += 1;
    content = newContent;
  }

  // Apply mid-CTA simplification (per-file)
  const key = `${file.region}/${file.locale}`;
  const midCta = MID_CTA_REPLACEMENTS[key] || [];
  for (const [old, neu] of midCta) {
    if (content.includes(old)) {
      content = content.replace(old, neu);
      patchesInFile += 1;
    }
  }

  if (content !== before) {
    fs.writeFileSync(file.path, content, 'utf8');
    filesModified += 1;
    totalPatches += patchesInFile;
    console.log(`  ✓ ${file.locale}/${file.region}  (${patchesInFile} patches)`);
  } else {
    console.log(`  - ${file.locale}/${file.region}  (no changes — patterns not found)`);
  }
}

console.log(`\nDone. ${filesModified}/${FILES_TO_PATCH.length} files modified, ${totalPatches} total patches applied.`);
