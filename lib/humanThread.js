/**
 * Does a human (or a reviewed draft) already own this conversation?
 *
 * On 11 Sep 2026 the gallery follow-up job woke up after four days and sent
 * "Shall I put you in touch about the Estepona home?" — in English — to
 * Roland Payet, who has a month-long correspondence with Dylan in French,
 * and the same template to three other people whose hand-written replies
 * were sitting in Gmail waiting for review. The template beat the reply.
 *
 * Rule: a templated sender never writes to anyone a person has already
 * written to, or who has a reply waiting for review, or who has been handed
 * to a partner. Those conversations belong to Dylan. This is the same
 * "read the history first" rule the drafter follows, applied to the senders
 * that cannot read.
 *
 * The signals, all from tables that record the doing:
 *   - email_queue rows for this contact with a human trigger (enquiry_reply,
 *     enquiry_reply_draft, anything hand-sent), at any status except
 *     'rejected';
 *   - any email_queue row still 'pending_review' — a reply is on its way;
 *   - any partner_referrals row — they are in a partner's hands;
 *   - any activity that means a conversation exists: they wrote to us
 *     (enquiry_submitted, gallery_enquiry, tour_request) or someone here
 *     touched them by hand (email, phone_call, note, …). Roland's month of
 *     French correspondence lives only in Gmail, which no job here can
 *     read — but his August enquiry is in activities, and that is enough.
 *
 * Put plainly: templates are for people who have never written to us and
 * never been written to. Everyone else is a conversation, and conversations
 * are Dylan's.
 */

const CONVERSATION_ACTIVITIES = [
  'enquiry_submitted', 'enquiry_merged', 'gallery_enquiry', 'tour_request', 'email', 'email_sent', 'phone_call', 'note',
  'reply_drafted', 'partner_followup_drafted', 'partner_registration_confirmation_drafted', 'partner_email',
];

/**
 * Triggers a PERSON is behind: a reviewed reply, a hand-sent email. Anything
 * else in email_queue is a machine talking (campaigns, nurtures, alerts,
 * auto-replies, markers), and a machine talking is not a relationship.
 * Listed positively so a new campaign trigger cannot accidentally silence
 * every automation for everyone it was sent to.
 */
export const HUMAN_TRIGGERS = new Set([
  'enquiry_reply', 'enquiry_reply_draft', 'manual_reply', 'manual_send', 'human_reply',
]);

/**
 * @returns {Promise<{ owned: boolean, reason: string|null }>}
 */
export async function humanOwnsThread(db, { contactId, email }) {
  const addr = String(email || '').toLowerCase();
  if (!contactId && !addr) return { owned: false, reason: null };

  let q = db.from('email_queue')
    .select('trigger, status, created_at')
    .neq('status', 'rejected')
    .order('created_at', { ascending: false })
    .limit(50);
  q = contactId ? q.eq('contact_id', contactId) : q.eq('to_email', addr);
  const { data: rows } = await q;

  for (const r of rows || []) {
    if (r.status === 'pending_review') return { owned: true, reason: 'a reply is waiting for review' };
    if (HUMAN_TRIGGERS.has(r.trigger)) return { owned: true, reason: `a person wrote to them (${r.trigger}, ${String(r.created_at).slice(0, 10)})` };
  }

  if (contactId) {
    const { data: ref } = await db.from('partner_referrals')
      .select('partner, status')
      .eq('contact_id', contactId)
      .limit(1);
    if ((ref || []).length) return { owned: true, reason: `referred to ${ref[0].partner}` };

    const { data: acts } = await db.from('activities')
      .select('type, created_at')
      .eq('contact_id', contactId)
      .in('type', CONVERSATION_ACTIVITIES)
      .order('created_at', { ascending: true })
      .limit(1);
    if ((acts || []).length) return { owned: true, reason: `a conversation exists (${acts[0].type}, ${String(acts[0].created_at).slice(0, 10)})` };
  }

  return { owned: false, reason: null };
}
