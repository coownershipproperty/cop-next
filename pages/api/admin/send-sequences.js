/**
 * GET /api/admin/send-sequences
 * Daily cron — queues re-engagement emails for inactive contacts.
 *
 * Runs at 8am UTC daily via Vercel Cron.
 * Authorization: Bearer <CRON_SECRET>
 *
 * Logic:
 *   - Find contacts with no activity in 90+ days
 *   - Skip contacts who already have a pending/sent re-engagement in the last 90 days
 *   - Queue a re-engagement email (status: pending — requires manual approval)
 */
import { queueEmail } from '@/lib/resend';
import ReEngagement from '@/emails/re-engagement';
import * as React from 'react';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';

const base = 'https://co-ownership-property.com';

function getDb() {
  return createSupabaseAdminClient();
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const auth   = req.headers['authorization'] || '';
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  const db  = getDb();
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // Find contacts last active > 90 days ago who have a score > 0 (some engagement)
  const { data: candidates, error } = await db
    .from('contacts')
    .select('id, email, first_name, last_name, updated_at, score')
    .lt('updated_at', ninetyDaysAgo.toISOString())
    .gt('score', 0)
    .not('email', 'is', null)
    .limit(50); // batch limit — prevents hammering on first run

  if (error) {
    console.error('[Sequences] contacts fetch failed:', error.message);
    return res.status(500).json({ error: error.message });
  }

  if (!candidates || candidates.length === 0) {
    return res.status(200).json({ ok: true, queued: 0, message: 'No inactive contacts found' });
  }

  // Filter out contacts who already have a recent re-engagement email queued/sent
  const contactIds = candidates.map(c => c.id);
  const { data: recentEmails } = await db
    .from('email_queue')
    .select('contact_id')
    .in('contact_id', contactIds)
    .eq('sequence_type', 're-engagement')
    .in('status', ['pending', 'sent'])
    .gte('created_at', ninetyDaysAgo.toISOString());

  const alreadySent = new Set((recentEmails || []).map(r => r.contact_id));
  const toQueue = candidates.filter(c => !alreadySent.has(c.id));

  let queued = 0;
  for (const contact of toQueue) {
    try {
      const firstName = contact.first_name || undefined;
      const unsubscribeUrl = `${base}/unsubscribe/?email=${encodeURIComponent(contact.email)}`;

      await queueEmail({
        to:            contact.email,
        toName:        [contact.first_name, contact.last_name].filter(Boolean).join(' ') || null,
        subject:       'Still looking for your perfect co-ownership home?',
        template:      React.createElement(ReEngagement, { firstName, unsubscribeUrl }),
        templateName:  're-engagement',
        templateProps: { firstName },
        trigger:       'reengagement_cron',
        notes:         `Re-engagement — inactive ${Math.round((now - new Date(contact.updated_at)) / 86400000)} days`,
        contactId:     contact.id,
        sequenceType:  're-engagement',
      });
      queued++;
    } catch (e) {
      console.error(`[Sequences] re-engagement queue failed for ${contact.email}:`, e.message);
    }
  }

  console.log(`[Sequences] re-engagement: queued ${queued} emails`);
  return res.status(200).json({ ok: true, queued, skipped: candidates.length - toQueue.length });
}
