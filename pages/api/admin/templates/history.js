import { requireCrmAdmin } from '@/lib/adminAuth'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'

export default async function handler(req, res) {
  const admin = await requireCrmAdmin(req, res)
  if (!admin) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const moment = String(req.query.moment || '').trim()
  const locale = String(req.query.locale || 'en').trim()
  if (!moment) return res.status(400).json({ error: 'moment is required.' })

  const db = createSupabaseAdminClient()
  const [{ data: versions }, { data: edits }] = await Promise.all([
    db.from('message_templates')
      .select('id,version,active,subject,blocks,design,strings,preheader,notes,updated_at,updated_by')
      .eq('moment', moment).eq('locale', locale).order('version', { ascending: false }),
    db.from('template_edits')
      .select('action,from_version,to_version,edited_by,summary,created_at')
      .eq('moment', moment).eq('locale', locale).order('created_at', { ascending: false }).limit(30),
  ])
  return res.json({ versions: versions || [], edits: edits || [] })
}
