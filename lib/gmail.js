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
