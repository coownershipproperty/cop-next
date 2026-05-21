# COP Properties Table — Column Reference

Supabase project: `iotzzoxyckpyatzqcjbo`
Table: `properties`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Generate with `uuid.uuid4()` |
| `slug` | text | URL-safe, unique. Format: `{city}-{region}-{country}-{n}-bed-{type}-{feature}` |
| `title` | text | `{City}, {Region}, {Country} — {N}-Bed {Type} With {Feature}` |
| `status` | text | `"for_sale"` for MYNE |
| `country` | text | e.g. `"Italy"`, `"Spain"` |
| `region` | text | e.g. `"Sardinia"`, `"Costa del Sol"`, `"Mallorca"` |
| `city` | text | e.g. `"Palau"`, `"Port d'Andratx"` |
| `beds` | int | Number of bedrooms |
| `baths` | float | Number of bathrooms |
| `size` | int | **SKIP for MYNE** — they don't publish m² |
| `price` | int | In EUR (no decimals) |
| `currency` | text | `"EUR"` |
| `description` | text | AI-improved, markdown bold, SEO-optimized |
| `description_original` | text | Raw scraped text from MYNE listing |
| `description_scraped` | text | Same as description_original for MYNE |
| `description_ai` | text | Same as description for MYNE |
| `amenities` | jsonb | Array of strings, e.g. `["Shared pool","Sea views"]` |
| `img` | text | Public URL of hero image in `property-images/{slug}/hero.jpg` |
| `images` | jsonb | Array of 3 locked gallery URLs (`gallery-0`, `gallery-1`, `gallery-2`) |
| `photos` | jsonb | Array of ALL public photo URLs in `property-photos/{slug}/` |
| `extra_photos` | jsonb | `[]` — David fills this manually from brochure screenshots |
| `total_images` | int | `len(photos)` |
| `partner` | text | `"myne"` |
| `partner_url` | text | Full myne-homes.com listing URL |
| `property_type` | text | `"apartment"` / `"villa"` / `"house"` |
| `property_style` | text | `"garden"` / `"terrace"` / `"modern"` / `"penthouse"` / etc. |
| `lat` | float | Latitude (look up from city name) |
| `lng` | float | Longitude (look up from city name) |
| `date_added` | date | `str(date.today())` |
| `rental` | bool | `false` for MYNE |

## Translation Columns (Step 7)

The site is multilingual. Fill these so the Spanish/French/German property pages
show translated text instead of falling back to English. See SKILL.md Step 7.

| Column | Type | Notes |
|--------|------|-------|
| `title_es` / `title_fr` / `title_de` | text | Translated title |
| `description_es` / `description_fr` / `description_de` | text | Translated description — keep `**bold**` + `\n\n` |
| `amenities_es` / `amenities_fr` / `amenities_de` | jsonb | Translated amenity array — same length/order as `amenities` |

## Supabase Keys

**Anon key** (read-only queries):
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvdHp6b3h5Y2tweWF0enFjamJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDE5OTEsImV4cCI6MjA5MjA3Nzk5MX0.6B_iQk8bqwFLkeB8Nl1qpiZRdXfRLPzw1Pea4Uxyrwo`

**Service role key** (uploads + inserts — required):
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvdHp6b3h5Y2tweWF0enFjamJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwMTk5MSwiZXhwIjoyMDkyMDc3OTkxfQ.NzeqvQSgUlEdAXUhe3aeG5C3auVuoq53dAJG3AZ2rJc`

If the service role key stops working: Supabase dashboard → Settings → API → "Legacy anon, service_role API keys" tab → Reveal → copy the `service_role` one.
