begin;

-- Keep the CRM shortlist relationship aligned with the authoritative listing
-- already stored on a lead. The function is intentionally security invoker:
-- service-side enquiry ingestion uses service_role, while browser writes still
-- have to satisfy the existing CRM-admin RLS policy.
create or replace function public.sync_lead_property_shortlist()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.property_slug is null or btrim(new.property_slug) = '' then
    return new;
  end if;

  if exists (
    select 1
    from public.properties p
    where p.slug = new.property_slug
  ) then
    insert into public.lead_property_shortlists (lead_id, property_slug, created_at)
    values (new.id, new.property_slug, coalesce(new.created_at, now()))
    on conflict (lead_id, property_slug) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function public.sync_lead_property_shortlist() from public, anon, authenticated;
grant execute on function public.sync_lead_property_shortlist() to service_role;

drop trigger if exists sync_lead_property_shortlist_after_write on public.leads;
create trigger sync_lead_property_shortlist_after_write
after insert or update of property_slug on public.leads
for each row
execute function public.sync_lead_property_shortlist();

-- Populate the relationship for existing property-specific leads. The join
-- prevents stale/non-listing values from violating the property foreign key,
-- and the unique constraint makes the operation safe to rerun.
insert into public.lead_property_shortlists (lead_id, property_slug, created_at)
select l.id, l.property_slug, coalesce(l.created_at, now())
from public.leads l
join public.properties p on p.slug = l.property_slug
where l.property_slug is not null
  and btrim(l.property_slug) <> ''
on conflict (lead_id, property_slug) do nothing;

commit;
