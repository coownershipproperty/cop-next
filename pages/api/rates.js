import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data, error } = await supabase
      .from('exchange_rates')
      .select('base, rates, updated_at')
      .eq('id', 1)
      .single();

    if (error || !data) {
      // Fallback: fetch live from open.er-api.com and return directly
      const live = await fetch('https://open.er-api.com/v6/latest/USD');
      const json = await live.json();
      if (json.result === 'success') {
        res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
        return res.json({ base: 'USD', rates: json.rates, updated_at: new Date().toISOString() });
      }
      return res.status(500).json({ error: 'Rates unavailable' });
    }

    // Serve from Supabase cache — CDN edge caches this for 1 hour
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.json({ base: data.base, rates: data.rates, updated_at: data.updated_at });
  } catch (err) {
    res.status(500).json({ error: 'Internal error' });
  }
}
