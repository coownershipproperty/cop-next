import {
  Body, Container, Head, Html, Img, Link, Preview, Section, Text,
} from '@react-email/components';
import * as React from 'react';

/**
 * Discreet-sale brochure — one home, sent to one named person.
 *
 * These homes are never published. There is no listing page to link to and
 * no card on our-homes: the seller asked for discretion and MYNE keeps them
 * in a separate, unpromoted table of their own partner portal. So this email
 * IS the listing — everything the reader is going to see about the house
 * arrives here, in their inbox, addressed to them.
 *
 * Same design language as the personalised newsletter (9 Sep 2026): all
 * serif, ink and one muted gold, hairlines instead of boxes, nothing that
 * reads as a template. Deliberately quieter than the newsletter — no
 * "new this week" banner, no browse-more button, no cross-sell. A brochure
 * has one subject.
 *
 * Nothing here names the operator. That is a standing rule, and it matters
 * more on a discreet home than anywhere else.
 */

interface DiscreetBrochureEmailProps {
  firstName?: string;
  place?: string;          // "Brenzone, Lake Garda"
  name?: string;           // "2-Bed Private Residence"
  price?: string;          // "€199,000"
  beds?: number;
  shareLabel?: string;     // "1/8"
  daysLabel?: string;      // "44 nights minimum"
  locationLine?: string;   // "Brenzone, Lake Garda, Italy"
  heroUrl?: string;
  photos?: string[];
  plans?: string[];
  rentalLabel?: string;
  specUrl?: string | null;
  viewingUrl?: string;
  unsubscribeUrl?: string;
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

// Supabase renders the crops; anything else is passed through untouched.
function crop(url: string, w: number, h: number) {
  if (!url) return url;
  if (url.includes('/storage/v1/object/public/')) {
    return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + `?width=${w}&height=${h}&resize=cover&quality=82`;
  }
  return url;
}

// One fact per hairline row. No table borders, no fills — just the rules.
function Fact({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody><tr>
        <td style={{ ...factCell, borderBottom: last ? 'none' : `1px solid ${C.line}` }}>
          <Text style={factLabel}>{label}</Text>
        </td>
        <td align="right" style={{ ...factCell, borderBottom: last ? 'none' : `1px solid ${C.line}` }}>
          <Text style={factValue}>{value}</Text>
        </td>
      </tr></tbody>
    </table>
  );
}

// Two photographs to a row, stacking on a phone.
function Gallery({ photos }: { photos: string[] }) {
  const rows: string[][] = [];
  for (let i = 0; i < photos.length; i += 2) rows.push(photos.slice(i, i + 2));
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody>
        {rows.map((pair, r) => (
          <tr key={r}>
            <td>
              <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
                <tbody><tr>
                  <td className="gcell" width="50%" style={{ paddingRight: 7, paddingBottom: 14, verticalAlign: 'top' }}>
                    <Img src={crop(pair[0], 520, 390)} alt="" width="260" className="gimg" style={galleryImg} />
                  </td>
                  <td className="gcell" width="50%" style={{ paddingLeft: 7, paddingBottom: 14, verticalAlign: 'top' }}>
                    {pair[1] ? <Img src={crop(pair[1], 520, 390)} alt="" width="260" className="gimg" style={galleryImg} /> : <span>&nbsp;</span>}
                  </td>
                </tr></tbody>
              </table>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function DiscreetBrochureEmail({
  firstName     = 'there',
  place         = '',
  name          = '',
  price         = '',
  beds          = 0,
  shareLabel    = '1/8',
  daysLabel     = '44 nights minimum',
  locationLine  = '',
  heroUrl       = '',
  photos        = [],
  plans         = [],
  rentalLabel   = '',
  specUrl       = null,
  viewingUrl    = `${base}/contact-us/`,
  unsubscribeUrl = `${base}/unsubscribe`,
}: DiscreetBrochureEmailProps) {
  const greeting = firstName && firstName !== 'there' ? `Dear ${firstName},` : 'Dear reader,';
  const shortPlace = place.split(',')[0] || place;

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @media only screen and (max-width: 520px) {
            .pad { padding-left: 22px !important; padding-right: 22px !important; }
            .gcell { display: block !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }
            .gimg { width: 100% !important; height: auto !important; }
            .h1 { font-size: 32px !important; }
            .intro { font-size: 17px !important; }
            .btn { display: block !important; }
          }
        `}</style>
      </Head>
      <Preview>{`${shortPlace} — the full file, privately`}</Preview>

      <Body style={bodyStyle}>
        <Container style={container}>
        <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={sheet}><tbody><tr><td>

          {/* Masthead */}
          <Section className="pad" style={masthead}>
            <Link href={base} style={{ textDecoration: 'none' }}>
              <Text style={wordmark}>Co-Ownership Property</Text>
            </Link>
          </Section>

          {/* Title block */}
          <Section className="pad" style={{ padding: '52px 56px 0', textAlign: 'center' as const }}>
            <Text style={eyebrow}>Discreet sale&ensp;·&ensp;not listed publicly</Text>
            <Text style={placeLine}>{place}</Text>
            <Text className="h1" style={h1}>{name}</Text>
            <Rule width={44} />
            <Text style={priceLine}>{price} <span style={perShare}>per {shareLabel} share</span></Text>
          </Section>

          {/* Hero */}
          {heroUrl && (
            <Section className="pad" style={{ padding: '34px 56px 0' }}>
              <Img src={crop(heroUrl, 1120, 720)} alt={name} width="528" style={heroImg} />
            </Section>
          )}

          {/* Letter */}
          <Section className="pad" style={{ padding: '40px 56px 0' }}>
            <Text style={greetingStyle}>{greeting}</Text>
            <Text className="intro" style={introStyle}>
              Here is the full file on {shortPlace}. It is being sold discreetly at the owner&rsquo;s
              request, so it appears nowhere on our website and is advertised nowhere else —
              everything we have is below.
            </Text>
          </Section>

          {/* Facts */}
          <Section className="pad" style={{ padding: '34px 56px 0' }}>
            <Fact label="Share" value={shareLabel} />
            {beds > 0 && <Fact label="Bedrooms" value={String(beds)} />}
            <Fact label="Your time" value={daysLabel} />
            <Fact label="Use" value={rentalLabel || 'Owners and their guests only'} last />
          </Section>

          {/* Gallery */}
          {photos.length > 0 && (
            <>
              <Section className="pad" style={{ padding: '48px 56px 22px', textAlign: 'center' as const }}>
                <Text style={sectionLabel}>The house</Text>
              </Section>
              <Section className="pad" style={{ padding: '0 56px' }}>
                <Gallery photos={photos} />
              </Section>
            </>
          )}

          {/* Floor plans. Portrait drawings on white — cropping them square in
              the photo grid mangles them, so they get their own full width. */}
          {plans.length > 0 && (
            <>
              <Section className="pad" style={{ padding: '30px 56px 22px', textAlign: 'center' as const }}>
                <Text style={sectionLabel}>{plans.length > 1 ? 'Floor plans' : 'Floor plan'}</Text>
              </Section>
              <Section className="pad" style={{ padding: '0 56px' }}>
                {plans.map((u, i) => (
                  <Img key={i} src={u} alt="Floor plan" width="528" style={{ ...heroImg, marginBottom: 18 }} />
                ))}
              </Section>
            </>
          )}

          {/* Specification sheet, where the file has one */}
          {specUrl && (
            <>
              <Section className="pad" style={{ padding: '30px 56px 22px', textAlign: 'center' as const }}>
                <Text style={sectionLabel}>Specification</Text>
              </Section>
              <Section className="pad" style={{ padding: '0 56px' }}>
                <Img src={specUrl} alt="Specification" width="528" style={heroImg} />
              </Section>
            </>
          )}

          {/* What happens next */}
          <Section className="pad" style={{ padding: '52px 56px 0' }}>
            <Rule width={44} />
            <Text style={sectionLabelCentred}>What happens next</Text>
            <Text className="intro" style={introStyle}>
              There is no public listing to send you to, so the next step is a conversation rather
              than a form. Tell me which dates suit you and I will arrange the viewing directly with
              the team that manages the home. If it is not right, say so plainly — I would far
              rather send you three more than have you feel steered towards this one.
            </Text>
            <Text className="intro" style={{ ...introStyle, marginTop: 20 }}>
              One thing I would ask in return: the owner&rsquo;s discretion is the whole reason this
              file exists, so please keep it between us.
            </Text>
          </Section>

          {/* CTA */}
          <Section className="pad" style={{ padding: '38px 56px 0', textAlign: 'center' as const }}>
            <Link href={viewingUrl} className="btn" style={button}>Arrange a viewing</Link>
            <Text style={replyNote}>or simply reply to this email — it comes straight to me.</Text>
          </Section>

          {/* Sign-off */}
          <Section className="pad" style={{ padding: '30px 70px 8px', textAlign: 'center' as const }}>
            <Text style={signOff}>Dylan Olsson<br /><span style={signRole}>Co-Founder · Co-Ownership Property</span></Text>
          </Section>

          {/* Footer */}
          <Section className="pad" style={footer}>
            <Text style={footMark}>Co-Ownership Property</Text>
            <Text style={footSmall}>
              Sent to you personally because you asked to see our discreet sales.
              Please do not circulate it further.
              {' '}<Link href={unsubscribeUrl} style={{ color: C.soft, textDecoration: 'underline' }}>Unsubscribe</Link>
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

const eyebrow: React.CSSProperties = { fontFamily: TEXT, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 26px' };
const placeLine: React.CSSProperties = { fontFamily: TEXT, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: C.soft, margin: '0 0 14px' };
const h1: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 38, lineHeight: '1.16', fontWeight: 400, color: C.ink, margin: '0 0 24px' };
const priceLine: React.CSSProperties = { fontFamily: TEXT, fontSize: 22, color: C.ink, margin: '24px 0 0' };
const perShare: React.CSSProperties = { fontFamily: TEXT, fontSize: 15, fontStyle: 'italic', color: C.soft };

const heroImg: React.CSSProperties = { width: '100%', maxWidth: 528, height: 'auto', display: 'block' };
const galleryImg: React.CSSProperties = { width: '100%', height: 'auto', display: 'block' };

const greetingStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 19, fontStyle: 'italic', color: C.ink, margin: '0 0 14px' };
const introStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 18, lineHeight: '1.75', color: C.ink, margin: 0 };

const factCell: React.CSSProperties = { padding: '15px 0' };
const factLabel: React.CSSProperties = { fontFamily: TEXT, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: C.soft, margin: 0 };
const factValue: React.CSSProperties = { fontFamily: TEXT, fontSize: 17, color: C.ink, margin: 0, textAlign: 'right' as const };

const sectionLabel: React.CSSProperties = { fontFamily: TEXT, fontSize: 12, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: C.gold, margin: 0 };
const sectionLabelCentred: React.CSSProperties = { ...sectionLabel, margin: '26px 0 18px', textAlign: 'center' as const };

const button: React.CSSProperties = { display: 'inline-block', backgroundColor: C.ink, color: '#FFFFFF', fontFamily: TEXT, fontSize: 14, letterSpacing: '0.22em', textTransform: 'uppercase' as const, padding: '20px 40px', textDecoration: 'none' };
const replyNote: React.CSSProperties = { fontFamily: TEXT, fontSize: 17, fontStyle: 'italic', color: C.soft, margin: '24px 0 0' };

const signOff: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 20, color: C.ink, margin: '20px 0 0', lineHeight: '1.6' };
const signRole: React.CSSProperties = { fontFamily: TEXT, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: C.soft };

const footer: React.CSSProperties = { padding: '48px 56px 44px', marginTop: 48, borderTop: `1px solid ${C.line}`, textAlign: 'center' as const };
const footMark: React.CSSProperties = { fontFamily: TEXT, fontSize: 13, letterSpacing: '0.3em', textTransform: 'uppercase' as const, color: C.ink, margin: '0 0 24px', paddingLeft: '0.3em' };
const footSmall: React.CSSProperties = { fontFamily: TEXT, fontSize: 13, fontStyle: 'italic', lineHeight: '1.8', color: C.soft, margin: 0 };
