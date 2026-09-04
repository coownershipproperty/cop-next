import { requireCrmAdmin } from '@/lib/adminAuth'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { clearTemplateCache } from '@/lib/email/templateStore'

const ROW = 'id,moment,locale,channel,kind,version,tier,active,label,subject,preheader,blocks,design,strings,from_name,from_email,reply_to,notes,sent_count,edit_count,updated_at,updated_by'

export default async function handler(req, res) {
  const admin = await requireCrmAdmin(req, res)
  if (!admin) return

  const db = createSupabaseAdminClient()

  if (req.method === 'GET') {
    const [{ data: moments, error: mErr }, { data: templates, error: tErr }] = await Promise.all([
      db.from('template_moments').select('*').order('sort_order'),
      db.from('message_templates').select(ROW).order('moment').order('locale').order('version', { ascending: false }),
    ])
    if (mErr || tErr) return res.status(500).json({ error: 'Could not load templates.' })
    return res.json({ moments: moments || [], templates: templates || [] })
  }

  // Saving never overwrites. It writes the next version and makes it the active
  // one, so every previous wording stays recoverable from the version list.
  if (req.method === 'POST') {
    const b = req.body || {}
    const moment = String(b.moment || '').trim()
    const locale = String(b.locale || 'en').trim()
    const channel = String(b.channel || 'email').trim()
    if (!moment || !locale) return res.status(400).json({ error: 'moment and locale are required.' })
    const kind = b.kind === 'strings' ? 'strings' : 'blocks'
    if (kind === 'blocks') {
      if (!Array.isArray(b.blocks) || !b.blocks.length) return res.status(400).json({ error: 'A template needs at least one block.' })
      if (!String(b.subject || '').trim()) return res.status(400).json({ error: 'A subject line is required.' })
    }

    const { data: prev } = await db.from('message_templates')
      .select('id,version,edit_count').eq('moment', moment).eq('locale', locale).eq('channel', channel)
      .order('version', { ascending: false }).limit(1).maybeSingle()

    const nextVersion = (prev?.version || 0) + 1

    // Deactivate first: the partial unique index allows only one active row.
    if (prev) {
      const { error } = await db.from('message_templates')
        .update({ active: false }).eq('moment', moment).eq('locale', locale).eq('channel', channel).eq('active', true)
      if (error) return res.status(500).json({ error: 'Could not retire the previous version.' })
    }

    const { data: row, error } = await db.from('message_templates').insert({
      moment, locale, channel,
      kind,
      version:    nextVersion,
      tier:       b.tier || 'B',
      active:     true,
      label:      b.label || null,
      subject:    b.subject ? String(b.subject).trim() : null,
      preheader:  b.preheader ? String(b.preheader).trim() : null,
      blocks:     Array.isArray(b.blocks) ? b.blocks : [],
      strings:    b.strings && typeof b.strings === 'object' ? b.strings : {},
      design:     b.design || {},
      from_name:  b.from_name || null,
      from_email: b.from_email || null,
      reply_to:   b.reply_to || null,
      notes:      b.notes || null,
      edit_count: (prev?.edit_count || 0) + 1,
      updated_by: admin.email,
      updated_at: new Date().toISOString(),
    }).select(ROW).single()

    if (error) {
      // Put the old version back rather than leaving the moment with nothing active.
      if (prev) await db.from('message_templates').update({ active: true }).eq('id', prev.id)
      return res.status(500).json({ error: 'Could not save. The previous version is still live.' })
    }

    await db.from('template_edits').insert({
      template_id: row.id, moment, locale,
      from_version: prev?.version || null, to_version: nextVersion,
      action: prev ? 'edit' : 'create', edited_by: admin.email,
      summary: b.summary || null,
    })

    clearTemplateCache()
    return res.json({ template: row })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
