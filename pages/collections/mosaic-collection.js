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
    point: [354, 426],
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
    point: [696.62, 218.89],
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
    point: [525.62, 62.19],
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
    point: [311.79, 348.15],
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
    point: [519.85, 210.05],
  },
];

const MAP_PATHS = [
  'M496.071,0L487.388,9.773L486.57,39.708L508.339,29.414L523.889,58.165L522.088,76.64L535.51,100.98L519.633,120.693L531.418,170.072L556.134,178.11L550.896,205.508L509.649,240.939L419.952,224.026L353.825,244.183L348.587,281.506L295.882,289.526L244.65,261.545L228.118,274.971L144.477,246.776L126.308,222.504L149.878,184.814L158.553,56.687L120.207,0L496.071,0ZM610.476,271.968L639.775,248.288L647.468,301.258L632.409,348.362L611.786,335.927L601.31,294.863Z',
  'M949.934,0L949.459,1.355L940.784,12.536L901.009,14.262L878.094,29.185L840.611,24.141L775.466,7.008L772.391,0L949.934,0ZM718.581,0L715.232,8.045L691.421,0L718.581,0Z',
  'M1003.938,52.091L980.395,32.62L965.991,24.485L957.152,2.163L949.459,1.355L949.934,0L1003.938,0Z',
  'M1003.938,112.36L985.796,107.376L964.518,108.833L954.697,122.257L938.492,107.376L928.835,134.074L951.096,164.005L961.08,183.606L981.868,207.146L999.218,221.091L1003.938,228.233L1003.938,254.019L982.522,235.851L940.948,217.283L902.81,170.844L911.976,166.102L891.189,139.301L890.37,117.564L861.071,107.376L847.158,135.187L833.737,113.649L834.719,91.196L836.356,90.182L868.11,92.434L876.457,81.386L891.843,91.984L909.685,93.335L909.521,75.17L925.398,68.491L929.817,41.992L965.991,24.485L980.395,32.62L1003.938,52.091L1003.938,112.36Z',
  'M687.397,0L683.969,25.861L664,36.966L630.281,28.727L620.461,55.209L598.855,57.255L590.998,46.897L565.464,69.057L543.531,72.228L523.889,58.165L508.339,29.414L486.57,39.708L487.388,9.773L496.071,0L687.397,0Z',
  'M0,220.361L15.169,223.7L52.816,220.438L126.308,222.504L144.477,246.776L228.118,274.971L244.65,261.545L295.882,289.526L348.587,281.506L351.042,317.199L307.994,357.611L249.724,370.397L245.632,390.644L217.642,423.717L200.128,471.855L215.009,500L0,500Z',
  'M691.421,0L715.232,8.045L718.581,0L772.391,0L775.466,7.008L840.611,24.141L835.537,56.46L846.504,84.32L810.33,74.831L773.338,97.834L775.794,129.842L770.229,148.072L785.123,180.419L827.844,212.163L850.759,263.697L901.337,313.273L936.856,312.955L947.986,326.415L935.219,338.565L975.975,360.444L1003.938,375.694L1003.938,410.79L979.74,404.777L960.753,443.184L993.489,465.115L988.088,495.664L969.101,499.112L968.668,500L938.991,500L945.203,492.111L927.526,458.057L913.613,428.257L894.79,420.825L881.368,395.014L852.069,384.185L832.427,359.919L798.709,356.036L763.19,328.637L721.615,288.778L690.68,253.144L676.603,191.286L654.015,183.935L617.023,163.011L596.072,171.615L569.72,200.919L550.896,205.508L556.134,178.11L531.418,170.072L519.633,120.693L535.51,100.98L522.088,76.64L523.889,58.165L543.531,72.228L565.464,69.057L590.998,46.897L598.855,57.255L620.461,55.209L630.281,28.727L664,36.966L683.969,25.861L687.397,0L691.421,0ZM608.839,377.297L631.591,358.66L658.762,401.249L652.378,479.603L631.755,475.935L613.259,495.461L596.072,479.909L594.272,408.614L583.796,374.266Z',
  'M840.611,24.141L878.094,29.185L901.009,14.262L940.784,12.536L949.459,1.355L957.152,2.163L965.991,24.485L929.817,41.992L925.398,68.491L909.521,75.17L909.685,93.335L891.843,91.984L876.457,81.386L868.11,92.434L836.356,90.182L846.504,84.32L835.537,56.46Z',
  'M1003.938,228.233L999.218,221.091L981.868,207.146L961.08,183.606L951.096,164.005L928.835,134.074L938.492,107.376L954.697,122.257L964.518,108.833L985.796,107.376L1003.938,112.36L1003.938,228.233Z',
];

const BALEARIC_ISLANDS = [
  { cx: 368, cy: 422, rx: 24, ry: 9, rotate: -18 },
  { cx: 397, cy: 404, rx: 10, ry: 4, rotate: -12 },
  { cx: 340, cy: 442, rx: 7, ry: 3, rotate: -24 },
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
  ['How much time can owners use the homes?', 'The minimum annual use is 12.38 weeks—86.7 days or approximately 2.85 months. Average annual use is 12.4 weeks—86.8 days or approximately 2.85 months. By combining standard and low-season stays, use can extend to as much as 20 weeks across the collection.'],
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
          { '@type': 'PropertyValue', name: 'Minimum annual use', value: '12.38 weeks (86.7 days or 2.85 months)' },
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
              <p className={styles.destinations}>Mallorca · Tuscany · Chamonix · Barcelona · South of France</p>
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
            <aside className={styles.overviewEnquiry} aria-label={`Enquire about ${COLLECTION_NAME}`}>
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
            <p className={styles.eyebrow}>The homes</p>
            <h2>Five homes. Five ways to escape.</h2>
            <p>Each home has its own character, setting and pace. Together, they create a year-round collection across coast, countryside, mountains, city and village life.</p>
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
        </section>

        <section className={styles.locationsSection} id="locations">
          <div className={styles.sectionHead}>
            <p className={styles.eyebrow}>The locations</p>
            <h2>Homes Across Europe</h2>
            <p>Select a home to see its nearest major city and international airport.</p>
          </div>

          <div className={styles.locationLayout}>
            <div className={styles.mapPanel}>
              <svg viewBox="-28 -20 1060 540" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="mosaic-map-title mosaic-map-description">
                <title id="mosaic-map-title">{`The five homes in ${COLLECTION_NAME}`}</title>
                <desc id="mosaic-map-description">A map of Europe showing home icons at Port d’Andratx, Chianni, Les Rosières, Barri Gòtic and Callian.</desc>
                <rect x="-28" y="-20" width="1060" height="540" className={styles.mapSea} />
                <g className={styles.mapLand}>{MAP_PATHS.map((path, index) => <path d={path} key={index} />)}</g>
                <g className={styles.mapIslands} aria-hidden="true">
                  {BALEARIC_ISLANDS.map((island) => <ellipse key={`${island.cx}-${island.cy}`} cx={island.cx} cy={island.cy} rx={island.rx} ry={island.ry} transform={`rotate(${island.rotate} ${island.cx} ${island.cy})`} />)}
                </g>
                {HOMES.map((home, index) => (
                  <g key={home.id} className={`${styles.svgHome}${selectedHome === index ? ` ${styles.svgHomeActive}` : ''}`} onClick={() => setSelectedHome(index)} role="button" tabIndex="0" aria-label={`Select ${home.name}`} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedHome(index); }}>
                    <circle cx={home.point[0]} cy={home.point[1]} r={selectedHome === index ? 18 : 15} />
                    <path transform={`translate(${home.point[0] - 8} ${home.point[1] - 8}) scale(.67)`} d="M3 11.2 12 4l9 7.2v8.3a.5.5 0 0 1-.5.5h-5.3v-5.7H8.8V20H3.5a.5.5 0 0 1-.5-.5z" />
                    <text x={home.point[0] + 23} y={home.point[1] + 5}>{home.name}</text>
                  </g>
                ))}
              </svg>
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
