// ── GA4 event helper ─────────────────────────────────────────────────────────
// Call from any component to fire a GA4 event.
// Also fires fbq (Meta Pixel) if it's been loaded.

export const GA_ID = 'G-83RBNEXX4E';

export function gtagEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params);
  }
}

// Meta Pixel event helper — fires when fbq is available
export function fbqEvent(eventName, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.fbq === 'function') {
    window.fbq('track', eventName, params);
  }
}

// Fire both GA4 + Meta in one call
export function trackConversion(ga4Event, metaEvent, params = {}) {
  gtagEvent(ga4Event, params);
  if (metaEvent) fbqEvent(metaEvent, params);
}
