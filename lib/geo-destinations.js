/**
 * lib/geo-destinations.js
 *
 * Maps a visitor's detected city (from Vercel edge geo headers) to a COP
 * destination that we have properties in. Used by /api/geo-match to show a
 * contextual "{Destination} live viewing →" nudge in the bottom-right corner.
 *
 * VACATION-ONLY DESIGN RULE:
 *   We deliberately exclude major residential metros (London, Paris, Madrid,
 *   Milan, Lisbon, LA, NYC, SF, etc.) from this map — even though COP lists
 *   properties in some of them. A London-based prospect researching a Costa
 *   del Sol fractional shouldn't get nagged "London live viewing →"; they
 *   live there, they're not on a viewing trip.
 *
 *   The chip only makes sense when the visitor is physically in a destination
 *   that's overwhelmingly vacation-coded — Mallorca, Aspen, Algarve, etc.
 *
 *   Every destination below MUST have `type: 'vacation'`. The matcher
 *   refuses to return a destination that doesn't carry that flag, so even
 *   if someone later adds a residential entry by accident it won't fire.
 *
 * Format:
 *   {
 *     country:    'Spain',
 *     region:     'Mallorca',
 *     slug:       'mallorca',
 *     label:      'Mallorca',
 *     type:       'vacation',   // REQUIRED — only 'vacation' fires the chip
 *     cities:     [...]
 *   }
 */

export const DESTINATIONS = [
  // ─── Spain — islands ─────────────────────────────────────────────────────
  {
    country: 'Spain', region: 'Mallorca', slug: 'mallorca', label: 'Mallorca',
    type: 'vacation',
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
      'deia', 'deià', 'valldemossa', 'banyalbufar',
    ],
  },
  {
    country: 'Spain', region: 'Ibiza', slug: 'ibiza', label: 'Ibiza',
    type: 'vacation',
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
    type: 'vacation',
    cities: [
      'mahon', 'mahón', 'mao', 'maó', 'ciutadella', 'ciudadela', 'fornells', 'es castell',
      'alaior', 'sant lluis', 'punta prima',
    ],
  },
  {
    country: 'Spain', region: 'Formentera', slug: 'formentera', label: 'Formentera',
    type: 'vacation',
    cities: ['sant francesc', 'la savina', 'es pujols', 'es calo', 'formentera'],
  },
  {
    country: 'Spain', region: 'Tenerife', slug: 'tenerife', label: 'Tenerife',
    type: 'vacation',
    cities: [
      'santa cruz de tenerife', 'santa cruz', 'san cristobal de la laguna', 'la laguna',
      'puerto de la cruz', 'adeje', 'costa adeje', 'playa de las americas',
      'los cristianos', 'callao salvaje', 'playa san juan', 'playa paraiso',
      'el medano', 'el médano', 'la caleta', 'arona', 'guia de isora', 'icod',
    ],
  },
  {
    country: 'Spain', region: 'Canary Islands', slug: 'canary-islands', label: 'the Canary Islands',
    type: 'vacation',
    cities: [
      // Gran Canaria (vacation areas only)
      'maspalomas', 'playa del ingles', 'puerto de mogan', 'puerto rico',
      // Lanzarote
      'arrecife', 'puerto del carmen', 'playa blanca', 'costa teguise',
      // Fuerteventura
      'corralejo', 'caleta de fuste', 'morro jable',
      // La Palma
      'santa cruz de la palma', 'los llanos',
    ],
  },

  // ─── Spain — coastal costas ──────────────────────────────────────────────
  {
    country: 'Spain', region: 'Costa del Sol', slug: 'costa-del-sol', label: 'Costa del Sol',
    type: 'vacation',
    cities: [
      'marbella', 'estepona', 'fuengirola', 'benalmadena', 'benalmádena',
      'mijas', 'torremolinos', 'benahavis', 'benahavís', 'san pedro de alcantara',
      'puerto banus', 'puerto banús', 'sotogrande', 'manilva', 'casares', 'nerja',
      'torre del mar', 'rincon de la victoria', 'rincón de la victoria', 'velez-malaga',
      'ojen', 'ojén', 'higueron', 'higuerón', 'la cala', 'el rosario',
      // Note: Málaga the city is intentionally not listed — it's residential metro
    ],
  },
  {
    country: 'Spain', region: 'Costa Blanca', slug: 'costa-blanca', label: 'Costa Blanca',
    type: 'vacation',
    cities: [
      'denia', 'dénia', 'javea', 'jávea', 'xabia', 'calpe', 'calp',
      'benidorm', 'altea', 'moraira', 'el campello', 'santa pola', 'torrevieja',
      'orihuela costa', 'guardamar', 'la marina', 'cumbre del sol',
      'pedreguer', 'els poblets', 'la nucia',
      // Note: Alicante city + Orihuela town are residential, skipped
    ],
  },
  {
    country: 'Spain', region: 'Costa Brava', slug: 'costa-brava', label: 'Costa Brava',
    type: 'vacation',
    cities: [
      'begur', 'cadaques', 'cadaqués', 'roses', 'tossa de mar', 'platja d\'aro',
      'palamos', 'palamós', 'sant feliu de guixols', 'lloret de mar', 'blanes',
      'l\'escala', 'l escala', 'pals', 'calella de palafrugell', 'tamariu',
      'llafranc', 'aiguablava',
    ],
  },
  {
    country: 'Spain', region: 'Costa de la Luz', slug: 'costa-de-la-luz', label: 'Costa de la Luz',
    type: 'vacation',
    cities: [
      'tarifa', 'zahara de los atunes', 'conil de la frontera', 'vejer',
      'el palmar', 'bolonia', 'caños de meca',
    ],
  },

  // ─── Spain — mountains ──────────────────────────────────────────────────
  {
    country: 'Spain', region: 'Spanish Pyrenees', slug: 'spanish-pyrenees', label: 'the Pyrenees',
    type: 'vacation',
    cities: [
      'baqueira', 'baqueira-beret', 'beret', 'naut aran', 'vielha', 'arties',
      'salardu', 'salardú', 'tredos', 'tredòs',
      // Andorra (Pyrenees ski) — visitor-coded
      'pas de la casa', 'soldeu', 'encamp', 'arinsal', 'la massana',
      // French Pyrenees ski
      'saint-lary-soulan', 'font-romeu', 'cauterets', 'les angles',
    ],
  },

  // ─── France — coast & Alps ──────────────────────────────────────────────
  {
    country: 'France', region: "Côte d'Azur", slug: 'cote-d-azur', label: "Côte d'Azur",
    type: 'vacation',
    cities: [
      'nice', 'cannes', 'antibes', 'juan-les-pins', 'saint-tropez', 'saint tropez',
      'monaco', 'monte carlo', 'menton', 'grasse', 'vence', 'saint-paul-de-vence',
      'cagnes-sur-mer', 'beaulieu-sur-mer', 'villefranche-sur-mer', 'eze', 'èze',
      'mougins', 'grimaud', 'valbonne', 'sainte-maxime', 'villeneuve-loubet',
      'vallauris', 'saint-raphael', 'saint raphaël', 'frejus', 'fréjus', 'les issambres',
      'mandelieu', 'la napoule', 'roquebrune', 'cap d\'antibes', 'le rouret',
      'mouans-sartoux', 'biot', 'bormes-les-mimosas', 'la garde-freinet', 'lavandou',
      'ramatuelle', 'gassin', 'cogolin', 'sainte-maxime',
    ],
  },
  {
    country: 'France', region: 'French Alps', slug: 'french-alps', label: 'the French Alps',
    type: 'vacation',
    cities: [
      'chamonix', 'chamonix-mont-blanc', 'megeve', 'megève', 'morzine', 'avoriaz',
      'courchevel', 'meribel', 'méribel', 'val-d\'isere', 'val d isere', 'val thorens',
      'tignes', 'les arcs', 'la plagne', 'les gets', 'samoens', 'samoëns',
      'flaine', 'saint-gervais', 'la clusaz', 'le grand-bornand',
      'thonon-les-bains', 'evian', 'évian-les-bains',
      // Note: Annecy and Grenoble are residential metros, skipped
    ],
  },

  // ─── Italy — lakes & coast ──────────────────────────────────────────────
  {
    country: 'Italy', region: 'Lake Como', slug: 'lake-como', label: 'Lake Como',
    type: 'vacation',
    cities: [
      'bellagio', 'menaggio', 'varenna', 'domaso', 'tremezzo',
      'cernobbio', 'lenno', 'argegno', 'gravedona', 'colico', 'cadenabbia',
      // Note: Como city itself is partly residential; bellagio/varenna are pure vacation
    ],
  },
  {
    country: 'Italy', region: 'Lake Garda', slug: 'lake-garda', label: 'Lake Garda',
    type: 'vacation',
    cities: [
      'sirmione', 'desenzano del garda', 'desenzano', 'bardolino', 'lazise', 'garda',
      'riva del garda', 'limone sul garda', 'malcesine', 'salò', 'salo', 'gardone',
      'torri del benaco', 'cavaion veronese',
      // Note: Verona city is residential, skipped
    ],
  },
  {
    country: 'Italy', region: 'Lake Maggiore', slug: 'lake-maggiore', label: 'Lake Maggiore',
    type: 'vacation',
    cities: [
      'stresa', 'verbania', 'laveno', 'baveno', 'cannobio', 'pallanza',
      'meina', 'arona',
    ],
  },
  {
    country: 'Italy', region: 'Tuscany', slug: 'tuscany', label: 'Tuscany',
    type: 'vacation',
    cities: [
      'siena', 'cortona', 'montepulciano',
      'pienza', 'san gimignano', 'volterra', 'greve in chianti', 'radda in chianti',
      'castellina in chianti', 'montalcino', 'massa marittima',
      'castiglione della pescaia', 'castiglioncello del trinoro',
      // Note: Florence and Pisa are residential cities of size, skipped
    ],
  },
  {
    country: 'Italy', region: 'Liguria', slug: 'liguria', label: 'Liguria',
    type: 'vacation',
    cities: [
      'portofino', 'santa margherita ligure', 'rapallo', 'sestri levante',
      'lerici', 'cinque terre', 'monterosso', 'vernazza', 'manarola',
      'corniglia', 'riomaggiore', 'sanremo', 'san remo', 'imperia',
      'alassio', 'ospedaletti', 'apricale', 'laigueglia', 'loano', 'diano marina',
      // Note: Genoa and La Spezia are residential metros, skipped
    ],
  },
  {
    country: 'Italy', region: 'Sardinia', slug: 'sardinia', label: 'Sardinia',
    type: 'vacation',
    cities: [
      'porto cervo', 'costa smeralda', 'palau', 'arzachena',
      'san teodoro', 'alghero', 'porto rotondo', 'la maddalena', 'budoni',
      'pula', 'villasimius', 'chia',
      // Note: Olbia and Cagliari are residential cities, skipped
    ],
  },
  {
    country: 'Italy', region: 'South Tyrol', slug: 'south-tyrol', label: 'South Tyrol',
    type: 'vacation',
    cities: [
      'cortina d\'ampezzo', 'cortina d ampezzo', 'selva di val gardena',
      'ortisei', 'st. ulrich', 'madonna di campiglio', 'canazei',
      'castelrotto', 'petersberg', 'merano',
    ],
  },

  // ─── Portugal ────────────────────────────────────────────────────────────
  {
    country: 'Portugal', region: 'Algarve', slug: 'algarve', label: 'the Algarve',
    type: 'vacation',
    cities: [
      'vilamoura', 'quarteira', 'albufeira', 'lagos', 'portimao', 'portimão',
      'tavira', 'sagres', 'lagoa', 'silves', 'almancil', 'quinta do lago',
      'vale do lobo', 'monte gordo', 'praia da rocha', 'carvoeiro',
      // Note: Faro and Olhão are residential, skipped
    ],
  },
  {
    country: 'Portugal', region: 'Silver Coast', slug: 'silver-coast', label: 'the Silver Coast',
    type: 'vacation',
    cities: [
      'ericeira', 'nazaré', 'nazare', 'peniche', 'obidos', 'óbidos', 'caldas da rainha',
      'sao martinho do porto', 'são martinho do porto', 'foz do arelho',
    ],
  },
  {
    country: 'Portugal', region: 'Comporta', slug: 'comporta', label: 'Comporta',
    type: 'vacation',
    cities: ['comporta', 'melides', 'carvalhal', 'troia', 'tróia'],
  },
  {
    // Lisbon is a unique case — unlike London/Paris/Madrid (mostly residents),
    // Lisbon has a huge international/expat/nomad/golden-visa layer that's
    // genuinely property-curious. We don't have Lisbon listings ourselves, so
    // the chip routes them to ALL Portugal properties (Algarve + Silver Coast
    // + Comporta) via urlCountryOnly: true — the region filter is skipped.
    country: 'Portugal', region: null, slug: 'lisbon', label: 'Lisbon',
    type: 'vacation', urlCountryOnly: true,
    cities: [
      'lisbon', 'lisboa', 'cascais', 'estoril', 'sintra', 'oeiras',
      'parede', 'carcavelos', 'sao pedro do estoril', 'são pedro do estoril',
      'monte estoril', 'colares', 'azenhas do mar',
      // Note: Setúbal and Almada are residential commuter towns, skipped
    ],
  },

  // ─── UK ──────────────────────────────────────────────────────────────────
  {
    country: 'England', region: 'Cotswolds', slug: 'cotswolds', label: 'the Cotswolds',
    type: 'vacation',
    cities: [
      'cheltenham', 'cirencester', 'stow-on-the-wold', 'stow on the wold', 'burford',
      'chipping norton', 'bourton-on-the-water', 'bourton on the water', 'broadway',
      'moreton-in-marsh', 'tetbury', 'painswick', 'chipping campden', 'winchcombe',
      'lechlade', 'fairford', 'minchinhampton',
    ],
  },
  {
    country: 'England', region: 'Cornwall', slug: 'cornwall', label: 'Cornwall',
    type: 'vacation',
    cities: [
      'st ives', 'st. ives', 'padstow', 'rock', 'newquay', 'falmouth',
      'fowey', 'mousehole', 'mevagissey', 'truro', 'penzance',
    ],
  },

  // ─── Austria — Alps only ────────────────────────────────────────────────
  {
    country: 'Austria', region: 'Tyrol', slug: 'tyrol', label: 'Tyrol',
    type: 'vacation',
    cities: [
      'kitzbuhel', 'kitzbühel', 'brixen', 'brixen im thale', 'kirchberg',
      'st. johann in tirol', 'going am wilden kaiser', 'soll', 'söll', 'westendorf',
      'ellmau', 'mayrhofen', 'zell am ziller', 'ischgl', 'see', 'galtür', 'galtur',
      'seefeld', 'st. anton', 'st anton am arlberg',
      // Note: Innsbruck (capital) skipped — residential metro
    ],
  },
  {
    country: 'Austria', region: 'Salzburger Land', slug: 'salzburger-land', label: 'Salzburger Land',
    type: 'vacation',
    cities: [
      'zell am see', 'kaprun', 'saalbach', 'hinterglemm', 'leogang',
      'neukirchen', 'neukirchen am grossvenediger', 'hollersbach', 'mittersill',
      'st. johann im pongau', 'wagrain', 'flachau', 'altenmarkt',
      // Note: Salzburg city skipped — residential
    ],
  },
  {
    country: 'Austria', region: 'Vorarlberg', slug: 'vorarlberg', label: 'Vorarlberg',
    type: 'vacation',
    cities: [
      'lech', 'zurs', 'zürs', 'stuben', 'burserberg', 'bürserberg',
      // Note: Bregenz, Dornbirn, Feldkirch, Bludenz are residential
    ],
  },

  // ─── USA — vacation hubs only (split out from generic states) ───────────
  {
    country: 'USA', region: 'Colorado', slug: 'colorado', label: 'Colorado',
    type: 'vacation',
    cities: [
      'aspen', 'snowmass', 'snowmass village', 'vail', 'breckenridge', 'beaver creek',
      'telluride', 'mountain village', 'steamboat springs', 'crested butte',
      'keystone', 'copper mountain',
      // Note: Denver and Boulder skipped — residential metros
    ],
  },
  {
    country: 'USA', region: 'Wyoming', slug: 'wyoming', label: 'Jackson Hole',
    type: 'vacation',
    cities: ['jackson', 'jackson hole', 'teton village', 'wilson'],
  },
  {
    country: 'USA', region: 'Utah', slug: 'utah', label: 'Park City',
    type: 'vacation',
    cities: ['park city', 'deer valley', 'heber city', 'midway', 'kamas'],
  },
  {
    country: 'USA', region: 'Lake Tahoe', slug: 'lake-tahoe', label: 'Lake Tahoe',
    type: 'vacation',
    cities: [
      'lake tahoe', 'tahoe city', 'south lake tahoe', 'homewood', 'tahoma',
      'truckee', 'kings beach', 'incline village', 'olympic valley', 'squaw valley',
      'palisades tahoe', 'northstar', 'glenbrook', 'zephyr cove',
    ],
  },
  {
    country: 'USA', region: 'Napa & Sonoma', slug: 'napa-sonoma', label: 'Napa & Sonoma',
    type: 'vacation',
    cities: [
      'napa', 'sonoma', 'calistoga', 'st. helena', 'st helena', 'yountville',
      'healdsburg', 'rutherford', 'oakville',
    ],
  },
  {
    country: 'USA', region: 'Palm Springs Desert', slug: 'palm-springs', label: 'Palm Springs',
    type: 'vacation',
    cities: [
      'palm springs', 'palm desert', 'indian wells', 'la quinta', 'rancho mirage',
      'cathedral city', 'desert hot springs', 'bermuda dunes',
    ],
  },
  {
    country: 'USA', region: 'Carmel & Monterey', slug: 'carmel-monterey', label: 'Carmel & Monterey',
    type: 'vacation',
    cities: [
      'carmel', 'carmel-by-the-sea', 'carmel by the sea', 'monterey', 'big sur',
      'pebble beach', 'pacific grove',
    ],
  },
  {
    country: 'USA', region: 'Santa Barbara & Malibu', slug: 'santa-barbara-malibu', label: 'Santa Barbara & Malibu',
    type: 'vacation',
    cities: [
      'santa barbara', 'malibu', 'montecito', 'summerland', 'carpinteria',
    ],
  },
  // ─── USA — Florida vacation hubs (NOT generic Florida) ──────────────────
  {
    country: 'USA', region: 'Miami', slug: 'miami', label: 'Miami',
    type: 'vacation',
    cities: [
      'miami', 'miami beach', 'south beach', 'brickell', 'coral gables',
      'coconut grove', 'key biscayne', 'bal harbour', 'sunny isles beach',
      'aventura', 'surfside', 'fisher island', 'star island',
    ],
  },
  {
    country: 'USA', region: 'Palm Beach', slug: 'palm-beach', label: 'Palm Beach',
    type: 'vacation',
    cities: [
      'palm beach', 'west palm beach', 'jupiter', 'delray beach', 'boca raton',
      'manalapan',
    ],
  },
  {
    country: 'USA', region: 'Florida Keys', slug: 'florida-keys', label: 'the Florida Keys',
    type: 'vacation',
    cities: [
      'key west', 'islamorada', 'marathon', 'key largo', 'key colony beach',
      'tavernier', 'duck key', 'big pine key',
    ],
  },
  {
    country: 'USA', region: '30A Emerald Coast', slug: '30a-emerald-coast', label: '30A & Emerald Coast',
    type: 'vacation',
    cities: [
      'rosemary beach', 'seaside', 'alys beach', 'watercolor', 'santa rosa beach',
      'inlet beach', 'grayton beach', 'destin', 'miramar beach',
    ],
  },
  {
    country: 'USA', region: 'Florida Gulf Coast', slug: 'florida-gulf', label: 'the Florida Gulf Coast',
    type: 'vacation',
    cities: [
      'naples', 'marco island', 'sanibel', 'captiva', 'longboat key', 'siesta key',
      'anna maria island', 'boca grande',
    ],
  },
  // ─── USA — Coastal Carolinas + Massachusetts vacation islands ──────────
  {
    country: 'USA', region: 'South Carolina Coast', slug: 'south-carolina-coast', label: 'the SC Lowcountry',
    type: 'vacation',
    cities: [
      'kiawah island', 'hilton head', 'hilton head island', 'isle of palms',
      'sullivans island', 'sullivan\'s island', 'johns island', 'seabrook island',
      'edisto island', 'folly beach',
    ],
  },
  {
    country: 'USA', region: 'Nantucket & the Vineyard', slug: 'nantucket-marthas-vineyard', label: 'Nantucket',
    type: 'vacation',
    cities: [
      'nantucket', 'siasconset', 'martha\'s vineyard', 'marthas vineyard',
      'edgartown', 'oak bluffs', 'vineyard haven', 'chilmark',
    ],
  },
  {
    country: 'USA', region: 'Jersey Shore', slug: 'jersey-shore', label: 'the Jersey Shore',
    type: 'vacation',
    cities: ['avalon', 'stone harbor', 'cape may', 'spring lake', 'beach haven'],
  },
  {
    country: 'USA', region: 'Arizona', slug: 'arizona', label: 'Scottsdale',
    type: 'vacation',
    cities: [
      'scottsdale', 'cave creek', 'paradise valley', 'sedona', 'carefree',
    ],
  },

  // ─── Mexico — Pacific resorts ───────────────────────────────────────────
  {
    country: 'Mexico', region: 'Los Cabos', slug: 'los-cabos', label: 'Los Cabos',
    type: 'vacation',
    cities: [
      'cabo san lucas', 'san jose del cabo', 'san josé del cabo', 'san jose cabo',
      'corredor turistico', 'san jose corridor', 'baja california sur', 'east cape',
    ],
  },
  {
    country: 'Mexico', region: 'Riviera Nayarit', slug: 'riviera-nayarit', label: 'Riviera Nayarit',
    type: 'vacation',
    cities: [
      'bahia de banderas', 'bahía de banderas', 'punta mita', 'sayulita',
      'san pancho', 'litibu', 'litibú', 'la cruz de huanacaxtle',
    ],
  },

  // ─── Sweden — vacation archipelago only ────────────────────────────────
  {
    country: 'Sweden', region: 'Stockholm Archipelago', slug: 'stockholm-archipelago', label: 'the Stockholm Archipelago',
    type: 'vacation',
    cities: [
      'varmdo', 'värmdö', 'norrnas', 'norrnäs', 'ljustero', 'ljusterö',
      'sandhamn', 'vaxholm', 'utö', 'uto', 'möja', 'moja',
      // Note: Stockholm city itself is the residential metro — NOT listed
    ],
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
 *
 * REFUSES to return any destination without type === 'vacation' — even if
 * one accidentally gets added to the map. This is a belt-and-braces guard
 * against the "London resident gets a London live-viewing chip" problem.
 */
export function matchCity(city, country) {
  if (!city) return null;
  const key = normalize(city);
  const hit = CITY_LOOKUP.get(key);
  if (!hit) return null;
  if (hit.type !== 'vacation') return null;

  // If country is supplied, sanity-check it matches (avoids false-positives
  // like a "Cambridge, USA" matching "Cambridge, UK" if we ever added either).
  if (country) {
    const cn = normalize(country);
    const dc = normalize(hit.country);
    const aliases = { 'gb': 'england', 'uk': 'england', 'us': 'usa', 'united kingdom': 'england', 'united states': 'usa' };
    const cAlias = aliases[cn] || cn;
    if (cAlias !== dc && cn !== dc) return null;
  }
  return hit;
}
