/**
 * The homepage search.
 *
 * The brief was "not a boring chatbot", and the thing that stops it being one
 * is that it shows its working and then hands the working over.
 *
 * A visitor types a sentence. We break it into chips — one per thing we
 * understood — and those chips are not decoration, they are controls. Remove
 * "quiet", flip "beaches" from want to avoid, and the shortlist rearranges
 * itself immediately, in the browser, with no second request and no further
 * cost. That is possible because the ranking is a pure function over static
 * enrichment data, so the same code that ranked on the server runs here.
 *
 * Every result carries real named proof: a dive centre with a name and a
 * measured distance, not a similarity score. If nothing genuinely fits, the
 * headline says so rather than dressing up the least bad option.
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import { scoreHome, evidenceFor, listingHits, FACET_LABELS } from '@/lib/search/rank';

const NAVY = '#2C4A5E';
const GOLD = '#C9A84C';
const CREAM = '#F5F2EC';
const MUTED = '#6B8A9E';

const EXAMPLES = [
  'I dive, I play padel, and I want somewhere quiet — 3 beds, not too touristic',
  'Somewhere near a beach in Spain the kids will love, under €200k',
  'A ski place I can walk to the lifts from, with a fireplace',
  'Quiet, authentic, good food, walkable, nowhere full of tourists',
  'Near a marina in Italy, 2 beds, somewhere I can work from',
];

const STAGES = [
  'Reading what you asked for',
  'Checking what is actually near each home',
  'Ranking 355 homes',
];

const SYM = { EUR: '€', USD: '$', GBP: '£' };

function money(price, currency) {
  if (!price) return null;
  return `${SYM[currency] || ''}${Number(price).toLocaleString('en-GB')}`;
}

/** A small dial. Reads faster than a number and does not pretend to precision. */
function MatchRing({ score }) {
  const r = 15;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, score)) / 100;
  return (
    <span className="ring" title={`${score}% match`}>
      <svg viewBox="0 0 36 36" width="36" height="36" aria-hidden="true">
        <circle cx="18" cy="18" r={r} fill="none" stroke="rgba(44,74,94,.14)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={r} fill="none" stroke={GOLD} strokeWidth="3"
          strokeDasharray={`${c * pct} ${c}`} strokeLinecap="butt"
          transform="rotate(-90 18 18)"
        />
      </svg>
      <b>{score}</b>
      <style jsx>{`
        .ring { position: relative; display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; flex: 0 0 36px; }
        .ring svg { position: absolute; inset: 0; }
        .ring b { font-size: 11px; font-weight: 700; color: ${NAVY}; font-family: 'Nunito Sans', sans-serif; }
      `}</style>
    </span>
  );
}

export default function SmartSearch({ variant = 'hero' }) {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState('idle');       // idle | thinking | done | error
  const [stage, setStage] = useState(0);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [weights, setWeights] = useState({});       // locally editable copy
  const [dirty, setDirty] = useState(false);        // chips edited since last fetch
  const [showAll, setShowAll] = useState(false);
  const [ph, setPh] = useState(0);

  const inputRef = useRef(null);
  const resultsRef = useRef(null);

  // Rotating placeholder. Stops once they start typing — nothing more annoying
  // than a placeholder moving under your cursor.
  useEffect(() => {
    if (query || phase !== 'idle') return undefined;
    const t = setInterval(() => setPh(i => (i + 1) % EXAMPLES.length), 4200);
    return () => clearInterval(t);
  }, [query, phase]);

  // Narrated progress. The work genuinely has these stages, so the pacing is
  // honest rather than a fake spinner.
  useEffect(() => {
    if (phase !== 'thinking') return undefined;
    setStage(0);
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 700);
    return () => clearInterval(t);
  }, [phase]);

  // A query can be handed in through the URL hash (#q=...). The internal
  // preview page uses it to load a test sentence. Harmless everywhere else,
  // because with no hash present this does nothing at all.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = /(?:^|[#&])q=([^&]+)/.exec(window.location.hash || '');
    if (!m) return;
    let seeded = '';
    try { seeded = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch { return; }
    if (!seeded.trim()) return;
    setQuery(seeded);
    run(seeded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Two requests, not one slow one. The first ("rank") returns the shortlist
   * with generated copy in a couple of seconds — the buyer starts reading. The
   * second ("explain") brings the written headline and per-home lines, which
   * fade in over the generated ones when they arrive. If it never arrives, the
   * generated copy was already honest and complete, so nothing breaks.
   */
  async function run(q) {
    const text = (q ?? query).trim();
    if (text.length < 3) return;
    setPhase('thinking');
    setError('');
    setShowAll(false);
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, phase: 'rank' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Search failed');
      setData(json);
      setWeights(Object.fromEntries(json.chips.map(c => [c.facet, c.weight])));
      setDirty(false);
      setPhase('done');
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);

      // Round two, in the background. Send back what the search understood so
      // the server can rebuild the identical shortlist without re-parsing.
      if (json.meta?.model) {
        fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: text,
            phase: 'explain',
            intent: {
              summary: json.understood,
              filters: json.filters,
              weights: Object.fromEntries(json.chips.map(c => [c.facet, c.weight])),
            },
          }),
        })
          .then(r => (r.ok ? r.json() : null))
          .then(copy => {
            if (!copy || copy.copy_source !== 'model') return;
            setData(d => {
              // The buyer may have started a different search meanwhile.
              if (!d || d.query !== json.query) return d;
              return {
                ...d,
                headline: copy.headline || d.headline,
                results: d.results.map(r => ({ ...r, why: copy.why?.[r.slug] || r.why, polished: !!copy.why?.[r.slug] })),
                meta: { ...d.meta, copy_source: 'model' },
              };
            });
          })
          .catch(() => { /* the generated copy already on screen is fine */ });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      setPhase('error');
    }
  }

  /**
   * Re-rank locally. Runs on every chip change against the pool the server
   * already sent, using the identical scoring function — so a locally-reordered
   * list is scored exactly as the server would score it.
   *
   * The one honest limitation: this reshuffles the homes we already have, it
   * cannot reach further into the collection. When the chips have been edited
   * we offer to search again properly, and say why.
   */
  const view = useMemo(() => {
    if (!data) return [];
    const active = Object.keys(weights).length > 0;
    const rows = data.results.map(r => {
      if (!active) return { ...r, score: r.score };
      const enrich = { facets: r.facets, listing: r.listing, evidence: r.all_evidence };
      const { score } = scoreHome(enrich, weights);
      return {
        ...r,
        // Re-apply the server's distance penalty so a chip edit cannot quietly
        // float a far-away alternative back above a nearer one.
        score: Math.max(0, score - (r.place_penalty || 0)),
        // The composites map travels with the response so a browser re-rank
        // borrows proof from constituent facets exactly as the server did —
        // otherwise "the outdoors" would score locally but show no evidence.
        evidence: evidenceFor(enrich, weights, 3, data.meta && data.meta.composites),
        listing_hits: listingHits(enrich, weights),
      };
    });
    rows.sort((a, b) => b.score - a.score || a.slug.localeCompare(b.slug));
    return rows;
  }, [data, weights]);

  function toggleChip(facet) {
    // want -> avoid -> off -> want. A full cycle, one click each, no menus, and
    // no dead ends: a chip that arrived negative ("not touristy") can still be
    // walked round to positive, and a dropped chip can be brought back at the
    // strength the model originally gave it.
    const original = data?.chips.find(c => c.facet === facet)?.weight;
    const restore = Math.abs(Number(original)) || 2;
    setWeights(w => {
      const next = { ...w };
      const cur = next[facet];
      if (cur == null) next[facet] = restore;          // off  -> want
      else if (cur > 0) next[facet] = -Math.abs(cur);  // want -> avoid
      else delete next[facet];                         // avoid -> off
      return next;
    });
    setDirty(true);
  }

  const shown = showAll ? view : view.slice(0, 6);
  const isHero = variant === 'hero';

  /**
   * Evidence, tidied for reading. The ranker may prove two facets with the
   * same beach — "family-friendly · beaches: Cala Llenya" and "beaches: Cala
   * Llenya" — which is sound scoring and terrible prose. One named place gets
   * one line, and three lines is plenty.
   */
  function tidyEvidence(evidence) {
    const seen = new Set();
    const out = [];
    for (const e of evidence || []) {
      const name = e.named && e.named[0] ? e.named[0].name : null;
      const key = name || `${e.facet}:${e.nearest_km}:${e.within_15km}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(e);
      if (out.length === 3) break;
    }
    return out;
  }

  return (
    <div className={`ss ${isHero ? 'ss-hero' : 'ss-page'}`}>
      <form
        className="ss-bar"
        onSubmit={e => { e.preventDefault(); run(); }}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={EXAMPLES[ph]}
          aria-label="Describe the home you are looking for"
          maxLength={400}
        />
        <button type="submit" disabled={phase === 'thinking' || query.trim().length < 3}>
          {phase === 'thinking' ? 'Searching' : 'Search'}
        </button>
      </form>

      {phase === 'idle' && (
        <div className="ss-tries">
          <span>Try</span>
          {EXAMPLES.slice(0, 3).map(ex => (
            <button key={ex} type="button" onClick={() => { setQuery(ex); run(ex); }}>
              {ex.length > 52 ? `${ex.slice(0, 52)}…` : ex}
            </button>
          ))}
        </div>
      )}

      {phase === 'thinking' && (
        <div className="ss-thinking">
          <span className="dot" />
          {STAGES.map((s, i) => (
            <span key={s} className={`stg ${i === stage ? 'on' : ''} ${i < stage ? 'past' : ''}`}>{s}</span>
          ))}
        </div>
      )}

      {phase === 'error' && <div className="ss-error">{error}</div>}

      {phase === 'done' && data && (
        <div className="ss-out" ref={resultsRef}>
          <p className="ss-head">{data.headline}</p>
          {data.understood && <p className="ss-understood">{data.understood}</p>}

          {/* Direct questions get direct answers, before any property card.
              Deterministic text from the server — never model prose. */}
          {!!(data.answers || []).length && (
            <div className="ss-answers">
              {data.answers.map(a => (
                <div key={a.asked} className="ans">
                  <span className="ans-q">{a.asked}</span>
                  <span className="ans-a">{a.answer}</span>
                </div>
              ))}
            </div>
          )}

          {!!data.chips.length && (
            <div className="ss-chips">
              {data.chips.map(({ facet }) => {
                const w = weights[facet];
                const state = w == null ? 'off' : w > 0 ? 'want' : 'avoid';
                return (
                  <button
                    key={facet}
                    type="button"
                    className={`chip ${state}`}
                    onClick={() => toggleChip(facet)}
                    title={state === 'want' ? 'Click to avoid this instead' : state === 'avoid' ? 'Click to drop it' : 'Dropped — click to want it again'}
                  >
                    <i>{state === 'want' ? '+' : state === 'avoid' ? '−' : '×'}</i>
                    {FACET_LABELS[facet] || facet}
                  </button>
                );
              })}
              {dirty && (
                <button type="button" className="chip redo" onClick={() => run(query)}>
                  Search the full collection again ↻
                </button>
              )}
            </div>
          )}

          {dirty && (
            <p className="ss-note">
              Reordered instantly from the homes already found. Search again to look across all {data.meta.considered} homes with these changes.
            </p>
          )}

          {/* The headline already carries the went-outside-your-area truth, so
              the small print only lists the OTHER concessions. */}
          {(() => {
            const rest = data.meta.relaxations.filter(t => !/beyond the area/i.test(t));
            return rest.length
              ? <p className="ss-note">To find these, we {rest.join(', and ')}.</p>
              : null;
          })()}

          <div className="ss-grid">
            {shown.map(r => (
              <a key={r.slug} className="card" href={`/property/${r.slug}/`}>
                <div className="card-img">
                  {r.img
                    ? <img src={r.img} alt={r.title} loading="lazy" />
                    : <div className="noimg" />}
                  <span className="card-score"><MatchRing score={r.score} /></span>
                </div>
                <div className="card-body">
                  <h4>{r.title}</h4>
                  <p className="where">
                    {[r.city, r.region, r.country].filter(Boolean).join(', ')}
                    {/* An alternative outside the asked area says how far
                        outside, plainly, on the card itself. */}
                    {r.km_from_asked != null && data.meta.asked_place_label && (
                      <em className="afar"> · ~{r.km_from_asked.toLocaleString('en-GB')} km from {data.meta.asked_place_label}</em>
                    )}
                  </p>
                  {r.why && <p className={`why ${r.polished ? 'polished' : ''}`}>{r.why}</p>}

                  {!!r.evidence.length && (
                    <ul className="ev">
                      {tidyEvidence(r.evidence).map(e => (
                        <li key={e.facet}>
                          {/* A trail or a park has a name but no honest single
                              distance, so it shows the name and says so rather
                              than printing a number nobody could stand behind. */}
                          {e.named[0]
                            ? <><b>{e.named[0].name}</b><span>{e.via || e.label}{e.named[0].km != null ? ` · ${e.named[0].km} km` : ' · reaches this area'}</span></>
                            : e.nearest_km != null
                              ? <><b>{e.label}</b><span>nearest {e.nearest_km} km</span></>
                              : <><b>{e.label}</b><span>{e.within_15km} within 15 km</span></>}
                        </li>
                      ))}
                    </ul>
                  )}

                  {!!r.listing_hits.length && (
                    <p className="has">From the listing: {r.listing_hits.slice(0, 4).join(' · ')}</p>
                  )}

                  <p className="meta">
                    {r.beds > 0 && <span>{r.beds} bed{r.beds > 1 ? 's' : ''}</span>}
                    {r.size > 0 && <span>{r.size} m²</span>}
                    {money(r.price, r.currency) && <span className="price">{money(r.price, r.currency)} share</span>}
                  </p>
                </div>
              </a>
            ))}
          </div>

          {view.length > 6 && !showAll && (
            <button type="button" className="ss-more" onClick={() => setShowAll(true)}>
              Show {view.length - 6} more
            </button>
          )}

          {!view.length && (
            <p className="ss-note">Nothing in the collection is close enough to show you honestly. Try widening the budget or the area.</p>
          )}
        </div>
      )}

      <style jsx>{`
        .ss { width: 100%; max-width: 1180px; margin: 0 auto; font-family: 'Nunito Sans', sans-serif; }

        /* ---- the bar ---- */
        .ss-bar { display: flex; width: 100%; max-width: 780px; margin: 0 auto; }
        .ss-bar input {
          flex: 1; min-width: 0; padding: 17px 20px; font-size: 16px; font-family: inherit;
          border: 1px solid rgba(255,255,255,.35); border-right: 0; background: rgba(255,255,255,.94);
          color: ${NAVY}; outline: none;
        }
        .ss-bar input::placeholder { color: ${MUTED}; opacity: .85; }
        .ss-bar input:focus { background: #fff; border-color: ${GOLD}; }
        .ss-bar button {
          padding: 0 30px; font-size: 15px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
          font-family: inherit; background: ${GOLD}; color: ${NAVY}; border: 1px solid ${GOLD};
          cursor: pointer; transition: background .18s;
        }
        .ss-bar button:hover:not(:disabled) { background: #b8973f; }
        .ss-bar button:disabled { opacity: .55; cursor: default; }

        /* ---- example prompts ---- */
        .ss-tries { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; margin-top: 14px; }
        .ss-tries span { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: ${isHero ? 'rgba(255,255,255,.75)' : MUTED}; }
        .ss-tries button {
          font-family: inherit; font-size: 13px; padding: 7px 13px; cursor: pointer;
          background: ${isHero ? 'rgba(255,255,255,.14)' : '#fff'};
          border: 1px solid ${isHero ? 'rgba(255,255,255,.3)' : 'rgba(44,74,94,.2)'};
          color: ${isHero ? '#fff' : NAVY}; transition: background .18s;
        }
        .ss-tries button:hover { background: ${isHero ? 'rgba(255,255,255,.26)' : CREAM}; }

        /* ---- progress ---- */
        .ss-thinking { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; justify-content: center; margin-top: 18px; }
        .ss-thinking .dot { width: 7px; height: 7px; background: ${GOLD}; animation: pulse 1s infinite; }
        @keyframes pulse { 0%,100% { opacity: .25 } 50% { opacity: 1 } }
        .stg { font-size: 12.5px; color: ${isHero ? 'rgba(255,255,255,.5)' : 'rgba(44,74,94,.45)'}; transition: color .3s, opacity .3s; }
        .stg.on { color: ${isHero ? '#fff' : NAVY}; font-weight: 700; }
        .stg.past { opacity: .4; }

        .ss-error { margin-top: 16px; padding: 12px 16px; border-left: 3px solid #b3453a; background: rgba(255,255,255,.9); color: ${NAVY}; font-size: 14px; }

        /* ---- output ---- */
        .ss-out { margin-top: 26px; padding: 26px; background: ${isHero ? 'rgba(255,255,255,.97)' : 'transparent'}; text-align: left; }
        .ss-head { font-family: 'Playfair Display', serif; font-size: 22px; line-height: 1.35; color: ${NAVY}; margin: 0 0 6px; }
        .ss-understood { font-size: 14px; color: ${MUTED}; margin: 0 0 16px; font-style: italic; }

        .ss-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
        .chip {
          display: inline-flex; align-items: center; gap: 7px; padding: 7px 12px; cursor: pointer;
          font-family: inherit; font-size: 13px; background: ${CREAM}; color: ${NAVY};
          border: 1px solid rgba(44,74,94,.18); transition: all .16s;
          animation: chipIn .34s ease both;
        }
        .chip i { font-style: normal; font-weight: 700; font-size: 13px; line-height: 1; }
        .chip.want { border-color: ${GOLD}; background: rgba(201,168,76,.14); }
        .chip.want i { color: ${GOLD}; }
        .chip.avoid { border-color: rgba(44,74,94,.4); background: #fff; text-decoration: line-through; color: ${MUTED}; }
        .chip.off { opacity: .4; text-decoration: line-through; }
        .chip.redo { background: ${NAVY}; color: #fff; border-color: ${NAVY}; text-decoration: none; }
        .chip:hover { transform: translateY(-1px); }
        @keyframes chipIn { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }

        .ss-note { font-size: 13px; color: ${MUTED}; margin: 0 0 14px; }

        /* ---- direct answers ---- */
        .ss-answers { margin: 0 0 18px; }
        .ans { display: block; background: ${CREAM}; border-left: 3px solid ${GOLD}; padding: 12px 16px; margin-bottom: 8px; }
        .ans-q { display: block; font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: ${GOLD}; margin-bottom: 4px; }
        .ans-a { display: block; font-size: 14px; line-height: 1.55; color: ${NAVY}; }

        /* ---- results ---- */
        .ss-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        @media (max-width: 900px) { .ss-grid { grid-template-columns: repeat(2, 1fr) } }
        @media (max-width: 600px) { .ss-grid { grid-template-columns: 1fr } }

        .card { display: block; background: #fff; border: 1px solid rgba(44,74,94,.12); text-decoration: none; color: inherit; transition: border-color .18s, transform .18s; }
        .card:hover { border-color: ${GOLD}; transform: translateY(-2px); }
        .card-img { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: ${CREAM}; }
        .card-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .noimg { width: 100%; height: 100%; background: ${CREAM}; }
        .card-score { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,.94); padding: 3px; display: flex; }

        .card-body { padding: 15px 16px 17px; }
        .card-body h4 { font-family: 'Playfair Display', serif; font-size: 16px; line-height: 1.3; color: ${NAVY}; margin: 0 0 3px; }
        .where { font-size: 12px; letter-spacing: .06em; text-transform: uppercase; color: ${MUTED}; margin: 0 0 9px; }
        .where .afar { font-style: normal; text-transform: none; letter-spacing: 0; color: ${GOLD}; }
        .why { font-size: 13.5px; line-height: 1.5; color: ${NAVY}; margin: 0 0 10px; }
        .why.polished { animation: fadeSwap .5s ease; }
        @keyframes fadeSwap { from { opacity: .25 } to { opacity: 1 } }

        .ev { list-style: none; padding: 0; margin: 0 0 10px; border-left: 2px solid ${GOLD}; }
        .ev li { display: flex; gap: 8px; padding: 3px 0 3px 10px; font-size: 12.5px; color: ${MUTED}; align-items: baseline; }
        .ev li b { color: ${NAVY}; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; }
        .ev li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .has { font-size: 12px; color: ${MUTED}; margin: 0 0 10px; }
        .meta { display: flex; flex-wrap: wrap; gap: 12px; font-size: 12.5px; color: ${MUTED}; margin: 0; padding-top: 10px; border-top: 1px solid rgba(44,74,94,.1); }
        .meta .price { color: ${NAVY}; font-weight: 700; margin-left: auto; }

        .ss-more { display: block; margin: 18px auto 0; padding: 11px 26px; cursor: pointer; font-family: inherit; font-size: 13px; letter-spacing: .06em; text-transform: uppercase; background: transparent; border: 1px solid ${NAVY}; color: ${NAVY}; }
        .ss-more:hover { background: ${NAVY}; color: #fff; }
      `}</style>
    </div>
  );
}
