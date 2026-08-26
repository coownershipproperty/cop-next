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

interface ListingProperty {
  title: string;
  price: string;
  beds: number;
  size: number;
  location: string;
  country: string;
  slug: string;
  imageUrl?: string;
  isNew?: boolean;
}

interface NewListingsDigestProps {
  newPropertyCount?: number;
  properties?: ListingProperty[];
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

const sampleProperties: ListingProperty[] = [
  { title: 'Grimaud, France — 3-Bed Villa With Pool', price: '€389,000', beds: 3, size: 0, location: "Côte d'Azur", country: 'France', slug: 'grimaud-france-3-bed-villa-with-pool-2', imageUrl: 'https://a.storyblok.com/f/148662/2100x1400/a630bc8666/villa-colline.jpg', isNew: true },
  { title: 'Portimão, Portugal — 3-Bed Apartment With Pool', price: '€169,000', beds: 3, size: 0, location: 'Algarve', country: 'Portugal', slug: 'portimao-portugal-3-bed-apartment-with-pool', imageUrl: 'https://a.storyblok.com/f/148662/2100x1400/c4758bb0cf/portimao.jpg', isNew: true },
  { title: 'Cumbre del Sol, Spain — 3-Bed Apartment With Pool', price: '€159,000', beds: 3, size: 0, location: 'Costa Blanca', country: 'Spain', slug: 'cumbre-del-sol-spain-3-bed-apartment-with-pool', imageUrl: 'https://a.storyblok.com/f/148662/2100x1400/e5065ebc39/vista-paraiso-4.jpg', isNew: true },
  { title: 'Vilamoura, Portugal — 2-Bed Apartment With Pool', price: '€179,000', beds: 2, size: 0, location: 'Algarve', country: 'Portugal', slug: 'vilamoura-portugal-2-bed-apartment-with-pool', imageUrl: 'https://a.storyblok.com/f/148662/1838x1225/9d8da21b60/beira-vilamoura.jpg', isNew: true },
];

export default function NewListingsDigest({
  newPropertyCount = 4,
  properties = sampleProperties,
  unsubscribeUrl = '#',
}: NewListingsDigestProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        {properties.map((p, i) => p.imageUrl ? <link key={i} rel="preload" as="image" href={p.imageUrl} /> : null)}
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
          @media only screen and (max-width: 600px) {
            .card-photo { height: 240px !important; }
            .prop-title { font-size: 20px !important; line-height: 1.35 !important; }
            .main-heading { font-size: 30px !important; line-height: 1.25 !important; }
            .card-inner { padding: 20px 18px 22px !important; }
          }
        `}</style>
      </Head>
      <Preview>{newPropertyCount} new properties just listed on Co-Ownership Property.</Preview>
      <Body style={body}>

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

        <Section style={{ backgroundColor: C.cream }}>
          <Container style={wrap}>
            <Section style={{ padding: '56px 0 12px' }}>
              <Text style={eyebrow}>Just Listed</Text>
              <Hr style={goldBar} />
              <Heading as="h1" style={mainHeading} className="main-heading">{newPropertyCount} New Properties</Heading>
              <Text style={bodyText}>We've just added the following properties to our collection — browse them below. New listings move quickly.</Text>
            </Section>
          </Container>
        </Section>

        <Section style={{ backgroundColor: C.cream, paddingBottom: 16 }}>
          <Container style={wrap}>
            {properties.map((p, i) => (
              <Section key={i} style={card}>
                <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation">
                  <tbody><tr>
                    <td
                      className="card-photo"
                      background={p.imageUrl || ''}
                      bgcolor={C.navy}
                      valign="top"
                      style={{
                        backgroundImage: p.imageUrl ? `url('${p.imageUrl}')` : undefined,
                        backgroundColor: C.navy,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        height: 340,
                        verticalAlign: 'top',
                      }}
                    >
                      <Link href={`${base}/property/${p.slug}`} style={{ display: 'block', height: '340px', textDecoration: 'none' }}>
                        {p.isNew && (
                          <table cellPadding="0" cellSpacing="0" border={0} role="presentation">
                            <tbody><tr><td style={{ padding: '14px 0 0 14px' }}>
                              <Text style={newBadge}>NEW</Text>
                            </td></tr></tbody>
                          </table>
                        )}
                      </Link>
                    </td>
                  </tr></tbody>
                </table>
                <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation" style={{ position: 'relative' as const, zIndex: 3 }}>
                  <tbody><tr><td style={cardInner} className="card-inner">
                    <Hr style={cardGoldRule} />
                    <Text style={cardTitle} className="prop-title">{p.title}</Text>
                    <Text style={cardBeds}>{p.beds} Bedrooms</Text>
                    <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation" style={{ marginTop: 20 }}>
                      <tbody><tr>
                        <td style={{ verticalAlign: 'middle' }}>
                          <Text style={cardPrice}>{p.price}</Text>
                          <Text style={cardPriceLabel}>per share</Text>
                        </td>
                      </tr></tbody>
                    </table>
                    {/* Stacked, identical full-width rectangles — never beside the
                        price, so nothing crowds on narrow phone screens. */}
                    <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation" style={{ marginTop: 18 }}>
                      <tbody><tr><td>
                        <Link href={`${base}/property/${p.slug}`} style={viewBtn}>View Property →</Link>
                      </td></tr></tbody>
                    </table>
                    <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation" style={{ marginTop: 10 }}>
                      <tbody><tr><td align="center">
                        <Link
                          href={`mailto:info@co-ownership-property.com?subject=${encodeURIComponent(`I'm interested — ${p.title}`)}&body=${encodeURIComponent(`Hi COP team,\n\nI'm interested in ${p.title} (${p.price} per share). Please send me more information.\n\nThanks,\n`)}`}
                          style={interestedBtn}
                        >I'm Interested →</Link>
                      </td></tr></tbody>
                    </table>
                  </td></tr></tbody>
                </table>
              </Section>
            ))}
          </Container>
        </Section>

        <Section style={{ backgroundColor: C.cream, padding: '32px 0 72px' }}>
          <Container style={wrap}>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation"><tbody><tr><td align="center">
              <Button href={`${base}/our-homes/`} style={ctaBtn}>Browse All Properties</Button>
            </td></tr></tbody></table>
          </Container>
        </Section>

        <Section style={{ backgroundColor: C.cream, paddingBottom: 56 }}>
          <Container style={wrap}>
            <Hr style={{ borderColor: C.border, margin: '0 0 32px' }} />
            <Text style={signOffBody}>If any of these resonate, or if you have a destination in mind that we haven't listed, reply to this email — our team typically responds within minutes.</Text>
            <Hr style={goldRule} />
            <Text style={signOffName}>The Co-Ownership Property Team</Text>
            <Text style={signOffSite}>co-ownership-property.com</Text>
          </Container>
        </Section>

        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <table width="100%" cellPadding="0" cellSpacing="0" border={0} role="presentation"><tbody><tr><td align="center">
              <table width="40" cellPadding="0" cellSpacing="0" border={0} role="presentation"><tbody><tr><td style={{ backgroundColor: C.gold, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td></tr></tbody></table>
            </td></tr></tbody></table>
            <Text style={footLinks}>
              <Link href={`${base}/our-homes/`} style={footLink}>Properties</Link>{'  ·  '}
              <Link href={`${base}/how-it-works/`} style={footLink}>How It Works</Link>{'  ·  '}
              <Link href={`${base}/all-our-blog/`} style={footLink}>Our Blog</Link>{'  ·  '}
              <Link href={unsubscribeUrl} style={footLink}>Unsubscribe</Link>
            </Text>
            <Hr style={footDivider} />
            <Text style={footFine}>You're receiving this because you signed up at co-ownership-property.com</Text>
            <Text style={footFine}><Link href={unsubscribeUrl} style={{ color: C.gold, textDecoration: 'none' }}>Unsubscribe</Link></Text>
          </Container>
        </Section>

      </Body>
    </Html>
  );
}

const body: React.CSSProperties = { backgroundColor: C.cream, margin: 0, padding: 0, fontFamily: "'Jost', 'Helvetica Neue', Arial, sans-serif" };
const wrap: React.CSSProperties = { maxWidth: 600, margin: '0 auto', padding: '0 20px' };
const header: React.CSSProperties = { backgroundColor: C.navy, padding: '52px 0 44px' };
const wordmark: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", color: C.white, fontSize: 24, fontWeight: 300, letterSpacing: '0.28em', textTransform: 'uppercase' as const, textAlign: 'center' as const, margin: '22px 0' };
const eyebrow: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 12px', textAlign: 'center' as const };
const goldBar: React.CSSProperties = { borderColor: C.gold, borderTopWidth: 1, width: 32, margin: '0 auto 28px' };
const mainHeading: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 38, fontWeight: 400, color: C.navy, margin: '0 0 16px', lineHeight: '1.2', textAlign: 'center' as const, letterSpacing: '0.02em' };
const bodyText: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 14, color: '#4A6070', lineHeight: '1.9', margin: '0', textAlign: 'center' as const };
const card: React.CSSProperties = { border: `1px solid ${C.border}`, backgroundColor: C.white, marginBottom: 24, overflow: 'hidden' };
const newBadge: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', color: C.navy, backgroundColor: C.gold, padding: '4px 10px', margin: 0, display: 'inline-block' };
const cardInner: React.CSSProperties = { padding: '24px 28px 28px' };
const cardLocation: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 10px' };
const cardGoldRule: React.CSSProperties = { borderColor: C.gold, borderTopWidth: 1, width: 28, margin: '0 0 14px' };
const cardTitle: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 400, color: C.navy, margin: '0 0 8px', lineHeight: '1.35', letterSpacing: '0.01em' };
const cardBeds: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 12, color: C.navy60, letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: 0 };
const cardPrice: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 500, color: C.gold, margin: '0 0 2px', lineHeight: '1' };
const cardPriceLabel: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 11, color: C.navy60, letterSpacing: '0.1em', textTransform: 'uppercase' as const, margin: 0 };
// Primary action — solid navy, ivory text (gold is never a button fill; it
// stays reserved for hairlines and eyebrows, same as the other templates).
const viewBtn: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' as const, backgroundColor: C.navy, color: '#F4EFE4', textDecoration: 'none', padding: '13px 22px', display: 'block', textAlign: 'center' as const, whiteSpace: 'nowrap' as const };
// Gold fill kept here by Dylan's explicit call (26 Aug) — the digest's
// "I'm Interested" stays gold; navy View Property is the primary beside it.
const interestedBtn: React.CSSProperties = { fontFamily: "'Jost', Arial, sans-serif", backgroundColor: C.gold, color: C.white, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase' as const, textDecoration: 'none', padding: '13px 22px', display: 'block', textAlign: 'center' as const, whiteSpace: 'nowrap' as const };
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
