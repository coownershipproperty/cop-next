-- Property edits are refreshed by properties_revalidate_trigger, which calls
-- /api/revalidate for the affected detail, listings and homepage routes.
-- A separate full production deployment for every updated row is redundant
-- and turns bulk property updates into large Vercel build storms.
drop trigger if exists on_property_updated on public.properties;
