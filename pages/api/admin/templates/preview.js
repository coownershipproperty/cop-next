import { requireCrmAdmin } from '@/lib/adminAuth'
import { renderTemplate } from '@/lib/email/templateStore'

// Renders unsaved edits exactly the way the sending code will render them —
// same function, same shell — so the preview is the email, not an impression
// of it.
export default async function handler(req, res) {
  const admin = await requireCrmAdmin(req, res)
  if (!admin) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const b = req.body || {}
  try {
    const out = renderTemplate({
      moment: b.moment, locale: b.locale || 'en',
      subject: b.subject || '', preheader: b.preheader || null,
      blocks: Array.isArray(b.blocks) ? b.blocks : [],
      design: b.design || {},
      from_name: b.from_name, from_email: b.from_email, reply_to: b.reply_to,
    }, b.data || {})
    return res.json(out)
  } catch (e) {
    return res.status(400).json({ error: e.message })
  }
}
