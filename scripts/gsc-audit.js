#!/usr/bin/env node
'use strict';

/**
 * Read-only Google Search Console audit.
 *
 * Auth:
 *   - OAuth desktop client at ~/.config/gsc/search-console-oauth-client.json
 *     plus token at ~/.config/gsc/search-console-oauth-token.json
 *   - GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
 *   - or GSC_CREDENTIALS_JSON='{"type":"service_account",...}'
 *   - or GSC_CREDENTIALS_JSON=/path/to/service-account.json
 *   - or ~/.config/gsc/search-console-service-account.json
 *
 * Examples:
 *   node scripts/gsc-audit.js --site=sc-domain:co-ownership-property.com --origin=https://co-ownership-property.com
 *   node scripts/gsc-audit.js --site=sc-domain:domosno.com --origin=https://domosno.com --inspect-limit=30
 */

const fs = require('fs');
const http = require('http');
const path = require('path');
const { spawn } = require('child_process');
const { google } = require('googleapis');

const WEBMASTERS_SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const DEFAULT_OUT_DIR = path.join(process.env.HOME || process.cwd(), '.codex', 'seo-audits', 'gsc');
const DEFAULT_OAUTH_CLIENT_FILE = path.join(process.env.HOME || '', '.config', 'gsc', 'search-console-oauth-client.json');
const DEFAULT_OAUTH_TOKEN_FILE = path.join(process.env.HOME || '', '.config', 'gsc', 'search-console-oauth-token.json');
const DEFAULT_CREDENTIAL_FILES = [
  path.join(process.env.HOME || '', '.config', 'gsc', 'search-console-service-account.json'),
  path.join(process.env.HOME || '', '.config', 'gsc', 'gsc-service-account.json'),
];

function parseArgs(argv) {
  const args = {};
  for (const arg of argv.slice(2)) {
    if (!arg.startsWith('--')) continue;
    const eq = arg.indexOf('=');
    if (eq === -1) args[arg.slice(2)] = true;
    else args[arg.slice(2, eq)] = arg.slice(eq + 1);
  }
  return args;
}

function usage(exitCode = 1) {
  const text = `
Usage:
  node scripts/gsc-audit.js --site=<search-console-property> --origin=<public-origin> [options]

Required:
  --site     Search Console property, e.g. sc-domain:domosno.com or https://example.com/
  --origin   Public site origin used for sitemap sampling, e.g. https://domosno.com

Options:
  --auth               Run one-time OAuth authorization and save refresh token.
  --list-sites         List Search Console properties visible to the credentials.
  --days=28             Search Analytics lookback window.
  --inspect-limit=25    Maximum URL Inspection API calls.
  --urls=a,b,c          Extra URLs to inspect.
  --urls-file=file      File containing one URL per line.
  --client-file=file    OAuth client JSON path. Defaults to ~/.config/gsc/search-console-oauth-client.json.
  --token-file=file     OAuth token JSON path. Defaults to ~/.config/gsc/search-console-oauth-token.json.
  --out-dir=dir         Audit output directory. Defaults to ~/.codex/seo-audits/gsc.
  --no-write            Print report only; do not write JSON/Markdown files.
`;
  console.error(text.trim());
  process.exit(exitCode);
}

function isoDateDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function slugFromSite(siteUrl) {
  return siteUrl
    .replace(/^sc-domain:/, '')
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .replace(/[^a-z0-9.-]+/gi, '-')
    .toLowerCase();
}

function readJsonFile(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function ensurePrivateDir(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  try { fs.chmodSync(path.dirname(file), 0o700); } catch (_) {}
}

function readOAuthClientConfig(file = DEFAULT_OAUTH_CLIENT_FILE) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing OAuth client JSON at ${file}. Create a Desktop OAuth client in Google Cloud and save the downloaded JSON there.`
    );
  }

  const json = readJsonFile(file);
  const config = json.installed || json.web || json;
  if (!config.client_id || !config.client_secret) {
    throw new Error(`OAuth client JSON at ${file} does not contain client_id and client_secret.`);
  }

  return {
    clientId: config.client_id,
    clientSecret: config.client_secret,
  };
}

function makeOAuthClient({ clientFile = DEFAULT_OAUTH_CLIENT_FILE, redirectUri = 'http://127.0.0.1' } = {}) {
  const { clientId, clientSecret } = readOAuthClientConfig(clientFile);
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function openUrl(url) {
  const opener = process.platform === 'darwin'
    ? 'open'
    : process.platform === 'win32'
      ? 'cmd'
      : 'xdg-open';
  const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];

  try {
    const child = spawn(opener, args, { detached: true, stdio: 'ignore' });
    child.unref();
    return true;
  } catch (_) {
    return false;
  }
}

function waitForOAuthCode(server) {
  return new Promise((resolve, reject) => {
    server.on('request', (req, res) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      if (url.pathname !== '/oauth2callback') {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      const error = url.searchParams.get('error');
      const code = url.searchParams.get('code');
      if (error) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end(`Authorization failed: ${error}`);
        reject(new Error(`OAuth authorization failed: ${error}`));
        return;
      }
      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Missing authorization code.');
        reject(new Error('OAuth callback did not include an authorization code.'));
        return;
      }

      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Search Console authorization complete. You can close this tab and return to Codex.');
      resolve(code);
    });
  });
}

async function runOAuthAuth(args) {
  const clientFile = args['client-file'] || DEFAULT_OAUTH_CLIENT_FILE;
  const tokenFile = args['token-file'] || DEFAULT_OAUTH_TOKEN_FILE;
  const loginHint = args.account || 'info@domosno.com';

  const server = http.createServer();
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', err => err ? reject(err) : resolve()));
  const { port } = server.address();
  const redirectUri = `http://127.0.0.1:${port}/oauth2callback`;
  const oauth2Client = makeOAuthClient({ clientFile, redirectUri });
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [WEBMASTERS_SCOPE],
    login_hint: loginHint,
    include_granted_scopes: true,
  });

  console.log(`Opening Google OAuth in your browser for ${loginHint}...`);
  console.log(`If the browser does not open, visit:\n${authUrl}\n`);
  openUrl(authUrl);

  try {
    const code = await waitForOAuthCode(server);
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens.refresh_token) {
      throw new Error('Google did not return a refresh_token. Re-run with --auth; prompt=consent is already enabled.');
    }
    ensurePrivateDir(tokenFile);
    fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 2), { mode: 0o600 });
    try { fs.chmodSync(tokenFile, 0o600); } catch (_) {}
    console.log(`OAuth token saved to ${tokenFile}`);
  } finally {
    server.close();
  }
}

function readOAuthTokenFile(file = DEFAULT_OAUTH_TOKEN_FILE) {
  if (!fs.existsSync(file)) return null;
  const tokens = readJsonFile(file);
  if (!tokens.refresh_token && !tokens.access_token) {
    throw new Error(`OAuth token file at ${file} does not contain a refresh_token or access_token.`);
  }
  return tokens;
}

function readCredentials() {
  const raw = process.env.GSC_CREDENTIALS_JSON || process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{')) return { credentials: JSON.parse(trimmed) };
    if (fs.existsSync(trimmed)) return { keyFile: trimmed };
    throw new Error('GSC_CREDENTIALS_JSON is set but is neither JSON nor an existing file path.');
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return { keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS };
  }

  const defaultCreds = DEFAULT_CREDENTIAL_FILES.find(file => file && fs.existsSync(file));
  if (defaultCreds) return { keyFile: defaultCreds };

  throw new Error(
    `Missing Search Console API credentials. Preferred setup: save a Desktop OAuth client JSON to ${DEFAULT_OAUTH_CLIENT_FILE}, then run "node scripts/gsc-audit.js --auth". Fallback setup: set GOOGLE_APPLICATION_CREDENTIALS/GSC_CREDENTIALS_JSON or save a service-account JSON to ${DEFAULT_CREDENTIAL_FILES[0]}.`
  );
}

async function authedClient() {
  const oauthClientFile = process.env.GSC_OAUTH_CLIENT_FILE || DEFAULT_OAUTH_CLIENT_FILE;
  const oauthTokenFile = process.env.GSC_OAUTH_TOKEN_FILE || DEFAULT_OAUTH_TOKEN_FILE;
  const oauthTokens = readOAuthTokenFile(oauthTokenFile);

  if (oauthTokens) {
    const oauth2Client = makeOAuthClient({ clientFile: oauthClientFile });
    oauth2Client.setCredentials(oauthTokens);
    return oauth2Client;
  }

  const auth = new google.auth.GoogleAuth({
    ...readCredentials(),
    scopes: [WEBMASTERS_SCOPE],
  });
  return auth.getClient();
}

async function apiRequest(client, { url, method = 'GET', data }) {
  try {
    const res = await client.request({ url, method, data });
    return res.data;
  } catch (err) {
    const detail = err.response?.data?.error || err.response?.data || err.message;
    const rendered = typeof detail === 'string' ? detail : JSON.stringify(detail);
    throw new Error(`${method} ${url} failed: ${rendered}`);
  }
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Codex-GSC-Audit/1.0' } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} for ${url}`);
  return res.text();
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(match =>
    match[1].replace(/&amp;/g, '&').trim()
  );
}

async function fetchSitemapUrls(origin, maxSitemaps = 20) {
  const root = new URL('/sitemap.xml', origin).toString();
  const seen = new Set();
  const queue = [root];
  const urls = [];
  const sitemaps = [];

  while (queue.length && sitemaps.length < maxSitemaps) {
    const sitemapUrl = queue.shift();
    if (seen.has(sitemapUrl)) continue;
    seen.add(sitemapUrl);

    let xml;
    try {
      xml = await fetchText(sitemapUrl);
    } catch (err) {
      sitemaps.push({ url: sitemapUrl, error: err.message });
      continue;
    }

    const locs = extractLocs(xml);
    const isIndex = /<sitemapindex[\s>]/i.test(xml);
    sitemaps.push({ url: sitemapUrl, locCount: locs.length, isIndex });

    for (const loc of locs) {
      if (isIndex || /\.xml(?:\.gz)?(?:$|\?)/i.test(loc)) queue.push(loc);
      else urls.push(loc);
    }
  }

  return { sitemapUrl: root, sitemaps, urls: [...new Set(urls)] };
}

function readExtraUrls(args) {
  const urls = [];
  if (args.urls) {
    urls.push(...String(args.urls).split(',').map(s => s.trim()).filter(Boolean));
  }
  if (args['urls-file']) {
    const fileUrls = fs.readFileSync(args['urls-file'], 'utf8')
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('#'));
    urls.push(...fileUrls);
  }
  return urls;
}

function pickInspectionUrls({ origin, sitemapUrls, topPages, extraUrls, limit }) {
  const picked = [];
  const add = (url) => {
    if (!url) return;
    try {
      const normalized = new URL(url, origin).toString();
      if (!picked.includes(normalized)) picked.push(normalized);
    } catch (_) {}
  };

  add(origin);
  for (const url of extraUrls) add(url);
  for (const row of topPages) add(row.keys?.[0]);

  const propertyHints = ['/property/', '/properties/', '/our-homes/', '/blog/', '/resales/', '/buy/'];
  for (const hint of propertyHints) {
    const match = sitemapUrls.find(url => {
      try { return new URL(url).pathname.includes(hint); }
      catch (_) { return false; }
    });
    add(match);
  }

  const step = Math.max(1, Math.floor(sitemapUrls.length / Math.max(1, limit)));
  for (let i = 0; i < sitemapUrls.length && picked.length < limit; i += step) add(sitemapUrls[i]);

  return picked.slice(0, limit);
}

async function searchAnalytics(client, siteUrl, requestBody) {
  const encoded = encodeURIComponent(siteUrl);
  return apiRequest(client, {
    method: 'POST',
    url: `https://www.googleapis.com/webmasters/v3/sites/${encoded}/searchAnalytics/query`,
    data: requestBody,
  });
}

async function inspectUrl(client, siteUrl, inspectionUrl) {
  return apiRequest(client, {
    method: 'POST',
    url: 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
    data: { siteUrl, inspectionUrl, languageCode: 'en-US' },
  });
}

function summarizeRows(rows = []) {
  return rows.map(row => ({
    keys: row.keys || [],
    clicks: row.clicks || 0,
    impressions: row.impressions || 0,
    ctr: row.ctr || 0,
    position: row.position || 0,
  }));
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item) || 'UNKNOWN';
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function renderReport(result) {
  const lines = [];
  lines.push(`# GSC audit: ${result.siteUrl}`);
  lines.push('');
  lines.push(`Run: ${result.generatedAt}`);
  lines.push(`Window: ${result.startDate} to ${result.endDate}`);
  lines.push(`Public origin: ${result.origin}`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- Search Console access: ${result.siteAccess ? 'yes' : 'not found in sites.list'}`);
  lines.push(`- Public sitemap URLs found: ${result.sitemap.urlCount}`);
  lines.push(`- Submitted/API sitemap entries: ${result.gscSitemaps.length}`);
  lines.push(`- Search clicks: ${Math.round(result.performance.total.clicks)}`);
  lines.push(`- Search impressions: ${Math.round(result.performance.total.impressions)}`);
  lines.push(`- URLs inspected: ${result.inspections.length}`);
  lines.push(`- Inspection verdicts: ${JSON.stringify(result.inspectionSummary.verdicts)}`);
  lines.push(`- Coverage states: ${JSON.stringify(result.inspectionSummary.coverageStates)}`);
  lines.push('');

  if (result.issues.length) {
    lines.push('## Issues');
    for (const issue of result.issues) lines.push(`- ${issue}`);
    lines.push('');
  }

  lines.push('## Top Pages');
  for (const row of result.performance.topPages.slice(0, 10)) {
    lines.push(`- ${row.keys[0]} — ${Math.round(row.clicks)} clicks, ${Math.round(row.impressions)} impressions, avg position ${row.position.toFixed(1)}`);
  }
  lines.push('');

  lines.push('## URL Inspection');
  for (const item of result.inspections) {
    const s = item.indexStatusResult || {};
    lines.push(`- ${item.inspectionUrl} — ${s.verdict || 'UNKNOWN'}; ${s.coverageState || 'unknown coverage'}; Google canonical: ${s.googleCanonical || 'n/a'}`);
  }
  lines.push('');
  lines.push('Note: Google does not expose the full Page Indexing report bucket table through this API. This audit uses Search Analytics plus sampled URL Inspection data.');
  return lines.join('\n');
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) usage(0);

  if (args.auth) {
    await runOAuthAuth(args);
    return;
  }

  if (args['list-sites']) {
    const client = await authedClient();
    const sites = await apiRequest(client, { url: 'https://www.googleapis.com/webmasters/v3/sites' });
    for (const site of sites.siteEntry || []) {
      console.log(`${site.siteUrl}\t${site.permissionLevel || ''}`);
    }
    return;
  }

  if (!args.site || !args.origin) usage(1);

  const siteUrl = args.site;
  const origin = args.origin.replace(/\/+$/, '');
  const days = Number(args.days || 28);
  const inspectLimit = Number(args['inspect-limit'] || 25);
  const endDate = args['end-date'] || isoDateDaysAgo(2); // GSC data usually lags.
  const startDate = args['start-date'] || isoDateDaysAgo(days + 2);

  const client = await authedClient();
  const sites = await apiRequest(client, { url: 'https://www.googleapis.com/webmasters/v3/sites' });
  const siteEntries = sites.siteEntry || [];
  const siteAccess = siteEntries.some(site => site.siteUrl === siteUrl);

  if (!siteAccess) {
    const publicSitemap = await fetchSitemapUrls(origin).catch(err => ({
      sitemapUrl: new URL('/sitemap.xml', origin).toString(),
      sitemaps: [{ url: new URL('/sitemap.xml', origin).toString(), error: err.message }],
      urls: [],
    }));
    const result = {
      generatedAt: new Date().toISOString(),
      siteUrl,
      origin,
      startDate,
      endDate,
      siteAccess: false,
      availableSites: siteEntries.map(site => ({ siteUrl: site.siteUrl, permissionLevel: site.permissionLevel })),
      sitemap: {
        root: publicSitemap.sitemapUrl,
        urlCount: publicSitemap.urls.length,
        entries: publicSitemap.sitemaps,
      },
      gscSitemaps: [],
      performance: {
        total: { clicks: 0, impressions: 0, ctr: 0, position: 0 },
        topPages: [],
        topQueries: [],
      },
      inspections: [],
      inspectionSummary: {
        verdicts: {},
        coverageStates: {},
        indexingStates: {},
      },
      issues: [
        `Property ${siteUrl} was not returned by sites.list for these credentials. Use --list-sites to choose the exact property string, or add the service account/user to Search Console.`,
      ],
    };
    const report = renderReport(result);
    console.log(report);
    process.exitCode = 2;
    return;
  }

  const [publicSitemap, gscSitemapData, totalData, topPagesData, topQueriesData] = await Promise.all([
    fetchSitemapUrls(origin),
    apiRequest(client, { url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/sitemaps` }).catch(err => ({ sitemap: [], error: err.message })),
    searchAnalytics(client, siteUrl, { startDate, endDate, rowLimit: 1 }),
    searchAnalytics(client, siteUrl, { startDate, endDate, dimensions: ['page'], rowLimit: 50 }),
    searchAnalytics(client, siteUrl, { startDate, endDate, dimensions: ['query'], rowLimit: 50 }),
  ]);

  const topPages = summarizeRows(topPagesData.rows || []);
  const topQueries = summarizeRows(topQueriesData.rows || []);
  const inspectionUrls = pickInspectionUrls({
    origin,
    sitemapUrls: publicSitemap.urls,
    topPages,
    extraUrls: readExtraUrls(args),
    limit: inspectLimit,
  });

  const inspections = [];
  for (const inspectionUrl of inspectionUrls) {
    try {
      const data = await inspectUrl(client, siteUrl, inspectionUrl);
      inspections.push({
        inspectionUrl,
        inspectionResultLink: data.inspectionResult?.inspectionResultLink || null,
        indexStatusResult: data.inspectionResult?.indexStatusResult || null,
        richResultsResult: data.inspectionResult?.richResultsResult || null,
      });
    } catch (err) {
      inspections.push({ inspectionUrl, error: err.message });
    }
  }

  const issues = [];
  if (!siteAccess) issues.push(`Property ${siteUrl} was not returned by sites.list for these credentials.`);
  if (publicSitemap.sitemaps.some(s => s.error)) issues.push('One or more public sitemap fetches failed.');
  if (gscSitemapData.error) issues.push(`GSC sitemap API failed: ${gscSitemapData.error}`);

  for (const item of inspections) {
    if (item.error) {
      issues.push(`URL Inspection failed for ${item.inspectionUrl}: ${item.error}`);
      continue;
    }
    const s = item.indexStatusResult || {};
    if (s.verdict && s.verdict !== 'PASS') issues.push(`${item.inspectionUrl} inspection verdict is ${s.verdict}: ${s.coverageState || 'no coverage state'}`);
    if (s.indexingState && s.indexingState !== 'INDEXING_ALLOWED') issues.push(`${item.inspectionUrl} indexing state is ${s.indexingState}`);
    if (s.robotsTxtState && s.robotsTxtState !== 'ALLOWED') issues.push(`${item.inspectionUrl} robots.txt state is ${s.robotsTxtState}`);
    if (s.googleCanonical && s.userCanonical && s.googleCanonical !== s.userCanonical) {
      issues.push(`${item.inspectionUrl} Google canonical differs from user canonical: ${s.googleCanonical} vs ${s.userCanonical}`);
    }
  }

  const result = {
    generatedAt: new Date().toISOString(),
    siteUrl,
    origin,
    startDate,
    endDate,
    siteAccess,
    availableSites: siteEntries.map(site => ({ siteUrl: site.siteUrl, permissionLevel: site.permissionLevel })),
    sitemap: {
      root: publicSitemap.sitemapUrl,
      urlCount: publicSitemap.urls.length,
      entries: publicSitemap.sitemaps,
    },
    gscSitemaps: gscSitemapData.sitemap || [],
    performance: {
      total: summarizeRows(totalData.rows || [])[0] || { clicks: 0, impressions: 0, ctr: 0, position: 0 },
      topPages,
      topQueries,
    },
    inspections,
    inspectionSummary: {
      verdicts: countBy(inspections, item => item.indexStatusResult?.verdict || (item.error ? 'ERROR' : 'UNKNOWN')),
      coverageStates: countBy(inspections, item => item.indexStatusResult?.coverageState || (item.error ? 'ERROR' : 'UNKNOWN')),
      indexingStates: countBy(inspections, item => item.indexStatusResult?.indexingState || (item.error ? 'ERROR' : 'UNKNOWN')),
    },
    issues,
  };

  const report = renderReport(result);
  console.log(report);

  if (!args['no-write']) {
    const outDir = path.join(args['out-dir'] || DEFAULT_OUT_DIR, slugFromSite(siteUrl));
    fs.mkdirSync(outDir, { recursive: true });
    const stamp = `${todayIso()}-${new Date().toISOString().slice(11, 19).replace(/:/g, '')}`;
    fs.writeFileSync(path.join(outDir, `${stamp}.json`), JSON.stringify(result, null, 2));
    fs.writeFileSync(path.join(outDir, `${stamp}.md`), report);
    console.log(`\nSaved: ${outDir}/${stamp}.{json,md}`);
  }
}

main().catch(err => {
  console.error(`GSC audit failed: ${err.message}`);
  process.exit(1);
});
