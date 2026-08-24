import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { upsertContact, createLead, createEmailSend, logActivity, trackingPixel, incrementScore, enrichContactIntelligence } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { isHoneypotFilled } from '@/lib/honeypot';
import { sendTeamNotification, cancelPendingSequence } from '@/lib/resend';
import { handleEnquiryFollowups } from '@/lib/followupSequence';
import { expandRegions } from '@/lib/regionMap';
import { sendEnquiryReply } from '@/lib/enquiryReply';
import { t, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n';
import { createPartnerReferral } from '@/lib/partnerReferrals';

function getDb() {
  return createSupabaseAdminClient();
}

function cleanPropertySlug(value) {
  if (!value) return null;
  const slug = String(value).trim().slice(0, 220);
  return /^[A-Za-z0-9][A-Za-z0-9_-]*$/.test(slug) ? slug : null;
}

function propertySlugFromUrl(value) {
  if (!value) return null;
  try {
    const parsed = new URL(String(value), 'https://co-ownership-property.com');
    const parts = parsed.pathname.split('/').filter(Boolean);
    const propertyIndex = parts.indexOf('property');
    return propertyIndex >= 0 ? cleanPropertySlug(decodeURIComponent(parts[propertyIndex + 1] || '')) : null;
  } catch (_) {
    return null;
  }
}

async function resolveEnquiryProperty({ propertySlug, propertyTitle, propertyUrl }) {
  const db = getDb();
  const requestedSlug = cleanPropertySlug(propertySlug) || propertySlugFromUrl(propertyUrl);
  const fields = 'slug,title,region,city,status,img,drive_url';

  if (requestedSlug) {
    const { data, error } = await db.from('properties').select(fields).eq('slug', requestedSlug).maybeSingle();
    if (error) throw error;
    if (data) return data;
  }

  if (propertyTitle) {
    const { data, error } = await db
      .from('properties')
      .select(fields)
      .eq('title', String(propertyTitle).trim())
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  return null;
}

function safeUrl(value) {
  if (!value) return null;
  try {
    const parsed = new URL(String(value), 'https://co-ownership-property.com');
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href.slice(0, 1200) : null;
  } catch (_) { return null; }
}

function normalizeAttribution(raw, request) {
  const value = raw && typeof raw === 'object' ? raw : {};
  const landingUrl = safeUrl(value.landingUrl);
  const referrerUrl = safeUrl(value.referrerUrl || request.headers.referer);
  const firstVisitedAt = Number.isFinite(Date.parse(value.firstVisitedAt)) ? new Date(value.firstVisitedAt).toISOString() : null;
  let source = String(value.utmSource || '').trim().slice(0, 120) || null;
  if (!source && referrerUrl) {
    try { source = new URL(referrerUrl).hostname.replace(/^www\./, '').slice(0, 120); }
    catch (_) {}
  }
  return { firstVisitedAt, landingUrl, referrerUrl, source };
}

/**
 * Parse min + max from a budget string like "200-350k", "500k-1m", "1m+", "Under 100k".
 * Returns { min, max } — either may be null if not determinable.
 */
function parseBudgetRange(budget) {
  if (!budget) return { min: null, max: null };
  const s = budget.toLowerCase().replace(/,/g, '').replace(/\s/g, '');

  const toNum = (n, suffix) => {
    const v = parseFloat(n);
    if (suffix === 'm') return Math.round(v * 1_000_000);
    if (suffix === 'k') return Math.round(v * 1_000);
    return v > 5000 ? v : Math.round(v * 1_000);
  };

  const matches = [...s.matchAll(/(\d+(?:\.\d+)?)(k|m)?/g)];
  if (!matches.length) return { min: null, max: null };

  const nums = matches.map(m => toNum(m[1], m[2]));

  // "1m+" or "500k+" style → min only
  if (s.includes('+')) return { min: Math.min(...nums), max: null };
  // "under X" or single number → max only
  if (s.startsWith('under') || nums.length === 1) return { min: null, max: Math.max(...nums) };
  // Range: lower is min, higher is max
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

/**
 * Fetch up to 3 Live properties matching the enquiry's destination + budget.
 * destination is a raw string like "South of France; Miami" — split on ; / ,
 */
/**
 * Fetch up to 6 Live properties matching the enquiry's destination + budget.
 *
 * Distribution strategy:
 *   - Split destination into individual region labels (e.g. "French Alps; Italian Lakes")
 *   - Query each region separately and aim for an even split (e.g. 3/3 for 2 regions)
 *   - If a region comes up short, backfill from other regions that have extras
 *   - Result is deduplicated and capped at 6
 */
async function getMatchingProperties(destination, budget) {
  const db = getDb();
  const FIELDS = 'slug, title, img, price, currency, beds, size, city, country, region';
  const TOTAL = 6;

  const rawLabels = destination
    ? destination.split(/[;,\/]/).map(r => r.trim()).filter(Boolean)
    : [];

  const { min: minPrice, max: maxPrice } = parseBudgetRange(budget);

  const applyBudget = (q) => {
    if (minPrice) q = q.gte('price', minPrice);
    if (maxPrice) q = q.lte('price', maxPrice);
    return q;
  };

  // No destination — return cheapest TOTAL live properties within budget
  if (rawLabels.length === 0) {
    let q = db.from('properties').select(FIELDS).eq('status', 'Live').order('price', { ascending: true });
    q = applyBudget(q);
    const { data } = await q.limit(TOTAL);
    return data || [];
  }

  // Query each region label separately (generous limit so backfill has options)
  const perRegion = await Promise.all(
    rawLabels.map(async label => {
      const dbTerms = expandRegions([label]);
      const orParts = dbTerms.flatMap(t => [
        `country.ilike.%${t}%`,
        `region.ilike.%${t}%`,
        `city.ilike.%${t}%`,
      ]);
      let q = db.from('properties').select(FIELDS).eq('status', 'Live').order('price', { ascending: true });
      q = applyBudget(q);
      q = q.or(orParts.join(','));
      const { data } = await q.limit(TOTAL);
      return data || [];
    })
  );

  // Distribute evenly: take fairShare from each region first, then backfill
  const n = perRegion.length;
  const fairShare = Math.ceil(TOTAL / n);
  const seen = new Set();
  const result = [];
  const extras = []; // leftover from regions that had more than their share

  for (const props of perRegion) {
    let taken = 0;
    for (const p of props) {
      if (seen.has(p.slug)) continue;
      if (taken < fairShare) {
        result.push(p);
        seen.add(p.slug);
        taken++;
      } else {
        extras.push(p); // available for backfill
      }
    }
  }

  // Backfill with extras if total < TOTAL
  for (const p of extras) {
    if (result.length >= TOTAL) break;
    if (!seen.has(p.slug)) {
      result.push(p);
      seen.add(p.slug);
    }
  }

  return result.slice(0, TOTAL);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Honeypot — bots fill hidden fields. Silently accept (no email, no CRM) so
  // the bot sees a normal success response and does not retry or adapt.
  if (isHoneypotFilled(req.body)) return res.status(200).json({ ok: true });

  const { name, email, phone, message, property, propertySlug, url, destination, budget, enquiryType, attribution: rawAttribution, locale: rawLocale } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });
  const isCollectionEnquiry = enquiryType === 'collection';

  // Locale handling — validates against SUPPORTED_LOCALES, falls back to default ('en')
  const locale = SUPPORTED_LOCALES.includes(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const subjectKey = property
    ? 'emails.enquiry_autoreply.subject_property'
    : 'emails.enquiry_autoreply.subject_general';
  const subjectLine = t(subjectKey, locale).replace('{propertyTitle}', property || '');

  // Rate limit: max 3 enquiries from same email in 5 minutes
  const { limited } = await checkRateLimit(email, 'enquiry');
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  // ── Parse name ──────────────────────────────────────────────────────────────
  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName  = nameParts.slice(1).join(' ') || null;
  const attribution = normalizeAttribution(rawAttribution, req);

  // Resolve the authoritative COP listing before creating the lead. Property
  // forms send the slug directly; the public URL and exact title are retained
  // as fallbacks for older forms and imported enquiries.
  let resolvedProperty = null;
  if (!isCollectionEnquiry && (propertySlug || url || property)) {
    try {
      resolvedProperty = await resolveEnquiryProperty({ propertySlug, propertyTitle: property, propertyUrl: url });
    } catch (e) {
      console.error('[enquiry] property resolution failed:', e.message);
    }
  }

  // ── CRM: upsert contact + create lead + score ───────────────────────────────
  let contact   = null;
  let lead      = null;
  let emailSend = null;

  try {
    contact = await upsertContact({ email, firstName, lastName, phone, source: 'website_enquiry', locale });
    contact = await enrichContactIntelligence({ contact, email, phone, request: req });

    if (contact) {
      // +20 points for submitting an enquiry
      await incrementScore(contact.id, 20);

      lead = await createLead({
        contactId:     contact.id,
        propertySlug:  resolvedProperty?.slug || null,
        propertyTitle: property     || null,
        mainRegion:    destination  || resolvedProperty?.region || null,
        subregion:     resolvedProperty?.city || null,
        message:       message      || null,
        budget:        budget       || null,
        attribution,
        enquiryPageUrl: safeUrl(url || req.headers.referer),
      });

      emailSend = await createEmailSend({
        contactId:     contact.id,
        leadId:        lead?.id || null,
        type:          'enquiry_auto',
        subject:       subjectLine,
        toEmail:       email,
        propertyTitle: property || null,
        propertyUrl:   url     || null,
      });

      await logActivity({
        contactId:   contact.id,
        leadId:      lead?.id || null,
        type:        'enquiry_submitted',
        description: `${isCollectionEnquiry ? 'Collection enquiry' : 'Enquiry'} submitted${property ? ` for ${property}` : ''}`,
        metadata:    { property, propertySlug: resolvedProperty?.slug || null, url, destination, budget, message, attribution, enquiryType: isCollectionEnquiry ? 'collection' : (property ? 'property' : 'general') },
      });

      // Collection enquiries queue a partner referral for manual review in the
      // Admin Partner Hub (never auto-sent to the partner). Helper never throws.
      if (isCollectionEnquiry) {
        await createPartnerReferral({
          contactId: contact.id,
          leadId:    lead?.id || null,
          source:    'collection_enquiry',
          payload:   { name, email, phone, collection: property || null, destination, budget, message, url, locale },
        });
      }
    }
  } catch (e) {
    console.error('[CRM] enquiry CRM write failed:', e.message);
  }

  // ── Look up property image + drive URL from DB ────────────────────────────
  let propertyImg = null;
  let driveUrl    = null;
  // Never attach a hidden/staged row's image or Drive gallery to an outbound
  // email (19 Jul incident) — sold is fine, they enquired.
  if (resolvedProperty && ['Live', 'for_sale', 'sold'].includes(resolvedProperty.status)) {
    propertyImg = resolvedProperty.img || null;
    driveUrl = resolvedProperty.drive_url || null;
  }

  // ── Fetch matching properties for general enquiries ────────────────────────
  let matchingProperties = [];
  if (!property && (destination || budget)) {
    try {
      const raw = await getMatchingProperties(destination, budget);
      matchingProperties = raw.map(p => {
        const sym   = { EUR: '\u20ac', USD: '$', GBP: '\u00a3' }[p.currency] || '\u20ac';
        const price = p.price ? `${sym}${Number(p.price).toLocaleString('en-GB')}` : '';
        return {
          title:    p.title,
          price,
          beds:     p.beds  || 0,
          size:     p.size  || 0,
          slug:     p.slug,
          imageUrl: p.img   || undefined,
        };
      });
    } catch (e) {
      console.error('[enquiry] matching properties lookup failed:', e.message);
    }
  }

  // ── Send team notification (always immediate — internal only) ───────────────
  try {
    await sendTeamNotification({
      subject: `New ${isCollectionEnquiry ? 'Collection ' : ''}Enquiry${property ? ` — ${property}` : ''} from ${name}`,
      html: `
        <h2>New ${isCollectionEnquiry ? 'Collection ' : ''}Enquiry</h2>
        ${property ? `<p><strong>${isCollectionEnquiry ? 'Collection' : 'Property'}:</strong> ${property}${url ? ` — <a href="${url}">${url}</a>` : ''}</p>` : ''}
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
        ${destination ? `<p><strong>Destinations:</strong> ${destination}</p>` : ''}
        ${budget ? `<p><strong>Budget:</strong> ${budget}</p>` : ''}
        <p><strong>Message:</strong> ${message || 'No message'}</p>
      `,
    });
  } catch (e) {
    console.error('[Mail] team notification failed:', e.message);
  }

  // ── Auto-reply to the lead — a short personal note from Dylan ──────────────
  // Sent immediately via Resend (same plain style as the gallery follow-up).
  try {
    const pixel = emailSend?.tracking_id ? trackingPixel(emailSend.tracking_id) : '';

    await sendEnquiryReply({
      to:                email,
      firstName:         firstName || name || null,
      propertyTitle:     property  || null,
      propertyUrl:       url       || null,
      locale,
      trackingPixelHtml: pixel,
    });

    if (contact && emailSend) {
      await logActivity({
        contactId:   contact.id,
        leadId:      lead?.id || null,
        type:        'email_sent',
        description: `Auto-reply sent to ${email}`,
        metadata:    { email_send_id: emailSend.id, type: 'enquiry_auto' },
      });
    }
  } catch (e) {
    console.error('[Mail] enquiry auto-reply failed:', e.message);
  }

  // ── Cancel any pending welcome / legacy nurture sequence ───────────────────
  // An enquiry supersedes the newsletter welcome series and any older nurture
  // emails still queued from before the chasers were retired. The day 3/7/14
  // nurture sequence is no longer created here — follow-ups are handled
  // separately (see docs/email-automation-blueprint.md).
  if (contact?.id) {
    try {
      await cancelPendingSequence(contact.id, 'welcome');
      await cancelPendingSequence(contact.id, 'nurture');
    } catch (e) {
      console.error('[Mail] cancel sequences failed:', e.message);
    }
  }

  // ── Follow-up sequences: an enquiry cancels every pending gallery_nurture
  // email. (The Day-7 "did the team look after you?" check-in is disabled —
  // see lib/followupSequence.js scheduleEnquiryCheckD7, kept dormant until
  // the CRM has a sent_to_partner handoff signal.)
  try {
    await handleEnquiryFollowups({
      contactId:     contact?.id || null,
      leadId:        lead?.id    || null,
      email,
      firstName:     firstName || name || null,
      locale,
      propertyTitle: property || null,
      propertyUrl:   url      || null,
    });
  } catch (e) {
    console.error('[Mail] follow-up sequence handling failed:', e.message);
  }

  res.status(200).json({ ok: true });
}
