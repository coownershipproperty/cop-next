/**
 * /api/save-shortlist
 *
 * POST { email, slugs[], locale? } — persist a visitor's favourites shortlist
 * and email them a private restore link, capturing them as a contact at the
 * exact moment they express interest. One shortlist per email (upsert).
 *
 * GET ?token=... — return { slugs } so the favourites page can restore the
 * shortlist into localStorage on any device.
 */
import crypto from 'crypto';
import { createSupabaseAdminClient } from '@/lib/supabaseAdmin';
import { upsertContact, incrementScore, logActivity } from '@/lib/crm';
import { checkRateLimit } from '@/lib/rateLimit';
import { sendHtml, FROM_ADDRESS, REPLY_TO } from '@/lib/resend';
import { unsubUrl } from '@/lib/unsub';
import { SUPPORTED_LOCALES, routePath } from '@/lib/i18n';

const SITE = 'https://co-ownership-property.com';

const COPY = {
  en: {
    subject: (n) => `Your shortlist of ${n} ${n === 1 ? 'home' : 'homes'} — saved`,
    intro: (n) =>
      `Your shortlist of <strong>${n} ${n === 1 ? 'home' : 'homes'}</strong> is safe. Open the link below on any device — phone, laptop, the family iPad — and your favourites will be there waiting.`,
    cta: 'Open my shortlist',
    tip: 'Tip: forward this email to whoever you’d co-own with — it’s the easiest way to compare notes.',
  },
  es: {
    subject: (n) => `Tu selección de ${n} ${n === 1 ? 'propiedad' : 'propiedades'} — guardada`,
    intro: (n) =>
      `Tu selección de <strong>${n} ${n === 1 ? 'propiedad' : 'propiedades'}</strong> está a salvo. Abre el enlace en cualquier dispositivo y tus favoritos estarán ahí.`,
    cta: 'Abrir mi selección',
    tip: 'Consejo: reenvía este correo a las personas con quienes comprarías — es la forma más fácil de comparar.',
  },
  fr: {
    subject: (n) => `Votre sélection de ${n} ${n === 1 ? 'bien' : 'biens'} — enregistrée`,
    intro: (n) =>
      `Votre sélection de <strong>${n} ${n === 1 ? 'bien' : 'biens'}</strong> est en sécurité. Ouvrez le lien sur n'importe quel appareil et vos favoris vous attendront.`,
    cta: 'Ouvrir ma sélection',
    tip: 'Astuce : transférez cet e-mail à vos futurs co-propriétaires — le moyen le plus simple de comparer.',
  },
  de: {
    subject: (n) => n === 1 ? `Ihre Merkliste mit ${n} Immobilie — gesichert` : `Ihre Merkliste mit ${n} Immobilien — gesichert`,
    intro: (n) => n === 1 ? `Ihre Merkliste mit <strong>${n} Immobilie</strong> ist gesichert. Öffnen Sie den Link unten auf einem beliebigen Gerät — Handy, Laptop, dem iPad der Familie — und Ihre Favoriten warten dort auf Sie.` : `Ihre Merkliste mit <strong>${n} Immobilien</strong> ist gesichert. Öffnen Sie den Link unten auf einem beliebigen Gerät — Handy, Laptop, dem iPad der Familie — und Ihre Favoriten warten dort auf Sie.`,
    cta: "Meine Merkliste öffnen",
    tip: "Tipp: Leiten Sie diese E-Mail an alle weiter, mit denen Sie gemeinsam Eigentümer werden möchten — so tauschen Sie sich am einfachsten aus.",
  },
  it: {
    subject: (n) => n === 1 ? `La sua selezione di ${n} casa — salvata` : `La sua selezione di ${n} case — salvata`,
    intro: (n) => n === 1 ? `La sua selezione di <strong>${n} casa</strong> è al sicuro. Apra il link qui sotto da qualsiasi dispositivo — telefono, portatile, l'iPad di casa — e i suoi preferiti saranno lì ad aspettarla.` : `La sua selezione di <strong>${n} case</strong> è al sicuro. Apra il link qui sotto da qualsiasi dispositivo — telefono, portatile, l'iPad di casa — e i suoi preferiti saranno lì ad aspettarla.`,
    cta: "Apri la mia selezione",
    tip: "Un consiglio: inoltri questa email a chi vorrebbe comprare insieme a lei — è il modo più semplice per confrontarvi.",
  },
  nl: {
    subject: (n) => n === 1 ? `Uw shortlist van ${n} woning — bewaard` : `Uw shortlist van ${n} woningen — bewaard`,
    intro: (n) => n === 1 ? `Uw shortlist van <strong>${n} woning</strong> is veilig bewaard. Open de link hieronder op elk apparaat — telefoon, laptop, de iPad van het gezin — en uw favorieten staan voor u klaar.` : `Uw shortlist van <strong>${n} woningen</strong> is veilig bewaard. Open de link hieronder op elk apparaat — telefoon, laptop, de iPad van het gezin — en uw favorieten staan voor u klaar.`,
    cta: "Open mijn shortlist",
    tip: "Tip: stuur deze e-mail door naar degene met wie u mede-eigenaar zou worden — dat is de makkelijkste manier om samen te overleggen.",
  },
  pt: {
    subject: (n) => n === 1 ? `A sua seleção de ${n} casa — guardada` : `A sua seleção de ${n} casas — guardada`,
    intro: (n) => n === 1 ? `A sua seleção de <strong>${n} casa</strong> está guardada em segurança. Abra o link abaixo em qualquer dispositivo — telemóvel, portátil, o iPad lá de casa — e os seus favoritos estarão à sua espera.` : `A sua seleção de <strong>${n} casas</strong> está guardada em segurança. Abra o link abaixo em qualquer dispositivo — telemóvel, portátil, o iPad lá de casa — e os seus favoritos estarão à sua espera.`,
    cta: "Abrir a minha seleção",
    tip: "Sugestão: reencaminhe este email a quem gostaria de ter como comproprietário — é a forma mais simples de trocarem impressões.",
  },
};

const FAV_PATH = Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, routePath(l, 'favourites')]));

export default async function handler(req, res) {
  const db = createSupabaseAdminClient();

  if (req.method === 'GET') {
    const token = String(req.query.token || '').trim();
    if (!/^[a-f0-9]{32}$/.test(token)) return res.status(400).json({ error: 'Bad token' });
    const { data } = await db.from('shortlists').select('slugs').eq('token', token).single();
    if (!data) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json({ slugs: data.slugs || [] });
  }

  if (req.method !== 'POST') return res.status(405).end();

  const { email, slugs, locale = 'en' } = req.body || {};
  const cleanEmail = String(email || '').toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  const cleanSlugs = (Array.isArray(slugs) ? slugs : [])
    .map((s) => String(s || '').trim())
    .filter(Boolean)
    .slice(0, 100);
  if (cleanSlugs.length === 0) return res.status(400).json({ error: 'Shortlist is empty' });

  const { limited } = await checkRateLimit(cleanEmail, 'save-shortlist', 10 * 60 * 1000, 6);
  if (limited) return res.status(429).json({ error: 'Too many requests' });

  // One shortlist per email; keep the token stable across re-saves so old
  // emailed links keep working.
  const { data: existing } = await db
    .from('shortlists')
    .select('token')
    .eq('email', cleanEmail)
    .maybeSingle();
  const token = existing?.token || crypto.randomBytes(16).toString('hex');

  const { error } = await db.from('shortlists').upsert(
    {
      email: cleanEmail,
      token,
      slugs: cleanSlugs,
      locale,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'email' }
  );
  if (error) {
    console.error('[save-shortlist] upsert failed:', error.message);
    return res.status(500).json({ error: 'Could not save' });
  }

  // CRM capture — the whole point.
  try {
    const contact = await upsertContact({ email: cleanEmail, source: 'shortlist', locale });
    if (contact) {
      await incrementScore(contact.id, 10);
      await logActivity({
        contactId: contact.id,
        type: 'shortlist_saved',
        description: `Saved a shortlist of ${cleanSlugs.length} home${cleanSlugs.length === 1 ? '' : 's'}`,
        metadata: { slugs: cleanSlugs },
      });
    }
  } catch (e) {
    console.error('[save-shortlist] CRM write failed:', e.message);
  }

  // Restore-link email
  const c = COPY[locale] || COPY.en;
  const link = `${SITE}${FAV_PATH[locale] || FAV_PATH.en}?sl=${token}`;
  try {
    // Through sendHtml so a rejected send is not silent and the email is
    // recorded in the CRM like every other lead-facing send (7 Sep 2026).
    await sendHtml({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO,
      to: cleanEmail,
      subject: c.subject(cleanSlugs.length),
      log: { trigger: 'shortlist_saved', type: 'shortlist_link', templateProps: { slugs: cleanSlugs, locale }, notes: 'Saved shortlist link' },
      html: `
      <div style="background:#F7F4EE;padding:40px 16px;font-family:Georgia,'Times New Roman',serif;color:#1E3448">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #E8E3DC">
          <div style="background:#1E3448;padding:26px 32px;text-align:center">
            <span style="color:#F4EFE4;font-size:20px;letter-spacing:0.35em;font-weight:400">C O P</span><br/>
            <span style="color:#C9A84C;font-size:10px;letter-spacing:0.2em;text-transform:uppercase">Co-Ownership Properties</span>
          </div>
          <div style="padding:36px 32px 28px">
            <div style="width:36px;border-top:2px solid #C9A84C;margin:0 0 18px"></div>
            <p style="font-size:15px;line-height:1.7;margin:0 0 22px">${c.intro(cleanSlugs.length)}</p>
            <a href="${link}" style="display:inline-block;background:#1E3448;color:#F4EFE4;text-decoration:none;font-family:Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;padding:13px 26px">${c.cta} &rarr;</a>
            <p style="font-family:Arial,sans-serif;font-size:12px;color:#8a9aaa;line-height:1.6;margin:24px 0 0">${c.tip}</p>
          </div>
          <div style="padding:18px 32px;border-top:1px solid #E8E3DC">
            <p style="font-family:Arial,sans-serif;font-size:11px;color:#8a9aaa;margin:0">
              Co-Ownership Properties · co-ownership-property.com<br/>
              <a href="${unsubUrl(cleanEmail)}" style="color:#8a9aaa">Unsubscribe</a>
            </p>
          </div>
        </div>
      </div>`,
    });
  } catch (e) {
    console.error('[save-shortlist] email send failed:', e.message);
  }

  return res.status(200).json({ ok: true });
}
