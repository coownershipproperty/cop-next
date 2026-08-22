import {
  Body, Container, Head, Heading, Hr,
  Html, Img, Link, Preview, Section, Text,
} from '@react-email/components';
import * as React from 'react';

interface Property {
  slug: string;
  title: string;
  price: string;
  beds: number;
  size: number;
  imageUrl: string;
  location?: string;
  regionTag?: string;
  galleryUrl?: string;
}

interface PersonalisedNewsletterEmailProps {
  firstName?: string;
  primaryProperties?: Property[];
  fallbackProperties?: Property[];
  unsubscribeUrl?: string;
}

const C = {
  navy:    '#1E3448',
  navy80:  '#243d56',
  navy60:  '#6B8A9E',
  gold:    '#C9A84C',
  cream:   '#F7F4EE',
  white:   '#FFFFFF',
};

const base           = 'https://co-ownership-property.com';
const whatsappNumber = '447901002763';
const enquiryEmail   = 'hello@co-ownership-property.com';

// ── Gold rule helper ──────────────────────────────────────────────────────────
function GoldRule({ width = 28 }: { width?: number }) {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody><tr><td align="center">
        <table width={width} cellPadding="0" cellSpacing="0" role="presentation">
          <tbody><tr>
            <td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td>
          </tr></tbody>
        </table>
      </td></tr></tbody>
    </table>
  );
}

// ── Full-width gold separator (header → body divider) ─────────────────────────
function GoldBorder() {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody><tr>
        <td style={{ backgroundColor: C.gold, height: 2, lineHeight: '2px', fontSize: '1px' }}>&nbsp;</td>
      </tr></tbody>
    </table>
  );
}

// ── Hero card (properties 1 & 2) ──────────────────────────────────────────────
function HeroCard({ p }: { p: Property }) {
  const waMsg    = encodeURIComponent(`Hi, I saw ${p.title} on Co-Ownership Property and I'd love to find out more.`);
  const mailSub  = encodeURIComponent(`Enquiry: ${p.title}`);
  const mailBody = encodeURIComponent(`Hi,\n\nI'm interested in ${p.title}.\n\nThank you`);
  const href     = p.galleryUrl || `${base}/property/${p.slug}`;
  const waHref   = `https://wa.me/${whatsappNumber}?text=${waMsg}`;
  const mailHref = `mailto:${enquiryEmail}?subject=${mailSub}&body=${mailBody}`;

  return (
    <Section style={heroCard}>
      <Link href={href} style={{ display: 'block' }}>
        <Img src={p.imageUrl} alt={p.title} width="560" style={heroImg} />
      </Link>
      <Section style={heroBody}>
        <Hr style={cardGoldRule} />
        <Heading style={heroTitle}>{p.title}</Heading>
        <Text style={heroPrice}>
          {p.price}&ensp;<span style={perShare}>per share</span>
        </Text>
        <Link href={href} style={goldBtn}>View Gallery</Link>
        <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={{ marginTop: 0 }}>
          <tbody><tr>
            <td width="50%" style={{ paddingRight: 6 }}>
              <Link href={mailHref} style={outlineBtn}>Email Enquiry</Link>
            </td>
            <td width="50%" style={{ paddingLeft: 6 }}>
              <Link href={waHref} style={waBtn}>WhatsApp Us</Link>
            </td>
          </tr></tbody>
        </table>
      </Section>
    </Section>
  );
}

// ── Secondary card (properties 3–6) ──────────────────────────────────────────
function SecondaryCard({ p }: { p: Property }) {
  const waMsg    = encodeURIComponent(`Hi, I saw ${p.title} on Co-Ownership Property and I'd love to find out more.`);
  const mailSub  = encodeURIComponent(`Enquiry: ${p.title}`);
  const mailBody = encodeURIComponent(`Hi,\n\nI'm interested in ${p.title}.\n\nThank you`);
  const href     = p.galleryUrl || `${base}/property/${p.slug}`;
  const waHref   = `https://wa.me/${whatsappNumber}?text=${waMsg}`;
  const mailHref = `mailto:${enquiryEmail}?subject=${mailSub}&body=${mailBody}`;

  return (
    <Section style={secondaryCard}>
      <Link href={href} style={{ display: 'block' }}>
        <Img src={p.imageUrl} alt={p.title} width="560" style={secondaryImg} />
      </Link>
      <Section style={secondaryBody}>
        <Hr style={cardGoldRule} />
        <Heading style={secondaryTitle}>{p.title}</Heading>
        <Text style={secondaryPrice}>
          {p.price}&ensp;<span style={{ ...perShare, fontSize: 9 }}>per share</span>
        </Text>
        <Link href={href} style={{ ...goldBtnSm, marginBottom: 12 }}>View Gallery</Link>
        <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
          <tbody><tr>
            <td width="50%" style={{ paddingRight: 6 }}>
              <Link href={mailHref} style={outlineBtn}>Email Enquiry</Link>
            </td>
            <td width="50%" style={{ paddingLeft: 6 }}>
              <Link href={waHref} style={waBtn}>WhatsApp Us</Link>
            </td>
          </tr></tbody>
        </table>
      </Section>
    </Section>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function PersonalisedNewsletterEmail({
  firstName = 'there',
  primaryProperties = [],
  fallbackProperties = [],
  unsubscribeUrl = `${base}/unsubscribe`,
}: PersonalisedNewsletterEmailProps) {
  const allProps       = [...primaryProperties, ...fallbackProperties];
  const heroProps      = allProps.slice(0, 2);
  const secondaryProps = allProps.slice(2, 6);

  const regions = [...new Set(allProps.map(p => p.regionTag || p.location?.split(',')[0]).filter(Boolean))];
  const top3    = regions.slice(0, 3);
  // "California & Mallorca" or "California, Mallorca & Ibiza"
  const destShort = top3.length > 1
    ? top3.slice(0, -1).join(', ') + ' & ' + top3[top3.length - 1]
    : top3[0] || '';

  const introLine = firstName !== 'there'
    ? `${firstName} — ${allProps.length} homes${destShort ? ` in ${destShort}` : ''}, matched for you`
    : `${allProps.length} homes${destShort ? ` in ${destShort}` : ''}, matched for you`;

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
          .logo-full { display: block !important; }
          .logo-cop  { display: none  !important; }
          @media only screen and (max-width: 480px) {
            .wordmark-text { font-size: 18px !important; }
          }
        `}</style>
      </Head>
      <Preview>{introLine}</Preview>

      <Body style={body}>

        {/* ── Header ── */}
        <Section style={header}>
          <Container style={wrap}>
            <GoldRule width={36} />
            <Text className="wordmark-text" style={wordmarkFull}>Co-Ownership Property</Text>
            <Text style={headerTagline}>Your weekly edit of the world's finest co-ownership</Text>
            <GoldRule width={36} />
          </Container>
        </Section>

        {/* ── Full-width gold line separating header from body ── */}
        <GoldBorder />

        {/* ── Intro ── */}
        <Section className="prop-section" style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '32px 0 24px', textAlign: 'center' as const }}>
              <Text className="intro-text" style={introStyle}>{introLine}</Text>
              <Hr style={goldBar} />
            </Section>
          </Container>
        </Section>

        {/* ── Hero properties (1 & 2) ── */}
        <Section className="prop-section" style={{ backgroundColor: C.cream, paddingBottom: 0 }}>
          <Container style={wrap}>
            {heroProps.map((p, i) => <HeroCard key={i} p={p} />)}
          </Container>
        </Section>

        {/* ── Secondary properties (3–6, single column) ── */}
        {secondaryProps.length > 0 && (
          <Section className="prop-section" style={{ backgroundColor: C.cream, paddingBottom: 0 }}>
            <Container style={wrap}>
              {secondaryProps.map((p, i) => <SecondaryCard key={i} p={p} />)}
            </Container>
          </Section>
        )}

        {/* ── Reply nudge ── */}
        <Section className="prop-nudge" style={{ backgroundColor: C.cream, padding: '12px 0 52px' }}>
          <Container style={wrap}>
            <Text style={replyNudge}>Anything catch your eye? Just reply to this email.</Text>
          </Container>
        </Section>

        {/* ── Footer ── */}
        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <GoldRule width={32} />
            <Text style={footLinks}>
              <Link href={base} style={footLink}>Website</Link>
              {'  ·  '}
              <Link href={`${base}/our-homes`} style={footLink}>Our Homes</Link>
              {'  ·  '}
              <Link href={`${base}/how-it-works`} style={footLink}>How It Works</Link>
            </Text>
            <Hr style={footDivider} />
            <Text style={footFine}>You're receiving this because you expressed interest in co-ownership property.</Text>
            <Text style={footFine}>
              <Link href={unsubscribeUrl} style={{ color: C.gold, textDecoration: 'none' }}>Unsubscribe</Link>
            </Text>
          </Container>
        </Section>

      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const body: React.CSSProperties = {
  backgroundColor: C.cream,
  margin: 0,
  padding: 0,
  fontFamily: "'Cormorant Garamond', Georgia, serif",
};
const wrap: React.CSSProperties = { maxWidth: 560, margin: '0 auto', padding: '0 20px' };

// Header — same dark shade as footer for visual unity
const header: React.CSSProperties = { backgroundColor: C.navy, padding: '44px 0 40px' };

// Wordmark — bigger, more air
const wordmarkFull: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  color: C.white,
  fontSize: 26,
  fontWeight: 300,
  letterSpacing: '0.26em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '22px 0 14px',
  lineHeight: 1,
};

// Header tagline — more space above and below
const headerTagline: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  color: 'rgba(255,255,255,0.52)',
  fontSize: 14,
  fontWeight: 300,
  fontStyle: 'italic',
  letterSpacing: '0.04em',
  textAlign: 'center' as const,
  margin: '0 0 22px',
  lineHeight: 1.5,
};

// (kept for type safety — unused after removing COP-only path)
const wordmarkCOP: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  color: C.white,
  fontSize: 20,
  fontWeight: 300,
  letterSpacing: '0.26em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '18px 0 8px',
  lineHeight: 1,
  display: 'none',
};

// Intro
const introStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 26,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 24px',
  lineHeight: '1.35',
  textAlign: 'center' as const,
};
const goldBar: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 1,
  width: 28,
  margin: '0 auto',
};

// Left-aligned short gold rule above card titles — same as the digest's cardGoldRule
const cardGoldRule: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 1,
  width: 28,
  margin: '0 0 14px',
};

// Region pill (unused — kept for reference)
const regionPill: React.CSSProperties = {
  display: 'inline-block',
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 8,
  fontWeight: 600,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  color: C.navy,
  backgroundColor: C.gold,
  padding: '3px 10px',
  margin: '0 0 14px',
  lineHeight: 1,
};

// Hero card
const heroCard: React.CSSProperties  = { backgroundColor: C.white, border: '1px solid #E8E3DC', marginBottom: 24 };
const heroImg: React.CSSProperties   = { width: '100%', height: 300, objectFit: 'cover' as const, display: 'block' };
const heroBody: React.CSSProperties  = { padding: '28px 32px 32px' };
const heroTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 22,
  fontWeight: 300,
  color: C.navy,
  margin: '0 0 20px',
  lineHeight: '1.35',
};
const heroPrice: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 28,
  fontWeight: 300,
  color: C.navy,
  margin: '6px 0 22px',
  lineHeight: 1,
};

// Secondary card
const secondaryCard: React.CSSProperties  = { backgroundColor: C.white, border: '1px solid #E8E3DC', marginBottom: 24 };
const secondaryImg: React.CSSProperties   = { width: '100%', height: 220, objectFit: 'cover' as const, display: 'block' };
const secondaryBody: React.CSSProperties  = { padding: '22px 32px 26px' };
const secondaryTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 19,
  fontWeight: 300,
  color: C.navy,
  margin: '0 0 16px',
  lineHeight: '1.35',
};
const secondaryPrice: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 22,
  fontWeight: 300,
  color: C.navy,
  margin: '6px 0 18px',
  lineHeight: 1,
};

// Shared
const perShare: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 400,
  color: C.navy60,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
};

// Buttons
const goldBtn: React.CSSProperties = {
  display: 'block',
  backgroundColor: C.gold,
  color: C.navy,
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '15px 24px',
  marginBottom: 18,
};
const goldBtnSm: React.CSSProperties = { ...goldBtn, padding: '13px 24px', marginBottom: 0 };

// Secondary buttons — Email Enquiry (outlined) / WhatsApp (brand green)
const outlineBtn: React.CSSProperties = {
  display: 'block',
  border: `1px solid ${C.navy}`,
  color: C.navy,
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 0',
};
const waBtn: React.CSSProperties = {
  ...outlineBtn,
  border: '1px solid #25D366',
  backgroundColor: '#25D366',
  color: C.white,
};

const contactLine: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 400,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: C.navy60,
  textAlign: 'center' as const,
  margin: 0,
};
const contactLink: React.CSSProperties = { color: C.navy60, textDecoration: 'none' };

// Reply nudge — navy60 works on both cream (mobile) and navy (desktop) backgrounds
const replyNudge: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 17,
  fontStyle: 'italic',
  fontWeight: 300,
  color: '#4A6070',
  textAlign: 'center' as const,
  margin: '12px 0 0',
};

// Footer
const footer: React.CSSProperties = {
  backgroundColor: C.navy,
  padding: '44px 0 36px',
  borderTop: `2px solid ${C.gold}`,
};
const footLogo: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  color: C.white,
  fontSize: 18,
  fontWeight: 300,
  letterSpacing: '0.26em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '0 0 18px',
};
const footLinks: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 300,
  letterSpacing: '0.1em',
  textAlign: 'center' as const,
  margin: '12px 0 4px',
  color: 'rgba(255,255,255,.35)',
};
const footLink: React.CSSProperties  = { color: 'rgba(255,255,255,.45)', textDecoration: 'none' };
const footDivider: React.CSSProperties = { borderColor: 'rgba(255,255,255,.07)', margin: '20px 0' };
const footFine: React.CSSProperties  = {
  fontFamily: "'Jost', Arial, sans-serif",
  color: 'rgba(255,255,255,.28)',
  fontSize: 10,
  fontWeight: 300,
  textAlign: 'center' as const,
  margin: '4px 0 0',
  lineHeight: '1.8',
  letterSpacing: '0.04em',
};
