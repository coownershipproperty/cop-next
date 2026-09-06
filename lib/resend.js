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
import { createSupabaseAdminClient } from './supabaseAdmin';
import { resolveUnsubPlaceholder, listUnsubHeaders } from './unsub';

const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_ADDRESS = 'Dylan Olsson <dylan@co-ownership-property.com>';
export const REPLY_TO     = 'dylan@co-ownership-property.com';
export const TEAM_EMAILS  = ['dylan@domosno.com', 'info@co-ownership-property.com', 'dylan@co-ownership-property.com'];

function getDb() {
  return createSupabaseAdminClient();
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
  // The same component rendered as text, so every queued email ships
  // multipart rather than HTML-only.
  let text = null;
  try { text = await render(template, { plainText: true }); }
  catch (e) { console.error('[EmailQueue] plain-text render failed:', e.message); }
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
    // Resolve {{UNSUB_URL}} and attach RFC 8058 one-click headers, exactly as
    // the queue processor does. Without this the auto-send path — which is how
    // the gallery unlock email goes out — shipped an unresolved placeholder and
    // no List-Unsubscribe header at all.
    sendHtml({
      to, subject, from, replyTo,
      html:    resolveUnsubPlaceholder(html, to),
      text:    text ? resolveUnsubPlaceholder(text, to) : undefined,
      headers: listUnsubHeaders(to),
    }).catch(err =>
      console.error('[EmailQueue] auto-send failed:', err.message)
    );
  }

  return data;
}

/**
 * Cancel pending sequence emails for a contact.
 * Used when a contact upgrades from welcome → nurture (enquiry submitted).
 *
 * BUG FIX (see docs/email-automation-blueprint.md, "Bug 1"): this used to
 * write status='cancelled' without ever checking the result. On databases
 * where the email_queue status CHECK constraint predates the 'cancelled'
 * value, Postgres rejected the UPDATE; supabase-js returns that error in the
 * result object (it does not throw), so it was silently discarded and the
 * rows stayed 'pending' — meaning the "cancelled" emails still sent, and the
 * queue cron kept picking them up. We now verify the write and fall back to
 * 'rejected' (allowed by every version of the constraint).
 */
export async function cancelPendingSequence(contactId, sequenceType) {
  if (!contactId) return;
  const db = getDb();
  for (const status of ['cancelled', 'rejected']) {
    const { error } = await db.from('email_queue')
      .update({
        status,
        rejected_at: new Date().toISOString(),
        notes: 'Cancelled — superseded (contact enquired)',
      })
      .eq('contact_id', contactId)
      .eq('sequence_type', sequenceType)
      .eq('status', 'pending');
    if (!error) return;
    console.error(`[EmailQueue] cancelPendingSequence status='${status}' failed:`, error.message);
  }
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
    // Rows staged outside the app carry {{UNSUB_URL}}; no-op for the rest.
    html:    resolveUnsubPlaceholder(row.html, row.to_email),
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
 * Record an email that was sent directly (not through the queue) so it shows
 * up in the CRM like every other email: a `sent` row in email_queue with the
 * full HTML, plus an email_sends row for the per-type history. Best-effort —
 * never throws, never blocks the send it describes.
 *
 * Every lead-facing email must be visible in /admin/emails, including the
 * "what did we actually recommend?" content (David, 6 Sep 2026). Pass the
 * recommendations (slugs, prices) in `templateProps` so they can be audited.
 *
 * @param {object} o
 * @param {string}  o.to             recipient
 * @param {string}  o.subject
 * @param {string}  o.html           the exact HTML that went out
 * @param {string}  o.trigger        e.g. 'search_saved', 'sold_waitlist'
 * @param {string}  [o.type]         email_sends.type (defaults to trigger)
 * @param {string}  [o.contactId]    looked up by email when omitted
 * @param {string}  [o.leadId]
 * @param {string}  [o.templateName]
 * @param {object}  [o.templateProps]
 * @param {string}  [o.notes]
 * @param {string}  [o.propertyTitle]
 * @param {string}  [o.propertyUrl]
 * @param {boolean} [o.withSend=true] also write email_sends (false when the
 *                                    caller already created one for tracking)
 */
export async function recordSentEmail({
  to, toName, subject, html, trigger, type, contactId, leadId,
  templateName, templateProps, notes, propertyTitle, propertyUrl, withSend = true,
}) {
  try {
    const db = getDb();
    const email = String(Array.isArray(to) ? to[0] : to || '').trim().toLowerCase();
    if (!email) return null;
    let cid = contactId || null;
    if (!cid) {
      const { data: c } = await db.from('contacts').select('id').eq('email', email).maybeSingle();
      cid = c?.id || null;
    }
    const now = new Date().toISOString();
    const { data: row, error } = await db.from('email_queue').insert({
      to_email:       email,
      to_name:        toName || null,
      subject:        subject || null,
      html:           html || null,
      template_name:  templateName || null,
      template_props: templateProps || null,
      trigger:        trigger || 'direct',
      notes:          notes || 'Sent directly (not queued) — recorded for the CRM',
      contact_id:     cid,
      lead_id:        leadId || null,
      status:         'sent',
      sent_at:        now,
    }).select('id').single();
    if (error) console.error('[recordSentEmail] email_queue insert failed:', error.message);
    if (withSend) {
      const { error: sErr } = await db.from('email_sends').insert({
        contact_id:     cid,
        lead_id:        leadId || null,
        type:           type || trigger || 'direct',
        subject:        subject || null,
        to_email:       email,
        property_title: propertyTitle || null,
        property_url:   propertyUrl || null,
      });
      if (sErr) console.error('[recordSentEmail] email_sends insert failed:', sErr.message);
    }
    return row || null;
  } catch (e) {
    console.error('[recordSentEmail] failed:', e.message);
    return null;
  }
}

/**
 * Low-level: send pre-rendered HTML via Resend.
 *
 * Pass `log` ({ trigger, type?, contactId?, leadId?, templateName?,
 * templateProps?, notes?, propertyTitle?, propertyUrl?, withSend? }) and the
 * send is recorded in the CRM via recordSentEmail() once Resend accepts it.
 * Internal/team notifications and queue-driven sends pass nothing.
 */
export async function sendHtml({ to, cc, subject, html, text, from, replyTo, headers, idempotencyKey, log }) {
  const { data, error } = await resend.emails.send({
    from:    from    || FROM_ADDRESS,
    to:      Array.isArray(to) ? to : [to],
    ...(cc ? { cc: Array.isArray(cc) ? cc : [cc] } : {}),
    subject,
    html,
    // A text/plain alternative. HTML-only mail is one of the oldest and
    // cheapest spam signals there is, and it leaves plain-text readers with
    // nothing at all. Omitted only when the caller has no text version.
    ...(text ? { text } : {}),
    replyTo: replyTo || REPLY_TO,
    ...(headers ? { headers } : {}),
  }, idempotencyKey ? { idempotencyKey } : undefined);
  if (error) throw new Error('[Resend] ' + error.message);
  if (log) await recordSentEmail({ to, subject, html, ...log });
  return data;
}

/**
 * Send many pre-rendered emails in ONE Resend call (Resend caps a batch at
 * 100). Used by the newsletter sender so a large campaign dispatches in
 * seconds instead of one-network-round-trip-per-recipient. Each message is
 * { to, subject, html, from?, replyTo? }. Resolves on success; throws if the
 * whole batch is rejected, so the caller can leave the rows 'pending' and
 * retry them on the next run (nobody is marked 'sent' unless the call
 * succeeded).
 */
export async function sendHtmlBatch(messages) {
  if (!messages || !messages.length) return [];
  const payload = messages.map((m) => ({
    from:    m.from    || FROM_ADDRESS,
    to:      Array.isArray(m.to) ? m.to : [m.to],
    subject: m.subject,
    html:    m.html,
    replyTo: m.replyTo || REPLY_TO,
  }));
  const { data, error } = await resend.batch.send(payload);
  if (error) throw new Error('[Resend batch] ' + (error.message || JSON.stringify(error)));
  return data;
}

/**
 * Send a plain HTML email directly (for team notifications — never queued).
 * Use this for internal alerts only, not for subscriber-facing emails.
 *
 * Pass an optional `threadKey` (e.g. `floorplan-${email}`) to make Gmail
 * group repeat notifications into ONE conversation: every send with the
 * same key carries In-Reply-To/References pointing at the same synthetic
 * root Message-ID, and Gmail threads messages that share a References
 * root and a matching subject. Keep the subject identical across sends
 * of the same threadKey or Gmail will still split them.
 */
export async function sendTeamNotification({ subject, html, threadKey }) {
  let headers;
  if (threadKey) {
    const key = String(threadKey)
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (key) {
      const rootId = `<notif-${key}@co-ownership-property.com>`;
      headers = { 'In-Reply-To': rootId, References: rootId };
    }
  }
  return sendHtml({ to: TEAM_EMAILS, subject, html, headers });
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
