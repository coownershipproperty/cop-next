#!/usr/bin/env node
/**
 * Send the May-2026 new-listings digest to all contacts.
 *
 * Personalises by country interest derived from each contact's lead history:
 *   - France-leaners  → French listings first; subject leads with Côte d'Azur
 *   - Spain-leaners   → Spanish listings first; subject leads with Mallorca/Ibiza
 *   - Both / unknown  → default order (price DESC)
 *
 * Writes one row per contact into the `email_queue` table; the existing
 * process-email-queue cron picks them up and sends them via Resend.
 *
 * USAGE
 *   node scripts/send-new-listings-may-2026.js --preview     (send 1 to info@domosno.com only)
 *   node scripts/send-new-listings-may-2026.js --dry-run     (render counts, no DB write)
 *   node scripts/send-new-listings-may-2026.js --execute     (queue all 480)
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// ─── The seven new listings (hand-picked from the May 2 & May 8 imports) ───
const PROPERTIES = [
  {
    country: 'France',
    region: 'Côte d’Azur',
    title: 'Les Issambres, Côte d’Azur, France',
    subtitle: '3-Bed Villa With Sea View & Heated Pool',
    slug: 'les-issambres-cote-dazur-france-3-bed-villa-with-sea-view-heated-pool',
    price: 319000,
    beds: 3,
    img: 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/les-issambres-cote-dazur-france-3-bed-villa-with-sea-view-heated-pool/hero.jpg',
  },
  {
    country: 'France',
    region: 'Côte d’Azur',
    title: 'Valbonne, Côte d’Azur, France',
    subtitle: '3-Bed Villa With Heated Pool',
    slug: 'valbonne-cote-dazur-france-3-bed-villa-with-heated-pool',
    price: 299000,
    beds: 3,
    img: 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/valbonne-cote-dazur-france-3-bed-villa-with-heated-pool/hero.png',
  },
  {
    country: 'Spain',
    region: 'Ibiza',
    title: 'Cala Codolar, Ibiza, Spain',
    subtitle: '4-Bed Villa With Sea View & Infinity Pool',
    slug: 'cala-codolar-ibiza-spain-4-bed-villa-with-sea-view-infinity-pool',
    price: 599000,
    beds: 4,
    img: 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/cala-codolar-ibiza-spain-4-bed-villa-with-sea-view-infinity-pool/hero.jpg',
  },
  {
    country: 'Spain',
    region: 'Mallorca',
    title: 'Port d’Andratx, Mallorca, Spain',
    subtitle: '2-Bed Apartment With Harbour View & Pool',
    slug: 'port-dandratx-mallorca-spain-2-bed-apartment-with-harbour-view-pool',
    price: 179000,
    beds: 2,
    img: 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/port-dandratx-mallorca-spain-2-bed-apartment-with-harbour-view-pool/hero.jpg',
  },
  {
    country: 'Spain',
    region: 'Mallorca',
    title: 'Port d’Andratx, Mallorca, Spain',
    subtitle: '2-Bed Apartment With Harbour View & Pool',
    slug: 'port-dandratx-mallorca-spain-2-bed-apartment-harbour-view',
    price: 179000,
    beds: 2,
    img: 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/port-dandratx-mallorca-spain-2-bed-apartment-harbour-view/hero.jpg',
  },
  {
    country: 'Spain',
    region: 'Mallorca',
    title: 'Ses Salines, Mallorca, Spain',
    subtitle: '3-Bed Townhouse With Private Pool',
    slug: 'ses-salines-mallorca-spain-3-bed-townhouse-with-private-pool',
    price: 139000,
    beds: 3,
    img: 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/ses-salines-mallorca-spain-3-bed-townhouse-with-private-pool/hero.jpg',
  },
  {
    country: 'Spain',
    region: 'Costa del Sol',
    title: 'Rincón de la Victoria, Costa del Sol, Spain',
    subtitle: '2-Bed Apartment With Sea View & Pool',
    slug: 'rincon-de-la-victoria-costa-del-sol-spain-2-bed-apartment-with-sea-view-pool',
    price: 119000,
    beds: 2,
    img: 'https://iotzzoxyckpyatzqcjbo.supabase.co/storage/v1/object/public/property-images/rincon-de-la-victoria-costa-del-sol-spain-2-bed-apartment-with-sea-view-pool/hero.jpg',
  },
];

// Derive a contact's country preference from their lead history.
const FRANCE_HINTS = ['france', 'côte', 'cote', 'luberon', 'provence', 'riviera', 'antibes', 'cannes', 'nice'];
const SPAIN_HINTS  = ['spain', 'mallorca', 'ibiza', 'costa', 'balear', 'menorca', 'andaluc', 'andalus'];

function hasHint(text, hints) {
  if (!text) return false;
  const t = text.toLowerCase();
  return hints.some(h => t.includes(h));
}

function countryPreference(leadRows) {
  let franceScore = 0;
  let spainScore  = 0;
  for (const l of leadRows) {
    const txt = `${l.property_title || ''} ${l.main_region || ''} ${l.subregion || ''}`;
    if (hasHint(txt, FRANCE_HINTS)) franceScore++;
    if (hasHint(txt, SPAIN_HINTS))  spainScore++;
  }
  if (franceScore > spainScore) return 'france';
  if (spainScore  > franceScore) return 'spain';
  return null; // tie or no signal
}

function orderedProperties(preference) {
  if (preference === 'france') {
    return [
      ...PROPERTIES.filter(p => p.country === 'France'),
      ...PROPERTIES.filter(p => p.country !== 'France'),
    ];
  }
  if (preference === 'spain') {
    return [
      ...PROPERTIES.filter(p => p.country === 'Spain'),
      ...PROPERTIES.filter(p => p.country !== 'Spain'),
    ];
  }
  return PROPERTIES; // default order (already sorted Spain-heavy by price)
}

function subjectFor(preference) {
  if (preference === 'france') return '2 new Côte d’Azur villas — plus 5 more across Spain & Italy';
  if (preference === 'spain')  return '5 new co-ownership homes across Mallorca, Ibiza & Costa del Sol';
  return '7 new co-ownership homes — Spain, France & more';
}

const BASE = 'https://co-ownership-property.com';

function formatPrice(amount) {
  return `€${Number(amount).toLocaleString('en-GB')}`;
}

function renderEmail({ firstName, properties, preference }) {
  const cards = properties.map(p => `
    <tr>
      <td style="padding-bottom:18px;">
        <a href="${BASE}/property/${p.slug}/" style="text-decoration:none; color:#143047;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff; border:1px solid #e8e0d4;">
            <tr>
              <td style="padding:0;">
                <img src="${p.img}" alt="${p.title}" width="100%" style="display:block; width:100%; height:auto; max-height:280px; object-fit:cover;" />
              </td>
            </tr>
            <tr>
              <td style="padding:16px 20px 18px;">
                <p style="font-family:'Nunito Sans', Arial, sans-serif; font-size:11px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase; color:#C9A84C; margin:0 0 6px;">${p.region}</p>
                <h3 style="font-family:'Playfair Display', Georgia, serif; font-size:18px; font-weight:400; color:#143047; margin:0 0 10px; line-height:1.3;">${p.title}</h3>
                <p style="font-family:'Nunito Sans', Arial, sans-serif; font-size:13px; color:#5b6b7a; margin:0 0 12px;">${p.subtitle}</p>
                <p style="font-family:'Nunito Sans', Arial, sans-serif; font-size:14px; color:#143047; font-weight:600; margin:0 0 10px;">${formatPrice(p.price)} <span style="color:#8a9aaa; font-weight:400;">per 1/8 share</span></p>
                <p style="font-family:'Nunito Sans', Arial, sans-serif; font-size:12px; font-weight:700; letter-spacing:0.12em; color:#C9A84C; margin:0;">VIEW<span class="cta-long"> PROPERTY →</span></p>
              </td>
            </tr>
          </table>
        </a>
      </td>
    </tr>`).join('\n');

  const intro = preference === 'france'
    ? `Two new Côte d’Azur villas — plus five more across Spain.`
    : preference === 'spain'
    ? `Five new homes across Mallorca, Ibiza and Costa del Sol — plus two villas on the Côte d’Azur.`
    : `Seven new homes — across Mallorca, Ibiza, Costa del Sol and the Côte d’Azur.`;

  const greetingName = (firstName && firstName.trim()) ? firstName.trim() : 'there';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>New listings — May 2026</title>
  <style>
    /* On phones, shorten the CTA from "VIEW PROPERTY →" to just "VIEW" */
    @media only screen and (max-width: 480px) {
      .cta-long { display: none !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#F7F4EE; font-family:'Nunito Sans', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F7F4EE;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:#143047; padding:36px 24px; text-align:center;">
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height:1px; width:56px; background:#C9A84C; line-height:1px; font-size:1px;">&nbsp;</td></tr>
              </table>
              <p style="font-family:'Cormorant Garamond', Georgia, serif; color:#ffffff; font-size:22px; font-weight:300; letter-spacing:0.24em; text-transform:uppercase; margin:20px 0 14px;">Co-Ownership Property</p>
              <table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="height:1px; width:56px; background:#C9A84C; line-height:1px; font-size:1px;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- Hero text -->
          <tr>
            <td style="background:#ffffff; padding:44px 32px 12px;">
              <p style="font-family:'Nunito Sans', Arial, sans-serif; font-size:12px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:#C9A84C; margin:0 0 14px;">New listings — May 2026</p>
              <h1 style="font-family:'Playfair Display', Georgia, serif; font-size:30px; font-weight:400; color:#143047; margin:0 0 22px; line-height:1.3;"><em>Seven new co-ownership homes</em></h1>
              <p style="font-family:'Nunito Sans', Arial, sans-serif; font-size:16px; color:#143047; line-height:1.75; margin:0 0 18px;">Hi ${greetingName},</p>
              <p style="font-family:'Nunito Sans', Arial, sans-serif; font-size:16px; color:#143047; line-height:1.75; margin:0 0 18px;">${intro}</p>
            </td>
          </tr>

          <!-- Property cards -->
          <tr>
            <td style="background:#ffffff; padding:18px 32px 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${cards}
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="background:#ffffff; padding:8px 32px 36px; text-align:center;">
              <a href="${BASE}/our-homes/" style="display:inline-block; background:#143047; color:#ffffff; font-family:'Nunito Sans', Arial, sans-serif; font-size:13px; font-weight:700; letter-spacing:0.18em; padding:15px 36px; text-decoration:none; text-transform:uppercase;">Browse all 347 homes</a>
            </td>
          </tr>

          <!-- Sign off -->
          <tr>
            <td style="background:#ffffff; padding:0 32px 36px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="border-top:2px solid #C9A84C; width:40px; height:1px; font-size:1px; line-height:1px;">&nbsp;</td></tr>
              </table>
              <p style="font-family:'Nunito Sans', Arial, sans-serif; font-size:15px; color:#143047; line-height:1.75; margin:20px 0 8px;">Questions on any of these? Just reply — a real person will get back to you.</p>
              <p style="font-family:'Cormorant Garamond', Georgia, serif; font-size:16px; color:#143047; margin:18px 0 0;">The Co-Ownership Property team</p>
              <p style="font-family:'Nunito Sans', Arial, sans-serif; font-size:13px; color:#6B8A9E; margin:4px 0 0;"><a href="${BASE}" style="color:#6B8A9E; text-decoration:none;">co-ownership-property.com</a></p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#143047; padding:34px 24px 38px; text-align:center; border-top:2px solid #C9A84C;">
              <p style="font-family:'Cormorant Garamond', Georgia, serif; color:#ffffff; font-size:18px; font-weight:300; letter-spacing:0.22em; text-transform:uppercase; margin:0 0 18px;">Co-Ownership Property</p>
              <p style="font-family:'Nunito Sans', Arial, sans-serif; font-size:11px; font-weight:300; letter-spacing:0.1em; color:rgba(255,255,255,0.5); margin:0 0 14px;">
                <a href="${BASE}/our-homes/" style="color:rgba(255,255,255,0.55); text-decoration:none;">Our Homes</a>
                &nbsp;·&nbsp;
                <a href="${BASE}/how-it-works/" style="color:rgba(255,255,255,0.55); text-decoration:none;">How It Works</a>
                &nbsp;·&nbsp;
                <a href="${BASE}/all-our-blog/" style="color:rgba(255,255,255,0.55); text-decoration:none;">Blog</a>
              </p>
              <p style="font-family:'Nunito Sans', Arial, sans-serif; font-size:11px; color:rgba(255,255,255,0.3); margin:18px 0 0;">You’re receiving this because you’re part of the Co-Ownership Property community. <a href="${BASE}/unsubscribe/?email={{EMAIL}}" style="color:#C9A84C; text-decoration:none;">Unsubscribe</a>.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function loadContactsWithLeads() {
  const { data: contacts, error: cErr } = await supabase
    .from('contacts')
    .select('id, email, first_name');
  if (cErr) throw cErr;

  const { data: leadsRows, error: lErr } = await supabase
    .from('leads')
    .select('contact_id, property_title, main_region, subregion');
  if (lErr) throw lErr;

  const leadsByContact = new Map();
  for (const l of leadsRows || []) {
    if (!leadsByContact.has(l.contact_id)) leadsByContact.set(l.contact_id, []);
    leadsByContact.get(l.contact_id).push(l);
  }
  return (contacts || []).map(c => ({
    ...c,
    leads: leadsByContact.get(c.id) || [],
  }));
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const isPreview = args.has('--preview');
  const isDryRun  = args.has('--dry-run');
  const isExecute = args.has('--execute');

  if (!isPreview && !isDryRun && !isExecute) {
    console.error('Pass one of: --preview, --dry-run, --execute');
    process.exit(1);
  }

  const contacts = await loadContactsWithLeads();
  console.log(`Loaded ${contacts.length} contacts`);

  let queued = 0;
  const byPreference = { france: 0, spain: 0, default: 0 };

  for (const c of contacts) {
    if (!c.email) continue;
    if (isPreview && c.email.toLowerCase() !== 'info@domosno.com') continue;

    const pref = countryPreference(c.leads);
    byPreference[pref || 'default']++;

    const props   = orderedProperties(pref);
    const subject = subjectFor(pref);
    const html    = renderEmail({ firstName: c.first_name, properties: props, preference: pref })
      .replaceAll('{{EMAIL}}', encodeURIComponent(c.email));

    if (isDryRun) continue;

    const { error } = await supabase.from('email_queue').insert({
      to_email:       c.email,
      to_name:        c.first_name || null,
      subject,
      html,
      trigger:        'new_listings_may_2026',
      template_props: { preference: pref || 'default', property_count: props.length },
      status:         'pending',
      contact_id:     c.id,
      send_after:     new Date().toISOString(),
    });
    if (error) {
      console.error(`  Failed for ${c.email}:`, error.message);
      continue;
    }
    queued++;
  }

  console.log('Country preference breakdown:', byPreference);
  console.log(`Queued ${queued} email${queued === 1 ? '' : 's'}.`);
}

main().catch(err => { console.error(err); process.exit(1); });
