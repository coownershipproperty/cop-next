import {
  Body, Column, Container, Head, Heading, Hr,
  Html, Img, Link, Preview, Row, Section, Text,
} from '@react-email/components';
import * as React from 'react';

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
}

const C = {
  navy:   '#1E3448',
  navy60: '#6B8A9E',
  gold:   '#C9A84C',
  cream:  '#F7F4EE',
  white:  '#FFFFFF',
  border: '#E8E3DC',
};

const base           = 'https://co-ownership-property.com';
const whatsappNumber = '447901002763';
const enquiryEmail   = 'hello@co-ownership-property.com';

const CURRENCY_SYMBOLS: Record<string, string> = { EUR: '€', USD: '$', GBP: '£' };

// ── Hero card (properties 1 & 2 — full width, tall) ───────────────────────────
function HeroCard({ p }: { p: Property }) {
  const waMsg  = encodeURIComponent(`Hi, I saw ${p.title} on Co-Ownership Property and I'd love to find out more.`);
  const mailSub = encodeURIComponent(`Enquiry: ${p.title}`);
  const mailBody = encodeURIComponent(`Hi,\n\nI'm interested in ${p.title}.\n\nThank you`);
  const href   = p.galleryUrl || `${base}/property/${p.slug}`;
  const waHref = `https://wa.me/${whatsappNumber}?text=${waMsg}`;
  const mailHref = `mailto:${enquiryEmail}?subject=${mailSub}&body=${mailBody}`;

  return (
    <Section style={heroCard}>
      <Link href={href} style={{ display: 'block' }}>
        <Img src={p.imageUrl} alt={p.title} width="560" style={heroImg} />
      </Link>
      <Section style={heroBody}>
        {p.regionTag && (
          <Text style={regionTag}>{p.regionTag}</Text>
        )}
        <Heading style={heroTitle}><em>{p.title}</em></Heading>
        <table width="28" cellPadding="0" cellSpacing="0" role="presentation" style={{ marginBottom: 16 }}>
          <tbody><tr><td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td></tr></tbody>
        </table>
        <Text style={heroPrice}>
          {p.price}&ensp;<span style={perShare}>per share</span>
        </Text>
        <Link href={href} style={goldBtn}>View Gallery →</Link>
        <Text style={contactLine}>
          <Link href={mailHref} style={contactLink}>Email enquiry</Link>
          <span style={{ color: C.gold, padding: '0 8px' }}>·</span>
          <Link href={waHref} style={contactLink}>WhatsApp</Link>
        </Text>
      </Section>
    </Section>
  );
}

// ── Grid card (properties 3–6 — compact, 2-column grid) ───────────────────────
function GridCard({ p }: { p: Property }) {
  const href = p.galleryUrl || `${base}/property/${p.slug}`;

  return (
    <Section style={gridCard}>
      <Link href={href} style={{ display: 'block' }}>
        <Img src={p.imageUrl} alt={p.title} width="260" style={gridImg} />
      </Link>
      <Section style={gridBody}>
        {p.regionTag && (
          <Text style={gridRegionTag}>{p.regionTag}</Text>
        )}
        <Heading style={gridTitle}><em>{p.title}</em></Heading>
        <Text style={gridPrice}>{p.price} <span style={{ ...perShare, fontSize: 9 }}>per share</span></Text>
        <Link href={href} style={goldBtnSm}>View Gallery →</Link>
      </Section>
    </Section>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function PersonalisedNewsletterEmail({
  firstName = 'there',
  primaryProperties = [],
  fallbackProperties = [],
  unsubscribeUrl = `${base}/unsubscribe`,
}: PersonalisedNewsletterEmailProps) {
  const allProps  = [...primaryProperties, ...fallbackProperties];
  const heroProps = allProps.slice(0, 2);
  const gridProps = allProps.slice(2, 6);

  // Build a compact destination string from unique regions across all 6 picks
  const regions = [...new Set(allProps.map(p => p.regionTag || p.location?.split(',')[0]).filter(Boolean))];
  const destShort = regions.slice(0, 3).join(', ');

  const introLine = firstName !== 'there'
    ? `${firstName} — ${allProps.length} homes${destShort ? ` in ${destShort}` : ''}, matched for you`
    : `${allProps.length} homes${destShort ? ` in ${destShort}` : ''}, matched for you`;

  const previewText = introLine;

  // Pair up grid props for rows
  const gridRows: Property[][] = [];
  for (let i = 0; i < gridProps.length; i += 2) {
    gridRows.push(gridProps.slice(i, i + 2));
  }

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
          @media only screen and (max-width: 480px) {
            .grid-col { display: block !important; width: 100% !important; }
            img { max-width: 100% !important; height: auto !important; }
          }
        `}</style>
      </Head>
      <Preview>{previewText}</Preview>

      <Body style={body}>

        {/* ── Header ── */}
        <Section style={header}>
          <Container style={wrap}>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr><td align="center">
              <table width="40" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr>
                <td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td>
              </tr></tbody></table>
            </td></tr></tbody></table>
            <Text style={wordmark}>Co-Ownership Property</Text>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr><td align="center">
              <table width="40" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr>
                <td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td>
              </tr></tbody></table>
            </td></tr></tbody></table>
          </Container>
        </Section>

        {/* ── One-line intro — straight to properties ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '28px 0 20px', textAlign: 'center' as const }}>
              <Text style={introLine_style}>{introLine}</Text>
              <Hr style={goldBar} />
            </Section>
          </Container>
        </Section>

        {/* ── Hero properties (1 & 2) ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 0 }}>
          <Container style={wrap}>
            {heroProps.map((p, i) => <HeroCard key={i} p={p} />)}
          </Container>
        </Section>

        {/* ── Grid properties (3–6, 2×2) ── */}
        {gridRows.length > 0 && (
          <Section style={{ backgroundColor: C.cream, paddingBottom: 0 }}>
            <Container style={wrap}>
              {gridRows.map((row, ri) => (
                <Row key={ri} style={{ marginBottom: 12 }}>
                  {row.map((p, ci) => (
                    <Column
                      key={ci}
                      className="grid-col"
                      style={{ width: '50%', paddingLeft: ci === 1 ? 6 : 0, paddingRight: ci === 0 ? 6 : 0, verticalAlign: 'top' }}
                    >
                      <GridCard p={p} />
                    </Column>
                  ))}
                  {/* Pad odd row to keep layout balanced */}
                  {row.length === 1 && (
                    <Column className="grid-col" style={{ width: '50%', paddingLeft: 6 }} />
                  )}
                </Row>
              ))}
            </Container>
          </Section>
        )}

        {/* ── Reply nudge ── */}
        <Section style={{ backgroundColor: C.cream, padding: '8px 0 48px' }}>
          <Container style={wrap}>
            <Text style={replyNudge}>Anything catch your eye? Just reply to this email.</Text>
          </Container>
        </Section>

        {/* ── Footer ── */}
        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr><td align="center">
              <table width="32" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr>
                <td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td>
              </tr></tbody></table>
            </td></tr></tbody></table>
            <Text style={footLinks}>
              <Link href={base} style={footLink}>Website</Link>
              {'  ·  '}
              <Link href={`${base}/our-homes`} style={footLink}>Our Homes</Link>
              {'  ·  '}
              <Link href={`${base}/how-it-works`} style={footLink}>How It Works</Link>
            </Text>
            <Hr style={footDivider} />
            <Text style={footFine}>You're receiving this because you expressed interest in co-ownership property.</Text>
            <Text style={footFine}>
              <Link href={unsubscribeUrl} style={{ color: C.gold, textDecoration: 'none' }}>Unsubscribe</Link>
            </Text>
          </Container>
        </Section>

      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const body: React.CSSProperties   = { backgroundColor: C.cream, margin: 0, padding: 0, fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif" };
const wrap: React.CSSProperties   = { maxWidth: 560, margin: '0 auto', padding: '0 20px' };
const header: React.CSSProperties = { backgroundColor: C.navy, padding: '44px 0 40px' };
const wordmark: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", color: C.white, fontSize: 22, fontWeight: 300, letterSpacing: '0.3em', textTransform: 'uppercase' as const, textAlign: 'center' as const, margin: '20px 0' };

// Intro
const introLine_style: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 300, fontStyle: 'italic', color: C.navy, margin: '0 0 22px', lineHeight: '1.35', textAlign: 'center' as const };
const goldBar: React.CSSProperties         = { borderColor: C.gold, borderTopWidth: 1, width: 28, margin: '0 auto' };

// Region tag pill
const regionTag: React.CSSProperties = { display: 'inline-block', fontFamily: "'Jost', Arial, sans-serif", fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: C.navy, backgroundColor: C.gold, padding: '3px 10px', margin: '0 0 12px', lineHeight: 1 };
const gridRegionTag: React.CSSProperties = { ...regionTag, fontSize: 8, padding: '2px 7px', margin: '0 0 8px' };

// Hero card
const heroCard: React.CSSProperties  = { backgroundColor: C.white, marginBottom: 20 };
const heroImg: React.CSSProperties   = { width: '100%', height: 280, objectFit: 'cover' as const, display: 'block' };
const heroBody: React.CSSProperties  = { padding: '26px 28px 30px' };
const heroTitle: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 300, color: C.navy, margin: '0 0 16px', lineHeight: '1.35' };
const heroPrice: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 300, color: C.navy, margin: '0 0 20px', lineHeight: 1 };
const perShare: React.CSSProperties  = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 10, color: C.navy60, letterSpacing: '0.1em', textTransform: 'uppercase' as const };

// Gold CTA button
const goldBtn: React.CSSProperties = {
  display: 'block', backgroundColor: C.gold, color: C.navy,
  fontFamily: "'Jost', Arial, sans-serif", fontSize: 10, fontWeight: 600,
  letterSpacing: '0.22em', textTransform: 'uppercase' as const,
  textDecoration: 'none', textAlign: 'center' as const,
  padding: '14px 24px', marginBottom: 16,
};
const goldBtnSm: React.CSSProperties = { ...goldBtn, fontSize: 9, padding: '11px 14px', marginBottom: 0 };

const contactLine: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: C.navy60, textAlign: 'center' as const, margin: 0 };
const contactLink: React.CSSProperties = { color: C.navy60, textDecoration: 'none' };

// Grid card
const gridCard: React.CSSProperties  = { backgroundColor: C.white, marginBottom: 0 };
const gridImg: React.CSSProperties   = { width: '100%', height: 165, objectFit: 'cover' as const, display: 'block' };
const gridBody: React.CSSProperties  = { padding: '14px 14px 16px' };
const gridTitle: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 300, color: C.navy, margin: '0 0 8px', lineHeight: '1.3' };
const gridPrice: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 18, fontWeight: 300, color: C.navy, margin: '0 0 12px', lineHeight: 1 };

// Reply nudge
const replyNudge: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontStyle: 'italic', fontWeight: 300, color: C.navy60, textAlign: 'center' as const, margin: '8px 0 0' };

// Footer
const footer: React.CSSProperties   = { backgroundColor: C.navy, padding: '44px 0 36px', borderTop: `2px solid ${C.gold}` };
const footLogo: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", color: C.white, fontSize: 18, fontWeight: 300, letterSpacing: '0.26em', textTransform: 'uppercase' as const, textAlign: 'center' as const, margin: '0 0 18px' };
const footLinks: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 10, fontWeight: 300, letterSpacing: '0.1em', textAlign: 'center' as const, margin: '12px 0 4px', color: 'rgba(255,255,255,.35)' };
const footLink: React.CSSProperties  = { color: 'rgba(255,255,255,.45)', textDecoration: 'none' };
const footDivider: React.CSSProperties = { borderColor: 'rgba(255,255,255,.07)', margin: '20px 0' };
const footFine: React.CSSProperties  = { fontFamily: "'Jost', Arial, sans-serif", color: 'rgba(255,255,255,.28)', fontSize: 10, fontWeight: 300, textAlign: 'center' as const, margin: '4px 0 0', lineHeight: '1.8', letterSpacing: '0.04em' };
