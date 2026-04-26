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

// ── Types ─────────────────────────────────────────────────────────────────────
interface ListingProperty {
  title: string;
  price: string;
  beds: number;
  size: number;
  location: string;
  country: string;
  slug: string;
  imageUrl?: string;
  isNew?: boolean;
}

interface NewListingsDigestProps {
  newPropertyCount?: number;
  properties?: ListingProperty[];
  unsubscribeUrl?: string;
}

// ── Brand colours ─────────────────────────────────────────────────────────────
const C = {
  navy:   '#2C4A5E',
  navy60: '#6B8A9E',
  gold:   '#C9A84C',
  cream:  '#F5F2EC',
  white:  '#FFFFFF',
  border: '#E8E3DC',
};

const base = 'https://co-ownership-property.com';

// ── Sample / preview data ─────────────────────────────────────────────────────
const sampleProperties: ListingProperty[] = [
  {
    title: 'Luberon, Provence, France — 4-Bed Mas With Vineyard Views',
    price: '€247,500',
    beds: 4,
    size: 280,
    location: 'Luberon, Provence',
    country: 'France',
    slug: 'luberon-provence-4-bed-mas-vineyard',
    isNew: true,
  },
  {
    title: 'Marbella, Costa del Sol — 3-Bed Contemporary Villa With Pool',
    price: '€163,000',
    beds: 3,
    size: 210,
    location: 'Marbella, Costa del Sol',
    country: 'Spain',
    slug: 'marbella-costa-del-sol-3-bed-contemporary-villa',
    isNew: true,
  },
  {
    title: 'Lake Como, Lombardy, Italy — 2-Bed Lakeside Apartment',
    price: '€118,000',
    beds: 2,
    size: 130,
    location: 'Lake Como, Lombardy',
    country: 'Italy',
    slug: 'lake-como-lombardy-2-bed-lakeside-apartment',
    isNew: true,
  },
  {
    title: 'Algarve, Portugal — 4-Bed Ocean View Villa',
    price: '€195,000',
    beds: 4,
    size: 265,
    location: 'Algarve',
    country: 'Portugal',
    slug: 'algarve-portugal-4-bed-ocean-view-villa',
    isNew: true,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function NewListingsDigest({
  newPropertyCount = 4,
  properties = sampleProperties,
  unsubscribeUrl = '#',
}: NewListingsDigestProps) {

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Nunito+Sans:wght@300;400;600;700&display=swap');
        `}</style>
      </Head>

      <Preview>{newPropertyCount} new properties just listed on Co-Ownership Property.</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Text style={headerTagline}>New This Week</Text>
            <Text style={headerLogo}>Co-Ownership Property</Text>
          </Container>
        </Section>
        <Section style={goldStrip}>
          <Text style={{ margin: 0, padding: 0, fontSize: 1, lineHeight: '3px' }}> </Text>
        </Section>

        {/* ── INTRO ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '52px 0 8px' }}>
              <Text style={eyebrow}>Just Listed</Text>
              <Hr style={goldBar} />
              <Heading style={mainHeading}>
                {newPropertyCount} New Properties Just Added
              </Heading>
              <Text style={bodyText}>
                We've just added the following properties to our collection. Browse them below — new listings move quickly.
              </Text>
            </Section>
          </Container>
        </Section>

        {/* ── PROPERTY CARDS ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ paddingBottom: 8 }}>
              {properties.map((p, i) => (
                <Section key={i} style={hCard}>
                  <Row>
                    {/* Image column */}
                    <Column style={hCardImgCol}>
                      <Link href={`${base}/property/${p.slug}`} style={{ position: 'relative' as const, display: 'block' }}>
                        {p.imageUrl ? (
                          <Img
                            src={p.imageUrl}
                            alt={p.title}
                            width="160"
                            height="130"
                            style={hCardImg}
                          />
                        ) : (
                          <Section style={hCardImgPlaceholder}> </Section>
                        )}
                      </Link>
                      {p.isNew && (
                        <Text style={newBadge}>NEW</Text>
                      )}
                    </Column>
                    {/* Content column */}
                    <Column style={hCardContent}>
                      <Text style={hCardLocation}>{p.location}, {p.country}</Text>
                      <Text style={hCardTitle}>{p.title}</Text>
                      <Text style={hCardStats}>{p.beds} Beds&emsp;|&emsp;{p.size} m²</Text>
                      <Row style={{ marginTop: 12 }}>
                        <Column>
                          <Text style={hCardPrice}>{p.price}</Text>
                        </Column>
                        <Column style={{ textAlign: 'right' as const, verticalAlign: 'middle' }}>
                          <Link href={`${base}/property/${p.slug}`} style={viewLink}>
                            View Property →
                          </Link>
                        </Column>
                      </Row>
                    </Column>
                  </Row>
                </Section>
              ))}
            </Section>
          </Container>
        </Section>

        {/* ── CTA ── */}
        <Section style={{ backgroundColor: C.cream, padding: '24px 0 64px' }}>
          <Container style={wrap}>
            <Section style={{ textAlign: 'center' as const }}>
              <Button href={`${base}/our-homes/`} style={ctaBtn}>
                Browse All Properties
              </Button>
            </Section>
          </Container>
        </Section>

        {/* ── SIGN-OFF ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 48 }}>
          <Container style={wrap}>
            <Hr style={{ borderColor: C.border, margin: '0 0 28px' }} />
            <Text style={signOffBody}>
              If any of these resonate, or if you have a destination in mind that we haven't listed, reply to this email — our team typically responds within minutes.
            </Text>
            <Hr style={goldRule} />
            <Text style={signOffName}>The Co-Ownership Property Team</Text>
            <Text style={signOffSite}>co-ownership-property.com</Text>
          </Container>
        </Section>

        {/* ── FOOTER ── */}
        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <Text style={footLinks}>
              <Link href={`${base}/our-homes/`} style={footLink}>Properties</Link>{'  ·  '}
              <Link href={`${base}/how-it-works/`} style={footLink}>How It Works</Link>{'  ·  '}
              <Link href={`${base}/all-our-blog/`} style={footLink}>Our Blog</Link>{'  ·  '}
              <Link href={unsubscribeUrl} style={footLink}>Unsubscribe</Link>
            </Text>
            <Hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />
            <Text style={footFine}>
              You're receiving this because you signed up for property alerts.
            </Text>
            <Text style={footFine}>info@co-ownership-property.com</Text>
          </Container>
        </Section>

      </Body>
    </Html>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: C.cream,
  margin: 0,
  padding: 0,
  fontFamily: "'Nunito Sans', 'Helvetica Neue', Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '0 32px',
};

const header: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '28px 0 28px',
};

const headerTagline: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  color: C.gold,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '0 0 6px',
};

const headerLogo: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  color: C.white,
  fontSize: 26,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textAlign: 'center' as const,
  margin: 0,
};

const goldStrip: React.CSSProperties = {
  backgroundColor: C.gold,
  height: 3,
  lineHeight: '3px',
  fontSize: 1,
};

const eyebrow: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 10px',
};

const goldBar: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 2,
  width: 40,
  margin: '0 0 24px',
};

const mainHeading: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 26,
  fontWeight: 700,
  color: C.navy,
  margin: '0 0 16px',
  lineHeight: '1.3',
};

const bodyText: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 15,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 12px',
};

// Horizontal property card
const hCard: React.CSSProperties = {
  border: `1px solid ${C.border}`,
  backgroundColor: C.white,
  marginBottom: 16,
  overflow: 'hidden',
  position: 'relative' as const,
};

const hCardImgCol: React.CSSProperties = {
  width: 160,
  verticalAlign: 'top',
  position: 'relative' as const,
};

const hCardImg: React.CSSProperties = {
  width: 160,
  height: 130,
  objectFit: 'cover' as const,
  display: 'block',
};

const hCardImgPlaceholder: React.CSSProperties = {
  width: 160,
  height: 130,
  background: 'linear-gradient(150deg,#4A6A7E,#2C4A5E)',
  display: 'block',
};

const newBadge: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '0.14em',
  color: C.navy,
  backgroundColor: C.gold,
  padding: '3px 8px',
  margin: 0,
  position: 'absolute' as const,
  top: 8,
  left: 8,
  display: 'inline-block',
};

const hCardContent: React.CSSProperties = {
  padding: '16px 20px',
  verticalAlign: 'top',
};

const hCardLocation: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 8,
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 6px',
};

const hCardTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 14,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 8px',
  lineHeight: '1.4',
};

const hCardStats: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 10,
  color: C.navy60,
  margin: 0,
};

const hCardPrice: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 600,
  color: C.navy,
  margin: 0,
};

const viewLink: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 8,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  textDecoration: 'underline',
};

// CTA
const ctaBtn: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  backgroundColor: C.navy,
  color: C.white,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
};

// Sign-off
const signOffBody: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 14,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 24px',
};

const goldRule: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 1,
  width: 28,
  margin: '0 0 16px',
};

const signOffName: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 15,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 4px',
};

const signOffSite: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  color: C.navy60,
  margin: 0,
};

// Footer
const footer: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '36px 0 32px',
  borderTop: `3px solid ${C.gold}`,
};

const footLogo: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  color: C.white,
  fontSize: 18,
  fontWeight: 700,
  textAlign: 'center' as const,
  letterSpacing: '0.06em',
  margin: '0 0 14px',
};

const footLinks: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 12,
  textAlign: 'center' as const,
  margin: 0,
};

const footLink: React.CSSProperties = {
  color: 'rgba(255,255,255,0.55)',
  textDecoration: 'none',
};

const footFine: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  color: 'rgba(255,255,255,0.3)',
  fontSize: 11,
  textAlign: 'center' as const,
  margin: '4px 0 0',
  lineHeight: '1.7',
};
