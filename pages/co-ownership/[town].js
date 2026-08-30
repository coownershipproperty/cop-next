import fs from 'fs';
import path from 'path';
import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import PropertyCard from '@/components/PropertyCard';
import { townSlug, TOWN_PAGE_MIN_HOMES } from '@/lib/townSlug';
import { localeFromPath, localeColumns, pickLocalized, SUPPORTED_LOCALES, routePath } from '@/lib/i18n';
import hreflangLinks from '@/components/HreflangLinks';

/**
 * /co-ownership/{town}/ — programmatic town-level landing pages.
 *
 * One template, hundreds of long-tail pages ("Co-ownership in Marbella — 4
 * homes from €95,000/share"), generated from the live database in four
 * languages. The portal trick, applied to a niche where nobody else competes.
 *
 * Locale mirrors re-export this page (see /es/copropiedad/, /fr/copropriete/,
 * /de/miteigentum/) with forceLocale, mirroring the property-page pattern.
 */

const SYM = { EUR: '€', USD: '$', GBP: '£' };

const COPY = {
  en: {
    eyebrow: (country) => `Co-Ownership · ${country}`,
    title: (town) => `Co-Ownership Homes in ${town}`,
    sub: (n, from, town) =>
      `${n === 1 ? 'One luxury holiday home' : `${n} luxury holiday homes`} in ${town} available as deeded co-ownership shares${from ? `, from ${from} per share` : ''}. Genuine ownership, fully managed, a fraction of the whole-home price.`,
    homes_heading: (town) => `The ${town} Collection`,
    about_heading: (town) => `Why buy a co-ownership home in ${town}?`,
    about_body: (town, country, from) =>
      `Buying a whole holiday home in ${town} means paying full price for a house that stands empty most of the year. Co-ownership takes the same home — professionally managed, beautifully furnished — and divides it into deeded shares, usually eighths. You own real property in ${country}, registered in your name, with roughly six weeks of use a year, the freedom to sell whenever you choose, and running costs shared between owners rather than shouldered alone.${from ? ` In ${town}, that ownership starts from ${from}.` : ''}`,
    faq: (town, country) => [
      { q: `What does co-ownership in ${town} cost?`, a: `Each listing shows the full price of its share — typically one-eighth of the home. It is a purchase price, not a deposit or membership fee: you become a deeded owner of the property.` },
      { q: `Is this a timeshare?`, a: `No. A timeshare sells you time; co-ownership sells you property. Your share of the ${town} home is real estate in ${country}, registered in your name — it can appreciate, be resold on the open market, and be passed on.` },
      { q: `How much time do I get at the home?`, a: `A one-eighth share corresponds to about six weeks a year, scheduled fairly across seasons so every owner enjoys peak weeks over time. The home is professionally managed — you simply arrive.` },
    ],
    cta: 'Browse all homes',
    enquire_note: 'Questions about a home in this collection? Our team typically replies within minutes.',
  },
  es: {
    eyebrow: (country) => `Copropiedad · ${country}`,
    title: (town) => `Copropiedad en ${town}`,
    sub: (n, from, town) =>
      `${n === 1 ? 'Una vivienda vacacional de lujo' : `${n} viviendas vacacionales de lujo`} en ${town} disponibles como participaciones de copropiedad con escritura${from ? `, desde ${from} por participación` : ''}. Propiedad real, gestión integral, una fracción del precio total.`,
    homes_heading: (town) => `La colección de ${town}`,
    about_heading: (town) => `¿Por qué comprar en copropiedad en ${town}?`,
    about_body: (town, country, from) =>
      `Comprar una vivienda vacacional entera en ${town} significa pagar el precio completo por una casa que pasa vacía la mayor parte del año. La copropiedad toma esa misma casa — gestionada profesionalmente y amueblada con gusto — y la divide en participaciones con escritura, normalmente octavos. Eres propietario real en ${country}, a tu nombre, con unas seis semanas de uso al año, libertad para vender cuando quieras y gastos compartidos entre propietarios.${from ? ` En ${town}, esa propiedad empieza desde ${from}.` : ''}`,
    faq: (town, country) => [
      { q: `¿Cuánto cuesta la copropiedad en ${town}?`, a: `Cada anuncio muestra el precio completo de su participación — normalmente un octavo de la vivienda. Es un precio de compra, no un depósito: te conviertes en propietario con escritura.` },
      { q: `¿Es una multipropiedad?`, a: `No. La multipropiedad vende tiempo; la copropiedad vende propiedad. Tu participación en ${town} es un inmueble real en ${country}, a tu nombre — puede revalorizarse, revenderse y heredarse.` },
      { q: `¿Cuánto tiempo disfruto de la casa?`, a: `Una participación de un octavo corresponde a unas seis semanas al año, repartidas de forma justa entre temporadas. La casa está gestionada profesionalmente — tú solo llegas.` },
    ],
    cta: 'Ver todas las propiedades',
    enquire_note: '¿Preguntas sobre alguna vivienda? Nuestro equipo suele responder en minutos.',
  },
  fr: {
    eyebrow: (country) => `Copropriété · ${country}`,
    title: (town) => `Copropriété à ${town}`,
    sub: (n, from, town) =>
      `${n === 1 ? 'Une résidence de vacances de luxe' : `${n} résidences de vacances de luxe`} à ${town}, disponibles en parts de copropriété avec titre de propriété${from ? `, à partir de ${from} la part` : ''}. Une vraie propriété, entièrement gérée, pour une fraction du prix.`,
    homes_heading: (town) => `La collection ${town}`,
    about_heading: (town) => `Pourquoi acheter en copropriété à ${town} ?`,
    about_body: (town, country, from) =>
      `Acheter une résidence secondaire entière à ${town}, c'est payer plein prix pour une maison vide la majeure partie de l'année. La copropriété prend cette même maison — gérée par des professionnels, joliment meublée — et la divise en parts avec titre de propriété, généralement des huitièmes. Vous possédez un bien immobilier réel en ${country}, à votre nom, avec environ six semaines d'usage par an, la liberté de revendre à tout moment et des charges partagées entre propriétaires.${from ? ` À ${town}, cette propriété commence à ${from}.` : ''}`,
    faq: (town, country) => [
      { q: `Combien coûte la copropriété à ${town} ?`, a: `Chaque annonce affiche le prix complet de sa part — généralement un huitième du bien. C'est un prix d'achat, pas un dépôt : vous devenez propriétaire en titre.` },
      { q: `Est-ce du timeshare ?`, a: `Non. Le timeshare vend du temps ; la copropriété vend de la pierre. Votre part à ${town} est un bien immobilier réel en ${country}, à votre nom — il peut prendre de la valeur, se revendre librement et se transmettre.` },
      { q: `Combien de temps ai-je la maison ?`, a: `Une part d'un huitième correspond à environ six semaines par an, réparties équitablement entre les saisons. La maison est entièrement gérée — vous n'avez qu'à arriver.` },
    ],
    cta: 'Voir tous les biens',
    enquire_note: 'Une question sur un bien ? Notre équipe répond généralement en quelques minutes.',
  },
  de: {
    eyebrow: (country) => `Miteigentum · ${country}`,
    title: (town) => `Miteigentum in ${town}`,
    sub: (n, from, town) =>
      `${n === 1 ? 'Ein luxuriöses Ferienhaus' : `${n} luxuriöse Ferienhäuser`} in ${town}, erhältlich als grundbuchlich eingetragene Miteigentumsanteile${from ? `, ab ${from} pro Anteil` : ''}. Echtes Eigentum, komplett verwaltet, zum Bruchteil des Gesamtpreises.`,
    homes_heading: (town) => `Die ${town}-Kollektion`,
    about_heading: (town) => `Warum Miteigentum in ${town}?`,
    about_body: (town, country, from) =>
      `Ein ganzes Ferienhaus in ${town} zu kaufen heißt, den vollen Preis für ein Haus zu zahlen, das die meiste Zeit des Jahres leer steht. Beim Miteigentum wird dasselbe Haus — professionell verwaltet, geschmackvoll eingerichtet — in eingetragene Anteile geteilt, meist Achtel. Sie besitzen echtes Eigentum in ${country}, auf Ihren Namen, mit rund sechs Wochen Nutzung pro Jahr, jederzeitiger Verkaufsfreiheit und zwischen den Eigentümern geteilten Kosten.${from ? ` In ${town} beginnt dieses Eigentum ab ${from}.` : ''}`,
    faq: (town, country) => [
      { q: `Was kostet Miteigentum in ${town}?`, a: `Jedes Inserat zeigt den vollständigen Preis seines Anteils — in der Regel ein Achtel des Hauses. Es ist ein Kaufpreis, keine Anzahlung: Sie werden eingetragener Eigentümer.` },
      { q: `Ist das Timesharing?`, a: `Nein. Timesharing verkauft Zeit; Miteigentum verkauft Immobilie. Ihr Anteil in ${town} ist echtes Eigentum in ${country}, auf Ihren Namen — er kann an Wert gewinnen, frei weiterverkauft und vererbt werden.` },
      { q: `Wie viel Zeit habe ich im Haus?`, a: `Ein Achtel-Anteil entspricht etwa sechs Wochen pro Jahr, fair über die Saisons verteilt. Das Haus wird professionell verwaltet — Sie reisen einfach an.` },
    ],
    cta: 'Alle Immobilien ansehen',
    enquire_note: 'Fragen zu einem Haus? Unser Team antwortet in der Regel innerhalb von Minuten.',
  },
};

// Country destination pages carry the deep legal/tax layer (ownership
// structure, taxes, inheritance, resale process) so town pages stay
// place-focused without duplicating it 76 times. Link down, don't repeat.
const COUNTRY_GUIDE = {
  Spain: '/spain-fractional-ownership-properties/',
  France: '/france-fractional-ownership-properties/',
  Italy: '/italy-fractional-ownership-properties/',
  USA: '/usa-fractional-ownership-properties/',
  Portugal: '/portugal-fractional-ownership-properties/',
};
const COUNTRY_LINK_COPY = {
  en: (c) => `The legal structure, taxes and resale process for your 1/8 deeded share are covered in depth in our complete country guide.`,
  es: (c) => `La estructura legal, los impuestos y el proceso de reventa de tu participación 1/8 con escritura se explican en profundidad en nuestra guía completa del país.`,
  fr: (c) => `La structure juridique, la fiscalité et le processus de revente de votre part 1/8 en titre sont couverts en détail dans notre guide complet du pays.`,
  de: (c) => `Rechtsstruktur, Steuern und Wiederverkaufsprozess Ihres eingetragenen 1/8-Anteils behandelt unser vollständiger Länderguide im Detail.`,
};
const COUNTRY_LINK_CTA = {
  en: (c) => `Read the full ${c} ownership guide →`,
  es: (c) => `Leer la guía completa de ${c} →`,
  fr: (c) => `Lire le guide complet ${c} →`,
  de: (c) => `Zum vollständigen ${c}-Guide →`,
};

// Listings-page URL per locale, derived from the locale table in lib/i18n.js.
const BROWSE_HREF = Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, routePath(l, 'homes')]));
// Town-guide URL prefix per locale, e.g. /co-ownership/, /es/copropiedad/,
// /no/sameie/. Each locale's segment carries its own primary product term —
// see ROUTE_SLUGS in lib/i18n.js and docs/translation-glossary.md.
const PATH_PREFIX = Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, routePath(l, 'towns')]));

const FIELDS =
  `slug, ${localeColumns(['title'])}, img, images, total_images, drive_url, price, currency, share_denominator, country, region, city, beds, size, status, property_type, date_added`;

function toCardProp(p) {
  return {
    slug: p.slug,
    title: p.title,
    ...pickLocalized(p, ['title']),
    img: p.img,
    images: (p.images || []).slice(0, 3),
    totalImages: p.total_images || 0,
    driveUrl: p.drive_url || null,
    price: p.price || null,
    currency: p.currency || 'EUR',
    share_denominator: p.share_denominator || null,
    country: p.country || '',
    region: p.region || '',
    city: p.city || '',
    beds: p.beds || 0,
    size: p.size || 0,
    label: '',
    status: p.status || '',
    property_type: p.property_type || '',
    dateAdded: p.date_added || null,
  };
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export async function getStaticPaths() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('properties')
    .select('city')
    .in('status', ['Live', 'for_sale']);
  const counts = {};
  for (const row of data || []) {
    if (!row.city) continue;
    const s = townSlug(row.city);
    if (!s) continue;
    counts[s] = (counts[s] || 0) + 1;
  }
  const paths = Object.entries(counts)
    .filter(([, n]) => n >= TOWN_PAGE_MIN_HOMES)
    .map(([town]) => ({ params: { town } }));
  return { paths, fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('properties')
    .select(FIELDS)
    .in('status', ['Live', 'for_sale']);

  const matches = (data || []).filter((p) => townSlug(p.city) === params.town);
  if (matches.length === 0) return { notFound: true, revalidate: 3600 };

  matches.sort((a, b) => (a.price || 9e12) - (b.price || 9e12));
  const town = matches[0].city;
  const country = matches[0].country || '';
  const region = matches[0].region || '';
  const prices = matches.map((p) => p.price).filter(Boolean);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const currency = matches[0].currency || 'EUR';

  // Optional hand-written town guide (content/towns/{slug}.json) — when it
  // exists, the page renders a full editorial section per language instead of
  // only the templated boilerplate. Written town by town; quality over volume.
  let guide = null;
  try {
    const guidePath = path.join(process.cwd(), 'content', 'towns', `${params.town}.json`);
    if (fs.existsSync(guidePath)) guide = JSON.parse(fs.readFileSync(guidePath, 'utf-8'));
  } catch (e) {
    console.error('[town] guide load failed for', params.town, e.message);
  }

  // Photo pool for editorial image bands — every home's best shots, deduped,
  // so the long guide reads like a magazine feature rather than a text wall.
  const seen = new Set();
  const gallery = [];
  for (const m of matches) {
    for (const u of [m.img, ...(m.images || [])]) {
      if (!u || seen.has(u) || u.includes('lh3.googleusercontent.com')) continue;
      seen.add(u);
      gallery.push(u);
    }
  }

  return {
    props: {
      townParam: params.town,
      town,
      country,
      region,
      minPrice,
      currency,
      homes: matches.map(toCardProp),
      guide,
      gallery: gallery.slice(0, 14),
    },
    revalidate: 3600,
  };
}

/**
 * Gate a locale mirror on translated content.
 *
 * The town route exists in every locale, but a guide is translated town by
 * town. Serving the English body under /it/comproprieta/aspen/ would be a
 * locale URL whose content is English — thin content at catalogue scale, and
 * the one thing docs/translation-glossary.md says never to ship. So a mirror
 * 404s until that town's guide exists in that language, and starts working the
 * day it lands with no code change.
 *
 * English is never gated: it is the source.
 */
export function gateOnTranslation(result, locale) {
  if (locale === 'en') return result;
  const guide = result && result.props && result.props.guide;
  const sections = guide && guide[locale] && guide[locale].sections;
  if (!sections || !sections.length) return { notFound: true, revalidate: 3600 };
  return result;
}

export default function TownPage({ townParam, town, country, region, minPrice, currency, homes, guide, gallery = [], forceLocale }) {
  const router = useRouter();
  const locale = forceLocale || localeFromPath(router.asPath || router.pathname) || 'en';
  const t = COPY[locale] || COPY.en;
  const from = minPrice ? `${SYM[currency] || currency}${Number(minPrice).toLocaleString('en-GB')}` : null;

  const faqs = t.faq(town, country);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
  const SITE = 'https://co-ownership-property.com';
  const COUNTRY_DEST = {
    Spain: '/spain-fractional-ownership-properties/',
    France: '/france-fractional-ownership-properties/',
    Italy: '/italy-fractional-ownership-properties/',
    USA: '/usa-fractional-ownership-properties/',
    Portugal: '/portugal-fractional-ownership-properties/',
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Co-Ownership Property', item: SITE + '/' },
      ...(COUNTRY_DEST[country] ? [{ '@type': 'ListItem', position: 2, name: `${country} Fractional Ownership`, item: SITE + COUNTRY_DEST[country] }] : []),
      { '@type': 'ListItem', position: COUNTRY_DEST[country] ? 3 : 2, name: `Co-Ownership in ${town}`, item: `${SITE}/co-ownership/${townParam}/` },
    ],
  };
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Co-ownership homes in ${town}`,
    numberOfItems: homes.length,
    itemListElement: homes.map((h, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE}/property/${h.slug}/`,
      name: h.title,
    })),
  };
  const ogImage = gallery[0] || homes[0]?.img || '';


  return (
    <>
      <Head>
        <title>{`${t.title(town)} — Fractional Ownership ${locale === 'en' ? `from ${from || ''}` : from || ''} | COP`}</title>
        <meta name="description" content={t.sub(homes.length, from, town)} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Co-Ownership Property" />
        <meta property="og:title" content={`${t.title(town)} — Fractional Ownership ${from ? `from ${from}` : ''}`} />
        <meta property="og:description" content={t.sub(homes.length, from, town)} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:url" content={`https://co-ownership-property.com${(PATH_PREFIX[locale] || PATH_PREFIX.en)}${townParam}/`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`https://co-ownership-property.com${PATH_PREFIX[locale] || PATH_PREFIX.en}${townParam}/`} />
        {hreflangLinks({ family: 'towns', slug: townParam })}
        <link rel="icon" href="/favicon.ico" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      </Head>
      <Header />

      <section className="page-hero">
        <span className="page-hero-eyebrow">{t.eyebrow([region, country].filter(Boolean).join(', '))}</span>
        <h1>{t.title(town)}</h1>
        <p className="page-hero-sub">{t.sub(homes.length, from, town)}</p>
      </section>

      <section className="town-sec">
        <div className="town-inner">
          <h2 className="town-heading">{t.homes_heading(town)}</h2>
          <div className="fav-grid">
            {homes.map((p, i) => (
              <PropertyCard key={p.slug} property={p} priority={i < 3} />
            ))}
          </div>

          <div className="town-about">
            <h2>{t.about_heading(town)}</h2>
            <p>{t.about_body(town, country, from)}</p>
          </div>

          {guide && (guide[locale] || guide.en) && (
            <div className="town-guide">
              {(guide[locale] || guide.en).sections.map((sec, i) => (
                <div key={i}>
                  <div className="town-about">
                    <h2>{sec.h}</h2>
                    {sec.p.map((para, j) => <p key={j}>{para}</p>)}
                  </div>
                  {i % 3 === 1 && gallery.length > 0 && (
                    <div className={`town-photo-band${(Math.floor(i / 3) % 2 === 1 && gallery.length > 6) ? ' town-photo-duo' : ''}`}>
                      <div className="town-photo">
                        <Image src={gallery[Math.floor(i / 3) * 2 % gallery.length]} alt={`${town} — the collection`} fill loading="lazy" sizes="(max-width: 860px) 100vw, 780px" style={{ objectFit: 'cover' }} />
                      </div>
                      {Math.floor(i / 3) % 2 === 1 && gallery.length > 6 && (
                        <div className="town-photo">
                          <Image src={gallery[(Math.floor(i / 3) * 2 + 1) % gallery.length]} alt={`${town} — the collection`} fill loading="lazy" sizes="(max-width: 860px) 100vw, 390px" style={{ objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {COUNTRY_GUIDE[country] && (
            <div className="town-country-link">
              <p>
                {(COUNTRY_LINK_COPY[locale] || COUNTRY_LINK_COPY.en)(country)}{' '}
                <a href={COUNTRY_GUIDE[country]}>{(COUNTRY_LINK_CTA[locale] || COUNTRY_LINK_CTA.en)(country)}</a>
              </p>
            </div>
          )}

          <div className="town-faq">
            {faqs.map((f, i) => (
              <details key={i}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>

          <div className="town-cta">
            <a href={BROWSE_HREF[locale] || BROWSE_HREF.en} className="btn-gold">{t.cta} →</a>
            <p>{t.enquire_note}</p>
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
