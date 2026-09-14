/**
 * Render the newsletter HTML for one recipient.
 *
 * Picks the right React Email template based on campaign.template_type.
 * Returns { html, subject } ready for Resend.
 */
import { render } from '@react-email/render';
import PersonalisedNewsletter from '@/emails/personalised-newsletter';
import PropertyAlert from '@/emails/property-alert';
import SeasonalSpotlight from '@/emails/seasonal-spotlight';
import ViewingsFrance from '@/emails/viewings-france';
import YearOfWeekends from '@/emails/year-of-weekends';
import { formatPrice } from '@/lib/newsletter/personalize';
import viewingsData from '@/lib/viewings.json';
import { unsubUrl } from '@/lib/unsub';

// 'new-listings-digest' is the pre-September grid ("JUST LISTED / N New
// Properties"). David retired it on 13 Sep 2026 after a preview came out in
// the old design: every new-listings send now uses the 9 Sep personalised
// layout, whichever template a campaign row still names.
const TEMPLATES = {
  'personalised-newsletter': PersonalisedNewsletter,
  'new-listings-digest':     PersonalisedNewsletter,
  // The Discreet Sale release (14 Sep 2026): the same design, announcement
  // wording — see ANNOUNCEMENTS below.
  'discreet-release':        PersonalisedNewsletter,
  'property-alert':          PropertyAlert,
  'seasonal-spotlight':      SeasonalSpotlight,
  'viewings-france':         ViewingsFrance,
  'year-of-weekends':        YearOfWeekends,
};

const base = 'https://co-ownership-property.com';

const WORDS = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty','twenty-one','twenty-two','twenty-three','twenty-four','twenty-five','twenty-six','twenty-seven','twenty-eight','twenty-nine','thirty'];
const numWord = (n) => (n >= 0 && n < WORDS.length ? WORDS[n] : String(n));
const cap = (w) => w.charAt(0).toUpperCase() + w.slice(1);

/**
 * Announcement wording per template. Passed to PersonalisedNewsletter as
 * `announcement`; anything not set keeps the weekly new-listings words.
 * Discreet homes are never advertised anywhere, and the full listing opens
 * only after the reader asks for it (one request unlocks every discreet
 * home — see claude/discreet-sale-unlock.md), so every card says so and the
 * CTA is the unlock, not "Discover".
 */
const ANNOUNCEMENTS = {
  'discreet-release': {
    eyebrow:  'Discreet Sale',
    headline: (n) => `${cap(numWord(n))} home${n === 1 ? '' : 's'}, sold discreetly`,
    intro: (regionStr) => (regionStr ? `Your areas first: ${regionStr}. ` : '') +
      'None of these homes is advertised anywhere else. Each is deeded fractional ownership of the whole home, fully managed between stays, and the full listing — photos, price breakdown, floor plans — opens only on request. One request unlocks them all.',
    homeLabel:   'Discreet Sale',
    placeInTitle: true,
    leadCta:     'Unlock the full listing',
    rowCta:      'Unlock the full listing',
    moreLine:    (more) => `and ${numWord(more)} more, sold discreetly`,
    buttonLabel: (n, more) => (more > 0 ? `View all ${n} discreet homes` : 'View the discreet homes'),
    buttonHref:  `${base}/our-homes/?discreet=1`,
  },
};

/**
 * Replace {{first_name}} / {{region}} merge tags in a string.
 */
export function applyMergeTags(str, { firstName, region, count, topRegion, topPlace } = {}) {
  if (!str) return '';
  const values = {
    first_name: firstName || 'there',
    region:     region || '',
    count:      count != null ? String(count) : '',
    // {{top_region}} / {{top_place}}: the region and town of the reader's
    // lead home when it MATCHED something they looked at — the one place,
    // not the "A, B & more" list — for subjects like "Mallorca — 25 homes
    // released in a discreet sale". Empty when nothing matched, so write a
    // fallback after a pipe: {{top_region|Discreet Sale}}.
    top_region: topRegion || '',
    top_place:  topPlace || topRegion || '',
  };
  return String(str).replace(/\{\{\s*([a-z_]+)\s*(?:\|([^}]*))?\}\}/gi, (m, tag, fallback) => {
    const key = tag.toLowerCase();
    if (!(key in values)) return m;
    const v = values[key];
    return v || (fallback != null ? fallback.trim() : '');
  });
}

/**
 * Turn a property row into the shape the templates expect.
 */
export function toPropertyObj(p, userToken) {
  if (!p) return null;
  const parts = [p.city, p.region, p.country].filter(Boolean);
  const location = [...new Set(parts)].join(', ');
  return {
    slug:       p.slug,
    title:      p.title,
    price:      formatPrice(p.price, p.currency),
    beds:       p.beds || 0,
    size:       p.size || 0,
    imageUrl:   p.email_img || p.img || '',   // email_img = a photo of the home itself (David, 14 Sep 2026)
    location,
    country:    p.country || '',
    city:       p.city || '',
    regionTag:  p.region || p.city || null,
    // Where "Discover the home" lands. The listing page, not the gallery
    // (David, 9 Sep 2026): the reader wants the whole home — description,
    // amenities, floor plans, price — and opens the photo gallery, or the
    // discreet-sale unlock, from there. The ?t= token still names them, so
    // the enquiry form is pre-filled and a discreet home they have already
    // enquired on opens straight away.
    galleryUrl: userToken
      ? `${base}/property/${p.slug}/?t=${userToken}`
      : `${base}/property/${p.slug}/`,
    isNew:      true,
  };
}

/**
 * Build the userToken used to pre-fill the visitor's name+email on the gallery page.
 */
export function buildUserToken(firstName, email) {
  return Buffer.from(JSON.stringify({
    n: firstName && firstName !== 'there' ? firstName : '',
    e: email,
  })).toString('base64url');
}

/**
 * Render a single recipient's email.
 *
 * @param {object} opts
 * @param {string} opts.templateType  — campaign.template_type
 * @param {string} opts.firstName
 * @param {string} opts.email
 * @param {Array}  opts.primaryProps  — array of property rows from supabase
 * @param {Array}  opts.fallbackProps — array of property rows
 * @param {string} opts.subjectTemplate — raw subject with merge tags
 * @param {string} opts.introText     — raw intro text with merge tags (passed to template)
 * @returns {Promise<{html: string, subject: string}>}
 */
export async function renderRecipient({
  templateType,
  firstName,
  email,
  primaryProps,
  fallbackProps,
  subjectTemplate,
  introText,
}) {
  const Template = TEMPLATES[templateType] || PersonalisedNewsletter;
  const userToken = buildUserToken(firstName, email);

  const primary  = (primaryProps  || []).map(p => toPropertyObj(p, userToken)).filter(Boolean);
  const fallback = (fallbackProps || []).map(p => toPropertyObj(p, userToken)).filter(Boolean);

  const allProps = [...primary, ...fallback];
  const regions = [...new Set(allProps.map(p => p.regionTag || p.location?.split(',')[0]).filter(Boolean))];
  const topRegions = regions.slice(0, 3);
  // When there are more regions than we name, list the shown ones
  // comma-separated and close with "& more" (e.g. "Mallorca, Ibiza,
  // Wyoming & more") instead of silently dropping the rest — the
  // trailing "& more" is the honest signal that the email holds more
  // than the named regions. With 3 or fewer, the normal "A, B & C".
  const moreRegions = regions.length > topRegions.length;
  const regionStr = moreRegions
    ? topRegions.join(', ') + ' & more'
    : topRegions.length > 1
      ? topRegions.slice(0, -1).join(', ') + ' & ' + topRegions[topRegions.length - 1]
      : topRegions[0] || '';

  // Number of items the recipient will actually see — for the {{count}} merge tag.
  let displayCount = allProps.length;
  if (templateType === 'property-alert' || templateType === 'seasonal-spotlight') {
    displayCount = Math.min(allProps.length, 4);
  } else if (templateType === 'viewings-france') {
    const today = new Date().toISOString().slice(0, 10);
    displayCount = viewingsData.filter(v => !v.date || v.date >= today).length;
  }

  // Only a matched home names the reader's place; with no match the tags are
  // empty and the subject's fallback text is used.
  const topRegion = primary[0]?.regionTag || '';
  const topPlace  = primary[0]?.city || topRegion;
  const tags = { firstName, region: regionStr, count: displayCount, topRegion, topPlace };

  const finalSubject = subjectTemplate
    ? applyMergeTags(subjectTemplate, tags)
    : (firstName !== 'there'
        ? (regionStr ? `${firstName} — ${regionStr}` : `${firstName}, properties selected for you`)
        : (regionStr ? `Properties in ${regionStr}` : 'Your personalised property selection'));

  const finalIntro = introText
    ? applyMergeTags(introText, tags)
    : null;

  // MUST be the tokenised link. /api/unsubscribe rejects any request without a
  // valid HMAC, and /unsubscribe shows a "this link came from an older email"
  // dead end for the tokenless `?email=` form — so the footer link in the four
  // newsletters sent through /api/admin/ui/newsletter-send between 20 May and
  // 7 Jul 2026 (2,241 emails to 723 people) did not actually unsubscribe
  // anyone. Two people had to email a human to get off the list instead.
  //
  // The 30 Apr campaign is NOT in that range: it was drained by prepare.js +
  // /api/admin/newsletter/send, which already built the tokenised link.
  const unsubscribeUrl = unsubUrl(email);

  // Pick props per template
  let templateProps;
  if (templateType === 'property-alert') {
    templateProps = {
      firstName,
      properties: allProps.slice(0, 4),
      unsubscribeUrl,
    };
  } else if (templateType === 'seasonal-spotlight') {
    templateProps = {
      firstName,
      properties: allProps.slice(0, 4),
      unsubscribeUrl,
    };
  } else if (templateType === 'viewings-france') {
    // Viewings template ignores the per-recipient property list — the calendar
    // of viewings is the same for everyone and lives in lib/viewings.json.
    // We hide past dated viewings here, same logic as the /viewings/ page.
    // Note: img URLs in viewings.json already mirror each property's live hero
    // (see scripts/update-viewings-imgs.js if you ever want to refresh them).
    const today = new Date().toISOString().slice(0, 10);
    const viewings = viewingsData
      .filter(v => !v.date || v.date >= today)
      .map(v => ({
        id: v.id,
        propertySlug: v.propertySlug,
        displayName: v.displayName,
        city: v.city,
        region: v.region,
        country: v.country,
        dateLabel: v.dateLabel,
        price: formatPrice(v.price, v.currency),
        share: v.share,
        imageUrl: v.img,
        blurb: v.blurb,
        tour: v.tour,
      }));
    templateProps = {
      firstName,
      intro: finalIntro,
      viewings,
      recipientEmail: email,
      unsubscribeUrl,
    };
  } else if (templateType === 'year-of-weekends') {
    // Calendar edition: order carries the story (one home per month), so the
    // campaign should run with personalize_by_region OFF. Month copy lives in
    // the template's NOTES map, keyed by slug.
    templateProps = {
      firstName,
      properties: allProps,
      unsubscribeUrl,
    };
  } else {
    templateProps = {
      firstName,
      primaryProperties:  primary,
      fallbackProperties: fallback,
      unsubscribeUrl,
      introOverride: finalIntro,
      announcement: ANNOUNCEMENTS[templateType] || null,
    };
  }

  const html = await render(Template(templateProps));
  return { html, subject: finalSubject };
}
