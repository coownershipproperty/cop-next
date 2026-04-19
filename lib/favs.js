/**
 * lib/favs.js — shared favourites utilities
 *
 * localStorage stores a plain JSON array of slug strings:
 *   cop_favourites = ["slug-a", "slug-b", ...]
 *
 * Any component can:
 *   import { getFavSlugs, toggleFav, isFav, onFavsChange } from '@/lib/favs';
 */

export const FAV_KEY   = 'cop_favourites';
export const FAV_EVENT = 'cop:favs';       // CustomEvent name for cross-component sync

/** Read slug array from localStorage (SSR-safe). */
export function getFavSlugs() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_KEY));
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

/** Persist updated slug array and broadcast the change. */
function persist(slugs) {
  localStorage.setItem(FAV_KEY, JSON.stringify(slugs));
  window.dispatchEvent(new CustomEvent(FAV_EVENT, { detail: slugs }));
}

/** Is a slug currently saved? */
export function isFav(slug) {
  return getFavSlugs().includes(slug);
}

/**
 * Toggle a slug in/out of favourites.
 * Returns the new isFav state (true = now saved).
 */
export function toggleFav(slug) {
  const current = getFavSlugs();
  let updated;
  if (current.includes(slug)) {
    updated = current.filter(s => s !== slug);
  } else {
    updated = [...current, slug];
  }
  persist(updated);
  return updated.includes(slug);
}

/**
 * Subscribe to favourites changes (both from this tab and other tabs via storage event).
 * Returns an unsubscribe function.
 */
export function onFavsChange(cb) {
  const handleCustom  = (e) => cb(e.detail);
  const handleStorage = (e) => { if (e.key === FAV_KEY) cb(getFavSlugs()); };
  window.addEventListener(FAV_EVENT, handleCustom);
  window.addEventListener('storage',  handleStorage);
  return () => {
    window.removeEventListener(FAV_EVENT, handleCustom);
    window.removeEventListener('storage',  handleStorage);
  };
}
