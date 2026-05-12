#!/usr/bin/env node
/**
 * scripts/translate-amenities-bulk.js
 *
 * Programmatically translates property amenity arrays to ES + FR.
 * Strategy: a lookup table covers the ~80 most common amenities (which account
 * for >90% of all amenity instances in the catalog). Anything not in the
 * lookup table is left in English — PropertyCard already does locale fallback,
 * so unmapped amenities still display fine, just in English.
 *
 * Run with:
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/translate-amenities-bulk.js
 *
 * Idempotent: only processes rows where amenities_es / amenities_fr is empty
 * unless --force is passed.
 */

const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://iotzzoxyckpyatzqcjbo.supabase.co';
const BASE = `${SUPABASE_URL}/rest/v1`;
const FORCE = process.argv.includes('--force');
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_ROLE) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// ── Amenity translation table ──────────────────────────────────────────────
// Keys are normalised (lowercase, trimmed). Values give the localised display.
// If the input doesn't match, we keep the original (English fallback).
const AMENITIES = {
  // Top-frequency amenities (80% of all instances)
  'fully furnished':            { es: 'Totalmente amueblada',         fr: 'Entièrement meublée' },
  'professionally decorated':   { es: 'Decoración profesional',       fr: 'Décoration professionnelle' },
  'pet friendly':               { es: 'Admite mascotas',              fr: 'Accepte les animaux' },
  'high-speed internet':        { es: 'Internet de alta velocidad',   fr: 'Internet haut débit' },
  'high speed internet':        { es: 'Internet de alta velocidad',   fr: 'Internet haut débit' },
  'kid friendly':               { es: 'Apta para niños',              fr: 'Adaptée aux enfants' },
  'smart tvs':                  { es: 'Smart TVs',                    fr: 'Smart TV' },
  'smart tv':                   { es: 'Smart TV',                     fr: 'Smart TV' },
  'cable':                      { es: 'TV por cable',                 fr: 'Câble' },
  'owner storage':              { es: 'Almacenamiento para propietarios', fr: 'Stockage propriétaires' },
  'storage for owners':         { es: 'Almacenamiento para propietarios', fr: 'Stockage propriétaires' },
  'security system':            { es: 'Sistema de seguridad',         fr: 'Système de sécurité' },
  'kitchen island':             { es: 'Isla de cocina',               fr: 'Îlot de cuisine' },
  'fireplace':                  { es: 'Chimenea',                     fr: 'Cheminée' },
  'chimney':                    { es: 'Chimenea',                     fr: 'Cheminée' },
  'hot tub':                    { es: 'Jacuzzi',                      fr: 'Jacuzzi' },
  'jacuzzi':                    { es: 'Jacuzzi',                      fr: 'Jacuzzi' },
  'outdoor entertaining':       { es: 'Zona de ocio exterior',        fr: 'Espace de réception extérieur' },
  'walk-in closet':             { es: 'Vestidor',                     fr: 'Dressing' },
  'grill':                      { es: 'Parrilla',                     fr: 'Grill' },
  'bbq':                        { es: 'Barbacoa',                     fr: 'Barbecue' },
  'bbq area':                   { es: 'Zona de barbacoa',             fr: 'Espace barbecue' },
  'pool':                       { es: 'Piscina',                      fr: 'Piscine' },
  'private pool':               { es: 'Piscina privada',              fr: 'Piscine privée' },
  'shared pool':                { es: 'Piscina compartida',           fr: 'Piscine partagée' },
  'pool - shared':              { es: 'Piscina compartida',           fr: 'Piscine partagée' },
  'swimming pool':              { es: 'Piscina',                      fr: 'Piscine' },
  'heated pool':                { es: 'Piscina climatizada',          fr: 'Piscine chauffée' },
  'infinity pool':              { es: 'Piscina infinita',             fr: 'Piscine à débordement' },
  'saltwater pool':             { es: 'Piscina de agua salada',       fr: 'Piscine à eau salée' },
  'rooftop pool':               { es: 'Piscina en la azotea',         fr: 'Piscine sur le toit' },
  'plunge pool':                { es: 'Piscina pequeña',              fr: 'Petit bassin' },
  'lap pool':                   { es: 'Piscina de natación',          fr: 'Piscine de nage' },
  'soaking tub':                { es: 'Bañera de hidromasaje',        fr: 'Baignoire balnéo' },
  'fire pit':                   { es: 'Brasero',                      fr: 'Brasero' },
  'rooftop fire pit':           { es: 'Brasero en la azotea',         fr: 'Brasero sur le toit' },
  'outdoor kitchen':            { es: 'Cocina exterior',              fr: 'Cuisine extérieure' },
  "chef's kitchen":             { es: 'Cocina de chef',               fr: 'Cuisine de chef' },
  'open concept kitchen':       { es: 'Cocina abierta',               fr: 'Cuisine ouverte' },
  'rooftop kitchen':            { es: 'Cocina en la azotea',          fr: 'Cuisine sur le toit' },
  '2-car garage':               { es: 'Garaje para 2 coches',         fr: 'Garage 2 voitures' },
  '1-car garage':               { es: 'Garaje para 1 coche',          fr: 'Garage 1 voiture' },
  '3-car garage':               { es: 'Garaje para 3 coches',         fr: 'Garage 3 voitures' },
  '4-car garage':               { es: 'Garaje para 4 coches',         fr: 'Garage 4 voitures' },
  'garage':                     { es: 'Garaje',                       fr: 'Garage' },
  'carport':                    { es: 'Cochera',                      fr: 'Abri voiture' },
  'parking':                    { es: 'Aparcamiento',                 fr: 'Parking' },
  'private parking':            { es: 'Aparcamiento privado',         fr: 'Parking privé' },
  'sunset views':               { es: 'Vistas al atardecer',          fr: 'Vue sur le coucher du soleil' },
  'sunrise views':              { es: 'Vistas al amanecer',           fr: 'Vue sur le lever du soleil' },
  'sea view':                   { es: 'Vistas al mar',                fr: 'Vue mer' },
  'sea views':                  { es: 'Vistas al mar',                fr: 'Vue mer' },
  'panoramic sea view':         { es: 'Vistas panorámicas al mar',    fr: 'Vue mer panoramique' },
  'panoramic sea views':        { es: 'Vistas panorámicas al mar',    fr: 'Vue mer panoramique' },
  'ocean views':                { es: 'Vistas al océano',             fr: 'Vue océan' },
  'mountain views':             { es: 'Vistas a la montaña',          fr: 'Vue sur la montagne' },
  'panoramic mountain views':   { es: 'Vistas panorámicas a la montaña', fr: 'Vue panoramique sur la montagne' },
  'lake views':                 { es: 'Vistas al lago',               fr: 'Vue sur le lac' },
  'country views':              { es: 'Vistas al campo',              fr: 'Vue sur la campagne' },
  'vineyard views':             { es: 'Vistas a los viñedos',         fr: 'Vue sur les vignes' },
  'golf course views':          { es: 'Vistas al campo de golf',      fr: 'Vue sur le golf' },
  'bay views':                  { es: 'Vistas a la bahía',            fr: 'Vue sur la baie' },
  'harbour views':              { es: 'Vistas al puerto',             fr: 'Vue sur le port' },
  'city views':                 { es: 'Vistas a la ciudad',           fr: 'Vue sur la ville' },
  '360 degree views':           { es: 'Vistas de 360 grados',         fr: 'Vue à 360 degrés' },
  'spectacular view':           { es: 'Vista espectacular',           fr: 'Vue spectaculaire' },
  'panoramic view':             { es: 'Vista panorámica',             fr: 'Vue panoramique' },
  'views':                      { es: 'Vistas',                       fr: 'Vues' },
  'wet bar':                    { es: 'Barra de bar',                 fr: 'Bar' },
  'wine fridge':                { es: 'Vinoteca',                     fr: 'Cave à vin' },
  'wine cellar':                { es: 'Bodega de vino',               fr: 'Cave à vin' },
  'wine storage':               { es: 'Almacenamiento de vinos',      fr: 'Cave à vin' },
  'wine room':                  { es: 'Sala de vinos',                fr: 'Cave à vin' },
  'deck':                       { es: 'Terraza de madera',            fr: 'Terrasse en bois' },
  'covered deck':               { es: 'Terraza cubierta',             fr: 'Terrasse couverte' },
  'rooftop deck':               { es: 'Terraza en la azotea',         fr: 'Terrasse sur le toit' },
  'wraparound deck':            { es: 'Terraza envolvente',           fr: 'Terrasse panoramique' },
  'patio':                      { es: 'Patio',                        fr: 'Patio' },
  'covered patio':              { es: 'Patio cubierto',               fr: 'Patio couvert' },
  'terrace':                    { es: 'Terraza',                      fr: 'Terrasse' },
  'covered terrace':            { es: 'Terraza cubierta',             fr: 'Terrasse couverte' },
  'private balcony':            { es: 'Balcón privado',               fr: 'Balcon privé' },
  'balcony':                    { es: 'Balcón',                       fr: 'Balcon' },
  'private garden':             { es: 'Jardín privado',               fr: 'Jardin privé' },
  'garden':                     { es: 'Jardín',                       fr: 'Jardin' },
  'spacious garden':            { es: 'Jardín espacioso',             fr: 'Jardin spacieux' },
  'mediterranean garden':       { es: 'Jardín mediterráneo',          fr: 'Jardin méditerranéen' },
  'small private garden':       { es: 'Pequeño jardín privado',       fr: 'Petit jardin privé' },
  'fenced yard':                { es: 'Jardín vallado',               fr: 'Jardin clôturé' },
  'courtyard':                  { es: 'Patio interior',               fr: 'Cour intérieure' },
  'vaulted ceilings':           { es: 'Techos abovedados',            fr: 'Plafonds voûtés' },
  'desk':                       { es: 'Escritorio',                   fr: 'Bureau' },
  'office':                     { es: 'Oficina',                      fr: 'Bureau' },
  'home gym':                   { es: 'Gimnasio en casa',             fr: 'Salle de sport privée' },
  'workout room':               { es: 'Sala de ejercicios',           fr: 'Salle de fitness' },
  'gym':                        { es: 'Gimnasio',                     fr: 'Salle de sport' },
  'home theater':               { es: 'Cine en casa',                 fr: 'Cinéma maison' },
  'in-home theater':            { es: 'Cine en casa',                 fr: 'Cinéma maison' },
  'home cinema for the whole family': { es: 'Cine en casa para toda la familia', fr: 'Cinéma maison pour toute la famille' },
  'bunk room':                  { es: 'Habitación de literas',        fr: 'Chambre avec lits superposés' },
  'beach access':               { es: 'Acceso a la playa',            fr: 'Accès plage' },
  'near beach':                 { es: 'Cerca de la playa',            fr: 'Proche de la plage' },
  'beach':                      { es: 'Playa',                        fr: 'Plage' },
  'beach within walking distance': { es: 'Playa a pocos pasos',       fr: 'Plage à pied' },
  'walking distance to the beach': { es: 'Playa a pocos pasos',       fr: 'Plage à pied' },
  'oceanfront':                 { es: 'Frente al océano',             fr: 'Front de mer' },
  'waterfront':                 { es: 'Frente al agua',               fr: 'Bord de l\'eau' },
  'lakefront':                  { es: 'Frente al lago',               fr: 'Bord du lac' },
  'sauna':                      { es: 'Sauna',                        fr: 'Sauna' },
  'private sauna':              { es: 'Sauna privada',                fr: 'Sauna privé' },
  'outdoor sauna':              { es: 'Sauna exterior',               fr: 'Sauna extérieur' },
  'spa':                        { es: 'Spa',                          fr: 'Spa' },
  'rooftop spa':                { es: 'Spa en la azotea',             fr: 'Spa sur le toit' },
  'steam shower':               { es: 'Ducha de vapor',               fr: 'Douche vapeur' },
  'steam room':                 { es: 'Sala de vapor',                fr: 'Hammam' },
  'rain shower':                { es: 'Ducha tropical',               fr: 'Douche pluie' },
  'outdoor shower':             { es: 'Ducha exterior',               fr: 'Douche extérieure' },
  'wellness area with sauna':   { es: 'Zona wellness con sauna',      fr: 'Espace bien-être avec sauna' },
  'fitness/wellness area with sauna': { es: 'Zona wellness con sauna', fr: 'Espace bien-être avec sauna' },
  'fitness area':               { es: 'Zona de fitness',              fr: 'Espace fitness' },
  'wellness/fitness area':      { es: 'Zona wellness/fitness',        fr: 'Espace bien-être/fitness' },
  'gym & sauna':                { es: 'Gimnasio y sauna',             fr: 'Salle de sport et sauna' },
  'mud room':                   { es: 'Vestíbulo de servicio',        fr: 'Vestiaire' },
  'guest house':                { es: 'Casa de invitados',            fr: 'Maison d\'amis' },
  'breakfast nook':             { es: 'Rincón de desayuno',           fr: 'Coin petit-déjeuner' },
  'rooftop entertaining':       { es: 'Zona de ocio en la azotea',    fr: 'Réception sur le toit' },
  'rooftop bar':                { es: 'Bar en la azotea',             fr: 'Bar sur le toit' },
  'rooftop grill':              { es: 'Parrilla en la azotea',        fr: 'Grill sur le toit' },
  'water feature':              { es: 'Fuente de agua',               fr: 'Élément d\'eau' },
  'biking trail access':        { es: 'Acceso a rutas en bici',       fr: 'Accès pistes vélo' },
  'hiking trail access':        { es: 'Acceso a rutas de senderismo', fr: 'Accès sentiers de randonnée' },
  'fishing access':             { es: 'Acceso para pesca',            fr: 'Accès pêche' },
  'pool access':                { es: 'Acceso a piscina',             fr: 'Accès piscine' },
  'tennis court access':        { es: 'Acceso a pista de tenis',      fr: 'Accès court de tennis' },
  'tennis court':               { es: 'Pista de tenis',               fr: 'Court de tennis' },
  'tennis':                     { es: 'Tenis',                        fr: 'Tennis' },
  'pickleball court':           { es: 'Pista de pickleball',          fr: 'Court de pickleball' },
  'bocce court':                { es: 'Pista de bocce',               fr: 'Terrain de pétanque' },
  'boules court':               { es: 'Pista de petanca',             fr: 'Terrain de pétanque' },
  'golf':                       { es: 'Golf',                         fr: 'Golf' },
  'ski-in/ski-out':             { es: 'Ski-in/ski-out',               fr: 'Ski au pied' },
  'ski lift access':            { es: 'Acceso a remontes',            fr: 'Accès remontées mécaniques' },
  'ski storage':                { es: 'Almacenamiento para esquís',   fr: 'Local à skis' },
  'ski lockers':                { es: 'Taquillas de esquí',           fr: 'Casiers à skis' },
  'ski':                        { es: 'Esquí',                        fr: 'Ski' },
  'bikes':                      { es: 'Bicicletas',                   fr: 'Vélos' },
  'kayaks':                     { es: 'Kayaks',                       fr: 'Kayaks' },
  'paddleboards':               { es: 'Paddleboards',                 fr: 'Paddles' },
  'duffy boat':                 { es: 'Barco Duffy',                  fr: 'Bateau Duffy' },
  'walk to town':               { es: 'A pie del centro',             fr: 'Centre-ville à pied' },
  'restaurants and shops within walking distance': { es: 'Restaurantes y tiendas a pocos pasos', fr: 'Restaurants et boutiques à pied' },
  'restaurants and shops nearby': { es: 'Restaurantes y tiendas cercanos', fr: 'Restaurants et boutiques à proximité' },
  'restaurants':                { es: 'Restaurantes',                 fr: 'Restaurants' },
  'air conditioning':           { es: 'Aire acondicionado',           fr: 'Climatisation' },
  'air conditioner':            { es: 'Aire acondicionado',           fr: 'Climatisation' },
  'heated floors':              { es: 'Suelo radiante',               fr: 'Sol chauffant' },
  'floor heating':              { es: 'Suelo radiante',               fr: 'Sol chauffant' },
  'heated driveway':            { es: 'Entrada con sistema antihielo', fr: 'Allée chauffée' },
  'elevator':                   { es: 'Ascensor',                     fr: 'Ascenseur' },
  'new construction':           { es: 'Obra nueva',                   fr: 'Construction neuve' },
  'new build':                  { es: 'Obra nueva',                   fr: 'Construction neuve' },
  'modern new build':           { es: 'Obra nueva moderna',           fr: 'Construction neuve moderne' },
  'high-quality new build':     { es: 'Obra nueva de alta calidad',   fr: 'Construction neuve de qualité' },
  'retractable doors':          { es: 'Puertas retráctiles',          fr: 'Portes rétractables' },
  'fireplace for additional cosiness': { es: 'Chimenea para mayor confort', fr: 'Cheminée pour plus de confort' },
  'double washer/dryer':        { es: 'Lavadora y secadora dobles',   fr: 'Double lave-linge/sèche-linge' },
  'en suite laundry':           { es: 'Lavandería en la unidad',      fr: 'Buanderie privée' },
  'washer/dryer in apartment':  { es: 'Lavadora/secadora en el apartamento', fr: 'Lave-linge/sèche-linge dans l\'appartement' },
  'secured gate':               { es: 'Acceso con puerta de seguridad', fr: 'Portail sécurisé' },
  'gated community':            { es: 'Urbanización cerrada',         fr: 'Résidence sécurisée' },
  'gated property':             { es: 'Propiedad cerrada',            fr: 'Propriété sécurisée' },
  '24/7 surveillance':          { es: 'Vigilancia 24/7',              fr: 'Surveillance 24/7' },
  'alarm system':               { es: 'Sistema de alarma',            fr: 'Système d\'alarme' },
  'concierge':                  { es: 'Conserje',                     fr: 'Conciergerie' },
  'ev charger':                 { es: 'Cargador para coches eléctricos', fr: 'Borne de recharge VE' },
  'sun room':                   { es: 'Solárium',                     fr: 'Véranda' },
  'solarium':                   { es: 'Solárium',                     fr: 'Solarium' },
  'game room':                  { es: 'Sala de juegos',               fr: 'Salle de jeux' },
  'den':                        { es: 'Sala de estar',                fr: 'Petit salon' },
  'loft':                       { es: 'Loft',                         fr: 'Loft' },
  'storage':                    { es: 'Almacenamiento',               fr: 'Rangement' },
  'private dock':               { es: 'Embarcadero privado',          fr: 'Ponton privé' },
  'dock access':                { es: 'Acceso a embarcadero',         fr: 'Accès ponton' },
  'private':                    { es: 'Privado',                      fr: 'Privé' },
  'resort community':           { es: 'Comunidad tipo resort',        fr: 'Résidence type resort' },
  'work from home ready':       { es: 'Lista para teletrabajo',       fr: 'Adapté au télétravail' },
  'all essential equipment':    { es: 'Equipamiento esencial completo', fr: 'Équipement essentiel complet' },
  'mountain':                   { es: 'Montaña',                      fr: 'Montagne' },
  'fireplace for additional cosiness - optional': { es: 'Chimenea opcional para mayor confort', fr: 'Cheminée optionnelle pour plus de confort' },
  'panoramic view of the lake': { es: 'Vista panorámica del lago',    fr: 'Vue panoramique sur le lac' },
  'panoramic view of the mountains': { es: 'Vista panorámica de las montañas', fr: 'Vue panoramique sur les montagnes' },
  'view of the lake and the mountains': { es: 'Vista al lago y a la montaña', fr: 'Vue sur le lac et les montagnes' },
  'view of the surrounding countryside': { es: 'Vista al campo circundante', fr: 'Vue sur la campagne environnante' },
  'optional rental program':    { es: 'Programa de alquiler opcional', fr: 'Programme de location optionnel' },
  'touristic licence':          { es: 'Licencia turística',           fr: 'Licence touristique' },
  'tourist license':            { es: 'Licencia turística',           fr: 'Licence touristique' },
  'sunny south-facing terrace': { es: 'Terraza soleada orientada al sur', fr: 'Terrasse ensoleillée plein sud' },
  'south-facing terrace':       { es: 'Terraza orientada al sur',     fr: 'Terrasse plein sud' },
  'south-facing balcony':       { es: 'Balcón orientado al sur',      fr: 'Balcon plein sud' },
  'sunny south-east facing terrace': { es: 'Terraza soleada orientada al sureste', fr: 'Terrasse ensoleillée sud-est' },
  'sunny south-west facing terrace': { es: 'Terraza soleada orientada al suroeste', fr: 'Terrasse ensoleillée sud-ouest' },
  'south-east facing terrace':  { es: 'Terraza orientada al sureste', fr: 'Terrasse sud-est' },
  'south-west facing terrace':  { es: 'Terraza orientada al suroeste', fr: 'Terrasse sud-ouest' },
  'west-facing terrace':        { es: 'Terraza orientada al oeste',   fr: 'Terrasse ouest' },
  'sunny west-facing terrace':  { es: 'Terraza soleada orientada al oeste', fr: 'Terrasse ensoleillée ouest' },
  'sunny terraces':             { es: 'Terrazas soleadas',            fr: 'Terrasses ensoleillées' },
  'spacious outdoor areas':     { es: 'Amplias zonas exteriores',     fr: 'Vastes espaces extérieurs' },
  'sun-kissed outdoor areas':   { es: 'Zonas exteriores soleadas',    fr: 'Espaces extérieurs ensoleillés' },
  'inside-out living with outdoor kitchen': { es: 'Vida interior-exterior con cocina al aire libre', fr: 'Vie intérieur-extérieur avec cuisine extérieure' },
  'rooftop hot tub':            { es: 'Jacuzzi en la azotea',         fr: 'Jacuzzi sur le toit' },
  'outdoor fireplace':          { es: 'Chimenea exterior',            fr: 'Cheminée extérieure' },
  'indoor-outdoor fireplace':   { es: 'Chimenea interior-exterior',   fr: 'Cheminée intérieur-extérieur' },
  'pizza oven':                 { es: 'Horno de pizza',               fr: 'Four à pizza' },
  'olive trees':                { es: 'Olivos',                       fr: 'Oliviers' },
  'vineyard':                   { es: 'Viñedo',                       fr: 'Vignoble' },
  'cabana':                     { es: 'Cabaña de playa',              fr: 'Cabane' },
  'guest house':                { es: 'Casa de invitados',            fr: 'Maison d\'amis' },
  'beach club access':          { es: 'Acceso a club de playa',       fr: 'Accès beach club' },
  'beach club (guest fee/stay)': { es: 'Club de playa (tasa por estancia)', fr: 'Beach club (frais invités)' },
  'modern penthouse':           { es: 'Ático moderno',                fr: 'Penthouse moderne' },
  'modern villa':               { es: 'Villa moderna',                fr: 'Villa moderne' },
  'new-build villa':            { es: 'Villa de obra nueva',          fr: 'Villa neuve' },
  'modern new-build':           { es: 'Obra nueva moderna',           fr: 'Construction neuve moderne' },
  'new-build penthouse':        { es: 'Ático de obra nueva',          fr: 'Penthouse neuf' },
  'new-build townhouse':        { es: 'Casa adosada de obra nueva',   fr: 'Maison de ville neuve' },
  'new-build terrace apartment':{ es: 'Apartamento con terraza de obra nueva', fr: 'Appartement neuf avec terrasse' },
  'new-build garden apartment': { es: 'Apartamento con jardín de obra nueva', fr: 'Appartement neuf avec jardin' },
  'modern garden apartment':    { es: 'Apartamento moderno con jardín', fr: 'Appartement moderne avec jardin' },
  'modern terrace apartment':   { es: 'Apartamento moderno con terraza', fr: 'Appartement moderne avec terrasse' },
  'mediterranean terrace apartment': { es: 'Apartamento mediterráneo con terraza', fr: 'Appartement méditerranéen avec terrasse' },
  'rare leisure residence':     { es: 'Residencia vacacional exclusiva', fr: 'Résidence de loisirs rare' },
  'no pets for guests':         { es: 'No se admiten mascotas',       fr: 'Animaux non acceptés pour les invités' },
  'chill out area':             { es: 'Zona chill out',               fr: 'Espace détente' },
  'entertaining':               { es: 'Zona de ocio',                 fr: 'Espace de réception' },
  'proximity/location':         { es: 'Proximidad/ubicación',         fr: 'Proximité/emplacement' },
};

function translateAmenity(raw, locale) {
  if (!raw) return raw;
  const key = String(raw).toLowerCase().trim();
  const hit = AMENITIES[key];
  if (hit) return hit[locale];
  return raw; // fallback to English
}

async function fetchProperties() {
  const url = `${BASE}/properties?select=slug,amenities,amenities_es,amenities_fr&order=slug`;
  const res = await fetch(url, { headers: { apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}` } });
  if (!res.ok) throw new Error(`Fetch ${res.status}: ${await res.text()}`);
  return res.json();
}

async function updateProperty(slug, fields) {
  const url = `${BASE}/properties?slug=eq.${encodeURIComponent(slug)}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_ROLE, Authorization: `Bearer ${SERVICE_ROLE}`,
      'Content-Type': 'application/json', Prefer: 'return=minimal',
    },
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error(`Update ${slug}: ${res.status} ${await res.text()}`);
}

(async () => {
  console.log(`[amenities-bulk] Fetching properties…`);
  const rows = await fetchProperties();
  console.log(`[amenities-bulk] ${rows.length} properties fetched`);

  const work = [];
  let skipped = 0;
  for (const r of rows) {
    const list = Array.isArray(r.amenities) ? r.amenities : [];
    if (list.length === 0) { skipped++; continue; }

    const needsES = FORCE || !Array.isArray(r.amenities_es) || r.amenities_es.length === 0;
    const needsFR = FORCE || !Array.isArray(r.amenities_fr) || r.amenities_fr.length === 0;
    if (!needsES && !needsFR) { skipped++; continue; }

    const fields = {};
    if (needsES) fields.amenities_es = list.map(a => translateAmenity(a, 'es'));
    if (needsFR) fields.amenities_fr = list.map(a => translateAmenity(a, 'fr'));

    if (DRY_RUN) {
      console.log(`[amenities-bulk] [DRY] ${r.slug} (${list.length} amenities)`);
      if (fields.amenities_es) console.log(`        ES: ${fields.amenities_es.slice(0,5).join(' | ')}…`);
      if (fields.amenities_fr) console.log(`        FR: ${fields.amenities_fr.slice(0,5).join(' | ')}…`);
    } else {
      work.push({ slug: r.slug, fields });
    }
  }

  // Parallel batches.
  const CONCURRENCY = 20;
  let updated = 0, failed = 0;
  for (let i = 0; i < work.length; i += CONCURRENCY) {
    const batch = work.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(w => updateProperty(w.slug, w.fields)));
    results.forEach((res, j) => {
      if (res.status === 'fulfilled') updated++;
      else { failed++; console.error(`✗ ${batch[j].slug}: ${res.reason.message}`); }
    });
    process.stdout.write(`[amenities-bulk] ${updated}/${work.length} updated…\r`);
  }
  console.log(`\n[amenities-bulk] Done. updated=${updated} skipped=${skipped} failed=${failed}`);
})();
