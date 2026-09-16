/**
 * POST /api/signin
 *
 * Two shapes, one route:
 *
 *   { email }  → email that address a signed, 30-minute sign-in link.
 *                Always answers { ok: true }, whether or not we know the
 *                address, so the endpoint cannot be used to find out who is
 *                on our list.
 *   { k }      → verify a link and set the visitor cookie. Answers
 *                { ok, email, name } so the page can also write the existing
 *                localStorage identity and the unlock flow keeps working
 *                exactly as it did.
 *
 * Why this exists: a visitor who unlocked a gallery on a laptop had to do it
 * again on their phone, because the only record of it was localStorage. The
 * `?t=` token in our emails deliberately never confers that (it is plain
 * base64 and forgeable). This is the signed version.
 *
 * Nothing here takes a password or a phone number. Email only — that was the
 * decision, and it is also the only credential we can verify by sending to it.
 */
import { checkRateLimit } from '@/lib/rateLimit';
import { isHoneypotFilled } from '@/lib/honeypot';
import { upsertContact, logActivity } from '@/lib/crm';
import { emailShell } from '@/lib/emailShell';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import {
  signinUrl, verifyToken, visitorCookieHeader, normalizeEmail,
} from '@/lib/signinToken';

const ROLE = 'Co-Founder · Co-Ownership Property';

function linkEmailHtml({ name, url }) {
  const hi = name ? `Hi ${name},` : 'Hi there,';
  return emailShell(`
    <p style="margin:0 0 20px;">${hi}</p>
    <p style="margin:0 0 20px;">Here is your link back in. It signs you in on this device, so the galleries you have already opened stay open and the homes you save follow you between your phone and your laptop.</p>
    <p style="margin:0 0 28px;">
      <a href="${url}" style="display:inline-block;background:#143047;color:#ffffff;text-decoration:none;padding:14px 26px;font-size:14px;letter-spacing:0.08em;">Sign me in</a>
    </p>
    <p style="margin:0 0 20px;font-size:13px;color:#777777;">The link works for the next 30 minutes and only for this address. If you did not ask for it, ignore this email — nothing has changed on your account.</p>
  `, 'en', ROLE);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Verify a link ─────────────────────────────────────────────────────────
  if (req.body && req.body.k) {
    const claim = verifyToken(req.body.k, 'signin');
    if (!claim) return res.status(400).json({ error: 'That link has expired. Ask for a new one.' });

    let name = claim.name || '';
    try {
      const db = createSupabaseAdminClient();
      const { data: contact } = await db
        .from('contacts')
        .select('id, first_name, last_name')
        .ilike('email', claim.email)
        .limit(1)
        .maybeSingle();
      if (contact) {
        name = contact.first_name || name;
        await logActivity({
          contactId: contact.id,
          type: 'note',
          description: 'Signed in with an email link',
          metadata: { source: 'magic-link' },
        }).catch(() => {});
      }
    } catch (e) { /* identity does not depend on the CRM being reachable */ }

    res.setHeader('Set-Cookie', visitorCookieHeader(claim.email, name));
    return res.json({ ok: true, email: claim.email, name });
  }

  // ── Ask for a link ────────────────────────────────────────────────────────
  if (isHoneypotFilled(req.body)) return res.status(200).json({ ok: true });

  const email = normalizeEmail(req.body && req.body.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }

  const { limited } = await checkRateLimit(email, 'signin');
  // A rate-limited address gets the same answer as a successful one. Somebody
  // hammering the endpoint learns nothing about who is on the list.
  if (limited) return res.json({ ok: true });

  const next = typeof req.body.next === 'string' && req.body.next.startsWith('/') ? req.body.next : null;

  let name = '';
  try {
    const db = createSupabaseAdminClient();
    const { data: contact } = await db
      .from('contacts').select('id, first_name').ilike('email', email).limit(1).maybeSingle();
    name = (contact && contact.first_name) || '';
    // Somebody signing in for the first time becomes a contact, exactly as the
    // unlock form would have made them one.
    if (!contact) await upsertContact({ email, source: 'signin' }).catch(() => null);
  } catch (e) { /* carry on — the link does not need the CRM */ }

  try {
    // Imported here rather than at the top: lib/resend constructs its client
    // at module load and throws without RESEND_API_KEY, which would take the
    // *verify* branch down with it — and verifying a link sends nothing.
    const { sendHtml } = await import('@/lib/resend');
    await sendHtml({
      to: email,
      subject: 'Your link back in',
      html: linkEmailHtml({ name, url: signinUrl(email, name, next) }),
      noLeadCopy: true,   // a sign-in link is nobody's business but theirs
    });
  } catch (e) {
    console.error('[signin] send failed:', e.message);
    // Still a 200: whether the address exists, bounced or is suppressed is not
    // something this endpoint tells the caller.
  }

  return res.json({ ok: true });
}
