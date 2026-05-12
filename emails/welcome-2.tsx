import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
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
interface Welcome2Props {
  firstName?: string;
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function Welcome2({
  firstName,
  unsubscribeUrl = '{{unsubscribe_url}}',
  locale = 'en',
}: Welcome2Props) {
  const tr = (key: string, vars?: Record<string, string>) => {
    const v = t(`emails.${key}`, locale);
    return vars ? interp(v, vars) : v;
  };

  const htmlLang = tr('common.html_lang') || 'en';
  const localePath = locale === 'en' ? '' : `/${locale}`;

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

      <Preview>{tr('welcome_2.preview')}</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Section style={goldRuleHeader} />
            <Text style={wordmark}>Co-Ownership Property</Text>
            <Section style={goldRuleHeader} />
          </Container>
        </Section>

        {/* ── BODY ── */}
        <Section style={{ backgroundColor: C.white }}>
          <Container style={wrapBody}>

            <Text style={greeting}>{tr('welcome_2.greeting', { firstName: firstName || '' })}</Text>

            <Heading style={mainHeading}>{tr('welcome_2.main_heading')}</Heading>

            <Hr style={goldRule} />

            {/* 01 */}
            <Section style={numberedSection}>
              <Text style={goldNumber}>01</Text>
              <Text style={sectionTitle}>{tr('welcome_2.item01_title')}</Text>
              <Text style={bodyText}>{tr('welcome_2.item01_body')}</Text>
            </Section>

            {/* 02 */}
            <Section style={numberedSection}>
              <Text style={goldNumber}>02</Text>
              <Text style={sectionTitle}>{tr('welcome_2.item02_title')}</Text>
              <Text style={bodyText}>{tr('welcome_2.item02_body')}</Text>
            </Section>

            {/* 03 */}
            <Section style={numberedSection}>
              <Text style={goldNumber}>03</Text>
              <Text style={sectionTitle}>{tr('welcome_2.item03_title')}</Text>
              <Text style={bodyText}>{tr('welcome_2.item03_body')}</Text>
            </Section>

            {/* 04 */}
            <Section style={numberedSection}>
              <Text style={goldNumber}>04</Text>
              <Text style={sectionTitle}>{tr('welcome_2.item04_title')}</Text>
              <Text style={bodyText}>{tr('welcome_2.item04_body')}</Text>
            </Section>

            <Hr style={divider} />

            {/* FAQ: timeshare question */}
            <Text style={faqLabel}>{tr('welcome_2.faq_label')}</Text>

            <Section style={quoteBlock}>
              <Text style={quoteText}>{tr('welcome_2.quote')}</Text>
            </Section>

            <Text style={bodyText}>{tr('welcome_2.faq_body_1')}</Text>

            <Text style={bodyText}>{tr('welcome_2.faq_body_2')}</Text>

            <Hr style={goldRule} />

            <Section style={{ margin: '28px 0' }}>
              <Button href={`${base}${localePath}/how-it-works/`} style={ctaBtn}>
                {tr('welcome_2.cta_button')}
              </Button>
            </Section>

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
            <Text style={footFine}>{tr('welcome_2.footer_fine_print')}</Text>
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

const greeting: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 16,
  color: '#4A6070',
  margin: '0 0 20px',
};

const mainHeading: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 28,
  fontWeight: 700,
  color: C.navy,
  margin: '0 0 20px',
  lineHeight: '1.35',
};

const goldRule: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 2,
  width: 40,
  margin: '0 0 28px',
};

const numberedSection: React.CSSProperties = {
  marginBottom: 28,
};

const goldNumber: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 36,
  fontWeight: 700,
  color: C.gold,
  margin: '0 0 4px',
  lineHeight: '1',
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 18,
  fontWeight: 700,
  color: C.navy,
  margin: '0 0 10px',
};

const bodyText: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 16,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 14px',
};

const divider: React.CSSProperties = {
  borderColor: C.border,
  margin: '28px 0',
};

const faqLabel: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 600,
  color: C.navy60,
  letterSpacing: '0.04em',
  margin: '0 0 12px',
};

const quoteBlock: React.CSSProperties = {
  borderLeft: `3px solid ${C.gold}`,
  paddingLeft: 20,
  margin: '0 0 20px',
};

const quoteText: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 18,
  fontStyle: 'italic',
  color: C.navy,
  lineHeight: '1.6',
  margin: 0,
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

const signoffName: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 16,
  fontWeight: 400,
  color: C.navy,
  margin: '20px 0 4px',
};

const signoffSite: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
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
