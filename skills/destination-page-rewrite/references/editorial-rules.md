# Editorial rules — every do/don't established through David's France pillar feedback

This is the running catalogue of editorial principles. Every rule here was earned through a specific feedback round on the France pillar build (May 2026). Append new rules here whenever a new rewrite surfaces feedback we didn't anticipate.

---

## Rule 1 — NEVER mention partner names

**Banned words anywhere in the file**: `&Hamlet`, `andhamlet`, `Vivla`, `Myne`, `Pacaso`.

The site is COP's own editorial voice, not a partner aggregator. Properties are presented as "COP curates" or "the COP portfolio". The legal/operational structure is COP's.

Verification grep: `grep -ic "andhamlet\|vivla\|myne\|pacaso\|&Hamlet" "$FILE"` → must return 0.

---

## Rule 1.5 — Single "tour" of property types + places per page

David flagged in May 2026 that the rhetorical pattern of listing property types in specific places — `[type] in [place], [type] in [place], [type] in [place]` — was repeating **three times** per pillar across:

1. **Hero subtitle** ("From a Belle Époque villa above Menaggio… to a Sirmione townhouse… to a Stresa palazzo…")
2. **Mid-CTA** ("Fully managed villas, apartments and townhouses across Lake Como (Bellagio, Menaggio, Tremezzina…), Lake Garda (Sirmione, Salò…)…")
3. **§A snippet** ("Fractional ownership on the Italian Lakes means buying a deeded 1/8 share of a luxury lakefront second home — a Belle Époque villa above Menaggio, a Sirmione townhouse, a Stresa palazzo…")

That's the same listing three times in 200 words. Drop two of them.

**Rule**: the tour appears **once** — in the hero subtitle. Then:

- **Mid-CTA paragraph**: list the high-level cluster names only, no parenthetical sub-zone enumeration. Good: `"Fully managed villas, apartments and townhouses across <strong>Lake Como, Lake Garda and Lago Maggiore</strong>"`. Bad: `"Fully managed villas, apartments and townhouses across <strong>Lake Como</strong> (Bellagio, Menaggio, Tremezzina, Como town, Domaso), <strong>Lake Garda</strong> (Sirmione, Salò, Gardone Riviera, Bardolino, Malcesine, Riva del Garda)…"`
- **§A snippet**: describe the property in adjective form only, no enumeration. Good: `"means buying a deeded 1/8 share of a luxury lakefront second home — held in a purpose-built LLC alongside up to seven other co-owners"`. Bad: `"means buying a deeded 1/8 share of a luxury lakefront second home — a Belle Époque villa above Menaggio on Lake Como, a Sirmione townhouse on the Lake Garda peninsula, a Stresa palazzo facing the Borromean Islands — held in a purpose-built LLC…"`

Pick a single descriptor for the snippet: "Mediterranean", "alpine", "lakefront", "Mediterranean island", "sun-coast", "Andalusian coastal", etc.

The §B "Where to own" sub-zones can still tour the destination — that's the section's whole point. This rule only applies to §A/hero/mid-CTA.

Verification: snippet line (with `means buying a deeded` / `bedeutet, einen eingetragenen` / `consiste en adquirir` / `consiste à acquérir`) should have **at most 2 em-dashes**. More than 2 = an interjection still in place.

### Rule 1.5.1 — Hero subtitle uses **2 items max**, not 4

Earlier we allowed "From [X1] and [X2] to [Y1] and [Y2]" 4-item single tours. David then reviewed those and confirmed the 4-item form *still* reads as too listy — the cumulative "un X… un Y… un A… un B" rhythm in Spanish and French feels repetitive even though it's structurally one tour.

**Updated rule**: hero subtitle uses **exactly 2 items**: "From [X] to [Y]". Pick the single most iconic property pair for the destination and drop the other two.

Examples:
- ✅ EN Mallorca: "From a stone finca near Pollença to a townhouse in the Old Town of Palma — fractional ownership in Mallorca means…"
- ❌ Too listy (old form): "From a stone finca near Pollença and a Tramuntana villa above Port d'Andratx to a townhouse in the Old Town of Palma and a south-coast farmhouse near Ses Salines…"

The longer 4-item form was retired in May 2026. New pillars and translations should default to 2 items.

Target hero subtitle length: **18–28 words** in the pre-em-dash tour portion (not counting the post-em-dash value-prop sentence). The 50+ word heroes we shipped earlier feel turgid.

---

## Rule 1.6 — "Up to seven other co-owners", not "seven other co-owners"

Buyers often acquire multiple shares (one buyer takes 2/8 or 3/8), so the actual number of distinct co-owners is often fewer than seven. Phrasing "seven other co-owners" as a flat fact reads as too rigid.

**Canonical phrasings:**
- EN: `alongside up to seven other co-owners` / `you and up to seven other owners`
- DE: `gemeinsam mit bis zu sieben weiteren Miteigentümern` / `Sie und bis zu sieben weitere Miteigentümer`
- ES: `junto a un pequeño grupo de copropietarios (hasta siete en total)` / `tú y un pequeño grupo de propietarios (hasta siete en total)`
- FR: `aux côtés d'un petit groupe de copropriétaires (sept au maximum)` / `vous et un petit groupe de copropriétaires (sept au maximum)`

The 1/8 share structure is still defined in §F and the comparison table — this rule is just about tone in the snippet, LLC callout, anti-timeshare callout, §F legal-nature paragraph, and §F mechanics paragraph.

Verification: `grep -P '(?<!up to )seven (other |your |)owners|(?<!up to )seven (other |your |)co-owners' "$FILE"` → must return 0 hits. (Perl regex needed for lookbehind.)

---

## Rule 2 — LLC, never SCI / SRL / Sociedad Limitada / comunidad de bienes

COP holds every property — regardless of country — in a purpose-built LLC. NEVER reference national legal vehicles even when describing a country-specific page.

**Banned**:
- SCI (France), Société Civile Immobilière, société civile immobilière
- SRL / Srl (Italy)
- Sociedad Limitada / SL (Spain)
- comunidad de bienes (Spain)
- gérant (French SCI manager term — drop and rephrase)
- statuts (French SCI documents — say "LLC operating agreement" instead)

**Allowed**:
- "purpose-built LLC"
- "LLC structure"
- "LLC membership interest"
- "limited-liability company" (spelled out is acceptable as long as no national-vehicle naming)

Verification grep: `grep -E "\bSCI\b|Sociedad Limitada|comunidad de bienes|Société Civile Immobilière|\bSrl\b" "$FILE"` → must return 0.

---

## Rule 3 — NO risk / liability protection language

The LLC is positioned as COP's choice for SIMPLICITY and CONSISTENCY across the global portfolio, NEVER as protection against bad outcomes. Risk language reads as fear-selling and triggers "what if X goes wrong" thoughts in the reader.

**Banned phrasings**:
- "limited liability"
- "limited personal liability"
- "personal assets sit cleanly behind"
- "the property's risks stay with the property"
- "the company's limited liability"
- "Limited personal liability through the LLC structure"
- "what if the partner goes out of business"
- "in case of insolvency / litigation"
- Any "what happens if X goes wrong" framing

**Replacement angles** (positive, consistency-focused):
- "a single consistent ownership structure across every COP property worldwide"
- "the same modern framework whether you own in France, Spain, the US or elsewhere"
- "lighter resale because transferring an LLC membership interest is a more direct mechanical action than triggering a full title conveyance"
- "one international portfolio relationship"

Note: If the source naturally references something like "France's notarial system gives ownership documentary clarity for two centuries" — that's about the legal system's MATURITY (positive), not protection from disaster, and is fine.

Verification grep: `grep -ic "limited liability\|personal liability\|personal assets sit cleanly\|risks stay with" "$FILE"` → must return 0.

---

## Rule 4 — NO specific euro/dollar carry-cost guesses

We don't have authoritative carry numbers across a moving inventory. Specific euros LOCK the page to a snapshot we'll have to maintain forever and that may not match the actual properties listed.

**Banned phrasings** (examples):
- "annual carry typically €8,000–€25,000"
- "a €5m villa carries €120,000/year"
- "the management retainer can run to €100,000+ over the listing period"
- "share prices typically €310,000–€1,000,000"
- "whole property values €2.5m–€8m"
- "service charge €15,000–€20,000"

**Replacement framings** (comparative, doesn't date):
- "roughly one-eighth of the carry on the equivalent whole property"
- "a fraction of what an outright second-home owner pays in taxes, insurance, management and maintenance"
- "vs renting where you pay the rent every year and build no equity"
- "carrying costs of holding a whole {country} villa through a slow open-market sale can add up to a meaningful fraction of the sale price"
- "share price is a fraction of full ownership"

The §E comparison table uses "Whole second home / COP 1/8 share / Long-term rental" columns with relative-ratio cells like "~1/8 of carry, fully managed" — never specific currency amounts.

Allowed specifics: process timelines (e.g. "2–3 months" for resale), legal dates (e.g. "1986 Loi Littoral"), public facts (transit times, weather, populations).

Verification grep: `grep -E "€[0-9]+,[0-9]{3}|€[0-9]+(\.[0-9]+)?[mk]" "$FILE"` → must return 0 hits in editorial copy. (Public-facts that happen to mention prices like "€4–8 an hour Paris parking" are OK — those are practical references, not COP-property-cost claims.)

---

## Rule 5 — NO inventory lock-in language

Don't say "what COP currently offers" with named cities/property types. Inventory rotates; pages don't.

**Banned phrasings**:
- "COP focuses on luxury ski chalets in Courchevel, Méribel and Portes du Soleil"
- "Our French portfolio includes villas in Cap-Ferrat, Antibes and Saint-Tropez"
- "We currently have 8 properties in the Mallorca region"
- "COP's portfolio of {country} properties spans {specific list of cities}"

**Replacement framings** (rotation-aware):
- "COP curates co-ownership properties across {country}'s most established second-home regions — alpine chalets in the major ski domains, villas along the Mediterranean, and central Paris apartments"
- "Browse the listings on this page to see what's currently available, or join our updates list for new properties as they launch"
- "Our {country} inventory rotates as new properties come to market"

ALWAYS OK: §B "Where to own" zone breakdowns describing what each region/town is LIKE (this is destination editorial, not inventory promise). Naming Megève / Cap-Ferrat / Méribel as places a buyer might consider is fine. Comparison tables with example RATIOS (not euros).

This rule applies most directly to:
- The pillar page FAQ entry "What types of {country} properties does COP offer?" — should always be rotation-language
- Any §F mechanics paragraph describing "COP's offerings"

---

## Rule 6 — Temperatures Celsius first, Fahrenheit in parens

European audience leads. ALL temperatures must be `°C (°F)` format.

**Examples**:
- ✅ `25–28°C (high 70s°F to low 80s°F)`
- ✅ `12–15°C (mid-50s°F)`
- ✅ `22°C (72°F)`
- ❌ `high 70s°F to low 80s°F` (Fahrenheit-only)
- ❌ `25°C` (missing Fahrenheit pairing)

Conversion guide for ranges:
- 60s°F → mid-teens to high-teens°C (16–20°C)
- 70s°F → mid-20s°C (21–26°C)
- 80s°F → high-20s to low-30s°C (27–32°C)
- 90s°F → low-to-mid-30s°C (32–37°C)

Sea/water temps and air temps both follow this rule.

Colloquial relative comparisons like "warmer than London by ten degrees" are OK as-is (no conversion needed).

Verification: `grep -c "°F" "$FILE"` and `grep -c "°C" "$FILE"` should return roughly equal counts.

---

## Rule 7 — Use "1/8" everywhere, never "one-eighth"

Standardise the share-fraction notation. The numeric form matches the rest of the site ("1/8 share", "1/8 deeded share", "1/8 of carry").

**Banned**: "one-eighth", "one eighth", "an eighth", "1/eighth"
**Required**: "1/8"

This applies to comparison table cells, prose, and bullets.

---

## Rule 8 — Stats bands ONLY on region/city pages, never on country pillars

If a stat is true only for one cluster (e.g. "300+ days of sun on the Côte d'Azur" is one French region, not France-wide), it cannot live on a country pillar. Either:
- Reserve the stats band for region/city pages where the stats are scoped correctly, OR
- Don't use a stats band at all on country pillars

Country pillars CAN use individual `<div class="dest-callout">` boxes with country-true single facts (e.g. "France in three numbers: 222 years of civil-property precedent · 24 named ski domains · 3 distinct second-home regions"), but watch for ambiguous abbreviations like "100m" reading as "100 million" instead of "100 metres".

Region/city pages can use the full `<div class="dest-stats-band">` 4-stat horizontal band when every stat is scoped correctly.

---

## Rule 9 — Strategic bolding (not too heavy, not too light)

Target ~80–130 `<strong>` tags per 10k-word pillar. Scaled down proportionally for shorter pages: ~60–100 for 8k regions, ~40–70 for 5–6k cities.

**What to bold** (in priority order):
1. Numbers and statistics that matter ("**45 days**", "**1986 Loi Littoral**", "**~2–3 months**")
2. Named places at FIRST mention only ("**Méribel**", "**Cap d'Antibes**", "**the Three Valleys**")
3. COP value-claim phrasing ("**purpose-built LLC**", "**deeded share**", "**fully managed**", "**LLC membership interest**")
4. "Best for:" lines (always bolded)
5. Transition phrases that signal a key claim ("**The corollary**", "**What this means in practice**", "**The practical effect**")
6. Bullet-list lead phrases ("**Real, deeded equity in your name**", "**Consistent international structure**")

**What NOT to bold**:
- Whole sentences
- Entire paragraphs
- Common verbs/adjectives ("important", "luxury", "amazing")
- Generic country/region names already bolded earlier in the same section
- Articles ("the", "a") even when preceding a bolded noun
- Adjectives without their noun (don't bold "powdery" alone — bold "**powdery sand**")

Max ~5 consecutive words per `<strong>`. Aim for 1–3 strongs per `<p>`. Long paragraphs (5+ sentences) can have 3–4.

Verification: `grep -c "<strong>" "$FILE"` → should land in tier-appropriate range.

---

## Rule 10 — Comparison table: 3-column comparative, never 2-column absolute

The comparison table is one of the highest-value scannability moments on the page. The columns are:
1. (Empty header) — row-label column
2. Whole second home
3. COP 1/8 fractional share
4. Long-term rental

NOT a 2-column "Whole property" vs "1/8 share" with euro ranges. The 3-column form positions COP as the answer between two flawed alternatives (full ownership too expensive; rental builds no equity).

Every `<td>` value is comparative-relative, never specific currency:
- "~1/8 of the property value" not "€310,000–€1,000,000"
- "~1/8 of carry, fully managed" not "€8,000–€25,000"
- "Up to 52 weeks (most use 6–10)" — process descriptors with weeks are OK

ALWAYS include `data-col="..."` attribute on every `<td>` value cell — the mobile responsive CSS uses these as labels when the table stacks.

The COP 1/8 column gets visual prominence on mobile (gold left bar, larger value text) via the CSS — handled automatically by the existing styles in `globals.css`.

---

## Rule 11 — External links: authoritative only, ~25–40 per pillar

Every external link uses `target="_blank" rel="noopener"`.

**Allowed link types**:
- Official tourism boards (.fr/en/, .es, .it/en, .com/en/)
- Official municipality sites
- Official ski resort sites
- Official museum sites
- Official airport sites
- National parks / protected areas
- Official wine appellation bodies
- Michelin Guide regional pages
- Major cultural events (festival sites)
- Official transit (Eurostar, TGV, ICE, Renfe AVE)

**BANNED link targets**:
- Affiliate sites (clickandboat, getyourguide, viator)
- Tripadvisor (low E-E-A-T signal, often spammy)
- Disneyland / theme parks
- Knight Frank / Savills market reports
- Random blogs

External links serve SEO topical-relevance signals — quality outbound matters more than quantity.

Tier targets:
- Pillar (10k): 25–40 links
- Region (8k): 20–30 links
- City (5–6k): 12–20 links

---

## Rule 12 — Photo sourcing: Storyblok and lh3 only, never Webflow CDN

Read `references/photo-sourcing.md` for the full rules.

Quick rule: ✅ `https://a.storyblok.com/...` and `https://lh3.googleusercontent.com/d/...` URLs work. ❌ `https://cdn.prod.website-files.com/...` URLs often have spaces, parens, special characters in the filename which get truncated when copied — image won't load.

Two France images broke for this exact reason on the first build pass. Always verify the URL ends with `.jpg`, `.jpeg`, or `.png`.

---

## Rule 13 — Headings need breathing room

H2 → first paragraph margin: ~1.2rem (handled by CSS `.dest-sec h2 + p { margin-top: 1.2rem }`).
H3 → first paragraph margin: ~1rem (handled by CSS `.dest-sec h3 + p { margin-top: 1rem }`).
H2 bottom margin: 2.2rem.
H3 top margin: 2.6rem (visual section breathing).

Don't override these in inline styles — they're applied automatically. Just use `<h2>` and `<h3>` markup correctly.

---

## Rule 14 — Avoid full-bleed navy blocks in the editorial flow

The cluster nav ("Regions in {Country}") was originally deep-navy and broke the editorial cream/white band rhythm. It was redesigned to cream-band style (cream bg, white tiles with gold-tint borders, navy text) so it flows naturally as the closing band of the page.

If you're tempted to add a navy band to a destination page, DON'T. The full-bleed navy is reserved for:
- The mid-CTA (one navy band per page, controlled placement)
- The site newsletter section at the end (handled by renderer)

Everything else stays in the cream/white editorial rhythm.

---

## Rule 15 — Featured-snippet block at the top of §A is mandatory

The `<div class="dest-snippet">...</div>` block targeting "What is fractional ownership in {Destination}?" goes at the very top of §A. Every pillar/region/city page gets one. It's structured with proper Schema.org Question/Answer microdata and styled as a distinct gold-top-bordered card.

Don't skip it. It's the position-zero featured snippet target — the single highest-value SEO moment on the page.

---

## Rule 16 — Mid-CTA copy: headline + body + 2 buttons, navy band

The mid-CTA pattern is fixed:
- `<h2>` headline (one-line claim about the destination's prestige + access promise)
- `<p>` body (one sentence quantifying the offer: 6-7 weeks, 1/8 deeded share, fully managed)
- `<a class="btn btn-gold">Browse All Properties</a>` (gold CTA, bottom-left)
- `<a class="btn btn-outline">Get Updates</a>` (outline CTA, bottom-right)

The button colour overrides for navy backgrounds are in `globals.css` — don't override per-page.

---

## Rule 17 — De-duplicate cluster nav (auto-handled)

On pillar pages, three cluster-nav blocks were appearing back-to-back: §G prose links + "Regions in {Country}" navy band + "Also Explore" pills. The renderer now hides "Also Explore" automatically when `children.length > 0` (i.e., on pillar pages). Don't add §G to non-pillar pages — region/city pages get "Also Explore" siblings from the renderer.

---

## Rule 18 — Hero subtitle must be destination-specific, never the boilerplate

The original 35 of 48 destination pages all shared the identical subtitle "Not timeshare. Real deeded ownership. Luxury second homes at a fraction of the cost." NEVER use that line.

Each hero subtitle is 1–2 sentences specific to the destination, naming distinctive features and the value prop for fractional buyers.

---

## Rule 19 — No invented usage-pattern stats ("typical owner uses X days in Y")

The "How owners actually use their 45 days" callout pattern (e.g. "typical Mallorca owner uses 10–14 days in May–June, 14–18 days in July–August...") reads as fake authority. We don't actually have telemetry on usage patterns per cluster — these numbers were invented to make the callout feel data-backed.

**Banned**: any callout or paragraph that quotes specific day-count breakdowns per cluster/season as if we have usage data.

**Banned phrasings**:
- "the typical [region] owner uses X–Y days in [month range]"
- "owners across the COP network typically..."
- "data shows owners use..."

**Replacement**: skip the callout entirely. The §C seasonal H3s already cover what to do when — that's where lifestyle/season content belongs, not in a fake-stats callout.

Fix applied (2026-05-14): callout removed from both France and Spain pillars.

---

## Rule 20 — Passive on operations: let the reader assume COP runs it, but never CLAIM it

**The positioning**: COP's editorial should let the reader naturally form the impression that COP is the operator behind the properties — that's helpful for the funnel, and it matches how the buyer interacts with COP (COP's team handles their enquiry, COP's specialists give them advice, the COP-branded site is where they discovered the property). But we never make explicit false claims. The way to walk that line is **passive voice on operational details**: state what happens to the property, never specify who does it.

A reader who sees "your share is held in a purpose-built LLC, the property is professionally managed, the calendar rotates fairly among co-owners" will naturally assume that's COP doing those things. We haven't said it is, we haven't said it isn't. That's the right place to land.

What we CAN'T do is the reverse: explicitly state that COP holds/manages/operates (would be a false claim) OR explicitly state that we work with multiple partner companies behind the scenes (would expose the model and shift the framing from "luxury property collection" to "marketplace of vendors"). If a reader asks directly "do you own these properties?" — the honest FAQ answer is "we curate properties from specialist operators we've vetted, and our team handles your enquiry and recommendations" — never denied if asked, never volunteered if not.

The rule is: **never claim something false, never volunteer the agency model, always use passive voice for operational claims.**

**Banned phrasings — overclaim COP as operator** (these state COP holds/manages, which we don't):
- "COP holds your property in a..."
- "the LLC COP uses to hold..."
- "the structure COP uses across its global portfolio..."
- "COP manages..."
- "COP arranges professional management..."
- "managed by COP"
- "across every country COP operates in"

**Also banned — exposes the agency model** (these reveal COP doesn't run the property):
- "we introduce you to the right partner"
- "we connect you to our partner network"
- "across our partners" / "across multiple partners"
- "the partner behind the property" / "the partner team"
- "the management team behind the property"
- "the partner running the property"
- "the partner's resale process"
- "going direct to the property's management team"
- "we work with partner companies"
- Any phrasing that flags COP as a layer ABOVE the operator

**Replacement framings — passive, ambiguous, COP-fronted**:
- "Your {country} share is held in a purpose-built LLC..." (passive, doesn't say who runs it)
- "Every property on COP sits inside the same LLC framework..." (COP-branded inventory, no partner reveal)
- "The professional management team handles taxes, insurance, scheduling and the on-call concierge" (sounds like COP's team — leaves the reader to assume)
- "Our team can walk you through the regional differences before you make a decision" (sounds like an in-house team)
- "across COP's destinations" or "across the COP portfolio" (treats COP as the source)
- "When you decide to exit, a professional resale process is in place..." (passive — doesn't say whose)
- "regardless of which property or jurisdiction you own in" (drop "COP" qualifier)

The reader should leave the page thinking "COP has a curated portfolio of premium fractional homes across these regions, and I can talk to their specialists about which one is right for me." That's both honest (COP DOES have the inventory; the buyer DOES talk to COP's specialists) and protects the funnel.

Fix applied (2026-05-14): 10 instances across France + Spain pillars rewritten.

---

## Rule 21 — Resale is "professional resale support" with ~1 month average, never "COP-managed"

**The reality**: resale support varies by partner; COP can connect a selling owner to the partner's resale process. Average completion across the COP portfolio is ~1 month or less (partner-reported data).

**Banned**:
- "COP-managed resale path" / "COP-managed resale"
- "COP markets the share to the existing wait list"
- "the COP buyer pool"
- "COP runs the resale process"

**Replacement framing**:
- "Resale typically completes in around a month or less across the COP portfolio" (use this as the headline data point)
- "Professional resale support is available through the partner team behind each property" (passive, partner-implied, COP-helpful)
- "When you decide to exit, a professional resale process is in place — typical timeline from listing to completion is around a month or less, well below the 6-24 months that whole-property resales typically take on the open market"

The ~1 month figure is a real datapoint we have permission to use — it should appear in §F resale H3 and in the comparison table's "Time to exit" row.

Update the comparison table row:
| Time to exit | 6–24 months on the open market | **~1 month on average** (was: ~2–3 months) | End of lease term |

Fix applied (2026-05-14): Spain + France pillar resale paragraphs rewritten; comparison table updated; FAQ JSON updated.

---

## Rule 22 — COP's value-add (positioning, woven into prose — never expose the agency model)

The value to weave naturally into the editorial — without revealing that COP is a curatorial layer above multiple unnamed partners:

1. **Curated portfolio** — "the COP portfolio", "our properties", "every property we list" implies COP has the inventory. The reader doesn't need to know if COP owns it or has sourced it; the page just treats it as COP's collection.
2. **In-house expertise** — "our team", "our specialists", "COP's regional advisors" — sounds like an in-house desk a buyer can call. Don't say "we connect you to" or "we introduce you to".
3. **Quality bar** — "every property in our collection meets a defined quality bar" — does the work of "we vet our partners" without saying it.
4. **Single relationship during search + decision** — "when you're considering properties in different regions, you talk to one team about all of them" — true (COP's advisors cover everything). NOT "one team forever after purchase" — once you buy, the local management team is local to that property. Don't overclaim post-purchase unification.

**Where to mention these naturally** in the editorial:
- §A "Why {Destination}?" can reference "the curated COP collection" or "our specialist team" once
- §D "Who buys here, and why" can reference "owners building multi-region portfolios with COP" or "buyers who use our regional knowledge to match the right property to their use pattern"
- §F can mention "our team can walk you through the regional differences before you make a decision"
- §G or a soft mid-page CTA can reference "talk through your use pattern with one of our specialists"

**Don't dump all 4 as a hard-sell bullet list.** Weave them into prose at natural moments.

**Test phrase**: is every operational claim either passive ("the property is managed", "your share is held in") or COP-neutral-true ("our team can advise you", "our portfolio includes")? If yes, you're fine. If any phrasing has COP as the explicit subject doing operational work ("COP holds X", "COP manages Y", "COP operates Z"), rephrase to passive. The reader's natural assumption that COP runs it does the work — we don't need to say it explicitly.

---

## Rule 23 — Free to use for buyers — phrased without exposing the agency model

COP charges buyers nothing. Worth mentioning, but the phrasing must NOT reveal that COP is intermediated between buyer and property operator (because that's the agency reveal).

**Banned phrasings** (these expose the agency model):
- "You pay the same as you would going direct to the property's management team" (reveals COP is not the operator)
- "We earn through partner relationships, not from buyers" (reveals the partners)
- "no markup over what you'd pay going direct" (implies there's a direct path that bypasses COP)

**Allowed phrasings** (says "free" without exposing the layers):
- "**Free to browse, free to enquire** — no buyer-side fees and no obligation."
- "Using COP is **free** for buyers. Browse the listings, talk to our team, get tailored region recommendations — all without any fee or sign-up cost."
- FAQ: "Does COP charge me anything?" → "No. There are no buyer-side fees. The share price you see is the share price you pay; talking to our specialists costs nothing and carries no obligation."

Place once per pillar — either in §F as a callout, in the mid-CTA body, or as a FAQ entry. Don't over-emphasise (looks defensive); one clean mention is enough.

---

---

## Rule 24 — When David adds new feedback, append it here

Every new pillar review will surface rules we didn't anticipate. When that happens:
1. Add the new rule to this file with a clear "Banned" + "Allowed" + "Replacement" pattern
2. Add a verification grep (or visual check) to Step 8 of `SKILL.md`
3. Re-run the verification on the in-progress page if applicable

The skill should evolve with each rewrite so the next pillar starts at a higher quality bar.

---

## Quick reference: full verification checklist

```bash
FILE="content/destinations/<slug>.html"

# Rule 1 — Partner names
grep -ic "andhamlet\|vivla\|myne\|pacaso\|&Hamlet" "$FILE"     # → 0
# Rule 2 — National vehicles
grep -E "\bSCI\b|Sociedad Limitada|comunidad de bienes|Société Civile Immobilière|\bSrl\b" "$FILE"  # → no hits
# Rule 3 — Liability/risk language
grep -ic "limited liability\|personal liability\|personal assets sit cleanly\|risks stay with" "$FILE"  # → 0
# Rule 4 — Specific euros
grep -E "€[0-9]+,[0-9]{3}|€[0-9]+(\.[0-9]+)?[mk]" "$FILE"      # → no hits in copy
# Rule 5 — Inventory lock-in
grep -ci "cop focuses on\|cop offers\|cop currently has\|cop's portfolio includes\|we focus on luxury" "$FILE"  # → 0
# Rule 6 — Temperature pairing
grep -c "°F" "$FILE"   # ~ equal
grep -c "°C" "$FILE"
# Rule 7 — 1/8 standardisation
grep -c "one-eighth\|one eighth" "$FILE"                       # → 0
# Rule 9 — Strong tag count (tier-dependent)
grep -c "<strong>" "$FILE"                                     # → 80–130 for 10k pillar
# Rule 12 — Webflow URL hygiene
grep "cdn.prod.website-files.com" "$FILE" | grep -v "\.jpe\?g\b\|\.png\b" | head  # → empty
# Word count of restHtml (matches tier target ±10%)
python3 -c "
import re
html = open('$FILE').read()
body = re.search(r'<body[^>]*>([\s\S]*?)</body>', html).group(1)
mid = body.find('class=\"dest-mid-cta\"')
rest = body[mid:] if mid > 0 else body
text = re.sub(r'<[^>]+>', ' ', rest)
print('restHtml words:', len(re.sub(r'\s+', ' ', text).split()))
"
```

If any rule fails, fix before declaring done.
