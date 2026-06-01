/**
 * pages/viewings/index.js
 * Public-facing index of upcoming private viewings.
 * URL: /viewings/
 *
 * Data source: lib/viewings.json (edit to add/remove a viewing).
 * Cards link to the COP property page; "Request" CTA scrolls to the form.
 */
import Head from 'next/head';
import fs from 'fs';
import path from 'path';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ViewingRequestForm from '@/components/ViewingRequestForm';

const SYM = { EUR: '€', USD: '$', GBP: '£' };

export async function getStaticProps() {
  const file = path.join(process.cwd(), 'lib', 'viewings.json');
  const raw = JSON.parse(fs.readFileSync(file, 'utf-8'));

  // Always resolve the hero image and price from the live property record,
  // so if you update a property's main photo or share price in admin, the
  // /viewings/ page picks it up on next revalidate without touching this JSON.
  const props = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'lib', 'properties.json'), 'utf-8')
  );
  const bySlug = Object.fromEntries(props.map(p => [p.slug, p]));

  const today = new Date().toISOString().slice(0, 10);
  const viewings = raw
    .filter(v => !v.date || v.date >= today)
    .map(v => {
      const p = bySlug[v.propertySlug];
      return {
        ...v,
        // Prefer live property hero; fall back to whatever's in viewings.json
        img: (p && p.img) || v.img,
      };
    });

  return { props: { viewings }, revalidate: 3600 };
}

function formatPrice(price, currency) {
  if (!price) return '';
  const sym = SYM[currency] || '€';
  return `${sym}${price.toLocaleString('en-GB')}`;
}

function buildJsonLd(viewings) {
  const base = 'https://co-ownership-property.com';
  const events = viewings
    .filter(v => v.date) // only dated viewings make sense as Events
    .map(v => ({
      '@type': 'Event',
      '@id': `${base}/viewings/#${v.id}`,
      'name': `Private viewing — ${v.displayName}, ${v.city}`,
      'startDate': v.date,
      'eventAttendanceMode': 'https://schema.org/MixedEventAttendanceMode',
      'eventStatus': 'https://schema.org/EventScheduled',
      'location': [
        {
          '@type': 'Place',
          'name': v.displayName,
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': v.city,
            'addressRegion': v.region,
            'addressCountry': v.country,
          },
        },
        {
          '@type': 'VirtualLocation',
          'url': `${base}/viewings/#viewing-request-form`,
        },
      ],
      'organizer': { '@id': `${base}/#organization` },
      'offers': {
        '@type': 'Offer',
        'url': `${base}/property/${v.propertySlug}/`,
        'price': v.price,
        'priceCurrency': v.currency,
        'availability': 'https://schema.org/InStock',
        'description': `${v.share} share`,
      },
      'description': v.blurb,
    }));

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${base}/viewings/#webpage`,
        'url': `${base}/viewings/`,
        'name': 'Private Viewings | Co-Ownership Property',
        'description': 'Upcoming private viewings of co-ownership homes in France — on-site or live via video. Choose a date, request a slot, our team confirms within hours.',
        'inLanguage': 'en',
        'isPartOf': { '@id': `${base}/#website` },
        'about': events.map(e => ({ '@id': e['@id'] })),
      },
      {
        '@type': 'BreadcrumbList',
        '@id': `${base}/viewings/#breadcrumb`,
        'itemListElement': [
          { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${base}/` },
          { '@type': 'ListItem', 'position': 2, 'name': 'Private Viewings', 'item': `${base}/viewings/` },
        ],
      },
      ...events,
    ],
  };
}

export default function ViewingsPage({ viewings }) {
  const jsonLd = buildJsonLd(viewings);

  return (
    <>
      <Head>
        <title>Private Viewings — France | Co-Ownership Property</title>
        <meta
          name="description"
          content="Upcoming private viewings of co-ownership homes in France — Côte d'Azur and the French Alps. Choose on-site or live video, request a slot, we confirm within hours."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://co-ownership-property.com/viewings/" />
        <meta property="og:title" content="Private Viewings — France | Co-Ownership Property" />
        <meta property="og:description" content="On-site or live video viewings of co-ownership homes across France." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://co-ownership-property.com/viewings/" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <Header />

      {/* HERO */}
      <section className="page-hero">
        <p className="page-hero-eyebrow">Private Viewings</p>
        <h1>
          Step inside <em>before you decide</em>
        </h1>
        <p className="page-hero-sub">
          Upcoming viewings of co-ownership homes in France — Côte d&apos;Azur and the French Alps.
          Choose on-site or live via video. We confirm within a few hours.
        </p>
      </section>

      {/* VIEWINGS GRID */}
      <section className="viewings-grid-sec">
        <div className="viewings-grid-inner">
          <p className="eyebrow" style={{ textAlign: 'center' }}>Upcoming Dates</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', marginBottom: '2.2rem' }}>
            Six homes, one weekend in France
          </h2>

          <div className="viewings-grid">
            {viewings.map(v => (
              <article key={v.id} className="viewing-card">
                <a href={`/property/${v.propertySlug}/`} className="viewing-card-photo" style={{ backgroundImage: `url('${v.img}')` }}>
                  <span className="viewing-date-pill">{v.dateLabel}</span>
                </a>
                <div className="viewing-card-body">
                  <p className="viewing-card-location">{v.city} · {v.region} · {v.country}</p>
                  <h3 className="viewing-card-title">{v.displayName}</h3>
                  <p className="viewing-card-blurb">{v.blurb}</p>
                  <div className="viewing-card-meta">
                    <span className="viewing-card-price">{formatPrice(v.price, v.currency)}</span>
                    <span className="viewing-card-share">per {v.share} share</span>
                  </div>
                  <div className="viewing-card-ctas">
                    <a href={`/property/${v.propertySlug}/`} className="viewing-card-btn ghost">
                      Property details →
                    </a>
                    <a href={`?v=${encodeURIComponent(v.id)}#viewing-request-form`} className="viewing-card-btn primary" data-viewing-id={v.id}>
                      Request viewing
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — 3 simple steps */}
      <section className="viewings-how-sec">
        <div className="viewings-how-inner">
          <p className="eyebrow" style={{ textAlign: 'center' }}>How It Works</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.6rem,3vw,2.2rem)', marginBottom: '2rem' }}>
            From request to viewing in three steps
          </h2>
          <div className="viewings-how-grid">
            <div className="viewings-how-card">
              <div className="viewings-how-num">01</div>
              <h3>Pick a date</h3>
              <p>Choose the viewing that works for you and tell us whether you&apos;d prefer to be there in person or join a live video tour with the local team.</p>
            </div>
            <div className="viewings-how-card">
              <div className="viewings-how-num">02</div>
              <h3>We confirm</h3>
              <p>Your specialist gets back to you within a few hours with timings, the meet-up point or video link, and a short pre-viewing brief on the property.</p>
            </div>
            <div className="viewings-how-card">
              <div className="viewings-how-num">03</div>
              <h3>Step inside</h3>
              <p>You see the home, ask any questions, and meet the operator who runs it. No pressure to decide on the day — we&apos;re happy to follow up later.</p>
            </div>
          </div>
        </div>
      </section>

      {/* REQUEST FORM */}
      <ViewingRequestForm viewings={viewings} />

      {/* CLOSING NOTE */}
      <section className="viewings-close-sec">
        <div className="viewings-close-inner">
          <p>
            Looking for somewhere else in Europe? Browse our full collection of co-ownership properties — over 350 homes across France, Spain, Italy, Portugal, Austria, and the United Kingdom.
          </p>
          <a href="/our-homes/" className="viewings-close-btn">Browse all properties →</a>
        </div>
      </section>

      <Newsletter />
      <Footer />

      {/* Tiny inline script: when a card's "Request" CTA is clicked, dispatch
          an event the form component listens for so the right viewing is preselected. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('click', function(e) {
              var t = e.target.closest('a.viewing-card-btn.primary');
              if (!t) return;
              var id = t.getAttribute('data-viewing-id');
              if (!id) return;
              e.preventDefault();
              window.dispatchEvent(new CustomEvent('cop:request-viewing', { detail: { viewingId: id } }));
            });
          `,
        }}
      />
    </>
  );
}
