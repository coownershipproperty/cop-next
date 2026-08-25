begin;

alter table public.partner_hub_leads
  drop constraint if exists partner_hub_leads_status;

alter table public.partner_hub_leads
  add constraint partner_hub_leads_status
  check (status in ('New', 'Contacted', 'Viewing', 'Reserved', 'Contract signed', 'Deposit paid', 'Won', 'Lost', 'Paused'));

commit;
