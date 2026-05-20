/**
 * POST /api/admin/ui/newsletter-preview
 *
 * Body:
 *   { campaignId, targetEmail, renderAsContactId? }
 *
 * Renders the campaign's selected properties using the chosen template,
 * personalised either generically (no contactId) or as a specific contact.
 *
 * Returns { ok: true, subject, htmlPreviewLength } and sends an email via Resend.
 *
 * Logs the preview to campaign.preview_log.
 */
import { requireAdmin } from '@/lib/newsletter/auth';
import { sendHtml } from '@/lib/resend';
import { renderRecipient } from '@/lib/newsletter/render';
import { reorderForRecipient } from '@/lib/newsletter/personalize';
import { getContactInterests } from '@/lib/newsletter/audience';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db, user } = ctx;

  const { campaignId, targetEmail, renderAsContactId } = req.body || {};
  if (!campaignId)  return res.status(400).json({ error: 'campaignId is required' });
  if (!targetEmail) return res.status(400).json({ error: 'targetEmail is required' });

  // Load campaign
  const { data: campaign, error: campErr } = await db
    .from('newsletter_campaigns')
    .select('*')
    .eq('id', campaignId)
    .single();
  if (campErr || !campaign) return res.status(404).json({ error: 'Campaign not found' });

  const propertySlugs = campaign.property_slugs || [];
  if (!propertySlugs.length) {
    return res.status(400).json({ error: 'Campaign has no properties selected' });
  }

  // Load the properties
  const { data: properties } = await db
    .from('properties')
    .select('slug, title, region, city, country, price, currency, img, beds, size')
    .in('slug', propertySlugs);
  const propBySlug = {};
  for (const p of properties || []) propBySlug[p.slug] = p;

  // Figure out the recipient
  let firstName = 'there';
  let primarySlugs = propertySlugs;
  let fallbackSlugs = [];

  if (renderAsContactId) {
    const { data: contact } = await db
      .from('contacts')
      .select('first_name')
      .eq('id', renderAsContactId)
      .single();
    if (contact?.first_name) firstName = contact.first_name;

    if (campaign.personalize_by_region) {
      const { interests } = await getContactInterests(db, renderAsContactId);
      const ordered = reorderForRecipient(propertySlugs, propBySlug, interests);
      primarySlugs = ordered.primary;
      fallbackSlugs = ordered.fallback;
    }
  }

  const primaryProps  = primarySlugs.map(s => propBySlug[s]).filter(Boolean);
  const fallbackProps = fallbackSlugs.map(s => propBySlug[s]).filter(Boolean);

  try {
    const { html, subject } = await renderRecipient({
      templateType:    campaign.template_type || 'personalised-newsletter',
      firstName,
      email:           targetEmail,
      primaryProps,
      fallbackProps,
      subjectTemplate: campaign.subject,
      introText:       campaign.intro_text,
    });

    await sendHtml({
      to:      targetEmail,
      subject: `[PREVIEW] ${subject}`,
      html,
      from:    'Dylan at Co-Ownership Property <dylan@co-ownership-property.com>',
      replyTo: 'dylan@co-ownership-property.com',
    });

    // Append to preview_log
    const log = Array.isArray(campaign.preview_log) ? campaign.preview_log : [];
    log.push({
      at: new Date().toISOString(),
      to: targetEmail,
      by: user.email,
      asContact: renderAsContactId || null,
    });
    await db.from('newsletter_campaigns')
      .update({ preview_log: log.slice(-50) })
      .eq('id', campaignId);

    return res.json({ ok: true, subject, htmlBytes: html.length });
  } catch (err) {
    console.error('[newsletter-preview]', err);
    return res.status(500).json({ error: err.message });
  }
}
