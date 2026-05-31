# Winning AI Search 2026–2028 — Master Strategy for co-ownership-property.com

**Author:** Strategy synthesis by Claude
**Date:** 26 May 2026
**Status:** Plan only — implementation paused for David's review

Three research streams underpin this doc:

- `research-output/ai-search-research.md` — how every major AI search engine retrieves and cites in 2026, and which AEO/GEO tactics have actual evidence behind them
- `research-output/site-audit.md` — full technical + content audit of co-ownership-property.com (COP) for AI visibility
- `research-output/baseline.md` — 26 query baseline of what AI engines currently surface in this niche, and where COP sits today

If you read nothing else, read **§0 The Bombshell** and **§5 The Action Plan**. Everything else exists to support those two sections.

---

## 0. The Bombshell

Three findings, each load-bearing on its own. Together they reframe the project from "do some AEO" to "occupy an arena that's currently empty."

### 0.1 We have been actively blocking the AI crawlers that build the model brains for the last year

`middleware.js:5–14` returns **HTTP 403** to GPTBot, ClaudeBot, PerplexityBot, CCBot, OAI-SearchBot, Bytespider, Amazonbot, FacebookBot, and DiffBot — anything with the word `bot` in the UA, unless it's on a small allow-list of Googlebot / Bingbot / Slurp / DuckDuckBot / Applebot / Twitterbot / LinkedInBot / WhatsApp / facebookexternalhit.

Verified live with curl. The asymmetry is accidental and unkind: `ChatGPT-User` and `PerplexityUser` (the live-fetch UAs triggered when a user asks the AI to read a specific URL) slip through because they don't contain "bot." But `GPTBot` and `PerplexityBot` (the indexing crawlers that build the model's static knowledge of the web) get blackholed at the edge.

Consequence: **every page COP has shipped since this middleware went live is invisible to OpenAI, Anthropic, Perplexity, and Common Crawl as training data.** Live retrieval still works when a specific user prompt forces a fetch, but the much larger flywheel — being baked into model weights as "the source for European fractional ownership" — has been off the entire time.

This is a 10-line code change. It is the single highest-leverage AI-visibility action on the entire roadmap and it must ship before any other tactic in this document.

### 0.2 Real estate has the lowest AI Overview trigger rate of any major US vertical (0.14%)

5WPR + Haute Residence's 2026 study and Haute Living's reporting on it put real-estate AIO triggering at 0.14% of queries versus health at 13%, finance at 4.2%, retail at 2.1%. 89.8% of brands in the Q1 2026 study were largely absent from AI search across eight measured platforms.

Read literally: the arena is empty. Real estate is the vertical where AI engines are slowest to generate answers, where there's the smallest field of brands already winning the citation race, and where the cost-to-dominance is structurally lowest. There is no Pacaso of AI search yet in luxury vacation real estate. There can be one in 12 months.

### 0.3 COP wins destinations, loses everything else — and the founder authority signal is empty

From the 26-query baseline:

- **Destination queries** ("fractional villa Mallorca", "co-ownership ski chalet France", "Ibiza", "Costa del Sol", "Portugal Algarve", "Spain", "Italy", "Portugal", "French Alps") — COP holds rank 1 and often 3–7 of the top 10 slots. This is the strongest single signal in the audit. Destination pages are working.
- **Top-of-funnel / educational queries** ("best fractional ownership companies 2026", "how does co-owning work", "fractional ownership vs timeshare", "Pacaso alternatives") — COP is not in the top 10 of a single one of these. Pacaso owns the educational layer. B2B aggregators (CB Insights, Inven, Product Hunt, Slashdot, Sourceforge) own the "alternatives" layer.
- **Comparison queries** ("MYNE vs Vivla", "Pacaso vs August", "fractional vs second home") — wide open. Nobody owns these. The few results are competitor-brand homepages, not editorial content.
- **Due-diligence queries** ("fractional ownership taxes Spain", "how to exit fractional ownership", "fractional ownership maintenance fees") — almost entirely owned by US-state law firm blogs, or — in the case of "maintenance fees" — by **jet/aircraft companies** (PlaneSense, AvBuyer, BlackJet) because nobody on the property side has authored the canonical resource yet.
- **Founder / author authority** — "Dylan Olsson co-ownership" and "David Olsson co-ownership" both return zero relevant results. The 20 years of Alpine experience, the named expertise, the bylined content — none of it is machine-readable. AI engines have nobody to attribute statements to.

So: COP already wins one third of the SERP it can win. It loses the other two thirds because the canonical educational, comparison, due-diligence, and authority pages don't exist yet at COP — and where they exist elsewhere on COP (the destination FAQ corpus, the 113-post blog), the bylines, the citations, the data publishing, and the comparison angles are absent.

---

## 1. How AI Search Engines Actually Work in 2026 — Strategic Implications Only

The full engine-by-engine fact sheet is in `ai-search-research.md` §1. Here's the load-bearing synthesis. Each engine pulls from a different index with different ranking signals, so a strategy that hits all of them must be deliberately multi-layered.

**The four "indices" that matter for COP:**

1. **Google's index** — feeds Google AI Overviews (~38% of citations are from Google's top-10 organic) and Google AI Mode (8–16+ sub-queries per question, Deep Search expands to hundreds). The Gemini App and Gemini Deep Research also lean on this index. AI Mode launched May 2025 and is what conversational Google looks like for the next decade.
2. **Bing's index** — feeds ChatGPT Search (which uses Bing as its retrieval backend) and Microsoft Copilot. ChatGPT also crawls independently via OAI-SearchBot. **Bing presence is the prerequisite for ChatGPT visibility** — verify in Bing Webmaster Tools.
3. **Perplexity's proprietary index** — built by PerplexityBot. If it hasn't crawled you, Perplexity cannot cite you. Three failure modes block citation more than anything else: blocked crawler, JS-rendered content, slow TTFB.
4. **Brave's independent 30B+ page index** — backend for Claude's web search and Brave's own AI summarizer (~10B queries/year). Largely uncontested by SEO teams. Two-surface optimization for one effort.

Apple's "World Knowledge Answers" launches Spring 2026 and is currently routing through ChatGPT for any Siri AI question. Grok adds X-firehose retrieval that nobody else has. DuckDuckGo and Arc/Dia are derivative — optimizing for the upstream models optimizes for them.

**The single most important mechanical fact: query fan-out.** When a user asks ChatGPT / Perplexity / Gemini "what's the best way to own a luxury home in Mallorca part-time?" the model decomposes that single prompt into 4–16+ sub-queries that run in parallel against the index. Each sub-query returns a candidate set of pages. The model then scores **passages** — usually 130–170 word self-contained chunks — for relevance and confidence, and stitches the surviving passages into the answer with citations.

So the right mental model is no longer "rank #1 for the keyword." It's **be a passage that survives the candidate set for at least one of the 16 sub-queries.** Whoever has the most pages with the cleanest self-contained passages on the most sub-queries wins the citation game.

This pushes content design hard. Long-form prose is harder to cite. Self-contained paragraphs with a clear question-then-answer structure, lists, tables, and comparison cells get lifted verbatim. The Princeton GEO paper (the only peer-reviewed work on this) found:

- Position-1 pages saw little improvement from optimization
- **Position-5 pages saw ~115% visibility lift from GEO optimization**
- Statistics added to content → +41% citation visibility
- Quotations from authoritative sources → significant gains
- Citations out to other sources → gains

Position-5 lift is the headline finding for COP. Most of COP's editorial content is sitting at positions 5–30 on Google, completely unoptimized for passage extraction. There's a 100% citation lift available across hundreds of pages from rewriting structure alone.

---

## 2. What Actually Drives AI Citations — Evidence-Graded

Most "GEO playbooks" online are theatre. The evidence-graded read from the full research doc:

**Tier A (strong evidence, multiple independent studies):**

- **Brand mention density on third-party authoritative sources** — the single strongest correlation with AI Overview inclusion (Ahrefs 75k-brand study). Brands earning both mention and citation signals show ~40% higher reappearance across answers. 90–95% of AI citations come from external sources. Earned media drives +239% median lift in citations.
- **Original data, statistics, and proprietary research** — the Princeton +41% finding. When an LLM needs a specific number, it must cite the primary source.
- **Reddit, Wikipedia, YouTube, Quora as the cited corpus** — top 15 domains capture ~68% of all citations across engines. Reddit alone is up to 46.7% of Perplexity citations (but only 0.1% of Gemini). YouTube transcripts now overtake Reddit in some categories.
- **Trustpilot / G2 / review-platform presence** — domains with reviews are 3–6× more likely to be cited.
- **Princeton GEO tactics** — statistics, quotations, citations.

**Tier B (consistent industry findings, not peer-reviewed):**

- FAQPage schema on explainer pages — particularly load-bearing for Perplexity and Gemini.
- Comparison tables for "X vs Y" queries — near-guaranteed Perplexity citation.
- BLUF (Bottom Line Up Front) — 90% of top-cited sources answer the core question within the first 100 words.
- E-E-A-T author bylines on editorial — significant lift across all engines.
- Recency / lastmod / "updated" timestamps — 25.7% of AI-cited content is fresher than median search-cited content.

**Tier C (some evidence, mixed signals):**

- Most Schema.org markup beyond FAQPage — Google's own May 2026 guidance explicitly demoted schema's importance for AI search. Useful for clean extraction; not a citation driver.
- Internal linking — helps general SEO and helps crawlers find pages, but isn't an AI-specific lever.

**Tier D (negligible evidence):**

- **llms.txt** — 10.13% adoption across 300k domains; 408 fetches across 500M AI bot visits in one 90-day analysis. Only IDE / coding agents read it (Cursor, Windsurf, Claude Code). Real estate is not an agentic-coding domain. Adding it is essentially free; expected uplift is roughly zero. Do it for hygiene, not impact.

---

## 3. Where COP Stands — Site Audit Distilled

Twelve key facts from the audit, ranked by leverage:

1. **AI crawlers are blocked.** Middleware returns 403 to GPTBot / ClaudeBot / PerplexityBot / CCBot / OAI-SearchBot. See §0.1.
2. **No llms.txt, llms-full.txt, ai.txt.** All return 404.
3. **robots.txt is three lines.** No AI-crawler directives.
4. **Sitemap is excellent** — 2,066 URLs, reciprocal hreflang across en/es/fr/de, generated server-side from Supabase. Strong.
5. **Schema coverage is strong on destination pages, sparse elsewhere.** Destination pages get 8 schemas (RealEstateAgent, TouristDestination, FAQPage, Article, ItemList, BreadcrumbList, WebPage, Organization). Property pages get only 2 (RealEstateListing, BreadcrumbList) — missing Accommodation, geo, Review, Offer.availability, numberOfBathroomsTotal. `/how-it-works/`, `/our-homes/`, `/about-us/`, `/all-our-blog/`, both contact pages: zero schema.
6. **No Person schema anywhere.** Blog posts list `author: { @type: Organization }`. David Olsson's 20-year Alpine credential is in prose but invisible to machines.
7. **No Review schema on the four named testimonials** at `/about-us/` (Astrid, Harry & Nicole, Mateo & Anne, Jan & Family — all with photos, locations, 5-star ratings, quotes). Every field the Review schema needs is already on the page.
8. **Content depth on destinations is real** — 49 of 54 EN pillar pages are 5,000–13,000 words with FAQ JSON-LD wired in. But 41 of 48 pages have no `<ul>`, `<ol>`, `<table>`, `<img>`, or `<blockquote>` in the editorial body — pure walls of `<p>`. AI engines favour list and table content. This is fixable in a structured rewrite pass.
9. **Blog is deeper than expected** — 113 posts including cross-border tax briefings, capital gains, inheritance, LLC structure, the 247-buyer survey (the only piece of original research currently on the site). Author byline is always Organization, never a Person. Bylines fix is a one-day patch + a small Supabase migration.
10. **Property pages are listing-only** — no editorial overlay, no "Why this property", no comparison to whole-ownership cost, no calculator output rendered as HTML. The FinancingCalculator component runs but its output never reaches the DOM that crawlers see.
11. **Missing page types that AI engines disproportionately cite:** glossary, comparison pages (Pacaso vs MYNE vs Vivla vs August), country-tax pages, calculator pages with rendered output, /partners/{slug}/ landing pages, /team/{name}/ Person profiles, /research/ hub, /api/properties.json public feed, /press/ landing pages with article citations.
12. **One renderer bug** documented in `audits/destinations-audit.md` §2.1 silently exposes ~800 words of orphan FAQ HTML on the France and Italy pillars — currently a duplicate-content signal AI engines deduplicate and read as a quality penalty.

---

## 4. Where COP Stands — Competitive Baseline Distilled

From the 26-query baseline (~200 top-10 slots counted):

| Brand | Approx. share of top-10 slots | Where they win |
|---|---|---|
| **Pacaso** | ~14% | Education + comparison + brand-defence — every "what is" and "best of" |
| **co-ownership-property.com (COP)** | ~12% | Destination queries — Mallorca, Ibiza, French Alps, Costa del Sol, Spain, Portugal, Ibiza |
| Fractional Group | ~6% | UK + Italy + general "definitive guide" SEO |
| August Collection | ~5% | "How it works" + appears whenever Pacaso is compared |
| Kocomo | ~5% | Country-by-country marketplace positioning (post-pivot) |
| International Property Shares | ~4% | "Which company is right" evergreen |
| **B2B aggregators (CB Insights, Inven, Product Hunt, Slashdot, Sourceforge)** | ~7% | Every "alternatives" + "best of" comparison query |
| Other (Andy Sirkin, jet/aircraft, lawyer blogs, private clubs, lawyer blogs) | ~31% | Long tail of due diligence and country-niche |

**Two surprises.** First, COP is closer to Pacaso in raw citation share than expected — 12% vs 14% — because the destination-page strategy is genuinely working. Second, **B2B aggregator listicles capture 7% of citation slots and COP is on none of them.** Inclusion in CB Insights' Pacaso-alternatives page, Inven's top-22 Pacaso competitors, Product Hunt's alternatives, Slashdot/Sourceforge category pages is purely an outreach problem — not a content problem.

**The opportunity map** is essentially this:

- **Destinations** — keep winning. Fix the 29 below-standard destination pages (per `audits/destinations-audit.md`), add lists/tables/blockquotes to the wall-of-prose pages, expand country and region coverage (Italy beyond 4 regions, Portugal beyond 1, Greece from 0, Switzerland/Austria from 1 each).
- **Education** — don't fight Pacaso here. It's their flywheel and they have a 5-year head start. Accept they'll keep #1 for "what is fractional ownership" and instead win adjacent queries.
- **Comparison** — wide open. "MYNE vs Vivla", "Pacaso vs August", "Pacaso vs European alternatives", "fractional vs second home in Spain", "fractional vs timeshare" — all under-served. COP's unique angle: the only site selling stock from all five partners. The neutral marketplace voice is unique.
- **Due-diligence** — wide open. "How to exit fractional ownership", "fractional maintenance fees" (currently dominated by aircraft content), "fractional ownership Spain non-resident", country-by-country tax. These are searched, are inside the funnel, and the field is starved for clean property-side content.
- **Authority** — empty. Nobody owns the "expert voice" of European fractional ownership the way Andy Sirkin owns the US legal angle. David Olsson can claim that slot in 12 months with bylined long-form + podcast + Forbes Council membership.

---

## 5. The Action Plan

Three layers: 30-day quick wins (cheap, high-leverage), 90-day strategic gaps (bigger investments, still inside-the-box), and 12-month bets (outside-the-box, asymmetric).

### 5.1 — 30-day quick wins (single sprint each)

These are sequenced. Do them in order.

**#1 — Patch middleware.js to stop blocking AI crawlers.**

`middleware.js:17–20` already has an `ALLOW_PATTERNS` array. Add the AI crawler patterns. Estimated time: 30 minutes. Single biggest visibility unlock on the entire roadmap.

Suggested additions:
```
/gptbot/i, /chatgpt-user/i, /oai-searchbot/i,
/claudebot/i, /claude-web/i, /anthropic-ai/i,
/perplexitybot/i, /perplexity-user/i,
/ccbot/i, /google-extended/i, /applebot-extended/i,
/cohere-ai/i, /bytespider/i, /amazonbot/i,
/meta-externalagent/i, /facebookbot/i
```

**#2 — Ship `public/llms.txt` and `public/llms-full.txt`.**

llms.txt is Tier-D for impact but Tier-A for hygiene. Real cost ≈ 4 hours; expected uplift on retrieval ≈ zero, but no downside, and the moment one major engine adopts it COP is ready. Index the 54 destination pages, both FAQ pages, top-20 blog posts, and the API endpoints (once they exist). See `site-audit.md` §1.3 for a suggested skeleton.

**#3 — Update `public/robots.txt`** with explicit `Allow: /` for each AI crawler UA, plus the existing sitemap line. ~30 lines. Signals consent loud and clear.

**#4 — Add `Person` schema for David and Dylan on `/about-us/`.**

Include `name`, `jobTitle`, `worksFor`, `knowsAbout: ["Fractional ownership", "European luxury real estate", "Alpine ski properties", ...]`, `sameAs` (LinkedIn + any press URLs), and embed `Quotation` JSON-LD for the David quote already in the page. This is the foundation for every bylined article going forward.

**#5 — Change blog `author` from Organization to Person.**

`pages/blog/[slug].js` currently emits `author: { @type: "Organization", name: "Co-Ownership Property" }`. Migrate to `Person`. Add a `byline` field to the Supabase `posts` table; default to David where unset. AI engines specifically downweight unsigned editorial when ranking against signed expert content. This is the highest-leverage E-E-A-T fix on the site.

**#6 — Add `FAQPage` schema to `/how-it-works/`.**

The page is already a Q-then-A narrative. Restructure as ~10 `Question`/`Answer` pairs and emit JSON-LD. ~2 hours.

**#7 — Add `Review` schema to the four testimonials on `/about-us/`.**

Every field is already on the page. Wrap as JSON-LD `Review` + `aggregateRating` on the Organization. ~1 hour.

**#8 — Add `Accommodation` + `geo` + `numberOfBathroomsTotal` + `Offer.availability` to property pages.**

The data is all in Supabase. Extend `pages/property/[slug].js:416–445` with the missing fields. ~3 hours.

**#9 — Link property pages upward to their destination pillar.**

`pages/property/[slug].js` currently shows similar-country properties but doesn't link to the pillar. One `<a>` per property pointing at `/{country-slug}-fractional-ownership-properties/`. ~1 hour.

**#10 — Ship `/api/properties.json` and `/api/destinations.json`.**

Two ~50-line Next.js API routes returning the Supabase data as a JSON Feed. Link from `llms.txt` and `sitemap.xml`. Add `<script type="application/ld+json">` with `@type: DataFeed` on `/our-homes/`. The schema is already in Supabase. ~1 day.

**#11 — Verify COP in Bing Webmaster Tools.**

Bing is the retrieval substrate for ChatGPT Search and Microsoft Copilot. Verifying is free, takes 10 minutes, and unlocks the new AI Performance dashboard (public preview Feb 2026) — the only major engine giving observable AI-citation-level analytics in 2026.

**#12 — Fix the `removeSectionByClass` renderer bug** documented in `audits/destinations-audit.md` §2.1. Currently exposes ~800 words of orphan FAQ HTML on France + Italy pillars. Two-line fix, reduces duplicate-content penalty.

### 5.2 — 90-day strategic content investments

These compound. Sequence is less critical than execution quality.

**#13 — Glossary at `/glossary/`.**

40–60 `DefinedTerm` entries in a `DefinedTermSet` JSON-LD container. Source material is the existing FAQ corpus — terms like LLC, SCI, deeded share, notaire, IFI, taxe foncière, IBI, IMU, fair-rotation calendar, bullet mortgage, supported resale, golden visa, escritura, Schengen 90/180, beneficial ownership, ROFR. Each term: 1-line definition + 2-sentence explanation + 1 example + 2–3 outbound internal links. AI engines disproportionately lift glossary entries verbatim. Estimated: 2 weeks editorial + 2 days templating.

**#14 — Comparison pages at `/compare/{a}-vs-{b}/`.**

The single highest-ROI new content surface for COP. Priorities:

- `/compare/fractional-ownership-vs-timeshare/`
- `/compare/fractional-ownership-vs-second-home/`
- `/compare/fractional-ownership-vs-fly-rent/`
- `/compare/pacaso-vs-myne/`
- `/compare/pacaso-vs-vivla/`
- `/compare/pacaso-vs-august/`
- `/compare/myne-vs-vivla/`
- `/compare/european-fractional-vs-us-fractional/`
- `/compare/spain-vs-france-fractional-ownership/`
- `/compare/mallorca-vs-marbella-vs-ibiza/`

Each page: 2,500–4,000 words, hero comparison table, side-by-side feature grids, neutral marketplace voice, structured `Article` schema + `mentions` arrays linking compared brands by their Wikidata/Crunchbase Organization URLs. **The marketplace voice — "we sell stock from all five, here's the honest comparison" — is a positioning moat no single-operator brand can replicate.**

Each page targets a high-intent comparison query that's currently won by either the operators themselves (biased) or B2B aggregators (auto-generated, shallow).

**#15 — Country-tax pages at `/taxes/{country}-fractional-ownership/`.**

Currently the destination pages mention IFI / SCI / IBI / notaire in passing. AI engines consistently cite the canonical resource page over a mention in a destination pillar. Priority order: Spain, France, Italy, USA, Portugal, UK, Mexico, Croatia, Germany, Austria, Sweden, Greece (when destination ships). Each page: tax structure, capital gains rules, wealth tax, inheritance, non-resident specifics, cross-border treaty notes. Schema: `Article` + `FAQPage` + `mentions: [Country, GovernmentService]`.

**#16 — Exit / resale guide at `/resale/`.**

The single most-asked buyer objection ("what if I want to sell my share") has zero canonical resource on the property side of fractional ownership. Top results are Indian tokenization platforms and one Quora thread. Cover: ROFR mechanics, secondary marketplaces, share valuation, tax on exit, the 4 exit routes (sell back to operator, transfer to family, listed marketplace, private sale), real timelines from COP's actual completed resales. Pair with `/blog/exit-strategy-case-studies/` for SEO depth.

**#17 — Partner landing pages at `/partners/{pacaso|myne|vivla|andhamlet|abitaro}/`.**

The current site rule is "descriptions never mention partner names." That's correct UX inside listings. But dedicated landing pages serve a different purpose — answering "is Pacaso legit", "MYNE Homes reviews", "Vivla scam or genuine" — high-volume queries that currently rank for the operator's own owned-and-operated content. COP can rank for these as the neutral marketplace by owning the comparison.

Each page: how the partner works, properties COP lists from them, neutral pros/cons, comparison to other partners on the marketplace, structured data linking to the partner's Crunchbase/Wikidata Organization.

**#18 — Founder profile pages at `/team/david-olsson/` and `/team/dylan-olsson/`.**

Full Person schema with `knowsAbout`, `alumniOf`, `worksFor`, `sameAs` (LinkedIn + any press citations), `description`, `image`. Bio: David's 20 years in Alpine real estate, 40+ resorts, the priced-out clients backstory. Dylan's: raised between London and Marbella, Manchester business degree. Anchor for blog post `author` fields. Anchor for any future Wikipedia citations. This is the entity-graph entry point for an LLM trying to verify "who is the expert behind this".

**#19 — Research hub at `/research/` anchored by the 247-buyer survey.**

The 247-buyer survey is the only piece of original research on the site and is buried in the blog. Surface it as a research hub. Add quarterly data drops from Supabase: average per-share price by region (2024 vs 2025 vs 2026), days-of-use distributions, resale timelines, share-size mix across partners. Each drop: `Dataset` JSON-LD + downloadable CSV + methodology section. **This is the citation magnet outside operators cannot match — COP is the only entity with cross-partner inventory data.**

**#20 — Calculator pages with rendered HTML output.**

`/calculator/total-cost-of-ownership/`, `/calculator/share-vs-whole-property/`, `/calculator/rental-offset/`. Each: SSR-render a default example so crawlers see the numbers, JS hydration for interactivity, `SoftwareApplication` + `HowTo` schema. The current `FinancingCalculator` runs but the output never reaches crawlers.

**#21 — Press page at `/press/`.**

The press logos on `/about-us/` and `/how-it-works/` (The Times, FT, Daily Mail, Forbes, Express, Business Insider, Luxury Travel, Rolling Stone) are images with no link-outs and no schema. Restructure as `/press/{outlet}-{slug}/` pages with article excerpt, publication date, outbound link, `CreativeWork.citation` schema. AI engines treat these as third-party authority signals.

**#22 — Destination expansion + standardization.**

Fix the 29 below-standard destination pages identified in `audits/destinations-audit.md`. Add lists / tables / blockquotes to break the wall-of-prose problem (41 of 48 pages have none). Expand:
- Italy: add Tuscany, Amalfi Coast, Puglia, Sicily
- Portugal: add Algarve, Lisbon, Comporta
- Greece: add Cyclades, Crete, Corfu (currently zero pages)
- Switzerland, Austria: break out major ski destinations
- Translate the 28 missing ES + FR mirrors to match DE's 49-page coverage

**#23 — Sitemap split.**

Split `sitemap.xml` into a sitemap-index with `sitemap-properties.xml`, `sitemap-destinations.xml`, `sitemap-blog.xml`. Use real `lastmod` timestamps from Supabase / filesystem. Faster selective re-crawls for ChatGPT/Perplexity which honor `<lastmod>` for prioritization.

### 5.3 — 12-month outside-the-box bets

These are the moves smart early operators are making that AI-citation playbooks don't mention. Each is asymmetric: low cost, high potential, mostly orthogonal to traditional SEO.

**#24 — Wikipedia + Wikidata entity work.**

Create or update the COP Wikidata entry with structured properties: founded date, founders, headquarters, partners, properties listed, official website, social profiles. Wikidata feeds Google's Knowledge Graph and is ingested heavily by multilingual LLMs.

Wikipedia is harder — COP would need 3–5 mainstream press citations first to sustain a standalone article under notability policy. But contributing to existing articles is immediate: the "Fractional ownership" article is light on real-estate-specific detail and skews aviation-historical. Adding a properly-cited European real-estate section (with COP's research as the source) is high-leverage and free.

**#25 — Trustpilot presence.**

Trustpilot is empty for COP. Domains with Trustpilot profiles correlate with 3–6× higher ChatGPT citation rates. Target 30–50 verified reviews over 90 days. Embed Trustpilot widget on `/about-us/` + property pages. Free / low cost; meaningful for ChatGPT specifically.

**#26 — Reddit presence (transparent, helpful, sustained).**

`/r/realestateinvesting`, `/r/EuropeFIRE`, `/r/expats`, `/r/Pacaso`, `/r/timeshare`, `/r/Mallorca`, `/r/spain`, `/r/france`. Reddit accounts for up to 46.7% of Perplexity top citations and ~5%+ of ChatGPT responses. The mechanic is simple: an honest, identified COP voice answers questions, links to the canonical COP resource (glossary, comparison, tax page) where genuinely useful. Don't spam. Don't astroturf.

Tactical note: Reddit weights account age and post karma. Build the account for 60 days with helpful comments before doing the first COP-link reply. Disclose the affiliation.

**#27 — YouTube transcripts.**

YouTube overtook Reddit as the most-cited social platform in some AI engines in late 2025. Mechanism: LLMs read transcripts, not videos. Two angles:

- **Original COP YouTube channel** — 8–12 videos per year, each on a topic that has zero good video coverage today: "How a 1/8 share LLC actually works", "Pacaso vs MYNE walkthrough", "Mallorca fractional ownership site tours", "The exit strategy that nobody talks about." Each video: clean transcript, descriptive chapter markers, SRT file (these outperform auto-generated transcripts). Hosted on the COP domain too with `VideoObject` schema.
- **Guest appearances** on real-estate-investment podcasts and YouTube channels — BiggerPockets, The Real Estate Guys, A&E, Property Tribes, Spanish property YouTubers. One hour-long appearance generates a transcript that syndicates across multiple platforms and pulls COP into co-occurrence with other named guests.

**#28 — Podcast guesting strategy.**

Long-form podcasts produce transcripts that are ingested by every LLM. Target list (priority order):
- BiggerPockets Real Estate Show
- The Real Estate Guys Radio Show
- The Property Podcast (UK)
- Inside The Wendy House (luxury property)
- A Place in the Sun podcast
- Sifted Talks (European tech / proptech angle)
- The Diary of a CEO (long-shot but huge audience)
- Niche: ski property podcasts (David's natural fit), Mallorca expat podcasts

One hour-long appearance per month for 12 months → ~12 transcripts in the wild, each with David named + COP named + co-occurring with major operators.

**#29 — Expert quotes in third-party trade press.**

Every quote attributed to David in Mansion Global, FT HTSI, Robb Report, Sifted, Telegraph Property, The Times Bricks & Mortar, Bloomberg, Air Mail, Hollywood Reporter is a brand mention + co-occurrence signal. Hire a part-time real-estate PR person ($1–3k/month) or use HARO / Help A Reporter Out / Qwoted to pitch journalists working on co-ownership stories.

Coverage in those outlets is what AI engines treat as luxury-real-estate authority hierarchy. Pacaso has been written about by literally every major real-estate trade outlet. COP has not. Closing that gap is the single largest off-site lever after the middleware fix.

**#30 — B2B aggregator listicle inclusion.**

Direct outreach to:
- CB Insights — Pacaso alternatives page
- Inven.ai — top-22 Pacaso competitors
- Product Hunt — Pacaso alternatives 2026
- Slashdot — fractional ownership platforms 2026
- Sourceforge — best fractional ownership platforms Europe
- Crunchbase — verify and enrich the COP profile
- PitchBook — same
- Owler — same

These pages already rank on AI-flavoured queries. Inclusion is purely an outreach problem. Each is a single email. Expected hit rate: 60%+ for accurate, helpful submissions. Time investment: 1 day total for all of them.

**#31 — Hugging Face dataset publishing.**

Publish a sanitized cross-partner dataset card: `co-ownership-property/european-fractional-listings`. Columns: anonymized region, share price, share size, beds/baths/sqm, year built, year listed, operator. Quarterly updates. Hugging Face is increasingly a training-data discovery surface; nobody in this vertical has published anything there. First-mover advantage. Cost: 1 day of engineering + an editorial decision about partner data sanitization.

**#32 — GitHub repo with structured exports.**

`github.com/co-ownership-property/data` — public repo with monthly snapshots of the inventory dataset, an llms.txt for agentic-AI surfaces, a "fractional ownership glossary" in markdown, and (long-shot but interesting) an MCP server that lets Claude Code / Cursor / agents query COP inventory. Niche today; in the long tail of agentic real-estate queries it's first-mover positioning that nobody else holds.

**#33 — Research report PDFs on Zenodo / SSRN.**

A formal "State of European Fractional Vacation-Home Ownership 2026" report — 30-page PDF, COP-branded, original data, methodology, DOI minted via Zenodo. Cross-post to SSRN where applicable. **Gemini Deep Research disproportionately cites .gov / .edu / journal / research-repository sources.** This is one of the only ways a private commercial site can break into Gemini Deep Research's authority cluster. Cost: 2–3 weeks of analyst time once per year.

**#34 — University case studies.**

Target real-estate / finance / hospitality programs: IE Madrid, ESADE Barcelona, INSEAD, NYU Stern, EHL Lausanne, Cornell SHA. Offer free access to anonymized data + a David Olsson guest lecture in exchange for a case study published on the university's .edu domain. A single .edu citation is disproportionately weighted in Gemini's authority cluster and in Claude's Brave-backed retrieval.

**#35 — Quora answer build-out.**

Quora threads appear consistently in long-tail AI citations ("how do I exit fractional ownership", "is fractional ownership worth it"). 30 helpful, identified answers from David over 90 days, each with a single inline citation back to the canonical COP resource page. Domains with high Quora mention density earn 4× more ChatGPT citations than absent domains.

**#36 — Press / Newswire amplification once per quarter.**

PR Newswire and Business Wire releases get aggregated by hundreds of indexed domains overnight. One quarterly release per year — the State of European Fractional Ownership report, or a milestone announcement (1,000th property listed, partnership expansion) — generates 50–200 inbound mentions in 48 hours. Cost: $1,000–$2,000 per release. Earned media drives +239% median lift in AI citations.

**#37 — Co-occurrence by design in editorial.**

Every editorial piece on COP should mention competitors by name where genuinely relevant. "Pacaso operates in the US, MYNE in DACH, Vivla in Spain, &Hamlet in select markets, Abitaro in [niche]; COP aggregates them all into one marketplace." Co-occurrence is the underlying mechanism by which LLMs build a candidate set for "fractional ownership" queries. When "Pacaso" and "co-ownership-property.com" appear on the same page along with the phrase "fractional ownership Spain," every AI engine builds a stronger association.

This is the inverse of the current `CLAUDE.md` rule "descriptions never mention partner names" — that rule remains correct for property descriptions, but editorial / comparison / partner / press pages should deliberately co-occur with the operator names.

### 5.4 — The geopolitics moves nobody else is making

Three plays that look weird and are probably mispriced.

**#38 — Authoritative Spain/France/Italy legal-tax explainers in English.**

The legal complexity of cross-border fractional ownership in Europe is real and the English-language content covering it is thin. A 40-page guide ("Co-Ownership Property: The Legal & Tax Handbook for Non-Resident Buyers in Europe") — co-authored with a Spanish notary, a French notaire, and an Italian commercialista — published as a PDF + a series of long-form web pages. AI engines aggressively cite content that quotes named legal experts. Cost: $3–8k in legal consultancy fees. Pays off across every Spain / France / Italy tax query for years.

**#39 — Reddit AMA + verified expert flair.**

Apply for verified expert flair in `/r/realestateinvesting` and `/r/EuropeFIRE`. Run an AMA quarterly. AMAs get extensively transcribed and cited in subsequent AI answers — they sit in the top 1% of Reddit's authority weighting. Free.

**#40 — Industry-association membership.**

Real Estate Standards Organization (RESO), Luxury Portfolio International, ALSO Luxury Networks, RICS, FIABCI. Membership creates a backlink from the association's site (usually .org, often educational tier) and inclusion in the directory. Indirect but reliable authority signal. Cost: $500–$3000/year per association. Worth the $1k floor.

### 5.5 — What NOT to do (anti-pattern list)

- Don't waste time on llms.txt as a citation lever. Ship it for hygiene, expect zero impact.
- Don't bolt on every available Schema.org type as a "more is better" play. FAQPage on explainers + Person on team + Review on testimonials + Accommodation on properties is the load-bearing set. Bolt-on `Product`/`Service`/`Organization` everywhere is theatre.
- Don't fight Pacaso on "what is fractional ownership" head terms. They will keep winning. Fight on destinations, comparison, due-diligence, and authority instead.
- Don't write generic AI-generated explainer content. The Princeton GEO paper found stats and quotations drive citations, not word-count. 1,500 dense, sourced, list-rich words beats 5,000 watery prose every time.
- Don't optimize for Grok specifically until/unless real-estate-on-X becomes a thing. Audience skew is wrong for COP's high-intent buyer persona.
- Don't pay for "AI visibility tools" that just measure your rank on a few prompts and charge $400/month. Build the tracker yourself (see §6) and spend the budget on PR or original research.

---

## 6. Tracking — How to See If This Is Working, For Free

Three layers. Use them together.

### 6.1 — Automated tracker (Cowork artifact)

An artifact dashboard that runs scheduled queries against AI engines where API access exists (Perplexity Sonar API has a free tier; ChatGPT via OpenAI API; Brave Search API has 2,000 free queries/month; Bing Webmaster Tools AI Performance dashboard is free). Logs whether COP is cited, what other domains are cited alongside, citation rank, and date. Charts share-of-voice over time per engine. Manual entry for engines without API (Google AI Mode, Claude.ai chat) so David can paste results during weekly reviews. Built as a separate artifact alongside this doc.

### 6.2 — Bing Webmaster Tools AI Performance dashboard

Free. Public preview as of Feb 2026. The only major engine giving observable AI-citation-level analytics (citations, impressions, clicks for AI answers across Copilot and Bing AI summaries). Verify COP in BWT immediately as part of the 30-day sprint.

### 6.3 — Manual deep-dive prompt library (separate doc)

A library of ~100 prompts a real buyer might type. Organized by funnel stage: discovery, comparison, due-diligence, destination, post-purchase. Run quarterly across ChatGPT / Perplexity / Google AI / Claude / Gemini. Log results in the artifact dashboard. Track:
- Does COP get cited?
- Who else is cited (Pacaso, August, MYNE, Vivla, Kocomo, B2B aggregators)?
- What page is cited (destination pillar, blog, FAQ, partner landing)?
- What position?

Compile the library as `research-output/manual-prompt-library.md`.

### 6.4 — Lightweight off-the-shelf monitoring (optional)

If David wants a backstop, Profound / Ahrefs Brand Radar / Otterly.ai each offer AI-citation tracking. They are paid ($100–$400/month). The free combination of (1) BWT + (2) the custom artifact + (3) the manual library should cover 90% of the visibility need. Reach for paid tools only if a specific question can't be answered with the free stack.

---

## 7. Sequenced 12-month Roadmap

A reasonable cadence, assuming a single developer (David) + occasional editorial / PR help:

**Month 1 (June 2026):**
- Week 1: Quick wins #1–12. Middleware fix, llms.txt, robots.txt, Person/Review/Accommodation/Offer schema additions, Bing Webmaster verification, renderer bug fix.
- Week 2: Author bylines migration on the blog, link property → destination upward, ship `/api/properties.json` + `/api/destinations.json`.
- Week 3: Build the tracking dashboard artifact + manual prompt library. Run the first baseline scan.
- Week 4: Reddit account setup (60-day warm-up clock starts). Trustpilot invitation campaign starts. B2B aggregator outreach for CB Insights / Inven / Product Hunt / Slashdot / Sourceforge inclusion (15 emails total).

**Month 2 (July 2026):**
- Glossary build-out (#13). 40–60 terms.
- Comparison pages — first batch of 4 (#14): fractional vs timeshare, fractional vs second home, Pacaso vs MYNE, Pacaso vs Vivla.
- Founder profile pages (#18) — David + Dylan.

**Month 3 (August 2026):**
- Country-tax pages (#15) — Spain, France, Italy (the three highest-value).
- Comparison pages — second batch of 3.
- First podcast guesting recordings — 2 booked, 2 recorded.
- First HARO / Qwoted journalist pitches go out.

**Month 4 (September 2026):**
- Exit / resale guide (#16) at `/resale/`.
- Partner landing pages (#17) — Pacaso, MYNE, Vivla, &Hamlet, Abitaro.
- Country-tax pages — USA, Portugal, UK.
- Research hub launch (#19) with the 247-buyer survey + first quarterly data drop (anonymized pricing by region, Q3 2026).
- First Forbes Real Estate Council application (David).

**Month 5–6 (October–November 2026):**
- Calculator pages with rendered output (#20) — three calculators.
- Press page (#21) build-out.
- Sitemap split (#23).
- First press release on PR Newswire — the "State of European Fractional Ownership Q3 2026" preview.
- Destination expansion (#22): Italy regions (Tuscany, Amalfi), Portugal regions, Greece pillar.
- Wikipedia/Wikidata work (#24) — Wikidata entry created; targeted contributions to the "Fractional ownership" Wikipedia article.

**Month 7–9 (December 2026–February 2027):**
- Hugging Face dataset publishing (#31).
- GitHub repo (#32) with monthly inventory snapshots + MCP server v0.
- Zenodo research report (#33) — the formal "State of European Fractional Vacation-Home Ownership 2026" PDF with DOI.
- University outreach (#34) — 2 case studies in progress.
- YouTube channel launch (#27) — first 4 videos shipped.
- Translate destination pages (#22) — close the ES + FR gap to match DE.

**Month 10–12 (March–May 2027):**
- Quora answer build-out (#35) — 30 answers.
- Industry-association memberships (#40).
- Legal-tax handbook PDF (#38) co-authored with notary/notaire/commercialista.
- Second quarterly data drop in `/research/`.
- 12-month review of the tracking dashboard. Decide what to double down on for year 2.

---

## 8. What Could Go Wrong / Open Questions

Honest gaps in the picture, lifted from the research doc:

1. **Apple's "World Knowledge Answers"** launches Spring 2026 and has slipped at least once. Source-selection logic is undisclosed. Plan assumes it routes via ChatGPT for now.
2. **Schema's actual causal effect on AI citation** — agency studies say 2–3× lift, controlled studies say no correlation. The truth is probably "depends on schema type and engine." Plan is conservative (only the load-bearing schema types).
3. **Reddit's licensing deals with each model provider** are murky and change citation share patterns. The Reddit strategy is robust to most outcomes — even at 0.1% citation rate, Reddit threads still surface for the long-tail "is X a scam" queries.
4. **AI Mode citation share patterns** are too new for longitudinal studies. The Princeton GEO findings predate AI Mode; the +115% position-5 lift may compress as engines mature. Worth re-testing in Q3 2026.
5. **`/partners/` landing pages contradict the current "never mention partner names" rule** — David should make a deliberate decision here. The rule is correct for listing descriptions. The recommendation in this plan is to carve out a small set of dedicated comparison surfaces where the rule is intentionally inverted. Worth a separate conversation before shipping #17.
6. **PR budget and bandwidth** — much of the off-site strategy assumes some PR capacity. A part-time PR contractor at $1–3k/month accelerates everything in §5.3 and §5.4 by 6+ months. Without it, David's personal time becomes the bottleneck.
7. **Whether AI search will fragment further or consolidate** — three new engines could launch in the next 12 months (Apple, Meta's rumoured search, possibly an OpenAI standalone search product). The strategy is robust because the load-bearing tactics (brand mention density, original research, comparison content, founder authority) work across all engines.

---

## 9. The 3-Sentence Net Strategic Take

1. **The biggest lever is brand-mention density on third-party authoritative surfaces** — Mansion Global / Sifted / Robb Report / FT HTSI / Reddit / Wikipedia / Trustpilot / YouTube transcripts / B2B aggregator listicles — because that drives co-occurrence in LLM training data and live-retrieval candidate sets across every engine.
2. **The second biggest lever is original research published as structured, downloadable, citable data** — the COP dataset of ~330 cross-partner listings is genuinely unique and can produce three or four "first of its kind" data reports per year that become the cited source for every "European fractional ownership" answer an LLM constructs.
3. **The third biggest lever is owning explainer / glossary / comparison / due-diligence content for the long-tail buyer-funnel questions** (Pacaso vs Vivla, Spanish tax for fractional ownership, how 1/8 share scheduling works, capital gains on exits, fractional vs second home TCO) in clean Q&A / table / list format, because that's the structural shape engines lift from when synthesizing answers.

Everything else — schema, llms.txt, technical SEO polish, individual property-page optimization — is downstream of those three. And all of them are blocked behind one 10-line code change in `middleware.js`.

---

*Cross-references: full engine fact sheets in `research-output/ai-search-research.md`; full site audit in `research-output/site-audit.md`; full 26-query baseline in `research-output/baseline.md`; manual prompt library in `research-output/manual-prompt-library.md`; live tracking artifact accessible from the artifact tab in Cowork.*
