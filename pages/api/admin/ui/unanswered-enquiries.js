/**
 * GET/POST /api/admin/ui/unanswered-enquiries
 * Admin-only (Bearer <supabase session token>, crm_admins allowlist).
 *
 * GET  ?days=30
 *      → { overdue, waiting, slaHours, items: [...] }
 *        `overdue` is the number that have been waiting longer than the
 *        24-hour rule. That is the figure on the admin home.
 *
 * POST { key, contactId, note? }
 *      Marks one person's enquiry answered by writing a note activity — which
 *      is itself a reply signal, so it drops off the list permanently. Use it
 *      when the reply went out from Gmail directly and left no trace here.
 *
 * Nothing in this route sends anything.
 */
import { requireAdmin } from '@/lib/newsletter/auth';
import { findUnansweredEnquiries, REPLY_SLA_HOURS } from '@/lib/unansweredEnquiries';

export default async function handler(req, res) {
  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db, email: adminEmail } = ctx;

  if (req.method === 'GET') {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 120);
    try {
      const result = await findUnansweredEnquiries(db, { days });
      return res.json({ ...result, slaHours: REPLY_SLA_HOURS });
    } catch (e) {
      console.error('[unanswered-enquiries]', e.message);
      return res.status(500).json({ error: 'Could not work out which enquiries are unanswered.' });
    }
  }

  if (req.method === 'POST') {
    const contactId = String(req.body?.contactId || '').trim();
    const leadId    = String(req.body?.leadId || '').trim() || null;
    const reason    = String(req.body?.note || '').trim().slice(0, 300);
    if (!contactId) return res.status(400).json({ error: 'contactId is required.' });

    const { error } = await db.from('activities').insert({
      contact_id: contactId,
      lead_id: leadId,
      type: 'note',
      description: reason || `Marked answered on the admin home by ${adminEmail}`,
      metadata: { source: 'admin-home-unanswered', admin: adminEmail },
    });
    if (error) {
      console.error('[unanswered-enquiries] mark failed:', error.message);
      return res.status(500).json({ error: 'Could not mark it answered.' });
    }
    return res.json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed.' });
}
