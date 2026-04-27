import {
  Body, Button, Column, Container, Head, Heading, Hr,
  Html, Img, Link, Preview, Row, Section, Text,
} from '@react-email/components';
import * as React from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Property {
  slug: string;
  title: string;
  price: string;
  beds: number;
  size: number;
  imageUrl: string;
  location?: string;
}

interface PersonalisedNewsletterEmailProps {
  firstName?: string;
  /** Properties that exactly match the lead's preferred regions */
  primaryProperties?: Property[];
  /** Properties from lifestyle siblings / country fallback */
  fallbackProperties?: Property[];
  unsubscribeUrl?: string;
}

// ── Brand colours ──────────────────────────────────────────────────────────────
const C = {
  navy:   '#1E3448',
  navy60: '#6B8A9E',
  gold:   '#C9A84C',
  cream:  '#F7F4EE',
  white:  '#FFFFFF',
  border: '#E8E3DC',
};

const base = 'https://co-ownership-property.com';

// ── Sample / preview data ──────────────────────────────────────────────────────
const samplePrimary: Property[] = [
  {
    slug: 'ibiza-spain-3-bed-house-with-sea-views-3',
    title: 'Ibiza, Spain — 3-Bed House With Sea Views',
    price: '€260,000',
    beds: 3,
    size: 180,
    imageUrl: 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/ibiza-spain-3-bed-house-with-sea-views-3/hero.jpg',
    location: 'Ibiza, Spain',
  },
  {
    slug: 'mallorca-spain-3-bed-villa-with-pool',
    title: 'Mallorca, Spain — 3-Bed Villa With Pool',
    price: '€289,000',
    beds: 3,
    size: 200,
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&q=80',
    location: 'Mallorca, Spain',
  },
];

const sampleFallback: Property[] = [
  {
    slug: 'menorca-2-bed-apartment-sea-views',
    title: 'Menorca, Spain — 2-Bed Apartment With Sea Views',
    price: '€150,000',
    beds: 2,
    size: 95,
    imageUrl: 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=600&q=80',
    location: 'Menorca, Spain',
  },
];

// ── Component ──────────────────────────────────────────────────────────────────
export default function PersonalisedNewsletterEmail({
  firstName = 'there',
  primaryProperties = samplePrimary,
  fallbackProperties = sampleFallback,
  unsubscribeUrl = `${base}/unsubscribe`,
}: PersonalisedNewsletterEmailProps) {
  const allProps = [...primaryProperties, ...fallbackProperties];
  const hasFallback = fallbackProperties.length > 0;

  const destinations = [...new Set(primaryProperties.map(p => p.location?.split(',')[0]).filter(Boolean))];
  const destLabel = destinations.slice(0, 2).join(' & ');

  const previewText = `${firstName}, we've selected ${allProps.length} properties based on your interests${destLabel ? ` in ${destLabel}` : ''}.`;

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
          @media only screen and (max-width: 600px) {
            p  { font-size: 17px !important; line-height: 1.75 !important; }
            h1, h2, h3 { font-size: 22px !important; line-height: 1.35 !important; }
            img { max-width: 100% !important; height: auto !important; }
          }
        `}</style>
      </Head>
      <Preview>{previewText}</Preview>

      <Body style={body}>
        <Section style={header}>
          <Container style={wrap}>
            <Section style={goldRuleHeader} />
            <Text style={wordmark}>Co-Ownership Property</Text>
            <Section style={goldRuleHeader} />
          </Container>
        </Section>

        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '48px 0 36px' }}>
              <Text style={eyebrow}>Curated For You</Text>
              <Heading style={heroHeading}>
                {firstName !== 'there'
                  ? `${firstName}, here are your property picks`
                  : 'Your personalised property selection'}
              </Heading>
              <Hr style={goldBar} />
              <Text style={introBody}>
                Based on your interests, we've hand-picked the properties below from our
                current collection. Each one is available for fractional ownership — so
                you can own a share in a home you'll actually love.
              </Text>
              <Text style={{ ...introBody, marginTop: 0 }}>
                Reply to this email if anything catches your eye — we're always happy to talk it through.
              </Text>
            </Section>
          </Container>
        </Section>

        <Section style={{ backgroundColor: C.cream, paddingBottom: 8 }}>
          <Container style={wrap}>
            <Text style={eyebrow}>Selected For You</Text>
            <Heading style={sectionHeading}>
              {destLabel ? `PROPERTIES IN ${destLabel.toUpperCase()}` : 'YOUR PROPERTY PICKS'}
            </Heading>
            <Hr style={goldBar} />
            {primaryProperties.map((p, i) => (
              <Section key={i} style={card}>
                <Link href={`${base}/property/${p.slug}`}>
                  <Img src={p.imageUrl} alt={p.title} width="552" style={cardImg} />
                </Link>
                <Section style={cardContent}>
                  {p.location && <Text style={locationLabel}>{p.location}</Text>}
                  <Heading style={cardTitle}>{p.title}</Heading>
                  <Text style={cardStats}>
                    🛏&ensp;{p.beds} BEDS{p.size ? ` | ${p.size} M²` : ''}
                  </Text>
                  <Hr style={cardDivider} />
                  <Row>
                    <Column style={{ verticalAlign: 'middle' }}>
                      <Text style={cardPrice}>{p.price}</Text>
                    </Column>
                    <Column style={{ verticalAlign: 'middle', textAlign: 'right' as const }}>
                      <Link href={`${base}/property/${p.slug}`} style={viewProp}>VIEW PROPERTY →</Link>
                    </Column>
                  </Row>
                </Section>
              </Section>
            ))}
          </Container>
        </Section>

        {hasFallback && (
          <Section style={{ backgroundColor: C.cream, paddingTop: 32, paddingBottom: 8 }}>
            <Container style={wrap}>
              <Text style={eyebrow}>You Might Also Like</Text>
              <Heading style={sectionHeading}>MORE TO EXPLORE</Heading>
              <Hr style={goldBar} />
              {fallbackProperties.map((p, i) => (
                <Section key={i} style={card}>
                  <Link href={`${base}/property/${p.slug}`}>
                    <Img src={p.imageUrl} alt={p.title} width="552" style={cardImg} />
                  </Link>
                  <Section style={cardContent}>
                    {p.location && <Text style={locationLabel}>{p.location}</Text>}
                    <Heading style={cardTitle}>{p.title}</Heading>
                    <Text style={cardStats}>
                      🛏&ensp;{p.beds} BEDS{p.size ? ` | ${p.size} M²` : ''}
                    </Text>
                    <Hr style={cardDivider} />
                    <Row>
                      <Column style={{ verticalAlign: 'middle' }}>
                        <Text style={cardPrice}>{p.price}</Text>
                      </Column>
                      <Column style={{ verticalAlign: 'middle', textAlign: 'right' as const }}>
                        <Link href={`${base}/property/${p.slug}`} style={viewProp}>VIEW PROPERTY →</Link>
                      </Column>
                    </Row>
                  </Section>
                </Section>
              ))}
            </Container>
          </Section>
        )}

        <Section style={{ backgroundColor: C.cream, paddingBottom: 64, paddingTop: 24 }}>
          <Container style={wrap}>
            <Section style={ctaBlock}>
              <Text style={ctaBody}>Browse our full collection of fractional ownership opportunities across Europe, the USA, and beyond.</Text>
              <Button href={`${base}/our-homes`} style={ctaBtn}>BROWSE ALL PROPERTIES →</Button>
            </Section>
          </Container>
        </Section>

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
          </Container>
        </Section>

        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <Section style={footGoldRule} />
            <Text style={footLinks}>
              <Link href={`${base}`} style={footLink}>Website</Link>{' · '}
              <Link href={`${base}/our-homes`} style={footLink}>Our Homes</Link>{' · '}
              <Link href={`${base}/how-it-works`} style={footLink}>How It Works</Link>
            </Text>
            <Hr style={footDivider} />
            <Text style={footFine}>You're receiving this because you expressed interest in co-ownership property.</Text>
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
const body: React.CSSProperties = { backgroundColor: C.cream, margin: 0, padding: 0, fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 600, margin: '0 auto', padding: '0 20px' };
const header: React.CSSProperties = { backgroundColor: C.navy, padding: '52px 0 44px' };
const wordmark: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", color: C.white, fontSize: 26, fontWeight: 300, letterSpacing: '0.24em', textTransform: 'uppercase' as const, textAlign: 'center' as const, margin: '20px 0' };
const goldRuleHeader: React.CSSProperties = { backgroundColor: C.gold, height: 1, maxWidth: 56, margin: '0 auto' };
const eyebrow: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 10px' };
const goldBar: React.CSSProperties = { borderColor: C.gold, borderTopWidth: 2, width: 40, margin: '0 0 24px' };
const heroHeading: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 28, fontWeight: 400, fontStyle: 'italic', color: C.navy, margin: '0 0 16px', lineHeight: '1.35' };
const introBody: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 16, color: '#4A6070', lineHeight: '1.8', margin: '0 0 14px' };
const sectionHeading: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 400, letterSpacing: '0.14em', color: C.navy, margin: '0 0 12px', lineHeight: '1.2' };
const locationLabel: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 6px' };
const card: React.CSSProperties = { backgroundColor: C.white, marginBottom: 20, overflow: 'hidden' };
const cardImg: React.CSSProperties = { width: '100%', height: 260, objectFit: 'cover' as const, display: 'block' };
const cardContent: React.CSSProperties = { padding: '20px 28px 24px' };
const cardTitle: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 400, color: C.navy, margin: '0 0 12px', lineHeight: '1.45' };
const cardStats: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: C.navy60, margin: '0 0 2px' };
const cardDivider: React.CSSProperties = { borderColor: 'rgba(201,168,76,0.2)', margin: '14px 0 12px' };
const cardPrice: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 400, color: C.navy, margin: 0 };
const viewProp: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: C.gold, textDecoration: 'none' };
const ctaBlock: React.CSSProperties = { backgroundColor: C.navy, textAlign: 'center' as const, padding: '40px 24px' };
const ctaBody: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: '1.7', margin: '0 0 28px' };
const ctaBtn: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", backgroundColor: C.gold, color: C.white, fontSize: 13, fontWeight: 700, letterSpacing: '0.18em', padding: '14px 40px', textDecoration: 'none', display: 'inline-block' };
const howCol: React.CSSProperties = { width: '33%', padding: '0 12px', textAlign: 'center' as const, verticalAlign: 'top' };
const howNum: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 40, fontWeight: 700, color: C.gold, margin: '0 0 8px', textAlign: 'center' as const };
const howTitle: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 700, color: C.white, margin: '0 0 8px', textAlign: 'center' as const };
const howBody: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: '1.7', margin: 0, textAlign: 'center' as const };
const footer: React.CSSProperties = { backgroundColor: C.navy, padding: '56px 0 48px', borderTop: `2px solid ${C.gold}` };
const footLogo: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", color: C.white, fontSize: 22, fontWeight: 300, letterSpacing: '0.22em', textTransform: 'uppercase' as const, textAlign: 'center' as const, margin: '0 0 20px' };
const footGoldRule: React.CSSProperties = { backgroundColor: C.gold, height: 1, maxWidth: 40, margin: '0 auto 28px' };
const footLinks: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 11, fontWeight: 300, letterSpacing: '0.1em', textAlign: 'center' as const, margin: '0 0 4px', color: 'rgba(255,255,255,0.4)' };
const footLink: React.CSSProperties = { color: 'rgba(255,255,255,0.5)', textDecoration: 'none' };
const footDivider: React.CSSProperties = { borderColor: 'rgba(255,255,255,0.08)', margin: '28px 0' };
const footFine: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", color: 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 300, textAlign: 'center' as const, margin: '6px 0 0', lineHeight: '1.8', letterSpacing: '0.04em' };
