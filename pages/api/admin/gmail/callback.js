/**
 * GET /api/admin/gmail/callback?code=…&state=…
 * Google redirects here after consent. No admin header can travel on a
 * redirect, so the state nonce (created by an admin in /connect, 10-minute
 * life, single use) is the proof this round trip was started by us.
 * Stores the refresh token for the Google account that consented — and
 * refuses any account other than the draft account, so a stray consent from
 * the wrong Google login cannot silently redirect COP's drafts elsewhere.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { oauthClient, GMAIL_ACCOUNT } from '@/lib/gmail';
import { google } from 'googleapis';

export default async function handler(req, res) {
  const { code, state, error } = req.query;
  const back = (q) => res.redirect(302, `/admin/gmail-connect/?${q}`);
  if (error) return back(`error=${encodeURIComponent(String(error))}`);
  if (!code || !state) return back('error=missing_code');

  const db = createSupabaseAdminClient();
  const { data: st } = await db.from('oauth_states').select('state, created_at').eq('state', String(state)).maybeSingle();
  if (!st) return back('error=bad_state');
  await db.from('oauth_states').delete().eq('state', String(state));
  if (Date.now() - new Date(st.created_at).getTime() > 10 * 60 * 1000) return back('error=state_expired');

  try {
    const auth = oauthClient();
    const { tokens } = await auth.getToken(String(code));
    auth.setCredentials(tokens);
    const { data: me } = await google.oauth2({ version: 'v2', auth }).userinfo.get();
    const email = String(me?.email || '').toLowerCase();
    if (email !== GMAIL_ACCOUNT.toLowerCase()) {
      return back(`error=${encodeURIComponent(`wrong account: ${email} — sign in as ${GMAIL_ACCOUNT}`)}`);
    }
    if (!tokens.refresh_token) return back('error=no_refresh_token');
    const scopes = String(tokens.scope || '').split(' ').filter(Boolean);
    await db.from('oauth_tokens').upsert({
      provider: 'google', account_email: email, refresh_token: tokens.refresh_token,
      scopes, updated_at: new Date().toISOString(),
    }, { onConflict: 'provider,account_email' });
    return back('ok=1');
  } catch (e) {
    return back(`error=${encodeURIComponent(e.message)}`);
  }
}
