# Performance Audit — co-ownership-property.com

**Date:** 13 May 2026  
**Method:** Direct production fetches with curl, header analysis, `__NEXT_DATA__` payload inspection, codebase static analysis. Lighthouse/PSI quota was exhausted so scores aren't included; the findings below are based on measurements that don't depend on the PSI API.

---

## Headline numbers

| Page | HTTP code | Raw HTML | After Brotli | TTFB |
|---|---|---|---|---|
| `/` (home) | 200 | 128 KB | ~26 KB | 591 ms |
| `/our-homes/` | 200 | **663 KB** | **51 KB** | 724 ms |
| `/all-our-blog/` | 200 | **490 KB** | ~38 KB | 545 ms |
| `/blog/algarve-golden-triangle…/` | 200 | 137 KB | ~28 KB | 566 ms |
| `/blog/co-ownership-owner-survey-2026…/` | 200 | 54 KB | ~12 KB | 215 ms |
| `/property/apricale…/` | 200 | 64 KB | ~13 KB | n/a |
| `/es/` | 200 | 133 KB | ~27 KB | 549 ms |
| `/fr/` | 200 | 134 KB | ~27 KB | 588 ms |
| `/favourites/` | 200 | 12 KB | ~3 KB | 300 ms |

| Asset | Raw | Brotli | Ratio |
|---|---|---|---|
| Main JS chunk | 211 KB | 67 KB | 3.1x |
| Main CSS chunk (`globals.css` build) | 152 KB | 28 KB | 5.4x |
| `/our-homes/` HTML | 663 KB | 51 KB | 13x |
| Total JS+CSS (13 chunks) | ~700 KB | ~200 KB | — |

**The wire weight after Brotli is fine. The CPU cost of parsing the inflated payloads on mobile is not.** That's the central performance story.

---

## P0 — Critical (do first)

### 1. `/our-homes/` ships **417 KB of property JSON** in `__NEXT_DATA__` (~50 KB on the wire, but parses on every cold load)

`pages/our-homes.js` fetches all 347 properties from Supabase at build time and ships them all into the HTML so the client-side filter UI can work without further requests. Each property carries its `images` array (3 image URLs ~ 130 chars each), `img`, `driveUrl`, `title_es`, `title_fr`, `totalImages` — fields that the listing-page render doesn't use.

**Per property**, the hot fields are: `slug`, `title` (in current locale), `img` (single hero), `price`, `currency`, `country`, `region`, `city`, `beds`, `size`, `status`, `property_type`. ~700 bytes vs the current ~1,150 bytes.

**Fix:** in `pages/our-homes.js` `getStaticProps`, strip:
- `images` array (only `img` is needed for cards)
- `driveUrl` (only used on detail pages)
- `totalImages` (cosmetic, can compute client-side from `img` presence)
- `title_es` and `title_fr` (only the current-locale title is rendered; the locale-specific listing pages already exist at `/es/propiedades/` and `/fr/proprietes/`)

**Estimated win:** 417 KB → ~250 KB raw JSON (40% reduction); 51 KB → ~35 KB on the wire; **~100 ms less main-thread parse time on a mid-range mobile**.

### 2. `/all-our-blog/` ships **151 KB of post JSON** for 122 posts with always-on ES/FR fields

Same pattern: `pageProps.posts` carries `title`, `title_es`, `title_fr`, `excerpt`, `excerpt_es`, `excerpt_fr` for every post even though only one locale renders.

**Fix:** in `pages/all-our-blog.js` `getStaticProps`, only include the locale fields the page is actually rendered for. The Spanish/French versions live at `/es/blog/` and `/fr/blog/` and have their own builds — the English `/all-our-blog/` doesn't need ES/FR translations in its payload.

**Estimated win:** 151 KB → ~75 KB raw JSON; ~5–8 KB on the wire after Brotli.

### 3. Homepage preloads **13 images** — dilutes LCP priority

`pages/index.js` wraps Next.js's automatic LCP preload around the press-bar logos and several featured-property hero images. The browser is told to fetch all 13 with high priority simultaneously. The actual LCP image (the hero) competes for bandwidth with 8 press logos and 4 featured-property photos.

**Fix:** restrict `priority` / `fetchPriority="high"` to the single hero LCP image. The press logos can be `loading="lazy"` (they're below the fold on mobile). Featured property images can use the default lazy strategy.

**Estimated win:** LCP improvement of 200–500 ms on slow mobile connections; cleaner Largest Contentful Paint metric.

### 4. **Zero preconnect / dns-prefetch hints** — every cross-origin request pays full DNS+TLS cost

`pages/_document.js` has an empty `<Head />`. Every page load opens fresh connections to:
- `iotzzoxyckpyatzqcjbo.supabase.co` (every property image)
- `www.googletagmanager.com` (GA4)
- `connect.facebook.net` (Meta Pixel)
- `www.facebook.com` (Pixel tracking pings)
- `cdn.prod.website-files.com` (legacy blog images)

**Fix:** add to `_document.js`:
```jsx
<Head>
  <link rel="preconnect" href="https://iotzzoxyckpyatzqcjbo.supabase.co" />
  <link rel="preconnect" href="https://www.googletagmanager.com" />
  <link rel="dns-prefetch" href="https://connect.facebook.net" />
  <link rel="dns-prefetch" href="https://www.facebook.com" />
</Head>
```

**Estimated win:** 100–250 ms saved per cold connection on mobile (DNS + TCP + TLS handshake folded into idle time). Cumulative effect on LCP can be 200–400 ms.

---

## P1 — Important

### 5. `globals.css` is **256 KB raw** (7,590 lines, 100 `!important` declarations)

Loaded on every page even when most rules are unused. The compressed size (28 KB) is fine on the wire but the parse + style-recalc cost is non-trivial on mobile. The 100 `!important` uses indicate accumulated specificity battles — these break PurgeCSS-style automatic detection.

**Fix options (in order of effort):**
- Quick win: split into `globals-base.css` (header, footer, typography) and `globals-page.css` (page-specific blocks). Load the second only where needed.
- Medium: introduce PostCSS purging via `@fullhuman/postcss-purgecss` with safelist for dynamic classes — typically reduces by 60–80%.
- Large: migrate to CSS Modules per component (already partially done in `Home.module.css` — extend the pattern).

### 6. **11 font weight files** loaded (Playfair 6 variants + Nunito 5 weights)

`pages/_app.js`:
```js
const playfair = Playfair_Display({
  weight: ['400', '600'],
  style: ['normal', 'italic'],   // → 4 files
});
const nunito = Nunito_Sans({
  weight: ['300', '400', '600', '700', '800'],   // → 5 files
});
```

That's 9 woff2 files preloaded. Most pages use 2–3 weights. The fonts load via `next/font` so they're self-hosted (good) but the volume is excessive.

**Fix:** prune weights to what's actually used:
- Playfair: `400` + `600` italic (drop `400 italic` and `600 normal` if unused — audit needed)
- Nunito: `400` + `700` (drop `300`, `600`, `800` unless they appear in real content)

Run `grep -E "font-weight:\s*(300|600|800)" styles/ components/ pages/` to confirm before removing.

**Estimated win:** 4–6 fewer woff2 files = 50–100 KB saved on first load + faster font-display swap.

### 7. **Three third-party scripts on every page** — GA4, Google Ads, Meta Pixel

Each costs ~30–80 KB JS and runs on the main thread. All using `afterInteractive` (good) but still compete with hydration.

**Fix options:**
- Migrate to `worker` strategy via `next/script` + Partytown — moves them to a web worker, removes main-thread contention.
- Or: defer Meta Pixel until first interaction (it's only used for conversion attribution; the noscript fallback handles initial pageview).

**Estimated win:** 200–500 ms TBT (Total Blocking Time) improvement on mobile.

### 8. Property detail page also preloads **5 images** (probably the gallery thumbnails)

Same pattern as homepage but smaller scale. Only the hero photo is the LCP candidate; the rest can be lazy.

---

## P2 — Nice-to-haves

### 9. Property cards in `/our-homes/` slice 3 images per property (`.images.slice(0, 3)`)

Looking at the rendered HTML, each card has 3 `<Image>` tags for the hover-scroll image rotator. That's 24 cards × 3 = 72 image requests on the listing page even though only the first is visible until hover. With `loading="lazy"` they're deferred but still trigger requests when scrolled into view.

**Fix:** lazy-load the 2nd and 3rd images only on first hover/touch (intersection observer + on-demand swap), not on scroll.

### 10. Large redirect array in `next.config.js` (40+ entries)

WordPress-era blog post redirects are defined inline. Works fine but the `nextConfig.redirects` function is invoked on every cold-start. Better as Vercel `vercel.json` redirects (handled at edge before Next.js boots) or as a middleware lookup table.

**Estimated win:** ~10–20 ms faster cold-start; no runtime impact on already-warm requests.

### 11. WhatsApp FAB inline SVG in `_app.js`

Adds ~600 bytes to every page's HTML. Could be a CSS background-image (would benefit from sprite caching across pages). Marginal.

---

## What's already healthy ✅

- **HTTP/2** across the board (no HTTP/3 yet but H2 is fine).
- **Brotli compression** working with 3.1–13x ratios.
- **Vercel CDN cache HIT** on most pages — `cache-control: public, s-maxage=...` is set.
- **TTFB** 200–750 ms — acceptable for a SSG-rendered site.
- **Next.js Image** with `loading="lazy"` and proper `sizes` attribute on property cards.
- **Self-hosted Google fonts** via `next/font` (avoids third-party DNS hop).
- **`display: swap`** on fonts — text shows immediately with fallback, swaps when font loads.
- **Vercel image optimisation** working — `/_next/image/?url=…&w=…&q=75`.
- **Property detail pages** are clean: 64 KB HTML, 16 KB `__NEXT_DATA__`, 11 image tags.

---

## Recommended sequencing

Best ROI in this order:

1. **Strip the listing-page payloads** (P0 #1 + #2) — 1 hour of work, immediate measurable wins.
2. **Add preconnect/dns-prefetch** (P0 #4) — 10 minutes, easy win.
3. **Fix the LCP image preload count** (P0 #3) — 30 minutes per page that has it.
4. **Audit and prune font weights** (P1 #6) — 45 minutes, ~100 KB saved.
5. **Move Meta Pixel + GA to Partytown** (P1 #7) — 2 hours, biggest TBT improvement.
6. **CSS purge** (P1 #5) — half-day, requires regression testing.

Items 1–3 alone should improve mobile Lighthouse Performance by an estimated 8–15 points and shave 400–800 ms off LCP on slow mobile connections.

---

## Unmeasured / next steps

To complete the audit when PSI quota refreshes (24h), add:
- Lighthouse Performance scores per page type
- Core Web Vitals from real-user CrUX data (https://crux-compare.web.app)
- Network waterfall analysis on a slow-3G simulated profile (Chrome DevTools)
- INP measurements (Interaction to Next Paint replacing FID in Core Web Vitals)
