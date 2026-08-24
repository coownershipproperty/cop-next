const FIRST_TOUCH_KEY = 'cop:first-touch:v1';

function safeHttpUrl(value) {
  if (!value) return null;
  try {
    const parsed = new URL(String(value), window.location.origin);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href.slice(0, 1200) : null;
  } catch (_) {
    return null;
  }
}

export function captureFirstTouch() {
  if (typeof window === 'undefined') return null;
  try {
    const existing = sessionStorage.getItem(FIRST_TOUCH_KEY);
    if (existing) return JSON.parse(existing);

    const current = new URL(window.location.href);
    const touch = {
      firstVisitedAt: new Date().toISOString(),
      landingUrl: safeHttpUrl(current.href),
      referrerUrl: safeHttpUrl(document.referrer),
      utmSource: current.searchParams.get('utm_source')?.slice(0, 120) || null,
      utmMedium: current.searchParams.get('utm_medium')?.slice(0, 120) || null,
      utmCampaign: current.searchParams.get('utm_campaign')?.slice(0, 180) || null,
    };
    sessionStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(touch));
    return touch;
  } catch (_) {
    return null;
  }
}

export function getFirstTouch() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(sessionStorage.getItem(FIRST_TOUCH_KEY) || 'null') || captureFirstTouch();
  } catch (_) {
    return captureFirstTouch();
  }
}
