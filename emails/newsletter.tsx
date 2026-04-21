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
  price: string;
  beds: number;
  size: number;
  imageUrl: string;
  slug: string;
}

interface NewsletterEmailProps {
  firstName?: string;
  subject?: string;
  introText?: string;
  properties?: Property[];
}

// ── Defaults (used for preview) ───────────────────────────────────────────────
const defaultProperties: Property[] = [
  {
    title: 'Luxury Villa, Costa del Sol',
    location: 'Marbella, Spain',
    price: '€185,000',
    beds: 4,
    size: 320,
    imageUrl: 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/hero.jpg',
    slug: 'luxury-villa-costa-del-sol',
  },
  {
    title: 'Provençal Farmhouse',
    location: 'Luberon, France',
    price: '€122,500',
    beds: 3,
    size: 210,
    imageUrl: 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/hero.jpg',
    slug: 'provencal-farmhouse-luberon',
  },
  {
    title: 'Tuscan Stone Cottage',
    location: 'Siena, Italy',
    price: '€97,000',
    beds: 2,
    size: 140,
    imageUrl: 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/hero.jpg',
    slug: 'tuscan-stone-cottage-siena',
  },
];

// ── Colours (matching COP brand) ──────────────────────────────────────────────
const brand = {
  navy:   '#2C4A5E',
  gold:   '#C9A84C',
  cream:  '#FAF8F4',
  text:   '#2C3E50',
  light:  '#F4F1EB',
  border: '#E0D9CC',
  white:  '#FFFFFF',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function NewsletterEmail({
  firstName = 'there',
  subject = "New co-ownership properties you'll love",
  introText = "We've handpicked some stunning new listings this week — beautifully designed homes in sought-after locations, each available as a co-ownership share. Browse below and click any property to see the full details.",
  properties = defaultProperties,
}: NewsletterEmailProps) {
  const previewText = `Hi ${firstName}, ${subject}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>

        {/* ── Header ── */}
        <Section style={headerStyle}>
          <Container style={containerStyle}>
            <Row>
              <Column>
                <Text style={logoStyle}>Co-Ownership Property</Text>
                <Text style={logoTaglineStyle}>Your European Dream Home, Shared Smartly</Text>
              </Column>
            </Row>
          </Container>
        </Section>

        {/* ── Hero greeting ── */}
        <Container style={containerStyle}>
          <Section style={heroSectionStyle}>
            <Heading style={h1Style}>Hi {firstName} 👋</Heading>
            <Text style={introStyle}>{introText}</Text>
          </Section>

          <Hr style={hrStyle} />

          {/* ── Property cards ── */}
          <Section>
            <Heading style={h2Style}>✨ New Listings This Week</Heading>
            {properties.map((p, i) => (
              <Section key={i} style={cardStyle}>
                <Link href={`https://co-ownershipProperty.com/property/${p.slug}`} style={{ textDecoration: 'none' }}>
                  <Img
                    src={p.imageUrl}
                    alt={p.title}
                    width="560"
                    height="280"
                    style={cardImageStyle}
                  />
                </Link>
                <Section style={cardBodyStyle}>
                  <Heading style={cardTitleStyle}>{p.title}</Heading>
                  <Text style={cardLocationStyle}>📍 {p.location}</Text>
                  <Row style={{ marginBottom: 12 }}>
                    <Column>
                      <Text style={cardStatStyle}>🛏 {p.beds} Bed{p.beds > 1 ? 's' : ''}</Text>
                    </Column>
                    <Column>
                      <Text style={cardStatStyle}>📐 {p.size} m²</Text>
                    </Column>
                    <Column>
                      <Text style={cardPriceStyle}>{p.price}</Text>
                    </Column>
                  </Row>
                  <Button
                    href={`https://co-ownershipproperty.com/property/${p.slug}`}
                    style={ctaButtonStyle}
                  >
                    View Property →
                  </Button>
                </Section>
              </Section>
            ))}
          </Section>

          <Hr style={hrStyle} />

          {/* ── How it works reminder ── */}
          <Section style={infoSectionStyle}>
            <Heading style={h2Style}>How Co-Ownership Works</Heading>
            <Row>
              <Column style={infoColStyle}>
                <Text style={infoIconStyle}>🏡</Text>
                <Text style={infoTitleStyle}>Buy a Share</Text>
                <Text style={infoTextStyle}>Own 1/8 to 1/2 of a premium property for a fraction of the price.</Text>
              </Column>
              <Column style={infoColStyle}>
                <Text style={infoIconStyle}>📅</Text>
                <Text style={infoTitleStyle}>Enjoy Your Time</Text>
                <Text style={infoTextStyle}>Use your home for weeks per year proportional to your share.</Text>
              </Column>
              <Column style={infoColStyle}>
                <Text style={infoIconStyle}>💰</Text>
                <Text style={infoTitleStyle}>Build Equity</Text>
                <Text style={infoTextStyle}>Benefit from property appreciation and hassle-free management.</Text>
              </Column>
            </Row>
            <Section style={{ textAlign: 'center' as const, marginTop: 24 }}>
              <Button href="https://co-ownershipproperty.com/how-it-works" style={secondaryButtonStyle}>
                Learn More →
              </Button>
            </Section>
          </Section>

          <Hr style={hrStyle} />

          {/* ── CTA ── */}
          <Section style={{ textAlign: 'center' as const, padding: '32px 0' }}>
            <Heading style={h2Style}>Browse All Properties</Heading>
            <Text style={introStyle}>
              Over 50 co-ownership properties across Spain, France, Italy, Portugal and more.
            </Text>
            <Button href="https://co-ownershipproperty.com" style={ctaButtonStyle}>
              View All Listings →
            </Button>
          </Section>
        </Container>

        {/* ── Footer ── */}
        <Section style={footerStyle}>
          <Container style={containerStyle}>
            <Text style={footerTextStyle}>
              Co-Ownership Property · helping you own more for less
            </Text>
            <Text style={footerTextStyle}>
              <Link href="https://co-ownershipproperty.com" style={footerLinkStyle}>Website</Link>
              {' · '}
              <Link href="https://co-ownershipproperty.com/all-our-blog" style={footerLinkStyle}>Blog</Link>
              {' · '}
              <Link href="https://co-ownershipproperty.com/how-it-works" style={footerLinkStyle}>How It Works</Link>
            </Text>
            <Text style={unsubscribeStyle}>
              You're receiving this because you enquired about a co-ownership property.{' '}
              <Link href="{{unsubscribe_url}}" style={footerLinkStyle}>Unsubscribe</Link>
            </Text>
          </Container>
        </Section>

      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const bodyStyle: React.CSSProperties = {
  backgroundColor: brand.cream,
  fontFamily: "'Nunito Sans', 'Helvetica Neue', Arial, sans-serif",
  margin: 0,
  padding: 0,
};

const containerStyle: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '0 24px',
};

const headerStyle: React.CSSProperties = {
  backgroundColor: brand.navy,
  padding: '24px 0',
};

const logoStyle: React.CSSProperties = {
  color: brand.white,
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: '0.5px',
  margin: 0,
  textAlign: 'center' as const,
};

const logoTaglineStyle: React.CSSProperties = {
  color: brand.gold,
  fontSize: 12,
  margin: '4px 0 0',
  textAlign: 'center' as const,
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
};

const heroSectionStyle: React.CSSProperties = {
  padding: '40px 0 24px',
};

const h1Style: React.CSSProperties = {
  color: brand.navy,
  fontSize: 28,
  fontWeight: 700,
  margin: '0 0 16px',
};

const h2Style: React.CSSProperties = {
  color: brand.navy,
  fontSize: 20,
  fontWeight: 700,
  margin: '0 0 20px',
};

const introStyle: React.CSSProperties = {
  color: brand.text,
  fontSize: 15,
  lineHeight: '1.7',
  margin: '0 0 8px',
};

const hrStyle: React.CSSProperties = {
  borderColor: brand.border,
  margin: '32px 0',
};

const cardStyle: React.CSSProperties = {
  backgroundColor: brand.white,
  borderRadius: 12,
  overflow: 'hidden',
  marginBottom: 24,
  border: `1px solid ${brand.border}`,
};

const cardImageStyle: React.CSSProperties = {
  width: '100%',
  height: 280,
  objectFit: 'cover' as const,
  display: 'block',
  borderRadius: '12px 12px 0 0',
};

const cardBodyStyle: React.CSSProperties = {
  padding: '20px 24px 24px',
};

const cardTitleStyle: React.CSSProperties = {
  color: brand.navy,
  fontSize: 18,
  fontWeight: 700,
  margin: '0 0 6px',
};

const cardLocationStyle: React.CSSProperties = {
  color: '#666',
  fontSize: 13,
  margin: '0 0 12px',
};

const cardStatStyle: React.CSSProperties = {
  color: brand.text,
  fontSize: 13,
  margin: 0,
};

const cardPriceStyle: React.CSSProperties = {
  color: brand.gold,
  fontSize: 18,
  fontWeight: 700,
  margin: 0,
};

const ctaButtonStyle: React.CSSProperties = {
  backgroundColor: brand.gold,
  color: brand.white,
  borderRadius: 8,
  padding: '12px 28px',
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
  display: 'inline-block',
  marginTop: 4,
};

const secondaryButtonStyle: React.CSSProperties = {
  backgroundColor: 'transparent',
  color: brand.navy,
  border: `2px solid ${brand.navy}`,
  borderRadius: 8,
  padding: '10px 28px',
  fontSize: 14,
  fontWeight: 700,
  textDecoration: 'none',
  display: 'inline-block',
};

const infoSectionStyle: React.CSSProperties = {
  padding: '8px 0',
};

const infoColStyle: React.CSSProperties = {
  textAlign: 'center' as const,
  padding: '0 12px',
  verticalAlign: 'top',
};

const infoIconStyle: React.CSSProperties = {
  fontSize: 28,
  margin: '0 0 8px',
};

const infoTitleStyle: React.CSSProperties = {
  color: brand.navy,
  fontWeight: 700,
  fontSize: 14,
  margin: '0 0 6px',
};

const infoTextStyle: React.CSSProperties = {
  color: '#666',
  fontSize: 13,
  lineHeight: '1.5',
  margin: 0,
};

const footerStyle: React.CSSProperties = {
  backgroundColor: brand.navy,
  padding: '32px 0',
  marginTop: 48,
};

const footerTextStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.7)',
  fontSize: 12,
  textAlign: 'center' as const,
  margin: '0 0 8px',
};

const footerLinkStyle: React.CSSProperties = {
  color: brand.gold,
  textDecoration: 'none',
};

const unsubscribeStyle: React.CSSProperties = {
  color: 'rgba(255,255,255,0.4)',
  fontSize: 11,
  textAlign: 'center' as const,
  margin: '16px 0 0',
};
