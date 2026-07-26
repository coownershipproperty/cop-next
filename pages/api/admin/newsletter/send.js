import { render } from '@react-email/render';
import PersonalisedNewsletterEmail from '../../../../emails/personalised-newsletter';
import { sendHtml } from '../../../../lib/resend';
import { requireCrmAdmin, setCrmCors } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { unsubUrl } from '@/lib/unsub';
import { filterSuppressed } from '@/lib/suppressions';

function getDb() {
  return createSupabaseAdminClient();
}

const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ', SEK: 'SEK ' };
function formatPrice(price, currency) {
  const sym = CURRENCY_SYMBOLS[currency] || (currency ? currency + ' ' : '');
  return `${sym}${Number(price).toLocaleString('en-GB')}`;
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    setCrmCors(res);
    return res.status(200).end();
  }
  setCrmCors(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await requireCrmAdmin(req, res);
  if (!admin) return;

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

    // ── Suppression guard ────────────────────────────────────────────────────
    // These rows were written when the campaign was prepared, which may have
    // been days ago. Anyone who unsubscribed in between must not be mailed, so
    // re-check at send time rather than trusting the prepared list.
    const { kept: sendable, dropped: suppressedRows } = await filterSuppressed(db, sends);
    if (suppressedRows.length) {
      await db
        .from('newsletter_sends')
        .update({ status: 'cancelled', error: 'Recipient is on the suppression list' })
        .in('id', suppressedRows.map(r => r.id));
      console.log(`[newsletter/send] skipped ${suppressedRows.length} suppressed recipient(s)`);
    }
    if (!sendable.length) {
      return res.json({ ok: true, sent: 0, failed: 0, suppressed: suppressedRows.length });
    }

    // Prefetch all properties needed
    const allSlugs = [...new Set(sendable.flatMap(s => s.property_slugs || []))];
    const { data: properties } = await db
      .from('properties')
      .select('slug, title, region, city, country, price, currency, img, beds, size')
      .in('slug', allSlugs);

    const propBySlug = {};
    for (const p of properties || []) propBySlug[p.slug] = p;

    // Prefetch contact first names — skip anyone tagged 'unsubscribed' or whose
    // email has been anonymised to the @deleted.local GDPR-erasure placeholder.
    const contactIds = sendable.map(s => s.contact_id);
    const { data: contacts } = await db
      .from('contacts')
      .select('id, first_name, email, tags')
      .in('id', contactIds)
      .not('email', 'like', '%@deleted.local')
      .not('tags', 'cs', '{unsubscribed}');

    const contactById = {};
    for (const c of contacts || []) contactById[c.id] = c;

    let sent = 0, failed = 0;

    for (const sendRow of sendable) {
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
            unsubscribeUrl: unsubUrl(sendRow.email), // tokenised — see lib/unsub.js
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
          from:    'Dylan Olsson <dylan@co-ownership-property.com>',
          replyTo: 'dylan@co-ownership-property.com',
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

    return res.json({ ok: true, sent, failed, suppressed: suppressedRows.length });
  } catch (err) {
    console.error('[newsletter/send]', err);
    return res.status(500).json({ error: err.message });
  }
}
