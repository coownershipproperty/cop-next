@AGENTS.md

# COP Next.js — Project Runbook

## Stack & Deployment
- Next.js SSG site deployed on **Vercel** — every `git push origin main` auto-deploys
- Primary data file: `lib/properties.json` (source of truth for all property pages)
- Google Sheet (master import): `https://docs.google.com/spreadsheets/d/1EPOcoylQ11dBqutw0zsyasviSwjs1Fmsg8AhoDuseXw`
- Sync sheet → JSON: `node scripts/sync-sheet.js` (preserves longer descriptions/amenities/notes)
- Google Drive parent folder: `1tO1sgQ4_LEylvdjkySFDKSi6CzAf98Zl` (COP Property Photos CLAUDE)
- Drive service account: `cop-drive-bot@tidy-bliss-493400-p4.iam.gserviceaccount.com`
- Drive credentials: `/sessions/laughing-dreamy-cannon/mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json`

## Partners
| Partner | Status | Notes |
|---------|--------|-------|
| `pacaso` | ✅ Good | Images, descriptions, Drive all correct |
| `andhamlet` | ✅ Good | 11 properties; scraper at `scripts/scrape-andhamlet.js` |
| `vivla` | ✅ Good | 34 properties; single-add: `scripts/add-vivla-property.js`; bulk: `scripts/scrape-vivla-all.js` |
| `myne` | ✅ Good | 95 properties; single-add: `scripts/add-myne-property.js`; bulk: `scripts/scrape-myne-all.js` |

## Adding a New And Hamlet Property

```bash
node scripts/add-andhamlet-property.js \
  --url https://www.andhamlet.com/listings/NEW-SLUG \
  --type villa \
  --feature "with-pool"
```

**Types:** villa, apartment, penthouse, chalet, townhouse  
**Features (optional):** with-pool, with-sea-views, with-garden, with-fireplace, with-infinity-pool

The script automatically:
- ❌ Rejects sold-out properties ("all shares sold" in title → immediate error)
- ✅ Detects city, country, region, price, beds, baths, m² from the page
- ✅ Scrapes all gallery images from `section_gallery8` (no logos, no other-property images)
- ✅ Cleans description (strips partner name + sales boilerplate)
- ✅ Extracts lat/lng from the Google Maps embed
- ✅ Creates a fresh Drive folder and uploads all gallery photos
- ✅ Auto-generates COP slug + title
- ✅ Saves to `lib/properties.json`

If city/country can't be auto-detected, add manual overrides:
```bash
  --city "Marbella" --country "Spain" --region "Costa del Sol"
```

Then commit and push:
```bash
git add lib/properties.json
git commit -m "Add And Hamlet property: TITLE"
git push origin main
```

## Adding a New Vivla Property (Single)

```bash
node scripts/add-vivla-property.js \
  --url https://www.vivla.com/listings/SLUG
```

**Types (auto-detected, or override):** villa · apartment · chalet  
- Baqueira / ski destinations → chalet; Madrid / city → apartment; else → villa  

**Features (auto-detected from "What makes it unique?" section):** pool › sea-views › garden › terrace › fireplace

The script automatically:
- ❌ Rejects SOLD OUT properties (`home_sold-out-wrapper` visible)
- ✅ Includes UNDER CONSTRUCTION properties (shown as normal, no badge)
- ✅ Detects destination, price, beds, baths, m² from the page
- ✅ Scrapes all gallery images from `cl-slider-detail-images` slider (background-image URLs)
- ✅ Cleans description (strips "Vivla" brand name)
- ✅ Extracts lat/lng from JS variable `coordinates = "LAT, LNG"`
- ✅ Extracts unique CMS features (stops before `others-amenities-container` to avoid generic template items)
- ✅ Creates a fresh Drive folder named `{Vivla Slug} - Vivla` and uploads all photos
- ✅ Auto-generates COP title: `{Destination}, Spain — {N}-Bed {Type} With {Feature}`
- ✅ Saves to `lib/properties.json` with `country: "Spain"`, `currency: "EUR"`, source URL in `notes`

Then commit and push:
```bash
git add lib/properties.json
git commit -m "Add Vivla property: TITLE"
git push origin main
```

## Re-scraping All Vivla Properties (Bulk)

```bash
node scripts/scrape-vivla-all.js              # full run
node scripts/scrape-vivla-all.js --dry-run    # preview only, no writes
node scripts/scrape-vivla-all.js --no-drive   # skip Drive uploads
node scripts/scrape-vivla-all.js --start=N    # resume from property N (0-indexed)
```

- Scrapes https://www.vivla.com/listings (all pages) to build URL list
- Skips SOLD OUT; includes UNDER CONSTRUCTION
- Replaces ALL vivla entries in `properties.json` at end
- Auto-detects type + feature per property
- Generates correct titles: `{Destination}, Spain — {N}-Bed {Type} With {Feature}`
- Saves `country: "Spain"` and `currency: "EUR"` on every property

## Repopulating Vivla Drive Folders

Use this to fix missing/empty/wrong-named Drive folders without re-scraping.

```bash
node scripts/repopulate-drive-vivla.js                     # only properties missing driveUrl
node scripts/repopulate-drive-vivla.js --force             # redo ALL 34 folders
node scripts/repopulate-drive-vivla.js --force --start=N   # resume from index N
node scripts/repopulate-drive-vivla.js --force --start=N --count=8  # safe batch of 8
```

- Folder name comes from the Vivla slug in `p.notes` URL → `{Slug Title} - Vivla`
  e.g. `casa-son-parc` → `"Casa Son Parc - Vivla"`
- Trashes the old Drive folder, creates a fresh one, re-uploads all photos
- Saves `lib/properties.json` after **each** property (resumable if killed)
- Run in batches of ~8 with `--count=8` to stay within the 10-minute tool timeout

## Adding a New MYNE Property (Single)

```bash
node scripts/add-myne-property.js \
  --url https://www.myne-homes.com/listings/SLUG
```

The script automatically:
- ❌ Rejects sold-out properties (`propertyStatus` contains "sold")
- ❌ Rejects discreet-marketing properties (`isDiscreet: true`)
- ✅ Includes `in-development` / `renovation` / `available` / `normal` statuses
- ✅ Detects city, country, region, beds, baths from the page
- ✅ Scrapes gallery images from `/_next/image` patterns (Storyblok CDN)
- ✅ Extracts full multi-paragraph description from the server-rendered `<p class="typo-body">` HTML tag (the "What we love about this property" section); falls back to Storyblok JS data chunk if not found
- ✅ Extracts highlights/amenities from `highlights` array
- ✅ Extracts lat/lng (strips Storyblok internal ID suffix from `locationLong`)
- ✅ Creates Drive folder named `"{H1 Title} - Myne"` and uploads photos
- ✅ Auto-generates COP slug + title: `{City}, {Country} — {N}-Bed {Type} With {Feature}`
- ✅ Saves to `lib/properties.json` with `size: null`, `currency: 'EUR'`, source URL in `notes`

**Type detection** (from URL slug): chalet > penthouse > finca > townhouse > semi-detached(→villa) > villa > apartment > house/home  
**Feature detection** (from slug + description + subtitle + highlights): pool > sea-views > lake-views > mountain-views > garden > terrace > fireplace

Then commit and push:
```bash
git add lib/properties.json
git commit -m "Add MYNE property: TITLE"
git push origin main
```

## Re-scraping All MYNE Properties (Bulk)

```bash
node scripts/scrape-myne-all.js              # full run
node scripts/scrape-myne-all.js --dry-run    # preview only, no writes
node scripts/scrape-myne-all.js --no-drive   # skip Drive uploads
node scripts/scrape-myne-all.js --start=N    # resume from property N (0-indexed)
```

- Scrapes https://www.myne-homes.com/listings to extract all public slugs
- Auto-skips discreet-marketing properties (empty `full_slug` on listings page)
- Skips sold-out; includes in-development, renovation, available, normal
- Replaces ALL myne entries in `properties.json` at end
- Saves JSON after each property (resumable with `--start=N` if killed)
- `--no-drive` automatically **preserves existing driveUrls** from the previous run (matched by `notes` URL) — safe to use when only fixing descriptions/data
- Full run (without `--no-drive`) creates new Drive folders and uploads photos fresh

## Repopulating MYNE Drive Folders

Use this to fix missing/empty/wrong-named Drive folders without re-scraping.

```bash
node scripts/repopulate-drive-myne.js                          # only properties missing driveUrl
node scripts/repopulate-drive-myne.js --force                  # redo ALL 95 folders
node scripts/repopulate-drive-myne.js --force --start=N        # resume from index N
node scripts/repopulate-drive-myne.js --force --start=N --count=8  # safe batch of 8
```

- Folder name comes from fetching the live MYNE page (stored in `p.notes`) → H1 title + " - Myne"
  e.g. `"Casita Ses Salines - Myne"`; falls back to COP title if page unreachable
- Trashes the old Drive folder, creates a fresh one, re-uploads all photos
- Saves `lib/properties.json` after **each** property (resumable if killed)
- Run in batches of ~8 with `--count=8` to stay within the 10-minute tool timeout

## Re-scraping All And Hamlet Properties
```bash
node scripts/scrape-andhamlet.js
git add lib/properties.json scripts/scrape-andhamlet.js
git commit -m "Refresh And Hamlet data"
git push origin main
```

## Repopulating And Hamlet Drive Folders
```bash
node scripts/repopulate-drive-andhamlet.js          # all 11
node scripts/repopulate-drive-andhamlet.js SLUG      # one property
```

## Property Page Structure
- `/pages/property/[slug].js` — property detail page
- Stats shown: beds, baths, ~45 days/year, 1/8 share, m² (`p.size > 0`), lat/lng map
- "Exclusive Photos" button → sends `driveUrl` to visitor's email via Hubspot

## Key Rules
- Never overwrite a longer description with a shorter one from the sheet
- `photo-02.png` is the &Hamlet logo — filtered out in `sync-sheet.js`
- Sold-out And Hamlet properties should NOT be added to the site
- Descriptions must never mention partner names (&Hamlet, Vivla, Myne, etc.)
