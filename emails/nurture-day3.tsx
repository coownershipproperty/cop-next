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
  navy:   '#2C4A5E',
  navy60: '#6B8A9E',
  gold:   '#C9A84C',
  cream:  '#F5F2EC',
  white:  '#FFFFFF',
  border: '#E8E3DC',
};

const base = 'https://co-ownership-property.com';

// ── Component ─────────────────────────────────────────────────────────────────
export default function NurtureDay3({
  firstName = 'Michael',
  propertyTitle = 'Mallorca, Spain — 5-Bed Clifftop Villa With Sea Views',
  propertyUrl = 'https://co-ownership-property.com/property/mallorca-5-bed-clifftop-villa/',
  unsubscribeUrl = '{{unsubscribe_url}}',
}: NurtureDay3Props) {
  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Nunito+Sans:wght@300;400;600;700&display=swap');
        `}</style>
      </Head>

      <Preview>Just checking in — any questions about {propertyTitle}?</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Text style={headerLogo}>Co-Ownership Property</Text>
            <Text style={headerSub}>Your European Dream Home, Shared Smartly</Text>
          </Container>
        </Section>
        <Section style={goldLine}>
          <Text style={{ margin: 0, padding: 0, fontSize: 1, lineHeight: '3px' }}> </Text>
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
  fontFamily: "'Nunito Sans', 'Helvetica Neue', Arial, sans-serif",
};

const wrap: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '0 32px',
};

const wrapBody: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '48px 48px',
};

const header: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '32px 0 28px',
};

const headerLogo: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  color: C.white,
  fontSize: 26,
  fontWeight: 700,
  letterSpacing: '0.04em',
  textAlign: 'center' as const,
  margin: 0,
};

const headerSub: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  color: C.gold,
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '8px 0 0',
};

const goldLine: React.CSSProperties = {
  backgroundColor: C.gold,
  height: 3,
  lineHeight: '3px',
  fontSize: 1,
};

const greeting: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 16,
  color: '#4A6070',
  margin: '0 0 20px',
};

const bodyText: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 15,
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
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 15,
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
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 15,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 4px',
};

const signoffSite: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 12,
  color: C.navy60,
  margin: '0 0 24px',
};

const signoffLink: React.CSSProperties = {
  color: C.navy60,
  textDecoration: 'none',
};

const smallCta: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
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
  padding: '36px 0 32px',
  borderTop: `3px solid ${C.gold}`,
};

const footLogo: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  color: C.white,
  fontSize: 18,
  fontWeight: 700,
  textAlign: 'center' as const,
  letterSpacing: '0.06em',
  margin: '0 0 14px',
};

const footLinks: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 12,
  textAlign: 'center' as const,
  margin: 0,
};

const footLink: React.CSSProperties = {
  color: 'rgba(255,255,255,0.55)',
  textDecoration: 'none',
};

const footFine: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  color: 'rgba(255,255,255,0.3)',
  fontSize: 11,
  textAlign: 'center' as const,
  margin: '4px 0 0',
  lineHeight: '1.7',
};
