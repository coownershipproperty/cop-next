/**
 * POST /api/track-property
 *
 * Two micro-commitment lead captures on property pages, far below "enquire":
 *   kind: 'watch'    — live homes: "Track this home" price/availability alerts
 *   kind: 'waitlist' — sold homes: "first look at the next {region} home"
 *
 * Body: { email, slug, kind?, locale? }
 *
 * Writes a `property_watches` row, upserts the contact into the CRM with a
 * named-home interest signal, and sends a short branded confirmation. The
 * daily cron /api/cron/property-watch-alerts does the actual alerting.
 */
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { upsertContact, incrementScore, logActivity } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendHtml, sendTeamNotification } from '@/lib/resend';
import { unsubUrl } from '@/lib/unsub';

const SITE = 'https://co-ownership-property.com';

const CONFIRM = {
  en: {
    watch_subject: (title) => `You're tracking ${title}`,
    watch_body: (title) =>
      `You're now tracking <strong>${title}</strong>. If the price changes or availability moves, you'll hear from us first — no spam, only news about this home.`,
    wait_subject: (region) => `You're on the waitlist — ${region}`,
    wait_body: (title, region) =>
      `<strong>${title}</strong> is fully sold — but you're now first in line. The moment a new home in <strong>${region}</strong> joins our collection, you'll see it before anyone else.`,
    cta: 'Browse the collection',
  },
  es: {
    watch_subject: (title) => `Estás siguiendo ${title}`,
    watch_body: (title) =>
      `Ahora sigues <strong>${title}</strong>. Si el precio cambia o se mueve la disponibilidad, serás el primero en saberlo.`,
    wait_subject: (region) => `Estás en la lista de espera — ${region}`,
    wait_body: (title, region) =>
      `<strong>${title}</strong> está vendida — pero ahora eres el primero de la lista. En cuanto llegue una nueva propiedad en <strong>${region}</strong>, la verás antes que nadie.`,
    cta: 'Ver la colección',
  },
  fr: {
    watch_subject: (title) => `Vous suivez ${title}`,
    watch_body: (title) =>
      `Vous suivez désormais <strong>${title}</strong>. Si le prix change ou si la disponibilité évolue, vous serez averti en premier.`,
    wait_subject: (region) => `Vous êtes sur la liste d'attente — ${region}`,
    wait_body: (title, region) =>
      `<strong>${title}</strong> est entièrement vendu — mais vous êtes désormais premier sur la liste. Dès qu'un nouveau bien arrive en <strong>${region}</strong>, vous le verrez avant tout le monde.`,
    cta: 'Voir la collection',
    open_now: (region) => `En attendant, voici ce qui est disponible en <strong>${region}</strong> aujourd'hui :`,
  },
  de: {
    watch_subject: (title) => `Sie beobachten ${title}`,
    watch_body: (title) =>
      `Sie beobachten jetzt <strong>${title}</strong>. Ändert sich der Preis oder die Verfügbarkeit, erfahren Sie es als Erste(r) — kein Spam, nur Neuigkeiten zu diesem Haus.`,
    wait_subject: (region) => `Sie stehen auf der Warteliste — ${region}`,
    wait_body: (title, region) =>
      `<strong>${title}</strong> ist vollständig verkauft — aber Sie stehen jetzt ganz oben auf der Liste. Sobald ein neues Haus in <strong>${region}</strong> in unsere Kollektion kommt, sehen Sie es vor allen anderen.`,
    cta: 'Kollektion ansehen',
    open_now: (region) => `Bis dahin — diese Häuser in <strong>${region}</strong> sind heute verfügbar:`,
  },
};
CONFIRM.en.open_now = (region) => `While you wait, these homes in <strong>${region}</strong> are open right now:`;
CONFIRM.es.open_now = (region) => `Mientras tanto, estas propiedades en <strong>${region}</strong> están disponibles ahora mismo:`;

/** Up to three live homes in the same region — the thing a waitlist email
 *  must never leave out (David, 6 Sep 2026: four Liguria homes were live
 *  while the email promised to tell Anja "the moment" one appeared). */
async function liveHomesInRegion(db, region, excludeSlug, limit = 3) {
  if (!region) return [];
  const { data } = await db
    .from('properties')
    .select('slug,title,price,currency,beds,region,date_added')
    .in('status', ['Live', 'for_sale'])
    .ilike('region', region)
    .neq('slug', excludeSlug || '')
    .order('date_added', { ascending: false })
    .limit(limit);
  return data || [];
}

function homesListHtml(homes) {
  if (!homes.length) return '';
  const rows = homes.map((h) => {
    const sym = { EUR: '€', USD: '$', GBP: '£' }[h.currency] || '€';
    const price = h.price ? ` — ${sym}${Number(h.price).toLocaleString('en-GB')}` : '';
    return `<li style="margin:0 0 8px"><a href="${SITE}/property/${h.slug}/" style="color:#1E3448">${h.title}</a>${price}</li>`;
  }).join('');
  return `<ul style="margin:0 0 22px;padding-left:20px;font-size:14px;line-height:1.6">${rows}</ul>`;
}

function confirmationHtml({ bodyHtml, cta, email, extraHtml = '' }) {
  return `
  <div style="background:#F7F4EE;padding:40px 16px;font-family:Georgia,'Times New Roman',serif;color:#1E3448">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #E8E3DC">
      <div style="background:#ffffff;padding:26px 32px 22px;text-align:center;border-bottom:1px solid #E8E3DC">
        <img src="${SITE}/images/email-logo-dark.png" width="132" alt="Co-Ownership Property" style="display:inline-block;width:132px;height:auto">
      </div>
      <div style="padding:36px 32px 28px">
        <div style="width:36px;border-top:2px solid #C9A84C;margin:0 0 18px"></div>
        <p style="font-size:15px;line-height:1.7;margin:0 0 22px">${bodyHtml}</p>${extraHtml}
        <a href="${SITE}/our-homes/" style="display:inline-block;background:#1E3448;color:#F4EFE4;text-decoration:none;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;padding:13px 26px">${cta} &rarr;</a>
      </div>
      <div style="padding:18px 32px;border-top:1px solid #E8E3DC">
        <p style="font-family:Arial,sans-serif;font-size:11px;color:#8a9aaa;margin:0">
          Co-Ownership Properties · co-ownership-property.com<br/>
          <a href="${unsubUrl(email)}" style="color:#8a9aaa">Unsubscribe</a>
        </p>
      </div>
    </div>
  </div>`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, slug, kind = 'watch', locale = 'en' } = req.body || {};
  const cleanEmail = String(email || '').toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  if (!slug || !['watch', 'waitlist'].includes(kind)) {
    return res.status(400).json({ error: 'Bad request' });
  }

  const { limited } = await checkRateLimit(cleanEmail, 'track-property', 10 * 60 * 1000, 8);
  if (limited) return res.status(429).json({ error: 'Too many requests' });

  const db = createSupabaseAdminClient();
  const { data: prop } = await db
    .from('properties')
    .select('slug,title,price,status,region,country,city')
    .eq('slug', slug)
    .in('status', ['Live', 'for_sale', 'sold'])
    .single();
  if (!prop) return res.status(404).json({ error: 'Property not found' });

  const region = prop.region || prop.country || '';

  const { error: watchErr } = await db.from('property_watches').upsert(
    {
      email: cleanEmail,
      slug: prop.slug,
      kind,
      region,
      country: prop.country || null,
      last_price: prop.price || null,
      last_status: prop.status,
      locale,
    },
    { onConflict: 'email,slug,kind' }
  );
  if (watchErr) {
    console.error('[track-property] upsert failed:', watchErr.message);
    return res.status(500).json({ error: 'Could not save' });
  }

  // CRM: this is a named-home interest signal — make it count.
  let contact = null;
  try {
    contact = await upsertContact({
      email: cleanEmail,
      source: kind === 'waitlist' ? 'sold_waitlist' : 'property_watch',
      locale,
    });
    if (contact) {
      await incrementScore(contact.id, kind === 'waitlist' ? 15 : 10);
      await logActivity({
        contactId: contact.id,
        type: kind === 'waitlist' ? 'sold_waitlist' : 'property_watch',
        description:
          kind === 'waitlist'
            ? `Joined waitlist from sold page: ${prop.title} (${region})`
            : `Tracking price/availability: ${prop.title}`,
        metadata: { slug: prop.slug, region, price: prop.price },
      });
    }
  } catch (e) {
    console.error('[track-property] CRM write failed:', e.message);
  }

  // Confirmation email
  try {
    const c = CONFIRM[locale] || CONFIRM.en;
    const isWait = kind === 'waitlist';
    // A sold-page waitlister is told what is open in that region today, not
    // just promised the future.
    const openNow = isWait ? await liveHomesInRegion(db, prop.region, prop.slug) : [];
    const extraHtml = openNow.length
      ? `<p style="font-size:15px;line-height:1.7;margin:0 0 12px">${c.open_now(region)}</p>${homesListHtml(openNow)}`
      : '';
    await sendHtml({
      to: cleanEmail,
      subject: isWait ? c.wait_subject(region) : c.watch_subject(prop.title),
      html: confirmationHtml({
        bodyHtml: isWait ? c.wait_body(prop.title, region) : c.watch_body(prop.title),
        cta: c.cta,
        email: cleanEmail,
        extraHtml,
      }),
      log: {
        trigger: isWait ? 'sold_waitlist' : 'property_watch',
        type: isWait ? 'waitlist_confirmation' : 'watch_confirmation',
        contactId: contact?.id || null,
        propertyTitle: prop.title, propertyUrl: `${SITE}/property/${prop.slug}/`,
        templateProps: {
          slug: prop.slug, region, locale, price: prop.price,
          recommended: openNow.map((h) => ({ slug: h.slug, title: h.title, price: h.price })),
        },
        notes: isWait ? `Waitlist confirmation — ${region}${openNow.length ? ` (+${openNow.length} live homes shown)` : ''}` : 'Watch confirmation',
      },
    });
  } catch (e) {
    console.error('[track-property] confirmation send failed:', e.message);
  }

  // Team heads-up (high-intent signal on a named home)
  try {
    await sendTeamNotification({
      subject: `${kind === 'waitlist' ? 'Waitlist' : 'Watch'} — ${cleanEmail} — ${prop.title}`,
      html: `<p style="font-family:Arial,sans-serif;font-size:14px;color:#1E3448"><strong>${cleanEmail}</strong> ${kind === 'waitlist' ? 'joined the waitlist from the sold page of' : 'is now tracking'} <a href="${SITE}/property/${prop.slug}/">${prop.title}</a>.</p>`,
    });
  } catch (e) { /* non-fatal */ }

  return res.status(200).json({ ok: true });
}
