import {
  Body, Container, Head, Html, Img, Link, Preview, Section, Text,
} from '@react-email/components';
import * as React from 'react';

/**
 * Saved-search alert — redesigned 9 Sep 2026 to match the newsletter.
 *
 * It used to be a navy header block in a different typeface with a filled
 * button, so landing next to the weekly newsletter it read as a different
 * company (David, 9 Sep 2026: "make it more like the one we just made for
 * newsletter, i don't like the old design"). Same palette, same serif stack,
 * same gold-hairline links as emails/personalised-newsletter.tsx — if you
 * change one, change both.
 *
 * NEAR MISSES. A saved search with a tight budget can match nothing for
 * months — two Portugal alerts capped at €100,000 and a Florida one at
 * $500,000 would never have fired at all. When nothing fits the budget, the
 * API sends the closest homes in those regions instead and sets `nearMiss`,
 * and this template says so plainly rather than implying they matched.
 */

interface AlertProperty {
  title: string;
  price: string;
  beds: number;
  size: number;
  location: string;
  slug: string;
  imageUrl?: string;
  shareSize?: string;
  isNew?: boolean;
}

interface PropertyAlertProps {
  firstName?: string;
  searchCriteria?: string;
  matchCount?: number;
  properties?: AlertProperty[];
  editAlertUrl?: string;
  unsubscribeUrl?: string;
  /** True when nothing met the budget and these are the closest homes instead. */
  nearMiss?: boolean;
}

const C = {
  paper: '#F6F3ED',
  card:  '#FFFFFF',
  ink:   '#1C2B3A',
  soft:  '#5D6B78',
  line:  '#E2DCD0',
  gold:  '#A98A45',
};

const base = 'https://co-ownership-property.com';
const DISPLAY = "Didot, 'Didot LT STD', 'Bodoni MT', 'Playfair Display', Georgia, serif";
const TEXT    = "Georgia, 'Times New Roman', serif";

const WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
const numWord = (n: number) => (n >= 0 && n < WORDS.length ? WORDS[n] : String(n));
const cap = (w: string) => w.charAt(0).toUpperCase() + w.slice(1);

function Rule({ width = 44, color = C.gold }: { width?: number; color?: string }) {
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

function crop(url: string, w: number, h: number) {
  if (!url) return url;
  if (url.includes('/storage/v1/object/public/')) {
    return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + `?width=${w}&height=${h}&resize=cover&quality=82`;
  }
  return url;
}

/** "Place, Region, Country — What it is" → a small label and a real title. */
function splitTitle(p: AlertProperty) {
  const i = p.title.indexOf(' — ');
  if (i > 0) return { place: p.title.slice(0, i), name: p.title.slice(i + 3) };
  return { place: p.location || '', name: p.title };
}

const hrefFor = (p: AlertProperty) => `${base}/property/${p.slug}/`;

// ── The first match, given room ──────────────────────────────────────────────
function LeadCard({ p }: { p: AlertProperty }) {
  const href = hrefFor(p);
  const { place, name } = splitTitle(p);
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody>
        <tr><td>
          <Link href={href} style={{ display: 'block' }}>
            <Img src={crop(p.imageUrl || '', 1120, 720)} alt={p.title} width="560" style={leadImg} />
          </Link>
        </td></tr>
        <tr><td style={{ padding: '30px 10px 0', textAlign: 'center' as const }}>
          <Text style={place1}>{place}</Text>
          <Link href={href} style={{ textDecoration: 'none' }}>
            <Text className="leadtitle" style={leadTitle}>{name}</Text>
          </Link>
          <Text style={priceLine}>{p.price} <span style={perShare}>per share</span></Text>
          <Link href={href} style={cta}>Discover the home</Link>
        </td></tr>
      </tbody>
    </table>
  );
}

// ── One home per line ────────────────────────────────────────────────────────
function RowCard({ p }: { p: AlertProperty }) {
  const href = hrefFor(p);
  const { place, name } = splitTitle(p);
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={rowBox}>
      <tbody><tr>
        <td className="rowcell" width="230" style={{ verticalAlign: 'middle', paddingRight: 28 }}>
          <Link href={href} style={{ display: 'block' }}>
            <Img src={crop(p.imageUrl || '', 460, 345)} alt={p.title} width="230" className="rowimg" style={rowImg} />
          </Link>
        </td>
        <td className="rowcell rowtext" style={{ verticalAlign: 'middle' }}>
          <Text style={place2}>{place}</Text>
          <Link href={href} style={{ textDecoration: 'none' }}>
            <Text className="rowtitle" style={rowTitle}>{name}</Text>
          </Link>
          <Text style={rowPrice}>{p.price} <span style={perShare}>per share</span></Text>
          <Link href={href} style={ctaSm}>Discover this home</Link>
        </td>
      </tr></tbody>
    </table>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function PropertyAlert({
  firstName,
  searchCriteria = '',
  matchCount,
  properties = [],
  editAlertUrl = `${base}/our-homes/`,
  unsubscribeUrl = `${base}/unsubscribe`,
  nearMiss = false,
}: PropertyAlertProps) {
  const n     = matchCount ?? properties.length;
  const lead  = properties[0];
  const rest  = properties.slice(1, 8);
  const more  = properties.length - Math.min(properties.length, 8);

  const headline = nearMiss
    ? 'Nothing in your budget this week'
    : `${cap(numWord(n))} new home${n === 1 ? '' : 's'} for you`;

  const greeting = firstName ? `Dear ${firstName},` : 'Dear reader,';
  const issueLine = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const intro = nearMiss
    ? 'Nothing new came in under your budget, so here are the closest homes that did arrive in the places you follow — in case one is worth stretching for.'
    : `New in the last day, matched to the alert you set. Every one is deeded fractional ownership of the whole home, fully managed between stays.`;

  const previewLine = nearMiss
    ? `Nothing under your budget — but ${numWord(properties.length)} new home${properties.length === 1 ? '' : 's'} in your regions`
    : `${headline}${searchCriteria ? ` — ${searchCriteria}` : ''}`;

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

          {/* Masthead */}
          <Section className="pad" style={masthead}>
            <Link href={base} style={{ textDecoration: 'none' }}>
              <Text style={wordmark}>Co-Ownership Property</Text>
            </Link>
          </Section>

          {/* Headline */}
          <Section className="pad" style={{ padding: '52px 56px 0', textAlign: 'center' as const }}>
            <Text style={issueStyle}>Your alert&ensp;·&ensp;{issueLine}</Text>
            <Text className="h1" style={h1}>{headline}</Text>
            <Rule width={44} />
            <Text style={greetingStyle}>{greeting}</Text>
            <Text className="intro" style={introStyle}>{intro}</Text>
            {searchCriteria && <Text style={criteria}>{searchCriteria}</Text>}
          </Section>

          {/* Lead */}
          {lead && (
            <Section className="pad" style={{ padding: '44px 56px 0' }}>
              <LeadCard p={lead} />
            </Section>
          )}

          {/* The rest */}
          {rest.length > 0 && (
            <Section className="pad" style={{ padding: '48px 56px 0' }}>
              {rest.map((p, i) => <RowCard key={i} p={p} />)}
            </Section>
          )}

          {/* CTA */}
          <Section className="pad" style={{ padding: '20px 56px 0', textAlign: 'center' as const }}>
            {more > 0 && <Text style={moreLine}>{`and ${numWord(more)} more matching your alert`}</Text>}
            <Link href={`${base}/our-homes/`} className="btn" style={button}>View every home</Link>
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
              {' · '}
              <Link href={`${base}/our-homes/`} style={footLink}>Our Homes</Link>
              {' · '}
              <Link href={`${base}/how-it-works/`} style={footLink}>How it works</Link>
            </Text>
            <Text style={footSmall}>
              Deeded fractional homes in Europe and the USA.<br />
              You set this alert on our site.
              {' '}<Link href={editAlertUrl} style={{ color: C.soft, textDecoration: 'underline' }}>Change what you follow</Link>
              {' · '}<Link href={unsubscribeUrl} style={{ color: C.soft, textDecoration: 'underline' }}>Unsubscribe</Link>
            </Text>
          </Section>

        </td></tr></tbody></table>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles (kept identical to the newsletter) ────────────────────────────────
const bodyStyle: React.CSSProperties = { margin: 0, padding: '30px 0 40px', backgroundColor: C.paper, fontFamily: TEXT };
const container: React.CSSProperties = { maxWidth: 640, margin: '0 auto' };
const sheet: React.CSSProperties = { backgroundColor: C.card, border: `1px solid ${C.line}` };

const masthead: React.CSSProperties = { padding: '46px 56px 40px', textAlign: 'center' as const, borderBottom: `1px solid ${C.line}` };
const wordmark: React.CSSProperties = { fontFamily: TEXT, fontSize: 17, letterSpacing: '0.34em', textTransform: 'uppercase' as const, color: C.ink, margin: 0, paddingLeft: '0.34em', lineHeight: '1.4' };

const issueStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: C.soft, margin: '0 0 22px' };
const h1: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 42, lineHeight: '1.14', fontWeight: 400, color: C.ink, margin: '0 0 26px' };
const greetingStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 19, fontStyle: 'italic', color: C.ink, margin: '26px 0 12px' };
const introStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 18, lineHeight: '1.75', color: C.ink, margin: 0 };
const criteria: React.CSSProperties = { fontFamily: TEXT, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.gold, lineHeight: '1.9', margin: '26px 0 0' };

const leadImg: React.CSSProperties = { width: '100%', maxWidth: 560, height: 'auto', display: 'block' };
const place1: React.CSSProperties = { fontFamily: TEXT, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 14px' };
const leadTitle: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 31, lineHeight: '1.25', fontWeight: 400, color: C.ink, margin: '0 0 16px' };
const priceLine: React.CSSProperties = { fontFamily: TEXT, fontSize: 22, color: C.ink, margin: '0 0 22px' };
const perShare: React.CSSProperties = { fontFamily: TEXT, fontSize: 15, fontStyle: 'italic', color: C.soft };
const cta: React.CSSProperties = { display: 'inline-block', fontFamily: TEXT, fontSize: 13, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.ink, textDecoration: 'none', borderBottom: `1px solid ${C.gold}`, paddingBottom: 7 };
const ctaSm: React.CSSProperties = { display: 'inline-block', fontFamily: TEXT, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: C.ink, textDecoration: 'none', borderBottom: `1px solid ${C.gold}`, paddingBottom: 6, marginTop: 18 };

const rowBox: React.CSSProperties = { borderTop: `1px solid ${C.line}`, paddingTop: 36, marginBottom: 36 };
const rowImg: React.CSSProperties = { width: '100%', height: 'auto', display: 'block' };
const place2: React.CSSProperties = { fontFamily: TEXT, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 10px' };
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
