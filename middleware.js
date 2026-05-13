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

export function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // ── API routes bypass the bot filter entirely ─────────────────────────────
  // Vercel's cron runner, Resend webhooks, and our own internal scripts all
  // hit /api/* and would otherwise get caught by node/curl/axios patterns
  // below. Auth on API routes is the API's own responsibility (Bearer token,
  // cron header, etc.) — middleware should never 403 them.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

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

  // ── Explicit locale override via ?locale= URL param ─────────────────────────
  // ?locale=en|es|fr — used by the language switcher to remember the visitor's
  // choice (purely for the language-switcher widget; we no longer geo-redirect).
  const explicitLocale = url.searchParams.get('locale');
  if (explicitLocale && ['en','es','fr'].includes(explicitLocale)) {
    const r = NextResponse.next();
    r.cookies.set('cop_locale', explicitLocale, { maxAge: 60*60*24*365, path: '/', sameSite: 'lax' });
    return r;
  }

  // NOTE: No geo-redirect by design. Visitors land on whichever URL they
  // clicked (e.g. from Google) — if they clicked the English page from Spain,
  // they stay on the English page. Locale is only changed when they
  // explicitly use the language switcher.

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
