# Routing setup for destination pillars in DE / ES / FR

Each locale renders destination pages through a dynamic `[slug].js` route that reads from
`content/destinations/{locale}/<slug>.html` and wraps it in the standard COP shell
(Header, breadcrumbs, TOC, FAQ, Newsletter, Footer).

This file documents the URL structure, slug map, and the boilerplate for the route
handler files.

---

## URL structure

| Locale | URL pattern | Folder |
|---|---|---|
| EN | `/<slug>/` | `content/destinations/<slug>.html` (renders via `pages/[slug].js`) |
| DE | `/de/destinationen/<slug>/` | `content/destinations/de/<slug>.html` (renders via `pages/de/destinationen/[slug].js`) |
| ES | `/es/destinos/<slug>/` | `content/destinations/es/<slug>.html` (renders via `pages/es/destinos/[slug].js` ⚠️ may need creation) |
| FR | `/fr/destinations/<slug>/` | `content/destinations/fr/<slug>.html` (renders via `pages/fr/destinations/[slug].js` ⚠️ may need creation) |

---

## Slug map for the 5 main pillars

Slugs are SHORT in non-EN locales (just country name, no "fractional-ownership-properties"
suffix) because the URL prefix already encodes the page family.

| Country | EN slug | DE slug | ES slug | FR slug |
|---|---|---|---|---|
| Spain | `spain-fractional-ownership-properties` | `spanien` | `espana` | `espagne` |
| France | `france-fractional-ownership-properties` | `frankreich` | `francia` | `france` |
| Italy | `italy-fractional-ownership-properties` | `italien` | `italia` | `italie` |
| USA | `usa-fractional-ownership-properties` | `usa` | `estados-unidos` | `etats-unis` |
| Portugal | `portugal-fractional-ownership-properties` | `portugal` | `portugal` | `portugal` |

(For other destinations the same pattern applies — locale slug = locale-language country/region/city name, hyphenated, no accents.)

---

## Slug normalisation rules

- Lowercase only
- ASCII (no accents — `etats-unis` not `états-unis`, `espana` not `españa`)
- Hyphens between words (`estados-unidos`, `cote-dazur`, `lac-de-come`)
- Drop the apostrophes (`cote-dazur`, `val-daran`)
- For destinations with the same name in multiple locales (Portugal, Madrid, Ibiza,
  Barcelona, Aspen, Vail), the slug is the same across locales.

---

## ROUTE_MAP / i18n integration

`lib/i18n.js` exposes `ROUTE_MAP` for static-page cross-linking. Each pillar gets entries:

```js
'/spain-fractional-ownership-properties/': {
  de: '/de/destinationen/spanien/',
  es: '/es/destinos/espana/',
  fr: '/fr/destinations/espagne/',
}
```

Add one entry per main pillar so the language switcher can correctly cross-link between
locales when the user clicks EN/ES/FR/DE on the pillar page.

For dynamic-route pages, `Header.js` already handles destination cross-linking via
`DYNAMIC_URL_FAMILIES` — make sure the `destinations` family entry in there has the
right per-locale prefixes:

```js
{
  family: 'destinations',
  prefixes: {
    en: '/',
    es: '/es/destinos/',
    fr: '/fr/destinations/',
    de: '/de/destinationen/',
  },
}
```

(This entry already exists — verify it's correct.)

---

## Boilerplate — `pages/es/destinos/[slug].js` (create if missing)

Mirror `pages/de/destinationen/[slug].js`. The minimal structure:

```jsx
import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { renderDestinationBody } from '@/lib/destination-renderer';
import { getDestinationFaqs } from '@/lib/destination-faqs';

export async function getStaticPaths() {
  const dir = path.join(process.cwd(), 'content/destinations/es');
  const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  const paths = files
    .filter(f => f.endsWith('.html'))
    .map(f => ({ params: { slug: f.replace(/\.html$/, '') } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const file = path.join(process.cwd(), 'content/destinations/es', `${params.slug}.html`);
  const html = fs.readFileSync(file, 'utf8');
  const rendered = renderDestinationBody(html, { locale: 'es', slug: params.slug });
  const faqs = getDestinationFaqs(params.slug, 'es');
  return { props: { ...rendered, faqs, slug: params.slug } };
}

export default function EsDestino({ title, description, hero, restHtml, faqs, slug }) {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
      </Head>
      <Header />
      <article dangerouslySetInnerHTML={{ __html: hero + restHtml }} />
      {/* FAQ section */}
      {/* Newsletter */}
      <Footer />
    </>
  );
}
```

(The actual file may need additional bits — schema injection, breadcrumbs, hreflang,
TOC. Look at `pages/de/destinationen/[slug].js` and copy/adapt.)

---

## sitemap.xml

After translating each pillar, add the new URLs to `pages/sitemap.xml.js` (or wherever
the sitemap is generated) so search engines find them. Pattern:

```
https://co-ownership-property.com/de/destinationen/spanien/
https://co-ownership-property.com/es/destinos/espana/
https://co-ownership-property.com/fr/destinations/espagne/
```

---

## Hreflang tags

Each pillar should emit `<link rel="alternate" hreflang="de" href="...">` etc. for the
4 locales. The destination renderer should handle this automatically via `lib/hreflang.js`
(or equivalent) — verify on the live page after deployment.

---

## After translating the first pillar, verify routing

Before moving to the next pillar, smoke-test the new URLs:

```bash
# After Vercel rebuilds
curl -sI -A "Mozilla/5.0" "https://co-ownership-property.com/es/destinos/espana/" | head -5
# Should return 200 OK, not 404

# Verify the language switcher cross-links work
curl -s -A "Mozilla/5.0" "https://co-ownership-property.com/spain-fractional-ownership-properties/" | grep -oE 'hreflang="(de|es|fr)"[^>]*' | head
# Should show alternate links to the new translated pages
```

If 404s appear, ROUTE_MAP / DYNAMIC_URL_FAMILIES likely needs the new slug.
