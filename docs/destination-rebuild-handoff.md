# Handoff prompt — destination page rebuild

*Open a new Cowork chat on the `~/code/cop-next` workspace folder and paste
everything below the line into it. Then follow the England-first quality gate.*

---

You are continuing work on **co-ownership-property.com** (repo: the Cowork
workspace folder, `~/code/cop-next`). The job is to **rebuild the weak
destination editorial pages to the gold standard, then translate them.**

## Skills — read these first, do not skip

The repo contains two skills built specifically for this work. Read every file
before writing anything:

- `skills/destination-page-rewrite/SKILL.md` + `references/editorial-rules.md`,
  `references/section-template.md`, `references/photo-sourcing.md`
- `skills/destination-page-translate/SKILL.md` + `references/block-translations.md`,
  `references/de-conventions.md`, `references/es-conventions.md`,
  `references/fr-conventions.md`, `references/routing.md`

They encode 12+ rounds of feedback. Follow them exactly — do not improvise the
structure, the section order, the markup classes, or the editorial rules.

Also read `docs/destination-pages-audit.md` — the word-count baseline for all
50 destination pages.

## What "the gold standard" means — and the word-count target

The strong live pages — **France, Spain, Italy, Paris, Lake Como, Costa del
Sol, South of France** — run **10,000–14,000 words** with a consistent
structure (≈9 H2 sections, ≈19 H3 sub-sections) and the full §A–§G template.

**IMPORTANT — word-count override:** the rewrite skill's Step 0 lists
conservative tier targets (10k / 8k / 5–6k). **Ignore the lower numbers.**
David's instruction is that *every* rebuilt page must match the best live
pages. **Target 10,000–13,000 words for every page**, never below 9,500. Open
the named strong page as a template and match its structure, depth and idea
density section by section. The skill's *structure and rules* are followed
exactly — only the length target is raised.

## PHASE 1 — Rebuild the English pages (`destination-page-rewrite`)

For each page: follow the rewrite skill end to end. Open the named template
page, mirror it, swap in destination-specific content, run all 10 verification
greps from the skill's Step 8.

### 1a — England first (a single page — quality gate)

Rebuild **`content/destinations/england-fractional-ownership-properties.html`**
(currently 3,487 words → 10,000+). Template:
`content/destinations/france-fractional-ownership-properties.html`.

Then **STOP. Hand it to David for review. Do not start anything else until he
approves it.** His feedback becomes new rules in
`skills/destination-page-rewrite/references/editorial-rules.md`.

### 1b — Remaining country pillars (only after England is approved)

Template: `france-fractional-ownership-properties.html`. Full §A–§G, 10,000+
words. Dispatch in parallel batches of 3–4 agents:

- `mexico-fractional-ownership-properties.html` (3,706 words)
- `germany-fractional-ownership-properties.html` (5,698)
- `austria-fractional-ownership-properties.html` (5,620)
- `croatia-fractional-ownership-properties.html` (5,601)
- `sweden-fractional-ownership-properties.html` (5,547)

### 1c — US pages

Templates: for the three state pages use a strong region page
(`french-alps-fractional-ownership-properties.html` or
`costa-del-sol-fractional-ownership-properties.html`); for the city pages use
a strong city page (`paris-`, `lake-como-` or `miami-`). Batches of 3–4.

US states (currently mid-depth → 11,000+):
`california` (5,995) · `colorado` (7,257) · `utah` (7,451)

US cities (currently very thin → 11,000+):
`aspen` (1,868) · `vail` (1,460) · `breckenridge` (1,653) ·
`lake-tahoe` (1,679) · `palm-springs` (1,612) · `park-city` (1,676) ·
`newport-beach` (1,550) · `malibu-santa-barbara` (1,571) ·
`napa-sonoma` (1,269) · `30a` (1,357) · `florida-keys` (1,679) ·
`brickell` (2,621)
*(Use the exact filenames from `content/destinations/` — some have longer
slugs, e.g. `napa-sonoma-fractional-ownership-wine-country-estates.html`.)*

### 1d — New US state pages (states with listings but no page yet)

These US states have COP properties but **no destination page at all** —
create them from scratch. Same `destination-page-rewrite` skill, ~10,000+
words, template a strong region page (`french-alps-` or `costa-del-sol-`).

For a brand-new page you must also **register the slug** so the route
resolves — add an entry to **both** the `DEST_FILTERS` map in
`pages/[slug].js` and the `DESTINATIONS` map in `lib/destinations.js`, copying
the format of the existing `california-fractional-ownership-properties` entry.
The renderer builds the route automatically once the content file exists and
the slug is registered.

- `south-carolina-fractional-ownership-properties.html` — **22 properties**
  (Kiawah Island and others — the biggest gap; do this one first)
- `wyoming-fractional-ownership-properties.html` — 5 properties (Jackson Hole)
- `arizona-fractional-ownership-properties.html` — 4 properties (Scottsdale, Sedona)
- `nevada-fractional-ownership-properties.html` — 3 properties (Lake Tahoe, Reno)

Filter pattern for each: `{ country: "USA", region: "<State>" }`.

*(Oregon, New Jersey and Massachusetts have only one property each — too thin
for a dedicated page. Revisit when their inventory grows.)*

When all of Phase 1 is done, report every page's word count and verification
results to David in a table.

## PHASE 2 — Translations (only after David approves the English)

The 6 country pages already have DE/ES/FR files, but they are translations of
the **old thin English** and are now stale — every one must be redone once its
English is rebuilt. Use `destination-page-translate`:

- For each rebuilt country page, redo `content/destinations/{de,es,fr}/{slug}.html`.
- Use `references/block-translations.md` for the shared blocks and the
  `{de,es,fr}-conventions.md` files for voice and vocabulary.
- Dispatch in batches of 3–4. After writing each file, HEAD-check every image
  URL returns 200.
- Then add any new slugs to `lib/i18n.js` DESTINATION_AVAILABILITY and update
  the homepage destination tabs per `references/routing.md`.

US page translations: skip for now unless David asks.

## Gotchas — honour every one

- **Do NOT `git push` from the sandbox** — there is a FUSE permission issue.
  Save the files and tell David to push from his terminal.
- **Images:** use Storyblok (`a.storyblok.com`) or Google Drive `lh3`
  URLs **only** — never Webflow CDN (`cdn.prod.website-files.com`, the
  filenames truncate). Every `<img>` needs `width` and `height` attributes.
  **HEAD-check every image URL returns 200 before declaring a file done** —
  hallucinated image URLs have slipped through before.
- **Never mention partner names** — Pacaso, MYNE, Vivla, &Hamlet. Zero
  occurrences.
- **LLC framing only** — never SCI / SRL / Sociedad Limitada, never
  liability-protection language, never specific euro carry-cost guesses. Full
  rules in `editorial-rules.md`.
- **Use the existing FAQ entries** in `lib/destination-faqs.json` — do not
  modify them.
- **Word-count spot check every file** before moving on — flag anything under
  9,500 words and deepen it.
- **Batches of 3–4 parallel agents, never more** — larger batches cause some
  agents to silently produce short or incomplete files. Verify each batch
  before starting the next.

## Model note

Sonnet is fine for this — the skills are highly prescriptive, so the model is
following a detailed recipe rather than inventing structure. The safeguards
that keep quality high are: the 10 verification greps, the 9,500-word floor,
and David reviewing the England page before the rest of the batch runs.

---

*After everything lands, David pushes with `git push origin main` from his
terminal, and Vercel auto-deploys.*
