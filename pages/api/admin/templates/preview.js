import React from 'react'
import { render } from '@react-email/components'
import { requireCrmAdmin } from '@/lib/adminAuth'
import { renderTemplate } from '@/lib/email/templateStore'
import { t } from '@/lib/i18n'
import FloorPlanEmail from '@/emails/floor-plan'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'
import { getSimilarProperties, toSimilarCard } from '@/lib/email/similarProperties'

// Copy-only moments render through their real React component, so the preview
// is the email itself rather than an approximation of it.
const COMPONENTS = {
  gallery_delivery: {
    component: FloorPlanEmail,
    subjectKeys: { withCity: 'floor_plan.subject', fallback: 'floor_plan.subject_prefix' },
  },
}

const SITE = 'https://co-ownership-property.com'

/**
 * Build the preview from a REAL listing rather than invented sample data.
 *
 * The point of this preview is to show what actually lands in someone's inbox,
 * and a made-up property has no photo and no genuinely similar homes — which
 * made the hero image and the whole "You may also like" row look broken here
 * while being fine in the real send. So: pick a live listing, and run the same
 * similar-properties matcher the email itself uses.
 */
async function realSampleProps() {
  const fallback = {
    firstName: 'Gloria',
    propertyTitle: 'Rosemary Beach, Florida, USA — 6-Bed House',
    propertyUrl: `${SITE}/homes/rosemary-beach`,
    driveUrl: `${SITE}/gallery/rosemary-beach`,
    similarProperties: [],
  }

  try {
    const db = createSupabaseAdminClient()
    const { data: prop } = await db
      .from('properties')
      .select('slug, title, img, price, currency, beds, size, city, region, country')
      .in('status', ['Live', 'for_sale'])
      .not('img', 'is', null)
      .order('date_added', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!prop) return fallback

    const similar = await getSimilarProperties(db, {
      slug: prop.slug, country: prop.country, city: prop.city,
      region: prop.region, price: prop.price, beds: prop.beds,
    })

    return {
      firstName: 'Gloria',
      propertyTitle: prop.title,
      propertyImg: prop.img || undefined,
      propertyUrl: `${SITE}/property/${prop.slug}/`,
      driveUrl: `${SITE}/gallery/${prop.slug}`,
      similarProperties: similar.map(toSimilarCard),
    }
  } catch (e) {
    console.error('[templates/preview] real sample lookup failed:', e.message)
    return fallback
  }
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

      const sampleProps = await realSampleProps()
      const city = String(sampleProps.propertyTitle || '').split(',')[0].trim()
      const subject = city
        ? pick(spec.subjectKeys.withCity).replace('{city}', city)
        : `${pick(spec.subjectKeys.fallback)} ${sampleProps.propertyTitle}`.trim()

      const html = await render(
        React.createElement(spec.component, { ...sampleProps, locale, copy })
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
