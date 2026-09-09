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

// Palette — ivory paper, charcoal ink, a whisper of gold. Nothing shouts.
const C = {
  paper: '#F8F6F1',
  card:  '#FFFFFF',
  ink:   '#1B2430',
  navy:  '#1E3448',
  body:  '#4E5863',
  muted: '#8B9199',
  line:  '#E3DDD2',
  gold:  '#B9974A',
};

const base = 'https://co-ownership-property.com';
const FONT  = "'Jost', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif";

const WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','twenty-one','twenty-two','twenty-three','twenty-four','twenty-five','twenty-six','twenty-seven','twenty-eight','twenty-nine','thirty'];
const numWord = (n: number) => (n >= 0 && n < WORDS.length ? WORDS[n] : String(n));
const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

// Thin centred gold rule
function Rule({ width = 40 }: { width?: number }) {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody><tr><td align="center">
        <table width={width} cellPadding="0" cellSpacing="0" role="presentation">
          <tbody><tr><td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td></tr></tbody>
        </table>
      </td></tr></tbody>
    </table>
  );
}

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

// Titles already say "3-Bed …", so beds are only repeated when the title
// doesn't carry them (David, 9 Sep 2026). Size shows when we have it.
function metaLine(p: Property) {
  const bits: string[] = [];
  if (p.beds > 0 && !/\bbed/i.test(p.title)) bits.push(`${p.beds} bed${p.beds > 1 ? 's' : ''}`);
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
        <tr><td style={{ padding: '22px 0 0', textAlign: 'center' as const }}>
          <Text style={eyebrow}>{splitTitle(p).place}</Text>
          <Link href={href} style={{ textDecoration: 'none' }}>
            <Text style={leadTitle}>{splitTitle(p).name}</Text>
          </Link>
          <Text style={leadPrice}>{p.price}<span style={perShare}>&ensp;per 1/8 share{metaLine(p) ? `  ·  ${metaLine(p)}` : ''}</span></Text>
          <Link href={href} style={viewLink}>Discover the home</Link>
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
      <div style={{ textAlign: 'center' as const }}>
        <Text style={gridPlace}>{splitTitle(p).place}</Text>
        <Link href={href} style={{ textDecoration: 'none' }}>
          <Text style={gridTitle}>{splitTitle(p).name}</Text>
        </Link>
        <Text style={gridPrice}>{p.price}<span style={perShare}>&ensp;per share{metaLine(p) ? `  ·  ${metaLine(p)}` : ''}</span></Text>
        <Link href={href} style={viewLinkSm}>Discover</Link>
      </div>
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

  const headline = `${cap(numWord(n))} new home${n === 1 ? '' : 's'} this week`;
  const greeting = firstName !== 'there' ? `Dear ${firstName},` : 'Dear reader,';
  const issueLine = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
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
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,400&family=Jost:wght@300;400;500&display=swap');
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

          {/* Masthead */}
          <Section className="pad" style={masthead}>
            <Link href={base} style={{ textDecoration: 'none' }}><Text style={mark}>COP</Text></Link>
            <Text style={markSub}>Co-Ownership Property</Text>
            <Rule width={36} />
            <Text style={issueStyle}>New this week&ensp;·&ensp;{issueLine}</Text>
          </Section>

          {/* Headline + intro */}
          <Section className="pad" style={{ padding: '30px 40px 10px', textAlign: 'center' as const }}>
            <Text style={h1}>{headline}</Text>
            <Text style={greetingStyle}>{greeting}</Text>
            <Text style={introStyle}>{intro}</Text>
          </Section>

          {/* Lead home */}
          {lead && (
            <Section className="pad" style={{ padding: '18px 40px 0' }}>
              <LeadCard p={lead} />
            </Section>
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <Section className="pad" style={{ padding: '0 40px' }}>
              <Rule width={36} />
              <Text style={gridHeading}>Also new this week</Text>
              <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
                <tbody>
                  {pairs(rest).map((row, i) => (
                    <tr key={i}>
                      <td className="col" width="50%" style={{ verticalAlign: 'top', padding: '0 12px 38px 0' }}>
                        <GridCard p={row[0]} />
                      </td>
                      <td className="col" width="50%" style={{ verticalAlign: 'top', padding: '0 0 38px 12px' }}>
                        {row[1] ? <GridCard p={row[1]} /> : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* CTA */}
          <Section className="pad" style={{ padding: '0 40px 8px', textAlign: 'center' as const }}>
            <Link href={`${base}/our-homes/`} style={button}>View all {n} new homes</Link>
            <Text style={nudge}>Anything catch your eye? Simply reply to this email — a real person answers.</Text>
          </Section>

          {/* Footer */}
          <Section className="pad" style={footer}>
            <Text style={footMark}>COP</Text>
            <Rule width={28} />
            <Text style={footText}>
              <Link href={base} style={footLink}>Website</Link>
              {'   ·   '}
              <Link href={`${base}/our-homes/`} style={footLink}>Our Homes</Link>
              {'   ·   '}
              <Link href={`${base}/how-it-works/`} style={footLink}>How it works</Link>
              {'   ·   '}
              <Link href={unsubscribeUrl} style={footLink}>Unsubscribe</Link>
            </Text>
            <Text style={footSmall}>Co-Ownership Property · Deeded fractional homes in Europe and the USA<br />You're receiving this because you enquired or subscribed on our site.</Text>
          </Section>

        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const bodyStyle: React.CSSProperties = { margin: 0, padding: '0 0 30px', backgroundColor: C.paper, fontFamily: FONT };
const container: React.CSSProperties = { maxWidth: 640, margin: '0 auto', backgroundColor: C.paper };

const masthead: React.CSSProperties = { padding: '40px 40px 26px', textAlign: 'center' as const, borderBottom: `1px solid ${C.line}` };
const mark: React.CSSProperties = { fontFamily: SERIF, fontSize: 34, fontWeight: 400, letterSpacing: '0.28em', color: C.navy, margin: '0 0 2px', paddingLeft: '0.28em' };
const markSub: React.CSSProperties = { fontFamily: FONT, fontSize: 9, fontWeight: 500, letterSpacing: '0.34em', textTransform: 'uppercase' as const, color: C.muted, margin: '0 0 16px', paddingLeft: '0.34em' };
const issueStyle: React.CSSProperties = { fontFamily: FONT, fontSize: 10, fontWeight: 400, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.muted, margin: '16px 0 0' };

const h1: React.CSSProperties = { fontFamily: SERIF, fontSize: 40, lineHeight: '1.12', fontWeight: 300, color: C.navy, margin: '0 0 18px', letterSpacing: '0.005em' };
const greetingStyle: React.CSSProperties = { fontFamily: SERIF, fontSize: 19, fontStyle: 'italic', color: C.body, margin: '0 0 10px' };
const introStyle: React.CSSProperties = { fontFamily: FONT, fontSize: 15, fontWeight: 300, lineHeight: '1.75', color: C.body, margin: 0 };

const eyebrow: React.CSSProperties = { fontFamily: FONT, fontSize: 10, fontWeight: 500, letterSpacing: '0.26em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 8px' };
const leadImg: React.CSSProperties = { width: '100%', height: 'auto', display: 'block' };
const leadTitle: React.CSSProperties = { fontFamily: SERIF, fontSize: 30, lineHeight: '1.2', fontWeight: 400, color: C.navy, margin: '0 0 12px' };
const meta: React.CSSProperties = { fontFamily: FONT, fontSize: 12, color: C.muted, margin: '0 0 10px' };
const leadPrice: React.CSSProperties = { fontFamily: SERIF, fontSize: 24, fontWeight: 400, color: C.ink, margin: '0 0 18px' };
const perShare: React.CSSProperties = { fontFamily: FONT, fontSize: 11, fontWeight: 400, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: C.muted };
const viewLink: React.CSSProperties = { display: 'inline-block', fontFamily: FONT, fontSize: 11, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: C.navy, textDecoration: 'none', borderBottom: `1px solid ${C.gold}`, paddingBottom: 5 };

const gridHeading: React.CSSProperties = { fontFamily: FONT, fontSize: 10, fontWeight: 500, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: C.muted, textAlign: 'center' as const, margin: '18px 0 30px' };
const gridImg: React.CSSProperties = { width: '100%', height: 'auto', display: 'block' };
const gridPlace: React.CSSProperties = { fontFamily: FONT, fontSize: 9, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: C.gold, margin: '16px 0 6px' };
const gridTitle: React.CSSProperties = { fontFamily: SERIF, fontSize: 20, fontWeight: 400, lineHeight: '1.25', color: C.navy, margin: '0 0 8px' };
const gridMeta: React.CSSProperties = { fontFamily: FONT, fontSize: 12, color: C.muted, margin: '0 0 6px' };
const gridPrice: React.CSSProperties = { fontFamily: SERIF, fontSize: 18, fontWeight: 400, color: C.ink, margin: '0 0 12px' };
const viewLinkSm: React.CSSProperties = { display: 'inline-block', fontFamily: FONT, fontSize: 10, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: C.navy, textDecoration: 'none', borderBottom: `1px solid ${C.gold}`, paddingBottom: 4 };

const button: React.CSSProperties = { display: 'inline-block', backgroundColor: C.navy, color: '#FFFFFF', fontFamily: FONT, fontSize: 11, fontWeight: 500, letterSpacing: '0.24em', textTransform: 'uppercase' as const, padding: '17px 34px', textDecoration: 'none' };
const nudge: React.CSSProperties = { fontFamily: SERIF, fontSize: 17, fontStyle: 'italic', color: C.body, margin: '26px 0 0' };

const footer: React.CSSProperties = { padding: '34px 40px 10px', marginTop: 34, borderTop: `1px solid ${C.line}`, textAlign: 'center' as const };
const footMark: React.CSSProperties = { fontFamily: SERIF, fontSize: 22, letterSpacing: '0.28em', color: C.navy, margin: '0 0 14px', paddingLeft: '0.28em' };
const footText: React.CSSProperties = { fontFamily: FONT, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: C.muted, margin: '18px 0 14px' };
const footLink: React.CSSProperties = { color: C.body, textDecoration: 'none' };
const footSmall: React.CSSProperties = { fontFamily: FONT, fontSize: 11, fontWeight: 300, lineHeight: '1.7', color: C.muted, margin: 0 };
