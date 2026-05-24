/**
 * GET/POST /api/email-engine
 *
 * The single endpoint for the COP email automation engine. A scheduler polls
 * it every minute; it runs every enabled journey in one pass (debounce, batch,
 * dedupe, supersede, guard-rails) and reports what it did.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SAFETY — this endpoint sends NOTHING unless explicitly enabled:
 *
 *   EMAIL_ENGINE_ENABLED   unset / not 'true'  → no-op (this is the default)
 *   EMAIL_ENGINE_ENABLED = 'true'              → engine runs
 *
 *   Each journey ALSO has its own flag (e.g. GALLERY_FOLLOWUP_ENABLED) — both
 *   the engine flag and the journey flag must be 'true' for that journey to send.
 *
 *   EMAIL_ENGINE_TEST_EMAILS = 'a@b.com,c@d.com'
 *     → TEST MODE: only those addresses receive real emails. Every other
 *       contact is evaluated but left completely untouched.
 *
 *   EMAIL_ENGINE_WEEKLY_CAP = '3'   → max lifecycle emails per contact / 7 days
 *
 *   ?dry=1            → DRY RUN: scans and reports every decision it WOULD make,
 *                       but sends no email and writes no marker. Safe any time.
 *   ?journey=<id>     → restrict the run to a single journey.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * See docs/email-automation-blueprint.md.
 */
import { createClient } from '@supabase/supabase-js';
import { runEngine } from '@/lib/email/engine';
import { JOURNEYS } from '@/lib/email/journeys';

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

export default async function handler(req, res) {
  // Auth — a plain GET (or Vercel cron header) counts as an authorised cron
  // call; an internal caller may also pass a Bearer secret.
  const isCron   = req.method === 'GET' || req.headers['x-vercel-cron'] === '1';
  const auth     = req.headers['authorization'] || '';
  const isAuthed = (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`)
                || (process.env.CRM_SECRET  && auth === `Bearer ${process.env.CRM_SECRET}`);
  if (!isCron && !isAuthed) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const dryRun      = req.query.dry === '1' || req.query.dry === 'true';
  const onlyJourney = req.query.journey || null;
  const testEmails  = (process.env.EMAIL_ENGINE_TEST_EMAILS || '')
    .split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

  // ── KILL SWITCH ───────────────────────────────────────────────────────────
  // Applies to LIVE runs only. A dry run (?dry=1) sends nothing and writes
  // nothing, so it is always safe to run — that is how you preview the engine
  // before switching it on.
  if (!dryRun && process.env.EMAIL_ENGINE_ENABLED !== 'true') {
    return res.status(200).json({
      ok: true, disabled: true,
      note: "Email engine inactive. Set EMAIL_ENGINE_ENABLED='true' to activate. "
          + "Append ?dry=1 to preview it safely without switching it on.",
    });
  }

  try {
    const { summary, results } = await runEngine({
      db: getDb(),
      journeys: JOURNEYS,
      dryRun,
      testEmails,
      onlyJourney,
    });
    return res.status(200).json({
      ok: true,
      dryRun,
      engineEnabled: process.env.EMAIL_ENGINE_ENABLED === 'true',
      testMode: testEmails.length > 0,
      testEmails: testEmails.length ? testEmails : undefined,
      summary,
      results,
    });
  } catch (e) {
    console.error('[email-engine] run failed:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
