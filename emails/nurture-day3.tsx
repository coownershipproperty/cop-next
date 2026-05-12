import {
  Body,
  Container,
  Head,
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
interface NurtureDay3Props {
  firstName?: string;
  propertyTitle?: string;
  propertyUrl?: string;
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
export default function NurtureDay3({
  firstName,
  propertyTitle,
  propertyUrl,
  unsubscribeUrl = '{{unsubscribe_url}}',
  locale = 'en',
}: NurtureDay3Props) {
  const tr = (key: string, vars?: Record<string, string>) => {
    const v = t(`emails.${key}`, locale);
    return vars ? interp(v, vars) : v;
  };

  const htmlLang = tr('common.html_lang') || 'en';
  const localePath = locale === 'en' ? '' : `/${locale}`;
  const pt = propertyTitle || '';

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

      <Preview>{propertyTitle ? tr('nurture_day3.preview', { propertyTitle: pt }) : tr('nurture_day3.preview_general')}</Preview>

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

            <Text style={greeting}>{tr('nurture_day3.greeting', { firstName: firstName || '' })}</Text>

            {propertyTitle ? (
              <Text style={bodyText}>
                {(() => {
                  // Render intro with bolded property title
                  const tmpl = tr('nurture_day3.intro_body_with_property');
                  const parts = tmpl.split('{propertyTitle}');
                  return (
                    <>
                      {parts[0]}
                      <strong style={{ color: C.navy }}>{propertyTitle}</strong>
                      {parts[1] || ''}
                    </>
                  );
                })()}
              </Text>
            ) : (
              <Text style={bodyText}>{tr('nurture_day3.intro_body_general')}</Text>
            )}

            <Text style={bodyText}>{tr('nurture_day3.offer_body')}</Text>

            <Text style={bodyText}>{tr('nurture_day3.questions_intro')}</Text>

            <Section style={questionsBlock}>
              <Text style={questionItem}>
                <em>{tr('nurture_day3.question1')}</em>
              </Text>
              <Text style={questionItem}>
                <em>{tr('nurture_day3.question2')}</em>
              </Text>
              <Text style={questionItem}>
                <em>{tr('nurture_day3.question3')}</em>
              </Text>
            </Section>

            <Text style={bodyText}>{tr('nurture_day3.reply_body')}</Text>

            <Hr style={goldRule} />

            <Text style={signoffName}>{tr('common.team_signoff')}</Text>
            <Text style={signoffSite}>
              <Link href={`${base}${localePath}`} style={signoffLink}>co-ownership-property.com</Link>
            </Text>

            {propertyUrl && (
              <Text style={smallCta}>
                <Link href={propertyUrl} style={smallCtaLink}>
                  {tr('nurture_day3.view_again', { propertyTitle: pt })}
                </Link>
              </Text>
            )}

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
            <Text style={footFine}>{tr('nurture_day3.footer_fine_print')}</Text>
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

const bodyText: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 16,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 16px',
};

const questionsBlock: React.CSSProperties = {
  borderLeft: `3px solid ${C.gold}`,
  paddingLeft: 20,
  margin: '4px 0 20px',
};

const questionItem: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 16,
  fontStyle: 'italic',
  color: C.gold,
  margin: '0 0 8px',
  lineHeight: '1.6',
};

const goldRule: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 2,
  width: 40,
  margin: '28px 0 20px',
};

const signoffName: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 16,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 4px',
};

const signoffSite: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  color: C.navy60,
  margin: '0 0 24px',
};

const signoffLink: React.CSSProperties = {
  color: C.navy60,
  textDecoration: 'none',
};

const smallCta: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  margin: '8px 0 0',
};

const smallCtaLink: React.CSSProperties = {
  color: C.gold,
  textDecoration: 'none',
  fontWeight: 600,
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
