// ── Honeypot spam protection ─────────────────────────────────────────────────
// A hidden form field that real users never see or fill in. Automated bots fill
// every field they find, so a non-empty value is a strong signal the submission
// is spam. API routes silently accept honeypot-tripped requests (they return a
// normal success response so the bot does not retry or adapt) without sending
// any email or writing to the CRM.
//
// Used by: components/HoneypotField.js (client) and the enquiry, gallery-enquiry,
// unlock-drive and newsletter API routes (server).

export const HONEYPOT_FIELD = 'company_website';

// Returns true when the honeypot field has been filled in — i.e. the submission
// is almost certainly an automated bot. Real users cannot see or tab to the
// field, so a legitimate submission always leaves it empty.
export function isHoneypotFilled(body) {
  const value = body?.[HONEYPOT_FIELD];
  return typeof value === 'string' && value.trim().length > 0;
}
