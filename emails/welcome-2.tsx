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
interface Welcome2Props {
  firstName?: string;
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
export default function Welcome2({
  firstName,
  unsubscribeUrl = '{{unsubscribe_url}}',
}: Welcome2Props) {
  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
        `}</style>
      </Head>

      <Preview>How co-ownership actually works — and why it's not a timeshare.</Preview>

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

            <Heading style={mainHeading}>
              Co-Ownership Is Real Ownership — Here's How It Works
            </Heading>

            <Hr style={goldRule} />

            {/* 01 */}
            <Section style={numberedSection}>
              <Text style={goldNumber}>01</Text>
              <Text style={sectionTitle}>You Own a Legal Share</Text>
              <Text style={bodyText}>
                When you buy through a co-ownership scheme, you receive a deeded, legally recognised fractional share of the property — typically between 1/8 and 1/2. This ownership is registered and protected in the same way as any other property purchase.
              </Text>
            </Section>

            {/* 02 */}
            <Section style={numberedSection}>
              <Text style={goldNumber}>02</Text>
              <Text style={sectionTitle}>Guaranteed Usage Time</Text>
              <Text style={bodyText}>
                Each share comes with an allocated number of weeks per year, proportional to the size of your stake. Usage is typically managed through a rota system, ensuring fair and flexible access across all owners throughout the year.
              </Text>
            </Section>

            {/* 03 */}
            <Section style={numberedSection}>
              <Text style={goldNumber}>03</Text>
              <Text style={sectionTitle}>Shared Running Costs</Text>
              <Text style={bodyText}>
                Maintenance, management fees, and running costs are split equally between all owners. This means you benefit from a premium, fully managed property at a fraction of what it would cost to own — and maintain — outright.
              </Text>
            </Section>

            {/* 04 */}
            <Section style={numberedSection}>
              <Text style={goldNumber}>04</Text>
              <Text style={sectionTitle}>You Can Sell Whenever You Choose</Text>
              <Text style={bodyText}>
                There are no lock-in periods and no membership to cancel. If you decide to sell your share — whether in a year or a decade — you can do so on the open market, just like any other property. Any capital growth is yours to keep.
              </Text>
            </Section>

            <Hr style={divider} />

            {/* FAQ: timeshare question */}
            <Text style={faqLabel}>The most common question we get:</Text>

            <Section style={quoteBlock}>
              <Text style={quoteText}>
                "Is this just a timeshare?"
              </Text>
            </Section>

            <Text style={bodyText}>
              It's genuinely different — and the distinction matters. A timeshare gives you the right to use a property for a fixed period each year; you don't own anything, you can rarely sell your stake freely, and the whole arrangement is tied to a membership or points system that can be altered by the operator.
            </Text>

            <Text style={bodyText}>
              Co-ownership is deeded property ownership. You hold a registered legal title to a share of the property itself. You can sell your share on the open market to any buyer you choose, at any time. There are no points, no memberships, and no annual fees beyond the actual cost of running the home.
            </Text>

            <Hr style={goldRule} />

            <Section style={{ margin: '28px 0' }}>
              <Button href={`${base}/how-it-works/`} style={ctaBtn}>
                SEE HOW IT WORKS IN DETAIL
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
  fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif",
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
  fontSize: 15,
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
  fontSize: 15,
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
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.18em',
  padding: '14px 36px',
  textDecoration: 'none',
  display: 'inline-block',
};

const signoffName: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 15,
  fontWeight: 400,
  color: C.navy,
  margin: '20px 0 4px',
};

const signoffSite: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
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
