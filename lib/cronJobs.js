/**
 * The scheduled jobs, in one place.
 *
 * Since 11 Sep 2026 these are fired by pg_cron inside Supabase (migration
 * scheduler_in_postgres), not by Vercel. Vercel's scheduler silently stopped
 * on 7 Sep and gave us no way to see why; Postgres logs every firing in
 * scheduler_invocations and pg_net records what the endpoint answered, so
 * "did it fire" and "did it run" are both questions with a table behind them.
 *
 * This list must match the cron.job rows in the database. If you add a job:
 * add it here, add a cron.schedule() migration, and give the handler a
 * heartbeat (lib/cronHeartbeat) so it appears as running on /admin/today.
 *
 * `key` is the heartbeat name the handler writes to cron_runs.
 */
export const CRON_JOBS = [
  { key: 'gallery-followups',     path: '/api/process-gallery-followups',      schedule: '*/5 * * * *',   label: 'Send batched gallery emails' },
  { key: 'email-engine',          path: '/api/email-engine',                   schedule: '*/10 * * * *',  label: 'Automated follow-ups' },
  { key: 'email-queue',           path: '/api/process-email-queue',            schedule: '*/5 * * * *',   label: 'Send approved emails' },
  // draft-replies is PAUSED (cron.alter_job active=false, 19 Sep 2026). It
  // called the Anthropic API with a prepaid key that ran dry at 02:20 that
  // morning — 73 failed runs in a row. David does not want API credits, so
  // drafting moved to the Claude scheduled task "COP — hourly enquiry reply
  // drafts" (trig_019oMJ4LX4dGqyXA6L3ZU7gT), which runs on his Max plan,
  // reads the Gmail thread first, and writes the same email_queue rows.
  // The handler still works; re-enable the cron.job row to switch back.
  { key: 'newsletter-drain',      path: '/api/cron/newsletter-drain',          schedule: '*/5 * * * *',   label: 'Newsletter sends' },
  { key: 'admin-task-reminders',  path: '/api/cron/admin-task-reminders',      schedule: '*/5 * * * *',   label: 'Task reminders' },
  { key: 'rotate-featured',       path: '/api/cron/rotate-featured',           schedule: '30 5 * * *',    label: 'Rotate featured homes' },
  { key: 'property-watch-alerts', path: '/api/cron/property-watch-alerts',     schedule: '0 7 * * *',     label: 'Property watch alerts' },
  { key: 'send-property-alerts',  path: '/api/send-property-alerts',           schedule: '30 7 * * *',    label: 'Saved-search alerts' },
  { key: 'partner-contact-check', path: '/api/cron/partner-contact-check',     schedule: '0 9 * * *',     label: 'Partner contact check' },
  { key: 'rightmove-leads',       path: '/api/cron/rightmove-leads',           schedule: '*/10 * * * *',  label: 'Rightmove leads → CRM' },
  // Rotating check of live listings against the partner's own page. Nothing
  // detected a withdrawn listing before 18 Sep 2026 — see the handler.
  { key: 'verify-supply',         path: '/api/cron/verify-supply',             schedule: '15 6 * * *',    label: 'Verify listings still for sale' },
];

/** Minutes a schedule may go quiet before it counts as stalled (two missed runs + slack). */
export function expectedGapMinutes(schedule) {
  const m = /^\*\/(\d+) \* \* \* \*$/.exec(schedule || '');
  if (m) return parseInt(m[1], 10) * 2 + 5;
  return 26 * 60;
}
