/**
 * components/GeoDestinationNudge.js
 *
 * Subtle contextual chip that appears in the bottom-right corner ONLY when
 * the visitor's detected city (via Vercel edge geo headers) matches one of
 * COP's destinations. Reads:
 *
 *   "In Mallorca? See homes nearby →"
 *
 * Click → /our-homes/?country=Spain&region=Mallorca&fromGeo=1
 *         (the page reads the query and seeds its filter state; the fromGeo
 *          flag triggers a "Currently in Mallorca? Want to visit one of these
 *          homes?" banner at the top of the listings — that's the visit CTA.)
 *
 * Behaviour:
 *   - Hidden on /our-homes/* (already there) and /gallery/* (consistent with
 *     other floating elements)
 *   - Hidden if the user has dismissed this destination before (per-destination
 *     localStorage key — switching destinations re-arms it)
 *   - Scroll-triggered, like LiveViewingsBadge — won't cover hero CTAs
 *   - Stacks above LiveViewingsBadge on mobile if both fire (rare — LiveViewings
 *     is hidden on /viewings/ pages whereas this nudge is hidden on /our-homes/,
 *     so the destinations they target overlap minimally)
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { track } from '@vercel/analytics';

const REVEAL_AT = 220; // px scroll before chip appears

export default function GeoDestinationNudge() {
  const router = useRouter();
  const [match, setMatch] = useState(null); // null = unknown, false = no match, object = matched
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  // Hide on routes where this chip would be redundant
  const hideOnRoute =
    router.pathname.startsWith('/our-homes')
    || router.pathname.startsWith('/gallery')
    || router.pathname.startsWith('/admin');

  // Fetch the geo match once on mount
  useEffect(() => {
    if (hideOnRoute) return;
    if (typeof window === 'undefined') return;
    let cancelled = false;
    fetch('/api/geo-match')
      .then(r => r.ok ? r.json() : { match: false })
      .then(data => {
        if (cancelled) return;
        if (!data?.match) { setMatch(false); return; }
        // Per-destination dismissal — re-arms when the destination changes
        // (e.g. visitor moves from Mallorca → Ibiza)
        const dismissKey = `geo_nudge_dismissed:${data.slug}`;
        if (localStorage.getItem(dismissKey) === '1') {
          setDismissed(true);
          setMatch(false);
          return;
        }
        setMatch(data);
      })
      .catch(() => setMatch(false));
    return () => { cancelled = true; };
  }, [hideOnRoute]);

  // Tag the body when this chip is actively shown so the generic
  // LiveViewingsBadge can yield via CSS (`body.has-geo-nudge .lvb-wrap{display:none}`).
  // Avoids the bottom-right cluster showing two near-identical red-pulse chips.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const shouldTag = !!match && !dismissed && !hideOnRoute;
    if (shouldTag) document.body.classList.add('has-geo-nudge');
    else document.body.classList.remove('has-geo-nudge');
    return () => document.body.classList.remove('has-geo-nudge');
  }, [match, dismissed, hideOnRoute]);

  // Reveal on scroll (mirrors LiveViewingsBadge so the entrance feels consistent)
  useEffect(() => {
    if (!match || dismissed) return;
    if (typeof window === 'undefined') return;
    function update() {
      setVisible(window.scrollY > REVEAL_AT);
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [match, dismissed]);

  if (!match || dismissed || hideOnRoute) return null;

  function handleClose(e) {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    try {
      localStorage.setItem(`geo_nudge_dismissed:${match.slug}`, '1');
    } catch {}
  }

  function handleClick() {
    try { track?.('geo_nudge_click', { destination: match.slug, city: match.city }); } catch {}
  }

  // Build the filtered /our-homes/ URL. fromGeo=1 tells the listings page to
  // show the "Want to visit one of these homes?" banner at the top.
  const targetUrl = `/our-homes/?country=${encodeURIComponent(match.country)}&region=${encodeURIComponent(match.region)}&fromGeo=1`;

  // Strip leading articles from labels like "the Côte d'Azur" → "Côte d'Azur"
  // so the chip reads "Côte d'Azur live viewing" not "the Côte d'Azur live viewing".
  const cleanLabel = String(match.label).replace(/^the\s+/i, '');

  return (
    <div className={`gdn-wrap${visible ? ' gdn-visible' : ''}`} role="status" aria-label={`Live viewing available near ${cleanLabel}`}>
      <Link href={targetUrl} className="gdn-chip" onClick={handleClick} aria-label={`Request a viewing in ${cleanLabel}`}>
        <span className="gdn-dot" aria-hidden="true">
          <span className="gdn-dot-pulse" />
          <span className="gdn-dot-core" />
        </span>
        <span className="gdn-label-main">{cleanLabel}</span>
        <span className="gdn-label-eyebrow">Live viewing</span>
        <span className="gdn-arrow" aria-hidden="true">→</span>
      </Link>
      <button type="button" className="gdn-close" onClick={handleClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
