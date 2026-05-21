/**
 * /api/refresh-rates
 * Called daily by Vercel Cron to fetch fresh exchange rates and store in Supabase.
 * Vercel automatically sends Authorization: Bearer ${CRON_SECRET} for cron jobs.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

export default async function handler(req, res) {
  // Verify this is a legitimate cron call (or manual trigger with secret)
  const authHeader = req.headers.authorization || '';
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Fetch fresh rates from open.er-api.com (free, no API key required)
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { 'User-Agent': 'cop-property-site/1.0' },
    });
    const data = await response.json();

    if (data.result !== 'success') {
      return res.status(502).json({ error: 'Exchange rate API returned error', detail: data });
    }

    // Upsert into Supabase (single row, id=1)
    const supabase = createSupabaseAdminClient();

    const { error } = await supabase
      .from('exchange_rates')
      .upsert({ id: 1, base: 'USD', rates: data.rates, updated_at: new Date().toISOString() });

    if (error) {
      return res.status(500).json({ error: 'Failed to store rates', detail: error.message });
    }

    return res.json({ success: true, updated_at: new Date().toISOString(), currencies: Object.keys(data.rates).length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
