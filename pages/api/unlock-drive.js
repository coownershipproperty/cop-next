import { createClient } from '@supabase/supabase-js';
import { upsertContact, createLead, createEmailSend, logActivity, trackingPixel, incrementScore } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { queueEmail, sendTeamNotification } from '@/lib/resend';
import FloorPlanEmail from '@/emails/floor-plan';
import * as React from 'react';

function getDb() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);
}

/** Fetch up to 3 similar properties (same country, different slug, available) */
async function getSimilarProperties(propertySlug, propertyCountry) {
  if (!propertyCountry) return [];
  const db = getDb();
  const { data } = await db
    .from('properties')
    .select('slug, title, img, price, currency, beds, size, city')
    .eq('country', propertyCountry)
    .neq('slug', propertySlug || '')
    .in('status', ['available', 'new'])
    .limit(3);
  return data || [];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, email, propertyTitle, driveUrl, propertyUrl, propertyCountry } = req.body;
  if (!email || !driveUrl) return res.status(400).json({ error: 'Missing fields' });

  // Rate limit: max 5 unlock requests per email per 5 minutes
  const { limited } = await checkRateLimit(email, 'unlock', 5 * 60 * 1000, 5);
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  // Extract slug from propertyUrl
  const propertySlug = propertyUrl
    ? propertyUrl.replace(/https?:\/\/[^/]+\/property\//, '').replace(/\/$/, '') || null
    : null;

  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName  = nameParts.slice(1).join(' ') || null;

  // ── CRM ────────────────────────────────────────────────────────────────────
  let contact   = null;
  let emailSend = null;

  try {
    contact = await upsertContact({ email, firstName, lastName, source: 'floor_plan' });

    if (contact) {
      // +10 points for requesting floor plans (high-intent action)
      await incrementScore(contact.id, 10);

      await createLead({
        contactId:     contact.id,
        propertySlug:  propertySlug || null,
        propertyTitle: propertyTitle || null,
      });

      emailSend = await createEmailSend({
        contactId:     contact.id,
        type:          'floor_plan',
        subject:       `Floor Plans & More Photos — ${propertyTitle}`,
        toEmail:       email,
        propertyTitle: propertyTitle || null,
        propertyUrl:   propertyUrl   || null,
      });

      await logActivity({
        contactId: contact.id,
        type:      'floor_plan_requested',
        description: `Floor plan requested for ${propertyTitle}`,
        metadata: { propertyTitle, propertyUrl },
      });
    }
  } catch (e) {
    console.error('[CRM] unlock-drive write failed:', e.message);
  }

  // ── Fetch similar properties for email ────────────────────────────────────
  const rawSimilar = await getSimilarProperties(propertySlug, propertyCountry);

  // Map to FloorPlanEmail's SimilarProperty shape
  const similarProperties = rawSimilar.map(p => {
    const sym   = { EUR: '€', USD: '$', GBP: '£' }[p.currency] || '€';
    const price = p.price ? `${sym}${p.price.toLocaleString('en-GB')}` : '';
    return {
      title:    p.title,
      price,
      beds:     p.beds  || 0,
      size:     p.size  || 0,
      slug:     p.slug,
      imageUrl: p.img   || undefined,
    };
  });

  try {
    const pixel = emailSend?.tracking_id ? trackingPixel(emailSend.tracking_id) : '';

    // Queue floor plan email to visitor
    await queueEmail({
      to:            email,
      toName:        name || null,
      subject:       `Floor Plans & More Photos — ${propertyTitle}`,
      template:      React.createElement(FloorPlanEmail, {
        firstName:         firstName    || name || undefined,
        propertyTitle:     propertyTitle || undefined,
        driveUrl:          driveUrl,
        propertyUrl:       propertyUrl  || undefined,
        similarProperties: similarProperties.length > 0 ? similarProperties : undefined,
        trackingPixelHtml: pixel        || undefined,
      }),
      templateName:  'floor-plan',
      templateProps: { firstName, propertyTitle, driveUrl, propertyUrl },
      trigger:       'floor_plan_requested',
      notes:         `Floor plan unlock for ${propertyTitle}`,
      contactId:     contact?.id || null,
    });

    if (contact && emailSend) {
      await logActivity({
        contactId: contact.id,
        type:      'email_queued',
        description: `Floor plan email queued for ${email}`,
        metadata:  { email_send_id: emailSend.id },
      });
    }

    // Team notification (always immediate)
    await sendTeamNotification({
      subject: `Floor Plan Request — ${name || email}`,
      html: `
        <h2>Floor Plan / Photo Request</h2>
        <p><strong>Property:</strong> ${propertyTitle}${propertyUrl ? ` — <a href="${propertyUrl}">${propertyUrl}</a>` : ''}</p>
        <p><strong>Name:</strong> ${name || 'Not provided'}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>Drive link sent: <a href="${driveUrl}">${driveUrl}</a></p>
      `,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send', detail: err.message });
  }
}
