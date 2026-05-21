import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { upsertContact, createLead, createEmailSend, logActivity, trackingPixel, incrementScore } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { isHoneypotFilled } from '@/lib/honeypot';
import { queueEmail, sendTeamNotification, cancelPendingSequence } from '@/lib/resend';
import { expandRegions } from '@/lib/regionMap';
import { sendEnquiryReply } from '@/lib/enquiryReply';
import NurtureDay3  from '@/emails/nurture-day3';
import NurtureDay7  from '@/emails/nurture-day7';
import NurtureDay14 from '@/emails/nurture-day14';
import { t, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n';
import * as React from 'react';

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function getDb() {
  return createSupabaseAdminClient();
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

  const { name, email, phone, message, property, url, destination, budget, locale: rawLocale } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

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

  // ── CRM: upsert contact + create lead + score ───────────────────────────────
  let contact   = null;
  let lead      = null;
  let emailSend = null;

  try {
    contact = await upsertContact({ email, firstName, lastName, phone, source: 'website_enquiry', locale });

    if (contact) {
      // +20 points for submitting an enquiry
      await incrementScore(contact.id, 20);

      lead = await createLead({
        contactId:     contact.id,
        propertyTitle: property     || null,
        mainRegion:    destination  || null,
        message:       message      || null,
        budget:        budget       || null,
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
        description: `Enquiry submitted${property ? ` for ${property}` : ''}`,
        metadata:    { property, url, destination, budget, message },
      });
    }
  } catch (e) {
    console.error('[CRM] enquiry CRM write failed:', e.message);
  }

  // ── Look up property image + drive URL from DB ────────────────────────────
  let propertyImg = null;
  let driveUrl    = null;
  if (url) {
    try {
      const slug = url.replace(/https?:\/\/[^/]+\/property\//, '').replace(/\/$/, '') || null;
      if (slug) {
        const db = getDb();
        const { data: prop } = await db
          .from('properties')
          .select('img, drive_url')
          .eq('slug', slug)
          .single();
        propertyImg = prop?.img       || null;
        driveUrl    = prop?.drive_url || null;
      }
    } catch (e) {
      console.error('[enquiry] property lookup failed:', e.message);
    }
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
      subject: `New Enquiry${property ? ` — ${property}` : ''} from ${name}`,
      html: `
        <h2>New Enquiry</h2>
        ${property ? `<p><strong>Property:</strong> ${property}${url ? ` — <a href="${url}">${url}</a>` : ''}</p>` : ''}
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

  // ── Nurture sequence (property enquiries only) ─────────────────────────────
  // Cancel any pending welcome or existing nurture sequences —
  // prevents duplicates if someone enquires multiple times
  if (contact?.id) {
    try {
      await cancelPendingSequence(contact.id, 'welcome');
      await cancelPendingSequence(contact.id, 'nurture');
    } catch (e) {
      console.error('[Mail] cancel sequences failed:', e.message);
    }
  }

  if (property) {
    const unsubscribeUrl = `https://co-ownership-property.com/unsubscribe/?email=${encodeURIComponent(email)}`;
    const nurtureProps = {
      firstName:     firstName || undefined,
      propertyTitle: property  || undefined,
      propertyUrl:   url       || undefined,
      unsubscribeUrl,
      locale,
    };

    // Day 3
    try {
      await queueEmail({
        to:           email,
        subject:      property
          ? t('emails.nurture_day3.subject_property', locale).replace('{propertyTitle}', property)
          : t('emails.nurture_day3.subject_general', locale),
        template:     React.createElement(NurtureDay3, nurtureProps),
        templateName:  'nurture-day3',
        templateProps: { firstName, propertyTitle: property, propertyUrl: url, locale },
        trigger:       'enquiry_submitted',
        notes:         `Nurture sequence — Day 3${property ? ` for ${property}` : ''}`,
        contactId:     contact?.id || null,
        leadId:        lead?.id    || null,
        sendAfter:     daysFromNow(3),
        sequenceType:  'nurture',
      });
    } catch (e) {
      console.error('[Mail] nurture-day3 queue failed:', e.message);
    }

    // Day 7
    try {
      // Extract destination from property title for subject + template
      const day7Destination = property && property.includes(',')
        ? property.split(',')[1]?.trim().split('—')[0]?.trim()
        : null;
      await queueEmail({
        to:           email,
        subject:      day7Destination
          ? t('emails.nurture_day7.subject', locale).replace('{destinationName}', day7Destination)
          : t('emails.nurture_day7.subject_general', locale),
        template:     React.createElement(NurtureDay7, { ...nurtureProps, destinationName: day7Destination || undefined }),
        templateName:  'nurture-day7',
        templateProps: { firstName, propertyTitle: property, propertyUrl: url, locale },
        trigger:       'enquiry_submitted',
        notes:         `Nurture sequence — Day 7${property ? ` for ${property}` : ''}`,
        contactId:     contact?.id || null,
        leadId:        lead?.id    || null,
        sendAfter:     daysFromNow(7),
        sequenceType:  'nurture',
      });
    } catch (e) {
      console.error('[Mail] nurture-day7 queue failed:', e.message);
    }

    // Day 14
    try {
      await queueEmail({
        to:           email,
        subject:      t('emails.nurture_day14.subject', locale),
        template:     React.createElement(NurtureDay14, nurtureProps),
        templateName:  'nurture-day14',
        templateProps: { firstName, propertyTitle: property, propertyUrl: url, locale },
        trigger:       'enquiry_submitted',
        notes:         `Nurture sequence — Day 14${property ? ` for ${property}` : ''}`,
        contactId:     contact?.id || null,
        leadId:        lead?.id    || null,
        sendAfter:     daysFromNow(14),
        sequenceType:  'nurture',
      });
    } catch (e) {
      console.error('[Mail] nurture-day14 queue failed:', e.message);
    }
  }

  res.status(200).json({ ok: true });
}
