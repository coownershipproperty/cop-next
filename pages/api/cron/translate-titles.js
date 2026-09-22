/**
 * GET/POST /api/cron/translate-titles
 *
 * Fills title_{locale} for any live listing that is missing one.
 *
 * Why this exists. On 22 September 2026 a Miami apartment added four days
 * earlier was still showing its English title on /es/, and forty live homes
 * had no Swedish, Danish or Norwegian title at all — everything added since
 * 9 September. Nothing was broken: translation was a script someone ran by
 * hand, and nobody had run it. A new listing therefore arrived in English on
 * nine locale sites and stayed that way until somebody noticed.
 *
 * The composer is lib/propertyTitles.js, the same one the script uses. It
 * rebuilds a title from vocabularies rather than translating freely, and
 * refuses to write a row unless every token in it is known — so the failure
 * mode here is an English title, never a half-Spanish one.
 *
 * Titles it cannot compose are reported in the run summary rather than
 * swallowed, because the fix for those is a word in the vocabulary or a
 * clearer title, and neither happens if nobody is told.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { isCronRequest } from '@/lib/cronAuth';
import { heartbeatHandler } from '@/lib/cronHeartbeat';
import { translateTitle, LOCALES } from '@/lib/propertyTitles';

export const maxDuration = 120;

async function handler(req, res) {
  if (!isCronRequest(req)) return res.status(401).json({ error: 'Unauthorized' });

  const db = createSupabaseAdminClient();
  const columns = LOCALES.map((l) => `title_${l}`).join(', ');
  const { data: rows, error } = await db
    .from('properties')
    .select(`slug, title, ${columns}`)
    .in('status', ['Live', 'for_sale']);
  if (error) throw new Error(error.message);

  const updates = [];      // { slug, patch }
  const unresolved = [];   // titles the vocabulary cannot compose

  for (const row of rows || []) {
    if (!row.title) continue;
    const patch = {};
    let missingAny = false;
    for (const locale of LOCALES) {
      if (row[`title_${locale}`]) continue;
      missingAny = true;
      const composed = translateTitle(row.title, locale);
      if (composed) patch[`title_${locale}`] = composed;
    }
    if (Object.keys(patch).length) updates.push({ slug: row.slug, patch });
    else if (missingAny) unresolved.push(row.title);
  }

  let written = 0;
  for (let i = 0; i < updates.length; i += 25) {
    const batch = updates.slice(i, i + 25);
    const results = await Promise.all(
      batch.map((u) => db.from('properties').update(u.patch).eq('slug', u.slug))
    );
    written += results.filter((r) => !r.error).length;
    for (const r of results) if (r.error) console.error('[translate-titles]', r.error.message);
  }

  const summary = `${written} listings filled` +
    (unresolved.length ? `; ${unresolved.length} could not be composed` : '');
  if (unresolved.length) {
    console.warn('[translate-titles] no vocabulary for:\n  ' + [...new Set(unresolved)].join('\n  '));
  }

  return res.status(200).json({
    ok: true,
    checked: rows?.length || 0,
    filled: written,
    unresolved: [...new Set(unresolved)],
    heartbeat: summary,
  });
}

export default heartbeatHandler('translate-titles', handler);
