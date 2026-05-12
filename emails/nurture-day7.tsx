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
import { t } from '@/lib/i18n';

// ── Helpers ───────────────────────────────────────────────────────────────────
function interp(s: string, vars?: Record<string, string>) {
  if (!s || !vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface MarketInsight {
  stat: string;
  label: string;
}

interface RelatedProperty {
  title: string;
  price: string;
  beds: number;
  size: number;
  location: string;
  slug: string;
}

interface NurtureDay7Props {
  firstName?: string;
  propertyTitle?: string;
  propertyUrl?: string;
  destinationName?: string;
  marketInsights?: MarketInsight[];
  relatedProperties?: RelatedProperty[];
  unsubscribeUrl?: string;
  locale?: 'en' | 'es' | 'fr';
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
const sampleInsights: MarketInsight[] = [
  { stat: '€185k',  label: 'Avg share price' },
  { stat: '94%',    label: 'Occupancy high season' },
  { stat: '+12%',   label: 'Price growth 2023–2024' },
];

const sampleProperties: RelatedProperty[] = [
  {
    title: 'Port de Pollenca, Mallorca — 4-Bed Villa With Mountain Views',
    price: '€178,500',
    beds: 4,
    size: 240,
    location: 'Port de Pollenca, Mallorca',
    slug: 'port-de-pollenca-mallorca-4-bed-villa',
  },
  {
    title: 'Cala d\'Or, Mallorca — 3-Bed Coastal Finca With Pool',
    price: '€142,000',
    beds: 3,
    size: 185,
    location: 'Cala d\'Or, Mallorca',
    slug: 'cala-dor-mallorca-3-bed-coastal-finca',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function NurtureDay7({
  firstName,
  destinationName,
  relatedProperties = sampleProperties,
  marketInsights = sampleInsights,
  unsubscribeUrl = '#',
  locale = 'en',
}: NurtureDay7Props) {
  const tr = (key: string, vars?: Record<string, string>) => {
    const v = t(`emails.${key}`, locale);
    return vars ? interp(v, vars) : v;
  };

  const htmlLang = tr('common.html_lang') || 'en';
  const localePath = locale === 'en' ? '' : `/${locale}`;
  const dn = destinationName || '';
  const bedsLabel = tr('common.card_beds') || 'Beds';
  const viewPropertyText = tr('common.card_view_property') || 'View Property →';

  return (
    <Html lang={htmlLang}>
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

      <Preview>{destinationName ? tr('nurture_day7.preview', { destinationName: dn }) : tr('nurture_day7.preview_general')}</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Section style={goldRuleHeader} />
            <Text style={wordmark}>Co-Ownership Property</Text>
            <Section style={goldRuleHeader} />
          </Container>
        </Section>

        {/* ── DESTINATION INSIGHT INTRO ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '52px 0 40px' }}>

              <Text style={eyebrow}>{tr('nurture_day7.eyebrow_intro')}</Text>
              <Heading style={heroHeading}>{tr('nurture_day7.main_heading', { destinationName: dn })}</Heading>
              <Hr style={goldBar} />

              <Text style={bodyText}>{tr('nurture_day7.greeting', { firstName: firstName || '' })}</Text>
              <Text style={bodyText}>{tr('nurture_day7.intro_body_1', { destinationName: dn })}</Text>
              <Text style={bodyText}>{tr('nurture_day7.intro_body_2')}</Text>

            </Section>
          </Container>
        </Section>

        {/* ── STATS ROW ── */}
        <Section style={{ backgroundColor: C.white, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
          <Container style={wrap}>
            <Section style={{ padding: '40px 0' }}>
              <Row>
                {marketInsights.map((insight, i) => (
                  <Column key={i} style={statCol}>
                    <Text style={statNumber}>{insight.stat}</Text>
                    <Text style={statLabel}>{insight.label}</Text>
                  </Column>
                ))}
              </Row>
            </Section>
          </Container>
        </Section>

        {/* ── PROPERTIES SECTION ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '44px 0 8px' }}>

              <Text style={eyebrow}>{tr('nurture_day7.eyebrow_properties', { destinationName: dn })}</Text>
              <Hr style={goldBar} />

              {relatedProperties.map((p, i) => (
                <Section key={i} style={hCard}>
                  <Row>
                    {/* Image column */}
                    <Column style={hCardImgCol}>
                      <Link href={`${base}${localePath}/property/${p.slug}`}>
                        <Section style={hCardImgPlaceholder}> </Section>
                      </Link>
                    </Column>
                    {/* Content column */}
                    <Column style={hCardContent}>
                      <Text style={hCardLocation}>{p.location}</Text>
                      <Text style={hCardTitle}>{p.title}</Text>
                      <Text style={hCardStats}>{p.beds} {bedsLabel}&emsp;|&emsp;{p.size} m²</Text>
                      <Row style={{ marginTop: 12 }}>
                        <Column>
                          <Text style={hCardPrice}>{p.price}</Text>
                        </Column>
                        <Column style={{ textAlign: 'right' as const, verticalAlign: 'middle' }}>
                          <Link href={`${base}${localePath}/property/${p.slug}`} style={viewLink}>
                            {viewPropertyText}
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

        {/* ── CTA ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 56 }}>
          <Container style={wrap}>
            <Section style={{ textAlign: 'center' as const }}>
              <Button href={`${base}${localePath}/our-homes/${destinationName ? `?destination=${destinationName.toLowerCase()}` : ''}`} style={ctaBtn}>
                {destinationName ? tr('nurture_day7.cta_button', { destinationName: dn }) : tr('nurture_day7.cta_button_general')}
              </Button>
            </Section>
          </Container>
        </Section>

        {/* ── SIGN-OFF ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 48 }}>
          <Container style={wrap}>
            <Hr style={{ borderColor: C.border, margin: '0 0 28px' }} />
            <Text style={signOffBody}>{tr('nurture_day7.closing_body')}</Text>
            <Hr style={goldRule} />
            <Text style={signOffName}>{tr('common.team_signoff')}</Text>
            <Text style={signOffSite}>co-ownership-property.com</Text>
          </Container>
        </Section>

        {/* ── FOOTER ── */}
        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <Section style={footGoldRule} />
            <Text style={footLinks}>
              <Link href={`${base}${localePath}/our-homes/`} style={footLink}>{tr('common.footer_our_homes')}</Link>
              {'  ·  '}
              <Link href={`${base}${localePath}/how-it-works/`} style={footLink}>{tr('common.footer_how_it_works')}</Link>
              {'  ·  '}
              <Link href={`${base}${localePath}/all-our-blog/`} style={footLink}>{tr('common.footer_blog')}</Link>
              {'  ·  '}
              <Link href={unsubscribeUrl} style={footLink}>{tr('common.footer_unsubscribe')}</Link>
            </Text>
            <Hr style={footDivider} />
            <Text style={footFine}>{tr('nurture_day7.footer_fine_print')}</Text>
            <Text style={footFine}>
              <Link href={unsubscribeUrl} style={{ color: C.gold, textDecoration: 'none' }}>{tr('common.footer_unsubscribe')}</Link>
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

const eyebrow: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 10px',
};

const heroHeading: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 28,
  fontWeight: 400,
  fontStyle: 'italic',
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
  fontSize: 16,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 12px',
};

// Stats
const statCol: React.CSSProperties = {
  width: '33%',
  textAlign: 'center' as const,
  padding: '0 8px',
  verticalAlign: 'top',
};

const statNumber: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 36,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 6px',
  lineHeight: '1',
};

const statLabel: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: 0,
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
  fontSize: 13,
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
  fontSize: 13,
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
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  textDecoration: 'underline',
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

// Footer
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
