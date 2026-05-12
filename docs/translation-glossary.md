# COP Translation Glossary

Locked terminology for all Spanish and French translations of property descriptions, blog posts, and marketing copy. Derived from `keyword-research-spanish.md` and `keyword-research-french.md`. **Every translation must conform to this glossary** — no synonyms, no drift.

The glossary captures three things per locale: the **primary term** (always used at first mention in a piece of content), **acceptable secondary terms** (variations after context is established), and **forbidden terms** that have negative SEO or legal connotations and must never appear.

---

## French (`fr`)

### Why this matters

`copropriété` is legally pre-loaded in French (Loi du 10 juillet 1965 — apartment building common areas). Used alone, it confuses French buyers. Prello solved this by always pairing it with `résidence secondaire` and using `à plusieurs` as the action verb. Lazazu solves it by using the verb form `co-posséder`.

### Locked terms

**Primary** — used at first mention of the product:
- `copropriété de résidence secondaire`

**Secondary** — variations once the context is established within a piece of content:
- `copropriété` (only after the full compound has appeared at least once)
- `copropriétaire` (the person)
- `quote-part de résidence secondaire`
- `co-ownership` (used in French press; acceptable as anglicism)

**Action verbs / phrases**:
- `co-posséder une résidence secondaire`
- `acheter une résidence secondaire à plusieurs`
- `acquérir une quote-part`

**Legal vehicle**:
- `SCI` (Société Civile Immobilière)
- `parts sociales`
- `acte authentique chez le notaire`
- `cadastre` (land registry)

**Consumer category anchor** (always used near the product term):
- `résidence secondaire`
- `maison de vacances` (more emotional/aspirational variant — fine in lifestyle copy)

### Forbidden terms — NEVER USE

| Term | Why forbidden |
|---|---|
| `multipropriété` | Timeshare in French — heavy negative connotation, regulated category. Only use in comparison content where we explicitly contrast it with copropriété. |
| `temps partagé` | Legal name for timeshare (Code de la consommation) — using it incorrectly could trigger consumer protection law. |
| `immobilier fractionné` | Strongly associated with crowdfunded investment platforms (Tantiem, Bricks, Baltis). Wrong audience — they're yield investors, not lifestyle buyers. |
| `propriété partagée` (alone) | Descriptive but vague; doesn't rank well. Use `copropriété de résidence secondaire` instead. |

### Place names (French exonyms)

- Spain → Espagne · Mallorca → Majorque · Menorca → Minorque · Ibiza → Ibiza
- Italy → Italie · Sardinia → Sardaigne · Liguria → Ligurie · Lake Como → Lac de Côme · Lake Garda → Lac de Garde
- USA → États-Unis · California → Californie · Florida → Floride
- England → Angleterre · London → Londres
- Austria → Autriche · Tyrol → Tyrol · Salzburg → Salzbourg
- Germany → Allemagne · Bavaria → Bavière · Berlin → Berlin
- Mexico → Mexique · Sweden → Suède · Croatia → Croatie · Portugal → Portugal · Algarve → Algarve
- Côte d'Azur stays Côte d'Azur · Paris stays Paris

---

## Spanish (`es`)

### Why this matters

`multipropiedad` carries decades of fraud association in Spain (Tribunal Supremo voided thousands of contracts). Vivla deliberately avoids the term except in comparison content. Our Spanish copy must follow the same discipline.

### Locked terms

**Primary** — used at first mention:
- `copropiedad`

**Secondary** — high-search-volume terms used as natural variations:
- `propiedad fraccionada` (highest search volume per the research; use in titles and openers)
- `copropietario` (the person)
- `participación` (the share you own)
- `fracción` (variation of the share)

**Action verbs / phrases**:
- `comprar una participación`
- `adquirir una fracción`
- `compartir una segunda residencia`

**Legal vehicle**:
- `SL` (Sociedad Limitada)
- `participaciones sociales`
- `escritura ante notario`
- `Registro de la Propiedad`

**Consumer category anchor**:
- `segunda residencia`
- `vivienda vacacional`

### Forbidden terms — NEVER USE

| Term | Why forbidden |
|---|---|
| `multipropiedad` | Timeshare in Spanish — strong negative connotation, fraud history (TS sentencias). Only use in comparison content. |
| `aprovechamiento por turno` | Legal term for timeshare (Ley 4/2012) — using it incorrectly suggests we are timeshare. |
| `propiedad compartida` (alone) | Vague; doesn't rank well. Use `copropiedad` or `propiedad fraccionada` instead. |
| `tiempo compartido` | Spanish for timeshare — same problem as `multipropiedad`. |

### Place names (Spanish exonyms)

- France → Francia · Côte d'Azur → Costa Azul · French Alps → Alpes franceses · Paris → París
- Italy → Italia · Sardinia → Cerdeña · Tuscany → Toscana · Lake Como → Lago de Como · Lake Garda → Lago de Garda
- USA → EE. UU. · California → California · Florida → Florida · New York → Nueva York
- England → Inglaterra · London → Londres
- Austria → Austria · Salzburg → Salzburgo · Tyrol → Tirol
- Germany → Alemania · Bavaria → Baviera · Berlin → Berlín
- Mexico → México · Sweden → Suecia · Croatia → Croacia
- Mallorca, Ibiza, Menorca, Formentera stay the same · Costa del Sol / Costa Blanca / Costa de la Luz stay the same

---

## Style rules (both locales)

1. **Strip all partner brand mentions** — MYNE, Vivla, Pacaso, And Hamlet, Lazazu, Prello — replace with generic descriptions. COP is an independent aggregator and cannot name partner brands on its own pages.
2. **Preserve markdown bold markers** (`**text**`) exactly. They render as visual emphasis on the property page.
3. **Tone**: upscale, factual, aspirational but grounded. Not AI-translated-sounding.
4. **Number formatting**: Spanish uses comma as decimal, period as thousands (`€100.000`). French uses space as thousands separator (`100 000 €`).
5. **Currency**: € symbol; Spanish places it before (`€100.000`), French places it after with non-breaking space (`100 000 €`).
6. **Length**: match the English description length within ~10%. Don't summarise or expand.
7. **First paragraph** of property description should naturally include the primary term at least once (per SEO best practice).

---

## Maintenance

Update this file when:
- A new keyword research pass identifies a better-ranking term
- Google Search Console data shows we're missing a high-volume term
- A new locale is added (e.g. `de` for German)

Verification: run `node scripts/verify-translations.js` after any translation batch — it checks every translated row in Supabase for forbidden terms and prints a report.
