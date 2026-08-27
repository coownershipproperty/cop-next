// Shared town-slug helper for the programmatic /co-ownership/{town}/ landing
// pages and the sitemap. One slugify used everywhere so paths always agree.

/** "Cala d'Or" → "cala-d-or", "Àger" → "ager" */
export function townSlug(city) {
  return String(city || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Minimum live homes a town needs before it earns a landing page. */
export const TOWN_PAGE_MIN_HOMES = 2;
