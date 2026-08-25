begin;

alter table public.leads
  add column if not exists property_sale_price numeric,
  add column if not exists commission_rate numeric,
  add column if not exists invoice_amount numeric,
  add column if not exists invoice_date date,
  add column if not exists invoice_paid boolean not null default false,
  add column if not exists won_at timestamptz;

alter table public.leads
  drop constraint if exists leads_property_sale_price_check,
  add constraint leads_property_sale_price_check
    check (property_sale_price is null or property_sale_price >= 0),
  drop constraint if exists leads_commission_rate_check,
  add constraint leads_commission_rate_check
    check (commission_rate is null or (commission_rate >= 0 and commission_rate <= 100)),
  drop constraint if exists leads_invoice_amount_check,
  add constraint leads_invoice_amount_check
    check (invoice_amount is null or invoice_amount >= 0);

comment on column public.leads.property_sale_price is
  'Final property/share price used by COP to calculate commission after a lead is won.';
comment on column public.leads.commission_rate is
  'COP commission percentage for the won opportunity, entered by an administrator.';
comment on column public.leads.invoice_amount is
  'Final invoice amount. It may be calculated from price and commission, then adjusted manually.';
comment on column public.leads.invoice_date is
  'Date the COP commission invoice was issued.';
comment on column public.leads.invoice_paid is
  'Administrator-controlled flag confirming payment of the invoice.';
comment on column public.leads.won_at is
  'First timestamp recorded when the lead was moved to the won stage.';

create index if not exists leads_won_status_created_idx
  on public.leads (status, won_at desc, created_at desc)
  where status = 'won';

commit;
