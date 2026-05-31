# Co-Ownership Property — AI Search Visibility Audit

*Audit run: 2026-05-26. Scope: `/Users/didiolsson/code/cop-next` source tree + live site at `https://co-ownership-property.com/`.*

---

## Executive summary

- **The site is actively returning HTTP 403 to GPTBot, ClaudeBot, PerplexityBot, CCBot, OAI-SearchBot, Bytespider, Amazonbot, FacebookBot, and DiffBot.** The bot regex in `middleware.js:5–14` matches the word `bot` case-insensitively in any unknown UA — Googlebot/Bingbot/Applebot/Twitterbot are explicitly allow-listed but **no AI crawler is**. This single fix is the highest-leverage AI-visibility lever on the site.
- **No `llms.txt`, `llms-full.txt`, or `ai.txt` exists.** `public/robots.txt` is three lines, allows everything by default for compliant crawlers, and points to the sitemap — but does nothing to actively invite or guide AI agents.
- **`sitemap.xml` is strong** — 2,066 URLs, hreflang reciprocal across en/es/fr/de for property + destination + blog, generated server-side from Supabase + filesystem at `pages/sitemap.xml.js`.
- **Schema.org coverage is uneven.** Destination pages have 8 distinct schema types (`RealEstateAgent`, `TouristDestination`, `FAQPage`, `Article`, `ItemList`, `BreadcrumbList`, `WebPage`, `Organization`). Property pages have only `RealEstateListing` + `BreadcrumbList`. **`how-it-works`, `our-homes`, `about-us`, `all-our-blog`, and both contact pages have zero schema.org markup** despite carrying the strongest authority content.
- **No `Person` schema anywhere** — David Olsson (20 years selling premium ski properties, ~40 Alpine resorts) and Dylan Olsson are not surfaced as named experts. Blog posts list `author: { @type: Organization }`, never a person. For an LLM trying to attribute the founder's expertise, the site is currently silent.
- **Content depth on destination pages is genuinely strong** — 49 of 54 EN pages are 5,000–13,000 words with consistent FAQ JSON-LD, internal-linking, TOC, and TouristDestination geo. The blog has **113 posts** with AI-attractive topical depth (cross-border tax, LLC structure, inheritance/CGT, exit strategies, market data).
- **Content gaps that LLMs love but COP doesn't have:** no glossary, no comparison pages (Pacaso vs Vivla vs Myne vs &Hamlet — the four partners whose stock the site sells), no calculators with structured output (the existing FinancingCalculator is JS-only, no JSON-LD `SoftwareApplication` or HowTo), no publicly available structured data feed (`/api/properties.json`), no partner-specific landing pages, no `Person` profiles for the team, no `Review`/`Testimonial` schema despite four named testimonials with photos on `/about-us`.
- **Open Graph + Twitter cards present everywhere checked**, canonicals correct, hreflang reciprocal — the conventional SEO hygiene is solid. The deficit is specifically in the **machine-readable depth + access-control layer** that determines whether ChatGPT/Perplexity/Claude can ingest, cite, and quote the site.

---

## 1. Technical AI-readability

### 1.1 robots.txt — bare-bones, no AI crawler controls

`public/robots.txt`:

```
User-agent: *
Allow: /

Sitemap: https://co-ownership-property.com/sitemap.xml
```

That is the entire file. No directives for `GPTBot`, `Google-Extended`, `ClaudeBot`, `PerplexityBot`, `CCBot`, `Applebot-Extended`, `OAI-SearchBot`, `ChatGPT-User`, `PerplexityUser`, `cohere-ai`, `Bytespider`, `Amazonbot`, `meta-externalagent`. Default `Allow: /` would let everything in — except that **the middleware overrides this**.

### 1.2 middleware.js — actively returning 403 to AI crawlers

This is the single biggest finding. `middleware.js:5–14` defines `BOT_PATTERNS` that match any UA containing the word `bot` (case-insensitive):

```js
const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
  /python-requests/i, /python\//i, /go-http/i, /java\//i,
  /libwww/i, /httpclient/i, /okhttp/i, /axios/i, /node-fetch/i, /node\.js/i,
  /headlesschrome/i, /phantomjs/i, /selenium/i, /puppeteer/i,
  /nmap/i, /masscan/i, /zgrab/i, /nuclei/i, /dirbuster/i, /nikto/i,
  /sqlmap/i, /hydra/i, /burpsuite/i, /semrush/i, /ahrefs/i, /majestic/i,
  /mj12bot/i, /dotbot/i, /blexbot/i, /yandex/i, /baidu/i,
];
```

`ALLOW_PATTERNS` then re-admits a small list (`/middleware.js:17–20`):

```js
const ALLOW_PATTERNS = [
  /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
  /whatsapp/i, /applebot/i,
];
```

**`GPTBot`, `ClaudeBot`, `PerplexityBot`, `CCBot`, `OAI-SearchBot`, `Bytespider`, `Amazonbot`, `FacebookBot`, and `DiffBot` all contain `bot` in their UA and are not in the allow list, so they get blackholed at the edge.** I verified live:

```
GPTBot/1.0 (+https://openai.com/gptbot)                              -> 403
ClaudeBot/1.0 (+claudebot@anthropic.com)                             -> 403
PerplexityBot/1.0 (+https://perplexity.ai/perplexitybot)             -> 403
CCBot/2.0 (https://commoncrawl.org/faq/)                             -> 403
OAI-SearchBot/1.0                                                    -> 403
Bytespider                                                           -> 403
Amazonbot                                                            -> 403
FacebookBot                                                          -> 403
DiffBot                                                              -> 403

# By contrast, these UAs slip through because they don't contain "bot":
anthropic-ai          -> 200
Google-Extended       -> 200
Applebot-Extended     -> 200
meta-externalagent    -> 200
cohere-ai             -> 200
ChatGPT-User/1.0      -> 200    (no "bot" suffix)
PerplexityUser/1.0    -> 200    (no "bot" suffix)
```

The asymmetry is accidental — `ChatGPT-User` (the live retrieval UA OpenAI uses when a user asks ChatGPT to fetch a page) gets through, but `GPTBot` (the index crawler that builds the model's static knowledge) gets a 403. The crawler is the one that feeds the model — meaning **COP is currently not in OpenAI's, Anthropic's, Perplexity's, or Common Crawl's training corpora for any new content shipped under this middleware**.

Recommended fix (single PR):
1. Add `/gptbot/i, /chatgpt-user/i, /oai-searchbot/i, /claudebot/i, /claude-web/i, /anthropic-ai/i, /perplexitybot/i, /perplexity-user/i, /ccbot/i, /google-extended/i, /applebot-extended/i, /cohere-ai/i, /bytespider/i, /amazonbot/i, /meta-externalagent/i, /facebookbot/i` to `ALLOW_PATTERNS` in `middleware.js`.
2. Update `public/robots.txt` to explicitly enumerate these UAs with `Allow: /` (no `Disallow`), which both signals consent and is what these crawlers look for first.

### 1.3 llms.txt / llms-full.txt — missing

```
curl https://co-ownership-property.com/llms.txt        -> 404
curl https://co-ownership-property.com/llms-full.txt   -> 404
curl https://co-ownership-property.com/ai.txt          -> 404
```

`llms.txt` (https://llmstxt.org/) is becoming the de facto manifest for LLM ingestion — a short markdown index of the highest-value URLs on the site, in priority order, with one-line descriptions. It is **especially valuable for a marketplace site like COP** because the homepage is a video hero that says little of substance; the editorial value sits in `/spain-fractional-ownership-properties/`, `/buying-a-co-ownership-property-faqs/`, `/blog/the-llc-advantage-…/`, etc. An `llms.txt` would let Claude / ChatGPT prioritise those URLs over the homepage when answering "what is fractional ownership in Spain".

Recommended structure:
```
# Co-Ownership Property
> Independent marketplace for deeded fractional ownership of luxury second homes across Europe, the USA, and Mexico. 338 live properties from 5 partner operators (Pacaso, MYNE, Vivla, &Hamlet, Abitaro).

## What is fractional ownership
- /how-it-works/ : Plain-English explainer of the LLC structure, share size, and usage calendar
- /buying-a-co-ownership-property-faqs/ : 19 FAQ entries on legal structure, costs, mortgages, cooling-off
- /staying-in-my-co-ownership-property-faqs/ : ~15 FAQs on usage, scheduling, rental
- /ownership/ : LLC ownership + funding deep-dive

## Country pillar pages (5,000–13,000 words each)
- /spain-fractional-ownership-properties/ : Spain — IFI wealth-tax threshold, SCI structure, regions
- /france-fractional-ownership-properties/ : France — SCI structure, notaire fees, Brexit 90/180
- ...

## Editorial / tax & legal
- /blog/the-llc-advantage-how-co-ownership-property-structures-are-built-for-tax-efficient-wealth-planning-in-2026/
- /blog/inheritance-estate-planning-for-fractional-property-owners-the-complete-2026-guide/
- /blog/capital-gains-tax-on-fractional-property-a-complete-guide-for-co-owners-in-2026/
- /blog/cross-border-fractional-ownership-tax-legal-briefing-2026/
```

### 1.4 sitemap.xml — comprehensive

`pages/sitemap.xml.js` is one of the strongest parts of the codebase. Live size: 2,066 `<loc>` entries, 20,438 lines. It correctly emits:

- Locale-paired static pages (`/`, `/our-homes/`, `/how-it-works/`, `/about-us/`, `/contact/`, `/blog/`, two FAQ pages) with reciprocal `<xhtml:link rel="alternate" hreflang="…">` across en/es/fr/de.
- 54 EN destination pages + DE/ES/FR mirrors where they exist (49 DE, 21 ES, 21 FR — see `content/destinations/{de,es,fr}/*.html`).
- All 338 property pages with reciprocal hreflang across all four locales.
- 113 blog posts with hreflang.
- Pillar destinations get priority `0.9`, regions `0.8`, properties `0.7`, blog `0.6`.

Two minor improvements:
- The `.lastmod` for blog posts uses `p.date` which is the original publish date, not a true mtime. ChatGPT/Perplexity now use `<lastmod>` to decide what's worth re-crawling.
- The sitemap is plain XML — for a 2,000+ URL site it would be worth splitting into a sitemap index with sub-sitemaps per content type (`sitemap-properties.xml`, `sitemap-destinations.xml`, `sitemap-blog.xml`) so AI crawlers can selectively refresh.

### 1.5 Schema.org coverage — uneven and underutilised

Where it shines (`pages/[slug].js:662–788`, the EN destination renderer) emits **eight schemas per page**:

| Schema | Source | Notes |
|---|---|---|
| `BreadcrumbList` | `[slug].js:662–671` | Properly position-indexed |
| `WebPage` | `[slug].js:673–690` | With `publisher` Organization |
| `FAQPage` | `[slug].js:693–702` | Up to 8 Q&A pairs from `lib/destination-faqs.json` (1,924-line curated source) |
| `TouristDestination` | `[slug].js:707–718` | With geo coordinates averaged from matched properties — **good rare-schema choice** |
| `ItemList` | `[slug].js:722–735` | Wraps the property grid (up to 20) |
| `RealEstateAgent` | `[slug].js:739–758` | Excellent entity-grounding for COP itself |
| `Article` | `[slug].js:762–788` | Conditional on `restWordCount > 1500` |
| (Organization within WebPage publisher) | — | Logo URL points at `/wp-content/uploads/MAIN-LOGO-COP.svg` |

Property page (`pages/property/[slug].js:416–446`) emits only two:

```js
"@type": "RealEstateListing",      // name, description, image[], numberOfRooms,
                                   // floorSize (MTK), address, offers
"@type": "BreadcrumbList",          // Home → Our Homes → property
```

**Missing on property pages** (would each be a 5–10 line addition):
- `Product` with `aggregateRating` — even with no rating data yet, COP has 4 named testimonials on /about-us that map to multiple properties (La Plagne, Lake Tahoe, Mougins, Port d'Andratx). Linking those into property `Review` schema would surface in AI answers as quoted testimonials.
- `Accommodation` (subtype of Place) — Google's preferred type for vacation-rental-style listings. Has fields `petsAllowed`, `numberOfBedrooms`, `numberOfBathroomsTotal`, `amenityFeature[]`. The amenities arrays are already curated per property in Supabase (`amenities`, `amenities_es`, `amenities_fr`, `amenities_de`).
- `Offer.priceValidUntil` and `Offer.availability` (currently neither set, leaving Google guessing).
- `RealEstateListing.numberOfBathroomsTotal` (currently emitted as `numberOfRooms = beds` only).
- `RealEstateListing.geo` — `lat`/`lng` exist on every property record (used by the page's map UI) but are not surfaced as GeoCoordinates JSON-LD.
- `VacationRental` (Google's newest schema, recognised in `/m/vacation-rental` knowledge graph) would catch ChatGPT's holiday-rental answer patterns.

**Missing entirely from the site** (zero hits across `pages/`):
- `Person` schema for David and Dylan Olsson. `pages/about-us.js:78–104` has bios with photos, roles, and David's 20-year backstory but emits no JSON-LD. Without Person schema, AI engines have no anchor to attribute statements like "David Olsson, who has 20 years of Alpine sales experience, says …" — they will not generate that citation.
- `Organization.founder` link from the homepage Organization schema (`pages/index.js:298–307`) — currently only has `name`, `url`, `logo`, `description`, `contactPoint`, `sameAs`. Adding `"founder": { "@type": "Person", "name": "David Olsson", ... }` would join the entity graph.
- `FAQPage` on `/how-it-works/` — `pages/how-it-works.js` has zero schema. The whole page is one long Q-then-A pattern; a `FAQPage` here would be high-value because the page targets "what is co-ownership" — exactly the query type AI engines answer.
- `Service`/`Product` on `/our-homes/` (`pages/our-homes.js:546–552`) — zero schema despite being the master inventory page.
- `Blog`/`ItemList` on `/all-our-blog/` — also zero schema (`grep -n "@type" pages/all-our-blog.js` returns nothing).
- `Review` on testimonials — the four testimonials on `/about-us` (Astrid, Harry & Nicole, Mateo & Anne, Jan & Family) have name, location, photo, 5-star rating, and quote — every field `Review` schema needs, just no markup.

### 1.6 Open Graph / Twitter cards

Implemented consistently. Every public page checked has `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `twitter:card="summary_large_image"`. Property pages additionally pass per-property OG image. Two minor inconsistencies:

- `pages/how-it-works.js:21` sets `og:type: "website"` but the page is editorial — `"article"` would be a stronger signal.
- `pages/about-us.js:22` does not declare `og:image:width/height` (destination pages do, at `[slug].js:808–809`).
- `pages/contact-us.js` (the deprecated duplicate, now 301'd to `/contact/` via `next.config.js`) still lacks canonical/OG — harmless because it redirects but lives in the codebase.

### 1.7 Canonicals & hreflang

Canonical tags present on every public page. Property pages (`property/[slug].js:386–406`) emit canonical + four hreflang alternates + `x-default`. Destination pages (`pages/[slug].js:797–804`) dynamically emit hreflang only for locales whose mirror file exists (`content/destinations/{de,es,fr}/{slug}.html`) — clean, no false-positive alternates.

### 1.8 Core Web Vitals signals in code

`pages/_app.js:14–28` uses `next/font/google` with `display: swap` — good. `pages/index.js:313` uses `fetchPriority="high"` on the hero video — good. `next.config.js:12–24` has `images.remotePatterns` configured for Supabase Storage, Webflow CDN, `lh3.googleusercontent.com`, Storyblok, Unsplash, and Paris Property Group. The property page uses `<NextImage … fill quality={90}>` (`property/[slug].js:239–251`) — but `quality=90` is on every gallery image which is heavy. Two specific concerns:

- The press-bar on `/about-us` and `/how-it-works` uses raw `<img>` tags (`about-us.js:39–47`, `how-it-works.js:41–48`) for press logos — these are small but still bypass Next's optimiser. The press logos load on every page that uses the marquee.
- The same destination page can ship 20+ property cards each with a hero image — destination pages weigh ~1.3 MB raw HTML (verified on `/spain-fractional-ownership-properties/`). LLM crawlers typically have a 1–2 MB document budget per URL; some content at the bottom of long destination pages may be truncated before ingestion.

### 1.9 API surface — what's exposed publicly

`pages/api/` contents:

```
admin/                         (gated — see middleware.js bypass)
email-engine.js                (cron, no GET)
email-queue.js
enquiry.js                     (POST only)
gallery-enquiry.js             (POST only)
meta-catalogue.js              (GET — TSV for Meta product feed)
newsletter.js                  (POST only)
process-email-queue.js         (cron)
process-gallery-followups.js   (cron)
rates.js                       (GET — currency rates)
refresh-rates.js               (cron)
revalidate.js                  (POST, token-gated)
save-search.js                 (POST)
send-property-alerts.js        (cron)
track/                         (event tracking)
unlock-drive.js                (POST)
```

`/api/meta-catalogue` is the closest thing to a structured data feed — but it's TSV-formatted for Facebook product catalogue and not discoverable. Two specific opportunities:

- **`/api/properties.json` is missing** — a public JSON Feed (or Schema.org `DataFeed`) of all live properties would let AI engines ingest the inventory without scraping 338 HTML pages. The schema is already in Supabase; a 20-line endpoint that returns `{ properties: [...], generated: "2026-05-26T..." }` would be a one-day ship. Link it from `llms.txt` and the sitemap.
- **`/api/destinations.json`** — same logic for the 54 destination summaries + property counts. Pair with `llms.txt` and you've handed every AI engine the entity graph on a plate.

`middleware.js:42–46` correctly bypasses `/api/*` from the bot filter — `if (pathname.startsWith('/api/')) return NextResponse.next();` — so AI agents can already hit these endpoints. The missing piece is that the endpoints don't exist yet.

---

## 2. Content depth and citation-worthiness

### 2.1 Destination pages — strong but uneven

54 EN destination HTML files in `content/destinations/*.html`. Word counts (editorial body, excluding chrome and property grid):

| Sample slug | Words | H2 count | Notes |
|---|---:|---:|---|
| `spain-fractional-ownership-properties.html` | 12,211 | 9 | Pillar — IFI wealth tax, SCI structure, regions, year-in-the-life |
| `france-fractional-ownership-properties.html` | 11,135 | 9 | Pillar |
| `italy-fractional-ownership-properties.html` | 10,652 | 9 | Pillar |
| `croatia-fractional-ownership-properties.html` | 12,231 | 8 | Surprisingly deep for a non-tier-1 |
| `sweden-fractional-ownership-properties.html` | 13,375 | 9 | Largest |
| `mallorca-fractional-ownership-properties.html` | 10,824 | 9 | |
| `aspen-fractional-ownership.html` | 10,088 | 8 | |
| `portugal-fractional-ownership-properties.html` | 9,642 | 8 | |
| `london-fractional-ownership-properties.html` | 7,940 | 8 | |
| `menorca-fractional-ownership-properties.html` | 5,234 | 7 | Lighter; below the page corpus median |

The internal `audits/destinations-audit.md` (May 25 2026) confirms my read — **29 of 50 destination pages are below the team's own standard** (the strongest run 9,300–14,600 words with 9 H2s + ~19 H3s). The audit also documents two structural problems that affect AI ingestion specifically:

1. *"41 of 48 pages have zero `<ul>`, `<ol>`, `<table>`, `<img>`, or `<blockquote>` in the editorial body — pure walls of `<p>`."* AI engines disproportionately favour list-and-table content for citation (it maps cleanly to bullet-pointed answers). The Spain page has exactly one `<table>` and zero `<blockquote>` in the entire 12,211-word body.
2. *"35 pages share the identical 12-word hero subtitle"* — a duplication signal that LLMs use to deprioritise content (they fingerprint repeated prefixes and treat them as templated/low-information).

### 2.2 Destination FAQ data — outstanding

`lib/destination-faqs.json` is 1,924 lines of hand-curated Q&A — 8–12 questions per pillar destination, structured as `{ q, a }` with `<strong>` tagging on key terms (LLC, 1/8 share, ~45 days, supported resale process, etc.). This is the single most LLM-attractive asset on the site. Sample answer from `france-fractional-ownership-properties`:

> "Fractional co-ownership means buying a legally deeded share — typically 1/8 — of a luxury property alongside a small group of like-minded owners. In France, each property is held in a property-specific LLC registered in your name. You own real equity in a real asset… The supported resale process clears in around a month or less on average across the COP portfolio — well under the 6–24 months that whole-property resales typically take."

That's a perfectly formed AI-citation passage: factual, qualified ("on average across the COP portfolio"), with a concrete comparator. It's also already wired into `FAQPage` JSON-LD on every destination page that has FAQ data (`pages/[slug].js:693–702`).

### 2.3 Property pages — listing data only

Property pages render description, amenities, location, similar properties, and an enquiry form, but no editorial overlay. Description text is curated per partner (Pacaso, MYNE, Vivla, &Hamlet, Abitaro) and stripped of partner brand names per `CLAUDE.md` rules. There is no "Why this property is interesting" editorial, no "Similar to X but cheaper" comparator, no "What you'd pay whole-ownership vs 1/8 share" calculator output — all of which would make property pages individually citable.

The `FinancingCalculator` component (`components/FinancingCalculator.js`) does run a client-side mortgage estimate, but it is JS-only — no JSON-LD `SoftwareApplication` schema, no `HowTo` markup, no static rendered example calculation in the HTML. An LLM crawling the page never sees the calculator's output.

### 2.4 Blog — 113 posts, AI-friendly topical depth

`lib/posts.json` is 1,244 lines, 113 entries. Topics include:

- Cross-border fractional ownership tax & legal briefing 2026
- Capital gains tax on fractional property: complete guide
- Inheritance & estate planning for fractional property owners
- The LLC advantage: tax-efficient wealth planning
- Cross-border fractional ownership: tax & legal briefing
- Co-ownership owner survey 2026 (247 buyers, year one) — **the only piece of original survey data on the site**
- $87 Billion Holiday Home Boom (industry statistic claim)
- France SCI property structure for foreign buyers
- Spain 2030 energy law for green co-ownership
- Barcelona rental ban & co-ownership luxury property guide

These are exactly the long-tail informational queries ChatGPT/Perplexity surface in their answer engines. The schema on each blog post (`pages/blog/[slug].js`) emits:

```
@type: BlogPosting
@type: ImageObject
@type: Organization        (publisher AND author — see below)
@type: WebPage
```

**Author is always `{ @type: Organization, name: "Co-Ownership Property" }`** — never a Person. This breaks E-E-A-T attribution. For a post called "Capital Gains Tax on Fractional Property: A Complete Guide" the answer to "who said this" is "Co-Ownership Property" — a brand, not an expert. AI engines specifically downweight unsigned editorial when ranking citations against signed expert content.

### 2.5 Glossary, comparison pages, calculators, research — what's missing

| Asset type | Present? | Notes |
|---|---|---|
| Glossary / terminology page | No | Key terms (LLC, SCI, deeded share, bullet mortgage, IFI, notaire, taxe foncière, supported resale, fair-rotation calendar) are scattered across FAQs but never indexed as `DefinedTerm` / `DefinedTermSet`. |
| Pacaso vs alternatives comparison | No | Codebase mentions Pacaso/MYNE/Vivla/&Hamlet/Abitaro only as `partner` field; zero editorial pages comparing them, despite COP being the marketplace for all five. |
| Cost calculators (visible HTML output) | One component (`FinancingCalculator`), JS-only | No static example, no HowTo schema, no canonical URL for "co-ownership cost calculator". |
| Original research / datasets | One blog post (the 247-buyer survey) | Could be 5–10 — pricing by region, days-of-use distribution, resale timeline distribution, share-size mix. The data exists in Supabase but is never exposed. |
| FAQ pages | Two top-level + 1 inline per destination | `/buying-…-faqs/` (19 Q&A), `/staying-…-faqs/` (~15 Q&A), `lib/destination-faqs.json` (8–12 per destination). All with `FAQPage` JSON-LD where rendered. |
| "About"/authority | `/about-us/` | David's 20-year history is there in prose but not in `Person` schema. |
| Press mentions | Logo bar only | The Times, FT, Daily Mail, Forbes, Express, Business Insider, Luxury Travel, Rolling Stone — listed as image logos at `/about-us` and `/how-it-works`, no link-outs, no `CreativeWork.citation` schema. |
| Testimonials with structured data | No | Four named testimonials with photos + 5-star ratings on `/about-us:163–192`; zero `Review` schema. |

---

## 3. Content gaps that AI engines disproportionately reward

These are page types that consistently outrank in AI answer engines for the fractional-ownership niche but are absent from COP:

1. **Glossary at `/glossary/`** with one `DefinedTerm` per concept. Map every term used across the destination FAQs to a definition + 2–3 cross-links to where the term is used. Estimated 40–60 terms (LLC, SCI, deeded share, notaire, IFI, taxe foncière, share size, fair-rotation calendar, bullet mortgage, supported resale, golden visa, escritura, conveyancing, Schengen 90/180, beneficial ownership, etc.). Hand-write or generate from existing FAQ corpus.
2. **`/compare/` landing + per-partner pages** (`/compare/pacaso-vs-myne/`, `/compare/pacaso-vs-vivla/`, `/compare/fractional-vs-timeshare/`, `/compare/fractional-vs-fly-rent/`). These are query patterns AI engines specifically extract — and COP, as the only site selling stock from all five partners, is uniquely positioned to publish them objectively. Schema: `ComparisonTable` doesn't exist in schema.org but a structured `Article` with `<table>` markup + `mentions` array (linking each compared brand by their `Organization` URL on Wikidata/Crunchbase) gets the same effect.
3. **Calculator pages with rendered output** — `/calculator/total-cost-of-ownership/`, `/calculator/share-vs-whole-property/`, `/calculator/rental-income-offset/`. Each with a static example in the HTML (so crawlers see the numbers), a `SoftwareApplication` JSON-LD, plus a `HowTo` schema for the user instructions.
4. **Country-tax pages** — `/taxes/fractional-ownership-spain/`, `/taxes/fractional-ownership-france/`, `/taxes/fractional-ownership-italy/`, `/taxes/fractional-ownership-usa/`. The destination pages mention IFI/SCI/notaire in passing, but a dedicated `/taxes/spain/` page targets the literal query "fractional ownership taxes Spain" and lets the destination page link to it as a reference. Schema: `Article` + `FAQPage` + `mentions: [Country, GovernmentService]`.
5. **Exit-strategy / resale page** — `/resale/`, `/how-to-sell-your-co-ownership-share/`. The destination FAQs and a few blog posts mention this but there's no canonical resource page; AI answer-engines consistently cite the canonical resource over a passing mention in a destination page.
6. **Partner-specific landing pages** — `/partners/pacaso/`, `/partners/myne/`, `/partners/vivla/`, `/partners/andhamlet/`, `/partners/abitaro/`. The current site hides partner identity by design ("descriptions must never mention partner names" per `CLAUDE.md`). That's defensible UX but a missed AI opportunity — the queries "Is Pacaso legit", "MYNE Homes reviews", "Vivla vs alternatives" are high-volume and currently rank for the partner's own owned-and-operated site. COP can rank for these as the neutral marketplace if it owns the comparison.
7. **`Person` profile pages for David and Dylan** — `/team/david-olsson/`, `/team/dylan-olsson/` — with bio, expertise areas, prior publications, photo, contact, and `Person` JSON-LD with `knowsAbout: ["Fractional ownership", "French Alpine real estate", …]`. Then point the blog post `author` field at these URLs.
8. **`/research/` hub** with the 247-buyer survey as the anchor, plus quarterly market-data updates. Each item gets `Dataset` JSON-LD with `creator`, `temporalCoverage`, `keywords`. The Supabase property database itself could publish as a `Dataset` at `/api/properties.json` — making COP a citable primary source for fractional pricing.

### 3.1 Destination coverage gaps

54 EN destination pages but uneven by country:

- **Italy**: only 4 pages (italy, italian-lakes, lake-como, sardinia, liguria) — Tuscany, Amalfi Coast, Puglia, Sicily are missing entirely.
- **Portugal**: one page (portugal) — Algarve, Lisbon, Comporta missing.
- **Greece**: zero pages — Cyclades, Crete, Corfu missing.
- **Switzerland, Austria**: one page each — major ski destinations within them not broken out.
- **Croatia**: one page (excellent depth at 12,231 words but no per-island breakouts).

The DE/ES/FR mirror coverage is also uneven: DE has 49 mirrors, ES and FR have only 21 each. The Spanish pillar `/es/destinos/spain-fractional-ownership-properties/` exists, but most regional Spain pages do not exist in Spanish — which is the opposite of what you'd expect for a Spain-focused locale.

---

## 4. Brand / authority signals

### 4.1 E-E-A-T markers — present in prose, absent in markup

`/about-us/` (`pages/about-us.js`) is the only authority page. It has:

- Press bar (8 outlets: The Times, FT, Daily Mail, Forbes, Express, Business Insider, Luxury Travel, Rolling Stone) — `pages/about-us.js:38–58` — but no link-outs and no `mentions`/`citation` schema. The logos sit in an animated marquee.
- Team grid with David Olsson (Founder, 20 years selling premium ski properties, 40+ Alpine resorts), Dylan Olsson (Sales, raised between London and Marbella, Manchester business graduate), and Poppy the dog (Head of Security). Photos present, bios well-written, **no Person schema** — `grep -n 'Person\|founder' pages/about-us.js` returns nothing.
- Origin story with a David Olsson quote (`pages/about-us.js:120–123`):

```html
<blockquote>The clients I had worked with for years still wanted to buy — they just couldn't afford to anymore. They were simply priced out.
  <span className="quote-attr">David Olsson — Founder</span>
</blockquote>
```

That's a `Quotation` schema waiting to happen — would directly surface as a quotable founder statement in AI answers about why co-ownership emerged as a category.

- Testimonials with photo + name + location + 5-star rating + quote (`pages/about-us.js:163–192`): Astrid (Mougins, South of France), Harry & Nicole (La Plagne, French Alps), Mateo & Anne (Lake Tahoe, California), Jan & Family (Port d'Andratx, Mallorca). Zero `Review` schema — each testimonial is just visual HTML.

### 4.2 Original photography vs partner-supplied

Per `CLAUDE.md`, property photos come from each partner's own image hosts: Pacaso uses `lh3.googleusercontent.com` (Drive), MYNE uses Storyblok CDN, Vivla scrapes background-image URLs from their slider, And Hamlet from their Webflow CMS. The team also has some original photography on `/about-us` and the homepage hero video. AI engines don't index image rights, but they do index image alt text and surrounding HTML — and the property pages have generally short `alt=""` (mostly defaulting to `alt || ''` per `[slug].js:243`).

### 4.3 Contact / legal / company info

- `/privacy-policy/` and `/terms-and-conditions/` exist.
- `/contact/` lists `info@co-ownership-property.com` and a WhatsApp number (`+447901002763` per `pages/_app.js:120`).
- No registered company number, no VAT number, no physical address visible on the site. The footer (`components/Footer.js`) should be checked — quick grep:

```
grep -i "company.*registered\|VAT\|registered.*office" components/Footer.js   → no results
```

For an EU-facing real-estate platform, this is a legal and authority gap. AI engines specifically look for verifiable business identity for transactional-niche queries.

---

## 5. Internal linking + IA

### 5.1 Destination cross-linking — strong

`pages/[slug].js:430–474` (`injectInternalLinks`) auto-inserts inline links from one destination page's prose to related destinations. The `RELATED` map (`[slug].js:131–184`) is hand-curated per slug (Ibiza → Mallorca, Menorca, Balearics, Spain). `DEST_KEYWORDS` (`[slug].js:187–243`) defines the trigger words. There's a known limitation documented in `audits/destinations-audit.md` §2.2: the four highest-volume pillar slugs (Spain, France, Italy, USA) were missing from `DEST_KEYWORDS` but appear to have been patched in (line 191–194 show them present now).

The injector is rate-limited to one link per related slug per page (`linkedSlugs.has(slug)` short-circuit at `[slug].js:466`). For a 7,800-word France page, that's one inline link per related destination across the whole page. The internal audit recommends lifting this to 2–3 per page with spacing rules.

### 5.2 Pillar → cluster → property hierarchy

`PARENT` map (`[slug].js:86–128`) defines a clean two-level pillar/cluster hierarchy: USA → California → (no third level), Spain → Mallorca → (no third level). This generates `BreadcrumbList` JSON-LD with the right parent (`[slug].js:362–369`). Properties on destination pages link out to `/property/{slug}/` via `ItemList` schema and HTML.

### 5.3 Property → destination upward linking

Property pages link to similar properties in the same country (`property/[slug].js:191–198` — Supabase query for 3 siblings). They do **not** link upward to the destination pillar. A property in Mallorca should link "See all Mallorca fractional ownership properties" → `/mallorca-fractional-ownership-properties/`. Currently no such link exists in the property page template.

### 5.4 Blog ↔ destination linking

Blog posts are linked from destination pages only via the auto-injector if a destination keyword appears in the blog title — uncommon. There's no "Read more about Spain" block at the bottom of the Spain page pointing to the 8+ blog posts that mention Spain. AI engines use these as "see also" signals to widen citation candidates.

### 5.5 IA is graph-shaped, but flat at the surface

The structure is healthy: pillars (countries) → clusters (regions/cities) → properties, plus a parallel blog and FAQ axis. The header navigation (`components/Header.js`) was not deeply audited, but a quick check shows only flat top-level links (`/our-homes`, `/how-it-works`, `/about-us`, `/contact`, `/blog`) — no mega-menu surfacing the destination tree, which means anonymous crawlers rely entirely on `<a>` injections inside body text + the sitemap to discover the destination corpus. That works for Google but is weaker for LLM crawlers that read fewer pages per session.

---

## 6. Quick wins (cheap, high-leverage)

In rough order of leverage per hour of work:

1. **Unblock AI crawlers in `middleware.js`.** Add 15–20 patterns to `ALLOW_PATTERNS` (GPTBot, ClaudeBot, PerplexityBot, CCBot, OAI-SearchBot, Bytespider, Amazonbot, FacebookBot, Google-Extended, Applebot-Extended, anthropic-ai, ChatGPT-User, PerplexityUser, cohere-ai, meta-externalagent, DiffBot). ~10 lines. Single biggest visibility unlock on the site.
2. **Ship `public/llms.txt` + `public/llms-full.txt`.** ~200 lines each, hand-written. Index the 54 destination pages, 2 FAQ pages, top-20 blog posts, and the API endpoints (once they exist).
3. **Update `public/robots.txt`** with explicit `Allow: /` blocks for the same UA list, plus the `Sitemap:` line that's already there. ~30 lines.
4. **Add `Person` schema for David and Dylan on `/about-us/`** with `knowsAbout`, `worksFor`, `sameAs` (LinkedIn URLs), and embed a `Quotation` for the David quote.
5. **Change blog `author` from Organization to Person** in `pages/blog/[slug].js`. Add a `byline` field to the blog post Supabase table; default to David where unset.
6. **Add `FAQPage` schema to `/how-it-works/`** — restructure the existing prose into ~10 Q/A pairs that already exist in narrative form, emit JSON-LD.
7. **Add `Review` schema to the 4 testimonials on `/about-us/`** + rate them as `aggregateRating` on the Organization. ~20 lines.
8. **Add `Accommodation` + `geo` + `aggregateRating` (where available) schema on property pages** — extend `property/[slug].js:416–445` with the missing fields. The data is all in Supabase already.
9. **Link property pages upward to their destination pillar.** One `<a>` per property page pointing at `/{country-slug}-fractional-ownership-properties/`. Use the existing `PARENT` logic from `[slug].js`.
10. **Ship `/api/properties.json` and `/api/destinations.json`** — 50-line Next.js API routes that return the Supabase data as a JSON Feed. Link from `llms.txt` and `sitemap.xml`. Add `<script type="application/ld+json">` with `@type: DataFeed` on `/our-homes/`.
11. **Fix the `removeSectionByClass` renderer bug** documented in `audits/destinations-audit.md` §2.1 — it silently exposes 800+ words of orphan FAQ-block content on `france` and `italy`. Live FAQ JSON-LD currently contains both versions, which AI engines deduplicate but read as a quality signal against the page.
12. **Add `og:image:width/height` to `/about-us/` and `/how-it-works/`** so social previews render correctly.

---

## 7. Strategic gaps (bigger investments)

Roughly ranked by AI-citation impact ÷ effort:

1. **Glossary at `/glossary/`** with `DefinedTermSet` JSON-LD covering 40–60 terms. Use existing FAQ corpus as source material. ~2 weeks of editorial + 2 days of templating.
2. **`/research/` hub anchored by the 247-buyer survey**, with quarterly market-data updates pulled from Supabase. Each item gets `Dataset` schema. The data already exists; the surface doesn't.
3. **Comparison pages**: `/compare/fractional-vs-timeshare/`, `/compare/fractional-vs-fly-rent/`, `/compare/fractional-vs-second-home/`, `/compare/pacaso-vs-myne/`, `/compare/pacaso-vs-vivla/`. These are exactly the queries Perplexity surfaces in answer cards for high-intent niche-comparison searches.
4. **Country-tax pages** at `/taxes/{country}/` — pulling out and expanding what's currently buried in destination-page §6 "Practicalities".
5. **Partner landing pages** at `/partners/{slug}/` — neutral marketplace coverage of Pacaso/MYNE/Vivla/&Hamlet/Abitaro with structured data + comparison tables + a list of all COP-listed properties from each. Reverses the current "never mention partner name" rule for a small set of dedicated comparison surfaces.
6. **Calculator pages** with rendered HTML output (not just JS): `/calculator/total-cost-of-ownership/`, `/calculator/share-vs-whole/`. Each gets `SoftwareApplication` + `HowTo` schema. ~1 week of engineering per calculator.
7. **Translate the remaining 28 destination pages into ES and FR** to match the 49-page DE coverage. The audit at `docs/destination-pages-audit.md` already maps which pages are weak — fix those at the same time.
8. **`Person` profile pages** with full bibliographies for David and Dylan — anchor for blog post `author` fields, link to LinkedIn + any press citations via `sameAs`.
9. **Press citations as `CreativeWork`** — instead of just showing logos, link each press mention to a `/press/the-times-fractional-ownership-feature/` style internal landing page with the article excerpt, publication date, and outbound link. AI engines treat these as third-party authority signals.
10. **Split sitemap into a sitemap index** with sub-sitemaps per content type (`sitemap-properties.xml`, `sitemap-destinations.xml`, `sitemap-blog.xml`). Easier for crawlers to schedule selective re-crawls; gives the team per-type lastmod control.

---

## 8. Tally

**Quick wins (1–3 days of work, high leverage):** 12 specific items, dominated by the middleware AI-crawler unblock and a batch of schema additions on existing pages.

**Strategic gaps (multi-week investments):** 10 items, dominated by content production (glossary, comparison pages, tax pages, calculators) and authority-signal infrastructure (Person profiles, press citations, research hub).

**The single highest-impact change:** patch `middleware.js` to stop returning 403 to GPTBot, ClaudeBot, PerplexityBot, CCBot, and the rest of the named AI crawlers. Everything else compounds on top of that one fix being shipped first — schema, llms.txt, new pages — none of it matters if the crawlers are blackholed at the edge.

**The single highest-leverage authority signal currently missing:** `Person` schema for David Olsson, plus rewiring blog `author` from Organization to Person. The 20-years-of-Alpine-real-estate backstory is already written; it just isn't machine-readable.
