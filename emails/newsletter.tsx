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

interface Property {
  title: string;
  price: string;
  beds: number;
  size: number;
  imageUrl: string;
  slug: string;
}

interface NewsletterEmailProps {
  firstName?: string;
  previewText?: string;
  introText?: string;
  properties?: Property[];
}

const C = {
  navy:    '#2C4A5E',
  navy60:  '#6B8A9E',
  gold:    '#C9A84C',
  cream:   '#F5F2EC',
  white:   '#FFFFFF',
  border:  '#E8E3DC',
};

const base = 'https://co-ownershipproperty.com';

const sampleProperties: Property[] = [
  {
    title: 'Callao Salvaje, Tenerife, Spain — 2-Bed Apartment With Infinity Pool',
    price: '€199,000',
    beds: 2,
    size: 95,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
    slug: 'callao-salvaje-tenerife-2-bed-apartment',
  },
  {
    title: 'Luberon, Provence, France — 3-Bed Stone Farmhouse With Pool',
    price: '€122,500',
    beds: 3,
    size: 210,
    imageUrl: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=600&q=80',
    slug: 'luberon-provence-3-bed-stone-farmhouse',
  },
  {
    title: 'Siena, Tuscany, Italy — 2-Bed Hilltop Retreat With Views',
    price: '€97,000',
    beds: 2,
    size: 140,
    imageUrl: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=600&q=80',
    slug: 'siena-tuscany-2-bed-hilltop-retreat',
  },
];

export default function NewsletterEmail({
  firstName = 'David',
  previewText = 'New co-ownership properties handpicked for you this week.',
  introText = "We've handpicked a few stunning new listings this week — each a beautifully designed home in a sought-after European destination, available as a fractional co-ownership share.",
  properties = sampleProperties,
}: NewsletterEmailProps) {
  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Nunito+Sans:wght@300;400;600;700&display=swap');
        `}</style>
      </Head>
      <Preview>{previewText}</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Text style={headerLogo}>Co-Ownership Property</Text>
            <Text style={headerSub}>Your European Dream Home, Shared Smartly</Text>
          </Container>
        </Section>

        {/* ── GOLD LINE ── */}
        <Section style={{ backgroundColor: C.gold, padding: '0', margin: '0', lineHeight: '3px', fontSize: '3px', height: '3px' }}>
          <Text style={{ margin: 0, padding: 0, fontSize: 1 }}> </Text>
        </Section>

        {/* ── GREETING ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '56px 0 16px' }}>
              <Text style={greetLabel}>A Note From Co-Ownership Property</Text>
              <Heading style={greetHeading}>
                New Properties,<br/>Handpicked For You
              </Heading>
              <Hr style={goldBar} />
              <Text style={greetBody}>
                Dear {firstName},
              </Text>
              <Text style={greetBody}>
                {introText}
              </Text>
            </Section>
          </Container>
        </Section>

        {/* ── SECTION HEADER ── */}
        <Section style={{ backgroundColor: C.cream, paddingTop: 32, paddingBottom: 8 }}>
          <Container style={wrap}>
            <Text style={sectionEyebrow}>This Week's Selection</Text>
            <Heading style={sectionHeading}>EXPLORE OUR PROPERTIES</Heading>
            <Hr style={goldBar} />
          </Container>
        </Section>

        {/* ── PROPERTY CARDS ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 16 }}>
          <Container style={wrap}>

            {properties.map((p, i) => (
              <Section key={i} style={card}>
                {/* Image */}
                <Link href={`${base}/property/${p.slug}`}>
                  <Img
                    src={p.imageUrl}
                    alt={p.title}
                    width="552"
                    style={cardImg}
                  />
                </Link>

                {/* Card content */}
                <Section style={cardContent}>
                  <Heading style={cardTitle}>{p.title}</Heading>

                  {/* Stats */}
                  <Row>
                    <Column>
                      <Text style={cardStats}>
                        🛏&ensp;{p.beds} BEDS&emsp;|&emsp;{p.size} M²
                      </Text>
                    </Column>
                  </Row>

                  {/* Divider + price row */}
                  <Hr style={cardDivider} />
                  <Row>
                    <Column style={{ verticalAlign: 'middle' }}>
                      <Text style={cardPrice}>{p.price}</Text>
                    </Column>
                    <Column style={{ verticalAlign: 'middle', textAlign: 'right' as const }}>
                      <Link href={`${base}/property/${p.slug}`} style={viewProp}>
                        VIEW PROPERTY →
                      </Link>
                    </Column>
                  </Row>
                </Section>
              </Section>
            ))}

          </Container>
        </Section>

        {/* ── BROWSE ALL CTA ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 64 }}>
          <Container style={wrap}>
            <Section style={ctaBlock}>
              <Text style={ctaCount}>333</Text>
              <Text style={ctaCountLabel}>PROPERTIES AVAILABLE</Text>
              <Text style={ctaBody}>
                Browse our curated collection of fractional ownership opportunities across the world's most desirable destinations.
              </Text>
              <Button href={`${base}/our-homes`} style={ctaBtn}>
                BROWSE ALL →
              </Button>
            </Section>
          </Container>
        </Section>

        {/* ── HOW IT WORKS ── */}
        <Section style={{ backgroundColor: C.navy, padding: '56px 0' }}>
          <Container style={wrap}>
            <Text style={{ ...sectionEyebrow, color: 'rgba(201,168,76,0.8)', textAlign: 'center' as const }}>
              Simple &amp; Transparent
            </Text>
            <Heading style={{ ...sectionHeading, color: C.white, textAlign: 'center' as const }}>
              HOW CO-OWNERSHIP WORKS
            </Heading>
            <Hr style={{ ...goldBar, margin: '0 auto 40px' }} />

            <Row>
              {[
                { n: '01', title: 'Buy a Share', body: 'Own 1/8 to 1/2 of a premium property — for a fraction of the full purchase price.' },
                { n: '02', title: 'Use &amp; Enjoy', body: 'Enjoy your home for weeks per year proportional to your share, fully managed.' },
                { n: '03', title: 'Build Equity', body: 'Benefit from property appreciation. Sell your share whenever you choose.' },
              ].map(({ n, title, body: b }) => (
                <Column key={n} style={howCol}>
                  <Text style={howNum}>{n}</Text>
                  <Text style={howTitle}>{title}</Text>
                  <Text style={howBody}>{b}</Text>
                </Column>
              ))}
            </Row>

            <Section style={{ textAlign: 'center' as const, marginTop: 36 }}>
              <Button href={`${base}/how-it-works`} style={howBtn}>LEARN MORE →</Button>
            </Section>
          </Container>
        </Section>

        {/* ── FOOTER ── */}
        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <Text style={footLinks}>
              <Link href={`${base}`} style={footLink}>Website</Link>
              {'  ·  '}
              <Link href={`${base}/our-homes`} style={footLink}>Our Homes</Link>
              {'  ·  '}
              <Link href={`${base}/how-it-works`} style={footLink}>How It Works</Link>
              {'  ·  '}
              <Link href={`${base}/all-our-blog`} style={footLink}>Blog</Link>
            </Text>
            <Hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />
            <Text style={footFine}>
              You're receiving this because you enquired about a co-ownership property.
            </Text>
            <Text style={footFine}>
              <Link href="{{unsubscribe_url}}" style={{ color: C.gold, textDecoration: 'none' }}>
                Unsubscribe
              </Link>
              {'  ·  info@co-ownershipproperty.com'}
            </Text>
          </Container>
        </Section>

      </Body>
    </Html>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

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

// Header
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

// Greeting
const greetLabel: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 14px',
};

const greetHeading: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 34,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 16px',
  lineHeight: '1.3',
};

const goldBar: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 2,
  width: 40,
  margin: '0 0 24px',
};

const greetBody: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 15,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 12px',
};

// Section headings
const sectionEyebrow: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 10px',
};

const sectionHeading: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 24,
  fontWeight: 700,
  letterSpacing: '0.14em',
  color: C.navy,
  margin: '0 0 12px',
  lineHeight: '1.2',
};

// Property card — mirrors the site's prop-card exactly
const card: React.CSSProperties = {
  backgroundColor: C.white,
  marginBottom: 24,
  overflow: 'hidden',
};

const cardImg: React.CSSProperties = {
  width: '100%',
  height: 300,
  objectFit: 'cover' as const,
  display: 'block',
};

const cardContent: React.CSSProperties = {
  padding: '20px 28px 24px',
};

const cardTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 18,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 14px',
  lineHeight: '1.45',
};

const cardStats: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  color: C.navy60,
  margin: '0 0 2px',
};

const cardDivider: React.CSSProperties = {
  borderColor: 'rgba(201,168,76,0.2)',
  margin: '14px 0 12px',
};

const cardPrice: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 24,
  fontWeight: 400,
  color: C.navy,
  margin: 0,
};

const viewProp: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  textDecoration: 'none',
};

// Browse all block
const ctaBlock: React.CSSProperties = {
  backgroundColor: C.navy,
  textAlign: 'center' as const,
  padding: '48px 40px',
};

const ctaCount: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 64,
  fontWeight: 700,
  color: C.white,
  margin: '0 0 4px',
  lineHeight: '1',
};

const ctaCountLabel: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 20px',
};

const ctaBody: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 14,
  color: 'rgba(255,255,255,0.65)',
  lineHeight: '1.7',
  margin: '0 0 28px',
};

const ctaBtn: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  backgroundColor: C.gold,
  color: C.white,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.18em',
  padding: '14px 40px',
  textDecoration: 'none',
  display: 'inline-block',
};

// How it works
const howCol: React.CSSProperties = {
  width: '33%',
  padding: '0 12px',
  textAlign: 'center' as const,
  verticalAlign: 'top',
};

const howNum: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 40,
  fontWeight: 700,
  color: C.gold,
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const howTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 16,
  fontWeight: 700,
  color: C.white,
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const howBody: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 13,
  color: 'rgba(255,255,255,0.55)',
  lineHeight: '1.7',
  margin: 0,
  textAlign: 'center' as const,
};

const howBtn: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  backgroundColor: 'transparent',
  color: C.white,
  border: '1px solid rgba(255,255,255,0.3)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  padding: '13px 36px',
  textDecoration: 'none',
  display: 'inline-block',
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
