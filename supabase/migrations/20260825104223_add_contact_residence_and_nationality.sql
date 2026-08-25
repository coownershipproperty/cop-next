-- Keep a person's confirmed nationality separate from where they live and
-- from the destination/property they enquired about. The existing
-- inferred_nationality fields remain as automated evidence and are not
-- overwritten when an administrator confirms the details.

alter table public.contacts
  add column if not exists nationality text,
  add column if not exists residence_city text,
  add column if not exists residence_country text;

comment on column public.contacts.nationality is
  'Administrator-confirmed nationality. Falls back to inferred_nationality in the UI when empty.';
comment on column public.contacts.residence_city is
  'Administrator-confirmed city of residence, separate from property destination.';
comment on column public.contacts.residence_country is
  'Administrator-confirmed country of residence, separate from nationality and property destination.';
