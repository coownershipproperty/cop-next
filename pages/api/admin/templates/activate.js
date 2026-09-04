import { requireCrmAdmin } from '@/lib/adminAuth'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { clearTemplateCache } from '@/lib/email/templateStore'

// Roll back to any earlier version by making it the active one. Nothing is
// deleted, so a rollback can itself be rolled back.
export default async function handler(req, res) {
  const admin = await requireCrmAdmin(req, res)
  if (!admin) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const id = String(req.body?.id || '').trim()
  if (!id) return res.status(400).json({ error: 'id is required.' })

  const db = createSupabaseAdminClient()
  const { data: target, error: tErr } = await db.from('message_templates')
    .select('id,moment,locale,channel,version,active').eq('id', id).maybeSingle()
  if (tErr || !target) return res.status(404).json({ error: 'That version no longer exists.' })
  if (target.active) return res.json({ ok: true, alreadyActive: true })

  const { data: current } = await db.from('message_templates')
    .select('id,version').eq('moment', target.moment).eq('locale', target.locale)
    .eq('channel', target.channel).eq('active', true).maybeSingle()

  if (current) {
    const { error } = await db.from('message_templates').update({ active: false }).eq('id', current.id)
    if (error) return res.status(500).json({ error: 'Could not switch versions.' })
  }

  const { error } = await db.from('message_templates')
    .update({ active: true, updated_by: admin.email, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) {
    if (current) await db.from('message_templates').update({ active: true }).eq('id', current.id)
    return res.status(500).json({ error: 'Could not switch versions. Nothing changed.' })
  }

  await db.from('template_edits').insert({
    template_id: id, moment: target.moment, locale: target.locale,
    from_version: current?.version || null, to_version: target.version,
    action: 'revert', edited_by: admin.email,
    summary: `Rolled back to v${target.version}`,
  })

  clearTemplateCache()
  return res.json({ ok: true })
}
