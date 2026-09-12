/**
 * Accent-insensitive matching for every search box in the admin.
 *
 * On 12 Sep 2026 David typed "sa rapita" into Listings and the Sa Ràpita
 * house did not come up, because the title carries a grave accent and the
 * filter compared raw lowercase strings. Half our towns have accents —
 * Dénia, Xàbia, Cala d'Or, Port d'Alcúdia, Santanyí, Côte d'Azur — and
 * nobody types them. Fold both sides before comparing.
 */

/** "Sa Ràpita" → "sa rapita"; also unifies curly apostrophes and collapses whitespace. */
export function fold(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’‘`´]/g, "'")
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when any of `values` contains `needle`, accents ignored. An empty needle matches everything. */
export function foldIncludes(values, needle) {
  const n = fold(needle);
  if (!n) return true;
  return (Array.isArray(values) ? values : [values]).some((v) => fold(v).includes(n));
}
