/**
 * Resolve a campaign's audience filter to a list of contacts.
 *
 * audienceSegment: 'all' | 'tag' | 'region' | 'custom'
 * audienceFilter:
 *   - 'all'    → ignored
 *   - 'tag'    → { tags: ['paris-enquiry', ...] }
 *   - 'region' → { regions: ['Paris', 'Costa del Sol', ...] }
 *   - 'custom' → { emails: ['a@b.com', ...] }
 *
 * Returns { contacts: [{id, email, first_name, locale, country, tags}], total }
 *
 * Always excludes:
 *   - emails ending in @deleted.local (GDPR placeholder)
 *   - contacts tagged 'unsubscribed'
 *   - anyone on the `suppressions` table   <-- added 26 Jul 2026
 *
 * That last exclusion is the important one. Until it existed this resolver
 * checked ONLY the contact tag, while /api/unsubscribe writes ONLY a
 * suppressions row — so every person who clicked the one-click unsubscribe
 * link in an email footer stayed in the newsletter audience and kept being
 * mailed. See lib/suppressions.js for the full history.
 */
import { filterSuppressed } from '@/lib/suppressions';

const PAGE_SIZE = 1000;

/**
 * PostgREST caps every unbounded select at 1,000 rows (Supabase db max-rows).
 * Any query that can grow past that MUST paginate, or results are silently
 * truncated. That is exactly what happened in Aug 2026: the contacts table
 * crossed 1,000 rows and the newsletter audience silently froze at ~987 —
 * every contact created after the cutoff was dropped from sends with no
 * error anywhere.
 *
 * makeQuery must return a FRESH query builder on each call (builders are
 * single-use). A stable order is applied so pages never skip or duplicate
 * rows while paginating.
 */
export async function fetchAllRows(makeQuery, orderColumn = 'id') {
  let from = 0;
  const all = [];
  for (;;) {
    const { data, error } = await makeQuery()
      .order(orderColumn, { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error('[audience] paged fetch failed: ' + error.message);
    const rows = data || [];
    all.push(...rows);
    if (rows.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return all;
}

/** Chunk an array (for .in() filters — keeps request URLs a sane length). */
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Shared exit: drop suppressed addresses, then shape the return value. */
async function finish(db, contacts) {
  const { kept, dropped } = await filterSuppressed(db, contacts);
  if (dropped.length) {
    console.log(`[audience] excluded ${dropped.length} suppressed/unsubscribed recipient(s)`);
  }
  return { contacts: kept, total: kept.length, excludedSuppressed: dropped.length };
}

export async function resolveAudience(db, audienceSegment, audienceFilter) {
  const seg = audienceSegment || 'all';
  const filter = audienceFilter || {};

  if (seg === 'custom') {
    const emails = (filter.emails || []).map(e => (e || '').trim().toLowerCase()).filter(Boolean);
    if (!emails.length) return { contacts: [], total: 0 };

    const data = [];
    for (const emailChunk of chunk(emails, 200)) {
      const rows = await fetchAllRows(() => db
        .from('contacts')
        .select('id, email, first_name, locale, country, tags')
        .in('email', emailChunk)
        .not('email', 'like', '%@deleted.local'));
      data.push(...rows);
    }

    const contacts = data.filter(c => !(c.tags || []).includes('unsubscribed'));
    return finish(db, contacts);
  }

  if (seg === 'tag') {
    const tags = (filter.tags || []).filter(Boolean);
    if (!tags.length) return { contacts: [], total: 0 };

    // contacts.tags is text[]; use overlap (cs/ov). We'll use `overlaps`.
    const data = await fetchAllRows(() => db
      .from('contacts')
      .select('id, email, first_name, locale, country, tags')
      .overlaps('tags', tags)
      .not('email', 'is', null)
      .not('email', 'like', '%@deleted.local'));

    const contacts = data.filter(c => !(c.tags || []).includes('unsubscribed'));
    return finish(db, contacts);
  }

  if (seg === 'region') {
    const regions = (filter.regions || []).filter(Boolean);
    if (!regions.length) return { contacts: [], total: 0 };

    // Find contacts whose leads.main_region OR subregion matches any of the chosen regions.
    // Use case-insensitive equality via ilike with the exact value (no wildcard).
    const orExpr = regions.flatMap(r => {
      // Sanitize commas/parens to avoid breaking the PostgREST or-filter syntax
      const safe = r.replace(/[,()]/g, ' ').trim();
      return [
        `main_region.ilike.${safe}`,
        `subregion.ilike.${safe}`,
      ];
    }).join(',');

    const leads = await fetchAllRows(() => db
      .from('leads')
      .select('id, contact_id, contacts!inner(id, email, first_name, locale, country, tags)')
      .or(orExpr)
      .not('contacts.email', 'is', null)
      .not('contacts.email', 'like', '%@deleted.local'));

    const map = new Map();
    for (const l of leads || []) {
      const c = l.contacts;
      if (!c || !c.email) continue;
      if ((c.tags || []).includes('unsubscribed')) continue;
      if (!map.has(c.id)) map.set(c.id, c);
    }
    const contacts = [...map.values()];
    return finish(db, contacts);
  }

  // 'all'
  const data = await fetchAllRows(() => db
    .from('contacts')
    .select('id, email, first_name, locale, country, tags')
    .not('email', 'is', null)
    .not('email', 'like', '%@deleted.local'));

  const contacts = data.filter(c => !(c.tags || []).includes('unsubscribed'));
  return finish(db, contacts);
}

/**
 * For an "all" audience with selected slugs, optionally remove contacts whose
 * leads.property_slug is already one of the campaign's slugs (they've enquired).
 *
 * Returns the filtered contact list + count of how many were excluded.
 */
export async function excludeAlreadyEnquired(db, contacts, propertySlugs) {
  if (!contacts.length || !propertySlugs?.length) {
    return { contacts, excluded: 0 };
  }
  const ids = contacts.map(c => c.id);
  const excludeIds = new Set();
  for (const idChunk of chunk(ids, 200)) {
    const leads = await fetchAllRows(() => db
      .from('leads')
      .select('id, contact_id, property_slug')
      .in('contact_id', idChunk)
      .in('property_slug', propertySlugs));
    for (const l of leads) excludeIds.add(l.contact_id);
  }

  const out = contacts.filter(c => !excludeIds.has(c.id));
  return { contacts: out, excluded: ids.length - out.length };
}

/**
 * Fetch a contact's region interests (deduped across all their leads).
 * Used for per-recipient property reordering.
 */
export async function getContactInterests(db, contactId) {
  const { data: leads } = await db
    .from('leads')
    .select('main_region, subregion, budget_max')
    .eq('contact_id', contactId);

  const interests = [];
  let budgetMax = null;
  for (const l of leads || []) {
    const main = (l.main_region || '').trim() || null;
    const sub = (l.subregion || '').trim() || null;
    if (main || sub) {
      const exists = interests.some(i => i.mainRegion === main && i.subregion === sub);
      if (!exists) interests.push({ mainRegion: main, subregion: sub });
    }
    if (l.budget_max) {
      const b = Number(l.budget_max);
      if (!budgetMax || b > budgetMax) budgetMax = b;
    }
  }
  return { interests, budgetMax };
}
