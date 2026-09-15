/**
 * lib/discreetBrochure.js
 *
 * Discreet Sale: unlocking a home from its card sends the person the full
 * brochure by email — hero, price, facts, running cost, the description and
 * every brochure page/photo we hold — in the 9 Sep newsletter design
 * (emails/discreet-brochure.tsx). David, 15 Sep 2026: "a super nice luxury
 * brochure with all the pics, info, desc sent to their email when they
 * unlock". The email also carries their visitor token so "Open the full
 * listing online" opens this and every other discreet home for them.
 * Never names the operator.
 */
import { render } from '@react-email/render';
import DiscreetBrochureEmail from '@/emails/discreet-brochure';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { sendHtml } from '@/lib/resend';
import { formatPrice } from '@/lib/newsletter/personalize';

const FROM     = 'Dylan Olsson <dylan@co-ownership-property.com>';
const REPLY_TO = 'dylan@co-ownership-property.com';
const BASE     = 'https://co-ownership-property.com';

function stripHtml(s) {
  return String(s || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
}

export async function buildDiscreetBrochureProps({ slug, firstName, email, locale = 'en' }) {
  const db = createSupabaseAdminClient();
  const { data: p } = await db.from('properties')
    .select('slug, title, city, region, country, price, currency, beds, size, share_denominator, description, description_ai, amenities, img, email_img, extra_photos, is_discreet')
    .eq('slug', slug).maybeSingle();
  if (!p) return null;
  const { data: f } = await db.from('property_facts')
    .select('monthly_cost, currency, usage_nights, rental_allowed, rental_notes')
    .eq('slug', slug).maybeSingle();

  const extras = Array.isArray(p.extra_photos) ? p.extra_photos.filter(Boolean) : [];
  const spec   = extras.find(u => /\/technical-/.test(u)) || null;
  const pages  = extras.filter(u => !/\/technical-/.test(u));
  const hero   = p.email_img || p.img || '';

  const parts  = String(p.title || '').split(' — ');
  const name   = parts.length > 1 ? parts.slice(1).join(' — ') : (p.title || '');
  const place  = [p.city, p.region].filter(Boolean).join(', ');
  const share  = `1/${p.share_denominator || 8}`;
  const nights = f?.usage_nights || 44;
  const token  = Buffer.from(JSON.stringify({ n: firstName || '', e: email })).toString('base64url');

  const rentalLabel = f?.rental_allowed === true
    ? 'Personal use; letting possible (licence-dependent)'
    : f?.rental_allowed === false ? 'Owners and their guests only' : '';

  // Discreet rows carry a public teaser ("offered through discreet marketing…
  // details on enquiry") as their description and amenities. That is the
  // card's text, not the brochure's — the brochure pages carry the real
  // information, so a teaser is dropped rather than repeated to the reader.
  const teaser = /discreet marketing|details on enquiry|shared privately once you enquire/i;
  const rawDesc = stripHtml(p.description || p.description_ai || '');
  const desc = teaser.test(rawDesc) ? '' : rawDesc;
  const amenities = (Array.isArray(p.amenities) ? p.amenities.map(a => (typeof a === 'string' ? a : a?.name || a?.label || '')).filter(Boolean) : [])
    .filter(a => !teaser.test(a));

  return {
    firstName:    firstName || 'there',
    place,
    name,
    price:        formatPrice(p.price, p.currency),
    beds:         Number(p.beds) || 0,
    size:         p.size ? `${p.size} m²` : '',
    shareLabel:   share,
    daysLabel:    `${nights} nights a year, minimum`,
    monthlyCost:  f?.monthly_cost ? `${formatPrice(f.monthly_cost, f.currency || p.currency)} per month, all in` : '',
    locationLine: [p.city, p.region, p.country].filter(Boolean).join(', '),
    heroUrl:      hero,
    description:  desc,
    amenities:    amenities.slice(0, 18),
    pages,
    specUrl:      spec,
    listingUrl:   `${BASE}/property/${p.slug}/?t=${token}`,
    viewingUrl:   `${BASE}/property/${p.slug}/?t=${token}#enquire`,
    unsubscribeUrl: `${BASE}/unsubscribe`,
    _title: p.title,
  };
}

export async function sendDiscreetBrochure({ to, firstName, slug, locale, contactId, leadId, trackingPixelHtml }) {
  const props = await buildDiscreetBrochureProps({ slug, firstName, email: to, locale });
  if (!props) throw new Error(`discreet brochure: property ${slug} not found`);
  const { _title, ...emailProps } = props;
  let html = await render(DiscreetBrochureEmail({ ...emailProps }));
  if (trackingPixelHtml) html = html.replace('</body>', `${trackingPixelHtml}</body>`);
  const subject = `${props.place.split(',')[0] || props.name} — the full listing, privately`;
  await sendHtml({
    to, subject, html, from: FROM, replyTo: REPLY_TO,
    log: {
      trigger: 'enquiry_submitted', type: 'enquiry_auto', withSend: false,
      contactId: contactId || null, leadId: leadId || null,
      templateName: 'discreet-brochure',
      templateProps: { locale: locale || 'en', pages: props.pages.length, hasSpec: !!props.specUrl },
      propertyTitle: _title || null, propertyUrl: props.listingUrl,
      notes: 'Discreet Sale unlock — full brochure emailed (instant)',
    },
  });
  return { subject };
}
