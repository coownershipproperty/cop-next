import { requireCrmAdmin } from '@/lib/adminAuth'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { t } from '@/lib/i18n'

/**
 * The wording a copy-only template is using RIGHT NOW, per field.
 *
 * For each field the moment declares, returns the bundled translation for the
 * requested locale. The studio shows these as the starting values, so an
 * untouched field displays what actually sends rather than an empty box, and
 * only genuinely changed fields are ever stored as overrides.
 */
export default async function handler(req, res) {
  const admin = await requireCrmAdmin(req, res)
  if (!admin) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const moment = String(req.query.moment || '').trim()
  const locale = String(req.query.locale || 'en').trim()
  if (!moment) return res.status(400).json({ error: 'moment is required.' })

  const db = createSupabaseAdminClient()
  const { data: row, error } = await db
    .from('template_moments').select('fields,kind').eq('key', moment).maybeSingle()
  if (error) return res.status(500).json({ error: 'Could not load the moment.' })
  if (!row) return res.status(404).json({ error: 'Unknown moment.' })

  // t() returns the key itself when a translation is missing.
  const lookup = (key) => {
    if (!key) return ''
    const value = t(`emails.${key}`, locale)
    return value === `emails.${key}` ? '' : value
  }

  const defaults = {}
  for (const f of Array.isArray(row.fields) ? row.fields : []) {
    if (!f || !f.key) continue
    // A field may have its own key that does not exist in the bundles yet and
    // falls back to a shared line — show what the email actually renders.
    defaults[f.key] = lookup(f.key) || lookup(f.fallbackKey)
  }

  return res.json({ kind: row.kind, fields: row.fields || [], defaults })
}
