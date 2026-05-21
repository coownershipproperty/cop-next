-- Restore authenticated CRM access to security-invoker views.
--
-- The emergency lockdown was applied to production before the view grants
-- landed in the migration file. Production needs this follow-up migration so
-- lead/dashboard reads keep working for allowlisted CRM admins while anon
-- remains blocked at the privilege layer.

begin;

alter view public.leads_view set (security_invoker = on);
alter view public.lead_pipeline set (security_invoker = on);
alter view public.email_opens_view set (security_invoker = on);

revoke all on table
  public.leads_view,
  public.lead_pipeline,
  public.email_opens_view
  from public, anon;

grant select on table
  public.leads_view,
  public.lead_pipeline,
  public.email_opens_view
  to authenticated, service_role;

commit;
