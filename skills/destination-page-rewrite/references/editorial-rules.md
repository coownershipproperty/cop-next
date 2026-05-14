# Editorial rules — every do/don't established through David's France pillar feedback

This is the running catalogue of editorial principles. Every rule here was earned through a specific feedback round on the France pillar build (May 2026). Append new rules here whenever a new rewrite surfaces feedback we didn't anticipate.

---

## Rule 1 — NEVER mention partner names

**Banned words anywhere in the file**: `&Hamlet`, `andhamlet`, `Vivla`, `Myne`, `Pacaso`.

The site is COP's own editorial voice, not a partner aggregator. Properties are presented as "COP curates" or "the COP portfolio". The legal/operational structure is COP's.

Verification grep: `grep -ic "andhamlet\|vivla\|myne\|pacaso\|&Hamlet" "$FILE"` → must return 0.

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

## Rule 19 — When David adds new feedback, append it here

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
