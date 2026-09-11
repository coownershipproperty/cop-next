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
  { key: 'draft-replies',         path: '/api/cron/draft-replies',             schedule: '*/10 * * * *',  label: 'Draft replies to enquiries' },
  { key: 'newsletter-drain',      path: '/api/cron/newsletter-drain',          schedule: '*/5 * * * *',   label: 'Newsletter sends' },
  { key: 'admin-task-reminders',  path: '/api/cron/admin-task-reminders',      schedule: '*/5 * * * *',   label: 'Task reminders' },
  { key: 'rotate-featured',       path: '/api/cron/rotate-featured',           schedule: '30 5 * * *',    label: 'Rotate featured homes' },
  { key: 'property-watch-alerts', path: '/api/cron/property-watch-alerts',     schedule: '0 7 * * *',     label: 'Property watch alerts' },
  { key: 'send-property-alerts',  path: '/api/send-property-alerts',           schedule: '30 7 * * *',    label: 'Saved-search alerts' },
  { key: 'partner-contact-check', path: '/api/cron/partner-contact-check',     schedule: '0 9 * * *',     label: 'Partner contact check' },
];

/** Minutes a schedule may go quiet before it counts as stalled (two missed runs + slack). */
export function expectedGapMinutes(schedule) {
  const m = /^\*\/(\d+) \* \* \* \*$/.exec(schedule || '');
  if (m) return parseInt(m[1], 10) * 2 + 5;
  return 26 * 60;
}
