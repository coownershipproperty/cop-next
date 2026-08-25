import {
  Body, Container, Head, Heading, Hr,
  Html, Img, Link, Preview, Section, Text,
} from '@react-email/components';
import * as React from 'react';

/**
 * "A Year of Weekends" — one home per month, September to next summer.
 *
 * Campaign template for the US audience: the calendar IS the story, so the
 * campaign that uses it should keep personalize_by_region OFF (reordering
 * would scramble the months). Cards render in the order supplied; any slug
 * found in NOTES gets its month eyebrow + one-line note, unknown slugs just
 * render as plain cards, so the template stays usable for future editions —
 * pass a fresh property list and update NOTES.
 *
 * Visual language matches emails/personalised-newsletter.tsx exactly
 * (navy header/footer, cream body, Cormorant Garamond + Jost, gold rules,
 * View Gallery gold button + Email Enquiry / WhatsApp pair).
 */

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

interface YearOfWeekendsEmailProps {
  firstName?: string;
  properties?: Property[];
  unsubscribeUrl?: string;
}

const C = {
  navy:   '#1E3448',
  navy60: '#6B8A9E',
  gold:   '#C9A84C',
  cream:  '#F7F4EE',
  white:  '#FFFFFF',
};

const base           = 'https://co-ownership-property.com';
const whatsappNumber = '447901002763';
const enquiryEmail   = 'hello@co-ownership-property.com';

// Month + one-liner per slug — the 2026-08 "Year of Weekends" edition.
const NOTES: Record<string, { month: string; line: string }> = {
  'napa-california-4-bed-farmhouse-with-pool': {
    month: 'September',
    line: 'Harvest weekends — crush season in the valley, dinner in your own garden.',
  },
  'kiawah-island-south-carolina-4-bed-house-with-infinity-pool': {
    month: 'October',
    line: 'The Lowcountry’s golden month — golf weather, a warm sea, the summer crowds gone.',
  },
  'palm-springs-california-3-bed-house-with-pool': {
    month: 'November',
    line: 'Desert season opens — 80°F by the pool while everyone up north puts the grill away.',
  },
  'breckenridge-colorado-5-bed-house-with-hot-tub': {
    month: 'December',
    line: 'First chair to last light, then the hot tub. Christmas in your own mountain house.',
  },
  'miami-beach-florida-5-bed-house-with-pool': {
    month: 'January',
    line: 'Miami in season — the pool, the light, the long warm evenings.',
  },
  'cabo-san-lucas-mexico-4-bed-house-with-beach-access': {
    month: 'February',
    line: 'Whale season in Cabo — walk to the beach, 80°F afternoons.',
  },
  'park-city-utah-5-bed-townhouse-ski-inski-out': {
    month: 'March',
    line: 'Spring skiing — blue mornings, soft snow, and the run starts at your door.',
  },
  'carmel-by-the-sea-california-4-bed-house-with-hot-tub': {
    month: 'April',
    line: 'Carmel before the summer rush — fireplace evenings, quiet beaches.',
  },
  'malibu-california-3-bed-estate-with-beach-access': {
    month: 'May',
    line: 'The Pacific warming up — and yes, that price really says Malibu.',
  },
  'tahoma-california-usa-3-bed-house-lakefront': {
    month: 'Next Summer',
    line: 'Back on the lake — except this time, the pier is yours.',
  },
};

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

function GoldBorder() {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody><tr>
        <td style={{ backgroundColor: C.gold, height: 2, lineHeight: '2px', fontSize: '1px' }}>&nbsp;</td>
      </tr></tbody>
    </table>
  );
}

function MonthCard({ p }: { p: Property }) {
  const note     = NOTES[p.slug];
  const waMsg    = encodeURIComponent(`Hi, I saw ${p.title} on Co-Ownership Property and I'd love to find out more.`);
  const mailSub  = encodeURIComponent(`Enquiry: ${p.title}`);
  const mailBody = encodeURIComponent(`Hi,\n\nI'm interested in ${p.title}.\n\nThank you`);
  const href     = p.galleryUrl || `${base}/property/${p.slug}`;
  const waHref   = `https://wa.me/${whatsappNumber}?text=${waMsg}`;
  const mailHref = `mailto:${enquiryEmail}?subject=${mailSub}&body=${mailBody}`;

  return (
    <Section style={card}>
      <Link href={href} style={{ display: 'block' }}>
        <Img src={p.imageUrl} alt={p.title} width="560" style={cardImg} />
      </Link>
      <Section style={cardBody}>
        {note && <Text style={monthEyebrow}>{note.month}</Text>}
        <Hr style={cardGoldRule} />
        <Heading style={cardTitle}>{p.title}</Heading>
        {note && <Text style={noteLine}>{note.line}</Text>}
        <Text style={cardPrice}>
          {p.price}&ensp;<span style={perShare}>per share</span>
        </Text>
        <Link href={href} style={goldBtn}>View Gallery</Link>
        <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
          <tbody><tr>
            <td width="50%" style={{ paddingRight: 6 }}>
              <Link href={mailHref} style={outlineBtn}>Email Enquiry</Link>
            </td>
            <td width="50%" style={{ paddingLeft: 6 }}>
              <Link href={waHref} style={waBtn}><span style={{ color: '#25D366', fontSize: 8, verticalAlign: 'middle' }}>&#9679;</span>&ensp;WhatsApp Us</Link>
            </td>
          </tr></tbody>
        </table>
      </Section>
    </Section>
  );
}

export default function YearOfWeekendsEmail({
  firstName = 'there',
  properties = [],
  unsubscribeUrl = `${base}/unsubscribe`,
}: YearOfWeekendsEmailProps) {
  const previewLine = 'A year of American weekends — from Napa harvest to your own Tahoe pier.';
  const helloLine = firstName !== 'there'
    ? `${firstName} — the rental’s returned and the sand is still in the car. Here’s the case for never doing that again.`
    : 'The rental’s returned and the sand is still in the car. Here’s the case for never doing that again.';

  return (
    <Html lang="en">
      <Head>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
          @media only screen and (max-width: 480px) {
            .wordmark-text { font-size: 18px !important; }
          }
        `}</style>
      </Head>
      <Preview>{previewLine}</Preview>

      <Body style={body}>

        {/* ── Header ── */}
        <Section style={header}>
          <Container style={wrap}>
            <GoldRule width={36} />
            <Text className="wordmark-text" style={wordmarkFull}>Co-Ownership Property</Text>
            <Text style={headerKicker}>A Year of Weekends</Text>
            <Text style={headerTagline}>One American home for every month — Napa to Cabo, September to next summer</Text>
            <GoldRule width={36} />
          </Container>
        </Section>

        <GoldBorder />

        {/* ── Intro ── */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '32px 0 8px', textAlign: 'center' as const }}>
              <Text style={introStyle}>{helloLine}</Text>
              <Text style={introSub}>
                One American home for every month of the year ahead — each a fully deeded 1/8
                share of the whole house, fully managed between stays. Follow the calendar.
              </Text>
              <Hr style={goldBar} />
            </Section>
          </Container>
        </Section>

        {/* ── The calendar ── */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 0 }}>
          <Container style={wrap}>
            {properties.map((p, i) => <MonthCard key={i} p={p} />)}
          </Container>
        </Section>

        {/* ── Reply nudge ── */}
        <Section style={{ backgroundColor: C.cream, padding: '12px 0 52px' }}>
          <Container style={wrap}>
            <Text style={replyNudge}>Which month is yours? Just reply to this email.</Text>
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
            <Text style={footFine}>You&rsquo;re receiving this because you expressed interest in co-ownership property.</Text>
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

const header: React.CSSProperties = { backgroundColor: C.navy, padding: '44px 0 40px' };
const wordmarkFull: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  color: C.white,
  fontSize: 26,
  fontWeight: 300,
  letterSpacing: '0.26em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '22px 0 16px',
  lineHeight: 1,
};
const headerKicker: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  color: C.gold,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.32em',
  textTransform: 'uppercase' as const,
  textAlign: 'center' as const,
  margin: '0 0 10px',
  lineHeight: 1,
};
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

const introStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 24,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 14px',
  lineHeight: '1.4',
  textAlign: 'center' as const,
};
const introSub: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 16,
  fontWeight: 300,
  color: '#4A6070',
  margin: '0 0 24px',
  lineHeight: '1.6',
  textAlign: 'center' as const,
};
const goldBar: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 1,
  width: 28,
  margin: '0 auto 24px',
};

const card: React.CSSProperties     = { backgroundColor: C.white, border: '1px solid #E8E3DC', marginBottom: 24 };
const cardImg: React.CSSProperties  = { width: '100%', height: 250, objectFit: 'cover' as const, display: 'block' };
const cardBody: React.CSSProperties = { padding: '24px 32px 28px' };

const monthEyebrow: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.3em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 10px',
  lineHeight: 1,
};
const cardGoldRule: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 1,
  width: 28,
  margin: '0 0 14px',
};
const cardTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 21,
  fontWeight: 300,
  color: C.navy,
  margin: '0 0 10px',
  lineHeight: '1.35',
};
const noteLine: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 16,
  fontStyle: 'italic',
  fontWeight: 300,
  color: '#4A6070',
  margin: '0 0 16px',
  lineHeight: '1.55',
};
const cardPrice: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 26,
  fontWeight: 300,
  color: C.navy,
  margin: '4px 0 20px',
  lineHeight: 1,
};
const perShare: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 400,
  color: C.navy60,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
};

const goldBtn: React.CSSProperties = {
  display: 'block',
  backgroundColor: C.navy,
  color: '#F4EFE4',
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 24px',
  marginBottom: 12,
};
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
};

const replyNudge: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 17,
  fontStyle: 'italic',
  fontWeight: 300,
  color: '#4A6070',
  textAlign: 'center' as const,
  margin: '12px 0 0',
};

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
