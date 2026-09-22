import {
  Body, Container, Head, Html, Img, Link, Preview, Section, Text,
} from '@react-email/components';
import * as React from 'react';
import BRAND from '@/lib/email/brand';
import { EmailColorScheme } from './_color-scheme';

/**
 * The gallery-nurture sequence — three emails to someone who asked to see a
 * home's photographs and then went quiet.
 *
 *   Day 1   the numbers behind what they unlocked
 *   Day 4   two homes genuinely like it
 *   Day 10  the offer of an introduction
 *
 * Same design language as the 9 Sep personalised newsletter and the discreet
 * brochure: all serif, ink and one muted gold, hairlines instead of boxes,
 * plenty of air. Nothing here names the operator — COP is the agent, the
 * introduction is the product, and the brand on the email is ours.
 *
 * Every number rendered here has been through lib/nurtureFacts.js, which
 * only passes verified figures. A missing field means the row is left out,
 * never filled with an estimate.
 */

export interface NurtureHome {
  slug: string;
  url: string;
  place: string;            // "Morzine, Portes du Soleil, France"
  name: string;             // "2-Bed Apartment With Mountain Views"
  imageUrl: string;
  shareLabel: string;       // "1/8"
  priceLabel: string;       // "€144,000"
  monthlyCostLabel: string; // "€298 a month"   (empty when not verified)
  costsCovers: string;
  nightsShort: string;      // "44 nights a year, minimum"
  nightsLine: string;
  booking: string;
  resale: string;
  sharesLeft: string;
  // Added 17 Sep 2026 with the four panel shapes.
  panelShape?: 'costs' | 'uncapped' | 'resale' | 'entry';
  resaleStat?: string;
  costsOnAsk?: boolean;       // "5 of 8 shares left"  (empty when stale/unknown)
  verifiedOn: string;       // "5 September 2026"
  beds?: number;
  size?: string;
}

export interface GalleryNurtureProps {
  step?: 'day1' | 'day4' | 'day10';
  firstName?: string;
  homes?: NurtureHome[];        // what they unlocked
  similar?: NurtureHome[];      // day 4 only
  similarLabel?: string;        // "in the mountains, in France" — how the shortlist was found
  similarPrice?: boolean;       // true only when the shortlist really is the same money
  introduceUrl?: string;        // mailto, prefilled — day 10
  browseUrl?: string;
  browseLabel?: string;
  unsubscribeUrl?: string;
}

// Palette and type come from lib/email/brand.js — see the note at the top of
// that file. Nothing about COP's email design is declared in this file.
const C = BRAND;

const base = 'https://co-ownership-property.com';
const DISPLAY = "Didot, 'Didot LT STD', 'Bodoni MT', 'Playfair Display', 'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif";
const TEXT    = "'Poppins','Inter','Helvetica Neue',Helvetica,Arial,sans-serif";

function Rule({ width = 44, color = C.gold }: { width?: number; color?: string }) {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody><tr><td align="center">
        <table width={width} cellPadding="0" cellSpacing="0" role="presentation">
          <tbody><tr><td style={{ backgroundColor: color, height: 1, lineHeight: '1px', fontSize: '1px' }}>&nbsp;</td></tr></tbody>
        </table>
      </td></tr></tbody>
    </table>
  );
}

function crop(url: string, w: number, h: number) {
  if (!url) return url;
  if (url.includes('/storage/v1/object/public/')) {
    return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/') + `?width=${w}&height=${h}&resize=cover&quality=82`;
  }
  return url;
}

/** One fact per hairline row — the brochure's pattern, which David signed off. */
function Fact({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody><tr>
        <td style={{ ...factCell, borderBottom: last ? 'none' : `1px solid ${C.line}` }}>
          <Text style={factLabel}>{label}</Text>
        </td>
        <td align="right" style={{ ...factCell, borderBottom: last ? 'none' : `1px solid ${C.line}` }}>
          <Text style={factValue}>{value}</Text>
        </td>
      </tr></tbody>
    </table>
  );
}

const shortPlace = (h: NurtureHome) => (h.place || '').split(',')[0].trim() || h.name;

function joinNames(homes: NurtureHome[]) {
  const names = homes.map(shortPlace);
  if (names.length <= 1) return names[0] || '';
  return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
}

// ── Day 1: one home, its picture and its numbers ─────────────────────────────
function NumbersBlock({ h, first }: { h: NurtureHome; first: boolean }) {
  return (
    <Section className="pad" style={{ padding: first ? '40px 56px 0' : '52px 56px 0' }}>
      {!first && <div style={{ borderTop: `1px solid ${C.line}`, marginBottom: 44 }} />}
      {h.imageUrl && (
        <Link href={h.url} style={{ color: 'inherit', display: 'block' }}>
          <Img src={crop(h.imageUrl, 1120, 700)} alt={h.name} width="100%" style={heroImg} />
        </Link>
      )}
      <Section style={{ padding: '28px 0 0', textAlign: 'center' as const }}>
        <Text style={placeLine}>{h.place}</Text>
        <Link href={h.url} style={{ color: 'inherit', textDecoration: 'none' }}>
          <Text className="leadtitle" style={leadTitle}>{h.name}</Text>
        </Link>
      </Section>
      <Section style={{ padding: '14px 0 0' }}>
        <Fact label={`A ${h.shareLabel} share`} value={h.priceLabel} />

        {/* ── Four panel shapes, one per operator model. ──
            Only 109 of 270 live homes have a verified running cost, and none
            of Pacaso's 120 do, so a single cost-led panel is thin or empty on
            most of the portfolio. Each shape leads on the strongest true thing
            we hold for that operator. See panelShape() in lib/partnerTerms.js.
            (17 Sep 2026) ── */}

        {h.panelShape === 'costs' && (
          <>
            <Fact label="Running costs" value={h.monthlyCostLabel} />
            <Fact label="Your time there" value={h.nightsShort} />
            {h.sharesLeft
              ? <Fact label="Still available" value={h.sharesLeft} last />
              : (h.beds ? <Fact label="Bedrooms" value={String(h.beds)} last /> : null)}
          </>
        )}

        {h.panelShape === 'uncapped' && (
          <>
            <Fact label="Your time there" value={h.nightsShort} />
            {h.resaleStat ? <Fact label="Resale so far" value={h.resaleStat} /> : null}
            {h.beds ? <Fact label="Bedrooms" value={String(h.beds)} last /> : null}
          </>
        )}

        {h.panelShape === 'resale' && (
          <>
            <Fact label="Your time there" value={h.nightsShort} />
            {h.resaleStat ? <Fact label="Resales in 2025" value={h.resaleStat} /> : null}
            {h.beds ? <Fact label="Bedrooms" value={String(h.beds)} last /> : null}
          </>
        )}

        {h.panelShape === 'entry' && (
          <>
            <Fact label="Your time there" value={h.nightsShort} />
            {h.size ? <Fact label="Size" value={h.size} /> : null}
            {h.beds ? <Fact label="Bedrooms" value={String(h.beds)} last /> : null}
          </>
        )}
      </Section>
      <Section style={{ padding: '22px 0 0' }}>
        <Text style={noteStyle}>
          {h.costsOnAsk
            ? <>Running costs here are {h.costsCovers} They are not published, so the figure comes from the team that runs the house &mdash; say the word and I will ask them for this one.</>
            : <>The monthly figure is {h.costsCovers}{h.verifiedOn ? ` Checked against the operator’s own cost sheet on ${h.verifiedOn}.` : ''}</>}
        </Text>
      </Section>
    </Section>
  );
}

// ── Day 4: a home offered, with its three numbers on one line ────────────────
function OfferCard({ h, lead }: { h: NurtureHome; lead: boolean }) {
  const bits = [h.priceLabel && `${h.priceLabel} per ${h.shareLabel} share`, h.monthlyCostLabel, h.nightsShort]
    .filter(Boolean) as string[];
  if (lead) {
    return (
      <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
        <tbody>
          <tr><td>
            <Link href={h.url} style={{ color: 'inherit', display: 'block' }}>
              <Img src={crop(h.imageUrl, 1120, 720)} alt={h.name} width="100%" style={heroImg} />
            </Link>
          </td></tr>
          <tr><td style={{ padding: '28px 6px 0', textAlign: 'center' as const }}>
            <Text style={placeLineGold}>{h.place}</Text>
            <Link href={h.url} style={{ color: 'inherit', textDecoration: 'none' }}>
              <Text className="leadtitle" style={leadTitle}>{h.name}</Text>
            </Link>
            <Text style={statLine}>{bits.join(' · ')}</Text>
            <Link href={h.url} style={cta}>See the home</Link>
          </td></tr>
        </tbody>
      </table>
    );
  }
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={rowBox}>
      <tbody><tr>
        <td className="rowcell" width="230" style={{ verticalAlign: 'middle', paddingRight: 28 }}>
          <Link href={h.url} style={{ color: 'inherit', display: 'block' }}>
            <Img src={crop(h.imageUrl, 460, 345)} alt={h.name} width="230" className="rowimg" style={rowImg} />
          </Link>
        </td>
        <td className="rowcell rowtext" style={{ verticalAlign: 'middle' }}>
          <Text style={placeLineSm}>{h.place}</Text>
          <Link href={h.url} style={{ color: 'inherit', textDecoration: 'none' }}>
            <Text className="rowtitle" style={rowTitle}>{h.name}</Text>
          </Link>
          <Text style={statLineSm}>{bits.join(' · ')}</Text>
          <Link href={h.url} style={ctaSm}>See the home</Link>
        </td>
      </tr></tbody>
    </table>
  );
}

// ── Day 10: a quiet one-line reminder of what they looked at ─────────────────
function ReminderRow({ h, last }: { h: NurtureHome; last: boolean }) {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" role="presentation">
      <tbody><tr>
        <td width="96" style={{ verticalAlign: 'middle', paddingRight: 20, paddingTop: 14, paddingBottom: 14, borderBottom: last ? 'none' : `1px solid ${C.line}` }}>
          <Link href={h.url} style={{ color: 'inherit', display: 'block' }}>
            <Img src={crop(h.imageUrl, 192, 144)} alt="" width="96" style={{ width: 96, height: 'auto', display: 'block' }} />
          </Link>
        </td>
        <td style={{ verticalAlign: 'middle', paddingTop: 14, paddingBottom: 14, borderBottom: last ? 'none' : `1px solid ${C.line}` }}>
          <Link href={h.url} style={{ color: 'inherit', textDecoration: 'none' }}>
            <Text style={reminderTitle}>{h.name}</Text>
          </Link>
          <Text style={reminderMeta}>{[shortPlace(h), h.priceLabel && `${h.priceLabel} per ${h.shareLabel} share`].filter(Boolean).join(' · ')}</Text>
        </td>
      </tr></tbody>
    </table>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function GalleryNurtureEmail({
  step = 'day1',
  firstName = 'there',
  homes = [],
  similar = [],
  similarLabel = '',
  similarPrice = false,
  introduceUrl = '',
  browseUrl = `${base}/our-homes/`,
  browseLabel = 'See every home',
  unsubscribeUrl = `${base}/unsubscribe`,
}: GalleryNurtureProps) {
  const shown    = homes.slice(0, 3);
  const one      = shown.length === 1;
  const place    = shown.length ? shortPlace(shown[0]) : '';
  const greeting = firstName && firstName !== 'there' ? `Dear ${firstName},` : 'Dear reader,';
  const issue    = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  // One partner's booking calendar cannot describe another's.
  const samePartner = new Set(shown.map(h => h.partner).filter(Boolean)).size <= 1;

  // What we are allowed to claim about the shortlist, in order of weight.
  const many = similar.length > 1;
  const matchBits: string[] = [];
  if (similarLabel) matchBits.push(`${many ? 'both' : 'it is'} ${similarLabel}`);
  if (similarPrice) matchBits.push('at much the same money');
  matchBits.push(many ? 'and both still open' : 'and still open');
  const matchClause = matchBits.join(', ');

  const EYEBROW = { day1: 'The numbers', day4: 'Chosen for you', day10: 'A note from Dylan' }[step];
  const HEADLINE = {
    day1:  one ? `What ${place} actually costs` : 'What they actually cost',
    day4:  one ? `Two more like ${place}` : `Two more you haven’t seen`,
    day10: 'Want me to introduce you?',
  }[step];
  const PREVIEW = {
    day1:  one ? `${place} — the share price, the running costs and the nights` : 'The share price, the running costs and the nights',
    day4:  'The two closest homes we have to the one you looked at',
    day10: 'They can answer things I can\u2019t',
  }[step];

  return (
    <Html lang="en">
      <Head>
        <EmailColorScheme />
        <style>{`
          @media only screen and (max-width: 520px) {
            .rowcell { display: block !important; width: 100% !important; padding: 0 !important; }
            .rowimg { width: 100% !important; height: auto !important; }
            .rowtext { padding-top: 18px !important; text-align: center !important; }
            .pad { padding-left: 22px !important; padding-right: 22px !important; }
            .h1 { font-size: 32px !important; }
            .intro { font-size: 17px !important; }
            .leadtitle { font-size: 27px !important; }
            .rowtitle { font-size: 23px !important; }
            .btn { display: block !important; }
          }
        `}</style>
      </Head>
      <Preview>{PREVIEW}</Preview>

      <Body className="dm-page" style={bodyStyle}>
        <Container style={container}>
        <table width="100%" cellPadding="0" cellSpacing="0" role="presentation" style={sheet}><tbody><tr><td>

          {/* Masthead */}
          <Section className="pad" style={masthead}>
            <Link href={base} style={{ color: 'inherit', textDecoration: 'none' }}>
              <Text style={wordmark}>Co-Ownership Property</Text>
            </Link>
          </Section>

          {/* Headline */}
          <Section className="pad" style={{ padding: '52px 56px 0', textAlign: 'center' as const }}>
            <Text style={issueStyle}>{EYEBROW}&ensp;·&ensp;{issue}</Text>
            <Text className="h1" style={h1}>{HEADLINE}</Text>
            <Rule width={44} />
            <Text style={greetingStyle}>{greeting}</Text>
          </Section>

          {/* ── DAY 1 ─────────────────────────────────────────────────────── */}
          {step === 'day1' && (
            <>
              <Section className="pad" style={{ padding: '0 56px' }}>
                <Text className="intro" style={introStyle}>
                  {one
                    ? <>You went through the photographs of {place} the other day. The numbers behind a home like that usually take three emails and a phone call to prise out of anyone, so here they are, unasked.</>
                    : <>You went through the photographs of {joinNames(shown)} the other day. The numbers behind homes like those usually take three emails and a phone call to prise out of anyone, so here they are, unasked.</>}
                </Text>
              </Section>

              {shown.map((h, i) => <NumbersBlock key={h.slug} h={h} first={i === 0} />)}

              <Section className="pad" style={{ padding: '46px 56px 0' }}>
                <Rule width={44} />
                {samePartner ? (
                  <>
                    {shown[0]?.booking ? (
                      <Text className="intro" style={{ ...introStyle, marginTop: 26 }}>{shown[0].booking}</Text>
                    ) : null}
                    {shown[0]?.resale ? (
                      <Text className="intro" style={{ ...introStyle, marginTop: 20 }}>
                        And when you want out: {shown[0].resale.charAt(0).toLowerCase() + shown[0].resale.slice(1)}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  // Different houses, different teams: the booking calendar and
                  // the resale rules are not the same, and one paragraph cannot
                  // honestly stand for both.
                  <Text className="intro" style={{ ...introStyle, marginTop: 26 }}>
                    Booking and resale work a little differently at each of these — they are run by different teams. The specifics for each are on its own page, and I am glad to talk either of them through.
                  </Text>
                )}
                <Text className="intro" style={{ ...introStyle, marginTop: 20 }}>
                  If something here raises a question — what the peak weeks really look like, what the exit really looks like, whether there is any movement on the price — reply and ask me. I am an agent, not the operator, so I have no reason to varnish the answer.
                </Text>
              </Section>

              <Section className="pad" style={{ padding: '38px 56px 0', textAlign: 'center' as const }}>
                <Link href={shown[0]?.url || browseUrl} className="btn" style={button}>
                  {one ? 'See the full listing' : 'See the listings'}
                </Link>
              </Section>
            </>
          )}

          {/* ── DAY 4 ─────────────────────────────────────────────────────── */}
          {step === 'day4' && (
            <>
              <Section className="pad" style={{ padding: '0 56px' }}>
                <Text className="intro" style={introStyle}>
                  Since you looked at {one ? place : joinNames(shown)},{' '}
                  {similar.length > 1
                    ? 'these are the two closest things we have to it'
                    : 'this is the closest thing we have to it'}
                  {matchClause ? ` — ${matchClause}` : ''}.
                </Text>
              </Section>

              {similar[0] && (
                <Section className="pad" style={{ padding: '42px 56px 0' }}>
                  <OfferCard h={similar[0]} lead />
                </Section>
              )}
              {similar.length > 1 && (
                <Section className="pad" style={{ padding: '46px 56px 0' }}>
                  {similar.slice(1).map(h => <OfferCard key={h.slug} h={h} lead={false} />)}
                </Section>
              )}

              <Section className="pad" style={{ padding: '30px 56px 0' }}>
                <Rule width={44} />
                <Text className="intro" style={{ ...introStyle, marginTop: 26 }}>
                  Neither is a replacement for the one you liked — they are simply what sits closest to it on the shelf. If you tell me what would have made {one ? place : 'one of them'} perfect, I will watch for that instead, and you will hear from me the day it appears.
                </Text>
              </Section>

              <Section className="pad" style={{ padding: '38px 56px 0', textAlign: 'center' as const }}>
                <Link href={browseUrl} className="btn" style={button}>{browseLabel}</Link>
              </Section>
            </>
          )}

          {/* ── DAY 10 ────────────────────────────────────────────────────── */}
          {step === 'day10' && (
            <>
              <Section className="pad" style={{ padding: '0 56px' }}>
                <Text className="intro" style={introStyle}>
                  You looked at {one ? place : joinNames(shown)} a couple of weeks ago, and I haven’t chased you about it since.
                </Text>
                <Text className="intro" style={{ ...introStyle, marginTop: 20 }}>
                  If you’re still thinking about it, the team who run the house can tell you things I can’t: how many shares are left right now, whether the price has moved, what they can do on financing, and whether your dates are still free.
                </Text>
                <Text className="intro" style={{ ...introStyle, marginTop: 20 }}>
                  I’d introduce you properly — who you are, what you’re after — so you skip the form and start at the answers.
                </Text>
              </Section>

              {shown.length > 0 && (
                <Section className="pad" style={{ padding: '40px 56px 0' }}>
                  <Text style={sectionLabelCentred}>{one ? 'The home you looked at' : 'The homes you looked at'}</Text>
                  {shown.map((h, i) => <ReminderRow key={h.slug} h={h} last={i === shown.length - 1} />)}
                </Section>
              )}

              <Section className="pad" style={{ padding: '40px 56px 0', textAlign: 'center' as const }}>
                <Link href={introduceUrl || browseUrl} className="btn" style={button}>Yes, introduce me</Link>
                <Text style={replyNote}>or just reply yes. It comes straight to me.</Text>
              </Section>

              <Section className="pad" style={{ padding: '34px 56px 0' }}>
                <Rule width={44} />
                <Text className="intro" style={{ ...introStyle, marginTop: 26 }}>
                  And if it’s just bad timing, tell me. I’ll keep an eye out and come back when something fits you better.
                </Text>
              </Section>
            </>
          )}

          {/* Sign-off */}
          <Section className="pad" style={{ padding: '46px 70px 8px', textAlign: 'center' as const }}>
            <Text style={signOff}>Dylan Olsson<br /><span style={signRole}>Co-Founder · Co-Ownership Property</span></Text>
          </Section>

          {/* Footer */}
          <Section className="pad" style={footer}>
            <Text style={footMark}>Co-Ownership Property</Text>
            <Text style={footText}>
              <Link href={base} style={footLink}>Website</Link>
              {' · '}
              <Link href={`${base}/our-homes/`} style={footLink}>Our Homes</Link>
              {' · '}
              <Link href={`${base}/how-it-works/`} style={footLink}>How it works</Link>
            </Text>
            <Text style={footSmall}>
              Independent agents for deeded co-ownership homes in Europe and the USA.<br />
              You are receiving this because you asked to see a home&rsquo;s photographs on our site.
              {' '}<Link href={unsubscribeUrl} style={{ color: C.soft, textDecoration: 'underline' }}>Unsubscribe</Link>
            </Text>
          </Section>

        </td></tr></tbody></table>
        </Container>
      </Body>
    </Html>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const bodyStyle: React.CSSProperties = { margin: 0, padding: '30px 0 40px', backgroundColor: C.paper, fontFamily: TEXT };
const container: React.CSSProperties = { maxWidth: 640, margin: '0 auto' };
const sheet: React.CSSProperties = { backgroundColor: C.card, border: `1px solid ${C.line}` };

const masthead: React.CSSProperties = { padding: '46px 56px 40px', textAlign: 'center' as const, borderBottom: `1px solid ${C.line}` };
const wordmark: React.CSSProperties = { fontFamily: TEXT, fontSize: 17, letterSpacing: '0.34em', textTransform: 'uppercase' as const, color: C.ink, margin: 0, paddingLeft: '0.34em', lineHeight: '1.4' };

const issueStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.soft, margin: '0 0 22px' };
const h1: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 40, lineHeight: '1.14', fontWeight: 400, color: C.ink, margin: '0 0 26px' };
const greetingStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 19, color: C.ink, margin: '26px 0 14px' };
const introStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 18, lineHeight: '1.78', color: C.ink, margin: 0 };
const noteStyle: React.CSSProperties = { fontFamily: TEXT, fontSize: 14, lineHeight: '1.75', color: C.soft, margin: 0 };

const heroImg: React.CSSProperties = { width: '100%', maxWidth: '100%', height: 'auto', display: 'block' };

const placeLine: React.CSSProperties = { fontFamily: TEXT, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.soft, margin: '0 0 14px' };
const placeLineGold: React.CSSProperties = { ...placeLine, color: C.gold };
const placeLineSm: React.CSSProperties = { fontFamily: TEXT, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 10px' };
const leadTitle: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 30, lineHeight: '1.25', fontWeight: 400, color: C.ink, margin: '0 0 6px' };
const rowTitle: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 24, lineHeight: '1.3', fontWeight: 400, color: C.ink, margin: '0 0 10px' };

const statLine: React.CSSProperties = { fontFamily: TEXT, fontSize: 17, color: C.ink, margin: '12px 0 20px' };
const statLineSm: React.CSSProperties = { fontFamily: TEXT, fontSize: 15, color: C.ink, margin: 0 };

const factCell: React.CSSProperties = { padding: '15px 0' };
const factLabel: React.CSSProperties = { fontFamily: TEXT, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.soft, margin: 0 };
const factValue: React.CSSProperties = { fontFamily: TEXT, fontSize: 17, color: C.ink, margin: 0, textAlign: 'right' as const };

const rowBox: React.CSSProperties = { borderTop: `1px solid ${C.line}`, paddingTop: 34, marginBottom: 34 };
const rowImg: React.CSSProperties = { width: '100%', height: 'auto', display: 'block' };

const reminderTitle: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 19, lineHeight: '1.3', color: C.ink, margin: '0 0 6px' };
const reminderMeta: React.CSSProperties = { fontFamily: TEXT, fontSize: 13, color: C.soft, margin: 0 };

const cta: React.CSSProperties = { display: 'inline-block', fontFamily: TEXT, fontSize: 13, letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: C.ink, textDecoration: 'none', borderBottom: `1px solid ${C.gold}`, paddingBottom: 7 };
const ctaSm: React.CSSProperties = { display: 'inline-block', fontFamily: TEXT, fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: C.ink, textDecoration: 'none', borderBottom: `1px solid ${C.gold}`, paddingBottom: 6, marginTop: 16 };
const button: React.CSSProperties = { display: 'inline-block', backgroundColor: C.ink, color: '#FFFFFF', fontFamily: TEXT, fontSize: 14, letterSpacing: '0.22em', textTransform: 'uppercase' as const, padding: '20px 40px', textDecoration: 'none' };
const replyNote: React.CSSProperties = { fontFamily: TEXT, fontSize: 17, color: C.soft, margin: '24px 0 0' };

const sectionLabelCentred: React.CSSProperties = { fontFamily: TEXT, fontSize: 12, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.gold, margin: '0 0 10px', textAlign: 'center' as const };

const signOff: React.CSSProperties = { fontFamily: DISPLAY, fontSize: 20, color: C.ink, margin: '20px 0 0', lineHeight: '1.6' };
const signRole: React.CSSProperties = { fontFamily: TEXT, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.soft };

const footer: React.CSSProperties = { padding: '48px 56px 44px', marginTop: 48, borderTop: `1px solid ${C.line}`, textAlign: 'center' as const, backgroundColor: C.paper };
const footMark: React.CSSProperties = { fontFamily: TEXT, fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.ink, margin: '0 0 24px', paddingLeft: '0.3em' };
const footText: React.CSSProperties = { fontFamily: TEXT, fontSize: 13, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: C.ink, margin: '0 0 24px' };
const footLink: React.CSSProperties = { color: C.ink, textDecoration: 'none' };
const footSmall: React.CSSProperties = { fontFamily: TEXT, fontSize: 13, lineHeight: '1.8', color: C.soft, margin: 0 };
