/**
 * lib/email/engine.js
 *
 * The generic email automation processor.
 *
 * It is a near-pure function: given the event log (activities), the record of
 * what has already been sent (email_queue), the suppression list, and the
 * journey config, it decides what to send right now. It holds no state of its
 * own — idempotency comes entirely from the marker rows it writes back to
 * email_queue, which is why it is safe to poll every 60 seconds and safe to
 * run twice at once.
 *
 * For each enabled journey, for each contact with recent trigger activity:
 *   debounce → max-age guard → cooldown → supersede → batch → guard-rails → send
 *
 * See docs/email-automation-blueprint.md, sections 7 and 9.
 */
import { sendHtml } from '@/lib/resend';
import { LIFECYCLE_JOURNEY_IDS } from './journeys';

// ── Tunables ─────────────────────────────────────────────────────────────────
const LOOKBACK_MIN     = 240;   // only scan trigger activity from the last 4h
const QUIET_START_HOUR = 8;     // quiet hours: send only 08:00–20:00 UTC
const QUIET_END_HOUR   = 20;
const DEFAULT_WEEKLY_CAP = 3;   // max lifecycle emails per contact per 7 days

function weeklyCap() {
  const n = parseInt(process.env.EMAIL_ENGINE_WEEKLY_CAP || '', 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_WEEKLY_CAP;
}

/**
 * True only if an env var is set to "true". Tolerant of case and stray
 * whitespace, so a value entered as " True " or "true " still works — a
 * mistyped flag should never silently leave the engine switched off.
 */
export function isEnvTrue(name) {
  return String(process.env[name] || '').trim().toLowerCase() === 'true';
}

// ── Guard-rail helpers ───────────────────────────────────────────────────────

/** Is this address on the suppression list? */
async function isSuppressed(db, email) {
  const { data } = await db
    .from('suppressions')
    .select('email')
    .eq('email', email)
    .maybeSingle();
  return !!data;
}

/** Has this contact already received the weekly cap of lifecycle emails? */
async function frequencyCapHit(db, contactId, now) {
  if (!LIFECYCLE_JOURNEY_IDS.length) return false;
  const weekAgo = new Date(now - 7 * 86400000).toISOString();
  const { count } = await db
    .from('email_queue')
    .select('id', { count: 'exact', head: true })
    .eq('contact_id', contactId)
    .eq('status', 'sent')
    .in('trigger', LIFECYCLE_JOURNEY_IDS)
    .gte('created_at', weekAgo);
  return (count || 0) >= weeklyCap();
}

/** Is "now" outside the allowed sending window? */
function outsideQuietHours(now) {
  const hour = new Date(now).getUTCHours();
  return hour < QUIET_START_HOUR || hour >= QUIET_END_HOUR;
}

/**
 * Write a marker row to email_queue. This row both records the outcome and —
 * for any non-'pending' status — guarantees the contact is never reprocessed
 * for this journey inside the cooldown window.
 */
async function writeMarker(db, journey, contact, status, opts = {}) {
  await db.from('email_queue').insert({
    to_email:       contact.email,
    to_name:        contact.first_name || null,
    subject:        opts.subject || `${journey.id} (${status})`,
    html:           opts.html || '',
    trigger:        journey.id,            // dedupe / cooldown namespace
    template_props: opts.payload ? { payload: opts.payload } : null,
    status,                                // sent | cancelled | expired | rejected
    sent_at:        status === 'sent' ? new Date().toISOString() : null,
    contact_id:     contact.id,
    notes:          opts.notes || null,
  });
}

// ── One journey ──────────────────────────────────────────────────────────────
async function runJourney({ db, now, dryRun, testEmails, journey, results, summary }) {
  const lookbackFrom = new Date(now - LOOKBACK_MIN * 60000).toISOString();

  // 1. Recent trigger events, oldest first.
  const { data: events, error } = await db
    .from('activities')
    .select('contact_id, created_at, metadata, type')
    .eq('type', journey.on)
    .gte('created_at', lookbackFrom)
    .not('contact_id', 'is', null)
    .order('created_at', { ascending: true })
    .limit(3000);

  if (error) {
    summary.errors++;
    results.push({ journey: journey.id, decision: 'error', error: error.message });
    return;
  }

  // 2. Group by contact.
  const byContact = new Map();
  for (const e of events || []) {
    if (!byContact.has(e.contact_id)) byContact.set(e.contact_id, []);
    byContact.get(e.contact_id).push(e);
  }

  // 3. Contacts already given this journey inside the cooldown window.
  const cooldownFrom = new Date(now - journey.cooldownDays * 86400000).toISOString();
  const { data: markers } = await db
    .from('email_queue')
    .select('contact_id')
    .eq('trigger', journey.id)
    .gte('created_at', cooldownFrom)
    .not('contact_id', 'is', null);
  const onCooldown = new Set((markers || []).map(m => m.contact_id));

  for (const [contactId, acts] of byContact) {
    if (onCooldown.has(contactId)) { summary.cooldown++; continue; }

    const firstAt = new Date(acts[0].created_at).getTime();
    const ageMin  = (now - firstAt) / 60000;

    // ── debounce ──────────────────────────────────────────────────────────
    if (ageMin < journey.delayMin) { summary.notDue++; continue; }

    // ── contact details ───────────────────────────────────────────────────
    const { data: contact } = await db
      .from('contacts')
      .select('id, email, first_name, locale')
      .eq('id', contactId)
      .maybeSingle();
    if (!contact || !contact.email) { summary.errors++; continue; }
    const email = contact.email.toLowerCase();

    // ── test allowlist (live runs only — dry runs evaluate everyone) ───────
    const allowed = !testEmails.length || testEmails.includes(email);
    if (!allowed && !dryRun) {
      summary.skippedTest++;
      results.push({ journey: journey.id, email: contact.email, decision: 'skipped_test_mode' });
      continue;
    }

    // ── max-age guard ─────────────────────────────────────────────────────
    if (ageMin > journey.maxAgeMin) {
      if (!dryRun) await writeMarker(db, journey, contact, 'expired',
        { notes: `first trigger ${Math.round(ageMin)} min ago` });
      summary.expired++;
      results.push({ journey: journey.id, email: contact.email,
        decision: dryRun ? 'would_expire' : 'expired', ageMin: Math.round(ageMin) });
      continue;
    }

    // ── supersede / cancel ────────────────────────────────────────────────
    if (journey.cancelOn && journey.cancelOn.length) {
      const { data: cancelEv } = await db
        .from('activities')
        .select('id')
        .eq('contact_id', contactId)
        .in('type', journey.cancelOn)
        .gte('created_at', acts[0].created_at)
        .limit(1);
      if ((cancelEv || []).length) {
        if (!dryRun) await writeMarker(db, journey, contact, 'cancelled',
          { notes: `superseded by ${journey.cancelOn.join(' / ')}` });
        summary.cancelled++;
        results.push({ journey: journey.id, email: contact.email,
          decision: dryRun ? 'would_cancel' : 'cancelled' });
        continue;
      }
    }

    // ── batch the payload ─────────────────────────────────────────────────
    const payload = journey.collect ? journey.collect(acts) : null;
    if (journey.requiresPayload &&
        (!payload || (Array.isArray(payload) && payload.length === 0))) {
      if (!dryRun) await writeMarker(db, journey, contact, 'rejected',
        { notes: 'trigger activity carried no usable payload' });
      summary.skippedNoPayload++;
      results.push({ journey: journey.id, email: contact.email,
        decision: dryRun ? 'would_skip_no_payload' : 'skipped_no_payload' });
      continue;
    }

    // ── guard-rails (skipped for transactional journeys) ──────────────────
    if (!journey.transactional) {
      if (await isSuppressed(db, email)) {
        if (!dryRun) await writeMarker(db, journey, contact, 'cancelled',
          { notes: 'recipient is on the suppression list' });
        summary.suppressed++;
        results.push({ journey: journey.id, email: contact.email,
          decision: dryRun ? 'would_suppress' : 'suppressed' });
        continue;
      }
      if (await frequencyCapHit(db, contactId, now)) {
        // Deferred, not dropped — no marker written, so it stays eligible.
        summary.capped++;
        results.push({ journey: journey.id, email: contact.email,
          decision: 'deferred_frequency_cap' });
        continue;
      }
      if (journey.quietHours && outsideQuietHours(now)) {
        summary.quietHours++;
        results.push({ journey: journey.id, email: contact.email,
          decision: 'deferred_quiet_hours' });
        continue;
      }
    }

    // ── build the one email ───────────────────────────────────────────────
    const locale = ['en', 'es', 'fr'].includes(contact.locale) ? contact.locale : 'en';
    let built;
    try {
      built = journey.buildEmail({ firstName: contact.first_name, payload, locale });
    } catch (e) {
      summary.errors++;
      results.push({ journey: journey.id, email: contact.email,
        decision: 'error', error: `buildEmail: ${e.message}` });
      continue;
    }

    if (dryRun) {
      summary.wouldSend++;
      results.push({ journey: journey.id, email: contact.email,
        decision: allowed ? 'would_send' : 'would_send_but_not_on_test_allowlist',
        subject: built.subject, payload });
      continue;
    }

    // ── live send ─────────────────────────────────────────────────────────
    try {
      await sendHtml({
        to: contact.email, subject: built.subject, html: built.html,
        from: journey.from, replyTo: journey.replyTo,
      });
      await writeMarker(db, journey, contact, 'sent',
        { subject: built.subject, html: built.html, payload });
      await db.from('activities').insert({
        contact_id:  contactId,
        type:        `${journey.id}_sent`,
        description: `${journey.id} sent`,
        metadata:    { payload, subject: built.subject },
      });
      summary.sent++;
      results.push({ journey: journey.id, email: contact.email,
        decision: 'sent', subject: built.subject, payload });
    } catch (e) {
      summary.errors++;
      results.push({ journey: journey.id, email: contact.email,
        decision: 'error', error: e.message });
    }
  }
}

// ── Entry point ──────────────────────────────────────────────────────────────
/**
 * Run the engine over every enabled journey.
 *
 * @param {object}   opts
 * @param {object}   opts.db           — Supabase client (service role)
 * @param {object[]} opts.journeys     — the JOURNEYS config
 * @param {number}   [opts.now]        — epoch ms (override for testing)
 * @param {boolean}  [opts.dryRun]     — scan + report, send nothing, write nothing
 * @param {string[]} [opts.testEmails] — when set, only these addresses are sent to
 * @param {string|null} [opts.onlyJourney] — restrict to a single journey id
 * @returns {Promise<{summary:object, results:object[]}>}
 */
export async function runEngine({
  db, journeys, now = Date.now(), dryRun = false, testEmails = [], onlyJourney = null,
}) {
  const summary = {
    sent: 0, wouldSend: 0, cancelled: 0, suppressed: 0, expired: 0,
    notDue: 0, cooldown: 0, capped: 0, quietHours: 0,
    skippedTest: 0, skippedNoPayload: 0, errors: 0,
  };
  const results = [];

  for (const journey of journeys) {
    if (onlyJourney && journey.id !== onlyJourney) continue;

    const enabled = !journey.enabledEnv || isEnvTrue(journey.enabledEnv);

    // A disabled journey is skipped on a live run. On a dry run it is still
    // evaluated (nothing is sent) so you can preview exactly what it would do
    // once switched on.
    if (!enabled && !dryRun) {
      results.push({ journey: journey.id, decision: 'journey_disabled',
        note: `set ${journey.enabledEnv}='true' to activate` });
      continue;
    }
    if (!enabled && dryRun) {
      results.push({ journey: journey.id, decision: 'journey_disabled_preview',
        note: `would NOT run live — set ${journey.enabledEnv}='true' to activate` });
    }

    await runJourney({ db, now, dryRun, testEmails, journey, results, summary });
  }

  return { summary, results };
}
