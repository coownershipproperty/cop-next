-- Restore write access to the properties table for the admin UI.
-- The security lockdown left the `authenticated` role SELECT-only, so the
-- property editor could load a property but not save edits
-- ('permission denied for table properties').
--
-- Fix: grant the table privilege to `authenticated`, and tighten the existing
-- "properties admin write" RLS policy so only active CRM admins can write
-- (it previously allowed any authenticated user).
--
-- Already applied to the cop-prod project; this file records it for the repo.

GRANT INSERT, UPDATE, DELETE ON public.properties TO authenticated;

DROP POLICY IF EXISTS "properties admin write" ON public.properties;

CREATE POLICY "properties admin write" ON public.properties
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.crm_admins a
    WHERE a.active AND a.email = lower(COALESCE(auth.jwt() ->> 'email', ''))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.crm_admins a
    WHERE a.active AND a.email = lower(COALESCE(auth.jwt() ->> 'email', ''))
  ));
