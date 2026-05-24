# What happens when someone contacts you

*A complete, plain-English map of every way a visitor can reach Co-Ownership
Property from the website — and exactly what the system does in response, in
every scenario, including when someone does several things.*

*Accurate as of 25 May 2026.*

---

## The five entry points — at a glance

| # | Visitor does this | They instantly receive | A follow-up later? |
|---|---|---|---|
| 1 | Unlocks a property photo gallery | The gallery email | Yes — one batched follow-up ~10 min later |
| 2 | Submits an enquiry (property or general) | A personal reply from Dylan | No |
| 3 | Submits an enquiry from a gallery page | A personal reply from Dylan | No |
| 4 | Signs up to the newsletter | The welcome email | No |
| 5 | Saves a property search / sets an alert | An alert-confirmation email | Only when a matching new property is listed |

Every entry point also sends **one internal notification to your team**. Those
are never seen by the customer. Nothing else is ever sent automatically.

---

## Part 1 — Each entry point in detail

### 1. Gallery unlock

**Visitor did:** filled in the "see the photos" form on a property page.

**Saved to your CRM:** contact created/updated · a lead linked to that
property · activity `floor_plan_requested` · lead score **+10**.

**Instantly receives — the gallery email**
- **Subject:** `Your Photo Gallery — [property name]`
- *"Thank you for your interest. As requested, we've put together the complete
  photo gallery for the property below."*
- The main button opens the **gallery page** for that property; up to 3
  similar properties are suggested below.

**Your team gets:** an internal note — `Floor Plan Request — [name]`.

**Then ~10 minutes later — the gallery follow-up** (full logic in Part 3).

### 2. Enquiry — property or general

**Visitor did:** submitted the enquiry form (on a property page = property
enquiry; elsewhere = general enquiry).

**Saved to your CRM:** contact created/updated · a lead · activity
`enquiry_submitted` · lead score **+20**.

**Instantly receives — a personal reply from Dylan**
- **Subject:** `Thanks for your enquiry`
- A plain, personal note — no branding, no images:

  > Hi [First name],
  >
  > Thanks for your enquiry about [property]! *(or, general: Thanks for
  > getting in touch!)*
  >
  > Let me know if you have any questions you'd like me to answer — about the
  > property, the co-ownership model, or anything else.
  >
  > I'll be in touch shortly.
  >
  > Dylan

**Your team gets:** an internal note — `New Enquiry — [property] from [name]`
— with the full enquiry details.

**Follow-up:** none.

### 3. Gallery-page enquiry

**Visitor did:** submitted the enquiry form *on a gallery page* (phone number
required here).

**Saved to your CRM:** contact created/updated · a lead · activity
`gallery_enquiry` · lead score **+20**.

**Instantly receives — a personal reply from Dylan**
- **Subject:** `Your enquiry — [property]`
- A plain personal note:

  > Hi [First name],
  >
  > Thanks for your interest in the [property]!
  >
  > I'd love to connect you with the specialist team behind it — before I do,
  > do you have any questions I can pass along to them about the property or
  > the co-ownership model?
  >
  > Once I hear back, I'll let the team know so they can be in touch with you
  > directly.
  >
  > Dylan

**Your team gets:** an internal note — `Gallery Enquiry — [name] — [property]`.

**Follow-up:** none.

**Repeat enquiries:** every gallery enquiry gets this same fresh reply — a
second enquiry is never treated as a "follow-up" to an earlier one, because it
may well be a different property (and a different partner). The only exception:
an identical enquiry for the *same* property within 60 days is not answered
twice.

### 4. Newsletter signup

**Visitor did:** entered their email in a newsletter signup box.

**Saved to your CRM:** contact created/updated · activity `newsletter_signup` ·
added to the Resend mailing audience · no score change.

**Instantly receives — the welcome email**
- **Subject:** `Welcome — you're on the list`
- A branded email introducing what Co-Ownership Property does.

**Your team gets:** an internal note — `New Newsletter Subscriber — [email]`.

**Follow-up:** none.

### 5. Saved search / property alert

**Visitor did:** used the "save this search / alert me" form.

**Saved to your CRM:** the saved search stored (one per email — re-saving
updates it) · contact created/updated · a lead · activity `search_saved` ·
lead score **+5**.

**Instantly receives — an alert confirmation**
- **Subject:** `Your property alert is set — we'll notify you of new listings`
- A branded email confirming their criteria, with up to 3 matching properties.

**Your team gets:** an internal note — `Property Alert Set — [name]`.

**Follow-up:** only when a genuinely new matching property is added — the daily
alert job then emails them. No new property, no email.

---

## Part 2 — Doing the same thing several times

**Unlocks 2, 3 or more galleries in one visit**
Each unlock instantly sends its own gallery email (that's the photos they
asked for — they always get those). Then **one single follow-up**, ~10 minutes
after the *first* unlock, naming **every** property they looked at. Never one
follow-up per property.

**Unlocks galleries again days later**
They get the gallery email for each new unlock. But the follow-up is capped at
**one per person per 30 days** — a second batch of unlocks inside that month
does not trigger another follow-up.

**Submits two separate enquiries**
Each enquiry gets its own personal reply — two enquiries, two replies. (They
deliberately enquired about two things.) Submitting more than 3 in 5 minutes
is rate-limited and simply rejected.

**Submits two gallery-page enquiries**
Each gets its own reply — a second enquiry is treated fresh (it may be a
different property). An identical enquiry for the *same* property within 60
days is not answered twice.

**Saves a search again**
There is only ever one saved search per email address — re-saving overwrites
the old one and sends a fresh confirmation.

**Signs up to the newsletter again**
The contact record is updated; the welcome email may send again. Rapid repeat
submissions are rate-limited.

---

## Part 3 — The gallery follow-up, fully spelled out

After someone unlocks a gallery, the system waits **about 10 minutes**, then
sends **one** short personal note from Dylan:

- **Subject:** `Questions about [property]?` (one) or `Questions about the
  homes you've been viewing?` (several).

  > Hi [First name],
  >
  > Thanks for your interest in [property — or all the properties]!
  >
  > I'd love to connect you with the specialist team behind it — before I do,
  > do you have any questions I can pass along about the property or the
  > co-ownership model?
  >
  > Once I hear back, I'll let the team know so they can be in touch with you
  > directly.
  >
  > Dylan

**Every scenario:**

- **Unlocks one gallery, nothing else** → one follow-up ~10 min later.
- **Unlocks several galleries** → still **one** follow-up, naming all of them.
- **Unlocks a gallery, then enquires before the follow-up sends** → the
  follow-up is **cancelled**. They get the enquiry reply only — no follow-up.
- **Unlocks, and the follow-up has already gone out, then enquires** → they
  get the enquiry reply too. (Each was a separate action minutes apart; the
  cancellation only applies while the follow-up is still waiting.)
- **Enquires first, then unlocks a gallery afterwards** → they get the enquiry
  reply, the gallery email, and a follow-up ~10 min after the unlock.
- **Already had a follow-up in the last 30 days** → no new one.
- **More than 2 hours pass before the system processes the unlock** → the
  follow-up is treated as too late and is not sent.
- **The person has unsubscribed** → no follow-up (the email engine checks the
  suppression list before sending).

**Status:** this runs on a scheduled job — wired up and active. Today it runs
on a 15-minute cycle, so "10 minutes" is really 10–25. Once the email engine
is switched on (`EMAIL_ENGINE_ENABLED`) and the 1-minute poller is added, it
tightens to a true ~10 minutes. The wording and rules are identical either way.

---

## Part 4 — Doing several *different* things (combinations)

This is the part that matters most for "no spam." Here is exactly what a
visitor receives in the common mixed journeys:

- **Unlock a gallery → enquire on that gallery page** (the natural path:
  unlock to see photos, then enquire). They receive: the **gallery email**,
  then the **gallery-enquiry reply**. The gallery follow-up is **cancelled**
  because they enquired. Net: two emails, both wanted, no follow-up spam.

- **Unlock several galleries → submit a normal enquiry.** They receive: a
  gallery email per unlock, then the **enquiry reply**. The follow-up is
  **cancelled**. Net: the photos they asked for, plus one reply.

- **Submit an enquiry → later unlock a gallery.** They receive: the **enquiry
  reply**, the **gallery email**, and a **follow-up** ~10 min after the unlock.
  Three messages, but spread across two separate sessions/actions.

- **Newsletter signup → later an enquiry.** They receive: the **welcome
  email**, then later the **enquiry reply**. Two emails, two distinct actions.

- **Everything, over weeks** — each action is handled by its own rules above.
  The hard guarantees that stop spam: only **one** gallery follow-up per
  person per 30 days; multiple unlocks always **collapse into one** follow-up;
  any enquiry **cancels** a pending follow-up; unsubscribed people are skipped.

**The principle:** a visitor only ever gets (a) the thing they directly asked
for — the gallery, the reply to their enquiry — and (b) at most one gentle
follow-up. The system never sends the same person the same email twice, and
never sends two follow-ups.

---

## Part 5 — Edge cases

- **A bot fills the form** (hidden "honeypot" field) → silently accepted so
  the bot moves on; **nothing is saved and no email is sent**.
- **Too many submissions too fast** → rate-limited (e.g. 5 gallery unlocks or
  3 enquiries per 5 minutes); the visitor gets a "try again later" message and
  no email goes out.
- **The property can't be matched** to a listing → the gallery email still
  sends, with the link pointing to the full collection instead of a dead link.
- **A processing delay** means an unlock is handled more than 2 hours late →
  no follow-up (better silence than a stale message).

---

## Part 6 — Emails that are NO LONGER sent

Deliberately retired so visitors get a clean, non-spammy experience:

- The 24-hour "Still thinking about it?" email after a gallery unlock.
- The day-3 / day-7 / day-14 nurture sequence after an enquiry.
- The day-3 and day-7 welcome emails (Welcome 1 still sends).

Nothing from this list goes out. They may return later as properly-built
journeys in the email engine.

---

## Part 7 — Where to watch all of this

Two places, same live data:

- **Your admin → the Emails tab** (`co-ownership-property.com/admin/emails`) —
  every email, who, when, status. Behind your admin login.
- **The Cowork "Email Activity" dashboard** in the Cowork sidebar.

**Sent** = delivered. **Stopped** = the system deliberately held an email back
(a duplicate prevented, a follow-up cancelled because the person enquired, a
retired email switched off) — the spam protection working, not a fault.
**Failed** is the only status worth a look, and it currently sits at zero.
