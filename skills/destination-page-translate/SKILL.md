---
name: destination-page-translate
description: >
  Translate a destination editorial page on co-ownership-property.com from English into
  German, Spanish or French following the exact conventions established for each market —
  MYNE-style wording for German, Vivla-style for Spanish, Prello/luxury-French-real-estate
  conventions for French (and post propriété→bien swap). Use this skill whenever David asks
  to translate, localise or "do the {DE|ES|FR} version of" a destination page (e.g. "translate
  the Spain pillar to German", "do the FR version of USA"). Covers the country pillars
  (~10k words), regions (~8k) and cities (~5–6k). The translated HTML files live at
  content/destinations/{locale}/<slug>.html with locale-specific slugs (espana / espagne /
  spanien etc). The skill also documents the routing setup needed for /es/destinos/<slug>/,
  /fr/destinations/<slug>/ and /de/destinationen/<slug>/.
---

# Destination Page Translate — DE / ES / FR localisation of pillar pages

This skill translates destination editorial HTML files from EN into DE, ES or FR with
locale-correct wording, tone, formal/informal pronoun choice, real-estate terminology,
and currency/distance/temperature conventions. It complements `destination-page-rewrite`,
which builds the EN source.

**Always read these references before starting:**
- `references/de-conventions.md` — German wording, MYNE conventions, Sie/du, Immobilien/Bien
- `references/es-conventions.md` — Spanish wording, Vivla conventions, casas not propiedades, tú vs usted
- `references/fr-conventions.md` — French wording, biens not propriétés (sweep already done), Prello/luxury conventions
- `references/block-translations.md` — pre-translated reusable blocks (LLC mechanics, comparison table, snippets, "ownership at a glance")
- `references/routing.md` — slug map per locale + dynamic-route setup for non-DE locales

The renderer per locale handles cluster nav, hreflang, breadcrumbs, TOC injection, and
FAQ rendering automatically. You only author the translated body HTML between `<body>...</body>`
plus the `<title>` and `<meta description>`.

---

## Step 0 — Confirm scope before translating

Ask David two things if not already obvious:
1. **Which destination?** (slug from `content/destinations/<slug>.html`)
2. **Which locale(s)?** DE, ES, FR, or all three?

If David says "all three", proceed in this order: DE → ES → FR. (DE often has the most
existing scaffolding; ES needs new routing alongside the page; FR last because the
propriété→bien sweep is already in the corpus and you want to be careful not to leak
"propriétés" back in.)

---

## Step 1 — Read the EN source

Read the entire `content/destinations/<slug>.html` from the EN pillar. Note:
- The 5 H3 cluster names in §B (these need locale-correct city names)
- The 4 seasonal H3s in §C
- The persona bullets in §D
- The country-specific tax/inheritance terms in §E and §F (these may already be
  in the local language — IMU, IBI, IMI, FIRPTA — and stay untouched in translations)
- The "Still deciding which X region?" cluster links in §G

---

## Step 2 — Apply the locale conventions

Read the relevant `references/{locale}-conventions.md` carefully. Each file documents:
- Formal vs informal address (Sie/du, vous/tu, usted/tú)
- Real estate terminology (Immobilie vs Bien vs Propiedad vs Casa)
- "Co-ownership" / "fractional" terminology (Miteigentum vs Copropriété vs Copropiedad)
- "1/8 share" phrasing
- Currency, temperature, decimal-comma conventions
- Tone: how MYNE/Vivla/Prello/luxury-real-estate brands address the reader
- Banned vocabulary (e.g. NEVER write "propriétés" in FR — use "biens")

---

## Step 3 — Use the pre-translated blocks

Read `references/block-translations.md`. About 50–60% of each pillar is structurally
identical content that has been pre-translated once per language for consistency:

- The "What is fractional ownership in {Destination}?" featured snippet
- The §A LLC framing paragraph + "LLC in one line" callout
- The §A international competitive context paragraph
- The §C intro paragraph
- The §D opening paragraph + persona bullets
- The §E intro paragraph + comparison table (including all `<th>` and `<td>` content + `data-col` attributes)
- The §E service charge paragraph
- The §E "what you actually own" paragraph
- All of §F's structural subsections (LLC framework, tax, inheritance, management calendar, resale, "free to browse" callout, "Your ownership at a glance" 5-bullet list)
- The §G "Still deciding which {Country} region?" template

You SUBSTITUTE the country-specific bits inside these blocks (tax names, registry names,
adjective endings, country/destination names) but keep the rest verbatim from the
pre-translated block. This guarantees terminology consistency across all 5 destination
pillars in each language.

---

## Step 4 — Translate the destination-specific content

The destination-specific content (the things that genuinely differ per pillar) is:
- Hero subtitle (1–2 destination-specific sentences)
- Mid-CTA headline + body
- §A "Why {Destination}?" 5–7 paragraphs about what makes this country distinctive
- §B 4–5 cluster H3s with their full descriptions, "Best for:" lines, and figures
- §C 4 seasonal H3s with destination-specific events, weather, festivals
- §D country-specific buyer-mix paragraphs and persona detail
- §E "Airports and ground access" with IATA codes and direct-route narration
- §F country-specific tax and inheritance narration (IMU, IBI, IMI, FIRPTA, etc.)
- §G "Still deciding" 3 paragraphs + cluster links

For these, translate organically using the locale conventions but stay close to the
EN source. Don't paraphrase wildly. Names of places (Vilamoura, Aspen, Comporta, Tuscany)
stay in their local-language form (Toscana in IT/ES, Toscane in FR, Toskana in DE).

---

## Step 5 — Locale-correct destination & cluster names

| EN | DE | ES | FR |
|----|----|----|----|
| Spain | Spanien | España | Espagne |
| France | Frankreich | Francia | France |
| Italy | Italien | Italia | Italie |
| United States / USA | Vereinigte Staaten / USA | Estados Unidos | États-Unis |
| Portugal | Portugal | Portugal | Portugal |
| Tuscany | Toskana | Toscana | Toscane |
| Sardinia | Sardinien | Cerdeña | Sardaigne |
| Sicily | Sizilien | Sicilia | Sicile |
| Florence | Florenz | Florencia | Florence |
| Milan | Mailand | Milán | Milan |
| Mallorca | Mallorca | Mallorca | Majorque |
| Ibiza | Ibiza | Ibiza | Ibiza |
| Menorca | Menorca | Menorca | Minorque |
| Canary Islands | Kanarische Inseln | Islas Canarias | Îles Canaries |
| Pyrenees | Pyrenäen | Pirineos | Pyrénées |
| Madrid | Madrid | Madrid | Madrid |
| Barcelona | Barcelona | Barcelona | Barcelone |
| French Alps | Französische Alpen | Alpes franceses | Alpes françaises |
| Côte d'Azur | Côte d'Azur | Costa Azul | Côte d'Azur |
| Paris | Paris | París | Paris |
| Rocky Mountains | Rocky Mountains | Montañas Rocosas | Rocheuses |
| California | Kalifornien | California | Californie |
| Florida | Florida | Florida | Floride |
| Aspen | Aspen | Aspen | Aspen |
| Algarve | Algarve | Algarve | Algarve |
| Lisbon | Lissabon | Lisboa | Lisbonne |
| Madeira | Madeira | Madeira | Madère |
| Comporta | Comporta | Comporta | Comporta |
| Porto | Porto | Oporto | Porto |
| Douro Valley | Douro-Tal | Valle del Duero | Vallée du Douro |

City and resort names that are commonly kept untranslated even in target languages
(e.g. Vilamoura, Quinta do Lago, Aspen, Vail, Park City, Newport Beach) stay as-is.

---

## Step 6 — Slug naming (URL paths)

Slugs use locale-appropriate forms with hyphens, no accents. See `references/routing.md`
for the full map. Examples:

| EN slug | DE slug | ES slug | FR slug |
|----|----|----|----|
| spain-fractional-ownership-properties | spanien | espana | espagne |
| france-fractional-ownership-properties | frankreich | francia | france |
| italy-fractional-ownership-properties | italien | italia | italie |
| usa-fractional-ownership-properties | usa | estados-unidos | etats-unis |
| portugal-fractional-ownership-properties | portugal | portugal | portugal |

Note: DE/ES/FR slugs are SHORT (just the country name) because the rest of the URL
already encodes the page family (/de/destinationen/, /es/destinos/, /fr/destinations/).
The EN slug carries "fractional-ownership-properties" because EN destinations live at
the root /<slug>/.

---

## Step 7 — File and routing setup

**DE** — files live at `content/destinations/de/<slug>.html` and are served by
`pages/de/destinationen/[slug].js` (already exists).

**ES** — files live at `content/destinations/es/<slug>.html`. The dynamic route
`pages/es/destinos/[slug].js` may need to be CREATED if it doesn't exist (see
`references/routing.md` for the boilerplate — it mirrors the DE route handler).

**FR** — files live at `content/destinations/fr/<slug>.html`. The dynamic route
`pages/fr/destinations/[slug].js` may need to be CREATED if it doesn't exist (same
pattern as ES).

Always `mkdir -p content/destinations/{locale}/` before writing the file.

---

## Step 8 — Verify before declaring done

Run these grep checks against the translated file:

```bash
FILE="content/destinations/{locale}/<slug>.html"

# 1. No EN leftover (very basic — flag any obvious untranslated phrases)
grep -ic "fractional ownership in" "$FILE"            # should be 0 in DE/ES/FR
grep -ic "is held inside a purpose-built LLC" "$FILE" # should be 0 (has been translated)

# 2. Locale-specific banned vocabulary
# FR: NEVER "propriétés" (we use "biens")
[ "{locale}" = "fr" ] && grep -ic "propriétés\|propriété" "$FILE"  # → 0 (except inside copropriété/propriétaire)

# ES: NEVER "propiedades" if Vivla style — prefer "casas/viviendas"
[ "{locale}" = "es" ] && grep -ic "propiedades" "$FILE"  # ideally low

# DE: NEVER "Eigentum" alone for fractional shares — prefer Miteigentum
[ "{locale}" = "de" ] && grep -ic "alleiniges Eigentum\|Volleigentum" "$FILE"  # OK if comparing whole-property

# 3. Partner names — must always be 0
grep -ic "andhamlet\|vivla\|myne\|pacaso" "$FILE"  # → 0

# 4. SCI / SRL / Sociedad Limitada — banned in all locales (LLC framing)
grep -E "\bSCI\b|Sociedad Limitada|\bSrl\b" "$FILE"  # → empty

# 5. 1/8 standardisation
grep -c "1/8" "$FILE"                       # > 5 expected
grep -ci "ein achtel\|un huitième\|un octavo" "$FILE"  # ideally 0

# 6. °C and °F balance
grep -c "°C" "$FILE"
grep -c "°F" "$FILE"  # should be roughly equal (we keep °F in parens for any audience)

# 7. Word count vs source EN file (should be within 90–115% of EN — translations
#    naturally vary in length per language: DE often 5–10% longer, FR 10–15% longer,
#    ES 5% longer)
python3 -c "
import re
en = open('content/destinations/<en-slug>.html').read()
loc = open('content/destinations/{locale}/<slug>.html').read()
for label, html in [('EN', en), ('{locale}', loc)]:
    body = re.search(r'<body[^>]*>([\s\S]*?)</body>', html).group(1)
    text = re.sub(r'<[^>]+>', ' ', body)
    text = re.sub(r'\s+', ' ', text).strip()
    print(label, len(text.split()))
"
```

If anything is off, fix before declaring done.

---

## Step 9 — Commit and push

```bash
cd /Users/didiolsson/code/cop-next
git add content/destinations/{locale}/<slug>.html [pages/{locale}/destinos|destinations|destinationen/[slug].js if new]
git commit -m "destinations: translate {Destination} pillar to {LOCALE} via destination-page-translate skill ({word_count} words, {N} clusters in §B, {locale}-conventions applied — {key locale points})"
bash scripts/deploy-push.sh
```

Then ask David to review the live page and flag any feedback (which becomes a new rule
in the conventions file so the next translation avoids the same issue).

---

## When David adds new feedback rounds

If a translation review surfaces a wording, idiom or cultural-tone issue, append it to
the relevant `references/{locale}-conventions.md` AND if it's a banned-word issue add
a verification grep to Step 8. The skill should evolve with each translation so the next
pillar starts at a higher quality bar.
