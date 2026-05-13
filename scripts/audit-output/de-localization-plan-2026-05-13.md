# German (DE) Localization — Competitive Brief + Build Plan

**Date:** 13 May 2026  
**Source:** Direct analysis of myne-homes.com German pages (myne is the most established German-market fractional ownership operator; using their site as competitive intel only — per project rule, their brand name will not appear anywhere in user-facing content). Plus broader keyword research from Bellevue, Sunny Homes, Lazazu, Imperial Properties, Palmallorca.

---

## Part 1 — German market intelligence

### Primary keywords (highest commercial intent)

| German term | English equivalent | Notes |
|---|---|---|
| **Ferienimmobilie** | Vacation property | THE dominant keyword. Use everywhere. Much more natural in German than "Zweitwohnung". |
| **Ferienimmobilie kaufen** | Buy vacation property | Action-led search query |
| **Miteigentum** | Co-ownership | Legal German term (Bürgerliches Gesetzbuch defines it) — use freely |
| **Co-Ownership** | (kept as English loan) | Germans actually search for this in English |
| **Anteilskauf** | Share purchase | Formal/financial framing |
| **Bruchteilseigentum** | Fractional title | Strict legal term for the share structure |
| **Traumimmobilie / Traum-Ferienimmobilie** | Dream (vacation) property | Marketing register |
| **1/8 der Kosten** | 1/8 of the cost | Standard share-economics framing |

### Secondary terms / supporting vocabulary

- **Zweitwohnsitz** — second residence (broader, less commercial)
- **Ferienhaus** — vacation house (specifically house, not apartment)
- **Ferienwohnung** — vacation apartment
- **Professionell verwaltet** — professionally managed
- **Rundum-Sorglos-Service** — turnkey/all-inclusive service (very German marketing phrase)
- **Smarter Eigentum** — smart ownership
- **Erfüllen Sie sich den Traum** — fulfil your dream (formal Sie register — important for the buyer demographic)

### Top destinations for German buyers

Ordered by competitor inventory weighting:

| Country (DE) | Sub-regions (DE) | Notes |
|---|---|---|
| **Spanien** | Mallorca, Ibiza, Teneriffa, Costa del Sol | Mallorca is overwhelmingly dominant for German buyers |
| **Italien** | Gardasee, Comer See, Lago Maggiore, Sardinien, Toskana | Northern lakes are huge for German buyers; southern is smaller share |
| **Österreich** | Tirol, Salzburger Land | Year-round Alpine — important segment |
| **Deutschland** | Ostsee, Nordsee, Sylt | Domestic vacation property — Sylt particularly prestigious |
| **Frankreich** | Côte d'Azur, Französische Alpen | Smaller share than Italian/Spanish for German buyers |
| **Portugal** | Algarve | Growing share |

### Legal & tax framework German buyers care about

- **Grunderwerbsteuer** (transfer tax) — varies by Bundesland: 3.5% (Bayern) to 6.5% (most others). Critical content for any German page covering acquisition costs.
- **Notarkosten + Grundbuchgebühren** (~1.5–2% combined)
- **KVDG (Kurzzeitvermietungs-Daten-Gesetz)** — new short-term rental registration law from 20 May 2026; affects any page mentioning rental income
- **AfA (Absetzung für Abnutzung)** — depreciation; relevant to investment-framed content
- **Erbschaftsteuer** (inheritance tax) — Germany taxes worldwide estates of German-domiciled deceased; major buyer concern
- **BGB §§ 741–758** — Civil Code provisions on Miteigentum (the legal basis for shared title)
- **GmbHG** — Limited liability company act (relevant if the holding structure is a German GmbH)

### Tone & register

German real-estate buyer copy uses formal **Sie** address (not informal "du"). Sentences are typically longer and more substantive than UK English equivalents. Bullet points with checkmark glyphs (✔) are common in meta descriptions. Numbers stay in numeric form (1/8 not "ein Achtel").

---

## Part 2 — URL structure (matching the existing /es and /fr pattern)

| Page | URL slug |
|---|---|
| Homepage | `/de/` |
| Properties listing | `/de/immobilien/` |
| How it works | `/de/so-funktionierts/` |
| About us | `/de/ueber-uns/` |
| Blog index | `/de/blog/` |
| Contact | `/de/kontakt/` |
| Favourites | `/de/favoriten/` |
| Pillar concept page (SEO anchor) | `/de/miteigentum-ferienimmobilie/` |
| Buying FAQs | `/de/ferienimmobilie-kaufen-haeufige-fragen/` |
| Staying FAQs | `/de/aufenthalt-ferienimmobilie-haeufige-fragen/` |
| Property detail | `/de/immobilien/[slug]/` |
| Blog post | `/de/blog/[slug]/` |
| Destination index | `/de/destinationen/[slug]/` |

Notes on slugs:
- `/de/immobilien/` not `/de/eigenschaften/` — Germans search "Ferienimmobilie" not "Ferienhaus-Eigenschaften"
- `/de/so-funktionierts/` (single word "funktionierts", with apostrophe-elided "es") — matches German convention; also matches what competitor URLs use
- `/de/ueber-uns/` uses "ue" not "ü" for URL safety
- `/de/destinationen/` for destination index (Germans use "Destination" or "Reiseziel"; "Destinationen" reads more polished)

---

## Part 3 — Pillar / SEO content

Like the ES/FR build, German needs at least one deep pillar page commissioned for SEO (4,000–6,000 words). Recommended: **`/de/miteigentum-ferienimmobilie/`** — covering:

1. Was ist Miteigentum bei Ferienimmobilien?
2. Co-Ownership vs. Timesharing — der entscheidende Unterschied
3. So funktioniert der Anteilskauf rechtlich (BGB, GmbH-Struktur)
4. Steuerliche Aspekte (Grunderwerbsteuer, AfA, Erbschaftsteuer)
5. Top-Destinationen für deutsche Käufer (Mallorca, Toskana, Tirol, Sylt)
6. Kosten-Vergleich: Vollkauf vs. 1/8-Anteilskauf
7. Verwaltung & Wartung (Rundum-Sorglos-Service)
8. Wiederverkauf & Wertentwicklung
9. Häufige Fragen

Plus 3–5 supporting SEO blog posts targeting specific high-intent queries:
- "Ferienimmobilie auf Mallorca im Anteilskauf"
- "Miteigentum vs. Timesharing — Vergleich 2026"
- "Co-Ownership Steuern Deutschland — was Käufer wissen müssen"
- "Ferienhaus Toskana im Miteigentum kaufen"
- "Sylt Ferienimmobilie als Co-Ownership"

---

## Part 4 — Technical build plan

Mirror the ES/FR architecture exactly. Estimated sequence + effort:

### Phase A — Translation infrastructure (4–6 hours)

1. **`messages/de.json`** — translate every key from `messages/en.json` (~200+ strings)
   - Use formal Sie register throughout
   - Adapt nav labels, form copy, FAQ block, footer, autoreply email
2. **`lib/i18n.js`** — add `de` to `SUPPORTED_LOCALES`; add ROUTE_MAP entries for every locale-mapped page; add `PROPERTY_URL_PREFIX.de = '/de/immobilien'`; update `localeFromPath()` (already handles arbitrary locales via the SUPPORTED_LOCALES check)
3. **`components/Header.js`** — add `de` nav array with German URLs
4. **`components/Footer.js`** — verify German fallback / add German footer copy
5. **`pages/sitemap.xml.js`** — add `de` to PAGE_GROUPS, DESTINATION_GROUPS, property/blog URL emission
6. **Database** — add `title_de`, `subtitle_de`, `excerpt_de` columns to `properties` and `posts` tables (matching the existing `title_es`, `title_fr` pattern)
7. **`scripts/translate-content.js`** — extend to populate `_de` columns via Anthropic API (the existing script handles ES + FR, just needs DE added to the locale loop)

### Phase B — Page scaffolding (3–4 hours)

8. Create `pages/de/index.js` — German homepage (mirror `pages/es/index.js`)
9. Create `pages/de/immobilien.js` — properties listing (mirror `/es/propiedades.js`)
10. Create `pages/de/immobilien/[slug].js` — property detail (mirror existing locale wrapper pattern)
11. Create `pages/de/so-funktionierts.js`, `pages/de/ueber-uns.js`, `pages/de/kontakt.js`, `pages/de/blog/index.js`, `pages/de/blog/[slug].js`
12. Create `pages/de/favoriten.js` (matching the ES/FR favourites wrapper pattern)
13. Create the German FAQ pages: `pages/de/ferienimmobilie-kaufen-haeufige-fragen.js` + `pages/de/aufenthalt-ferienimmobilie-haeufige-fragen.js`

### Phase C — Pillar + SEO content (commissioned writing, 8–12 hours)

14. **Pillar page** at `pages/de/miteigentum-ferienimmobilie.js` — 4,000+ words of German-language commercial content covering all 9 sections above
15. **3–5 SEO blog posts** in `lib/posts.json` with German-only entries (categories: pillar destination, comparison, tax)

### Phase D — Translation backfill (1–2 hours runtime)

16. Run `node scripts/translate-content.js --locale=de` to populate `_de` columns on all existing properties and blog posts (Claude Sonnet via Anthropic API; ~$5–8 estimated cost)
17. Translate the existing 106 destination-specific FAQs into German (this is the biggest single content task — could be done programmatically via the same translate script, or hand-written for the highest-traffic 30 posts)

### Phase E — Search Console + indexing (10 minutes per day for 1 week)

18. Submit the new `/de/` priority URLs to Google Search Console (rolling 24h quota of ~10 per day)
19. Verify hreflang triplets in the sitemap (en/es/fr/de × every page-group entry)
20. Add German to language switcher UI (already structurally supports it — just renders "DE")

---

## Part 5 — What this is NOT

- This plan does NOT mention any partner brand name in any user-facing content. The MYNE analysis was internal competitive intel only.
- This plan does NOT include translation of all 106 existing destination FAQs to German by hand; doing that programmatically via the existing translate-content.js script is the faster path. The hand-written work was the original ES/FR pattern but quality-vs-speed analysis suggests automated translation with light editorial review is better here.
- This plan does NOT include separate German-only blog posts beyond the SEO anchor set; the bulk of the blog corpus serves all locales via translated chrome around English bodies (matching the existing pattern).

---

## Recommended starting order

If you want to ship the German build incrementally:

1. **Week 1:** Phase A (infrastructure) + the homepage + properties listing → live German shell exists, navigable, but minimal content depth
2. **Week 2:** Phase B (remaining pages) + Phase D translation backfill → all property/blog content available in German
3. **Week 3:** Phase C (pillar + SEO posts) → ranking-targeted content lands
4. **Week 4:** Phase E (indexing requests + monitoring) → start tracking position in German Search Console

Alternatively, do all of Phase A in a single long session today and have the German shell ready to populate iteratively.

---

## Sources (internal reference, not for publication)

Competitive analysis informed by:
- myne-homes.com/de pages (URL structure, German vocabulary)
- bellevue.de articles on Co-Ownership and Miteigentum
- Sunny Homes, Lazazu, Imperial Properties, Palmallorca German pages
- Mallorca Magazin coverage of fractional ownership
- German legal/tax sources for Grunderwerbsteuer 2026, KVDG 2026, BGB Miteigentum provisions

None of these sources should be cited in any published German page — they were used purely to establish keyword targeting, URL conventions, and topical framing.
