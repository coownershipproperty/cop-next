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
// Gmail and Outlook block web fonts, so the design is built on Georgia — the one
// serif every client renders well — with Helvetica/Arial only for prices.
const FONT  = "'Helvetica Neue', Helvetica, Arial, sans-serif";
const SERIF = "Georgia, 'Times New Roman', serif";
const CAPS  = "Georgia, 'Times New Roman', serif";

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

// Uniform crops. Supabase Storage renders on the fly (…/render/image/… with
// resize=cover); other hosts get the original with a fixed box + object-fit.
function crop(url: string, w: number, h: number) {
  if (!url) return url;
  if (url.includes('/storage/v1/object/public/')) {
    return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + `?width=${w}&height=${h}&resize=cover&quality=82`;
  }
  return url;
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
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={leadBox}>
      <tbody>
        <tr><td style={{ padding: 0 }}>
          <Link href={href} style={{ display: 'block' }}>
            <Img src={crop(p.imageUrl, 1120, 700)} alt={p.title} width="560" style={leadImg} />
          </Link>
        </td></tr>
        <tr><td style={{ padding: '26px 8px 34px', textAlign: 'center' as const }}>
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

// ── Row: one home per line — image left, words right; stacks on mobile ───────
function RowCard({ p }: { p: Property }) {
  const href = hrefFor(p);
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={rowBox}>
      <tbody><tr>
        <td className="rowcell" width="240" style={{ verticalAlign: 'top', paddingRight: 26 }}>
          <Link href={href} style={{ display: 'block' }}>
            <Img src={crop(p.imageUrl, 480, 360)} alt={p.title} width="240" className="rowimg" style={rowImg} />
          </Link>
        </td>
        <td className="rowcell rowtext" style={{ verticalAlign: 'middle' }}>
          <Text style={rowPlace}>{splitTitle(p).place}</Text>
          <Link href={href} style={{ textDecoration: 'none' }}>
            <Text className="rowtitle" style={rowTitle}>{splitTitle(p).name}</Text>
          </Link>
          <Text className="rowprice" style={rowPrice}>{p.price}<span style={perShare}>&ensp;per share{metaLine(p) ? `\u2002·\u2002${metaLine(p)}` : ''}</span></Text>
          <Link href={href} style={viewLinkSm}>Discover</Link>
        </td>
      </tr></tbody>
    </table>
  );
}

// **bold** markers in the campaign intro → <strong>
function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={i} style={{ fontWeight: 700, color: C.navy }}>{part.slice(2, -2)}</strong>
    : part);
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
  // Show the eight best-matched homes, generously — the rest live behind the
  // "view all" button (David, 9 Sep 2026: the packed grid felt cramped).
  const SHOWN    = 8;
  const lead     = allProps[0];
  const rest     = allProps.slice(1, SHOWN);
  const n        = allProps.length;
  const more     = n - Math.min(n, SHOWN);

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
          @media only screen and (max-width: 520px) {
            .rowcell { display: block !important; width: 100% !important; padding: 0 !important; }
            .rowimg { width: 100% !important; height: auto !important; }
            .rowtext { padding-top: 16px !important; }
            .pad { padding-left: 16px !important; padding-right: 16px !important; }
            .h1 { font-size: 36px !important; }
            .intro { font-size: 18px !important; }
            .rowtitle { font-size: 24px !important; }
            .rowprice { font-size: 19px !important; }
            .btn { display: block !important; font-size: 15px !important; }
          }
        `}</style>
      </Head>
      <Preview>{previewLine}</Preview>

      <Body style={bodyStyle}>
        <Container style={container}>
        <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={sheet}><tbody><tr><td>

          {/* Masthead */}
          <Section className="pad" style={masthead}>
            <Link href={base} style={{ textDecoration: 'none' }}><Text style={mark}>COP</Text></Link>
            <Text style={markSub}>Co-Ownership Property</Text>
            <Rule width={36} />
            <Text style={issueStyle}>New this week&ensp;·&ensp;{issueLine}</Text>
          </Section>

          {/* Headline + intro */}
          <Section className="pad" style={{ padding: '30px 40px 10px', textAlign: 'center' as const }}>
            <Text className="h1" style={h1}>{headline}</Text>
            <Text style={greetingStyle}>{greeting}</Text>
            <Text className="intro" style={introStyle}>{renderBold(intro)}</Text>
          </Section>

          {/* Lead home */}
          {lead && (
            <Section className="pad" style={{ padding: '18px 40px 0' }}>
              <LeadCard p={lead} />
            </Section>
          )}

          {/* The rest of the selection, one per line */}
          {rest.length > 0 && (
            <Section className="pad" style={{ padding: '6px 40px 0' }}>
              <Text style={gridHeading}>Also chosen for you</Text>
              {rest.map((p, i) => <RowCard key={i} p={p} />)}
            </Section>
          )}

          {/* CTA */}
          <Section className="pad" style={{ padding: '34px 40px 10px', textAlign: 'center' as const }}>
            {more > 0 && <Text style={moreLine}>{`+ ${more} more new home${more === 1 ? '' : 's'} this week`}</Text>}
            <Link href={`${base}/our-homes/`} className="btn" style={button}>View all {n} new homes</Link>
          </Section>
          <Section className="pad" style={{ padding: '34px 60px 20px', textAlign: 'center' as const }}>
            <Rule width={36} />
            <Text style={nudge}>Anything catch your eye?<br />Simply reply to this email — a real person answers.</Text>
          </Section>

          {/* Footer */}
          <Section className="pad" style={footer}>
            <Text style={footMark}>COP</Text>
            <Rule width={28} />
            <Text style={footText}>
              <Link href={base} style={footLink}>Website</Link>
              {'\u2003\u2003'}
              <Link href={`${base}/our-homes/`} style={footLink}>Our Homes</Link>
              {'\u2003\u2003'}
              <Link href={`${base}/how-it-works/`} style={footLink}>How it works</Link>
            </Text>
            <Text style={{ ...footText, margin: '0 0 22px' }}><Link href={unsubscribeUrl} style={{ ...footLink, color: C.muted }}>Unsubscribe</Link></Text>
            <Text style={footSmall}>Co-Ownership Property · Deeded fractional homes in Europe and the USA<br />You're receiving this because you enquired or subscribed on our site.</Text>
          </Section>

        </td></tr></tbody></table>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const bodyStyle: React.CSSProperties = { margin: 0, padding: '28px 0 34px', backgroundColor: C.paper, fontFamily: FONT };
const container: React.CSSProperties = { maxWidth: 640, margin: '0 auto' };
// The whole issue sits on one white sheet with a hairline frame on the ivory ground.
const sheet: React.CSSProperties = { backgroundColor: C.card, border: `1px solid ${C.line}`, borderTop: `3px solid ${C.navy}` };
const leadBox: React.CSSProperties = { marginBottom: 6, borderBottom: `1px solid ${C.line}` };
const rowBox: React.CSSProperties = { borderBottom: `1px solid ${C.line}`, paddingBottom: 26, marginBottom: 26 };

const masthead: React.CSSProperties = { padding: '40px 40px 26px', textAlign: 'center' as const, borderBottom: `1px solid ${C.line}` };
const mark: React.CSSProperties = { fontFamily: SERIF, fontSize: 36, fontWeight: 400, letterSpacing: '0.3em', color: C.navy, margin: '0 0 4px', paddingLeft: '0.3em' };
const markSub: React.CSSProperties = { fontFamily: CAPS, fontSize: 11, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: C.muted, margin: '0 0 16px', paddingLeft: '0.3em' };
const issueStyle: React.CSSProperties = { fontFamily: CAPS, fontSize: 12, fontStyle: 'italic', color: C.muted, margin: '16px 0 0' };

const h1: React.CSSProperties = { fontFamily: SERIF, fontSize: 40, lineHeight: '1.15', fontWeight: 400, color: C.navy, margin: '0 0 16px' };
const greetingStyle: React.CSSProperties = { fontFamily: SERIF, fontSize: 21, fontStyle: 'italic', color: C.body, margin: '0 0 10px' };
const introStyle: React.CSSProperties = { fontFamily: SERIF, fontSize: 18, fontWeight: 400, lineHeight: '1.65', color: C.body, margin: 0 };

const eyebrow: React.CSSProperties = { fontFamily: CAPS, fontSize: 12, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 8px' };
const leadImg: React.CSSProperties = { width: '100%', maxWidth: 560, height: 'auto', display: 'block' };
const leadTitle: React.CSSProperties = { fontFamily: SERIF, fontSize: 32, lineHeight: '1.2', fontWeight: 400, color: C.navy, margin: '0 0 12px' };
const meta: React.CSSProperties = { fontFamily: FONT, fontSize: 12, color: C.muted, margin: '0 0 10px' };
const leadPrice: React.CSSProperties = { fontFamily: FONT, fontSize: 21, fontWeight: 600, letterSpacing: '0.01em', color: C.ink, margin: '0 0 18px' };
const perShare: React.CSSProperties = { fontFamily: CAPS, fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: C.muted };
const viewLink: React.CSSProperties = { display: 'inline-block', fontFamily: CAPS, fontSize: 13, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: C.navy, textDecoration: 'none', borderBottom: `1px solid ${C.gold}`, paddingBottom: 5 };

const gridHeading: React.CSSProperties = { fontFamily: CAPS, fontSize: 12, letterSpacing: '0.28em', textTransform: 'uppercase' as const, color: C.muted, textAlign: 'center' as const, margin: '10px 0 30px' };
const rowImg: React.CSSProperties = { width: '100%', height: 'auto', display: 'block' };
const rowPlace: React.CSSProperties = { fontFamily: CAPS, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 8px' };
const rowTitle: React.CSSProperties = { fontFamily: SERIF, fontSize: 22, fontWeight: 400, lineHeight: '1.3', color: C.navy, margin: '0 0 10px' };
const rowPrice: React.CSSProperties = { fontFamily: FONT, fontSize: 17, fontWeight: 600, letterSpacing: '0.01em', color: C.ink, margin: '0 0 14px' };
const moreLine: React.CSSProperties = { fontFamily: SERIF, fontSize: 16, fontStyle: 'italic', color: C.muted, margin: '0 0 20px' };
const viewLinkSm: React.CSSProperties = { display: 'inline-block', fontFamily: CAPS, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: C.navy, textDecoration: 'none', borderBottom: `1px solid ${C.gold}`, paddingBottom: 4 };

const button: React.CSSProperties = { display: 'inline-block', backgroundColor: C.navy, color: '#FFFFFF', fontFamily: CAPS, fontSize: 14, letterSpacing: '0.2em', textTransform: 'uppercase' as const, padding: '18px 36px', textDecoration: 'none' };
const nudge: React.CSSProperties = { fontFamily: SERIF, fontSize: 18, lineHeight: '1.6', fontStyle: 'italic', color: C.body, margin: '26px 0 0' };

const footer: React.CSSProperties = { padding: '46px 40px 30px', marginTop: 40, borderTop: `1px solid ${C.line}`, textAlign: 'center' as const, backgroundColor: C.paper };
const footMark: React.CSSProperties = { fontFamily: SERIF, fontSize: 24, letterSpacing: '0.3em', color: C.navy, margin: '0 0 16px', paddingLeft: '0.3em' };
const footText: React.CSSProperties = { fontFamily: CAPS, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.body, margin: '24px 0 20px', lineHeight: '2.2' };
const footLink: React.CSSProperties = { color: C.body, textDecoration: 'none' };
const footSmall: React.CSSProperties = { fontFamily: SERIF, fontSize: 13, fontStyle: 'italic', lineHeight: '1.7', color: C.muted, margin: 0 };
