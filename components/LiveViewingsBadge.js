/**
 * components/LiveViewingsBadge.js
 *
 * Small floating chip in the bottom-right corner:
 *   [• LIVE]  Viewings →
 * with a pulsing red dot. Click → /viewings/.
 *
 * Behaviour:
 *   - Hidden on the /viewings/ page (no point sending someone where they are)
 *   - Hidden on /gallery/* (same rule the WhatsApp button uses)
 *   - Dismissable via × → remembers in localStorage so it doesn't reappear
 *   - On mobile, positioned ABOVE the WhatsApp button so they don't overlap
 *
 * Mounted globally from pages/_app.js.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { track } from '@vercel/analytics';

const LS_KEY = 'live_viewings_dismissed';

export default function LiveViewingsBadge() {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(true); // start hidden until we know
  const [visible, setVisible] = useState(false);

  // Read dismissal state once + reveal on scroll past the hero (so the chip
  // never sits on top of hero CTAs like "Browse properties"). Threshold is
  // intentionally low (220px) so even a small scroll triggers it on desktop,
  // but it's enough to clear the hero CTAs on mobile.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isDismissed = localStorage.getItem(LS_KEY) === '1';
    setDismissed(isDismissed);
    if (isDismissed) return;

    const REVEAL_AT = 220;

    function update() {
      setVisible(window.scrollY > REVEAL_AT);
    }
    update(); // in case the user lands deep-scrolled
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  // Hide on /viewings/ itself and on /gallery/*
  const hideOnRoute =
    router.pathname.startsWith('/viewings') ||
    router.pathname.startsWith('/gallery');

  if (dismissed || hideOnRoute) return null;

  function handleClose(e) {
    e.preventDefault();
    e.stopPropagation();
    setDismissed(true);
    try { localStorage.setItem(LS_KEY, '1'); } catch {}
  }

  function handleClick() {
    track?.('live_viewings_badge_click');
  }

  return (
    <div className={`lvb-wrap${visible ? ' lvb-visible' : ''}`} role="status" aria-label="Live viewings available">
      <Link
        href="/viewings/"
        className="lvb-chip"
        onClick={handleClick}
        aria-label="See upcoming viewings"
      >
        <span className="lvb-dot" aria-hidden="true">
          <span className="lvb-dot-pulse" />
          <span className="lvb-dot-core" />
        </span>
        <span className="lvb-label-eyebrow">Live</span>
        <span className="lvb-label-main">Viewings</span>
        <span className="lvb-arrow" aria-hidden="true">→</span>
      </Link>
      <button
        type="button"
        className="lvb-close"
        onClick={handleClose}
        aria-label="Dismiss live viewings"
      >
        ×
      </button>
    </div>
  );
}
