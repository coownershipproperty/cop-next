/**
 * POST /api/admin/gmail/connect  (admin-authed)
 * → { url }  the Google consent URL for the draft account.
 *
 * The admin page sends the browser there; Google comes back to
 * /api/admin/gmail/callback with a code and the state nonce created here.
 */
import crypto from 'crypto';
import { requireAdmin } from '@/lib/newsletter/auth';
import { oauthClient, GMAIL_SCOPES, GMAIL_ACCOUNT } from '@/lib/gmail';

export default async function handler(req, res) {
  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const state = crypto.randomBytes(24).toString('hex');
    await ctx.db.from('oauth_states').insert({ state, provider: 'google', created_by: ctx.email });
    const url = oauthClient().generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',             // forces a refresh token even on re-connect
      scope: GMAIL_SCOPES,
      state,
      login_hint: GMAIL_ACCOUNT,
      include_granted_scopes: true,
    });
    return res.status(200).json({ url });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
