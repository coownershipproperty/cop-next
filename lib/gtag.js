// ── GA4 event helper ─────────────────────────────────────────────────────────
// Call from any component to fire a GA4 event.
// Also fires fbq (Meta Pixel) and Google Ads conversion if loaded.

export const GA_ID = 'G-83RBNEXX4E';
export const GADS_ID = 'AW-4882418749';

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

// Fire Google Ads conversion event
export function gadsConversion(sendTo, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'conversion', { send_to: sendTo, ...params });
  }
}

// Fire both GA4 + Meta + Google Ads in one call
export function trackConversion(ga4Event, metaEvent, params = {}) {
  gtagEvent(ga4Event, params);
  if (metaEvent) fbqEvent(metaEvent, params);
  // Fire Google Ads lead conversion
  gadsConversion(`${GADS_ID}/generate_lead`);
}
