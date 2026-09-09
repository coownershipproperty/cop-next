import {
  Body, Container, Head, Html, Img, Link, Preview, Section, Text,
} from '@react-email/components';
import * as React from 'react';

/**
 * Personalised new-listings newsletter — redesigned 9 Sep 2026.
 *
 * All-serif, two colours, lots of air. Gmail and Outlook strip web fonts, so
 * the type is a system stack that lands on Didot / Baskerville for the Mac and
 * iPhone readers who are most of this list, and on Bodoni MT / Georgia
 * elsewhere — never on a sans, which is what made earlier drafts read as a
 * template. Ink and a single muted gold are the whole palette; the greys are
 * gone (David, 9 Sep 2026: "too many different colours").
 *
 * Shows the eight best-matched homes and links the rest to /our-homes.
 * Props are unchanged, so lib/newsletter/render.js needs no edit.
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

// Two colours. Ink for everything that is read, gold for the hairlines.
const C = {
  paper: '#F6F3ED',
  card:  '#FFFFFF',
  ink:   '#1C2B3A',
  soft:  '#5D6B78',
  line:  '#E2DCD0',
  gold:  '#A98A45',
  goldD: '#8C6F30',
};

const base = 'https://co-ownership-property.com';
// Didot and Baskerville ship on macOS and iOS; Bodoni MT comes with Office on
// Windows. Georgia is the last stop, never a sans.
const DISPLAY = "Didot, 'Didot LT STD', 'Bodoni MT', 'Playfair Display', Georgia, serif";
const TEXT    = "Georgia, 'Times New Roman', serif";

const WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','twenty-one','twenty-two','twenty-three','twenty-four','twenty-five','twenty-six','twenty-seven','twenty-eight','twenty-nine','thirty'];
const numWord = (n: number) => (n >= 0 && n < WORDS.length ? WORDS[n] : String(n));
const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

function Rule({ width = 40, color = C.gold }: { width?: number; color?: string }) {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody><tr><td align="center">
        <table width={width} cellPadding="0" cellSpacing="0" role="presentation">
          <tbody><tr><td style={{ backgroundColor: color, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td></tr></tbody>
        </table>
      </td></tr></tbody>
    </table>
  );
}

function hrefFor(p: Property) {
  return p.galleryUrl || `${base}/property/${p.slug}/`;
}

// Uniform crops, rendered by Supabase Storage on the fly.
function crop(url: string, w: number, h: number) {
  if (!url) return url;
  if (url.includes('/storage/v1/object/public/')) {
    return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + `?width=${w}&height=${h}&resize=cover&quality=82`;
  }
  return url;
}

// "Place, Region, Country — What it is" → a small label and a real title.
function splitTitle(p: Property) {
  const i = p.title.indexOf(' — ');
  if (i > 0) return { place: p.title.slice(0, i), name: p.title.slice(i + 3) };
  return { place: p.location || '', name: p.title };
}

// **bold** in the campaign intro → <strong>, so locations stand out.
function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={i} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>
    : part);
}

// ── Lead home ────────────────────────────────────────────────────────────────
function LeadCard({ p }: { p: Property }) {
  const href = hrefFor(p);
  const { place, name } = splitTitle(p);
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody>
        <tr><td>
          <Link href={href} style={{ display: 'block' }}>
            <Img src={crop(p.imageUrl, 1120, 720)} alt={p.title} width="560" style={leadImg} />
          </Link>
        </td></tr>
        <tr><td style={{ padding: '30px 10px 0', textAlign: 'center' as const }}>
          <Text style={place1}>{place}</Text>
          <Link href={href} style={{ textDecoration: 'none' }}>
            <Text className="leadtitle" style={leadTitle}>{name}</Text>
          </Link>
          <Text style={priceLine}>{p.price} <span style={perShare}>per 1/8 share</span></Text>
          <Link href={href} className="btn" style={goldBtn}>Discover the home</Link>
        </td></tr>
      </tbody>
    </table>
  );
}

// ── One home per line: picture beside the words; stacks on a phone ───────────
function RowCard({ p }: { p: Property }) {
  const href = hrefFor(p);
  const { place, name } = splitTitle(p);
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={rowBox}>
      <tbody><tr>
        <td className="rowcell" width="230" style={{ verticalAlign: 'middle', paddingRight: 28 }}>
          <Link href={href} style={{ display: 'block' }}>
            <Img src={crop(p.imageUrl, 460, 345)} alt={p.title} width="230" className="rowimg" style={rowImg} />
          </Link>
        </td>
        <td className="rowcell rowtext" style={{ verticalAlign: 'middle' }}>
          <Text style={place2}>{place}</Text>
          <Link href={href} style={{ textDecoration: 'none' }}>
            <Text className="rowtitle" style={rowTitle}>{name}</Text>
          </Link>
          <Text style={rowPrice}>{p.price} <span style={perShare}>per share</span></Text>
          <Link href={href} style={goldBtnSm}>Discover this home</Link>
        </td>
      </tr></tbody>
    </table>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function PersonalisedNewsletterEmail({
  firstName = 'there',
  primaryProperties = [],
  fallbackProperties = [],
  unsubscribeUrl = `${base}/unsubscribe`,
  introOverride = null,
}: PersonalisedNewsletterEmailProps) {
  const allProps = [...primaryProperties, ...fallbackProperties];
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
    ? `Your areas first: ${regionStr}. Every one is deeded fractional ownership of the whole home, fully managed between stays.`
    : 'Every one is deeded fractional ownership of the whole home, fully managed between stays.';
  const intro = (introOverride || '').replace(/^\s*hi\s+[^—\-–:,]*\s*[—\-–:,]\s*/i, '').trim() || defaultIntro;
  const previewLine = `${headline}${regionStr ? ` — starting with ${regionStr}` : ''}`;

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @media only screen and (max-width: 520px) {
            .rowcell { display: block !important; width: 100% !important; padding: 0 !important; }
            .rowimg { width: 100% !important; height: auto !important; }
            .rowtext { padding-top: 18px !important; text-align: center !important; }
            .pad { padding-left: 22px !important; padding-right: 22px !important; }
            .h1 { font-size: 34px !important; }
            .intro { font-size: 18px !important; }
            .leadtitle { font-size: 28px !important; }
            .rowtitle { font-size: 25px !important; }
            .btn { display: block !important; }
          }
        `}</style>
      </Head>
      <Preview>{previewLine}</Preview>

      <Body style={bodyStyle}>
        <Container style={container}>
        <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={sheet}><tbody><tr><td>

          {/* Masthead — the wordmark, nothing else */}
          <Section className="pad" style={masthead}>
            <Link href={base} style={{ textDecoration: 'none' }}>
              <Text style={wordmark}>Co-Ownership Property</Text>
            </Link>
          </Section>

          {/* Headline */}
          <Section className="pad" style={{ padding: '52px 56px 0', textAlign: 'center' as const }}>
            <Text style={issueStyle}>New this week&ensp;·&ensp;{issueLine}</Text>
            <Text className="h1" style={h1}>{headline}</Text>
            <Rule width={44} />
            <Text style={greetingStyle}>{greeting}</Text>
            <Text className="intro" style={introStyle}>{renderBold(intro)}</Text>
          </Section>

          {/* Lead home */}
          {lead && (
            <Section className="pad" style={{ padding: '44px 56px 0' }}>
              <LeadCard p={lead} />
            </Section>
          )}

          {/* The rest of the selection */}
          {rest.length > 0 && (
            <Section className="pad" style={{ padding: '48px 56px 0' }}>
              {rest.map((p, i) => <RowCard key={i} p={p} />)}
            </Section>
          )}

          {/* CTA */}
          <Section className="pad" style={{ padding: '20px 56px 0', textAlign: 'center' as const }}>
            {more > 0 && <Text style={moreLine}>{`and ${numWord(more)} more new this week`}</Text>}
            <Link href={`${base}/our-homes/`} className="btn" style={button}>View all {n} new homes</Link>
          </Section>

          {/* Sign-off */}
          <Section className="pad" style={{ padding: '52px 70px 8px', textAlign: 'center' as const }}>
            <Rule width={44} />
            <Text style={nudge}>Anything catch your eye?<br />Simply reply to this email — a real person answers.</Text>
          </Section>

          {/* Footer */}
          <Section className="pad" style={footer}>
            <Text style={footMark}>Co-Ownership Property</Text>
            <Text style={footText}>
              <Link href={base} style={footLink}>Website</Link>
              {' · '}
              <Link href={`${base}/our-homes/`} style={footLink}>Our Homes</Link>
              {' · '}
              <Link href={`${base}/how-it-works/`} style={footLink}>How it works</Link>
            </Text>
            <Text style={footSmall}>
              Deeded fractional homes in Europe and the USA.<br />
              You are receiving this because you enquired or subscribed on our site.
              {' '}<Link href={unsubscribeUrl} style={{ color: C.soft, textDecoration: 'underline' }}>Unsubscribe</Link>
            </Text>
          </Section>

        </td></tr></tbody></table>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const bodyStyle: React.CSSProperties = { margin: 0, padding: '30px 0 40px', backgroundColor: C.paper, fontFamily: TEXT };
const container: React.CSSProperties = { maxWidth: 640, margin: '0 auto' };
const sheet: React.CSSProperties = { backgroundColor: C.card, border: `1px solid ${C.line}` };

const masthead: React.CSSProperties = { padding: '46px 56px 40px', textAlign: 'center' as const, borderBottom: `1px solid ${C.line}` };
const wordmark: React.CSSProperties = { fontFamily: TEXT, fontSize: 17, letterSpacing: '0.34em', textTransform: 'uppercase' as const, color: C.ink, margin: 0, paddingLeft: '0.34em', lineHeight: '1.4' };

const issueStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: C.soft, margin: '0 0 22px' };
const h1: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 42, lineHeight: '1.14', fontWeight: 400, color: C.ink, margin: '0 0 26px' };
const greetingStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 19, fontStyle: 'italic', color: C.ink, margin: '26px 0 12px' };
const introStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 18, lineHeight: '1.75', color: C.ink, margin: 0 };

const leadImg: React.CSSProperties = { width: '100%', maxWidth: 560, height: 'auto', display: 'block' };
const place1: React.CSSProperties = { fontFamily: TEXT, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: C.soft, margin: '0 0 14px' };
const leadTitle: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 31, lineHeight: '1.25', fontWeight: 400, color: C.ink, margin: '0 0 16px' };
const priceLine: React.CSSProperties = { fontFamily: TEXT, fontSize: 22, color: C.ink, margin: '0 0 22px' };
const perShare: React.CSSProperties = { fontFamily: TEXT, fontSize: 15, fontStyle: 'italic', color: C.soft };
const goldBtn: React.CSSProperties = { display: 'inline-block', backgroundColor: C.goldD, color: '#FFFFFF', fontFamily: TEXT, fontSize: 13, letterSpacing: '0.22em', textTransform: 'uppercase' as const, padding: '17px 34px', textDecoration: 'none' };
const goldBtnSm: React.CSSProperties = { display: 'inline-block', backgroundColor: C.goldD, color: '#FFFFFF', fontFamily: TEXT, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' as const, padding: '13px 24px', textDecoration: 'none', marginTop: 16 };

const rowBox: React.CSSProperties = { borderTop: `1px solid ${C.line}`, paddingTop: 36, marginBottom: 36 };
const rowImg: React.CSSProperties = { width: '100%', height: 'auto', display: 'block' };
const place2: React.CSSProperties = { fontFamily: TEXT, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.soft, margin: '0 0 10px' };
const rowTitle: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 24, lineHeight: '1.3', fontWeight: 400, color: C.ink, margin: '0 0 12px' };
const rowPrice: React.CSSProperties = { fontFamily: TEXT, fontSize: 19, color: C.ink, margin: 0 };


const moreLine: React.CSSProperties = { fontFamily: TEXT, fontSize: 17, fontStyle: 'italic', color: C.soft, margin: '0 0 26px' };
const button: React.CSSProperties = { display: 'inline-block', backgroundColor: C.ink, color: '#FFFFFF', fontFamily: TEXT, fontSize: 14, letterSpacing: '0.22em', textTransform: 'uppercase' as const, padding: '20px 40px', textDecoration: 'none' };
const nudge: React.CSSProperties = { fontFamily: TEXT, fontSize: 19, fontStyle: 'italic', lineHeight: '1.7', color: C.ink, margin: '26px 0 0' };

const footer: React.CSSProperties = { padding: '48px 56px 44px', marginTop: 48, borderTop: `1px solid ${C.line}`, textAlign: 'center' as const };
const footMark: React.CSSProperties = { fontFamily: TEXT, fontSize: 13, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: C.ink, margin: '0 0 24px', paddingLeft: '0.3em' };
const footText: React.CSSProperties = { fontFamily: TEXT, fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.ink, margin: '0 0 24px' };
const footLink: React.CSSProperties = { color: C.ink, textDecoration: 'none' };
const footSmall: React.CSSProperties = { fontFamily: TEXT, fontSize: 13, fontStyle: 'italic', lineHeight: '1.8', color: C.soft, margin: 0 };
