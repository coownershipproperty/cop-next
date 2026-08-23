import { requirePartnerHubAccess } from '@/lib/partnerHubAuth';
import {
  cleanPartnerHubText,
  isPartnerHubEmail,
  serialisePartnerHubLead,
} from '@/lib/partnerHub';
import { notifyPartnerOfLead } from '@/lib/partnerHubNotifications';

async function partnerDirectory(db, partnerIds) {
  const ids = [...new Set(partnerIds.filter(Boolean))];
  if (!ids.length) return new Map();
  const { data, error } = await db.from('partner_hub_partners').select('*').in('id', ids);
  if (error) throw new Error(error.message);
  return new Map((data || []).map((row) => [row.id, row]));
}
export default async function handler(req, res) {
  const access = await requirePartnerHubAccess(req, res);
  if (!access) return;

  if (req.method === 'GET') {
    let query = access.db.from('partner_hub_leads').select('*').order('updated_at', { ascending: false }).limit(500);
    if (access.role === 'partner') {
      query = query.eq('partner_id', access.partnerId);
    } else if (req.query.partnerId) {
      query = query.eq('partner_id', cleanPartnerHubText(req.query.partnerId, 64));
    }
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: 'Could not load Partner Hub leads' });

    const partners = await partnerDirectory(access.db, (data || []).map((lead) => lead.partner_id));
    return res.json({
      leads: (data || []).map((lead) => serialisePartnerHubLead(lead, partners.get(lead.partner_id)?.display_name)),
    });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (access.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });

  const body = req.body || {};
  const partnerId = cleanPartnerHubText(body.partnerId, 64);
  const firstName = cleanPartnerHubText(body.firstName, 120);
  const lastName = cleanPartnerHubText(body.lastName, 120);
  const email = cleanPartnerHubText(body.email, 254).toLowerCase();
  if (!partnerId || !firstName || !lastName || !isPartnerHubEmail(email)) {
    return res.status(400).json({ error: 'Partner, name and a valid email are required' });
  }
  if (body.consentConfirmed !== true) {
    return res.status(400).json({ error: 'Customer sharing consent must be confirmed' });
  }

  const { data: partner, error: partnerError } = await access.db
    .from('partner_hub_partners')
    .select('*')
    .eq('id', partnerId)
    .eq('active', true)
    .maybeSingle();
  if (partnerError) return res.status(500).json({ error: partnerError.message });
  if (!partner) return res.status(404).json({ error: 'Active partner not found' });

  const now = new Date().toISOString();
  const insert = {
    partner_id: partnerId,
    first_name: firstName,
    last_name: lastName,
    email,
    phone: cleanPartnerHubText(body.phone, 60) || null,
    nationality: cleanPartnerHubText(body.nationality, 120) || null,
    destination: cleanPartnerHubText(body.destination, 500) || null,
    collection_type: cleanPartnerHubText(body.collectionType, 240) || null,
    budget_display: cleanPartnerHubText(body.budget, 120) || null,
    preferences: cleanPartnerHubText(body.preferences, 4000) || null,
    status: 'New',
    consent_confirmed_at: now,
    created_by: access.user.id,
    created_by_email: access.email,
    is_test: body.isTest === true,
  };
  const { data: lead, error } = await access.db
    .from('partner_hub_leads')
    .insert(insert)
    .select('*')
    .single();
  if (error) return res.status(500).json({ error: error.message });

  await access.db.from('partner_hub_events').insert({
    lead_id: lead.id,
    partner_id: lead.partner_id,
    actor_user_id: access.user.id,
    actor_email: access.email,
    actor_role: 'admin',
    event_type: 'lead_created',
    to_stage: 'New',
    metadata: { consent_confirmed: true, synthetic: lead.is_test },
  });

  let notification = { status: 'not_requested' };
  if (body.notifyPartner !== false) {
    try {
      notification = await notifyPartnerOfLead({ db: access.db, partner, lead });
    } catch (notificationError) {
      notification = { status: 'failed', error: 'Lead saved, but the email provider did not accept the notification' };
    }
  }

  return res.status(201).json({
    ok: true,
    lead: serialisePartnerHubLead(lead, partner.display_name),
    notification,
  });
}
