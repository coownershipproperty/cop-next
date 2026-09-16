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

/**
 * A distinctly-named GA4 event for each kind of lead, alongside the shared
 * `generate_lead`.
 *
 * Until 16 Sep 2026 GA4 had no idea what was happening on this site: the only
 * events marked as key events were `form_start` (1,335 of them — someone
 * clicking into a field) and `form_submit` (34). `generate_lead` fired 1,660
 * times and counted for nothing, and there was no event at all for a gallery
 * unlock, a brochure request or a newsletter sign-up, so nine months of
 * channel and landing-page comparisons were made on form starts.
 *
 * Every lead now fires twice: `generate_lead` (one number to mark as a key
 * event, and what Google Ads optimises against) and a specific name, so the
 * Events report answers "how many galleries were unlocked in August" without
 * a custom exploration.
 */
const LEAD_EVENT_BY_CATEGORY = {
  floor_plan_unlock:  'gallery_unlock',
  gallery_unlock:     'gallery_unlock',
  discreet_brochure:  'brochure_requested',
  enquiry:            'enquiry_submitted',
  property_enquiry:   'enquiry_submitted',
  gallery_enquiry:    'enquiry_submitted',
  collection_enquiry: 'enquiry_submitted',
  tour_request:       'tour_requested',
  newsletter:         'newsletter_signup',
  popup:              'newsletter_signup',
};

// Fire both GA4 + Meta + Google Ads in one call
export function trackConversion(ga4Event, metaEvent, params = {}) {
  gtagEvent(ga4Event, params);

  // The specific name, derived from event_category (or `method` on the
  // newsletter/pop-up sign-ups, which carry no category).
  const kind = params.event_category || params.method || null;
  const specific = kind ? LEAD_EVENT_BY_CATEGORY[kind] : null;
  if (specific && specific !== ga4Event) gtagEvent(specific, params);

  if (metaEvent) fbqEvent(metaEvent, params);
  // Fire Google Ads lead conversion
  gadsConversion(`${GADS_ID}/generate_lead`);
}
