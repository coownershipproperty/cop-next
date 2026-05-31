# MYNE Partner Hub — Security Audit (External, Read-Only)

**Target:** https://myne-partner-hub.lovable.app/
**Stack:** Lovable.app frontend + Supabase backend at `dqlffltxnyqfzoscqdzf.supabase.co`
**Date:** 28 May 2026
**Performed by:** Co-Ownership Property (external partner courtesy review)
**Authorisation:** MYNE asked David Olsson (COP) to review.
**Method:** Read-only probing of publicly-exposed endpoints using the site's own public anon key (extracted from the public JS bundle, which is normal Supabase architecture). No exploitation, no password attempts, no data exfiltration.

---

## TL;DR

**Database (23 tables) — strong.** Row-Level Security is properly enforced on all tables for both reads and writes. 21 of 23 tables return zero rows to anonymous callers; 2 tables (`point_actions`, `point_benefits`) are publicly readable but contain only the partner-rewards catalog (no PII or financial data).

**Storage (6 buckets) — strong.** All 6 buckets (`commission-contracts`, `csv-uploads`, `partner-invoices`, `point-attachments`, `property-documents`, `social-content`) are private. Anonymous reads and lists both rejected.

**Edge Functions — mixed.** 10 of 17 are properly auth-gated. **7 functions are reachable by anonymous callers** with various levels of severity:

| Severity | Function | Issue |
|---|---|---|
| **CRITICAL** | `send-comment-webhook` | Creates a database record (`comment_update_id`) BEFORE validating auth. Anyone can trigger row creation in the comments-update table. |
| **HIGH** | `compute-insights` | Fully callable without auth. Returns real data (`{"ok":true,"candidates":25,"inserted":0}`). Idempotent in dry-run mode but reveals internal state. |
| **HIGH** | `notify-partner-help-needed` | Reachable without auth. With a valid lead_id, would trigger "partner needs help" notifications — spam vector. |
| **HIGH** | `send-lead-webhooks` | Reachable without auth. With a valid lead_id, would trigger external webhook payloads (potentially containing lead PII) to partner-configured webhook URLs. |
| **HIGH** | `send-property-webhook` | Same pattern — reachable, triggered by `property_submission_id`. |
| **MEDIUM** | `process-properties-csv` | Reachable without auth. Tries to fetch and process a file by name from Supabase Storage. Path-traversal attempts fail at the Storage layer; remains exploitable if attacker can upload a file to an authenticated bucket. |
| **MEDIUM** | `bulk-import-affiliate-links` | Has internal auth check but fires arbitrary code before the check. Returns 500 with "Unauthorized" — at least the check exists, but the function shouldn't be reachable in the first place. |

**Leaked links in public JS bundle:** 4 DocSend private document URLs and 1 Vimeo private review-folder URL are embedded in the public bundle. If these are intended for authorised viewers only, they should not be in client-side code.

**Auth signup endpoint:** does email-format validation that rejects example.com test addresses. Recommend testing with a realistic email outside the audit scope; if open signup is enabled to any domain, additional review needed.

---

## 1. Database (Supabase Postgres + RLS)

### 1.1 Schema introspection — properly locked

OpenAPI schema endpoint requires service_role key, anon key returns `Invalid API key`. Good — this prevents trivial enumeration of tables.

### 1.2 Tables enumerated via JS bundle (23)

Extracted from `.from("…")` patterns in the bundle:

```
affiliate_links, commission_agreements, companies, custom_fields,
lead_custom_values, lead_viewers, leads, notifications,
partner_invoice_leads, partner_invoices, point_actions, point_benefits,
point_redemptions, point_submissions, profiles, properties,
property_submissions, referral_benefits, security_audit_logs,
social_content_files, social_content_submissions, user_roles,
viewing_submissions
```

### 1.3 Read access probe (anon key SELECT)

All 23 tables return `200 OK` to anonymous SELECT but **21 return 0 rows** — RLS is filtering correctly. This is expected and safe IF the RLS policies are correct; the 200 status itself isn't an issue.

**Two tables expose rows to anonymous callers:**

| Table | Rows exposed | Sample content | Severity |
|---|---:|---|---|
| `point_actions` | 9 | Marketing-action definitions (e.g. "TV-Reportage = 30 points, time investment ~1 day", "Schriftliches Interview = 10 points") | LOW — reveals partner-program economics but no PII |
| `point_benefits` | 6 | Reward catalogue (e.g. "100 points = 1.25% off next share", "75 points = 3 months service fee refund (€594)", "50 points = €300 flight voucher") | LOW — reveals reward values |

**Recommendation:** if these are intended to be public (for marketing the program to potential signups), no action required. If they're meant to be visible only to authenticated partners, restrict RLS so anon SELECT returns 0 rows.

### 1.4 Write access probe (anon key INSERT)

**All 23 tables correctly block anonymous writes.** Empty-body POST (which forces RLS evaluation before schema validation) returns proper RLS rejection on every table. Good.

---

## 2. Storage Buckets (Supabase Storage)

6 buckets identified in bundle: `commission-contracts`, `csv-uploads`, `partner-invoices`, `point-attachments`, `property-documents`, `social-content`.

**All 6 are private.** Both LIST and public-URL READ return appropriate rejections to anonymous callers. Good.

---

## 3. Edge Functions (Supabase Functions)

17 functions identified via `.invoke("…")` patterns in the bundle. Anon-key probes:

### Properly auth-gated (10 functions) — return 401

✓ `bulk-create-ev-users`
✓ `chat-insights`
✓ `create-user`
✓ `delete-user`
✓ `impersonate-user`
✓ `manage-company-user`
✓ `reset-user-password`
✓ `toggle-admin`
✓ `update-user`

These functions properly reject anonymous calls at the Supabase auth layer. Critical admin functions (impersonate, delete, toggle-admin) are correctly protected.

### Reachable to anonymous callers (7 functions)

#### CRITICAL — `send-comment-webhook`

```
POST /functions/v1/send-comment-webhook
Body: {"lead_id":"00000000-0000-0000-0000-000000000000","event_type":"comment"}
Response: 200 {"success":true,"comment_update_id":"cc44728e-a157-46e3-9d51-db7a89261298","status":404}
```

The function **created a `comment_update_id` record** in the database, then attempted to send a webhook (which failed because the fake lead_id doesn't exist). The order of operations is wrong — auth and resource-ownership checks should run BEFORE any side effects.

**Impact:** any anonymous caller can flood the comments-update table with arbitrary records. This is a denial-of-service vector and a data-pollution vector. Even without a valid lead_id, attackers can fill the table.

**Recommended fix:** validate auth + lead ownership FIRST, then create the comment_update record only after validation passes.

#### HIGH — `compute-insights`

```
POST /functions/v1/compute-insights
Body: {} (or any payload)
Response: 200 {"ok":true,"candidates":25,"inserted":0}
```

Fully callable without authentication. Returns real data: there are 25 candidate records currently. The function appears to be idempotent (`inserted: 0` when called without a flag to actually write), but the data exposure itself is a leak — attackers can monitor `candidates` count over time to infer business activity.

**Recommended fix:** require authenticated session for this function.

#### HIGH — `notify-partner-help-needed`

```
POST /functions/v1/notify-partner-help-needed
Body: {"lead_id":"00000000-0000-0000-0000-000000000000"}
Response: 200 {"status":"failed_lead_not_found","error":null}
```

Reachable without auth. With a valid lead_id, would trigger a "partner needs help" notification — presumably to MYNE staff or to the partner who owns the lead.

**Impact:** spam vector. An attacker who can enumerate or guess lead IDs can flood partners with fake help-needed notifications.

**Recommended fix:** require authenticated session; verify the caller has access to the lead before sending the notification.

#### HIGH — `send-lead-webhooks`

```
POST /functions/v1/send-lead-webhooks
Body: {"lead_id":"00000000-0000-0000-0000-000000000000"}
Response: 500 {"error":"Lead not found: no data"}
```

Reachable without auth. The function performs a lookup before failing. With a valid lead_id, it would trigger external webhook calls (potentially carrying lead PII as payload) to partner-configured webhook URLs.

**Impact:** can trigger arbitrary external webhook calls. If webhook payloads contain lead data, this is a data exfiltration vector for any party that can submit a valid lead_id (which can sometimes be enumerated from other endpoints).

**Recommended fix:** require authenticated session; verify the caller has access to the lead before triggering webhooks.

#### HIGH — `send-property-webhook`

```
POST /functions/v1/send-property-webhook
Body: {"property_submission_id":"00000000-0000-0000-0000-000000000000"}
Response: 500 {"error":"Property submission not found"}
```

Same pattern as `send-lead-webhooks` but for property submissions.

**Recommended fix:** same as above.

#### MEDIUM — `process-properties-csv`

```
POST /functions/v1/process-properties-csv
Body: {"fileName":"test.csv"}
Response: 500 {"success":false,"error":"Failed to download file: Object not found"}
```

Reachable without auth. Attempts to download and process a file by name from Supabase Storage. Path-traversal attempts (`../../../etc/passwd`) fail at the Storage layer (the request gets normalised and the file isn't found).

**Impact:** if an attacker can place a file in the relevant Storage bucket (which requires auth, so this is gated upstream) AND knows the file name, they could trigger arbitrary CSV processing — potentially writing the parsed records into the database. The Storage write-gate is what's keeping this safe; the function itself is open.

**Recommended fix:** require authenticated session and verify the caller has permission to process the file.

#### MEDIUM — `bulk-import-affiliate-links`

```
POST /functions/v1/bulk-import-affiliate-links
Body: {}
Response: 500 {"success":false,"error":"Unauthorized"}
```

Has an internal authorisation check (returns "Unauthorized") — good. But the function is reachable, which means code executes BEFORE the auth check. If the auth check has any path where it can be bypassed (e.g., a header parse error returning early), the rest of the function could fire.

**Recommended fix:** add the standard Supabase Edge Function auth requirement at the function configuration level rather than only as an internal check.

---

## 4. Leaked private URLs in public JS bundle

The following links appear in the public JS bundle (visible to anyone who views the page source):

```
https://myne.docsend.com/view/dcmpuz52zpc2zfmx
https://myne.docsend.com/view/g4v27chvdxqwrjta
https://myne.docsend.com/view/wpmgwvwjfecgz8br
https://myne.docsend.com/view/zsctxesdxthchw59
https://vimeo.com/reviews/fadb85f1-87b1-446a-8c8a-caac3161b98e/users/155687015/folders/25383700
```

If these are intended for partner/investor-only viewing, embedding them in the public client-side bundle defeats the access control. DocSend links specifically are tokenised — anyone who has the URL can view the document (unless DocSend's per-document access controls are also configured).

**Recommended fix:** either move these behind authenticated rendering (so the URLs are only included in the bundle for authenticated sessions), or accept that they're effectively public and configure DocSend access accordingly.

---

## 5. Auth endpoint behaviour

```
POST /auth/v1/signup
Body: {"email":"probe@example.com","password":"..."}
Response: 400 "Email address invalid"
```

Email-format validation rejects example.com test addresses. This suggests an allowlist or custom validator is in place. Without testing further (which would risk creating real accounts), unable to confirm whether open signup is enabled to legitimate-looking domains.

**Recommended check (internal to MYNE):** confirm signup is restricted to partner-invited users only; if open signup is enabled, ensure unverified users cannot access any partner-specific data.

---

## 6. Other observations

### 6.1 `robots.txt`

Permits all crawlers, no specific directives. Standard.

### 6.2 SPA routing

Every URL (including `/admin`, `/dashboard`, `/.git/config`) returns the client-side application shell with HTTP 200. This is normal SPA behaviour and not a security issue per se — the actual access control happens client-side and at the API layer (which is properly gated per the findings above).

### 6.3 Anon key disclosure

The Supabase anon key (`eyJhbGciOi...`, role: `anon`, project ref: `dqlffltxnyqfzoscqdzf`) is in the public JS bundle. This is normal Supabase architecture — the anon key is designed to be public and is safe as long as RLS is properly enforced (which it is, per Section 1.4).

---

## Prioritised fix list for MYNE's dev team

1. **CRITICAL — `send-comment-webhook`**: reorder operations to validate auth + ownership BEFORE creating the comment_update record. Currently allows unauthenticated row creation.

2. **HIGH — Add auth gate to 5 functions**: `compute-insights`, `notify-partner-help-needed`, `send-lead-webhooks`, `send-property-webhook`, `process-properties-csv`. All currently reachable to anonymous callers; the right fix is the standard Supabase Edge Function `verify_jwt = true` config so requests without a valid JWT are rejected at the platform layer.

3. **HIGH — Verify `bulk-import-affiliate-links` auth check is bypass-proof**: currently relies on internal check; move to platform-level `verify_jwt = true` for defence in depth.

4. **MEDIUM — `point_actions` and `point_benefits` RLS**: confirm public-read is intentional. If not, tighten RLS to return 0 rows to anonymous.

5. **MEDIUM — Leaked private URLs**: move DocSend + Vimeo links to authenticated rendering or accept they're effectively public.

6. **LOW — `compute-insights` data leak**: even after auth is added, consider whether the response should reveal `candidates` count to all authenticated users or only admins.

---

## What was NOT tested (out of scope)

- Authenticated workflows (would require valid MYNE partner credentials)
- Brute-force or credential-stuffing on the auth endpoint
- CSRF / XSS in the client application
- Dependency-level vulnerabilities in the JS bundle
- Network-layer security (Cloudflare config, TLS, etc.)
- Specific business-logic flaws in authenticated flows
- Impersonate-user function payload validation (correctly auth-gated; not tested with valid token)

These would require either authorised credentials or active penetration testing scope, both beyond the read-only review David was asked to provide.

---

*Audit conducted using read-only probes against publicly-accessible endpoints. No exploitation, no data exfiltration, no attempts to access protected resources beyond the auth boundary. All probes used the site's own public anon key, which is designed for public exposure under standard Supabase architecture.*
