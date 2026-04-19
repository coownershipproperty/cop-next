/**
 * CRM helpers — server-side only (API routes)
 * Writes contacts, leads, email_sends, email_opens, and activities to Supabase.
 */
import { createClient } from '@supabase/supabase-js';

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

/**
 * Upsert a contact by email. Returns the contact row.
 */
export async function upsertContact({ email, firstName, lastName, phone, source }) {
  const db = getClient();
  const clean = (email || '').toLowerCase().trim();

  const { data, error } = await db
    .from('contacts')
    .upsert(
      {
        email: clean,
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) console.error('[CRM] upsertContact error:', error.message);
  return data;
}

/**
 * Create a lead linked to a contact.
 */
export async function createLead({ contactId, propertySlug, propertyTitle, mainRegion, subregion, message, budget }) {
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
    })
    .select()
    .single();

  if (error) console.error('[CRM] createLead error:', error.message);
  return data;
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
