/**
 * GET/POST /api/admin/ui/today
 * Admin-only (Bearer <supabase session token>, crm_admins allowlist).
 *
 * The one page that says what the business is waiting on. Every number here
 * is DERIVED, live, from the table that records the doing — never from a
 * to-do list, a note, or a copy. That is the whole point of it: on 11 Sep
 * 2026 four partner registrations were reported as never done (from
 * admin_tasks) when partner_referrals proved all four had been done two days
 * earlier, and four commissions were called outstanding (from leads) when
 * Qonto showed every invoice ever raised had been paid. A list that is
 * derived cannot drift, and it closes itself when the work is done.
 *
 * GET → {
 *   waiting:     leads_awaiting_reply        (acted, no human reply since)
 *   unregistered: referrals_outstanding      (operator attached, no referral)
 *   outcomes:    referrals_awaiting_outcome  (handed over, no won/invoice)
 *   review:      email_queue pending_review  (drafts waiting for a human)
 *   listings:    listing_changes not applied (dead/changed at the partner)
 *   disputed:    partner_facts needs_check   (contradictions / open questions)
 *   facts:       fact_requests open          (a draft needed a fact we lack)
 *   judgement:   admin_tasks open            (things only David can decide)
 *   replyStats:  reply_time_stats            (median hours to draft / reply, 7 days)
 *   slow:        reply_times                 (written enquiries with no reply after 4 h)
 *   jobs:        lib/cronJobs merged with scheduler_runs (fired) and cron_runs (ran)
 * }
 *
 * POST { job } → runs that cron now, server-side, and returns what it said.
 * The scheduler is pg_cron in Supabase since 11 Sep 2026 (the Vercel one
 * stopped on 7 Sep and nothing noticed for four days); the Run button is for
 * "now", not "eventually". The call carries Bearer CRON_SECRET (or CRM_SECRET)
 * when one is configured, otherwise the schedule header that lib/cronAuth
 * accepts — either way it is an admin who pressed the button.
 */
import { requireAdmin } from '@/lib/newsletter/auth';
import { CRON_JOBS, expectedGapMinutes } from '@/lib/cronJobs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://co-ownership-property.com';

function cronPaths() {
  return CRON_JOBS.map((j) => ({ ...j }));
}

async function loadState(db) {
  const [waiting, unregistered, outcomes, review, listings, disputed, facts, judgement, health, lastRuns, fired, replyStats, slow] = await Promise.all([
    db.from('leads_awaiting_reply').select('*').order('hours_waiting', { ascending: false }).limit(200),
    db.from('referrals_outstanding').select('*').order('days_since', { ascending: false }).limit(200),
    db.from('referrals_awaiting_outcome').select('*').order('days_since', { ascending: true }).limit(300),
    db.from('email_queue')
      .select('id, created_at, to_email, to_name, subject, notes')
      .in('trigger', ['enquiry_reply', 'enquiry_reply_draft'])
      .eq('status', 'pending_review')
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('listing_changes')
      .select('id, detected_at, partner, slug, change_type, field, old_value, new_value, notes')
      .eq('applied', false)
      .order('detected_at', { ascending: false })
      .limit(200),
    db.from('partner_facts')
      .select('partner, topic, question, answer_short, source_url, conflicts_with_url')
      .eq('confidence', 'needs_check')
      .order('partner')
      .limit(300),
    db.from('fact_requests')
      .select('id, created_at, slug, partner, topic, question, status')
      .neq('status', 'filled')
      .order('created_at', { ascending: false })
      .limit(100),
    db.from('admin_tasks')
      .select('id, task, due_at, reminder_at, reminder_status, created_at')
      .is('completed_at', null)
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(100),
    db.from('cron_health').select('*'),
    db.from('cron_runs')
      .select('job, ran_at, ok, duration_ms, summary, error')
      .order('ran_at', { ascending: false })
      .limit(200),
    db.from('scheduler_runs')
      .select('job, fired_at, status_code, timed_out, error_msg')
      .order('fired_at', { ascending: false })
      .limit(200),
    db.from('reply_time_stats').select('*').maybeSingle(),
    db.from('reply_times')
      .select('email, first_name, last_name, enquiry_at, first_draft_at, first_reply_at')
      .is('first_reply_at', null)
      .lt('enquiry_at', new Date(Date.now() - 4 * 3600 * 1000).toISOString())
      .gt('enquiry_at', new Date(Date.now() - 7 * 86400 * 1000).toISOString())
      .order('enquiry_at', { ascending: true })
      .limit(100),
  ]);

  const firstError = [waiting, unregistered, outcomes, review, listings, disputed, facts, judgement, health, lastRuns, fired, replyStats, slow]
    .map((r) => r.error).find(Boolean);

  const healthByJob = new Map((health.data || []).map((h) => [h.job, h]));
  const lastByJob = new Map();
  for (const r of lastRuns.data || []) if (!lastByJob.has(r.job)) lastByJob.set(r.job, r);
  const firedByJob = new Map();
  for (const r of fired.data || []) if (!firedByJob.has(r.job)) firedByJob.set(r.job, r);

  const now = Date.now();
  const jobs = cronPaths().map((j) => {
    const h = healthByJob.get(j.key);
    const last = lastByJob.get(j.key);
    const f = firedByJob.get(j.key);
    const lastRun = last?.ran_at || h?.last_run || null;
    const lastFired = f?.fired_at || null;
    const quietMin = lastRun ? Math.round((now - new Date(lastRun).getTime()) / 60000) : null;
    const firedQuietMin = lastFired ? Math.round((now - new Date(lastFired).getTime()) / 60000) : null;
    const gap = expectedGapMinutes(j.schedule);
    // Two questions, in order: did the scheduler fire it, and did the job run?
    let state;
    if (!lastFired) state = 'not-yet';          // scheduled, first run still ahead (daily jobs)
    else if (firedQuietMin > gap) state = 'not-firing';
    else if (f && (f.timed_out || (f.status_code && f.status_code >= 400))) state = 'rejected';
    else if (!lastRun) state = 'no-heartbeat';
    else if (quietMin > gap) state = 'stalled';
    else if (last && last.ok === false) state = 'failing';
    else state = 'ok';
    return {
      ...j,
      lastFired,
      firedStatus: f?.status_code ?? null,
      firedError: f?.error_msg || (f?.timed_out ? 'timed out' : null),
      lastRun,
      quietMin,
      state,
      errors24h: h?.errors_24h ?? 0,
      lastSummary: last?.summary || null,
      lastError: last?.error || null,
    };
  });

  return {
    error: firstError ? firstError.message : null,
    generatedAt: new Date().toISOString(),
    waiting: waiting.data || [],
    unregistered: unregistered.data || [],
    outcomes: outcomes.data || [],
    review: review.data || [],
    listings: listings.data || [],
    disputed: disputed.data || [],
    facts: facts.data || [],
    judgement: judgement.data || [],
    replyStats: replyStats.data || null,
    slow: slow.data || [],
    jobs,
  };
}

async function runJob(path) {
  const job = cronPaths().find((j) => j.path === path);
  if (!job) return { status: 400, body: { error: 'Unknown job' } };

  const secret = process.env.CRON_SECRET || process.env.CRM_SECRET;
  const headers = secret
    ? { Authorization: `Bearer ${secret}` }
    : { 'x-vercel-cron-schedule': job.schedule };

  const startedAt = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 55000);
    const r = await fetch(`${SITE_URL}${path}`, { headers, signal: controller.signal });
    clearTimeout(timer);
    const text = await r.text();
    let body;
    try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 2000) }; }
    return { status: 200, body: { ok: r.ok, httpStatus: r.status, ms: Date.now() - startedAt, result: body } };
  } catch (e) {
    return { status: 200, body: { ok: false, ms: Date.now() - startedAt, error: e.name === 'AbortError' ? 'Timed out after 55s' : e.message } };
  }
}

export default async function handler(req, res) {
  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db } = ctx;

  if (req.method === 'GET') {
    const state = await loadState(db);
    return res.status(200).json(state);
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const path = String(req.body?.job || '');
  const { status, body } = await runJob(path);
  return res.status(status).json(body);
}
