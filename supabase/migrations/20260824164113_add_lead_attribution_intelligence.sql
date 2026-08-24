begin;

alter table public.contacts
  add column if not exists inferred_nationality text,
  add column if not exists nationality_confidence smallint,
  add column if not exists nationality_evidence jsonb not null default '{}'::jsonb,
  add column if not exists nationality_inferred_at timestamptz,
  add column if not exists first_ip_country_code text,
  add column if not exists first_ip_city text,
  add column if not exists first_ip_region text;

alter table public.contacts
  drop constraint if exists contacts_nationality_confidence_check,
  add constraint contacts_nationality_confidence_check
    check (nationality_confidence is null or nationality_confidence between 0 and 100),
  drop constraint if exists contacts_first_ip_country_code_check,
  add constraint contacts_first_ip_country_code_check
    check (first_ip_country_code is null or first_ip_country_code ~ '^[A-Z]{2}$');

alter table public.leads
  add column if not exists first_visit_at timestamptz,
  add column if not exists landing_url text,
  add column if not exists referrer_url text,
  add column if not exists attribution_source text,
  add column if not exists enquiry_page_url text;

-- The tracking tables were already RLS-enabled but had no policies, so the
-- new authenticated Admin could not read them. Restrict reads to the same CRM
-- admin allowlist and keep all public/partner access closed.
do $$
declare
  target_table text;
begin
  foreach target_table in array array['tracked_emails', 'tracked_email_opens', 'tracked_email_clicks']
  loop
    execute format('revoke all on table public.%I from public, anon, authenticated', target_table);
    execute format('grant select on table public.%I to authenticated', target_table);
    execute format('grant all on table public.%I to service_role', target_table);
    execute format('drop policy if exists %I on public.%I', 'CRM admins can read tracking', target_table);
    execute format(
      'create policy %I on public.%I for select to authenticated using (
        exists (
          select 1 from public.crm_admins a
          where a.active
            and a.email = lower(coalesce((select auth.jwt()) ->> ''email'', ''''))
        )
      )',
      'CRM admins can read tracking',
      target_table
    );
  end loop;
end $$;

commit;
