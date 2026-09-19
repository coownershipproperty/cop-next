/**
 * GET /api/admin/ui/gallery-preview?slug=<slug>
 * Admin-only (Bearer <supabase session token>, crm_admins allowlist).
 *
 * Mints a short-lived signed link to /gallery/<slug>/ that renders the
 * gallery of a HIDDEN (staged) listing. The gallery page deliberately refuses
 * hidden rows to anyone else — that rule is what closed the 19 Jul incident
 * and it stays. But on 19 Sep 2026 David staged seven Abitaro homes, pressed
 * "View gallery" in the admin to check the photos, and landed on /our-homes/
 * with no explanation: the gallery was there (7 to 18 photos each), the page
 * just would not show it to him before the listing went Live.
 *
 * The token is the same HMAC scheme as sign-in links (lib/signinToken.js),
 * with its own purpose so it cannot be reused as a visitor or sign-in token.
 * Two hours is long enough to review a batch and short enough that a pasted
 * link in a chat does not become a back door.
 */
import { requireCrmAdmin, setCrmCors } from '@/lib/adminAuth';
import { signToken } from '@/lib/signinToken';

export const PREVIEW_PURPOSE = 'gallery-preview';
export const PREVIEW_TTL_MS = 2 * 60 * 60 * 1000;

export default async function handler(req, res) {
  setCrmCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET, OPTIONS'); return res.status(405).json({ error: 'Method not allowed' }); }
  const admin = await requireCrmAdmin(req, res);
  if (!admin) return;
  const slug = String(req.query.slug || '').trim();
  if (!/^[a-z0-9-]{3,200}$/.test(slug)) return res.status(400).json({ error: 'bad slug' });
  const token = signToken({ email: admin.email, name: 'admin', purpose: PREVIEW_PURPOSE, ttlMs: PREVIEW_TTL_MS });
  return res.status(200).json({ url: `/gallery/${slug}/?preview=${encodeURIComponent(token)}` });
}
