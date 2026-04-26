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
interface PriceDropAlertProps {
  firstName?: string;
  propertyTitle?: string;
  propertyUrl?: string;
  previousPrice?: string;
  newPrice?: string;
  saving?: string;
  beds?: number;
  size?: number;
  location?: string;
  imageUrl?: string;
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function PriceDropAlert({
  firstName = 'David',
  propertyTitle = 'Mallorca, Spain — 5-Bed Clifftop Villa With Sea Views',
  propertyUrl = `${base}/property/mallorca-5-bed-clifftop-villa-sea-views`,
  previousPrice = '€215,000',
  newPrice = '€189,000',
  saving = '€26,000',
  beds = 5,
  size = 380,
  location = 'Mallorca, Spain',
  imageUrl,
  unsubscribeUrl = '#',
}: PriceDropAlertProps) {

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

      <Preview>Price reduced on {propertyTitle} — now {newPrice}.</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Text style={headerLogo}>Co-Ownership Property</Text>
          </Container>
        </Section>
        <Section style={goldStrip}>
          <Text style={{ margin: 0, padding: 0, fontSize: 1, lineHeight: '3px' }}> </Text>
        </Section>

        {/* ── ALERT BAND ── */}
        <Section style={alertBand}>
          <Container style={wrap}>
            <Section style={{ padding: '32px 0' }}>
              <Text style={alertLabel}>— Price Reduced —</Text>
              <Heading style={alertTitle}>{propertyTitle}</Heading>
              <Text style={alertLocation}>{location}</Text>
            </Section>
          </Container>
        </Section>

        {/* ── PRICE COMPARISON ── */}
        <Section style={{ backgroundColor: C.white, borderBottom: `1px solid ${C.border}` }}>
          <Container style={wrap}>
            <Section style={{ padding: '36px 0' }}>
              <Row>
                <Column style={{ textAlign: 'center' as const, verticalAlign: 'middle' }}>
                  <Text style={wasLabel}>Was</Text>
                  <Text style={prevPrice}>{previousPrice}</Text>
                </Column>
                <Column style={{ width: 32, textAlign: 'center' as const, verticalAlign: 'middle' }}>
                  <Text style={arrow}>→</Text>
                </Column>
                <Column style={{ textAlign: 'center' as const, verticalAlign: 'middle' }}>
                  <Text style={nowLabel}>Now</Text>
                  <Text style={nowPrice}>{newPrice}</Text>
                </Column>
                <Column style={{ textAlign: 'center' as const, verticalAlign: 'middle', paddingLeft: 16 }}>
                  <Text style={savingBadge}>You save {saving}</Text>
                </Column>
              </Row>
            </Section>
          </Container>
        </Section>

        {/* ── PROPERTY DETAIL ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '36px 0 0' }}>

              {imageUrl ? (
                <Link href={propertyUrl}>
                  <Img
                    src={imageUrl}
                    alt={propertyTitle}
                    width="536"
                    style={heroImg}
                  />
                </Link>
              ) : (
                <Link href={propertyUrl}>
                  <Section style={heroImgPlaceholder}> </Section>
                </Link>
              )}

              <Section style={{ padding: '28px 0 0' }}>
                <Text style={statRow}>{beds} Beds&emsp;|&emsp;{size} m²&emsp;|&emsp;{location}</Text>
                <Hr style={{ borderColor: C.border, margin: '20px 0' }} />
                <Text style={bodyText}>
                  Hi {firstName},
                </Text>
                <Text style={bodyText}>
                  This property has just had its price reduced. If it was on your radar, now might be the right time to take a closer look.
                </Text>
                <Text style={bodyText}>
                  Price reductions on quality co-ownership properties are uncommon — when they happen, interest tends to move quickly.
                </Text>
              </Section>

            </Section>
          </Container>
        </Section>

        {/* ── CTA ── */}
        <Section style={{ backgroundColor: C.cream, padding: '32px 0 56px' }}>
          <Container style={wrap}>
            <Section style={{ textAlign: 'center' as const }}>
              <Button href={propertyUrl} style={ctaBtn}>
                View Updated Listing →
              </Button>
            </Section>
          </Container>
        </Section>

        {/* ── SIGN-OFF ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 36 }}>
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

        {/* ── ALERT ATTRIBUTION ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 48 }}>
          <Container style={wrap}>
            <Text style={alertAttrib}>
              This alert was sent because you previously enquired about this property.
            </Text>
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
  fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '0 20px',
};

const header: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '32px 0 28px',
};

const headerLogo: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
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

// Alert band
const alertBand: React.CSSProperties = {
  backgroundColor: C.navy,
};

const alertLabel: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  textAlign: 'center' as const,
  margin: '0 0 12px',
};

const alertTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 22,
  fontWeight: 400,
  fontStyle: 'italic',
  color: C.white,
  textAlign: 'center' as const,
  margin: '0 0 10px',
  lineHeight: '1.4',
};

const alertLocation: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  textAlign: 'center' as const,
  margin: 0,
};

// Price comparison
const wasLabel: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.navy60,
  margin: '0 0 4px',
  textAlign: 'center' as const,
};

const prevPrice: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 22,
  fontWeight: 400,
  color: C.navy60,
  textDecoration: 'line-through',
  textAlign: 'center' as const,
  margin: 0,
};

const arrow: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 18,
  color: C.border,
  textAlign: 'center' as const,
  margin: 0,
};

const nowLabel: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 4px',
  textAlign: 'center' as const,
};

const nowPrice: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 28,
  fontWeight: 700,
  color: C.gold,
  textAlign: 'center' as const,
  margin: 0,
};

const savingBadge: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: C.navy,
  backgroundColor: C.gold,
  padding: '6px 12px',
  textAlign: 'center' as const,
  margin: 0,
  display: 'inline-block',
};

// Property
const heroImg: React.CSSProperties = {
  width: '100%',
  height: 300,
  objectFit: 'cover' as const,
  display: 'block',
};

const heroImgPlaceholder: React.CSSProperties = {
  width: '100%',
  height: 300,
  background: 'linear-gradient(150deg,#4A6A7E,#2C4A5E)',
  display: 'block',
};

const statRow: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: C.navy60,
  margin: 0,
};

const bodyText: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 16,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 12px',
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

const alertAttrib: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  color: C.navy60,
  fontStyle: 'italic',
  textAlign: 'center' as const,
  margin: 0,
};

// Footer
const footer: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '40px 0 36px',
  borderTop: `1px solid ${C.gold}`,
};

const footLogo: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  color: C.white,
  fontSize: 17,
  fontWeight: 300,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '0 0 14px',
};

const footLinks: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 400,
  textAlign: 'center' as const,
  margin: 0,
};

const footLink: React.CSSProperties = {
  color: 'rgba(255,255,255,0.45)',
  textDecoration: 'none',
};

const footFine: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  color: 'rgba(255,255,255,0.25)',
  fontSize: 13,
  fontWeight: 300,
  textAlign: 'center' as const,
  margin: '4px 0 0',
  lineHeight: '1.7',
};
