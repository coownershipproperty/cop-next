import { NextResponse } from 'next/server';

// ── Known bot / scraper user-agent patterns ─────────────────────────────────
const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
  /python-requests/i, /python\//i, /go-http/i, /java\//i,
  /libwww/i, /httpclient/i, /okhttp/i, /axios/i, /node-fetch/i, /node\.js/i,
  /headlesschrome/i, /phantomjs/i, /selenium/i, /puppeteer/i,
  /nmap/i, /masscan/i, /zgrab/i, /nuclei/i, /dirbuster/i, /nikto/i,
  /sqlmap/i, /hydra/i, /burpsuite/i, /semrush/i, /ahrefs/i, /majestic/i,
  /mj12bot/i, /dotbot/i, /blexbot/i, /yandex/i, /baidu/i,
];

// ── Allowed good bots (Googlebot, Bingbot, etc.) ────────────────────────────
const ALLOW_PATTERNS = [
  /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
  /whatsapp/i, /applebot/i,
];

// ── Eurozone countries → EUR ────────────────────────────────────────────────
const EU_COUNTRIES = new Set([
  'AT','BE','CY','EE','FI','FR','DE','GR','IE','IT',
  'LV','LT','LU','MT','NL','PT','SK','SI','ES',
]);

function currencyForCountry(country) {
  if (!country) return null; // unknown — don't convert, show original price
  if (country === 'GB') return 'GBP';
  if (EU_COUNTRIES.has(country)) return 'EUR';
  if (country === 'US') return 'USD';
  if (country === 'AU') return 'AUD';
  if (country === 'CA') return 'CAD';
  if (country === 'CH') return 'CHF';
  if (country === 'SE') return 'SEK';
  if (country === 'NO') return 'NOK';
  if (country === 'DK') return 'DKK';
  if (country === 'NZ') return 'NZD';
  if (country === 'SG') return 'SGD';
  if (country === 'HK') return 'HKD';
  if (country === 'AE') return 'AED';
  return null; // everywhere else — show original price
}

// ── Country → preferred locale ──────────────────────────────────────────────
// Spanish-speaking countries → 'es'; French-speaking countries → 'fr'.
// Everywhere else falls through to English (no redirect).
const SPANISH_COUNTRIES = new Set([
  'ES','MX','AR','CO','CL','PE','VE','EC','GT','CU','BO','DO','HN','PY','SV','NI','CR','PA','UY','PR',
]);
const FRENCH_COUNTRIES = new Set([
  // Pure-French markets plus dominantly-French Switzerland (geo signal is
  // approximate — visitors can override via the language switcher).
  'FR','BE','LU','MC','CH',
]);

function localeForCountry(country) {
  if (!country) return null;
  if (SPANISH_COUNTRIES.has(country)) return 'es';
  if (FRENCH_COUNTRIES.has(country)) return 'fr';
  return null;
}

export function middleware(request) {
  const ua = request.headers.get('user-agent') || '';

  // Always allow legitimate search engines / social crawlers — they must see
  // the canonical page they requested, never a geo-redirect.
  if (ALLOW_PATTERNS.some(p => p.test(ua))) {
    return NextResponse.next();
  }

  // Block empty user-agents
  if (!ua.trim()) {
    return new NextResponse(null, { status: 403 });
  }

  // Block known bad bots
  if (BOT_PATTERNS.some(p => p.test(ua))) {
    return new NextResponse(null, { status: 403 });
  }

  const url = new URL(request.url);
  const pathname = url.pathname;

  // ── Explicit locale override via ?locale= URL param ─────────────────────────
  // ?locale=en pins the visitor to English permanently and prevents future
  // geo-redirects. Used by the language switcher.
  const explicitLocale = url.searchParams.get('locale');
  if (explicitLocale && ['en','es','fr'].includes(explicitLocale)) {
    const r = NextResponse.next();
    r.cookies.set('cop_locale', explicitLocale, { maxAge: 60*60*24*365, path: '/', sameSite: 'lax' });
    return r;
  }

  // ── Locale geo-redirect (homepage only, first visit only) ───────────────────
  // We only redirect the bare English homepage ('/'), only if the visitor
  // doesn't already have a cop_locale cookie, and only if their country maps
  // to a supported locale. We intentionally do NOT redirect deep pages — that
  // would harm SEO and break shared links.
  if (
    pathname === '/' &&
    !request.cookies.has('cop_locale') &&
    request.method === 'GET'
  ) {
    const country = request.geo?.country || '';
    const wantedLocale = localeForCountry(country);
    if (wantedLocale) {
      url.pathname = `/${wantedLocale}/`;
      const redirect = NextResponse.redirect(url, 307);
      redirect.cookies.set('cop_locale', wantedLocale, {
        maxAge: 60*60*24*365, // remember for a year
        path: '/',
        sameSite: 'lax',
      });
      return redirect;
    }
  }

  // ── Currency geo-detection ─────────────────────────────────────────────────
  // Set cop_currency cookie once per visitor based on their country.
  // The client reads this cookie to display prices in their local currency.
  const response = NextResponse.next();

  if (!request.cookies.has('cop_currency')) {
    const country = request.geo?.country || '';
    const currency = currencyForCountry(country);
    if (currency) {
      response.cookies.set('cop_currency', currency, {
        maxAge: 86400,     // refresh daily so it stays current
        sameSite: 'lax',
        path: '/',
        httpOnly: false,   // must be readable by client-side JS
      });
    }
  }

  // ── Persist cop_locale even when we didn't redirect ─────────────────────────
  // Prevents the homepage from re-evaluating geo on every visit. Detect from
  // URL path if the visitor's already inside a locale subfolder.
  if (!request.cookies.has('cop_locale')) {
    const seg = pathname.split('/').filter(Boolean)[0];
    const detected = ['es','fr'].includes(seg) ? seg : 'en';
    response.cookies.set('cop_locale', detected, {
      maxAge: 60*60*24*365,
      path: '/',
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  // Run on all routes except static files, api routes, and _next internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff|woff2)).*)',
  ],
};
