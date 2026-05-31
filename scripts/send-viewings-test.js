#!/usr/bin/env node
/**
 * scripts/send-viewings-test.js
 *
 * One-off test sender for the "Viewings — France" newsletter.
 * Re-renders the template fresh from emails/viewings-france.tsx + lib/viewings.json
 * + lib/properties.json (so hero images stay in sync with the live property
 * record), then sends via Resend to whoever you pass as --to.
 *
 * Usage:
 *   node scripts/send-viewings-test.js --to info@domosno.com
 *   node scripts/send-viewings-test.js --to me@example.com --subject "Test viewings"
 *
 * Requires RESEND_API_KEY in .env.local (already used by lib/resend.js).
 *
 * Safe to delete after you're done testing.
 */
// Load .env.local via Next.js's own loader (already a project dep)
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((a, i, arr) => {
    if (!a.startsWith('--')) return [];
    const k = a.slice(2);
    const v = arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true;
    return [[k, v]];
  })
);

const to = args.to;
const subject = args.subject || "Private viewings — Côte d'Azur & French Alps";
const fromAddr = args.from || 'Co-Ownership Property <info@co-ownership-property.com>';

if (!to) {
  console.error('Missing --to <email>. Example:');
  console.error('  node scripts/send-viewings-test.js --to info@domosno.com');
  process.exit(1);
}
if (!process.env.RESEND_API_KEY) {
  console.error('RESEND_API_KEY not found in .env.local — cannot send.');
  process.exit(1);
}

async function main() {
  // ── Bundle the .tsx template into a CJS file we can require ────────────────
  const tmpFile = path.join(__dirname, '..', '.tmp-viewings-bundle.cjs');
  await esbuild.build({
    entryPoints: [path.join(__dirname, '..', 'emails', 'viewings-france.tsx')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: tmpFile,
    external: ['react', '@react-email/components', '@react-email/render'],
    loader: { '.tsx': 'tsx', '.ts': 'ts' },
    jsx: 'automatic',
    logLevel: 'error',
  });

  const React = require('react');
  const { render } = require('@react-email/render');
  const { Resend } = require('resend');
  const Template = require(tmpFile).default;

  // ── Build the viewings list (same logic as lib/newsletter/render.js) ───────
  const viewingsData = require(path.join(__dirname, '..', 'lib', 'viewings.json'));
  const propsData = require(path.join(__dirname, '..', 'lib', 'properties.json'));
  const bySlug = Object.fromEntries(propsData.map(p => [p.slug, p]));

  const SYM = { EUR: '€', USD: '$', GBP: '£' };
  const fmt = (p, c) => `${SYM[c] || '€'}${p.toLocaleString('en-GB')}`;
  const today = new Date().toISOString().slice(0, 10);

  const viewings = viewingsData
    .filter(v => !v.date || v.date >= today)
    .map(v => {
      const p = bySlug[v.propertySlug];
      return {
        id: v.id,
        propertySlug: v.propertySlug,
        displayName: v.displayName,
        city: v.city,
        region: v.region,
        country: v.country,
        dateLabel: v.dateLabel,
        price: fmt(v.price, v.currency),
        share: v.share,
        imageUrl: (p && p.img) || v.img,
        blurb: v.blurb,
        tour: v.tour,
      };
    });

  const firstName = args['first-name'] || 'David';
  const unsubscribeUrl = `https://co-ownership-property.com/unsubscribe?email=${encodeURIComponent(to)}`;

  const html = await render(
    React.createElement(Template, { firstName, viewings, unsubscribeUrl })
  );

  // Clean up the bundle now we have the HTML
  try { fs.unlinkSync(tmpFile); } catch {}

  // ── Send via Resend ────────────────────────────────────────────────────────
  const resend = new Resend(process.env.RESEND_API_KEY);
  console.log(`Sending "${subject}" to ${to}…`);
  const { data, error } = await resend.emails.send({
    from: fromAddr,
    to,
    subject,
    html,
    reply_to: 'info@co-ownership-property.com',
    headers: {
      'X-Test-Email': 'viewings-france-preview',
    },
  });

  if (error) {
    console.error('Resend error:', error);
    process.exit(1);
  }
  console.log('Sent. Resend id:', data?.id);
  console.log('Properties in this send:', viewings.map(v => v.displayName).join(', '));
}

main().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
