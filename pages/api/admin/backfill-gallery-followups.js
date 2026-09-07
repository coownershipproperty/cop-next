/**
 * /api/admin/backfill-gallery-followups — RETIRED (7 Sep 2026).
 *
 * This was a one-off catch-up sender from 8 Aug 2026 ("delete this file once
 * the catch-up has run"). It stayed deployed with NO authentication: a plain
 * GET listed every contact who unlocked a gallery today (name, email, homes)
 * and POST ?confirm=send mailed all of them from dylan@. Found in the 7 Sep
 * audit. The route answers 410 so any bookmark or crawler hitting it gets a
 * clear signal; delete the file outright at the next clean-up.
 */
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  return res.status(410).json({ error: 'Gone — the one-off gallery catch-up was retired on 7 Sep 2026.' });
}
