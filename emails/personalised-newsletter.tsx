import {
  Body, Container, Head, Html, Img, Link, Preview, Section, Text,
} from '@react-email/components';
import * as React from 'react';

/**
 * Personalised new-listings newsletter — redesigned 9 Sep 2026.
 *
 * White, photo-led, one action per home. The first (best-matched) home runs
 * full width; every other home sits in a two-column grid that stacks on
 * phones. ALL homes are shown — the old template capped at six cards while
 * announcing the full count. Cards are deliberately light (one image, three
 * lines, one link) so 13+ homes stay well under Gmail's ~100 KB clipping
 * limit. Type is a system sans stack — email clients that block web fonts
 * (Gmail, Outlook) render exactly what we designed.
 *
 * Props are unchanged from the previous template, so lib/newsletter/render.js
 * needs no edit. `introOverride` is the campaign's intro_text with merge tags
 * applied — used when present.
 */

interface Property {
  slug: string;
  title: string;
  price: string;
  beds: number;
  size: number;
  imageUrl: string;
  location?: string;
  regionTag?: string;
  galleryUrl?: string;
}

interface PersonalisedNewsletterEmailProps {
  firstName?: string;
  primaryProperties?: Property[];
  fallbackProperties?: Property[];
  unsubscribeUrl?: string;
  introOverride?: string | null;
}

const C = {
  navy:  '#152A3D',
  ink:   '#1F2937',
  body:  '#4B5563',
  muted: '#8A94A0',
  line:  '#E9E5DD',
  gold:  '#B8933F',
  white: '#FFFFFF',
  soft:  '#F7F5F0',
};

const base = 'https://co-ownership-property.com';
const FONT = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";

function hrefFor(p: Property) {
  return p.galleryUrl || `${base}/property/${p.slug}/`;
}

// Titles are "Place, Region, Country — What it is". Split them so the place
// reads as a small label and the home itself is the title.
function splitTitle(p: Property) {
  const i = p.title.indexOf(' — ');
  if (i > 0) return { place: p.title.slice(0, i), name: p.title.slice(i + 3) };
  return { place: p.location || '', name: p.title };
}

function metaLine(p: Property) {
  const bits: string[] = [];
  if (p.beds > 0) bits.push(`${p.beds} bed${p.beds > 1 ? 's' : ''}`);
  if (p.size > 0) bits.push(`${p.size} m²`);
  return bits.join('  ·  ');
}

// ── Lead home: full width ─────────────────────────────────────────────────────
function LeadCard({ p }: { p: Property }) {
  const href = hrefFor(p);
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={{ marginBottom: 28 }}>
      <tbody>
        <tr><td>
          <Link href={href} style={{ display: 'block' }}>
            <Img src={p.imageUrl} alt={p.title} width="600" style={leadImg} />
          </Link>
        </td></tr>
        <tr><td style={{ padding: '16px 0 0' }}>
          <Text style={eyebrow}>{splitTitle(p).place}</Text>
          <Link href={href} style={{ textDecoration: 'none' }}>
            <Text style={leadTitle}>{splitTitle(p).name}</Text>
          </Link>
          {metaLine(p) ? <Text style={meta}>{metaLine(p)}</Text> : null}
          <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
            <tbody><tr>
              <td style={{ verticalAlign: 'baseline' }}>
                <Text style={leadPrice}>{p.price} <span style={perShare}>per 1/8 share</span></Text>
              </td>
              <td align="right" style={{ verticalAlign: 'baseline' }}>
                <Link href={href} style={viewLink}>View home →</Link>
              </td>
            </tr></tbody>
          </table>
        </td></tr>
      </tbody>
    </table>
  );
}

// ── Grid card: two per row, stacks on mobile ──────────────────────────────────
function GridCard({ p }: { p: Property }) {
  const href = hrefFor(p);
  return (
    <>
      <Link href={href} style={{ display: 'block' }}>
        <Img src={p.imageUrl} alt={p.title} width="284" className="gridimg" style={gridImg} />
      </Link>
      <Text style={gridPlace}>{splitTitle(p).place}</Text>
      <Link href={href} style={{ textDecoration: 'none' }}>
        <Text style={gridTitle}>{splitTitle(p).name}</Text>
      </Link>
      {metaLine(p) ? <Text style={gridMeta}>{metaLine(p)}</Text> : null}
      <Text style={gridPrice}>
        {p.price} <span style={perShare}>per share</span>
        <span style={{ float: 'right' }}><Link href={href} style={viewLinkSm}>View →</Link></span>
      </Text>
    </>
  );
}

function pairs<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2));
  return out;
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PersonalisedNewsletterEmail({
  firstName = 'there',
  primaryProperties = [],
  fallbackProperties = [],
  unsubscribeUrl = `${base}/unsubscribe`,
  introOverride = null,
}: PersonalisedNewsletterEmailProps) {
  const allProps = [...primaryProperties, ...fallbackProperties];
  const lead     = allProps[0];
  const rest     = allProps.slice(1);
  const n        = allProps.length;

  const regions = [...new Set(allProps.map(p => p.regionTag || p.location?.split(',')[0]).filter(Boolean))] as string[];
  const top3    = regions.slice(0, 3);
  const regionStr = regions.length > 3
    ? top3.join(', ') + ' & more'
    : top3.length > 1
      ? top3.slice(0, -1).join(', ') + ' & ' + top3[top3.length - 1]
      : top3[0] || '';

  const headline = `${n} new home${n === 1 ? '' : 's'} this week`;
  const greeting = firstName !== 'there' ? `Hi ${firstName},` : 'Hello,';
  const defaultIntro = regionStr
    ? `${n} co-ownership homes went live this week, starting with ${regionStr} — your areas first. Every one is deeded fractional ownership of the whole home, fully managed between stays.`
    : `${n} co-ownership homes went live this week. Every one is deeded fractional ownership of the whole home, fully managed between stays.`;
  // The campaign intro already opens with "Hi {name} —"; strip that so the
  // greeting line above it isn't doubled.
  const intro = (introOverride || '').replace(/^\s*hi\s+[^—\-–:,]*\s*[—\-–:,]\s*/i, '').trim() || defaultIntro;
  const previewLine = `${headline}${regionStr ? ` — starting with ${regionStr}` : ''}`;

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @media only screen and (max-width: 520px) {
            .col { display: block !important; width: 100% !important; padding: 0 0 26px !important; }
            .gridimg { width: 100% !important; height: auto !important; }
            .pad { padding-left: 18px !important; padding-right: 18px !important; }
          }
        `}</style>
      </Head>
      <Preview>{previewLine}</Preview>

      <Body style={bodyStyle}>
        <Container style={container}>

          {/* Top bar */}
          <Section className="pad" style={topBar}>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
              <tbody><tr>
                <td><Link href={base} style={wordmark}>CO-OWNERSHIP PROPERTY</Link></td>
                <td align="right"><Text style={topRight}>New this week</Text></td>
              </tr></tbody>
            </table>
          </Section>

          {/* Headline + intro */}
          <Section className="pad" style={{ padding: '36px 30px 6px' }}>
            <Text style={greetingStyle}>{greeting}</Text>
            <Text style={h1}>{headline}</Text>
            <Text style={introStyle}>{intro}</Text>
          </Section>

          {/* Lead home */}
          {lead && (
            <Section className="pad" style={{ padding: '18px 30px 0' }}>
              <LeadCard p={lead} />
            </Section>
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <Section className="pad" style={{ padding: '0 30px' }}>
              <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
                <tbody>
                  {pairs(rest).map((row, i) => (
                    <tr key={i}>
                      <td className="col" width="50%" style={{ verticalAlign: 'top', padding: '0 8px 30px 0' }}>
                        <GridCard p={row[0]} />
                      </td>
                      <td className="col" width="50%" style={{ verticalAlign: 'top', padding: '0 0 30px 8px' }}>
                        {row[1] ? <GridCard p={row[1]} /> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* CTA */}
          <Section className="pad" style={{ padding: '4px 30px 8px', textAlign: 'center' as const }}>
            <Link href={`${base}/our-homes/`} style={button}>See all {n} new homes</Link>
            <Text style={nudge}>Anything catch your eye? Just reply to this email — a real person answers.</Text>
          </Section>

          {/* Footer */}
          <Section className="pad" style={footer}>
            <Text style={footText}>
              <Link href={base} style={footLink}>Website</Link>
              {'   ·   '}
              <Link href={`${base}/our-homes/`} style={footLink}>Our Homes</Link>
              {'   ·   '}
              <Link href={`${base}/how-it-works/`} style={footLink}>How it works</Link>
              {'   ·   '}
              <Link href={unsubscribeUrl} style={footLink}>Unsubscribe</Link>
            </Text>
            <Text style={footSmall}>Co-Ownership Property · Deeded fractional homes in Europe and the USA · You're receiving this because you enquired or subscribed on our site.</Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const bodyStyle: React.CSSProperties = { margin: 0, padding: 0, backgroundColor: C.white, fontFamily: FONT };
const container: React.CSSProperties = { maxWidth: 600, margin: '0 auto', backgroundColor: C.white };

const topBar: React.CSSProperties = { padding: '22px 30px 18px', borderBottom: `1px solid ${C.line}` };
const wordmark: React.CSSProperties = {
  fontFamily: FONT, fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', color: C.navy, textDecoration: 'none',
};
const topRight: React.CSSProperties = { fontFamily: FONT, fontSize: 12, color: C.muted, margin: 0, letterSpacing: '0.02em' };

const greetingStyle: React.CSSProperties = { fontFamily: FONT, fontSize: 15, color: C.body, margin: '0 0 6px' };
const h1: React.CSSProperties = {
  fontFamily: SERIF, fontSize: 34, lineHeight: '1.15', fontWeight: 400, color: C.navy, margin: '0 0 14px', letterSpacing: '-0.01em',
};
const introStyle: React.CSSProperties = { fontFamily: FONT, fontSize: 16, lineHeight: '1.6', color: C.body, margin: 0 };

const eyebrow: React.CSSProperties = {
  fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.gold, margin: '0 0 6px',
};
const leadImg: React.CSSProperties = { width: '100%', height: 'auto', display: 'block', borderRadius: 4 };
const leadTitle: React.CSSProperties = { fontFamily: SERIF, fontSize: 24, lineHeight: '1.25', color: C.navy, margin: '0 0 6px' };
const meta: React.CSSProperties = { fontFamily: FONT, fontSize: 13, color: C.muted, margin: '0 0 10px' };
const leadPrice: React.CSSProperties = { fontFamily: FONT, fontSize: 20, fontWeight: 600, color: C.ink, margin: 0 };
const perShare: React.CSSProperties = { fontFamily: FONT, fontSize: 12, fontWeight: 400, color: C.muted };
const viewLink: React.CSSProperties = { fontFamily: FONT, fontSize: 14, fontWeight: 600, color: C.navy, textDecoration: 'none', borderBottom: `2px solid ${C.gold}`, paddingBottom: 2 };

const gridImg: React.CSSProperties = { width: '100%', height: 'auto', display: 'block', borderRadius: 4 };
const gridPlace: React.CSSProperties = { fontFamily: FONT, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.gold, margin: '12px 0 4px' };
const gridTitle: React.CSSProperties = { fontFamily: FONT, fontSize: 15, fontWeight: 600, lineHeight: '1.35', color: C.navy, margin: '0 0 4px' };
const gridMeta: React.CSSProperties = { fontFamily: FONT, fontSize: 12, color: C.muted, margin: '0 0 6px' };
const gridPrice: React.CSSProperties = { fontFamily: FONT, fontSize: 15, fontWeight: 600, color: C.ink, margin: 0 };
const viewLinkSm: React.CSSProperties = { fontFamily: FONT, fontSize: 12, fontWeight: 600, color: C.gold, textDecoration: 'none' };

const button: React.CSSProperties = {
  display: 'inline-block', backgroundColor: C.navy, color: C.white, fontFamily: FONT, fontSize: 14, fontWeight: 600,
  padding: '14px 28px', borderRadius: 4, textDecoration: 'none', letterSpacing: '0.01em',
};
const nudge: React.CSSProperties = { fontFamily: FONT, fontSize: 14, color: C.body, margin: '22px 0 0' };

const footer: React.CSSProperties = { padding: '30px 30px 36px', marginTop: 28, borderTop: `1px solid ${C.line}`, textAlign: 'center' as const };
const footText: React.CSSProperties = { fontFamily: FONT, fontSize: 12, color: C.muted, margin: '0 0 12px' };
const footLink: React.CSSProperties = { color: C.body, textDecoration: 'none' };
const footSmall: React.CSSProperties = { fontFamily: FONT, fontSize: 11, lineHeight: '1.6', color: C.muted, margin: 0 };
