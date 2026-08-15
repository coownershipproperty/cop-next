import * as React from 'react';
import { checkRateLimit } from '@/lib/rateLimit';
import { isHoneypotFilled } from '@/lib/honeypot';
import { createLead, incrementScore, logActivity, upsertContact } from '@/lib/crm';
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
  const collection = COLLECTIONS[collectionSlug];
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
      template: React.createElement(CollectionAccessEmail, { firstName: firstName || 'there', accessUrl }),
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
