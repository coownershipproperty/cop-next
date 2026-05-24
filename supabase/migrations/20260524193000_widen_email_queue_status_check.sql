-- Phase 0 of the email automation engine blueprint
-- (docs/email-automation-blueprint.md).
--
-- Widen email_queue.status to allow the states the application code already
-- tries to write. Before this, writing 'cancelled' or 'error' silently failed
-- with a constraint violation, so:
--   * cancelPendingSequence() never actually cancelled anything, and
--   * a permanently-failing email could not be marked and retried forever.
--
-- This only ADDS allowed values — every existing row already satisfies the new
-- constraint — so it cannot fail or affect existing data.
--
-- Already applied to the cop-prod project; this file records it for the repo.
-- The SQL is idempotent (DROP IF EXISTS) so re-applying is harmless.

ALTER TABLE public.email_queue DROP CONSTRAINT IF EXISTS email_queue_status_check;

ALTER TABLE public.email_queue ADD CONSTRAINT email_queue_status_check
  CHECK (status = ANY (ARRAY[
    'pending'::text,
    'approved'::text,
    'sent'::text,
    'rejected'::text,
    'cancelled'::text,
    'superseded'::text,
    'expired'::text,
    'error'::text
  ]));
