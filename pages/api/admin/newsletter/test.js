import { render } from '@react-email/render';
import PersonalisedNewsletterEmail from '../../../../emails/personalised-newsletter';
import { sendHtml } from '../../../../lib/resend';
import { requireCrmAdmin, setCrmCors } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { unsubUrl, listUnsubHeaders } from '@/lib/unsub';

function getDb() {
  return createSupabaseAdminClient();
}

const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ', SEK: 'SEK ' };
function formatPrice(price, currency) {
  const sym = CURRENCY_SYMBOLS[currency] || (currency ? currency + ' ' : '');
  return `${sym}${Number(price).toLocaleString('en-GB')}`;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCrmCors(res);
    return res.status(200).end();
  }
  setCrmCors(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await requireCrmAdmin(req, res);
  if (!admin) return;

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

  const testFirstName = 'David';
  const userToken = Buffer.from(JSON.stringify({ n: testFirstName, e: testEmail })).toString('base64url');

  const toPropertyObj = (slug) => {
    const p = propBySlug[slug];
    if (!p) return null;
    const parts = [p.city, p.region, p.country].filter(Boolean);
    const location = [...new Set(parts)].join(', ');
    return {
      slug:       p.slug,
      title:      p.title,
      price:      formatPrice(p.price, p.currency),
      beds:       p.beds || 0,
      size:       p.size || 0,
      imageUrl:   p.img || '',
      location,
      regionTag:  p.region || p.city || null,
      galleryUrl: `https://co-ownership-property.com/gallery/${p.slug}?t=${userToken}`,
    };
  };

  const primaryProps  = (sendRow.primary_slugs  || []).map(toPropertyObj).filter(Boolean);
  const fallbackProps = (sendRow.fallback_slugs  || []).map(toPropertyObj).filter(Boolean);

  const html = await render(
    PersonalisedNewsletterEmail({
      firstName:           testFirstName,
      primaryProperties:   primaryProps,
      fallbackProperties:  fallbackProps,
      unsubscribeUrl:      unsubUrl(testEmail), // tokenised — see lib/unsub.js
    })
  );

  await sendHtml({
    to:      testEmail,
    subject: '[TEST] David, properties selected for you',
    html,
    from:    'Dylan Olsson <dylan@co-ownership-property.com>',
    replyTo: 'dylan@co-ownership-property.com',
    headers: listUnsubHeaders(testEmail), // RFC 8058 one-click — see lib/unsub.js
  });

  return res.json({ ok: true, usedSend: sendRow.id, propertiesCount: allSlugs.length });
}
