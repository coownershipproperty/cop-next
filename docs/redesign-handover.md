
---

## Redesign 2 — 20 Sep 2026 (supersedes the branch notes above)

David's decision on 20 Sep: the whole site goes **dark, in the Rently structure**
(https://rently.framer.website/ — layout, rhythm and motion; our own code and
assets, never theirs), one sans throughout (Poppins display, Inter text —
Playfair is gone), and **no hero video**: dark-graded stills of our own homes
from David's ChatGPT set (`public/redesign/`, WebP, see the manifest that came
with the bundle for which listing each image belongs to). Those stills are
atmosphere — hero, section bands, destination tiles — and must never be put
inside a listing's own gallery, because they are AI re-grades, not photos.

### Branch

`redesign2`, cut from `main` at 9967296 (20 Sep). The old `redesign` branch is
retired; its scroll/reveal libs and `_app` wiring were carried over in f25ad44.
Preview: **https://cop-next-git-redesign2-domosno.vercel.app/** (Vercel auth —
open in David's Chrome). Working clone lives in device scratch (`/tmp/copwork`,
recreate with the clone recipe above); the mount at `~/mnt/cop-next` is still
on `main`.

### What is done

- `styles/redesign.css` — dark tokens + primitives + every homepage component,
  plus scoped dark restyles of the existing `Newsletter`, `ExpertForm` and
  `Footer` components (they are reused, not rewritten — they carry ten locales).
- `components/rd/Nav.js` — floating light pill, locale-aware via `lib/i18n`,
  mobile sheet is a *sibling* of the pill (never under a transformed ancestor).
- `pages/index.js` — Rently structure with COP content: hero + live numbers,
  press strip (labelled as the operators' coverage), featured 4-up, destination
  tiles with live counts, four values, articles, FAQ, newsletter, enquiry, CTA.
  Numbers (homes, countries, operators, from-price) are computed from the live
  inventory at build — nothing typed in. FAQ "45 days" corrected to "around six
  weeks". Homeowner-story cards were dropped: their photos are stock and read
  as invented people.

### Gotchas found

- `.rd a { color: inherit }` out-specified `.rd-btn` (0,1,1 vs 0,1,0) and made
  every button label invisible. The reset is now `:where(.rd) a`. Any new
  component that sets its own link colour needs ≥ (0,1,0) and to come after it.
- A fast inertial scroll can jump a short block clean over the viewport; the
  reveal observer now also fires when `boundingClientRect.bottom < 0`.
- `next dev` cannot run in the device VM against the mount's `node_modules`
  (Turbopack refuses the out-of-root symlink; webpack takes > 3 min to compile
  the homepage). Verify by pushing the branch once and reading the preview in
  Chrome — one build per batch of fixes.

### Next

1. Spain has no dark image in the set (our second-largest market) — ask
   ChatGPT for Mallorca / Costa del Sol / Costa Brava evening shots.
2. `our-homes` and the property page in the dark system, folding in the
   19 Sep content rewrite (six-row "What you're actually buying", question
   chips, question field — see `previews/property-page-*.html`).
3. About, how-it-works, blog, contact, locale homepages.
4. Retire the legacy `.cop-header` once every public page is on `rd/Nav`.
