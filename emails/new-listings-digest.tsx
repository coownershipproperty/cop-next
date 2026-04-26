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
  navy:   '#1E3448',
  navy60: '#6B8A9E',
  gold:   '#C9A84C',
  cream:  '#F7F4EE',
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
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
          @media only screen and (max-width: 600px) {
            p { font-size: 17px !important; line-height: 1.75 !important; }
            h1, h2, h3 { font-size: 26px !important; line-height: 1.35 !important; }
            img { max-width: 100% !important; height: auto !important; }
          }
        `}</style>
      </Head>

      <Preview>{newPropertyCount} new properties just listed on Co-Ownership Property.</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Section style={goldRuleHeader} />
            <Text style={wordmark}>Co-Ownership Property</Text>
            <Section style={goldRuleHeader} />
          </Container>
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
                      <Text style={hCardStats}>{p.beds} Beds{p.size ? <>&emsp;|&emsp;{p.size} m²</> : null}</Text>
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
            <Section style={footGoldRule} />
            <Text style={footLinks}>
              <Link href={`${base}/our-homes/`} style={footLink}>Properties</Link>
              {'  ·  '}
              <Link href={`${base}/how-it-works/`} style={footLink}>How It Works</Link>
              {'  ·  '}
              <Link href={`${base}/all-our-blog/`} style={footLink}>Our Blog</Link>
              {'  ·  '}
              <Link href={unsubscribeUrl} style={footLink}>Unsubscribe</Link>
            </Text>
            <Hr style={footDivider} />
            <Text style={footFine}>
              You're receiving this email because you signed up at co-ownership-property.com
            </Text>
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

const body: React.CSSProperties = {
  backgroundColor: C.cream,
  margin: 0,
  padding: 0,
  fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '0 20px',
};

const header: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '52px 0 44px',
};

const wordmark: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  color: C.white,
  fontSize: 26,
  fontWeight: 300,
  letterSpacing: '0.24em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '20px 0',
};

const goldRuleHeader: React.CSSProperties = {
  backgroundColor: C.gold,
  height: 1,
  maxWidth: 56,
  margin: '0 auto',
};

const eyebrow: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
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
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 26,
  fontWeight: 700,
  color: C.navy,
  margin: '0 0 16px',
  lineHeight: '1.3',
};

const bodyText: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 16,
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
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
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
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 6px',
};

const hCardTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 14,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 8px',
  lineHeight: '1.4',
};

const hCardStats: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  color: C.navy60,
  margin: 0,
};

const hCardPrice: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 600,
  color: C.navy,
  margin: 0,
};

const viewLink: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  textDecoration: 'underline',
};

// CTA
const ctaBtn: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  backgroundColor: C.navy,
  color: C.white,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.16em',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
};

// Sign-off
const signOffBody: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
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
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 16,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 4px',
};

const signOffSite: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  color: C.navy60,
  margin: 0,
};

// Footer
const footer: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '56px 0 48px',
  borderTop: `2px solid ${C.gold}`,
};

const footLogo: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  color: C.white,
  fontSize: 22,
  fontWeight: 300,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '0 0 20px',
};

const footGoldRule: React.CSSProperties = {
  backgroundColor: C.gold,
  height: 1,
  maxWidth: 40,
  margin: '0 auto 28px',
};

const footLinks: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 300,
  letterSpacing: '0.1em',
  textAlign: 'center' as const,
  margin: '0 0 4px',
  color: 'rgba(255,255,255,0.4)',
};

const footLink: React.CSSProperties = {
  color: 'rgba(255,255,255,0.5)',
  textDecoration: 'none',
};

const footDivider: React.CSSProperties = {
  borderColor: 'rgba(255,255,255,0.08)',
  margin: '28px 0',
};

const footFine: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  color: 'rgba(255,255,255,0.3)',
  fontSize: 12,
  fontWeight: 300,
  textAlign: 'center' as const,
  margin: '6px 0 0',
  lineHeight: '1.8',
  letterSpacing: '0.04em',
};
