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
  /** Full title as on the website, e.g. "Callao Salvaje, Tenerife, Spain — 2-Bed Villa" */
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
  introHeading?: string;
  introText?: string;
  properties?: Property[];
}

// ── Design tokens — exact match to globals.css ────────────────────────────────
const C = {
  navy:       '#2C4A5E',
  navy80:     '#4A6A7E',
  navy60:     '#6B8A9E',
  gold:       '#C9A84C',
  cream:      '#F5F2EC',
  white:      '#FFFFFF',
  border:     '#DDD9D4',
  goldBorder: 'rgba(201,168,76,0.18)',
};

// ── Sample data for preview ───────────────────────────────────────────────────
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

// ── Bed icon (inline SVG as base64 image workaround — use text instead) ───────
const BedSvg = () => (
  <Text style={{ margin: 0, display: 'inline', fontSize: 12, color: C.navy60 }}>🛏</Text>
);

// ── Component ─────────────────────────────────────────────────────────────────
export default function NewsletterEmail({
  firstName = 'there',
  previewText = 'New co-ownership properties handpicked for you this week.',
  introHeading = 'New Properties, Handpicked For You',
  introText = "We've selected a few stunning new listings this week — each a beautifully designed home in a sought-after location, available as a fractional co-ownership share.",
  properties = sampleProperties,
}: NewsletterEmailProps) {

  const base = 'https://co-ownershipproperty.com';

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Nunito+Sans:wght@400;600;700&display=swap');
        `}</style>
      </Head>
      <Preview>{previewText}</Preview>

      <Body style={body}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <Section style={headerWrap}>
          <Container style={container}>
            <Text style={logoText}>Co-Ownership Property</Text>
            <Text style={logoSub}>Your European Dream Home, Shared Smartly</Text>
          </Container>
        </Section>

        {/* ── Gold rule ──────────────────────────────────────────────── */}
        <Section style={goldRule}>
          <Text style={{ margin: 0, fontSize: 1, lineHeight: '3px' }}>&nbsp;</Text>
        </Section>

        {/* ── Intro ──────────────────────────────────────────────────── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={container}>
            <Section style={{ padding: '52px 0 40px' }}>
              <Text style={eyebrow}>Hello, {firstName}</Text>
              <Heading style={sectionTitle}>{introHeading.toUpperCase()}</Heading>
              <Hr style={titleRule} />
              <Text style={introBodyText}>{introText}</Text>
            </Section>
          </Container>
        </Section>

        {/* ── Properties section ─────────────────────────────────────── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 8 }}>
          <Container style={container}>

            {properties.map((p, i) => (
              <Section key={i} style={card}>

                {/* Photo */}
                <Link href={`${base}/property/${p.slug}`} style={{ display: 'block' }}>
                  <Img
                    src={p.imageUrl}
                    alt={p.title}
                    width="552"
                    style={cardPhoto}
                  />
                </Link>

                {/* Body */}
                <Section style={cardBody}>
                  {/* Title */}
                  <Heading style={cardTitle}>{p.title}</Heading>

                  {/* Stats */}
                  <Row style={{ marginBottom: 0, marginTop: 0 }}>
                    <Column style={{ width: 'auto', paddingRight: 16 }}>
                      <Text style={stat}>🛏&ensp;{p.beds} BED{p.beds !== 1 ? 'S' : ''}</Text>
                    </Column>
                    <Column style={{ paddingLeft: 12, borderLeft: `1px solid ${C.border}` }}>
                      <Text style={stat}>▪&ensp;{p.size} M²</Text>
                    </Column>
                  </Row>

                  {/* Price */}
                  <Text style={price}>{p.price}</Text>

                  {/* View link */}
                  <Link href={`${base}/property/${p.slug}`} style={viewLink}>
                    VIEW PROPERTY →
                  </Link>
                </Section>

              </Section>
            ))}

          </Container>
        </Section>

        {/* ── Browse all ─────────────────────────────────────────────── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 60 }}>
          <Container style={container}>
            <Section style={{ textAlign: 'center' as const, padding: '32px 0 0' }}>
              <Heading style={{ ...sectionTitle, textAlign: 'center' as const }}>
                EXPLORE OUR PROPERTIES
              </Heading>
              <Hr style={{ ...titleRule, margin: '10px auto 20px' }} />
              <Text style={{ ...introBodyText, textAlign: 'center' as const }}>
                Browse our curated collection of fractional ownership opportunities across the world's most desirable destinations.
              </Text>
              <Button href={`${base}/our-homes`} style={browseBtn}>
                BROWSE ALL PROPERTIES →
              </Button>
            </Section>
          </Container>
        </Section>

        {/* ── How it works ───────────────────────────────────────────── */}
        <Section style={{ backgroundColor: C.navy, padding: '52px 0' }}>
          <Container style={container}>
            <Heading style={{ ...sectionTitle, color: C.white, textAlign: 'center' as const }}>
              HOW CO-OWNERSHIP WORKS
            </Heading>
            <Hr style={{ ...titleRule, borderColor: C.gold, margin: '10px auto 32px' }} />

            <Row>
              <Column style={howCol}>
                <Text style={howNum}>01</Text>
                <Text style={howTitle}>Buy a Share</Text>
                <Text style={howText}>
                  Own 1/8 to 1/2 of a premium home for a fraction of the full purchase price.
                </Text>
              </Column>
              <Column style={howCol}>
                <Text style={howNum}>02</Text>
                <Text style={howTitle}>Enjoy Your Time</Text>
                <Text style={howText}>
                  Use your property for weeks per year proportional to your ownership share.
                </Text>
              </Column>
              <Column style={howCol}>
                <Text style={howNum}>03</Text>
                <Text style={howTitle}>Build Equity</Text>
                <Text style={howText}>
                  Benefit from property appreciation with fully managed, hassle-free ownership.
                </Text>
              </Column>
            </Row>

            <Section style={{ textAlign: 'center' as const, marginTop: 32 }}>
              <Button href={`${base}/how-it-works`} style={outlineBtn}>
                LEARN MORE →
              </Button>
            </Section>
          </Container>
        </Section>

        {/* ── Footer ─────────────────────────────────────────────────── */}
        <Section style={footerWrap}>
          <Container style={container}>
            <Text style={footerLogo}>Co-Ownership Property</Text>
            <Text style={footerLinks}>
              <Link href={`${base}`} style={footerLink}>Website</Link>
              {'  ·  '}
              <Link href={`${base}/our-homes`} style={footerLink}>Our Homes</Link>
              {'  ·  '}
              <Link href={`${base}/how-it-works`} style={footerLink}>How It Works</Link>
              {'  ·  '}
              <Link href={`${base}/all-our-blog`} style={footerLink}>Blog</Link>
            </Text>
            <Hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />
            <Text style={footerFine}>
              You're receiving this because you enquired about a co-ownership property.
            </Text>
            <Text style={footerFine}>
              <Link href="{{unsubscribe_url}}" style={{ color: C.gold, textDecoration: 'none' }}>
                Unsubscribe
              </Link>
              {'  ·  '}
              info@co-ownershipproperty.com
            </Text>
          </Container>
        </Section>

      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const body: React.CSSProperties = {
  backgroundColor: C.cream,
  margin: 0,
  padding: 0,
  fontFamily: "'Nunito Sans', 'Helvetica Neue', Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '0 24px',
};

/* Header */
const headerWrap: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '30px 0 26px',
};

const logoText: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  color: C.white,
  fontSize: 24,
  fontWeight: 700,
  textAlign: 'center' as const,
  letterSpacing: '0.03em',
  margin: 0,
};

const logoSub: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  color: C.gold,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '8px 0 0',
};

const goldRule: React.CSSProperties = {
  backgroundColor: C.gold,
  height: 3,
  lineHeight: '3px',
  fontSize: 1,
};

/* Section heading — matches "EXPLORE OUR PROPERTIES" on site */
const sectionTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 26,
  fontWeight: 700,
  letterSpacing: '0.12em',
  color: C.navy,
  textAlign: 'left' as const,
  margin: '0 0 6px',
  lineHeight: '1.25',
};

const titleRule: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 2,
  width: 48,
  margin: '0 0 20px',
};

const eyebrow: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 10px',
};

const introBodyText: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 15,
  color: C.navy80,
  lineHeight: '1.75',
  margin: 0,
};

/* Property card — mirrors prop-card on site */
const card: React.CSSProperties = {
  backgroundColor: C.white,
  border: `1px solid ${C.border}`,
  marginBottom: 20,
  overflow: 'hidden',
};

const cardPhoto: React.CSSProperties = {
  width: '100%',
  height: 280,
  objectFit: 'cover' as const,
  display: 'block',
};

const cardBody: React.CSSProperties = {
  padding: '16px 24px 20px',
};

/* Playfair title — same as prop-title */
const cardTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 17,
  fontWeight: 700,
  color: C.navy,
  margin: '0 0 10px',
  lineHeight: '1.45',
};

/* Uppercase muted stats — same as prop-stats / prop-stat */
const stat: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.13em',
  textTransform: 'uppercase' as const,
  color: C.navy60,
  margin: 0,
};

/* Playfair price — same as prop-price */
const price: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 22,
  color: C.navy,
  margin: '14px 0 0',
  paddingTop: 12,
  borderTop: `1px solid ${C.goldBorder}`,
};

/* "VIEW PROPERTY →" text link — same as prop-view-btn */
const viewLink: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.navy,
  textDecoration: 'none',
  display: 'block',
  marginTop: 12,
};

/* Browse all button — matches gold CTA on site */
const browseBtn: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  backgroundColor: C.navy,
  color: C.white,
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: '0.14em',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
  marginTop: 8,
};

/* Outline button for How It Works */
const outlineBtn: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  backgroundColor: 'transparent',
  color: C.white,
  border: `1px solid rgba(255,255,255,0.4)`,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.14em',
  padding: '12px 32px',
  textDecoration: 'none',
  display: 'inline-block',
};

/* How it works — navy bg */
const howCol: React.CSSProperties = {
  width: '33%',
  padding: '0 16px',
  textAlign: 'center' as const,
  verticalAlign: 'top',
};

const howNum: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 36,
  fontWeight: 700,
  color: C.gold,
  margin: '0 0 6px',
  textAlign: 'center' as const,
};

const howTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 15,
  fontWeight: 700,
  color: C.white,
  margin: '0 0 8px',
  textAlign: 'center' as const,
};

const howText: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 13,
  color: 'rgba(255,255,255,0.65)',
  lineHeight: '1.65',
  margin: 0,
  textAlign: 'center' as const,
};

/* Footer */
const footerWrap: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '36px 0 32px',
  borderTop: `3px solid ${C.gold}`,
};

const footerLogo: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  color: C.white,
  fontSize: 18,
  fontWeight: 700,
  textAlign: 'center' as const,
  margin: '0 0 16px',
  letterSpacing: '0.04em',
};

const footerLinks: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  textAlign: 'center' as const,
  margin: 0,
  fontSize: 12,
};

const footerLink: React.CSSProperties = {
  color: 'rgba(255,255,255,0.6)',
  textDecoration: 'none',
};

const footerFine: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  color: 'rgba(255,255,255,0.35)',
  fontSize: 11,
  textAlign: 'center' as const,
  margin: '4px 0 0',
  lineHeight: '1.7',
};
