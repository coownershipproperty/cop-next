/**
 * lib/propertyTitles.js — COP property titles, composed in nine languages.
 *
 * Moved out of scripts/translate-property-titles.mjs on 22 Sep 2026 so the
 * nightly job can use the same vocabulary the script does. Before that the
 * composer lived only in a script someone ran by hand, which is why a Miami
 * listing added on 18 September was still showing an English title on
 * /es/ four days later.
 *
 * COP titles follow one strict grammar:
 *
 *   {City}, {Region}, {Country} — {N}-Bed {Type} With {Feature} & {Feature}
 *
 * so a title can be rebuilt in another language from three small vocabularies
 * (places, property types, features) plus that language's word order. That is
 * far safer than free translation: the output is deterministic, reviewable,
 * and identical for identical inputs.
 *
 * THE RULE THAT MAKES THIS SAFE: a row is only written when every token in its
 * tail is known. One unrecognised type or feature and the row is skipped and
 * reported — never guessed at, never half-translated. Place segments are the
 * exception and pass through unchanged when unmapped, because they are city
 * names, which do not translate. Countries and geographic features that DO
 * translate are enumerated exhaustively in PLACES below.
 *
 * German note: feature strings are written in the dative, because they always
 * follow `mit` — `mit beheiztem Pool`, `mit sonniger Terrasse`. German nouns
 * stay capitalised; everything else in the tail is lower-case.
 */
const LOCALES = ['es', 'fr', 'de', 'it', 'nl', 'pt', 'sv', 'da', 'no'];

// ── Places ────────────────────────────────────────────────────────────────
// Only segments that genuinely differ. Anything absent passes through, which
// is correct for city names (Marbella, Aspen, Morzine are the same everywhere).
const PLACES = {
  it: { Paris: 'Parigi', London: 'Londra', Munich: 'Monaco di Baviera', Vienna: 'Vienna', Milan: 'Milano', Rome: 'Roma', Florence: 'Firenze', Venice: 'Venezia', Lisbon: 'Lisbona', USA: 'Stati Uniti', Spain: 'Spagna', Italy: 'Italia', France: 'Francia', Germany: 'Germania', Austria: 'Austria', Mexico: 'Messico', England: 'Inghilterra', Portugal: 'Portogallo', Croatia: 'Croazia', Sweden: 'Svezia', Switzerland: 'Svizzera', California: 'California', Florida: 'Florida', Colorado: 'Colorado', 'South Carolina': 'Carolina del Sud', 'North Carolina': 'Carolina del Nord', 'New Jersey': 'New Jersey', 'New York': 'New York', "Côte d'Azur": 'Costa Azzurra', 'Lake Garda': 'Lago di Garda', 'Lake Como': 'Lago di Como', 'Baltic Sea': 'Mar Baltico', Sardinia: 'Sardegna', Tyrol: 'Tirolo', Bavaria: 'Baviera', Istria: 'Istria', Tuscany: 'Toscana', Liguria: 'Liguria', Mallorca: 'Maiorca', Menorca: 'Minorca', 'French Alps': 'Alpi francesi', Provence: 'Provenza', 'Salzburger Land': 'Salisburghese' },
  nl: { Paris: 'Parijs', London: 'Londen', Munich: 'München', Vienna: 'Wenen', Milan: 'Milaan', Rome: 'Rome', Florence: 'Florence', Venice: 'Venetië', Lisbon: 'Lissabon', USA: 'Verenigde Staten', Spain: 'Spanje', Italy: 'Italië', France: 'Frankrijk', Germany: 'Duitsland', Austria: 'Oostenrijk', Mexico: 'Mexico', England: 'Engeland', Portugal: 'Portugal', Croatia: 'Kroatië', Sweden: 'Zweden', Switzerland: 'Zwitserland', California: 'Californië', Florida: 'Florida', Colorado: 'Colorado', 'South Carolina': 'South Carolina', 'North Carolina': 'North Carolina', 'New Jersey': 'New Jersey', 'New York': 'New York', "Côte d'Azur": "Côte d'Azur", 'Lake Garda': 'Gardameer', 'Lake Como': 'Comomeer', 'Baltic Sea': 'Oostzee', Sardinia: 'Sardinië', Tyrol: 'Tirol', Bavaria: 'Beieren', Istria: 'Istrië', Tuscany: 'Toscane', Liguria: 'Ligurië', Mallorca: 'Mallorca', Menorca: 'Menorca', 'French Alps': 'Franse Alpen', Provence: 'Provence', 'Salzburger Land': 'Salzburgerland' },
  pt: { Paris: 'Paris', London: 'Londres', Munich: 'Munique', Vienna: 'Viena', Milan: 'Milão', Rome: 'Roma', Florence: 'Florença', Venice: 'Veneza', Lisbon: 'Lisboa', USA: 'Estados Unidos', Spain: 'Espanha', Italy: 'Itália', France: 'França', Germany: 'Alemanha', Austria: 'Áustria', Mexico: 'México', England: 'Inglaterra', Portugal: 'Portugal', Croatia: 'Croácia', Sweden: 'Suécia', Switzerland: 'Suíça', California: 'Califórnia', Florida: 'Flórida', Colorado: 'Colorado', 'South Carolina': 'Carolina do Sul', 'North Carolina': 'Carolina do Norte', 'New Jersey': 'Nova Jersey', 'New York': 'Nova York', "Côte d'Azur": 'Costa Azul', 'Lake Garda': 'Lago de Garda', 'Lake Como': 'Lago de Como', 'Baltic Sea': 'Mar Báltico', Sardinia: 'Sardenha', Tyrol: 'Tirol', Bavaria: 'Baviera', Istria: 'Ístria', Tuscany: 'Toscana', Liguria: 'Ligúria', Mallorca: 'Maiorca', Menorca: 'Menorca', 'French Alps': 'Alpes Franceses', Provence: 'Provença', 'Salzburger Land': 'Salzburgo' },
  sv: { Paris: 'Paris', London: 'London', Munich: 'München', Vienna: 'Wien', Milan: 'Milano', Rome: 'Rom', Florence: 'Florens', Venice: 'Venedig', Lisbon: 'Lissabon', USA: 'USA', Spain: 'Spanien', Italy: 'Italien', France: 'Frankrike', Germany: 'Tyskland', Austria: 'Österrike', Mexico: 'Mexiko', England: 'England', Portugal: 'Portugal', Croatia: 'Kroatien', Sweden: 'Sverige', Switzerland: 'Schweiz', California: 'Kalifornien', Florida: 'Florida', Colorado: 'Colorado', 'South Carolina': 'South Carolina', 'North Carolina': 'North Carolina', 'New Jersey': 'New Jersey', 'New York': 'New York', "Côte d'Azur": 'Franska rivieran', 'Lake Garda': 'Gardasjön', 'Lake Como': 'Comosjön', 'Baltic Sea': 'Östersjön', Sardinia: 'Sardinien', Tyrol: 'Tyrolen', Bavaria: 'Bayern', Istria: 'Istrien', Tuscany: 'Toscana', Liguria: 'Ligurien', Mallorca: 'Mallorca', Menorca: 'Menorca', 'French Alps': 'Franska alperna', Provence: 'Provence', 'Salzburger Land': 'Salzburgerland' },
  da: { Paris: 'Paris', London: 'London', Munich: 'München', Vienna: 'Wien', Milan: 'Milano', Rome: 'Rom', Florence: 'Firenze', Venice: 'Venedig', Lisbon: 'Lissabon', USA: 'USA', Spain: 'Spanien', Italy: 'Italien', France: 'Frankrig', Germany: 'Tyskland', Austria: 'Østrig', Mexico: 'Mexico', England: 'England', Portugal: 'Portugal', Croatia: 'Kroatien', Sweden: 'Sverige', Switzerland: 'Schweiz', California: 'Californien', Florida: 'Florida', Colorado: 'Colorado', 'South Carolina': 'South Carolina', 'North Carolina': 'North Carolina', 'New Jersey': 'New Jersey', 'New York': 'New York', "Côte d'Azur": 'Den franske riviera', 'Lake Garda': 'Gardasøen', 'Lake Como': 'Comosøen', 'Baltic Sea': 'Østersøen', Sardinia: 'Sardinien', Tyrol: 'Tyrol', Bavaria: 'Bayern', Istria: 'Istrien', Tuscany: 'Toscana', Liguria: 'Ligurien', Mallorca: 'Mallorca', Menorca: 'Menorca', 'French Alps': 'De franske alper', Provence: 'Provence', 'Salzburger Land': 'Salzburgerland' },
  no: { Paris: 'Paris', London: 'London', Munich: 'München', Vienna: 'Wien', Milan: 'Milano', Rome: 'Roma', Florence: 'Firenze', Venice: 'Venezia', Lisbon: 'Lisboa', USA: 'USA', Spain: 'Spania', Italy: 'Italia', France: 'Frankrike', Germany: 'Tyskland', Austria: 'Østerrike', Mexico: 'Mexico', England: 'England', Portugal: 'Portugal', Croatia: 'Kroatia', Sweden: 'Sverige', Switzerland: 'Sveits', California: 'California', Florida: 'Florida', Colorado: 'Colorado', 'South Carolina': 'South Carolina', 'North Carolina': 'North Carolina', 'New Jersey': 'New Jersey', 'New York': 'New York', "Côte d'Azur": 'Den franske rivieraen', 'Lake Garda': 'Gardasjøen', 'Lake Como': 'Comosjøen', 'Baltic Sea': 'Østersjøen', Sardinia: 'Sardinia', Tyrol: 'Tyrol', Bavaria: 'Bayern', Istria: 'Istria', Tuscany: 'Toscana', Liguria: 'Liguria', Mallorca: 'Mallorca', Menorca: 'Menorca', 'French Alps': 'De franske alpene', Provence: 'Provence', 'Salzburger Land': 'Salzburgerland' },
};

// ── Property types ────────────────────────────────────────────────────────
const TYPES = {
  House:               { it: 'Casa',                nl: 'Woning',              pt: 'Casa',               sv: 'Hus',              da: 'Hus',              no: 'Hus' },
  Apartment:           { it: 'Appartamento',        nl: 'Appartement',         pt: 'Apartamento',        sv: 'Lägenhet',         da: 'Lejlighed',        no: 'Leilighet' },
  Villa:               { it: 'Villa',               nl: 'Villa',               pt: 'Villa',              sv: 'Villa',            da: 'Villa',            no: 'Villa' },
  Chalet:              { it: 'Chalet',              nl: 'Chalet',              pt: 'Chalé',              sv: 'Chalet',           da: 'Chalet',           no: 'Hytte' },
  Penthouse:           { it: 'Attico',              nl: 'Penthouse',           pt: 'Cobertura',          sv: 'Takvåning',        da: 'Penthouse',        no: 'Toppleilighet' },
  Townhouse:           { it: 'Casa a schiera',      nl: 'Herenhuis',           pt: 'Sobrado',            sv: 'Radhus',           da: 'Rækkehus',         no: 'Rekkehus' },
  Estate:              { it: 'Tenuta',              nl: 'Landgoed',            pt: 'Propriedade',        sv: 'Gods',             da: 'Gods',             no: 'Gods' },
  Finca:               { it: 'Finca',               nl: 'Finca',               pt: 'Finca',              sv: 'Finca',            da: 'Finca',            no: 'Finca' },
  Cottage:             { it: 'Cottage',             nl: 'Cottage',             pt: 'Chalé rústico',      sv: 'Stuga',            da: 'Sommerhus',        no: 'Hytte' },
  Cabin:               { it: 'Baita',               nl: 'Blokhut',             pt: 'Cabana',             sv: 'Stuga',            da: 'Bjælkehytte',      no: 'Hytte' },
  Farmhouse:           { it: 'Casale',              nl: 'Boerderij',           pt: 'Casa de campo',      sv: 'Gårdshus',         da: 'Landejendom',      no: 'Gårdshus' },
  Maisonette:          { it: 'Maisonette',          nl: 'Maisonnette',         pt: 'Duplex',             sv: 'Maisonette',       da: 'Maisonette',       no: 'Maisonett' },
  Duplex:              { it: 'Duplex',              nl: 'Duplex',              pt: 'Duplex',             sv: 'Duplex',           da: 'Duplex',           no: 'Duplex' },
  Studio:              { it: 'Monolocale',          nl: 'Studio',              pt: 'Estúdio',            sv: 'Etta',             da: 'Etværelses',       no: 'Ettroms' },
  'Private Residence': { it: 'Residenza privata',   nl: 'Privéresidentie',     pt: 'Residência privada', sv: 'Privatresidens',   da: 'Privatresidens',   no: 'Privatresidens' },
  'Garden Apartment':  { it: 'Appartamento con giardino', nl: 'Tuinappartement', pt: 'Apartamento com jardim', sv: 'Marklägenhet', da: 'Havelejlighed', no: 'Hageleilighet' },
  'Terrace Apartment': { it: 'Appartamento con terrazza', nl: 'Terrasappartement', pt: 'Apartamento com terraço', sv: 'Terrasslägenhet', da: 'Terrasselejlighed', no: 'Terrasseleilighet' },
  'Beach House':       { it: 'Casa sul mare',       nl: 'Strandhuis',          pt: 'Casa de praia',      sv: 'Strandhus',        da: 'Strandhus',        no: 'Strandhus' },
  'Beach Villa':       { it: 'Villa sul mare',      nl: 'Strandvilla',         pt: 'Villa de praia',     sv: 'Strandvilla',      da: 'Strandvilla',      no: 'Strandvilla' },
  'Mountain House':    { it: 'Casa di montagna',    nl: 'Berghuis',            pt: 'Casa de montanha',   sv: 'Fjällhus',         da: 'Bjerghus',         no: 'Fjellhus' },
  'Mountain Home':     { it: 'Casa di montagna',    nl: 'Berghuis',            pt: 'Casa de montanha',   sv: 'Fjällhus',         da: 'Bjerghus',         no: 'Fjellhus' },
  'Coastal House':     { it: 'Casa costiera',       nl: 'Kusthuis',            pt: 'Casa litorânea',     sv: 'Kusthus',          da: 'Kysthus',          no: 'Kysthus' },
  'Waterfront House':  { it: "Casa sull'acqua",     nl: 'Huis aan het water',  pt: 'Casa à beira-mar',   sv: 'Sjönära hus',      da: 'Hus ved vandet',   no: 'Hus ved vannet' },
  'Lakefront House':   { it: 'Casa sul lago',       nl: 'Huis aan het meer',   pt: 'Casa à beira do lago', sv: 'Sjötomtshus',    da: 'Hus ved søen',     no: 'Hus ved sjøen' },
  'Beachfront House':  { it: 'Casa fronte mare',    nl: 'Huis aan het strand', pt: 'Casa de frente para o mar', sv: 'Hus vid stranden', da: 'Hus ved stranden', no: 'Hus ved stranden' },
  'Modern House':      { it: 'Casa moderna',        nl: 'Moderne woning',      pt: 'Casa moderna',       sv: 'Modernt hus',      da: 'Moderne hus',      no: 'Moderne hus' },
  'Resort Villa':      { it: 'Villa in resort',     nl: 'Resortvilla',         pt: 'Villa em resort',    sv: 'Resortvilla',      da: 'Resortvilla',      no: 'Resortvilla' },
  'Historic Home':     { it: 'Casa storica',        nl: 'Historisch huis',     pt: 'Casa histórica',     sv: 'Historiskt hus',   da: 'Historisk hus',    no: 'Historisk hus' },
  'City Apartment':    { it: 'Appartamento in città', nl: 'Stadsappartement',   pt: 'Apartamento urbano', sv: 'Citylägenhet',     da: 'Bylejlighed',      no: 'Byleilighet' },
  'Vineyard Estate':   { it: 'Tenuta con vigneto',  nl: 'Wijngoed',            pt: 'Quinta com vinha',   sv: 'Vingård',          da: 'Vingård',          no: 'Vingård' },
  'Penthouse Maisonette': { it: 'Attico su due livelli', nl: 'Penthouse-maisonnette', pt: 'Cobertura duplex', sv: 'Takvåning i två plan', da: 'Penthouse i to plan', no: 'Toppleilighet over to plan' },
  'Mid-Century Waterfront House': { it: "Casa sull'acqua di metà secolo", nl: 'Mid-century huis aan het water', pt: 'Casa à beira-mar mid-century', sv: 'Sjönära hus i mid century-stil', da: 'Hus ved vandet i midcentury-stil', no: 'Hus ved vannet i midcentury-stil' },
  'Desert-Modern House': { it: 'Casa desert modern', nl: 'Desert-modern huis',  pt: 'Casa desert modern', sv: 'Hus i desert modern-stil', da: 'Hus i desert modern-stil', no: 'Hus i desert modern-stil' },
};

// ── Features ──────────────────────────────────────────────────────────────
const FEATURES = {
  Pool:                    { it: 'piscina',                 nl: 'zwembad',                  pt: 'piscina',                     sv: 'pool',                     da: 'pool',                     no: 'basseng' },
  'Private Pool':          { it: 'piscina privata',         nl: 'privézwembad',             pt: 'piscina privativa',           sv: 'egen pool',                da: 'privat pool',              no: 'privat basseng' },
  'Shared Pool':           { it: 'piscina condominiale',    nl: 'gedeeld zwembad',          pt: 'piscina compartilhada',       sv: 'gemensam pool',            da: 'fælles pool',              no: 'felles basseng' },
  'Infinity Pool':         { it: 'piscina a sfioro',        nl: 'infinity pool',            pt: 'piscina de borda infinita',   sv: 'infinitypool',             da: 'infinitypool',             no: 'infinitybasseng' },
  'Heated Pool':           { it: 'piscina riscaldata',      nl: 'verwarmd zwembad',         pt: 'piscina aquecida',            sv: 'uppvärmd pool',            da: 'opvarmet pool',            no: 'oppvarmet basseng' },
  'Saltwater Pool':        { it: 'piscina ad acqua salata', nl: 'zoutwaterzwembad',         pt: 'piscina de água salgada',     sv: 'saltvattenpool',           da: 'saltvandspool',            no: 'saltvannsbasseng' },
  'Rooftop Pool':          { it: 'piscina sul tetto',       nl: 'dakzwembad',               pt: 'piscina na cobertura',        sv: 'takpool',                  da: 'tagpool',                  no: 'takbasseng' },
  'Hot Tub':               { it: 'vasca idromassaggio',     nl: 'hottub',                   pt: 'banheira de hidromassagem',   sv: 'bubbelpool',               da: 'boblebad',                 no: 'boblebad' },
  'Sea Views':             { it: 'vista mare',              nl: 'zeezicht',                 pt: 'vista para o mar',            sv: 'havsutsikt',               da: 'havudsigt',                no: 'sjøutsikt' },
  'Sea View':              { it: 'vista mare',              nl: 'zeezicht',                 pt: 'vista para o mar',            sv: 'havsutsikt',               da: 'havudsigt',                no: 'sjøutsikt' },
  'Ocean Views':           { it: 'vista oceano',            nl: 'oceaanzicht',              pt: 'vista para o oceano',         sv: 'havsutsikt',               da: 'havudsigt',                no: 'havutsikt' },
  'Panoramic Sea Views':   { it: 'vista mare panoramica',   nl: 'panoramisch zeezicht',     pt: 'vista panorâmica para o mar', sv: 'panoramautsikt över havet', da: 'panoramaudsigt over havet', no: 'panoramautsikt over havet' },
  'Mountain Views':        { it: 'vista montagne',          nl: 'bergzicht',                pt: 'vista para as montanhas',     sv: 'bergsutsikt',              da: 'bjergudsigt',              no: 'fjellutsikt' },
  'Lake Views':            { it: 'vista lago',              nl: 'meerzicht',                pt: 'vista para o lago',           sv: 'sjöutsikt',                da: 'søudsigt',                 no: 'utsikt over sjøen' },
  'Lake View':             { it: 'vista lago',              nl: 'meerzicht',                pt: 'vista para o lago',           sv: 'sjöutsikt',                da: 'søudsigt',                 no: 'utsikt over sjøen' },
  'Panoramic Lake Views':  { it: 'vista lago panoramica',   nl: 'panoramisch meerzicht',    pt: 'vista panorâmica para o lago', sv: 'panoramautsikt över sjön', da: 'panoramaudsigt over søen', no: 'panoramautsikt over sjøen' },
  'Beach Access':          { it: 'accesso alla spiaggia',   nl: 'strandtoegang',            pt: 'acesso à praia',              sv: 'strandnära läge',          da: 'adgang til stranden',      no: 'adkomst til stranden' },
  Fireplace:               { it: 'camino',                  nl: 'open haard',               pt: 'lareira',                     sv: 'öppen spis',               da: 'pejs',                     no: 'peis' },
  Sauna:                   { it: 'sauna',                   nl: 'sauna',                    pt: 'sauna',                       sv: 'bastu',                    da: 'sauna',                    no: 'badstue' },
  Terrace:                 { it: 'terrazza',                nl: 'terras',                   pt: 'terraço',                     sv: 'terrass',                  da: 'terrasse',                 no: 'terrasse' },
  'Roof Terrace':          { it: 'terrazza sul tetto',      nl: 'dakterras',                pt: 'terraço na cobertura',        sv: 'takterrass',               da: 'tagterrasse',              no: 'takterrasse' },
  'Sunny Terrace':         { it: 'terrazza soleggiata',     nl: 'zonnig terras',            pt: 'terraço ensolarado',          sv: 'solig terrass',            da: 'solrig terrasse',          no: 'solrik terrasse' },
  'Private Terrace':       { it: 'terrazza privata',        nl: 'privéterras',              pt: 'terraço privativo',           sv: 'egen terrass',             da: 'privat terrasse',          no: 'privat terrasse' },
  'Two Terraces':          { it: 'due terrazze',            nl: 'twee terrassen',           pt: 'dois terraços',               sv: 'två terrasser',            da: 'to terrasser',             no: 'to terrasser' },
  Garden:                  { it: 'giardino',                nl: 'tuin',                     pt: 'jardim',                      sv: 'trädgård',                 da: 'have',                     no: 'hage' },
  Balcony:                 { it: 'balcone',                 nl: 'balkon',                   pt: 'varanda',                     sv: 'balkong',                  da: 'altan',                    no: 'balkong' },
  Elevator:                { it: 'ascensore',               nl: 'lift',                     pt: 'elevador',                    sv: 'hiss',                     da: 'elevator',                 no: 'heis' },
  'Wine Cellar':           { it: 'cantina',                 nl: 'wijnkelder',               pt: 'adega',                       sv: 'vinkällare',               da: 'vinkælder',                no: 'vinkjeller' },
  'Harbour View':          { it: 'vista porto',             nl: 'havenzicht',               pt: 'vista para o porto',          sv: 'hamnutsikt',               da: 'havneudsigt',              no: 'havneutsikt' },
  'Marina Views':          { it: 'vista sul porto turistico', nl: 'zicht op de jachthaven', pt: 'vista para a marina',         sv: 'utsikt över marinan',      da: 'udsigt over marinaen',     no: 'utsikt over marinaen' },
  'Golf Views':            { it: 'vista sul campo da golf', nl: 'zicht op de golfbaan',     pt: 'vista para o campo de golfe', sv: 'utsikt över golfbanan',    da: 'udsigt over golfbanen',    no: 'utsikt over golfbanen' },
  'Countryside Views':     { it: 'vista sulla campagna',    nl: 'uitzicht op het landschap', pt: 'vista para o campo',         sv: 'utsikt över landskapet',   da: 'udsigt over landskabet',   no: 'utsikt over landskapet' },
  'Bay Views':             { it: 'vista sulla baia',        nl: 'baaizicht',                pt: 'vista para a baía',           sv: 'utsikt över bukten',       da: 'udsigt over bugten',       no: 'utsikt over bukta' },
  'Desert Views':          { it: 'vista sul deserto',       nl: 'woestijnzicht',            pt: 'vista para o deserto',        sv: 'utsikt över öknen',        da: 'udsigt over ørkenen',      no: 'utsikt over ørkenen' },
  'Gulf Views':            { it: 'vista sul golfo',         nl: 'zicht op de golf',         pt: 'vista para o golfo',          sv: 'utsikt över golfen',       da: 'udsigt over golfen',       no: 'utsikt over golfen' },
  'Lagoon Views':          { it: 'vista sulla laguna',      nl: 'lagunezicht',              pt: 'vista para a lagoa',          sv: 'utsikt över lagunen',      da: 'udsigt over lagunen',      no: 'utsikt over lagunen' },
  'Outdoor Kitchen':       { it: 'cucina esterna',          nl: 'buitenkeuken',             pt: 'cozinha externa',             sv: 'utekök',                   da: 'udekøkken',                no: 'utekjøkken' },
  'Panoramic Sea View':    { it: 'vista mare panoramica',   nl: 'panoramisch zeezicht',     pt: 'vista panorâmica para o mar', sv: 'panoramautsikt över havet', da: 'panoramaudsigt over havet', no: 'panoramautsikt over havet' },
  'Panoramic Mountain Views': { it: 'vista panoramica sulle montagne', nl: 'panoramisch bergzicht', pt: 'vista panorâmica para as montanhas', sv: 'panoramautsikt över bergen', da: 'panoramaudsigt over bjergene', no: 'panoramautsikt over fjellene' },
  'Mediterranean Sea Views': { it: 'vista sul Mediterraneo', nl: 'zicht op de Middellandse Zee', pt: 'vista para o Mediterrâneo', sv: 'utsikt över Medelhavet', da: 'udsigt over Middelhavet', no: 'utsikt over Middelhavet' },
  'Community Pools':       { it: 'piscine comuni',           nl: 'gemeenschappelijke zwembaden', pt: 'piscinas comuns',         sv: 'gemensamma pooler',        da: 'fælles pools',             no: 'felles bassenger' },
  'Communal Infinity Pool': { it: 'piscina a sfioro comune', nl: 'gemeenschappelijke infinity pool', pt: 'piscina de borda infinita comum', sv: 'gemensam infinitypool', da: 'fælles infinitypool',   no: 'felles infinitybasseng' },
  'Rooftop Balcony':       { it: 'terrazzo sul tetto',       nl: 'dakbalkon',                pt: 'varanda na cobertura',        sv: 'takbalkong',               da: 'tagaltan',                 no: 'takbalkong' },
  'Heated Infinity Pool':  { it: 'piscina a sfioro riscaldata', nl: 'verwarmde infinity pool', pt: 'piscina de borda infinita aquecida', sv: 'uppvärmd infinitypool', da: 'opvarmet infinitypool', no: 'oppvarmet infinitybasseng' },
  'Infinity Pools':        { it: 'piscine a sfioro',         nl: 'infinity pools',           pt: 'piscinas de borda infinita',  sv: 'infinitypooler',           da: 'infinitypools',            no: 'infinitybassenger' },
  'Private Roof Terrace':  { it: 'terrazza privata sul tetto', nl: 'privédakterras',         pt: 'terraço privativo na cobertura', sv: 'egen takterrass',       da: 'privat tagterrasse',       no: 'privat takterrasse' },
  'Rooftop Jacuzzi':       { it: 'jacuzzi sul tetto',        nl: 'dakjacuzzi',               pt: 'jacuzzi na cobertura',        sv: 'takjacuzzi',               da: 'tagjacuzzi',               no: 'takjacuzzi' },
  'Private Jetty':         { it: 'pontile privato',          nl: 'eigen aanlegsteiger',      pt: 'píer privativo',              sv: 'egen brygga',              da: 'egen bådebro',             no: 'egen brygge' },
  'Private Boat Dock':     { it: 'attracco privato',         nl: 'eigen botensteiger',       pt: 'atracadouro privativo',       sv: 'egen båtplats',            da: 'egen bådplads',            no: 'egen båtplass' },
  'Panoramic Lake View':   { it: 'vista lago panoramica',   nl: 'panoramisch meerzicht',    pt: 'vista panorâmica para o lago', sv: 'panoramautsikt över sjön', da: 'panoramaudsigt over søen',  no: 'panoramautsikt over sjøen' },
  'Panoramic Mountain View': { it: 'vista panoramica sulle montagne', nl: 'panoramisch bergzicht', pt: 'vista panorâmica para as montanhas', sv: 'panoramautsikt över bergen', da: 'panoramaudsigt over bjergene', no: 'panoramautsikt over fjellene' },
  'Mountain View':         { it: 'vista montagne',           nl: 'bergzicht',                pt: 'vista para as montanhas',     sv: 'bergsutsikt',              da: 'bjergudsigt',              no: 'fjellutsikt' },
  'Ocean View':            { it: 'vista oceano',             nl: 'oceaanzicht',              pt: 'vista para o oceano',         sv: 'havsutsikt',               da: 'havudsigt',                no: 'havutsikt' },
  'Golf View':             { it: 'vista sul campo da golf',  nl: 'zicht op de golfbaan',     pt: 'vista para o campo de golfe', sv: 'utsikt över golfbanan',    da: 'udsigt over golfbanen',    no: 'utsikt over golfbanen' },
  'Bay View':              { it: 'vista sulla baia',         nl: 'baaizicht',                pt: 'vista para a baía',           sv: 'utsikt över bukten',       da: 'udsigt over bugten',       no: 'utsikt over bukta' },
  'Countryside View':      { it: 'vista sulla campagna',     nl: 'uitzicht op het landschap', pt: 'vista para o campo',         sv: 'utsikt över landskapet',   da: 'udsigt over landskabet',   no: 'utsikt over landskapet' },
  'Ski-in/Ski-out':        { it: 'ski-in/ski-out',          nl: 'ski-in/ski-out',           pt: 'ski-in/ski-out',              sv: 'ski-in/ski-out',           da: 'ski-in/ski-out',           no: 'ski-in/ski-out' },
  Spa:                     { it: 'spa',                     nl: 'spa',                      pt: 'spa',                         sv: 'spa',                      da: 'spa',                      no: 'spa' },
  Solarium:                { it: 'solarium',                nl: 'solarium',                 pt: 'solário',                     sv: 'solterrass',               da: 'solterrasse',              no: 'solterrasse' },
  'Skyline Views':         { it: 'vista sullo skyline',     nl: 'uitzicht op de skyline',   pt: 'vista para a cidade',         sv: 'utsikt över skylinen',     da: 'udsigt over skylinen',     no: 'utsikt over skylinen' },
  'Private Garden':        { it: 'giardino privato',        nl: 'privétuin',                pt: 'jardim privativo',            sv: 'egen trädgård',            da: 'egen have',                no: 'egen hage' },
  'Two Balconies':         { it: 'due balconi',             nl: 'twee balkons',             pt: 'duas varandas',               sv: 'två balkonger',            da: 'to altaner',               no: 'to balkonger' },
  'Wrap-Around Terrace':   { it: 'terrazza perimetrale',    nl: 'omlopend terras',          pt: 'terraço envolvente',          sv: 'terrass runt huset',       da: 'terrasse hele vejen rundt', no: 'terrasse rundt hele boligen' },
  'Wraparound Terrace':    { it: 'terrazza perimetrale',    nl: 'omlopend terras',          pt: 'terraço envolvente',          sv: 'terrass runt huset',       da: 'terrasse hele vejen rundt', no: 'terrasse rundt hele boligen' },
  'Waterfront Sea Views':  { it: 'vista mare fronte acqua', nl: 'zeezicht aan het water',   pt: 'vista para o mar na primeira linha', sv: 'havsutsikt i första läge', da: 'havudsigt i første række', no: 'sjøutsikt i første rekke' },
  'Ski-In/Ski-Out Access': { it: 'accesso ski-in/ski-out',  nl: 'ski-in/ski-out-toegang',   pt: 'acesso ski-in/ski-out',       sv: 'ski-in/ski-out-läge',      da: 'ski-in/ski-out-adgang',    no: 'ski-in/ski-out-adkomst' },
  'Ski-Station Parking':   { it: 'parcheggio agli impianti', nl: 'parkeerplaats bij de skilift', pt: 'estacionamento na estação de esqui', sv: 'parkering vid liften', da: 'parkering ved liften',  no: 'parkering ved heisen' },
  'Covered Parking':       { it: 'posto auto coperto',      nl: 'overdekte parkeerplaats',  pt: 'estacionamento coberto',      sv: 'parkering under tak',      da: 'overdækket parkering',     no: 'parkering under tak' },
  'Rooftop Infinity Pool': { it: 'piscina a sfioro sul tetto', nl: 'infinity pool op het dak', pt: 'piscina de borda infinita na cobertura', sv: 'infinitypool på taket', da: 'infinitypool på taget', no: 'infinitybasseng på taket' },
  'Resort-Style Pool':     { it: 'piscina in stile resort', nl: 'zwembad in resortstijl',   pt: 'piscina estilo resort',       sv: 'pool i resortstil',        da: 'pool i resortstil',        no: 'basseng i resortstil' },
  'Resort Pool':           { it: 'piscina del resort',      nl: 'resortzwembad',            pt: 'piscina do resort',           sv: 'resortpool',               da: 'resortpool',               no: 'resortbasseng' },
  'Elevated Pool':         { it: 'piscina rialzata',        nl: 'verhoogd zwembad',         pt: 'piscina elevada',             sv: 'upphöjd pool',             da: 'hævet pool',               no: 'hevet basseng' },
  'Creek Views':           { it: 'vista sul torrente',      nl: 'zicht op de kreek',        pt: 'vista para o riacho',         sv: 'utsikt över bäcken',       da: 'udsigt over åen',          no: 'utsikt over bekken' },
  'Lake Tahoe Views':      { it: 'vista sul lago Tahoe',    nl: 'zicht op Lake Tahoe',      pt: 'vista para o lago Tahoe',     sv: 'utsikt över Lake Tahoe',   da: 'udsigt over Lake Tahoe',   no: 'utsikt over Lake Tahoe' },
  'Guest House':           { it: 'dependance',              nl: 'gastenverblijf',           pt: 'casa de hóspedes',            sv: 'gäststuga',                da: 'gæstehus',                 no: 'gjestehus' },
};

// Types that are complete without a bed count. A studio is one room, so
// "Studio With Pool" is a well-formed title and not a malformed one.
const BEDLESS_TYPES = new Set(['Studio']);

// Some titles end with where the home is rather than what it has: "4-Bed
// Modern House With Pool Near The Beach", "3-Bed Apartment in
// Saint-Germain-des-Prés", "6-Bed Historic Home Steps From The Gondola".
//
// Two cases, and they are kept apart on purpose. When the place is a NAME —
// Baqueira-Beret, Sea Pines, Saint-Germain-des-Prés — it passes through
// untouched and only the connector is translated, which never needs an
// article. When the place is a common noun the whole phrase is stored
// already written out, because composing "de" + "el telecabina" gives
// "de el telecabina" and getting that right per language means a contraction
// table nobody wants to maintain.
const LOCATION_CONNECTORS = {
  Near:         { es: 'cerca de',      fr: 'près de',       de: 'nahe',                it: 'vicino a',       nl: 'vlak bij',           pt: 'perto de',         sv: 'nära',              da: 'tæt på',        no: 'nær' },
  'Steps From': { es: 'a un paso de',  fr: 'à deux pas de', de: 'wenige Schritte von', it: 'a due passi da', nl: 'op loopafstand van', pt: 'a dois passos de', sv: 'ett stenkast från', da: 'få skridt fra', no: 'noen skritt fra' },
  In:           { es: 'en',            fr: 'à',             de: 'in',                  it: 'a',              nl: 'in',                 pt: 'em',               sv: 'i',                 da: 'i',             no: 'i' },
};

// Connector + common-noun place, written out per language.
const LOCATION_PHRASES = {
  'Near The Beach':          { es: 'cerca de la playa',                  fr: 'près de la plage',             de: 'in Strandnähe',                     it: 'vicino alla spiaggia',            nl: 'vlak bij het strand',        pt: 'perto da praia',                 sv: 'nära stranden',              da: 'tæt på stranden',              no: 'nær stranden' },
  'Near Ski Resort':         { es: 'cerca de la estación de esquí',      fr: 'près de la station de ski',    de: 'nahe dem Skigebiet',            it: 'vicino al comprensorio sciistico', nl: 'vlak bij het skigebied',    pt: 'perto da estância de esqui',     sv: 'nära skidorten',             da: 'tæt på skiområdet',            no: 'nær skianlegget' },
  'Steps From The Gondola':  { es: 'a un paso del telecabina',           fr: 'à deux pas de la télécabine',  de: 'wenige Schritte von der Gondelbahn', it: 'a due passi dalla cabinovia',  nl: 'op loopafstand van de gondel', pt: 'a dois passos da telecabina',   sv: 'ett stenkast från gondolbanan', da: 'få skridt fra gondolbanen',   no: 'noen skritt fra gondolbanen' },
};

// Word order and connectors per language.
const GRAMMAR = {
  it: { bed1: 'camera',        bedN: 'camere',        prep: 'con', and: 'e'   },
  nl: { bed1: 'slaapkamer',    bedN: 'slaapkamers',   prep: 'met', and: 'en'  },
  pt: { bed1: 'quarto',        bedN: 'quartos',       prep: 'com', and: 'e'   },
  sv: { bed1: 'sovrum',        bedN: 'sovrum',        prep: 'med', and: 'och' },
  da: { bed1: 'soveværelse',   bedN: 'soveværelser',  prep: 'med', and: 'og'  },
  no: { bed1: 'soverom',       bedN: 'soverom',       prep: 'med', and: 'og'  },
};


// ── The 2025 locales: es / fr / de ─────────────────────────────────────────
//
// These three were originally filled by an earlier, free-translation script
// that produced English-style Title Case — `Apartamento De 2 Dormitorios Con
// Piscina`, `Appartement De 2 Chambres Avec Piscine`, `Apartment Mit 2
// Schlafzimmern Und Pool`. Title Case is not an orthographic convention in
// Spanish, French or German: those read as broken to a native speaker, on the
// <title> and <h1> of the site's highest-value pages. They also left some
// English tokens untranslated (`Baltic Sea`, `Estate`, `Farmhouse`).
//
// Bringing them under the same composer fixes casing, terminology and place
// names in one pass, and means all nine translated locales are now generated
// from one vocabulary rather than three scripts.
//
// German note: feature strings are written in the dative, because they always
// follow `mit` — `mit beheiztem Pool`, `mit sonniger Terrasse`. German nouns
// stay capitalised; everything else in the tail is lower-case.
const LEGACY_PLACES = {
  es: { Paris: 'París', London: 'Londres', Munich: 'Múnich', Vienna: 'Viena', Milan: 'Milán', Rome: 'Roma', Florence: 'Florencia', Venice: 'Venecia', Lisbon: 'Lisboa', USA: 'EE. UU.', Spain: 'España', Italy: 'Italia', France: 'Francia', Germany: 'Alemania', Austria: 'Austria', Mexico: 'México', England: 'Inglaterra', Portugal: 'Portugal', Croatia: 'Croacia', Sweden: 'Suecia', Switzerland: 'Suiza', California: 'California', Florida: 'Florida', Colorado: 'Colorado', 'South Carolina': 'Carolina del Sur', 'North Carolina': 'Carolina del Norte', 'New Jersey': 'Nueva Jersey', 'New York': 'Nueva York', "Côte d'Azur": 'Costa Azul', 'Lake Garda': 'Lago de Garda', 'Lake Como': 'Lago de Como', 'Baltic Sea': 'Mar Báltico', Sardinia: 'Cerdeña', Tyrol: 'Tirol', Bavaria: 'Baviera', Istria: 'Istria', Tuscany: 'Toscana', Liguria: 'Liguria', Mallorca: 'Mallorca', Menorca: 'Menorca', 'French Alps': 'Alpes franceses', Provence: 'Provenza', 'Salzburger Land': 'Salzburgo' },
  fr: { Paris: 'Paris', London: 'Londres', Munich: 'Munich', Vienna: 'Vienne', Milan: 'Milan', Rome: 'Rome', Florence: 'Florence', Venice: 'Venise', Lisbon: 'Lisbonne', USA: 'États-Unis', Spain: 'Espagne', Italy: 'Italie', France: 'France', Germany: 'Allemagne', Austria: 'Autriche', Mexico: 'Mexique', England: 'Angleterre', Portugal: 'Portugal', Croatia: 'Croatie', Sweden: 'Suède', Switzerland: 'Suisse', California: 'Californie', Florida: 'Floride', Colorado: 'Colorado', 'South Carolina': 'Caroline du Sud', 'North Carolina': 'Caroline du Nord', 'New Jersey': 'New Jersey', 'New York': 'New York', "Côte d'Azur": "Côte d'Azur", 'Lake Garda': 'Lac de Garde', 'Lake Como': 'Lac de Côme', 'Baltic Sea': 'Mer Baltique', Sardinia: 'Sardaigne', Tyrol: 'Tyrol', Bavaria: 'Bavière', Istria: 'Istrie', Tuscany: 'Toscane', Liguria: 'Ligurie', Mallorca: 'Majorque', Menorca: 'Minorque', 'French Alps': 'Alpes françaises', Provence: 'Provence', 'Salzburger Land': 'Pays de Salzbourg' },
  de: { Paris: 'Paris', London: 'London', Munich: 'München', Vienna: 'Wien', Milan: 'Mailand', Rome: 'Rom', Florence: 'Florenz', Venice: 'Venedig', Lisbon: 'Lissabon', USA: 'USA', Spain: 'Spanien', Italy: 'Italien', France: 'Frankreich', Germany: 'Deutschland', Austria: 'Österreich', Mexico: 'Mexiko', England: 'England', Portugal: 'Portugal', Croatia: 'Kroatien', Sweden: 'Schweden', Switzerland: 'Schweiz', California: 'Kalifornien', Florida: 'Florida', Colorado: 'Colorado', 'South Carolina': 'South Carolina', 'North Carolina': 'North Carolina', 'New Jersey': 'New Jersey', 'New York': 'New York', "Côte d'Azur": "Côte d'Azur", 'Lake Garda': 'Gardasee', 'Lake Como': 'Comer See', 'Baltic Sea': 'Ostsee', Sardinia: 'Sardinien', Tyrol: 'Tirol', Bavaria: 'Bayern', Istria: 'Istrien', Tuscany: 'Toskana', Liguria: 'Ligurien', Mallorca: 'Mallorca', Menorca: 'Menorca', 'French Alps': 'Französische Alpen', Provence: 'Provence', 'Salzburger Land': 'Salzburger Land' },
};

const LEGACY_TYPES = {
  House:               { es: 'Casa',                  fr: 'Maison',                     de: 'Haus' },
  Apartment:           { es: 'Apartamento',           fr: 'Appartement',                de: 'Apartment' },
  Villa:               { es: 'Villa',                 fr: 'Villa',                      de: 'Villa' },
  Chalet:              { es: 'Chalet',                fr: 'Chalet',                     de: 'Chalet' },
  Penthouse:           { es: 'Ático',                 fr: 'Penthouse',                  de: 'Penthouse' },
  Townhouse:           { es: 'Casa adosada',          fr: 'Maison de ville',            de: 'Stadthaus' },
  Estate:              { es: 'Finca señorial',        fr: 'Domaine',                    de: 'Landgut' },
  Finca:               { es: 'Finca',                 fr: 'Finca',                      de: 'Finca' },
  Cottage:             { es: 'Casa de campo',         fr: 'Cottage',                    de: 'Cottage' },
  Cabin:               { es: 'Cabaña',                fr: 'Chalet en bois',             de: 'Blockhütte' },
  Farmhouse:           { es: 'Casa rural',            fr: 'Ferme',                      de: 'Bauernhaus' },
  Maisonette:          { es: 'Dúplex',                fr: 'Maisonnette',                de: 'Maisonette' },
  Duplex:              { es: 'Dúplex',                fr: 'Duplex',                     de: 'Duplex' },
  Studio:              { es: 'Estudio',               fr: 'Studio',                     de: 'Studio' },
  'Private Residence': { es: 'Residencia privada',    fr: 'Résidence privée',           de: 'Privatresidenz' },
  'Garden Apartment':  { es: 'Apartamento con jardín', fr: 'Appartement avec jardin',   de: 'Gartenwohnung' },
  'Terrace Apartment': { es: 'Apartamento con terraza', fr: 'Appartement avec terrasse', de: 'Terrassenwohnung' },
  'Beach House':       { es: 'Casa en la playa',      fr: 'Maison de plage',            de: 'Strandhaus' },
  'Beach Villa':       { es: 'Villa en la playa',     fr: 'Villa de plage',             de: 'Strandvilla' },
  'Mountain House':    { es: 'Casa de montaña',       fr: 'Maison de montagne',         de: 'Berghaus' },
  'Mountain Home':     { es: 'Casa de montaña',       fr: 'Maison de montagne',         de: 'Berghaus' },
  'Coastal House':     { es: 'Casa costera',          fr: 'Maison côtière',             de: 'Küstenhaus' },
  'Waterfront House':  { es: 'Casa frente al agua',   fr: "Maison au bord de l'eau",    de: 'Haus am Wasser' },
  'Lakefront House':   { es: 'Casa frente al lago',   fr: 'Maison au bord du lac',      de: 'Haus am See' },
  'Beachfront House':  { es: 'Casa frente al mar',    fr: 'Maison en front de mer',     de: 'Haus direkt am Strand' },
  'Modern House':      { es: 'Casa moderna',          fr: 'Maison moderne',             de: 'Modernes Haus' },
  'Resort Villa':      { es: 'Villa en resort',       fr: 'Villa de resort',            de: 'Resort-Villa' },
  'Historic Home':     { es: 'Casa histórica',        fr: 'Maison historique',          de: 'Historisches Haus' },
  'City Apartment':    { es: 'Apartamento urbano',    fr: 'Appartement en ville',       de: 'Stadtwohnung' },
  'Vineyard Estate':   { es: 'Finca con viñedo',      fr: 'Domaine viticole',           de: 'Weingut' },
  'Penthouse Maisonette': { es: 'Ático dúplex',       fr: 'Penthouse en duplex',        de: 'Penthouse-Maisonette' },
  'Mid-Century Waterfront House': { es: 'Casa mid-century frente al agua', fr: "Maison mid-century au bord de l'eau", de: 'Mid-Century-Haus am Wasser' },
  'Desert-Modern House': { es: 'Casa desert modern',  fr: 'Maison desert modern',       de: 'Desert-Modern-Haus' },
};

const LEGACY_FEATURES = {
  Pool:                       { es: 'piscina',                          fr: 'piscine',                                de: 'Pool' },
  'Private Pool':             { es: 'piscina privada',                  fr: 'piscine privée',                         de: 'privatem Pool' },
  'Shared Pool':              { es: 'piscina comunitaria',              fr: 'piscine partagée',                       de: 'Gemeinschaftspool' },
  'Infinity Pool':            { es: 'piscina infinita',                 fr: 'piscine à débordement',                  de: 'Infinity-Pool' },
  'Heated Pool':              { es: 'piscina climatizada',              fr: 'piscine chauffée',                       de: 'beheiztem Pool' },
  'Saltwater Pool':           { es: 'piscina de agua salada',           fr: "piscine à l'eau salée",                  de: 'Salzwasserpool' },
  'Rooftop Pool':             { es: 'piscina en la azotea',             fr: 'piscine sur le toit',                    de: 'Dachpool' },
  'Hot Tub':                  { es: 'jacuzzi',                          fr: 'jacuzzi',                                de: 'Whirlpool' },
  'Sea Views':                { es: 'vistas al mar',                    fr: 'vue sur la mer',                         de: 'Meerblick' },
  'Sea View':                 { es: 'vistas al mar',                    fr: 'vue sur la mer',                         de: 'Meerblick' },
  'Ocean Views':              { es: 'vistas al océano',                 fr: "vue sur l'océan",                        de: 'Meerblick' },
  'Ocean View':               { es: 'vistas al océano',                 fr: "vue sur l'océan",                        de: 'Meerblick' },
  'Panoramic Sea Views':      { es: 'vistas panorámicas al mar',        fr: 'vue panoramique sur la mer',             de: 'Panorama-Meerblick' },
  'Panoramic Sea View':       { es: 'vistas panorámicas al mar',        fr: 'vue panoramique sur la mer',             de: 'Panorama-Meerblick' },
  'Mountain Views':           { es: 'vistas a la montaña',              fr: 'vue sur la montagne',                    de: 'Bergblick' },
  'Mountain View':            { es: 'vistas a la montaña',              fr: 'vue sur la montagne',                    de: 'Bergblick' },
  'Panoramic Mountain Views': { es: 'vistas panorámicas a la montaña',  fr: 'vue panoramique sur la montagne',        de: 'Panorama-Bergblick' },
  'Panoramic Mountain View':  { es: 'vistas panorámicas a la montaña',  fr: 'vue panoramique sur la montagne',        de: 'Panorama-Bergblick' },
  'Lake Views':               { es: 'vistas al lago',                   fr: 'vue sur le lac',                         de: 'Seeblick' },
  'Lake View':                { es: 'vistas al lago',                   fr: 'vue sur le lac',                         de: 'Seeblick' },
  'Panoramic Lake Views':     { es: 'vistas panorámicas al lago',       fr: 'vue panoramique sur le lac',             de: 'Panorama-Seeblick' },
  'Panoramic Lake View':      { es: 'vistas panorámicas al lago',       fr: 'vue panoramique sur le lac',             de: 'Panorama-Seeblick' },
  'Beach Access':             { es: 'acceso a la playa',                fr: 'accès à la plage',                       de: 'Strandzugang' },
  Fireplace:                  { es: 'chimenea',                         fr: 'cheminée',                               de: 'Kamin' },
  Sauna:                      { es: 'sauna',                            fr: 'sauna',                                  de: 'Sauna' },
  Terrace:                    { es: 'terraza',                          fr: 'terrasse',                               de: 'Terrasse' },
  'Roof Terrace':             { es: 'terraza en la azotea',             fr: 'toit-terrasse',                          de: 'Dachterrasse' },
  'Sunny Terrace':            { es: 'terraza soleada',                  fr: 'terrasse ensoleillée',                   de: 'sonniger Terrasse' },
  'Private Terrace':          { es: 'terraza privada',                  fr: 'terrasse privée',                        de: 'privater Terrasse' },
  'Two Terraces':             { es: 'dos terrazas',                     fr: 'deux terrasses',                         de: 'zwei Terrassen' },
  Garden:                     { es: 'jardín',                           fr: 'jardin',                                 de: 'Garten' },
  Balcony:                    { es: 'balcón',                           fr: 'balcon',                                 de: 'Balkon' },
  Elevator:                   { es: 'ascensor',                         fr: 'ascenseur',                              de: 'Aufzug' },
  'Wine Cellar':              { es: 'bodega',                           fr: 'cave à vin',                             de: 'Weinkeller' },
  'Harbour View':             { es: 'vistas al puerto',                 fr: 'vue sur le port',                        de: 'Hafenblick' },
  'Marina Views':             { es: 'vistas al puerto deportivo',       fr: 'vue sur la marina',                      de: 'Marina-Blick' },
  'Golf Views':               { es: 'vistas al campo de golf',          fr: 'vue sur le golf',                        de: 'Golfblick' },
  'Golf View':                { es: 'vistas al campo de golf',          fr: 'vue sur le golf',                        de: 'Golfblick' },
  'Countryside Views':        { es: 'vistas al campo',                  fr: 'vue sur la campagne',                    de: 'Blick ins Grüne' },
  'Countryside View':         { es: 'vistas al campo',                  fr: 'vue sur la campagne',                    de: 'Blick ins Grüne' },
  'Bay Views':                { es: 'vistas a la bahía',                fr: 'vue sur la baie',                        de: 'Blick auf die Bucht' },
  'Bay View':                 { es: 'vistas a la bahía',                fr: 'vue sur la baie',                        de: 'Blick auf die Bucht' },
  'Desert Views':             { es: 'vistas al desierto',               fr: 'vue sur le désert',                      de: 'Wüstenblick' },
  'Gulf Views':               { es: 'vistas al golfo',                  fr: 'vue sur le golfe',                       de: 'Blick auf den Golf' },
  'Lagoon Views':             { es: 'vistas a la laguna',               fr: 'vue sur le lagon',                       de: 'Blick auf die Lagune' },
  'Mediterranean Sea Views':  { es: 'vistas al Mediterráneo',           fr: 'vue sur la Méditerranée',                de: 'Blick aufs Mittelmeer' },
  'Outdoor Kitchen':          { es: 'cocina exterior',                  fr: 'cuisine extérieure',                     de: 'Außenküche' },
  'Community Pools':          { es: 'piscinas comunitarias',            fr: 'piscines communes',                      de: 'Gemeinschaftspools' },
  'Communal Infinity Pool':   { es: 'piscina infinita comunitaria',     fr: 'piscine à débordement commune',          de: 'Gemeinschafts-Infinity-Pool' },
  'Rooftop Balcony':          { es: 'balcón en la azotea',              fr: 'balcon sur le toit',                     de: 'Dachbalkon' },
  'Heated Infinity Pool':     { es: 'piscina infinita climatizada',     fr: 'piscine à débordement chauffée',         de: 'beheiztem Infinity-Pool' },
  'Infinity Pools':           { es: 'piscinas infinitas',               fr: 'piscines à débordement',                 de: 'Infinity-Pools' },
  'Private Roof Terrace':     { es: 'terraza privada en la azotea',     fr: 'toit-terrasse privé',                    de: 'privater Dachterrasse' },
  'Rooftop Jacuzzi':          { es: 'jacuzzi en la azotea',             fr: 'jacuzzi sur le toit',                    de: 'Dach-Whirlpool' },
  'Private Jetty':            { es: 'embarcadero privado',              fr: 'ponton privé',                           de: 'privatem Bootssteg' },
  'Private Boat Dock':        { es: 'amarre privado',                   fr: 'appontement privé',                      de: 'privatem Bootsanleger' },
  'Ski-in/Ski-out':           { es: 'ski-in/ski-out',                   fr: 'ski-in/ski-out',                         de: 'Ski-in/Ski-out' },
  Spa:                        { es: 'spa',                              fr: 'spa',                                    de: 'Spa' },
  Solarium:                   { es: 'solárium',                         fr: 'solarium',                               de: 'Sonnenterrasse' },
  'Skyline Views':            { es: 'vistas al skyline',                fr: 'vue sur les gratte-ciel',                de: 'Skyline-Blick' },
  'Private Garden':           { es: 'jardín privado',                   fr: 'jardin privé',                           de: 'eigenem Garten' },
  'Two Balconies':            { es: 'dos balcones',                     fr: 'deux balcons',                           de: 'zwei Balkonen' },
  'Wrap-Around Terrace':      { es: 'terraza envolvente',               fr: 'terrasse enveloppante',                  de: 'umlaufender Terrasse' },
  'Wraparound Terrace':       { es: 'terraza envolvente',               fr: 'terrasse enveloppante',                  de: 'umlaufender Terrasse' },
  'Waterfront Sea Views':     { es: 'vistas al mar en primera línea',   fr: 'vue mer en première ligne',              de: 'Meerblick in erster Reihe' },
  'Ski-In/Ski-Out Access':    { es: 'acceso ski-in/ski-out',            fr: 'accès ski aux pieds',                    de: 'Ski-in/Ski-out-Zugang' },
  'Ski-Station Parking':      { es: 'aparcamiento en la estación',      fr: 'parking à la station',                   de: 'Parkplatz an der Bergbahn' },
  'Covered Parking':          { es: 'aparcamiento cubierto',            fr: 'parking couvert',                        de: 'überdachtem Stellplatz' },
  'Rooftop Infinity Pool':    { es: 'piscina infinita en la azotea',    fr: 'piscine à débordement sur le toit',      de: 'Infinity-Dachpool' },
  'Resort-Style Pool':        { es: 'piscina estilo resort',            fr: 'piscine façon resort',                   de: 'Pool im Resort-Stil' },
  'Resort Pool':              { es: 'piscina del resort',               fr: 'piscine du resort',                      de: 'Resort-Pool' },
  'Elevated Pool':            { es: 'piscina elevada',                  fr: 'piscine surélevée',                      de: 'erhöhtem Pool' },
  'Creek Views':              { es: 'vistas al arroyo',                 fr: 'vue sur le ruisseau',                    de: 'Blick auf den Bach' },
  'Lake Tahoe Views':         { es: 'vistas al lago Tahoe',             fr: 'vue sur le lac Tahoe',                   de: 'Blick auf den Lake Tahoe' },
  'Guest House':              { es: 'casa de invitados',                fr: "maison d'amis",                          de: 'Gästehaus' },
};

const LEGACY_GRAMMAR = {
  es: { bed1: 'dormitorio',   bedN: 'dormitorios',   prep: 'con',   and: 'y'   },
  fr: { bed1: 'chambre',      bedN: 'chambres',      prep: 'avec',  and: 'et'  },
  de: { bed1: 'Schlafzimmer', bedN: 'Schlafzimmern', prep: 'mit',   and: 'und' },
};

for (const [loc, map] of Object.entries(LEGACY_PLACES)) PLACES[loc] = map;
for (const [loc, g] of Object.entries(LEGACY_GRAMMAR)) GRAMMAR[loc] = g;
for (const [key, cols] of Object.entries(LEGACY_TYPES)) TYPES[key] = { ...(TYPES[key] || {}), ...cols };
for (const [key, cols] of Object.entries(LEGACY_FEATURES)) FEATURES[key] = { ...(FEATURES[key] || {}), ...cols };

function joinList(items, and) {
  if (items.length === 1) return items[0];
  return items.slice(0, -1).join(', ') + ` ${and} ` + items[items.length - 1];
}

/** Rebuild a title in `locale`, or return null when any token is unknown. */
function translateTitle(title, locale) {
  const parts = title.split(' — ');
  if (parts.length !== 2) return null;
  const [head, tail] = parts;

  const place = head
    .split(',')
    .map((seg) => {
      const s = seg.trim();
      return (PLACES[locale] && PLACES[locale][s]) || s;
    })
    .join(', ');

  // A trailing location suffix comes off first, so the rest of the tail parses
  // as usual and the suffix is translated on its own terms.
  let body = tail;
  let locationSuffix = '';
  const sufMatch = /^(.*?)\s+(Near|Steps From|In|in)\s+(.+)$/.exec(tail);
  if (sufMatch) {
    const [, before, connectorRaw] = sufMatch;
    let placeRaw = sufMatch[3];
    let trailing = '';
    // The suffix can sit in the middle: "Apartment Steps From Baqueira-Beret
    // With Covered Parking". Without this the greedy place match swallowed
    // "Baqueira-Beret With Covered Parking" and the English came out the
    // other side inside a Spanish title.
    const withInPlace = /^(.*?)\s+With\s+(.+)$/.exec(placeRaw);
    if (withInPlace) { placeRaw = withInPlace[1]; trailing = ` With ${withInPlace[2]}`; }
    const key = connectorRaw === 'in' ? 'In' : connectorRaw;
    const whole = LOCATION_PHRASES[`${key} ${placeRaw}`];
    const connector = LOCATION_CONNECTORS[key];
    const phrase = (whole && whole[locale]) ||
      (connector && connector[locale] ? `${connector[locale]} ${placeRaw}` : null);
    if (!phrase) return null;
    body = before.replace(/,\s*$/, '') + trailing;
    locationSuffix = ` ${phrase}`;
  }

  // {N}-Bed {Type}[ With {Feature}[, {Feature}][ & {Feature}]]
  //   |  {N}-Bed {Type} Ski-in/Ski-out
  //   |  {Type}[ With {Feature}…]        ← a studio has no bed count
  const m = /^(?:(\d+)-Bed )?(.+?)(?: With (.+))?$/.exec(body);
  if (!m) return null;
  const [, bedsRaw, typeRaw, featuresRaw] = m;
  // Only bedless types may omit the count; anything else without one is a
  // title shape we do not recognise, and guessing at it is the whole thing
  // this script exists not to do.
  if (!bedsRaw && !BEDLESS_TYPES.has(typeRaw)) return null;

  let typeName = typeRaw;
  const extraFeatures = [];
  if (/ Ski-in\/Ski-out$/i.test(typeName)) {
    typeName = typeName.replace(/ Ski-in\/Ski-out$/i, '');
    extraFeatures.push('Ski-in/Ski-out');
  }

  const type = TYPES[typeName] && TYPES[typeName][locale];
  if (!type) return null;

  // Features are separated by commas as well as by "&": a three-feature tail
  // reads "Roof Terrace, Lake Views & Sauna". Splitting on "&" alone made the
  // comma-joined pair one unrecognised token, so every such row was skipped.
  const featureNames = [
    ...(featuresRaw ? featuresRaw.split(/\s*(?:&|,)\s*/).map((f) => f.trim()).filter(Boolean) : []),
    ...extraFeatures,
  ];
  const features = [];
  for (const f of featureNames) {
    const t = FEATURES[f] && FEATURES[f][locale];
    if (!t) return null; // unknown feature — skip the row rather than guess
    features.push(t);
  }

  const g = GRAMMAR[locale];
  const clauseParts = [];
  if (bedsRaw) {
    const beds = Number(bedsRaw);
    clauseParts.push(`${beds} ${beds === 1 ? g.bed1 : g.bedN}`);
  }
  clauseParts.push(...features);
  // A studio with no features is just the type: "Estudio", not "Estudio con".
  const out = clauseParts.length
    ? `${place} — ${type} ${g.prep} ${joinList(clauseParts, g.and)}${locationSuffix}`
    : `${place} — ${type}${locationSuffix}`;
  // Last guard. If an English connector survived into the output, something
  // was parsed wrongly and a half-translated title is worse than none — which
  // is the rule the whole file is built on.
  if (locale !== 'en' && /\s(?:With|Near|Steps From)\s/.test(out)) return null;
  return out;
}

export { translateTitle, LOCALES };
