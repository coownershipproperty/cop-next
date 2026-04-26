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
interface SimilarProperty {
  title: string;
  price: string;
  beds: number;
  size: number;
  slug: string;
  imageUrl?: string;
}

interface FloorPlanEmailProps {
  firstName?: string;
  propertyTitle?: string;
  driveUrl?: string;
  propertyUrl?: string;
  similarProperties?: SimilarProperty[];
  trackingPixelHtml?: string;
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

// ── Sample data ───────────────────────────────────────────────────────────────
const sampleSimilar: SimilarProperty[] = [
  {
    title: 'Mallorca, Spain — 5-Bed Clifftop Villa With Sea Views',
    price: '€287,500',
    beds: 5,
    size: 380,
    slug: 'mallorca-5-bed-clifftop-villa',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
  },
  {
    title: 'Luberon, Provence, France — 4-Bed Mas With Vineyard Views',
    price: '€247,500',
    beds: 4,
    size: 280,
    slug: 'luberon-provence-4-bed-mas-vineyard',
    imageUrl: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=600&q=80',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function FloorPlanEmail({
  firstName = 'James',
  propertyTitle = 'Morzine, French Alps — 5-Bed Ski Chalet With Hot Tub',
  driveUrl = 'https://drive.google.com/drive/folders/example',
  propertyUrl = 'https://co-ownership-property.com/property/morzine-5-bed-ski-chalet/',
  similarProperties = sampleSimilar,
  trackingPixelHtml,
}: FloorPlanEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Nunito+Sans:wght@300;400;600;700&display=swap');
        `}</style>
      </Head>

      <Preview>Your floor plans and full gallery for {propertyTitle} are ready.</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Text style={headerLogo}>Co-Ownership Property</Text>
            <Text style={headerSub}>Your European Dream Home, Shared Smartly</Text>
          </Container>
        </Section>
        <Section style={goldLine}>
          <Text style={{ margin: 0, padding: 0, fontSize: 1, lineHeight: '3px' }}> </Text>
        </Section>

        {/* ── BODY ── */}
        <Section style={{ backgroundColor: C.white }}>
          <Container style={wrapBody}>

            <Text style={greeting}>Hi {firstName},</Text>

            <Text style={bodyText}>
              Here are the additional photos and floor plans you requested for{' '}
              <strong style={{ color: C.navy }}>{propertyTitle}</strong>.
            </Text>

            <Section style={{ margin: '32px 0', textAlign: 'center' as const }}>
              <Button href={driveUrl ?? base} style={ctaGold}>
                VIEW FULL GALLERY &amp; FLOOR PLANS →
              </Button>
            </Section>

            <Hr style={divider} />

            <Text style={bodyText}>
              Have questions? Reply to this email — we typically respond within a few hours.
            </Text>

            <Hr style={goldRule} />

            <Text style={signoffName}>The Co-Ownership Property Team</Text>
            <Text style={signoffSite}>
              <Link href={base} style={signoffLink}>co-ownership-property.com</Link>
            </Text>

          </Container>
        </Section>

        {/* ── SIMILAR PROPERTIES ── */}
        {similarProperties && similarProperties.length > 0 && (
          <Section style={{ backgroundColor: C.cream, paddingTop: 40, paddingBottom: 40 }}>
            <Container style={wrap}>

              <Text style={eyebrow}>You Might Also Like</Text>
              <Hr style={goldBar} />

              {similarProperties.map((p, i) => (
                <Section key={i} style={propCard}>
                  <Row>
                    <Column style={cardImgCol}>
                      {p.imageUrl ? (
                        <Link href={`${base}/property/${p.slug}`}>
                          <Img
                            src={p.imageUrl}
                            alt={p.title}
                            width="160"
                            height="120"
                            style={cardImg}
                          />
                        </Link>
                      ) : (
                        <Section style={{ ...cardImgPlaceholder }}>
                          <Text style={{ margin: 0, color: C.navy60, fontSize: 11 }}>No image</Text>
                        </Section>
                      )}
                    </Column>
                    <Column style={cardTextCol}>
                      <Text style={locationLabel}>
                        {p.title.split('—')[0]?.trim() ?? ''}
                      </Text>
                      <Heading style={cardTitle}>
                        {p.title.split('—')[1]?.trim() ?? p.title}
                      </Heading>
                      <Text style={cardStats}>
                        {p.beds} BEDS&ensp;|&ensp;{p.size} M²
                      </Text>
                      <Text style={cardPrice}>{p.price}</Text>
                      <Link href={`${base}/property/${p.slug}`} style={viewPropLink}>
                        View Property →
                      </Link>
                    </Column>
                  </Row>
                </Section>
              ))}

            </Container>
          </Section>
        )}

        {/* ── FOOTER ── */}
        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <Text style={footLinks}>
              <Link href={base} style={footLink}>Website</Link>{'  ·  '}
              <Link href={`${base}/our-homes/`} style={footLink}>Our Homes</Link>{'  ·  '}
              <Link href={`${base}/how-it-works/`} style={footLink}>How It Works</Link>{'  ·  '}
              <Link href={`${base}/all-our-blog/`} style={footLink}>Blog</Link>
            </Text>
            <Hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />
            <Text style={footFine}>
              You're receiving this because you requested floor plans on co-ownership-property.com.
            </Text>
          </Container>
        </Section>

        {/* ── TRACKING PIXEL ── */}
        {trackingPixelHtml && (
          <div dangerouslySetInnerHTML={{ __html: trackingPixelHtml }} />
        )}

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

const wrapBody: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '48px 48px',
};

const header: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '32px 0 28px',
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

const headerSub: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  color: C.gold,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '8px 0 0',
};

const goldLine: React.CSSProperties = {
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

const greeting: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 22,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 20px',
};

const bodyText: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 15,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 14px',
};

const ctaGold: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  backgroundColor: C.gold,
  color: C.white,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.14em',
  padding: '16px 40px',
  textDecoration: 'none',
  display: 'inline-block',
};

const divider: React.CSSProperties = {
  borderColor: C.border,
  margin: '28px 0',
};

const goldRule: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 2,
  width: 40,
  margin: '32px 0 24px',
};

const signoffName: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 15,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 4px',
};

const signoffSite: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 12,
  color: C.navy60,
  margin: 0,
};

const signoffLink: React.CSSProperties = {
  color: C.navy60,
  textDecoration: 'none',
};

const propCard: React.CSSProperties = {
  backgroundColor: C.white,
  marginBottom: 16,
  overflow: 'hidden',
};

const cardImgCol: React.CSSProperties = {
  width: 160,
  verticalAlign: 'top',
};

const cardImg: React.CSSProperties = {
  width: 160,
  height: 120,
  objectFit: 'cover' as const,
  display: 'block',
};

const cardImgPlaceholder: React.CSSProperties = {
  width: 160,
  height: 120,
  backgroundColor: C.border,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const cardTextCol: React.CSSProperties = {
  verticalAlign: 'top',
  padding: '16px 20px',
};

const locationLabel: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 6px',
};

const cardTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 15,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 8px',
  lineHeight: '1.4',
};

const cardStats: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: C.navy60,
  margin: '0 0 6px',
};

const cardPrice: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 18,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 8px',
};

const viewPropLink: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: C.gold,
  textDecoration: 'none',
};

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
