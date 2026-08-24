import { requirePartnerHubAccess } from '@/lib/partnerHubAuth';
import {
  cleanPartnerHubText,
  isPartnerHubEmail,
  serialisePartnerHubPartner,
} from '@/lib/partnerHub';
import { notifyPartnerOfLead } from '@/lib/partnerHubNotifications';

async function getPartner(db, id) {
  const { data, error } = await db.from('partner_hub_partners').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

export default async function handler(req, res) {
  const access = await requirePartnerHubAccess(req, res);
  if (!access) return;

  if (req.method === 'GET') {
    let query = access.db.from('partner_hub_partners').select('*').order('display_name');
    if (access.role === 'partner') query = query.eq('id', access.partnerId).eq('active', true);
    const { data, error } = await query;
    if (error) return res.status(500).json({ error: 'Could not load partners' });
    return res.json({ partners: (data || []).map(serialisePartnerHubPartner) });
  }

  if (access.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });

  if (req.method === 'PATCH') {
    const { id, notificationName, email, phone, testRouting, active } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Partner id is required' });
    const cleanEmail = cleanPartnerHubText(email, 254).toLowerCase();
    if (cleanEmail && !isPartnerHubEmail(cleanEmail)) {
      return res.status(400).json({ error: 'A valid notification email is required' });
    }

    const patch = {
      notification_name: cleanPartnerHubText(notificationName, 240) || null,
      notification_email: cleanEmail || null,
      notification_phone: cleanPartnerHubText(phone, 60) || null,
      test_routing: testRouting !== false,
      updated_at: new Date().toISOString(),
    };
    if (typeof active === 'boolean') patch.active = active;

    const { data, error } = await access.db
      .from('partner_hub_partners')
      .update(patch)
      .eq('id', id)
      .select('*')
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'Partner not found' });
    if (active === false) {
      const { error: revokeError } = await access.db
        .from('partner_hub_memberships')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('partner_id', id)
        .eq('active', true);
      if (revokeError) return res.status(500).json({ error: 'Partner saved, but member access could not be revoked' });
    }
    return res.json({ ok: true, partner: serialisePartnerHubPartner(data) });
  }

  if (req.method === 'POST') {
    const { action, partnerId } = req.body || {};
    if (action !== 'test_notification') return res.status(400).json({ error: 'Unknown action' });
    const partner = await getPartner(access.db, partnerId);
    if (!partner) return res.status(404).json({ error: 'Partner not found' });
    if (!partner.test_routing) return res.status(400).json({ error: 'Internal review routing must be active' });

    const { data: lead, error } = await access.db
      .from('partner_hub_leads')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!lead) return res.status(400).json({ error: 'Add a lead before checking notifications' });

    try {
      const delivery = await notifyPartnerOfLead({ db: access.db, partner, lead, eventType: 'test' });
      return res.json({ ok: true, delivery });
    } catch (error) {
      return res.status(502).json({ error: 'The review notification was not accepted by the email provider' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
