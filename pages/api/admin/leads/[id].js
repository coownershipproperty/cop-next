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
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', 'PATCH')
    return res.status(405).json({ error: 'Method not allowed.' })
  }
  const admin = await requireCrmAdmin(req, res)
  if (!admin) return
  const id = String(req.query.id || '').trim()
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return res.status(400).json({ error: 'Invalid lead.' })
  }

  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' })
  const budgetMin = nullableMoney(req.body?.budgetMin)
  const budgetMax = nullableMoney(req.body?.budgetMax)
  if (Number.isNaN(budgetMin) || Number.isNaN(budgetMax)) return res.status(400).json({ error: 'Budget values must be valid positive numbers.' })
  if (budgetMin !== null && budgetMax !== null && budgetMin > budgetMax) return res.status(400).json({ error: 'Minimum budget cannot exceed maximum budget.' })

  const db = createSupabaseAdminClient()
  const { data: currentLead, error: findError } = await db.from('leads')
    .select('id,contact_id,main_region,subregion,budget_min,budget_max,message,contacts(id,first_name,last_name,email,phone,nationality,residence_city,residence_country)')
    .eq('id', id).maybeSingle()
  if (findError) return res.status(500).json({ error: 'Could not load the lead.' })
  if (!currentLead) return res.status(404).json({ error: 'Lead not found.' })

  const currentContact = Array.isArray(currentLead.contacts) ? currentLead.contacts[0] : currentLead.contacts
  const now = new Date().toISOString()
  const contactPatch = {
    first_name: text(req.body?.firstName, 120),
    last_name: text(req.body?.lastName, 120),
    email,
    phone: text(req.body?.phone, 60),
    nationality: text(req.body?.nationality, 120),
    residence_city: text(req.body?.residenceCity, 120),
    residence_country: text(req.body?.residenceCountry, 120),
    updated_at: now,
  }
  const leadPatch = {
    main_region: text(req.body?.mainRegion, 160),
    subregion: text(req.body?.subregion, 160),
    budget_min: budgetMin,
    budget_max: budgetMax,
    message: text(req.body?.message, 4000),
    updated_at: now,
  }

  const { error: contactError } = await db.from('contacts').update(contactPatch).eq('id', currentLead.contact_id)
  if (contactError) return res.status(500).json({ error: 'Could not update the contact details.' })
  const { error: leadError } = await db.from('leads').update(leadPatch).eq('id', id)
  if (leadError) {
    if (currentContact) await db.from('contacts').update({
      first_name: currentContact.first_name, last_name: currentContact.last_name, email: currentContact.email,
      phone: currentContact.phone, nationality: currentContact.nationality, residence_city: currentContact.residence_city,
      residence_country: currentContact.residence_country, updated_at: now,
    }).eq('id', currentLead.contact_id)
    return res.status(500).json({ error: 'Could not update the lead details.' })
  }

  await db.from('activities').insert({
    contact_id: currentLead.contact_id,
    lead_id: id,
    type: 'lead_edited',
    description: `Lead details edited by ${admin.email}`,
    metadata: { source: 'cop_admin' },
  })
  return res.json({ ok: true })
}
