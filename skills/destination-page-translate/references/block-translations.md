# Pre-translated reusable blocks (DE / ES / FR)

About 50–60% of each pillar is structurally identical content that should translate
identically across all 5 destinations. Translating these blocks ONCE per language
guarantees terminology consistency and saves massive amounts of work.

This file holds the canonical pre-translated blocks. When translating a pillar:
1. Identify which blocks below correspond to the section you're translating
2. Substitute the country-specific bits inside the block (destination name, tax names,
   registry name, adjective endings)
3. Use the rest verbatim

**IMPORTANT**: If you find yourself translating the SAME paragraph across multiple
pillars, extract it here as a new block.

---

## Block 1 — Featured snippet (§A top)

> **Editorial rule — single "tour" rhetoric per page.** Across the pillar, the rhetorical
> pattern of "[property type] in/above [place], [property type] in/above [place], [property type] in/above [place]"
> should appear **once** — in the hero subtitle. Do **not** repeat that enumeration in the
> mid-CTA paragraph or the §A snippet. Both of those should describe the property in adjective
> form only (e.g. "a luxury Mediterranean second home", "a luxury alpine second home", "a luxury lakefront second home")
> without listing specific examples.
>
> **Editorial rule — softened co-owner count.** Use "up to seven other co-owners" / equivalent
> per locale, not a flat "seven other co-owners". Many buyers acquire multiple shares, so the
> actual number of distinct co-owners is often fewer than seven. The 1/8 share structure is
> still defined elsewhere — this is just a tone fix.

### EN source

```html
<div class="dest-snippet" itemscope itemtype="https://schema.org/Question">
  <h2 itemprop="name">What is fractional ownership in {Destination}?</h2>
  <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
    <p itemprop="text"><strong>Fractional ownership in {Destination} means buying a deeded 1/8 share of a luxury {regional_adjective} second home — held in a purpose-built LLC alongside up to seven other co-owners.</strong> Each owner receives approximately 45 days of personal use per year through a fair-rotation calendar, with all property management, maintenance, taxes and operations handled by a professional team. It is real, recorded property equity in your name — not a timeshare, not a holiday club.</p>
  </div>
</div>
```

`{regional_adjective}` = a single descriptor for the destination (e.g. "Mediterranean", "alpine", "lakefront", "Mediterranean island", "sun-coast"). No enumeration of property types or places here.

### DE

```html
<div class="dest-snippet" itemscope itemtype="https://schema.org/Question">
  <h2 itemprop="name">Was ist Miteigentum in {Destination_DE}?</h2>
  <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
    <p itemprop="text"><strong>Miteigentum in {Destination_DE} bedeutet, einen eingetragenen 1/8-Anteil an einer luxuriösen {regional_adjective_DE} Ferienimmobilie zu erwerben — gehalten in einer eigens dafür gegründeten LLC gemeinsam mit bis zu sieben weiteren Miteigentümern.</strong> Jeder Eigentümer erhält rund 45 Tage persönlicher Nutzung pro Jahr über einen fair rotierenden Belegungskalender, wobei das gesamte Immobilienmanagement, die Instandhaltung, die Steuern und der Betrieb von einem professionellen Team übernommen werden. Es handelt sich um echtes, eingetragenes Eigentumsrecht an Immobilien in Ihrem Namen — kein Timeshare, kein Holiday Club.</p>
  </div>
</div>
```

### ES

```html
<div class="dest-snippet" itemscope itemtype="https://schema.org/Question">
  <h2 itemprop="name">¿Qué es la copropiedad en {Destination_ES}?</h2>
  <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
    <p itemprop="text"><strong>La copropiedad en {Destination_ES} consiste en adquirir una fracción escriturada de 1/8 de una segunda casa de lujo {regional_adjective_ES} — constituida en una LLC creada específicamente para este fin junto a un pequeño grupo de hasta siete copropietarios más.</strong> Cada propietario recibe aproximadamente 45 días de uso personal al año mediante un sistema de rotación equitativo, con toda la gestión inmobiliaria, mantenimiento, impuestos y operativa cubiertos por un equipo profesional. Se trata de patrimonio inmobiliario real, escriturado a tu nombre — no es multipropiedad ni un club de vacaciones.</p>
  </div>
</div>
```

### FR

```html
<div class="dest-snippet" itemscope itemtype="https://schema.org/Question">
  <h2 itemprop="name">Qu'est-ce que la copropriété en {Destination_FR} ?</h2>
  <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
    <p itemprop="text"><strong>La copropriété en {Destination_FR} consiste à acquérir une part actée de 1/8 d'une résidence secondaire de luxe {regional_adjective_FR} — détenue au sein d'une LLC créée spécifiquement à cet effet aux côtés d'un petit groupe d'au plus sept autres copropriétaires.</strong> Chaque propriétaire bénéficie d'environ 45 jours d'utilisation personnelle par an grâce à un calendrier de rotation équitable, l'ensemble de la gestion immobilière, de l'entretien, de la fiscalité et de l'exploitation étant pris en charge par une équipe professionnelle. Il s'agit d'un véritable patrimoine immobilier acté à votre nom — ce n'est ni de la multipropriété, ni un club de vacances.</p>
  </div>
</div>
```

---

## Block 2 — "LLC in one line" callout (§A)

### EN

```html
<div class="dest-callout">
  <strong>LLC in one line:</strong> a purpose-built company that owns the property, in which you and up to seven other owners hold equal membership interests — giving lighter resale and a single consistent ownership structure across every COP property worldwide, so multi-country owners deal with one model rather than a stack of different vehicles.
</div>
```

### DE

```html
<div class="dest-callout">
  <strong>LLC in einem Satz:</strong> eine eigens dafür gegründete Gesellschaft, der die Immobilie gehört und in der Sie zusammen mit bis zu sieben weiteren Eigentümern gleiche Geschäftsanteile halten — das ergibt einen leichteren Wiederverkauf und eine einheitliche Eigentumsstruktur für jede COP-Immobilie weltweit, sodass Eigentümer mit Immobilien in mehreren Ländern mit einem einzigen Modell arbeiten statt mit einem Stapel unterschiedlicher Vehikel.
</div>
```

### ES

```html
<div class="dest-callout">
  <strong>La LLC en una frase:</strong> una sociedad creada específicamente para ser propietaria de la casa, en la que tú y un pequeño grupo de hasta siete propietarios más tenéis participaciones iguales — esto facilita la reventa y aporta una estructura de propiedad única y coherente para cada casa de COP en todo el mundo, de forma que los propietarios con casas en varios países trabajan con un único modelo en lugar de una pila de vehículos jurídicos distintos.
</div>
```

### FR

```html
<div class="dest-callout">
  <strong>La LLC en une phrase :</strong> une société créée spécifiquement pour détenir le bien, dans laquelle vous et un petit groupe de copropriétaires (sept au maximum) détenez des parts égales — ce qui allège la revente et apporte une structure de détention unique et cohérente pour chaque bien COP dans le monde, afin que les propriétaires possédant des biens dans plusieurs pays travaillent avec un seul modèle plutôt qu'avec un empilement de véhicules juridiques différents.
</div>
```

---

## Block 3 — Comparison table (§E)

The table is structurally identical across all 5 pillars. Translate the `<th>` headers,
the row labels, and each `<td data-col="...">value` exactly once per language.

### EN

```html
<table class="dest-compare-table">
  <thead>
    <tr>
      <th></th>
      <th>Whole second home</th>
      <th>COP 1/8 fractional share</th>
      <th>Long-term rental</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Upfront commitment</td>
      <td data-col="Whole second home">Full property value</td>
      <td data-col="COP 1/8 share">~1/8 of the property value</td>
      <td data-col="Long-term rental">First/last/deposit only</td>
    </tr>
    <tr>
      <td>Equity in the asset</td>
      <td data-col="Whole second home">Full appreciation</td>
      <td data-col="COP 1/8 share">~1/8 of appreciation</td>
      <td data-col="Long-term rental">None</td>
    </tr>
    <tr>
      <td>Annual carry</td>
      <td data-col="Whole second home">Full taxes, insurance, management, maintenance</td>
      <td data-col="COP 1/8 share">~1/8 of carry, fully managed</td>
      <td data-col="Long-term rental">Full rent every year, indefinitely</td>
    </tr>
    <tr>
      <td>Personal use</td>
      <td data-col="Whole second home">Up to 52 weeks (most use 6–10)</td>
      <td data-col="COP 1/8 share">~45 days, professionally scheduled</td>
      <td data-col="Long-term rental">Defined by lease</td>
    </tr>
    <tr>
      <td>Operations burden</td>
      <td data-col="Whole second home">Owner-managed or hired staff</td>
      <td data-col="COP 1/8 share">Fully included</td>
      <td data-col="Long-term rental">Landlord-managed</td>
    </tr>
    <tr>
      <td>Time to exit</td>
      <td data-col="Whole second home">{X}–{Y} months on the open market</td>
      <td data-col="COP 1/8 share">~1 month on average across the COP portfolio</td>
      <td data-col="Long-term rental">End of lease term</td>
    </tr>
  </tbody>
</table>
```

### DE

| EN row label | DE row label |
|---|---|
| Whole second home | Volle Ferienimmobilie |
| COP 1/8 fractional share | COP 1/8-Anteil |
| Long-term rental | Langzeitmiete |
| Upfront commitment | Anfangsinvestition |
| Full property value | Voller Immobilienwert |
| ~1/8 of the property value | ~1/8 des Immobilienwerts |
| First/last/deposit only | Nur Kaution und 1–2 Monatsmieten |
| Equity in the asset | Eigenkapital im Vermögen |
| Full appreciation | Volle Wertsteigerung |
| ~1/8 of appreciation | ~1/8 der Wertsteigerung |
| None | Keine |
| Annual carry | Jährliche Kosten |
| Full taxes, insurance, management, maintenance | Volle Steuern, Versicherung, Verwaltung, Instandhaltung |
| ~1/8 of carry, fully managed | ~1/8 der Kosten, vollständig verwaltet |
| Full rent every year, indefinitely | Volle Miete jedes Jahr, auf unbestimmte Zeit |
| Personal use | Persönliche Nutzung |
| Up to 52 weeks (most use 6–10) | Bis zu 52 Wochen (die meisten nutzen 6–10) |
| ~45 days, professionally scheduled | ~45 Tage, professionell organisiert |
| Defined by lease | Vom Mietvertrag definiert |
| Operations burden | Operativer Aufwand |
| Owner-managed or hired staff | Vom Eigentümer verwaltet oder Personal eingestellt |
| Fully included | Vollständig inklusive |
| Landlord-managed | Vom Vermieter verwaltet |
| Time to exit | Verkaufsdauer |
| {X}–{Y} months on the open market | {X}–{Y} Monate auf dem freien Markt |
| ~1 month on average across the COP portfolio | im Durchschnitt rund einen Monat im COP-Portfolio |
| End of lease term | Ende der Mietlaufzeit |

### ES

| EN row label | ES row label |
|---|---|
| Whole second home | Casa al 100 % |
| COP 1/8 fractional share | Fracción 1/8 con COP |
| Long-term rental | Alquiler de larga duración |
| Upfront commitment | Inversión inicial |
| Full property value | Valor total de la casa |
| ~1/8 of the property value | ~1/8 del valor de la casa |
| First/last/deposit only | Solo fianza y mensualidades iniciales |
| Equity in the asset | Patrimonio en el activo |
| Full appreciation | Plusvalía total |
| ~1/8 of appreciation | ~1/8 de la plusvalía |
| None | Ninguna |
| Annual carry | Gastos anuales |
| Full taxes, insurance, management, maintenance | Impuestos, seguros, gestión y mantenimiento al completo |
| ~1/8 of carry, fully managed | ~1/8 de los gastos, gestión integral incluida |
| Full rent every year, indefinitely | Alquiler completo cada año, indefinidamente |
| Personal use | Uso personal |
| Up to 52 weeks (most use 6–10) | Hasta 52 semanas (la mayoría usa entre 6 y 10) |
| ~45 days, professionally scheduled | ~45 días, programados profesionalmente |
| Defined by lease | Definido por el contrato |
| Operations burden | Carga operativa |
| Owner-managed or hired staff | Gestionado por el propietario o por personal contratado |
| Fully included | Totalmente incluido |
| Landlord-managed | Gestionado por el arrendador |
| Time to exit | Tiempo para vender |
| {X}–{Y} months on the open market | {X}–{Y} meses en el mercado libre |
| ~1 month on average across the COP portfolio | Alrededor de un mes de media en la cartera COP |
| End of lease term | Fin del contrato |

### FR

| EN row label | FR row label |
|---|---|
| Whole second home | Résidence secondaire entière |
| COP 1/8 fractional share | Part 1/8 COP |
| Long-term rental | Location longue durée |
| Upfront commitment | Engagement initial |
| Full property value | Valeur totale du bien |
| ~1/8 of the property value | ~1/8 de la valeur du bien |
| First/last/deposit only | Caution et 1–2 mois de loyer |
| Equity in the asset | Patrimoine dans l'actif |
| Full appreciation | Plus-value totale |
| ~1/8 of appreciation | ~1/8 de la plus-value |
| None | Aucun |
| Annual carry | Charges annuelles |
| Full taxes, insurance, management, maintenance | Impôts, assurances, gestion et entretien complets |
| ~1/8 of carry, fully managed | ~1/8 des charges, gestion intégrale incluse |
| Full rent every year, indefinitely | Loyer complet chaque année, indéfiniment |
| Personal use | Utilisation personnelle |
| Up to 52 weeks (most use 6–10) | Jusqu'à 52 semaines (la plupart utilisent 6 à 10) |
| ~45 days, professionally scheduled | ~45 jours, planifiés professionnellement |
| Defined by lease | Défini par le bail |
| Operations burden | Charge opérationnelle |
| Owner-managed or hired staff | Géré par le propriétaire ou personnel embauché |
| Fully included | Entièrement inclus |
| Landlord-managed | Géré par le bailleur |
| Time to exit | Délai de revente |
| {X}–{Y} months on the open market | {X}–{Y} mois sur le marché libre |
| ~1 month on average across the COP portfolio | Environ un mois en moyenne dans le portefeuille COP |
| End of lease term | Fin du bail |

---

## Block 4 — "Free to browse, free to enquire" callout (§F)

### EN

```html
<div class="dest-callout">
  <strong>Free to browse, free to enquire.</strong> Using COP is free for buyers — no fees, no sign-up cost, no obligation. Talk to our specialists about which {Country} region best fits your use pattern, or browse the listings and join the updates list for new properties as they come to market.
</div>
```

### DE

```html
<div class="dest-callout">
  <strong>Stöbern und anfragen — beides kostenlos.</strong> Die Nutzung von COP ist für Käufer kostenlos — keine Gebühren, keine Anmeldekosten, keine Verpflichtung. Sprechen Sie mit unseren Fachberatern darüber, welche Region in {Country_DE} am besten zu Ihrem Nutzungsmuster passt, oder durchstöbern Sie die Inserate und melden Sie sich für unsere Updates zu neuen Immobilien an, sobald diese auf den Markt kommen.
</div>
```

### ES

```html
<div class="dest-callout">
  <strong>Explora gratis, consulta gratis.</strong> Usar COP es gratuito para los compradores — sin tarifas, sin coste de registro, sin compromiso. Habla con nuestros especialistas sobre qué región de {Country_ES} encaja mejor con tu forma de usar la casa, o explora los anuncios y apúntate a las actualizaciones para recibir alertas cuando salgan nuevas casas al mercado.
</div>
```

### FR

```html
<div class="dest-callout">
  <strong>Consultation libre, contact libre.</strong> L'utilisation de COP est gratuite pour les acheteurs — aucuns frais, aucun coût d'inscription, aucun engagement. Parlez avec nos spécialistes pour savoir quelle région de {Country_FR} correspond le mieux à votre mode d'utilisation, ou parcourez les annonces et inscrivez-vous à notre liste pour être alerté dès qu'un nouveau bien arrive sur le marché.
</div>
```

---

## Block 5 — "Your ownership at a glance" 5-bullet list (§F)

### EN

```html
<h3>Your ownership at a glance</h3>
<ul>
  <li><strong>Real, deeded equity in your name</strong> — your 1/8 share is recorded in {Country}'s {registry_name}, transferable, inheritable, and it appreciates with the underlying property.</li>
  <li><strong>Consistent international structure</strong> — your {Country} share sits inside the same purpose-built LLC framework used for every COP property worldwide, so multi-country owners deal with one model rather than a stack of different vehicles.</li>
  <li><strong>Fully managed throughout</strong> — the professional management team handles taxes ({local_tax_names}), insurance, maintenance, scheduling, linen, the on-call concierge. You arrive, the property is ready.</li>
  <li><strong>Supported resale through the COP owner network</strong> — when you decide to exit, the supported resale path typically clears in around a month or less, well below the {X}–{Y} months that whole-property {Country} sales take on the open market.</li>
  <li><strong>Designed for international portfolios</strong> — the LLC model means owning across multiple COP destinations becomes one consolidated relationship rather than juggling country-specific vehicles.</li>
</ul>
```

### DE

```html
<h3>Ihr Eigentum auf einen Blick</h3>
<ul>
  <li><strong>Echtes, eingetragenes Eigentumsrecht in Ihrem Namen</strong> — Ihr 1/8-Anteil ist im {registry_name_DE} eingetragen, übertragbar, vererbbar und wertsteigerungsfähig im Einklang mit der zugrunde liegenden Immobilie.</li>
  <li><strong>Einheitliche internationale Struktur</strong> — Ihr Anteil in {Country_DE} ist Teil desselben eigens entwickelten LLC-Rahmens, der für jede COP-Immobilie weltweit verwendet wird, sodass Eigentümer mit Immobilien in mehreren Ländern mit einem einzigen Modell arbeiten statt mit einem Stapel unterschiedlicher Vehikel.</li>
  <li><strong>Rundum-Verwaltung</strong> — das professionelle Verwaltungsteam kümmert sich um Steuern ({local_tax_names}), Versicherung, Instandhaltung, Belegungsplanung, Wäsche und den Concierge-Service auf Abruf. Sie kommen an, die Immobilie ist bereit.</li>
  <li><strong>Begleiteter Wiederverkauf über das COP-Eigentümernetzwerk</strong> — wenn Sie verkaufen möchten, dauert der begleitete Wiederverkauf in der Regel etwa einen Monat oder weniger — deutlich unter den {X}–{Y} Monaten, die Vollverkäufe von Immobilien in {Country_DE} auf dem freien Markt typischerweise in Anspruch nehmen.</li>
  <li><strong>Gemacht für internationale Portfolios</strong> — das LLC-Modell bedeutet, dass Eigentum an mehreren COP-Destinationen zu einer konsolidierten Beziehung wird, statt länderspezifische Vehikel jonglieren zu müssen.</li>
</ul>
```

### ES

```html
<h3>Tu propiedad de un vistazo</h3>
<ul>
  <li><strong>Patrimonio escriturado real a tu nombre</strong> — tu fracción de 1/8 está inscrita en el {registry_name_ES} de {Country_ES}, es transferible, heredable y se revaloriza con la casa subyacente.</li>
  <li><strong>Estructura internacional coherente</strong> — tu fracción en {Country_ES} forma parte del mismo marco LLC creado específicamente para todas las casas de COP en el mundo, de forma que los propietarios con casas en varios países trabajan con un único modelo en lugar de una pila de vehículos jurídicos distintos.</li>
  <li><strong>Gestión integral</strong> — el equipo de gestión profesional se encarga de los impuestos ({local_tax_names}), seguros, mantenimiento, planificación, lencería y conserjería. Llegas, la casa está lista.</li>
  <li><strong>Reventa asistida a través de la red de propietarios COP</strong> — cuando decides vender, el proceso de reventa asistida suele cerrar en alrededor de un mes o menos, muy por debajo de los {X}–{Y} meses que tarda una venta de la casa entera en el mercado libre de {Country_ES}.</li>
  <li><strong>Diseñado para carteras internacionales</strong> — el modelo LLC convierte la propiedad de varias casas COP en una sola relación consolidada, en lugar de hacer malabares con vehículos jurídicos específicos de cada país.</li>
</ul>
```

### FR

```html
<h3>Votre propriété en un coup d'œil</h3>
<ul>
  <li><strong>Patrimoine acté à votre nom</strong> — votre part de 1/8 est inscrite au {registry_name_FR} de {Country_FR}, transférable, transmissible par héritage, et elle se valorise avec le bien sous-jacent.</li>
  <li><strong>Structure internationale cohérente</strong> — votre part en {Country_FR} s'inscrit dans le même cadre LLC conçu spécifiquement pour chaque bien COP dans le monde, afin que les propriétaires avec des biens dans plusieurs pays travaillent avec un seul modèle plutôt qu'avec un empilement de véhicules juridiques différents.</li>
  <li><strong>Gestion intégrale</strong> — l'équipe de gestion professionnelle s'occupe des impôts ({local_tax_names}), des assurances, de l'entretien, de la planification, du linge et du service de conciergerie. Vous arrivez, le bien est prêt.</li>
  <li><strong>Revente accompagnée via le réseau de copropriétaires COP</strong> — au moment de revendre, le processus de revente accompagnée se conclut généralement en environ un mois ou moins, bien en deçà des {X}–{Y} mois que prend habituellement une vente d'un bien entier sur le marché libre en {Country_FR}.</li>
  <li><strong>Conçu pour les portefeuilles internationaux</strong> — le modèle LLC fait de la détention de plusieurs biens COP une seule relation consolidée, plutôt que de jongler avec des véhicules juridiques propres à chaque pays.</li>
</ul>
```

---

## Block 6 — Mid-CTA structure

The mid-CTA varies by destination (different cluster names + intro line) but the
buttons are constant.

### EN button row

```html
<div class="dest-mid-cta-btns">
  <a href="/our-homes/" class="btn btn-gold">Browse All Properties</a>
  <a href="#newsletter" class="btn btn-outline">Get Updates</a>
</div>
```

### DE

```html
<div class="dest-mid-cta-btns">
  <a href="/de/immobilien/" class="btn btn-gold">Alle Immobilien ansehen</a>
  <a href="#newsletter" class="btn btn-outline">Updates erhalten</a>
</div>
```

### ES

```html
<div class="dest-mid-cta-btns">
  <a href="/es/propiedades/" class="btn btn-gold">Ver todas las casas</a>
  <a href="#newsletter" class="btn btn-outline">Recibir actualizaciones</a>
</div>
```

### FR

```html
<div class="dest-mid-cta-btns">
  <a href="/fr/proprietes/" class="btn btn-gold">Voir tous les biens</a>
  <a href="#newsletter" class="btn btn-outline">Recevoir les actualités</a>
</div>
```

(Note: the FR URL `/fr/proprietes/` is the existing legacy slug — DON'T change to `/fr/biens/`
just because the visible label changed. URL slugs are infrastructure; visible labels are copy.)

---

## Block 7 — §G "Still deciding" closing structure

The §G section's THREE decision paragraphs are destination-specific (each one talks about
which cluster suits which use pattern). But the closing template after the paragraphs
is identical:

### EN

```html
<p>Whichever way the decision goes, the deeper exploration starts on the cluster pages:</p>
<ul>
  <li><a href="/{cluster1-slug}/">Explore {Cluster 1} →</a></li>
  <li><a href="/{cluster2-slug}/">Explore {Cluster 2} →</a></li>
  <li><a href="/{cluster3-slug}/">Explore {Cluster 3} →</a></li>
</ul>

<p>If you would like to talk through <strong>which {Country} region best fits your family's actual use pattern</strong> — rather than the brochure version of it — <a href="#newsletter">join our list</a> and we will be in touch with relevant new-property alerts and an introduction to the team.</p>
```

### DE

```html
<p>Wie auch immer Sie sich entscheiden — die tiefere Erkundung beginnt auf den Cluster-Seiten:</p>
<ul>
  <li><a href="/de/destinationen/{cluster1-slug-de}/">{Cluster 1 DE} entdecken →</a></li>
  <li><a href="/de/destinationen/{cluster2-slug-de}/">{Cluster 2 DE} entdecken →</a></li>
  <li><a href="/de/destinationen/{cluster3-slug-de}/">{Cluster 3 DE} entdecken →</a></li>
</ul>

<p>Wenn Sie darüber sprechen möchten, <strong>welche Region in {Country_DE} am besten zum tatsächlichen Nutzungsmuster Ihrer Familie passt</strong> — statt nur zur Broschürenversion davon — <a href="#newsletter">tragen Sie sich in unsere Liste ein</a>, und wir melden uns mit relevanten Hinweisen zu neuen Immobilien und einer persönlichen Vorstellung des Teams.</p>
```

### ES

```html
<p>Sea cual sea la decisión, la exploración en profundidad empieza en las páginas de cada zona:</p>
<ul>
  <li><a href="/es/destinos/{cluster1-slug-es}/">Descubrir {Cluster 1 ES} →</a></li>
  <li><a href="/es/destinos/{cluster2-slug-es}/">Descubrir {Cluster 2 ES} →</a></li>
  <li><a href="/es/destinos/{cluster3-slug-es}/">Descubrir {Cluster 3 ES} →</a></li>
</ul>

<p>Si quieres hablar sobre <strong>qué región de {Country_ES} encaja mejor con la forma real en la que tu familia usa la casa</strong> — y no con la versión del folleto — <a href="#newsletter">apúntate a nuestra lista</a> y nos pondremos en contacto contigo con alertas de nuevas casas y una presentación personal del equipo.</p>
```

### FR

```html
<p>Quelle que soit la décision, l'exploration approfondie commence sur les pages de chaque zone :</p>
<ul>
  <li><a href="/fr/destinations/{cluster1-slug-fr}/">Découvrir {Cluster 1 FR} →</a></li>
  <li><a href="/fr/destinations/{cluster2-slug-fr}/">Découvrir {Cluster 2 FR} →</a></li>
  <li><a href="/fr/destinations/{cluster3-slug-fr}/">Découvrir {Cluster 3 FR} →</a></li>
</ul>

<p>Si vous souhaitez échanger sur <strong>la région de {Country_FR} qui correspond le mieux à la manière réelle dont votre famille utilise un bien</strong> — plutôt qu'à la version brochure — <a href="#newsletter">inscrivez-vous à notre liste</a> et nous reviendrons vers vous avec des alertes de nouveaux biens et une présentation personnalisée de l'équipe.</p>
```

---

## When you find new identical content across pillars

If during a translation you notice a paragraph or block that's near-identical between
two pillars (e.g. the §F LLC mechanics intro — almost the same sentence in every pillar),
extract it here as a new block. The next translator will thank you.
