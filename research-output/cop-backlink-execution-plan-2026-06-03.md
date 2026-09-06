# COP backlink execution — full input map across all 14 tasks
**Date:** 3 June 2026
**Purpose:** Before we start executing, surface every input / asset / decision needed across all 14 backlink tasks so David can provide them in one go rather than being interrupted 50 times.

---

## Shared inputs needed once, used across many tasks

These show up everywhere. Decide once, reuse forever.

### A. Brand assets

| Asset | Status | Used by | Notes |
|---|---|---|---|
| Company description — 30-word version | **Need David's input** | Crunchbase, Trustpilot-like, social bios | Should match site About copy |
| Company description — 100-word version | **Need David's input** | Most directories | |
| Company description — 250-word "boilerplate" | **Need David's input** | Press releases, Wikipedia draft, About | |
| Logo — square (1024×1024 PNG, transparent) | Need to confirm we have it | Every directory + Wikimedia photos | |
| Logo — horizontal (banner format) | Need to confirm | LinkedIn, etc. | |
| Brand colours (hex codes) | Have these already in styles | Design templates | |
| Tagline (one-liner) | **Need David's input** | Hero copy, social, directories | |

### B. Contact details

| Item | David's input |
|---|---|
| Primary email | `info@co-ownership-property.com` confirmed elsewhere — OK? |
| Phone (UK) | **Need a number** |
| Phone (Marbella / Spain) | **Need a number** |
| London address (street-level or just "London, UK"?) | **Decide** |
| Marbella address (street-level or just "Marbella, Spain"?) | **Decide** |
| Public-facing founder name | Already public on About Us (David Olsson). Confirm OK to keep on Crunchbase founder field. |

### C. People & accounts to create

| Account | Why | Email to register | Owner |
|---|---|---|---|
| Wikipedia editor account | Tasks #3, #18 | Recommend a non-COP-branded personal email (NOT info@cop). Wikipedia editing is personal-account culture | David personal |
| Wikidata account | Task #16 | Same as Wikipedia (can use one account for both) | David personal |
| Wikimedia Commons account | Tasks #4, #18 | Same | David personal |
| HuggingFace org | Task #15 | Can be brand-account `co-ownership-property` | Brand |
| Kaggle | Task #15 | Brand-account | Brand |
| GitHub org "co-ownership-property" | Tasks #15, #20 | Brand-account | Brand |
| F6S, BetaList, EU-Startups, YourStory, Crunchbase | Task #1 | Brand-account | Brand |
| LinkedIn company page | Task #1 | Already exists? Need to confirm + claim if not | Brand |
| Inman News, Property Reporter UK | Task #1 | Brand-account | Brand |
| HARO, Qwoted, Featured.com, SourceBottle | Task #2 (only if we keep #2) | Needs named human source | David personal |
| Substack OR Beehiiv OR Resend | Task #17 (newsletter) | Recommend Beehiiv (free, professional, AI integration) | Brand |

### D. Partner permissions (CRITICAL — gates several tasks)

Several tasks require redistributing photos and data from partners. Without written permission this is risky:

| Permission needed | From | For which tasks | Status |
|---|---|---|---|
| Permission to upload partner property photos under CC-BY-SA license | MYNE, Pacaso, &Hamlet, Vivla, Abitaro | #4 Wikimedia images, #18 Wikipedia image hijack | **Need to request** |
| Permission to publish aggregated price/inventory data publicly | Same partners | #6 Quarterly Index, Tier 5 State report, #15 datasets, #20 operators dataset | **Need to request** — most public data is already public, but a heads-up email is courteous and gets buy-in |
| Permission to mention partners by name in profiles + outreach | Same partners | #1 directory descriptions, #8 outreach emails | Already implicit in being a marketplace partner — but worth confirming for tone |

### E. Data assets you already have (no work needed)

| Asset | Source | Used by |
|---|---|---|
| MYNE portal data (113 properties) | `research-output/myne-portal-2026-06-01.json` | #6, #14, #15, #20, Tier 5 |
| COP properties.json (~330 properties) | `lib/properties.json` | Same |
| Rightmove vs MYNE sync data | `research-output/rightmove-listings-2026-06-02.json` | Tier 5 |
| August Collection deep research | `research-output/august-21-5-deep-analysis.md` | #20 operators dataset, Tier 5 |
| Terminology research (US vs UK) | `research-output/terminology-competitor-audit-2026-06-02.md` | Tier 5 |
| MYNE × COP audit | `research-output/myne-vs-cop-audit-2026-06-01.md` | Tier 5 |
| Portfolio-fractional players research | `research-output/portfolio-fractional-players-2026-06-02.md` | Tier 5, #20 |

---

## Per-task input map

### #1 — Directory submissions (start here)

| Need | Status |
|---|---|
| 30w / 100w / 250w descriptions | **From David** |
| Logo files (square + banner) | Confirm we have |
| Address: London + Marbella | ✓ chosen |
| Phone numbers | **From David** (UK + Spain) |
| Email contact | Confirm: `info@`? `hello@`? |
| Founding year for COP | **From David** |
| Industry tags / categories | I can draft, you approve |
| Crunchbase founder name | David Olsson (already on About Us) — confirm OK |
| LinkedIn company page — exists already? | Need to check |

**Skipped this round:** Trustpilot, Glassdoor, Product Hunt, Google Business Profile, BBB (all per "skip the ones that surface negative stuff").

**Time:** ~3 hours once we have the inputs.

---

### #2 — HARO / Qwoted / Featured.com

**Major flag:** This task only works if there's a named, public-facing human source. You chose "lower profile" for #1 which logically extends here. Options:

| Approach | Effectiveness |
|---|---|
| Drop #2 entirely | Lose the FT/NYT-tier link channel but stay low-profile |
| David as named source despite lower-profile-elsewhere | Most effective; David's already named on About Us so this isn't a step change |
| Use brand-only attribution ("according to Co-Ownership Property") | Some journalists accept; lower hit rate |

**From David:** decision on which approach. If named-source route: short bio (50w), areas of expertise (5-6 topics), credentials to cite.

---

### #3 — Wikipedia citation campaign

**Need to provide:**
- A Wikipedia editor account (David personal, non-COP email)
- ~5 hours of unrelated edits over a few weeks to build reputation (typos, expansions, formatting fixes)
- A list of first-party COP data points that could plausibly source claims (e.g. "There are X fractional ownership operators in Europe", "Average share price for European luxury fractional is €X", etc.)

**My contribution:**
- Identify the specific Wikipedia articles + paragraphs that need citations and where COP data would fit
- Draft the citations in proper Wikipedia format
- Monitor for reversion

---

### #4 — Wikimedia Commons + Unsplash + Pexels image uploads

**Need to provide:**
- **Partner permission to upload property photos under CC-BY-SA** (the big gate)
- Selection of 50-100 best property photos
- Photographer credit decision (COP? Original photographer? Both?)

**My contribution:**
- Upload via Wikimedia Commons API or manual
- Tag with proper metadata
- Submit to Unsplash + Pexels with COP attribution

---

### #6 — Quarterly Co-Ownership Property Index (medium build)

**Need to provide:**
- Partner heads-up email (courtesy) — "we're aggregating public data into a quarterly market index, here's the URL"
- David's review of methodology + first draft
- Decision on publishing cadence: quarterly Q1/Q2/Q3/Q4 or rolling monthly?
- Decision: do we publish under "COP Research" sub-brand or main COP brand?

**My contribution:**
- Aggregate data from MYNE portal pull, properties.json, Pacaso scrape, August public listings, 21-5 public, MyHomes public
- Design template (PDF + web)
- Write commentary/analysis
- Build distribution list (~100 real-estate journalists)
- Draft press release

**Time:** First report ~30 hours (mostly mine, ~3-4 hours of David review). Quarterly updates ~12 hours each.

---

### #8 — Reverse competitor backlink mining + outreach

**Need to provide:**
- Outreach email sender address (David personal? `david@co-ownership-property.com`? `partnerships@`?)
- David's signature block
- Decision: how many emails per week (50? 100? 25?)
- Approval of the email template before bulk send

**My contribution:**
- Pull competitor backlinks via Ahrefs Webmaster (free tier)
- Filter to ~500 high-priority targets
- AI-draft personalised emails
- Track responses in Google Sheet

---

### #13 — AI engine optimisation

**Need to provide:**
- Approval of expanded `llms.txt` and `llms-full.txt` (I'll draft, you sign off)
- IndexNow API key (free, but need to generate)
- Confirmation we want FAQPage schema on compare/, glossary/, blog/ pages

**My contribution:**
- Write content
- Add schema
- Wire IndexNow

**Time:** ~8 hours.

---

### #14 — 200 AI-bait Q&A pages

**Need to provide:**
- Approval of the 200-question list before generation
- Decision on URL structure: `/answers/[slug]/` or `/faq/[slug]/` or `/q/[slug]/`
- Decision on byline (COP brand vs named author)

**My contribution:**
- Generate question list via AI from search data + competitor Q&A
- Generate 200 pages (AI-drafted, human-reviewed)
- Add schema
- Internal linking

**Time:** ~100 hours total (most AI-assisted, ~15-20 hours of David review).

---

### #15 — Submit COP data to AI training datasets

**Need to provide:**
- HuggingFace + Kaggle + GitHub accounts (brand-level)
- License decision: **CC-BY 4.0** (recommended — requires attribution to COP, allows free reuse)
- Approval of dataset README + schema

**My contribution:**
- Format aggregated data as CSV/JSON
- Write dataset documentation
- Publish to all three platforms
- Submit sitemap to Common Crawl

**Time:** ~6 hours.

---

### #16 — Wikidata entries

**Need to provide:**
- Wikidata account (can be same as Wikipedia)
- COP key facts: founding date, founders' names, HQ, industry classification, official websites, social profiles

**My contribution:**
- Create COP entry
- Create entries for MYNE, Pacaso, Vivla, &Hamlet, August Collection, 21-5, MyHomes, Paradyse (most don't exist yet)
- Cross-reference them all

**Time:** ~6 hours.

---

### #17 — "Co-Ownership Weekly" newsletter

**Bigger commitment — needs an honest discussion.** This isn't a one-off task; it's a weekly publishing rhythm.

**Need David's input:**
- Time commitment: realistically 3-5 hours per issue ongoing forever. Are you up for that?
- Platform: Beehiiv vs Substack vs Resend (all free for first 2.5k subscribers)
- Author byline: COP brand? Named editor? Anonymous "the COP team"?
- Initial subscriber list: who do we seed it with?
- First-issue date: a Friday in next 4 weeks?

**My contribution:**
- Set up the platform
- Build the template
- Draft each issue (David approves + sends)

---

### #18 — Wikipedia destination article image hijack

Same image-permission gate as #4. Once we have partner permission, this is mostly my work.

**My contribution:**
- Identify 20-30 destination Wikipedia articles where a COP-attributed photo would improve the article
- Upload + propose insertion
- Monitor for reversion

**Time:** ~6 hours over 4 weeks (need to space out the edits).

---

### #20 — Public "Fractional Ownership Operators 2026" dataset

**Need David's input:**
- License decision (CC-BY recommended)
- Decision: maintain monthly? Quarterly?

**My contribution:**
- Aggregate from existing research docs (already have most of it)
- Publish to GitHub
- Try to get a Wikipedia "List of fractional ownership operators" article created (or expand existing) citing this dataset

**Time:** ~10 hours initial + ~2 hours/month maintenance.

---

### #21 — Public directory of fractional real-estate agents

**Need David's input:**
- Decision: do you actually want to surface competitors here, even with a link back? Some agents won't want to be listed; some you might not want to promote.
- Submission form: should agents apply? Or curated-only?
- Verification: how do we confirm they're legitimate fractional specialists?
- Privacy: what data do we expose publicly (email? phone? just website)?

**My contribution:**
- Build the page (Next.js component, similar pattern to /partners/)
- Outreach to known agents to seed the directory

**Time:** ~15 hours initial.

---

### Tier 5 — "The State of Co-Ownership 2026" report (the big bet)

**Need David's input:**
- Approval of methodology + first full draft
- Decision: launch date? Recommend mid-July to align with peak European summer trip-buying season
- Distribution budget: $300-500 for press release wire (PR.com, PRNewswire one-off)
- Designer: I can do AI-assisted design or you can hire a designer (~$1-3k for a polished 60-page PDF)
- Embargo policy: do we share with select journalists 1 week before public release?

**My contribution:**
- Aggregate + synthesise all existing research
- Write the report (60-100 pages)
- Build the public web version
- Build the journalist distribution list
- Draft press release + personalised pitch emails

**Time:** First report ~40 hours of focused work, mostly mine. ~6-8 hours of David review.

---

## Critical-path dependencies

```
PARTNER PERMISSIONS  →  unlocks #4, #18, #6, #15, #20, Tier 5
                          (everything that uses partner data/photos publicly)

WIKIPEDIA EDITOR     →  unlocks #3, #18 (the AI-citation-leverage tasks)
ACCOUNT BUILDING

BRAND ASSETS         →  unlocks #1, #16, plus all directory work
(descriptions, logo)

DAVID'S NAMED        →  unlocks #2 (HARO) — currently on the fence
SOURCE DECISION

NEWSLETTER PLATFORM  →  unlocks #17 ongoing
```

## Suggested input batches

Rather than 14 separate decisions, here are the **3 batches** I need from you to unblock everything:

### Batch A — Brand basics (5 min to answer)
1. Tagline (one-liner that captures COP's positioning)
2. UK phone number
3. Marbella phone number
4. Founding year of COP
5. Logo files — do we have square + banner versions ready to use? (I can check the codebase if so)

### Batch B — People + accounts (10 min)
6. HARO decision — drop it, or keep David as named source despite lower-profile preference elsewhere?
7. Are you OK creating personal Wikipedia + Wikidata + Wikimedia accounts? (One account works for all three)
8. Newsletter — are you up for the 3-5 hour/week ongoing commitment for #17? (Honest answer is fine — if no, we drop it cleanly)

### Batch C — Partner permissions (the big gate, 1-2 weeks if MYNE/Pacaso are slow to respond)
9. Should I draft the partner-permission email for you to send? Covers:
   - Permission to use property photos in Wikimedia Commons + Unsplash + Pexels under CC-BY-SA
   - Heads-up that we're aggregating public price data into a quarterly index
   - Mention their brand name in directory descriptions

---

## What I can do alone (no inputs needed)

These I can start on TODAY without waiting on you:

- **#3 prep**: identify the specific Wikipedia articles + paragraphs where COP could plausibly add value (no edits yet — just the audit)
- **#6 prep**: build the underlying dataset for the quarterly index (aggregate from existing research)
- **#8 prep**: pull competitor backlinks, build the prioritised outreach list (no emails sent yet)
- **#14 prep**: draft the 200-question list for your review before generating pages
- **#16 prep**: research what fields each operator's Wikidata entry needs (no edits yet)
- **#20 prep**: structure the operators dataset (no publishing yet)
- **Tier 5 prep**: outline the State of Co-Ownership report structure

That's ~10 hours of background work I can do today while you think about the input batches. Then once the inputs land, execution accelerates dramatically.

---

## My recommendation on order

Now that I've mapped the dependencies, I'd revise the "quick wins first" order slightly:

**Week 1 — what we can do without partner permission:**
1. #1 Directory submissions (needs only your Batch A inputs)
2. #16 Wikidata entries (needs Wikipedia account)
3. #13 AI optimisation (`llms.txt` expansion + schema — pure code, no inputs needed)
4. #3 Wikipedia reputation-building edits start (David makes 30 unrelated edits over 4 weeks)

**Week 2-3 — once partner permission lands:**
5. #4 Wikimedia image uploads
6. #18 Wikipedia image hijack
7. #15 AI dataset publishing

**Week 4-6 — the medium build:**
8. #14 AI-bait Q&A pages (200 pages)
9. #8 Reverse competitor outreach
10. #6 First quarterly index publish

**Week 8-12 — the big bet:**
11. Tier 5 State of Co-Ownership report

**Maybe-never (decide later):**
- #2 HARO (depends on named-source decision)
- #17 Newsletter (depends on time commitment)
- #20 Operators dataset (low priority — bundle into Tier 5)
- #21 Agents directory (low priority + competitive concerns)

---

## Bottom line

**Give me Batches A + B (under 15 minutes of your time) and I can start executing #1, #16, #13, and start prepping #3 immediately.** Batch C (partner permission) is the gate for the bigger plays; that email can go out this week if you approve a draft.
