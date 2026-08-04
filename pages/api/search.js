/**
 * AI property search.
 *
 * The shape of a request:
 *
 *   buyer's sentence
 *      -> model call 1: understand it            (small, cheap, JSON)
 *      -> our ranking against real map data      (local, free, deterministic)
 *      -> model call 2: explain the shortlist    (grounded in supplied evidence only)
 *      -> results
 *
 * The middle step is the important one. The model never chooses a house. It
 * reads English at one end and writes English at the other, and the decision in
 * between is made by rank.js against OpenStreetMap facts we measured in
 * advance. That is why it cannot invent a dive centre: it is only ever shown
 * homes we have already checked, and only ever the evidence we already hold.
 *
 * If the model is unconfigured or falls over, both calls degrade to local
 * fallbacks and the search still returns correctly-ranked real homes.
 */

import { createClient } from '@supabase/supabase-js';
import { rankProperties } from '@/lib/search/rank';
import { hasModel, chatJson, modelName } from '@/lib/search/llm';
import {
  intentSystemPrompt, COPY_SYSTEM_PROMPT, buildCopyPayload,
  fallbackIntent, fallbackCopy,
} from '@/lib/search/prompts';
import { validateQuery, checkOrigin, checkIp, takeModelBudget, clientIp } from '@/lib/search/guard';
import facetData from '@/lib/search/place-facets.json';

const CORPUS_TTL_MS = 10 * 60 * 1000;
const MAX_QUERY = 400;

let corpusCache = null;

/**
 * The live corpus. Cached in module scope because it is the same 355 rows for
 * every visitor and a warm function should not pay for that round trip.
 * `status IN ('Live','for_sale')` is not optional — it is the filter whose
 * absence put hidden listings on the public site in July.
 */
async function getCorpus() {
  if (corpusCache && Date.now() - corpusCache.at < CORPUS_TTL_MS) return corpusCache.value;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase
    .from('properties')
    .select('slug, title, img, country, region, city, beds, baths, size, price, currency, partner, property_type, property_style, status')
    .in('status', ['Live', 'for_sale']);

  if (error) throw new Error(`corpus: ${error.message}`);

  const props = data || [];
  const uniq = (key) => [...new Set(props.map(p => p[key]).filter(Boolean))].sort();
  const value = {
    props,
    vocab: { countries: uniq('country'), regions: uniq('region'), cities: uniq('city') },
  };
  corpusCache = { at: Date.now(), value };
  return value;
}

/** Identical questions are common in testing and in demos. Don't pay twice. */
const answerCache = new Map();
const ANSWER_TTL_MS = 15 * 60 * 1000;
const cacheKey = q => q.toLowerCase().replace(/\s+/g, ' ').trim();

function cacheGet(k) {
  const hit = answerCache.get(k);
  if (!hit) return null;
  if (Date.now() - hit.at > ANSWER_TTL_MS) { answerCache.delete(k); return null; }
  return hit.value;
}
function cacheSet(k, value) {
  answerCache.set(k, { at: Date.now(), value });
  if (answerCache.size > 200) answerCache.delete(answerCache.keys().next().value);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const debug = req.body?.debug === true;

  // --- guard, cheapest checks first (see lib/search/guard.js) -------------

  // 1. Shape. Costs nothing and removes most automated noise.
  const shape = validateQuery(String(req.body?.query || '').slice(0, MAX_QUERY + 1));
  if (!shape.ok) return res.status(400).json({ error: shape.error });
  const query = shape.query;

  // 2. Origin. Forgeable, but it stops casual curl loops for one comparison.
  if (!checkOrigin(req)) return res.status(403).json({ error: 'Search is only available from our own site.' });

  // 3 & 4. Per-IP burst and daily. Fails open — see the note in guard.js.
  const ip = clientIp(req);
  const perIp = await checkIp(ip);
  if (!perIp.ok) return res.status(429).json({ error: perIp.error });

  // 6. Answer cache. A repeat costs nothing and never touches the budget.
  const cached = cacheGet(cacheKey(query));
  if (cached && !debug) {
    res.setHeader('X-Search-Cache', 'hit');
    return res.status(200).json(cached);
  }

  const started = Date.now();
  const notes = [];
  let usage = { intent: null, copy: null };

  try {
    const { props, vocab } = await getCorpus();

    // 5. Global daily ceiling on model calls. This is the layer that actually
    // protects the card, because it is the only one a distributed attack
    // cannot walk around. Reaching it does NOT break the search: we fall
    // through to keyword parsing and generated summaries, which are free, and
    // the ranking below is identical either way.
    let budget = { allowed: false, reason: 'no-model' };
    if (hasModel()) {
      budget = await takeModelBudget();
      if (!budget.allowed) {
        notes.push(budget.reason === 'daily-cap'
          ? 'reached today\'s AI limit; used keyword parsing'
          : 'AI budget could not be confirmed; used keyword parsing');
      }
    }
    const useModel = budget.allowed;

    // --- 1. understand ----------------------------------------------------
    let intent = null;
    if (useModel) {
      try {
        const { obj, usage: u } = await chatJson([
          { role: 'system', content: intentSystemPrompt(vocab) },
          { role: 'user', content: query },
        ], { maxTokens: 500, temperature: 0 });
        intent = obj;
        usage.intent = u;
      } catch (err) {
        notes.push(`intent model unavailable (${err.message}); used keyword parsing`);
      }
    } else if (!hasModel()) {
      notes.push('no model configured; used keyword parsing');
    }
    if (!intent) intent = fallbackIntent(query, vocab);

    // --- 2. rank (ours, local, deterministic) -----------------------------
    const ranked = rankProperties(intent, props, facetData, { limit: 12 });

    // --- 3. explain -------------------------------------------------------
    let copy = null;
    if (useModel && ranked.results.length) {
      try {
        const { obj, usage: u } = await chatJson([
          { role: 'system', content: COPY_SYSTEM_PROMPT },
          { role: 'user', content: JSON.stringify(buildCopyPayload(query, ranked)) },
        ], { maxTokens: 900, temperature: 0.4 });
        if (obj && obj.why) { copy = obj; usage.copy = u; }
      } catch (err) {
        notes.push(`copy model unavailable (${err.message}); used generated summaries`);
      }
    }
    if (!copy) copy = fallbackCopy(ranked);

    const payload = {
      query,
      headline: copy.headline || '',
      understood: ranked.intent.summary || '',
      chips: Object.entries(ranked.intent.weights)
        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
        .map(([facet, weight]) => ({ facet, weight })),
      filters: ranked.intent.filters,
      results: ranked.results.map(r => ({
        ...r,
        why: (copy.why && copy.why[r.slug]) || '',
      })),
      meta: {
        ...ranked.meta,
        ms: Date.now() - started,
        model: useModel ? modelName() : null,
        notes,
        ...(debug ? { usage, budget, ip_today: perIp.today ?? null } : {}),
      },
    };

    // Only cache the good version. A keyword-only answer is free to recompute,
    // and caching it would keep serving the degraded result for fifteen minutes
    // after the budget frees up again.
    if (!debug && useModel) cacheSet(cacheKey(query), payload);
    res.setHeader('X-Search-Cache', 'miss');
    return res.status(200).json(payload);
  } catch (err) {
    console.error('[search]', err);
    return res.status(500).json({ error: 'Search is temporarily unavailable.', detail: debug ? String(err.message) : undefined });
  }
}
