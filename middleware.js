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

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static files, api routes, and _next internals
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|woff|woff2)).*)',
  ],
};
