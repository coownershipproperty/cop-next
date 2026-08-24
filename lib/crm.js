/**
 * CRM helpers — server-side only (API routes)
 * Writes contacts, leads, email_sends, email_opens, and activities to Supabase.
 *
 * Uses SUPABASE_SERVICE_ROLE_KEY so writes bypass Row Level Security.
 * This key is never exposed to the browser — only used in API routes / server code.
 */
import { createSupabaseAdminClient } from './supabaseAdmin';
import { toE164 } from './phone';
import { inferNationality, requestGeo } from './leadIntelligence';

function getClient() {
  return createSupabaseAdminClient();
}

/**
 * Upsert a contact by email. Returns the contact row.
 *
 * Locale handling: only set on first insert (or when explicitly provided and valid).
 * We never silently overwrite an existing locale with 'en' just because a later
 * form submission didn't include one — that would erase Spanish/French preferences.
 */
export async function upsertContact({ email, firstName, lastName, phone, source, locale }) {
  const db = getClient();
  const clean = (email || '').toLowerCase().trim();

  const payload = {
    email: clean,
    source,
    updated_at: new Date().toISOString(),
  };
  // NEVER blank out existing contact data just because a later form didn't
  // include the field — omitted columns are left untouched by the upsert.
  // (This was silently erasing phones: enquiry saves phone → later gallery
  // unlock has no phone field → upsert overwrote phone with null.)
  if (firstName) payload.first_name = firstName;
  if (lastName) payload.last_name = lastName;
  // Normalise to E.164 so the CRM's Call / WhatsApp buttons actually work.
  // toE164 returns null when the number is genuinely ambiguous (e.g. a bare
  // 10-digit 7xxxxxxxxx that could be UK or NANP) — keep the raw value in
  // that case rather than storing a confidently-wrong number.
  if (phone && String(phone).replace(/\D/g, '').length >= 7) {
    const e164 = toE164(phone, { email: clean });
    if (e164) {
      payload.phone = e164;
    } else {
      payload.phone = String(phone).trim().slice(0, 25);
      console.warn('[CRM] phone not normalisable, stored raw:', payload.phone);
    }
  }
  // Only include locale if explicitly provided + valid — preserves earlier preference otherwise
  if (locale === 'es' || locale === 'fr' || locale === 'en') {
    payload.locale = locale;
  }

  const { data, error } = await db
    .from('contacts')
    .upsert(payload, { onConflict: 'email', ignoreDuplicates: false })
    .select()
    .single();

  if (error) console.error('[CRM] upsertContact error:', error.message);
  return data;
}

/**
 * Create a lead linked to a contact.
 */
export async function createLead({ contactId, propertySlug, propertyTitle, mainRegion, subregion, message, budget, attribution, enquiryPageUrl }) {
  const db = getClient();

  const { data, error } = await db
    .from('leads')
    .insert({
      contact_id: contactId,
      property_slug: propertySlug || null,
      property_title: propertyTitle || null,
      status: 'new_lead',
      main_region: mainRegion || null,
      subregion: subregion || null,
      message: message || null,
      budget_max: budget ? parseBudget(budget) : null,
      first_visit_at: attribution?.firstVisitedAt || null,
      landing_url: attribution?.landingUrl || null,
      referrer_url: attribution?.referrerUrl || null,
      attribution_source: attribution?.source || null,
      enquiry_page_url: enquiryPageUrl || null,
    })
    .select()
    .single();

  if (error) console.error('[CRM] createLead error:', error.message);
  return data;
}

/** Add admin-only location/nationality intelligence without replacing a
 * country that an operator has already confirmed manually. */
export async function enrichContactIntelligence({ contact, email, phone, request }) {
  if (!contact?.id) return contact;
  const db = getClient();
  const geo = requestGeo(request);
  const inference = inferNationality({ ipCountryCode: geo.countryCode, phone: contact.phone || phone, email });
  if (!inference && !geo.countryCode && !geo.city && !geo.region) return contact;

  const payload = { updated_at: new Date().toISOString() };
  if (inference && (!contact.nationality_confidence || inference.confidence >= contact.nationality_confidence)) {
    payload.inferred_nationality = inference.country;
    payload.nationality_confidence = inference.confidence;
    payload.nationality_evidence = inference.evidence;
    payload.nationality_inferred_at = new Date().toISOString();
    if (!contact.country) payload.country = inference.country;
  }
  if (!contact.first_ip_country_code && geo.countryCode) payload.first_ip_country_code = geo.countryCode;
  if (!contact.first_ip_city && geo.city) payload.first_ip_city = geo.city;
  if (!contact.first_ip_region && geo.region) payload.first_ip_region = geo.region;

  const { data, error } = await db.from('contacts').update(payload).eq('id', contact.id).select().single();
  if (error) {
    console.error('[CRM] enrichContactIntelligence error:', error.message);
    return contact;
  }
  return data || contact;
}

/**
 * Create an email_send record. Returns { id, tracking_id }.
 */
export async function createEmailSend({ contactId, leadId, type, subject, toEmail, propertyTitle, propertyUrl }) {
  const db = getClient();

  const { data, error } = await db
    .from('email_sends')
    .insert({
      contact_id: contactId || null,
      lead_id: leadId || null,
      type,
      subject,
      to_email: toEmail,
      property_title: propertyTitle || null,
      property_url: propertyUrl || null,
    })
    .select('id, tracking_id')
    .single();

  if (error) console.error('[CRM] createEmailSend error:', error.message);
  return data;
}

/**
 * Log an activity to the unified timeline.
 */
export async function logActivity({ contactId, leadId, type, description, metadata }) {
  const db = getClient();

  const { error } = await db.from('activities').insert({
    contact_id: contactId || null,
    lead_id: leadId || null,
    type,
    description,
    metadata: metadata || {},
  });

  if (error) console.error('[CRM] logActivity error:', error.message);
}

/**
 * Record an email open (called by the tracking pixel endpoint).
 */
export async function recordEmailOpen({ trackingId, ipAddress, userAgent }) {
  const db = getClient();

  // Find the email_send
  const { data: send } = await db
    .from('email_sends')
    .select('id, contact_id, lead_id, subject, type')
    .eq('tracking_id', trackingId)
    .single();

  if (!send) return null;

  // Insert open event
  await db.from('email_opens').insert({
    email_send_id: send.id,
    ip_address: ipAddress || null,
    user_agent: userAgent || null,
  });

  // Increment lead score (+3 per email open)
  await incrementScore(send.contact_id, 3);

  // Log to activities
  await logActivity({
    contactId: send.contact_id,
    leadId: send.lead_id,
    type: 'email_opened',
    description: `Email opened: "${send.subject}"`,
    metadata: { email_send_id: send.id, type: send.type },
  });

  return send;
}

/**
 * Increment a contact's lead score atomically via Postgres RPC.
 * Falls back to a read-modify-write if the function isn't deployed yet.
 */
export async function incrementScore(contactId, points) {
  if (!contactId || !points) return;
  const db = getClient();

  // Try atomic RPC first (created in migration)
  const { error: rpcError } = await db.rpc('increment_contact_score', {
    p_contact_id: contactId,
    p_points: points,
  });

  if (rpcError) {
    // Fallback: read then write (slightly less atomic but safe for low concurrency)
    const { data: contact } = await db
      .from('contacts')
      .select('score')
      .eq('id', contactId)
      .single();

    await db
      .from('contacts')
      .update({ score: (contact?.score || 0) + points })
      .eq('id', contactId);
  }
}

/**
 * Build a tracking pixel HTML snippet for embedding in emails.
 */
export function trackingPixel(trackingId) {
  if (!trackingId) return '';
  const url = `https://co-ownership-property.com/api/track/open?t=${trackingId}`;
  return `<img src="${url}" width="1" height="1" style="display:none;border:0;" alt="" />`;
}

// ── helpers ──────────────────────────────────────────────────────────────────

function parseBudget(str) {
  if (!str) return null;
  const num = parseInt(str.replace(/[^0-9]/g, ''), 10);
  return isNaN(num) ? null : num;
}
