/**
 * /admin/today — the one page that says what the business is waiting on.
 *
 * Every number is derived live from the table that records the doing (see
 * pages/api/admin/ui/today.js). Nothing here is stored, so nothing here can
 * be stale or contradict the CRM: when the work is done the row disappears
 * by itself. An empty page means nothing is waiting — that is the goal state,
 * and it is shown as such rather than as a blank.
 *
 * Every scheduled job shows two facts — did the scheduler fire it, did the
 * job run — and has a Run button. The Vercel scheduler stopped invoking
 * every cron on 7 Sep 2026 and nobody knew for four days; since 11 Sep the
 * scheduler is pg_cron in Supabase, and both facts come from tables.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import AdminLayout from '@/components/admin/AdminLayout'
import { supabase } from '@/lib/supabase'

const C = {
  ink: '#202124', soft: '#5f6368', faint: '#80868b', line: '#dadce0',
  paper: '#ffffff', shell: '#f6f8fc', blue: '#0b57d0', chip: '#e8f0fe', chipInk: '#174ea6',
  warn: '#fef7e0', warnInk: '#7a5900', bad: '#fce8e6', badInk: '#c5221f',
  good: '#e6f4ea', goodInk: '#137333',
}
const FONT = "Roboto, 'Helvetica Neue', Arial, sans-serif"

function ago(value) {
  if (!value) return 'never'
  const mins = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const h = Math.round(mins / 60)
  if (h < 48) return `${h} h ago`
  return `${Math.round(h / 24)} days ago`
}

function name(r) {
  return [r.first_name, r.last_name].filter(Boolean).join(' ') || r.email
}

const JOB_STATE = {
  ok:             { bg: C.good, ink: C.goodInk, text: 'running' },
  failing:        { bg: C.bad,  ink: C.badInk,  text: 'last run failed' },
  stalled:        { bg: C.bad,  ink: C.badInk,  text: 'fired but not running' },
  rejected:       { bg: C.bad,  ink: C.badInk,  text: 'endpoint refused' },
  'not-firing':   { bg: C.bad,  ink: C.badInk,  text: 'scheduler not firing' },
  'not-yet':      { bg: C.warn, ink: C.warnInk, text: 'waiting for first run' },
  'no-heartbeat': { bg: C.warn, ink: C.warnInk, text: 'fires, no heartbeat yet' },
}

function Pill({ bg, ink, children }) {
  return (
    <span style={{ background: bg, color: ink, borderRadius: 999, padding: '2px 10px', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

/**
 * One tile per question. `rows` is the live answer; an empty answer is shown
 * as "nothing waiting" in green, because that is the state we are trying to
 * reach and it should look like success.
 */
function Tile({ title, source, rows, render, href, empty = 'Nothing waiting' }) {
  const [open, setOpen] = useState(false)
  const n = rows.length
  const shown = open ? rows : rows.slice(0, 5)
  return (
    <section style={{ background: C.paper, border: `1px solid ${C.line}`, borderRadius: 12, padding: '16px 18px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 500, color: n ? C.ink : C.goodInk, lineHeight: 1 }}>{n}</span>
        <span style={{ fontSize: 15, fontWeight: 500, color: C.ink }}>{title}</span>
        <span style={{ flex: 1 }} />
        {href && <Link href={href} style={{ fontSize: 12, color: C.blue, textDecoration: 'none' }}>open →</Link>}
      </div>
      <div style={{ fontSize: 11, color: C.faint, marginTop: 4 }}>from <code style={{ fontSize: 11 }}>{source}</code></div>
      {n === 0 ? (
        <div style={{ marginTop: 12 }}><Pill bg={C.good} ink={C.goodInk}>{empty}</Pill></div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '12px 0 0', display: 'grid', gap: 6 }}>
          {shown.map((r, i) => (
            <li key={r.id || r.email || i} style={{ fontSize: 13, color: C.ink, display: 'flex', gap: 8, alignItems: 'baseline', minWidth: 0 }}>
              {render(r)}
            </li>
          ))}
        </ul>
      )}
      {n > 5 && (
        <button onClick={() => setOpen(!open)} style={{ marginTop: 10, background: 'none', border: 'none', color: C.blue, fontSize: 12, cursor: 'pointer', padding: 0, fontFamily: FONT }}>
          {open ? 'show fewer' : `show all ${n}`}
        </button>
      )}
    </section>
  )
}

function Muted({ children }) {
  return <span style={{ color: C.faint, fontSize: 12, whiteSpace: 'nowrap' }}>{children}</span>
}
function Trunc({ children, max = 60 }) {
  const s = String(children || '')
  return <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }} title={s}>{s.length > max ? s.slice(0, max) + '…' : s}</span>
}

export default function TodayPage() {
  const [state, setState] = useState(null)
  const [err, setErr] = useState('')
  const [running, setRunning] = useState({})
  const [results, setResults] = useState({})

  const token = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }, [])

  const load = useCallback(async () => {
    const t = await token()
    if (!t) return
    try {
      const r = await fetch('/api/admin/ui/today', { headers: { Authorization: `Bearer ${t}` } })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`)
      setState(j)
      setErr(j.error || '')
    } catch (e) {
      setErr(e.message)
    }
  }, [token])

  useEffect(() => {
    load()
    const id = setInterval(load, 60000)
    return () => clearInterval(id)
  }, [load])

  async function run(path) {
    const t = await token()
    setRunning((s) => ({ ...s, [path]: true }))
    setResults((s) => ({ ...s, [path]: null }))
    try {
      const r = await fetch('/api/admin/ui/today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
        body: JSON.stringify({ job: path }),
      })
      const j = await r.json()
      setResults((s) => ({ ...s, [path]: j }))
    } catch (e) {
      setResults((s) => ({ ...s, [path]: { ok: false, error: e.message } }))
    } finally {
      setRunning((s) => ({ ...s, [path]: false }))
      load()
    }
  }

  const s = state
  const stalled = s ? s.jobs.filter((j) => ['stalled', 'not-firing', 'rejected', 'failing'].includes(j.state)).length : 0

  return (
    <AdminLayout>
      <div style={{ fontFamily: FONT, color: C.ink, maxWidth: 1180, margin: '0 auto', padding: '8px 4px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 500, margin: 0 }}>Today</h1>
          <span style={{ fontSize: 13, color: C.soft }}>What the business is waiting on — derived live, nothing stored.</span>
          <span style={{ flex: 1 }} />
          {s && <Muted>refreshed {ago(s.generatedAt)}</Muted>}
          <button onClick={load} style={{ border: `1px solid ${C.line}`, background: C.paper, borderRadius: 8, padding: '4px 12px', fontSize: 12, cursor: 'pointer', fontFamily: FONT }}>refresh</button>
        </div>

        {err && (
          <div style={{ background: C.bad, color: C.badInk, borderRadius: 8, padding: '10px 14px', fontSize: 13, marginBottom: 16 }}>{err}</div>
        )}

        {!s ? (
          <div style={{ color: C.faint, fontSize: 14 }}>Loading…</div>
        ) : (
          <>
            {/* Jobs strip first: if the machine is stopped, nothing below it can be trusted to be current. */}
            <section style={{ background: C.paper, border: `1px solid ${stalled ? C.badInk : C.line}`, borderRadius: 12, padding: '14px 18px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 500 }}>Scheduled jobs</span>
                <Muted>fired by pg_cron (<code>scheduler_runs</code>) · ran (<code>cron_runs</code>) · {stalled ? `${stalled} not running` : 'all running'}</Muted>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 8 }}>
                {s.jobs.map((j) => {
                  const st = JOB_STATE[j.state] || JOB_STATE['no-heartbeat']
                  const res = results[j.path]
                  return (
                    <div key={j.path} style={{ border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 12px', display: 'grid', gap: 6, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={j.path}>{j.label}</span>
                        <Pill bg={st.bg} ink={st.ink}>{st.text}</Pill>
                        <button
                          onClick={() => run(j.path)}
                          disabled={!!running[j.path]}
                          style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 999, padding: '4px 12px', fontSize: 12, cursor: running[j.path] ? 'wait' : 'pointer', opacity: running[j.path] ? 0.6 : 1, fontFamily: FONT }}
                        >{running[j.path] ? 'running…' : 'Run'}</button>
                      </div>
                      <div style={{ fontSize: 11, color: C.faint, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span><code>{j.schedule}</code></span>
                        <span>fired {ago(j.lastFired)}{j.firedStatus ? ` (${j.firedStatus})` : ''}</span>
                        <span>ran {ago(j.lastRun)}</span>
                        {j.errors24h > 0 && <span style={{ color: C.badInk }}>{j.errors24h} errors today</span>}
                      </div>
                      {(j.firedError || j.lastError) && <div style={{ fontSize: 11, color: C.badInk }}><Trunc max={120}>{j.firedError || j.lastError}</Trunc></div>}
                      {res && (
                        <div style={{ fontSize: 11, color: res.ok ? C.goodInk : C.badInk, background: res.ok ? C.good : C.bad, borderRadius: 6, padding: '4px 8px', wordBreak: 'break-word' }}>
                          {res.ok ? `ran in ${res.ms} ms` : `failed${res.httpStatus ? ` (HTTP ${res.httpStatus})` : ''}`}
                          {res.error ? ` — ${res.error}` : ''}
                          {res.result && ` — ${JSON.stringify(res.result).slice(0, 300)}`}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </section>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
              <Tile
                title="waiting for a reply"
                source="leads_awaiting_reply"
                rows={s.waiting}
                href="/admin/replies"
                empty="Everyone has been answered"
                render={(r) => (<>
                  <Trunc max={32}>{name(r)}</Trunc>
                  <Muted>{r.hours_waiting} h · {r.actions} action{r.actions === 1 ? '' : 's'} · {r.homes_touched} home{r.homes_touched === 1 ? '' : 's'}</Muted>
                </>)}
              />
              <Tile
                title="drafts to review"
                source="email_queue · pending_review"
                rows={s.review}
                href="/admin/replies"
                empty="Nothing to review"
                render={(r) => (<>
                  <Trunc max={32}>{r.to_name || r.to_email}</Trunc>
                  <Trunc max={40}>{r.subject}</Trunc>
                  {r.notes?.includes('NEEDS FIXING') && <Pill bg={C.warn} ink={C.warnInk}>needs fixing</Pill>}
                </>)}
              />
              <Tile
                title="not yet registered with a partner"
                source="referrals_outstanding"
                rows={s.unregistered}
                href="/admin/partners/queue"
                empty="Every lead with an operator is registered"
                render={(r) => (<>
                  <Trunc max={30}>{name(r)}</Trunc>
                  <Muted>{r.suggested_partner} · {r.days_since} d</Muted>
                  <Trunc max={36}>{r.property_title}</Trunc>
                </>)}
              />
              <Tile
                title="handed over, outcome unknown"
                source="referrals_awaiting_outcome"
                rows={s.outcomes}
                href="/admin/partners"
                empty="Every referral has an outcome"
                render={(r) => (<>
                  <Trunc max={30}>{name(r)}</Trunc>
                  <Muted>{r.partner} · {r.days_since} d</Muted>
                  <Pill bg={C.chip} ink={C.chipInk}>{r.action}</Pill>
                </>)}
              />
              <Tile
                title="changed or gone at the partner"
                source="listing_changes · not applied"
                rows={s.listings}
                href="/admin/listings"
                empty="Inventory matches the partners"
                render={(r) => (<>
                  <Muted>{r.partner}</Muted>
                  <Trunc max={34}>{r.slug}</Trunc>
                  <Muted>{r.change_type}{r.field ? ` · ${r.field}` : ''}{r.new_value ? ` → ${String(r.new_value).slice(0, 20)}` : ''}</Muted>
                </>)}
              />
              <Tile
                title="disputed or missing partner facts"
                source="partner_facts · needs_check"
                rows={s.disputed}
                empty="No open questions about any partner"
                render={(r) => (<>
                  <Muted>{r.partner} · {r.topic}</Muted>
                  <Trunc max={70}>{r.question}</Trunc>
                </>)}
              />
              <Tile
                title="facts a draft needed and could not find"
                source="fact_requests"
                rows={s.facts}
                empty="Every draft found what it needed"
                render={(r) => (<>
                  <Muted>{r.partner || r.slug}</Muted>
                  <Trunc max={70}>{r.question}</Trunc>
                </>)}
              />
              <Tile
                title="only you can decide"
                source="admin_tasks · open"
                rows={s.judgement}
                empty="Nothing needs a decision"
                render={(r) => (<>
                  <Trunc max={64}>{r.task}</Trunc>
                  {r.due_at && <Muted>due {new Date(r.due_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</Muted>}
                </>)}
              />
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
