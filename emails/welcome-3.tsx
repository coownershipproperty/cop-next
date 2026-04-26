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
interface FeaturedProperty {
  title: string;
  price: string;
  beds: number;
  size: number;
  location: string;
  slug: string;
  imageUrl?: string;
}

interface Welcome3Props {
  firstName?: string;
  properties?: FeaturedProperty[];
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

// ── Sample data ───────────────────────────────────────────────────────────────
const sampleProperties: FeaturedProperty[] = [
  {
    title: 'Morzine, French Alps — 5-Bed Ski Chalet With Hot Tub',
    price: '€199,000',
    beds: 5,
    size: 320,
    location: 'Morzine, French Alps',
    slug: 'morzine-5-bed-ski-chalet-hot-tub',
    imageUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=80',
  },
  {
    title: 'Mallorca, Spain — 5-Bed Clifftop Villa With Sea Views',
    price: '€287,500',
    beds: 5,
    size: 380,
    location: 'Mallorca, Spain',
    slug: 'mallorca-5-bed-clifftop-villa',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
  },
  {
    title: 'Cote d\'Azur, France — 3-Bed Provencal Mas With Pool',
    price: '€247,500',
    beds: 3,
    size: 240,
    location: 'Cote d\'Azur, France',
    slug: 'cote-dazur-3-bed-provencal-mas-pool',
    imageUrl: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=600&q=80',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function Welcome3({
  firstName = 'Caroline',
  properties = sampleProperties,
  unsubscribeUrl = '{{unsubscribe_url}}',
}: Welcome3Props) {
  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
        `}</style>
      </Head>

      <Preview>A few properties we think you'll love.</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Text style={wordmark}>Co-Ownership Property</Text>
            <Section style={goldRuleHeader} />
          </Container>
        </Section>

        {/* ── INTRO ── */}
        <Section style={{ backgroundColor: C.white }}>
          <Container style={wrapBody}>

            <Text style={greeting}>Hi {firstName},</Text>

            <Heading style={mainHeading}>Handpicked for You This Week</Heading>

            <Hr style={goldRule} />

            <Text style={bodyText}>
              Now that you know how co-ownership works, here are a few properties we think are worth a look. These are some of our current favourites — a mix of destinations and price points.
            </Text>

          </Container>
        </Section>

        {/* ── PROPERTY CARDS ── */}
        <Section style={{ backgroundColor: C.cream, paddingTop: 8, paddingBottom: 8 }}>
          <Container style={wrap}>

            {properties.map((p, i) => (
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
                          style={cardImgStyle}
                        />
                      </Link>
                    ) : (
                      <Section style={cardImgPlaceholder} />
                    )}
                  </Column>
                  <Column style={cardTextCol}>
                    <Text style={locationLabel}>{p.location}</Text>
                    <Heading style={cardTitle}>
                      {p.title.includes('—') ? p.title.split('—')[1]?.trim() : p.title}
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

        {/* ── CTA + SIGN-OFF ── */}
        <Section style={{ backgroundColor: C.white }}>
          <Container style={wrapBody}>

            <Section style={{ margin: '8px 0 32px', textAlign: 'center' as const }}>
              <Button href={`${base}/our-homes/`} style={ctaBtn}>
                BROWSE ALL 333+ PROPERTIES
              </Button>
            </Section>

            <Text style={bodyText}>
              If anything catches your eye — or if you have questions about any of them — just reply to this email. We're always happy to talk through the details.
            </Text>

            <Hr style={goldRule} />

            <Text style={signoffName}>The Co-Ownership Property Team</Text>
            <Text style={signoffSite}>
              <Link href={base} style={signoffLink}>co-ownership-property.com</Link>
            </Text>

          </Container>
        </Section>

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
              You're receiving this because you signed up to the Co-Ownership Property newsletter.
            </Text>
            <Text style={footFine}>
              <Link href={unsubscribeUrl} style={{ color: C.gold, textDecoration: 'none' }}>Unsubscribe</Link>
              {'  ·  info@co-ownership-property.com'}
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
  padding: '0 32px',
};

const wrapBody: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '48px 48px',
};

const header: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '40px 0 32px',
};

const wordmark: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  color: C.white,
  fontSize: 22,
  fontWeight: 300,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '0 0 20px',
};

const goldRuleHeader: React.CSSProperties = {
  backgroundColor: C.gold,
  height: 1,
  maxWidth: 48,
  margin: '0 auto',
};

const greeting: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 15,
  color: '#4A6070',
  margin: '0 0 16px',
};

const mainHeading: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 28,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 16px',
  lineHeight: '1.35',
};

const goldRule: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 2,
  width: 40,
  margin: '0 0 24px',
};

const bodyText: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 15,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 14px',
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

const cardImgStyle: React.CSSProperties = {
  width: 160,
  height: 120,
  objectFit: 'cover' as const,
  display: 'block',
};

const cardImgPlaceholder: React.CSSProperties = {
  width: 160,
  height: 120,
  backgroundColor: '#E8E3DC',
};

const cardTextCol: React.CSSProperties = {
  verticalAlign: 'top',
  padding: '16px 20px',
};

const locationLabel: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 6px',
};

const cardTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 15,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 8px',
  lineHeight: '1.4',
};

const cardStats: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: C.navy60,
  margin: '0 0 6px',
};

const cardPrice: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 18,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 8px',
};

const viewPropLink: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: C.gold,
  textDecoration: 'none',
};

const ctaBtn: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  backgroundColor: C.navy,
  color: C.white,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.18em',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
};

const signoffName: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 15,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 4px',
};

const signoffSite: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 12,
  color: C.navy60,
  margin: 0,
};

const signoffLink: React.CSSProperties = {
  color: C.navy60,
  textDecoration: 'none',
};

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
  fontSize: 11,
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
  fontSize: 11,
  fontWeight: 300,
  textAlign: 'center' as const,
  margin: '4px 0 0',
  lineHeight: '1.7',
};
