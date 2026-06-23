/**
 * Render the newsletter HTML for one recipient.
 *
 * Picks the right React Email template based on campaign.template_type.
 * Returns { html, subject } ready for Resend.
 */
import { render } from '@react-email/render';
import PersonalisedNewsletter from '@/emails/personalised-newsletter';
import NewListingsDigest from '@/emails/new-listings-digest';
import PropertyAlert from '@/emails/property-alert';
import SeasonalSpotlight from '@/emails/seasonal-spotlight';
import ViewingsFrance from '@/emails/viewings-france';
import { formatPrice } from '@/lib/newsletter/personalize';
import viewingsData from '@/lib/viewings.json';

const TEMPLATES = {
  'personalised-newsletter': PersonalisedNewsletter,
  'new-listings-digest':     NewListingsDigest,
  'property-alert':          PropertyAlert,
  'seasonal-spotlight':      SeasonalSpotlight,
  'viewings-france':         ViewingsFrance,
};

const base = 'https://co-ownership-property.com';

/**
 * Replace {{first_name}} / {{region}} merge tags in a string.
 */
export function applyMergeTags(str, { firstName, region, count } = {}) {
  if (!str) return '';
  return String(str)
    .replace(/\{\{\s*first_name\s*\}\}/gi, firstName || 'there')
    .replace(/\{\{\s*region\s*\}\}/gi, region || '')
    .replace(/\{\{\s*count\s*\}\}/gi, count != null ? String(count) : '');
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
    imageUrl:   p.img || '',
    location,
    country:    p.country || '',
    regionTag:  p.region || p.city || null,
    galleryUrl: userToken
      ? `${base}/gallery/${p.slug}?t=${userToken}`
      : `${base}/property/${p.slug}`,
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
  const regionStr = topRegions.length > 1
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

  const finalSubject = subjectTemplate
    ? applyMergeTags(subjectTemplate, { firstName, region: regionStr, count: displayCount })
    : (firstName !== 'there'
        ? (regionStr ? `${firstName} — ${regionStr}` : `${firstName}, properties selected for you`)
        : (regionStr ? `Properties in ${regionStr}` : 'Your personalised property selection'));

  const finalIntro = introText
    ? applyMergeTags(introText, { firstName, region: regionStr, count: displayCount })
    : null;

  const unsubscribeUrl = `${base}/unsubscribe?email=${encodeURIComponent(email)}`;

  // Pick props per template
  let templateProps;
  if (templateType === 'new-listings-digest') {
    templateProps = {
      newPropertyCount: allProps.length,
      properties: allProps,
      unsubscribeUrl,
    };
  } else if (templateType === 'property-alert') {
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
  } else {
    templateProps = {
      firstName,
      primaryProperties:  primary,
      fallbackProperties: fallback,
      unsubscribeUrl,
      introOverride: finalIntro,
    };
  }

  const html = await render(Template(templateProps));
  return { html, subject: finalSubject };
}
