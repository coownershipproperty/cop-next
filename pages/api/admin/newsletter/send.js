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
  // CORS preflight
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

  const { campaignId } = req.body || {};
  if (!campaignId) return res.status(400).json({ error: 'campaignId is required' });

  const db = getDb();

  try {
    // Verify campaign exists and isn't already sent
    const { data: campaign, error: campErr } = await db
      .from('newsletter_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    if (campErr || !campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status === 'sent') return res.status(400).json({ error: 'Campaign already sent' });

    // Get all pending sends for this campaign
    const { data: sends, error: sendsErr } = await db
      .from('newsletter_sends')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');
    if (sendsErr) throw sendsErr;
    if (!sends || sends.length === 0) return res.json({ ok: true, sent: 0, failed: 0 });

    // Prefetch all properties needed
    const allSlugs = [...new Set(sends.flatMap(s => s.property_slugs || []))];
    const { data: properties } = await db
      .from('properties')
      .select('slug, title, region, city, country, price, currency, img, beds, size')
      .in('slug', allSlugs);

    const propBySlug = {};
    for (const p of properties || []) propBySlug[p.slug] = p;

    // Prefetch contact first names
    const contactIds = sends.map(s => s.contact_id);
    const { data: contacts } = await db
      .from('contacts')
      .select('id, first_name')
      .in('id', contactIds);

    const contactById = {};
    for (const c of contacts || []) contactById[c.id] = c;

    let sent = 0, failed = 0;

    for (const sendRow of sends) {
      try {
        const contact   = contactById[sendRow.contact_id] || {};
        const firstName = contact.first_name || 'there';

        // User token for gallery URLs (name + email pre-fills the enquiry form)
        const userToken = Buffer.from(JSON.stringify({
          n: firstName !== 'there' ? firstName : '',
          e: sendRow.email,
        })).toString('base64url');

        // Build property objects for the template
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
        const fallbackProps = (sendRow.fallback_slugs || []).map(toPropertyObj).filter(Boolean);

        const html = await render(
          PersonalisedNewsletterEmail({
            firstName,
            primaryProperties:  primaryProps,
            fallbackProperties: fallbackProps,
            unsubscribeUrl: `https://co-ownership-property.com/unsubscribe?email=${encodeURIComponent(sendRow.email)}`,
          })
        );

        // Build a short region string: "California & Mallorca" or "California, Mallorca & Ibiza"
        const regionList = [...new Set(
          [...primaryProps, ...fallbackProps].map(p => p.regionTag).filter(Boolean)
        )].slice(0, 3);
        const sendRegions = regionList.length > 1
          ? regionList.slice(0, -1).join(', ') + ' & ' + regionList[regionList.length - 1]
          : regionList[0] || '';
        const subject = firstName !== 'there'
          ? (sendRegions ? `${firstName} — ${sendRegions}` : `${firstName}, properties selected for you`)
          : (sendRegions ? `Properties in ${sendRegions}` : 'Your personalised property selection');

        await sendHtml({
          to:      sendRow.email,
          subject,
          html,
          from:    'Co-Ownership Property <info@co-ownership-property.com>',
          replyTo: 'info@co-ownership-property.com',
        });

        await db.from('newsletter_sends')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', sendRow.id);

        sent++;
      } catch (err) {
        console.error(`[newsletter/send] Failed for ${sendRow.email}:`, err.message);
        await db.from('newsletter_sends')
          .update({ status: 'failed', error: err.message })
          .eq('id', sendRow.id);
        failed++;
      }
    }

    // Mark campaign as sent
    await db.from('newsletter_campaigns')
      .update({ status: 'sent', sent_count: sent, sent_at: new Date().toISOString() })
      .eq('id', campaignId);

    return res.json({ ok: true, sent, failed });
  } catch (err) {
    console.error('[newsletter/send]', err);
    return res.status(500).json({ error: err.message });
  }
}
