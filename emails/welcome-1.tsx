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

// ── Types ─────────────────────────────────────────────────────────────────────
interface Welcome1Props {
  firstName?: string;
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
export default function Welcome1({
  firstName = 'Richard',
  unsubscribeUrl = '{{unsubscribe_url}}',
}: Welcome1Props) {
  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Nunito+Sans:wght@300;400;600;700&display=swap');
        `}</style>
      </Head>

      <Preview>Welcome — here's what Co-Ownership Property actually does.</Preview>

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

            <Hr style={goldRule} />
            <Text style={eyebrow}>Welcome</Text>

            <Heading style={heroHeading}>
              <em>Your window to Europe's finest co-ownership homes</em>
            </Heading>

            <Text style={bodyText}>Hi {firstName},</Text>

            <Text style={bodyText}>
              Co-Ownership Property is an independent guide to the best fractional ownership homes available across Europe and beyond. We're not tied to any developer, agency, or sales platform — our only job is to help you find a home you'll love.
            </Text>

            <Text style={bodyText}>
              We've listed over 333 properties across France, Spain, Italy, Portugal, the USA, and more, and we curate new additions every week. Whether you're at the research stage or ready to move quickly, you'll find a range of options here to suit different budgets, destinations, and share sizes.
            </Text>

            <Text style={bodyText}>Here's what to expect from us:</Text>

            <Text style={listItem}>
              <strong style={{ color: C.navy }}>Weekly handpicked property recommendations</strong> — a curated selection of what's caught our eye this week, from mountain chalets to coastal villas.
            </Text>

            <Text style={listItem}>
              <strong style={{ color: C.navy }}>Destination guides and market insights</strong> — honest, practical information on the places and properties we feature.
            </Text>

            <Text style={listItem}>
              <strong style={{ color: C.navy }}>Honest, no-pressure advice when you're ready</strong> — reply to any of our emails and a real person will get back to you. No scripts, no sales pressure.
            </Text>

            <Hr style={goldRule} />

            <Section style={{ margin: '28px 0' }}>
              <Button href={`${base}/our-homes/`} style={ctaBtn}>
                BROWSE OUR HOMES
              </Button>
            </Section>

            <Text style={signoffName}>The Co-Ownership Property Team</Text>
            <Text style={signoffSite}>
              <Link href={base} style={signoffLink}>co-ownership-property.com</Link>
            </Text>

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
              You're receiving this because you signed up to the Co-Ownership Property newsletter.
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

const goldRule: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 2,
  width: 40,
  margin: '0 0 20px',
};

const eyebrow: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 16px',
};

const heroHeading: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 30,
  fontWeight: 400,
  fontStyle: 'italic',
  color: C.navy,
  margin: '0 0 28px',
  lineHeight: '1.35',
};

const bodyText: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 15,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 16px',
};

const listItem: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 15,
  color: '#4A6070',
  lineHeight: '1.7',
  margin: '0 0 14px',
  paddingLeft: 16,
  borderLeft: `2px solid ${C.border}`,
};

const ctaBtn: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  backgroundColor: C.navy,
  color: C.white,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.18em',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
};

const signoffName: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: 15,
  fontWeight: 400,
  color: C.navy,
  margin: '20px 0 4px',
};

const signoffSite: React.CSSProperties = {
  fontFamily: "'Nunito Sans', Arial, sans-serif",
  fontSize: 12,
  color: C.navy60,
  margin: 0,
};

const signoffLink: React.CSSProperties = {
  color: C.navy60,
  textDecoration: 'none',
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
