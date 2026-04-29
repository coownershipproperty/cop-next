import { createClient } from '@supabase/supabase-js';
import { upsertContact, createLead, createEmailSend, logActivity, trackingPixel, incrementScore } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { queueEmail, sendTeamNotification } from '@/lib/resend';
import FloorPlanEmail from '@/emails/floor-plan';
import NurtureFloorPlan from '@/emails/nurture-floor-plan';
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

  const { name, email, propertyTitle, driveUrl, propertyUrl, propertyCountry } = req.body;
  if (!email || !driveUrl) return res.status(400).json({ error: 'Missing fields' });

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
    contact = await upsertContact({ email, firstName, lastName, source: 'floor_plan' });

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
        subject:       `Floor Plans & More Photos — ${propertyTitle}`,
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

  // ── Generate gallery URL ──────────────────────────────────────────────────
  const galleryToken = Buffer.from(JSON.stringify({
    n: name  || '',
    e: email,
    s: propertySlug   || '',
    t: propertyTitle  || '',
  })).toString('base64url');
  const galleryUrl = `https://co-ownership-property.com/gallery/${galleryToken}`;

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
      subject:       `Floor Plans & More Photos — ${propertyTitle}`,
      template:      React.createElement(FloorPlanEmail, {
        firstName:         firstName     || name || undefined,
        propertyTitle:     propertyTitle || undefined,
        propertyImg:       propertyImg   || undefined,
        driveUrl:          galleryUrl,           // ← gallery page, not raw Drive
        propertyUrl:       propertyUrl   || undefined,
        similarProperties: similarProperties,
        trackingPixelHtml: pixel         || undefined,
      }),
      templateName:  'floor-plan',
      templateProps: { firstName, propertyTitle, driveUrl: galleryUrl, propertyUrl, propertyImg, propertySlug },
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

    // ── Nurture follow-up — 24h after floor plan request ─────────────────────
    try {
      const sendAfter = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const locationLabel = [propertyRegion, resolvedCountry].filter(Boolean).join(', ');
      const unsubUrl = `https://co-ownership-property.com/unsubscribe/?email=${encodeURIComponent(email)}`;
      await queueEmail({
        autoSend:     true,
        sendAfter,
        to:           email,
        toName:       name || null,
        subject:      `Still thinking about ${propertyTitle}?`,
        template:     React.createElement(NurtureFloorPlan, {
          firstName:     firstName     || name || undefined,
          propertyTitle: propertyTitle || undefined,
          propertyImg:   propertyImg   || undefined,
          propertyUrl:   propertyUrl   || undefined,
          location:      locationLabel || undefined,
          unsubscribeUrl: unsubUrl,
        }),
        templateName:  'nurture-floor-plan',
        templateProps: { firstName, propertyTitle, propertyUrl, propertyImg, propertySlug, location: locationLabel },
        trigger:       'floor_plan_nurture',
        notes:         `Floor plan follow-up — 24h after request for ${propertyTitle}`,
        contactId:     contact?.id || null,
        sequenceType:  'floor-plan-nurture',
      });
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
        <p>Drive link sent: <a href="${driveUrl}">${driveUrl}</a></p>
      `,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send', detail: err.message });
  }
}
