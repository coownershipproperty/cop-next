export const EUROPE_DIAL_CODES = [
  ['United Kingdom', '+44'],
  ['Ireland', '+353'],
  ['France', '+33'],
  ['Spain', '+34'],
  ['Portugal', '+351'],
  ['Germany', '+49'],
  ['Netherlands', '+31'],
  ['Belgium', '+32'],
  ['Luxembourg', '+352'],
  ['Switzerland', '+41'],
  ['Austria', '+43'],
  ['Italy', '+39'],
  ['Greece', '+30'],
  ['Cyprus', '+357'],
  ['Malta', '+356'],
  ['Denmark', '+45'],
  ['Sweden', '+46'],
  ['Norway', '+47'],
  ['Finland', '+358'],
  ['Iceland', '+354'],
  ['Poland', '+48'],
  ['Czechia', '+420'],
  ['Slovakia', '+421'],
  ['Hungary', '+36'],
  ['Romania', '+40'],
  ['Bulgaria', '+359'],
  ['Croatia', '+385'],
  ['Slovenia', '+386'],
  ['Serbia', '+381'],
  ['Montenegro', '+382'],
  ['Albania', '+355'],
  ['North Macedonia', '+389'],
  ['Bosnia & Herzegovina', '+387'],
  ['Kosovo', '+383'],
  ['Estonia', '+372'],
  ['Latvia', '+371'],
  ['Lithuania', '+370'],
  ['Ukraine', '+380'],
  ['Moldova', '+373'],
  ['Georgia', '+995'],
  ['Armenia', '+374'],
  ['Turkey', '+90'],
  ['Andorra', '+376'],
  ['Monaco', '+377'],
  ['San Marino', '+378'],
  ['Vatican City', '+39'],
  ['Liechtenstein', '+423'],
];

export const INTERNATIONAL_DIAL_CODES = [
  ['United States / Canada', '+1'],
  ['Australia', '+61'],
  ['New Zealand', '+64'],
  ['United Arab Emirates', '+971'],
  ['Saudi Arabia', '+966'],
  ['Qatar', '+974'],
  ['Bahrain', '+973'],
  ['Kuwait', '+965'],
  ['Oman', '+968'],
  ['Israel', '+972'],
  ['Jordan', '+962'],
  ['Lebanon', '+961'],
  ['Egypt', '+20'],
  ['Morocco', '+212'],
  ['Tunisia', '+216'],
  ['Algeria', '+213'],
  ['South Africa', '+27'],
  ['Nigeria', '+234'],
  ['Kenya', '+254'],
  ['Ghana', '+233'],
  ['Ethiopia', '+251'],
  ['Tanzania', '+255'],
  ['Uganda', '+256'],
  ['Mauritius', '+230'],
  ['Seychelles', '+248'],
  ['India', '+91'],
  ['Pakistan', '+92'],
  ['Bangladesh', '+880'],
  ['Sri Lanka', '+94'],
  ['Nepal', '+977'],
  ['China', '+86'],
  ['Hong Kong', '+852'],
  ['Taiwan', '+886'],
  ['Japan', '+81'],
  ['South Korea', '+82'],
  ['Singapore', '+65'],
  ['Malaysia', '+60'],
  ['Thailand', '+66'],
  ['Indonesia', '+62'],
  ['Philippines', '+63'],
  ['Vietnam', '+84'],
  ['Brazil', '+55'],
  ['Mexico', '+52'],
  ['Argentina', '+54'],
  ['Chile', '+56'],
  ['Colombia', '+57'],
  ['Peru', '+51'],
  ['Uruguay', '+598'],
  ['Paraguay', '+595'],
  ['Ecuador', '+593'],
  ['Bolivia', '+591'],
  ['Venezuela', '+58'],
  ['Costa Rica', '+506'],
  ['Panama', '+507'],
  ['Guatemala', '+502'],
  ['El Salvador', '+503'],
  ['Honduras', '+504'],
  ['Nicaragua', '+505'],
  ['Dominican Republic', '+1 809'],
  ['Jamaica', '+1 876'],
  ['Bahamas', '+1 242'],
  ['Barbados', '+1 246'],
];

export const EUROPE_COUNTRIES = EUROPE_DIAL_CODES.map(([country]) => country);
export const INTERNATIONAL_COUNTRIES = [
  'United States',
  'Canada',
  ...INTERNATIONAL_DIAL_CODES
    .map(([country]) => country)
    .filter((country) => country !== 'United States / Canada'),
];

const ALL_DIAL_CODES = [...EUROPE_DIAL_CODES, ...INTERNATIONAL_DIAL_CODES]
  .map(([, code]) => code)
  .sort((a, b) => b.length - a.length);

export function splitInternationalPhone(phone, fallbackDialCode = '+44') {
  const value = String(phone || '').trim();
  const matched = ALL_DIAL_CODES.find((code) => value.startsWith(code));
  if (!matched) return { dialCode: fallbackDialCode, localNumber: value };
  return {
    dialCode: matched,
    localNumber: value.slice(matched.length).trim(),
  };
}

export function joinInternationalPhone(dialCode, localNumber) {
  const local = String(localNumber || '').trim();
  if (!local) return '';
  if (local.startsWith('+')) return local.replace(/\s+/g, ' ');
  const normalizedLocal = dialCode === '+39' ? local : local.replace(/^0+/, '');
  return `${dialCode} ${normalizedLocal}`.trim();
}
