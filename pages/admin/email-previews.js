/**
 * /admin/email-previews
 *
 * Every React Email template in emails/, rendered live, side by side with a
 * phone-width and an inbox-width frame. Built 22 Sep 2026 with the
 * black/white/grey re-skin, because "do the emails match the site now?" is a
 * question you answer by looking, and the alternative was mailing yourself
 * twenty-one times.
 *
 * Read-only. The iframes point at /api/admin/ui/email-preview, which renders
 * and returns HTML and touches nothing.
 */
import { useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { TEMPLATES } from '@/pages/api/admin/ui/email-preview'

const GROUPS = [
  { title: 'Newsletters',      names: ['newsletter', 'new-listings-digest', 'personalised-newsletter'] },
  { title: 'Alerts',           names: ['property-alert', 'price-drop-alert', 'seasonal-spotlight'] },
  { title: 'Gallery & floor plans', names: ['gallery-nurture', 'nurture-floor-plan', 'floor-plan', 'discreet-brochure'] },
  { title: 'Nurture',          names: ['nurture-day3', 'nurture-day7', 'nurture-day14', 're-engagement'] },
  { title: 'Welcome',          names: ['welcome-1', 'welcome-2', 'welcome-3'] },
  { title: 'Campaigns',        names: ['destination-market-report', 'collection-access', 'viewings-france', 'year-of-weekends'] },
]

const WIDTHS = { phone: 390, inbox: 720 }

export default function EmailPreviews() {
  const [width, setWidth] = useState('inbox')
  const [dark, setDark] = useState(false)
  const [only, setOnly] = useState('')

  const shown = only ? [{ title: only, names: [only] }] : GROUPS

  return (
    <AdminLayout title="Email previews">
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px 80px' }}>
        <p style={{ color: '#555', fontSize: 14, lineHeight: 1.6, margin: '0 0 20px' }}>
          Live renders of every template in <code>emails/</code>, using each one&apos;s own sample
          data. Re-skinned to the site&apos;s black, white and grey on 22 September 2026 — no gold,
          no navy, no cream, and Poppins/Inter in place of Cormorant and Jost. Gmail strips
          webfonts, so what you see in a client that does the same is Helvetica.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', margin: '0 0 28px' }}>
          {Object.keys(WIDTHS).map(k => (
            <button key={k} onClick={() => setWidth(k)}
              style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer',
                border: '1px solid ' + (width === k ? '#111' : '#ddd'),
                background: width === k ? '#111' : '#fff', color: width === k ? '#fff' : '#111' }}>
              {k === 'phone' ? 'Phone 390px' : 'Inbox 720px'}
            </button>
          ))}
          <button onClick={() => setDark(d => !d)}
            style={{ padding: '8px 14px', fontSize: 13, cursor: 'pointer', border: '1px solid #ddd',
              background: dark ? '#111' : '#fff', color: dark ? '#fff' : '#111' }}>
            {dark ? 'Dark surround: on' : 'Dark surround: off'}
          </button>
          <select value={only} onChange={e => setOnly(e.target.value)}
            style={{ padding: '8px 10px', fontSize: 13, border: '1px solid #ddd' }}>
            <option value="">All templates</option>
            {TEMPLATES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {shown.map(group => (
          <section key={group.title} style={{ margin: '0 0 48px' }}>
            <h2 style={{ fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase',
              color: '#6b6b6b', fontWeight: 600, margin: '0 0 16px' }}>{group.title}</h2>
            {group.names.map(name => (
              <div key={name} style={{ margin: '0 0 28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  borderBottom: '1px solid #eee', padding: '0 0 8px', margin: '0 0 12px' }}>
                  <strong style={{ fontSize: 15 }}>{name}</strong>
                  <a href={`/api/admin/ui/email-preview?name=${encodeURIComponent(name)}`}
                    target="_blank" rel="noreferrer"
                    style={{ fontSize: 12, color: '#111' }}>Open on its own →</a>
                </div>
                <div style={{ background: dark ? '#1b1b1b' : '#f5f5f5', padding: 18, overflowX: 'auto' }}>
                  <iframe
                    title={name}
                    src={`/api/admin/ui/email-preview?name=${encodeURIComponent(name)}`}
                    sandbox=""
                    loading="lazy"
                    style={{ width: WIDTHS[width], height: 900, border: '1px solid #e0e0e0',
                      background: '#fff', display: 'block', margin: '0 auto' }}
                  />
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </AdminLayout>
  )
}
