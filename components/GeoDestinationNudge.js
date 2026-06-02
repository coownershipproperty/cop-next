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

  return (
    <div className={`gdn-wrap${visible ? ' gdn-visible' : ''}`} role="status" aria-label={`Co-ownership homes near ${match.label}`}>
      <Link href={targetUrl} className="gdn-chip" onClick={handleClick} aria-label={`See ${match.count} homes near ${match.label}`}>
        <span className="gdn-pin" aria-hidden="true">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 1.5C5.24 1.5 3 3.74 3 6.5c0 3.5 5 8 5 8s5-4.5 5-8c0-2.76-2.24-5-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" fill="currentColor"/>
          </svg>
        </span>
        <span className="gdn-text">
          In <strong>{match.label}</strong>? See homes nearby
        </span>
        <span className="gdn-arrow" aria-hidden="true">→</span>
      </Link>
      <button type="button" className="gdn-close" onClick={handleClose} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
