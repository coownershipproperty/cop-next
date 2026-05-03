/**
 * Resend email utility
 * Supports two modes controlled by RESEND_AUTO_SEND env var:
 *   - RESEND_AUTO_SEND=false (default) → emails go into email_queue as 'pending'
 *   - RESEND_AUTO_SEND=true            → emails send immediately via Resend API
 *
 * All COP emails should go through queueEmail() or sendEmailNow().
 */
import { Resend } from 'resend';
import { render } from '@react-email/components';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_ADDRESS = 'Co-Ownership Property <info@co-ownership-property.com>';
export const REPLY_TO     = 'info@co-ownership-property.com';
export const TEAM_EMAILS  = ['dylan@domosno.com', 'info@co-ownership-property.com', 'dylan@co-ownership-property.com'];

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

/**
 * The main entry point for all COP emails.
 *
 * In draft mode (RESEND_AUTO_SEND != 'true'):
 *   → Renders the template, saves to email_queue as 'pending', returns queue record
 *
 * In live mode (RESEND_AUTO_SEND = 'true'):
 *   → Renders and sends immediately via Resend API
 *
 * @param {object} opts
 * @param {string}           opts.to            — recipient email
 * @param {string}           [opts.toName]      — recipient display name
 * @param {string}           opts.subject
 * @param {React.ReactElement} opts.template    — React Email element (already instantiated with props)
 * @param {string}           opts.templateName  — e.g. 'enquiry-autoreply'
 * @param {object}           [opts.templateProps] — props used (for CRM display)
 * @param {string}           [opts.trigger]     — e.g. 'enquiry_submitted'
 * @param {string}           [opts.notes]       — human-readable summary for CRM
 * @param {string}           [opts.contactId]
 * @param {string}           [opts.leadId]
 * @param {string}           [opts.from]
 * @param {string}           [opts.replyTo]
 */
export async function queueEmail({
  to, toName, subject, template, templateName, templateProps,
  trigger, notes, contactId, leadId, from, replyTo,
  autoSend: autoSendOverride,
  sendAfter,       // optional Date | ISO string — schedule for future delivery
  sequenceType,    // optional string — e.g. 'welcome', 'nurture', 're-engagement'
}) {
  const html = await render(template);
  // Per-call override takes priority over the global env var
  const autoSend = autoSendOverride !== undefined
    ? autoSendOverride
    : process.env.RESEND_AUTO_SEND === 'true';

  // Always save to queue first — gives us a full audit trail
  const initialStatus = (autoSend && !sendAfter) ? 'sent' : 'pending';
  const db = getDb();
  const { data, error } = await db.from('email_queue').insert({
    to_email:       to,
    to_name:        toName   || null,
    subject,
    html,
    template_name:  templateName  || null,
    template_props: templateProps || null,
    trigger:        trigger  || null,
    notes:          notes    || null,
    contact_id:     contactId || null,
    lead_id:        leadId   || null,
    status:         initialStatus,
    sent_at:        initialStatus === 'sent' ? new Date().toISOString() : null,
    send_after:     sendAfter ? new Date(sendAfter).toISOString() : null,
    sequence_type:  sequenceType || null,
  }).select().single();

  if (error) {
    console.error('[EmailQueue] insert failed:', error.message);
    // Don't throw — failing to queue shouldn't break the form submission
  }

  // sendAfter always keeps it queued for the scheduler; otherwise send now
  if (autoSend && !sendAfter) {
    // Fire and forget — record is already stored
    sendHtml({ to, subject, html, from, replyTo }).catch(err =>
      console.error('[EmailQueue] auto-send failed:', err.message)
    );
  }

  return data;
}

/**
 * Cancel pending sequence emails for a contact.
 * Used when a contact upgrades from welcome → nurture (enquiry submitted).
 */
export async function cancelPendingSequence(contactId, sequenceType) {
  if (!contactId) return;
  const db = getDb();
  await db.from('email_queue')
    .update({ status: 'cancelled' })
    .eq('contact_id', contactId)
    .eq('sequence_type', sequenceType)
    .eq('status', 'pending');
}

/**
 * Send a queued email immediately (called from CRM approve action).
 * Updates the queue record status to 'sent'.
 *
 * @param {string} queueId — uuid of the email_queue row
 */
export async function sendQueuedEmail(queueId) {
  const db = getDb();
  const { data: row, error: fetchErr } = await db
    .from('email_queue')
    .select('*')
    .eq('id', queueId)
    .single();

  if (fetchErr || !row) throw new Error('Queue record not found: ' + queueId);
  if (row.status === 'sent') throw new Error('Already sent');

  await sendHtml({
    to:      row.to_email,
    subject: row.subject,
    html:    row.html,
  });

  await db.from('email_queue').update({
    status:      'sent',
    sent_at:     new Date().toISOString(),
    approved_at: new Date().toISOString(),
  }).eq('id', queueId);

  return { ok: true, to: row.to_email, subject: row.subject };
}

/**
 * Reject a queued email without sending.
 */
export async function rejectQueuedEmail(queueId) {
  const db = getDb();
  await db.from('email_queue').update({
    status:      'rejected',
    rejected_at: new Date().toISOString(),
  }).eq('id', queueId);
  return { ok: true };
}

/**
 * Low-level: send pre-rendered HTML via Resend.
 */
export async function sendHtml({ to, subject, html, from, replyTo }) {
  const { data, error } = await resend.emails.send({
    from:    from    || FROM_ADDRESS,
    to:      Array.isArray(to) ? to : [to],
    subject,
    html,
    replyTo: replyTo || REPLY_TO,
  });
  if (error) throw new Error('[Resend] ' + error.message);
  return data;
}

/**
 * Send a plain HTML email directly (for team notifications — never queued).
 * Use this for internal alerts only, not for subscriber-facing emails.
 */
export async function sendTeamNotification({ subject, html }) {
  return sendHtml({ to: TEAM_EMAILS, subject, html });
}

/**
 * Add a contact to the Resend Audience (COP Newsletter segment).
 */
export async function addToAudience({ email, firstName, lastName }) {
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!audienceId) return null;
  const { data, error } = await resend.contacts.create({
    audienceId,
    email,
    firstName: firstName || undefined,
    lastName:  lastName  || undefined,
    unsubscribed: false,
  });
  if (error) console.error('[Resend] addToAudience failed:', error.message);
  return data;
}

export default resend;
