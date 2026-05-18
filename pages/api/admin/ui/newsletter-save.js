/**
 * POST /api/admin/ui/newsletter-save
 *
 * Body: a partial campaign record. If `id` is present we update, else insert.
 *
 * Editable fields:
 *   name, subject, intro_text, template_type, property_slugs,
 *   personalize_by_region, audience_segment, audience_filter,
 *   scheduled_for, status
 *
 * status is only allowed to be 'draft' or 'scheduled' here — sending is done
 * via newsletter-send.
 */
import { requireAdmin } from '@/lib/newsletter/auth';

const ALLOWED = [
  'name', 'subject', 'intro_text', 'template_type',
  'property_slugs', 'personalize_by_region',
  'audience_segment', 'audience_filter',
  'scheduled_for', 'status',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db } = ctx;

  const body = req.body || {};
  const { id } = body;

  // Whitelist
  const patch = {};
  for (const k of ALLOWED) {
    if (body[k] !== undefined) patch[k] = body[k];
  }

  // Status guardrails
  if (patch.status && !['draft', 'scheduled'].includes(patch.status)) {
    return res.status(400).json({ error: 'status must be draft or scheduled here' });
  }

  patch.updated_at = new Date().toISOString();

  if (id) {
    // Don't allow editing a sent campaign
    const { data: existing } = await db
      .from('newsletter_campaigns')
      .select('status')
      .eq('id', id)
      .single();
    if (existing?.status === 'sent') {
      return res.status(400).json({ error: 'Cannot edit a sent campaign' });
    }
    if (existing?.status === 'sending') {
      return res.status(400).json({ error: 'Cannot edit a campaign that is currently sending' });
    }

    const { data, error } = await db
      .from('newsletter_campaigns')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ campaign: data });
  }

  if (!patch.name) patch.name = 'Untitled campaign';
  if (!patch.status) patch.status = 'draft';

  const { data, error } = await db
    .from('newsletter_campaigns')
    .insert(patch)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json({ campaign: data });
}
