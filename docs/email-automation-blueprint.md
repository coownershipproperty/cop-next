# COP Email Automation Engine — Architecture Blueprint

*Prepared for David · co-ownership-property.com · May 2026*
*Status: design for review — nothing in here is built yet.*

---

## TL;DR

We replace four ad-hoc email-sending paths and three home-grown batching
mechanisms with **one engine, one queue, one config file**.

Every automated email the site sends — gallery delivery, enquiry reply,
follow-ups, nurture sequences, price-drop and new-listing alerts — flows
through a single event-driven pipeline that knows how to **wait, batch,
deduplicate, cancel, rate-limit and suppress**. Adding or changing an
automated email becomes a few lines of config, not a new code path.

The batching behaviour you described for gallery unlocks — *wait, scan, see
if they unlocked several, send one email naming all the properties* — is not
a gallery-specific feature. It is the core primitive, and every journey gets
it for free.

This is genuinely more capable than the "outbound OS" in that LinkedIn post.
That product is a PDF describing a process a human runs. This is software
that runs itself, idempotently, in four languages, and **structurally cannot
double-send or spam a contact.**

---

## 1. Build vs. buy — and why building is right here

The honest version first. Tools already exist that do lifecycle email
automation: Customer.io, Loops, Braze, even HubSpot workflows. They give you
a visual journey builder, deliverability tooling, and analytics dashboards
with zero engineering. If COP grows a marketing team that wants to edit
journeys without touching code, that is a real argument to revisit this.

But for COP today, building is the right call, for concrete reasons:

- **The hard part already lives in your codebase.** Choosing *which*
  properties to feature in an email — matching on city, country, price band,
  saved-search regions, deduping by slug, respecting locale — is real logic
  in `enquiry.js` and `unlock-drive.js`. A SaaS tool cannot do that; you would
  end up calling your own API from their system anyway.
- **You already have the substrate.** Supabase holds the events
  (`activities`), the queue (`email_queue`) and the contacts. Resend sends the
  mail. The engine is the missing ~400 lines of glue, not a platform.
- **Cost and data.** SaaS lifecycle tools bill per contact and want a copy of
  your customer data. You would be paying to export data you already own.
- **You can describe a journey in plain English and have it built in
  minutes.** That is the actual replacement for a visual builder.

Counter-argument, stated fairly: a SaaS tool would give you bounce/complaint
handling, send-time optimisation and a reporting UI on day one, all of which
this blueprint has to build deliberately (Sections 9 and 11). The build is
correct *because the routing logic is bespoke* — not because SaaS is bad.

---

## 2. What exists today — a grounded audit

This is the real current state, read from the repo and the live `cop-prod`
database, not assumed.

### 2.1 Four different ways an email gets sent

| Path | Where | Used by |
|---|---|---|
| `queueEmail()` | `lib/resend.js` | unlock-drive (gallery delivery + 24h nurture), enquiry (day 3/7/14), newsletter (welcome series), property alerts |
| `sendHtml()` direct | `lib/resend.js` | gallery-enquiry auto-reply, the two processors |
| `sendEnquiryReply()` | `lib/enquiryReply.js` | enquiry.js auto-reply |
| `sendTeamNotification()` | `lib/resend.js` | internal team alerts |

Four entry points means four places to change a from-address, four places a
suppression check would have to be added, four mental models.

### 2.2 Three separate, home-grown batching mechanisms

- **`process-gallery-followups.js`** — scans `activities` for
  `floor_plan_requested`, groups by contact, waits 10 minutes, sends one
  batched "let me connect you" note from Dylan. *(This is the one you
  approved. It is good — it is the prototype for the whole engine.)*
- **`unlock-drive.js`, inline** — *also* schedules a separate 24-hour
  "still thinking about it?" nurture email, batched by merging into an
  existing pending `email_queue` row. A second, overlapping follow-up for the
  exact same trigger.
- **`gallery-enquiry.js`, inline** — its own 60-day dedupe check and a
  first-vs-follow-up copy variant.
- **`enquiry.js`, inline** — day 3 / 7 / 14 nurture, scheduled with
  `sendAfter`, plus a `cancelPendingSequence()` call.

Each one reinvents "have we already emailed this person about this." None of
them share code. None of them know about each other.

### 2.3 The consequence: one gallery unlock can fire three emails

The live data confirms it. In `email_queue`, by trigger:
`floor_plan_requested` = 312 rows (the gallery delivery) and
`floor_plan_nurture` = 212 rows (the 24h follow-up). A visitor who unlocks a
gallery currently gets: the gallery email instantly, the 10-minute Dylan
note, **and** the 24-hour nurture email. Three touches, from two systems that
do not coordinate. This is exactly the spam you want gone.

### 2.4 Two confirmed bugs, verified against the database

**Bug 1 — sequence cancellation silently does nothing.**
`email_queue.status` has a database CHECK constraint:

```
CHECK (status = ANY (ARRAY['pending','approved','sent','rejected']))
```

But `cancelPendingSequence()` in `lib/resend.js` runs
`UPDATE ... SET status = 'cancelled'`. Postgres rejects `'cancelled'` — it is
not in the allowed set — so the update **errors out and changes zero rows.**
Proof: the `email_queue` table has 1,407 `sent` + 568 `rejected` + 10
`pending` rows, and **zero** `cancelled` rows. Meaning: when someone enquires,
the welcome/nurture emails that were supposed to be cancelled **are never
actually cancelled — they still send.**

**Bug 2 — a failing email retries forever.**
`process-email-queue.js` marks a failed send `status = 'error'`. Same
constraint, same outcome: the update is rejected, the row stays `pending`, and
the next poll picks it up and tries again. A permanently broken email
(bad address, template error) is retried on every cron run, indefinitely.

### 2.5 What is missing entirely

- **No suppression check at send time.** There is an unsubscribe page and an
  unsubscribe link in templates, but nothing consults a suppression list
  before sending. Unsubscribed and hard-bounced addresses keep getting mail.
- **No global frequency cap.** Each path dedupes itself locally; nothing stops
  the *combination* — gallery email + 10-min note + 24h nurture + daily
  property alert + welcome series — from stacking up on one person.
- **No quiet hours.** Email sends whenever the cron happens to fire.
- **Scheduler drift.** The frequent jobs run every 15 minutes via GitHub
  Actions, so a "10-minute" follow-up actually lands 10–25 minutes later.
- **Inconsistent endpoint auth.** `process-email-queue` requires
  `Bearer CRON_SECRET`; `process-gallery-followups` treats *any* plain GET as
  authorised — meaning anyone on the internet can trigger it.

None of this is a disaster — the site works. But it is four systems held
together by hand, and "perfect" means replacing them with one.

---

## 3. The mental model — seven primitives

The entire engine is seven ideas. Everything else is plumbing.

1. **Event** — an immutable fact: *"contact X unlocked gallery Y at 14:03."*
   Events already exist, in the `activities` table. We never edit them.
2. **Journey** — a declarative rule: *"when an event of type E happens, send
   template T, D minutes later."* A journey is config, not code.
3. **Debounce** — do not act on an event the instant it arrives. Wait D
   minutes, so related events have time to land.
4. **Batch** — collapse every event from the same person inside the window
   into **one** email that references **all** of them.
5. **Dedupe / idempotency** — each (person, journey) pair gets its email at
   most once per cooldown. The processor is safe to run every minute, and
   safe to run twice at once.
6. **Supersede / cancel** — a higher-intent event cancels a lower-intent
   pending email. An enquiry cancels a "did you have questions?" follow-up.
7. **Guard-rails** — suppression list, frequency cap, quiet hours, kill
   switch. Checked at the moment of send, applied to every journey uniformly.

If those seven hold, the system is "perfect" in the sense you mean: it never
spams, never double-sends, never sends at 3am, never sends to someone who
opted out, and always sends one tidy email instead of five.

---

## 4. Architecture

```
   Website forms & API routes
   (enquiry · unlock-drive · gallery-enquiry · save-search · newsletter)
            │  write an event
            ▼
   ┌──────────────────┐
   │   activities     │   the EVENT LOG — immutable source of truth
   └──────────────────┘
            │
            │  read by
            ▼
   ┌──────────────────┐
   │  journeys.js     │   declarative CONFIG — one entry per email type
   └──────────────────┘
            │
            ▼
   ┌─────────────────────────────────────────────┐
   │  processEmailEngine()                        │   polled every 60s
   │  a PURE FUNCTION over                        │
   │  (events, sends-so-far, suppressions, config)│
   │  → decides: send now / wait / batch /        │
   │             supersede / suppress / defer     │
   └─────────────────────────────────────────────┘
            │  writes outcome
            ▼
   ┌──────────────────┐
   │  email_queue     │   the OUTBOUND QUEUE + audit log
   └──────────────────┘
            │  send
            ▼
        Resend  ──────────────►  recipient
            │  delivery webhooks
            ▼
   ┌──────────────────┐      ┌──────────────────┐
   │ delivery_events  │ ───► │  suppressions    │
   │ (open/bounce/    │      │ bounces +        │
   │  complaint)      │      │ complaints +     │
   └──────────────────┘      │ unsubscribes     │
                             └──────────────────┘
```

The key design property: **the processor is a pure function.** Given the same
events, the same record of what has already been sent, the same suppression
list and the same config, it always produces the same decisions. It holds no
state of its own.

Idempotency therefore does not come from locks or from a job queue — it comes
from the **sends log**. Before the engine sends a journey's email to a
contact, it asks the queue: *"is there already a row for this (journey,
contact) inside the cooldown window?"* If yes, it does nothing. That single
check is why it is safe to poll every minute and safe to run two pollers at
once. (Section 9.7 adds a database-level unique index as a hard backstop.)

This is exactly the pattern `process-gallery-followups.js` already uses. The
engine is that pattern, generalised and given a config file.

---

## 5. Data model

Minimal, deliberate changes. The principle is *fix what is broken, add only
what is needed, break nothing that works.*

### 5.1 `activities` — keep as the event log

No structural change. It already records every meaningful action:
`floor_plan_requested` (342), `enquiry_submitted` (339), `gallery_enquiry`
(33), `search_saved` (8), `newsletter_signup` (23), plus email lifecycle
events. Add two indexes so the processor's scans stay fast as volume grows:

```sql
CREATE INDEX IF NOT EXISTS idx_activities_type_created
  ON activities (type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activities_contact_type
  ON activities (contact_id, type);
```

### 5.2 `email_queue` — keep, but fix the status constraint

This table already does double duty well: it is both the outbound queue
(`pending` rows the cron sends) and the audit log (post-hoc `sent` / marker
rows). Keep that. But the status constraint must be widened so the states the
code actually needs become legal:

```sql
ALTER TABLE email_queue DROP CONSTRAINT email_queue_status_check;
ALTER TABLE email_queue ADD CONSTRAINT email_queue_status_check
  CHECK (status = ANY (ARRAY[
    'pending',     -- queued, waiting for send_after / approval
    'approved',    -- (legacy — kept for back-compat)
    'sent',        -- handed to Resend successfully
    'rejected',    -- a human rejected it in the CRM
    'cancelled',   -- superseded by a higher-intent event; never sent
    'superseded',  -- a newer email of the same journey replaced it
    'expired',     -- too old to be worth sending (max-age guard)
    'error'        -- send failed; see error_detail
  ]));
```

Then add a few columns the engine relies on:

```sql
ALTER TABLE email_queue
  ADD COLUMN IF NOT EXISTS journey       text,   -- e.g. 'gallery_followup'
  ADD COLUMN IF NOT EXISTS dedupe_key    text,   -- e.g. 'gallery_followup:<contactId>'
  ADD COLUMN IF NOT EXISTS error_detail  text,   -- failure reason
  ADD COLUMN IF NOT EXISTS attempts      int DEFAULT 0;
```

`journey` supersedes the loose, inconsistent `trigger` text field (which today
holds 11 different ad-hoc values). `trigger` stays for back-compat; new code
writes `journey`.

The bare minimum to fix the two live bugs is just adding `cancelled` and
`error` to the constraint — that is **Phase 0** and ships on its own.

### 5.3 New table — `suppressions`

The single list the engine checks before every non-transactional send.

```sql
CREATE TABLE suppressions (
  email       text PRIMARY KEY,
  reason      text NOT NULL,   -- 'unsubscribe' | 'bounce' | 'complaint' | 'manual'
  scope       text NOT NULL DEFAULT 'all',  -- 'all' | 'marketing'
  created_at  timestamptz NOT NULL DEFAULT now(),
  note        text
);
```

### 5.4 New table — `delivery_events`

The sink for Resend delivery webhooks. Powers the dashboard and feeds
`suppressions` automatically.

```sql
CREATE TABLE delivery_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email_queue_id uuid REFERENCES email_queue(id),
  to_email       text,
  type           text NOT NULL,  -- delivered|opened|clicked|bounced|complained
  created_at     timestamptz NOT NULL DEFAULT now(),
  raw            jsonb
);
```

*Naming note: the database already has a table called `email_events`, used by
the CRM's Gmail-thread integration (it carries `gmail_thread_id` /
`gmail_message_id`). That table is unrelated to Resend delivery and is left
untouched — hence the new sink is `delivery_events`, not `email_events`.*

That is the whole schema change: two indexes, one widened constraint, four
columns, two small tables. Nothing existing is dropped or renamed.

---

## 6. The journey config — the heart of the system

Every automated email is one entry in `lib/email/journeys.js`. This file is
the thing you (or I, on your instruction) edit to change behaviour. No journey
needs its own code path ever again.

### 6.1 The shape of a journey

```js
{
  id: 'gallery_followup',          // unique; also the dedupe namespace
  on: 'floor_plan_requested',      // the activity type that triggers it
  delayMin: 10,                    // debounce: wait this long after the FIRST event
  batch: {
    by: 'contact',                 // one email per contact (not per property)
    windowMin: 10,                 // gather all trigger events within 10 min of the first
    collect: (events) => [...]     // → the list of properties to name in the email
  },
  cancelOn: ['enquiry_submitted','gallery_enquiry'],  // supersede if these happen
  cooldownDays: 30,                // at most one per contact per 30 days
  maxAgeMin: 120,                  // never send if the first event is older than this
  priority: 50,                    // higher wins if two journeys would fire at once
  template: 'gallery-followup',    // which React Email / HTML builder
  from: DYLAN, replyTo: DYLAN,
  transactional: false,            // false ⇒ subject to caps, quiet hours, suppression
  enabled: () => process.env.GALLERY_FOLLOWUP_ENABLED === 'true'
}
```

A journey with `delayMin: 0` and no `batch` is just an instant transactional
send. A journey with a big `delayMin` and a `batch` block is a debounced
digest. Same engine, same config, different numbers.

### 6.2 Every journey COP needs

This is the full catalogue. The engine runs all of them in one pass.

**Transactional — instant, exempt from caps & quiet hours:**

| Journey | Trigger | Delay | Notes |
|---|---|---|---|
| `gallery_delivery` | `floor_plan_requested` | 0 min | The photos/floor-plan email. They asked for it now — it sends now, never batched. |
| `enquiry_autoreply` | `enquiry_submitted` | 0 min | Dylan's personal reply. |
| `gallery_enquiry_reply` | `gallery_enquiry` | 0 min | Reply to a gallery-page enquiry; first-vs-repeat variant. |
| `team_notification` | any | 0 min | Internal only — never capped, never suppressed. |

**Lifecycle — debounced, batched, fully guard-railed:**

| Journey | Trigger | Delay | Batch | Cancels on |
|---|---|---|---|---|
| `gallery_followup` | `floor_plan_requested` | 10 min | per contact, 10-min window | enquiry |
| `enquiry_nurture_3` | `enquiry_submitted` | 3 days | — | a newer enquiry, a purchase |
| `enquiry_nurture_7` | `enquiry_submitted` | 7 days | — | a newer enquiry, a purchase |
| `enquiry_nurture_14` | `enquiry_submitted` | 14 days | — | a newer enquiry, a purchase |
| `welcome_1` | `newsletter_signup` | 0 min | — | — |
| `welcome_2` | `newsletter_signup` | 2 days | — | `enquiry_submitted` (upgrade to nurture) |
| `welcome_3` | `newsletter_signup` | 5 days | — | `enquiry_submitted` |
| `re_engagement` | 90 days of no activity | — | — | any new activity |

**Behavioural — scheduled scans, batched into digests:**

| Journey | Trigger | Cadence | Batch |
|---|---|---|---|
| `saved_search_match` | new property matches a saved search | daily scan | one digest per contact, all matches |
| `price_drop` | a watched property drops in price | daily scan | one email per contact, all drops |
| `new_listings_digest` | new properties added | weekly | one digest, all new homes |

### 6.3 What folds away

The current 24-hour `nurture-floor-plan` email (212 rows sent) **overlaps**
`gallery_followup` — both are "still interested in the home you looked at?"
notes to the same person about the same property. Recommendation: **retire
it.** The 10-minute Dylan note plus the enquiry nurture cover that intent
without a third touch. (This is a decision for you — Section 13.)

`gallery-enquiry.js`'s inline dedupe and `enquiry.js`'s inline day-3/7/14
scheduling both stop being special code — they become four ordinary journey
entries. `cancelPendingSequence()` stops being a function and becomes the
engine's standard `cancelOn` behaviour, which — unlike today — will actually
work.

---

## 7. The processor

One function, one loop, polled every 60 seconds. Pseudocode of the whole
thing:

```
for each journey J where J.enabled():

    events = activities WHERE type = J.on
                          AND created_at > now - lookbackWindow
    groups = group events by J.batch.by          (usually contact_id)

    for each group:
        firstAt = min(created_at in group)

        # ── debounce ──────────────────────────────────
        if now - firstAt < J.delayMin:   continue   # still inside the wait — let more arrive

        # ── max-age guard ─────────────────────────────
        if now - firstAt > J.maxAgeMin:  markExpired(); continue

        # ── dedupe / cooldown ─────────────────────────
        if queueHasRow(journey=J.id, contact, since=now-J.cooldownDays):
            continue                                  # already handled — never repeat

        # ── supersede / cancel ────────────────────────
        if activityExists(contact, type in J.cancelOn, since=firstAt):
            markCancelled(); continue

        # ── build the ONE email ───────────────────────
        payload = J.batch.collect(group)              # ALL the properties

        # ── guard-rails (skipped for transactional) ───
        if not J.transactional:
            if isSuppressed(contact.email):   markSuppressed(); continue
            if frequencyCapHit(contact):      defer();          continue
            if outsideQuietHours(contact):    defer();          continue

        # ── send ──────────────────────────────────────
        html = render(J.template, payload, contact.locale)
        sendViaResend(...)
        insertQueueRow(journey=J.id, contact, status='sent')    # ← this row IS the dedupe
```

Notes that make it bulletproof:

- **The marker row is the dedupe.** Writing a `sent` row to `email_queue`
  immediately after sending is what makes the next poll skip this contact.
  Suppressed / cancelled / expired outcomes also write a row (with that
  status) so the engine records *why* nothing was sent and never reconsiders.
- **One pass, all journeys.** A single endpoint handles the whole catalogue.
  One cron entry, not one per email type.
- **`?dry=1`** runs the entire loop and reports every decision it *would*
  make — sends nothing, writes nothing. Already implemented for gallery
  follow-ups; the unified engine keeps it.
- **Lookback window keeps every run tiny** — the processor only scans recent
  activity (a few hours), so each poll is a small, fast query.

---

## 8. Worked example — your exact scenario

A visitor, Maria, unlocks three property galleries in one browsing session.
Wall-clock walk-through, poller running every 60 seconds:

| Time | What happens |
|---|---|
| **14:00:00** | Maria unlocks **Property A**. → `floor_plan_requested` event written. `gallery_delivery` (delay 0) sends the **Property A gallery email instantly**. `gallery_followup` notes: first event for Maria, due at 14:10. |
| **14:03:00** | Maria unlocks **Property B**. → event written. **Property B gallery email sends instantly.** `gallery_followup` batch for Maria now holds {A, B}. |
| **14:08:00** | Maria unlocks **Property C**. → event written. **Property C gallery email sends instantly.** Batch now {A, B, C}. |
| **14:01–14:09** | Every minute the poller evaluates `gallery_followup` for Maria: firstAt = 14:00, less than 10 min elapsed → **not due, wait.** |
| **14:10:xx** | Poller: firstAt = 14:00, 10 min elapsed → **due.** No enquiry from Maria since 14:00. `collect` → [A, B, C]. Engine sends **one** email — *"Questions about the homes you've been viewing?"* — naming **A, B and C**, with a link to each. Marker row written. |
| **14:11 onward** | Poller: a `gallery_followup` row for Maria exists, inside the 30-day cooldown → **skip. Forever.** |

Maria receives: three gallery emails (one per thing she explicitly asked
for), then **one** follow-up covering all three. Not five emails. Not three
follow-ups. One. That is the behaviour you described — *"get it?"* — and it is
the default for every batched journey, not a special case.

**Variant — she enquires mid-window.** If Maria submits an enquiry at
14:06, the enquiry auto-reply sends instantly (its own transactional
journey). Then at 14:10 the engine sees an `enquiry_submitted` event dated
after 14:00, which is in `gallery_followup.cancelOn` → it marks the follow-up
**cancelled** and sends nothing. She gets the enquiry reply only. No double
contact. This is the "two emails" problem you disliked — solved structurally,
because the decision is made once, at send time, by one system that sees
everything.

---

## 9. Guard-rails — "autonomous with hard caps"

You chose autonomous sending. That is the right choice for speed, but it only
works if the cage is solid. These are the bars. They address, directly, your
standing worry about emails going out by accident.

### 9.1 Suppression list — never email someone who said stop

Before any non-transactional send, the engine checks `suppressions`. An
address lands there from three sources: the unsubscribe link, a Resend
**hard bounce** webhook, or a Resend **spam complaint** webhook. Bounces and
complaints suppress *everything* (`scope = 'all'`). An unsubscribe suppresses
marketing and lifecycle mail (`scope = 'marketing'`) but **not** a direct
transactional response to something the person just did — if they unlock a
gallery, they still get that gallery, because they just asked for it.

### 9.2 Frequency cap

No contact receives more than **N** engine-initiated lifecycle/behavioural
emails per rolling 7 days (suggested **N = 3**). Instant transactional emails
— the gallery they requested, the reply to their enquiry — do not count and
are never blocked. If the cap is hit, a lower-priority email is **deferred,
not dropped**: it waits and sends once the window clears.

### 9.3 Quiet hours

The engine only sends lifecycle/behavioural mail between **08:00 and 20:00**
in the contact's timezone (default `Europe/London` when unknown). A follow-up
that comes due at 02:00 waits until 08:00. Transactional mail is exempt — a
gallery requested at midnight arrives at midnight.

### 9.4 Cooldown

Per-journey, in config (`cooldownDays`). One gallery follow-up per person per
30 days; one re-engagement ever; etc.

### 9.5 Kill switch

One environment variable, `EMAIL_ENGINE_ENABLED`. Unset or not `'true'` → the
entire engine is a no-op. Each journey also has its own `enabled()` flag, so
you can switch journeys on one at a time as you gain confidence. This mirrors
the `GALLERY_FOLLOWUP_ENABLED` gate already protecting the gallery processor.

### 9.6 Dry-run & test allowlist

`?dry=1` — full evaluation, zero sends, a report of every decision. Safe to
run any time. `EMAIL_ENGINE_TEST_EMAILS='a@x.com,b@y.com'` — when set, only
those addresses receive real mail; every other contact is evaluated but left
completely untouched. This is how every new journey gets validated before it
faces real contacts.

### 9.7 Idempotency backstop

Beyond the marker-row check, a database unique index makes a double-send
*impossible* even if two pollers race:

```sql
CREATE UNIQUE INDEX idx_email_queue_dedupe
  ON email_queue (dedupe_key)
  WHERE dedupe_key IS NOT NULL AND status = 'sent';
```

If two engine runs ever try to send the same (journey, contact) at once, the
second `INSERT` fails on the constraint and that run safely does nothing. The
database itself enforces "once."

---

## 10. Scheduling & infrastructure

- **One poller, every 60 seconds**, hitting the unified engine endpoint.
  Primary: a cron-job.org job (reliable 1-minute cadence). Backup: the
  existing GitHub Actions `cron-frequent` workflow every 15 minutes. Running
  both is harmless — the engine is idempotent.
- **One endpoint for all journeys.** `process-gallery-followups` and
  `process-email-queue` collapse into `/api/email-engine`. (They can stay as
  thin aliases during migration.)
- **Daily behavioural scans** (`saved_search_match`, `price_drop`,
  `new_listings_digest`, exchange rates) stay on the `cron-daily` workflow.
- **Standardise endpoint auth.** Require `Bearer CRON_SECRET` (or a query
  token) on the engine endpoint. Stop treating a bare GET as authorised —
  that is the current `process-gallery-followups` exposure. Add the
  `CRON_SECRET` GitHub repository secret so the Actions workflows authenticate.

With a 60-second poll, "10 minutes after the first unlock" means 10–11
minutes — the tight timing you asked for.

---

## 11. Observability

You should be able to see what the engine is doing without reading logs.

- **A live dashboard** (a Cowork artifact, or a CRM admin page): emails sent
  today by journey, what is pending, what was suppressed or cancelled and
  why, the rolling bounce and complaint rate, and any frequency-cap deferrals.
- **Resend webhooks → `delivery_events`.** Delivered / opened / clicked /
  bounced / complained, all recorded against the originating `email_queue`
  row. Bounces and complaints auto-write to `suppressions`.
- **Every decision is auditable.** Because the engine writes a row for *every*
  outcome — sent, cancelled, suppressed, expired — `email_queue` filtered by
  `journey` is a complete history of why each contact did or did not get each
  email.

---

## 12. Migration plan — phased, each phase shippable

Nothing is ripped out in a big bang. Each phase is a commit that deploys on
its own and is safe to stop after.

**Phase 0 — fix the two live bugs.** Widen the `email_queue.status`
constraint so `cancelled` and `error` become legal. This alone makes
sequence-cancellation actually work and stops failed emails retrying forever.
~10 lines of SQL. No code change. Ship immediately, independent of everything
below.

**Phase 1 — build the engine core, dormant.** Add `lib/email/journeys.js`,
the processor, the dedupe/guard-rail helpers, and `/api/email-engine`.
`EMAIL_ENGINE_ENABLED` unset, so it does nothing. Nothing existing is touched.

**Phase 2 — migrate `gallery_followup`.** Re-express the already-built
gallery follow-up as a journey. Run the engine in `?dry=1` next to the live
processor; confirm identical decisions; then cut over and retire
`process-gallery-followups.js`.

**Phase 3 — migrate enquiry auto-reply + nurture.** Move the day-3/7/14
sequence and the auto-reply onto the engine. Delete the inline scheduling and
the broken `cancelPendingSequence()`. Cancellation now works for real.

**Phase 4 — migrate the welcome series**, and retire the overlapping 24-hour
`nurture-floor-plan` (pending your decision in Section 13).

**Phase 5 — migrate behavioural journeys** — saved-search matches, price
drops, the new-listings digest — onto the engine's batched-digest path.

**Phase 6 — guard-rails live.** Turn on suppression, frequency cap and quiet
hours engine-wide. Wire Resend webhooks into `delivery_events` and
`suppressions`. Build the dashboard.

**Phase 7 — delete the dead code.** Remove the old processors and the four
redundant send paths. The engine is now the only way an automated email
leaves COP.

Every phase is reversible: revert the commit, flip the env flag off.

---

## 13. Decisions for you before I build

Quick calls that shape Phase 1 onward:

1. **Retire the 24-hour `nurture-floor-plan` email?** It overlaps the
   10-minute `gallery_followup`. *Recommendation: retire it* — one follow-up,
   not two.
2. **Frequency cap number.** Suggested: 3 lifecycle emails per contact per 7
   days. Higher, lower, or per-journey?
3. **Quiet hours window & default timezone.** Suggested: 08:00–20:00,
   `Europe/London` when a contact's timezone is unknown.
4. **Does an unsubscribe also stop a gallery the person then requests?**
   *Recommendation: no* — a gallery they explicitly asked for is a
   transactional response, not marketing.
5. **One unified `/api/email-engine` endpoint, or keep the named ones as
   aliases?** *Recommendation: unify, alias during migration.*

---

## 14. Why this beats the "outbound OS"

The LinkedIn post sells a document. Its buyer still has to build everything in
it, by hand, and then run it by hand. It is a cold-*outbound* playbook —
spraying strangers — which is a different and frankly cruder problem.

This is the *inbound* version, and it is software, not a PDF:

- It runs itself, every 60 seconds, with no one watching.
- It physically cannot send the same person the same email twice.
- It collapses five would-be emails into one, automatically.
- It speaks four languages, because your contacts do.
- It knows which properties to put in front of which person, because that
  logic already lives in your database.
- It will not email someone who opted out, and it will not email anyone at
  3am.

Dan's customers get homework. You get a system. That is the difference
between a blueprint you buy and a blueprint you build with the codebase
already under you.

---

*Next step: confirm the five decisions in Section 13 and I will start with
Phase 0 — the two-bug fix — which is safe to ship on its own today.*
