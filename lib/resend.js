/**
 * Resend email utility
 * Wraps the Resend SDK with a simple send() helper.
 * All COP emails should go through this file.
 */
import { Resend } from 'resend';
import { render } from '@react-email/components';

const resend = new Resend(process.env.RESEND_API_KEY);

export const FROM_ADDRESS = 'Co-Ownership Property <info@co-ownership-property.com>';
export const REPLY_TO     = 'info@co-ownership-property.com';
export const TEAM_EMAILS  = ['dylan@domosno.com', 'info@co-ownership-property.com'];

/**
 * Send a transactional email using a React Email component.
 *
 * @param {object} opts
 * @param {string|string[]} opts.to       — recipient(s)
 * @param {string}          opts.subject  — email subject
 * @param {React.ReactElement} opts.template — React Email component (already instantiated)
 * @param {string}          [opts.from]   — override sender
 * @param {string|string[]} [opts.replyTo]
 * @param {string|string[]} [opts.bcc]
 */
export async function sendEmail({ to, subject, template, from, replyTo, bcc }) {
  const html = await render(template);
  const { data, error } = await resend.emails.send({
    from:     from    || FROM_ADDRESS,
    to:       Array.isArray(to) ? to : [to],
    subject,
    html,
    replyTo:  replyTo || REPLY_TO,
    bcc:      bcc     || undefined,
  });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Add a contact to the Resend Audience (COP Newsletter segment).
 * Safe to call even if the contact already exists — Resend deduplicates.
 *
 * @param {object} opts
 * @param {string} opts.email
 * @param {string} [opts.firstName]
 * @param {string} [opts.lastName]
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
