alter table public.leads
  add column if not exists pinned_at timestamptz;

create index if not exists leads_pinned_at_idx
  on public.leads (pinned_at desc)
  where pinned_at is not null;
