---
name: myne-to-cop
description: >
  Add new MYNE co-ownership property listings to the COP (Collection of Properties) Supabase database.
  Use this skill whenever David asks you to add, upload, or import a MYNE property, or when he shares
  a myne-homes.com URL or a screenshot of the MYNE listings page. Also triggers for phrases like
  "add this MYNE listing", "put these MYNE properties in COP", "upload from MYNE", or "new MYNE properties
  to add". The skill documents the complete proven workflow: scraping Storyblok images, filtering
  property-specific photos, AI-improving descriptions, uploading to Supabase Storage, inserting the
  database row, and finally asking David for brochure screenshots to upload as extra_photos.
---

# MYNE → COP: Adding New Listings

This skill documents the exact workflow for adding MYNE fractional co-ownership properties to the
COP Supabase database (`iotzzoxyckpyatzqcjbo`). Follow these steps precisely — they were established
through trial and error on the first 3 properties and are known to work.

Always read `references/schema.md` before inserting rows to confirm column names haven't changed.
Always use the Python upload script pattern in `scripts/upload_template.py` — adapt it rather than
writing from scratch.

## How the photo structure works on the property listing page

Understanding this matters so you set the right fields:

- **`img`** — single hero image, shown on listing cards across the website (1 photo)
- **`images`** (gallery-0/1/2) — the 3 photos visible on the property page *before* unlocking. The first one (`gallery-0`) is always the same image as `img`.
- **`photos`** — the full unlocked gallery shown after the visitor enters their email. Contains ALL MYNE photos in order: the same 3 visible ones first, then the rest. This is what drives the "YOU'RE MISSING X PHOTOS" counter on the property page.
- **`extra_photos`** — David's additions: brochure screenshots, floor plans, extra property info images. Appended after `photos` in the unlocked gallery. Start as `[]` and get filled in Step 7.
- **`total_images`** — MUST equal `len(photos) + len(extra_photos)` at all times. Update it whenever extra_photos changes.

---

## Step 0 — Check for Properties Missing Brochures (ALWAYS run first)

Before doing anything else, run this query to check if any existing MYNE properties are still
missing their brochure screenshots:

```bash
curl -s "https://iotzzoxyckpyatzqcjbo.supabase.co/rest/v1/properties?partner=eq.myne&select=slug,title,extra_photos" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvdHp6b3h5Y2tweWF0enFjamJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDE5OTEsImV4cCI6MjA5MjA3Nzk5MX0.6B_iQk8bqwFLkeB8Nl1qpiZRdXfRLPzw1Pea4Uxyrwo"
```

Parse the result and identify any properties where `extra_photos` is empty (`[]` or null).

Then tell David before proceeding, e.g.:

> "By the way, **Port d'Andratx** still has no brochure screenshots from last time — do you have
> them now? If so, drop them here and I'll add them before we start on the new ones."

Wait for David's response:
- If he provides screenshots → upload them now following the Step 8 process, then continue with the new properties
- If he says no → acknowledge and move on to adding the new properties

---

## Step 1 — Identify the Property URLs on MYNE

MYNE property slugs don't match the display names (e.g. "Terraza del Sol" lives at
`terrazza-del-sol-new-build-...` — note the double-z). Never guess the URL.

**How to find the correct URLs:**
1. Open `https://www.myne-homes.com/listings?sortby=new` (newest listings first)
2. Use the Claude-in-Chrome MCP to run JavaScript on the page:
   ```js
   Array.from(document.querySelectorAll('a[href*="/listings/"]'))
     .map(a => a.href)
     .filter((v, i, arr) => arr.indexOf(v) === i)
   ```
3. Identify which links correspond to the properties David asked you to add.
4. Confirm with David if you're unsure which slug belongs to which property.

Full listing URL format: `https://www.myne-homes.com/listings/{property-slug}`

---

## Step 2 — Extract Property-Specific Images

MYNE listing pages are Next.js rendered; images are signed Storyblok CDN URLs that can't easily be
scraped from a rendered page. Use `curl` on the raw HTML instead.

**Why filtering matters:** Every MYNE listing page shows 3–4 "Similar Properties" carousels at the
bottom. Those carousels contain images from *other* properties. You must filter them out.

**How to extract images:**
```bash
curl -s "https://www.myne-homes.com/listings/{property-slug}" \
  | grep -oE 'https://a\.storyblok\.com/f/[0-9]+/[0-9x]+/[a-f0-9]+/[^"&< ]+\.(jpg|jpeg|png|webp)' \
  | grep -i "{property-filename-prefix}" \
  | sort -u
```

**Property-specific filename prefix:** Look at the raw Storyblok URLs. Each property has photos
named with a consistent prefix that matches the property name (e.g. `giardino-palau-ii`,
`terraza-del-sol`, `vista-puerto-andratx`). Some properties have a secondary internal code prefix
(e.g. `it0748a`). Use both if present.

**Always visually spot-check** the final list of image URLs before uploading — open a couple in the
browser to make sure they actually show the right property, not a neighbor's listing.

---

## Step 3 — Gather Property Details

Visit the MYNE listing page and collect:

| Field | Where to find it |
|-------|-----------------|
| `title` | Construct from city/region/country + beds + type (see format below) |
| `city` | Page header |
| `region` | Page header / URL |
| `country` | Page header |
| `beds` / `baths` | Property specs panel |
| `price` | Listing price (EUR) |
| `lat` / `lng` | Look up from city name — MYNE doesn't show coordinates |
| `description_original` | Scrape the description text block |
| `amenities` | From the features/amenities list on the page |
| `property_type` | apartment / villa / house |
| `property_style` | garden / terrace / modern / penthouse / etc. |
| `partner_url` | The full myne-homes.com listing URL |

**DO NOT include:**
- `size` (m²) — MYNE never shows this. Leave the field out of the insert entirely.

---

## Step 4 — AI-Improve the Description

Transform `description_original` into `description` (and `description_ai`) following these rules:

1. **Remove all MYNE branding** — no mentions of "MYNE", "co-ownership platform", "MYNE Homes", etc.
2. **Remove the property nickname** — "Giardino Palau II", "Terraza del Sol", etc. are MYNE's internal
   names; strip them. Use location-based language instead.
3. **Bold important keywords** — wrap significant terms in `**double asterisks**`:
   location names, view types, key amenities, property style descriptors, nearby attractions.
4. **SEO-optimize** — weave in natural search terms: the city, region, country, property type,
   key features (sea view, pool, golf, marina, etc.)
5. **End with a fractional ownership callout** (always last paragraph):
   > **Fractional co-ownership (1/8 share)** — own a genuine [location descriptor] with deeded title
   > and fully managed, all-inclusive service.
6. **Tone**: upscale holiday lifestyle, aspirational but grounded. Not AI-sounding. 3–5 paragraphs.

**Title format:**
```
{City}, {Region}, {Country} — {N}-Bed {Type} With {Key Feature}
```
Examples:
- `Palau, Sardinia, Italy — 2-Bed Garden Apartment With Sea View & Pool`
- `Port d'Andratx, Mallorca, Spain — 2-Bed Apartment With Harbour View & Pool`

---

## Step 5 — Upload Images & Insert DB Row

Use the Python upload script. See `scripts/upload_template.py` for the full template — adapt the
`PROPERTIES` list for the new properties and run it.

**Key upload rules:**
- **Service role key required** — the anon key will be rejected. Use the legacy JWT format key:
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvdHp6b3h5Y2tweWF0enFjamJvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjUwMTk5MSwiZXhwIjoyMDkyMDc3OTkxfQ.NzeqvQSgUlEdAXUhe3aeG5C3auVuoq53dAJG3AZ2rJc`
  (If this key ever stops working: Supabase dashboard → Settings → API → **Legacy** anon/service_role tab → Reveal → copy)

**Storage structure:**
```
property-images/{slug}/hero.jpg               ← hero image (img field)
property-images/{slug}/gallery-0.{ext}        ← 3 visible photos on listing page (images field)
property-images/{slug}/gallery-1.{ext}
property-images/{slug}/gallery-2.{ext}
property-photos/{slug}/{timestamp}-p{i}.{ext} ← ALL photos incl. gallery 0-2 (photos field)
property-photos/{slug}/extra-{timestamp}-{i}.jpg ← brochure screenshots added in Step 7
```

**DB row fields to set:**
```
slug, id (uuid4), title, city, region, country, beds, baths, price, currency="EUR",
description, description_original, description_ai, description_scraped (= description_original),
amenities (jsonb array), img (hero URL), photos (jsonb array of ALL photo URLs, starting with hero),
images (jsonb array of gallery-0/1/2 URLs), extra_photos=[] (filled in Step 7),
partner="myne", partner_url, property_type, property_style, status="for_sale",
lat, lng, date_added (today), rental=False,
drive_url = "https://co-ownership-property.com/gallery/{slug}"  ← required or unlock button is dead,
total_images = len(photos)   ← updated again after Step 7 adds extra_photos
```

**Fields to OMIT:** `size` (leave out entirely — don't set to null or 0)

---

## Step 6 — Verify Upload

After the script runs:
1. Check console output — every image should say `OK ->`, row insert should say `OK -> inserted {slug}`
2. Quick confirmation query:
   ```bash
   curl -s "https://iotzzoxyckpyatzqcjbo.supabase.co/rest/v1/properties?slug=eq.{slug}&select=slug,title,total_images" \
     -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvdHp6b3h5Y2tweWF0enFjamJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDE5OTEsImV4cCI6MjA5MjA3Nzk5MX0.6B_iQk8bqwFLkeB8Nl1qpiZRdXfRLPzw1Pea4Uxyrwo"
   ```
3. Report back: slugs added, photo counts, then move to Step 7.

---

## Step 7 — Add ES/FR/DE Translations (ALWAYS do this)

The COP site runs in **four languages — English, Spanish, French, German**. Every property
**automatically** gets a page at all four URLs (`/property/{slug}`, `/es/propiedades/{slug}`,
`/fr/proprietes/{slug}`, `/de/immobilien/{slug}`). But the translated pages only show
translated text if the translation columns are filled — otherwise they **silently fall back
to English**. A new listing is not truly "live in 4 languages" until these columns are set:

| Column | Holds |
|--------|-------|
| `title_es` `title_fr` `title_de` | translated titles |
| `description_es` `description_fr` `description_de` | translated descriptions |
| `amenities_es` `amenities_fr` `amenities_de` | translated amenity arrays (jsonb) |

Translate each new property **inline** — you are Claude, translate directly, no external
API or script needed — then PATCH the row with the **service-role key** (same key as Step 5).

**Title format** — keep the catalog's mechanical pattern, Title Case on the spec part:
- ES: `{City}, {Region-ES}, {Country-ES} — {Type-ES} De {N} Dormitorio(s) Con {Feature-ES}`
- FR: `{City}, {Region-FR}, {Country-FR} — {Type-FR} De {N} Chambre(s) Avec {Feature-FR}`
- DE: `{City}, {Region-DE}, {Country-DE} — {Type-DE} Mit {N} Schlafzimmer(n) Und {Feature-DE}`
  (DE: 1 → `Schlafzimmer`, 2+ → `Schlafzimmern`; join a combined feature with lowercase `und`,
  e.g. `Und Meerblick und Pool`)

Type words: apartment → `Apartamento` / `Appartement` / `Wohnung`; villa → `Villa` (all);
penthouse → `Ático` / `Penthouse` / `Penthouse`; house → `Casa` / `Maison` / `Haus`;
garden apartment → DE compound `Gartenwohnung`; penthouse → DE `Penthouse`.
Countries: Italy → Italia / Italie / Italien · Spain → España / Espagne / Spanien ·
France → Francia / France / Frankreich · Portugal → Portugal (all).
Common features: pool → `Piscina` / `Piscine` / `Pool`; heated pool → `Piscina Climatizada` /
`Piscine Chauffée` / `beheiztem Pool`; sea view → `Vistas Al Mar` / `Vue Mer` / `Meerblick`;
infinity pool → `Piscina Infinita` / `Piscine À Débordement` / `Infinity-Pool`.

**Description** — translate naturally and fluently. **Keep every `**bold**` marker and the
`\n\n` paragraph breaks intact.** End with the standard fractional-ownership callout
(it replaces the English "Fractional co-ownership (1/8 share)" line):
- ES: `**Copropiedad fraccionada (participación de 1/8)** — …con título escriturado y servicio integral totalmente gestionado.`
- FR: `**Copropriété de résidence secondaire (quote-part de 1/8)** — …avec acte authentique et service tout compris entièrement géré.`
- DE: `**Anteiliges Miteigentum (1/8-Anteil)** — …mit notariellem Titel und vollständig verwaltetem All-Inclusive-Service.`

**Amenities** — translate each string; keep the same array length and order as the English
`amenities`.

**How to write the columns:** translated text is full of apostrophes and quotes, so do NOT
inline the JSON in a shell command. Write a small JSON file `{slug: {col: value, ...}}` and
PATCH it with a short Python script (stdlib `urllib`), e.g.:

```python
import json, urllib.request
SERVICE_KEY = "<service_role JWT — see references/schema.md>"
cols = {"title_es": "…", "title_fr": "…", "title_de": "…",
        "description_es": "…", "description_fr": "…", "description_de": "…",
        "amenities_es": [...], "amenities_fr": [...], "amenities_de": [...]}
req = urllib.request.Request(
    f"https://iotzzoxyckpyatzqcjbo.supabase.co/rest/v1/properties?slug=eq.{slug}",
    data=json.dumps(cols).encode(), method="PATCH",
    headers={"apikey": SERVICE_KEY, "Authorization": f"Bearer {SERVICE_KEY}",
             "Content-Type": "application/json", "Prefer": "return=representation"})
print(json.loads(urllib.request.urlopen(req).read()))
```

**Verify** every new slug has all three of each set populated:
```bash
curl -s "https://iotzzoxyckpyatzqcjbo.supabase.co/rest/v1/properties?slug=eq.{slug}&select=title_es,title_fr,title_de,amenities_es,amenities_fr,amenities_de" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvdHp6b3h5Y2tweWF0enFjamJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MDE5OTEsImV4cCI6MjA5MjA3Nzk5MX0.6B_iQk8bqwFLkeB8Nl1qpiZRdXfRLPzw1Pea4Uxyrwo"
```

Translations go live automatically within ~1 hour — the property pages use ISR
(`revalidate: 3600`), so **no deploy or `git push` is needed**.

---

## Step 8 — Ask David for Brochure Screenshots (ALWAYS do this)

After verifying, ALWAYS ask David for extra photos before finishing. Say something like:

> "All [N] properties are live. For each one, do you have any brochure screenshots, floor plans or
> extra property images to add to the unlocked gallery? You can drop them here and I'll upload them."

Wait for David to share files (he'll upload images directly to the chat).

**How to extract images David uploads to the chat:**

Images uploaded inline to the chat are stored as base64 in the session transcript JSONL:
```
/sessions/sharp-exciting-mayer/mnt/.claude/projects/[long-path]/[uuid].jsonl
```
Find it with: `find /sessions/ -name "*.jsonl" | grep -v subagents | head -1`

Then extract and save the images:
```python
import json, base64, os

all_images = []
with open(jsonl_path) as f:
    for line in f:
        entry = json.loads(line.strip())
        if entry.get('type') != 'user': continue
        content = entry.get('message', {}).get('content', [])
        for item in content:
            if isinstance(item, dict) and item.get('type') == 'image':
                all_images.append(item['source'])

# The newly uploaded images will be at the END of all_images
# Count how many David just sent and take the last N
```

**For each set of extra images:**
1. Upload to `property-photos/{slug}/extra-{timestamp}-{i}.jpg`
2. Collect public URLs
3. Patch the DB:
   ```python
   # Fetch current arrays first, then append
   new_extra = existing_extra_photos + new_urls
   new_total = len(photos) + len(new_extra)
   # PATCH properties where slug=eq.{slug}
   # Set extra_photos=new_extra, total_images=new_total
   ```
4. Confirm: "Added X extra photos to {slug}, total_images now = Y."

If David says he has no extras yet → acknowledge and move on. The Step 0 check next time will remind him.

---

## Known Gotchas

| Problem | Fix |
|---------|-----|
| URL 404 on MYNE | URL doesn't match display name. Use the JS technique in Step 1 to find the real slug. |
| Images include other properties | Storyblok prefix filtering too broad — narrow the grep pattern. |
| `400 Unauthorized` on upload | Using anon key. Switch to service_role JWT key. |
| `Invalid Compact JWS` | Using new `sb_secret_` format key. Must use the **Legacy** JWT tab in Supabase dashboard. |
| No images returned from curl | Remove quote anchors from grep pattern — use the exact pattern in Step 2. |
| Storyblok returns 403 | Add `User-Agent: Mozilla/5.0` header to the download request. |
| `total_images` out of sync | Always recalculate as `len(photos) + len(extra_photos)` after any patch. |
| Unlock button does nothing | `drive_url` is null. Set it to `https://co-ownership-property.com/gallery/{slug}` |
| Can't find transcript JSONL | Run: `find /sessions/ -name "*.jsonl" \| grep -v subagents \| head -1` |
