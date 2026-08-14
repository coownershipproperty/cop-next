/**
 * GET/POST /api/cron/newsletter-drain
 * Cron job (see vercel.json). Authorization: Bearer <CRON_SECRET>.
 *
 * WHY THIS EXISTS
 * ---------------------------------------------------------------------------
 * /api/admin/ui/newsletter-send sends in ~4-minute batches and is *resumable*
 * (it skips anyone already 'sent'), but nothing re-invokes it: the admin button
 * fires it exactly once. So any audience over ~400 people stalls at one batch
 * (e.g. the 6 Aug 2026 EU campaign stopped at 391/991 and sat in 'sending'),
 * and a browser that navigates away can kill the request even sooner.
 *
 * This cron is the missing re-invoker. Every run it finds the oldest campaign
 * still in status 'sending' and drains one more time-budgeted batch, using the
 * SAME lib helpers and the SAME dedupe guards as the manual route, until the
 * campaign is fully sent and flips itself to 'sent'. No clicks, no babysitting.
 *
 * SAFETY — why this cannot double-send
 * ---------------------------------------------------------------------------
 *   1. Only status 'sending' campaigns are touched. Drafts are never sent.
 *   2. `alreadyDone` is loaded from the 'sent'/'cancelled' rows and skipped,
 *      exactly like the manual route.
 *   3. newsletter_sends has UNIQUE (campaign_id, contact_id); every write is an
 *      upsert, so a duplicate row is impossible.
 *   4. NO OVERLAP: MAX_RUN_MS (3.5 min) is comfortably below the 5-minute cron
 *      interval and the 300 s platform ceiling, so one run always finishes
 *      before the next begins — two ticks never process the same campaign at
 *      once. (If an operator also clicks Send during a tick the guards above
 *      still hold; the constraint is the backstop.)
 *
 * The batch loop below is deliberately kept identical to
 * pages/api/admin/ui/newsletter-send.js — that route is the source of truth for
 * the send semantics; if you change one, change both.
 */
import { resolveAudience, excludeAlreadyEnquired, getContactInterests, fetchAllRows } from '@/lib/newsletter/audience';
import { reorderForRecipient } from '@/lib/newsletter/personalize';
import { renderRecipient } from '@/lib/newsletter/render';
import { sendHtml } from '@/lib/resend';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

/** Platform ceiling. The time budget below is what actually protects the run. */
export const maxDuration = 300;

/** Stop the loop at 3.5 min. With the 5-minute cron this leaves a ~90 s gap
 *  before the next tick, so runs never overlap (see SAFETY note 4). */
const MAX_RUN_MS = 210_000;

const TEMPLATES_WITHOUT_PROPERTY_PICKER = new Set(['viewings-france']);

/** Cheap sanity check so an unsendable address costs no Resend round-trip. */
function looksSendable(email) {
  const e = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

function getDb() {
  return createSupabaseAdminClient();
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth: Vercel injects `Authorization: Bearer <CRON_SECRET>` on scheduled
  // runs (same convention as /api/process-email-queue). Also accept the
  // x-vercel-cron marker as a fallback, mirroring /api/email-engine.
  const secret = process.env.CRON_SECRET;
  const auth = req.headers['authorization'] || '';
  const isCronHeader = req.headers['x-vercel-cron'] === '1';
  const isAuthed = (secret && auth === `Bearer ${secret}`) || isCronHeader;
  if (!isAuthed) return res.status(401).json({ error: 'Unauthorised' });

  const startedAt = Date.now();
  const db = getDb();

  // Find the oldest campaign still sending. One per tick keeps us inside the
  // time budget; a second stuck campaign is picked up on the next run.
  const { data: campaigns, error: findErr } = await db
    .from('newsletter_campaigns')
    .select('*')
    .eq('status', 'sending')
    .order('updated_at', { ascending: true })
    .limit(1);
  if (findErr) {
    console.error('[newsletter-drain] could not query sending campaigns:', findErr.message);
    return res.status(500).json({ error: findErr.message });
  }
  if (!campaigns || campaigns.length === 0) {
    return res.json({ ok: true, drained: 0, message: 'No campaigns in sending state.' });
  }

  const campaign = campaigns[0];
  const campaignId = campaign.id;

  const propertySlugs = campaign.property_slugs || [];
  const skipPropertyCheck = TEMPLATES_WITHOUT_PROPERTY_PICKER.has(campaign.template_type);
  if (!propertySlugs.length && !skipPropertyCheck) {
    // A sending campaign with no properties can never complete — mark it back to
    // draft so it stops being picked up every tick, and report it.
    await db.from('newsletter_campaigns')
      .update({ status: 'draft', updated_at: new Date().toISOString() })
      .eq('id', campaignId);
    return res.json({ ok: true, campaignId, error: 'No properties selected — reverted to draft.' });
  }

  // Resolve audience exactly as the manual route does, honouring the same
  // "skip already enquired" default (the admin checkbox is on by default;
  // audience_filter.exclude_enquired === false opts out).
  const { contacts } = await resolveAudience(db, campaign.audience_segment, campaign.audience_filter);
  let recipients = contacts;
  const excludeEnquired = campaign.audience_filter?.exclude_enquired !== false;
  if (excludeEnquired && campaign.audience_segment === 'all') {
    const out = await excludeAlreadyEnquired(db, recipients, propertySlugs);
    recipients = out.contacts;
  }
  if (!recipients.length) {
    return res.json({ ok: true, campaignId, error: 'Audience resolved empty.' });
  }

  // Who is already done (skipped so nobody is mailed twice).
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
    // Fail closed: without this list a drain would re-mail everyone already sent.
    console.error('[newsletter-drain] could not read prior sends:', priorErr.message);
    return res.status(500).json({ error: 'Could not determine which recipients were already sent' });
  }

  // Fetch properties once.
  const { data: properties } = await db
    .from('properties')
    .select('slug, title, region, city, country, price, currency, img, beds, size')
    .in('slug', propertySlugs);
  const propBySlug = {};
  for (const p of properties || []) propBySlug[p.slug] = p;

  // Keep total_recipients honest (never lower it on a resume).
  {
    const targetTotal = Math.max(recipients.length, campaign.total_recipients || 0);
    await db.from('newsletter_campaigns')
      .update({ status: 'sending', total_recipients: targetTotal, updated_at: new Date().toISOString() })
      .eq('id', campaignId);
  }

  let sent = 0, failed = 0, skipped = 0, remaining = 0;
  let timedOut = false;

  for (const contact of recipients) {
    if (alreadyDone.has(contact.id)) { skipped++; continue; }
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
        if (updErr) console.error(`[newsletter-drain] SENT but status write failed for ${contact.email}:`, updErr.message);
      }
      sent++;
    } catch (err) {
      console.error(`[newsletter-drain] ${contact.email}:`, err.message);
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
      if (failErr) console.error(`[newsletter-drain] could not record failure for ${contact.email}:`, failErr.message);
      failed++;
    }
  }

  // Reconcile sent_count from the rows themselves, then close out. Runs on every
  // exit — including the final tick that sends nothing new — so a finished
  // campaign always flips to 'sent' instead of sitting in 'sending' forever.
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
      sent_at:    done ? new Date().toISOString() : (campaign.sent_at || null),
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId);
  if (finalErr) {
    console.error('[newsletter-drain] final campaign write failed:', finalErr.message);
    return res.status(500).json({ error: 'Batch sent but campaign record update failed: ' + finalErr.message, sent, failed, skipped });
  }

  return res.json({
    ok: true,
    campaignId,
    campaignName: campaign.name,
    done,
    sent,
    failed,
    skipped,
    remaining,
    totalSent: totalSent ?? sent,
    target: recipients.length,
    message: done
      ? `Campaign complete — ${totalSent ?? sent} sent.`
      : `Drained a batch (${sent} this run); ${remaining} still to go, next cron tick will continue.`,
  });
}
