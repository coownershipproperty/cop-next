/**
 * Cron heartbeat.
 *
 * On 7 September 2026 /api/process-gallery-followups stopped running. Nothing
 * noticed. By 11 September, 64 gallery emails had been batched for it to
 * deliver and it had delivered 2 — four days of people asking for photos of
 * three and four homes and receiving one.
 *
 * A job that silently stops is worse than a job that loudly fails, so every
 * cron now records that it ran. `select * from cron_health` says which jobs
 * have gone quiet and for how long.
 *
 * This must never break the job it is measuring: every call is best-effort
 * and swallows its own errors.
 */
export async function beat(db, job, { ok = true, startedAt = null, summary = null, error = null } = {}) {
  try {
    await db.from('cron_runs').insert({
      job,
      ok,
      duration_ms: startedAt ? Date.now() - startedAt : null,
      summary: summary ? String(summary).slice(0, 500) : null,
      error: error ? String(error).slice(0, 500) : null,
    });
  } catch (e) {
    console.error(`[cron-heartbeat] ${job}: ${e.message}`);
  }
}

/** Wrap a cron handler so it always records a run, pass or fail. */
export function withHeartbeat(job, db, fn) {
  return async (...args) => {
    const startedAt = Date.now();
    try {
      const out = await fn(...args);
      await beat(db, job, { ok: true, startedAt, summary: out?.heartbeat || null });
      return out;
    } catch (e) {
      await beat(db, job, { ok: false, startedAt, error: e.message });
      throw e;
    }
  };
}
