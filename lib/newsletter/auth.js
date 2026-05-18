/**
 * Shared admin-auth helper for newsletter UI endpoints.
 *
 * Matches the auth pattern in pages/api/admin/upload-photo.js:
 *   Authorization: Bearer <supabase access token from current session>
 *
 * Returns { user, db } on success or sends a 401 and returns null on failure.
 */
import { createClient } from '@supabase/supabase-js';

export function getServiceDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

export async function requireAdmin(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    res.status(401).json({ error: 'Unauthorised — no token' });
    return null;
  }

  const anon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data: { user }, error } = await anon.auth.getUser(token);
  if (error || !user) {
    res.status(401).json({ error: 'Unauthorised — invalid token' });
    return null;
  }

  return { user, db: getServiceDb() };
}
