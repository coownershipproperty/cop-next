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
import BRAND from '@/lib/email/brand';
import { EmailColorScheme } from './_color-scheme';

// ── Helpers ───────────────────────────────────────────────────────────────────
function interp(s: string, vars?: Record<string, string>) {
  if (!s || !vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
}

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
  locale?: 'en' | 'es' | 'fr';
}

// ── Brand colours ─────────────────────────────────────────────────────────────
// Palette and type come from lib/email/brand.js — see the note at the top of
// that file. Nothing about COP's email design is declared in this file.
const C = BRAND;

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
  firstName,
  properties = sampleProperties,
  unsubscribeUrl = '{{unsubscribe_url}}',
  locale = 'en',
}: Welcome3Props) {
  const tr = (key: string, vars?: Record<string, string>) => {
    const v = t(`emails.${key}`, locale);
    return vars ? interp(v, vars) : v;
  };

  const htmlLang = tr('common.html_lang') || 'en';
  const localePath = locale === 'en' ? '' : `/${locale}`;
  const bedsLabel = tr('common.card_beds') || 'BEDS';
  const viewPropertyText = tr('common.card_view_property') || 'View Property →';

  return (
    <Html lang={htmlLang}>
      <Head>
        <EmailColorScheme />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');
          @media only screen and (max-width: 600px) {
            p { font-size: 17px !important; line-height: 1.75 !important; }
            h1, h2, h3 { font-size: 26px !important; line-height: 1.35 !important; }
            img { max-width: 100% !important; height: auto !important; }
          }
        `}</style>
      </Head>

      <Preview>{tr('welcome_3.preview')}</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Section style={goldRuleHeader} />
            <Text style={wordmark}>Co-Ownership Property</Text>
            <Section style={goldRuleHeader} />
          </Container>
        </Section>

        {/* ── INTRO ── */}
        <Section style={{ backgroundColor: C.white }}>
          <Container style={wrapBody}>

            <Text style={greeting}>{tr('welcome_3.greeting', { firstName: firstName || '' })}</Text>

            <Heading style={mainHeading}>{tr('welcome_3.main_heading')}</Heading>

            <Hr style={goldRule} />

            <Text style={bodyText}>{tr('welcome_3.intro_body')}</Text>

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
                      <Link href={`${base}${localePath}/property/${p.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
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
                      {p.beds} {bedsLabel}{p.size ? <>&ensp;|&ensp;{p.size} M²</> : null}
                    </Text>
                    <Text style={cardPrice}>{p.price}</Text>
                    <Link href={`${base}${localePath}/property/${p.slug}`} style={viewPropLink}>
                      {viewPropertyText}
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
              <Button href={`${base}${localePath}/our-homes/`} style={ctaBtn}>
                {tr('welcome_3.cta_button')}
              </Button>
            </Section>

            <Text style={bodyText}>{tr('welcome_3.closing_body')}</Text>

            <Hr style={goldRule} />

            <Text style={signoffName}>{tr('common.team_signoff')}</Text>
            <Text style={signoffSite}>
              <Link href={`${base}${localePath}`} style={signoffLink}>co-ownership-property.com</Link>
            </Text>

          </Container>
        </Section>

        {/* ── FOOTER ── */}
        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <Section style={footGoldRule} />
            <Text style={footLinks}>
              <Link href={`${base}${localePath}`} style={footLink}>{tr('common.footer_website')}</Link>
              {'  ·  '}
              <Link href={`${base}${localePath}/our-homes/`} style={footLink}>{tr('common.footer_our_homes')}</Link>
              {'  ·  '}
              <Link href={`${base}${localePath}/how-it-works/`} style={footLink}>{tr('common.footer_how_it_works')}</Link>
              {'  ·  '}
              <Link href={`${base}${localePath}/all-our-blog/`} style={footLink}>{tr('common.footer_blog')}</Link>
            </Text>
            <Hr style={footDivider} />
            <Text style={footFine}>{tr('welcome_3.footer_fine_print')}</Text>
            <Text style={footFine}>
              <Link href={unsubscribeUrl} style={{ color: C.onDark, textDecoration: 'none' }}>{tr('common.footer_unsubscribe')}</Link>
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
  fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '0 20px',
};

const wrapBody: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '40px 24px',
};

const header: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '52px 0 44px',
};

const wordmark: React.CSSProperties = {
  fontFamily: "'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  color: C.white,
  fontSize: 26,
  fontWeight: 500,
  letterSpacing: '-0.02em',
  textAlign: 'center' as const,
  margin: '20px 0',
};

const goldRuleHeader: React.CSSProperties = {
  backgroundColor: C.gold,
  height: 1,
  maxWidth: 56,
  margin: '0 auto',
};

const greeting: React.CSSProperties = {
  fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  fontSize: 16,
  color: '#3d3d3d',
  margin: '0 0 16px',
};

const mainHeading: React.CSSProperties = {
  fontFamily: "'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
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
  fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  fontSize: 16,
  color: '#3d3d3d',
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
  backgroundColor: '#e6e6e6',
};

const cardTextCol: React.CSSProperties = {
  verticalAlign: 'top',
  padding: '16px 20px',
};

const locationLabel: React.CSSProperties = {
  fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 6px',
};

const cardTitle: React.CSSProperties = {
  fontFamily: "'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  fontSize: 16,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 8px',
  lineHeight: '1.4',
};

const cardStats: React.CSSProperties = {
  fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: C.navy60,
  margin: '0 0 6px',
};

const cardPrice: React.CSSProperties = {
  fontFamily: "'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  fontSize: 18,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 8px',
};

const viewPropLink: React.CSSProperties = {
  fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.1em',
  color: C.gold,
  textDecoration: 'none',
};

const ctaBtn: React.CSSProperties = {
  fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  backgroundColor: C.navy,
  color: C.white,
  fontSize: 13,
  fontWeight: 700,
  letterSpacing: '0.18em',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
};

const signoffName: React.CSSProperties = {
  fontFamily: "'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  fontSize: 16,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 4px',
};

const signoffSite: React.CSSProperties = {
  fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  fontSize: 13,
  color: C.navy60,
  margin: 0,
};

const signoffLink: React.CSSProperties = {
  color: C.navy60,
  textDecoration: 'none',
};

const footer: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '56px 0 48px',
  borderTop: `2px solid ${C.gold}`,
};

const footLogo: React.CSSProperties = {
  fontFamily: "'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  color: C.white,
  fontSize: 22,
  fontWeight: 500,
  letterSpacing: '-0.02em',
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
  fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  fontSize: 11,
  fontWeight: 300,
  letterSpacing: '0.1em',
  textAlign: 'center' as const,
  margin: '0 0 4px',
  color: 'rgba(255,255,255,0.72)',
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
  fontFamily: "'Inter','Helvetica Neue',Helvetica,Arial,sans-serif",
  color: 'rgba(255,255,255,0.68)',
  fontSize: 12,
  fontWeight: 300,
  textAlign: 'center' as const,
  margin: '6px 0 0',
  lineHeight: '1.8',
  letterSpacing: '0.04em',
};
