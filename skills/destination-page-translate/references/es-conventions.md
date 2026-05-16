# Spanish (ES) translation conventions for destination pillars

Reference brand: **Vivla** (vivla.com/es). Vivla is the Spanish market leader for fractional
luxury second homes and the closest direct comparator to COP for Spanish-speaking buyers.
Their wording is the benchmark for tone and terminology.

This file also draws on our existing ES pages (`pages/es/`, `messages/es.json`) for
consistency with the rest of our Spanish corpus.

---

## Form of address

**Mix of "tú" (informal) and "usted" (formal)** — Vivla uses both. Default to **tú** for
warmth and modern luxury, but switch to **usted** in formal moments (the practical / legal
sections, the final mid-CTA, the "talk to our experts" copy). 

Vivla examples observed:
- "tu casa de vacaciones" (informal — emotional/lifestyle copy)
- "Permítanos conocerle" (formal — when offering service)
- "su familia" (formal — service context)
- "Hazlo tuyo" (informal — call-to-action)

For pillar pages, default to **tú** in §A "Why Spain", §B clusters, §C seasonal, §D personas,
§G decision paragraphs (these are emotional/lifestyle). Switch to **usted** in §E
practicalities (more formal/contractual) and §F mechanics (formal/legal).

Don't mix tú and usted within the SAME paragraph.

---

## Real estate terminology

| EN | ES preferred (Vivla style) | Notes |
|---|---|---|
| property / second home | **casa** / **vivienda** / **segunda casa** / **casa de vacaciones** | Vivla strongly prefers **casas** over "propiedades". "Vivienda" for the more administrative tone. AVOID "propiedad" except in legal context (e.g. "derechos de propiedad"). |
| holiday home | **casa de vacaciones** | Vivla's signature phrase |
| second home | **segunda casa** / **segunda residencia** | Vivla uses "segunda casa". "Segunda residencia" is more administrative/legal — fine for §F |
| co-ownership / fractional ownership | **copropiedad** | Vivla writes "Copropiedad simplificada" — this is THE term |
| co-owner | **copropietario** | |
| share (1/8 share) | **fracción** / **parte** / **1/8** | Vivla writes "1/8" and "una fracción". For prose: "tu parte de 1/8" or "una fracción 1/8" |
| owner | **propietario** | the owner of the share — "propietario VIVLA" in their copy |
| villa | **villa** | unchanged |
| chalet | **chalet** (or **chalé**) | both forms accepted, "chalet" more international |
| apartment | **apartamento** / **piso** | "apartamento" for the modern/luxury feel; "piso" for the standard residential meaning. Use apartamento. |
| LLC | **LLC** | keep as-is. Spell out as **Limited Liability Company** or **sociedad LLC** on first mention if introducing the concept. NEVER use a Spanish equivalent (S.L., Sociedad Limitada, comunidad de bienes) — those are different legal vehicles with different connotations |
| land registry | **Registro de la Propiedad** | the Spanish land registry — when writing about other countries, gloss the local equivalent: "(la Conservatória do Registo Predial portuguesa)" |
| operating agreement | **acuerdo operativo** / **estatutos de la LLC** | |
| professional management | **gestión profesional** / **administración profesional** | Vivla uses "gestión integral" |
| service charge | **cuota anual de servicios** / **gastos comunes** | "cuota de servicios" is cleanest |
| resale | **reventa** | the standard term |
| deeded share / real equity | **fracción escriturada** / **patrimonio inmobiliario real** | reinforces "this is real property, not a timeshare" |
| timeshare / multipropiedad | **multipropiedad** (primary), **timeshare** (English loan, mention once per section), **tiempo compartido** (LatAm colloquial, mention once on page) | See "Timeshare positioning" section below — we now use this word HEAVILY as a strategic contrast point, not just in the snippet line. |
| rotation calendar | **calendario de rotación** | |
| concierge | **concierge** / **conserjería** | "concierge" works in Spanish luxury context |
| equity | **patrimonio** / **plusvalía** | "patrimonio" for capital/wealth; "plusvalía" specifically for capital gains |

---

## Co-ownership-specific phrasings

- **"deeded 1/8 share of a luxury second home"** → "una fracción escriturada de 1/8 de una segunda casa de lujo"
- **"held in a purpose-built LLC alongside seven other co-owners"** → "constituida en una LLC creada específicamente para este fin junto con otros siete copropietarios"
- **"approximately 45 days of personal use per year"** → "aproximadamente 45 días de uso personal al año"
- **"fair-rotation calendar"** → "calendario de rotación equitativo" (or just "sistema de rotación")
- **"professional management team"** → "equipo de gestión profesional"
- **"real, recorded property equity"** → "patrimonio inmobiliario real, escriturado a tu nombre"
- **"not a timeshare, not a holiday club"** → "no es multipropiedad ni un timeshare, no es un club de vacaciones" (include both terms — MYNE-style timeshare-contrast positioning)
- **"fully managed"** → "totalmente gestionado" / "gestión integral"
- **"6–7 weeks of personal use a year"** → "6 a 7 semanas de uso personal al año"
- **"single international portfolio relationship"** → "una sola relación internacional para tu cartera"
- **"~1 month on average"** → "alrededor de un mes de media"
- **"free to browse, free to enquire"** → "Explora gratis, consulta gratis" (Vivla-style direct address)

---

## Timeshare positioning (MYNE-style strategic contrast — IMPORTANT)

MYNE leads heavily on a "this is NOT timeshare" framing because (a) "timeshare/multipropiedad/tiempo compartido" is the highest-volume search term in this category, and (b) it's the mental category most prospective buyers compare us against. We adopt the same approach.

**Primary Spanish term: `multipropiedad`** (the legal Spanish term, dominant SEO in Spain). **Also include**: `timeshare` (English loan, used once per section to capture international searchers) and `tiempo compartido` (LatAm colloquial — high volume in Mexico, include at least once on the page).

### Required mentions per pillar

Every Spanish pillar MUST include the contrast in at least these spots:

1. **§A snippet** — the existing line: "no es multipropiedad ni un timeshare, no es un club de vacaciones"
2. **§A LLC contrast callout** (NEW — see template below) — placed immediately after the existing "La LLC en una frase" callout
3. **§F mechanics** — when describing what you actually own, contrast against timeshare ownership rights: "una participación patrimonial transmisible — no un derecho de uso de multipropiedad que se deprecia a cero al expirar el contrato"
4. **§F "Tu propiedad de un vistazo" bullets** — first bullet should reinforce: "...no es multipropiedad, no es una afiliación de puntos, no es un derecho de uso"
5. **§G decision section** — when describing what makes the model right, at least one reference to "a diferencia de la multipropiedad tradicional"

### Required callout template (insert after the LLC callout in §A)

```html
<div class="dest-callout">
  <strong>Esto no es multipropiedad (timeshare):</strong> la multipropiedad — también conocida como tiempo compartido o timeshare — te vende un <em>derecho de uso</em> de la casa durante una semana determinada cada año, normalmente con contrato que expira y sin valor de reventa. Una fracción COP te vende una <strong>participación patrimonial registrada</strong> en la propia casa, a través de una LLC en la que tú y otros siete copropietarios sois titulares al mismo nivel. Es transmisible, heredable, se revaloriza con la casa subyacente, y se vende a través de un proceso profesional en alrededor de un mes — exactamente lo opuesto a la multipropiedad.
</div>
```

### Tone

Don't be defensive about timeshare. Be matter-of-fact about the contrast and confident about why the COP model is structurally different (equity vs use-right, transferable vs locked-in, appreciates vs depreciates). MYNE's framing is: "we own; timeshare uses." Match that.

---

## Numbers, currency, units

- **Decimal separator: comma**, thousands separator: period
  - `€1.500.000` or `1.500.000 €`
  - `1,5 millones de euros`
  - `1.500 €`
- **Temperatures**: keep `°C (°F)` pairing — Spain uses Celsius natively; °F for cross-reference
- **Distances**: kilómetros — DON'T add miles for Spain content; for USA content keep miles in parens since it's the local convention there
- **1/8**: write as "1/8" — matches Vivla's usage
- **Per cent**: use `%` with a thin space: "0,5 %" (Spanish convention)

---

## Tone and stylistic notes

1. **Sentence rhythm**: Spanish naturally allows long flowing sentences with multiple subordinate clauses. Don't over-shorten. Vivla's tone is warm, confident, slightly aspirational — not stiff/legal.

2. **Adjective placement**: Spanish places most adjectives AFTER the noun. "Casa exclusiva" (exclusive home), "segunda casa de lujo" (luxury second home). Some are pre-positioned for emphasis: "una nueva forma de vivir" (a new way of living).

3. **Avoid Anglicisms where there's a clean Spanish word** but DO keep:
   - "LLC" (legal vehicle name)
   - "Timeshare" / "multipropiedad" (use Spanish)
   - "Concierge" (luxury hospitality)
   - "Lifestyle" → "estilo de vida" (translate)
   - "Workation" / "Coworking" (modern usage, kept English)

4. **Punctuation**: Spanish uses inverted opening marks for questions and exclamations (¿...? and ¡...!). Use them properly.

5. **Avoid the gerundio for ongoing action** in formal copy — Spanish overuses "está siendo gestionada" feels English-influenced. Prefer simple present: "se gestiona profesionalmente".

6. **Vivla's voice**: warm, direct, "you can do this" — they speak to ambitious affluent Spanish (and Latin American) families. Match that warmth without dumbing down.

---

## Banned vocabulary / phrasings

- **Avoid "propiedades"** as the default term for "properties" — Vivla uses "casas" and "viviendas". "Propiedades" is fine in legal context ("derechos de propiedad", "Registro de la Propiedad") but never as the catch-all noun for what we sell.
- **Avoid "comunidad de bienes"** — that is the Spanish legal vehicle (NOT what we use). Banned per Rule 2 of the rewrite skill.
- **Avoid "sociedad limitada (S.L.)"** — Spanish LLC equivalent. We use the international LLC framework, not S.L.
- **"tiempo compartido"** is acceptable as a SECONDARY mention (it's the higher-volume search term in Latin America, particularly Mexico) — include it once per page alongside "multipropiedad" and "timeshare" to capture all three search variants. But "multipropiedad" remains the PRIMARY term in Spain-facing copy.
- **Avoid the literal "uso compartido"** for shared use — Vivla uses "Propiedad compartida, Uso exclusivo" (paradoxically: the property is shared, the use is exclusive to your weeks). Match this framing.

---

## Pillar-specific destination names

| EN destination | ES in-text | ES slug |
|---|---|---|
| Spain | España | espana |
| France | Francia | francia |
| Italy | Italia | italia |
| United States / USA | Estados Unidos | estados-unidos |
| Portugal | Portugal | portugal |

For city/region names inside each pillar (master table in `SKILL.md` Step 5):
- Tuscany → Toscana
- Sardinia → Cerdeña
- Sicily → Sicilia
- Florence → Florencia
- Milan → Milán
- Venice → Venecia
- Rome → Roma
- Naples → Nápoles
- Mallorca → Mallorca
- Ibiza → Ibiza
- Menorca → Menorca
- Canary Islands → Islas Canarias
- French Alps → Alpes franceses
- Côte d'Azur → Costa Azul (or kept French — both acceptable; Vivla's audience knows both)
- Lake Como → Lago de Como
- Lake Garda → Lago de Garda
- Lake Maggiore → Lago Mayor (or kept Italian)
- Algarve → Algarve
- Lisbon → Lisboa
- Madeira → Madeira
- Porto → Oporto (Spanish form) or Porto (kept Portuguese — both fine; Spanish-speakers use both)
- Douro Valley → Valle del Duero
- Aspen → Aspen
- Vail → Vail
- California → California
- Florida → Florida
- Rocky Mountains → Montañas Rocosas

---

## Country tax / legal terms (keep in original where appropriate)

- **IMU / TARI** (Italy) → keep as-is, gloss in Spanish: "el IMU (Imposta Municipale Unica — el impuesto municipal sobre inmuebles)"
- **IBI / AIBI** (Spain) → keep as-is — these are NATIVE Spanish terms, no gloss needed: "el IBI (Impuesto sobre Bienes Inmuebles)"
- **IMI / AIMI** (Portugal) → keep as-is, gloss: "el IMI (Imposto Municipal sobre Imóveis — el impuesto municipal sobre inmuebles)"
- **FIRPTA** (USA) → keep as-is, gloss: "la normativa FIRPTA (Foreign Investment in Real Property Tax Act, ley estadounidense que regula la fiscalidad inmobiliaria de no residentes)"
- **Conservatória do Registo Predial / Catasto / Catastro / county recorder** → keep original term, gloss as "(el registro de la propiedad correspondiente)"
- **réserve héréditaire / legítima / legittima** → "legítima" is the SPANISH legal term too — for Spain content use as-is. For other-country content gloss as "(equivalente a la legítima en derecho español)"

---

## Existing ES pages to mine for vocabulary consistency

When in doubt, check these for the established COP wording in Spanish:
- `messages/es.json` — nav labels, common UI strings
- `pages/es/index.js` — homepage hero copy
- `pages/es/copropiedad.js` — co-ownership explainer (high signal)
- `pages/es/como-funciona.js` — how-it-works
- `pages/es/comprar-copropiedad-preguntas-frecuentes.js` — purchase FAQ
- `pages/es/disfrutar-copropiedad-preguntas-frecuentes.js` — usage FAQ

The wording in those existing pages is what we've already shipped to Spanish-speaking
users — new translations should be CONSISTENT with them, not competing terminology.
