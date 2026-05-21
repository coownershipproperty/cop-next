/**
 * Shared admin-auth helper for newsletter UI endpoints.
 *
 * Matches the CRM admin auth pattern:
 *   Authorization: Bearer <supabase access token from current session>
 *   user email must be active in public.crm_admins
 *
 * Returns { user, db } on success or sends a 401 and returns null on failure.
 */
import { requireCrmAdmin } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

export function getServiceDb() {
  return createSupabaseAdminClient();
}

export async function requireAdmin(req, res) {
  const admin = await requireCrmAdmin(req, res);
  if (!admin) return null;
  return { user: admin.user, email: admin.email, db: getServiceDb() };
}
