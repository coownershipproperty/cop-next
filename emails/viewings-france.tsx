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
interface Viewing {
  id: string;
  propertySlug: string;
  displayName: string;
  city: string;
  region: string;
  country: string;
  dateLabel: string;        // e.g. "5 May 2026" or "Flexible — by appointment"
  price: string;             // pre-formatted, e.g. "€299,000"
  share: string;             // e.g. "1/8"
  imageUrl?: string;
  blurb?: string;
  tour?: 'virtual' | 'video' | null;
}

interface ViewingsFranceProps {
  firstName?: string;
  intro?: string;
  viewings?: Viewing[];
  /** Recipient email — appended to CTA URLs as ?em=… so the form pre-fills */
  recipientEmail?: string;
  unsubscribeUrl?: string;
}

// ── Brand colours (match new-listings-digest) ─────────────────────────────────
const C = {
  navy:   '#1E3448',
  navy60: '#6B8A9E',
  gold:   '#C9A84C',
  cream:  '#F7F4EE',
  white:  '#FFFFFF',
  border: '#E8E3DC',
};

const base = 'https://co-ownership-property.com';

// ── Sample / preview data ─────────────────────────────────────────────────────
const sampleViewings: Viewing[] = [
  {
    id: 'valbonne-2026-05-05',
    propertySlug: 'valbonne-france-4-bed-villa-with-pool',
    displayName: 'Maison Valbonne',
    city: 'Valbonne',
    region: "Côte d'Azur",
    country: 'France',
    dateLabel: '5 May 2026',
    price: '€299,000',
    share: '1/8',
    imageUrl: 'https://lh3.googleusercontent.com/d/1B5h_KZ9qbHnNwSjyEcEXijRPg1qHrkmM',
    blurb: 'A Provençal four-bedroom villa with a private pool, set in the wooded hills above Cannes.',
  },
  {
    id: 'grimaud-2026-06-16',
    propertySlug: 'grimaud-france-3-bed-villa-with-pool',
    displayName: 'Villa Verte',
    city: 'Grimaud',
    region: "Côte d'Azur",
    country: 'France',
    dateLabel: '16 June 2026',
    price: '€349,000',
    share: '1/8',
    imageUrl: 'https://a.storyblok.com/f/148662/2100x1400/ae26c8c38f/villa-verte.jpg',
    blurb: 'A south-west-facing three-bedroom villa minutes from the beaches of Saint-Tropez.',
  },
  {
    id: 'vallauris-2026-06-08',
    propertySlug: 'vallauris-france-3-bed-penthouse-with-pool',
    displayName: 'Ciel de Vallauris',
    city: 'Vallauris',
    region: "Côte d'Azur",
    country: 'France',
    dateLabel: '8 June 2026',
    price: '€189,000',
    share: '1/8',
    imageUrl: 'https://a.storyblok.com/f/148662/2100x1400/fd08854dd7/ciel-de-vallauris.jpg',
    blurb: 'A brand-new three-bedroom penthouse with a south-west terrace and shared pool.',
  },
  {
    id: 'nartelle-2026-06-06',
    propertySlug: 'nartelle-france-4-bed-villa-with-pool',
    displayName: 'Nartelle',
    city: 'Sainte-Maxime',
    region: 'French Riviera',
    country: 'France',
    dateLabel: '6 June 2026',
    price: '€599,000',
    share: '1/8',
    imageUrl: 'https://a.storyblok.com/f/148662/2100x1400/86fd79e931/nartelle.jpg',
    blurb: 'A modern four-bedroom villa with panoramic sea views, walking distance to the beach.',
  },
  {
    id: 'morzine-chalet-2026-06-06',
    propertySlug: 'morzine-france-4-bed-chalet-with-mountain-views',
    displayName: 'Chalet de la Manche',
    city: 'Morzine',
    region: 'Portes du Soleil',
    country: 'France',
    dateLabel: '6 June 2026',
    price: '€299,000',
    share: '1/8',
    imageUrl: 'https://a.storyblok.com/f/148662/2100x1400/4548d9e1cb/chalet-de-la-manche.jpg',
    blurb: 'A four-bedroom Alpine chalet with panoramic mountain views in the Portes du Soleil ski domain.',
    tour: 'virtual',
  },
  {
    id: 'morzine-panorama-flexible',
    propertySlug: 'morzine-france-2-bed-apartment-with-mountain-views',
    displayName: 'Panorama Morzine',
    city: 'Morzine',
    region: 'Portes du Soleil',
    country: 'France',
    dateLabel: 'Flexible — by appointment',
    price: '€139,000',
    share: '1/8',
    imageUrl: 'https://a.storyblok.com/f/148662/2100x1400/3b99b4f30c/panorama-morzine.jpg',
    blurb: 'A modern two-bedroom apartment with stunning views of the surrounding Alpine peaks.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export default function ViewingsFrance({
  firstName = '',
  intro,
  viewings = sampleViewings,
  recipientEmail = '',
  unsubscribeUrl = '#',
}: ViewingsFranceProps) {
  const previewText = `${viewings.length} private viewings — Côte d'Azur and the French Alps.`;
  const emQS = recipientEmail ? `&em=${encodeURIComponent(recipientEmail)}` : '';
  // Per-card CTA: jumps to the form with viewing + email pre-filled.
  const ctaUrlFor = (vId: string) => `${base}/viewings/?v=${encodeURIComponent(vId)}${emQS}#viewing-request-form`;
  // Main "See all viewings" button just lands on the page.
  const indexUrl = recipientEmail
    ? `${base}/viewings/?em=${encodeURIComponent(recipientEmail)}`
    : `${base}/viewings/`;

  return (
    <Html lang="en" dir="ltr">
      <Head>
        {viewings.map((v, i) =>
          v.imageUrl ? <link key={i} rel="preload" as="image" href={v.imageUrl} /> : null
        )}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
          @media only screen and (max-width: 600px) {
            .card-photo { height: 220px !important; }
            .prop-title { font-size: 20px !important; line-height: 1.35 !important; }
            .main-heading { font-size: 30px !important; line-height: 1.25 !important; }
            .card-inner { padding: 20px 18px 22px !important; }
            .hero-sub { font-size: 14px !important; }
            /* Stack the price block above a full-width CTA on narrow viewports
               so the button doesn't get squashed next to the price. */
            .price-cell    { display: block !important; width: 100% !important; padding: 0 0 16px !important; text-align: left !important; }
            .cta-cell      { display: block !important; width: 100% !important; padding: 0 !important; text-align: center !important; }
            .cta-cell a    { display: block !important; width: 100% !important; box-sizing: border-box !important; padding: 14px 18px !important; }
          }
        `}</style>
      </Head>
      <Preview>{previewText}</Preview>
      <Body style={body}>

        {/* HEADER */}
        <Section style={header}>
          <Container style={wrap}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation"><tbody><tr><td align="center">
              <table width="56" cellPadding="0" cellSpacing="0" border={0} role="presentation"><tbody><tr><td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td></tr></tbody></table>
            </td></tr></tbody></table>
            <Text style={wordmark}>Co-Ownership Property</Text>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation"><tbody><tr><td align="center">
              <table width="56" cellPadding="0" cellSpacing="0" border={0} role="presentation"><tbody><tr><td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td></tr></tbody></table>
            </td></tr></tbody></table>
          </Container>
        </Section>

        {/* HERO */}
        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '56px 0 12px' }}>
              <Text style={eyebrow}>Private Viewings</Text>
              <Hr style={goldBar} />
              <Heading as="h1" style={mainHeading} className="main-heading">Step inside before you decide</Heading>
              <Text style={bodyText} className="hero-sub">
                {intro
                  ? intro
                  : `${firstName ? `${firstName}, w` : 'W'}e've got six upcoming viewings across France — five on the Côte d'Azur and one in the French Alps. Take a real-world look at the property, ask anything, and meet the local team. On-site or live via video — your call.`}
              </Text>
            </Section>
          </Container>
        </Section>

        {/* VIEWING CARDS */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 16 }}>
          <Container style={wrap}>
            {viewings.map((v, i) => (
              <Section key={v.id || i} style={card}>
                <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation">
                  <tbody><tr>
                    <td
                      className="card-photo"
                      background={v.imageUrl || ''}
                      bgcolor={C.navy}
                      valign="top"
                      style={{
                        backgroundImage: v.imageUrl ? `url('${v.imageUrl}')` : undefined,
                        backgroundColor: C.navy,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        height: 300,
                        verticalAlign: 'top',
                      }}
                    >
                      <Link href={ctaUrlFor(v.id)} style={{ display: 'block', height: '300px', textDecoration: 'none' }}>
                        <table cellPadding="0" cellSpacing="0" border={0} role="presentation">
                          <tbody><tr><td style={{ padding: '16px 0 0 16px' }}>
                            <Text style={datePill}>{v.dateLabel}</Text>
                          </td></tr></tbody>
                        </table>
                      </Link>
                    </td>
                  </tr></tbody>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation" style={{ position: 'relative' as const, zIndex: 3 }}>
                  <tbody><tr><td style={cardInner} className="card-inner">
                    <Text style={cardLocation}>{v.city} · {v.region} · {v.country}</Text>
                    <Hr style={cardGoldRule} />
                    <Text style={cardTitle} className="prop-title">{v.displayName}</Text>
                    {v.blurb && <Text style={cardBlurb}>{v.blurb}</Text>}
                    <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation" style={{ marginTop: 18, borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                      <tbody><tr>
                        <td className="price-cell" style={{ verticalAlign: 'middle' }}>
                          <Text style={cardPrice}>{v.price}</Text>
                          <Text style={cardPriceLabel}>per {v.share} share</Text>
                        </td>
                        <td className="cta-cell" style={{ verticalAlign: 'middle', textAlign: 'right' as const }}>
                          <Link href={ctaUrlFor(v.id)} style={viewBtn}>Request viewing →</Link>
                        </td>
                      </tr></tbody>
                    </table>
                  </td></tr></tbody>
                </table>
              </Section>
            ))}
          </Container>
        </Section>

        {/* MAIN CTA */}
        <Section style={{ backgroundColor: C.cream, padding: '32px 0 72px' }}>
          <Container style={wrap}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation"><tbody><tr><td align="center">
              <Button href={indexUrl} style={ctaBtn}>See All Viewings</Button>
            </td></tr></tbody></table>
            <Text style={{ ...bodyText, fontSize: 12, color: C.navy60, marginTop: 18 }}>
              On-site visits and live video tours both available. We confirm within a few hours.
            </Text>
          </Container>
        </Section>

        {/* SIGN-OFF */}
        <Section style={{ backgroundColor: C.cream, paddingBottom: 56 }}>
          <Container style={wrap}>
            <Hr style={{ borderColor: C.border, margin: '0 0 32px' }} />
            <Text style={signOffBody}>If none of the dates work for you — or you want to see something elsewhere in Europe — just reply to this email and we&apos;ll set up a private tour around your schedule.</Text>
            <Hr style={goldRule} />
            <Text style={signOffName}>The Co-Ownership Property Team</Text>
            <Text style={signOffSite}>co-ownership-property.com</Text>
          </Container>
        </Section>

        {/* FOOTER */}
        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation"><tbody><tr><td align="center">
              <table width="40" cellPadding="0" cellSpacing="0" border={0} role="presentation"><tbody><tr><td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td></tr></tbody></table>
            </td></tr></tbody></table>
            <Text style={footLinks}>
              <Link href={`${base}/viewings/`} style={footLink}>Viewings</Link>{'  ·  '}
              <Link href={`${base}/our-homes/`} style={footLink}>Properties</Link>{'  ·  '}
              <Link href={`${base}/how-it-works/`} style={footLink}>How It Works</Link>{'  ·  '}
              <Link href={unsubscribeUrl} style={footLink}>Unsubscribe</Link>
            </Text>
            <Hr style={footDivider} />
            <Text style={footFine}>You&apos;re receiving this because you signed up at co-ownership-property.com</Text>
            <Text style={footFine}><Link href={unsubscribeUrl} style={{ color: C.gold, textDecoration: 'none' }}>Unsubscribe</Link></Text>
          </Container>
        </Section>

      </Body>
    </Html>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const body: React.CSSProperties = { backgroundColor: C.cream, margin: 0, padding: 0, fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 600, margin: '0 auto', padding: '0 20px' };
const header: React.CSSProperties = { backgroundColor: C.navy, padding: '52px 0 44px' };
const wordmark: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", color: C.white, fontSize: 24, fontWeight: 300, letterSpacing: '0.28em', textTransform: 'uppercase' as const, textAlign: 'center' as const, margin: '22px 0' };
const eyebrow: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 12px', textAlign: 'center' as const };
const goldBar: React.CSSProperties = { borderColor: C.gold, borderTopWidth: 1, width: 32, margin: '0 auto 28px' };
const mainHeading: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 38, fontWeight: 400, color: C.navy, margin: '0 0 16px', lineHeight: '1.2', textAlign: 'center' as const, letterSpacing: '0.02em' };
const bodyText: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 14, color: '#4A6070', lineHeight: '1.9', margin: '0', textAlign: 'center' as const };

const card: React.CSSProperties = { border: `1px solid ${C.border}`, backgroundColor: C.white, marginBottom: 24, overflow: 'hidden' };
const datePill: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: C.navy, backgroundColor: C.gold, padding: '6px 12px', margin: 0, display: 'inline-block' };
const cardInner: React.CSSProperties = { padding: '24px 28px 28px' };
const cardLocation: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 10px' };
const cardGoldRule: React.CSSProperties = { borderColor: C.gold, borderTopWidth: 1, width: 28, margin: '0 0 14px' };
const cardTitle: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 400, color: C.navy, margin: '0 0 10px', lineHeight: '1.3', letterSpacing: '0.01em' };
const cardBlurb: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 13, color: '#4A6070', lineHeight: '1.7', margin: '0' };
const cardPrice: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 500, color: C.gold, margin: '0 0 2px', lineHeight: '1' };
const cardPriceLabel: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 11, color: C.navy60, letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: 0 };
const viewBtn: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.navy, textDecoration: 'none', border: `1px solid ${C.navy}`, padding: '10px 18px', display: 'inline-block', whiteSpace: 'nowrap' as const };
const ctaBtn: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", backgroundColor: C.navy, color: C.white, fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase' as const, padding: '16px 48px', textDecoration: 'none', display: 'inline-block' };
const signOffBody: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 14, color: '#4A6070', lineHeight: '1.9', margin: '0 0 28px' };
const goldRule: React.CSSProperties = { borderColor: C.gold, borderTopWidth: 1, width: 28, margin: '0 0 18px' };
const signOffName: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 17, fontWeight: 400, color: C.navy, margin: '0 0 4px', letterSpacing: '0.01em' };
const signOffSite: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 12, color: C.navy60, margin: 0, letterSpacing: '0.04em' };
const footer: React.CSSProperties = { backgroundColor: C.navy, padding: '52px 0 44px', borderTop: `2px solid ${C.gold}` };
const footLogo: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", color: C.white, fontSize: 20, fontWeight: 300, letterSpacing: '0.24em', textTransform: 'uppercase' as const, textAlign: 'center' as const, margin: '0 0 20px' };
const footLinks: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 11, fontWeight: 300, letterSpacing: '0.1em', textAlign: 'center' as const, margin: '12px 0 4px', color: 'rgba(255,255,255,0.4)' };
const footLink: React.CSSProperties = { color: 'rgba(255,255,255,0.5)', textDecoration: 'none' };
const footDivider: React.CSSProperties = { borderColor: 'rgba(255,255,255,0.08)', margin: '24px 0' };
const footFine: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", color: 'rgba(255,255,255,0.3)', fontSize: 11, fontWeight: 300, textAlign: 'center' as const, margin: '6px 0 0', lineHeight: '1.8', letterSpacing: '0.04em' };
