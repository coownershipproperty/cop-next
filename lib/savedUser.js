/**
 * Persists the visitor's name + email across all forms on the site.
 * Uses localStorage so it survives page navigation and new sessions.
 */
const KEY = 'cop_unlock_user';

export function getSavedUser() {
  if (typeof window === 'undefined') return { name: '', email: '' };
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { name: parsed.name || '', email: parsed.email || '' };
  } catch {
    return { name: '', email: '' };
  }
}

export function saveUser({ name, email }) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getSavedUser();
    localStorage.setItem(KEY, JSON.stringify({
      name:  name  || existing.name,
      email: email || existing.email,
    }));
  } catch { /* ignore */ }
}
