import { NextResponse } from 'next/server';

// Known bot / scraper user-agent patterns
const BOT_PATTERNS = [
  /bot/i, /crawler/i, /spider/i, /scraper/i, /curl/i, /wget/i,
  /python-requests/i, /python\//i, /go-http/i, /java\//i,
  /libwww/i, /httpclient/i, /okhttp/i, /axios/i, /node-fetch/i, /node\.js/i,
  /headlesschrome/i, /phantomjs/i, /selenium/i, /puppeteer/i,
  /nmap/i, /masscan/i, /zgrab/i, /nuclei/i, /dirbuster/i, /nikto/i,
  /sqlmap/i, /hydra/i, /burpsuite/i, /semrush/i, /ahrefs/i, /majestic/i,
  /mj12bot/i, /dotbot/i, /blexbot/i, /yandex/i, /baidu/i,
];

// Allowed good bots (Googlebot, Bingbot, etc.)
const ALLOW_PATTERNS = [
  /googlebot/i, /bingbot/i, /slurp/i, /duckduckbot/i,
  /facebookexternalhit/i, /twitterbot/i, /linkedinbot/i,
  /whatsapp/i, /applebot/i,
];

// Eurozone countries → EUR
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
  const ua = request.headers.get('user-agent') || '';

  // Always allow legitimate search engines / social crawlers
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

  // ── Currency geo-detection ──────────────────────────────────────────────────
  // Set cop_currency cookie once per visitor based on their country.
  // The client reads this cookie to display prices in their local currency.
  const response = NextResponse.next();

  if (!request.cookies.has('cop_currency')) {
    const country = request.geo?.country || '';
    const currency = currencyForCountry(country);
    response.cookies.set('cop_currency', currency, {
      maxAge: 86400,     // refresh daily so it stays current
      sameSite: 'lax',
      path: '/',
      httpOnly: false,   // must be readable by client-side JS
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
