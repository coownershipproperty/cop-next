import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

// CORS for the COP CRM (cop-crm.vercel.app) Partner Hub view. Mirrors
// setCrmCors in lib/adminAuth.js: headers only — every request still passes
// the full Bearer-token + crm_admins/membership authorisation below.
export function setPartnerHubCrmCors(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://cop-crm.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

function bearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7).trim() : '';
}
function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error('Missing Supabase auth configuration');
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function requirePartnerHubAccess(req, res, options = {}) {
  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Unauthorised' });
    return null;
  }

  let user;
  try {
    const { data, error } = await authClient().auth.getUser(token);
    if (error) throw error;
    user = data.user;
  } catch {
    res.status(401).json({ error: 'Unauthorised' });
    return null;
  }

  if (!user?.id || !user?.email) {
    res.status(401).json({ error: 'Unauthorised' });
    return null;
  }

  const db = createSupabaseAdminClient();
  const email = user.email.toLowerCase().trim();
  const [{ data: admin, error: adminError }, { data: membership, error: membershipError }] = await Promise.all([
    db.from('crm_admins').select('email').eq('email', email).eq('active', true).maybeSingle(),
    db
      .from('partner_hub_memberships')
      .select('id, partner_id, access_level, active')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle(),
  ]);

  if (adminError || membershipError) {
    console.error('[partner-hub-auth]', adminError?.message || membershipError?.message);
    res.status(500).json({ error: 'Could not verify Partner Hub access' });
    return null;
  }

  const access = admin
    ? { role: 'admin', user, email, partnerId: null, accessLevel: 'admin', db }
    : membership
      ? {
          role: 'partner',
          user,
          email,
          partnerId: membership.partner_id,
          accessLevel: membership.access_level,
          membershipId: membership.id,
          db,
        }
      : null;

  if (!access) {
    res.status(403).json({ error: 'Partner Hub access has not been assigned' });
    return null;
  }

  if (options.adminOnly && access.role !== 'admin') {
    res.status(403).json({ error: 'Administrator access required' });
    return null;
  }

  if (options.partnerOnly && access.role !== 'partner') {
    res.status(403).json({ error: 'Partner access required' });
    return null;
  }

  return access;
}

export async function findAccessibleLead(access, leadId) {
  let query = access.db.from('partner_hub_leads').select('*').eq('id', leadId);
  if (access.role === 'partner') query = query.eq('partner_id', access.partnerId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data || null;
}
