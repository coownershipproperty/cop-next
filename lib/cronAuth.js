/**
 * Is this request a legitimate scheduled run (or an internal call)?
 *
 * What Vercel actually sends with a cron invocation (docs, "Managing Cron
 * Jobs", checked 7 Sep 2026):
 *   - `x-vercel-cron-schedule: <the cron expression>` on EVERY cron request;
 *   - `Authorization: Bearer <CRON_SECRET>` ONLY when a CRON_SECRET env var
 *     exists on the project.
 * There is no `x-vercel-cron: 1` header. Five crons in this repo checked for
 * that header (or a Bearer secret that was never configured) and therefore
 * answered 401 to every scheduled run — admin-task reminders, property-watch
 * alerts, the partner contact check, the newsletter drain and the featured
 * rotation had never fired (7 Sep 2026 audit). /api/process-email-queue had
 * the same fate from 13 May to 6 Sep for the same reason.
 *
 * Accepts, in order:
 *   1. Bearer CRON_SECRET or CRM_SECRET (internal callers, and Vercel once
 *      CRON_SECRET is set — do set it, it is the only non-spoofable option);
 *   2. the x-vercel-cron-schedule header (what Vercel sends today);
 *   3. the legacy x-vercel-cron: 1 marker, kept for anything that still
 *      sends it.
 *
 * Callers should still be idempotent: the schedule header can be forged, so
 * treat it as "probably the scheduler", not as admin authentication, and never
 * return per-contact data (emails) to a request authorised this way.
 */
export function isCronRequest(req) {
  const auth = req.headers['authorization'] || '';
  const secrets = [process.env.CRON_SECRET, process.env.CRM_SECRET].filter(Boolean);
  if (secrets.some((s) => auth === `Bearer ${s}`)) return true;
  if (req.headers['x-vercel-cron-schedule']) return true;
  if (req.headers['x-vercel-cron'] === '1') return true;
  return false;
}

/** True only for a Bearer-secret call — safe to include contact-level detail. */
export function isSecretAuthed(req) {
  const auth = req.headers['authorization'] || '';
  const secrets = [process.env.CRON_SECRET, process.env.CRM_SECRET].filter(Boolean);
  return secrets.some((s) => auth === `Bearer ${s}`);
}
