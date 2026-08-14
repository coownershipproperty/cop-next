/**
 * POST /api/admin/ui/newsletter-send
 *
 * Body: { campaignId, confirm: true }
 *
 * For each contact in the resolved audience:
 *   1. Upsert a newsletter_sends row with primary/fallback property slugs
 *   2. Render the email
 *   3. Dispatch via Resend and mark the row 'sent'
 *
 * Marks campaign.status = 'sending' while in progress, then 'sent' on completion.
 *
 * ---------------------------------------------------------------------------
 * SPEED (added 6 Aug 2026 — read before touching the loop)
 * ---------------------------------------------------------------------------
 * The original loop did TWO things per recipient that made a 1,000-person send
 * take ~8 minutes and blow the 300 s function limit (which is what left the
 * 6 Aug EU campaign stuck at 391/991):
 *   - a separate `leads` query per contact to get their region interests, and
 *   - a separate Resend API round-trip per email.
 * Both are now amortised:
 *   - interests are PRE-FETCHED for the whole audience in chunked bulk queries
 *     (prefetchInterests), so the per-recipient DB round-trip is gone;
 *   - emails are rendered per recipient (personalisation is preserved) but sent
 *     in BATCHES of up to 100 via resend.batch.send, so ~1,000 emails cost ~10
 *     API calls, not ~1,000. A full list now dispatches in well under a minute,
 *     inside a single invocation.
 *
 * ---------------------------------------------------------------------------
 * THE 300-SECOND WALL (fixed 26 Jul 2026 — the defences below still apply)
 * ---------------------------------------------------------------------------
 * Vercel kills a function at 300 s. Even though batching makes that unlikely to
 * be reached, all three defences stay, because the audience can always grow:
 *
 *   1. TIME BUDGET. Stop cleanly at MAX_RUN_MS between batches and return
 *      { done: false, remaining }. Never rely on raising maxDuration alone.
 *   2. RESUMABLE. A campaign at status 'sending' may be re-entered; contacts
 *      that already have a 'sent'/'cancelled' row are skipped, so nobody is
 *      mailed twice. (Also enforced by UNIQUE (campaign_id, contact_id) — every
 *      write is an upsert.) A row is marked 'sent' only AFTER its batch call
 *      returns without error; a batch that throws leaves its rows 'pending'
 *      (loud on resume, never a silent drop).
 *   3. RECONCILED COUNTS. sent_count is read back from an actual count of
 *      'sent' rows, never a per-invocation counter.
 */
import { requireAdmin } from '@/lib/newsletter/auth';
import { resolveAudience, excludeAlreadyEnquired, fetchAllRows } from '@/lib/newsletter/audience';
import { reorderForRecipient } from '@/lib/newsletter/personalize';
import { renderRecipient } from '@/lib/newsletter/render';
import { sendHtmlBatch } from '@/lib/resend';

/** Platform ceiling for this function. Declared explicitly so a change to the
 *  Vercel default cannot silently shorten the window. The time budget below is
 *  what actually protects the send — this is only the outer bound. */
export const maxDuration = 300;

/** Stop the loop here, leaving ~60 s of headroom for the final campaign write
 *  and the HTTP response. Deliberately well under maxDuration. */
const MAX_RUN_MS = 240_000;

/** Resend caps a single batch at 100 messages. */
const BATCH_SIZE = 100;

/** PostgREST puts filters in the URL, so keep bulk `in` lists modest. */
const LOOKUP_CHUNK = 200;

/** Cheap sanity check so an unsendable address costs no Resend round-trip.
 *  Catches the real-world case: a floor-plan form capturing "name@gmail". */
function looksSendable(email) {
  const e = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

/**
 * Bulk version of getContactInterests: one region/budget profile per contact,
 * built from a handful of chunked `leads` queries instead of one query per
 * recipient. Returns Map<contactId, { interests, budgetMax }>.
 */
async function prefetchInterests(db, contactIds) {
  const byContact = new Map();
  for (let i = 0; i < contactIds.length; i += LOOKUP_CHUNK) {
    const slice = contactIds.slice(i, i + LOOKUP_CHUNK);
    const { data: leads, error } = await db
      .from('leads')
      .select('contact_id, main_region, subregion, budget_max')
      .in('contact_id', slice);
    if (error) throw new Error('interest prefetch failed: ' + error.message);
    for (const l of leads || []) {
      let entry = byContact.get(l.contact_id);
      if (!entry) { entry = { interests: [], budgetMax: null }; byContact.set(l.contact_id, entry); }
      const main = (l.main_region || '').trim() || null;
      const sub  = (l.subregion  || '').trim() || null;
      if (main || sub) {
        if (!entry.interests.some(x => x.mainRegion === main && x.subregion === sub)) {
          entry.interests.push({ mainRegion: main, subregion: sub });
        }
      }
      if (l.budget_max) {
        const b = Number(l.budget_max);
        if (!entry.budgetMax || b > entry.budgetMax) entry.budgetMax = b;
      }
    }
  }
  return byContact;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const startedAt = Date.now();

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
  if (campaign.status === 'sent') return res.status(400).json({ error: 'Campaign already sent' });
  // status 'sending' is NOT rejected — that is a resume of a run the platform
  // killed. Already-sent recipients are skipped below.
  const isResume = campaign.status === 'sending';

  const propertySlugs = campaign.property_slugs || [];
  const TEMPLATES_WITHOUT_PROPERTY_PICKER = new Set(['viewings-france']);
  const skipPropertyCheck = TEMPLATES_WITHOUT_PROPERTY_PICKER.has(campaign.template_type);
  if (!propertySlugs.length && !skipPropertyCheck) return res.status(400).json({ error: 'No properties selected' });

  // Resolve audience
  const { contacts } = await resolveAudience(db, campaign.audience_segment, campaign.audience_filter);
  let recipients = contacts;
  if (excludeEnquired && campaign.audience_segment === 'all') {
    const out = await excludeAlreadyEnquired(db, recipients, propertySlugs);
    recipients = out.contacts;
  }
  if (!recipients.length) return res.status(400).json({ error: 'Audience is empty' });

  // Who has already been dealt with on a previous invocation? Only 'sent' and
  // 'cancelled' are terminal; 'pending'/'failed' are retried.
  const alreadyDone = new Set();
  try {
    // Paged: an unbounded select caps at 1,000 rows, which above 1,000
    // recipients would hide prior sends and re-mail people (see audience.js).
    const priorRows = await fetchAllRows(() => db
      .from('newsletter_sends')
      .select('id, contact_id, status')
      .eq('campaign_id', campaignId)
      .in('status', ['sent', 'cancelled']));
    for (const r of priorRows) if (r.contact_id) alreadyDone.add(r.contact_id);
  } catch (priorErr) {
    console.error('[newsletter-send] could not read prior sends:', priorErr.message);
    return res.status(500).json({ error: 'Could not determine which recipients were already sent' });
  }

  // Fetch properties once
  const { data: properties } = await db
    .from('properties')
    .select('slug, title, region, city, country, price, currency, img, beds, size')
    .in('slug', propertySlugs);
  const propBySlug = {};
  for (const p of properties || []) propBySlug[p.slug] = p;

  // Mark sending. Never lower total_recipients on a resume.
  {
    const targetTotal = Math.max(recipients.length, campaign.total_recipients || 0);
    const { error } = await db.from('newsletter_campaigns')
      .update({ status: 'sending', total_recipients: targetTotal })
      .eq('id', campaignId);
    if (error) {
      console.error('[newsletter-send] could not mark campaign sending:', error.message);
      return res.status(500).json({ error: 'Could not start campaign: ' + error.message });
    }
  }

  // Everyone still to do (skip those already sent). skipped counts the rest.
  const todo = recipients.filter(c => !alreadyDone.has(c.id));
  const skipped = recipients.length - todo.length;

  // Pre-fetch region interests for the whole audience in bulk (one profile per
  // contact) — replaces the old per-recipient leads query.
  let interestsByContact = new Map();
  if (campaign.personalize_by_region && todo.length) {
    interestsByContact = await prefetchInterests(db, todo.map(c => c.id));
  }

  let sent = 0, failed = 0, remaining = 0;
  let timedOut = false;

  for (let i = 0; i < todo.length; i += BATCH_SIZE) {
    // Out of budget: stop cleanly and leave the rest for the next invocation.
    if (Date.now() - startedAt > MAX_RUN_MS) {
      timedOut = true;
      remaining = todo.length - i;
      break;
    }

    const chunk = todo.slice(i, i + BATCH_SIZE);

    // Render every email in the chunk (personalised per recipient). A single
    // recipient that fails to render is recorded 'failed' and dropped from the
    // batch; the rest still go.
    const prepared = await Promise.all(chunk.map(async (contact) => {
      try {
        let primarySlugs = propertySlugs;
        let fallbackSlugs = [];
        if (campaign.personalize_by_region) {
          const { interests } = interestsByContact.get(contact.id) || { interests: [] };
          const ordered = reorderForRecipient(propertySlugs, propBySlug, interests);
          primarySlugs = ordered.primary;
          fallbackSlugs = ordered.fallback;
        }
        if (!looksSendable(contact.email)) {
          return { contact, primarySlugs, fallbackSlugs, error: `Unsendable address "${contact.email}"` };
        }
        const primaryProps  = primarySlugs.map(s => propBySlug[s]).filter(Boolean);
        const fallbackProps = fallbackSlugs.map(s => propBySlug[s]).filter(Boolean);
        const { html, subject } = await renderRecipient({
          templateType:    campaign.template_type || 'personalised-newsletter',
          firstName:       contact.first_name || 'there',
          email:           contact.email,
          primaryProps,
          fallbackProps,
          subjectTemplate: campaign.subject,
          introText:       campaign.intro_text,
        });
        return { contact, primarySlugs, fallbackSlugs, html, subject };
      } catch (err) {
        return { contact, primarySlugs: propertySlugs, fallbackSlugs: [], error: String(err.message).slice(0, 500) };
      }
    }));

    // Upsert one row per recipient in the chunk (status 'pending'), then read
    // the ids back so we can flip them to 'sent' after the batch call.
    const rows = prepared.map(p => ({
      campaign_id:    campaignId,
      contact_id:     p.contact.id,
      email:          p.contact.email,
      property_slugs: propertySlugs,
      primary_slugs:  p.primarySlugs,
      fallback_slugs: p.fallbackSlugs,
      status:         'pending',
      error:          null,
    }));
    const { data: upserted, error: upsertErr } = await db
      .from('newsletter_sends')
      .upsert(rows, { onConflict: 'campaign_id,contact_id' })
      .select('id, contact_id');
    if (upsertErr) {
      // Can't track this chunk safely — stop rather than send untracked mail.
      console.error('[newsletter-send] chunk upsert failed:', upsertErr.message);
      timedOut = true;
      remaining = todo.length - i;
      break;
    }
    const rowIdByContact = new Map((upserted || []).map(r => [r.contact_id, r.id]));

    // Records that failed to render / are unsendable: mark 'failed' now, keep
    // them out of the batch.
    const badIds = prepared.filter(p => p.error).map(p => rowIdByContact.get(p.contact.id)).filter(Boolean);
    if (badIds.length) {
      await db.from('newsletter_sends')
        .update({ status: 'failed', error: 'render/address error' })
        .in('id', badIds);
      failed += badIds.length;
    }

    // The sendable remainder → one Resend batch call.
    const sendable = prepared.filter(p => !p.error && p.html);
    if (!sendable.length) continue;

    const messages = sendable.map(p => ({
      to:      p.contact.email,
      subject: p.subject,
      html:    p.html,
      from:    'Dylan at Co-Ownership Property <dylan@co-ownership-property.com>',
      replyTo: 'dylan@co-ownership-property.com',
    }));

    try {
      await sendHtmlBatch(messages);
      // Batch accepted → mark every row in it 'sent'.
      const sentIds = sendable.map(p => rowIdByContact.get(p.contact.id)).filter(Boolean);
      if (sentIds.length) {
        const { error: updErr } = await db.from('newsletter_sends')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .in('id', sentIds);
        if (updErr) console.error('[newsletter-send] batch SENT but status write failed:', updErr.message);
      }
      sent += sendable.length;
    } catch (err) {
      // Whole batch rejected — leave the rows 'pending' so the next run retries
      // them. Nobody in this batch is marked 'sent'.
      console.error('[newsletter-send] batch send failed:', err.message);
      failed += sendable.length;
    }
  }

  // Reconcile sent_count from the rows themselves.
  const { count: totalSent } = await db
    .from('newsletter_sends')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'sent');

  const done = !timedOut;
  const { error: finalErr } = await db.from('newsletter_campaigns')
    .update({
      status:     done ? 'sent' : 'sending',
      sent_count: totalSent ?? sent,
      sent_at:    done ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId);
  if (finalErr) {
    console.error('[newsletter-send] final campaign write failed:', finalErr.message);
    return res.status(500).json({
      error: 'Emails were sent but the campaign record could not be updated: ' + finalErr.message,
      sent, failed, skipped,
    });
  }

  return res.json({
    ok: true,
    done,
    sent,
    failed,
    skipped,
    remaining,
    totalSent: totalSent ?? sent,
    total: recipients.length,
    resumed: isResume,
    message: done
      ? null
      : `Stopped at the time limit with ${remaining} recipients left. Press Send again to resume — nobody will be mailed twice.`,
  });
}
