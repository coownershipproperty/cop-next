import { promises as dnsPromises } from 'dns';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { upsertContact, createLead, logActivity, incrementScore } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { isHoneypotFilled } from '@/lib/honeypot';
import { sendTeamNotification } from '@/lib/resend';
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/lib/i18n';
import { identifyVisitor } from '@/lib/search/searchlog';

/**
 * POST /api/tour-request — "Request 3D Tour" popup on property pages.
 *
 * Mirrors the floor-plan-request flow (/api/unlock-drive): honeypot, rate
 * limit, MX check, contact upsert + lead + activity, team notification to the
 * same recipients. Differences by design:
 *   - request type is 'tour_request';
 *   - NO automated email goes to the visitor and NO tour URL exists anywhere
 *     in this codebase — the team registers the lead with the managing
 *     partner first, then sends the walkthrough link manually (playbook).
 */

function getDb() {
  return createSupabaseAdminClient();
}

// ── MX validation (same fail-open behaviour as unlock-drive) ────────────────
const DNS_TIMEOUT_MS = 2000;

async function emailDomainAccepted(email) {
  const at = String(email || '').lastIndexOf('@');
  const rawDomain = at > 0 ? String(email).slice(at + 1).trim().toLowerCase() : '';
  if (!rawDomain || !rawDomain.includes('.')) return { ok: false, definitive: true };
  let domain = rawDomain;
  try { domain = new URL(`http://${rawDomain}`).hostname; } catch { /* keep raw */ }
  try {
    const resolver = new dnsPromises.Resolver({ timeout: DNS_TIMEOUT_MS, tries: 1 });
    const records = await Promise.race([
      resolver.resolveMx(domain),
      new Promise((_, reject) => setTimeout(
        () => reject(Object.assign(new Error('MX lookup timeout'), { code: 'ETIMEOUT' })),
        DNS_TIMEOUT_MS + 500,
      )),
    ]);
    return { ok: Array.isArray(records) && records.length > 0, definitive: true };
  } catch (e) {
    if (e && (e.code === 'ENOTFOUND' || e.code === 'ENODATA')) {
      return { ok: false, definitive: true };
    }
    return { ok: true, definitive: false }; // DNS flakiness → fail open
  }
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"]/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // Honeypot — bots fill hidden fields. Silently accept (no CRM, no email).
  if (isHoneypotFilled(req.body)) return res.status(200).json({ ok: true });

  const { name, email, phone, propertyTitle, propertyUrl, propertySlug: rawSlug, locale: rawLocale } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing fields' });

  const locale = SUPPORTED_LOCALES.includes(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  // Rate limit: max 5 tour requests per email per 5 minutes
  const { limited } = await checkRateLimit(email, 'tour_request', 5 * 60 * 1000, 5);
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  const cleanEmail = String(email).toLowerCase().trim();

  const mx = await emailDomainAccepted(cleanEmail);
  if (!mx.ok && mx.definitive) {
    return res.status(400).json({
      error: "That email domain doesn't seem to exist — double-check the spelling?",
      code: 'bad_domain',
    });
  }

  // Slug: prefer the explicit field, fall back to the property URL
  const cleanPropertyUrl = propertyUrl ? propertyUrl.split('?')[0].split('#')[0] : null;
  let propertySlug = rawSlug || (cleanPropertyUrl
    ? cleanPropertyUrl.replace(/https?:\/\/[^/]+\/property\//, '').replace(/\/$/, '') || null
    : null);

  const nameParts = (name || '').trim().split(' ');
  const firstName = nameParts[0] || null;
  const lastName  = nameParts.slice(1).join(' ') || null;

  // ── Authoritative property details (never render hidden/staged rows) ─────
  let propertyCity   = null;
  let propertyRegion = null;
  if (propertySlug) {
    try {
      const { data: prop } = await getDb()
        .from('properties')
        .select('city, region')
        .eq('slug', propertySlug)
        .in('status', ['Live', 'for_sale', 'sold'])
        .maybeSingle();
      propertyCity   = prop?.city   || null;
      propertyRegion = prop?.region || null;
    } catch (e) {
      console.error('[tour-request] property lookup failed:', e.message);
    }
  }

  // ── CRM — same writes as the floor-plan flow ─────────────────────────────
  let contact = null;
  try {
    contact = await upsertContact({ email, firstName, lastName, phone, source: 'tour_request', locale });

    // If this browser used the AI search before requesting a tour, tie that
    // search history to this email. Never throws; no cookie means no-op.
    await identifyVisitor(req, email, 'tour_request');

    if (contact) {
      // +10 points — same high-intent weighting as a floor-plan request
      await incrementScore(contact.id, 10);

      await createLead({
        contactId:     contact.id,
        propertySlug:  propertySlug   || null,
        propertyTitle: propertyTitle  || null,
        mainRegion:    propertyRegion || null,
        subregion:     propertyCity   || null,
      });

      await logActivity({
        contactId: contact.id,
        type:      'tour_request',
        description: `3D tour requested for ${propertyTitle}`,
        metadata: { propertyTitle, propertyUrl, propertySlug, phone: phone || null },
      });
    }
  } catch (e) {
    console.error('[CRM] tour-request write failed:', e.message);
  }

  // ── Team notification — same recipients as floor-plan requests ───────────
  try {
    await sendTeamNotification({
      subject: `3D Tour Request — ${name || email}`,
      html: `
        <h2>3D Tour Request</h2>
        <p><strong>Property:</strong> ${escapeHtml(propertyTitle)}${propertyUrl ? ` — <a href="${escapeHtml(propertyUrl)}">${escapeHtml(propertyUrl)}</a>` : ''}</p>
        <p><strong>Name:</strong> ${escapeHtml(name) || 'Not provided'}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(phone) || 'Not provided'}</p>
        <p><em>Playbook: register the lead with the managing partner FIRST, then send the walkthrough link by email — same day.</em></p>
      `,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to send', detail: err.message });
  }
}
