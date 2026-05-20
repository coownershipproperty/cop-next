import { createClient } from '@supabase/supabase-js';
import { upsertContact, createLead, createEmailSend, logActivity, trackingPixel, incrementScore } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { isHoneypotFilled } from '@/lib/honeypot';
import { queueEmail, sendTeamNotification } from '@/lib/resend';
import { render } from '@react-email/components';
import FloorPlanEmail from '@/emails/floor-plan';
import NurtureFloorPlan from '@/emails/nurture-floor-plan';
import { t, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n';
import * as React from 'react';

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

/**
 * Fetch up to 3 similar properties.
 * Strategy:
 *   1. Same city + price within ±40%  (up to 3)
 *   2. Same country + price within ±40%, excluding already picked  (backfill to 3)
 *   3. Same country, any price, excluding already picked  (last resort)
 */
async function getSimilarProperties(propertySlug, propertyCountry, propertyCity, propertyPrice) {
  if (!propertyCountry) return [];
  const db = getDb();
  const exclude = propertySlug || '';
  const FIELDS = 'slug, title, img, price, currency, beds, size, city';
  const STATUSES = ['Live'];

  let results = [];

  // ── Pass 1: same city, ±40% price ────────────────────────────────────────
  if (propertyCity) {
    let q = db
      .from('properties')
      .select(FIELDS)
      .eq('country', propertyCountry)
      .ilike('city', `%${propertyCity}%`)
      .neq('slug', exclude)
      .in('status', STATUSES);

    if (propertyPrice) {
      const lo = Math.round(propertyPrice * 0.6);
      const hi = Math.round(propertyPrice * 1.4);
      q = q.gte('price', lo).lte('price', hi);
    }

    const { data } = await q.limit(3);
    results = data || [];
  }

  // ── Pass 2: same country, ±40% price, backfill ───────────────────────────
  if (results.length < 3 && propertyPrice) {
    const alreadyIn = new Set([exclude, ...results.map(p => p.slug)]);
    const lo = Math.round(propertyPrice * 0.6);
    const hi = Math.round(propertyPrice * 1.4);
    const { data } = await db
      .from('properties')
      .select(FIELDS)
      .eq('country', propertyCountry)
      .gte('price', lo)
      .lte('price', hi)
      .in('status', STATUSES)
      .limit(10);

    for (const p of (data || [])) {
      if (!alreadyIn.has(p.slug)) {
        results.push(p);
        alreadyIn.add(p.slug);
        if (results.length >= 3) break;
      }
    }
  }

  // ── Pass 3: same country, any price ─────────────────────────────────────
  if (results.length < 3) {
    const alreadyIn = new Set([exclude, ...results.map(p => p.slug)]);
    const { data } = await db
      .from('properties')
      .select(FIELDS)
      .eq('country', propertyCountry)
      .in('status', STATUSES)
      .limit(10);

    for (const p of (data || [])) {
      if (!alreadyIn.has(p.slug)) {
        results.push(p);
        if (results.length >= 3) break;
      }
    }
  }

  return results.slice(0, 3);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Honeypot — bots fill hidden fields. Silently accept (no email, no CRM) so
  // the bot sees a normal success response and does not retry or adapt.
  if (isHoneypotFilled(req.body)) return res.status(200).json({ ok: true });

  const { name, email, phone, propertyTitle, driveUrl, propertyUrl, propertyCountry, locale: rawLocale } = req.body;
  if (!email || !driveUrl) return res.status(400).json({ error: 'Missing fields' });

  // Resolve locale — only accept supported values, default to English
  const locale = SUPPORTED_LOCALES.includes(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  const subjectPrefix = t('emails.floor_plan.subject_prefix', locale);
  const subjectLine = `${subjectPrefix} ${propertyTitle}`;

  // Rate limit: max 5 unlock requests per email per 5 minutes
  const { limited } = await checkRateLimit(email, 'unlock', 5 * 60 * 1000, 5);
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  // Strip query-string and hash before extracting slug (handles UTM params, referral codes, etc.)
  const cleanPropertyUrl = propertyUrl ? propertyUrl.split('?')[0].split('#')[0] : null;
  let propertySlug = cleanPropertyUrl
    ? cleanPropertyUrl.replace(/https?:\/\/[^/]+\/property\//, '').replace(/\/$/, '') || null
    : null;

  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName  = nameParts.slice(1).join(' ') || null;

  // ── Look up property details from DB (authoritative — don't rely on frontend) ─
  let propertyCity    = null;
  let propertyPrice   = null;
  let propertyImg     = null;
  let propertyRegion  = null;
  let propertyPartner = null;
  let resolvedCountry = propertyCountry || null; // use frontend value as fallback
  if (propertySlug) {
    const db = getDb();
    const { data: prop } = await db
      .from('properties')
      .select('city, price, img, country, region, partner, photos')
      .eq('slug', propertySlug)
      .single();
    propertyCity    = prop?.city    || null;
    propertyPrice   = prop?.price   ? Number(prop.price) : null;
    propertyImg     = prop?.img     || null;
    propertyRegion  = prop?.region  || null;
    propertyPartner = prop?.partner || null;
    resolvedCountry = prop?.country || resolvedCountry;
  }

  // Fallback: if propertyUrl was absent or malformed, recover the correct slug
  // via a title lookup so the gallery link is never broken
  if (!propertySlug && propertyTitle) {
    const db = getDb();
    const { data: prop } = await db
      .from('properties')
      .select('slug, city, price, img, country, region, partner')
      .eq('title', propertyTitle)
      .single();
    if (prop) {
      propertySlug    = prop.slug;
      propertyCity    = propertyCity    || prop.city    || null;
      propertyPrice   = propertyPrice   || (prop.price ? Number(prop.price) : null);
      propertyImg     = propertyImg     || prop.img     || null;
      propertyRegion  = propertyRegion  || prop.region  || null;
      propertyPartner = propertyPartner || prop.partner || null;
      resolvedCountry = resolvedCountry || prop.country || null;
    }
  }

  // ── CRM ────────────────────────────────────────────────────────────────────
  let contact   = null;
  let emailSend = null;

  try {
    contact = await upsertContact({ email, firstName, lastName, phone, source: 'floor_plan', locale });

    if (contact) {
      // +10 points for requesting floor plans (high-intent action)
      await incrementScore(contact.id, 10);

      await createLead({
        contactId:     contact.id,
        propertySlug:  propertySlug   || null,
        propertyTitle: propertyTitle  || null,
        mainRegion:    propertyRegion || null,
        subregion:     propertyCity   || null,
        partner:       propertyPartner || null,
      });

      emailSend = await createEmailSend({
        contactId:     contact.id,
        type:          'floor_plan',
        subject:       subjectLine,
        toEmail:       email,
        propertyTitle: propertyTitle || null,
        propertyUrl:   propertyUrl   || null,
      });

      await logActivity({
        contactId: contact.id,
        type:      'floor_plan_requested',
        description: `Floor plan requested for ${propertyTitle}`,
        metadata: { propertyTitle, propertyUrl },
      });
    }
  } catch (e) {
    console.error('[CRM] unlock-drive write failed:', e.message);
  }

  // ── Generate gallery URL (pretty slug + compact user token) ─────────────
  const userToken  = Buffer.from(JSON.stringify({ n: name || '', e: email })).toString('base64url');
  // Carry locale forward in the URL so the gallery page + any subsequent
  // gallery-enquiry auto-reply stay in the same language as the original email
  const localeParam = locale && locale !== 'en' ? `&lang=${locale}` : '';
  const galleryUrl = propertySlug
    ? `https://co-ownership-property.com/gallery/${propertySlug}?t=${userToken}${localeParam}`
    : `https://co-ownership-property.com/gallery/${userToken}${localeParam ? `?${localeParam.slice(1)}` : ''}`; // fallback if no slug

  // ── Fetch similar properties for email ────────────────────────────────────
  const rawSimilar = await getSimilarProperties(propertySlug, resolvedCountry, propertyCity, propertyPrice);

  // Map to FloorPlanEmail's SimilarProperty shape
  const similarProperties = rawSimilar.map(p => {
    const sym   = { EUR: '€', USD: '$', GBP: '£' }[p.currency] || '€';
    const price = p.price ? `${sym}${p.price.toLocaleString('en-GB')}` : '';
    return {
      title:    p.title,
      price,
      beds:     p.beds  || 0,
      size:     p.size  || 0,
      slug:     p.slug,
      imageUrl: p.img   || undefined,
    };
  });

  try {
    const pixel = emailSend?.tracking_id ? trackingPixel(emailSend.tracking_id) : '';

    // Send floor plan email — gallery URL replaces raw Drive link as primary CTA
    await queueEmail({
      autoSend:      true,
      to:            email,
      toName:        name || null,
      subject:       subjectLine,
      template:      React.createElement(FloorPlanEmail, {
        firstName:         firstName     || name || undefined,
        propertyTitle:     propertyTitle || undefined,
        propertyImg:       propertyImg   || undefined,
        driveUrl:          galleryUrl,           // ← gallery page, not raw Drive
        propertyUrl:       propertyUrl   || undefined,
        similarProperties: similarProperties,
        trackingPixelHtml: pixel         || undefined,
        locale,
      }),
      templateName:  'floor-plan',
      templateProps: { firstName, propertyTitle, driveUrl: galleryUrl, propertyUrl, propertyImg, propertySlug, locale },
      trigger:       'floor_plan_requested',
      notes:         `Floor plan unlock for ${propertyTitle}`,
      contactId:     contact?.id || null,
    });

    if (contact && emailSend) {
      await logActivity({
        contactId: contact.id,
        type:      'email_queued',
        description: `Floor plan email queued for ${email}`,
        metadata:  { email_send_id: emailSend.id },
      });
    }

    // ── Nurture follow-up — batched, 24h after first floor plan request ───────
    // Rules:
    //   1. Skip entirely if contact already has a phone number (already a qualified lead)
    //   2. If a pending nurture already exists for this contact, merge the new property in
    //      (deduplicated by slug) and re-render rather than creating a second email
    //   3. Otherwise create a fresh entry scheduled for 24h from now
    try {
      const db = getDb();
      const unsubUrl = `https://co-ownership-property.com/unsubscribe/?email=${encodeURIComponent(email)}`;

      // ── Rule 1: skip if they've already given us their number ──────────────
      if (contact?.id) {
        const { data: contactRecord } = await db
          .from('contacts')
          .select('phone')
          .eq('id', contact.id)
          .single();

        if (!contactRecord?.phone) {
          const locationLabel = [propertyRegion, resolvedCountry].filter(Boolean).join(', ');
          const newProp = {
            slug:     propertySlug  || null,
            title:    propertyTitle || null,
            img:      propertyImg   || null,
            url:      propertyUrl   || null,
            location: locationLabel || null,
          };

          // ── Rule 2: merge into existing pending nurture if one exists ────────
          const { data: existing } = await db
            .from('email_queue')
            .select('id, template_props')
            .eq('contact_id', contact.id)
            .eq('sequence_type', 'floor-plan-nurture')
            .eq('status', 'pending')
            .maybeSingle();

          if (existing) {
            const existingProps = existing.template_props || {};

            // Normalise legacy single-property format → array
            let properties = existingProps.properties || [];
            if (!existingProps.properties && existingProps.propertySlug) {
              properties = [{
                slug:     existingProps.propertySlug  || null,
                title:    existingProps.propertyTitle || null,
                img:      existingProps.propertyImg   || null,
                url:      existingProps.propertyUrl   || null,
                location: existingProps.location      || null,
              }];
            }

            // Add new property only if not already listed
            if (!properties.some(p => p.slug && p.slug === propertySlug)) {
              properties.push(newProp);
            }

            const updatedSubject = properties.length === 1
              ? `Still thinking about ${properties[0].title}?`
              : `Still thinking about these properties?`;

            const updatedHtml = await render(React.createElement(NurtureFloorPlan, {
              firstName:      firstName || name || undefined,
              properties,
              unsubscribeUrl: unsubUrl,
            }));

            await db.from('email_queue').update({
              template_props: { firstName, properties },
              subject:        updatedSubject,
              html:           updatedHtml,
            }).eq('id', existing.id);

          } else {
            // ── Rule 3: no existing nurture — create a fresh one ───────────────
            const sendAfter = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

            await queueEmail({
              autoSend:      true,
              sendAfter,
              to:            email,
              toName:        name || null,
              subject:       `Still thinking about ${propertyTitle}?`,
              template:      React.createElement(NurtureFloorPlan, {
                firstName:      firstName || name || undefined,
                properties:     [newProp],
                unsubscribeUrl: unsubUrl,
              }),
              templateName:  'nurture-floor-plan',
              templateProps: { firstName, properties: [newProp] },
              trigger:       'floor_plan_nurture',
              notes:         `Floor plan follow-up — 24h after request for ${propertyTitle}`,
              contactId:     contact?.id || null,
              sequenceType:  'floor-plan-nurture',
            });
          }
        }
      }
    } catch (e) {
      console.error('[Mail] nurture-floor-plan queue failed:', e.message);
    }

    // Team notification (always immediate)
    await sendTeamNotification({
      subject: `Floor Plan Request — ${name || email}`,
      html: `
        <h2>Floor Plan / Photo Request</h2>
        <p><strong>Property:</strong> ${propertyTitle}${propertyUrl ? ` — <a href="${propertyUrl}">${propertyUrl}</a>` : ''}</p>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>Gallery sent: <a href="${galleryUrl}">${galleryUrl}</a></p>
      `,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send', detail: err.message });
  }
}
