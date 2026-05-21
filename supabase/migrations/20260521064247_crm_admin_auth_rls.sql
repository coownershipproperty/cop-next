begin;

-- CRM admin allowlist used by both browser-side Supabase Auth and
-- server-side admin API routes.
create table if not exists public.crm_admins (
  email text primary key,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.crm_admins (email, active)
values
  ('info@co-ownership-property.com', true),
  ('dylan@co-ownership-property.com', true),
  ('dylan@domosno.com', true),
  ('info@domosno.com', true)
on conflict (email) do update set active = excluded.active;

alter table public.crm_admins enable row level security;

-- Drop every policy on the tables this migration owns. This makes the
-- migration safe to re-run after earlier emergency lockdown attempts and
-- prevents a leftover permissive policy from undermining the grants below.
do $$
declare
  target_table text;
  policy_record record;
begin
  foreach target_table in array array[
    'crm_admins',
    'properties',
    'exchange_rates',
    'leads',
    'contacts',
    'notes',
    'activities',
    'email_queue',
    'email_sends',
    'email_opens',
    'saved_searches',
    'rate_limit_log',
    'newsletter_sends',
    'newsletter_campaigns',
    'email_events'
  ]
  loop
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = target_table
    loop
      execute format(
        'drop policy if exists %I on public.%I',
        policy_record.policyname,
        target_table
      );
    end loop;
  end loop;
end $$;

-- Public site read models. Browser reads stay public; writes are
-- service-role only.
alter table public.properties enable row level security;
alter table public.exchange_rates enable row level security;

revoke all on table public.properties from public, anon, authenticated;
revoke all on table public.exchange_rates from public, anon, authenticated;

grant select on table public.properties to anon, authenticated;
grant select on table public.exchange_rates to anon, authenticated;
grant all on table public.properties to service_role;
grant all on table public.exchange_rates to service_role;

create policy "Public read access"
  on public.properties
  for select
  to anon, authenticated
  using (true);

create policy "Public read access"
  on public.exchange_rates
  for select
  to anon, authenticated
  using (true);

-- CRM/admin data. anon gets no table access. authenticated receives table
-- privileges, but RLS restricts every operation to emails in crm_admins.
revoke all on table public.crm_admins from public, anon, authenticated;
grant select on table public.crm_admins to authenticated;
grant all on table public.crm_admins to service_role;

create policy "CRM admins can read own allowlist row"
  on public.crm_admins
  for select
  to authenticated
  using (
    active
    and email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

do $$
declare
  target_table text;
begin
  foreach target_table in array array[
    'leads',
    'contacts',
    'notes',
    'activities',
    'email_queue',
    'email_sends',
    'email_opens',
    'saved_searches',
    'rate_limit_log',
    'newsletter_sends',
    'newsletter_campaigns',
    'email_events'
  ]
  loop
    execute format('alter table public.%I enable row level security', target_table);
    execute format('revoke all on table public.%I from public, anon, authenticated', target_table);
    execute format('grant all on table public.%I to authenticated', target_table);
    execute format('grant all on table public.%I to service_role', target_table);
    execute format(
      'create policy %I on public.%I for all to authenticated using (
        exists (
          select 1
          from public.crm_admins a
          where a.active
            and a.email = lower(coalesce(auth.jwt() ->> ''email'', ''''))
        )
      ) with check (
        exists (
          select 1
          from public.crm_admins a
          where a.active
            and a.email = lower(coalesce(auth.jwt() ->> ''email'', ''''))
        )
      )',
      'CRM admins can manage',
      target_table
    );
  end loop;
end $$;

-- Keep email_events write-only for anon in case an external event source
-- posts directly with the public key. anon still cannot read, update, or
-- delete event rows.
grant insert on table public.email_events to anon;

create policy "Anon can insert email events"
  on public.email_events
  for insert
  to anon
  with check (true);

-- CRM views must obey the underlying table RLS policies.
alter view public.leads_view set (security_invoker = on);
alter view public.lead_pipeline set (security_invoker = on);
alter view public.email_opens_view set (security_invoker = on);

revoke all on table
  public.leads_view,
  public.lead_pipeline,
  public.email_opens_view
  from public, anon, authenticated;

grant select on table
  public.leads_view,
  public.lead_pipeline,
  public.email_opens_view
  to authenticated;

grant select on table
  public.leads_view,
  public.lead_pipeline,
  public.email_opens_view
  to service_role;

-- SECURITY DEFINER functions should not be public API entry points.
do $$
begin
  if to_regprocedure('public.increment_contact_score(uuid, integer)') is not null then
    revoke execute on function public.increment_contact_score(uuid, integer) from public, anon, authenticated;
    grant execute on function public.increment_contact_score(uuid, integer) to service_role;
  end if;

  if to_regprocedure('public.notify_vercel_revalidate()') is not null then
    revoke execute on function public.notify_vercel_revalidate() from public, anon, authenticated;
    grant execute on function public.notify_vercel_revalidate() to service_role;
  end if;

  if to_regprocedure('public.trigger_vercel_redeploy()') is not null then
    revoke execute on function public.trigger_vercel_redeploy() from public, anon, authenticated;
    grant execute on function public.trigger_vercel_redeploy() to service_role;
  end if;
end $$;

commit;
