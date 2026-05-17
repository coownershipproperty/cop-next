#!/usr/bin/env node
// Rewrites hero subtitles in FR + ES pillar pages that contain chained
// "from X to Y, from A to B, from C to D" rhetoric. The new versions use
// a SINGLE tour ("from X and Y to A and B" or "from X to Y, A and B") to
// match the EN single-tour pattern. The post-em-dash value-prop text is
// preserved exactly.

const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// Each entry: relative path → new pre-em-dash text (the single tour).
// The post-em-dash text is left untouched.
const HERO_TOUR_REPLACEMENTS = {
  // ── FR ──────────────────────────────────────────────────────────────
  'content/destinations/fr/mallorca-fractional-ownership-properties.html':
    "D'une finca en pierre près de Pollença et d'une villa de la Tramuntana au-dessus de Port d'Andratx à une maison de ville dans la vieille ville de Palma et une casita près de Ses Salines",

  'content/destinations/fr/french-alps-fractional-ownership-properties.html':
    "D'un chalet ski-aux-pieds au-dessus de Courchevel 1850 et d'un appartement à Méribel sur le flanc de la Tougnète à une ferme à Megève sur le plateau du Mont d'Arbois et un duplex à Chamonix avec l'Aiguille du Midi en toile de fond",

  'content/destinations/fr/italian-lakes-fractional-ownership-properties.html':
    "D'une villa Belle Époque au-dessus de Menaggio sur la rive occidentale du lac de Côme et d'un appartement à Bellagio sur le promontoire boisé à une maison de ville à Sirmione sur la péninsule thermale du lac de Garde et un palais à Stresa face aux îles Borromées sur le lac Majeur",

  'content/destinations/fr/costa-del-sol-fractional-ownership-properties.html':
    "D'une villa à Sierra Blanca au-dessus de la Milla de Oro de Marbella et d'un appartement à Puerto Banús donnant sur le port de yachts à une villa de golf à Sotogrande aux côtés du Valderrama et une résidence de resort à El Higuerón au-dessus de Fuengirola, la Méditerranée s'ouvrant vers le sud",

  'content/destinations/fr/sardinia-fractional-ownership-properties.html':
    "D'une villa en granit au-dessus de Porto Cervo sur la Costa Smeralda et d'un appartement vue mer à Palau ouvrant sur l'archipel de La Maddalena à une maison de ville d'inspiration catalane dans les remparts médiévaux d'Alghero et une villa basse parmi les dunes de Chia sur la côte sud",

  'content/destinations/fr/lake-como-fractional-ownership-properties.html':
    "D'un appartement Belle Époque au-dessus de Menaggio sur la rive occidentale et d'une maison de village à Bellagio sur le promontoire boisé où les trois bras du lac se rejoignent à une villa avec jardin à Cernobbio sur la rive prestigieuse sous Côme et un penthouse contemporain sur la large rive nord",

  'content/destinations/fr/spain-fractional-ownership-properties.html':
    "D'une finca majorquine au-dessus de Pollença à une villa de Marbella sur la Golden Mile, un pied-à-terre madrilène près du Prado et un chalet à Baqueira dans les Pyrénées",

  'content/destinations/fr/italy-fractional-ownership-properties.html':
    "D'une villa du lac de Côme avec son propre ponton à un domaine sur la Costa Smeralda dominant la côte de Gallura, un podere toscan en Chianti et un chalet des Dolomites en Alta Badia",

  'content/destinations/fr/usa-fractional-ownership-properties.html':
    "D'une maison moderniste de Newport Beach donnant sur le Pacifique à un chalet ski-aux-portes à Aspen sur le mont Ajax, un penthouse à Brickell au-dessus de Biscayne Bay et une résidence en bord de mer du Lowcountry à Kiawah",

  'content/destinations/fr/portugal-fractional-ownership-properties.html':
    "D'une villa à Vilamoura surplombant l'Atlantique à un penthouse à Cascais au-dessus de l'embouchure du Tage, une maison de plage à Comporta dans les pins parasols et une quinta du Douro en bord de fleuve",

  // ── ES ──────────────────────────────────────────────────────────────
  'content/destinations/es/mallorca-fractional-ownership-properties.html':
    "De una finca de piedra cerca de Pollença y una villa de la Tramuntana sobre Port d'Andratx a una casa de pueblo en el casco antiguo de Palma y una casita en la costa sur cerca de Ses Salines",

  'content/destinations/es/french-alps-fractional-ownership-properties.html':
    "De un chalet ski-in ski-out sobre Courchevel 1850 y un apartamento en Méribel en la ladera de Tougnète a una granja en Megève en la meseta del Mont d'Arbois y un dúplex en Chamonix con la Aiguille du Midi llenando la ventana",

  'content/destinations/es/italian-lakes-fractional-ownership-properties.html':
    "De una villa Belle Époque sobre Menaggio en la orilla occidental del Lago de Como y un apartamento en Bellagio en el promontorio boscoso a una casa de pueblo en Sirmione en la península termal del Lago de Garda y un palacio en Stresa frente a las Islas Borromeas del Lago Mayor",

  'content/destinations/es/costa-del-sol-fractional-ownership-properties.html':
    "De una villa en Sierra Blanca sobre la Milla de Oro de Marbella y un apartamento en Puerto Banús con vistas al puerto deportivo a una villa de golf en Sotogrande junto a Valderrama y una residencia de resort en El Higuerón sobre Fuengirola con el Mediterráneo abriéndose al sur",

  'content/destinations/es/spain-fractional-ownership-properties.html':
    "De una finca mallorquina sobre Pollença a una villa en la Milla de Oro de Marbella, un pied-à-terre madrileño junto al Prado y un chalet en Baqueira en los Pirineos",

  'content/destinations/es/italy-fractional-ownership-properties.html':
    "De una villa en el Lago de Como con su propio embarcadero a un complejo en la Costa Esmeralda sobre la costa de Gallura, un podere toscano en Chianti y un chalet de los Dolomitas en Alta Badia",

  'content/destinations/es/usa-fractional-ownership-properties.html':
    "De una casa modernista en Newport Beach sobre el Pacífico a un chalet ski-in en Aspen sobre el monte Ajax, un ático en Brickell sobre Biscayne Bay y una casa frente al mar del Lowcountry en Kiawah",

  'content/destinations/es/portugal-fractional-ownership-properties.html':
    "De una villa en Vilamoura sobre el Atlántico a un penthouse en Cascais sobre la desembocadura del Tajo, una casa de playa en Comporta entre los pinos parasol y una quinta del Duero junto al río",
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

  // Match the subtitle line and capture everything up to the em-dash (—)
  // The replacement keeps everything after " — " intact.
  const re = /(<p class="subtitle">)([^<]+?)( — )([^<]+?<\/p>)/;
  const m = content.match(re);
  if (!m) {
    console.log(`  ? ${rel} — subtitle pattern not found`);
    notFound += 1;
    continue;
  }
  const afterDash = m[4];

  // Force-apply the curated single-tour replacement (audit was done
  // separately in Python — that's authoritative).
  const newSubtitleLine = m[1] + newTour + m[3] + afterDash;
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
