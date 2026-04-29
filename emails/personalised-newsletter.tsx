import {
  Body, Button, Column, Container, Head, Heading, Hr,
  Html, Img, Link, Preview, Row, Section, Text,
} from '@react-email/components';
import * as React from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Property {
  slug: string;
  title: string;
  price: string;
  beds: number;
  size: number;
  imageUrl: string;
  location?: string;
}

interface PersonalisedNewsletterEmailProps {
  firstName?: string;
  primaryProperties?: Property[];
  fallbackProperties?: Property[];
  unsubscribeUrl?: string;
}

// ── Brand colours ──────────────────────────────────────────────────────────────
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

// ── Sample data ────────────────────────────────────────────────────────────────
const samplePrimary: Property[] = [
  {
    slug: 'ibiza-spain-3-bed-house-with-sea-views-3',
    title: 'Ibiza, Spain — 3-Bed House With Sea Views',
    price: '€260,000', beds: 3, size: 180,
    imageUrl: 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/ibiza-spain-3-bed-house-with-sea-views-3/hero.jpg',
    location: 'Ibiza, Spain',
  },
  {
    slug: 'mallorca-spain-3-bed-villa-with-pool',
    title: 'Mallorca, Spain — 3-Bed Villa With Pool',
    price: '€289,000', beds: 3, size: 200,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
    location: 'Mallorca, Spain',
  },
];

const sampleFallback: Property[] = [
  {
    slug: 'menorca-2-bed-apartment-sea-views',
    title: 'Menorca, Spain — 2-Bed Apartment With Sea Views',
    price: '€150,000', beds: 2, size: 95,
    imageUrl: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=600&q=80',
    location: 'Menorca, Spain',
  },
];

// ── Property card ──────────────────────────────────────────────────────────────
function PropertyCard({ p }: { p: Property }) {
  const waMsg    = encodeURIComponent(`Hi, I saw ${p.title} on Co-Ownership Property and I'd love to find out more.`);
  const mailSubj = encodeURIComponent(`Enquiry: ${p.title}`);
  const mailBody = encodeURIComponent(`Hi,\n\nI'm interested in ${p.title} and would like to find out more.\n\nThank you`);
  const mailHref = `mailto:${enquiryEmail}?subject=${mailSubj}&body=${mailBody}`;
  const waHref   = `https://wa.me/${whatsappNumber}?text=${waMsg}`;

  return (
    <Section style={card}>
      {/* Hero image — full bleed */}
      <Link href={`${base}/property/${p.slug}`} style={{ display: 'block' }}>
        <Img src={p.imageUrl} alt={p.title} width="560" style={cardImg} />
      </Link>

      {/* Card body */}
      <Section style={cardBody}>

        {/* Title */}
        <Heading style={cardTitle}><em>{p.title}</em></Heading>

        {/* Thin gold accent */}
        <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={{ marginBottom: 20 }}>
          <tbody><tr><td>
            <table width="28" cellPadding="0" cellSpacing="0" role="presentation">
              <tbody><tr><td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td></tr></tbody>
            </table>
          </td></tr></tbody>
        </table>

        {/* Price */}
        <Text style={cardPrice}>
          {p.price}&ensp;<span style={perShare}>per share</span>
        </Text>

        {/* Primary CTA — full width */}
        <Link href={`${base}/property/${p.slug}`} style={viewBtn}>View Property →</Link>

        {/* Secondary contact — text links */}
        <Text style={contactLine}>
          <Link href={mailHref} style={contactLink}>Email Enquiry</Link>
          <span style={{ color: C.gold, padding: '0 10px' }}>·</span>
          <Link href={waHref} style={contactLink}>WhatsApp</Link>
        </Text>

      </Section>
    </Section>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PersonalisedNewsletterEmail({
  firstName = 'there',
  primaryProperties = samplePrimary,
  fallbackProperties = sampleFallback,
  unsubscribeUrl = `${base}/unsubscribe`,
}: PersonalisedNewsletterEmailProps) {
  const allProps = [...primaryProperties, ...fallbackProperties];
  const hasFallback = fallbackProperties.length > 0;

  const destinations = [...new Set(primaryProperties.map(p => p.location?.split(',')[0]).filter(Boolean))];
  const destLabel = destinations.slice(0, 2).join(' & ');

  const previewText = `${firstName}, we've selected ${allProps.length} properties based on your interests${destLabel ? ` in ${destLabel}` : ''}.`;

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
          @media only screen and (max-width: 600px) {
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
              <table width="48" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr>
                <td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td>
              </tr></tbody></table>
            </td></tr></tbody></table>
            <Text style={wordmark}>Co-Ownership Property</Text>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr><td align="center">
              <table width="48" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr>
                <td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td>
              </tr></tbody></table>
            </td></tr></tbody></table>
          </Container>
        </Section>

        {/* ── Intro ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '52px 0 44px' }}>
              <Text style={eyebrow}>Curated For You</Text>
              <Heading style={heroHeading}>
                {firstName !== 'there'
                  ? <><em>{firstName}</em>, here are<br />your property picks</>
                  : <em>Your personalised property selection</em>}
              </Heading>
              <Hr style={goldBar} />
              <Text style={introBody}>
                Based on your interests, we've hand-picked the properties below from our
                current collection. Each one is available for fractional ownership — so
                you can own a share in a home you'll actually love.
              </Text>
              <Text style={{ ...introBody, marginTop: 0 }}>
                Reply to this email if anything catches your eye.
              </Text>
            </Section>
          </Container>
        </Section>

        {/* ── Primary properties ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 8 }}>
          <Container style={wrap}>
            <Text style={eyebrow}>Selected For You</Text>
            <Heading style={sectionHeading}>
              {destLabel ? `Properties in ${destLabel}` : 'Your Property Picks'}
            </Heading>
            <Hr style={goldBar} />
            {primaryProperties.map((p, i) => <PropertyCard key={i} p={p} />)}
          </Container>
        </Section>

        {/* ── Fallback properties ── */}
        {hasFallback && (
          <Section style={{ backgroundColor: C.cream, paddingTop: 32, paddingBottom: 8 }}>
            <Container style={wrap}>
              <Text style={eyebrow}>You Might Also Like</Text>
              <Heading style={sectionHeading}>More To Explore</Heading>
              <Hr style={goldBar} />
              {fallbackProperties.map((p, i) => <PropertyCard key={i} p={p} />)}
            </Container>
          </Section>
        )}

        {/* ── Browse CTA ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 64, paddingTop: 24 }}>
          <Container style={wrap}>
            <Section style={ctaBlock}>
              <Text style={ctaEyebrow}>Our Collection</Text>
              <Text style={ctaBody}>
                Browse our full collection of fractional ownership homes across Europe, the USA, and beyond.
              </Text>
              <Button href={`${base}/our-homes`} style={ctaBtn}>Browse All Properties →</Button>
            </Section>
          </Container>
        </Section>

        {/* ── How it works ── */}
        <Section style={{ backgroundColor: C.navy, padding: '56px 0' }}>
          <Container style={wrap}>
            <Text style={howEyebrow}>Simple &amp; Transparent</Text>
            <Heading style={howHeading}><em>How Co-Ownership Works</em></Heading>
            <Hr style={{ borderColor: C.gold, borderTopWidth: 1, width: 28, margin: '0 auto 40px' }} />
            <Row>
              {[
                { n: '01', t: 'Buy a Share', b: 'Own 1/8 to 1/2 of a premium property for a fraction of the full price.' },
                { n: '02', t: 'Use & Enjoy', b: 'Enjoy your home for weeks per year proportional to your share, fully managed.' },
                { n: '03', t: 'Build Equity', b: 'Benefit from appreciation. Sell your share whenever you choose.' },
              ].map(({ n, t, b }) => (
                <Column key={n} style={howCol}>
                  <Text style={howNum}>{n}</Text>
                  <Text style={howTitle}>{t}</Text>
                  <Text style={howBody}>{b}</Text>
                </Column>
              ))}
            </Row>
          </Container>
        </Section>

        {/* ── Footer ── */}
        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr><td align="center">
              <table width="40" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr>
                <td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td>
              </tr></tbody></table>
            </td></tr></tbody></table>
            <Text style={footLinks}>
              <Link href={`${base}`} style={footLink}>Website</Link>
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

// ── STYLES ────────────────────────────────────────────────────────────────────

// Layout
const body: React.CSSProperties  = { backgroundColor: C.cream, margin: 0, padding: 0, fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif" };
const wrap: React.CSSProperties  = { maxWidth: 560, margin: '0 auto', padding: '0 20px' };

// Header
const header: React.CSSProperties   = { backgroundColor: C.navy, padding: '52px 0 44px' };
const wordmark: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", color: C.white, fontSize: 22, fontWeight: 300, letterSpacing: '0.3em', textTransform: 'uppercase' as const, textAlign: 'center' as const, margin: '22px 0' };

// Shared labels
const eyebrow: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 14px' };
const goldBar: React.CSSProperties = { borderColor: C.gold, borderTopWidth: 1, width: 28, margin: '0 0 28px' };

// Intro
const heroHeading: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 30, fontWeight: 300, color: C.navy, margin: '0 0 22px', lineHeight: '1.3' };
const introBody: React.CSSProperties   = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 14, color: '#4A6070', lineHeight: '1.85', margin: '0 0 12px' };

// Section headings
const sectionHeading: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 300, color: C.navy, margin: '0 0 18px', lineHeight: '1.25', letterSpacing: '0.02em' };

// Card
const card: React.CSSProperties     = { backgroundColor: C.white, marginBottom: 24 };
const cardImg: React.CSSProperties  = { width: '100%', height: 280, objectFit: 'cover' as const, display: 'block', maxWidth: '100%' };
const cardBody: React.CSSProperties = { padding: '28px 28px 32px' };
const cardTitle: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 300, color: C.navy, margin: '0 0 18px', lineHeight: '1.4', letterSpacing: '0.01em' };
const cardPrice: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 300, color: C.navy, margin: '0 0 22px', lineHeight: 1 };
const perShare: React.CSSProperties  = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 10, color: C.navy60, letterSpacing: '0.1em', textTransform: 'uppercase' as const };

// Primary CTA — full-width navy button
const viewBtn: React.CSSProperties = {
  display: 'block',
  backgroundColor: C.navy,
  color: C.white,
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '15px 24px',
  marginBottom: 18,
};

// Secondary contact links — plain text, centered
const contactLine: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 400,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: C.navy60,
  textAlign: 'center' as const,
  margin: 0,
};
const contactLink: React.CSSProperties = { color: C.navy60, textDecoration: 'none' };

// Browse CTA block
const ctaBlock: React.CSSProperties   = { backgroundColor: C.navy, textAlign: 'center' as const, padding: '48px 32px' };
const ctaEyebrow: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'rgba(201,168,76,0.7)', margin: '0 0 14px' };
const ctaBody: React.CSSProperties    = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: '1.8', margin: '0 0 28px' };
const ctaBtn: React.CSSProperties     = { fontFamily: "'Jost', Arial, sans-serif", backgroundColor: C.gold, color: C.navy, fontSize: 10, fontWeight: 600, letterSpacing: '0.22em', padding: '14px 44px', textDecoration: 'none', display: 'inline-block' };

// How it works
const howEyebrow: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 10, fontWeight: 600, letterSpacing: '0.24em', textTransform: 'uppercase' as const, color: 'rgba(201,168,76,0.7)', textAlign: 'center' as const, margin: '0 0 14px' };
const howHeading: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 300, color: C.white, textAlign: 'center' as const, margin: '0 0 18px', lineHeight: '1.3' };
const howCol: React.CSSProperties     = { width: '33%', padding: '0 10px', textAlign: 'center' as const, verticalAlign: 'top' };
const howNum: React.CSSProperties     = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 36, fontWeight: 300, color: C.gold, margin: '0 0 8px', textAlign: 'center' as const };
const howTitle: React.CSSProperties   = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.85)', margin: '0 0 8px', textAlign: 'center' as const };
const howBody: React.CSSProperties    = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: '1.75', margin: 0, textAlign: 'center' as const };

// Footer
const footer: React.CSSProperties    = { backgroundColor: C.navy, padding: '52px 0 44px', borderTop: `2px solid ${C.gold}` };
const footLogo: React.CSSProperties  = { fontFamily: "'Cormorant Garamond', Georgia, serif", color: C.white, fontSize: 20, fontWeight: 300, letterSpacing: '0.26em', textTransform: 'uppercase' as const, textAlign: 'center' as const, margin: '0 0 20px' };
const footLinks: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 10, fontWeight: 300, letterSpacing: '0.12em', textAlign: 'center' as const, margin: '12px 0 4px', color: 'rgba(255,255,255,0.35)' };
const footLink: React.CSSProperties  = { color: 'rgba(255,255,255,0.45)', textDecoration: 'none' };
const footDivider: React.CSSProperties = { borderColor: 'rgba(255,255,255,0.07)', margin: '24px 0' };
const footFine: React.CSSProperties  = { fontFamily: "'Jost', Arial, sans-serif", color: 'rgba(255,255,255,0.28)', fontSize: 10, fontWeight: 300, textAlign: 'center' as const, margin: '6px 0 0', lineHeight: '1.8', letterSpacing: '0.04em' };
