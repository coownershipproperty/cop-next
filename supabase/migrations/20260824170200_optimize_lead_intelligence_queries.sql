begin;

create index if not exists idx_leads_property_slug
  on public.leads (property_slug);

create index if not exists idx_activities_lead_created_at
  on public.activities (lead_id, created_at desc);

create index if not exists idx_email_sends_lead_sent_at
  on public.email_sends (lead_id, sent_at desc);

create index if not exists idx_tracked_emails_recipient_sent_at
  on public.tracked_emails (lower(recipient_email), sent_at desc);

create index if not exists idx_shortlists_property_slug
  on public.lead_property_shortlists (property_slug);

commit;
