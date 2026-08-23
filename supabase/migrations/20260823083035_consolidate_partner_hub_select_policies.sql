-- Consolidate the administrator and partner SELECT paths into one policy per
-- table. The logical access is unchanged; this avoids evaluating two separate
-- permissive policies for every authenticated read.

drop policy "Partner user reads own membership" on public.partner_hub_memberships;
drop policy "COP admins read partner memberships" on public.partner_hub_memberships;

create policy "Authorised users read partner memberships"
on public.partner_hub_memberships
for select
to authenticated
using (
  ((select auth.uid()) = user_id and active)
  or exists (
    select 1
    from public.crm_admins a
    where a.active
      and a.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
);

drop policy "Partner user reads own organisation" on public.partner_hub_partners;
drop policy "COP admins read partner organisations" on public.partner_hub_partners;

create policy "Authorised users read partner organisations"
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
  or exists (
    select 1
    from public.crm_admins a
    where a.active
      and a.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
);

drop policy "Partner user reads own leads" on public.partner_hub_leads;
drop policy "COP admins read all partner leads" on public.partner_hub_leads;

create policy "Authorised users read partner leads"
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
  or exists (
    select 1
    from public.crm_admins a
    where a.active
      and a.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
);

drop policy "Partner user reads own lead notes" on public.partner_hub_notes;
drop policy "COP admins read all partner lead notes" on public.partner_hub_notes;

create policy "Authorised users read partner lead notes"
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
  or exists (
    select 1
    from public.crm_admins a
    where a.active
      and a.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
);

drop policy "Partner user reads own lead events" on public.partner_hub_events;
drop policy "COP admins read all partner lead events" on public.partner_hub_events;

create policy "Authorised users read partner lead events"
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
  or exists (
    select 1
    from public.crm_admins a
    where a.active
      and a.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
);
