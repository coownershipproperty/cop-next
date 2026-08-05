/**
 * The conversational layer over the property search.
 *
 * A buyer talks; the assistant answers with knowledge (from
 * lib/search/knowledge.js — its entire, reviewed education) and with homes
 * (from the search_homes tool, which runs the same deterministic ranker as
 * the search box). The division of labour is absolute: the model does the
 * conversation, the ranker does the choosing, and the model is never allowed
 * to describe a home or a surrounding it was not handed by the tool.
 *
 * Streamed as server-sent events so the first words appear in about a
 * second. Event shapes, one JSON object per `data:` line:
 *
 *   { t: 'delta',  text }             a piece of assistant prose
 *   { t: 'cards',  cards, widened }   homes to render, the moment they rank
 *   { t: 'done' }                     end of turn
 *   { t: 'error',  text }             a graceful failure the UI can show
 *
 * Safeguards are the same ladder as /api/search — shape, origin, per-IP,
 * global model budget — plus a per-conversation turn cap, and a streaming
 * scrubber that physically removes partner names and banned phrases from the
 * outbound text no matter what the model does. When the model is over budget
 * or down, the endpoint answers once, honestly, with the free keyword search
 * behind it, so the box never dies.
 */

import { createClient } from '@supabase/supabase-js';
import { rankProperties } from '@/lib/search/rank';
import { hasModel, chatStream, modelName, parseJsonLoose } from '@/lib/search/llm';
import { fallbackIntent, fallbackCopy, directAnswers } from '@/lib/search/prompts';
import { chatSystemPrompt, SEARCH_HOMES_TOOL } from '@/lib/search/knowledge';
import { validateQuery, checkOrigin, checkIp, takeModelBudget, clientIp } from '@/lib/search/guard';
import { visitorId, logSearch } from '@/lib/search/searchlog';
import facetData from '@/lib/search/place-facets.json';

const CORPUS_TTL_MS = 10 * 60 * 1000;
const MAX_TURNS = 12;          // user messages per conversation
const MAX_HISTORY = 10;        // messages replayed to the model
const MAX_MSG_CHARS = 600;

let corpusCache = null;

async function getCorpus() {
  if (corpusCache && Date.now() - corpusCache.at < CORPUS_TTL_MS) return corpusCache.value;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data, error } = await supabase
    .from('properties')
    .select('slug, title, img, country, region, city, beds, baths, size, price, currency, partner, property_type, property_style, status, lat, lng')
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

/**
 * The last line of defence for the two rules that must survive anything the
 * model emits: partner identities and the banned phrase. Works on a stream by
 * holding back a small tail of text, so a name split across two chunks still
 * gets caught. Belt, braces: the model is instructed, the payloads are clean,
 * and THEN every outbound character passes through this.
 */
const BANNED = /(myne\s?homes|myne|pacaso|vivla|andhamlet|&\s?hamlet|and\s?hamlet\b|abitaro|paris\s?property\s?group|floor\s?plans?)/gi;
const HOLDBACK = 24;

function makeScrubber(write) {
  let tail = '';
  return {
    push(text) {
      let s = tail + text;
      s = s.replace(BANNED, 'the managing team');
      tail = s.slice(-HOLDBACK);
      const out = s.slice(0, -HOLDBACK);
      if (out) write(out);
    },
    flush() {
      const out = tail.replace(BANNED, 'the managing team');
      tail = '';
      if (out) write(out);
    },
  };
}

/** One SSE event. */
function sse(res, obj) {
  res.write(`data: ${JSON.stringify(obj)}\n\n`);
}

/** Run the ranker for the assistant and split the result into what the buyer
 * sees (full cards, partner stripped) and what the model reads (a compact
 * digest it can refer to as [1], [2]...). */
function runSearchTool(args, props) {
  // The tool schema takes weights as {facet, weight} pairs (maximally
  // compatible JSON Schema); the ranker wants a map. Convert, tolerating
  // either shape so a model that ignores the schema still ranks.
  let weights = {};
  if (Array.isArray(args.weights)) {
    for (const w of args.weights) {
      if (w && typeof w.facet === 'string') weights[w.facet] = w.weight;
    }
  } else if (args.weights && typeof args.weights === 'object') {
    weights = args.weights;
  }

  const intent = {
    summary: typeof args.summary === 'string' ? args.summary : '',
    filters: args.filters || {},
    weights,
  };
  const ranked = rankProperties(intent, props, facetData, { limit: 6 });

  const cards = ranked.results.map(({ partner, facets, listing, all_evidence, ...r }) => r);
  const digest = ranked.results.map((r, i) => ({
    n: i + 1,
    where: [r.city, r.country].filter(Boolean).join(', '),
    score: r.score,
    beds: r.beds,
    share_price: r.price ? `${r.currency === 'USD' ? '$' : '€'}${r.price.toLocaleString('en-GB')}` : null,
    letting_out: r.rental === 'allowed' ? 'allowed' : r.rental === 'forbidden' ? 'not permitted' : 'to confirm',
    ...(r.km_from_asked != null ? { km_outside_asked_area: r.km_from_asked } : {}),
    evidence: (r.evidence || []).slice(0, 3).map(e => {
      const n0 = e.named && e.named[0];
      if (n0) return `${e.via || e.label}: ${n0.name}${n0.km != null ? ` ${n0.km}km` : ' (reaches the area)'}`;
      if (e.nearest_km != null) return `${e.label}: nearest ${e.nearest_km}km`;
      return `${e.label}: ${e.within_15km ?? 0} within 15km`;
    }),
  }));

  return {
    ranked,
    cards,
    toolResult: {
      homes: digest,
      matches_are_weak: ranked.meta.weak,
      went_outside_asked_area: ranked.meta.place_widened || false,
      asked_area: ranked.meta.asked_place_label || null,
      coverage_note: ranked.meta.coverage_gap
        ? `${ranked.meta.coverage_gap} homes not yet measured for these interests`
        : null,
    },
  };
}

// supportsResponseStreaming is what tells Vercel's serverless wrapper to pass
// chunks through as they are written instead of buffering the whole response
// — without it the "stream" arrives all at once at the end.
export const config = { api: { responseLimit: false }, supportsResponseStreaming: true };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // --- shape ---------------------------------------------------------------
  const rawMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
  const history = rawMessages
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MSG_CHARS) }))
    .slice(-MAX_HISTORY);
  const last = history[history.length - 1];
  if (!last || last.role !== 'user') return res.status(400).json({ error: 'No message.' });

  const shape = validateQuery(last.content);
  if (!shape.ok) return res.status(400).json({ error: shape.error });

  const userTurns = history.filter(m => m.role === 'user').length;
  if (userTurns > MAX_TURNS) {
    return res.status(200).json({
      fallback: true,
      text: 'We have covered a lot — the quickest next step is a proper conversation. Leave an enquiry on any home that caught your eye and Dylan will pick it up personally.',
    });
  }

  // --- guards --------------------------------------------------------------
  if (!checkOrigin(req)) return res.status(403).json({ error: 'Chat is only available from our own site.' });
  const ip = clientIp(req);
  const perIp = await checkIp(ip);
  if (!perIp.ok) return res.status(429).json({ error: perIp.error });

  const vid = visitorId(req, res);
  const started = Date.now();

  try {
    const { props, vocab } = await getCorpus();

    // --- degraded mode: the box must never die ----------------------------
    let budget = { allowed: false };
    if (hasModel()) budget = await takeModelBudget();
    if (!budget.allowed) {
      const intent = fallbackIntent(last.content, vocab);
      const ranked = rankProperties(intent, props, facetData, { limit: 6 });
      const copy = fallbackCopy(ranked);
      const cards = ranked.results.map(({ partner, facets, listing, all_evidence, ...r }) => ({
        ...r, why: copy.why[r.slug] || '',
      }));
      await logSearch({
        visitor_id: vid, ip, query: last.content, understood: ranked.intent.summary,
        results_count: cards.length, top_slugs: cards.slice(0, 5).map(r => r.slug),
        model: null, ms: Date.now() - started, meta: { phase: 'chat', degraded: true },
      });
      return res.status(200).json({
        fallback: true,
        text: copy.headline,
        cards,
        answers: directAnswers(ranked.intent.filters),
      });
    }

    // --- live conversation, streamed ---------------------------------------
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
      Connection: 'keep-alive',
    });

    const scrub = makeScrubber(text => sse(res, { t: 'delta', text }));
    const system = { role: 'system', content: chatSystemPrompt(vocab) };
    let assistantText = '';
    let toolCall = null;
    let cardsSent = null;
    const collect = t => { assistantText += t; };

    // Round one: the model speaks, or reaches for the tool.
    for await (const ev of chatStream([system, ...history], {
      tools: [SEARCH_HOMES_TOOL], maxTokens: 500, temperature: 0.4, timeoutMs: 25000,
    })) {
      if (ev.type === 'text') { collect(ev.text); scrub.push(ev.text); }
      if (ev.type === 'tool_call' && !toolCall) toolCall = ev;
    }

    // Round two, if it searched: cards go to the buyer IMMEDIATELY, the
    // digest goes back to the model, and the prose about the shortlist
    // streams in over the top.
    if (toolCall && toolCall.name === 'search_homes') {
      const args = parseJsonLoose(toolCall.args) || {};
      const { ranked, cards, toolResult } = runSearchTool(args, props);
      cardsSent = cards;
      sse(res, {
        t: 'cards', cards,
        widened: ranked.meta.place_widened || false,
        asked: ranked.meta.asked_place_label || null,
        answers: directAnswers(ranked.intent.filters),
      });

      for await (const ev of chatStream([
        system, ...history,
        { role: 'assistant', content: null, tool_calls: [{ id: 'call_1', type: 'function', function: { name: 'search_homes', arguments: toolCall.args } }] },
        { role: 'tool', tool_call_id: 'call_1', content: JSON.stringify(toolResult) },
      ], { maxTokens: 400, temperature: 0.4, timeoutMs: 20000 })) {
        if (ev.type === 'text') { collect(ev.text); scrub.push(ev.text); }
      }

      await logSearch({
        visitor_id: vid, ip, query: last.content, understood: ranked.intent.summary,
        chips: Object.entries(ranked.intent.weights).map(([facet, weight]) => ({ facet, weight })),
        filters: ranked.intent.filters,
        results_count: cards.length, top_slugs: cards.slice(0, 5).map(r => r.slug),
        model: modelName(), ms: Date.now() - started,
        meta: { phase: 'chat', turns: userTurns, place_widened: ranked.meta.place_widened || false },
      });
    } else {
      // A knowledge-only turn still goes in the log: it is a buyer talking.
      await logSearch({
        visitor_id: vid, ip, query: last.content, understood: null,
        results_count: null, model: modelName(), ms: Date.now() - started,
        meta: { phase: 'chat', turns: userTurns, knowledge_only: true },
      });
    }

    scrub.flush();
    if (!assistantText.trim() && !cardsSent) {
      sse(res, { t: 'delta', text: 'Tell me a little about what you are looking for — a place, a budget, the things you love doing — and I will find the homes that genuinely fit.' });
    }
    sse(res, { t: 'done' });
    return res.end();
  } catch (err) {
    console.error('[chat]', err);

    // The error goes in the log FIRST, verbatim, keyed to the visitor — so a
    // "the assistant broke" report can be diagnosed from the database instead
    // of from a screenshot of an apology.
    await logSearch({
      visitor_id: vid, ip, query: last.content,
      model: hasModel() ? modelName() : null, ms: Date.now() - started,
      meta: { phase: 'chat', error: String(err.message || err).slice(0, 500) },
    });

    // And the buyer gets an answer, not an apology: the free keyword search
    // still works when the model does not, so run it and show real homes.
    try {
      const { props, vocab } = await getCorpus();
      const intent = fallbackIntent(last.content, vocab);
      const ranked = rankProperties(intent, props, facetData, { limit: 6 });
      const copy = fallbackCopy(ranked);
      const cards = ranked.results.map(({ partner, facets, listing, all_evidence, ...r }) => ({
        ...r, why: copy.why[r.slug] || '',
      }));
      const payload = {
        text: copy.headline,
        cards,
        answers: directAnswers(ranked.intent.filters),
        ...(req.body?.debug ? { error_detail: String(err.message || err).slice(0, 300) } : {}),
      };
      if (res.headersSent) {
        if (cards.length) sse(res, { t: 'cards', cards, widened: ranked.meta.place_widened || false, asked: ranked.meta.asked_place_label || null, answers: payload.answers });
        sse(res, { t: 'delta', text: payload.text });
        sse(res, { t: 'done' });
        return res.end();
      }
      return res.status(200).json({ fallback: true, ...payload });
    } catch {
      if (res.headersSent) {
        sse(res, { t: 'error', text: 'Something went wrong on our side. Try once more?' });
        sse(res, { t: 'done' });
        return res.end();
      }
      return res.status(500).json({ error: 'The assistant is briefly unavailable.' });
    }
  }
}
