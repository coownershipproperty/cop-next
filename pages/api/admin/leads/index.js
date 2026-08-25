import { requireCrmAdmin } from '@/lib/adminAuth'
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin'

function text(value, max = 500) {
  return String(value ?? '').trim().slice(0, max) || null
}

function nullableMoney(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : NaN
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const admin = await requireCrmAdmin(req, res)
  if (!admin) return

  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' })
  }

  const budgetMin = nullableMoney(req.body?.budgetMin)
  const budgetMax = nullableMoney(req.body?.budgetMax)
  if (Number.isNaN(budgetMin) || Number.isNaN(budgetMax)) {
    return res.status(400).json({ error: 'Budget values must be valid positive numbers.' })
  }
  if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) {
    return res.status(400).json({ error: 'Minimum budget cannot exceed maximum budget.' })
  }

  const db = createSupabaseAdminClient()
  const now = new Date().toISOString()
  const leadSource = text(req.body?.leadSource, 120) || 'Manual entry'
  const { data: existingContact, error: findError } = await db.from('contacts')
    .select('id,email,first_name,last_name,phone,nationality,source')
    .eq('email', email)
    .maybeSingle()
  if (findError) return res.status(500).json({ error: 'Could not check the contact.' })

  let contact = existingContact
  let createdContact = false
  const suppliedContact = {
    first_name: text(req.body?.firstName, 120),
    last_name: text(req.body?.lastName, 120),
    phone: text(req.body?.phone, 60),
    nationality: text(req.body?.nationality, 120),
    source: leadSource,
    updated_at: now,
  }

  if (contact) {
    const patch = Object.fromEntries(Object.entries(suppliedContact).filter(([key, value]) => key === 'updated_at' || value !== null))
    const { data, error } = await db.from('contacts').update(patch).eq('id', contact.id).select().single()
    if (error) return res.status(500).json({ error: 'Could not update the existing contact.' })
    contact = data
  } else {
    const { data, error } = await db.from('contacts').insert({
      email,
      ...suppliedContact,
      created_at: now,
    }).select().single()
    if (error) return res.status(500).json({ error: 'Could not create the contact.' })
    contact = data
    createdContact = true
  }

  let property = null
  const propertySlug = text(req.body?.propertySlug, 300)
  if (propertySlug) {
    const { data, error } = await db.from('properties')
      .select('slug,title,city,region,country,partner,price')
      .eq('slug', propertySlug)
      .maybeSingle()
    if (error || !data) {
      if (createdContact) await db.from('contacts').delete().eq('id', contact.id)
      return res.status(400).json({ error: 'The selected COP listing could not be found.' })
    }
    property = data
  }

  const { data: lead, error: leadError } = await db.rpc('merge_or_create_contact_lead', {
    p_contact_id: contact.id,
    p_property_slug: property?.slug || null,
    p_property_title: property?.title || null,
    p_main_region: text(req.body?.mainRegion, 160) || property?.region || null,
    p_subregion: text(req.body?.subregion, 160) || property?.city || null,
    p_partner: property?.partner || null,
    p_message: text(req.body?.message, 4000),
    p_budget_min: budgetMin,
    p_budget_max: budgetMax,
    p_first_visit_at: null,
    p_landing_url: null,
    p_referrer_url: null,
    p_attribution_source: leadSource,
    p_enquiry_page_url: null,
  }).single()

  if (leadError) {
    if (createdContact) await db.from('contacts').delete().eq('id', contact.id)
    return res.status(500).json({ error: 'Could not create the lead.' })
  }

  await db.from('activities').insert({
    contact_id: contact.id,
    lead_id: lead.id,
    type: 'lead_created',
    description: `Lead created manually by ${admin.email}`,
    metadata: { source: 'cop_admin', lead_source: leadSource, property_slug: property?.slug || null },
  })

  return res.status(201).json({ ok: true, leadId: lead.id, reusedContact: Boolean(existingContact) })
}
