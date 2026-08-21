/**
 * Phone normalisation to E.164 (+<country><number>, digits only).
 *
 * Why this exists: contacts.phone used to store whatever the form or the
 * inbox handed us — "07854577334", "00447771580748", "+44 7907670851",
 * "440826356497". Half the table was unusable, so the CRM's Call and
 * WhatsApp buttons silently did nothing. A one-off backfill on 21 Aug 2026
 * cleaned 218 rows; this module stops the mess coming back.
 *
 * Rules were derived from that real data, not invented. Anything the rules
 * cannot resolve confidently returns null so the caller can keep the raw
 * value rather than store a confidently-wrong number.
 */

// Email domains that reliably indicate a UK subscriber. Used only to break
// the genuine 10-digit "7xxxxxxxxx" tie between a UK mobile (leading 0
// dropped) and a NANP number in area codes 7xx.
const UK_DOMAIN = /(\.uk|btinternet\.com|talktalk\.net|sky\.com|ntlworld\.com|virginmedia\.com|googlemail\.com)$/i;

/** Country name/code -> dialling code, for the hint path only. */
const DIAL = {
  uk: '44', gb: '44', 'united kingdom': '44',
  ie: '353', ireland: '353',
  us: '1', usa: '1', 'united states': '1', ca: '1', canada: '1',
  es: '34', spain: '34', 'españa': '34',
  fr: '33', france: '33',
  it: '39', italy: '39',
  de: '49', germany: '49', deutschland: '49',
  pt: '351', portugal: '351',
  nl: '31', netherlands: '31',
  be: '32', belgium: '32',
  ch: '41', switzerland: '41',
  at: '43', austria: '43',
  dk: '45', denmark: '45',
  se: '46', sweden: '46',
  no: '47', norway: '47',
  au: '61', australia: '61',
};

/**
 * @param {string} raw          whatever the user typed
 * @param {object} [hints]
 * @param {string} [hints.country]  contacts.country, if trusted
 * @param {string} [hints.email]    used only for the UK 10-digit tie-break
 * @returns {string|null}       E.164 string, or null if not confidently resolvable
 */
export function toE164(raw, hints = {}) {
  if (!raw) return null;
  const s = String(raw).trim();
  const d = s.replace(/\D/g, '');

  // Junk: all zeros, obvious keyboard-walk placeholders, too short to dial.
  if (!d || /^0+$/.test(d) || d.length < 7) return null;
  if (/^(0?123456789|0?987654321|1234567890)$/.test(d)) return null;

  // Already international — the user told us the country, just tidy it.
  if (/^\s*\+/.test(s)) return ok('+' + d);

  // 00 is the international access prefix in most of Europe.
  if (d.startsWith('00')) return ok('+' + d.slice(2));

  // UK national format: 0 + 10 digits, mobile (07) or landline (01/02).
  if (d.length === 11 && /^0[127]/.test(d)) return ok('+44' + d.slice(1));

  // Country code present but the + was lost.
  if (d.length === 12 && /^44[1237]/.test(d)) return ok('+' + d);
  if (d.length === 11 && d.startsWith('1')) return ok('+' + d);      // NANP
  // "44" then a full national number including its trunk 0.
  if (d.length === 13 && d.startsWith('440')) return ok('+44' + d.slice(3));
  if (d.length === 13 && d.startsWith('0')) return ok('+' + d.slice(1));

  // 10 digits starting 7 is ambiguous: UK mobile with the 0 dropped, or a
  // NANP number in a 7xx area code. Only the email domain can break the tie.
  if (d.length === 10 && d.startsWith('7')) {
    if (hints.email && UK_DOMAIN.test(String(hints.email))) return ok('+44' + d);
    return null; // genuinely ambiguous — do not guess
  }

  // 10 digits in any other NANP-valid range.
  if (d.length === 10 && /^[2-689]/.test(d)) return ok('+1' + d);

  // Fall back to an explicit country hint for national-format numbers.
  const cc = DIAL[String(hints.country || '').trim().toLowerCase()];
  if (cc) return ok('+' + cc + d.replace(/^0+/, ''));

  return null;
}

function ok(e164) {
  return /^\+[1-9][0-9]{7,14}$/.test(e164) ? e164 : null;
}

/** True if the stored value is already clean E.164. */
export function isE164(v) {
  return typeof v === 'string' && /^\+[1-9][0-9]{7,14}$/.test(v);
}
