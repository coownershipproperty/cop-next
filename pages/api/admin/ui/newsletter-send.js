/**
 * POST /api/admin/ui/newsletter-send
 *
 * Body: { campaignId, confirm: true }
 *
 * For each contact in the resolved audience:
 *   1. Insert a newsletter_sends row with primary/fallback property slugs
 *   2. Render the email and call Resend
 *   3. Update the send row + campaign counters
 *
 * Marks campaign.status = 'sending' while in progress, then 'sent' on completion.
 */
import { requireAdmin } from '@/lib/newsletter/auth';
import { resolveAudience, excludeAlreadyEnquired, getContactInterests } from '@/lib/newsletter/audience';
import { reorderForRecipient } from '@/lib/newsletter/personalize';
import { renderRecipient } from '@/lib/newsletter/render';
import { sendHtml } from '@/lib/resend';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db } = ctx;

  const { campaignId, confirm, excludeEnquired } = req.body || {};
  if (!campaignId) return res.status(400).json({ error: 'campaignId is required' });
  if (!confirm)    return res.status(400).json({ error: 'confirm flag required' });

  const { data: campaign } = await db
    .from('newsletter_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();
  if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
  if (campaign.status === 'sent')    return res.status(400).json({ error: 'Campaign already sent' });
  if (campaign.status === 'sending') return res.status(400).json({ error: 'Campaign is already sending' });

  const propertySlugs = campaign.property_slugs || [];
  if (!propertySlugs.length) return res.status(400).json({ error: 'No properties selected' });

  // Resolve audience
  const { contacts } = await resolveAudience(db, campaign.audience_segment, campaign.audience_filter);
  let recipients = contacts;
  if (excludeEnquired && campaign.audience_segment === 'all') {
    const out = await excludeAlreadyEnquired(db, recipients, propertySlugs);
    recipients = out.contacts;
  }
  if (!recipients.length) return res.status(400).json({ error: 'Audience is empty' });

  // Fetch properties once
  const { data: properties } = await db
    .from('properties')
    .select('slug, title, region, city, country, price, currency, img, beds, size')
    .in('slug', propertySlugs);
  const propBySlug = {};
  for (const p of properties || []) propBySlug[p.slug] = p;

  // Mark sending
  await db.from('newsletter_campaigns')
    .update({ status: 'sending', total_recipients: recipients.length })
    .eq('id', campaignId);

  let sent = 0, failed = 0;

  for (const contact of recipients) {
    let primarySlugs = propertySlugs;
    let fallbackSlugs = [];

    try {
      if (campaign.personalize_by_region) {
        const { interests } = await getContactInterests(db, contact.id);
        const ordered = reorderForRecipient(propertySlugs, propBySlug, interests);
        primarySlugs = ordered.primary;
        fallbackSlugs = ordered.fallback;
      }

      // Insert send row
      const { data: sendRow } = await db.from('newsletter_sends').insert({
        campaign_id:    campaignId,
        contact_id:     contact.id,
        email:          contact.email,
        property_slugs: propertySlugs,
        primary_slugs:  primarySlugs,
        fallback_slugs: fallbackSlugs,
        status:         'pending',
      }).select().single();

      const firstName = contact.first_name || 'there';
      const primaryProps  = primarySlugs.map(s => propBySlug[s]).filter(Boolean);
      const fallbackProps = fallbackSlugs.map(s => propBySlug[s]).filter(Boolean);

      const { html, subject } = await renderRecipient({
        templateType:    campaign.template_type || 'personalised-newsletter',
        firstName,
        email:           contact.email,
        primaryProps,
        fallbackProps,
        subjectTemplate: campaign.subject,
        introText:       campaign.intro_text,
      });

      await sendHtml({
        to:      contact.email,
        subject,
        html,
        from:    'Dylan at Co-Ownership Property <dylan@co-ownership-property.com>',
        replyTo: 'dylan@co-ownership-property.com',
      });

      if (sendRow?.id) {
        await db.from('newsletter_sends')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', sendRow.id);
      }
      sent++;
    } catch (err) {
      console.error(`[newsletter-send] ${contact.email}:`, err.message);
      try {
        await db.from('newsletter_sends').insert({
          campaign_id:    campaignId,
          contact_id:     contact.id,
          email:          contact.email,
          property_slugs: propertySlugs,
          primary_slugs:  primarySlugs,
          fallback_slugs: fallbackSlugs,
          status:         'failed',
          error:          err.message,
        });
      } catch {}
      failed++;
    }
  }

  await db.from('newsletter_campaigns')
    .update({
      status:     'sent',
      sent_count: sent,
      sent_at:    new Date().toISOString(),
    })
    .eq('id', campaignId);

  return res.json({ ok: true, sent, failed, total: recipients.length });
}
