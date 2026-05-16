# French (FR) translation conventions for destination pillars

Reference brand: **Prello** (the French fractional second-home startup, prello.com if
reachable; immomatin.com / Les Échos articles for tone). Backed up by the established
luxury French real-estate vocabulary used by Sotheby's France, Knight Frank France,
Daniel Féau, and Belles Demeures.

This file also draws on our existing FR pages (`pages/fr/`, `messages/fr.json`) — note
that the **propriété → bien sweep** has already been applied across the entire FR corpus
(commit 5237a30). Translations from EN must NOT re-introduce "propriété(s)" except in the
preserved legal terms (see Banned Vocabulary below).

---

## Form of address

**"Vous" (formal)** throughout — never "tu". Luxury French real estate uses vous
universally; switching to tu is unthinkable in this segment. Our existing FR corpus uses
vous everywhere.

Examples:
- ✅ "Votre part est détenue dans une LLC" — your share is held in an LLC
- ✅ "Vous recevez environ 45 jours d'utilisation personnelle par an"
- ❌ "Ta part..." (avoid)
- ❌ "Tu reçois..." (avoid)

Possessives: "votre bien", "votre part", "vos vacances".

---

## Real estate terminology

| EN | FR preferred | Notes |
|---|---|---|
| property / second home | **bien** / **bien immobilier** / **résidence secondaire** | **NEVER "propriété(s)"** in body copy. Sotheby's France, Knight Frank France, Daniel Féau, Belles Demeures all use "biens". "Propriété" carries strong "grand estate / chateau grounds" connotations in French and feels mismatched with mixed apartment/villa/chalet portfolios. EXCEPTION: legal terms below |
| holiday home | **résidence secondaire** / **maison de vacances** | "résidence secondaire" is the dominant French term and what Prello / Les Échos / Immomatin use exclusively for this category |
| co-ownership / fractional ownership | **copropriété** | THE term. Note: "copropriété" in French has BOTH meanings — the Anglo "co-ownership" sense AND the French legal-condominium sense (a building owned by multiple unit-owners). Context disambiguates. Our pages use copropriété for the fractional sense throughout. NEVER touch the word "copropriété" — it's the brand's core term. |
| co-owner | **copropriétaire** | NEVER touch this word in the propriété→bien sweep — it's "owner", not "property" |
| share (1/8 share) | **part** / **fraction** / **1/8 (un huitième)** | "une part de 1/8" or "votre part 1/8". Prello article uses "acquérir les parts" — "part" is the standard term for a fractional share in French |
| owner | **propriétaire** | "owner" — different word from "property"; never affected by the propriété→bien rule |
| villa | **villa** | unchanged |
| chalet | **chalet** | unchanged |
| apartment | **appartement** | unchanged |
| LLC | **LLC** | keep as-is. Spell out as **Limited Liability Company** on first mention if introducing the concept. NEVER use a French equivalent (SCI / SARL / SCCV) — those are different French legal vehicles. We use the international LLC framework |
| land registry | **service de la publicité foncière** / **conservation des hypothèques** | the French land-registration system. For our pages just say "le registre foncier compétent" generically when describing other countries' equivalents |
| operating agreement | **accord d'exploitation de la LLC** / **statuts de la LLC** | |
| professional management | **gestion professionnelle** | |
| service charge | **charges annuelles** / **forfait de gestion annuel** | "charges annuelles" reads cleanly |
| resale | **revente** | the standard term |
| deeded share / real equity | **part actée** / **véritable patrimoine immobilier** | reinforces "this is real property, not a timeshare" |
| timeshare / multipropriété | **multipropriété** (primary), **timeshare** (English loan, mention once per section) | See "Timeshare positioning" section below — we now use this word HEAVILY as strategic contrast, not just in the snippet line. |
| rotation calendar | **calendrier de rotation équitable** | |
| concierge | **conciergerie** / **concierge** | both work |
| equity | **patrimoine** / **capital** / **plus-value** | "patrimoine" for general capital/wealth context |

---

## Co-ownership-specific phrasings

- **"deeded 1/8 share of a luxury second home"** → "une part actée de 1/8 d'une résidence secondaire de luxe"
- **"held in a purpose-built LLC alongside seven other co-owners"** → "détenue au sein d'une LLC créée spécifiquement à cet effet aux côtés de sept autres copropriétaires"
- **"approximately 45 days of personal use per year"** → "environ 45 jours d'utilisation personnelle par an"
- **"fair-rotation calendar"** → "calendrier de rotation équitable"
- **"professional management team"** → "équipe de gestion professionnelle"
- **"real, recorded property equity"** → "véritable patrimoine immobilier acté à votre nom"
- **"not a timeshare, not a holiday club"** → "ce n'est ni de la multipropriété, ni un timeshare, ni un club de vacances" (include both terms — MYNE-style timeshare-contrast positioning)
- **"fully managed"** → "entièrement géré" / "gestion intégrale"
- **"6–7 weeks of personal use a year"** → "6 à 7 semaines d'utilisation personnelle par an"
- **"single international portfolio relationship"** → "une seule relation internationale pour votre portefeuille"
- **"~1 month on average"** → "environ un mois en moyenne"
- **"free to browse, free to enquire"** → "Consultation libre, contact libre" or "L'exploration et la prise de contact sont sans engagement"

---

## Timeshare positioning (MYNE-style strategic contrast — IMPORTANT)

MYNE leads heavily on a "this is NOT timeshare" framing because (a) "timeshare/multipropriété" is the highest-volume search term in this category, and (b) it's the mental category most prospective buyers compare us against. We adopt the same approach.

**Primary French term: `multipropriété`** (dominant SEO). **Also include**: `timeshare` (English loan, French luxury audience knows it — use once per section for international searchers).

### Required mentions per pillar

Every French pillar MUST include the contrast in at least these spots:

1. **§A snippet** — the existing line: "ce n'est ni de la multipropriété, ni un timeshare, ni un club de vacances"
2. **§A LLC contrast callout** (NEW — see template below) — placed immediately after the existing "La LLC en une phrase" callout
3. **§F mechanics** — when describing what you actually own, contrast against timeshare: "une participation patrimoniale transmissible — non un droit d'usage de multipropriété qui se déprécie à zéro à l'expiration du contrat"
4. **§F "Votre détention en un coup d'œil" bullets** — first bullet should reinforce: "...ce n'est ni de la multipropriété, ni une adhésion à points, ni un droit d'usage"
5. **§G decision section** — at least one reference to "à la différence de la multipropriété traditionnelle"

### Required callout template (insert after the LLC callout in §A)

```html
<div class="dest-callout">
  <strong>Ce n'est pas de la multipropriété (timeshare) :</strong> la multipropriété — ou timeshare — vous vend un <em>droit d'usage</em> du bien pour une semaine définie chaque année, généralement par un contrat à terme et sans valeur de revente. Une part COP vous vend une <strong>participation patrimoniale enregistrée</strong> dans le bien lui-même, à travers une LLC dans laquelle vous et sept autres copropriétaires êtes titulaires à part égale. Elle est transmissible, transmissible par héritage, se valorise avec le bien sous-jacent, et se vend via un processus professionnel en environ un mois — exactement l'inverse de la multipropriété.
</div>
```

### Tone

Don't be defensive about timeshare. Be matter-of-fact about the contrast and confident about why the COP model is structurally different (equity vs use-right, transferable vs locked-in, appreciates vs depreciates). MYNE's framing is: "we own; timeshare uses." Match that.

---

## Numbers, currency, units

- **Decimal separator: comma**, thousands separator: thin space (or period)
  - `1 500 000 €` (thin space; preferred French style)
  - `1,5 million d'euros` or `1,5 M€`
  - `€1.500.000` is also accepted but thin-space is more typographically French
- **Temperatures**: keep `°C (°F)` pairing — French audience uses Celsius natively
- **Distances**: kilomètres only — DON'T add miles in parens for European content; for USA content you can keep miles in parens since it's the local convention
- **1/8**: write as "1/8" — matches our consistency rule
- **Per cent**: use `%` with non-breaking space: "0,5 %"

---

## Tone and stylistic notes

1. **Sentence rhythm**: French naturally tolerates long elegant sentences with multiple subordinate clauses (qui, que, dont, lequel). Don't over-shorten — keep the EN paragraph structure but build with French syntactic elegance. Luxury French real estate is formal, restrained, never breathless.

2. **Adjective placement**: French places most adjectives AFTER the noun. "Une villa exceptionnelle", "une résidence secondaire de luxe". Some are pre-positioned (beauté, taille, age, goodness — BAGS rule): "un beau bien", "une grande propriété" (oh wait — "propriété" is banned 😉 use "un grand bien"), "une nouvelle saison".

3. **Avoid Anglicisms where there's a clean French word**, but DO keep:
   - "LLC" (legal vehicle name)
   - "Timeshare" / "multipropriété" (both)
   - "Conciergerie" / "concierge" (both)
   - "Lifestyle" → "art de vivre" or "mode de vie" (translate)
   - "Workation" (modern usage, kept English in luxury writing)

4. **Punctuation**: French uses non-breaking spaces before `: ; ! ? « »`. Use proper guillemets for quotations (« and ») rather than English curly quotes. Em-dashes use spaces around them — like this — which is the same as English.

5. **Avoid the literal "vous savez" / "vous pouvez"** stuffing — French luxury copy is restrained and confident, not chatty.

6. **Tu vs vous in compound phrases**: "votre bien" not "ton bien", "vos vacances" not "tes vacances". Watch for any leftover "tu" forms from automated translation tools.

---

## Banned vocabulary / phrasings

- **AVOID "propriété(s)"** in body copy — use "bien(s)". This rule was applied via sweep across the entire FR corpus (commit 5237a30) and must be maintained. PRESERVED legal terms where "propriété" stays correct:
  - **pleine propriété** (full ownership / freehold) — keep as-is
  - **propriété intellectuelle** (intellectual property) — keep as-is
  - **droit de propriété** / **titre de propriété** / **transfert de propriété** / **preuve de propriété** — these are fixed legal terms, keep
  - **copropriété** / **copropriétaire** — NEVER touch (different word, different meaning)
  - **propriétaire** — NEVER touch (means "owner", not "property")
- **AVOID SCI / SARL / SCCV / société civile immobilière** — these are French legal vehicles. We use the international LLC framework. Banned per Rule 2 of the rewrite skill.
- **AVOID "biens immobiliers"** when "biens" alone reads cleaner — both are correct but "biens" is more luxury-real-estate. Use "biens immobiliers" only when disambiguating.
- **AVOID literal "temps partagé"** as translation of timeshare — outdated, dry. Use **"multipropriété"** as primary and **"timeshare"** as secondary mention per the Timeshare positioning section above.
- **Mind gender agreement** — "bien" is masculine. After the propriété→bien sweep we did a grammar pass to fix la→le, une→un, cette→ce, de la→du, à la→au, vraie→vrai, espagnoles/italiennes/françaises/européennes→masculine forms. Translations must use masculine agreement: "le bien", "un bien", "ce bien", "du bien", "au bien", "vrai bien", "biens espagnols", etc.

---

## Pillar-specific destination names

| EN destination | FR in-text | FR slug |
|---|---|---|
| Spain | Espagne | espagne |
| France | France | france |
| Italy | Italie | italie |
| United States / USA | États-Unis | etats-unis |
| Portugal | Portugal | portugal |

For city/region names inside each pillar (master table in `SKILL.md` Step 5):
- Tuscany → Toscane
- Sardinia → Sardaigne
- Sicily → Sicile
- Florence → Florence (same)
- Milan → Milan (same)
- Venice → Venise
- Rome → Rome (same)
- Naples → Naples (same)
- Mallorca → Majorque (or Mallorca — Majorque is more French; both acceptable)
- Ibiza → Ibiza
- Menorca → Minorque
- Canary Islands → Îles Canaries
- French Alps → Alpes françaises
- Côte d'Azur → Côte d'Azur (same — French original)
- Lake Como → lac de Côme
- Lake Garda → lac de Garde
- Lake Maggiore → lac Majeur
- Algarve → Algarve
- Lisbon → Lisbonne
- Madeira → Madère
- Porto → Porto
- Douro Valley → Vallée du Douro
- Aspen → Aspen
- Vail → Vail
- California → Californie
- Florida → Floride
- Rocky Mountains → Rocheuses
- Pyrenees → Pyrénées (with accent)
- Madrid → Madrid (same)
- Barcelona → Barcelone

---

## Country tax / legal terms (keep in original where appropriate)

- **IMU / TARI** (Italy) → keep as-is, gloss: "l'IMU (Imposta Municipale Unica — la taxe municipale italienne sur les biens immobiliers)"
- **IBI / IBNR** (Spain) → keep as-is, gloss: "l'IBI (Impuesto sobre Bienes Inmuebles — la taxe foncière municipale espagnole)"
- **IMI / AIMI** (Portugal) → keep as-is, gloss: "l'IMI (Imposto Municipal sobre Imóveis — la taxe foncière municipale portugaise)"
- **FIRPTA** (USA) → keep as-is, gloss: "la réglementation FIRPTA (Foreign Investment in Real Property Tax Act — la loi américaine sur l'investissement immobilier étranger)"
- **Conservatória do Registo Predial / Catasto / Catastro / county recorder** → keep original term, gloss as "(le service local de publicité foncière)"
- **réserve héréditaire** is the FRENCH legal term — for France content use as-is (no gloss needed, French audience knows). For other-country content gloss as "(équivalent à la réserve héréditaire en droit français)"
- **legítima / legittima** → for Spain/Italy content keep as-is, gloss as "(comparable à la réserve héréditaire française)"

---

## Existing FR pages to mine for vocabulary consistency

When in doubt, check these for the established COP wording in French (post propriété→bien sweep):
- `messages/fr.json` — nav labels, common UI strings (note "Biens" not "Propriétés")
- `pages/fr/index.js` — homepage hero copy
- `pages/fr/copropriete-residence-secondaire.js` — co-ownership explainer (high signal)
- `pages/fr/comment-ca-marche.js` — how-it-works
- `pages/fr/acheter-copropriete-questions-frequentes.js` — purchase FAQ
- `pages/fr/profiter-copropriete-questions-frequentes.js` — usage FAQ

The wording in those existing pages is what we've already shipped to French-speaking
users — new translations should be CONSISTENT with them, not competing terminology.
The biggest risk is a translation accidentally re-introducing "propriétés" — run the
verification grep in Step 8 of `SKILL.md` to catch this.
