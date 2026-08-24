begin;

create table if not exists public.lead_property_shortlists (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  property_slug text not null references public.properties(slug) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  created_by_email text,
  created_at timestamptz not null default now(),
  unique (lead_id, property_slug)
);

create index if not exists lead_property_shortlists_lead_id_idx
  on public.lead_property_shortlists (lead_id, created_at desc);

alter table public.lead_property_shortlists enable row level security;
alter table public.lead_property_shortlists force row level security;

revoke all on table public.lead_property_shortlists from public, anon, authenticated;
grant select, insert, delete on table public.lead_property_shortlists to authenticated;
grant all on table public.lead_property_shortlists to service_role;

drop policy if exists "CRM admins can manage lead property shortlists"
  on public.lead_property_shortlists;

create policy "CRM admins can manage lead property shortlists"
  on public.lead_property_shortlists
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.crm_admins a
      where a.active
        and a.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
    )
  )
  with check (
    exists (
      select 1
      from public.crm_admins a
      where a.active
        and a.email = lower(coalesce((select auth.jwt()) ->> 'email', ''))
    )
  );

commit;
