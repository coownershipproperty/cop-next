/**
 * POST /api/admin/ui/newsletter-audience-count
 *
 * Body: { audience_segment, audience_filter, property_slugs?: string[], excludeEnquired?: boolean }
 *
 * Returns:
 *   { total, sampleEmails: [up to 3], excluded? (when excludeEnquired) }
 */
import { requireAdmin } from '@/lib/newsletter/auth';
import { resolveAudience, excludeAlreadyEnquired } from '@/lib/newsletter/audience';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db } = ctx;

  const { audience_segment, audience_filter, property_slugs, excludeEnquired } = req.body || {};

  try {
    const { contacts } = await resolveAudience(db, audience_segment, audience_filter);
    let final = contacts;
    let excluded = 0;
    if (excludeEnquired && property_slugs?.length) {
      const result = await excludeAlreadyEnquired(db, contacts, property_slugs);
      final = result.contacts;
      excluded = result.excluded;
    }
    return res.json({
      total: final.length,
      excluded,
      sampleEmails: final.slice(0, 3).map(c => c.email),
    });
  } catch (err) {
    console.error('[newsletter-audience-count]', err);
    return res.status(500).json({ error: err.message });
  }
}
