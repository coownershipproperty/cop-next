begin;

alter table public.leads
  add column if not exists original_property_slug text,
  add column if not exists original_property_title text;

comment on column public.leads.original_property_slug is
  'The first COP listing attached to this lead by an enquiry. Later enquiries and shortlists do not replace it.';
comment on column public.leads.original_property_title is
  'The property title captured with the first property-specific enquiry.';

create index if not exists leads_original_property_slug_idx
  on public.leads (original_property_slug)
  where original_property_slug is not null;

-- The shortlist has retained every property-specific enquiry, including the
-- original timestamps from duplicate lead rows consolidated into one contact.
-- Use the earliest of those rows as the historical source of truth.
with first_enquiry_property as (
  select distinct on (s.lead_id)
    s.lead_id,
    s.property_slug
  from public.lead_property_shortlists s
  order by s.lead_id, s.created_at asc nulls last, s.id
)
update public.leads l
set original_property_slug = f.property_slug,
    original_property_title = coalesce(p.title, l.property_title)
from first_enquiry_property f
left join public.properties p on p.slug = f.property_slug
where l.id = f.lead_id
  and l.original_property_slug is null;

-- A lead created before shortlist synchronisation can still have the original
-- listing directly on the lead row.
update public.leads l
set original_property_slug = l.property_slug,
    original_property_title = coalesce(
      l.property_title,
      (select p.title from public.properties p where p.slug = l.property_slug)
    )
where l.original_property_slug is null
  and l.property_slug is not null;

create or replace function public.merge_or_create_contact_lead(
  p_contact_id uuid,
  p_property_slug text default null,
  p_property_title text default null,
  p_main_region text default null,
  p_subregion text default null,
  p_partner text default null,
  p_message text default null,
  p_budget_min numeric default null,
  p_budget_max numeric default null,
  p_first_visit_at timestamptz default null,
  p_landing_url text default null,
  p_referrer_url text default null,
  p_attribution_source text default null,
  p_enquiry_page_url text default null
)
returns public.leads
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lead public.leads%rowtype;
begin
  if p_contact_id is null then
    raise exception 'contact_id is required';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_contact_id::text, 0)
  );

  select l.*
    into v_lead
  from public.leads l
  where l.contact_id = p_contact_id
    and l.merged_into_lead_id is null
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
  limit 1
  for update;

  if found then
    update public.leads l
    set original_property_slug = coalesce(
          l.original_property_slug,
          l.property_slug,
          nullif(btrim(p_property_slug), '')
        ),
        original_property_title = coalesce(
          l.original_property_title,
          l.property_title,
          nullif(btrim(p_property_title), '')
        ),
        property_slug = coalesce(nullif(btrim(p_property_slug), ''), l.property_slug),
        property_title = coalesce(nullif(btrim(p_property_title), ''), l.property_title),
        main_region = coalesce(nullif(btrim(p_main_region), ''), l.main_region),
        subregion = coalesce(nullif(btrim(p_subregion), ''), l.subregion),
        partner = coalesce(nullif(btrim(p_partner), ''), l.partner),
        message = coalesce(nullif(btrim(p_message), ''), l.message),
        budget_min = coalesce(p_budget_min, l.budget_min),
        budget_max = coalesce(p_budget_max, l.budget_max),
        first_visit_at = coalesce(l.first_visit_at, p_first_visit_at),
        landing_url = coalesce(nullif(btrim(p_landing_url), ''), l.landing_url),
        referrer_url = coalesce(nullif(btrim(p_referrer_url), ''), l.referrer_url),
        attribution_source = coalesce(nullif(btrim(p_attribution_source), ''), l.attribution_source),
        enquiry_page_url = coalesce(nullif(btrim(p_enquiry_page_url), ''), l.enquiry_page_url),
        updated_at = now()
    where l.id = v_lead.id
    returning l.* into v_lead;

    if p_property_slug is not null
       and btrim(p_property_slug) <> ''
       and exists (select 1 from public.properties p where p.slug = p_property_slug) then
      insert into public.lead_property_shortlists (lead_id, property_slug, created_at)
      values (v_lead.id, p_property_slug, now())
      on conflict (lead_id, property_slug) do nothing;
    end if;

    insert into public.activities (contact_id, lead_id, type, description, metadata)
    values (
      p_contact_id,
      v_lead.id,
      'enquiry_merged',
      'New enquiry merged into the existing contact lead',
      jsonb_build_object(
        'property_slug', p_property_slug,
        'property_title', p_property_title,
        'main_region', p_main_region,
        'subregion', p_subregion,
        'message', p_message,
        'landing_url', p_landing_url,
        'attribution_source', p_attribution_source,
        'enquiry_page_url', p_enquiry_page_url
      )
    );

    return v_lead;
  end if;

  insert into public.leads (
    contact_id, property_slug, property_title, original_property_slug,
    original_property_title, status, main_region, subregion, partner,
    message, budget_min, budget_max, first_visit_at, landing_url, referrer_url,
    attribution_source, enquiry_page_url
  ) values (
    p_contact_id, nullif(btrim(p_property_slug), ''), nullif(btrim(p_property_title), ''),
    nullif(btrim(p_property_slug), ''), nullif(btrim(p_property_title), ''),
    'new_lead', nullif(btrim(p_main_region), ''), nullif(btrim(p_subregion), ''), nullif(btrim(p_partner), ''),
    nullif(btrim(p_message), ''), p_budget_min, p_budget_max, p_first_visit_at,
    nullif(btrim(p_landing_url), ''), nullif(btrim(p_referrer_url), ''),
    nullif(btrim(p_attribution_source), ''), nullif(btrim(p_enquiry_page_url), '')
  )
  returning * into v_lead;

  return v_lead;
end;
$$;

revoke all on function public.merge_or_create_contact_lead(
  uuid, text, text, text, text, text, text, numeric, numeric, timestamptz, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.merge_or_create_contact_lead(
  uuid, text, text, text, text, text, text, numeric, numeric, timestamptz, text, text, text, text
) to service_role;

commit;
