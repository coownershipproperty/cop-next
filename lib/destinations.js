// Destination slug → property filter mapping
// Built from actual property data in properties.json
// filter: { field: value | [values] } — any value match = include

const DESTINATIONS = {
  // ── COUNTRIES ──────────────────────────────────────────────
  "spain-fractional-ownership-properties":        { country: "Spain" },
  "france-fractional-ownership-properties":       { country: "France" },
  "italy-fractional-ownership-properties":        { country: "Italy" },
  "usa-fractional-ownership-properties":          { country: "USA" },
  "england-fractional-ownership-properties":      { country: "England" },
  "mexico-fractional-ownership-properties":       { country: "MEX" },
  "austria-fractional-ownership-properties":      { country: "Austria" },
  "croatia-fractional-ownership-properties":      { country: "Croatia" },
  "germany-fractional-ownership-properties":      { country: "Germany" },
  "portugal-fractional-ownership-properties":     { country: "Portugal" },
  "sweden-fractional-ownership-properties":       { country: "Sweden" },

  // ── SPANISH ISLANDS / BALEARICS ────────────────────────────
  "balearics-fractional-ownership-properties":    { region: "Mallorca" },
  "mallorca-fractional-ownership-properties":     { region: "Mallorca" },
  // Ibiza & Menorca stored under region=Mallorca in the data
  "ibiza-fractional-ownership-properties":        { region: "Mallorca", city: "Ibiza" },
  "menorca-fractional-ownership-properties":      { region: "Mallorca", city: "Menorca" },
  "formentera-fractional-ownership":              { region: "Mallorca", city: "Formentera" },
  "alcudia-port-dalcudia-fractional-ownership-properties": { region: "Mallorca", city: "Alcudia" },
  "andratx-fractional-ownership-properties-co-ownership-property": { region: "Mallorca", city: "Andratx" },
  "pollenca-port-de-pollenca-fractional-ownership-properties": { region: "Mallorca", city: "Pollenca" },
  "santa-ponsa-fractional-ownership-properties":  { region: "Mallorca", city: "Santa Ponsa" },
  "santanyi-fractional-ownership-properties":     { region: "Mallorca", city: "Santanyi" },
  "canary-islands-fractional-ownership-properties": { region: "Canary Islands" },

  // ── SPANISH COSTAS ─────────────────────────────────────────
  "costa-del-sol-fractional-ownership-properties": { country: "Spain", region: "Costa del Sol" },
  "costa-blanca-fractional-ownership-properties":  { country: "Spain", region: "Costa Blanca" },
  "costa-de-la-luz-fractional-ownership-properties": { country: "Spain", region: "Costa de la Luz" },
  "costa-de-la-luz-fractional-property-for-sale":   { country: "Spain", region: "Costa de la Luz" },
  "spanish-costas-fractional-ownership-properties": { country: "Spain", regions: ["Costa del Sol","Costa Blanca","Costa de la Luz"] },
  "barcelona-fractional-ownership-for-sale":       { country: "Spain", city: "Barcelona" },
  "madrid-fractional-ownership-properties":        { country: "Spain", region: "Madrid" },
  "pyrenees-mountains-fractional-ownership-properties": { country: "Spain", region: "Pyrenees" },

  // ── FRANCE ─────────────────────────────────────────────────
  "french-alps-fractional-ownership-properties":   { country: "France", region: "French Alps" },
  "south-of-france-fractional-ownership-properties": { country: "France" },
  "paris-fractional-ownership-properties":         { country: "France", region: "Paris" },

  // ── ITALY ──────────────────────────────────────────────────
  "sardinia-fractional-ownership-properties":      { country: "Italy", region: "Sardinia" },
  "lake-como-fractional-ownership-properties":     { country: "Italy", city: "Lake Como" },
  "italian-lakes-fractional-ownership-properties": { country: "Italy" },
  "liguria-fractional-ownership-properties":       { country: "Italy", region: "Liguria" },

  // ── UK ─────────────────────────────────────────────────────
  "london-fractional-ownership-properties":        { country: "England", region: "London" },

  // ── USA STATES ─────────────────────────────────────────────
  "california-fractional-ownership-properties":    { country: "USA", region: "California" },
  "colorado-fractional-ownership-properties":      { country: "USA", region: "Colorado" },
  "florida-fractional-ownership-properties":       { country: "USA", region: "Florida" },
  "utah-fractional-ownership-properties":          { country: "USA", region: "Utah" },

  // ── USA CITIES ─────────────────────────────────────────────
  "aspen-fractional-ownership":                    { country: "USA", city: "Aspen" },
  "breckenridge-fractional-ownership":             { country: "USA", city: "Breckenridge" },
  "vail-fractional-ownership":                     { country: "USA", city: "Vail" },
  "park-city-fractional-ownership-2":              { country: "USA", city: "Park City" },
  "miami-fractional-ownership":                    { country: "USA", cities: ["Miami","Miami Beach"] },
  "brickell-fractional-ownership-miami":           { country: "USA", cities: ["Miami","Miami Beach"] },
  "florida-keys-fractional-ownership":             { country: "USA", cities: ["Islamorada","Key Colony Beach"] },
  "30a-fractional-ownership-emerald-coast-co-ownership-beach-homes": { country: "USA", cities: ["Rosemary Beach"] },
  "newport-beach-fractional-ownership":            { country: "USA", city: "Newport Beach" },
  "malibu-santa-barbara-fractional-ownership":     { country: "USA", cities: ["Malibu","Santa Barbara","Montecito"] },
  "palm-springs-fractional-ownership-desert-modern-luxury": { country: "USA", cities: ["Palm Springs","Palm Desert","Indian Wells","La Quinta"] },
  "napa-sonoma-fractional-ownership-wine-country-estates": { country: "USA", cities: ["Napa","Healdsburg","St. Helena","Calistoga","Sonoma"] },
  "lake-tahoe-fractional-ownership-properties":    { country: "USA", cities: ["Truckee","South Lake Tahoe","Olympic Valley","Incline Village","Homewood","Tahoma","Tahoe City"] },
};

module.exports = { DESTINATIONS };
