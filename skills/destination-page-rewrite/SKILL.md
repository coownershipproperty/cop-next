---
name: destination-page-rewrite
description: >
  Rewrite a destination editorial page (country pillar, region, or city) on co-ownership-property.com
  following the proven France pillar template and all editorial principles distilled from David's
  feedback rounds. Use this skill whenever David asks to rewrite, redo, refresh, or "do" a destination
  page (e.g. "rewrite the Spain pillar", "do Italy now", "redo Mallorca"), or when adding editorial
  content to a destination at content/destinations/<slug>.html. Covers all three tiers: country
  pillars (~10k words), major regions (~8k), cities and niche regions (~5-6k). Embeds every rule
  established through the France build: LLC framing (never SCI/SRL/Sociedad Limitada), no risk
  language, no specific euro carry guesses, comparative pitches only, °C-first temperatures, no
  inventory lock-in, partner-name-free, photo-sourcing hygiene (Storyblok/lh3 only, never Webflow CDN),
  authoritative external linking, strategic bolding, the exact HTML class catalogue. Run the
  verification grep checks at the end before declaring done.
---

# Destination Page Rewrite — proven workflow from the France pillar build

This skill rebuilds a destination editorial page (HTML body at `content/destinations/<slug>.html`)
to the gold-standard pattern established on `france-fractional-ownership-properties.html`. The
France build went through 12+ iteration rounds with David — every rule below was earned from his
feedback. Follow them or repeat the same mistakes.

**Always read these references before starting:**
- `references/section-template.md` — the exact HTML structure per section, with copy-paste markup
- `references/editorial-rules.md` — every do/don't established through the feedback rounds
- `references/photo-sourcing.md` — how to pull existing property photos and which URL formats actually work

The renderer (`pages/[slug].js`) handles cluster nav, hreflang, schema, breadcrumbs, TOC injection,
internal-link injection, and FAQ rendering automatically. You only author the body HTML between
`<body>...</body>`. The `<head>` block is preserved (just update the `<title>` and `<meta description>`).

---

## Step 0 — Confirm scope before writing anything

Ask David two things if they're not already obvious from his message:

1. **Which destination?** (slug from `content/destinations/*.html`)
2. **Which tier?** Determines word count target and section depth:
   - **Country pillar** (Spain, France, Italy, USA + Portugal, Germany, etc.) → **~10,000 words restHtml**, full §A–§G template, 25–40 external links
   - **Major region** (Mallorca, Costa del Sol, French Alps, California, Florida, Italian Lakes, Sardinia, Liguria) → **~8,000 words**, same §A–§F template, 20–30 external links, §B has 4–6 H3 sub-zones (e.g. Mallorca: Andratx/Pollença/Alcúdia/Santanyí/Sóller)
   - **City or niche region** (Aspen, Vail, Lake Como, Paris, Miami, 30A) → **~5,000–6,000 words**, condensed §A–§F template (skip §G), 12–20 external links, §B has 3–4 H3 sub-zones (neighbourhoods or anchors)

If David's message doesn't say, infer from the slug structure (country slugs are pillars, region slugs are regions, city slugs are cities) and confirm with one quick question only if the tier is genuinely ambiguous.

---

## Step 1 — Pull existing property photos for this destination

Before writing the editorial, gather the photo inventory. Open `lib/properties.json` and filter:

```python
import json
ps = json.load(open('lib/properties.json'))
# Filter — adjust country/region/city to match the destination
matches = [p for p in ps if p.get('country') == 'France' and p.get('region') == "Côte d'Azur"]
for p in matches:
    img = p.get('img', '')
    print(f"  {p.get('city')}: {img}")
```

For pillar pages, group by region/cluster (3 clusters × 2-3 photos each = 6-9 photos).
For region pages, group by sub-zone (4-6 H3 zones × 1-2 photos each = 4-12 photos).
For city pages, just collect 4-8 best photos across the city.

**Critical URL hygiene** (full rules in `references/photo-sourcing.md`):
- ✅ **Use Storyblok URLs** (`https://a.storyblok.com/f/...`) — clean, stable, no encoding issues
- ✅ **Use Google Drive lh3 URLs** (`https://lh3.googleusercontent.com/d/...`) — also clean
- ❌ **Skip Webflow CDN URLs** (`https://cdn.prod.website-files.com/...`) — filenames often have spaces, parens, special chars that get truncated on copy. Two France images broke for this exact reason.

If a destination has no Storyblok/lh3 photos and only Webflow ones, use them BUT verify the full URL is intact (ends with `.jpg` / `.jpeg` / `.png`, no truncation).

---

## Step 2 — Identify cluster regions / sub-zones for §B

§B "Where to own in {Destination}" is the page's value proposition section. Each H3 = one cluster zone.

For **country pillars**, the H3 zones are the country's regional clusters. Find them in `pages/[slug].js`:
- Spain: Balearics (Mallorca/Ibiza/Menorca), Costas (Costa del Sol/Costa Blanca/Costa de la Luz), cities (Madrid, Barcelona), Pyrenees, Canary Islands → 5–6 H3s
- France: South of France & Côte d'Azur, French Alps, Paris → 3 H3s
- Italy: Italian Lakes (Como/Garda/Maggiore), Sardinia, Liguria, Tuscany → 4 H3s
- USA: California (with Newport/Malibu/Napa-Sonoma/Lake Tahoe/Palm Springs), Colorado (Aspen/Vail/Breckenridge), Florida (Miami/Brickell/30A/Florida Keys), Utah (Park City) → 4 state H3s, each mentioning sub-cities
- Portugal: Lisbon, Cascais/Estoril, Algarve, Porto/Douro → 4 H3s
- Croatia: Dalmatian coast (Split/Dubrovnik/Hvar), Istria → 2-3 H3s
- Austria: Tyrol (Kitzbühel/Söll), Vorarlberg, Vienna → 3 H3s
- Germany: Bavarian Alps (Garmisch/Berchtesgaden), Munich, North Sea → 3 H3s
- Sweden: Stockholm, Gothenburg, Åre, archipelago → 3-4 H3s
- Mexico: Los Cabos, Riviera Maya (Tulum/Playa del Carmen), Punta Mita → 3 H3s

For **region pages**, the H3 zones are the major towns/sub-areas inside that region.
For **city pages**, the H3 zones are neighbourhoods (e.g. Aspen Mountain / Snowmass / Highlands; or Paris arrondissements 6th / 7th / 8th / 16th).

---

## Step 3 — Gather authoritative external links

Per pillar tier, target the ratio:
- Pillar (10k): 25–40 links
- Region (8k): 20–30 links
- City (5–6k): 12–20 links

**ONLY use authoritative sources.** No affiliate sites (clickandboat, getyourguide, tripadvisor), no Disneyland/theme parks, no Knight Frank/Savills market reports.

Authoritative categories:
- **Official tourism boards** — `france.fr/en/`, `explorenicecotedazur.com/en/`, `visitvar.com/`, `visitstockholm.com/en/`, `visitportugal.com/`, `italia.it/en`, `spain.info`
- **Official municipality sites** — `paris.fr/en`, `antibes-juanlespins.com/en/`, `cannes-destination.com/en/`
- **Official ski resorts** — `chamonix.com/en`, `courchevel.com/en/`, `valdisere.com/en/`, `aspensnowmass.com`
- **Official museums** — `louvre.fr/en`, `musee-orsay.fr/en`, `centrepompidou.fr/en`, `museodelprado.es`
- **Official airports** — `parisaeroport.fr/en/`, `nice.aeroport.fr/en`, `gva.ch/en/`
- **National parks / protected areas** — `calanques-parcnational.fr/en`, `nps.gov`
- **Official wine appellation bodies** — `vinsdeprovence.com/en`, `vins-rhone.com/en/`
- **Michelin Guide regional pages** — `guide.michelin.com/en/...`
- **Major cultural events** — `festival-cannes.com/en/`, `eurostar.com`, `tgvinoui.sncf/en/`

Every external link uses `target="_blank" rel="noopener"`.

---

## Step 4 — Author the HTML body following the section template

Read `references/section-template.md` for the exact markup pattern of each section. The structure is:

```
HERO (60–80 words)
MID-CTA (80–100 words, 2 buttons)
§A "Why {Destination}?" — featured-snippet block + intro + body
§B "Where to own in {Destination}" — H2 + N H3 zones with photos + "Best for:" lines
§C "A year in your {Destination} co-ownership home" — H2 + 4 seasonal H3s
§D "Who buys in {Destination}, and why" — H2 + paragraph + bulleted personas
§E "Practicalities: getting there, what it costs, what you own" — H2 + airports/transport + 3-col comparison table + sub-paragraphs
§F "How fractional ownership works in {Country}" — H2 + LLC mechanics in country context + "Your ownership at a glance" 5-bullet list
§G "Still deciding which {Country} region?" (PILLAR ONLY) — H2 + 3 paragraphs + 3 cluster links
```

Each section wrapped in `<section class="dest-sec [white|cream]"><div class="dest-inner">...</div></section>`. Alternate cream/white bands.

---

## Step 5 — Apply the editorial rules (READ `references/editorial-rules.md`)

Critical rules — full list in the references file:

1. **NEVER mention partner names**: &Hamlet, andhamlet, Vivla, Myne, Pacaso. Zero occurrences.
2. **LLC, not SCI/SRL/Sociedad Limitada**. The legal vehicle is always "purpose-built LLC" or "LLC structure" or "LLC membership interest". Never reference national vehicles like SCI (France), SRL (Italy), Sociedad Limitada (Spain), comunidad de bienes, etc.
3. **No risk/liability protection language**. Don't say "limited liability protects your personal assets", "the property's risks stay with the property", "what if the partner goes out of business". The LLC pitch is consistency across the global portfolio, NEVER fear-selling protection.
4. **No specific euro/dollar carry-cost guesses**. Don't write "annual carry typically €8,000–€25,000" or "a €5m villa carries €120,000/year". Reframe as comparative: "roughly one-eighth of the carry on the equivalent whole property", "a fraction of what an outright second-home owner pays in taxes, insurance and management", "vs renting where you pay the rent every year and build no equity".
5. **No inventory lock-in language**. Don't say "COP focuses on luxury ski chalets in Courchevel, Méribel, Portes du Soleil" or "We currently have 8 properties in Mallorca". Use rotation language: "COP curates co-ownership properties across [country]'s most established second-home regions", "browse the listings on this page to see what's currently available, or join our updates list for new properties as they launch".
6. **Temperatures Celsius first, Fahrenheit in parens**: `25–28°C (high 70s°F to low 80s°F)`, never Fahrenheit-only.
7. **Use "1/8" everywhere, not "one-eighth"**. Standardise.
8. **Stats bands ONLY on region/city pages, NOT on country pillars**. A stat like "300+ days of sun on the Côte d'Azur" is one French region, not France-wide. If using a stats band, every stat must be true for the entire scope of the page.
9. **Strategic bolding** (~80–130 `<strong>` per 10k pillar, scaled down for shorter pages): bold proof points (statistics, named places at first mention, key claims), "Best for:" lines, transition phrases ("The corollary", "What this means in practice"). Never bold whole sentences. Max ~5 consecutive words.
10. **Comparison table is 3-column comparative** (Whole second home / COP 1/8 share / Long-term rental) with relative ratios, never specific euro ranges. Use `data-col` attributes on `<td>` for mobile responsive rendering.

---

## Step 6 — Featured-snippet block at top of §A (POSITION-ZERO TARGET)

The single highest-value SEO move on the page. Markup pattern:

```html
<div class="dest-snippet" itemscope itemtype="https://schema.org/Question">
  <h2 itemprop="name">What is fractional ownership in {Destination}?</h2>
  <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
    <p itemprop="text"><strong>Fractional ownership in {Destination} means buying a deeded 1/8 share of a luxury [property type for the destination] — a [example 1], a [example 2], or a [example 3] — held in a purpose-built LLC alongside seven other co-owners.</strong> Each owner receives approximately 45 days of personal use per year through a fair-rotation calendar, with all property management, maintenance, taxes and operations handled by a professional team. It is real, recorded property equity in your name — not a timeshare, not a holiday club.</p>
  </div>
</div>
```

Place IMMEDIATELY after `<section class="dest-sec cream"><div class="dest-inner">` and BEFORE the §A `<h2>Why {Destination}?</h2>`.

---

## Step 7 — "Your ownership at a glance" 5-bullet list at end of §F (POSITIVE FRAMING)

Replace any "things to verify before signing" or similar negative-framed list with this positive pattern. Adapt the country-specific bits but keep the structure:

```html
<ul>
  <li><strong>Real, deeded equity in your name</strong> — your 1/8 share is recorded in [country]'s land registers, transferable, inheritable, and it appreciates with the underlying property.</li>
  <li><strong>Consistent international structure</strong> — your [country] share sits inside the same purpose-built LLC framework COP uses for properties worldwide, so multi-country owners deal with one model rather than a stack of different vehicles.</li>
  <li><strong>Fully managed throughout</strong> — the management company handles taxes, insurance, maintenance, scheduling, linen, the on-call concierge. You arrive, the property is ready.</li>
  <li><strong>Supported resale through COP's owner network</strong> — when you decide to exit, the managed-resale path connects you to the existing wait list and broader buyer pool, typically clearing in 2–3 months.</li>
  <li><strong>Designed for international portfolios</strong> — the LLC model means owning across multiple COP destinations becomes one consolidated relationship rather than juggling country-specific structures.</li>
</ul>
```

---

## Step 8 — Verify before declaring done

Run these grep checks against the file:

```bash
FILE="content/destinations/<slug>.html"
# 1. Partner names — must be 0
grep -ic "andhamlet\|vivla\|myne\|pacaso\|&Hamlet" "$FILE"
# 2. SCI/SRL/Sociedad Limitada — must be 0
grep -E "\bSCI\b|Sociedad Limitada|comunidad de bienes|Société Civile Immobilière|\bSrl\b" "$FILE"
# 3. Liability/risk language — must be 0
grep -ic "limited liability\|personal liability\|personal assets sit cleanly\|risks stay with" "$FILE"
# 4. Specific euro carry guesses — must be 0
grep -E "€[0-9]+,[0-9]{3}|€[0-9]+(\.[0-9]+)?[mk]" "$FILE"
# 5. Temperature pairing check — every °F should be near a °C
grep -c "°F" "$FILE"  # should equal °C count, or close
grep -c "°C" "$FILE"
# 6. Word count of restHtml (after the mid-CTA marker)
python3 -c "
import re
html = open('$FILE').read()
body = re.search(r'<body[^>]*>([\s\S]*?)</body>', html).group(1)
mid = body.find('class=\"dest-mid-cta\"')
rest = body[mid:] if mid > 0 else body
text = re.sub(r'<[^>]+>', ' ', rest)
text = re.sub(r'\s+', ' ', text).strip()
print('restHtml word count:', len(text.split()))
"
# 7. Image URL hygiene — no Webflow truncation
grep "cdn.prod.website-files.com" "$FILE" | grep -v "\.jpe\?g\b\|\.png\b" | head
# 8. Strong tag count — should be tier-appropriate
grep -c "<strong>" "$FILE"
# 9. dest-callout count — should have 3-7 across the body
grep -c 'class="dest-callout"' "$FILE"
# 10. dest-figure count — should match the photos you sourced
grep -c 'class="dest-figure"' "$FILE"
```

If anything is off, fix before declaring done. Report counts to David in the wrap-up.

---

## Step 9 — Update the file's title and meta description

Use this title pattern:
```
{Destination} Fractional Ownership Properties | Co-Ownership Property
```
Capital F, capital O, ≤65 chars. No `&#038;`, no double-spaces, no lowercase "fractional".

Meta description pattern:
```
Co-ownership properties in {Destination} from COP — deeded fractional ownership in [3 named clusters]. Professionally managed, 6–7 weeks of personal use per year, real equity in some of [region]'s most desirable second-home regions.
```
~150–160 characters.

---

## Step 10 — Hand off to David

Report:
- restHtml word count (should match tier target ±10%)
- Total external link count
- Total `<strong>` count
- Total `<figure>` count + which clusters they cover
- Confirmation that all 10 verification grep checks passed
- Deploy command:

```bash
cd /Users/didiolsson/code/cop-next
rm -f .git/index.lock
git add content/destinations/<slug>.html
git commit -m "destinations: rewrite {Destination} pillar to template ({word_count} words, {link_count} authoritative external links, all editorial rules applied)"
bash scripts/deploy-push.sh
```

Then ask David to review the live page and flag any feedback (which becomes a new rule in `references/editorial-rules.md` so the next rewrite avoids the same issue).

---

## When David adds new feedback rounds

If David's review of a new pillar surfaces a rule we didn't capture (e.g. "don't say X", "always pair Y with Z"), append it to `references/editorial-rules.md` AND add a verification check to Step 8. The skill should evolve with each rewrite so the next pillar starts at a higher quality bar.
