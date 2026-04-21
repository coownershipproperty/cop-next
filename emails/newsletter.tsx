import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
interface Property {
  title: string;
  location: string;
  country: string;
  price: string;
  beds: number;
  size: number;
  imageUrl: string;
  slug: string;
  label?: string; // e.g. "New", "Hot"
}

interface NewsletterEmailProps {
  firstName?: string;
  previewText?: string;
  introHeading?: string;
  introText?: string;
  properties?: Property[];
}

// ── Design tokens (exact match to globals.css) ────────────────────────────────
const C = {
  blue:       '#2C4A5E',   // --blue / --text-dark
  blue80:     '#4A6A7E',
  blue60:     '#6B8A9E',   // --text-muted
  blue20:     '#C5CED5',
  gold:       '#C9A84C',   // --warm-gold
  cream:      '#F5F2EC',   // --cream-bg
  creamLight: '#FAF8F5',
  white:      '#FFFFFF',
  border:     '#DDD9D4',   // --gray-border
  goldBorder: 'rgba(201,168,76,0.18)',
};

// ── Sample data for preview ───────────────────────────────────────────────────
const sampleProperties: Property[] = [
  {
    title: 'Luxury Coastal Villa',
    location: 'Marbella',
    country: 'Spain',
    price: '€185,000',
    beds: 4,
    size: 320,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
    slug: 'luxury-coastal-villa-marbella',
    label: 'New',
  },
  {
    title: 'Provençal Stone Farmhouse',
    location: 'Luberon',
    country: 'France',
    price: '€122,500',
    beds: 3,
    size: 210,
    imageUrl: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=600&q=80',
    slug: 'provencal-stone-farmhouse-luberon',
  },
  {
    title: 'Tuscan Hilltop Retreat',
    location: 'Siena',
    country: 'Italy',
    price: '€97,000',
    beds: 2,
    size: 140,
    imageUrl: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=600&q=80',
    slug: 'tuscan-hilltop-retreat-siena',
    label: 'Hot',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function NewsletterEmail({
  firstName = 'there',
  previewText = 'New co-ownership properties handpicked for you this week.',
  introHeading = 'New Properties, Handpicked for You',
  introText = 'We\'ve selected a few stunning new listings this week — each a beautifully designed home in a sought-after location, available as a fractional co-ownership share. Browse below and click any property to see the full details.',
  properties = sampleProperties,
}: NewsletterEmailProps) {

  const baseUrl = 'https://co-ownershipproperty.com';

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Nunito+Sans:wght@400;600;700&display=swap');
        `}</style>
      </Head>
      <Preview>{previewText}</Preview>

      <Body style={body}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <Section style={header}>
          <Container style={container}>
            <Text style={logoWordmark}>Co-Ownership Property</Text>
            <Text style={logoTagline}>Your European Dream Home, Shared Smartly</Text>
          </Container>
        </Section>

        {/* ── Gold rule ──────────────────────────────────────────────── */}
        <Section style={{ backgroundColor: C.gold, height: 3, lineHeight: '3px', fontSize: 1 }}>
          <Text style={{ margin: 0, fontSize: 1 }}>&nbsp;</Text>
        </Section>

        {/* ── Main content ───────────────────────────────────────────── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={container}>

            {/* Greeting */}
            <Section style={{ paddingTop: 48, paddingBottom: 32 }}>
              <Text style={eyebrow}>Hello {firstName}</Text>
              <Heading style={h1}>{introHeading}</Heading>
              <Text style={bodyText}>{introText}</Text>
            </Section>

            {/* ── Property cards ──────────────────────────────────────── */}
            {properties.map((p, i) => (
              <Section key={i} style={card}>

                {/* Image */}
                <Link href={`${baseUrl}/property/${p.slug}`}>
                  <Img
                    src={p.imageUrl}
                    alt={p.title}
                    width="552"
                    style={cardImg}
                  />
                </Link>

                {/* Badge */}
                {p.label && (
                  <Section style={{ margin: 0, padding: 0 }}>
                    <Text style={badge}>{p.label}</Text>
                  </Section>
                )}

                {/* Card body */}
                <Section style={cardBody}>

                  {/* Location */}
                  <Text style={cardLocation}>{p.location} · {p.country}</Text>

                  {/* Title */}
                  <Heading style={cardTitle}>{p.title}</Heading>

                  {/* Stats row */}
                  <Row style={{ marginBottom: 0 }}>
                    <Column style={{ width: '40%' }}>
                      <Text style={cardStat}>
                        🛏&nbsp; {p.beds} Bedroom{p.beds !== 1 ? 's' : ''}
                      </Text>
                    </Column>
                    <Column style={{ width: '40%' }}>
                      <Text style={cardStat}>
                        📐&nbsp; {p.size} m²
                      </Text>
                    </Column>
                  </Row>

                  {/* Price */}
                  <Section style={{ borderTop: `1px solid ${C.goldBorder}`, marginTop: 12, paddingTop: 12 }}>
                    <Row>
                      <Column style={{ width: '60%' }}>
                        <Text style={cardPrice}>{p.price}</Text>
                      </Column>
                      <Column style={{ width: '40%', textAlign: 'right' as const }}>
                        <Button href={`${baseUrl}/property/${p.slug}`} style={viewBtn}>
                          View Property →
                        </Button>
                      </Column>
                    </Row>
                  </Section>

                </Section>
              </Section>
            ))}

            {/* ── Browse all CTA ──────────────────────────────────────── */}
            <Section style={{ textAlign: 'center' as const, padding: '40px 0' }}>
              <Text style={eyebrow}>Explore More</Text>
              <Heading style={h2}>Over 50 Properties Across Europe</Heading>
              <Text style={bodyText}>
                Spain, France, Italy, Portugal, Austria and more — all available as fractional co-ownership shares.
              </Text>
              <Button href={`${baseUrl}`} style={primaryBtn}>
                Browse All Properties →
              </Button>
            </Section>

            <Hr style={divider} />

            {/* ── How it works ────────────────────────────────────────── */}
            <Section style={{ padding: '32px 0 48px' }}>
              <Text style={{ ...eyebrow, textAlign: 'center' as const }}>The Simple Way to Own More</Text>
              <Heading style={{ ...h2, textAlign: 'center' as const }}>How Co-Ownership Works</Heading>

              <Row style={{ marginTop: 28 }}>
                <Column style={howItWorksCol}>
                  <Text style={howItWorksIcon}>🏡</Text>
                  <Text style={howItWorksTitle}>Buy a Share</Text>
                  <Text style={howItWorksText}>
                    Own 1/8 to 1/2 of a premium home for a fraction of the full price.
                  </Text>
                </Column>
                <Column style={howItWorksCol}>
                  <Text style={howItWorksIcon}>📅</Text>
                  <Text style={howItWorksTitle}>Enjoy Your Time</Text>
                  <Text style={howItWorksText}>
                    Use your property for weeks per year proportional to your ownership share.
                  </Text>
                </Column>
                <Column style={howItWorksCol}>
                  <Text style={howItWorksIcon}>📈</Text>
                  <Text style={howItWorksTitle}>Build Equity</Text>
                  <Text style={howItWorksText}>
                    Benefit from property appreciation with zero hassle management.
                  </Text>
                </Column>
              </Row>

              <Section style={{ textAlign: 'center' as const, marginTop: 32 }}>
                <Button href={`${baseUrl}/how-it-works`} style={outlineBtn}>
                  Learn More →
                </Button>
              </Section>
            </Section>

          </Container>
        </Section>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <Section style={footer}>
          <Container style={container}>
            <Text style={footerLogo}>Co-Ownership Property</Text>
            <Row style={{ marginBottom: 16 }}>
              <Column style={{ textAlign: 'center' as const }}>
                <Link href={`${baseUrl}`} style={footerLink}>Website</Link>
                {' '}·{' '}
                <Link href={`${baseUrl}/all-our-blog`} style={footerLink}>Blog</Link>
                {' '}·{' '}
                <Link href={`${baseUrl}/how-it-works`} style={footerLink}>How It Works</Link>
                {' '}·{' '}
                <Link href={`${baseUrl}/contact`} style={footerLink}>Contact</Link>
              </Column>
            </Row>
            <Hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
            <Text style={footerSmall}>
              You're receiving this because you enquired about a co-ownership property.
            </Text>
            <Text style={footerSmall}>
              <Link href="{{unsubscribe_url}}" style={{ color: C.gold, textDecoration: 'none' }}>
                Unsubscribe
              </Link>
              {' '}· Co-Ownership Property Ltd · info@co-ownershipproperty.com
            </Text>
          </Container>
        </Section>

      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: C.cream,
  margin: 0,
  padding: 0,
  fontFamily: "'Nunito Sans', 'Helvetica Neue', Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '0 24px',
};

// Header
const header: React.CSSProperties = {
  backgroundColor: C.blue,
  padding: '28px 0 24px',
};

const logoWordmark: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  color: C.white,
  fontSize: 24,
  fontWeight: 700,
  textAlign: 'center' as const,
  margin: 0,
  letterSpacing: '0.02em',
};

const logoTagline: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  color: C.gold,
  fontSize: 11,
  textAlign: 'center' as const,
  margin: '6px 0 0',
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  fontWeight: 600,
};

// Typography
const eyebrow: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 10px',
};

const h1: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 30,
  fontWeight: 700,
  color: C.blue,
  margin: '0 0 16px',
  lineHeight: '1.3',
};

const h2: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 22,
  fontWeight: 700,
  color: C.blue,
  margin: '0 0 12px',
  lineHeight: '1.35',
};

const bodyText: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 15,
  color: C.blue80,
  lineHeight: '1.7',
  margin: '0 0 8px',
};

// Property card
const card: React.CSSProperties = {
  backgroundColor: C.white,
  border: `1px solid ${C.border}`,
  marginBottom: 24,
  overflow: 'hidden',
};

const cardImg: React.CSSProperties = {
  width: '100%',
  height: 260,
  objectFit: 'cover' as const,
  display: 'block',
};

const badge: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: C.gold,
  color: C.white,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  padding: '4px 12px',
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  margin: '12px 0 0 16px',
};

const cardBody: React.CSSProperties = {
  padding: '16px 24px 24px',
};

const cardLocation: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 8px',
};

const cardTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 19,
  fontWeight: 700,
  color: C.blue,
  margin: '0 0 12px',
  lineHeight: '1.35',
};

const cardStat: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: C.blue60,
  margin: 0,
};

const cardPrice: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 22,
  color: C.blue,
  margin: '8px 0 0',
};

const viewBtn: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: C.blue,
  backgroundColor: 'transparent',
  textDecoration: 'none',
  padding: '8px 0',
};

// CTAs
const primaryBtn: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  backgroundColor: C.gold,
  color: C.white,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
};

const outlineBtn: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  backgroundColor: 'transparent',
  color: C.blue,
  border: `2px solid ${C.blue}`,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  padding: '12px 32px',
  textDecoration: 'none',
  display: 'inline-block',
};

const divider: React.CSSProperties = {
  borderColor: C.border,
  margin: '8px 0',
};

// How it works
const howItWorksCol: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '0 16px',
  verticalAlign: 'top',
  width: '33%',
};

const howItWorksIcon: React.CSSProperties = {
  fontSize: 32,
  margin: '0 0 10px',
  textAlign: 'center' as const,
};

const howItWorksTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 15,
  fontWeight: 700,
  color: C.blue,
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const howItWorksText: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 13,
  color: C.blue60,
  lineHeight: '1.6',
  margin: 0,
  textAlign: 'center' as const,
};

// Footer
const footer: React.CSSProperties = {
  backgroundColor: C.blue,
  padding: '36px 0 32px',
};

const footerLogo: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  color: C.white,
  fontSize: 18,
  fontWeight: 700,
  textAlign: 'center' as const,
  margin: '0 0 16px',
};

const footerLink: React.CSSProperties = {
  color: 'rgba(255,255,255,0.7)',
  fontSize: 12,
  textDecoration: 'none',
  fontFamily: "'Nunito Sans', Arial, sans-serif",
};

const footerSmall: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  color: 'rgba(255,255,255,0.4)',
  fontSize: 11,
  textAlign: 'center' as const,
  margin: '6px 0 0',
  lineHeight: '1.6',
};
