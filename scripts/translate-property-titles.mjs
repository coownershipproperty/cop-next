#!/usr/bin/env node
/**
 * scripts/translate-property-titles.mjs
 *
 * Fills title_{locale} on the properties table for the 2026 languages, by
 * composing rather than translating. COP titles follow one strict grammar:
 *
 *   {City}, {Region}, {Country} — {N}-Bed {Type} With {Feature} & {Feature}
 *
 * so a title can be rebuilt in another language from three small vocabularies
 * (places, property types, features) plus that language's word order. That is
 * far safer than free translation: the output is deterministic, reviewable, and
 * identical for identical inputs.
 *
 * THE RULE THAT MAKES THIS SAFE: a row is only written when every token in its
 * tail is known. One unrecognised type or feature and the row is skipped and
 * reported — never guessed at, never half-translated. Place segments are the
 * exception and pass through unchanged when unmapped, because they are city
 * names, which do not translate. Countries and geographic features that DO
 * translate are enumerated exhaustively in PLACES below.
 *
 *   node scripts/translate-property-titles.mjs            # dry run, all locales
 *   node scripts/translate-property-titles.mjs it nl      # dry run, two locales
 *   node scripts/translate-property-titles.mjs --write    # write to Supabase
 *
 * Terminology follows docs/translation-glossary.md. Note these are titles only:
 * the thin-content gate in lib/i18n.js (translatedLocales) requires BOTH title
 * and description, so running this does not by itself make a locale's property
 * pages indexable — descriptions are the other half.
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'node:fs';

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

  // {N}-Bed {Type}[ With {Feature}[ & {Feature}]]  |  {N}-Bed {Type} Ski-in/Ski-out
  const m = /^(\d+)-Bed (.+?)(?: With (.+))?$/.exec(tail);
  if (!m) return null;
  const [, bedsRaw, typeRaw, featuresRaw] = m;

  let typeName = typeRaw;
  const extraFeatures = [];
  if (/ Ski-in\/Ski-out$/i.test(typeName)) {
    typeName = typeName.replace(/ Ski-in\/Ski-out$/i, '');
    extraFeatures.push('Ski-in/Ski-out');
  }

  const type = TYPES[typeName] && TYPES[typeName][locale];
  if (!type) return null;

  const featureNames = [
    ...(featuresRaw ? featuresRaw.split(/\s*&\s*/).map((f) => f.trim()) : []),
    ...extraFeatures,
  ];
  const features = [];
  for (const f of featureNames) {
    const t = FEATURES[f] && FEATURES[f][locale];
    if (!t) return null; // unknown feature — skip the row rather than guess
    features.push(t);
  }

  const g = GRAMMAR[locale];
  const beds = Number(bedsRaw);
  const bedPhrase = `${beds} ${beds === 1 ? g.bed1 : g.bedN}`;
  const clause = joinList([bedPhrase, ...features], g.and);
  return `${place} — ${type} ${g.prep} ${clause}`;
}

// ── Runner ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const write = args.includes('--write');
const locales = args.filter((a) => LOCALES.includes(a));
const targets = locales.length ? locales : LOCALES;

// Reads with the public anon key; writes need SUPABASE_SERVICE_ROLE_KEY in the
// environment (never committed). Without --write the script only prints, which
// is how you check coverage before touching the database.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iotzzoxyckpyatzqcjbo.supabase.co';
// The anon key is public (next.config.js already ships it to the browser), so
// a dry run needs no secrets at all — read it straight out of the config.
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || (readFileSync(new URL('../next.config.js', import.meta.url), 'utf-8')
        .match(/NEXT_PUBLIC_SUPABASE_ANON_KEY: process\.env\.NEXT_PUBLIC_SUPABASE_ANON_KEY \|\| '([^']+)'/) || [])[1];
const key = write ? process.env.SUPABASE_SERVICE_ROLE_KEY : anonKey;
if (write && !key) {
  console.error('--write needs SUPABASE_SERVICE_ROLE_KEY in the environment.');
  process.exit(1);
}
const supabase = createClient(url, key);

// --emit-sql prints UPDATE statements instead of writing, so the change can be
// applied through whatever authenticated path is to hand and reviewed first.
const emitSql = args.includes('--emit-sql');

const { data: rows, error } = await supabase.from('properties').select('slug, title');
if (error) { console.error(error.message); process.exit(1); }

const unknown = new Map();
for (const locale of targets) {
  let ok = 0, skipped = 0;
  const updates = [];
  for (const row of rows) {
    if (!row.title) { skipped++; continue; }
    const t = translateTitle(row.title, locale);
    if (!t) {
      skipped++;
      unknown.set(row.title, (unknown.get(row.title) || 0) + 1);
      continue;
    }
    ok++;
    updates.push({ slug: row.slug, value: t });
  }
  console.log(`${locale}: ${ok} translated, ${skipped} skipped  ` +
    (updates[0] ? `e.g. ${updates[0].value}` : ''));

  if (emitSql) {
    const esc = (v) => `'${String(v).replace(/'/g, "''")}'`;
    const sql = 'update public.properties as p set title_' + locale +
      ' = v.t from (values\n' +
      updates.map((u) => `  (${esc(u.slug)}, ${esc(u.value)})`).join(',\n') +
      `\n) as v(slug, t) where p.slug = v.slug;\n`;
    writeFileSync(`/tmp/titles-${locale}.sql`, sql);
    console.log(`  → wrote /tmp/titles-${locale}.sql (${updates.length} rows)`);
  }

  if (write) {
    for (let i = 0; i < updates.length; i += 50) {
      const batch = updates.slice(i, i + 50);
      await Promise.all(batch.map((u) =>
        supabase.from('properties').update({ [`title_${locale}`]: u.value }).eq('slug', u.slug)
      ));
    }
    console.log(`  → wrote ${updates.length} title_${locale} values`);
  }
}

if (unknown.size) {
  console.log(`\n${unknown.size} distinct titles skipped (unknown type or feature). Top 15:`);
  [...unknown.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15)
    .forEach(([t]) => console.log('  ', t.split(' — ')[1]));
  console.log('\nAdd the missing token to TYPES or FEATURES to cover these.');
}
