/**
 * Persists the visitor's name + email across all forms on the site.
 * Uses localStorage so it survives page navigation and new sessions.
 *
 * The `validated` flag means "this exact address successfully unlocked a
 * gallery at least once" — the UnlockModal uses it to offer the one-click
 * "Continue as {email}" state instead of the full form. The flag:
 *   - is set explicitly (saveUser({ ..., validated: true })) after any
 *     successful unlock;
 *   - survives saves from other forms (Newsletter, ExpertForm, …) as long as
 *     they store the SAME address;
 *   - is dropped automatically the moment a different address is saved
 *     (a validated flag only ever belongs to the address it was earned with).
 */
const KEY = 'cop_unlock_user';

export function getSavedUser() {
  if (typeof window === 'undefined') return { name: '', email: '', validated: false };
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '{}');
    return {
      name:      parsed.name  || '',
      email:     parsed.email || '',
      phone:     parsed.phone || '',
      validated: parsed.validated === true,
    };
  } catch {
    return { name: '', email: '', phone: '', validated: false };
  }
}

export function saveUser({ name, email, phone, validated }) {
  if (typeof window === 'undefined') return;
  try {
    const existing  = getSavedUser();
    const nextEmail = email || existing.email;
    const sameAddress = !!nextEmail && !!existing.email &&
      String(nextEmail).trim().toLowerCase() === String(existing.email).trim().toLowerCase();
    localStorage.setItem(KEY, JSON.stringify({
      name:  name  || existing.name,
      email: nextEmail,
      phone: phone || existing.phone || '',
      // Set explicitly, kept while the address is unchanged, dropped otherwise.
      validated: validated === true || (validated === undefined && sameAddress && existing.validated),
    }));
  } catch { /* ignore */ }
}

/** Forget the saved visitor entirely (the modal's "Not you?" link, and the
 *  bounce-invalidation path when the API returns { invalidated: true }). */
export function clearSavedUser() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
}
