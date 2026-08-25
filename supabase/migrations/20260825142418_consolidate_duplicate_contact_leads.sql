begin;

set local lock_timeout = '5s';
set local statement_timeout = '120s';

create temporary table lead_merge_map (
  duplicate_id uuid primary key,
  canonical_id uuid not null,
  contact_id uuid not null
) on commit drop;

with ranked as (
  select
    l.id,
    l.contact_id,
    first_value(l.id) over (
      partition by l.contact_id
      order by
        case l.status
          when 'won' then 100
          when 'reservation_confirmed' then 90
          when 'registered' then 80
          when 'transferred_to_partner' then 75
          when 'qualified' then 72
          when 'hot_lead' then 71
          when 'contacted' then 70
          when 'lead_replied' then 69
          when 'new_lead' then 60
          when 'passive_interest' then 40
          when 'lost' then 10
          else 50
        end desc,
        (l.pinned_at is not null) desc,
        l.updated_at desc nulls last,
        l.created_at desc,
        l.id
    ) as canonical_id,
    row_number() over (
      partition by l.contact_id
      order by
        case l.status
          when 'won' then 100
          when 'reservation_confirmed' then 90
          when 'registered' then 80
          when 'transferred_to_partner' then 75
          when 'qualified' then 72
          when 'hot_lead' then 71
          when 'contacted' then 70
          when 'lead_replied' then 69
          when 'new_lead' then 60
          when 'passive_interest' then 40
          when 'lost' then 10
          else 50
        end desc,
        (l.pinned_at is not null) desc,
        l.updated_at desc nulls last,
        l.created_at desc,
        l.id
    ) as position
  from public.leads l
  where l.merged_into_lead_id is null
)
insert into lead_merge_map (duplicate_id, canonical_id, contact_id)
select id, canonical_id, contact_id
from ranked
where position > 1;

-- Preserve every listing interest on the one canonical lead.
insert into public.lead_property_shortlists (lead_id, property_slug, created_at)
select m.canonical_id, l.property_slug, min(coalesce(l.created_at, now()))
from lead_merge_map m
join public.leads l on l.contact_id = m.contact_id
join public.properties p on p.slug = l.property_slug
where l.property_slug is not null
group by m.canonical_id, l.property_slug
on conflict (lead_id, property_slug) do nothing;

insert into public.lead_property_shortlists (
  lead_id, property_slug, created_by, created_by_email, created_at
)
select canonical_id, property_slug, created_by, created_by_email, created_at
from (
  select distinct on (m.canonical_id, s.property_slug)
    m.canonical_id,
    s.property_slug,
    s.created_by,
    s.created_by_email,
    s.created_at
  from lead_merge_map m
  join public.lead_property_shortlists s on s.lead_id = m.duplicate_id
  order by m.canonical_id, s.property_slug, s.created_at asc nulls last, s.id
) preserved_shortlists
on conflict (lead_id, property_slug) do nothing;

-- Add an explicit audit entry before moving the rest of the history.
insert into public.activities (contact_id, lead_id, type, description, metadata, created_at)
select
  m.contact_id,
  m.canonical_id,
  'lead_merged',
  'Duplicate property enquiry consolidated into this contact lead',
  jsonb_build_object(
    'merged_lead_id', l.id,
    'property_slug', l.property_slug,
    'property_title', l.property_title,
    'status', l.status,
    'main_region', l.main_region,
    'subregion', l.subregion,
    'partner', l.partner,
    'message', l.message,
    'landing_url', l.landing_url,
    'attribution_source', l.attribution_source,
    'original_created_at', l.created_at
  ),
  now()
from lead_merge_map m
join public.leads l on l.id = m.duplicate_id;

update public.activities a set lead_id = m.canonical_id from lead_merge_map m where a.lead_id = m.duplicate_id;
update public.email_events e set lead_id = m.canonical_id from lead_merge_map m where e.lead_id = m.duplicate_id;
update public.email_queue q set lead_id = m.canonical_id from lead_merge_map m where q.lead_id = m.duplicate_id;
update public.email_sends s set lead_id = m.canonical_id from lead_merge_map m where s.lead_id = m.duplicate_id;
update public.notes n set lead_id = m.canonical_id from lead_merge_map m where n.lead_id = m.duplicate_id;
update public.partner_referrals r set lead_id = m.canonical_id from lead_merge_map m where r.lead_id = m.duplicate_id;

-- Keep the most recent activity timestamp and any pin on the canonical record.
with aggregate_values as (
  select
    m.canonical_id,
    max(l.updated_at) as latest_update,
    max(l.pinned_at) as pinned_at
  from lead_merge_map m
  join public.leads l on l.contact_id = m.contact_id
  where l.merged_into_lead_id is null
  group by m.canonical_id
)
update public.leads l
set updated_at = greatest(l.updated_at, a.latest_update),
    pinned_at = coalesce(l.pinned_at, a.pinned_at)
from aggregate_values a
where l.id = a.canonical_id;

update public.leads l
set merged_into_lead_id = m.canonical_id,
    merged_at = now(),
    merge_reason = 'Same contact/email consolidated by COP CRM'
from lead_merge_map m
where l.id = m.duplicate_id;

-- Enforce one active CRM lead per contact while allowing any number of archived
-- enquiry rows that point back to it.
create unique index if not exists leads_one_active_per_contact_idx
  on public.leads (contact_id)
  where merged_into_lead_id is null;

-- Keep the listing history complete even when a later enquiry changes the
-- headline property on the canonical lead.
create or replace function public.sync_lead_property_shortlist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
     and old.property_slug is not null
     and old.property_slug is distinct from new.property_slug
     and exists (select 1 from public.properties p where p.slug = old.property_slug) then
    insert into public.lead_property_shortlists (lead_id, property_slug, created_at)
    values (new.id, old.property_slug, coalesce(old.created_at, now()))
    on conflict (lead_id, property_slug) do nothing;
  end if;

  if new.property_slug is not null
     and exists (select 1 from public.properties p where p.slug = new.property_slug) then
    insert into public.lead_property_shortlists (lead_id, property_slug, created_at)
    values (new.id, new.property_slug, coalesce(new.created_at, now()))
    on conflict (lead_id, property_slug) do nothing;
  end if;

  return null;
end;
$$;

revoke all on function public.sync_lead_property_shortlist() from public, anon, authenticated;

drop trigger if exists leads_sync_property_shortlist on public.leads;
create trigger leads_sync_property_shortlist
after insert or update of property_slug on public.leads
for each row execute function public.sync_lead_property_shortlist();

commit;
