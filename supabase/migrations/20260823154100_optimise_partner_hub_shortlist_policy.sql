drop policy if exists "Partner user reads own lead shortlist"
  on public.partner_hub_shortlist_items;

drop policy if exists "COP admins read all lead shortlists"
  on public.partner_hub_shortlist_items;

create policy "Authenticated user reads permitted lead shortlists"
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
  or exists (
    select 1
    from public.crm_admins a
    where a.active
      and a.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
  )
);
