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
interface SpotlightProperty {
  title: string;
  price: string;
  beds: number;
  size: number;
  location: string;
  slug: string;
  imageUrl?: string;
  highlight?: string;
}

interface SeasonalSpotlightProps {
  season?: string;
  theme?: string;
  heroHeadline?: string;
  heroSubline?: string;
  introText?: string;
  properties?: SpotlightProperty[];
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
const sampleProperties: SpotlightProperty[] = [
  {
    title: 'Chamonix, French Alps — 4-Bed Chalet With Mont Blanc Views',
    price: '€312,000',
    beds: 4,
    size: 295,
    location: 'Chamonix, French Alps',
    slug: 'chamonix-french-alps-4-bed-chalet-mont-blanc',
    highlight: 'Ski-in ski-out',
  },
  {
    title: 'Verbier, Switzerland — 3-Bed Alpine Apartment',
    price: '€268,500',
    beds: 3,
    size: 185,
    location: 'Verbier, Switzerland',
    slug: 'verbier-switzerland-3-bed-alpine-apartment',
    highlight: 'South-facing terrace',
  },
  {
    title: 'Meribel, French Alps — 5-Bed Ski Lodge With Hot Tub',
    price: '€395,000',
    beds: 5,
    size: 410,
    location: 'Meribel, French Alps',
    slug: 'meribel-french-alps-5-bed-ski-lodge',
    highlight: 'Private hot tub',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function SeasonalSpotlight({
  season = 'Winter 2025',
  theme = 'Ski & Alpine',
  heroHeadline = 'The Alps Are Calling',
  heroSubline = 'Our finest ski and mountain properties for the season ahead',
  introText = 'Every winter, the Alps remind us why so many people dream of owning a piece of mountain life. Whether you\'re a seasoned skier or simply love the stillness of a snow-covered village, co-ownership offers a way to make that dream a permanent reality — not just a holiday.',
  properties = sampleProperties,
  unsubscribeUrl = '#',
}: SeasonalSpotlightProps) {

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
        `}</style>
      </Head>

      <Preview>{heroHeadline} — {season} properties from Co-Ownership Property.</Preview>

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

        {/* ── HERO INTRO BAND ── */}
        <Section style={heroBand}>
          <Container style={wrap}>
            <Section style={{ padding: '56px 0 48px' }}>
              <Text style={seasonLabel}>{season}</Text>
              <Heading style={heroHeadingStyle}>{heroHeadline}</Heading>
              <Hr style={goldBar} />
              <Text style={heroSublineStyle}>{heroSubline}</Text>
              <Text style={introBodyText}>{introText}</Text>
            </Section>
          </Container>
        </Section>

        {/* ── PROPERTIES ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '44px 0 8px' }}>

              <Text style={eyebrow}>{theme} Properties</Text>
              <Hr style={goldBar} />

              {properties.map((p, i) => (
                <Section key={i} style={hCard}>
                  <Row>
                    {/* Image column */}
                    <Column style={hCardImgCol}>
                      <Link href={`${base}/property/${p.slug}`} style={{ display: 'block', position: 'relative' as const }}>
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
                      {p.highlight && (
                        <Text style={highlightPill}>{p.highlight}</Text>
                      )}
                    </Column>
                    {/* Content column */}
                    <Column style={hCardContent}>
                      <Text style={hCardLocation}>{p.location}</Text>
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

        {/* ── QUOTE BAND ── */}
        <Section style={quoteBand}>
          <Container style={wrap}>
            <Section style={{ padding: '52px 0' }}>
              <Text style={quoteText}>
                "The best time to buy is before the season peaks."
              </Text>
              <Hr style={goldBarCenter} />
              <Text style={quoteSource}>
                Properties in peak destinations are moving fast.
              </Text>
            </Section>
          </Container>
        </Section>

        {/* ── CTA ── */}
        <Section style={{ backgroundColor: C.cream, padding: '48px 0 64px' }}>
          <Container style={wrap}>
            <Section style={{ textAlign: 'center' as const }}>
              <Button href={`${base}/our-homes/`} style={ctaBtn}>
                Explore All {theme} Properties
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
  fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '0 32px',
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

// Hero band
const heroBand: React.CSSProperties = {
  backgroundColor: C.cream,
  borderBottom: `1px solid ${C.border}`,
};

const seasonLabel: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.24em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 14px',
};

const heroHeadingStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 36,
  fontWeight: 400,
  fontStyle: 'italic',
  color: C.navy,
  margin: '0 0 20px',
  lineHeight: '1.3',
};

const goldBar: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 2,
  width: 40,
  margin: '0 0 20px',
};

const heroSublineStyle: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 15,
  color: C.navy60,
  lineHeight: '1.7',
  margin: '0 0 16px',
};

const introBodyText: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 15,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: 0,
};

const eyebrow: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 10px',
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

const highlightPill: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: C.navy,
  backgroundColor: C.gold,
  padding: '3px 8px',
  margin: 0,
  display: 'inline-block',
  position: 'absolute' as const,
  top: 8,
  left: 8,
};

const hCardContent: React.CSSProperties = {
  padding: '16px 20px',
  verticalAlign: 'top',
};

const hCardLocation: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 8,
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
  fontSize: 10,
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
  fontSize: 8,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  textDecoration: 'underline',
};

// Quote band
const quoteBand: React.CSSProperties = {
  backgroundColor: C.navy,
};

const quoteText: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 22,
  fontWeight: 400,
  fontStyle: 'italic',
  color: C.white,
  textAlign: 'center' as const,
  margin: '0 0 24px',
  lineHeight: '1.5',
};

const goldBarCenter: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 1,
  width: 40,
  margin: '0 auto 20px',
};

const quoteSource: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 12,
  color: 'rgba(255,255,255,0.4)',
  textAlign: 'center' as const,
  margin: 0,
};

// CTA
const ctaBtn: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
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
  fontSize: 15,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 4px',
};

const signOffSite: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 11,
  color: C.navy60,
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
