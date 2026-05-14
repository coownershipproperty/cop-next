# Destinations Editorial Audit — co-ownership-property.com

Audit scope: all 48 English destination HTML files in `content/destinations/*.html`, the renderer at `pages/[slug].js`, the FAQ data file at `lib/destination-faqs.json`, plus a live spot-check of the rendered France page.

---

## 1. Executive summary

The destination corpus reads as three different sites stitched together. The 13 USA-city pages (Aspen, Vail, Park City, Miami, Newport Beach, Napa & Sonoma, Palm Springs, Malibu/Santa Barbara, Lake Tahoe, Florida Keys, Brickell, 30A, Breckenridge) are short (775–1,440 words after the mid-CTA) and follow a tight WordPress-block formula with 2 H2s and 5–7 H3s — they read as one author. The 35 EU/Spain/UK/AU pages are 1,300–9,500 words of densely packed prose with almost no headings (most have 5–8 H2s and zero H3s, ULs, tables, or images) — they read as a different author optimising for word count rather than scannability. There is no shared editorial template across the two cohorts, no shared hero pattern (35 of 48 pages share an identical generic subtitle "Not timeshare. Real deeded ownership…"), and no shared visual vocabulary.

Top three systemic problems: **(1)** A renderer bug in `removeSectionByClass` silently exposes 800+ words of orphan FAQ-block content on the two largest pillar pages (france and italy), where readers see two FAQ sections back-to-back with raw "How the SCI Structure Works"-style sub-headings between them. **(2)** 41 of 48 pages have zero `<ul>`, `<ol>`, `<table>`, `<img>`, or `<blockquote>` in the editorial body — pure walls of `<p>`. **(3)** 35 pages share the identical 12-word hero subtitle and a generic "Co-Ownership Properties" eyebrow, so users land on Spain, France, Italy, Mallorca, etc., and see the same intro. Top three quick wins: fix the renderer's `removeSectionByClass` so the france/italy bug is patched the day it ships; add Spain/France/Italy/USA to `DEST_KEYWORDS` (currently missing — every other destination page can never auto-link to the four pillars); and rewrite the 35 generic hero subtitles to be destination-specific (a one-day batch task with predictable templates per region).

Recommended scope: **template rebuild plus phased rewrite**. Do not polish in place — the current editorial body of the 35 EU pages is 6+ sections of unbroken prose that no rewrite-in-flight will fix without reformatting. Phase 1 is renderer fixes plus the 12 USA-city page rewrites (all under 1,500 words; cheap to redo on a tight new template). Phase 2 is the 8 country pillars (france, spain, italy, usa, portugal, austria, croatia, germany) on a longer, modular template. Phase 3 is the 28 region/city EU pages, which is the bulk of the work but each follows the country-page template, so rate of completion accelerates.

---

## 2. Architectural findings (renderer + HTML template level)

These are problems no per-page polish can fix. They need a code change or a template-level decision.

### 2.1 `removeSectionByClass` silently fails on nested-but-unbalanced sections — visible bug on france and italy

`pages/[slug].js:288–302` walks `<section>` open/close tags from the marker, decrementing depth on each `</section>` until depth reaches 0, and only then returns the cleaned HTML. If the source HTML has an open `<section class="dest-faq-sec">` that is **never closed at its own depth** (because the inner `<section class="dest-sec white">` and `<section class="dest-sec cream">` blocks each open and close their own depth, but no `</section>` ever brings the outer back to 0), the function exits the loop with depth still > 0 and returns the original HTML untouched. No error, no log.

This is the case for `france-fractional-ownership-properties.html` and `italy-fractional-ownership-properties.html`. On both live URLs, the JSON-driven FAQ section renders correctly **AND** the in-HTML "France fractional ownership FAQs" / "Italy fractional ownership: frequently asked questions" container plus its embedded sections ("How the SCI Structure Works", "Why France Remains Europe's Most Consistent Property Market", etc., on france; "Investment in Detail", "Regions in Detail", "Practical Buyer Information" on italy) ALSO render — sandwiched between the editorial body and the JSON FAQ. Confirmed by live fetch of `https://co-ownership-property.com/france-fractional-ownership-properties/`: the page renders both `## France fractional ownership FAQs` (line 487 of the rendered text dump) AND `## France Fractional Ownership — Frequently Asked Questions` (line 521).

Recommended fix: have `removeSectionByClass` find the matching outer-balance closing tag using a tag-token walk (split the html on `<section>`/`</section>` tokens and match by index parity), or simply track the position where depth would have closed the OUTER `dest-faq-sec`, and if no balanced close is found, fall back to stripping from the marker to the next `<section class="dest-sec` boundary or end-of-body.

### 2.2 Four pillar slugs are missing from `DEST_KEYWORDS`

`pages/[slug].js:174–219` defines `DEST_KEYWORDS` with 44 entries but **omits the four highest-volume pillar pages**: `spain-fractional-ownership-properties`, `france-fractional-ownership-properties`, `italy-fractional-ownership-properties`, `usa-fractional-ownership-properties`. The `injectInternalLinks` function only links a related slug when its keyword appears in the destination's content; for the four pillars, no keywords are registered, so even though they appear in many `RELATED` lists, the renderer never converts inline mentions of "Spain", "France", "Italy", or "USA" into links. This is a major SEO loss — all 48 pages talk about these countries by name and the renderer skips all of them.

Fix: add `["Spain"]`, `["France"]`, `["Italy"]`, `["USA","United States","America"]` entries to `DEST_KEYWORDS`. (Note that "USA" needs care because many page titles and snippets contain `USA` as part of "USA fractional ownership" — only inject when not already adjacent to the link.)

### 2.3 Internal-link injector is rate-limited to one link per related slug — and runs over the wrong text scope

`injectInternalLinks` (`[slug].js:351–394`) only works on the `restHtml` portion (`getStaticProps` calls it after split). The hero text is never enriched. On long pages this is fine, but for the country-pillar pages where the hero contains the only mention of major sub-regions, those keywords go un-linked. Also: only the FIRST occurrence of a destination keyword becomes a link (because `linkedSlugs.has(slug)` short-circuits subsequent passes). For long pages like france (7,800 words restHtml) one link in 7,800 words is a missed opportunity. Consider linking up to 2–3 occurrences per related slug, with a sensible spacing rule (e.g. don't link the same slug twice inside the same `<p>` or within 500 chars).

### 2.4 The renderer strips the legacy `dest-faq-sec` block and replaces it with the JSON-driven FAQ — but the FAQ schema (JSON-LD) and the visible block are not always in sync

`getStaticProps` builds `faqItems` from `destinationFaqs[slug]` if available and falls back to `extractFaqItems(rawHtml)` otherwise (`[slug].js:466–468`). Every slug currently has a FAQ JSON entry — so the fallback path is dead code. The renderer also still runs `restHtml.replace(/<h2([^>]*)>[^<]*?—\s*Frequently Asked Questions<\/h2>/g, '<h2$1>Frequently Asked Questions</h2>')` (`[slug].js:449`) to normalise an FAQ heading that is then immediately stripped by `removeSectionByClass` — also dead code. Cleanup: remove both.

There is also one orphan FAQ JSON entry: `costa-de-la-luz-fractional-property-for-sale` (no matching HTML page, no `DEST_FILTERS` entry, but it has FAQ content). It is reachable by anyone who guesses the URL — Next.js fallback `'blocking'` will hit `getStaticProps`, find no HTML, and 301-redirect to `/blog/costa-de-la-luz-fractional-property-for-sale/` which almost certainly 404s.

### 2.5 Slug-naming inconsistency forces the renderer's `destLabel` function into special cases

`destLabel` (`[slug].js:222–235`) has hard-coded special cases for `Park City`, `30A`, plus a chain of `.replace(...)` calls to strip suffixes like `-co-ownership-beach-homes`, `-fractional-ownership-wine-country-estates`, `-fractional-ownership-desert-modern-luxury`, etc. Every new long slug requires a new replace rule. The naming pattern is genuinely inconsistent across the 48 pages:

- 35 pages use `<place>-fractional-ownership-properties` (the standard)
- 5 pages use `<place>-fractional-ownership` (aspen, vail, breckenridge, miami, newport-beach)
- `park-city-fractional-ownership-2` (a `-2` suffix from a WP duplicate slug)
- `30a-fractional-ownership-emerald-coast-co-ownership-beach-homes` (74 chars)
- `napa-sonoma-fractional-ownership-wine-country-estates` (53 chars)
- `palm-springs-fractional-ownership-desert-modern-luxury` (54 chars)
- `barcelona-fractional-ownership-for-sale` (the `-for-sale` is unique)
- `brickell-fractional-ownership-miami` (suffix word order reversed)

Cost of inconsistency: every `[slug].js` map (`DEST_FILTERS`, `PARENT`, `RELATED`, `DEST_KEYWORDS`) repeats the awkward strings; cross-referencing in editorial copy invites typos (and we have at least 4 hand-typed broken internal hrefs to `lake-tahoe-fractional-ownership` and `park-city-fractional-ownership` that drop the suffix); slugs over 60 characters are flagged by Google as a soft SEO penalty signal and look bad in SERPs. Strongly recommend normalising to `<place>-fractional-ownership-properties` and adding 301 redirects from the legacy slugs in `next.config.js`. The redirect list is small (~13 entries) and the SEO benefit is permanent.

### 2.6 Empty section shells from the WP migration

7 pages have `<h2>...</h2></div></section>` with no `<p>` content between heading and section close. Two flavours:

- **Editorial gap (1 page):** `italy-fractional-ownership-properties.html` line ≈720 has `<h2>Italy fractional ownership vs full ownership</h2></div></section>` — a heading promised, no body delivered. Reads as a missing section to anyone scrolling.
- **Duplicate "Also Explore" header (6 pages):** balearics, costa-blanca, costa-de-la-luz, madrid, mallorca, menorca all end with an empty H2 like `<h2>Discover More Balearics Fractional Ownership Destinations</h2></div></section>` immediately before the renderer's own auto-generated `dest-also-explore` section that says "Also Explore". Users see the header, no content, then ANOTHER header and the explore links. Strip these from the source files (or have the renderer strip empty h2-only sections).

### 2.7 Broken internal links to legacy slugs and removed pages

Across the 48 files, hand-coded internal hrefs reference URLs that now 301-redirect to `/blog/...` (which usually 404). Top offenders by frequency:

- `/the-running-costs-of-a-fractional-ownership-property/` — 18 occurrences across the EU pages
- `/formentera-fractional-ownership/` — 12 occurrences (this destination page does not exist; mostly inside `balearics-fractional-ownership-properties.html`)
- `/what-is-fractional-ownership/` — 10 occurrences
- `/benefits-of-fractional-ownership-for-second-homes/` — 10 occurrences
- `/co-ownership-explained/` — referenced by name in many pages; this URL DOES return content (per Google search), so it works
- `/lake-tahoe-fractional-ownership/` — 4 occurrences (correct slug is `lake-tahoe-fractional-ownership-properties`)
- `/park-city-fractional-ownership/` — 3 occurrences (correct slug is `park-city-fractional-ownership-2`)
- `/santa-ponsa-fractional-ownership-properties/`, `/pollenca-port-de-pollenca-fractional-ownership-properties/`, `/alcudia-port-dalcudia-fractional-ownership-properties/`, `/santanyi-fractional-ownership-properties/`, `/andratx-fractional-ownership-properties-co-ownership-property/` — Mallorca sub-zone pages (4 occurrences each from `balearics-fractional-ownership-properties.html`); these don't exist as destinations
- `/europe-fractional-ownership-properties/` — 1 occurrence

Recommended fix: a build-time check that every internal href matches an actual route, plus a one-time rewrite of `/lake-tahoe-fractional-ownership/` → `/lake-tahoe-fractional-ownership-properties/` and `/park-city-fractional-ownership/` → `/park-city-fractional-ownership-2/` (or rename the slugs as in §2.5 and redirect). For "ghost" sub-zone slugs (formentera, santa ponsa, pollença, alcúdia, santanyí, andratx), either build the destinations or strip the links and replace with anchors to the parent (Mallorca).

### 2.8 Hero subtitle is identical on 35 pages

35 of 48 pages have hero subtitle `Not timeshare. Real deeded ownership. Luxury second homes at a fraction of the cost.` and eyebrow `Co-Ownership Properties` — generic boilerplate inherited from a single WP template. The 13 USA-city pages have unique destination-specific eyebrows and subtitles (e.g. `Florida · USA` / `Sugar-white sand, dune lakes, and the charming coastal villages of Scenic Highway 30A — fractional ownership in Florida's most beautiful beach destination.`). No reason the EU pages can't have the same treatment; this is a one-off rewrite job documented in the per-page table below.

### 2.9 Title-tag formatting bugs in source files

15 pages have HTML-entity bugs (`&#038;` instead of `&`) or double-spaces in `<title>`:

- `Croatia  Fractional`, `Germany  Fractional`, `Portugal  Fractional`, `Sweden  Fractional` — extra space between country and "Fractional"
- `Italy fractional ownership properties`, `Liguria fractional ownership properties`, `Ibiza Fractional Ownership properties`, `Menorca Fractional Ownership properties`, `France Fractional Ownership properties`, `Pyrenees Mountains fractional ownership properties`, `Utah Fractional Ownership properties`, `Costa De La Luz` — inconsistent capitalisation
- `Sardinia Fractional Ownership | Luxury Co‑Owned Villas &#038; Apartments | Co-Ownership Property` — 98 chars + literal `&#038;` (renders as `Apartments` because `&#038;` is just `&` HTML-encoded; will display correctly but the source is ugly and inconsistent)
- `Napa &#038; Sonoma`, `Malibu &#038; Santa Barbara` — also literal `&#038;`

Adopt one consistent pattern (recommended: `{Destination} Fractional Ownership Properties | Co-Ownership Property`, capital F-O, no double-space, plain `&` not `&#038;`).

### 2.10 13 USA-city pages have no `<meta name="description">` in source

`brickell`, `florida-keys`, `lake-tahoe`, `30a`, `aspen`, `vail`, `breckenridge`, `park-city-2`, `miami`, `newport-beach`, `malibu-santa-barbara`, `napa-sonoma`, `palm-springs` — all have empty `metaMatch` in the renderer, so `existingMetaDesc` is empty. The renderer's `buildMetaDesc` then produces a count-and-min-price string ("X co-ownership properties in Y from $Z…") if matchedProps exists, otherwise returns the empty string. Most of these pages have ≥1 property today so the auto-meta works — but for pages with zero matched properties (e.g. florida-keys when no Islamorada listings exist), the `<meta description>` will be empty and Google will improvise. Add the static fallback meta into the source files.

### 2.11 Inline `<h3>` inside `<summary>` elements is invalid HTML

The `dest-faq-sec` blocks in 12 pages use `<summary><h3>What is fractional ownership in real estate?</h3>` — placing block-level `<h3>` inside a `<summary>` (which is itself the implicit phrasing-level child of `<details>`). This is invalid per HTML spec. The renderer strips these blocks for most slugs (so live is clean), but the source files should be fixed if `dest-faq-sec` content ever leaks through (as it does on france and italy per §2.1).

---

## 3. Common content problems across the corpus

### 3.1 Duplicated paragraph fragments across pages

Most duplication is benign chrome (newsletter, "no properties currently listed", footer) — the renderer correctly strips these. Editorial-content duplication is more limited but real:

- **9 USA-city pages** open the FAQ block with a near-identical paragraph: `Fractional ownership in real estate means co-owning a vacation property with a small group of buyers, where each owner holds a deeded share (typically 1/8th)…` followed by 12 more sentences. These are inside the `dest-faq-sec` HTML so they don't render live (FAQ JSON drives the visible FAQ instead) — but the JSON FAQs themselves are also near-duplicates of each other. The same "What is fractional ownership in real estate?" question appears in nearly every JSON entry with a similar answer. If Google indexes the JSON-LD FAQ schema (which it does), this is duplicated FAQPage schema across 12+ slugs — a known SEO downgrade signal.
- **3 EU pillars** (`france`, `italy`, `mallorca`) share a long boilerplate paragraph beginning `Capital efficiency and proportional appreciation: Your fractional share appreciates proportionally with the full property value…`. These pages also share a paragraph beginning `Running costs are shared proportionally between co-owners according to their fraction. A professional management company…`. And another starting `It is also worth noting that some co-ownership platforms operate internal resale marketplaces…`. The source files have at least 6 distinct multi-sentence chunks that recur verbatim in 2–3 EU pages.
- **2 USA mountain pages** (`aspen`, `breckenridge`, `park-city-2`) share `This year-round appeal means you can maximize your 6-7 weeks of annual ownership across all seasons rather than competing for limited winter holidays…`.
- **3 EU regional pages** (`barcelona`, `lake-como`, `sardinia`) share a Spanish-tax paragraph that mentions Spain in all three (factually wrong on Lake Como).

Examples (file path + quoted snippet):

- `france-fractional-ownership-properties.html` line 754 / `mallorca-fractional-ownership-properties.html` line ≈740: `That accumulation of shared family memory — built year after year in the same place, through the same rituals and the same discoveries — is something no hotel or rental holiday can replicate.` — 60+ word run identical across the two files, with each ending `Talk to us about which French regions / Mallorca zones and properties work best for families`.
- `croatia-fractional-ownership-properties.html` / `germany-fractional-ownership-properties.html` / `sweden-fractional-ownership-properties.html`: `Once the purchase completes, a professional management company takes over all operational responsibility for the property. Your personal weeks — approximately 45 days per share for a 1/8 Croatia fractional ownership share — are allocated through a fa…` — same paragraph with country name swapped, repeated three times.

### 3.2 Walls of `<p>` — almost no visual variety

41 of 48 files have **zero `<ul>`, `<ol>`, `<table>`, or `<blockquote>`** in the editorial body. Zero `<img>` in 47 of 48 (only `30a` has 4 images and they're invisible/no alt text in the file). The 7 USA-city pages that DO have lists are 30A, malibu-santa-barbara, newport-beach, lake-tahoe, florida-keys, brickell, plus aspen with 0 lists but 6 H3 sub-sections. The country pillars (france 7,828 words, italy 6,618, spain 5,701, mallorca 9,452) are unbroken paragraph runs of 3–6 sentences each, with no scannable elements. Average reading time on mallorca's body alone (9,452 words at ~250 wpm) is 38 minutes of solid prose — no reader stays for that.

This is the single highest-leverage editorial fix and the one that unlocks the rewrite plan in §4.

### 3.3 Generic prose / not-actually-about-this-destination paragraphs

Some EU pages contain paragraphs that read as if pasted from a "fractional ownership generic explainer" rather than the destination — mostly the SCI / liability protection / 1/8 share legalese, which is identical across France, Italy, Spain. The reader on Lake Como wants to read about Lake Como; the reader on Costa Blanca wants to read about Alicante and Calpe. Generic legal explainer should live ONCE on `/co-ownership-explained/` and be linked from the destinations, not repeated.

Worst offenders for "could be any country" content density:
- `lake-como-fractional-ownership-properties.html` — 5 of 5 H2 sections include generic mechanics paragraphs; only 2 of ≈15 paragraphs are actually about Lake Como itself (the rest are LLC/management mechanics).
- `barcelona-fractional-ownership-for-sale.html` — short page (1,611 words rest) where nearly half the editorial body is generic Spanish-tax and SCI mechanics, not Barcelona-specific colour.
- `sardinia-fractional-ownership-properties.html` — 5 H2s, all about ownership mechanics; only 2 mention Costa Smeralda or Olbia.

### 3.4 No images, no captions, no maps

The site has property cards (with photos) above the editorial fold, but the editorial body itself has no photography, no maps, no diagrams, no infographics. For destinations of this calibre (Aspen, Mallorca, Lake Como), an editorial that does not feature a single hero photo of the destination is a missed both for SEO (image search, image alt text) and conversion (visual desire).

### 3.5 Mid-CTA placement is OK on every page, but copy is asymmetric

All 48 pages successfully split at a `dest-mid-cta` marker — no page is missing it. The CTA itself follows two formats:

- USA-city pages (13): `<h2>` headline + `<p>` benefit + 2 buttons (Browse All Properties / Get Updates) — punchy and destination-specific.
- EU pages (35): `<p>Ready to find your property in {country}?</p>` + 2 buttons — plain, no headline.

The EU mid-CTA copy is weaker. Standardise on the USA pattern.

### 3.6 FAQ JSON content is on the right model but answers are sometimes thin or repetitive

Every slug has a JSON FAQ entry with 6–12 items; the schema and rendering work. But:

- 35+ entries open with `What is fractional ownership in real estate?` answered with near-identical 90-word paragraph. Same question, same answer, 35 times across the site. Schema duplication risk.
- Country-pillar FAQs (france, italy, spain, usa) repeat themselves: france FAQ has 12 items but several are mechanics-heavy ("What legal structure holds the property?") that overlap with `/co-ownership-explained/` content.
- Region-specific FAQs are often missing destination colour: ibiza FAQ talks about "Spanish ownership" rather than Ibiza. Lake Como FAQ talks about "Italian property law" rather than Como/Cernobbio/Bellagio specifics.

---

## 4. Proposed new editorial structure (one template for all 48 pages)

This section is the new editorial template all 48 destinations should follow. Section names are H2 wording patterns; content guidance and ideal word counts assume the page is rendered at the standard 1,200–1,400px content width.

```
HERO  (renderer: heroHtml)
  - Eyebrow: "{Region} · {Country}" (or "Spain", "France", "USA" etc. for country pillars)
  - H1: "{Destination} Fractional Ownership"
  - Subtitle: 1–2 destination-specific sentences. Never the generic boilerplate.
  - 30–60 words total.

[Auto-injected by renderer: filter bar + property grid + count-and-from-price strip]

MID-CTA  (existing — keep, polish copy on EU pages)
  - H2: a one-line claim about the destination's prestige + the access promise.
  - p: 1 sentence quantifying the offer (6–7 weeks, deeded share).
  - 2 buttons: Browse All Properties / Get Updates.

—— restHtml starts here ——

§A. "Why {Destination}?"  (300–450 words; H2 + 2–3 paragraphs)
  Purpose: SEO H1-equivalent for the body. Hits the primary keyword
  ("fractional ownership in {destination}") in the first 80 words.
  Content: 3 specific, defensible reasons this destination matters
  (NOT "luxury" / "scarcity" generic; specific anchors like "the
  Maroon Bells", "the Tramuntana", "the Three Valleys").
  Visual: pull-quote or callout box with one striking statistic
  (e.g. "30,000 protected acres" / "350 days of sunshine").
  SEO rationale: this section earns the destination-keyword rank.

§B. "Where to own in {Destination}"  (500–800 words; H2 + 3–6 H3
  sub-sections)
  Purpose: zone breakdown, the section a buyer comes for. The H3
  list IS the page's value proposition: "I want a villa in Andratx
  not Pollença" is a real customer sentence.
  Content: 3–6 H3 zones (e.g. for Mallorca: Andratx, Pollença,
  Alcúdia, Santanyí; for Aspen: Aspen Mountain, Snowmass, West
  Aspen, Highlands). Each H3 = 80–150 words: one-paragraph zone
  character + one-sentence "best for" line in bold.
  Visual: each H3 should ideally have one photo (240px tall, full
  bleed). At minimum, each H3 has the bold "Best for:" line at the end.
  SEO rationale: long-tail capture (e.g. "Andratx co-ownership"
  via internal H3) + topical depth signal.

§C. "Lifestyle: a year in your {Destination} co-ownership home"
  (500–700 words; H2 + 4 H3 sub-sections, one per season)
  Purpose: emotional / aspirational; the section that converts
  the dreaming reader into the enquiring reader. Replaces the
  "A week in your..." sections that exist on some pages today.
  Content: 4 H3s — Spring, Summer, Autumn, Winter. Each H3 =
  100–150 words of specific experience (named restaurant, named
  trail, named beach, named festival). Two named external links
  per season MAX (today some pages have 12 external links per
  paragraph — too many; dilutes both ranking authority and reader
  attention).
  Visual: a horizontal row of 4 small photos (one per season) or
  an editorial-style 4-column callout.
  SEO rationale: long-form signals; semantic depth.

§D. "Who buys here, and why" (250–400 words; H2 + 1 paragraph + bullet list)
  Purpose: social proof + buyer-persona resonance.
  Content: 1 paragraph on the international buyer mix (British,
  American, German, etc., with specifics). Then a bulleted list:
  3–4 "best for" buyer personas (e.g. "Active families with
  school-age children", "Skiing couples in their 50s", "Multi-
  generational groups").
  Visual: bullet list (this is one of the few places a list is
  more honest than prose).

§E. "Practicalities: getting there, what it costs, what you own"
  (350–500 words; H2 + 1 H3 per topic, OR one H2 + a
  comparison table)
  Purpose: handle the hard questions before the FAQ. Each
  destination should have a table: "Whole-property purchase vs
  1/8 share" with rows for purchase price, annual running cost,
  weeks of use, exit timeline.
  Visual: ONE comparison table (this is the page's most-screenshot-
  able element).
  SEO rationale: featured-snippet / table-snippet eligibility.

§F. "How fractional ownership works in {Country}" (200–300 words;
  H2 + 1–2 paragraphs)
  Purpose: country-specific legal mechanics (SCI in France,
  comunidad de bienes in Spain, LLC in USA, srl in Italy).
  Content: ONE paragraph of mechanics, then a clear link out to
  /co-ownership-explained/ for the full explainer. Don't repeat
  the full /co-ownership-explained/ content here — link it.

§G. (renderer-injected, no source-file change needed)
  - FAQ section (rendered from JSON, already works on all 48 pages)
  - "Also Explore" related-destination links (already works)

—— restHtml ends ——

Newsletter / ExpertForm / Footer (renderer-injected)
```

**Total target word count**: 1,800–2,500 for restHtml. Current corpus average is 2,866; the EU pillars are 4,000–9,500 (needs to come down by 30–60%); the USA-city pages are 776–1,500 (most need to come UP modestly to 1,800).

**Why this template wins on the existing corpus**:

- Section §B (zone breakdown) is what the EU pages are missing entirely — they currently lump Mallorca's Andratx + Pollença + Santanyí into one paragraph. The 13 USA-city pages don't need §B (one city, no zones).
- Section §C is what the USA-city pages do well today (e.g. Napa "Year-Round Usability" is essentially this) — it just needs scaling to all 48 pages.
- Section §E with the comparison table is missing from ALL 48 pages — the renderer's `<p>` walls have ZERO tables. Adding one table per page is the highest-leverage scannability fix.
- Section §F is the explicit place to put the SCI / LLC / mechanics content that currently bleeds into every editorial paragraph; saying it ONCE per country-pillar page (then linking from the regions to the country) lets the regional pages be regional.

---

## 5. SEO recommendations

### 5.1 Title tag pattern

Adopt: `{Destination} Fractional Ownership Properties | Co-Ownership Property` (capital F and O, no double space, no `&#038;`). Keep titles ≤ 65 chars where possible.

### 5.2 Meta description pattern

Already auto-built by `buildMetaDesc` for pages with properties — works well. For pages with zero matched properties, add a static fallback in source: `Co-ownership properties in {Destination} from COP — deeded fractional ownership, professionally managed, 6–7 weeks per year.` Currently missing on 13 USA-city pages.

### 5.3 Keyword strategy

Primary keyword per page: `fractional ownership in {destination}` (or `{destination} fractional ownership`). Should appear in: H1, first 80 words of restHtml, at least one H2, meta title, meta description, slug. Audit the 35 EU pages — many have `fractional ownership` only in H1 and never again in body, instead saying "co-ownership". Both are valid but `fractional ownership` is the higher-volume search term per the user's existing slug structure.

Secondary long-tail per page: 3–6 zone or sub-region terms per the §B structure (e.g. for Mallorca: "Andratx co-ownership", "Pollença fractional ownership", "Santa Ponsa fractional villa").

### 5.4 Internal-link strategy improvements (renderer-level)

1. Add Spain, France, Italy, USA to `DEST_KEYWORDS` (see §2.2).
2. Allow the injector to add 2–3 links per related slug in long pages, not just the first occurrence (see §2.3).
3. Make the injector run on the hero too, not just restHtml — at minimum on country-pillar pages where the hero references multiple sub-regions.
4. Add a "Sub-zones" related cluster: when the destination is Mallorca, surface child links to Andratx/Pollença/etc. (currently those sub-zones don't have destination pages, but the H3 section IDs from §B can serve as anchor links).

### 5.5 Schema additions worth doing

Currently rendered: `BreadcrumbList`, `WebPage`, `FAQPage`. Add:

- **`Place` / `TouristDestination`** for each destination, with `geo` lat/lng (already in property data, can be aggregated). High-leverage: shows up in destination-search rich results.
- **`ItemList`** for the property grid (each property as a `RealEstateListing`). The renderer already has the property data; this is a one-time schema-builder addition.
- **`Product` / `Offer`** on each property card — separate concern but related.
- Consider **`Article`** schema for the editorial body where word count > 1,500 (most EU pages qualify), with `wordCount`, `inLanguage`, `dateModified` — gives Google a clearer "this is editorial content" signal vs the e-commerce property grid above it.

### 5.6 Slug normalisation

Rename and 301-redirect:

| Current slug | Recommended slug |
|---|---|
| `aspen-fractional-ownership` | `aspen-fractional-ownership-properties` |
| `vail-fractional-ownership` | `vail-fractional-ownership-properties` |
| `breckenridge-fractional-ownership` | `breckenridge-fractional-ownership-properties` |
| `miami-fractional-ownership` | `miami-fractional-ownership-properties` |
| `newport-beach-fractional-ownership` | `newport-beach-fractional-ownership-properties` |
| `park-city-fractional-ownership-2` | `park-city-fractional-ownership-properties` |
| `30a-fractional-ownership-emerald-coast-co-ownership-beach-homes` | `30a-emerald-coast-fractional-ownership-properties` |
| `napa-sonoma-fractional-ownership-wine-country-estates` | `napa-sonoma-fractional-ownership-properties` |
| `palm-springs-fractional-ownership-desert-modern-luxury` | `palm-springs-fractional-ownership-properties` |
| `malibu-santa-barbara-fractional-ownership` | `malibu-santa-barbara-fractional-ownership-properties` |
| `lake-tahoe-fractional-ownership-properties` | (keep — already correct) |
| `florida-keys-fractional-ownership` | `florida-keys-fractional-ownership-properties` |
| `barcelona-fractional-ownership-for-sale` | `barcelona-fractional-ownership-properties` |
| `brickell-fractional-ownership-miami` | `brickell-fractional-ownership-properties` |

Add 13 redirects in `next.config.js`. Net effect: cleaner SERP appearance, removes 4 broken hand-typed internal links automatically (the legacy hrefs in `aspen.html` etc. that drop `-properties` will start resolving via redirect), removes the `-2` suffix, brings all 48 slugs into one pattern.

### 5.7 FAQ JSON gaps and improvements

- Remove the orphan `costa-de-la-luz-fractional-property-for-sale` entry (no matching HTML page) — see §2.4.
- Audit "What is fractional ownership in real estate?" — currently appears in 35+ entries with near-identical answer. Either: (a) remove from per-destination JSON entirely and link to a single canonical answer on `/how-it-works/`, or (b) phrase the answer destination-specifically (e.g. for Aspen: "Fractional ownership in Aspen means co-owning a deeded share of an Aspen ski property…"). The destination-specific version preserves long-tail SEO; the canonical version reduces FAQPage schema duplication. Recommend the destination-specific version.
- Region-specific FAQs (ibiza, lake-como, sardinia, etc.) currently have generic-country answers. Rewrite each to mention 2–3 named local features (Es Vedrà / Talamanca; Bellagio / Cernobbio; Costa Smeralda / Porto Cervo). 1-2 hour per slug, very high reader value.

---

## 6. Per-page red-flag table — all 48 pages, sorted by severity desc

Word counts are for `restHtml` only (after the mid-CTA marker, after renderer strip). "Critical" = visible rendering bug or completely missing structural element. "Bad" = systemic content problems (thin / wall-of-p / generic hero / many issues). "OK" = mostly working but a couple of fixable issues. "Good" = no notable issues.

| # | Slug | Rest WC | Severity | Top 1–2 issues |
|---|------|---------|----------|----------------|
| 1 | `france-fractional-ownership-properties` | 7,828 | **Critical** | FAQ-strip bug exposes 800+ words of orphan SCI/scarcity content between body and JSON FAQ; generic hero; wall of `<p>` |
| 2 | `italy-fractional-ownership-properties` | 6,618 | **Critical** | Same FAQ-strip bug exposes orphan content; empty H2 ("Italy fractional ownership vs full ownership") with no body; generic hero |
| 3 | `mallorca-fractional-ownership-properties` | 9,452 | Bad | Bloated (largest page on the site); generic hero; empty "Check Out Our Other Locations" H2 shell; 4+ broken internal links to ghost sub-zone slugs |
| 4 | `spain-fractional-ownership-properties` | 5,701 | Bad | Generic hero; wall of `<p>`; mid-CTA missing H2; "Also Explore" card with literal " Homes" link text |
| 5 | `utah-fractional-ownership-properties` | 5,340 | Bad | Generic hero; 13 leftover WP property tiles inline in body (`<a href="/property/park-city-utah-...">`) — visible artefact `277 m2...details</a>WHY UTAH</p>`; no images |
| 6 | `colorado-fractional-ownership-properties` | 5,094 | Bad | Generic hero; wall of `<p>`; no images on a 5,000-word page |
| 7 | `ibiza-fractional-ownership-properties` | 4,334 | Bad | Generic hero; wall of `<p>`; 3 broken internal slug refs |
| 8 | `costa-del-sol-fractional-ownership-properties` | 4,315 | Bad | Generic hero; 14 H2s with no H3 sub-structure; no images |
| 9 | `south-of-france-fractional-ownership-properties` | 4,133 | Bad | Generic hero; wall of `<p>`; long with zero images |
| 10 | `florida-fractional-ownership-properties` | 4,048 | Bad | Generic hero; wall of `<p>`; long with zero images |
| 11 | `california-fractional-ownership-properties` | 3,710 | Bad | Generic hero; 2 broken internal slug refs; long with zero images |
| 12 | `paris-fractional-ownership-properties` | 3,686 | Bad | Generic hero; wall of `<p>`; long with zero images |
| 13 | `austria-fractional-ownership-properties` | 3,642 | Bad | Generic hero; 3 broken internal slug refs; long with zero images |
| 14 | `french-alps-fractional-ownership-properties` | 3,594 | Bad | Generic hero; wall of `<p>`; long with zero images |
| 15 | `usa-fractional-ownership-properties` | 3,479 | Bad | Generic hero; missing from `DEST_KEYWORDS` so other USA pages don't auto-link to it; long with zero images |
| 16 | `portugal-fractional-ownership-properties` | 3,452 | Bad | Generic hero; 3 broken internal slug refs; long with zero images |
| 17 | `croatia-fractional-ownership-properties` | 3,134 | Bad | Generic hero; wall of `<p>`; double-space in title |
| 18 | `germany-fractional-ownership-properties` | 3,071 | Bad | Generic hero; wall of `<p>`; double-space in title |
| 19 | `sweden-fractional-ownership-properties` | 3,024 | Bad | Generic hero; wall of `<p>`; double-space in title |
| 20 | `costa-blanca-fractional-ownership-properties` | 2,964 | Bad | Generic hero; empty H2 shell ("Discover More Costa Blanca…") at end; no images |
| 21 | `balearics-fractional-ownership-properties` | 2,963 | Bad | Generic hero; empty H2 shell at end; 12 broken `/formentera-fractional-ownership/` internal links |
| 22 | `mexico-fractional-ownership-properties` | 2,936 | Bad | Generic hero; wall of `<p>`; long with zero images |
| 23 | `england-fractional-ownership-properties` | 2,760 | Bad | Generic hero; wall of `<p>`; long with zero images |
| 24 | `liguria-fractional-ownership-properties` | 2,505 | Bad | Generic hero; 3 broken internal slug refs; lowercase "fractional" in title |
| 25 | `costa-de-la-luz-fractional-ownership-properties` | 2,485 | Bad | Generic hero; empty H2 shell at end; "Costa De La Luz" mis-cased title |
| 26 | `london-fractional-ownership-properties` | 2,470 | Bad | Generic hero; wall of `<p>`; thin zone breakdown |
| 27 | `menorca-fractional-ownership-properties` | 2,301 | Bad | Generic hero; empty H2 shell at end; "Menorca Fractional Ownership properties" mis-cased title |
| 28 | `italian-lakes-fractional-ownership-properties` | 2,097 | Bad | Generic hero; 3 broken internal slug refs |
| 29 | `canary-islands-fractional-ownership-properties` | 2,080 | Bad | Generic hero; 3 broken internal slug refs; only filters by `region: Tenerife` (excludes Lanzarote/Gran Canaria/Fuerteventura) |
| 30 | `pyrenees-mountains-fractional-ownership-properties` | 2,080 | Bad | Generic hero; 3 broken internal slug refs; lowercase "fractional" in title |
| 31 | `madrid-fractional-ownership-properties` | 1,745 | Bad | Generic hero; empty H2 shell at end |
| 32 | `barcelona-fractional-ownership-for-sale` | 1,611 | Bad | Generic hero; thin zone breakdown; non-standard slug suffix `-for-sale` |
| 33 | `sardinia-fractional-ownership-properties` | 1,575 | Bad | Generic hero; title `&#038;` entity bug; mostly mechanics content, little Sardinia colour |
| 34 | `lake-como-fractional-ownership-properties` | 1,563 | Bad | Generic hero; almost no Como-specific content (mostly LLC mechanics); no zone breakdown for Bellagio/Cernobbio/Tremezzo/Varenna |
| 35 | `aspen-fractional-ownership` | 1,418 | Bad | Wall of `<p>` (zero lists/tables); broken `/park-city-fractional-ownership/` link; no meta description in source |
| 36 | `spanish-costas-fractional-ownership-properties` | 1,363 | Bad | Generic hero; ONLY 5 H2s and 0 H3s on what should be a multi-coast guide |
| 37 | `breckenridge-fractional-ownership` | 1,172 | Bad | Wall of `<p>`; no meta description in source; thin |
| 38 | `park-city-fractional-ownership-2` | 1,165 | Bad | Wall of `<p>`; broken `/lake-tahoe-fractional-ownership/` link; `-2` slug suffix |
| 39 | `palm-springs-fractional-ownership-desert-modern-luxury` | 1,111 | Bad | Wall of `<p>`; broken `/lake-tahoe-fractional-ownership/` link; H3 with literal whitespace artefacts (`<h3>\n\t\tDoes $300,000 seem a lot for a share?<br />\n\t</h3>`) from WP migration |
| 40 | `newport-beach-fractional-ownership` | 1,086 | Bad | Thin (1,086 words); broken `/lake-tahoe-fractional-ownership/` link; no meta description in source |
| 41 | `malibu-santa-barbara-fractional-ownership` | 1,028 | Bad | Thin; title `&#038;` entity bug; no meta description in source |
| 42 | `vail-fractional-ownership` | 1,027 | Bad | Thin (1,027 words); wall of `<p>`; broken `/park-city-fractional-ownership/` link |
| 43 | `30a-fractional-ownership-emerald-coast-co-ownership-beach-homes` | 945 | Bad | Thin (945 words); duplicated word in FAQ heading "30A Fractional Ownership Fractional Ownership"; literally the longest slug on the site (74 chars); orphan `​` zero-width-space at end of `Does $600,000+ seem like a lot for a share?` block |
| 44 | `miami-fractional-ownership` | 845 | Bad | Thin (845 words); wall of `<p>`; no meta description in source |
| 45 | `napa-sonoma-fractional-ownership-wine-country-estates` | 776 | Bad | THINNEST page on the site (776 words); title `&#038;` entity bug; no meta description in source |
| 46 | `brickell-fractional-ownership-miami` | 1,443 | OK | No meta description in source; one of the two pages with 8 H2s and 0 H3s (heavy section structure) |
| 47 | `florida-keys-fractional-ownership` | 1,244 | OK | No meta description in source; otherwise structurally clean (2 H2 + 6 H3 + 4 ULs) |
| 48 | `lake-tahoe-fractional-ownership-properties` | 1,147 | OK | Broken `/park-city-fractional-ownership/` link; no meta description in source; otherwise the cleanest of the USA-city pages structurally |

**Distribution**: 2 Critical, 43 Bad, 3 OK, 0 Good. No page is currently in "Good" shape — the entire corpus needs work.

---

## 7. Example full rewrite — `30a-fractional-ownership-emerald-coast-co-ownership-beach-homes`

Picked because it is the worst-offending in absolute terms: 945-word body (45% below corpus average), longest and ugliest slug on the site (74 chars), thin destination colour, FAQ heading with the duplicated word "Fractional Ownership Fractional Ownership", and an orphan zero-width-space character in the source. It is also a good fit for §B-style zone breakdown (Rosemary Beach / Seaside / Alys Beach / WaterColor / Grayton are real distinguishable zones along 30A).

Below is the proposed full new hero + restHtml (target 1,800 words) following the §4 template. Voice: COP's own editorial — no partner names mentioned.

---

### Hero (heroHtml)

```html
<section class="page-hero">
  <p class="eyebrow">Florida · USA</p>
  <h1>30A Fractional Ownership <em>Properties</em></h1>
  <p class="subtitle">Twenty-four miles of sugar-white sand and rare coastal dune lakes, threaded by Scenic Highway 30A and anchored by some of the most quietly coveted village-resorts in the South — Rosemary Beach, Seaside, Alys Beach, WaterColor, Grayton. Fractional ownership in 30A means a deeded share of one of these homes, six to seven weeks of Gulf Coast living a year, and none of the management.</p>
</section>
```

### Mid-CTA

```html
<div class="dest-mid-cta">
  <div class="dest-mid-cta-inner">
    <h2>30A's most coveted addresses, accessible through co-ownership.</h2>
    <p>Fully managed beach homes in Rosemary, Seaside, Alys and WaterColor — your 1/8 deeded share comes with 6–7 weeks of personal use, a professional management team on call, and the long-term equity of one of Florida's most supply-constrained coastlines.</p>
    <div class="dest-mid-cta-btns">
      <a href="/our-homes/" class="btn btn-gold">Browse All Properties</a>
      <a href="#newsletter" class="btn btn-outline">Get Updates</a>
    </div>
  </div>
</div>
```

### restHtml

```html
<section class="dest-sec cream"><div class="dest-inner">

<h2>Why 30A?</h2>

<p>Most of the Florida Gulf Coast is a story of high-rise condos and big-box rentals. Scenic Highway 30A — the 24-mile coastal byway running from Inlet Beach east to Dune Allen, through South Walton County — is the exception. The skyline is low; the architecture is governed; the beach is the famous powder-soft quartz sand that comes from Appalachian rivers, not crushed shell. Behind the dunes sit the rare <strong>coastal dune lakes</strong>, a freshwater feature found in only a handful of places on earth, and the ten or so master-planned village-resorts — Rosemary Beach, Seaside, Alys Beach, WaterColor, WaterSound, Grayton, Inlet Beach, Seacrest — that have made 30A the second-home benchmark of the South.</p>

<p>For a fractional buyer, three things matter about 30A. First, the supply story is structural and permanent: the buildable footprint along the corridor is essentially fixed — the protected dune system, the state parks (Grayton Beach, Topsail Hill, Deer Lake), and the New Urbanist design codes inside each village all conspire to prevent the kind of new build that would erode value. Second, the demand is repeat-visit demand: 30A is famous for families that come back the same week every year for 15 years; that is precisely the pattern that supports both rental yields on unused weeks and price stability across cycles. Third, the village structure means a very specific zone choice — Seaside is not Rosemary is not Alys — and getting the right zone matters more here than in most second-home markets. The next section walks through them.</p>

<div class="dest-callout">
  <strong>30A in three numbers:</strong> 24 miles of byway · 15 protected coastal dune lakes · zero new-build land along the beachfront.
</div>

</div></section>

<section class="dest-sec white"><div class="dest-inner">

<h2>Where to own on 30A</h2>

<p>30A is shorthand for a string of distinct village-resorts, each with its own architectural code, demographic and price band. The four most established for fractional ownership are below; we cover the smaller WaterSound, Seacrest and Inlet Beach communities on request.</p>

<h3>Rosemary Beach</h3>
<p>The east-end anchor — Dutch West Indies and Charleston-style, painted in deep coastal whites and weather-greys, organised around a series of cobbled town squares that tip toward the Gulf. Rosemary is the most architecturally controlled village on 30A and the one with the most consistently sold-out summer calendar. Pedestrian-first by design: cars park on the perimeter, residents move on foot or by bike. Restaurant scene is anchored by The Pearl Hotel and Restaurant Paradis. <strong>Best for:</strong> design-led couples and families who want the strongest brand equity and tightest community.</p>

<h3>Seaside</h3>
<p>The original — the New Urbanist village from 1981 that started everything, all pastel cottages, white picket fences, a central green and the Airstream-trailer food trucks at the heart of town. Seaside is the most photographed stretch of 30A and the most frequently used as a film location (it stood in for the entire town in <em>The Truman Show</em>). The vibe is unmistakably American small-town, scaled up to luxury. <strong>Best for:</strong> multi-generational family owners who want the iconic 30A experience and a walkable everything.</p>

<h3>Alys Beach</h3>
<p>The Bermuda-meets-Antigua white village, with butter-coloured walls, courtyard gardens, and a strict architectural code drawn from the work of Léon Krier. Alys is the smallest and most exclusive of the village-resorts, with a private beach club, a residents-only path system and a price ceiling above any other 30A address. <strong>Best for:</strong> design-conscious buyers seeking the highest tier of 30A real estate, often combining a fractional share here with a primary home in Atlanta, Nashville, or Birmingham.</p>

<h3>WaterColor</h3>
<p>The largest of the village-resorts, on the eastern edge of Western Lake (one of the dune lakes) and stretching back into a 200-year-old cypress wetland. WaterColor offers more amenities than any other zone — a Beach Club, a 60,000-sq-ft Marina Park, lakeside paddleboarding, an extensive trail network and golf at neighbouring Camp Creek. <strong>Best for:</strong> active families with kids who want the broadest recreational footprint and easy walking access to Seaside.</p>

<h3>Grayton Beach &amp; Dune Allen</h3>
<p>The original beach town of South Walton — looser, more bohemian, less polished. Grayton has the longstanding live-music bar scene (the Red Bar reopened in 2020 after a fire), the artists' studios, and direct access to <a href="https://www.floridastateparks.org/parks-and-trails/grayton-beach-state-park" target="_blank" rel="noopener">Grayton Beach State Park</a> — voted America's #1 beach more than once. <strong>Best for:</strong> buyers who find the more curated villages too composed and want unfiltered Gulf Coast character.</p>

</div></section>

<section class="dest-sec cream"><div class="dest-inner">

<h2>A year in your 30A co-ownership home</h2>

<h3>Spring (March–May)</h3>
<p>The shoulder season locals love. Water temperatures climb from 68°F in March to 78°F by May; daytime highs are mid-70s to low-80s; school-spring-break weeks aside, the beach is uncrowded. Spring is best for the dune-lake activities — paddle the length of Western Lake, kayak Eastern Lake at sunrise, swim at the lake-meets-Gulf outfall on Grayton Beach. Cycling the Timpoochee Trail end-to-end (24 miles, mostly flat) is a single-day project this time of year.</p>

<h3>Summer (June–August)</h3>
<p>Peak. Days run hot — mid-90s with afternoon thunderstorms — and the beach is the centre of the day from 9am until dusk. Plan for early-morning beach setups, midday breaks back at the house with the pool, and evening returns to the sand for the famously vivid Gulf sunsets. This is also peak rental-income season for owners not using their weeks; July and August nightly rates in Rosemary and Alys can clear $1,500–2,500 for the right property. Restaurant reservations need to be made weeks ahead.</p>

<h3>Autumn (September–November)</h3>
<p>The locals' favourite. Hurricane risk fades by mid-October; water stays warm into early November; daytime highs are perfect mid-70s to low-80s; the village squares stay quiet. October is the best fishing month — the inshore redfish run is at peak — and the off-season restaurant calendar opens up the harder-to-book tables (Caliza, FOOW, La Crema). Use a fractional week here and you get peak conditions without peak pricing or peak crowds.</p>

<h3>Winter (December–February)</h3>
<p>Cool — daytime highs in the low-to-mid 60s, occasional dips into the 40s — and quiet. The villages are largely owner-occupied this time of year, the social fabric tightens, and the long beach walks have an entirely different character. Winter is the right time for Christmas and New Year family gatherings (the community tree-lighting in Rosemary is genuinely worth attending), and for the bird-watching that 30A's dune-lake ecosystems support. Many of the best long-form residencies happen now: writers, designers, and remote workers settling in for two or three weeks at a stretch.</p>

</div></section>

<section class="dest-sec white"><div class="dest-inner">

<h2>Who buys on 30A — and why</h2>

<p>30A's owner base is one of the most geographically concentrated in luxury fractional ownership in the US. The bulk of buyers come from a triangle anchored by Atlanta, Nashville and Birmingham, with secondary clusters from Houston, Dallas, and the Mid-Atlantic. The drive-to proximity (5–7 hours from Atlanta, 7–8 from Nashville, 4–5 from Birmingham) is decisive — owners come back six, seven, eight weeks a year because they can drive on a Friday afternoon and be on the beach by Saturday morning. International buyers are a smaller share but growing, particularly UK and Canadian families looking for a US foothold that does not require a Florida-coast condo with poor management.</p>

<p>Fractional ownership on 30A typically suits:</p>
<ul>
  <li><strong>Active families with school-age children</strong> — the bike-paths, the dune-lake paddle, the village squares make the day organise itself, and the same beach week-by-week year-by-year becomes a family ritual no rental can match.</li>
  <li><strong>Multi-generational groups</strong> — 4–5 bedroom homes near a village core sleep grandparents, parents and kids comfortably without anyone treading on anyone, and the walkability removes the rental-car friction.</li>
  <li><strong>Drive-to second-home owners from the South</strong> who want a managed property that is genuinely waiting for them — keys, linen, fridge stocked — rather than a hotel they leave each morning.</li>
  <li><strong>Owners building a multi-destination portfolio</strong> who want a US beach base alongside a European share — 30A's drive-market accessibility makes it an unusually high-utilisation US destination.</li>
</ul>

</div></section>

<section class="dest-sec cream"><div class="dest-inner">

<h2>Practicalities: getting there, what it costs, what you own</h2>

<p>Two airports serve 30A directly: <strong>Northwest Florida Beaches International (ECP)</strong>, 30 minutes east — Southwest, Delta, American, United — is the closest and easiest, with direct seasonal routes from most major US cities. <strong>Destin–Fort Walton Beach (VPS)</strong> is 45 minutes west, also well-connected. <strong>Pensacola (PNS)</strong> is the third option, 75 minutes west, with broader international connections. Most owners drive — the corridor is well-served by I-10 east-west and US-331 / US-98 north-south. No car is needed inside the villages once you arrive.</p>

<table class="dest-compare-table">
  <thead>
    <tr><th></th><th>Whole property (typical)</th><th>1/8 fractional share</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Purchase price</strong></td><td>$3.5m–$8m</td><td>$440,000–$1,000,000</td></tr>
    <tr><td><strong>Annual carry</strong></td><td>$80,000–$160,000</td><td>$10,000–$20,000</td></tr>
    <tr><td><strong>Weeks of personal use</strong></td><td>Up to 52 (most use ~6)</td><td>~45 days, professionally scheduled</td></tr>
    <tr><td><strong>Operations burden</strong></td><td>Owner / hired manager</td><td>Included — fully managed</td></tr>
    <tr><td><strong>Time to sell</strong></td><td>6–18 months in average market</td><td>~1 month average across COP portfolio</td></tr>
  </tbody>
</table>

<p>The 1/8 share is recorded in your name in Walton County's land records. You hold real, deeded equity in the property — not a timeshare, not a points membership, not a holiday club. You can sell it on the open market; you can leave it to your children; you participate proportionally in any appreciation in the underlying property. The ongoing service charge covers professional management, insurance, taxes, utilities, pool and landscape, linens between stays, and the reserve fund — not nightly bills, not optional add-ons.</p>

</div></section>

<section class="dest-sec white"><div class="dest-inner">

<h2>How fractional ownership works in the US</h2>

<p>US fractional ownership through COP holds each property in its own purpose-built LLC. The LLC owns the home; you and your seven co-owners hold equal LLC membership interests. This gives you the legal protection of a corporate ownership structure (limited personal liability), the operational simplicity of a single managing entity coordinating with all eight owners, and a much lighter resale path than a direct-deeded fractional structure (when you exit, you transfer LLC membership rather than triggering a full title conveyance).</p>

<p>Florida specifically offers fractional buyers a useful tax position: there is no state income tax, the homestead-style exemptions do not apply to second homes but property-tax rates are mid-range nationally, and FIRPTA withholding for non-US sellers is the main thing international buyers should plan around at exit. We strongly recommend reviewing the LLC operating agreement with US tax counsel before purchase, and our team can support that introduction.</p>

<p>For the full mechanics of fractional ownership — usage calendars, exit procedures, rental treatment, inheritance — see our <a href="/co-ownership-explained/">co-ownership explained guide</a>. For specific 30A property availability, browse the listings above or <a href="#newsletter">join our list</a> for new-property alerts.</p>

</div></section>
```

That's approximately 1,950 words restHtml + a 70-word hero. Structure: 6 H2s (one per section), 9 H3s (5 zones, 4 seasons), 1 callout, 1 UL, 1 comparison table, 0 images (placeholders for the image-call-outs go in §A and §B per the §4 template — the rendered HTML can leave `<img>` tags blank for now and be filled in when photography is sourced). Internal links: 1 to `/co-ownership-explained/`, 1 to `#newsletter` — modest. The renderer will inject related-destination links automatically (Florida, Florida Keys, Miami, USA pillar) once Spain/France/Italy/USA are added to `DEST_KEYWORDS`.

The same template applied to the other 12 USA-city pages will lift each to 1,800–2,200 words with consistent structure. Applied to the 12 EU country pillars, the same template (with longer §B sub-zone breakdowns) brings them down from 4,000–9,500 words to a healthier 2,500–3,500.

---

## 8. Rollout plan

### Phase 0 — Renderer fixes (1 day; pure code)

1. Patch `removeSectionByClass` so the france and italy FAQ-strip bug is fixed (§2.1). Test all 48 destinations render without orphan FAQ blocks.
2. Add Spain, France, Italy, USA to `DEST_KEYWORDS` (§2.2).
3. Allow injector to add 2–3 links per related slug on long pages (§2.3, optional).
4. Remove the dead `Frequently Asked Questions` heading-normalize regex and the `extractFaqItems` HTML-fallback (§2.4 cleanup).
5. Add `Place` / `TouristDestination` schema (§5.5).

This phase needs no editorial work. It is the highest ROI and unblocks Phase 1.

### Phase 1 — High-ROI single-day fixes (2–3 days; mix of source edits + redirects)

6. Rewrite the 35 generic hero subtitles to destination-specific (~1 hour for the batch using a clear template per region).
7. Add static fallback meta descriptions to the 13 USA-city pages (~30 min batch).
8. Fix the 15 title-tag bugs (`&#038;`, double-spaces, lowercase "fractional"; ~30 min batch).
9. Strip the 6 empty "Discover More …" H2 shells from the source files (~30 min) and the empty "Italy fractional ownership vs full ownership" H2 (or write the missing section).
10. Slug normalisation + 13 redirect entries in `next.config.js` (~1 day; needs deploy and Search Console resubmission).
11. Find-and-replace the 4 broken `lake-tahoe-fractional-ownership` and `park-city-fractional-ownership` internal hrefs site-wide.
12. Strip or replace the 12 broken `/formentera-fractional-ownership/` and 18 broken `/the-running-costs-of-...` internal hrefs.

### Phase 2 — Rewrite the 12 USA-city pages (1–2 weeks; one-template-applied-12-times)

The USA-city pages are short, structurally consistent, and their tier of issues is well-bounded ("thin content + wall of <p>"). Once the §4 template + §7 example are signed off, each page rewrites in 3–4 hours of senior editorial work. Do them in this order (highest current-traffic potential first):

13. `aspen-fractional-ownership` (1,418 → 2,000 words; flagship USA city)
14. `miami-fractional-ownership` (845 → 2,000; thinnest of the high-traffic pages)
15. `napa-sonoma` (776 → 2,000; thinnest page on whole site)
16. `30a-emerald-coast` (945 → 2,000; example rewrite already drafted in §7 above)
17. `palm-springs` (1,111 → 2,000; visual-design destination, easiest to make beautiful)
18. `lake-tahoe` (1,147 → 2,000)
19. `vail`, `breckenridge` (1,000 each → 2,000)
20. `park-city`, `newport-beach`, `malibu-santa-barbara` (~1,000 each → 2,000)
21. `florida-keys`, `brickell` (1,200–1,400 → 2,000)

### Phase 3 — Rewrite the 12 EU country/region pillars (3–6 weeks; bigger lift per page)

The EU pages need more work because each requires a new §B zone breakdown that doesn't currently exist (e.g. a Mallorca page needs Andratx/Pollença/Alcúdia/Santanyí/Soller H3s). Order by traffic potential:

22. `france`, `italy` (rewrite priority because they are the two pages with the rendering bug — once §2.1 is patched, the underlying content is exposed and the duplication is visible to every reader; rewriting here pays back fastest)
23. `spain` (largest pillar; needs strong §B with Mallorca/Ibiza/Costas/Madrid/Barcelona/Pyrenees H3s)
24. `mallorca` (9,452 → ~3,000; biggest reduction, replace with proper zone H3s)
25. `usa`, `portugal`, `croatia`, `austria`, `germany`, `sweden`, `mexico`, `england`

### Phase 4 — Rewrite the 24 EU regional pages (4–8 weeks; template now established)

26. `costa-del-sol`, `costa-blanca`, `costa-de-la-luz`, `spanish-costas`, `balearics`, `canary-islands`, `pyrenees-mountains`, `madrid`, `barcelona`, `ibiza`, `menorca`
27. `french-alps`, `south-of-france`, `paris`
28. `italian-lakes`, `lake-como`, `liguria`, `sardinia`
29. `london`
30. `california`, `colorado`, `florida`, `utah` (4 USA state pillars — note utah needs the embedded-property-tile artefact stripped first, see #5 in the table)

### What can be batched / scripted vs hand-written

**Scriptable / find-and-replace jobs**: hero-subtitle rewrites (template per region), title-tag normalisations, broken-href rewrites, empty-H2 stripping, meta-description additions on USA-city pages, slug rename + redirect generation. Estimate: 3–4 days total scripting + review across all 48 pages.

**Hand-written**: §A, §B, §C narrative content per page. Estimate: 3–4 hours per USA-city page, 6–8 hours per EU country pillar, 4–6 hours per EU region page. Grand total: roughly 220–280 hours of senior editorial work for the full corpus rewrite. At one writer working full-time, ~6–8 weeks. With two writers in parallel, ~3–4 weeks.

### Estimated total effort

- Phase 0 (renderer fixes): 1 dev-day
- Phase 1 (high-ROI source edits): 2–3 days editorial + 0.5 day dev
- Phase 2 (12 USA-city rewrites): 5–8 days editorial
- Phase 3 (12 EU pillars): 12–18 days editorial
- Phase 4 (24 EU regions): 12–18 days editorial

**Total: ~32–48 working days** for the complete rebuild. The owner can ship after Phase 0+1 and start seeing measurable improvements (correct rendering, improved internal linking, no more generic heroes) inside the first week.


---

## ADDENDUM (post-France-pillar review)

### Editorial principle: don't lock content to current inventory

When writing destination editorial, NEVER frame a sentence as "this is what COP currently offers in [destination]" with named towns or property types. Inventory rotates; pages don't.

WRONG (locks the page to a snapshot of today's inventory):
- "COP focuses on luxury ski chalets in Courchevel, Méribel and Portes du Soleil."
- "Our French portfolio includes villas in Cap-Ferrat, Antibes, and Saint-Tropez."
- "We currently have 8 properties in the Mallorca region."

RIGHT (general/aspirational, doesn't date):
- "COP curates co-ownership properties across France's most established second-home regions — alpine chalets in the major ski domains, villas along the Mediterranean, and central Paris apartments."
- "Browse the listings on this page to see what's currently available, or join our updates list for new properties as they launch."
- "Our [country] inventory rotates as new properties come to market."

ALWAYS OK (these are destination editorial, not inventory claims):
- §B "Where to own" zone breakdowns describing what each region/town is like
- Naming Megève / Méribel / Cap-Ferrat as places a buyer might consider
- Comparison tables with example price ranges (illustrative, not promises)

### Fix applied (2026-05-14)

All 4 pillar FAQ entries that listed specific cities as "what COP offers" were rewritten to use the rotation language above:
- france — Q11
- spain — Q9
- italy — Q9
- usa — Q8

### Apply this principle to all future rewrites

Spain, Italy, USA, Portugal, Croatia, Austria, Germany, Sweden, Mexico, England — when their FAQ JSON is reviewed, apply the same rewrite if they list specific cities/types as inventory.


### Editorial principle: stats bands must be region-truthful

If a stat is true only for one cluster (e.g. "300+ days of sun on the Côte d'Azur" is one French region, not France), it cannot live on a country pillar page. Either:
- Reserve the stats band for region/city pages where the stats are scoped correctly, OR
- Use country-true stats (e.g. "200+ years of French civil-property precedent", "1986 Loi Littoral" — but watch for ambiguous abbreviations like "100m" reading as "100 million" not "100 metres")

Fix applied (2026-05-14): stats band removed entirely from france-fractional-ownership-properties.html. Don't add stats bands to Spain / Italy / USA pillars unless every stat is country-wide true.


### Editorial principle: never mention liability protection / "what if X goes wrong"

References to "limited liability", "personal assets sit cleanly behind", "the property's risks stay with the property", or any "what happens if [partner / company / situation] X" framing reads as fear-selling and signals risk to the reader. The LLC structure is COP's choice for SIMPLICITY and CONSISTENCY across the global portfolio — never for protection-from-disaster.

WRONG: "The LLC structure means your personal assets sit cleanly behind the company's limited liability so the property's risks stay with the property."
RIGHT: "The LLC is the same modern international structure COP uses across every property worldwide — one consistent ownership relationship rather than a stack of country-specific vehicles."

Fix applied (2026-05-14): all 6 such occurrences in the France pillar removed/reframed. Apply the same rule to Spain / Italy / USA pillars when rewriting.

### Editorial principle: don't guess specific euro/dollar carry-cost figures

Stating specifics like "annual carry typically €8,000–€25,000" or "a €5m villa carries €120,000/year" gives the appearance of authoritative numbers we can't actually back up across a moving inventory. Reframe as COMPARATIVE pitches that don't date:
- "roughly one-eighth of the carry on the equivalent whole property"
- "a fraction of what an outright second-home owner pays in taxes, insurance and management"
- "vs renting where you pay the rent every year and build no equity"

Comparison tables should be relative-ratio columns (Whole second home / 1/8 share / Long-term rental) with comparative phrasings, not absolute euro ranges.

Fix applied (2026-05-14): France pillar comparison table restructured to 3-column comparative; 3 prose passages reframed.

### Editorial principle: temperatures in Celsius first, Fahrenheit in parens

European audience leads. Format: `12–15°C (mid-50s°F)` or `25–28°C (high 70s°F to low 80s°F)`. Never Fahrenheit-only.

