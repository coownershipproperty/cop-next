import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';
import { t } from '@/lib/i18n';

// ── Types ─────────────────────────────────────────────────────────────────────
interface SimilarProperty {
  title: string;
  price: string;
  beds: number;
  size: number;
  slug: string;
  imageUrl?: string;
}

interface FloorPlanEmailProps {
  firstName?: string;
  propertyTitle?: string;
  propertyImg?: string;
  driveUrl?: string;
  propertyUrl?: string;
  similarProperties?: SimilarProperty[];
  trackingPixelHtml?: string;
  locale?: 'en' | 'es' | 'fr';
  /**
   * Wording overrides from the Template Studio, keyed by i18n path
   * (e.g. "floor_plan.greeting"). Only the keys Dylan has actually changed
   * are present; everything else falls through to messages/<locale>.json.
   */
  copy?: Record<string, string>;
}

// Small interpolation helper so t() values can contain {placeholders}.
const interp = (s: string, vars: Record<string, string>): string =>
  s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : `{${k}}`));

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
export default function FloorPlanEmail({
  firstName = 'there',
  propertyTitle = 'Your Property',
  propertyImg,
  driveUrl = 'https://drive.google.com/drive/folders/example',
  propertyUrl,
  similarProperties = [],
  trackingPixelHtml,
  locale = 'en',
  copy,
}: FloorPlanEmailProps) {

  // Split property title at em dash for location / property name display
  const dashIdx = propertyTitle?.indexOf('—') ?? -1;
  const propLocation = dashIdx > -1 ? propertyTitle?.slice(0, dashIdx).trim() : null;
  const propName     = dashIdx > -1 ? propertyTitle?.slice(dashIdx + 1).trim() : propertyTitle;

  // Localised strings (fall back to English if locale not supported).
  const tr = (key: string, vars?: Record<string, string>) => {
    // Studio override first, bundled translation second.
    const override = copy && typeof copy[key] === 'string' && copy[key].trim() !== ''
      ? copy[key]
      : null;
    const v = override != null ? override : t(`emails.${key}`, locale);
    return vars ? interp(v, vars) : v;
  };

  /**
   * Some lines are shared across every COP email (`common.*`). This email is
   * the first thing most leads ever receive and is signed by Dylan, so it
   * needs to be able to say something different without dragging the other
   * emails with it. `ownKey` wins when the studio has set it; otherwise the
   * shared line is used exactly as before.
   */
  const trOwn = (ownKey: string, sharedKey: string, vars?: Record<string, string>) => {
    const own = copy && copy[ownKey];
    if (typeof own === 'string' && own.trim() !== '') return vars ? interp(own, vars) : own;
    return tr(sharedKey, vars);
  };
  const htmlLang = tr('common.html_lang') || 'en';

  return (
    <Html lang={htmlLang}>
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

      <Preview>{tr('floor_plan.preview', { propertyTitle: propertyTitle || '' })}</Preview>

      <Body style={body}>

        {/* ── HEADER ── */}
        <Section style={header}>
          <Container style={wrap}>
            <Section style={goldRuleHeader} />
            <Text style={wordmark}>Co-Ownership Property</Text>
            <Section style={goldRuleHeader} />
          </Container>
        </Section>

        {/* ── HERO INTRO ── */}
        <Section style={heroSection}>
          <Container style={wrapBody}>
            <Text style={greeting}>{tr('floor_plan.greeting', { firstName: firstName || 'there' })}</Text>
            <Text style={introText}>
              {tr('floor_plan.intro')}
            </Text>
          </Container>
        </Section>

        {/* ── PROPERTY CALLOUT ── */}
        <Section style={propertyCallout}>
          <Container style={wrapBody}>
            {propLocation && (
              <Text style={propLocationStyle}>{propLocation}</Text>
            )}
            <Text style={propNameStyle}>{propName}</Text>
            <Section style={goldRuleCenter} />
          </Container>
        </Section>

        {/* ── HERO IMAGE ── */}
        {propertyImg && (
          <Section style={{ backgroundColor: C.white, textAlign: 'center' as const, lineHeight: 0, fontSize: 0 }}>
            <Link href={driveUrl ?? base}>
              <Img
                src={propertyImg}
                alt={propertyTitle}
                width="600"
                style={heroImg}
              />
            </Link>
          </Section>
        )}

        {/* ── CTA ── */}
        <Section style={ctaSection}>
          <Container style={wrapBody}>
            <Text style={ctaLabel}>{tr('floor_plan.cta_label')}</Text>
            <Section style={{ textAlign: 'center' as const }}>
              <Button href={driveUrl ?? base} style={ctaButton}>
                {tr('floor_plan.cta_button')}
              </Button>
            </Section>
            {propertyUrl && (
              <Text style={ctaSubLink}>
                <Link href={propertyUrl} style={subtleLink}>{tr('floor_plan.view_listing_link')}</Link>
              </Text>
            )}
          </Container>
        </Section>

        {/* ── DIVIDER ── */}
        <Section style={{ backgroundColor: C.white }}>
          <Container style={wrapBody}>
            <Hr style={thinDivider} />
            <Text style={replyText}>
              {trOwn('floor_plan.questions_reply_text', 'common.questions_reply_text')}
            </Text>
            <Hr style={goldAccentRule} />
            <Text style={signoffName}>{trOwn('floor_plan.signoff', 'common.team_signoff')}</Text>
            <Text style={signoffSite}>
              <Link href={base} style={signoffLink}>co-ownership-property.com</Link>
            </Text>
          </Container>
        </Section>

        {/* ── SIMILAR PROPERTIES ── */}
        {similarProperties && similarProperties.length > 0 && (
          <Section style={similarSection}>
            <Container style={wrap}>

              <Text style={sectionEyebrow}>{trOwn('floor_plan.similar_heading', 'common.section_you_may_also_like')}</Text>
              <Hr style={goldBarLeft} />

              {similarProperties.map((p, i) => (
                <Section key={i} style={propCard}>
                  <Row>
                    <Column style={cardImgCol}>
                      {p.imageUrl ? (
                        <Link href={`${base}/property/${p.slug}`}>
                          <Img
                            src={p.imageUrl}
                            alt={p.title}
                            width="160"
                            height="120"
                            style={cardImg}
                          />
                        </Link>
                      ) : (
                        <Section style={cardImgPlaceholder}>
                          <Text style={{ margin: 0, color: C.navy60, fontSize: 13 }}>{tr('common.card_no_image')}</Text>
                        </Section>
                      )}
                    </Column>
                    <Column style={cardTextCol}>
                      <Text style={locationLabel}>
                        {p.title.split('—')[0]?.trim() ?? ''}
                      </Text>
                      <Heading style={cardTitle}>
                        {p.title.split('—')[1]?.trim() ?? p.title}
                      </Heading>
                      <Text style={cardStats}>
                        {p.beds} {tr('common.card_beds')}{p.size ? <>&ensp;·&ensp;{p.size} m²</> : null}
                      </Text>
                      <Text style={cardPrice}>{p.price}</Text>
                      <Link href={`${base}/property/${p.slug}`} style={viewPropLink}>
                        {tr('common.card_view_property')}
                      </Link>
                    </Column>
                  </Row>
                </Section>
              ))}

            </Container>
          </Section>
        )}

        {/* ── FOOTER ── */}
        <Section style={footer}>
          <Container style={wrap}>
            <Text style={footLogo}>Co-Ownership Property</Text>
            <Section style={footGoldRule} />
            <Text style={footLinks}>
              <Link href={base} style={footLink}>{tr('common.footer_website')}</Link>
              {'  ·  '}
              <Link href={`${base}/our-homes/`} style={footLink}>{tr('common.footer_our_homes')}</Link>
              {'  ·  '}
              <Link href={`${base}/how-it-works/`} style={footLink}>{tr('common.footer_how_it_works')}</Link>
              {'  ·  '}
              <Link href={`${base}/all-our-blog/`} style={footLink}>{tr('common.footer_blog')}</Link>
            </Text>
            <Hr style={footDivider} />
            <Text style={footFine}>
              {tr('floor_plan.footer_fine_print')}
            </Text>
            <Text style={footFine}>
              <Link href="{{unsubscribe_url}}" style={{ color: C.gold, textDecoration: 'none' }}>{tr('common.footer_unsubscribe')}</Link>
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
  padding: '0 20px',
};

const wrapBody: React.CSSProperties = {
  maxWidth: 600,
  margin: '0 auto',
  padding: '0 24px',
};

const heroImg: React.CSSProperties = {
  width: '600px',
  maxWidth: '100%',
  height: 'auto',
  display: 'block',
  margin: '0 auto',
};

// Header
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

// Hero intro
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
  fontSize: 13,
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

// CTA block
const ctaSection: React.CSSProperties = {
  backgroundColor: C.white,
  paddingTop: 40,
  paddingBottom: 52,
};

const ctaLabel: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: '0.2em',
  textTransform: 'uppercase' as const,
  color: C.navy60,
  textAlign: 'center' as const,
  margin: '0 0 18px',
};

const ctaButton: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  backgroundColor: C.navy,
  color: C.white,
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  padding: '18px 48px',
  textDecoration: 'none',
  display: 'inline-block',
};

const ctaSubLink: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 400,
  color: C.navy60,
  textAlign: 'center' as const,
  margin: '16px 0 0',
};

const subtleLink: React.CSSProperties = {
  color: C.gold,
  textDecoration: 'none',
};

// Reply / sign-off
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
  fontSize: 13,
  fontWeight: 400,
  color: C.navy60,
  textAlign: 'center' as const,
  margin: '0 0 48px',
};

const signoffLink: React.CSSProperties = {
  color: C.navy60,
  textDecoration: 'none',
};

// Similar properties
const similarSection: React.CSSProperties = {
  backgroundColor: C.cream,
  paddingTop: 44,
  paddingBottom: 44,
};

const sectionEyebrow: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: '0.22em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 10px',
};

const goldBarLeft: React.CSSProperties = {
  borderColor: C.gold,
  borderTopWidth: 1,
  width: 36,
  margin: '0 0 28px',
};

const propCard: React.CSSProperties = {
  backgroundColor: C.white,
  marginBottom: 12,
  overflow: 'hidden',
};

const cardImgCol: React.CSSProperties = {
  width: 160,
  verticalAlign: 'top',
};

const cardImg: React.CSSProperties = {
  width: 160,
  height: 120,
  objectFit: 'cover' as const,
  display: 'block',
};

const cardImgPlaceholder: React.CSSProperties = {
  width: 160,
  height: 120,
  backgroundColor: C.border,
};

const cardTextCol: React.CSSProperties = {
  verticalAlign: 'top',
  padding: '18px 22px',
};

const locationLabel: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  color: C.gold,
  margin: '0 0 6px',
};

const cardTitle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 16,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 10px',
  lineHeight: '1.4',
};

const cardStats: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 400,
  letterSpacing: '0.08em',
  color: C.navy60,
  margin: '0 0 6px',
};

const cardPrice: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  fontSize: 20,
  fontWeight: 400,
  color: C.navy,
  margin: '0 0 10px',
};

const viewPropLink: React.CSSProperties = {
  fontFamily: "'Jost', Arial, sans-serif",
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: '0.1em',
  color: C.gold,
  textDecoration: 'none',
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
  letterSpacing: '0.1em',
  textAlign: 'center' as const,
  margin: '0 0 4px',
  color: 'rgba(255,255,255,0.4)',
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
