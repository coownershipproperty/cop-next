/**
 * Rightmove Overseas leads → the CRM.
 *
 * Rightmove sends its own leads as an email to info@ ("Rightmove Overseas
 * Qualified Lead <place> (<name>)") and nothing else: no form on our site,
 * no contact, no lead, no auto-reply, no draft. Tom Grant asked three good
 * questions about Vilamoura on 13 Sep 2026 and the only place he existed was
 * an unread email. Every ten minutes this reads those emails from the
 * connected mailbox and posts each one to /api/enquiry exactly as if the
 * person had filled in the form on the listing page — so they get the
 * auto-reply, a contact and lead, and a draft from the drafter, and the
 * message they typed is kept as the message.
 *
 * Dedupe: one activity per Gmail message id, so a message is never posted
 * twice however often this runs.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { isCronRequest } from '@/lib/cronAuth';
import { heartbeatHandler } from '@/lib/cronHeartbeat';
import { gmailConnected, listMessages, getMessage } from '@/lib/gmail';

const SEARCH = 'from:autoresponder@rightmove.co.uk subject:"Rightmove Overseas Qualified Lead" newer_than:3d';
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://co-ownership-property.com';

function field(text, label) {
  const m = new RegExp(`${label}\\s*:?\\s*\\n?\\s*([^\\n]+)`, 'i').exec(text);
  return m ? m[1].trim() : '';
}

/** Pull the pieces out of Rightmove's notification. Returns null when it is not one. */
export function parseRightmoveLead(text) {
  if (!/Rightmove Overseas/i.test(text)) return null;
  const email = (field(text, 'Email') || '').match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0]?.toLowerCase() || '';
  if (!email) return null;
  const name = field(text, 'Name');
  let phone = field(text, 'Phone').replace(/[^\d+]/g, '');
  // Rightmove sends UK mobiles three ways: 7506246312, 07851449376, 447914390966.
  if (/^7\d{9}$/.test(phone)) phone = `+44${phone}`;
  else if (/^07\d{9}$/.test(phone)) phone = `+44${phone.slice(1)}`;
  else if (/^447\d{9}$/.test(phone)) phone = `+${phone}`;
  const country = field(text, 'Country');
  const reason = field(text, 'Reason For Buying');
  // Plain-text version: "Comments: <one line>". HTML version: a Comments
  // heading with the text on the next lines, then a Property heading.
  let message = field(text, 'Comments');
  if (!message) {
    const cm = /Comments\s*\n([\s\S]*?)\n\s*Property\s*\n/i.exec(text);
    message = cm ? cm[1].replace(/\s+/g, ' ').trim() : '';
  }
  // "Reference: 299894_vilamoura-portugal-2-bed-apartment-with-pool" — but
  // older feed rows carry a name instead ("299894_AspenPACASO",
  // "299894_VillaCascadasHAMLET"), so the token is resolved against the
  // properties table by the caller, not trusted as a slug here.
  const rm = /Reference\s*:?\s*(\d+)[_ ]+([A-Za-z0-9-]+)/i.exec(text);
  const rightmoveRef = rm ? rm[1] : null;
  const refToken = rm ? rm[2] : null;
  const slug = refToken && /^[a-z0-9]+(-[a-z0-9]+)+$/.test(refToken) ? refToken : null;
  const price = field(text, 'Price');
  const link = /https?:\/\/www\.rightmove\.co\.uk\/properties\/\d+/i.exec(text)?.[0] || null;
  const address = field(text, 'Address');
  return { name, email, phone, country, reason, message, slug, refToken, rightmoveRef, address, price, link };
}

async function handler(req, res) {
  if (!isCronRequest(req)) return res.status(401).json({ message: 'Unauthorised' });
  const db = createSupabaseAdminClient();
  if (!(await gmailConnected(db)) || !process.env.GMAIL_OAUTH_CLIENT_ID) {
    return res.status(200).json({ ok: true, skipped: 'gmail not connected', posted: 0 });
  }

  const posted = [], skipped = [], failed = [];
  let msgs = [];
  try { msgs = await listMessages(db, SEARCH, 25); }
  catch (e) { return res.status(500).json({ ok: false, error: `gmail list: ${e.message}` }); }

  for (const m of msgs) {
    try {
      const { data: seen } = await db.from('activities').select('id')
        .eq('metadata->>gmail_message_id', m.id).limit(1);
      if ((seen || []).length) { skipped.push(`${m.id}: already imported`); continue; }

      const msg = await getMessage(db, m.id);
      const lead = parseRightmoveLead(msg.text);
      if (!lead) { skipped.push(`${m.id}: not a lead`); continue; }

      // Which home? A real slug in the reference, else a row whose
      // rightmove_ref matches the token, else a general enquiry that carries
      // the Rightmove address so the drafter knows what they were looking at.
      let slug = null;
      if (lead.slug) {
        const { data: p } = await db.from('properties').select('slug').eq('slug', lead.slug).maybeSingle();
        slug = p?.slug || null;
      }
      if (!slug && lead.refToken) {
        const { data: p } = await db.from('properties').select('slug').eq('rightmove_ref', lead.refToken).maybeSingle();
        slug = p?.slug || null;
      }
      const message = slug ? lead.message
        : [lead.message, `(Rightmove listing they enquired on: ${[lead.address, lead.price].filter(Boolean).join(', ')})`].filter(Boolean).join(' ');
      const body = {
        name: lead.name, email: lead.email, phone: lead.phone,
        message,
        propertySlug: slug || undefined,
        url: slug ? `${SITE}/property/${slug}/` : undefined,
        locale: 'en',
        attribution: { utmSource: 'rightmove.co.uk', referrerUrl: 'https://www.rightmove.co.uk/', landingUrl: lead.link },
      };
      const r = await fetch(`${SITE}/api/enquiry/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!r.ok) { failed.push(`${lead.email}: enquiry ${r.status}`); continue; }

      const { data: contact } = await db.from('contacts').select('id').ilike('email', lead.email).limit(1).maybeSingle();
      await db.from('activities').insert({
        contact_id: contact?.id || null,
        type: 'note',
        description: `Imported from a Rightmove Overseas lead email (${lead.country || 'country unknown'}, ${lead.reason || 'no reason given'}${lead.rightmoveRef ? `, Rightmove ref ${lead.rightmoveRef}` : ''})`,
        metadata: { source: 'rightmove-lead-email', gmail_message_id: m.id, gmail_thread_id: msg.threadId, rightmove_ref: lead.rightmoveRef, country: lead.country, reason: lead.reason, address: lead.address },
      });
      posted.push(`${lead.email} → ${slug || 'general'}`);
    } catch (e) {
      failed.push(`${m.id}: ${e.message}`);
    }
  }

  return res.status(200).json({ ok: failed.length === 0, posted: posted.length, skipped: skipped.length, failed: failed.length, detail: { posted, failed, skipped: skipped.slice(0, 10) } });
}

export default heartbeatHandler('rightmove-leads', handler);
