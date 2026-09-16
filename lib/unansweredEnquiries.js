/**
 * lib/unansweredEnquiries.js
 *
 * One question, answered in one place: which enquiries has nobody replied to?
 *
 * The rule (David, 15 Sep 2026): every enquiry gets a human reply and an offer
 * to register, within 24 hours. A rule with no number attached to it is a
 * wish, so this is the number.
 *
 * WHAT COUNTS AS AN ENQUIRY
 *   Someone wrote to us, or pressed a button that means "talk to me":
 *     - activities of type enquiry_submitted or gallery_enquiry
 *     - a lead carrying a message the person actually typed
 *   A gallery unlock is NOT an enquiry — that is a standing rule, and it is
 *   why the automated follow-up exists. Nor is a discreet-brochure request:
 *   the brochure IS the answer, and it is sent within the minute.
 *
 * WHAT COUNTS AS A REPLY
 *   Anything that shows a person dealt with it, logged after the enquiry:
 *     - an activity of type email, note, phone_call or partner_email
 *     - an enquiry_reply in email_sends
 *     - an approved reply that actually sent from email_queue
 *     - a partner referral created for that contact
 *   A draft is not a reply. A queued row that never sent is not a reply.
 *
 * THE HONEST CAVEAT
 *   A reply typed straight into Gmail, outside the review desk, leaves no
 *   trace in any of the above. So the count can overstate. That is what the
 *   "Mark as answered" action is for — it writes a note activity, which is
 *   itself a reply signal, so the enquiry drops off the list for good. A
 *   counter nobody can clear is a counter everybody learns to ignore.
 */

/** Messages the site writes into lead.message itself — not something a
 *  person typed, so they never make a lead an enquiry. */
const SYSTEM_MESSAGES = [
  /^requested the brochure/i,
  /^unlocked the /i,
  /^floor plan/i,
  /^watching /i,
  /^newsletter/i,
];

/** Our own addresses. A test enquiry from Dylan is not a lead owed a reply. */
const INTERNAL_DOMAINS = /@(co-ownership-property\.com|domosno\.com)$/i;

export const ENQUIRY_ACTIVITY_TYPES = ['enquiry_submitted', 'gallery_enquiry'];
export const HUMAN_REPLY_ACTIVITY_TYPES = ['email', 'note', 'phone_call', 'partner_email'];
const SENT_REPLY_TRIGGERS = ['enquiry_reply', 'enquiry_reply_draft'];

export const REPLY_SLA_HOURS = 24;

export function isTypedMessage(message) {
  const text = String(message || '').trim();
  if (text.length < 3) return false;
  return !SYSTEM_MESSAGES.some(re => re.test(text));
}

/**
 * Every unanswered enquiry in the window, newest first.
 *
 *   db     — supabase admin client
 *   days   — how far back to look (default 30; older than that is history,
 *            not a to-do list)
 *
 * Returns { items, overdue, waiting } where an item is
 *   { key, kind, contactId, leadId, name, email, propertyTitle, message,
 *     createdAt, hoursWaiting, overdue }
 */
export async function findUnansweredEnquiries(db, { days = 30, limit = 60 } = {}) {
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const [{ data: acts }, { data: leads }] = await Promise.all([
    db.from('activities')
      .select('id, contact_id, lead_id, type, description, created_at')
      .in('type', ENQUIRY_ACTIVITY_TYPES)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(400),
    db.from('leads')
      .select('id, contact_id, message, property_title, property_slug, created_at, status')
      .is('merged_into_lead_id', null)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(400),
  ]);

  // ── Collect the enquiries, one per contact per event ─────────────────────
  const enquiries = [];
  for (const a of acts || []) {
    if (!a.contact_id) continue;
    enquiries.push({
      key: `activity:${a.id}`,
      kind: a.type,
      activityId: a.id,
      contactId: a.contact_id,
      leadId: a.lead_id || null,
      message: a.description || '',
      createdAt: a.created_at,
    });
  }
  for (const l of leads || []) {
    if (!l.contact_id || !isTypedMessage(l.message)) continue;
    enquiries.push({
      key: `lead:${l.id}`,
      kind: 'lead_message',
      activityId: null,
      contactId: l.contact_id,
      leadId: l.id,
      message: l.message,
      propertyTitle: l.property_title || '',
      propertySlug: l.property_slug || '',
      createdAt: l.created_at,
    });
  }
  if (!enquiries.length) return { items: [], overdue: 0, waiting: 0 };

  const contactIds = [...new Set(enquiries.map(e => e.contactId))];

  // ── Gather every reply signal for those people, in four reads ────────────
  const [{ data: replyActs }, { data: sends }, { data: queued }, { data: referrals }, { data: drafts }] = await Promise.all([
    db.from('activities')
      .select('contact_id, type, created_at')
      .in('contact_id', contactIds)
      .in('type', HUMAN_REPLY_ACTIVITY_TYPES)
      .gte('created_at', since)
      .limit(1000),
    db.from('email_sends')
      .select('contact_id, type, sent_at')
      .in('contact_id', contactIds)
      .eq('type', 'enquiry_reply')
      .gte('sent_at', since)
      .limit(500),
    db.from('email_queue')
      .select('contact_id, trigger, status, sent_at')
      .in('contact_id', contactIds)
      .in('trigger', SENT_REPLY_TRIGGERS)
      .eq('status', 'sent')
      .gte('created_at', since)
      .limit(500),
    db.from('partner_referrals')
      .select('contact_id, created_at')
      .in('contact_id', contactIds)
      .gte('created_at', since)
      .limit(500),
    // Not a reply — but knowing a draft is already written turns this list
    // from an accusation into a work queue.
    db.from('email_queue')
      .select('contact_id, created_at, status')
      .in('contact_id', contactIds)
      .in('trigger', SENT_REPLY_TRIGGERS)
      .in('status', ['pending_review', 'pending'])
      .gte('created_at', since)
      .limit(500),
  ]);

  const draftedFor = new Set((drafts || []).map(d => d.contact_id).filter(Boolean));

  const repliesByContact = new Map();
  const note = (contactId, at) => {
    if (!contactId || !at) return;
    const t = Date.parse(at);
    if (!Number.isFinite(t)) return;
    const list = repliesByContact.get(contactId) || [];
    list.push(t);
    repliesByContact.set(contactId, list);
  };
  for (const r of replyActs || []) note(r.contact_id, r.created_at);
  for (const r of sends || [])     note(r.contact_id, r.sent_at);
  for (const r of queued || [])    note(r.contact_id, r.sent_at);
  for (const r of referrals || []) note(r.contact_id, r.created_at);

  // ── Keep the ones with nothing after them ────────────────────────────────
  const now = Date.now();
  const open = enquiries.filter(e => {
    const at = Date.parse(e.createdAt);
    const replies = repliesByContact.get(e.contactId) || [];
    // A minute's grace: the enquiry and its CRM note are often written in the
    // same request, and a note written a heartbeat before is still a reply.
    return !replies.some(t => t >= at - 60000);
  });

  // One row per person: three enquiries from the same person in a week is one
  // reply owed, not three.
  const byContact = new Map();
  for (const e of open.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))) {
    const prev = byContact.get(e.contactId);
    if (!prev) byContact.set(e.contactId, { ...e, count: 1 });
    else byContact.set(e.contactId, { ...prev, count: prev.count + 1, latestAt: e.createdAt, message: prev.message || e.message });
  }
  const rows = [...byContact.values()];
  if (!rows.length) return { items: [], overdue: 0, waiting: 0 };

  // ── Names, addresses and the property, for the ones we will show ─────────
  const { data: contacts } = await db
    .from('contacts')
    .select('id, first_name, last_name, email, phone')
    .in('id', rows.map(r => r.contactId));
  const contactById = new Map((contacts || []).map(c => [c.id, c]));

  const leadById = new Map((leads || []).map(l => [l.id, l]));
  const leadByContact = new Map();
  for (const l of leads || []) if (l.contact_id && !leadByContact.has(l.contact_id)) leadByContact.set(l.contact_id, l);

  const items = rows.map(r => {
    const c = contactById.get(r.contactId) || {};
    const lead = (r.leadId && leadById.get(r.leadId)) || leadByContact.get(r.contactId) || null;
    const hours = Math.floor((now - Date.parse(r.createdAt)) / 3600000);
    return {
      key: r.key,
      kind: r.kind,
      activityId: r.activityId,
      contactId: r.contactId,
      leadId: r.leadId || lead?.id || null,
      name: [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email || 'Unnamed',
      email: c.email || '',
      phone: c.phone || '',
      propertyTitle: r.propertyTitle || lead?.property_title || '',
      message: String(r.message || '').trim().slice(0, 400),
      count: r.count,
      createdAt: r.createdAt,
      hoursWaiting: hours,
      overdue: hours >= REPLY_SLA_HOURS,
      drafted: draftedFor.has(r.contactId),
    };
  })
    .filter(i => i.email && !INTERNAL_DOMAINS.test(i.email))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

  return {
    items: items.slice(0, limit),
    overdue: items.filter(i => i.overdue).length,
    waiting: items.length,
  };
}
