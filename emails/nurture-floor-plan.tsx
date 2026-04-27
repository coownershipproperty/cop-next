import {
  Body,
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

interface NurtureFloorPlanProps {
  firstName?:     string;
  propertyTitle?: string;
  propertyImg?:   string;
  propertyUrl?:   string;
  location?:      string;   // e.g. "Côte d'Azur, France"
  price?:         string;   // e.g. "€389,000"
  unsubscribeUrl?: string;
}

const C = {
  navy:   '#1E3448',
  navy60: '#6B8A9E',
  gold:   '#C9A84C',
  cream:  '#F7F4EE',
  white:  '#FFFFFF',
  border: '#E8E3DC',
};

const base = 'https://co-ownership-property.com';
const whatsappNumber = '447901002763';
const enquiryEmail   = 'hello@co-ownership-property.com';

export default function NurtureFloorPlan({
  firstName,
  propertyTitle,
  propertyImg,
  propertyUrl,
  location,
  price,
  unsubscribeUrl = '{{unsubscribe_url}}',
}: NurtureFloorPlanProps) {
  const waMsg = encodeURIComponent(`Hi, I requested the floor plan for ${propertyTitle} and I'd love to find out more.`);
  const mailSubject = encodeURIComponent(`Enquiry: ${propertyTitle}`);
  const mailBody    = encodeURIComponent(`Hi,\n\nI recently requested the floor plan for ${propertyTitle} and I have a few questions.\n\nThank you`);
  const mailHref    = `mailto:${enquiryEmail}?subject=${mailSubject}&body=${mailBody}`;
  const waHref      = `https://wa.me/${whatsappNumber}?text=${waMsg}`;

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
          @media only screen and (max-width: 600px) {
            .hero-img   { height: 240px !important; }
            .prop-title { font-size: 26px !important; }
            .main-head  { font-size: 28px !important; }
            .body-text  { font-size: 15px !important; }
            .btn-row td { display: block !important; width: 100% !important; padding: 0 0 8px 0 !important; }
          }
        `}</style>
      </Head>

      <Preview>You requested the floor plans for {propertyTitle} — here's a closer look</Preview>

      <Body style={s.body}>

        {/* ── HEADER ── */}
        <Section style={s.header}>
          <Container style={s.wrap}>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr><td align="center">
              <table width="56" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr>
                <td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td>
              </tr></tbody></table>
            </td></tr></tbody></table>
            <Text style={s.wordmark}>Co-Ownership Property</Text>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr><td align="center">
              <table width="56" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr>
                <td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td>
              </tr></tbody></table>
            </td></tr></tbody></table>
          </Container>
        </Section>

        {/* ── HERO IMAGE ── */}
        {propertyImg && (
          <Section style={{ backgroundColor: C.navy, padding: 0, margin: 0 }}>
            <Container style={{ maxWidth: 600, margin: '0 auto', padding: 0 }}>
              {propertyUrl ? (
                <Link href={propertyUrl} style={{ display: 'block', lineHeight: '0' }}>
                  <Img
                    src={propertyImg}
                    alt={propertyTitle || 'Property'}
                    width="600"
                    style={{
                      display: 'block',
                      width: '100%',
                      maxWidth: '600px',
                      height: '340px',
                      objectFit: 'cover',
                    }}
                    className="hero-img"
                  />
                </Link>
              ) : (
                <Img
                  src={propertyImg}
                  alt={propertyTitle || 'Property'}
                  width="600"
                  style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: '600px',
                    height: '340px',
                    objectFit: 'cover',
                  }}
                  className="hero-img"
                />
              )}
            </Container>
          </Section>
        )}

        {/* ── PROPERTY IDENTITY BAND ── */}
        <Section style={{ backgroundColor: C.white, padding: '28px 0 0' }}>
          <Container style={s.wrap}>
            {location && (
              <Text style={s.locationLabel}>{location.toUpperCase()}</Text>
            )}
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr><td>
              <table width="24" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr>
                <td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td>
              </tr></tbody></table>
            </td></tr></tbody></table>
            {propertyTitle && (
              <Text style={s.propTitle} className="prop-title">{propertyTitle}</Text>
            )}
            {price && (
              <Text style={s.priceText}>{price} <span style={{ fontSize: 11, color: C.navy60, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>per share</span></Text>
            )}
            <Hr style={s.divider} />
          </Container>
        </Section>

        {/* ── BODY COPY ── */}
        <Section style={{ backgroundColor: C.white }}>
          <Container style={s.wrapBody}>
            <Text style={s.greeting}>Hi {firstName || 'there'},</Text>

            <Text style={s.bodyText} className="body-text">
              You recently requested the floor plans and extra photos for{' '}
              <strong style={{ color: C.navy }}>{propertyTitle}</strong>.
              We hope they gave you a clearer picture of what's on offer.
            </Text>

            <Text style={s.bodyText} className="body-text">
              If you have questions about the property, the co-ownership structure, or how the buying process works — we're here. No obligation, no pressure.
            </Text>

            {/* CTA – View Property */}
            {propertyUrl && (
              <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={{ marginBottom: 28 }}>
                <tbody><tr><td align="center">
                  <Link href={propertyUrl} style={s.viewBtn}>View Property</Link>
                </td></tr></tbody>
              </table>
            )}

            {/* Enquiry buttons */}
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" className="btn-row">
              <tbody><tr>
                <td style={{ width: '50%', paddingRight: 6 }}>
                  <Link href={mailHref} style={s.emailBtn}>Email Enquiry</Link>
                </td>
                <td style={{ width: '50%', paddingLeft: 6 }}>
                  <Link href={waHref} style={s.waBtn}>WhatsApp</Link>
                </td>
              </tr></tbody>
            </table>

            <Hr style={s.goldRule} />

            <Text style={s.signoffName}>The Co-Ownership Property Team</Text>
            <Text style={s.signoffSite}>
              <Link href={base} style={{ color: C.navy60, textDecoration: 'none' }}>co-ownership-property.com</Link>
            </Text>
          </Container>
        </Section>

        {/* ── FOOTER ── */}
        <Section style={s.footer}>
          <Container style={s.wrap}>
            <Text style={s.footLogo}>Co-Ownership Property</Text>
            <table width="100%" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr><td align="center">
              <table width="40" cellPadding="0" cellSpacing="0" role="presentation"><tbody><tr>
                <td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td>
              </tr></tbody></table>
            </td></tr></tbody></table>
            <Text style={s.footLinks}>
              <Link href={`${base}/our-homes/`} style={s.footLink}>Properties</Link>
              {'  ·  '}
              <Link href={`${base}/how-it-works/`} style={s.footLink}>How It Works</Link>
              {'  ·  '}
              <Link href={`${base}/all-our-blog/`} style={s.footLink}>Blog</Link>
              {'  ·  '}
              <Link href={unsubscribeUrl} style={s.footLink}>Unsubscribe</Link>
            </Text>
            <Hr style={s.footDivider} />
            <Text style={s.footFine}>
              You're receiving this because you requested floor plans on co-ownership-property.com.
            </Text>
            <Text style={s.footFine}>
              <Link href={unsubscribeUrl} style={{ color: C.gold, textDecoration: 'none' }}>Unsubscribe</Link>
            </Text>
          </Container>
        </Section>

      </Body>
    </Html>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: C.cream,
    margin: 0, padding: 0,
    fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif",
  },
  wrap: { maxWidth: 600, margin: '0 auto', padding: '0 20px' },
  wrapBody: { maxWidth: 600, margin: '0 auto', padding: '8px 24px 40px' },

  header: { backgroundColor: C.navy, padding: '48px 0 40px' },
  wordmark: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    color: C.white, fontSize: 22, fontWeight: 300,
    letterSpacing: '0.3em', textTransform: 'uppercase',
    textAlign: 'center', margin: '20px 0',
  },

  locationLabel: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 10, fontWeight: 600, letterSpacing: '0.28em',
    textTransform: 'uppercase', color: C.gold,
    margin: '0 0 10px',
  },
  propTitle: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 30, fontWeight: 400, color: C.navy,
    margin: '12px 0 8px', lineHeight: '1.25', letterSpacing: '0.01em',
  },
  priceText: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22, fontWeight: 500, color: C.navy,
    margin: '0 0 0', lineHeight: '1.3',
  },
  divider: { borderColor: C.border, margin: '20px 0 0' },

  greeting: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 15, color: '#4A6070', margin: '24px 0 16px',
  },
  bodyText: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 15, color: '#4A6070', lineHeight: '1.85', margin: '0 0 16px',
  },

  viewBtn: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 11, fontWeight: 600, letterSpacing: '0.22em',
    textTransform: 'uppercase', color: C.white,
    backgroundColor: C.navy, textDecoration: 'none',
    padding: '14px 48px', display: 'inline-block',
  },
  emailBtn: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 10, fontWeight: 400, letterSpacing: '0.22em',
    textTransform: 'uppercase', color: C.navy,
    backgroundColor: C.gold, textDecoration: 'none',
    padding: '10px 0', display: 'block', textAlign: 'center',
  },
  waBtn: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 10, fontWeight: 400, letterSpacing: '0.22em',
    textTransform: 'uppercase', color: C.white,
    backgroundColor: '#25D366', textDecoration: 'none',
    padding: '10px 0', display: 'block', textAlign: 'center',
  },

  goldRule: { borderColor: C.gold, borderTopWidth: 1, width: 32, margin: '32px 0 20px' },
  signoffName: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 16, fontWeight: 400, color: C.navy, margin: '0 0 4px',
  },
  signoffSite: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 12, color: C.navy60, margin: 0,
  },

  footer: { backgroundColor: C.navy, padding: '48px 0 40px', borderTop: `2px solid ${C.gold}` },
  footLogo: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    color: C.white, fontSize: 19, fontWeight: 300,
    letterSpacing: '0.26em', textTransform: 'uppercase',
    textAlign: 'center', margin: '0 0 20px',
  },
  footLinks: {
    fontFamily: "'Jost', Arial, sans-serif",
    fontSize: 10, fontWeight: 300, letterSpacing: '0.1em',
    textAlign: 'center', margin: '14px 0 4px',
    color: 'rgba(255,255,255,0.4)',
  },
  footLink:    { color: 'rgba(255,255,255,0.5)', textDecoration: 'none' },
  footDivider: { borderColor: 'rgba(255,255,255,0.08)', margin: '22px 0' },
  footFine: {
    fontFamily: "'Jost', Arial, sans-serif",
    color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 300,
    textAlign: 'center', margin: '6px 0 0', lineHeight: '1.8', letterSpacing: '0.04em',
  },
};
