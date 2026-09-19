#!/usr/bin/env node
/*
 * Real-browser smoke test for the phone menu — runs in WebKit (what every
 * iPhone browser is, Safari, Chrome and Brave alike) and Chromium, at an
 * iPhone viewport, opens the hamburger and checks that EVERY drawer link is
 * actually on screen and tappable (document.elementFromPoint hits it).
 *
 * This is the test that would have caught the 18 Sep 2026 bug on day one:
 * the drawer was clipped to the header band and only "HOME" was tappable.
 * scripts/check-header-css.js catches the known cause at build time; this
 * catches any cause, but needs a browser, so it is run by hand:
 *
 *   npm i -D playwright            (once)
 *   npx playwright install webkit  (once, ~100 MB)
 *   npm run check:mobile-nav                       # tests the live site
 *   npm run check:mobile-nav -- http://localhost:3000/   # or a dev server
 *
 * Run it after any change to components/Header.js, the header/nav CSS, or
 * the Next.js version (the CSS minifier changed which prefix survived).
 */
const url = process.argv[2] || 'https://www.co-ownership-property.com/';

let pw;
try { pw = await import('playwright'); }
catch { console.error('playwright is not installed: npm i -D playwright && npx playwright install webkit'); process.exit(2); }

const { webkit, chromium, devices } = pw;
const iphone = devices['iPhone 13'];
let failed = false;

for (const [name, launcher] of [['webkit', webkit], ['chromium', chromium]]) {
  let browser;
  try { browser = await launcher.launch(); }
  catch (e) { console.warn(`${name}: not installed (npx playwright install ${name}) — skipped`); continue; }
  const ctx = await browser.newContext({ ...iphone });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForSelector('#cop-hamburger');
  await page.waitForTimeout(500);
  await page.click('#cop-hamburger');
  await page.waitForTimeout(700);
  const r = await page.evaluate(() => {
    const nav = document.querySelector('#cop-nav');
    const b = nav.getBoundingClientRect();
    const links = [...nav.querySelectorAll('a, button')].map((a) => {
      const r = a.getBoundingClientRect();
      const el = document.elementFromPoint(r.left + 24, r.top + r.height / 2);
      return { text: a.textContent.trim(), top: Math.round(r.top), ok: el === a || a.contains(el) };
    });
    return { open: nav.classList.contains('active'), navHeight: Math.round(b.height), viewport: innerHeight, links };
  });
  const bad = r.links.filter((l) => !l.ok);
  const okAll = r.open && bad.length === 0 && r.navHeight >= r.viewport - 1;
  console.log(`${okAll ? '✔' : '✖'} ${name.padEnd(8)} drawer ${r.open ? 'open' : 'NOT OPEN'}, height ${r.navHeight}/${r.viewport}px, ${r.links.length - bad.length}/${r.links.length} links tappable`);
  for (const l of bad) console.log(`     hidden: ${l.text} (top ${l.top}px)`);
  if (!okAll) failed = true;
  await browser.close();
}
process.exit(failed ? 1 : 0);
