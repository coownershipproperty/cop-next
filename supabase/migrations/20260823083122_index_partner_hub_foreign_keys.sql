create index partner_hub_memberships_invited_by_idx
  on public.partner_hub_memberships (invited_by)
  where invited_by is not null;

create index partner_hub_leads_created_by_idx
  on public.partner_hub_leads (created_by)
  where created_by is not null;

create index partner_hub_notes_author_user_id_idx
  on public.partner_hub_notes (author_user_id)
  where author_user_id is not null;

create index partner_hub_notes_lead_partner_idx
  on public.partner_hub_notes (lead_id, partner_id);

create index partner_hub_events_actor_user_id_idx
  on public.partner_hub_events (actor_user_id)
  where actor_user_id is not null;

create index partner_hub_events_lead_partner_idx
  on public.partner_hub_events (lead_id, partner_id);

create index partner_hub_events_note_id_idx
  on public.partner_hub_events (note_id)
  where note_id is not null;

create index partner_hub_notifications_lead_partner_idx
  on public.partner_hub_notifications (lead_id, partner_id);
