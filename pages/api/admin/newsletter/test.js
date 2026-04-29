import { createClient } from '@supabase/supabase-js';
import { render } from '@react-email/render';
import PersonalisedNewsletterEmail from '../../../../emails/personalised-newsletter';
import { sendHtml } from '../../../../lib/resend';

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ', SEK: 'SEK ' };
function formatPrice(price, currency) {
  const sym = CURRENCY_SYMBOLS[currency] || (currency ? currency + ' ' : '');
  return `${sym}${Number(price).toLocaleString('en-GB')}`;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', 'https://cop-crm.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth   = req.headers['authorization'] || '';
  const secret = process.env.CRM_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) return res.status(401).json({ error: 'Unauthorised' });

  const { campaignId, testEmail } = req.body || {};
  if (!campaignId) return res.status(400).json({ error: 'campaignId is required' });
  if (!testEmail)  return res.status(400).json({ error: 'testEmail is required' });

  const db = getDb();

  // Grab the first pending send for this campaign to use as sample data
  const { data: sendRow, error: sendErr } = await db
    .from('newsletter_sends')
    .select('*')
    .eq('campaign_id', campaignId)
    .eq('status', 'pending')
    .order('created_at')
    .limit(1)
    .single();

  if (sendErr || !sendRow) return res.status(404).json({ error: 'No pending sends found for this campaign' });

  // Fetch the properties
  const allSlugs = [...new Set([...(sendRow.primary_slugs || []), ...(sendRow.fallback_slugs || [])])];
  const { data: properties } = await db
    .from('properties')
    .select('slug, title, region, city, country, price, currency, img, beds, size')
    .in('slug', allSlugs);

  const propBySlug = {};
  for (const p of properties || []) propBySlug[p.slug] = p;

  const toPropertyObj = (slug) => {
    const p = propBySlug[slug];
    if (!p) return null;
    const parts = [p.city, p.region, p.country].filter(Boolean);
    const location = [...new Set(parts)].join(', ');
    return {
      slug:     p.slug,
      title:    p.title,
      price:    formatPrice(p.price, p.currency),
      beds:     p.beds || 0,
      size:     p.size || 0,
      imageUrl: p.img || '',
      location,
    };
  };

  const primaryProps  = (sendRow.primary_slugs  || []).map(toPropertyObj).filter(Boolean);
  const fallbackProps = (sendRow.fallback_slugs  || []).map(toPropertyObj).filter(Boolean);

  const html = await render(
    PersonalisedNewsletterEmail({
      firstName:           'David',
      primaryProperties:   primaryProps,
      fallbackProperties:  fallbackProps,
      unsubscribeUrl:      `https://co-ownership-property.com/unsubscribe?email=${encodeURIComponent(testEmail)}`,
    })
  );

  await sendHtml({
    to:      testEmail,
    subject: '[TEST] David, properties selected for you',
    html,
    from:    'Co-Ownership Property <info@co-ownership-property.com>',
    replyTo: 'info@co-ownership-property.com',
  });

  return res.json({ ok: true, usedSend: sendRow.id, propertiesCount: allSlugs.length });
}
