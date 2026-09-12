import { requireAdmin } from '@/lib/newsletter/auth';
import { gmailConnected, GMAIL_ACCOUNT } from '@/lib/gmail';

export default async function handler(req, res) {
  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const connected = await gmailConnected(ctx.db);
  return res.status(200).json({ account: GMAIL_ACCOUNT, connected, configured: !!(process.env.GMAIL_OAUTH_CLIENT_ID && process.env.GMAIL_OAUTH_CLIENT_SECRET) });
}
