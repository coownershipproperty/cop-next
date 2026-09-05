/**
 * GET/POST /api/admin/ui/reply-drafts
 * Admin-only (Bearer <supabase session token>, crm_admins allowlist).
 *
 * The review desk for Claude-drafted enquiry replies.
 *
 * Drafts arrive in email_queue with status 'pending_review' and never leave
 * on their own. Approving one flips it to 'pending', which is the only status
 * pages/api/process-email-queue.js will pick up — so the existing five-minute
 * sender, its suppression checks, its tracking pixel and its unsubscribe
 * headers all apply unchanged. Nothing here sends an email itself.
 *
 * GET  ?status=pending_review|all&limit=50
 *      → { drafts: [ { ...queue row, context } ] }
 *        context carries what the reviewer needs to judge the draft without
 *        leaving the page: the enquiry the lead actually wrote, the property,
 *        and anything the drafter could not answer.
 *
 * POST { id, action, subject?, html?, reason? }
 *      action = 'update'  → save edits, stay in review
 *               'approve' → status 'pending' (the sender takes it from there)
 *               'reject'  → status 'rejected', reason appended to notes
 *               'reopen'  → status 'rejected' → 'pending_review'
 */
import { requireAdmin } from '@/lib/newsletter/auth';

const DRAFT_TRIGGERS = ['enquiry_reply', 'enquiry_reply_draft'];
const MAX_HTML = 100000;

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

export default async function handler(req, res) {
  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db, email: adminEmail } = ctx;

  if (req.method === 'GET') {
    const status = clean(req.query.status || 'pending_review', 30);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);

    let q = db.from('email_queue')
      .select('id, created_at, status, to_email, to_name, subject, html, trigger, notes, contact_id, lead_id, template_props, approved_at, rejected_at')
      .in('trigger', DRAFT_TRIGGERS)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (status !== 'all') q = q.eq('status', status);

    const { data: drafts, error } = await q;
    if (error) return res.status(500).json({ error: error.message });

    // Pull the enquiry each draft answers, so the reviewer can see the
    // question and the reply side by side.
    const contactIds = [...new Set((drafts || []).map(d => d.contact_id).filter(Boolean))];
    const byContact = new Map();
    if (contactIds.length) {
      const { data: acts } = await db.from('activities')
        .select('contact_id, type, description, metadata, created_at')
        .in('contact_id', contactIds)
        .in('type', ['enquiry_submitted', 'gallery_enquiry'])
        .order('created_at', { ascending: false })
        .limit(500);
      for (const a of acts || []) {
        if (!byContact.has(a.contact_id)) byContact.set(a.contact_id, a);
      }
    }

    const withContext = (drafts || []).map(d => {
      const enquiry = d.contact_id ? byContact.get(d.contact_id) : null;
      const props = d.template_props || {};
      return {
        ...d,
        context: {
          askedAt: enquiry?.created_at || null,
          message: enquiry?.metadata?.message || '',
          property: enquiry?.metadata?.propertyTitle || enquiry?.metadata?.property || props.property || null,
          propertyUrl: enquiry?.metadata?.propertyUrl || enquiry?.metadata?.url || props.propertyUrl || null,
          locale: props.locale || null,
          // Anything the drafter flagged as unanswerable, so it is visible
          // before approval rather than after the lead points it out.
          unanswered: Array.isArray(props.unanswered) ? props.unanswered : [],
          partner: props.partner || null,
        },
      };
    });

    return res.status(200).json({ drafts: withContext });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, action } = req.body || {};
  if (!id || !action) return res.status(400).json({ error: 'Missing id or action' });

  const { data: draft, error: loadErr } = await db.from('email_queue')
    .select('id, status, subject, html, notes, trigger')
    .eq('id', id).maybeSingle();
  if (loadErr) return res.status(500).json({ error: loadErr.message });
  if (!draft) return res.status(404).json({ error: 'Draft not found' });
  if (!DRAFT_TRIGGERS.includes(draft.trigger)) {
    return res.status(400).json({ error: 'That queue row is not a reply draft' });
  }

  const stamp = () => new Date().toISOString();
  const trail = (line) => `${draft.notes ? draft.notes + '\n' : ''}${line}`;

  async function apply(patch) {
    const { data, error } = await db.from('email_queue')
      .update(patch).eq('id', id).select().maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  }

  try {
    if (action === 'update') {
      const patch = {};
      if (typeof req.body.subject === 'string') patch.subject = clean(req.body.subject, 300);
      if (typeof req.body.html === 'string') patch.html = String(req.body.html).slice(0, MAX_HTML);
      if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update' });
      return res.status(200).json({ draft: await apply(patch) });
    }

    if (action === 'approve') {
      if (draft.status !== 'pending_review') {
        return res.status(400).json({ error: `Only a draft awaiting review can be approved (this one is ${draft.status})` });
      }
      // Save any last edits in the same call, so approving never sends a
      // stale body the reviewer thought they had changed.
      const patch = {
        status: 'pending',
        approved_at: stamp(),
        notes: trail(`Approved by ${adminEmail}`),
      };
      if (typeof req.body.subject === 'string') patch.subject = clean(req.body.subject, 300);
      if (typeof req.body.html === 'string') patch.html = String(req.body.html).slice(0, MAX_HTML);
      return res.status(200).json({ draft: await apply(patch) });
    }

    if (action === 'reject') {
      const why = clean(req.body.reason || '', 300);
      return res.status(200).json({
        draft: await apply({
          status: 'rejected',
          rejected_at: stamp(),
          notes: trail(`Rejected by ${adminEmail}${why ? `: ${why}` : ''}`),
        }),
      });
    }

    if (action === 'reopen') {
      if (draft.status !== 'rejected') return res.status(400).json({ error: 'Only a rejected draft can be reopened' });
      return res.status(200).json({
        draft: await apply({ status: 'pending_review', rejected_at: null, notes: trail(`Reopened by ${adminEmail}`) }),
      });
    }

    return res.status(400).json({ error: `Unknown action ${clean(action, 40)}` });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
