import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdminClient } from './supabaseAdmin';

export function setCrmCors(res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://cop-crm.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
}

export async function requireCrmAdmin(req, res) {
  const auth = req.headers.authorization || req.headers.Authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';

  if (!token) {
    res.status(401).json({ error: 'Unauthorised' });
    return null;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    res.status(500).json({ error: 'Missing Supabase auth configuration' });
    return null;
  }

  const authClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data: { user }, error } = await authClient.auth.getUser(token);
  if (error || !user?.email) {
    res.status(401).json({ error: 'Unauthorised' });
    return null;
  }

  const email = user.email.toLowerCase().trim();
  const db = createSupabaseAdminClient();
  const { data: admin, error: adminError } = await db
    .from('crm_admins')
    .select('email')
    .eq('email', email)
    .eq('active', true)
    .maybeSingle();

  if (adminError) {
    res.status(500).json({ error: 'Could not verify CRM admin access' });
    return null;
  }

  if (!admin) {
    res.status(403).json({ error: 'Forbidden' });
    return null;
  }

  return { user, email };
}
