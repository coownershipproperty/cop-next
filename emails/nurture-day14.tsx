import {
  Body,
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
interface NurtureDay14Props {
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

const faqs = [
  {
    n: '1',
    title: 'What exactly do I own?',
    body:  'You own a legal deeded share of the property, registered in your name. This is a genuine real-estate asset — not a timeshare or points-based scheme.',
  },
  {
    n: '2',
    title: 'What if I want to sell my share?',
    body:  'You can sell at any time on the open market, just like any other property. There are no lock-in periods and no restrictions on resale.',
  },
  {
    n: '3',
    title: 'Are there hidden costs?',
    body:  'Running costs — maintenance, insurance, management — are shared equally between owners and are fully disclosed upfront. There are no surprises.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function NurtureDay14({
  firstName,
  propertyTitle,
  propertyUrl,
  unsubscribeUrl = '#',
}: NurtureDay14Props) {

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

      <Preview>Still thinking it over? Here's what other buyers wanted to know first.</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Section style={goldRuleHeader} />
            <Text style={wordmark}>Co-Ownership Property</Text>
            <Section style={goldRuleHeader} />
          </Container>
        </Section>

        {/* ── MAIN CONTENT ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '52px 0 0' }}>

              <Heading style={mainHeading}>
                A Few Things Worth Knowing Before You Decide
              </Heading>
              <Hr style={goldBar} />

              <Text style={bodyText}>Hi {firstName},</Text>
              <Text style={bodyText}>
                I know buying a share in a property is a significant decision, and it's not one to rush. I wanted to share a few things that often help people feel more confident before they take the next step.
              </Text>

            </Section>
          </Container>
        </Section>

        {/* ── FAQ ITEMS ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ paddingBottom: 8 }}>
              {faqs.map((faq) => (
                <Section key={faq.n} style={faqBlock}>
                  <Row>
                    <Column style={faqNumCol}>
                      <Text style={faqNum}>{faq.n}</Text>
                    </Column>
                    <Column style={faqBody}>
                      <Text style={faqTitle}>{faq.title}</Text>
                      <Text style={faqText}>{faq.body}</Text>
                    </Column>
                  </Row>
                </Section>
              ))}
            </Section>
          </Container>
        </Section>

        {/* ── CLOSING ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '8px 0 40px' }}>
              <Text style={bodyText}>
                If you'd like to talk it through, just reply to this email. No obligation — genuinely.
              </Text>
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

        {/* ── PROPERTY LINK ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 24 }}>
          <Container style={wrap}>
            <Text style={propLinkText}>
              <Link href={propertyUrl} style={propLink}>
                Or view {propertyTitle} one more time →
              </Link>
            </Text>
          </Container>
        </Section>

        {/* ── QUIET CLOSE ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 56 }}>
          <Container style={wrap}>
            <Text style={quietClose}>
              If now isn't the right time, that's completely fine. We'll be here when you're ready.
            </Text>
          </Container>
        </Section>

        {/* ── FOOTER ── */}
        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <Section style={footGoldRule} />
            <Text style={footLinks}>
              <Link href={`${base}/our-homes/`} style={footLink}>Properties</Link>
              {' — '}
              <Link href={`${base}/how-it-works/`} style={footLink}>How It Works</Link>
              {' — '}
              <Link href={`${base}/all-our-blog/`} style={footLink}>Our Blog</Link>
              {' — '}
              <Link href={unsubscribeUrl} style={footLink}>Unsubscribe</Link>
            </Text>
            <Hr style={footDivider} />
            <Text style={footFine}>
              You're receiving this because you enquired about a co-ownership property.
            </Text>
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

const mainHeading: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 26,
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
  fontSize: 16,
  color: '#4A6070',
  lineHeight: '1.8',
  margin: '0 0 12px',
};

// FAQ
const faqBlock: React.CSSProperties = {
  backgroundColor: C.white,
  border: `1px solid ${C.border}`,
  padding: '20px 24px',
  marginBottom: 12,
};

const faqNumCol: React.CSSProperties = {
  width: 36,
  verticalAlign: 'top',
  paddingTop: 2,
};

const faqNum: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 22,
  fontWeight: 700,
  color: C.gold,
  margin: 0,
  lineHeight: '1',
};

const faqBody: React.CSSProperties = {
  verticalAlign: 'top',
};

const faqTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 16,
  fontWeight: 700,
  color: C.navy,
  margin: '0 0 8px',
  lineHeight: '1.4',
};

const faqText: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 14,
  color: '#4A6070',
  lineHeight: '1.75',
  margin: 0,
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

// Property link
const propLinkText: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  textAlign: 'center' as const,
  margin: 0,
};

const propLink: React.CSSProperties = {
  color: C.navy60,
  textDecoration: 'underline',
};

// Quiet close
const quietClose: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontStyle: 'italic',
  color: C.navy60,
  textAlign: 'center' as const,
  margin: 0,
  lineHeight: '1.7',
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
  letterSpacing: '0.12em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '0 0 4px',
  color: 'rgba(255,255,255,0.5)',
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
