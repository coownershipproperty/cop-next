@AGENTS.md

# COP Next.js — Project Runbook

## Stack & Deployment
- Next.js SSG site deployed on **Vercel** — every `git push origin main` auto-deploys
- Google Sheet (master import): `https://docs.google.com/spreadsheets/d/1EPOcoylQ11dBqutw0zsyasviSwjs1Fmsg8AhoDuseXw`
- Sync sheet → JSON: `node scripts/sync-sheet.js` (preserves longer descriptions/amenities/notes)
- Google Drive parent folder: `1tO1sgQ4_LEylvdjkySFDKSi6CzAf98Zl` (COP Property Photos CLAUDE)
- Drive service account: `cop-drive-bot@tidy-bliss-493400-p4.iam.gserviceaccount.com`
- Drive credentials: `/sessions/laughing-dreamy-cannon/mnt/uploads/tidy-bliss-493400-p4-1a35d5ceba63.json`

## Where property data comes from — read this before touching a listing page

**Supabase (project `iotzzoxyckpyatzqcjbo`, table `properties`) is the source of truth.**
Every public page that lists or renders a property queries it live and filters
`status IN ('Live','for_sale')` — hidden and sold rows must never render publicly.

Pages on that contract: `pages/property/[slug].js`, `pages/our-homes.js`,
`pages/[slug].js` (English destination hubs), `pages/es/destinos/[slug].js`,
`pages/fr/destinations/[slug].js`, `pages/de/destinationen/[slug].js`,
`pages/viewings/index.js`. They all set `revalidate` (3600s), so a home listed or
sold in Supabase appears or disappears within the hour without a deploy.

`lib/properties.json` is **NOT the source of truth**, and as of 27 Jul 2026 no page
reads it. It used to back the English destination hubs, and by the time they were
moved to Supabase the snapshot had been drifting since April — it advertised homes
that had already sold and hid roughly 38 homes that had since been listed. It
survives only as an input to the scraper/import scripts below and to the
`destination-page-rewrite` skill's photo inventory. **Never add a page that reads
it, and never treat its contents as what the site is currently showing.**

## Partners
| Partner | Status | Notes |
|---------|--------|-------|
| `pacaso` | ✅ Good | 190 properties; images served from Google Drive lh3 URLs (not staging); Drive folders hold photos |
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

## Pacaso — Updating Images from Drive
Pacaso has 190 properties. Photos are stored in Google Drive (one folder per property,
`driveUrl` already set). The `images` and `img` fields in properties.json use
`https://lh3.googleusercontent.com/d/FILE_ID` URLs served directly from Drive — **not**
the old `staging.co-ownership-property.com` URLs.

If Drive folders are refreshed or re-uploaded, re-run the image sync:
```bash
node scripts/repopulate-drive-pacaso.js                    # update all 190
node scripts/repopulate-drive-pacaso.js --start=N          # resume from index N
node scripts/repopulate-drive-pacaso.js --start=N --count=20  # safe batch of 20
node scripts/repopulate-drive-pacaso.js --dry-run          # preview only
```

What it does:
- Reads the Drive folder for each Pacaso property (from `driveUrl`)
- Lists all image files inside (sorted by name)
- Sets `p.images` = array of lh3 URLs for all files, `p.img` = first
- Saves `lib/properties.json` after each property (resumable)
- Skips properties with no driveUrl or empty Drive folder (keeps existing URLs)

Pacaso data comes from the Google Sheet via `node scripts/sync-sheet.js` — that preserves
existing `images`/`img` values, so re-running sync will NOT overwrite the Drive URLs.

## Property Page Structure
- `/pages/property/[slug].js` — property detail page
- Stats shown: beds, baths, ~45 days/year, 1/8 share, m² (`p.size > 0`), lat/lng map
- "Exclusive Photos" button → sends `driveUrl` to visitor's email via Hubspot

## Key Rules
- Never overwrite a longer description with a shorter one from the sheet
- `photo-02.png` is the &Hamlet logo — filtered out in `sync-sheet.js`
- Sold-out And Hamlet properties should NOT be added to the site
- Descriptions must never mention partner names (&Hamlet, Vivla, Myne, etc.)

## Email Templates
All email templates and the design system live in:
`/Desktop/email-templates/`  (user's workspace folder)

**IMPORTANT: Before building or editing any email template, always read:**
`/Desktop/email-templates/_design-system.md`

This file contains every brand rule — colours, fonts, spacing, component patterns, and the full list of completed vs remaining templates. Never deviate from it.

### Completed templates — all 16 done ✅
| File | Template |
|------|----------|
| `01-weekly-newsletter.html` | Weekly general newsletter |
| `02-property-alert.html` | Property alert (saved search match) |
| `03-new-listings-digest.html` | New listings digest (3–8 properties) |
| `04-welcome-1-what-cop-does.html` | Welcome 1 — What COP does |
| `05-welcome-2-how-coownership-works.html` | Welcome 2 — How co-ownership works |
| `06-welcome-3-handpicked-properties.html` | Welcome 3 — Handpicked properties |
| `07-nurture-day3-soft-followup.html` | Post-enquiry nurture — Day 3 |
| `08-nurture-day7-value-content.html` | Post-enquiry nurture — Day 7 (buyer checklist) |
| `09-nurture-day14-final-nudge.html` | Post-enquiry nurture — Day 14 (final nudge) |
| `10-vip-early-access.html` | VIP early access (pre-launch preview) |
| `11-destination-market-report.html` | Destination market report (quarterly) |
| `12-seasonal-spotlight.html` | Seasonal spotlight (ski Oct / Mediterranean Mar) |
| `13-price-drop-alert.html` | Price drop alert |
| `14-re-engagement.html` | Re-engagement (90-day cold leads) |
| `15-curated-selection.html` | Curated selection (manual, 3 properties + notes) |
| `16-post-purchase-owner-welcome.html` | Post-purchase owner welcome |

### Brand colours (quick reference)
- Navy: `#2C4A5E` — headers, buttons, stat band, footer
- Gold: `#C9A84C` — accents, rules, badges, labels
- Cream: `#F5F2EC` — email shell background
- White: `#FFFFFF` — email body
- Muted: `#6B8A9E` — secondary text

### Fonts
- Headings: Playfair Display (fallback: Georgia, serif)
- Body: Nunito Sans (fallback: Arial, sans-serif)
- No border-radius anywhere — all corners square
