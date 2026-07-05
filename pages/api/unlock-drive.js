import { promises as dnsPromises } from 'dns';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { upsertContact, createLead, createEmailSend, logActivity, trackingPixel, incrementScore } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { isHoneypotFilled } from '@/lib/honeypot';
import { queueEmail, sendTeamNotification } from '@/lib/resend';
import { scheduleGalleryNurture } from '@/lib/followupSequence';
import FloorPlanEmail from '@/emails/floor-plan';
import { t, SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n';
import * as React from 'react';

function getDb() {
  return createSupabaseAdminClient();
}

// ── MX validation ───────────────────────────────────────────────────────────
// A definitive "this domain cannot receive mail" (NXDOMAIN, or the domain
// exists but has no MX records) is rejected with a friendly error the modal
// displays. EVERYTHING else fails OPEN: timeouts, SERVFAIL, refused — a real
// user must never be blocked because a resolver had a bad moment.
const DNS_TIMEOUT_MS = 2000;

async function emailDomainAccepted(email) {
  const at = String(email || '').lastIndexOf('@');
  const rawDomain = at > 0 ? String(email).slice(at + 1).trim().toLowerCase() : '';
  if (!rawDomain || !rawDomain.includes('.')) return { ok: false, definitive: true };
  let domain = rawDomain;
  try { domain = new URL(`http://${rawDomain}`).hostname; } catch { /* keep raw (IDN edge cases fail open below) */ }
  try {
    const resolver = new dnsPromises.Resolver({ timeout: DNS_TIMEOUT_MS, tries: 1 });
    const records = await Promise.race([
      resolver.resolveMx(domain),
      new Promise((_, reject) => setTimeout(
        () => reject(Object.assign(new Error('MX lookup timeout'), { code: 'ETIMEOUT' })),
        DNS_TIMEOUT_MS + 500,
      )),
    ]);
    return { ok: Array.isArray(records) && records.length > 0, definitive: true };
  } catch (e) {
    if (e && (e.code === 'ENOTFOUND' || e.code === 'ENODATA')) {
      // NXDOMAIN / domain resolves but publishes no MX — definitive.
      return { ok: false, definitive: true };
    }
    return { ok: true, definitive: false }; // DNS flakiness → fail open
  }
}

// The 10-minute multi-unlock follow-up ("sensor") is only a reliable delivery
// mechanism for gallery links while it is switched on (both the legacy
// /api/process-gallery-followups cron and the email-engine journey are gated
// on this same flag).
function gallerySensorEnabled() {
  return String(process.env.GALLERY_FOLLOWUP_ENABLED || '').trim().toLowerCase() === 'true';
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

  const { name, email, phone, propertyTitle, propertyUrl, propertyCountry, locale: rawLocale } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing fields' });

  // Resolve locale — only accept supported values, default to English
  const locale = SUPPORTED_LOCALES.includes(rawLocale) ? rawLocale : DEFAULT_LOCALE;
  // Short per-locale subject, e.g. "Your Marbella photos & floor plans" —
  // {city} is the first segment of the property title before the first comma.
  const city = ((propertyTitle || '').split(',')[0] || '').trim();
  const subjectLine = city
    ? t('emails.floor_plan.subject', locale).replace('{city}', city)
    : `${t('emails.floor_plan.subject_prefix', locale)} ${propertyTitle || ''}`.trim();

  // Rate limit: max 5 unlock requests per email per 5 minutes
  const { limited } = await checkRateLimit(email, 'unlock', 5 * 60 * 1000, 5);
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  const cleanEmail = String(email).toLowerCase().trim();

  // ── Email hygiene 1: does the domain exist and accept mail? ───────────────
  const mx = await emailDomainAccepted(cleanEmail);
  if (!mx.ok && mx.definitive) {
    return res.status(400).json({
      error: "That email domain doesn't seem to exist — double-check the spelling?",
      code: 'bad_domain',
    });
  }

  // ── Email hygiene 2: suppression list ─────────────────────────────────────
  // reason 'bounced'    → the address is undeliverable (Resend webhook wrote
  //                       this). Tell the client so it clears the saved user
  //                       and re-asks for the address.
  // reason 'complained' → they marked us as spam: the unlock still works (the
  //                       modal opens the on-site gallery) but we send NOTHING.
  let suppressedComplained = false;
  try {
    const { data: sup } = await getDb()
      .from('suppressions')
      .select('reason')
      .eq('email', cleanEmail)
      .maybeSingle();
    if (sup && sup.reason === 'bounced') {
      return res.status(409).json({
        invalidated: true,
        error: 'Previous emails to this address could not be delivered — please double-check it or use a different one.',
        code: 'bounced',
      });
    }
    if (sup && sup.reason === 'complained') suppressedComplained = true;
  } catch (e) {
    console.error('[unlock-drive] suppression lookup failed:', e.message); // fail open
  }

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

  // Robust fallback: enquiry titles can differ from the website DB title
  // (e.g. a Rightmove listing reads "4-Bed Villa With Fireplace" where the
  // website DB says "4-Bed House With Fireplace"). Match on city + beds,
  // then disambiguate by a shared feature keyword, so the gallery link
  // still resolves to a real property instead of a dead token URL.
  if (!propertySlug && propertyTitle) {
    const db = getDb();
    const locPart = String(propertyTitle).split('—')[0];
    const city = (locPart.split(',')[0] || '').trim();
    const bedsMatch = String(propertyTitle).match(/(\d+)\s*-?\s*bed/i);
    const beds = bedsMatch ? Number(bedsMatch[1]) : null;
    if (city) {
      let q = db.from('properties')
        .select('slug, title, city, price, img, country, region, partner')
        .ilike('city', city)
        .eq('status', 'Live');
      if (beds) q = q.eq('beds', beds);
      const { data: cands } = await q.limit(12);
      if (cands && cands.length) {
        let pick = cands[0];
        if (cands.length > 1) {
          const tail = String(propertyTitle).toLowerCase();
          const generic = new Set(['with','bed','apartment','house','villa','estate','penthouse','townhouse','finca','chalet']);
          const scored = cands.find(c => {
            const words = (c.title || '').toLowerCase().split(/[^a-z]+/).filter(w => w.length > 3);
            return words.some(w => !generic.has(w) && tail.includes(w));
          });
          if (scored) pick = scored;
        }
        propertySlug    = pick.slug;
        propertyCity    = propertyCity    || pick.city    || null;
        propertyPrice   = propertyPrice   || (pick.price ? Number(pick.price) : null);
        propertyImg     = propertyImg     || pick.img     || null;
        propertyRegion  = propertyRegion  || pick.region  || null;
        propertyPartner = propertyPartner || pick.partner || null;
        resolvedCountry = resolvedCountry || pick.country || null;
      }
    }
  }

  // ── Generate gallery URL (pretty slug + compact user token) ─────────────
  // Computed BEFORE the CRM writes so the floor_plan_requested activity can
  // carry it — the 10-minute multi-unlock follow-up email builds its
  // per-property gallery links from that metadata.
  const userToken  = Buffer.from(JSON.stringify({ n: name || '', e: email })).toString('base64url');
  // Carry locale forward in the URL so the gallery page + any subsequent
  // gallery-enquiry auto-reply stay in the same language as the original email
  const localeParam = locale && locale !== 'en' ? `&lang=${locale}` : '';
  const galleryUrl = propertySlug
    ? `https://co-ownership-property.com/gallery/${propertySlug}?t=${userToken}${localeParam}`
    : `https://co-ownership-property.com/our-homes/`; // no slug resolved — link the full collection, never a dead token URL

  // ── Email batching: rapid multi-unlocks get ONE gallery email ─────────────
  // If this address already received a per-property gallery email in the last
  // 24h, don't send another near-identical one — the 10-minute multi-unlock
  // follow-up (sensor) delivers the gallery links for every property unlocked
  // in the window. Everything else (contact upsert, lead, activity log, team
  // notification, nurture queueing) still happens per property. Only applies
  // while the sensor is enabled — with it off, this email is the only
  // delivery mechanism and always sends.
  let recentGalleryEmail = false;
  if (gallerySensorEnabled() && !suppressedComplained) {
    try {
      const db = getDb();
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const pattern = cleanEmail.replace(/([\\%_])/g, '\\$1');
      const { data: prior } = await db
        .from('email_sends')
        .select('id')
        .eq('type', 'floor_plan')
        .ilike('to_email', pattern)
        .gte('created_at', since)
        .limit(1);
      recentGalleryEmail = !!(prior && prior.length);
    } catch (e) {
      console.error('[unlock-drive] email_sends recency check failed:', e.message); // fail open → send
    }
  }
  const skipGalleryEmail = suppressedComplained || recentGalleryEmail;

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

      // Only record an email_sends row when the gallery email actually goes
      // out — this row IS the 24h batching anchor, so writing it on a skipped
      // send would let the window roll forever and starve the inbox.
      if (!skipGalleryEmail) {
        emailSend = await createEmailSend({
          contactId:     contact.id,
          type:          'floor_plan',
          subject:       subjectLine,
          toEmail:       email,
          propertyTitle: propertyTitle || null,
          propertyUrl:   propertyUrl   || null,
        });
      }

      await logActivity({
        contactId: contact.id,
        type:      'floor_plan_requested',
        description: `Floor plan requested for ${propertyTitle}`,
        // propertySlug + galleryUrl feed the multi-unlock follow-up email's
        // per-property gallery links (process-gallery-followups / email engine).
        metadata: { propertyTitle, propertyUrl, propertySlug, galleryUrl },
      });
    }
  } catch (e) {
    console.error('[CRM] unlock-drive write failed:', e.message);
  }

  // ── Fetch similar properties for email ────────────────────────────────────
  const rawSimilar = skipGalleryEmail
    ? []
    : await getSimilarProperties(propertySlug, resolvedCountry, propertyCity, propertyPrice);

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
    if (!skipGalleryEmail) {
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
    } else if (contact) {
      // Visible in the CRM timeline: this unlock happened, and WHY no
      // individual email went out for it.
      await logActivity({
        contactId: contact.id,
        type:      'email_batched',
        description: suppressedComplained
          ? `Gallery email for ${propertyTitle} NOT sent — address is suppressed (spam complaint)`
          : `Gallery email for ${propertyTitle} batched — another gallery email went to ${email} <24h ago; links delivered by the 10-minute follow-up`,
        metadata: { propertyTitle, propertySlug, galleryUrl, reason: suppressedComplained ? 'complained' : 'batched_24h' },
      });
    }

    // ── Queue the Day-2 / Day-5 nurture sequence (SEQ-A, upgraded to SEQ-B
    // on a second unlock). Best-effort — never blocks the unlock response.
    // (Suppressed addresses are skipped inside scheduleGalleryNurture.)
    try {
      await scheduleGalleryNurture({
        contactId:     contact?.id || null,
        email,
        firstName:     firstName || name || null,
        locale,
        propertySlug,
        propertyTitle,
        propertyUrl:   cleanPropertyUrl || (propertySlug ? `https://co-ownership-property.com/property/${propertySlug}/` : null),
      });
    } catch (e) {
      console.error('[unlock-drive] nurture scheduling failed:', e.message);
    }

    // Team notification (always immediate — EVERY gallery open is visible,
    // including one-click returning unlocks and batched ones)
    const galleryEmailLine = skipGalleryEmail
      ? (suppressedComplained
          ? '<em>skipped — address suppressed (spam complaint)</em>'
          : '<em>skipped — batched into the 10-minute follow-up (another gallery email went out &lt;24h ago)</em>')
      : `sent — <a href="${galleryUrl}">${galleryUrl}</a>`;
    await sendTeamNotification({
      subject: `Floor Plan Request — ${name || email}`,
      html: `
        <h2>Floor Plan / Photo Request</h2>
        <p><strong>Property:</strong> ${propertyTitle}${propertyUrl ? ` — <a href="${propertyUrl}">${propertyUrl}</a>` : ''}</p>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>Gallery email: ${galleryEmailLine}</p>
      `,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send', detail: err.message });
  }
}
