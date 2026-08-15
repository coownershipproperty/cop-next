/**
 * Partner referral queue helpers.
 *
 * A partner_referrals row is the "pending review" stage between a website
 * signal (collection enquiry, gallery request on a partner-collection
 * property) and the manual handover in the Admin Partner Hub. Rows are
 * auto-created by the public API routes below and NEVER auto-sent — an
 * admin qualifies and approves each one in /admin/partners/queue before
 * the partner hears anything (review-first doctrine).
 *
 * Feeds:
 *   - pages/api/enquiry.js          → enquiryType === 'collection'
 *   - pages/api/gallery-enquiry.js  → property whose partner is 21-5
 *   - pages/api/unlock-drive.js     → property whose partner is 21-5
 *
 * Dedupe: one OPEN (pending_review/qualified) referral per contact+partner —
 * repeat signals merge into the existing row's history instead of creating
 * a second queue entry. A partial unique index is the DB-level backstop.
 */
import { createSupabaseAdminClient } from './supabaseAdmin';

export const PARTNER_215 = '21-5';

/** Accepts the partner-slug spellings 21-5 might appear under. */
export function is215Partner(value) {
  const v = String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return v === '215';
}

/**
 * Create (or merge into) an open referral for this contact+partner.
 * Never throws — a referral failure must not break the public form response.
 * Returns the referral id or null.
 */
export async function createPartnerReferral({ contactId, leadId, partner = PARTNER_215, source, payload = {} }) {
  if (!contactId) return null;
  try {
    const db = createSupabaseAdminClient();
    const now = new Date().toISOString();
    const event = { at: now, type: 'signal', source, detail: payload.property || payload.collection || null };

    const { data: existing } = await db
      .from('partner_referrals')
      .select('id, payload, history')
      .eq('contact_id', contactId)
      .eq('partner', partner)
      .in('status', ['pending_review', 'qualified'])
      .maybeSingle();

    if (existing) {
      // Existing answers win; fresh signal fills gaps + is recorded in history.
      const merged = { ...payload, ...(existing.payload || {}) };
      const history = Array.isArray(existing.history) ? existing.history : [];
      await db
        .from('partner_referrals')
        .update({ payload: merged, history: [...history, event], updated_at: now })
        .eq('id', existing.id);
      return existing.id;
    }

    const { data, error } = await db
      .from('partner_referrals')
      .insert({
        contact_id: contactId,
        lead_id: leadId || null,
        partner,
        status: 'pending_review',
        source: source || 'manual',
        payload,
        history: [event],
      })
      .select('id')
      .single();

    if (error) {
      // 23505 = unique race with a concurrent signal — the other row won; fine.
      if (error.code !== '23505') console.error('[partner-referrals] insert failed:', error.message);
      return null;
    }
    return data?.id || null;
  } catch (e) {
    console.error('[partner-referrals] create failed:', e.message);
    return null;
  }
}
