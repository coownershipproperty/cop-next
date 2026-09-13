/**
 * Gmail from the app: create drafts in Dylan's inbox.
 *
 * David, 12 Sep 2026: "everything in the one inbox I already read". Until
 * now the drafter wrote to the review desk and a person had to go and look;
 * on the first morning nobody did, and 16 drafts sat unseen. A draft that is
 * not where the reviewer looks is not a draft.
 *
 * The app holds a refresh token for dylan@co-ownership-property.com in
 * oauth_tokens (connected once via /admin/gmail-connect). Scope is
 * gmail.compose + gmail.readonly — it can create drafts and find the thread to
 * put them in; it can never send. Sending remains a human act in Gmail.
 *
 * Threading: if the person already has a conversation with us, the draft is
 * created inside that thread (In-Reply-To / References + threadId), so the
 * reviewer sees the history above it — rule zero of cop-business — and the
 * client receives a reply, not a cold new email.
 */
import { google } from 'googleapis';

export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.compose',   // create/edit drafts
  'https://www.googleapis.com/auth/gmail.readonly',  // find the existing thread to reply into
  'https://www.googleapis.com/auth/userinfo.email',  // confirm which account consented
];
export const GMAIL_ACCOUNT = process.env.GMAIL_DRAFT_ACCOUNT || 'dylan@co-ownership-property.com';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://co-ownership-property.com';
export const GMAIL_REDIRECT_URI = `${SITE_URL}/api/admin/gmail/callback`;

export function oauthClient() {
  const id = process.env.GMAIL_OAUTH_CLIENT_ID;
  const secret = process.env.GMAIL_OAUTH_CLIENT_SECRET;
  if (!id || !secret) throw new Error('GMAIL_OAUTH_CLIENT_ID / GMAIL_OAUTH_CLIENT_SECRET are not set');
  return new google.auth.OAuth2(id, secret, GMAIL_REDIRECT_URI);
}

/** True when a refresh token for the draft account is on file. */
export async function gmailConnected(db) {
  const { data } = await db.from('oauth_tokens').select('account_email, scopes, updated_at')
    .eq('provider', 'google').eq('account_email', GMAIL_ACCOUNT).maybeSingle();
  return data || null;
}

async function gmailClient(db) {
  const { data: row } = await db.from('oauth_tokens').select('refresh_token')
    .eq('provider', 'google').eq('account_email', GMAIL_ACCOUNT).maybeSingle();
  if (!row?.refresh_token) throw new Error(`Gmail is not connected for ${GMAIL_ACCOUNT} — open /admin/gmail-connect`);
  const auth = oauthClient();
  auth.setCredentials({ refresh_token: row.refresh_token });
  return google.gmail({ version: 'v1', auth });
}

function b64url(s) {
  return Buffer.from(s).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function encodeHeader(s) {
  // RFC 2047 for non-ASCII subjects/names
  return /^[\x20-\x7e]*$/.test(s) ? s : `=?UTF-8?B?${Buffer.from(s).toString('base64')}?=`;
}

/**
 * The most recent thread with this address, if any, and the last message's
 * RFC Message-ID so a reply threads correctly in the client's mailbox too.
 */
export async function findThreadWith(db, email) {
  const gmail = await gmailClient(db);
  const q = `(from:${email} OR to:${email}) -in:draft -in:trash newer_than:180d`;
  const { data: list } = await gmail.users.messages.list({ userId: 'me', q, maxResults: 1 });
  const first = list?.messages?.[0];
  if (!first) return null;
  const { data: msg } = await gmail.users.messages.get({
    userId: 'me', id: first.id, format: 'metadata', metadataHeaders: ['Message-ID', 'Subject', 'References', 'From'],
  });
  const h = Object.fromEntries((msg.payload?.headers || []).map(x => [x.name.toLowerCase(), x.value]));
  return {
    threadId: msg.threadId,
    messageId: h['message-id'] || null,
    references: h['references'] || null,
    subject: h['subject'] || null,
  };
}

/**
 * Subjects the app sends automatically from the same mailbox. A message with
 * one of these is not a person writing.
 */
const AUTOMATED_SUBJECT = /^(re:\s*)?(new enquiry|gallery enquiry|floor plan request|3d tour request|thanks for your enquiry|your enquiry|su consulta|votre demande|ihre anfrage|your .{1,60} photos|ihre fotos|tus fotos|vos photos|shall i put you in touch|the \d+ homes you looked at|still thinking about|price (update|reduced)|.{1,120} now fully sold|you're tracking|your property alert|property alert set|welcome — |new newsletter subscriber|watch — |waitlist — |\[preview\])/i;

/**
 * True when a person here has written to this address since `sinceIso`
 * (hand-written mail from the connected mailbox, automated subjects ignored).
 * The drafter uses it so an enquiry that Dylan already answered in Gmail is
 * never drafted a second time — the CRM sync runs hourly and only looks back
 * a few hours, so this is the check that does not depend on it.
 */
export async function humanWroteSince(db, email, sinceIso) {
  const gmail = await gmailClient(db);
  const after = Math.floor(new Date(sinceIso).getTime() / 1000);
  if (!Number.isFinite(after)) return false;
  const q = `from:me to:${email} after:${after} -in:draft -in:trash`;
  const { data: list } = await gmail.users.messages.list({ userId: 'me', q, maxResults: 10 });
  for (const m of list?.messages || []) {
    const { data: msg } = await gmail.users.messages.get({
      userId: 'me', id: m.id, format: 'metadata', metadataHeaders: ['Subject'],
    });
    const subject = (msg.payload?.headers || []).find(h => h.name.toLowerCase() === 'subject')?.value || '';
    if (!AUTOMATED_SUBJECT.test(subject.trim())) return true;
  }
  return false;
}

/**
 * True when there is any human conversation with this address in the
 * connected mailbox: they wrote to us, or a person here wrote to them
 * (automated subjects ignored). Used by the templated senders as the last
 * check before writing to someone — the mailbox is the one record that is
 * never behind.
 */
export async function humanConversationWith(db, email, days = 180) {
  const gmail = await gmailClient(db);
  const { data: inbound } = await gmail.users.messages.list({
    userId: 'me', q: `from:${email} -in:draft -in:trash -in:spam newer_than:${days}d`, maxResults: 1,
  });
  if (inbound?.messages?.length) return 'they wrote to us';
  const since = new Date(Date.now() - days * 86400 * 1000).toISOString();
  if (await humanWroteSince(db, email, since)) return 'a person here wrote to them';
  return null;
}

/**
 * Messages matching a Gmail search, newest first: [{ id, threadId }].
 */
export async function listMessages(db, q, maxResults = 20) {
  const gmail = await gmailClient(db);
  const { data } = await gmail.users.messages.list({ userId: 'me', q, maxResults });
  return data?.messages || [];
}

function decodeB64url(s) {
  return Buffer.from(String(s || '').replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
}

function collectParts(part, out) {
  if (!part) return;
  if (part.body?.data && /^text\//i.test(part.mimeType || '')) out.push({ mime: part.mimeType, text: decodeB64url(part.body.data) });
  for (const p of part.parts || []) collectParts(p, out);
}

/**
 * One message, decoded: { id, threadId, subject, from, to, date, text, html }.
 * `text` is the plain-text part when there is one, else the HTML with tags
 * stripped — enough for parsing a notification email.
 */
export async function getMessage(db, id) {
  const gmail = await gmailClient(db);
  const { data: msg } = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
  const h = Object.fromEntries((msg.payload?.headers || []).map(x => [x.name.toLowerCase(), x.value]));
  const parts = [];
  collectParts(msg.payload, parts);
  const html = parts.find(p => /html/i.test(p.mime))?.text || '';
  const plain = parts.find(p => /plain/i.test(p.mime))?.text || '';
  const text = plain || html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|tr|li|h\d)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
  return { id: msg.id, threadId: msg.threadId, subject: h.subject || '', from: h.from || '', to: h.to || '', date: h.date || '', text, html };
}

/**
 * Create a draft. Returns { draftId, threadId }.
 * `thread` (optional) is what findThreadWith returned; when present the draft
 * is a reply inside that thread.
 */
export async function createGmailDraft(db, { to, toName, subject, html, text, thread = null }) {
  const gmail = await gmailClient(db);
  const boundary = `cop-${Date.now().toString(36)}`;
  const toHeader = toName ? `${encodeHeader(toName)} <${to}>` : to;
  let subj = subject;
  if (thread?.subject && !/^re:/i.test(subject)) subj = /^re:/i.test(thread.subject) ? thread.subject : `Re: ${thread.subject}`;
  const headers = [
    `From: Dylan Olsson <${GMAIL_ACCOUNT}>`,
    `To: ${toHeader}`,
    `Subject: ${encodeHeader(subj)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  if (thread?.messageId) {
    headers.push(`In-Reply-To: ${thread.messageId}`);
    headers.push(`References: ${[thread.references, thread.messageId].filter(Boolean).join(' ')}`);
  }
  const plain = text || String(html).replace(/<[^>]+>/g, ' ').replace(/\s+\n/g, '\n').replace(/[ \t]+/g, ' ').trim();
  const raw = [
    ...headers, '',
    `--${boundary}`, 'Content-Type: text/plain; charset="UTF-8"', 'Content-Transfer-Encoding: base64', '',
    Buffer.from(plain).toString('base64'),
    `--${boundary}`, 'Content-Type: text/html; charset="UTF-8"', 'Content-Transfer-Encoding: base64', '',
    Buffer.from(html).toString('base64'),
    `--${boundary}--`,
  ].join('\r\n');

  const { data } = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: { message: { raw: b64url(raw), ...(thread?.threadId ? { threadId: thread.threadId } : {}) } },
  });
  return { draftId: data.id, threadId: data.message?.threadId || thread?.threadId || null };
}

/** Delete a draft we created (e.g. superseded). Best-effort. */
/** 'exists' while the draft is still in Drafts; 'gone' once it was sent or deleted. */
export async function gmailDraftStatus(db, draftId) {
  const gmail = await gmailClient(db);
  try {
    await gmail.users.drafts.get({ userId: 'me', id: draftId, format: 'minimal' });
    return 'exists';
  } catch (e) {
    if (e?.code === 404 || /not found/i.test(e?.message || '')) return 'gone';
    throw e;
  }
}

export async function deleteGmailDraft(db, draftId) {
  try {
    const gmail = await gmailClient(db);
    await gmail.users.drafts.delete({ userId: 'me', id: draftId });
    return true;
  } catch (e) {
    console.error(`[gmail] delete draft ${draftId}: ${e.message}`);
    return false;
  }
}
