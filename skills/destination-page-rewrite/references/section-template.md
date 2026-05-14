# Section template — exact HTML markup per section

This is the proven section structure from the France pillar. Copy these patterns; adapt only the destination-specific copy. Every section uses `<section class="dest-sec [white|cream]"><div class="dest-inner">...</div></section>` and bands ALTERNATE: cream → white → cream → white → cream → white → cream.

The renderer (`pages/[slug].js`) splits the body at the FIRST `class="dest-mid-cta"` marker. Everything before that = hero. Everything after = restHtml (the editorial body the TOC + Article schema work over).

---

## File scaffold (entire body)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{Destination} Fractional Ownership Properties | Co-Ownership Property</title>
  <meta name="description" content="Co-ownership properties in {Destination} from COP — deeded fractional ownership in [3 named clusters]. Professionally managed, 6–7 weeks of personal use per year, real equity in some of [region]'s most desirable second-home regions.">
</head>
<body>
  <!-- HERO -->
  <!-- MID-CTA -->
  <!-- §A through §G as below -->
</body>
</html>
```

---

## HERO (60–80 words, before the mid-CTA marker)

```html
<section class="page-hero">
  <p class="eyebrow">{Destination} · {Region or Continent}</p>
  <h1>{Destination} Fractional Ownership <em>Properties</em></h1>
  <p class="subtitle">[1–2 destination-specific sentences. Never the generic "Not timeshare. Real deeded ownership..." boilerplate. Reference the destination's most distinctive features and the value proposition for fractional buyers.]</p>
</section>
```

Eyebrow examples:
- Country pillars: `Spain · Europe`, `France · Europe`, `Italy · Europe`, `USA · North America`
- Regions: `Mallorca · Spain`, `French Alps · France`, `California · USA`
- Cities: `Aspen · Colorado · USA`, `Paris · France`

---

## MID-CTA (80–100 words, marks the start of restHtml)

```html
<div class="dest-mid-cta">
  <div class="dest-mid-cta-inner">
    <h2>{Destination}'s most coveted addresses, accessible through co-ownership.</h2>
    <p>Fully managed [property types: villas, chalets, apartments] across [3 cluster zones]. Your 1/8 deeded share comes with 6–7 weeks of personal use, a professional management team on call, and the long-term equity of one of [region]'s most supply-constrained second-home markets.</p>
    <div class="dest-mid-cta-btns">
      <a href="/our-homes/" class="btn btn-gold">Browse All Properties</a>
      <a href="#newsletter" class="btn btn-outline">Get Updates</a>
    </div>
  </div>
</div>
```

The `.btn-outline` text-on-navy bug is fixed in `globals.css` (white text by default, gold on hover) — no need to override per-page.

---

## §A "Why {Destination}?" — opens with featured snippet, then prose (cream band)

```html
<section class="dest-sec cream">
  <div class="dest-inner">
    <!-- Optional country-pillar hero figure goes HERE, before the snippet -->
    <figure class="dest-figure">
      <img src="https://a.storyblok.com/..." alt="..." loading="lazy" />
      <figcaption>...</figcaption>
    </figure>

    <!-- FEATURED SNIPPET — position-zero target -->
    <div class="dest-snippet" itemscope itemtype="https://schema.org/Question">
      <h2 itemprop="name">What is fractional ownership in {Destination}?</h2>
      <div itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer">
        <p itemprop="text"><strong>Fractional ownership in {Destination} means buying a deeded 1/8 share of a luxury [property type] — a [example 1], a [example 2], or a [example 3] — held in a purpose-built LLC alongside seven other co-owners.</strong> Each owner receives approximately 45 days of personal use per year through a fair-rotation calendar, with all property management, maintenance, taxes and operations handled by a professional team. It is real, recorded property equity in your name — not a timeshare, not a holiday club.</p>
      </div>
    </div>

    <!-- §A H2 + 3 paragraphs (≈800–1,300 words for pillar) -->
    <h2>Why {Destination}?</h2>

    <p>[Opening paragraph: the structural / supply / legal argument. Hits primary keyword "fractional ownership in {Destination}" in the first 80 words. ~250 words.]</p>

    <p>[Second paragraph: COP's LLC framing — consistency across global portfolio, NOT liability protection. ~250 words. Use "**purpose-built LLC**" framing once per section, bolded.]</p>

    <!-- Optional inline callout for a key claim -->
    <div class="dest-callout">
      <strong>{Country} in three numbers:</strong> [3 country-true facts separated by ·]
    </div>

    <p>[Third paragraph: the lifestyle / diversity argument. Why this country gives the buyer multiple modes (mountain + coast + city, etc). ~300 words.]</p>
  </div>
</section>
```

Note: the `<div class="dest-callout">` rendered at the top of §A (a "{Country} in three numbers" type) is OPTIONAL on country pillars — only use if every stat is country-wide true. Stats like "300+ days of sun on the Côte d'Azur" are region-scoped and DO NOT BELONG on country pillars. Reserve stats bands for region/city pages.

---

## §B "Where to own in {Destination}" (white band)

```html
<section class="dest-sec white">
  <div class="dest-inner">
    <h2>Where to own in {Destination}</h2>

    <p>[Intro paragraph: 100–150 words on the cluster structure. "[Destination] is shorthand for X distinct sub-regions, each with its own architectural code, demographic and price band. The major clusters for fractional ownership are below."]</p>

    <h3>{Cluster 1 name}</h3>

    <p>[300–600 words on this cluster's character: named towns, architectural style, who buys here, climate, distinctive features. Include Storyblok external link to official tourism site. End with bold "Best for:" line.]</p>

    <figure class="dest-figure">
      <img src="https://a.storyblok.com/..." alt="..." loading="lazy" />
      <figcaption>...</figcaption>
    </figure>

    <p>[Optional second paragraph for this cluster, 200 words.]</p>

    <p><strong>Best for:</strong> [1–2 sentences naming the buyer profile this cluster suits — "design-led couples and families who want the strongest brand equity"; "active families with school-age children who ski"; "cultural enthusiasts wanting a Paris base for repeated short stays"].</p>

    <h3>{Cluster 2 name}</h3>
    <!-- repeat pattern -->

    <h3>{Cluster 3 name}</h3>
    <!-- repeat pattern -->
  </div>
</section>
```

§B word count by tier:
- Pillar: ~2,300 words across 3–6 H3s
- Region: ~2,500 words across 4–6 H3s
- City: ~1,500 words across 3–4 H3s

---

## §C "A year in your {Destination} co-ownership home" (cream band)

Four seasonal H3s, each 300–400 words. Each season grounds in: weather (Celsius first), named events/markets/festivals, named towns/restaurants/parks, what use-pattern the season suits.

```html
<section class="dest-sec cream">
  <div class="dest-inner">
    <h2>A year in your {Destination} co-ownership home</h2>

    <p>[Optional 80-word intro on owner usage patterns. Can include "How owners actually use their 45 days" callout.]</p>

    <div class="dest-callout">
      <strong>How owners actually use their 45 days:</strong> [destination-specific usage breakdown across the 4 seasons.]
    </div>

    <h3>Spring (March–May)</h3>
    <p>[Weather in °C (°F), what the destination looks like in spring, named events (e.g. Cannes Film Festival, Roland-Garros), best activities for owners with peak-season alternatives. 350 words.]</p>

    <h3>Summer (June–August)</h3>
    <p>[Peak season usage, named events (Bastille Day, Provence markets, alpine summer hikes). 350 words.]</p>

    <h3>Autumn (September–November)</h3>
    <p>[The locals' favourite, harvest, golden city light, early-season alpine snow. 350 words.]</p>

    <h3>Winter (December–February)</h3>
    <p>[Peak Alps season + winter alternatives in other clusters. 350 words.]</p>
  </div>
</section>
```

---

## §D "Who buys in {Destination}, and why" (white band)

```html
<section class="dest-sec white">
  <div class="dest-inner">
    <h2>Who buys in {Destination}, and why</h2>

    <p>[200–300 words: international buyer mix (British, American, Dutch, Belgian, German, Swiss, etc — be specific to the destination), drive-time / flight-time accessibility, multi-region patterns.]</p>

    <p>Fractional ownership in {Destination} typically suits:</p>
    <ul>
      <li><strong>Active families with school-age children</strong> — [1–2 sentences explaining why this destination works for this persona].</li>
      <li><strong>Multi-generational groups</strong> — [...].</li>
      <li><strong>Skiing couples in their 50s and 60s</strong> — [if alpine destination].</li>
      <li><strong>Cultural enthusiasts choosing {city}</strong> — [if city pillar].</li>
      <li><strong>Wine-and-food sophisticates choosing {region}</strong> — [if relevant].</li>
    </ul>
  </div>
</section>
```

---

## §E "Practicalities: getting there, what it costs, what you own" (cream band)

```html
<section class="dest-sec cream">
  <div class="dest-inner">
    <h2>Practicalities: getting there, what it costs, what you own</h2>

    <h3>Getting there</h3>
    <p>[Airports per region with codes (e.g. CDG, ORY, NCE, MRS, GVA, LYS, CMF for France). Train networks (TGV, Eurostar). Drive times. 250 words.]</p>

    <h3>What it costs — the comparison that matters</h3>
    <p>[Intro paragraph framing the comparison NOT as specific euros but as ratios. ~120 words.]</p>

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
          <td data-col="Whole second home">6–24 months on the open market</td>
          <td data-col="COP 1/8 share">~2–3 months across COP portfolio</td>
          <td data-col="Long-term rental">End of lease term</td>
        </tr>
      </tbody>
    </table>

    <p>[Follow-up paragraph: comparative-not-absolute summary of why fractional beats both alternatives. ~200 words.]</p>

    <h3>What's included in the annual service charge — and what isn't</h3>
    <p>[Comparative framing — "roughly one-eighth of the carry on the equivalent whole property". List of what's included (taxes, insurance, management, scheduling, linen, maintenance reserve). What's NOT included (large capital improvements, personal staff costs, damage from owner's own use). ~300 words.]</p>

    <h3>What you actually own</h3>
    <p>[1/8 share recorded in country's land registers, transferable, inheritable, appreciates with the property. ~150 words.]</p>
  </div>
</section>
```

The `data-col` attributes on `<td>` are REQUIRED for mobile responsive rendering — the CSS uses them to label each row when the table stacks.

---

## §F "How fractional ownership works in {Country}" (white band)

```html
<section class="dest-sec white">
  <div class="dest-inner">
    <h2>How fractional ownership works in {Country}</h2>

    <p>[Intro paragraph: COP's LLC framing — purpose-built LLC, equal membership interests, modern international structure. Specifically NOT about liability protection — about consistency and resale ease. ~200 words.]</p>

    <h3>How the LLC structure holds {country} property</h3>
    <p>[200 words on the mechanical structure. Stay positive — consistency, simplicity, single international relationship. NEVER "limited liability protects your personal assets" framing.]</p>

    <h3>Property tax and your service charge</h3>
    <p>[Country-specific tax treatment: French taxe foncière vs taxe d'habitation; US property tax variations; Spanish IBI; Italian IMU. Comparative not absolute. ~250 words.]</p>

    <h3>Inheritance and transfer</h3>
    <p>[Country-specific inheritance rules. France: réserve héréditaire + 2015 EU Succession Regulation. US: inheritance via LLC membership transfer, simpler than direct title. Spain: succession tax considerations. ~200 words.]</p>

    <h3>The professional management model and how the calendar works</h3>
    <p>[Same model in every country — professional management, fair-rotation calendar, peak weeks rotated, included service charge covers the operational stack. ~200 words.]</p>

    <h3>Resale: how to exit, typical timelines</h3>
    <p>[Two-route resale (managed + open market). Comparative framing — "carrying costs of holding a whole {country} villa through a slow open-market sale can add up to a meaningful fraction of the sale price". 2–3 months typical via managed route. NEVER specific euro guesses. Link out to /co-ownership-explained/. ~250 words.]</p>

    <p>The full mechanics of fractional ownership across all jurisdictions — usage calendars, exit procedures, rental income treatment, insurance, the transfer on death, the relationship with the management company — are covered in our <a href="/co-ownership-explained/">co-ownership explained guide</a>. For specific {country} property availability, browse the listings in the property grid above, or <a href="#newsletter">join our list</a> for new-property alerts as they come to market.</p>

    <h3>Your ownership at a glance</h3>
    <ul>
      <li><strong>Real, deeded equity in your name</strong> — your 1/8 share is recorded in {country}'s land registers, transferable, inheritable, and it appreciates with the underlying property.</li>
      <li><strong>Consistent international structure</strong> — your {country} share sits inside the same purpose-built LLC framework COP uses for properties worldwide, so multi-country owners deal with one model rather than a stack of different vehicles.</li>
      <li><strong>Fully managed throughout</strong> — the management company handles taxes, insurance, maintenance, scheduling, linen, the on-call concierge. You arrive, the property is ready.</li>
      <li><strong>Supported resale through COP's owner network</strong> — when you decide to exit, the managed-resale path connects you to the existing wait list and broader buyer pool, typically clearing in 2–3 months.</li>
      <li><strong>Designed for international portfolios</strong> — the LLC model means owning across multiple COP destinations becomes one consolidated relationship rather than juggling country-specific structures.</li>
    </ul>
  </div>
</section>
```

NEVER include a "Things to verify before signing" or similar checklist-of-risks. Replace with the positive "Your ownership at a glance" 5-bullet list.

---

## §G "Still deciding which {Country} region?" — PILLAR PAGES ONLY (cream band)

Skip this section on region pages and city pages. Pillar-only.

```html
<section class="dest-sec cream">
  <div class="dest-inner">
    <h2>Still deciding which {Country} region?</h2>

    <p>[Paragraph 1: when to choose Cluster A — the lifestyle/usage/budget profile. ~200 words.]</p>

    <p>[Paragraph 2: when to choose Cluster B. ~200 words.]</p>

    <p>[Paragraph 3: when to choose Cluster C. ~200 words.]</p>

    <p>Whichever way the decision goes, the deeper exploration starts on the cluster pages:</p>
    <ul>
      <li><a href="/{cluster-1-slug}/">Explore the {Cluster 1} →</a></li>
      <li><a href="/{cluster-2-slug}/">Explore the {Cluster 2} →</a></li>
      <li><a href="/{cluster-3-slug}/">Explore {Cluster 3} →</a></li>
    </ul>

    <p>If you would like to talk through <strong>which region best fits your family's actual use pattern</strong> — rather than the brochure version of it — <a href="#newsletter">join our list</a> and we will be in touch with relevant new-property alerts and an introduction to the team.</p>
  </div>
</section>
```

The renderer's "Regions in {Country}" cluster nav block automatically appears AFTER restHtml on pillar pages — §G's bullet links plus the cluster nav give the reader two paths to the cluster pages. "Also Explore" pills are auto-hidden on pillar pages (handled in `pages/[slug].js`).

---

## Section ordering and band rhythm

Bands ALTERNATE: cream → white → cream → white → cream → white → cream.

For a country pillar (§A through §G):
- §A cream
- §B white
- §C cream
- §D white
- §E cream
- §F white
- §G cream

For a region (§A through §F, no §G):
- §A cream
- §B white
- §C cream
- §D white
- §E cream
- §F white

For a city (§A through §F):
- Same as region.

The cream renderer-injected "Regions in {Country}" cluster nav block at the very end of the body provides the closing cream band on pillars. After that comes the FAQ section (rendered from JSON), Newsletter, Footer.
