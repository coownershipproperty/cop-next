-- Email automation engine — suppression list.
--
-- The single list the engine checks before sending any non-transactional
-- email. Populated by the unsubscribe page and (later) Resend bounce /
-- complaint webhooks. Empty on creation, so it changes nothing until
-- addresses are added.
--
-- See docs/email-automation-blueprint.md, section 5.3 and section 9.1.

CREATE TABLE IF NOT EXISTS public.suppressions (
  email      text PRIMARY KEY,
  reason     text NOT NULL DEFAULT 'manual',   -- unsubscribe | bounce | complaint | manual
  scope      text NOT NULL DEFAULT 'all',      -- all | marketing
  created_at timestamptz NOT NULL DEFAULT now(),
  note       text
);

-- Locked down to match the project's RLS posture: no public policies, so only
-- the service role (server-side API routes) can read or write it.
ALTER TABLE public.suppressions ENABLE ROW LEVEL SECURITY;
