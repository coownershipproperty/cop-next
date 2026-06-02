/**
 * lib/geo-destinations.js
 *
 * Maps a visitor's detected city (from Vercel edge geo headers) to a COP
 * destination that we have properties in. Used by /api/geo-match to show a
 * contextual "In Mallorca? See homes nearby →" nudge in the bottom-right
 * corner (components/GeoDestinationNudge.js).
 *
 * Format:
 *   {
 *     country:    'Spain',      // matches properties.json country
 *     region:     'Mallorca',   // matches properties.json region
 *     slug:       'mallorca',   // used in /our-homes/?country=Spain&region=Mallorca
 *     label:      'Mallorca',   // human label for the chip ("In Mallorca?")
 *     cities:     [...]         // lowercase city names that trigger this match
 *   }
 *
 * Matching is case-insensitive and uses normalized strings (accents stripped).
 * Add more cities as needed — the gazetteer should cover any city a visitor
 * could plausibly be in within ~50km of a COP property cluster, even if we
 * don't have a property in that exact city (e.g. someone in Manacor should
 * still get a Mallorca prompt even though our nearest home is in Palma).
 */

export const DESTINATIONS = [
  // ─── Mediterranean (highest summer conversion opportunity) ───────────────
  {
    country: 'Spain', region: 'Mallorca', slug: 'mallorca', label: 'Mallorca',
    cities: [
      'palma', 'palma de mallorca', 'manacor', 'andratx', 'port d\'andratx', 'port d andratx',
      'pollensa', 'pollença', 'puerto pollensa', 'port de pollença', 'alcudia', 'alcúdia',
      'port d\'alcudia', 'port d alcudia', 'inca', 'calvia', 'calvià', 'soller', 'sóller',
      'port de soller', 'felanitx', 'santanyi', 'santanyí', 'ses salines', 'campos',
      'cala d\'or', 'cala d or', 'cala major', 'cala vinyes', 'cala llamp', 'cala llonga',
      'cala ratjada', 'cala millor', 'cala bona', 'nova santa ponsa', 'santa ponsa',
      'magaluf', 'palmanova', 'illetas', 'sa rapita', 'sa ràpita', 'portocolom',
      'porto cristo', 'son veri nou', 'puig de ros', 'peguera', 'paguera',
      'puerto de pollensa', 'ciudad jardin', 'muro', 'arenal', 'binissalem',
    ],
  },
  {
    country: 'Spain', region: 'Ibiza', slug: 'ibiza', label: 'Ibiza',
    cities: [
      'ibiza', 'ibiza town', 'ibiza stadt', 'eivissa', 'sant antoni', 'san antonio',
      'sant antoni de portmany', 'santa eulalia', 'santa eulalia del rio', 'santa eularia',
      'cala tarida', 'cala codolar', 'cala llonga', 'cala vadella', 'playa d\'en bossa',
      'playa d en bossa', 'platja d\'en bossa', 'sant josep', 'san jose', 'es cana',
      'cala bassa', 'cala salada', 'port des torrent', 'sant joan',
    ],
  },
  {
    country: 'Spain', region: 'Menorca', slug: 'menorca', label: 'Menorca',
    cities: [
      'mahon', 'mahón', 'mao', 'maó', 'ciutadella', 'ciudadela', 'fornells', 'es castell',
      'alaior', 'sant lluis', 'punta prima',
    ],
  },
  {
    country: 'Spain', region: 'Tenerife', slug: 'tenerife', label: 'Tenerife',
    cities: [
      'santa cruz de tenerife', 'santa cruz', 'san cristobal de la laguna', 'la laguna',
      'puerto de la cruz', 'adeje', 'costa adeje', 'playa de las americas',
      'los cristianos', 'callao salvaje', 'playa san juan', 'playa paraiso',
      'el medano', 'el médano', 'la caleta', 'arona', 'guia de isora', 'icod',
    ],
  },
  {
    country: 'Spain', region: 'Costa del Sol', slug: 'costa-del-sol', label: 'Costa del Sol',
    cities: [
      'malaga', 'málaga', 'marbella', 'estepona', 'fuengirola', 'benalmadena', 'benalmádena',
      'mijas', 'torremolinos', 'benahavis', 'benahavís', 'san pedro de alcantara',
      'puerto banus', 'puerto banús', 'sotogrande', 'manilva', 'casares', 'nerja',
      'torre del mar', 'rincon de la victoria', 'rincón de la victoria', 'velez-malaga',
      'ojen', 'ojén', 'higueron', 'higuerón', 'la cala', 'el rosario',
    ],
  },
  {
    country: 'Spain', region: 'Costa Blanca', slug: 'costa-blanca', label: 'Costa Blanca',
    cities: [
      'alicante', 'denia', 'dénia', 'javea', 'jávea', 'xabia', 'calpe', 'calp',
      'benidorm', 'altea', 'moraira', 'el campello', 'santa pola', 'torrevieja',
      'orihuela', 'orihuela costa', 'guardamar', 'la marina', 'cumbre del sol',
      'pedreguer', 'els poblets', 'la nucia',
    ],
  },
  {
    country: 'Spain', region: 'Madrid', slug: 'madrid', label: 'Madrid',
    cities: ['madrid', 'pozuelo', 'pozuelo de alarcon', 'majadahonda', 'las rozas'],
  },
  {
    country: 'Spain', region: 'Canary Islands', slug: 'canary-islands', label: 'the Canary Islands',
    cities: [
      // Gran Canaria
      'las palmas', 'las palmas de gran canaria', 'maspalomas', 'playa del ingles',
      'puerto de mogan', 'puerto rico',
      // Lanzarote
      'arrecife', 'puerto del carmen', 'playa blanca', 'costa teguise',
      // Fuerteventura
      'corralejo', 'caleta de fuste', 'morro jable',
      // La Palma
      'santa cruz de la palma', 'los llanos',
    ],
  },

  // ─── France ──────────────────────────────────────────────────────────────
  {
    country: 'France', region: "Côte d'Azur", slug: 'cote-d-azur', label: "the Côte d'Azur",
    cities: [
      'nice', 'cannes', 'antibes', 'juan-les-pins', 'saint-tropez', 'saint tropez',
      'monaco', 'monte carlo', 'menton', 'grasse', 'vence', 'saint-paul-de-vence',
      'cagnes-sur-mer', 'beaulieu-sur-mer', 'villefranche-sur-mer', 'eze', 'èze',
      'mougins', 'grimaud', 'valbonne', 'sainte-maxime', 'villeneuve-loubet',
      'vallauris', 'saint-raphael', 'saint raphaël', 'frejus', 'fréjus', 'les issambres',
      'mandelieu', 'la napoule', 'roquebrune', 'cap d\'antibes', 'le rouret',
      'mouans-sartoux', 'biot', 'bormes-les-mimosas', 'la garde-freinet', 'lavandou',
    ],
  },
  {
    country: 'France', region: 'Paris', slug: 'paris', label: 'Paris',
    cities: [
      'paris', 'neuilly-sur-seine', 'neuilly', 'levallois-perret', 'boulogne-billancourt',
      'saint-cloud', 'versailles', 'saint-germain-en-laye',
    ],
  },
  {
    country: 'France', region: 'French Alps', slug: 'french-alps', label: 'the French Alps',
    cities: [
      'chamonix', 'chamonix-mont-blanc', 'megeve', 'megève', 'morzine', 'avoriaz',
      'courchevel', 'meribel', 'méribel', 'val-d\'isere', 'val d isere', 'val thorens',
      'tignes', 'les arcs', 'la plagne', 'les gets', 'samoens', 'samoëns',
      'flaine', 'saint-gervais', 'la clusaz', 'le grand-bornand', 'annecy',
      'thonon-les-bains', 'evian', 'évian-les-bains', 'grenoble',
    ],
  },

  // ─── Italy ───────────────────────────────────────────────────────────────
  {
    country: 'Italy', region: 'Lake Como', slug: 'lake-como', label: 'Lake Como',
    cities: [
      'como', 'bellagio', 'menaggio', 'varenna', 'lecco', 'domaso', 'tremezzo',
      'cernobbio', 'lenno', 'argegno', 'gravedona', 'colico', 'cadenabbia',
    ],
  },
  {
    country: 'Italy', region: 'Lake Garda', slug: 'lake-garda', label: 'Lake Garda',
    cities: [
      'sirmione', 'desenzano del garda', 'desenzano', 'bardolino', 'lazise', 'garda',
      'riva del garda', 'limone sul garda', 'malcesine', 'salò', 'salo', 'gardone',
      'torri del benaco', 'cavaion veronese', 'verona',
    ],
  },
  {
    country: 'Italy', region: 'Italian Lakes', slug: 'italian-lakes', label: 'the Italian Lakes',
    cities: [
      // Maggiore + Iseo etc.
      'stresa', 'verbania', 'laveno', 'arona', 'baveno', 'cannobio', 'pallanza',
      'iseo', 'sarnico',
    ],
  },
  {
    country: 'Italy', region: 'Tuscany', slug: 'tuscany', label: 'Tuscany',
    cities: [
      'florence', 'firenze', 'siena', 'pisa', 'lucca', 'arezzo', 'cortona', 'montepulciano',
      'pienza', 'san gimignano', 'volterra', 'chianti', 'greve in chianti', 'radda',
      'castellina', 'montalcino', 'massa marittima', 'grosseto', 'castiglione',
    ],
  },
  {
    country: 'Italy', region: 'Liguria', slug: 'liguria', label: 'Liguria',
    cities: [
      'genoa', 'genova', 'portofino', 'santa margherita ligure', 'rapallo', 'sestri levante',
      'lerici', 'la spezia', 'cinque terre', 'monterosso', 'vernazza', 'manarola',
      'corniglia', 'riomaggiore', 'sanremo', 'san remo', 'imperia', 'savona',
      'alassio', 'ospedaletti', 'apricale', 'laigueglia', 'loano', 'diano marina',
    ],
  },
  {
    country: 'Italy', region: 'Sardinia', slug: 'sardinia', label: 'Sardinia',
    cities: [
      'cagliari', 'olbia', 'porto cervo', 'costa smeralda', 'palau', 'arzachena',
      'san teodoro', 'alghero', 'porto rotondo', 'la maddalena', 'budoni',
      'pula', 'villasimius', 'chia',
    ],
  },
  {
    country: 'Italy', region: 'Milan', slug: 'milan', label: 'Milan',
    cities: ['milan', 'milano', 'monza'],
  },

  // ─── Portugal ────────────────────────────────────────────────────────────
  {
    country: 'Portugal', region: 'Algarve', slug: 'algarve', label: 'the Algarve',
    cities: [
      'faro', 'vilamoura', 'quarteira', 'albufeira', 'lagos', 'portimao', 'portimão',
      'tavira', 'sagres', 'lagoa', 'silves', 'almancil', 'quinta do lago',
      'vale do lobo', 'olhão', 'olhao', 'monte gordo', 'praia da rocha', 'carvoeiro',
    ],
  },
  {
    country: 'Portugal', region: 'Lisbon', slug: 'lisbon', label: 'Lisbon',
    cities: [
      'lisbon', 'lisboa', 'cascais', 'estoril', 'sintra', 'oeiras', 'queluz',
      'almada', 'setubal', 'setúbal',
    ],
  },
  {
    country: 'Portugal', region: 'Silver Coast', slug: 'silver-coast', label: 'the Silver Coast',
    cities: [
      'ericeira', 'nazaré', 'nazare', 'peniche', 'obidos', 'óbidos', 'caldas da rainha',
      'sao martinho do porto', 'são martinho do porto',
    ],
  },

  // ─── UK ──────────────────────────────────────────────────────────────────
  {
    country: 'England', region: 'Cotswolds', slug: 'cotswolds', label: 'the Cotswolds',
    cities: [
      'cheltenham', 'cirencester', 'stow-on-the-wold', 'stow on the wold', 'burford',
      'chipping norton', 'bourton-on-the-water', 'bourton on the water', 'broadway',
      'moreton-in-marsh', 'tetbury', 'painswick', 'chipping campden', 'winchcombe',
      'stroud', 'lechlade', 'fairford', 'minchinhampton',
    ],
  },
  {
    country: 'England', region: 'London', slug: 'london', label: 'London',
    cities: [
      'london', 'city of london', 'greater london', 'westminster', 'camden',
      'islington', 'hackney', 'kensington', 'chelsea', 'fulham', 'hammersmith',
      'mayfair', 'belgravia', 'marylebone', 'notting hill', 'shoreditch',
      'wandsworth', 'lambeth', 'southwark', 'richmond', 'wimbledon',
    ],
  },

  // ─── Austria ─────────────────────────────────────────────────────────────
  {
    country: 'Austria', region: 'Tyrol', slug: 'tyrol', label: 'Tyrol',
    cities: [
      'innsbruck', 'kitzbuhel', 'kitzbühel', 'brixen', 'brixen im thale', 'kirchberg',
      'st. johann in tirol', 'going am wilden kaiser', 'soll', 'söll', 'westendorf',
      'ellmau', 'mayrhofen', 'zell am ziller', 'ischgl', 'see', 'galtür', 'galtur',
    ],
  },
  {
    country: 'Austria', region: 'Salzburger Land', slug: 'salzburger-land', label: 'Salzburger Land',
    cities: [
      'salzburg', 'zell am see', 'kaprun', 'saalbach', 'hinterglemm', 'leogang',
      'neukirchen', 'neukirchen am grossvenediger', 'hollersbach', 'mittersill',
      'st. johann im pongau', 'wagrain',
    ],
  },
  {
    country: 'Austria', region: 'Vorarlberg', slug: 'vorarlberg', label: 'Vorarlberg',
    cities: [
      'bregenz', 'dornbirn', 'feldkirch', 'bludenz', 'lech', 'zurs', 'zürs', 'stuben',
      'burserberg', 'bürserberg', 'st. anton', 'st anton am arlberg',
    ],
  },

  // ─── USA ─────────────────────────────────────────────────────────────────
  {
    country: 'USA', region: 'Colorado', slug: 'colorado', label: 'Colorado',
    cities: [
      'aspen', 'snowmass', 'vail', 'breckenridge', 'beaver creek', 'telluride',
      'steamboat springs', 'crested butte', 'keystone', 'copper mountain',
      'mountain village', 'denver', 'boulder',
    ],
  },
  {
    country: 'USA', region: 'Florida', slug: 'florida', label: 'Florida',
    cities: [
      'miami', 'miami beach', 'fort lauderdale', 'boca raton', 'palm beach',
      'west palm beach', 'delray beach', 'naples', 'fort myers', 'sarasota',
      'tampa', 'st. petersburg', 'orlando', 'key west', 'islamorada', 'marco island',
      'rosemary beach', 'destin', 'santa rosa beach', '30a',
    ],
  },
  {
    country: 'USA', region: 'California', slug: 'california', label: 'California',
    cities: [
      'los angeles', 'la jolla', 'san diego', 'malibu', 'santa barbara', 'santa monica',
      'beverly hills', 'newport beach', 'corona del mar', 'laguna beach',
      'palm springs', 'palm desert', 'indian wells', 'la quinta', 'rancho mirage',
      'napa', 'sonoma', 'calistoga', 'st. helena', 'healdsburg', 'carmel',
      'carmel-by-the-sea', 'monterey', 'big sur', 'lake tahoe', 'tahoe city',
      'south lake tahoe', 'homewood', 'tahoma', 'truckee',
    ],
  },
  {
    country: 'USA', region: 'Utah', slug: 'utah', label: 'Utah',
    cities: [
      'park city', 'deer valley', 'heber city', 'midway', 'salt lake city',
      'sundance', 'kamas',
    ],
  },
  {
    country: 'USA', region: 'Wyoming', slug: 'wyoming', label: 'Jackson Hole',
    cities: ['jackson', 'jackson hole', 'teton village', 'wilson'],
  },
];

// Normalize a string for matching: lowercase + strip accents + collapse spaces
export function normalize(s) {
  if (!s) return '';
  return String(s).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/['']/g, '\'')
    .replace(/[^a-z0-9' -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build a lookup once at import time
const CITY_LOOKUP = (() => {
  const map = new Map();
  for (const d of DESTINATIONS) {
    for (const c of d.cities) {
      map.set(normalize(c), d);
    }
  }
  return map;
})();

/**
 * Match a detected city (and optionally country) to a COP destination.
 * Returns the destination object, or null if no match.
 */
export function matchCity(city, country) {
  if (!city) return null;
  const key = normalize(city);
  const hit = CITY_LOOKUP.get(key);
  if (!hit) return null;
  // If country is supplied, sanity-check it matches (avoids false-positives
  // like a "Cambridge, USA" matching "Cambridge, UK" if we ever added either).
  if (country) {
    const cn = normalize(country);
    const dc = normalize(hit.country);
    // Common country code aliases
    const aliases = { 'gb': 'england', 'uk': 'england', 'us': 'usa', 'united kingdom': 'england', 'united states': 'usa' };
    const cAlias = aliases[cn] || cn;
    if (cAlias !== dc && cn !== dc) return null;
  }
  return hit;
}
