import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface KeyStat {
  value: string;
  label: string;
  trend?: 'up' | 'down' | 'stable';
}

interface ReportProperty {
  title: string;
  price: string;
  beds: number;
  size: number;
  location: string;
  slug: string;
}

interface DestinationMarketReportProps {
  firstName?: string;
  destination?: string;
  quarter?: string;
  overview?: string;
  keyStats?: KeyStat[];
  topProperties?: ReportProperty[];
  insight?: string;
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
const sampleStats: KeyStat[] = [
  { value: '€192k',  label: 'Avg share price',        trend: 'up' },
  { value: '94%',    label: 'Peak season occupancy',  trend: 'stable' },
  { value: '+11%',   label: 'YoY price growth',       trend: 'up' },
  { value: '6 wks',  label: 'Avg time to sell share', trend: 'down' },
];

const sampleProperties: ReportProperty[] = [
  {
    title: 'Santa Ponsa, Mallorca — 4-Bed Villa With Private Pool',
    price: '€185,000',
    beds: 4,
    size: 255,
    location: 'Santa Ponsa, Mallorca',
    slug: 'santa-ponsa-mallorca-4-bed-villa-private-pool',
  },
  {
    title: 'Alcudia, Mallorca — 3-Bed Townhouse Close to Beach',
    price: '€137,500',
    beds: 3,
    size: 168,
    location: 'Alcudia, Mallorca',
    slug: 'alcudia-mallorca-3-bed-townhouse-beach',
  },
];

// ── Trend indicator ───────────────────────────────────────────────────────────
function trendSymbol(trend?: KeyStat['trend']): string {
  if (trend === 'up')     return ' +';
  if (trend === 'down')   return ' -';
  return '';
}

function trendColor(trend?: KeyStat['trend']): string {
  if (trend === 'up')   return C.gold;
  if (trend === 'down') return C.navy60;
  return 'rgba(255,255,255,0.4)';
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function DestinationMarketReport({
  firstName = 'Sarah',
  destination = 'Mallorca',
  quarter = 'Q1 2025',
  overview = 'The Mallorca co-ownership market has continued to strengthen through the first quarter of 2025, with average share prices rising 11% year-on-year. Demand from northern European buyers remains robust, and the rental yield performance of co-owned properties continues to outperform the broader market. Supply of quality listings remains constrained.',
  keyStats = sampleStats,
  topProperties = sampleProperties,
  insight = 'The window of opportunity in Mallorca is narrowing. Three years ago, buyers were hesitating at prices we now consider entry-level. The fundamentals — climate, infrastructure, lifestyle, and a mature resale market — haven\'t changed. What has changed is the competition for the best properties. Waiting carries its own risk.',
  unsubscribeUrl = '#',
}: DestinationMarketReportProps) {

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
        `}</style>
      </Head>

      <Preview>{destination} Property Market — {quarter} Report from Co-Ownership Property.</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Text style={headerTagline}>Market Report</Text>
            <Text style={headerLogo}>Co-Ownership Property</Text>
          </Container>
        </Section>
        <Section style={goldStrip}>
          <Text style={{ margin: 0, padding: 0, fontSize: 1, lineHeight: '3px' }}> </Text>
        </Section>

        {/* ── REPORT INTRO ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '52px 0 8px' }}>

              <Text style={eyebrow}>{quarter} · {destination}</Text>
              <Heading style={mainHeading}>
                {destination} Property Market Update
              </Heading>
              <Hr style={goldBar} />

              <Text style={bodyText}>Hi {firstName},</Text>
              <Text style={bodyText}>{overview}</Text>

            </Section>
          </Container>
        </Section>

        {/* ── KEY STATS BAND ── */}
        <Section style={statsBand}>
          <Container style={wrap}>
            <Section style={{ padding: '40px 0' }}>
              <Row>
                {keyStats.map((stat, i) => (
                  <Column key={i} style={statCol}>
                    <Text style={statValue}>
                      {stat.value}
                      {stat.trend && (
                        <Text style={{ ...statTrend, color: trendColor(stat.trend), display: 'inline' }}>
                          {trendSymbol(stat.trend)}
                        </Text>
                      )}
                    </Text>
                    <Text style={statLabel}>{stat.label}</Text>
                  </Column>
                ))}
              </Row>
            </Section>
          </Container>
        </Section>

        {/* ── TOP PROPERTIES ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '44px 0 8px' }}>

              <Text style={eyebrow}>Top Properties Available Now</Text>
              <Hr style={goldBar} />

              {topProperties.map((p, i) => (
                <Section key={i} style={hCard}>
                  <Row>
                    <Column style={hCardImgCol}>
                      <Link href={`${base}/property/${p.slug}`} style={{ display: 'block' }}>
                        <Section style={hCardImgPlaceholder}> </Section>
                      </Link>
                    </Column>
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

        {/* ── INSIGHT BOX ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '8px 0 40px' }}>
              <Section style={insightBox}>
                <Text style={insightText}>"{insight}"</Text>
              </Section>
            </Section>
          </Container>
        </Section>

        {/* ── CTA ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 56 }}>
          <Container style={wrap}>
            <Section style={{ textAlign: 'center' as const }}>
              <Button href={`${base}/contact/`} style={ctaBtn}>
                Request a Full Report
              </Button>
            </Section>
          </Container>
        </Section>

        {/* ── SIGN-OFF ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 32 }}>
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

        {/* ── REPORT ATTRIBUTION ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 48 }}>
          <Container style={wrap}>
            <Text style={reportAttrib}>
              This report was sent because you've shown interest in {destination} properties.
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
  padding: '0 32px',
};

const header: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '28px 0 28px',
};

const headerTagline: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  color: C.gold,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '0 0 6px',
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

const eyebrow: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 10px',
};

const mainHeading: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 28,
  fontWeight: 700,
  color: C.navy,
  margin: '0 0 16px',
  lineHeight: '1.35',
};

const goldBar: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 2,
  width: 40,
  margin: '0 0 28px',
};

const bodyText: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 15,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 12px',
};

// Stats band
const statsBand: React.CSSProperties = {
  backgroundColor: C.navy,
};

const statCol: React.CSSProperties = {
  width: '25%',
  textAlign: 'center' as const,
  padding: '0 6px',
  verticalAlign: 'top',
};

const statValue: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 32,
  fontWeight: 400,
  color: C.gold,
  margin: '0 0 6px',
  lineHeight: '1',
};

const statTrend: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 14,
  fontWeight: 700,
};

const statLabel: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: C.white,
  margin: 0,
  lineHeight: '1.4',
};

// Horizontal property card
const hCard: React.CSSProperties = {
  border: `1px solid ${C.border}`,
  backgroundColor: C.white,
  marginBottom: 16,
  overflow: 'hidden',
};

const hCardImgCol: React.CSSProperties = {
  width: 160,
  verticalAlign: 'top',
};

const hCardImgPlaceholder: React.CSSProperties = {
  width: 160,
  height: 130,
  background: 'linear-gradient(150deg,#4A6A7E,#2C4A5E)',
  display: 'block',
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

// Insight box
const insightBox: React.CSSProperties = {
  backgroundColor: C.cream,
  borderLeft: `3px solid ${C.gold}`,
  padding: '20px 24px',
};

const insightText: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 15,
  fontStyle: 'italic',
  fontWeight: 400,
  color: '#4A6070',
  lineHeight: '1.8',
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

const reportAttrib: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 11,
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
