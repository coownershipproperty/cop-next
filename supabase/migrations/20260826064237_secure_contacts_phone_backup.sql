begin;

-- This dated table is a private operational backup, not application data.
-- Keep it available to database administrators and service-role maintenance,
-- while removing it completely from browser and signed-in client access.
alter table public.contacts_phone_backup_2026_08_21
  enable row level security;

revoke all privileges
  on table public.contacts_phone_backup_2026_08_21
  from public, anon, authenticated;

comment on table public.contacts_phone_backup_2026_08_21 is
  'Private contact-phone backup created 2026-08-21. RLS enabled and client roles revoked; database/service administrators only.';

commit;
