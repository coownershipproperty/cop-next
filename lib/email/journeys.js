/**
 * lib/email/journeys.js
 *
 * Declarative config for the COP email automation engine.
 * Each entry describes ONE automated email: when it fires, how long to wait,
 * how to batch, what cancels it, and which builder renders it.
 *
 * To add or change an automated email, edit THIS file — no new code path.
 *
 * Journey fields
 * ──────────────
 *   id            unique id; also the dedupe namespace (written to email_queue.trigger)
 *   on            activities.type that triggers the journey
 *   delayMin      debounce — wait this long after the FIRST trigger event
 *   maxAgeMin     never send if the first trigger is older than this
 *   cooldownDays  at most one of this journey per contact per N days
 *   cancelOn      [activity types] — if any happens after the trigger, cancel (supersede)
 *   transactional true ⇒ exempt from suppression / frequency cap / quiet hours
 *   quietHours    true ⇒ only send 08:00–20:00 UTC (defer otherwise)
 *   requiresPayload  true ⇒ skip if collect() returns nothing
 *   enabledEnv    name of an env var that must equal 'true' for this journey to run
 *   from / replyTo  sender identity
 *   collect(activities)            → the payload (e.g. the property list)
 *   buildEmail({firstName,payload,locale}) → { subject, html }
 *
 * See docs/email-automation-blueprint.md, section 6.
 */
import {
  DYLAN_FROM,
  DYLAN_REPLY,
  dedupeProperties,
  buildGalleryFollowupEmail,
} from './templates';

export const JOURNEYS = [
  {
    id:          'gallery_followup',
    description: 'One personal note from Dylan ~10 min after a visitor unlocks '
               + 'one or more galleries, naming every property they looked at.',
    on:          'floor_plan_requested',
    delayMin:    10,
    maxAgeMin:   120,
    cooldownDays: 30,
    cancelOn:    ['enquiry_submitted', 'gallery_enquiry'],
    transactional: false,
    quietHours:  false,          // a fast response to a just-now action — any hour is fine
    requiresPayload: true,
    enabledEnv:  'GALLERY_FOLLOWUP_ENABLED',
    from:        DYLAN_FROM,
    replyTo:     DYLAN_REPLY,
    collect:     (activities) => dedupeProperties(activities),
    buildEmail:  ({ firstName, payload, locale }) =>
                   buildGalleryFollowupEmail({ firstName, properties: payload, locale }),
  },

  // ── Future journeys land here as plain config, e.g.: ──────────────────────
  //   enquiry_nurture_3   (delayMin 4320,  quietHours true,  cancelOn ['enquiry_submitted'])
  //   welcome_2           (delayMin 4320,  quietHours true)
  //   price_drop          (batched daily digest)
  //   new_listings_digest (weekly)
  // None are active yet — they will be added once the core is proven live.
];

// Journey ids that count toward the per-contact frequency cap.
// Transactional journeys (instant responses the visitor asked for) are exempt.
export const LIFECYCLE_JOURNEY_IDS = JOURNEYS
  .filter(j => !j.transactional)
  .map(j => j.id);
