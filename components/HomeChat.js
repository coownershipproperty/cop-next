/**
 * The homepage conversation.
 *
 * Not a chatbot widget in a corner — the hero itself. A buyer types anything;
 * the reply streams in like a person typing, and when the assistant searches,
 * the property cards drop into the thread the moment the ranker returns,
 * before the prose about them has even finished.
 *
 * The assistant's text is the model's (scrubbed server-side); the cards are
 * ours — real homes, real measured evidence, straight from the same ranker
 * the search box used. The model cannot put a home on this screen.
 */

import { useState, useRef, useEffect } from 'react';

const NAVY = '#2C4A5E';
const GOLD = '#C9A84C';
const CREAM = '#F5F2EC';
const MUTED = '#6B8A9E';

const OPENERS = [
  'We have 2 kids and love the beach — where should we even start?',
  'How does co-ownership actually work? Is it timeshare?',
  'I dive and play padel. Somewhere quiet, 3 beds, not too touristy.',
  'Can I rent my weeks out when I am not using the home?',
  'Somewhere in the mountains I can walk to the lifts',
];

const SYM = { EUR: '€', USD: '$', GBP: '£' };
const money = (price, currency) =>
  price ? `${SYM[currency] || ''}${Number(price).toLocaleString('en-GB')}` : null;

function Card({ r, asked }) {
  return (
    <a className="card" href={`/property/${r.slug}/`}>
      <div className="card-img">
        {r.img ? <img src={r.img} alt={r.title} loading="lazy" /> : <div className="noimg" />}
        <span className="badge">{r.score}</span>
      </div>
      <div className="card-body">
        <h4>{r.title}</h4>
        <p className="where">
          {[r.city, r.country].filter(Boolean).join(', ')}
          {r.km_from_asked != null && asked && (
            <em> · ~{r.km_from_asked.toLocaleString('en-GB')} km from {asked}</em>
          )}
        </p>
        {!!(r.evidence || []).length && (
          <ul className="ev">
            {r.evidence.slice(0, 2).map(e => {
              const n0 = e.named && e.named[0];
              return (
                <li key={e.facet}>
                  {n0
                    ? <><b>{n0.name}</b> {n0.km != null ? `${n0.km} km` : 'reaches this area'}</>
                    : <><b>{e.label}</b>{e.nearest_km != null ? ` ${e.nearest_km} km` : ''}</>}
                </li>
              );
            })}
          </ul>
        )}
        <p className="meta">
          {r.beds > 0 && <span>{r.beds} bed{r.beds > 1 ? 's' : ''}</span>}
          {money(r.price, r.currency) && <span className="price">{money(r.price, r.currency)} share</span>}
        </p>
      </div>
      <style jsx>{`
        .card { display: block; background: #fff; border: 1px solid rgba(44,74,94,.12); text-decoration: none; color: inherit; transition: border-color .18s, transform .18s; }
        .card:hover { border-color: ${GOLD}; transform: translateY(-2px); }
        .card-img { position: relative; aspect-ratio: 4 / 3; overflow: hidden; background: ${CREAM}; }
        .card-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .noimg { width: 100%; height: 100%; background: ${CREAM}; }
        .badge { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,.95); color: ${NAVY}; font: 700 12px 'Nunito Sans', sans-serif; padding: 4px 8px; border-left: 2px solid ${GOLD}; }
        .card-body { padding: 13px 14px 14px; }
        h4 { font-family: 'Playfair Display', serif; font-weight: 400; font-size: 15px; line-height: 1.3; color: ${NAVY}; margin: 0 0 3px; }
        .where { font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: ${MUTED}; margin: 0 0 8px; }
        .where em { font-style: normal; text-transform: none; letter-spacing: 0; color: ${GOLD}; }
        .ev { list-style: none; margin: 0 0 8px; padding: 0 0 0 9px; border-left: 2px solid ${GOLD}; }
        .ev li { font-size: 12px; color: ${MUTED}; padding: 1px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .ev b { color: ${NAVY}; font-weight: 700; }
        .meta { display: flex; gap: 10px; font-size: 12px; color: ${MUTED}; margin: 0; padding-top: 8px; border-top: 1px solid rgba(44,74,94,.1); }
        .price { color: ${NAVY}; font-weight: 700; margin-left: auto; }
      `}</style>
    </a>
  );
}

export default function HomeChat({ variant = 'hero' }) {
  const isHero = variant === 'hero';
  // A turn: { role: 'user'|'assistant', text, cards?, asked?, answers? }
  const [thread, setThread] = useState([]);
  const [draft, setDraft] = useState('');
  const [live, setLive] = useState(null);        // the streaming assistant turn
  const [busy, setBusy] = useState(false);
  const [ph, setPh] = useState(0);
  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (draft || thread.length) return undefined;
    const t = setInterval(() => setPh(i => (i + 1) % OPENERS.length), 4200);
    return () => clearInterval(t);
  }, [draft, thread.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [thread, live]);

  // Seed from the URL hash (the internal preview page uses this).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const m = /(?:^|[#&])q=([^&]+)/.exec(window.location.hash || '');
    if (!m) return;
    let seeded = '';
    try { seeded = decodeURIComponent(m[1].replace(/\+/g, ' ')); } catch { return; }
    if (seeded.trim()) send(seeded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(q) {
    const text = (q ?? draft).trim();
    if (text.length < 3 || busy) return;
    setDraft('');
    setBusy(true);

    const nextThread = [...thread, { role: 'user', text }];
    setThread(nextThread);
    setLive({ text: '', cards: null });

    const messages = nextThread.slice(-10).map(m => ({ role: m.role, content: m.text }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      const type = res.headers.get('content-type') || '';

      // Degraded mode: one honest JSON answer from the free keyword search.
      if (type.includes('application/json')) {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Something went wrong.');
        setThread(t => [...t, {
          role: 'assistant',
          text: json.text || '',
          cards: json.cards || null,
          answers: json.answers || null,
        }]);
        setLive(null);
        return;
      }

      // Live mode: read the SSE stream.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      const turn = { text: '', cards: null, asked: null, answers: null };

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf('\n\n')) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 2);
          if (!line.startsWith('data:')) continue;
          let ev;
          try { ev = JSON.parse(line.slice(5)); } catch { continue; }
          if (ev.t === 'delta') { turn.text += ev.text; setLive({ ...turn }); }
          if (ev.t === 'cards') {
            turn.cards = ev.cards;
            turn.asked = ev.widened ? ev.asked : null;
            turn.answers = ev.answers && ev.answers.length ? ev.answers : null;
            setLive({ ...turn });
          }
          if (ev.t === 'error') { turn.text += (turn.text ? '\n' : '') + ev.text; setLive({ ...turn }); }
        }
      }

      setThread(t => [...t, { role: 'assistant', ...turn }]);
      setLive(null);
    } catch (err) {
      setThread(t => [...t, {
        role: 'assistant',
        text: 'Sorry — that did not go through. Try once more?',
      }]);
      setLive(null);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  function Turn({ m, streaming }) {
    return (
      <div className={`turn ${m.role}`}>
        {m.role === 'assistant' && <span className="tick" aria-hidden="true" />}
        <div className="bubblewrap">
          {(m.text || streaming) && (
            <div className={`bubble ${m.role}`}>
              {m.text}
              {streaming && <span className="caret" />}
            </div>
          )}
          {!!(m.answers || []).length && (
            <div className="answers">
              {m.answers.map(a => (
                <div key={a.asked} className="ans">
                  <span className="ans-q">{a.asked}</span>
                  <span className="ans-a">{a.answer}</span>
                </div>
              ))}
            </div>
          )}
          {!!(m.cards || []).length && (
            <div className="grid">
              {m.cards.map(r => <Card key={r.slug} r={r} asked={m.asked} />)}
            </div>
          )}
        </div>
      </div>
    );
  }

  const empty = !thread.length && !live;

  return (
    <div className="hc">
      {!empty && (
        <div className="thread">
          {thread.map((m, i) => <Turn key={i} m={m} streaming={false} />)}
          {live && <Turn m={live} streaming={!live.text || busy} />}
          <div ref={endRef} />
        </div>
      )}

      <form className="bar" onSubmit={e => { e.preventDefault(); send(); }}>
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder={empty ? OPENERS[ph] : 'Ask anything, or refine what you want…'}
          aria-label="Ask about our homes"
          maxLength={400}
        />
        <button type="submit" disabled={busy || draft.trim().length < 3}>
          {busy ? '…' : 'Ask'}
        </button>
      </form>

      {empty && (
        <div className="tries">
          <span>Try</span>
          {OPENERS.slice(0, 3).map(ex => (
            <button key={ex} type="button" onClick={() => send(ex)}>
              {ex.length > 56 ? `${ex.slice(0, 56)}…` : ex}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        .hc { width: 100%; max-width: 1180px; margin: 0 auto; font-family: 'Nunito Sans', sans-serif; }

        .thread { background: rgba(255,255,255,.97); padding: 22px 22px 8px; margin-bottom: 0; max-height: 62vh; overflow-y: auto; text-align: left; }
        .turn { display: flex; gap: 10px; margin-bottom: 16px; }
        .turn.user { justify-content: flex-end; }
        .tick { width: 8px; height: 8px; background: ${GOLD}; margin-top: 8px; flex: 0 0 8px; }
        .bubblewrap { max-width: 92%; min-width: 0; }
        .turn.user .bubblewrap { max-width: 78%; }
        .bubble { font-size: 14.5px; line-height: 1.6; white-space: pre-wrap; }
        .bubble.user { background: ${NAVY}; color: #fff; padding: 10px 14px; }
        .bubble.assistant { color: ${NAVY}; padding: 6px 0; }
        .caret { display: inline-block; width: 7px; height: 15px; background: ${GOLD}; margin-left: 3px; vertical-align: text-bottom; animation: blink 0.9s infinite; }
        @keyframes blink { 0%,100% { opacity: 0 } 50% { opacity: 1 } }

        .answers { margin: 8px 0 4px; }
        .ans { background: ${CREAM}; border-left: 3px solid ${GOLD}; padding: 10px 14px; margin-bottom: 6px; }
        .ans-q { display: block; font-size: 10.5px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: ${GOLD}; margin-bottom: 3px; }
        .ans-a { display: block; font-size: 13.5px; line-height: 1.55; color: ${NAVY}; }

        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 10px 0 4px; }
        @media (max-width: 900px) { .grid { grid-template-columns: repeat(2, 1fr) } }
        @media (max-width: 600px) { .grid { grid-template-columns: 1fr } }

        .bar { display: flex; width: 100%; max-width: 780px; margin: 0 auto; }
        .thread + .bar { max-width: none; }
        .bar input {
          flex: 1; min-width: 0; padding: 17px 20px; font-size: 16px; font-family: inherit;
          border: 1px solid ${isHero ? 'rgba(255,255,255,.35)' : 'rgba(44,74,94,.2)'};
          border-right: 0; background: ${isHero ? 'rgba(255,255,255,.94)' : '#fff'};
          color: ${NAVY}; outline: none;
        }
        .thread + .bar input { border-color: rgba(44,74,94,.18); background: #fff; border-top: 0; }
        .bar input::placeholder { color: ${MUTED}; opacity: .85; }
        .bar input:focus { background: #fff; border-color: ${GOLD}; }
        .bar button {
          padding: 0 30px; font-size: 15px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase;
          font-family: inherit; background: ${GOLD}; color: ${NAVY}; border: 1px solid ${GOLD};
          cursor: pointer; transition: background .18s;
        }
        .bar button:hover:not(:disabled) { background: #b8973f; }
        .bar button:disabled { opacity: .55; cursor: default; }

        .tries { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; margin-top: 14px; }
        .tries span { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: ${isHero ? 'rgba(255,255,255,.75)' : MUTED}; }
        .tries button {
          font-family: inherit; font-size: 13px; padding: 7px 13px; cursor: pointer;
          background: ${isHero ? 'rgba(255,255,255,.14)' : '#fff'};
          border: 1px solid ${isHero ? 'rgba(255,255,255,.3)' : 'rgba(44,74,94,.2)'};
          color: ${isHero ? '#fff' : NAVY}; transition: background .18s;
        }
        .tries button:hover { background: ${isHero ? 'rgba(255,255,255,.26)' : CREAM}; }
      `}</style>
    </div>
  );
}
