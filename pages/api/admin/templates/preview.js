import React from 'react'
import { render } from '@react-email/components'
import { requireCrmAdmin } from '@/lib/adminAuth'
import { renderTemplate } from '@/lib/email/templateStore'
import { t } from '@/lib/i18n'
import FloorPlanEmail from '@/emails/floor-plan'

// Copy-only moments render through their real React component, so the preview
// is the email itself rather than an approximation of it.
const COMPONENTS = {
  gallery_delivery: {
    component: FloorPlanEmail,
    subjectKeys: { withCity: 'floor_plan.subject', fallback: 'floor_plan.subject_prefix' },
    sampleProps: {
      firstName: 'Gloria',
      propertyTitle: 'Rosemary Beach, Florida, USA — 6-Bed House',
      propertyUrl: 'https://co-ownership-property.com/homes/rosemary-beach',
      driveUrl: 'https://co-ownership-property.com/gallery/rosemary-beach',
      similarProperties: [
        { title: 'Marbella, Spain — 4-Bed Villa', price: '€189,000', beds: 4, size: 240, slug: 'marbella-villa' },
        { title: 'Megève, France — 5-Bed Chalet', price: '€245,000', beds: 5, size: 310, slug: 'megeve-chalet' },
      ],
    },
  },
}

export default async function handler(req, res) {
  const admin = await requireCrmAdmin(req, res)
  if (!admin) return
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const b = req.body || {}
  const locale = b.locale || 'en'

  try {
    if (b.kind === 'strings') {
      const spec = COMPONENTS[b.moment]
      if (!spec) return res.status(400).json({ error: 'No preview is wired up for this template yet.' })

      const copy = b.strings && typeof b.strings === 'object' ? b.strings : {}
      const pick = (key) => {
        const v = copy[key]
        return typeof v === 'string' && v.trim() !== '' ? v : t(`emails.${key}`, locale)
      }

      const city = String(spec.sampleProps.propertyTitle || '').split(',')[0].trim()
      const subject = city
        ? pick(spec.subjectKeys.withCity).replace('{city}', city)
        : `${pick(spec.subjectKeys.fallback)} ${spec.sampleProps.propertyTitle}`.trim()

      const html = await render(
        React.createElement(spec.component, { ...spec.sampleProps, locale, copy })
      )
      return res.json({ subject, html, text: '' })
    }

    const out = renderTemplate({
      moment: b.moment, locale,
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
