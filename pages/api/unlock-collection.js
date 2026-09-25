import * as React from 'react';
import { checkRateLimit } from '@/lib/rateLimit';
import { isHoneypotFilled } from '@/lib/honeypot';
import { createLead, incrementScore, logActivity, upsertContact, enrichContactIntelligence } from '@/lib/crm';
import { queueEmail, sendTeamNotification } from '@/lib/resend';
import CollectionAccessEmail from '@/emails/collection-access';

const COLLECTIONS = {
  'mosaic-collection': {
    title: 'Mosaic Collection 14',
    baseUrl: 'https://co-ownership-property.com/collections/mosaic-collection/',
    destinations: 'Mallorca; Tuscany; Chamonix; Barcelona; South of France',
  },
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (isHoneypotFilled(req.body)) return res.status(200).json({ ok: true });

  const { name, email, phone, collectionSlug, message } = req.body;
  let collection = COLLECTIONS[collectionSlug];
  // Database collections (lib/collections.js). In a local preview build a
  // 'preview' collection resolves too; for those nothing is written to the
  // CRM and no email goes out, so testing the unlock never creates a lead.
  let previewOnly = false;
  if (!collection && typeof collectionSlug === 'string' && /^[a-z0-9-]+$/.test(collectionSlug)) {
    const { loadCollection } = await import('@/lib/collections');
    const dbc = await loadCollection(collectionSlug);
    if (dbc) {
      const places = (dbc.homes || []).map(h => h.city).filter(Boolean);
      collection = {
        title: dbc.name,
        baseUrl: `https://co-ownership-property.com/collections/${dbc.slug}/`,
        destinations: (dbc.homes || []).map(h => h.region || h.city).filter(Boolean).join('; '),
        heroImage: dbc.hero_image || undefined,
        summary: `Your personal link opens the full collection: every photograph of the ${places.length} homes in ${places.slice(0, -1).join(', ')}${places.length > 1 ? ' and ' : ''}${places.slice(-1)}${(dbc.homes || []).some(h => h.floorplans?.length) ? ', with the floor plans' : ''}. Here is a first look at each of them.`,
        // The guide: one section per home. A home's own photos when it has
        // them; otherwise the best photos of a past home in the same place,
        // always labelled as such.
        homes: (dbc.homes || []).map(h => {
          const own = (h.photos || []).slice(0, 3);
          const ex = own.length ? [] : (h.example_photos || []).slice(0, 3);
          return {
            place: h.chapter || h.city,
            name: h.name,
            status: { ready: 'Ready to use', soon: 'Coming soon', in_preparation: 'Being prepared', searching: 'Being chosen', example: 'Being chosen' }[h.readiness] || '',
            text: h.description || '',
            photos: own.length ? own : ex,
            note: ex.length ? (h.example_note || 'Example of a past home from one of our earlier collections.') : (h.readiness !== 'ready' && own.length ? (h.photos_note || '') : ''),
          };
        }),
      };
      previewOnly = dbc.status === 'preview';
    }
  }
  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(name || '').trim();
  const cleanPhone = String(phone || '').trim();
  const cleanMessage = String(message || `I’d like to enquire about ${collection?.title || 'this collection'}.`).trim();
  if (!collection || !cleanName || !cleanPhone || !EMAIL_PATTERN.test(cleanEmail)) {
    return res.status(400).json({ error: 'Missing or invalid fields.' });
  }

  const nameParts = cleanName.split(/\s+/).filter(Boolean);
  const firstName = nameParts[0] || null;
  const lastName = nameParts.slice(1).join(' ') || null;

  const { limited } = await checkRateLimit(cleanEmail, 'collection_unlock', 5 * 60 * 1000, 5);
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  if (previewOnly) return res.status(200).json({ ok: true, preview: true });

  const token = Buffer.from(JSON.stringify({ n: cleanName, e: cleanEmail, c: collectionSlug })).toString('base64url');
  const accessUrl = `${collection.baseUrl}?access=${token}`;

  let contact = null;
  let lead = null;
  try {
    contact = await upsertContact({
      email: cleanEmail,
      firstName,
      lastName,
      phone: cleanPhone || null,
      source: 'collection_access',
      locale: 'en',
    });
    contact = await enrichContactIntelligence({ contact, email: cleanEmail, phone: cleanPhone, request: req });

    if (contact) {
      await incrementScore(contact.id, 10);
      lead = await createLead({
        contactId: contact.id,
        propertyTitle: collection.title,
        mainRegion: collection.destinations,
        message: cleanMessage,
      });
      await logActivity({
        contactId: contact.id,
        leadId: lead?.id || null,
        type: 'collection_access_requested',
        description: `Collection guide requested for ${collection.title}`,
        metadata: { collectionSlug, accessUrl },
      });
    }
  } catch (error) {
    console.error('[collection-access] CRM write failed:', error.message);
  }

  try {
    await queueEmail({
      autoSend: true,
      to: cleanEmail,
      toName: cleanName || null,
      subject: `Your private access to ${collection.title}`,
      template: React.createElement(CollectionAccessEmail, { firstName: firstName || 'there', accessUrl, collectionTitle: collection.title, heroImage: collection.heroImage, summary: collection.summary, homes: collection.homes }),
      templateName: 'collection-access',
      templateProps: { firstName, accessUrl, collectionSlug },
      trigger: 'collection_access_requested',
      notes: `Private guide access for ${collection.title}`,
      contactId: contact?.id || null,
      leadId: lead?.id || null,
    });

    await sendTeamNotification({
      subject: `Collection Access Request — ${cleanName || cleanEmail}`,
      threadKey: `collection-${cleanEmail}`,
      html: `
        <h2>Collection Access Request</h2>
        <p><strong>Collection:</strong> ${escapeHtml(collection.title)}</p>
        <p><strong>Name:</strong> ${escapeHtml(cleanName)}</p>
        <p><strong>Email:</strong> ${escapeHtml(cleanEmail)}</p>
        <p><strong>Phone:</strong> ${cleanPhone ? escapeHtml(cleanPhone) : '<em>not provided</em>'}</p>
        <p><strong>Message:</strong> ${escapeHtml(cleanMessage)}</p>
        <p><strong>Access link:</strong> <a href="${escapeHtml(accessUrl)}">${escapeHtml(accessUrl)}</a></p>
      `,
    });

    return res.status(200).json({ ok: true, accessUrl });
  } catch (error) {
    console.error('[collection-access] send failed:', error.message);
    return res.status(500).json({ error: 'Unable to send your access link. Please try again.' });
  }
}
