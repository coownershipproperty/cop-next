/**
 * Supabase-backed rate limiter for form endpoints.
 * Stores submission timestamps in rate_limit_log and rejects
 * if the same identifier (email or IP) has hit the endpoint too recently.
 */
import { createClient } from '@supabase/supabase-js';

function getClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

/**
 * Check and record a rate-limited submission.
 *
 * @param {string} identifier - email address or IP
 * @param {string} endpoint   - 'enquiry' | 'newsletter' | 'unlock'
 * @param {number} windowMs   - window in milliseconds (default 5 minutes)
 * @param {number} maxHits    - max submissions in window (default 3)
 * @returns {{ limited: boolean }}
 */
export async function checkRateLimit(identifier, endpoint, windowMs = 5 * 60 * 1000, maxHits = 3) {
  if (!identifier) return { limited: false };

  const db = getClient();
  const since = new Date(Date.now() - windowMs).toISOString();

  // Count recent submissions from this identifier + endpoint
  const { count, error } = await db
    .from('rate_limit_log')
    .select('id', { count: 'exact', head: true })
    .eq('identifier', identifier.toLowerCase().trim())
    .eq('endpoint', endpoint)
    .gte('created_at', since);

  if (error) {
    // Don't block on DB error — fail open
    console.error('[RateLimit] check error:', error.message);
    return { limited: false };
  }

  if (count >= maxHits) {
    return { limited: true };
  }

  // Record this submission
  await db.from('rate_limit_log').insert({
    identifier: identifier.toLowerCase().trim(),
    endpoint,
  });

  // Occasionally clean old rows (1-in-20 chance per request)
  if (Math.random() < 0.05) {
    db.rpc('clean_rate_limit_log').then(() => {}).catch(() => {});
  }

  return { limited: false };
}
