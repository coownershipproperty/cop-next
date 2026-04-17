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
| `vivla` | ⚠️ Partial | Descriptions sometimes Spanish; no dedicated scraper yet |
| `myne` | ⚠️ Partial | Drive folders have only 3 photos (should have more) |

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
