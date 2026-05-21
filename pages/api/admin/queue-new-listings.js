/**
 * POST /api/admin/queue-new-listings
 * Queues a new-listings digest email to all newsletter subscribers as 'pending'.
 * The CRM operator reviews then bulk-approves via /api/admin/send-campaign.
 *
 * Authorization: Bearer <Supabase access token for CRM admin>
 *
 * Body (JSON):
 *   slugs         — array of property slugs to feature (max 6)
 *   subject       — optional email subject override
 *   campaignId    — optional string key (default: 'new-listings-YYYY-MM-DD')
 */
import { queueEmail } from '@/lib/resend';
import NewListingsDigest from '@/emails/new-listings-digest';
import * as React from 'react';
import { requireCrmAdmin, setCrmCors } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

const BASE = 'https://co-ownership-property.com';

function getDb() {
  return createSupabaseAdminClient();
}

export default async function handler(req, res) {
  setCrmCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const admin = await requireCrmAdmin(req, res);
  if (!admin) return;

  const { slugs, subject: subjectOverride, campaignId: campaignIdParam } = req.body || {};

  if (!slugs || !Array.isArray(slugs) || slugs.length === 0) {
    return res.status(400).json({ error: 'slugs[] required in request body' });
  }

  const db = getDb();
  const today = new Date().toISOString().slice(0, 10);
  const campaignId = campaignIdParam || `new-listings-${today}`;

  // ── 1. Fetch properties ───────────────────────────────────────────────────
  const { data: properties, error: propErr } = await db
    .from('properties')
    .select('slug, title, price, currency, beds, size, region, country, img, images')
    .in('slug', slugs)
    .eq('status', 'Live');

  if (propErr || !properties || properties.length === 0) {
    return res.status(400).json({ error: 'No matching live properties found', detail: propErr?.message });
  }

  // Preserve the order the caller specified
  const orderedProps = slugs
    .map(s => properties.find(p => p.slug === s))
    .filter(Boolean);

  // ── 2. Fetch all subscriber contacts ─────────────────────────────────────
  // Exclude anyone tagged 'unsubscribed' or whose email has been anonymised
  // to the @deleted.local placeholder (GDPR erasure pattern).
  const { data: subscribers, error: subErr } = await db
    .from('contacts')
    .select('id, email, first_name, last_name')
    .not('email', 'is', null)
    .not('email', 'like', '%@deleted.local')
    .not('tags', 'cs', '{unsubscribed}');

  if (subErr) {
    return res.status(500).json({ error: 'Failed to fetch subscribers', detail: subErr.message });
  }

  // ── 3. Check for duplicates — skip if campaign already queued for this contact
  const { data: alreadyQueued } = await db
    .from('email_queue')
    .select('to_email')
    .eq('sequence_type', campaignId)
    .in('status', ['pending', 'sent']);

  const alreadySentSet = new Set((alreadyQueued || []).map(r => r.to_email));
  const toQueue = (subscribers || []).filter(c => !alreadySentSet.has(c.email));

  if (toQueue.length === 0) {
    return res.status(200).json({ ok: true, queued: 0, skipped: subscribers.length, message: 'All subscribers already have this campaign queued.' });
  }

  // ── 4. Build template props ───────────────────────────────────────────────
  const templateProperties = orderedProps.map(p => {
    const symbol = p.currency === 'GBP' ? '£' : p.currency === 'USD' ? '$' : '€';
    return {
      title:    p.title,
      price:    `${symbol}${Number(p.price).toLocaleString('en-GB')}`,
      beds:     p.beds,
      size:     p.size || null,
      location: p.region,
      country:  p.country,
      slug:     p.slug,
      imageUrl: p.img || (Array.isArray(p.images) ? p.images[0] : null),
      isNew:    true,
    };
  });

  const subject = subjectOverride || `${orderedProps.length} New Properties Just Added`;
  const newPropertyCount = orderedProps.length;

  // ── 5. Queue one email per subscriber (all as pending) ────────────────────
  let queued = 0;
  let failed = 0;

  for (const contact of toQueue) {
    try {
      const unsubscribeUrl = `${BASE}/unsubscribe/?email=${encodeURIComponent(contact.email)}`;
      await queueEmail({
        to:            contact.email,
        toName:        [contact.first_name, contact.last_name].filter(Boolean).join(' ') || null,
        subject,
        template:      React.createElement(NewListingsDigest, {
          newPropertyCount,
          properties: templateProperties,
          unsubscribeUrl,
        }),
        templateName:  'new-listings-digest',
        templateProps: { newPropertyCount, slugs, campaignId },
        trigger:       'new_listings_campaign',
        notes:         `New listings campaign: ${campaignId} — ${orderedProps.map(p => p.title).join(', ')}`,
        contactId:     contact.id,
        sequenceType:  campaignId,
        autoSend:      false,  // always queue as pending — requires manual approval
      });
      queued++;
    } catch (e) {
      console.error(`[NewListings] queue failed for ${contact.email}:`, e.message);
      failed++;
    }
  }

  return res.status(200).json({
    ok:      true,
    queued,
    skipped: subscribers.length - toQueue.length,
    failed,
    campaignId,
    message: `Queued ${queued} emails as pending for campaign "${campaignId}". Approve in the CRM email queue.`,
  });
}
