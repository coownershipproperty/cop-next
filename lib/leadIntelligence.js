import { EUROPE_DIAL_CODES, INTERNATIONAL_DIAL_CODES } from './internationalDialCodes';

const COUNTRY_NAME_TO_ISO = {
  'United Kingdom': 'GB', Ireland: 'IE', France: 'FR', Spain: 'ES', Portugal: 'PT', Germany: 'DE',
  Netherlands: 'NL', Belgium: 'BE', Luxembourg: 'LU', Switzerland: 'CH', Austria: 'AT', Italy: 'IT',
  Greece: 'GR', Cyprus: 'CY', Malta: 'MT', Denmark: 'DK', Sweden: 'SE', Norway: 'NO', Finland: 'FI',
  Iceland: 'IS', Poland: 'PL', Czechia: 'CZ', Slovakia: 'SK', Hungary: 'HU', Romania: 'RO', Bulgaria: 'BG',
  Croatia: 'HR', Slovenia: 'SI', Serbia: 'RS', Montenegro: 'ME', Albania: 'AL', 'North Macedonia': 'MK',
  'Bosnia & Herzegovina': 'BA', Kosovo: 'XK', Estonia: 'EE', Latvia: 'LV', Lithuania: 'LT', Ukraine: 'UA',
  Moldova: 'MD', Georgia: 'GE', Armenia: 'AM', Turkey: 'TR', Andorra: 'AD', Monaco: 'MC',
  'San Marino': 'SM', Liechtenstein: 'LI', Australia: 'AU', 'New Zealand': 'NZ',
  'United Arab Emirates': 'AE', 'Saudi Arabia': 'SA', Qatar: 'QA', Bahrain: 'BH', Kuwait: 'KW', Oman: 'OM',
  Israel: 'IL', Jordan: 'JO', Lebanon: 'LB', Egypt: 'EG', Morocco: 'MA', Tunisia: 'TN', Algeria: 'DZ',
  'South Africa': 'ZA', Nigeria: 'NG', Kenya: 'KE', Ghana: 'GH', Ethiopia: 'ET', Tanzania: 'TZ', Uganda: 'UG',
  Mauritius: 'MU', Seychelles: 'SC', India: 'IN', Pakistan: 'PK', Bangladesh: 'BD', 'Sri Lanka': 'LK',
  Nepal: 'NP', China: 'CN', 'Hong Kong': 'HK', Taiwan: 'TW', Japan: 'JP', 'South Korea': 'KR',
  Singapore: 'SG', Malaysia: 'MY', Thailand: 'TH', Indonesia: 'ID', Philippines: 'PH', Vietnam: 'VN',
  Brazil: 'BR', Mexico: 'MX', Argentina: 'AR', Chile: 'CL', Colombia: 'CO', Peru: 'PE', Uruguay: 'UY',
  Paraguay: 'PY', Ecuador: 'EC', Bolivia: 'BO', Venezuela: 'VE', 'Costa Rica': 'CR', Panama: 'PA',
  Guatemala: 'GT', 'El Salvador': 'SV', Honduras: 'HN', Nicaragua: 'NI', 'Dominican Republic': 'DO',
  Jamaica: 'JM', Bahamas: 'BS', Barbados: 'BB',
};

const EMAIL_TLD_TO_ISO = {
  uk: 'GB', ie: 'IE', fr: 'FR', es: 'ES', pt: 'PT', de: 'DE', nl: 'NL', be: 'BE', lu: 'LU', ch: 'CH',
  at: 'AT', it: 'IT', gr: 'GR', cy: 'CY', mt: 'MT', dk: 'DK', se: 'SE', no: 'NO', fi: 'FI', is: 'IS',
  pl: 'PL', cz: 'CZ', sk: 'SK', hu: 'HU', ro: 'RO', bg: 'BG', hr: 'HR', si: 'SI', rs: 'RS', me: 'ME',
  al: 'AL', mk: 'MK', ba: 'BA', ee: 'EE', lv: 'LV', lt: 'LT', ua: 'UA', md: 'MD', ge: 'GE', am: 'AM',
  tr: 'TR', ad: 'AD', mc: 'MC', sm: 'SM', li: 'LI', au: 'AU', nz: 'NZ', ae: 'AE', sa: 'SA', qa: 'QA',
  il: 'IL', za: 'ZA', in: 'IN', cn: 'CN', hk: 'HK', tw: 'TW', jp: 'JP', kr: 'KR', sg: 'SG', my: 'MY',
  br: 'BR', mx: 'MX', ar: 'AR', cl: 'CL', co: 'CO', pe: 'PE', uy: 'UY', ca: 'CA', us: 'US',
};

const dialCandidates = [...EUROPE_DIAL_CODES, ...INTERNATIONAL_DIAL_CODES]
  .map(([country, dialCode]) => ({ country, iso: COUNTRY_NAME_TO_ISO[country] || null, digits: dialCode.replace(/\D/g, '') }))
  .filter((item) => item.iso && item.digits && item.digits !== '1')
  .sort((a, b) => b.digits.length - a.digits.length);

function countryName(code) {
  if (!code) return null;
  try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code; }
  catch (_) { return code; }
}

function phoneCountryCode(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return null;
  return dialCandidates.find((item) => digits.startsWith(item.digits))?.iso || null;
}

function emailCountryCode(email) {
  const domain = String(email || '').toLowerCase().split('@')[1] || '';
  const tld = domain.split('.').pop();
  return EMAIL_TLD_TO_ISO[tld] || null;
}

export function requestGeo(request) {
  const header = (name) => {
    const value = request?.headers?.[name];
    return Array.isArray(value) ? value[0] : value || null;
  };
  const decode = (value) => {
    if (!value) return null;
    try { return decodeURIComponent(value).slice(0, 160); }
    catch (_) { return String(value).slice(0, 160); }
  };
  const countryCode = String(header('x-vercel-ip-country') || '').toUpperCase();
  return {
    countryCode: /^[A-Z]{2}$/.test(countryCode) ? countryCode : null,
    city: decode(header('x-vercel-ip-city')),
    region: decode(header('x-vercel-ip-country-region')),
  };
}

export function inferNationality({ ipCountryCode, phone, email }) {
  const signals = [
    ipCountryCode && { source: 'ip', code: String(ipCountryCode).toUpperCase(), weight: 75 },
    phoneCountryCode(phone) && { source: 'phone', code: phoneCountryCode(phone), weight: 70 },
    emailCountryCode(email) && { source: 'email_domain', code: emailCountryCode(email), weight: 55 },
  ].filter(Boolean);
  if (!signals.length) return null;

  // Add the independent signals instead of blindly trusting the IP. This lets
  // a matching phone code + country email domain outweigh a traveller's or
  // VPN's current location, while an IP remains the best single fallback.
  const totals = signals.reduce((scores, signal) => {
    scores[signal.code] = (scores[signal.code] || 0) + signal.weight;
    return scores;
  }, {});
  const ranked = Object.entries(totals).sort((a, b) => b[1] - a[1]);
  const [winningCode, winningScore] = ranked[0];
  const runnerUpScore = ranked[1]?.[1] || 0;
  const agreements = signals.filter((signal) => signal.code === winningCode);
  const conflicts = signals.filter((signal) => signal.code !== winningCode);
  const confidence = Math.max(35, Math.min(98,
    Math.round(50 + Math.min(38, winningScore / 4) + Math.min(10, (winningScore - runnerUpScore) / 8) - conflicts.length * 8)
  ));

  return {
    code: winningCode,
    country: countryName(winningCode),
    confidence,
    evidence: { signals, agreements: agreements.map((signal) => signal.source), conflicts: conflicts.map((signal) => signal.source) },
  };
}
