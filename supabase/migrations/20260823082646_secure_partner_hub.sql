-- Secure, persistent COP Partner Hub.
--
-- The existing public.partner_referrals table remains the admin qualification
-- queue for website enquiries. These tables hold leads that COP has explicitly
-- assigned to a partner and expose only tenant-scoped SELECT access to signed-in
-- partner users. All writes go through authenticated server API routes so stage
-- changes, notes, email delivery, and audit events stay attributable.

create table public.partner_hub_partners (
  id text primary key,
  display_name text not null,
  notification_name text,
  notification_email text,
  notification_phone text,
  test_routing boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_hub_partners_id_format
    check (id ~ '^[A-Za-z0-9][A-Za-z0-9-]{0,63}$'),
  constraint partner_hub_partners_notification_email_length
    check (notification_email is null or char_length(notification_email) <= 254)
);

create table public.partner_hub_memberships (
  id uuid primary key default gen_random_uuid(),
  partner_id text not null references public.partner_hub_partners(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  access_level text not null default 'member',
  active boolean not null default true,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_hub_memberships_one_partner_per_user unique (user_id),
  constraint partner_hub_memberships_access_level
    check (access_level in ('member', 'manager'))
);

create index partner_hub_memberships_partner_id_idx
  on public.partner_hub_memberships (partner_id);

create table public.partner_hub_leads (
  id uuid primary key default gen_random_uuid(),
  source_ref text unique,
  partner_id text not null references public.partner_hub_partners(id) on delete restrict,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  nationality text,
  destination text,
  collection_type text,
  budget_display text,
  preferences text,
  status text not null default 'New',
  status_updated_at timestamptz not null default now(),
  consent_confirmed_at timestamptz not null,
  created_by uuid references auth.users(id) on delete set null,
  created_by_email text,
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partner_hub_leads_identity_length
    check (
      char_length(first_name) between 1 and 120
      and char_length(last_name) between 1 and 120
      and char_length(email) between 3 and 254
    ),
  constraint partner_hub_leads_status
    check (status in ('New', 'Contacted', 'Viewing', 'Reserved', 'Deposit paid', 'Won', 'Lost', 'Paused')),
  constraint partner_hub_leads_id_partner_unique unique (id, partner_id)
);

create index partner_hub_leads_partner_status_updated_idx
  on public.partner_hub_leads (partner_id, status, updated_at desc);

create table public.partner_hub_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  partner_id text not null,
  author_user_id uuid references auth.users(id) on delete set null,
  author_email text,
  author_role text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint partner_hub_notes_lead_partner_fkey
    foreign key (lead_id, partner_id)
    references public.partner_hub_leads(id, partner_id)
    on delete cascade,
  constraint partner_hub_notes_author_role
    check (author_role in ('admin', 'partner')),
  constraint partner_hub_notes_body_length
    check (char_length(body) between 1 and 4000)
);

create index partner_hub_notes_lead_created_idx
  on public.partner_hub_notes (lead_id, created_at desc);

create index partner_hub_notes_partner_id_idx
  on public.partner_hub_notes (partner_id);

create table public.partner_hub_events (
  id bigint generated always as identity primary key,
  lead_id uuid not null,
  partner_id text not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  actor_role text not null,
  event_type text not null,
  from_stage text,
  to_stage text,
  note_id uuid references public.partner_hub_notes(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint partner_hub_events_lead_partner_fkey
    foreign key (lead_id, partner_id)
    references public.partner_hub_leads(id, partner_id)
    on delete cascade,
  constraint partner_hub_events_actor_role
    check (actor_role in ('admin', 'partner', 'system')),
  constraint partner_hub_events_type
    check (event_type in ('lead_created', 'note_added', 'stage_changed', 'lead_updated', 'notification_sent', 'notification_failed'))
);

create index partner_hub_events_lead_created_idx
  on public.partner_hub_events (lead_id, created_at desc);

create index partner_hub_events_partner_id_idx
  on public.partner_hub_events (partner_id);

create table public.partner_hub_notifications (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null,
  partner_id text not null,
  event_type text not null,
  recipient text not null,
  cc text[] not null default '{}',
  provider_id text,
  status text not null,
  error_message text,
  created_at timestamptz not null default now(),
  constraint partner_hub_notifications_lead_partner_fkey
    foreign key (lead_id, partner_id)
    references public.partner_hub_leads(id, partner_id)
    on delete cascade,
  constraint partner_hub_notifications_status
    check (status in ('sent', 'failed', 'skipped'))
);

create index partner_hub_notifications_lead_created_idx
  on public.partner_hub_notifications (lead_id, created_at desc);

create index partner_hub_notifications_partner_id_idx
  on public.partner_hub_notifications (partner_id);

-- Only the exact tables needed by authenticated users are exposed, and only
-- for SELECT. Mutations require the server-side service client plus explicit
-- admin/partner authorization in the API route.
revoke all on table public.partner_hub_partners from public, anon, authenticated;
revoke all on table public.partner_hub_memberships from public, anon, authenticated;
revoke all on table public.partner_hub_leads from public, anon, authenticated;
revoke all on table public.partner_hub_notes from public, anon, authenticated;
revoke all on table public.partner_hub_events from public, anon, authenticated;
revoke all on table public.partner_hub_notifications from public, anon, authenticated;

grant select on table public.partner_hub_partners to authenticated;
grant select on table public.partner_hub_memberships to authenticated;
grant select on table public.partner_hub_leads to authenticated;
grant select on table public.partner_hub_notes to authenticated;
grant select on table public.partner_hub_events to authenticated;
grant select on table public.partner_hub_notifications to authenticated;

grant all on table public.partner_hub_partners to service_role;
grant all on table public.partner_hub_memberships to service_role;
grant all on table public.partner_hub_leads to service_role;
grant all on table public.partner_hub_notes to service_role;
grant all on table public.partner_hub_events to service_role;
grant all on table public.partner_hub_notifications to service_role;
grant usage, select on sequence public.partner_hub_events_id_seq to service_role;

alter table public.partner_hub_partners enable row level security;
alter table public.partner_hub_memberships enable row level security;
alter table public.partner_hub_leads enable row level security;
alter table public.partner_hub_notes enable row level security;
alter table public.partner_hub_events enable row level security;
alter table public.partner_hub_notifications enable row level security;

alter table public.partner_hub_partners force row level security;
alter table public.partner_hub_memberships force row level security;
alter table public.partner_hub_leads force row level security;
alter table public.partner_hub_notes force row level security;
alter table public.partner_hub_events force row level security;
alter table public.partner_hub_notifications force row level security;

-- A user can read only their own membership. The unique(user_id) constraint is
-- an additional guard against one login being accidentally attached to two
-- partner organisations.
create policy "Partner user reads own membership"
on public.partner_hub_memberships
for select
to authenticated
using ((select auth.uid()) = user_id and active);

create policy "COP admins read partner memberships"
on public.partner_hub_memberships
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

create policy "Partner user reads own organisation"
on public.partner_hub_partners
for select
to authenticated
using (
  id in (
    select m.partner_id
    from public.partner_hub_memberships m
    where m.user_id = (select auth.uid())
      and m.active
  )
);

create policy "COP admins read partner organisations"
on public.partner_hub_partners
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

create policy "Partner user reads own leads"
on public.partner_hub_leads
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

create policy "COP admins read all partner leads"
on public.partner_hub_leads
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

create policy "Partner user reads own lead notes"
on public.partner_hub_notes
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

create policy "COP admins read all partner lead notes"
on public.partner_hub_notes
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

create policy "Partner user reads own lead events"
on public.partner_hub_events
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

create policy "COP admins read all partner lead events"
on public.partner_hub_events
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

-- Delivery logs contain recipient addresses and provider information, so only
-- COP administrators can read them.
create policy "COP admins read partner notification logs"
on public.partner_hub_notifications
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

insert into public.partner_hub_partners (
  id,
  display_name,
  notification_name,
  notification_email,
  notification_phone,
  test_routing
)
values
  ('21-5', '21-5', 'David Olsson', 'davson@hotmail.com', '+34 626 786 678', true),
  ('Vivla', 'Vivla', 'David Olsson', 'davson@hotmail.com', '+34 626 786 678', true);

-- Preserve the existing synthetic preview records as clearly labelled test
-- data. source_ref makes the seed idempotent without hard-coding generated IDs.
insert into public.partner_hub_leads (
  source_ref,
  partner_id,
  first_name,
  last_name,
  email,
  phone,
  nationality,
  destination,
  collection_type,
  budget_display,
  preferences,
  status,
  consent_confirmed_at,
  created_by_email,
  is_test
)
values
  ('preview-21-5-emma', '21-5', 'Emma', 'Thompson', 'emma.thompson@example.com', '+44 7700 900 142', 'United Kingdom', 'Mallorca', 'City Retreats', '€350,000', 'Synthetic preview lead. Looking for a 2–3 bedroom home with sea views.', 'Contacted', now(), 'system-preview', true),
  ('preview-21-5-lars', '21-5', 'Lars', 'Nyström', 'lars.nystrom@example.com', '+46 70 123 45 67', 'Sweden', 'Côte d’Azur', 'Large Nordic', '€500,000', 'Synthetic preview lead. Familiar with co-ownership and ready for an introductory call.', 'Paused', now(), 'system-preview', true),
  ('preview-21-5-sofia', '21-5', 'Sofia', 'Rossi', 'sofia.rossi@example.com', '+39 320 555 0184', 'Italy', 'Lake Como', 'READY TO GO INT-12', '€420,000', 'Synthetic preview lead. Viewing requested for next week.', 'Viewing', now(), 'system-preview', true),
  ('preview-21-5-james', '21-5', 'James', 'Miller', 'james.miller@example.com', '+1 917 555 0142', 'United States', 'Ibiza', 'Beyond', '€625,000', 'Synthetic preview lead. Awaiting proof of funds.', 'Reserved', now(), 'system-preview', true),
  ('preview-21-5-amelia', '21-5', 'Amelia', 'Brooks', 'amelia.brooks@example.com', '+44 7700 900 308', 'United Kingdom', 'Marbella', 'Grande', '€290,000', 'Synthetic preview lead. Closed-won demonstration record.', 'Won', now(), 'system-preview', true),
  ('preview-vivla-chloe', 'Vivla', 'Chloe', 'Martin', 'chloe.martin@example.com', '+44 7700 900 624', 'United Kingdom', 'Mallorca', null, '€250,000 – €300,000', 'Synthetic preview lead. Interested in a managed home in Mallorca and available for an introductory call next week.', 'New', now(), 'system-preview', true),
  ('preview-vivla-javier', 'Vivla', 'Javier', 'Morales', 'javier.morales@example.com', '+34 612 345 870', 'Spain', 'Costa del Sol, Madrid', null, '€500,000 – €750,000', 'Synthetic preview lead. Considering Costa del Sol or Madrid and comparing family-friendly locations.', 'Contacted', now(), 'system-preview', true);

insert into public.partner_hub_events (
  lead_id,
  partner_id,
  actor_role,
  actor_email,
  event_type,
  to_stage,
  metadata
)
select
  l.id,
  l.partner_id,
  'system',
  'system-preview',
  'lead_created',
  l.status,
  jsonb_build_object('synthetic', true)
from public.partner_hub_leads l
where l.is_test;
