import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface EnquiryAutoreplyProps {
  firstName?: string;
  propertyTitle?: string;
  propertyImg?: string;
  propertyUrl?: string;
  destination?: string;
  budget?: string;
  trackingPixelHtml?: string;
}

// ── Brand colours ─────────────────────────────────────────────────────────────
const C = {
  navy:   '#1E3448',
  navy60: '#6B8A9E',
  gold:   '#C9A84C',
  cream:  '#F7F4EE',
  white:  '#FFFFFF',
  border: '#E8E3DC',
  text:   '#3A5168',
};

const base = 'https://co-ownership-property.com';

// ── Component ─────────────────────────────────────────────────────────────────
export default function EnquiryAutoreply({
  firstName,
  propertyTitle,
  propertyImg,
  propertyUrl,
  destination,
  budget,
  trackingPixelHtml,
}: EnquiryAutoreplyProps) {

  // Split property title at em dash for location / name display
  const dashIdx = propertyTitle?.indexOf('\u2014') ?? -1;
  const propLocation = dashIdx > -1 ? propertyTitle?.slice(0, dashIdx).trim() : null;
  const propName     = dashIdx > -1 ? propertyTitle?.slice(dashIdx + 1).trim() : propertyTitle;

  const previewText = propertyTitle
    ? `We've received your enquiry about ${propertyTitle} and will be in touch shortly.`
    : "We've received your enquiry and will be in touch shortly.";

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
        `}</style>
      </Head>

      <Preview>{previewText}</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Text style={wordmark}>Co-Ownership Property</Text>
            <Section style={goldRuleHeader} />
          </Container>
        </Section>

        {/* ── GREETING ── */}
        <Section style={heroSection}>
          <Container style={wrapBody}>
            <Text style={greeting}>
              {firstName ? `Dear ${firstName},` : 'Dear Friend,'}
            </Text>
            <Text style={introText}>
              {propertyTitle
                ? "Thank you for your interest. We've received your enquiry and a member of our team will be in touch shortly."
                : "Thank you for getting in touch. We've received your message and a member of our team will be in touch shortly."}
            </Text>
          </Container>
        </Section>

        {/* ── ENQUIRY SUMMARY (destination + budget, general enquiries only) ── */}
        {!propertyTitle && (destination || budget) && (
          <Section style={summarySection}>
            <Container style={wrapBody}>
              <Text style={summaryEyebrow}>Your enquiry details</Text>
              <Section style={goldRuleCenter} />
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 20 }}>
                {destination && (
                  <tr>
                    <td style={summaryLabel}>Destination</td>
                    <td style={summaryValue}>{destination}</td>
                  </tr>
                )}
                {budget && (
                  <tr>
                    <td style={summaryLabel}>Budget</td>
                    <td style={summaryValue}>{budget}</td>
                  </tr>
                )}
              </table>
            </Container>
          </Section>
        )}

        {/* ── PROPERTY CALLOUT (only when property-specific) ── */}
        {propertyTitle && (
          <Section style={propertyCallout}>
            <Container style={wrapBody}>
              {propLocation && (
                <Text style={propLocationStyle}>{propLocation}</Text>
              )}
              <Text style={propNameStyle}>{propName}</Text>
              <Section style={goldRuleCenter} />
            </Container>
          </Section>
        )}

        {/* ── HERO IMAGE (only when property-specific and image available) ── */}
        {propertyImg && (
          <Section style={{ backgroundColor: C.white, textAlign: 'center' as const, lineHeight: 0, fontSize: 0 }}>
            <Img
              src={propertyImg}
              alt={propertyTitle ?? 'Property'}
              width="600"
              style={heroImgStyle}
            />
          </Section>
        )}

        {/* ── CTA ── */}
        <Section style={ctaSection}>
          <Container style={wrapBody}>
            <Text style={ctaLabel}>
              {propertyTitle ? 'Explore the listing' : 'In the meantime'}
            </Text>
            <Section style={{ textAlign: 'center' as const }}>
              <Button href={propertyUrl ?? `${base}/our-homes/`} style={ctaButton}>
                {propertyTitle ? 'View Property' : 'Browse All Properties'}
              </Button>
            </Section>
          </Container>
        </Section>

        {/* ── SIGN-OFF ── */}
        <Section style={{ backgroundColor: C.white }}>
          <Container style={wrapBody}>
            <Hr style={thinDivider} />
            <Text style={replyText}>
              Have more questions? Simply reply to this email — we're always happy to help.
            </Text>
            <Hr style={goldAccentRule} />
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
              You're receiving this because you submitted an enquiry on co-ownership-property.com.
            </Text>
          </Container>
        </Section>

        {/* ── TRACKING PIXEL ── */}
        {trackingPixelHtml && (
          <div dangerouslySetInnerHTML={{ __html: trackingPixelHtml }} />
        )}

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
  padding: '0 40px',
};

const wrapBody: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '0 48px',
};

// Header
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

// Greeting
const heroSection: React.CSSProperties = {
  backgroundColor: C.white,
  paddingTop: 52,
  paddingBottom: 0,
};

const greeting: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 28,
  fontWeight: 300,
  fontStyle: 'italic',
  color: C.navy,
  textAlign: 'center' as const,
  margin: '0 0 20px',
};

const introText: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 14,
  fontWeight: 300,
  color: C.text,
  lineHeight: '1.9',
  textAlign: 'center' as const,
  margin: '0 0 0',
};

// Property callout
const propertyCallout: React.CSSProperties = {
  backgroundColor: C.white,
  paddingTop: 36,
  paddingBottom: 36,
};

const propLocationStyle: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  textAlign: 'center' as const,
  margin: '0 0 12px',
};

const propNameStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 26,
  fontWeight: 400,
  color: C.navy,
  textAlign: 'center' as const,
  lineHeight: '1.3',
  margin: '0 0 24px',
};

const goldRuleCenter: React.CSSProperties = {
  backgroundColor: C.gold,
  height: 1,
  maxWidth: 40,
  margin: '0 auto',
};

// Hero image
const heroImgStyle: React.CSSProperties = {
  width: '600px',
  maxWidth: '100%',
  height: 'auto',
  display: 'block',
  margin: '0 auto',
};

// CTA block
const ctaSection: React.CSSProperties = {
  backgroundColor: C.white,
  paddingTop: 40,
  paddingBottom: 52,
};

const ctaLabel: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  color: C.navy60,
  textAlign: 'center' as const,
  margin: '0 0 18px',
};

const ctaButton: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  backgroundColor: C.gold,
  color: C.white,
  fontSize: 11,
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  padding: '18px 48px',
  textDecoration: 'none',
  display: 'inline-block',
};

// Enquiry summary box
const summarySection: React.CSSProperties = {
  backgroundColor: C.white,
  paddingTop: 32,
  paddingBottom: 0,
};

const summaryEyebrow: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  textAlign: 'center' as const,
  margin: '0 0 12px',
};

const summaryLabel: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 12,
  fontWeight: 400,
  color: C.navy60,
  padding: '6px 0',
  width: '40%',
};

const summaryValue: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 500,
  color: C.navy,
  padding: '6px 0',
};

// Sign-off
const thinDivider: React.CSSProperties = {
  borderColor: C.border,
  margin: '0 0 28px',
};

const replyText: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 300,
  color: C.text,
  lineHeight: '1.8',
  textAlign: 'center' as const,
  margin: '0 0 28px',
};

const goldAccentRule: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 1,
  width: 32,
  margin: '0 auto 24px',
};

const signoffName: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 16,
  fontWeight: 400,
  fontStyle: 'italic',
  color: C.navy,
  textAlign: 'center' as const,
  margin: '0 0 4px',
};

const signoffSite: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 11,
  fontWeight: 400,
  color: C.navy60,
  textAlign: 'center' as const,
  margin: '0 0 48px',
};

const signoffLink: React.CSSProperties = {
  color: C.navy60,
  textDecoration: 'none',
};

// Footer
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
