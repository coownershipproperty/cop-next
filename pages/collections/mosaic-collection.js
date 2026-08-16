import Head from 'next/head';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { track } from '@vercel/analytics';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CollectionAccessModal from '@/components/CollectionAccessModal';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';
import { trackConversion } from '@/lib/gtag';
import { getSavedUser, saveUser } from '@/lib/savedUser';
import styles from '@/styles/MosaicCollection.module.css';

const CANONICAL = 'https://co-ownership-property.com/collections/mosaic-collection/';
const COLLECTION_NAME = 'Mosaic Collection 14';
const META_TITLE = 'Mosaic Collection 14: Five Luxury Holiday Homes Across Europe | COP';
const META_DESCRIPTION = 'Co-own five luxury holiday homes across Europe for €325,000, with 12.4 weeks (86.8 days or 2.85 months) of use on average each year and up to 20 weeks.';

const HOMES = [
  {
    id: 'mallorca',
    region: 'Mallorca',
    name: 'Port d’Andratx',
    city: 'Palma de Mallorca',
    airport: 'Palma de Mallorca Airport (PMI)',
    image: '/images/collections/mosaic/mallorca-port-d-andratx.jpg',
    imagePosition: 'center',
    locationImage: '/images/collections/mosaic/location-mallorca-port-d-andratx.webp',
    locationImagePosition: 'center',
    description: 'A light-filled duplex with exceptional sea views, two terraces and access to a shared pool, moments from Cala Fonoll beach and the harbour promenade.',
    facts: ['Approx. 104 m²', '2 bedrooms', '2 bathrooms', 'Shared pool', 'Two terraces', 'Parking'],
    point: [408.4, 505.5],
    labelDx: 23,
    labelAnchor: 'start',
  },
  {
    id: 'tuscany',
    region: 'Tuscany',
    name: 'Chianni',
    city: 'Pisa',
    airport: 'Pisa International Airport (PSA)',
    image: '/images/collections/mosaic/tuscany-chianni.jpg',
    imagePosition: 'center',
    locationImage: '/images/collections/mosaic/location-tuscany-chianni.webp',
    locationImagePosition: 'center',
    description: 'An authentic Tuscan villa with a private pool, pergola and far-reaching countryside views, combining traditional materials with modern comfort.',
    facts: ['Approx. 100 m²', '3 bedrooms', '2 bathrooms', 'Private pool', 'Terrace and garden', 'Parking'],
    point: [572.8, 424.1],
    labelDx: 23,
    labelAnchor: 'start',
  },
  {
    id: 'chamonix',
    region: 'Chamonix',
    name: 'Les Rosières',
    city: 'Geneva',
    airport: 'Geneva Airport (GVA)',
    image: '/images/collections/mosaic/chamonix-les-rosieres-home.webp',
    imagePosition: 'center',
    locationImage: '/images/collections/mosaic/location-chamonix-les-rosieres.webp',
    locationImagePosition: 'center',
    description: 'A contemporary Alpine apartment in Les Praz with Mont Blanc views, a private terrace and access to a shared pool, sauna and fitness room.',
    facts: ['Approx. 70 m²', '2 bedrooms', '2 bathrooms', 'Shared pool and sauna', 'Private balcony', 'Basement parking'],
    point: [497.4, 373.2],
    labelDx: 23,
    labelAnchor: 'start',
  },
  {
    id: 'barcelona',
    region: 'Barcelona',
    name: 'Barri Gòtic',
    city: 'Barcelona',
    airport: 'Barcelona–El Prat Airport (BCN)',
    image: '/images/collections/mosaic/barcelona-barri-gotic-home.webp',
    imagePosition: 'center',
    locationImage: '/images/collections/mosaic/location-barcelona-barri-gotic.webp',
    locationImagePosition: 'center',
    description: 'An atmospheric apartment in the Gothic Quarter with a private courtyard—a rare quiet retreat close to La Rambla, tapas bars, culture and the beach.',
    facts: ['Approx. 103 m²', '2 bedrooms', '1 bathroom and guest WC', 'Private courtyard', 'First floor', 'Beach nearby'],
    point: [403.6, 467.5],
    labelDx: -23,
    labelAnchor: 'end',
  },
  {
    id: 'callian',
    region: 'South of France',
    name: 'Callian',
    city: 'Nice',
    airport: 'Nice Côte d’Azur Airport (NCE)',
    image: '/images/collections/mosaic/south-france-callian-home.webp',
    imagePosition: 'center',
    locationImage: '/images/collections/mosaic/location-south-france-callian.webp',
    locationImagePosition: 'center',
    description: 'A four-bedroom village townhouse with a rooftop terrace, surrounded by cobbled streets, local artisans and the easy rhythm of Provençal life.',
    facts: ['Approx. 160 m²', '4 bedrooms', '3 bathrooms', 'Rooftop terrace', 'Village views', 'Parking nearby'],
    point: [495, 421.2],
    labelDx: -23,
    labelAnchor: 'end',
  },
];

const FEATURES = [
  ['extraBeds', 'Extra beds at every home'],
  ['pool', 'Pools at three homes'],
  ['wellness', 'Wellness and fitness facilities'],
  ['terrace', 'Terraces, balcony and private courtyard'],
  ['view', 'Sea, mountain and countryside views'],
  ['wifi', 'Wi-Fi throughout'],
  ['parking', 'Parking at four homes'],
  ['dining', 'Restaurants and experiences nearby'],
  ['bedrooms', 'Two to four bedrooms per home'],
  ['airport', 'International airports within easy reach'],
];

const FAQS = [
  ['What is the Mosaic Collection?', 'Mosaic Collection 14 is one ownership opportunity connecting five holiday homes in Mallorca, Tuscany, Chamonix, Barcelona and the South of France.'],
  ['How much time can owners use the homes?', 'Owners have 12.4 weeks of use on average each year—86.8 days, or approximately 2.85 months. By combining standard and low-season stays, use can extend to as much as 20 weeks across the collection.'],
  ['How much does the Mosaic Collection cost?', 'The price is €325,000.'],
  ['Which destinations are included?', 'Port d’Andratx in Mallorca, Chianni in Tuscany, Les Rosières in Chamonix, Barri Gòtic in Barcelona and Callian in the South of France.'],
];

function HomeIcon({ active = false }) {
  return (
    <span className={`${styles.mapHomeIcon}${active ? ` ${styles.mapHomeIconActive}` : ''}`} aria-hidden="true">
      <svg viewBox="0 0 24 24"><path d="M3 11.2 12 4l9 7.2v8.3a.5.5 0 0 1-.5.5h-5.3v-5.7H8.8V20H3.5a.5.5 0 0 1-.5-.5z" /></svg>
    </span>
  );
}

function LocationPinIcon() {
  return (
    <span className={styles.destinationPin} aria-hidden="true">
      <svg viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="20.5" />
        <path d="M22 30s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z" />
        <circle cx="22" cy="18" r="2.1" />
      </svg>
    </span>
  );
}

function FeatureIcon({ type }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    extraBeds: <><path d="M4 8h7a3 3 0 0 1 3 3v6H4z"/><path d="M14 11h3a3 3 0 0 1 3 3v3h-6M4 17v3M20 17v3"/><path d="M6 10h4v4H6z"/></>,
    pool: <><path d="M7 3v7M11 3v7M7 6h4M4 13c2 2 4 2 6 0 2 2 4 2 6 0 2 2 4 2 6 0M4 18c2 2 4 2 6 0 2 2 4 2 6 0 2 2 4 2 6 0"/></>,
    wellness: <><path d="M3 12h18M6 8v8M18 8v8M8 7v10M16 7v10"/></>,
    terrace: <><path d="M4 10h16M6 10l6-6 6 6M7 20v-7M17 20v-7M9 16h6M12 16v4"/></>,
    view: <><path d="m3 17 5-6 4 4 3-3 6 7H3z"/><path d="M17 6a3 3 0 1 0-6 0"/></>,
    wifi: <><path d="M4 9a12 12 0 0 1 16 0M7 13a8 8 0 0 1 10 0M10 17a3 3 0 0 1 4 0"/><circle cx="12" cy="20" r=".8" fill="currentColor" stroke="none"/></>,
    parking: <><path d="M5 18v2M19 18v2M4 11l2-5h12l2 5M3 12h18v6H3z"/><circle cx="7" cy="15" r="1"/><circle cx="17" cy="15" r="1"/></>,
    dining: <><path d="M5 4v7M8 4v7M5 8h3M6.5 11v9M15 4v16M15 4c4 2 4 7 0 9"/></>,
    bedrooms: <><path d="M3 11h18v8H3zM3 8v11M21 8v11"/><path d="M5 8h6a3 3 0 0 1 3 3H5z"/></>,
    airport: <><path d="m21 16-8-4.5V5a1 1 0 0 0-2 0v6.5L3 16v2l8-2v4l-2 1v1l3-1 3 1v-1l-2-1v-4l8 2z"/></>,
  };
  return <svg viewBox="0 0 24 24" {...common}>{paths[type]}</svg>;
}

function PlaneIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5z" /></svg>;
}

function CollectionEnquiryForm() {
  const [form, setForm] = useState({ firstName: '', surname: '', email: '', phone: '', message: `I’d like to enquire about ${COLLECTION_NAME}.` });
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    const saved = getSavedUser();
    const nameParts = (saved.name || '').trim().split(/\s+/).filter(Boolean);
    setForm((current) => ({
      ...current,
      firstName: nameParts[0] || '',
      surname: nameParts.slice(1).join(' '),
      email: saved.email || '',
      phone: saved.phone || '',
    }));
  }, []);

  function update(field) {
    return (event) => setForm((current) => ({ ...current, [field]: event.target.value }));
  }

  async function submit(event) {
    event.preventDefault();
    setStatus('sending');
    const honeypot = event.currentTarget.elements[HONEYPOT_FIELD]?.value || '';
    const fullName = `${form.firstName.trim()} ${form.surname.trim()}`.trim();

    try {
      const response = await fetch('/api/enquiry/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
          property: COLLECTION_NAME,
          destination: 'Mallorca; Tuscany; Chamonix; Barcelona; South of France',
          url: CANONICAL,
          enquiryType: 'collection',
          locale: 'en',
          [HONEYPOT_FIELD]: honeypot,
        }),
      });

      if (!response.ok) throw new Error('Unable to send enquiry');

      saveUser({
        name: fullName,
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      trackConversion('generate_lead', 'Lead', {
        event_category: 'collection_enquiry',
        collection_title: COLLECTION_NAME,
        locale: 'en',
      });
      track('enquiry_submitted', {
        source: 'collection_page',
        collection: COLLECTION_NAME,
        url: CANONICAL,
        locale: 'en',
      });
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'done') {
    const firstName = form.firstName.trim();
    return (
      <div className={styles.enquirySuccess} role="status">
        <span aria-hidden="true">✓</span>
        <h3>Thank you{firstName ? `, ${firstName}` : ''}.</h3>
        <p>Your enquiry about {COLLECTION_NAME} has been received. Our team will be in touch shortly.</p>
      </div>
    );
  }

  return (
    <form className={styles.enquiryForm} onSubmit={submit}>
      <HoneypotField />
      <div className={styles.nameFields}>
        <label>
          First name <span>*</span>
          <input type="text" value={form.firstName} onChange={update('firstName')} placeholder="First name" autoComplete="given-name" required />
        </label>
        <label>
          Surname <span>*</span>
          <input type="text" value={form.surname} onChange={update('surname')} placeholder="Surname" autoComplete="family-name" required />
        </label>
      </div>
      <label>
        Email <span>*</span>
        <input type="email" value={form.email} onChange={update('email')} placeholder="your@email.com" autoComplete="email" required />
      </label>
      <label>
        Phone <span>*</span>
        <input type="tel" value={form.phone} onChange={update('phone')} placeholder="+1 or +44…" autoComplete="tel" required />
      </label>
      <label>
        Message
        <textarea value={form.message} onChange={update('message')} placeholder="Any questions about this collection…" rows={4} />
      </label>
      <button type="submit" disabled={status === 'sending'}>
        {status === 'sending' ? 'Sending…' : 'Send enquiry →'}
      </button>
      {status === 'error' && <p className={styles.enquiryError} role="alert">Something went wrong. Please try again.</p>}
    </form>
  );
}

export default function MosaicCollectionPage() {
  const router = useRouter();
  const [selectedHome, setSelectedHome] = useState(0);
  const [showAccess, setShowAccess] = useState(false);
  const unlocked = Boolean(router.query.access);
  const active = HOMES[selectedHome];

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${CANONICAL}#collection`,
        name: COLLECTION_NAME,
        description: META_DESCRIPTION,
        image: HOMES.map((home) => `https://co-ownership-property.com${home.image}`),
        brand: { '@type': 'Brand', name: 'Co-Ownership Property' },
        offers: { '@type': 'Offer', priceCurrency: 'EUR', price: '325000', url: CANONICAL, availability: 'https://schema.org/InStock' },
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'Homes', value: '5' },
          { '@type': 'PropertyValue', name: 'Average annual use', value: '12.4 weeks (86.8 days or 2.85 months)' },
          { '@type': 'PropertyValue', name: 'Potential annual use', value: 'Up to 20 weeks including low-season stays' },
        ],
      },
      {
        '@type': 'ItemList',
        name: `Homes in ${COLLECTION_NAME}`,
        itemListElement: HOMES.map((home, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: { '@type': 'Accommodation', name: home.name, description: home.description, address: { '@type': 'PostalAddress', addressRegion: home.region } },
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://co-ownership-property.com/' },
          { '@type': 'ListItem', position: 2, name: 'Collections', item: 'https://co-ownership-property.com/collections/' },
          { '@type': 'ListItem', position: 3, name: COLLECTION_NAME, item: CANONICAL },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQS.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })),
      },
    ],
  };

  return (
    <>
      <Head>
        <title>{META_TITLE}</title>
        <meta name="description" content={META_DESCRIPTION} />
        <link rel="canonical" href={CANONICAL} />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={META_TITLE} />
        <meta property="og:description" content={META_DESCRIPTION} />
        <meta property="og:url" content={CANONICAL} />
        <meta property="og:image" content="https://co-ownership-property.com/images/collections/mosaic/mallorca-port-d-andratx.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      </Head>

      <Header />
      <main className={styles.page}>
        <section className={styles.hero} id="overview">
          <div className={styles.heroGrid}>
            {HOMES.map((home, index) => (
              <div key={home.id} className={`${styles.heroImage} ${styles[`heroImage${index + 1}`]}`}>
                <Image src={home.image} alt={`${home.name}, ${home.region}`} fill priority={index < 2} loading={index < 2 ? 'eager' : 'lazy'} sizes="(max-width: 620px) 50vw, 33vw" style={{ objectFit: 'cover', objectPosition: home.imagePosition }} />
                <span>{home.region}</span>
              </div>
            ))}
            <div className={styles.galleryAccess}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="10" width="14" height="11" rx="1" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
              <p>Private collection access</p>
              <h2>{unlocked ? 'Collection details unlocked' : 'More photos from every home'}</h2>
              <span>{unlocked ? 'Explore the complete home details, features and fixtures below.' : 'Receive more photos for each home, plus its features, fixtures and home details.'}</span>
              {unlocked ? (
                <a href="#homes">View the homes →</a>
              ) : (
                <button type="button" onClick={() => setShowAccess(true)}>Send it to me →</button>
              )}
            </div>
          </div>

          <div className={styles.overviewWrap}>
            <div className={styles.overviewCopy}>
              <p className={styles.price}>€325,000</p>
              <p className={styles.destinations}>
                <LocationPinIcon />
                <span>Mallorca · Tuscany · Chamonix · Barcelona · South of France</span>
              </p>
              <p className={styles.eyebrow}>{COLLECTION_NAME}</p>
              <h1>Five Luxury Holiday Homes Across Europe</h1>
              <div className={styles.stats}>
                <div><strong>5</strong><span>Homes</span></div>
                <div><strong>5</strong><span>Destinations</span></div>
                <div><strong>12.4 weeks</strong><span>On average each year</span></div>
                <div><strong>Available now</strong><span>Ready to enjoy</span></div>
              </div>
              <div className={styles.usageHighlight}>
                <p><strong>12.4 weeks</strong><span>86.8 days or 2.85 months of use on average each year.</span></p>
                <p>By combining standard and low-season stays, your use can extend to <strong>as much as 20 weeks</strong> across the collection.</p>
              </div>
              <div className={styles.about}>
                <h2>One collection. Five distinct rhythms.</h2>
                <p>{COLLECTION_NAME} brings together five homes shaped by atmosphere and a strong sense of place: Mediterranean coast, Tuscan countryside, the French Alps, Barcelona’s historic centre and a Provençal hill village.</p>
                <p>From sea-view mornings in Port d’Andratx to evenings on a Callian rooftop, every stay offers a different way to slow down, reconnect and experience Europe throughout the year.</p>
                <div className={styles.homeRhythms}>
                  {HOMES.map((home) => (
                    <article key={home.id}>
                      <p>Home in {home.region}</p>
                      <h3>{home.name}</h3>
                      <span>{home.description}</span>
                    </article>
                  ))}
                </div>
              </div>
            </div>
            <aside id="collection-enquiry" className={styles.overviewEnquiry} aria-label={`Enquire about ${COLLECTION_NAME}`}>
              <div className={styles.enquiryCard}>
                <p className={styles.eyebrow}>Get in touch</p>
                <h2>Enquire About This Collection</h2>
                <p>Our team typically responds within a few hours.</p>
                <CollectionEnquiryForm />
              </div>
            </aside>
          </div>
        </section>

        <section className={styles.homesSection} id="the-homes">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>The destinations</p>
            <h2>Five destinations. Five distinct rhythms.</h2>
            <p>Each destination has its own character, setting and pace. These photographs show the locations—not the individual properties—and introduce the five distinct environments that shape the collection.</p>
          </div>
          <div className={styles.homeGrid}>
            {HOMES.map((home, index) => (
              <article key={home.id} className={styles.homeCard}>
                <div className={styles.homeCardImage}>
                  <Image src={home.locationImage} alt={`${home.name}, ${home.region} destination`} fill sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 20vw" style={{ objectFit: 'cover', objectPosition: home.locationImagePosition }} />
                </div>
                <div className={styles.homeCardBody}>
                  <p>{home.name}</p>
                  <h3>{home.region}</h3>
                  {unlocked && <ul>{home.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.featuresSection} id="features">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>Across the collection</p>
            <h2>Features &amp; Amenities</h2>
          </div>
          <div className={styles.featuresGrid}>
            {FEATURES.map(([type, label]) => (
              <div key={type} className={styles.feature}>
                <FeatureIcon type={type} />
                <p>{label}</p>
              </div>
            ))}
          </div>
          <p className={styles.featuresContact}>For the complete list of features, fixtures and amenities, <a href="#collection-enquiry">see more details →</a></p>
        </section>

        <section className={styles.locationsSection} id="locations">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>The locations</p>
            <h2>Homes Across Europe</h2>
            <p>Select a home to see its nearest major city and international airport.</p>
          </div>

          <div className={styles.locationLayout}>
            <div className={styles.mapPanel}>
              <div className={styles.mapInset}>
                <svg viewBox="0 0 1000 620" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="mosaic-map-title mosaic-map-description">
                  <title id="mosaic-map-title">{`The five homes in ${COLLECTION_NAME}`}</title>
                  <desc id="mosaic-map-description">A complete map of Europe showing home icons at Port d’Andratx, Chianni, Les Rosières, Barri Gòtic and Callian.</desc>
                  <image href="/images/collections/mosaic/europe-map.svg" x="0" y="0" width="1000" height="620" />
                  {HOMES.map((home, index) => (
                    <g key={home.id} className={`${styles.svgHome}${selectedHome === index ? ` ${styles.svgHomeActive}` : ''}`} onClick={() => setSelectedHome(index)} role="button" tabIndex="0" aria-label={`Select ${home.name}`} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedHome(index); }}>
                      <circle cx={home.point[0]} cy={home.point[1]} r={selectedHome === index ? 18 : 15} />
                      <path transform={`translate(${home.point[0] - 8} ${home.point[1] - 8}) scale(.67)`} d="M3 11.2 12 4l9 7.2v8.3a.5.5 0 0 1-.5.5h-5.3v-5.7H8.8V20H3.5a.5.5 0 0 1-.5-.5z" />
                      <text x={home.point[0] + home.labelDx} y={home.point[1] + 5} textAnchor={home.labelAnchor}>{home.name}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            <div className={styles.locationList}>
              {HOMES.map((home, index) => (
                <button key={home.id} type="button" className={selectedHome === index ? styles.locationActive : ''} onClick={() => setSelectedHome(index)}>
                  <HomeIcon active={selectedHome === index} />
                  <span><strong>{home.name}</strong><small>{home.region}</small></span>
                  <b aria-hidden="true">›</b>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.locationDetails} aria-live="polite">
            <div>
              <span>Selected home</span>
              <strong><HomeIcon active /> {active.name}, {active.region}</strong>
            </div>
            <div>
              <span>Nearest major city</span>
              <strong>{active.city}</strong>
            </div>
            <div>
              <span><PlaneIcon /> Nearest international airport</span>
              <strong>{active.airport}</strong>
            </div>
          </div>
        </section>

        <section className={styles.faqSection}>
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>Collection essentials</p>
            <h2>Mosaic Collection at a glance</h2>
          </div>
          <div className={styles.faqGrid}>
            {FAQS.map(([question, answer]) => <article key={question}><h3>{question}</h3><p>{answer}</p></article>)}
          </div>
        </section>

      </main>
      <Footer />
      {showAccess && <CollectionAccessModal onClose={() => setShowAccess(false)} collectionTitle={COLLECTION_NAME} />}
    </>
  );
}
