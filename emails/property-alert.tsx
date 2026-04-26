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
interface AlertProperty {
  title: string;
  price: string;
  beds: number;
  size: number;
  location: string;
  slug: string;
  imageUrl?: string;
  shareSize?: string;
  isNew?: boolean;
}

interface PropertyAlertProps {
  firstName?: string;
  searchCriteria?: string;
  matchCount?: number;
  properties?: AlertProperty[];
  editAlertUrl?: string;
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
const sampleProperties: AlertProperty[] = [
  {
    title: 'Marbella, Spain — 3-Bed Luxury Villa With Private Pool',
    price: '€189,500',
    beds: 3,
    size: 220,
    location: 'Marbella, Spain',
    slug: 'marbella-3-bed-luxury-villa-private-pool',
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
    shareSize: '1/4 share',
    isNew: true,
  },
  {
    title: 'Sotogrande, Spain — 4-Bed Cortijo With Mountain Views',
    price: '€224,000',
    beds: 4,
    size: 310,
    location: 'Sotogrande, Spain',
    slug: 'sotogrande-4-bed-cortijo-mountain-views',
    imageUrl: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=600&q=80',
    shareSize: '1/4 share',
    isNew: true,
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function PropertyAlert({
  firstName = 'Emma',
  searchCriteria = 'Spain · Up to €300,000',
  matchCount = 2,
  properties = sampleProperties,
  editAlertUrl = 'https://co-ownership-property.com/alerts/edit/',
  unsubscribeUrl = '{{unsubscribe_url}}',
}: PropertyAlertProps) {
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

      <Preview>{matchCount} new {matchCount === 1 ? 'property matches' : 'properties match'} your saved search.</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Section style={goldRuleHeader} />
            <Text style={wordmark}>Co-Ownership Property</Text>
            <Section style={goldRuleHeader} />
          </Container>
        </Section>

        {/* ── ALERT HERO BAND ── */}
        <Section style={alertBand}>
          <Container style={wrap}>
            <Text style={diamondIcon}>◆</Text>
            <Heading style={alertHeading}>
              <em>{matchCount} new {matchCount === 1 ? 'property matches' : 'properties match'} your search</em>
            </Heading>
            <Text style={alertSub}>
              Listed in the last 24 hours — matched to your saved criteria.
            </Text>
            <Section style={{ marginTop: 20 }}>
              <Text style={searchPill}>YOUR SEARCH&ensp;·&ensp;{searchCriteria}</Text>
            </Section>
          </Container>
        </Section>

        {/* ── YOUR MATCHES ── */}
        <Section style={{ backgroundColor: C.cream, paddingTop: 40, paddingBottom: 8 }}>
          <Container style={wrap}>

            <Text style={eyebrow}>Your Matches</Text>
            <Hr style={goldBar} />

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
                    {p.isNew && (
                      <Text style={newBadge}>NEW TODAY</Text>
                    )}
                    {p.shareSize && (
                      <Text style={shareBadge}>{p.shareSize}</Text>
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

        {/* ── BROWSE ALL CTA ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 40, textAlign: 'center' as const }}>
          <Container style={wrap}>
            <Button href={`${base}/our-homes/`} style={ctaBtn}>
              BROWSE ALL PROPERTIES
            </Button>
          </Container>
        </Section>

        {/* ── FOOTER ── */}
        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <Section style={footGoldRule} />
            <Text style={footLinks}>
              <Link href={base} style={footLink}>Website</Link>
              {'  ·  '}
              <Link href={`${base}/our-homes/`} style={footLink}>Our Homes</Link>
              {'  ·  '}
              <Link href={`${base}/how-it-works/`} style={footLink}>How It Works</Link>
              {'  ·  '}
              <Link href={`${base}/all-our-blog/`} style={footLink}>Blog</Link>
            </Text>
            <Hr style={footDivider} />
            <Text style={footFine}>
              You're receiving this email because you signed up at co-ownership-property.com
            </Text>
            <Text style={footFine}>
              Not what you're looking for?{' '}
              <Link href={editAlertUrl} style={{ color: C.gold, textDecoration: 'none' }}>Edit your alert</Link>
              {' · '}
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

const alertBand: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '40px 0 36px',
};

const diamondIcon: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 14,
  color: C.gold,
  textAlign: 'center' as const,
  margin: '0 0 12px',
  letterSpacing: '0.1em',
};

const alertHeading: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 26,
  fontWeight: 400,
  fontStyle: 'italic',
  color: C.white,
  textAlign: 'center' as const,
  margin: '0 0 12px',
  lineHeight: '1.35',
};

const alertSub: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  color: 'rgba(255,255,255,0.6)',
  textAlign: 'center' as const,
  margin: 0,
  letterSpacing: '0.04em',
};

const searchPill: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  border: `1px solid ${C.gold}`,
  padding: '8px 20px',
  display: 'inline-block',
  textAlign: 'center' as const,
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

const propCard: React.CSSProperties = {
  backgroundColor: C.white,
  marginBottom: 16,
  overflow: 'hidden',
};

const cardImgCol: React.CSSProperties = {
  width: 160,
  verticalAlign: 'top',
  position: 'relative' as const,
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

const newBadge: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.12em',
  backgroundColor: C.gold,
  color: C.white,
  padding: '3px 8px',
  margin: '4px 0 0 4px',
  display: 'inline-block',
};

const shareBadge: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  backgroundColor: C.navy,
  color: C.white,
  padding: '3px 8px',
  margin: '4px 0 0 4px',
  display: 'inline-block',
};

const cardTextCol: React.CSSProperties = {
  verticalAlign: 'top',
  padding: '16px 20px',
};

const locationLabel: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 6px',
};

const cardTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 16,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 8px',
  lineHeight: '1.4',
};

const cardStats: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
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
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: C.gold,
  textDecoration: 'none',
};

const ctaBtn: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  backgroundColor: C.navy,
  color: C.white,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.18em',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
};

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
