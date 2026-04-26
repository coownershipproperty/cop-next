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
  /** Used as email subject line: "David, this week's Editor's Pick is stunning" */
  subjectLine?: string;
  /** Editor's Pick — the hero property */
  pick?: Property & { editorNote?: string };
  /** Supporting properties shown below the hero */
  properties?: Property[];
  /** Founder's first name shown in the sign-off */
  founderName?: string;
  /** Founder's title/credentials shown under name */
  founderTitle?: string;
  /** Public URL to a headshot photo (square, at least 120×120) */
  founderPhotoUrl?: string;
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

const base = 'https://co-ownershipproperty.com';

// ── Sample / preview data ─────────────────────────────────────────────────────
const samplePick: NonNullable<NewsletterEmailProps['pick']> = {
  title: 'Luberon, Provence, France — 4-Bed Mas With Vineyard Views',
  price: '€247,500',
  beds: 4,
  size: 280,
  imageUrl: 'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=85',
  slug: 'luberon-provence-4-bed-mas-vineyard',
  editorNote:
    "I've been watching the Luberon market for nearly three decades, and properties like this are becoming genuinely rare. The vineyard views, the original stone walls, the light in those rooms in the afternoon — this is the kind of home that people buy and never want to leave. At a quarter-share, you're in for a fraction of what it would cost to own outright. I'd move quickly on this one.",
};

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
    title: 'Siena, Tuscany, Italy — 2-Bed Hilltop Retreat With Views',
    price: '€97,000',
    beds: 2,
    size: 140,
    imageUrl: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=600&q=80',
    slug: 'siena-tuscany-2-bed-hilltop-retreat',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function NewsletterEmail({
  firstName = 'David',
  pick = samplePick,
  properties = sampleProperties,
  founderName = 'Jonathan',
  founderTitle = '28 years in European property',
  founderPhotoUrl = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&q=80',
}: NewsletterEmailProps) {

  const previewText = `${firstName}, this week's Editor's Pick is one I'm particularly excited about.`;

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
        `}</style>
      </Head>

      {/* Subject line personalisation: shown in inbox preview */}
      <Preview>{previewText}</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Text style={wordmark}>Co-Ownership Property</Text>
            <Section style={goldRuleHeader} />
          </Container>
        </Section>

        {/* ── PERSONAL NOTE FROM FOUNDER ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '52px 0 40px' }}>

              <Text style={eyebrow}>A Personal Note</Text>

              {/* Founder row */}
              <Row style={{ marginBottom: 20 }}>
                <Column style={{ width: 64, verticalAlign: 'top', paddingRight: 18 }}>
                  <Img
                    src={founderPhotoUrl}
                    alt={founderName}
                    width="56"
                    height="56"
                    style={founderPhoto}
                  />
                </Column>
                <Column style={{ verticalAlign: 'middle' }}>
                  <Text style={founderNameStyle}>
                    {founderName}
                  </Text>
                  <Text style={founderTitleStyle}>{founderTitle}</Text>
                </Column>
              </Row>

              <Text style={greetBody}>Dear {firstName},</Text>
              <Text style={greetBody}>
                Every week I look through what's come to market and pick the one property I'd personally recommend. This week's selection is a home I find genuinely special — and I wanted to write to you about it directly.
              </Text>
              <Text style={greetBody}>
                Below you'll find my Editor's Pick, plus a couple of other listings that caught my eye. As always, reply to this email if anything catches your attention — I'm always happy to talk it through.
              </Text>
              <Text style={{ ...greetBody, fontStyle: 'italic', marginTop: 4 }}>
                — {founderName}
              </Text>

            </Section>
          </Container>
        </Section>

        {/* ── EDITOR'S PICK ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 8 }}>
          <Container style={wrap}>

            <Text style={eyebrow}>Editor's Pick This Week</Text>
            <Heading style={heroHeading}>
              This Week, I'm Particularly Excited About&nbsp;This One
            </Heading>
            <Hr style={goldBar} />

            <Section style={heroPick}>

              {/* Hero image — taller than regular cards */}
              <Link href={`${base}/property/${pick.slug}`}>
                <Img
                  src={pick.imageUrl}
                  alt={pick.title}
                  width="536"
                  style={heroImg}
                />
              </Link>

              <Section style={heroBody}>

                {/* Pick badge */}
                <Text style={pickBadge}>⭐ Editor's Pick</Text>

                {/* Title */}
                <Heading style={heroTitle}>{pick.title}</Heading>

                {/* Stats */}
                <Text style={cardStats}>
                  🛏&ensp;{pick.beds} BEDS&emsp;|&emsp;{pick.size} M²
                </Text>

                {/* Editor's personal note */}
                {pick.editorNote && (
                  <Section style={quoteBlock}>
                    <Text style={quoteText}>"{pick.editorNote}"</Text>
                    <Text style={quoteAttrib}>— {founderName}</Text>
                  </Section>
                )}

                <Hr style={cardDivider} />

                {/* Price + CTA */}
                <Row>
                  <Column style={{ verticalAlign: 'middle' }}>
                    <Text style={heroPrice}>{pick.price}</Text>
                  </Column>
                  <Column style={{ verticalAlign: 'middle', textAlign: 'right' as const }}>
                    <Button href={`${base}/property/${pick.slug}`} style={pickCta}>
                      VIEW PROPERTY →
                    </Button>
                  </Column>
                </Row>

              </Section>
            </Section>

          </Container>
        </Section>

        {/* ── MORE LISTINGS ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 16, paddingTop: 40 }}>
          <Container style={wrap}>
            <Text style={eyebrow}>Also This Week</Text>
            <Heading style={sectionHeading}>MORE PROPERTIES TO EXPLORE</Heading>
            <Hr style={goldBar} />

            {properties.map((p, i) => (
              <Section key={i} style={card}>
                <Link href={`${base}/property/${p.slug}`}>
                  <Img src={p.imageUrl} alt={p.title} width="552" style={cardImg} />
                </Link>
                <Section style={cardContent}>
                  <Heading style={cardTitle}>{p.title}</Heading>
                  <Text style={cardStats}>🛏&ensp;{p.beds} BEDS&emsp;|&emsp;{p.size} M²</Text>
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

        {/* ── BROWSE ALL ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 64 }}>
          <Container style={wrap}>
            <Section style={ctaBlock}>
              <Text style={ctaCount}>333</Text>
              <Text style={ctaCountLabel}>PROPERTIES AVAILABLE</Text>
              <Text style={ctaBody}>
                Browse our curated collection of fractional ownership opportunities across the world's most desirable destinations.
              </Text>
              <Button href={`${base}/our-homes`} style={ctaBtn}>BROWSE ALL →</Button>
            </Section>
          </Container>
        </Section>

        {/* ── HOW IT WORKS ── */}
        <Section style={{ backgroundColor: C.navy, padding: '56px 0' }}>
          <Container style={wrap}>
            <Text style={{ ...eyebrow, color: 'rgba(201,168,76,0.8)', textAlign: 'center' as const }}>Simple &amp; Transparent</Text>
            <Heading style={{ ...sectionHeading, color: C.white, textAlign: 'center' as const }}>HOW CO-OWNERSHIP WORKS</Heading>
            <Hr style={{ ...goldBar, margin: '0 auto 40px' }} />
            <Row>
              {[
                { n: '01', t: 'Buy a Share', b: 'Own 1/8 to 1/2 of a premium property — for a fraction of the full purchase price.' },
                { n: '02', t: 'Use & Enjoy', b: 'Enjoy your home for weeks per year proportional to your share, fully managed.' },
                { n: '03', t: 'Build Equity', b: 'Benefit from property appreciation. Sell your share whenever you choose.' },
              ].map(({ n, t, b }) => (
                <Column key={n} style={howCol}>
                  <Text style={howNum}>{n}</Text>
                  <Text style={howTitle}>{t}</Text>
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
              <Link href={`${base}`} style={footLink}>Website</Link>{'  ·  '}
              <Link href={`${base}/our-homes`} style={footLink}>Our Homes</Link>{'  ·  '}
              <Link href={`${base}/how-it-works`} style={footLink}>How It Works</Link>{'  ·  '}
              <Link href={`${base}/all-our-blog`} style={footLink}>Blog</Link>
            </Text>
            <Hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />
            <Text style={footFine}>
              You're receiving this because you enquired about a co-ownership property.
            </Text>
            <Text style={footFine}>
              <Link href="{{unsubscribe_url}}" style={{ color: C.gold, textDecoration: 'none' }}>Unsubscribe</Link>
              {'  ·  info@co-ownershipproperty.com'}
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
  margin: 0, padding: 0,
  fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '0 32px',
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

const eyebrow: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
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

// Founder
const founderPhoto: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: '50%',
  objectFit: 'cover' as const,
  display: 'block',
  border: `2px solid ${C.gold}`,
};

const founderNameStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 16,
  fontWeight: 700,
  color: C.navy,
  margin: '0 0 2px',
};

const founderTitleStyle: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 11,
  color: C.navy60,
  letterSpacing: '0.08em',
  margin: 0,
};

const greetBody: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 15,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 12px',
};

// Hero pick
const heroHeading: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 28,
  fontWeight: 400,
  fontStyle: 'italic',
  color: C.navy,
  margin: '0 0 16px',
  lineHeight: '1.35',
};

const heroPick: React.CSSProperties = {
  backgroundColor: C.white,
  overflow: 'hidden',
  marginBottom: 8,
};

const heroImg: React.CSSProperties = {
  width: '100%',
  height: 360,
  objectFit: 'cover' as const,
  display: 'block',
};

const heroBody: React.CSSProperties = {
  padding: '24px 28px 28px',
};

const pickBadge: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 12px',
};

const heroTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 22,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 14px',
  lineHeight: '1.4',
};

const quoteBlock: React.CSSProperties = {
  borderLeft: `3px solid ${C.gold}`,
  paddingLeft: 20,
  margin: '20px 0',
};

const quoteText: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 15,
  fontStyle: 'italic',
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 8px',
};

const quoteAttrib: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.1em',
  color: C.gold,
  margin: 0,
};

const heroPrice: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 28,
  fontWeight: 400,
  color: C.navy,
  margin: '8px 0 0',
};

const pickCta: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  backgroundColor: C.gold,
  color: C.white,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  padding: '12px 24px',
  textDecoration: 'none',
  display: 'inline-block',
};

// Section headings
const sectionHeading: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 22,
  fontWeight: 400,
  letterSpacing: '0.14em',
  color: C.navy,
  margin: '0 0 12px',
  lineHeight: '1.2',
};

// Regular cards
const card: React.CSSProperties = {
  backgroundColor: C.white,
  marginBottom: 20,
  overflow: 'hidden',
};

const cardImg: React.CSSProperties = {
  width: '100%',
  height: 260,
  objectFit: 'cover' as const,
  display: 'block',
};

const cardContent: React.CSSProperties = {
  padding: '20px 28px 24px',
};

const cardTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 17,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 12px',
  lineHeight: '1.45',
};

const cardStats: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
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
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 22,
  fontWeight: 400,
  color: C.navy,
  margin: 0,
};

const viewProp: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  textDecoration: 'none',
};

// Browse all
const ctaBlock: React.CSSProperties = {
  backgroundColor: C.navy,
  textAlign: 'center' as const,
  padding: '48px 40px',
};

const ctaCount: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 64,
  fontWeight: 700,
  color: C.white,
  margin: '0 0 4px',
  lineHeight: '1',
};

const ctaCountLabel: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 20px',
};

const ctaBody: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 14,
  color: 'rgba(255,255,255,0.65)',
  lineHeight: '1.7',
  margin: '0 0 28px',
};

const ctaBtn: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
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
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 40,
  fontWeight: 700,
  color: C.gold,
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const howTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 16,
  fontWeight: 700,
  color: C.white,
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const howBody: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  color: 'rgba(255,255,255,0.55)',
  lineHeight: '1.7',
  margin: 0,
  textAlign: 'center' as const,
};

const howBtn: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
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
