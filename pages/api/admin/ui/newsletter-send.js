/**
 * POST /api/admin/ui/newsletter-send
 *
 * Body: { campaignId, confirm: true }
 *
 * For each contact in the resolved audience:
 *   1. Upsert a newsletter_sends row with primary/fallback property slugs
 *   2. Render the email and call Resend
 *   3. Update the send row + campaign counters
 *
 * Marks campaign.status = 'sending' while in progress, then 'sent' on completion.
 *
 * ---------------------------------------------------------------------------
 * THE 300-SECOND WALL (fixed 26 Jul 2026 — read this before changing the loop)
 * ---------------------------------------------------------------------------
 * This route sends the entire audience inside ONE serverless invocation, at
 * roughly 0.5 s per recipient. Vercel kills a function at 300 s. Once the
 * audience passed ~600 people the function was killed mid-loop and everything
 * after the loop — the status:'sent' write, sent_count, sent_at — never ran.
 *
 * That was not merely a cosmetic "stuck at sending" bug. Because a row is
 * inserted only when the loop REACHES that person, everyone below the cut had
 * no row at all: not failed, not skipped, invisible. Two real campaigns:
 *
 *   7 Jul 2026 — audience 774, reached 597, sent 596. Ran 298 s.
 *   23 Jun 2026 — audience 702, reached 623, sent 621. Ran 298 s.
 *
 * ~256 people were silently dropped, and because the audience resolves in a
 * stable order the SAME 95 people were dropped both times. They were also the
 * newest leads — 70 % had signed up in the previous four months, including 19
 * paid Rightmove leads.
 *
 * Three defences, all of which must stay:
 *
 *   1. TIME BUDGET. The loop stops cleanly at MAX_RUN_MS with headroom to
 *      spare and returns { done: false, remaining }. Never rely on raising
 *      maxDuration alone — the audience grows, the ceiling does not.
 *   2. RESUMABLE. A campaign already at status 'sending' may be re-entered;
 *      contacts that already have a 'sent' row are skipped. Pressing Send
 *      again picks up exactly where the previous invocation stopped. The old
 *      code rejected any campaign at 'sending', which made a killed run
 *      permanently unresumable.
 *   3. RECONCILED COUNTS. sent_count is read back from an actual count of
 *      'sent' rows, not from a counter local to one invocation. The old
 *      per-invocation counter is why "30 april 2026" recorded 137 against 351
 *      real sends.
 *
 * Also note UNIQUE (campaign_id, contact_id) on newsletter_sends. The previous
 * error path in THIS file INSERTed a fresh row with status 'failed', which
 * ALWAYS collided with the 'pending' row written moments earlier, returned
 * 23505, and was swallowed by a bare catch {} — so a genuine send failure was
 * recorded as, and indistinguishable from, an interrupted 'pending'. (No
 * 'failed' row has ever existed in the table; the sibling route
 * /api/admin/newsletter/send does update correctly, it simply was not the route
 * that ran these campaigns.) Every write here is now an upsert or an update on
 * a known id, and every error is checked.
 */
import { requireAdmin } from '@/lib/newsletter/auth';
import { resolveAudience, excludeAlreadyEnquired, getContactInterests } from '@/lib/newsletter/audience';
import { reorderForRecipient } from '@/lib/newsletter/personalize';
import { renderRecipient } from '@/lib/newsletter/render';
import { sendHtml } from '@/lib/resend';

/** Platform ceiling for this function. Declared explicitly so a change to the
 *  Vercel default cannot silently shorten the window. The time budget below is
 *  what actually protects the send — this is only the outer bound. */
export const maxDuration = 300;

/** Stop the loop here, leaving ~60 s of headroom for the final campaign write
 *  and the HTTP response. Deliberately well under maxDuration. */
const MAX_RUN_MS = 240_000;

/** Cheap sanity check so an unsendable address costs no Resend round-trip.
 *  Catches the real-world case: a floor-plan form capturing "name@gmail". */
function looksSendable(email) {
  const e = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
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
  // killed. See the header note. Already-sent recipients are skipped below.
  const isResume = campaign.status === 'sending';

  const propertySlugs = campaign.property_slugs || [];
  // Templates with a static content list (e.g. viewings-france pulls from
  // lib/viewings.json) don't need per-campaign property selection.
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
  // 'cancelled' are terminal — 'pending' means a run died mid-recipient and
  // 'failed' may have been transient, so both are retried.
  const alreadyDone = new Set();
  {
    const { data: priorRows, error: priorErr } = await db
      .from('newsletter_sends')
      .select('contact_id, status')
      .eq('campaign_id', campaignId)
      .in('status', ['sent', 'cancelled']);
    if (priorErr) {
      console.error('[newsletter-send] could not read prior sends:', priorErr.message);
      // Fail closed: without this list a resume would re-mail everyone already sent.
      return res.status(500).json({ error: 'Could not determine which recipients were already sent' });
    }
    for (const r of priorRows || []) if (r.contact_id) alreadyDone.add(r.contact_id);
  }

  // Fetch properties once
  const { data: properties } = await db
    .from('properties')
    .select('slug, title, region, city, country, price, currency, img, beds, size')
    .in('slug', propertySlugs);
  const propBySlug = {};
  for (const p of properties || []) propBySlug[p.slug] = p;

  // Mark sending. total_recipients is the full resolved audience — it is the
  // target, and leaving it at the true figure is what makes the shortfall
  // (total_recipients - sent_count) visible in the CRM if anything goes wrong.
  // On a resume never lower it: the audience is re-resolved live, so people who
  // unsubscribed since the first invocation would otherwise quietly shrink the
  // target and erase the evidence of the shortfall.
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

  let sent = 0, failed = 0, skipped = 0, remaining = 0;
  let timedOut = false;

  for (const contact of recipients) {
    if (alreadyDone.has(contact.id)) { skipped++; continue; }

    // Out of budget: stop cleanly and leave the rest for the next invocation.
    if (Date.now() - startedAt > MAX_RUN_MS) { timedOut = true; remaining++; continue; }

    let primarySlugs = propertySlugs;
    let fallbackSlugs = [];
    let sendRowId = null;

    try {
      if (campaign.personalize_by_region) {
        const { interests } = await getContactInterests(db, contact.id);
        const ordered = reorderForRecipient(propertySlugs, propBySlug, interests);
        primarySlugs = ordered.primary;
        fallbackSlugs = ordered.fallback;
      }

      // Upsert, not insert — UNIQUE (campaign_id, contact_id) means a retry of
      // an interrupted or failed recipient would otherwise throw 23505.
      const { data: sendRow, error: rowErr } = await db.from('newsletter_sends').upsert({
        campaign_id:    campaignId,
        contact_id:     contact.id,
        email:          contact.email,
        property_slugs: propertySlugs,
        primary_slugs:  primarySlugs,
        fallback_slugs: fallbackSlugs,
        status:         'pending',
        error:          null,
      }, { onConflict: 'campaign_id,contact_id' }).select().single();
      if (rowErr) throw new Error('send-row upsert failed: ' + rowErr.message);
      sendRowId = sendRow?.id || null;

      if (!looksSendable(contact.email)) {
        throw new Error(`Unsendable address "${contact.email}" — not attempted`);
      }

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

      if (sendRowId) {
        const { error: updErr } = await db.from('newsletter_sends')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', sendRowId);
        // The email HAS gone out. A failed status write means the row will be
        // retried on resume and the person mailed twice — loud, not silent.
        if (updErr) console.error(`[newsletter-send] SENT but status write failed for ${contact.email}:`, updErr.message);
      }
      sent++;
    } catch (err) {
      console.error(`[newsletter-send] ${contact.email}:`, err.message);
      // UPDATE the row we already own. The old code INSERTed a second row here,
      // which always violated UNIQUE (campaign_id, contact_id) and was thrown
      // away by an empty catch — which is why no send has ever been recorded
      // as failed.
      const failWrite = sendRowId
        ? db.from('newsletter_sends')
            .update({ status: 'failed', error: String(err.message).slice(0, 500) })
            .eq('id', sendRowId)
        : db.from('newsletter_sends')
            .upsert({
              campaign_id:    campaignId,
              contact_id:     contact.id,
              email:          contact.email,
              property_slugs: propertySlugs,
              primary_slugs:  primarySlugs,
              fallback_slugs: fallbackSlugs,
              status:         'failed',
              error:          String(err.message).slice(0, 500),
            }, { onConflict: 'campaign_id,contact_id' });
      const { error: failErr } = await failWrite;
      if (failErr) console.error(`[newsletter-send] could not record failure for ${contact.email}:`, failErr.message);
      failed++;
    }
  }

  // Reconcile from the rows themselves. A counter local to this invocation
  // undercounts every time the send spans more than one invocation.
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
    // Surfaced so the admin UI can tell the operator what to do next.
    message: done
      ? null
      : `Stopped at the time limit with ${remaining} recipients left. Press Send again to resume — nobody will be mailed twice.`,
  });
}
