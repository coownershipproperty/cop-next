/**
 * lib/suppressions.js
 *
 * ONE place that answers "may we email this address?".
 *
 * WHY THIS FILE EXISTS
 * --------------------
 * Before 26 Jul 2026 the codebase had *two* independent opt-out registers and
 * each half of the sending system honoured only one of them:
 *
 *   - `suppressions` (table)          → honoured by lib/email/engine.js,
 *                                       lib/followupSequence.js and the
 *                                       /api/process-email-queue cron.
 *   - `contacts.tags @> {unsubscribed}` → honoured by the newsletter audience
 *                                       resolver and /api/admin/newsletter/send.
 *
 * Nothing kept them in sync. /api/unsubscribe wrote only the suppression row,
 * so **every person who used the one-click unsubscribe link kept receiving the
 * newsletter**, and any contact tagged in the CRM kept receiving automated
 * sequences. Both directions leaked. A third path, /api/admin/send-campaign,
 * checked neither — it pushed pending email_queue rows straight to Resend,
 * bypassing the preflight the cron applies to those same rows.
 *
 * Every sender now imports from here. If you add a new sending path, call
 * `filterSuppressed` (bulk) or `isSuppressed` (single) before you send, and
 * write the opt-out with `suppress()` so both registers move together.
 */

/** Canonical comparison form for an address. */
export function normalize(email) {
  return String(email || '').toLowerCase().trim();
}

/**
 * Is this single address suppressed?
 * Fails CLOSED on a database error for non-transactional mail — a lookup
 * failure must never be read as consent.
 */
export async function isSuppressed(db, email, { failOpen = false } = {}) {
  const clean = normalize(email);
  if (!clean) return true; // no address is not a sendable address
  const { data, error } = await db
    .from('suppressions')
    .select('email')
    .eq('email', clean)
    .maybeSingle();
  if (error) {
    console.error('[suppressions] lookup failed for', clean, '—', error.message);
    return !failOpen;
  }
  return !!data;
}

/**
 * Bulk form. Returns { kept, dropped } given any array of items.
 *
 * `getEmail` extracts the address from an item (default: item.email).
 * Chunked so a large audience never blows the PostgREST URL length limit.
 *
 * Also drops anyone tagged `unsubscribed` when the item carries tags, so the
 * two registers are enforced together regardless of which one has the record.
 */
export async function filterSuppressed(db, items, getEmail = (i) => i.email) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return { kept: [], dropped: [] };

  const emails = [...new Set(list.map((i) => normalize(getEmail(i))).filter(Boolean))];
  const suppressed = new Set();

  const CHUNK = 200;
  for (let i = 0; i < emails.length; i += CHUNK) {
    const slice = emails.slice(i, i + CHUNK);
    const { data, error } = await db
      .from('suppressions')
      .select('email')
      .in('email', slice);
    if (error) {
      // Fail closed: refuse the whole batch rather than mail people who opted out.
      throw new Error(`[suppressions] bulk lookup failed: ${error.message}`);
    }
    for (const row of data || []) suppressed.add(normalize(row.email));
  }

  const kept = [];
  const dropped = [];
  for (const item of list) {
    const addr = normalize(getEmail(item));
    const taggedOut = Array.isArray(item?.tags) && item.tags.includes('unsubscribed');
    if (!addr || suppressed.has(addr) || taggedOut) dropped.push(item);
    else kept.push(item);
  }
  return { kept, dropped };
}

/**
 * suppressions.reason is free text with no CHECK constraint, and it HAD
 * drifted: 'bounce' vs 'bounced', 'unsubscribe' vs 'unsubscribed'. That is not
 * cosmetic — /api/unlock-drive matches `reason === 'bounced'` exactly to decide
 * whether to invalidate a saved address, so rows written as 'bounce' silently
 * did nothing. The stored values were normalised on 26 Jul 2026; canonicalise
 * every new write here so they cannot diverge again.
 */
export const REASONS = ['unsubscribed', 'bounced', 'complained', 'not_interested', 'manual'];

const REASON_ALIASES = {
  bounce:        'bounced',
  bounces:       'bounced',
  hard_bounce:   'bounced',
  unsubscribe:   'unsubscribed',
  unsub:         'unsubscribed',
  complaint:     'complained',
  spam:          'complained',
  'not-interested': 'not_interested',
};

export function normalizeReason(reason) {
  const r = String(reason || '').toLowerCase().trim().replace(/\s+/g, '_');
  if (!r) return 'manual';
  const canonical = REASON_ALIASES[r] || r;
  if (!REASONS.includes(canonical)) {
    console.warn(`[suppressions] unrecognised reason "${reason}" — storing as 'manual'`);
    return 'manual';
  }
  return canonical;
}

/** Extra tag recorded alongside `unsubscribed` so the CRM keeps the *reason*.
 *  `unsubscribed` is the only string the newsletter honours; these are context. */
const REASON_TAG = {
  bounced:        'bounced',
  complained:     'complained',
  not_interested: 'not-interested',
};

/**
 * Mirror an opt-out onto contacts.tags. Exported because the Resend webhook
 * has its own suppression-row logic (a reason-upgrade ladder that `suppress()`
 * deliberately does not implement) but still needs the tag written, otherwise
 * a hard-bounced address stays in the newsletter audience forever.
 *
 * Appends; never clobbers existing tags. Idempotent.
 */
export async function tagContactsUnsubscribed(db, email, reason = null) {
  const clean = normalize(email);
  if (!clean) return 0;
  const extra = reason ? REASON_TAG[normalizeReason(reason)] || null : null;
  let updated = 0;
  try {
    const { data: rows } = await db
      .from('contacts')
      .select('id, tags')
      .ilike('email', clean.replace(/([\\%_])/g, '\\$1'));
    for (const row of rows || []) {
      const tags = Array.isArray(row.tags) ? row.tags : [];
      const next = [...new Set([...tags, 'unsubscribed', ...(extra ? [extra] : [])])];
      if (next.length === tags.length) continue; // nothing new to add
      await db
        .from('contacts')
        .update({ tags: next, updated_at: new Date().toISOString() })
        .eq('id', row.id);
      updated++;
    }
  } catch (e) {
    // The suppression row is written and authoritative for the sequence engine;
    // a tag failure is logged, not fatal.
    console.error('[suppressions] contact tag mirror failed for', clean, '—', e.message);
  }
  return updated;
}

/**
 * Record an opt-out in BOTH registers, so the two can never drift again.
 *
 * `reason`: unsubscribed | bounced | complained | not_interested | manual
 * Existing suppression rows are left alone (the first reason recorded is the
 * truthful one); the contact tag is added idempotently.
 */
export async function suppress(db, email, { reason = 'manual', scope = 'all', note = null } = {}) {
  const clean = normalize(email);
  if (!clean) return { ok: false, error: 'no address' };
  const cleanReason = normalizeReason(reason);

  const { error: supErr } = await db
    .from('suppressions')
    .upsert(
      { email: clean, reason: cleanReason, scope, note },
      { onConflict: 'email', ignoreDuplicates: true },
    );
  if (supErr) {
    console.error('[suppressions] upsert failed:', supErr.message);
    return { ok: false, error: supErr.message };
  }

  // Mirror into contacts.tags — this is what the newsletter path filters on.
  await tagContactsUnsubscribed(db, clean, cleanReason);

  return { ok: true };
}
