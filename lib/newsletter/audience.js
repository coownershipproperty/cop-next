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

    const { data } = await db
      .from('contacts')
      .select('id, email, first_name, locale, country, tags')
      .in('email', emails)
      .not('email', 'like', '%@deleted.local');

    const contacts = (data || []).filter(c => !(c.tags || []).includes('unsubscribed'));
    return finish(db, contacts);
  }

  if (seg === 'tag') {
    const tags = (filter.tags || []).filter(Boolean);
    if (!tags.length) return { contacts: [], total: 0 };

    // contacts.tags is text[]; use overlap (cs/ov). We'll use `overlaps`.
    const { data } = await db
      .from('contacts')
      .select('id, email, first_name, locale, country, tags')
      .overlaps('tags', tags)
      .not('email', 'is', null)
      .not('email', 'like', '%@deleted.local');

    const contacts = (data || []).filter(c => !(c.tags || []).includes('unsubscribed'));
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

    const { data: leads } = await db
      .from('leads')
      .select('contact_id, contacts!inner(id, email, first_name, locale, country, tags)')
      .or(orExpr)
      .not('contacts.email', 'is', null)
      .not('contacts.email', 'like', '%@deleted.local');

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
  const { data } = await db
    .from('contacts')
    .select('id, email, first_name, locale, country, tags')
    .not('email', 'is', null)
    .not('email', 'like', '%@deleted.local');

  const contacts = (data || []).filter(c => !(c.tags || []).includes('unsubscribed'));
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
  const { data: leads } = await db
    .from('leads')
    .select('contact_id, property_slug')
    .in('contact_id', ids)
    .in('property_slug', propertySlugs);

  const excludeIds = new Set((leads || []).map(l => l.contact_id));
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
