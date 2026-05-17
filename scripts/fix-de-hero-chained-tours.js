#!/usr/bin/env node
// Rewrites DE hero subtitles that chain "Von X über Y, Z bis zu A" into a
// single cleaner tour "Von A und B bis zu C und D". The over-stuffed
// "über X, Y" chains read as repetitive even though they're technically
// one Von…bis zu pair — David flagged this on the Germany page.
//
// Newer regional DE pillars (Costa del Sol, Sardinia, Marbella, Lake Como)
// already use the cleaner pattern and aren't touched.

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const HERO_TOUR_REPLACEMENTS = {
  'content/destinations/de/mallorca-fractional-ownership-properties.html':
    "Von einer Steinfinca bei Pollença und einer Tramuntana-Villa oberhalb von Port d'Andratx bis zu einem Stadthaus in der Altstadt von Palma und einem Bauernhaus an der Südküste bei Ses Salines",

  'content/destinations/de/french-alps-fractional-ownership-properties.html':
    "Von einem Pistenchalet oberhalb von Courchevel 1850 und einer Méribel-Wohnung an der Tougnète-Flanke bis zu einem Megève-Bauernhaus auf dem Mont-d'Arbois-Plateau und einem Chamonix-Duplex mit Blick auf die Aiguille du Midi",

  'content/destinations/de/italian-lakes-fractional-ownership-properties.html':
    "Von einer Belle-Époque-Villa oberhalb von Menaggio am Westufer des Comer Sees und einer Bellagio-Wohnung an der bewaldeten Halbinsel an der Seegabelung bis zu einem Sirmione-Stadthaus an der Thermalquellen-Halbinsel am Südende des Gardasees und einem Stresa-Palazzo vor den Borromäischen Inseln am Lago Maggiore",

  'content/destinations/de/spain-fractional-ownership-properties.html':
    "Von einer mallorquinischen Finca oberhalb von Pollença bis zu einer Marbella-Villa an der Goldenen Meile, einem Madrider Pied-à-terre in der Nähe des Prado und einem Baqueira-Chalet in den Pyrenäen",

  'content/destinations/de/france-fractional-ownership-properties.html':
    "Von den Belle-Époque-Apartments des 16. Arrondissements bis zu den Chalets der Drei Täler und den Villen von Cap d'Antibes",

  'content/destinations/de/italy-fractional-ownership-properties.html':
    "Von einer Comer-See-Villa mit eigenem Bootssteg bis zu einem Costa-Smeralda-Anwesen oberhalb der Gallura-Küste, einem toskanischen Podere im Chianti und einem Dolomiten-Chalet in Alta Badia",

  'content/destinations/de/usa-fractional-ownership-properties.html':
    "Von einer modernistischen Villa in Newport Beach am Pazifik bis zu einem Aspen-Ski-in-Chalet am Ajax Mountain, einem Brickell-Penthouse über der Biscayne Bay und einem Lowcountry-Haus am Meer auf Kiawah",

  'content/destinations/de/portugal-fractional-ownership-properties.html':
    "Von einer Vilamoura-Villa über dem Atlantik bis zu einem Cascais-Penthouse über der Tejo-Mündung, einem Comporta-Strandhaus zwischen den Schirmkiefern und einer Douro-Quinta am Fluss",

  'content/destinations/de/germany-fractional-ownership-properties.html':
    "Von einer Tegernsee-Villa unterhalb der Bayerischen Alpen und einem Reetdachhaus auf Sylt bis zu einem Bodensee-Anwesen mit Blick auf die Schweizer Berge und einem Apartment im Berliner Tiergarten",

  'content/destinations/de/austria-fractional-ownership-properties.html':
    "Von einem Tiroler Chalet oberhalb von Kitzbühel und einer Berghütte am Arlberg bis zu einem Salzkammergut-Haus am Wolfgangsee und einem Wiener Pied-à-terre in der Inneren Stadt",
};

let modified = 0;
let unchanged = 0;
let notFound = 0;

for (const [rel, newTour] of Object.entries(HERO_TOUR_REPLACEMENTS)) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    console.log(`  ? ${rel} — file not found`);
    notFound += 1;
    continue;
  }
  const content = fs.readFileSync(abs, 'utf8');
  const re = /(<p class="subtitle">)([^<]+?)( — )([^<]+?<\/p>)/;
  const m = content.match(re);
  if (!m) {
    console.log(`  ? ${rel} — subtitle pattern not found`);
    notFound += 1;
    continue;
  }
  const newSubtitleLine = m[1] + newTour + m[3] + m[4];
  const newContent = content.replace(re, newSubtitleLine);
  if (newContent === content) {
    console.log(`  = ${rel} — already at target wording`);
    unchanged += 1;
    continue;
  }
  fs.writeFileSync(abs, newContent, 'utf8');
  console.log(`  ✓ ${rel}`);
  modified += 1;
}

console.log(`\nDone. ${modified} modified, ${unchanged} already-clean, ${notFound} skipped.`);
