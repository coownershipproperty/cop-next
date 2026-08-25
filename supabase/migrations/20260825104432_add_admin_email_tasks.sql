-- Private COP Admin tasks. Access is only through service-role API routes
-- after crm_admin authentication; no browser role receives table privileges.

create table public.admin_tasks (
  id uuid primary key default gen_random_uuid(),
  task text not null,
  due_at timestamptz,
  reminder_at timestamptz,
  reminder_status text not null default 'none',
  reminder_sent_at timestamptz,
  reminder_error text,
  reminder_attempts integer not null default 0,
  created_by_email text not null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint admin_tasks_task_length check (char_length(task) between 1 and 220),
  constraint admin_tasks_reminder_status check (reminder_status in ('none', 'pending', 'sending', 'sent', 'failed')),
  constraint admin_tasks_schedule_consistency check (
    (due_at is null and reminder_at is null and reminder_status = 'none')
    or
    (due_at is not null and reminder_at is not null and reminder_at < due_at and reminder_status <> 'none')
  )
);

create index admin_tasks_open_due_idx
  on public.admin_tasks (completed_at, due_at, created_at desc);

create index admin_tasks_pending_reminder_idx
  on public.admin_tasks (reminder_at)
  where reminder_status = 'pending' and completed_at is null;

revoke all on table public.admin_tasks from public, anon, authenticated;
grant all on table public.admin_tasks to service_role;

alter table public.admin_tasks enable row level security;
alter table public.admin_tasks force row level security;

comment on table public.admin_tasks is
  'Private COP Admin task list with optional email reminder 30 minutes before due time.';
