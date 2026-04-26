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

// ── Types ─────────────────────────────────────────────────────────────────────
interface NurtureDay3Props {
  firstName?: string;
  propertyTitle?: string;
  propertyUrl?: string;
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

// ── Component ─────────────────────────────────────────────────────────────────
export default function NurtureDay3({
  firstName,
  propertyTitle,
  propertyUrl,
  unsubscribeUrl = '{{unsubscribe_url}}',
}: NurtureDay3Props) {
  return (
    <Html lang="en">
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

      <Preview>Just checking in — any questions about {propertyTitle}?</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Text style={wordmark}>Co-Ownership Property</Text>
            <Section style={goldRuleHeader} />
          </Container>
        </Section>

        {/* ── BODY ── */}
        <Section style={{ backgroundColor: C.white }}>
          <Container style={wrapBody}>

            <Text style={greeting}>Hi {firstName},</Text>

            <Text style={bodyText}>
              I wanted to follow up on your enquiry about{' '}
              <strong style={{ color: C.navy }}>{propertyTitle}</strong>.
            </Text>

            <Text style={bodyText}>
              If you have any questions — about the property itself, how co-ownership works, the buying process, or anything else — I'm happy to help. There's no obligation and no sales pressure.
            </Text>

            <Text style={bodyText}>A few things people often ask at this stage:</Text>

            <Section style={questionsBlock}>
              <Text style={questionItem}>
                <em>What's included in the purchase price?</em>
              </Text>
              <Text style={questionItem}>
                <em>How is usage time divided between owners?</em>
              </Text>
              <Text style={questionItem}>
                <em>Can I sell my share later if I change my mind?</em>
              </Text>
            </Section>

            <Text style={bodyText}>
              Reply to this email with any questions and I'll get back to you personally.
            </Text>

            <Hr style={goldRule} />

            <Text style={signoffName}>The Co-Ownership Property Team</Text>
            <Text style={signoffSite}>
              <Link href={base} style={signoffLink}>co-ownership-property.com</Link>
            </Text>

            {propertyUrl && (
              <Text style={smallCta}>
                <Link href={propertyUrl} style={smallCtaLink}>
                  View {propertyTitle} again →
                </Link>
              </Text>
            )}

          </Container>
        </Section>

        {/* ── FOOTER ── */}
        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <Text style={footLinks}>
              <Link href={base} style={footLink}>Website</Link>{'  ·  '}
              <Link href={`${base}/our-homes/`} style={footLink}>Our Homes</Link>{'  ·  '}
              <Link href={`${base}/how-it-works/`} style={footLink}>How It Works</Link>{'  ·  '}
              <Link href={`${base}/all-our-blog/`} style={footLink}>Blog</Link>
            </Text>
            <Hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '20px 0' }} />
            <Text style={footFine}>
              You're receiving this because you submitted an enquiry on co-ownership-property.com.
            </Text>
            <Text style={footFine}>
              <Link href={unsubscribeUrl} style={{ color: C.gold, textDecoration: 'none' }}>Unsubscribe</Link>
              {'  ·  info@co-ownership-property.com'}
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
  fontSize: 13,
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
  fontSize: 13,
  fontWeight: 300,
  textAlign: 'center' as const,
  margin: '4px 0 0',
  lineHeight: '1.7',
};
