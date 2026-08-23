import { findAccessibleLead, requirePartnerHubAccess } from '@/lib/partnerHubAuth';
import {
  PARTNER_HUB_STAGES,
  cleanPartnerHubText,
  isPartnerHubEmail,
  serialisePartnerHubLead,
} from '@/lib/partnerHub';
import { notifyAdminOfPartnerUpdate, notifyPartnerOfLead } from '@/lib/partnerHubNotifications';

async function loadPartner(db, id) {
  const { data, error } = await db.from('partner_hub_partners').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}

async function addNote(access, lead, body) {
  const { data, error } = await access.db
    .from('partner_hub_notes')
    .insert({
      lead_id: lead.id,
      partner_id: lead.partner_id,
      author_user_id: access.user.id,
      author_email: access.email,
      author_role: access.role,
      body,
    })
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export default async function handler(req, res) {
  const access = await requirePartnerHubAccess(req, res);
  if (!access) return;
  const leadId = cleanPartnerHubText(req.query.id, 80);
  const lead = await findAccessibleLead(access, leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const partner = await loadPartner(access.db, lead.partner_id);
  if (!partner) return res.status(404).json({ error: 'Partner not found' });

  if (req.method === 'GET') {
    const [{ data: notes, error: notesError }, { data: events, error: eventsError }] = await Promise.all([
      access.db.from('partner_hub_notes').select('*').eq('lead_id', lead.id).order('created_at', { ascending: true }),
      access.db.from('partner_hub_events').select('*').eq('lead_id', lead.id).order('created_at', { ascending: true }),
    ]);
    if (notesError || eventsError) return res.status(500).json({ error: 'Could not load lead history' });
    return res.json({
      lead: serialisePartnerHubLead(lead, partner.display_name),
      notes: notes || [],
      events: events || [],
    });
  }

  if (req.method === 'DELETE') {
    if (access.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });
    const { error } = await access.db.from('partner_hub_leads').delete().eq('id', lead.id);
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ ok: true });
  }

  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
  const action = cleanPartnerHubText(req.body?.action, 30);
  const noteBody = cleanPartnerHubText(req.body?.note, 4000);
  const now = new Date().toISOString();

  if (action === 'stage') {
    if (access.role !== 'partner') return res.status(403).json({ error: 'Only the assigned partner can change the pipeline stage' });
    const nextStage = cleanPartnerHubText(req.body?.stage, 60);
    if (!PARTNER_HUB_STAGES.includes(nextStage)) return res.status(400).json({ error: 'Unknown pipeline stage' });
    if (nextStage === lead.status) return res.status(400).json({ error: 'Choose a new stage, or save the text as a progress note' });

    const { data: updated, error } = await access.db
      .from('partner_hub_leads')
      .update({ status: nextStage, status_updated_at: now, updated_at: now })
      .eq('id', lead.id)
      .eq('partner_id', access.partnerId)
      .select('*')
      .maybeSingle();
    if (error) return res.status(500).json({ error: error.message });
    if (!updated) return res.status(404).json({ error: 'Lead not found' });

    const note = noteBody ? await addNote(access, updated, noteBody) : null;
    await access.db.from('partner_hub_events').insert({
      lead_id: updated.id,
      partner_id: updated.partner_id,
      actor_user_id: access.user.id,
      actor_email: access.email,
      actor_role: 'partner',
      event_type: 'stage_changed',
      from_stage: lead.status,
      to_stage: nextStage,
      note_id: note?.id || null,
    });

    let notification;
    try {
      notification = await notifyAdminOfPartnerUpdate({ db: access.db, partner, lead: updated, stage: nextStage, note: noteBody });
    } catch {
      notification = { status: 'failed', error: 'Stage saved, but COP email notification failed' };
    }
    return res.json({
      ok: true,
      lead: serialisePartnerHubLead(updated, partner.display_name),
      notification,
    });
  }

  if (action === 'note') {
    if (!noteBody) return res.status(400).json({ error: 'Progress note is required' });
    const note = await addNote(access, lead, noteBody);
    await access.db.from('partner_hub_leads').update({ updated_at: now }).eq('id', lead.id);
    await access.db.from('partner_hub_events').insert({
      lead_id: lead.id,
      partner_id: lead.partner_id,
      actor_user_id: access.user.id,
      actor_email: access.email,
      actor_role: access.role,
      event_type: 'note_added',
      note_id: note.id,
    });

    let notification;
    try {
      notification = access.role === 'partner'
        ? await notifyAdminOfPartnerUpdate({ db: access.db, partner, lead, note: noteBody })
        : await notifyPartnerOfLead({ db: access.db, partner, lead, eventType: 'partner_note', note: noteBody });
    } catch {
      notification = { status: 'failed', error: 'Note saved, but email notification failed' };
    }
    return res.json({ ok: true, note, notification });
  }

  if (action === 'edit') {
    if (access.role !== 'admin') return res.status(403).json({ error: 'Administrator access required' });
    const fields = req.body?.fields || {};
    const email = cleanPartnerHubText(fields.email ?? lead.email, 254).toLowerCase();
    if (!isPartnerHubEmail(email)) return res.status(400).json({ error: 'A valid email is required' });
    const patch = {
      first_name: cleanPartnerHubText(fields.firstName ?? lead.first_name, 120),
      last_name: cleanPartnerHubText(fields.lastName ?? lead.last_name, 120),
      email,
      phone: cleanPartnerHubText(fields.phone ?? lead.phone, 60) || null,
      nationality: cleanPartnerHubText(fields.nationality ?? lead.nationality, 120) || null,
      destination: cleanPartnerHubText(fields.destination ?? lead.destination, 500) || null,
      collection_type: cleanPartnerHubText(fields.collectionType ?? lead.collection_type, 240) || null,
      budget_display: cleanPartnerHubText(fields.budget ?? lead.budget_display, 120) || null,
      preferences: cleanPartnerHubText(fields.preferences ?? lead.preferences, 4000) || null,
      updated_at: now,
    };
    const { data: updated, error } = await access.db
      .from('partner_hub_leads')
      .update(patch)
      .eq('id', lead.id)
      .select('*')
      .single();
    if (error) return res.status(500).json({ error: error.message });
    await access.db.from('partner_hub_events').insert({
      lead_id: lead.id,
      partner_id: lead.partner_id,
      actor_user_id: access.user.id,
      actor_email: access.email,
      actor_role: 'admin',
      event_type: 'lead_updated',
    });
    return res.json({ ok: true, lead: serialisePartnerHubLead(updated, partner.display_name) });
  }

  return res.status(400).json({ error: 'Unknown action' });
}
