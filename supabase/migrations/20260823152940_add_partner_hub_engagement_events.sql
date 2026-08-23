alter table public.partner_hub_events
  drop constraint if exists partner_hub_events_type;

alter table public.partner_hub_events
  add constraint partner_hub_events_type
  check (
    event_type in (
      'lead_created',
      'lead_viewed',
      'help_requested',
      'shortlist_updated',
      'note_added',
      'stage_changed',
      'lead_updated',
      'notification_sent',
      'notification_failed'
    )
  );

create unique index if not exists partner_hub_events_first_partner_view
  on public.partner_hub_events (lead_id, actor_user_id, event_type)
  where event_type = 'lead_viewed' and actor_user_id is not null;

create table public.partner_hub_shortlist_items (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  partner_id text not null,
  property_slug text not null,
  property_title text not null,
  property_url text not null,
  property_image text,
  property_location text,
  property_price numeric,
  property_currency text,
  created_by uuid references auth.users(id) on delete set null,
  created_by_email text,
  created_at timestamptz not null default now(),
  constraint partner_hub_shortlist_lead_partner_fkey
    foreign key (lead_id, partner_id)
    references public.partner_hub_leads(id, partner_id)
    on delete cascade,
  constraint partner_hub_shortlist_unique_property
    unique (lead_id, property_slug)
);

create index partner_hub_shortlist_partner_id_idx
  on public.partner_hub_shortlist_items (partner_id);

revoke all on table public.partner_hub_shortlist_items from public, anon, authenticated;
grant select on table public.partner_hub_shortlist_items to authenticated;
grant all on table public.partner_hub_shortlist_items to service_role;

alter table public.partner_hub_shortlist_items enable row level security;
alter table public.partner_hub_shortlist_items force row level security;

create policy "Partner user reads own lead shortlist"
on public.partner_hub_shortlist_items
for select
to authenticated
using (
  partner_id in (
    select m.partner_id
    from public.partner_hub_memberships m
    where m.user_id = (select auth.uid())
      and m.active
  )
);

create policy "COP admins read all lead shortlists"
on public.partner_hub_shortlist_items
for select
to authenticated
using (
  exists (
    select 1
    from public.crm_admins a
    where a.active
      and a.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
);
