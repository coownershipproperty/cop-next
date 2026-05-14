# Photo sourcing — pulling existing property photos for destination editorial use

Every destination page should have ~6–10 inline editorial photos. We use existing property photos from `lib/properties.json` rather than licensing new stock — same destinations, real images, free to use.

---

## URL hygiene rules

**✅ ALWAYS WORKS — Storyblok URLs:**
```
https://a.storyblok.com/f/148662/2100x1400/9401d2ac08/eze-elegance-3.jpg
https://a.storyblok.com/f/148662/2100x1400/86fd79e931/nartelle-4.jpg
```
- Clean, stable, no encoding issues
- Always end with `.jpg`
- Used by MYNE properties (mostly European)

**✅ ALWAYS WORKS — Google Drive lh3 URLs:**
```
https://lh3.googleusercontent.com/d/1lc4fLcIjuGZgrncB0tFYXLKdEkhnGJrB
https://lh3.googleusercontent.com/d/1Wgm74AqypEBvRcuftIvbxLS1r5ScPoup
```
- No file extension visible (Drive serves the right MIME type automatically)
- Used by Pacaso properties (mostly US) and some MYNE properties on Drive

**❌ AVOID — Webflow CDN URLs:**
```
https://cdn.prod.website-files.com/63f61b4f9800c52e560f1914/69c551692fcfdd698b8e5a87_WhatsApp%20Image%202026-03-18%20at%2014.05.57%20(3).jpeg
```
- Filenames often contain spaces (encoded as `%20`), parentheses, special characters
- When copied into HTML the filename gets truncated or URL-encoding breaks
- Two France images broke for this exact reason on the first build pass — `_WhatsApp%20Image...` got truncated to `_Whats` and `_DJI_0957_58_59_60_61.jpeg` got truncated to `_DJI_0`
- Used by Vivla properties (Spanish)

**If you MUST use a Webflow URL** (no Storyblok/lh3 alternative for that destination):
1. Verify the FULL URL ends with `.jpg`, `.jpeg`, or `.png`
2. URL-encode any spaces (`%20`), parens (`%28`/`%29`)
3. Test the URL by curl/fetch before committing

Better practice when no good Storyblok/lh3 photo exists for the exact location: substitute a nearby region's photo and adjust the caption to describe the SCENE not the specific property.

---

## How to pull photos for a destination

```python
import json
ps = json.load(open('lib/properties.json'))

# Filter for the destination — adjust to match the page you're rewriting
destination_filters = {
    "Côte d'Azur": {'country': 'France', 'region': "Côte d'Azur"},
    "French Alps": {'country': 'France', 'regions': ['French Alps', 'Portes du Soleil']},
    "Paris": {'country': 'France', 'region': 'Paris'},
    "Mallorca": {'country': 'Spain', 'region': 'Mallorca'},
    # ...
}

for cluster, f in destination_filters.items():
    matches = []
    for p in ps:
        if p.get('country') != f.get('country'): continue
        if 'region' in f and p.get('region') != f['region']: continue
        if 'regions' in f and p.get('region') not in f['regions']: continue
        matches.append(p)
    print(f"\n== {cluster}: {len(matches)} properties ==")
    for p in matches[:6]:
        img = p.get('img', '')
        url_type = (
            'Storyblok' if 'storyblok' in img
            else 'lh3 (Drive)' if 'lh3.googleusercontent' in img
            else 'Webflow ⚠️' if 'website-files' in img
            else 'OTHER'
        )
        print(f"  [{url_type}] {p.get('city')}: {img}")
```

Group photos by cluster so each H3 zone in §B gets relevant imagery.

---

## Photo placement in the editorial

```html
<figure class="dest-figure">
  <img src="https://a.storyblok.com/..." alt="Scene-describing alt text including destination + property type" loading="lazy" />
  <figcaption>Scene-describing caption — describes what the photo SHOWS, not which property listing it came from.</figcaption>
</figure>
```

**Always include `loading="lazy"`** — performance + Core Web Vitals.

**Captions are editorial, not marketing.** Describe the scene:
- ✅ "An apartment in the Paris 6th, classic Haussmann floor with original parquet."
- ✅ "A panorama from a Morzine apartment terrace, Portes du Soleil ridge in the distance."
- ✅ "A Provençal stone villa near Cannes, dating from the 19th century."
- ❌ "Property #4823 — Antibes 4-Bed Apartment With Pool" (sounds like a listing)
- ❌ "Click to see this property" (call-to-action in caption is wrong tone)

**Alt text** describes the scene + destination for image SEO:
- ✅ "An Èze villa apartment with pool, perched in the medieval village above the Côte d'Azur"
- ✅ "A converted Chamonix-Mont-Blanc chalet with mountain views, in the high alpine"

---

## Photo count by tier

- **Country pillar (10k)**: 6–10 photos
  - 1 country-pillar hero figure at top of §A
  - 2–3 photos per cluster H3 in §B (3 clusters × 2-3 = 6-9)
  - Optional: 1–2 photos in §C (seasonal vignettes)

- **Region (8k)**: 5–8 photos
  - 1 region hero at top of §A
  - 1 photo per sub-zone H3 in §B (4–6 zones)
  - Optional: 1 in §C

- **City (5–6k)**: 4–6 photos
  - 1 city hero at top of §A
  - 1 photo per neighbourhood H3 in §B (3–4 zones)
  - Optional: 1 in §C

---

## Where the figure goes in the section

For pillar pages:
- §A: hero figure FIRST (before the snippet block + before the H2)
- §B: figure inside each H3 zone, AFTER the first paragraph of that zone's prose

For region pages:
- §A: hero figure FIRST
- §B: 1 photo per H3 zone

For city pages:
- §A: hero figure FIRST
- §B: 1 photo per neighbourhood H3

The cream/white band the figure sits in: gold-rule caption styling adapts automatically.

---

## When no good photos exist

If a destination has very few or no decent photos in `lib/properties.json` (e.g. an underdeveloped market), tell David in the wrap-up message:

> "Heads up — Sweden has only 2 photos in inventory and one is a Webflow URL with encoding issues. I included the 1 clean photo in §A as the hero. The §B zone H3s are running without inline imagery for now. We could either source stock from Unsplash Plus, commission shoots, or wait for new listings to refresh inventory."

Don't degrade quality by using broken Webflow URLs or unrelated stock just to hit a photo count.
