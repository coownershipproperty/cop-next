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
interface Welcome1Props {
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
export default function Welcome1({
  firstName,
  unsubscribeUrl = '{{unsubscribe_url}}',
  locale = 'en',
}: Welcome1Props) {
  const tr = (key: string, vars?: Record<string, string>) => {
    const v = t(`emails.${key}`, locale);
    return vars ? interp(v, vars) : v;
  };

  const htmlLang = tr('common.html_lang') || 'en';

  // Localized URL prefix — '' for English, '/es' or '/fr' for other locales
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

      <Preview>{tr('welcome_1.preview')}</Preview>

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

            <Hr style={goldRule} />
            <Text style={eyebrow}>{tr('welcome_1.eyebrow')}</Text>

            <Heading style={heroHeading}>
              <em>{firstName
                ? tr('welcome_1.heading_with_name', { firstName })
                : tr('welcome_1.heading_without_name')}</em>
            </Heading>

            <Text style={bodyText}>{tr('welcome_1.intro')}</Text>

            <Text style={listItem}>
              <strong style={{ color: C.navy }}>{tr('welcome_1.item1_label')}</strong> — {tr('welcome_1.item1_body')}
            </Text>

            <Text style={listItem}>
              <strong style={{ color: C.navy }}>{tr('welcome_1.item2_label')}</strong> — {tr('welcome_1.item2_body')}
            </Text>

            <Text style={listItem}>
              <strong style={{ color: C.navy }}>{tr('welcome_1.item3_label')}</strong> — {tr('welcome_1.item3_body')}
            </Text>

            <Hr style={goldRule} />

            <Section style={{ margin: '28px 0' }}>
              <Button href={`${base}${localePath}/our-homes/`} style={ctaBtn}>
                {tr('welcome_1.cta_button')}
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
            <Text style={footFine}>{tr('welcome_1.footer_fine_print')}</Text>
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

const goldRule: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 2,
  width: 40,
  margin: '0 0 20px',
};

const eyebrow: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 16px',
};

const heroHeading: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 30,
  fontWeight: 400,
  fontStyle: 'italic',
  color: C.navy,
  margin: '0 0 28px',
  lineHeight: '1.35',
};

const bodyText: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 16,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 16px',
};

const listItem: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 16,
  color: '#4A6070',
  lineHeight: '1.7',
  margin: '0 0 14px',
  paddingLeft: 16,
  borderLeft: `2px solid ${C.border}`,
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
