/**
 * POST /api/admin/newsletter/send
 *
 * Drains the `pending` newsletter_sends rows that /api/admin/newsletter/prepare
 * created for a campaign. One row per recipient, already carrying the chosen
 * primary/fallback slugs.
 *
 * ---------------------------------------------------------------------------
 * THE 300-SECOND WALL (fixed 26 Jul 2026 — read this before changing the loop)
 * ---------------------------------------------------------------------------
 * Vercel kills a serverless function at 300 s. This loop costs roughly 0.5 s per
 * recipient (render + Resend round-trip), so anything past ~600 recipients was
 * killed mid-loop with everything after the loop — the campaign status write —
 * never running. Its sibling /api/admin/ui/newsletter-send was demonstrably
 * killed this way on 23 Jun and 7 Jul 2026, dropping ~256 people silently.
 *
 * This route degrades more gracefully than that one, because a row exists for
 * every recipient before the loop starts, so an interrupted run leaves visible
 * `pending` rows rather than nothing at all. It still needs the same defences:
 *
 *   1. TIME BUDGET. Stop cleanly at MAX_RUN_MS and report { done: false,
 *      remaining }. Raising maxDuration alone is not a fix — the audience grows,
 *      the ceiling does not.
 *   2. RESUMABLE. Re-running only picks up rows still at 'pending', so nobody is
 *      mailed twice. A campaign left at 'sending' is therefore re-enterable;
 *      only 'sent' is refused.
 *   3. RECONCILED COUNTS. sent_count is read back from a count of 'sent' rows,
 *      never from a counter local to one invocation. That per-invocation counter
 *      is why "30 april 2026" recorded 137 against 351 real sends.
 *   4. CLOSE OUT ON EVERY EXIT. The old code returned early when there were no
 *      pending rows left, so the *final* re-run of a finished campaign — exactly
 *      the run that should have marked it sent — left it stuck at its old
 *      status forever.
 */
import { render } from '@react-email/render';
import PersonalisedNewsletterEmail from '../../../../emails/personalised-newsletter';
import { sendHtml } from '../../../../lib/resend';
import { requireCrmAdmin, setCrmCors } from '@/lib/adminAuth';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { unsubUrl, listUnsubHeaders } from '@/lib/unsub';
import { filterSuppressed } from '@/lib/suppressions';

/** Platform ceiling, declared so a change to the Vercel default cannot silently
 *  shorten the window. The time budget below is what actually protects the send. */
export const maxDuration = 300;

/** Stop the loop here, leaving ~60 s of headroom for the reconcile and response. */
const MAX_RUN_MS = 240_000;

/** PostgREST puts the filter in the URL, so a 900-id `in` list can exceed the
 *  gateway's URL limit and fail the whole request. Chunk every bulk lookup. */
const LOOKUP_CHUNK = 200;

function getDb() {
  return createSupabaseAdminClient();
}

const CURRENCY_SYMBOLS = { EUR: '€', USD: '$', GBP: '£', CHF: 'CHF ', SEK: 'SEK ' };
function formatPrice(price, currency) {
  const sym = CURRENCY_SYMBOLS[currency] || (currency ? currency + ' ' : '');
  return `${sym}${Number(price).toLocaleString('en-GB')}`;
}

/** Cheap sanity check so an unsendable address costs no Resend round-trip.
 *  Catches the real-world case: a form capturing "name@gmail" with no TLD. */
function looksSendable(email) {
  const e = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}

/**
 * Reconcile sent_count from the rows themselves and set the campaign's final
 * status. Called on EVERY exit path, including the ones that send nothing —
 * that is the whole point, see defence 4 above.
 */
async function closeOut(db, campaignId, { done }) {
  const { count: totalSent, error: countErr } = await db
    .from('newsletter_sends')
    .select('id', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'sent');
  if (countErr) {
    console.error('[newsletter/send] could not count sent rows:', countErr.message);
    return { totalSent: null, error: countErr.message };
  }

  const patch = {
    status:     done ? 'sent' : 'sending',
    sent_count: totalSent ?? 0,
    updated_at: new Date().toISOString(),
  };
  if (done) patch.sent_at = new Date().toISOString();

  const { error } = await db.from('newsletter_campaigns').update(patch).eq('id', campaignId);
  if (error) console.error('[newsletter/send] final campaign write failed:', error.message);
  return { totalSent, error: error?.message || null };
}

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    setCrmCors(res);
    return res.status(200).end();
  }
  setCrmCors(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const admin = await requireCrmAdmin(req, res);
  if (!admin) return;

  const { campaignId } = req.body || {};
  if (!campaignId) return res.status(400).json({ error: 'campaignId is required' });

  const startedAt = Date.now();
  const db = getDb();

  try {
    // Verify campaign exists and isn't already sent
    const { data: campaign, error: campErr } = await db
      .from('newsletter_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();
    if (campErr || !campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status === 'sent') return res.status(400).json({ error: 'Campaign already sent' });
    // 'sending' is deliberately allowed through: it means a previous invocation
    // was cut short. Only 'pending' rows are picked up, so nobody is re-mailed.
    const isResume = campaign.status === 'sending';

    // Get all pending sends for this campaign
    const { data: sends, error: sendsErr } = await db
      .from('newsletter_sends')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');
    if (sendsErr) throw sendsErr;

    // Nothing left to send. This is the run that FINISHES a campaign whose last
    // recipients went out on a previous invocation — the old code returned here
    // without touching the campaign, which is how a fully-sent campaign could
    // sit at 'sending' indefinitely with a stale sent_count.
    if (!sends || sends.length === 0) {
      const { totalSent, error: closeErr } = await closeOut(db, campaignId, { done: true });
      if (closeErr) return res.status(500).json({ error: closeErr });
      return res.json({ ok: true, done: true, sent: 0, failed: 0, skipped: 0, remaining: 0, totalSent, resumed: isResume });
    }

    // ── Suppression guard ────────────────────────────────────────────────────
    // These rows were written when the campaign was prepared, which may have
    // been days ago. Anyone who unsubscribed in between must not be mailed, so
    // re-check at send time rather than trusting the prepared list.
    const { kept: notSuppressed, dropped: suppressedRows } = await filterSuppressed(db, sends);
    if (suppressedRows.length) {
      const { error: cancelErr } = await db
        .from('newsletter_sends')
        .update({ status: 'cancelled', error: 'Recipient is on the suppression list' })
        .in('id', suppressedRows.map(r => r.id));
      // Fail closed: if we cannot record the cancellation the rows stay 'pending'
      // and the next run would try them again, so stop rather than press on.
      if (cancelErr) throw new Error('could not cancel suppressed rows: ' + cancelErr.message);
      console.log(`[newsletter/send] skipped ${suppressedRows.length} suppressed recipient(s)`);
    }

    // ── Contact lookup ───────────────────────────────────────────────────────
    // This query used to carry `.not('email','like','%@deleted.local')` and
    // `.not('tags','cs','{unsubscribed}')`, which looked like a second opt-out
    // guard but was not one: a filtered-out contact simply fell through to
    // `|| {}` and the email went out anyway, addressed to "there". Fetch
    // everyone, then decide explicitly.
    const contactIds = [...new Set(notSuppressed.map(s => s.contact_id).filter(Boolean))];
    const contactById = {};
    for (let i = 0; i < contactIds.length; i += LOOKUP_CHUNK) {
      const { data: chunk, error: contactsErr } = await db
        .from('contacts')
        .select('id, first_name, email, tags')
        .in('id', contactIds.slice(i, i + LOOKUP_CHUNK));
      if (contactsErr) throw new Error('contact lookup failed: ' + contactsErr.message);
      for (const c of chunk || []) contactById[c.id] = c;
    }

    // Blocked = tagged unsubscribed in the CRM, or GDPR-anonymised. The
    // suppressions table and the tag are mirrored by lib/suppressions.js now,
    // but a tag applied by hand before that fix has no row, so check both.
    const blockedRows = [];
    const sendable = [];
    for (const row of notSuppressed) {
      const contact = contactById[row.contact_id];
      const tags = Array.isArray(contact?.tags) ? contact.tags : [];
      const anonymised = [contact?.email, row.email]
        .some(e => String(e || '').toLowerCase().endsWith('@deleted.local'));
      if (tags.includes('unsubscribed')) { blockedRows.push([row, 'Contact is tagged unsubscribed']); continue; }
      if (anonymised)                    { blockedRows.push([row, 'Address anonymised by GDPR erasure']); continue; }
      sendable.push(row);
    }
    if (blockedRows.length) {
      for (const reason of new Set(blockedRows.map(([, r]) => r))) {
        const ids = blockedRows.filter(([, r]) => r === reason).map(([row]) => row.id);
        const { error: blockErr } = await db
          .from('newsletter_sends')
          .update({ status: 'cancelled', error: reason })
          .in('id', ids);
        if (blockErr) throw new Error('could not cancel blocked rows: ' + blockErr.message);
      }
      console.log(`[newsletter/send] cancelled ${blockedRows.length} blocked recipient(s)`);
    }

    if (!sendable.length) {
      const { totalSent, error: closeErr } = await closeOut(db, campaignId, { done: true });
      if (closeErr) return res.status(500).json({ error: closeErr });
      return res.json({
        ok: true, done: true, sent: 0, failed: 0, remaining: 0,
        suppressed: suppressedRows.length, blocked: blockedRows.length,
        totalSent, resumed: isResume,
      });
    }

    // Prefetch all properties needed
    const allSlugs = [...new Set(sendable.flatMap(s => s.property_slugs || []))];
    const { data: properties } = await db
      .from('properties')
      .select('slug, title, region, city, country, price, currency, img, beds, size')
      .in('slug', allSlugs);

    const propBySlug = {};
    for (const p of properties || []) propBySlug[p.slug] = p;

    let sent = 0, failed = 0, remaining = 0;
    let timedOut = false;

    for (const sendRow of sendable) {
      // Out of budget: stop cleanly and leave the rest 'pending' for the next
      // invocation. Never let the platform decide where the loop ends.
      if (Date.now() - startedAt > MAX_RUN_MS) { timedOut = true; remaining++; continue; }

      try {
        const contact   = contactById[sendRow.contact_id] || {};
        const firstName = contact.first_name || 'there';

        if (!looksSendable(sendRow.email)) {
          throw new Error(`Unsendable address "${sendRow.email}" — not attempted`);
        }

        // User token for gallery URLs (name + email pre-fills the enquiry form)
        const userToken = Buffer.from(JSON.stringify({
          n: firstName !== 'there' ? firstName : '',
          e: sendRow.email,
        })).toString('base64url');

        // Build property objects for the template
        const toPropertyObj = (slug) => {
          const p = propBySlug[slug];
          if (!p) return null;
          const parts = [p.city, p.region, p.country].filter(Boolean);
          const location = [...new Set(parts)].join(', ');
          return {
            slug:       p.slug,
            title:      p.title,
            price:      formatPrice(p.price, p.currency),
            beds:       p.beds || 0,
            size:       p.size || 0,
            imageUrl:   p.img || '',
            location,
            regionTag:  p.region || p.city || null,
            galleryUrl: `https://co-ownership-property.com/gallery/${p.slug}?t=${userToken}`,
          };
        };

        const primaryProps  = (sendRow.primary_slugs  || []).map(toPropertyObj).filter(Boolean);
        const fallbackProps = (sendRow.fallback_slugs || []).map(toPropertyObj).filter(Boolean);

        const html = await render(
          PersonalisedNewsletterEmail({
            firstName,
            primaryProperties:  primaryProps,
            fallbackProperties: fallbackProps,
            unsubscribeUrl: unsubUrl(sendRow.email), // tokenised — see lib/unsub.js
          })
        );

        // Build a short region string: "California & Mallorca" or "California, Mallorca & Ibiza"
        const regionList = [...new Set(
          [...primaryProps, ...fallbackProps].map(p => p.regionTag).filter(Boolean)
        )].slice(0, 3);
        const sendRegions = regionList.length > 1
          ? regionList.slice(0, -1).join(', ') + ' & ' + regionList[regionList.length - 1]
          : regionList[0] || '';
        const subject = firstName !== 'there'
          ? (sendRegions ? `${firstName} — ${sendRegions}` : `${firstName}, properties selected for you`)
          : (sendRegions ? `Properties in ${sendRegions}` : 'Your personalised property selection');

        await sendHtml({
          to:      sendRow.email,
          subject,
          html,
          from:    'Dylan Olsson <dylan@co-ownership-property.com>',
          replyTo: 'dylan@co-ownership-property.com',
          headers: listUnsubHeaders(sendRow.email), // RFC 8058 one-click — see lib/unsub.js
        });

        const { error: updErr } = await db.from('newsletter_sends')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', sendRow.id);
        // The email HAS gone out. A failed status write leaves the row 'pending',
        // so the next run mails this person twice — noisy, but never silent.
        if (updErr) console.error(`[newsletter/send] SENT but status write failed for ${sendRow.email}:`, updErr.message);

        sent++;
      } catch (err) {
        console.error(`[newsletter/send] Failed for ${sendRow.email}:`, err.message);
        const { error: failErr } = await db.from('newsletter_sends')
          .update({ status: 'failed', error: String(err.message).slice(0, 500) })
          .eq('id', sendRow.id);
        if (failErr) console.error(`[newsletter/send] could not record failure for ${sendRow.email}:`, failErr.message);
        failed++;
      }
    }

    const done = !timedOut;
    const { totalSent, error: closeErr } = await closeOut(db, campaignId, { done });
    if (closeErr) {
      return res.status(500).json({
        error: 'Emails were sent but the campaign record could not be updated: ' + closeErr,
        sent, failed, remaining,
      });
    }

    return res.json({
      ok: true,
      done,
      sent,
      failed,
      remaining,
      suppressed: suppressedRows.length,
      blocked: blockedRows.length,
      totalSent,
      resumed: isResume,
      message: done
        ? null
        : `Stopped at the time limit with ${remaining} recipient(s) left. Press Send again to resume — nobody will be mailed twice.`,
    });
  } catch (err) {
    console.error('[newsletter/send]', err);
    return res.status(500).json({ error: err.message });
  }
}
