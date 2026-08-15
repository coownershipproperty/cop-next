/**
 * GET/POST /api/admin/ui/partner-referrals
 * Admin-only (Bearer <supabase session token>, crm_admins allowlist).
 *
 * GET  ?status=pending_review|qualified|sent_to_partner|rejected|all
 *      → { referrals: [...with contact joined], routing: { '21-5': { email, testRouting } } }
 *
 * POST { id, action, fields?, notes?, reason? }
 *      action = 'update'   → merge editable payload fields + notes
 *               'qualify'  → status pending_review → qualified
 *               'unqualify'→ status qualified → pending_review
 *               'reject'   → status → rejected (reason stored in notes/history)
 *               'reopen'   → status rejected → pending_review
 *               'send'     → status → sent_to_partner + notify partner contact
 *
 * 'send' is the ONLY action that leaves the building: it emails the partner
 * directory contact for the referral's partner. Until PARTNER_215_EMAIL is
 * set in the environment it routes to the internal test address and the email
 * is clearly labelled TEST ROUTING — same convention as the Partner Hub
 * notification test (pages/api/admin/partner-hub/notify.js).
 * On send, the linked CRM lead flips to status 'registered' and a note
 * activity is logged so the CRM timeline shows the handoff.
 */
import { requireAdmin } from '@/lib/newsletter/auth';
import { sendHtml } from '@/lib/resend';

const ADMIN_EMAIL = 'info@co-ownership-property.com';

// Partner routing directory. Env var flips a partner from test to live.
function partnerDirectory() {
  return {
    '21-5': {
      email: process.env.PARTNER_215_EMAIL || 'davson@hotmail.com',
      testRouting: !process.env.PARTNER_215_EMAIL,
    },
  };
}

const EDITABLE_FIELDS = ['name', 'phone', 'budget', 'destination', 'message', 'collection', 'property'];

function clean(value, max = 500) {
  return String(value ?? '').trim().slice(0, max);
}

function escapeHtml(value) {
  return clean(value, 2000)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default async function handler(req, res) {
  const ctx = await requireAdmin(req, res);
  if (!ctx) return;
  const { db, email: adminEmail } = ctx;

  if (req.method === 'GET') {
    const status = clean(req.query.status || 'all', 30);
    let q = db
      .from('partner_referrals')
      .select('*, contacts ( id, email, first_name, last_name, phone, country, locale, source, created_at )')
      .order('created_at', { ascending: false })
      .limit(500);
    if (status !== 'all') q = q.eq('status', status);
    const { data, error } = await q;
    if (error) return res.status(500).json({ error: error.message });
    return res.json({ referrals: data || [], routing: partnerDirectory() });
  }

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { id, action, fields, notes, reason } = req.body || {};
  if (!id || !action) return res.status(400).json({ error: 'Missing id or action' });

  const { data: referral, error: findErr } = await db
    .from('partner_referrals')
    .select('*, contacts ( id, email, first_name, last_name, phone, country )')
    .eq('id', id)
    .single();
  if (findErr || !referral) return res.status(404).json({ error: 'Referral not found' });

  const now = new Date().toISOString();
  const history = Array.isArray(referral.history) ? referral.history : [];
  const logEvent = (type, detail) => [...history, { at: now, by: adminEmail, type, detail: detail || null }];

  async function updateReferral(patch, event, detail) {
    const { data, error } = await db
      .from('partner_referrals')
      .update({ ...patch, history: logEvent(event, detail), updated_at: now })
      .eq('id', id)
      .select('*, contacts ( id, email, first_name, last_name, phone, country, locale, source, created_at )')
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  try {
    if (action === 'update') {
      const payload = { ...(referral.payload || {}) };
      for (const key of EDITABLE_FIELDS) {
        if (fields && Object.prototype.hasOwnProperty.call(fields, key)) {
          payload[key] = clean(fields[key], 2000) || null;
        }
      }
      const patch = { payload };
      if (notes !== undefined) patch.notes = clean(notes, 4000) || null;
      const updated = await updateReferral(patch, 'edited');
      return res.json({ ok: true, referral: updated });
    }

    if (action === 'qualify' || action === 'unqualify' || action === 'reopen') {
      const target = action === 'qualify' ? 'qualified' : 'pending_review';
      const updated = await updateReferral({ status: target }, action);
      return res.json({ ok: true, referral: updated });
    }

    if (action === 'reject') {
      const why = clean(reason, 1000);
      const updated = await updateReferral(
        { status: 'rejected', notes: why ? `${referral.notes ? referral.notes + '\n' : ''}Rejected: ${why}` : referral.notes },
        'rejected',
        why || null
      );
      return res.json({ ok: true, referral: updated });
    }

    if (action === 'send') {
      if (referral.status === 'sent_to_partner') {
        return res.status(400).json({ error: 'Already sent to the partner.' });
      }
      const directory = partnerDirectory();
      const route = directory[referral.partner];
      if (!route?.email) return res.status(400).json({ error: `No routing configured for partner ${referral.partner}` });

      const p = referral.payload || {};
      const c = referral.contacts || {};
      const leadName = p.name || [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email;
      const leadEmail = c.email || p.email;
      const leadPhone = p.phone || c.phone || 'Not supplied';
      const interest = p.collection || p.property || 'Collection enquiry';
      const routingLabel = route.testRouting ? 'TEST ROUTING' : 'LIVE PARTNER ROUTING';

      await sendHtml({
        to: route.email,
        cc: route.email === ADMIN_EMAIL ? undefined : ADMIN_EMAIL,
        subject: `${route.testRouting ? '[TEST] ' : ''}New COP lead — ${clean(leadName, 120)}`,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#183247;max-width:620px;margin:0 auto;padding:28px;">
            <p style="margin:0 0 8px;color:#2c9d7b;font-size:12px;font-weight:700;letter-spacing:.08em;">${routingLabel}</p>
            <h2 style="margin:0 0 18px;font-size:24px;">New lead from Co-Ownership Property</h2>
            <p><strong>Name:</strong> ${escapeHtml(leadName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(leadEmail)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(leadPhone)}</p>
            <p><strong>Interest:</strong> ${escapeHtml(interest)}</p>
            ${p.destination ? `<p><strong>Destination:</strong> ${escapeHtml(p.destination)}</p>` : ''}
            ${p.budget ? `<p><strong>Budget:</strong> ${escapeHtml(p.budget)}</p>` : ''}
            ${p.message ? `<p><strong>Message:</strong> ${escapeHtml(p.message)}</p>` : ''}
            ${referral.notes ? `<p><strong>Qualification notes:</strong> ${escapeHtml(referral.notes)}</p>` : ''}
            <p style="margin-top:24px;padding-top:16px;border-top:1px solid #e4e9ec;color:#758491;font-size:12px;">Sent by the COP Partner Hub after manual qualification.</p>
          </div>
        `,
      });

      const updated = await updateReferral(
        { status: 'sent_to_partner', sent_at: now, sent_by: adminEmail },
        'sent',
        route.testRouting ? `test → ${route.email}` : route.email
      );

      // Reflect the handoff in the CRM: linked lead → registered + note activity.
      try {
        if (referral.lead_id) {
          await db.from('leads').update({ status: 'registered', updated_at: now }).eq('id', referral.lead_id);
        }
        await db.from('activities').insert({
          contact_id: referral.contact_id,
          lead_id: referral.lead_id || null,
          type: 'note',
          description: `Sent to ${referral.partner} via Partner Hub${route.testRouting ? ' (test routing)' : ''}`,
          metadata: { partner: referral.partner, referral_id: referral.id, routed_to: route.email, test_routing: route.testRouting },
        });
      } catch (e) {
        console.error('[partner-referrals] CRM reflection failed:', e.message);
      }

      return res.json({ ok: true, referral: updated, routedTo: route.email, testRouting: route.testRouting });
    }

    return res.status(400).json({ error: `Unknown action ${clean(action, 40)}` });
  } catch (e) {
    console.error('[partner-referrals]', e.message);
    return res.status(500).json({ error: e.message });
  }
}
