import {
  Body, Container, Head, Html, Img, Link, Preview, Section, Text,
} from '@react-email/components';
import * as React from 'react';
import BRAND from '@/lib/email/brand';
import { EmailColorScheme } from './_color-scheme';

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

/**
 * An announcement re-uses the whole design with its own words: the eyebrow,
 * headline, default intro, the small label above each home, the two CTAs,
 * the "and N more" line and the button. Everything not given keeps the
 * weekly new-listings wording. First use: the Discreet Sale release
 * (David, 14 Sep 2026 — "exact same type of design as the newsletter").
 */
export interface Announcement {
  eyebrow?: string;
  headline?: (n: number) => string;
  intro?: (regionStr: string) => string;
  homeLabel?: string;
  /** Put the town in the title ("2-Bed Private Residence in Cala Major") and
   *  keep the small label to region and country. For the Discreet Sale,
   *  whose titles are deliberately generic and would otherwise all read the
   *  same. */
  placeInTitle?: boolean;
  leadCta?: string;
  rowCta?: string;
  moreLine?: (more: number) => string;
  buttonLabel?: (n: number, more: number) => string;
  buttonHref?: string;
  nudge?: string;
}

interface PersonalisedNewsletterEmailProps {
  firstName?: string;
  primaryProperties?: Property[];
  fallbackProperties?: Property[];
  unsubscribeUrl?: string;
  introOverride?: string | null;
  announcement?: Announcement | null;
}

// Two colours. Ink for everything that is read, gold for the hairlines.
// Palette and type come from lib/email/brand.js — see the note at the top of
// that file. Nothing about COP's email design is declared in this file.
const C = BRAND;

const base = 'https://co-ownership-property.com';
// Didot and Baskerville ship on macOS and iOS; Bodoni MT comes with Office on
// Windows. Georgia is the last stop, never a sans.
const DISPLAY = "'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif";
const TEXT    = "'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif";

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
function splitTitle(p: Property, placeInTitle = false) {
  const i = p.title.indexOf(' — ');
  let place = i > 0 ? p.title.slice(0, i) : (p.location || '');
  let name  = i > 0 ? p.title.slice(i + 3) : p.title;
  if (placeInTitle) {
    const parts = place.split(',').map(x => x.trim()).filter(Boolean);
    if (parts.length > 1) {
      name  = `${name} in ${parts[0]}`;
      place = parts.slice(1).join(', ');
    }
  }
  return { place, name };
}

// **bold** in the campaign intro → <strong>, so locations stand out.
function renderBold(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => part.startsWith('**') && part.endsWith('**')
    ? <strong key={i} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>
    : part);
}

// ── Lead home ────────────────────────────────────────────────────────────────
function LeadCard({ p, homeLabel, ctaLabel, placeInTitle }: { p: Property; homeLabel?: string; ctaLabel: string; placeInTitle?: boolean }) {
  const href = hrefFor(p);
  const { place, name } = splitTitle(p, placeInTitle);
  const label = homeLabel ? `${homeLabel}\u2002\u00b7\u2002${place}` : place;
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody>
        <tr><td>
          <Link href={href} style={{ color: 'inherit', display: 'block' }}>
            <Img src={crop(p.imageUrl, 1120, 720)} alt={p.title} width="560" style={leadImg} />
          </Link>
        </td></tr>
        <tr><td style={{ padding: '30px 10px 0', textAlign: 'center' as const }}>
          <Text style={place1}>{label}</Text>
          <Link href={href} style={{ color: 'inherit', textDecoration: 'none' }}>
            <Text className="leadtitle" style={leadTitle}>{name}</Text>
          </Link>
          <Text style={priceLine}>{p.price} <span style={perShare}>per 1/8 share</span></Text>
          <Link href={href} style={cta}>{ctaLabel}</Link>
        </td></tr>
      </tbody>
    </table>
  );
}

// ── One home per line: picture beside the words; stacks on a phone ───────────
function RowCard({ p, homeLabel, ctaLabel, placeInTitle }: { p: Property; homeLabel?: string; ctaLabel: string; placeInTitle?: boolean }) {
  const href = hrefFor(p);
  const { place, name } = splitTitle(p, placeInTitle);
  const label = homeLabel ? `${homeLabel}\u2002\u00b7\u2002${place}` : place;
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={rowBox}>
      <tbody><tr>
        <td className="rowcell" width="230" style={{ verticalAlign: 'middle', paddingRight: 28 }}>
          <Link href={href} style={{ color: 'inherit', display: 'block' }}>
            <Img src={crop(p.imageUrl, 460, 345)} alt={p.title} width="230" className="rowimg" style={rowImg} />
          </Link>
        </td>
        <td className="rowcell rowtext" style={{ verticalAlign: 'middle' }}>
          <Text style={place2}>{label}</Text>
          <Link href={href} style={{ color: 'inherit', textDecoration: 'none' }}>
            <Text className="rowtitle" style={rowTitle}>{name}</Text>
          </Link>
          <Text style={rowPrice}>{p.price} <span style={perShare}>per share</span></Text>
          <Link href={href} style={ctaSm}>{ctaLabel}</Link>
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
  announcement = null,
}: PersonalisedNewsletterEmailProps) {
  const A = announcement || {};
  const allProps = [...primaryProperties, ...fallbackProperties];
  const SHOWN    = 8;
  const lead     = allProps[0];
  const rest     = allProps.slice(1, SHOWN);
  const n        = allProps.length;
  const more     = n - Math.min(n, SHOWN);

  const regionsOf = (list: Property[]) => [...new Set(list.map(p => p.regionTag || p.location?.split(',')[0]).filter(Boolean))] as string[];
  const joinRegions = (regions: string[]) => {
    const top3 = regions.slice(0, 3);
    return regions.length > 3
      ? top3.join(', ') + ' & more'
      : top3.length > 1
        ? top3.slice(0, -1).join(', ') + ' & ' + top3[top3.length - 1]
        : top3[0] || '';
  };
  // "Your areas first" names only the places that actually matched what the
  // reader looked at; a reader with no history gets the intro without it.
  const regionStr   = joinRegions(regionsOf(primaryProperties));
  const previewStr  = joinRegions(regionsOf(allProps));

  const headline = A.headline ? A.headline(n) : `${cap(numWord(n))} new home${n === 1 ? '' : 's'} this week`;
  const greeting = firstName !== 'there' ? `Dear ${firstName},` : 'Dear reader,';
  const issueLine = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const eyebrow = A.eyebrow || 'New this week';
  const defaultIntro = A.intro ? A.intro(regionStr) : (regionStr
    ? `Your areas first: ${regionStr}. Every one is deeded fractional ownership of the whole home, fully managed between stays.`
    : 'Every one is deeded fractional ownership of the whole home, fully managed between stays.');
  const intro = (introOverride || '').replace(/^\s*hi\s+[^—\-–:,]*\s*[—\-–:,]\s*/i, '').trim() || defaultIntro;
  const previewLine = `${headline}${previewStr ? ` — ${regionStr ? 'starting with' : 'from'} ${previewStr}` : ''}`;
  const leadCta = A.leadCta || 'Discover the home';
  const rowCta  = A.rowCta  || 'Discover this home';
  const moreText = A.moreLine ? A.moreLine(more) : `and ${numWord(more)} more new this week`;
  const buttonText = A.buttonLabel ? A.buttonLabel(n, more) : (more > 0 ? `View all ${n} new homes` : 'View every home');
  const buttonHref = A.buttonHref || `${base}/our-homes/`;
  const nudgeText = A.nudge || 'Anything catch your eye?';

  return (
    <Html lang="en">
      <Head>
        <EmailColorScheme />
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
            <Link href={base} style={{ color: 'inherit', textDecoration: 'none' }}>
              <Text style={wordmark}>Co-Ownership Property</Text>
            </Link>
          </Section>

          {/* Headline */}
          <Section className="pad" style={{ padding: '52px 56px 0', textAlign: 'center' as const }}>
            <Text style={issueStyle}>{eyebrow}&ensp;·&ensp;{issueLine}</Text>
            <Text className="h1" style={h1}>{headline}</Text>
            <Rule width={44} />
            <Text style={greetingStyle}>{greeting}</Text>
            <Text className="intro" style={introStyle}>{renderBold(intro)}</Text>
          </Section>

          {/* Lead home */}
          {lead && (
            <Section className="pad" style={{ padding: '44px 56px 0' }}>
              <LeadCard p={lead} homeLabel={A.homeLabel} ctaLabel={leadCta} placeInTitle={A.placeInTitle} />
            </Section>
          )}

          {/* The rest of the selection */}
          {rest.length > 0 && (
            <Section className="pad" style={{ padding: '48px 56px 0' }}>
              {rest.map((p, i) => <RowCard key={i} p={p} homeLabel={A.homeLabel} ctaLabel={rowCta} placeInTitle={A.placeInTitle} />)}
            </Section>
          )}

          {/* CTA */}
          <Section className="pad" style={{ padding: '20px 56px 0', textAlign: 'center' as const }}>
            {more > 0 && <Text style={moreLine}>{moreText}</Text>}
            {/* Only promise more when there are more. When the email already
                showed every new home, the button is an invitation to the whole
                collection, not a repeat of what they just scrolled past. */}
            <Link href={buttonHref} className="btn" style={button}>
              {buttonText}
            </Link>
          </Section>

          {/* Sign-off */}
          <Section className="pad" style={{ padding: '52px 70px 8px', textAlign: 'center' as const }}>
            <Rule width={44} />
            <Text style={nudge}>{nudgeText}<br />Simply reply to this email — a real person answers.</Text>
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
              {' '}<Link href={unsubscribeUrl} style={{ color: C.onDarkMuted, textDecoration: 'underline' }}>Unsubscribe</Link>
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

// Black bands top and bottom, like the site's header and footer (David, 23 Sep 2026).
const masthead: React.CSSProperties = { padding: '46px 56px 40px', textAlign: 'center' as const, backgroundColor: C.black };
const wordmark: React.CSSProperties = { fontFamily: TEXT, fontSize: 17, letterSpacing: '0.34em', textTransform: 'uppercase' as const, color: C.onDark, margin: 0, paddingLeft: '0.34em', lineHeight: '1.4' };

const issueStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.soft, margin: '0 0 22px' };
const h1: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 42, lineHeight: '1.14', fontWeight: 400, color: C.ink, margin: '0 0 26px' };
const greetingStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 19, color: C.ink, margin: '26px 0 12px' };
const introStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 18, lineHeight: '1.75', color: C.ink, margin: 0 };

const leadImg: React.CSSProperties = { width: '100%', maxWidth: 560, height: 'auto', display: 'block' };
const place1: React.CSSProperties = { fontFamily: TEXT, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 14px' };
const leadTitle: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 31, lineHeight: '1.25', fontWeight: 400, color: C.ink, margin: '0 0 16px' };
const priceLine: React.CSSProperties = { fontFamily: TEXT, fontSize: 22, color: C.ink, margin: '0 0 22px' };
const perShare: React.CSSProperties = { fontFamily: TEXT, fontSize: 15, color: C.soft };
// Letterspaced caps on a gold hairline — David preferred this to a filled button.
const cta: React.CSSProperties = { display: 'inline-block', fontFamily: TEXT, fontSize: 13, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.ink, textDecoration: 'none', borderBottom: `1px solid ${C.gold}`, paddingBottom: 7 };
const ctaSm: React.CSSProperties = { display: 'inline-block', fontFamily: TEXT, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: C.ink, textDecoration: 'none', borderBottom: `1px solid ${C.gold}`, paddingBottom: 6, marginTop: 18 };

const rowBox: React.CSSProperties = { borderTop: `1px solid ${C.line}`, paddingTop: 36, marginBottom: 36 };
const rowImg: React.CSSProperties = { width: '100%', height: 'auto', display: 'block' };
const place2: React.CSSProperties = { fontFamily: TEXT, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 10px' };
const rowTitle: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 24, lineHeight: '1.3', fontWeight: 400, color: C.ink, margin: '0 0 12px' };
const rowPrice: React.CSSProperties = { fontFamily: TEXT, fontSize: 19, color: C.ink, margin: 0 };


const moreLine: React.CSSProperties = { fontFamily: TEXT, fontSize: 17, color: C.soft, margin: '0 0 26px' };
const button: React.CSSProperties = { display: 'inline-block', backgroundColor: C.ink, color: '#FFFFFF', fontFamily: TEXT, fontSize: 14, letterSpacing: '0.22em', textTransform: 'uppercase' as const, padding: '20px 40px', textDecoration: 'none' };
const nudge: React.CSSProperties = { fontFamily: TEXT, fontSize: 19, lineHeight: '1.7', color: C.ink, margin: '26px 0 0' };

const footer: React.CSSProperties = { padding: '48px 56px 44px', marginTop: 48, backgroundColor: C.black, textAlign: 'center' as const };
const footMark: React.CSSProperties = { fontFamily: TEXT, fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.onDark, margin: '0 0 24px', paddingLeft: '0.3em' };
const footText: React.CSSProperties = { fontFamily: TEXT, fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.onDark, margin: '0 0 24px' };
const footLink: React.CSSProperties = { color: C.onDark, textDecoration: 'none' };
const footSmall: React.CSSProperties = { fontFamily: TEXT, fontSize: 13, lineHeight: '1.8', color: C.onDarkMuted, margin: 0 };
