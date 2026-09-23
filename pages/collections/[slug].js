// /collections/[slug]/ — one multi-home collection.
//
// The first screen deliberately matches a property page (same pp-* gallery,
// price row and stats) because that first view is what converts. What is
// different: one price covers every home, and the page is led by whichever
// home brought the visitor here (?home=<key> from a search card), with the
// other homes following. Full photo sets and floor plans sit behind the
// unlock (name, email, phone), like a single home's gallery.
//
// Copy rules (lib/collections.js): never state how many owners share the
// collection and never name the operator.
import Head from 'next/head';
import Link from 'next/link';
import NextImage from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Nav from '@/components/rd/Nav';
import Footer from '@/components/Footer';
import HoneypotField from '@/components/HoneypotField';
import { HONEYPOT_FIELD } from '@/lib/honeypot';
import { getSavedUser, saveUser } from '@/lib/savedUser';
import { loadCollections, loadCollection, formatMoney, placeLabel, COLLECTIONS_PREVIEW } from '@/lib/collections';
import ps from '@/styles/property-redesign.module.css';
import c from '@/styles/collections.module.css';

const SITE = 'https://co-ownership-property.com';
const PREVIEW_PHOTOS = 5; // photos per home shown before the unlock

export async function getStaticPaths() {
  const all = await loadCollections({ withHomes: false });
  return { paths: all.map(x => ({ params: { slug: x.slug } })), fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const collection = await loadCollection(params.slug);
  if (!collection) return { notFound: true, revalidate: 3600 };
  return { props: { collection }, revalidate: 3600 };
}

const READINESS = {
  ready: 'Ready now',
  soon: 'Ready soon',
  in_preparation: 'Being prepared',
};

function Img({ src, alt, priority = false, sizes = '100vw' }) {
  return <NextImage src={src} alt={alt} fill sizes={sizes} priority={priority} quality={85} style={{ objectFit: 'cover' }} />;
}

function useAccess(slug) {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    const key = `cop_collection_access_${slug}`;
    try { if (localStorage.getItem(key) === '1') setUnlocked(true); } catch {}
    const token = router.query.access;
    if (typeof token === 'string') {
      try {
        const data = JSON.parse(atob(token.replace(/-/g, '+').replace(/_/g, '/')));
        if (data?.c === slug) { setUnlocked(true); try { localStorage.setItem(key, '1'); } catch {} }
      } catch {}
    }
  }, [slug, router.query.access]);
  function grant() {
    setUnlocked(true);
    try { localStorage.setItem(`cop_collection_access_${slug}`, '1'); } catch {}
  }
  return [unlocked, grant];
}

function LeadForm({ collection, onDone, intro, submitLabel = 'Unlock the collection', compact = false }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  useEffect(() => {
    const saved = getSavedUser();
    if (saved?.name) setName(saved.name);
    if (saved?.email) setEmail(saved.email);
    if (saved?.phone) setPhone(saved.phone);
  }, []);
  const [message, setMessage] = useState('');
  const [state, setState] = useState('idle');
  const [error, setError] = useState('');
  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim()) { setError('Please add your name, email and phone number.'); return; }
    setState('sending'); setError('');
    const form = new FormData(e.currentTarget);
    try {
      const r = await fetch('/api/unlock-collection/', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, message: message || undefined, collectionSlug: collection.slug, [HONEYPOT_FIELD]: form.get(HONEYPOT_FIELD) || '' }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || 'Something went wrong. Please try again.');
      try { saveUser({ name, email, phone }); } catch {}
      setState('done'); onDone?.();
    } catch (err) { setState('idle'); setError(err.message); }
  }
  if (state === 'done') return <p className={c.formDone}>Thank you. The full collection is open, and we have emailed you a link back to it.</p>;
  return (
    <form className={c.form} onSubmit={submit} noValidate>
      {intro && <p className={c.formIntro}>{intro}</p>}
      <HoneypotField />
      <input className={c.input} placeholder="Full name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} />
      <input className={c.input} placeholder="Email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className={c.input} placeholder="Phone (with country code)" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} />
      {!compact && <textarea className={c.input} rows={3} placeholder="Anything you would like to know? (optional)" value={message} onChange={e => setMessage(e.target.value)} />}
      {error && <p className={c.formError}>{error}</p>}
      <button className={`rd-btn rd-btn-primary ${c.submit}`} disabled={state === 'sending'}>{state === 'sending' ? 'Sending…' : submitLabel}</button>
      <p className={c.formSmall}>We answer personally, usually within a day. No spam, ever.</p>
    </form>
  );
}

function UnlockDialog({ collection, onClose, onDone }) {
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const photos = collection.homes.reduce((n, h) => n + (h.photos?.length || 0), 0);
  const plans = collection.homes.reduce((n, h) => n + (h.floorplans?.length || 0), 0);
  return (
    <div className={c.dialogBack} onClick={onClose} role="dialog" aria-modal="true" aria-label="Unlock the full collection">
      <div className={c.dialog} onClick={e => e.stopPropagation()}>
        <button className={c.dialogClose} onClick={onClose} aria-label="Close">×</button>
        <p className={c.kicker}>{collection.name}</p>
        <h2 className={c.dialogTitle}>Unlock the full collection</h2>
        <p className={c.dialogSub}>All {photos} photos of the {collection.homes.length} homes{plans ? `, the floor plans` : ''} and the running costs in detail.</p>
        <LeadForm collection={collection} onDone={() => { onDone(); setTimeout(onClose, 1400); }} compact />
      </div>
    </div>
  );
}

function Lightbox({ photos, index, onClose, onIndex, title }) {
  useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % photos.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + photos.length) % photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, photos.length, onClose, onIndex]);
  return (
    <div className="pp-lb" onClick={onClose}>
      <button className="pp-lb-close" onClick={onClose} aria-label="Close">×</button>
      <button className="pp-lb-prev" onClick={e => { e.stopPropagation(); onIndex((index - 1 + photos.length) % photos.length); }} aria-label="Previous photo">‹</button>
      <div className={c.lbImg} onClick={e => e.stopPropagation()}>
        <img src={photos[index]} alt={`${title} ${index + 1}`} />
      </div>
      <button className="pp-lb-next" onClick={e => { e.stopPropagation(); onIndex((index + 1) % photos.length); }} aria-label="Next photo">›</button>
      <span className="pp-lb-count">{index + 1} / {photos.length}</span>
    </div>
  );
}

export default function CollectionPage({ collection }) {
  const router = useRouter();
  const [unlocked, grant] = useAccess(collection.slug);
  const [showUnlock, setShowUnlock] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { photos, index, title }
  const [mobileSlide, setMobileSlide] = useState(0);

  const homes = collection.homes || [];
  const leadKey = typeof router.query.home === 'string' ? router.query.home : null;
  const ordered = useMemo(() => {
    const lead = homes.find(h => h.key === leadKey);
    return lead ? [lead, ...homes.filter(h => h.key !== lead.key)] : homes;
  }, [homes, leadKey]);
  const lead = ordered[0];
  const n = collection.homes_count || homes.length;
  const readyNow = homes.filter(h => h.readiness === 'ready').length;
  const totalPhotos = homes.reduce((t, h) => t + (h.photos?.length || 0), 0);
  const heroPhotos = lead?.photos || [];
  const secondPhotos = [heroPhotos[1], ordered[1]?.photos?.[0]].filter(Boolean);
  const lockedCount = Math.max(0, totalPhotos - 3);
  const price = formatMoney(collection.price, collection.currency);
  const canonical = `${SITE}/collections/${collection.slug}/`;
  const places = ordered.map(h => h.city);
  const metaDesc = `${n} homes in ${places.slice(0, -1).join(', ')} and ${places.slice(-1)}, bought together for ${price}. Around ${Math.round(collection.weeks_per_year || 12)} weeks a year across the homes, fully managed.`;

  function openHome(h, i = 0) {
    const photos = unlocked ? h.photos : h.photos.slice(0, PREVIEW_PHOTOS);
    setLightbox({ photos, index: Math.min(i, photos.length - 1), title: h.name });
  }
  function openAll() {
    if (!unlocked) { setShowUnlock(true); return; }
    setLightbox({ photos: ordered.flatMap(h => h.photos || []), index: 0, title: collection.name });
  }
  function chooseLead(key) {
    router.replace({ pathname: router.pathname, query: { ...router.query, home: key } }, undefined, { shallow: true, scroll: false });
    setMobileSlide(0);
  }
  const mobileSlides = [...heroPhotos.slice(0, 3), ...ordered.slice(1).map(h => h.photos?.[0]).filter(Boolean)];

  return (
    <>
      <Head>
        <title>{`${collection.name}: ${n} homes, one purchase`}</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonical} />
        {(COLLECTIONS_PREVIEW || collection.status !== 'Live') && <meta name="robots" content="noindex,nofollow" />}
        <meta property="og:title" content={`${collection.name} | Co-Ownership Property`} />
        <meta property="og:description" content={metaDesc} />
        {collection.hero_image && <meta property="og:image" content={collection.hero_image} />}
      </Head>
      <div className={`rd ${ps.page} ${c.page}`}>
        <Nav propertyHero ctaHref="#collection-enquiry" />

        {/* ── Mobile: swipe through the lead home, then one photo of each other home ── */}
        <div className={c.mobGallery}>
          <div className={c.mobTrack} style={{ transform: `translateX(${-mobileSlide * 100}%)` }}>
            {mobileSlides.map((src, i) => (
              <div key={i} className={c.mobSlide} onClick={() => openHome(lead, i)}>
                <Img src={src} alt={`${collection.name} ${i + 1}`} priority={i === 0} />
              </div>
            ))}
            <div className={`${c.mobSlide} ${c.mobLock}`} onClick={openAll}>
              <span className={c.lockTitle}>{unlocked ? 'View every photo' : `${lockedCount} more photos`}</span>
              <span className={c.lockSub}>{unlocked ? `${totalPhotos} photos of ${n} homes` : 'and the floor plans'}</span>
              <span className={c.lockBtn}>{unlocked ? 'Open gallery' : 'Unlock the collection'}</span>
            </div>
          </div>
          {mobileSlide > 0 && <button className={`${c.mobArrow} ${c.mobPrev}`} onClick={() => setMobileSlide(s => s - 1)} aria-label="Previous photo">‹</button>}
          {mobileSlide < mobileSlides.length && <button className={`${c.mobArrow} ${c.mobNext}`} onClick={() => setMobileSlide(s => s + 1)} aria-label="Next photo">›</button>}
          <span className={c.galleryBadge}>Collection · {n} homes</span>
        </div>

        {/* ── Desktop: the property-page gallery, led by the chosen home ── */}
        <div className={`pp-gallery ${c.gallery}`}>
          <div className="pp-gallery-hero" onClick={() => openHome(lead, 0)}>
            {heroPhotos[0] && <Img src={heroPhotos[0]} alt={`${lead.name}, ${placeLabel(lead)}`} priority sizes="75vw" />}
            <span className={c.galleryBadge}>Collection · {n} homes</span>
            <span className={c.galleryCaption}>{placeLabel(lead)}</span>
          </div>
          <div className="pp-gallery-thumb" onClick={() => heroPhotos[1] ? openHome(lead, 1) : openHome(ordered[1], 0)}>
            {secondPhotos[0] && <Img src={secondPhotos[0]} alt={`${collection.name} 2`} sizes="25vw" />}
          </div>
          <div className="pp-gallery-thumb" onClick={() => openHome(ordered[1] || lead, 0)}>
            {secondPhotos[1] && <Img src={secondPhotos[1]} alt={`${collection.name} 3`} sizes="25vw" />}
            {ordered[1] && <span className={c.thumbCaption}>{placeLabel(ordered[1])}</span>}
          </div>
          <div className="pp-gallery-lock" onClick={openAll}>
            <div className="pp-lock-strip" aria-hidden="true">
              {ordered.slice(1, 5).map(h => <div key={h.key} className="pp-lock-strip-cell" style={{ backgroundImage: `url('${h.photos?.[0]}')` }} />)}
            </div>
            <span className="pp-lock-title">{unlocked ? 'View every photo' : `${lockedCount} more photos`}</span>
            <span className="pp-lock-sub">{unlocked ? `${totalPhotos} photos of ${n} homes` : `All ${n} homes and the floor plans`}</span>
            <span className="pp-lock-cta-btn">{unlocked ? 'Open gallery' : 'Unlock the collection'}</span>
          </div>
        </div>

        {/* ── Home switcher: the visitor can put any of the homes first ── */}
        <nav className={`${c.switcher} rd-container`} aria-label="Homes in this collection">
          {ordered.map((h, i) => (
            <button key={h.key} className={`${c.switchItem}${i === 0 ? ` ${c.switchActive}` : ''}`} onClick={() => chooseLead(h.key)} aria-current={i === 0 ? 'true' : undefined}>
              <span className={c.switchThumb}>{h.photos?.[0] && <Img src={h.photos[0]} alt="" sizes="96px" />}</span>
              <span className={c.switchText}><strong>{h.city}</strong><small>{h.home_type} · {h.bedrooms} bed</small></span>
            </button>
          ))}
        </nav>

        <div className="pp-content" id="overview">
          <div className="pp-left">
            <div className="pp-price-row">
              <span className="pp-price">{price}</span>
              <span className="pp-price-qualifier">for all {n} homes</span>
              <span className="pp-badge">Collection</span>
            </div>
            <nav className="pp-crumb"><Link className="pp-location-link" href="/collections/">Collections</Link><span className="pp-crumb-sep"> / </span><span>{collection.name}</span></nav>
            <h1 className="pp-title">{collection.name}</h1>
            {collection.tagline && <p className={c.tagline}>{collection.tagline}</p>}
            <div className={`pp-stats is-revealed ${c.stats}`}>
              <div className="pp-stat"><span className="pp-stat-val">{n}</span><span className="pp-stat-lbl">homes</span></div>
              <div className="pp-stat"><span className="pp-stat-val">~{Math.round(collection.weeks_per_year || 12)}</span><span className="pp-stat-lbl">weeks a year</span></div>
              {collection.monthly_cost > 0 && <div className="pp-stat"><span className="pp-stat-val">{formatMoney(collection.monthly_cost, collection.currency)}</span><span className="pp-stat-lbl">a month, all homes</span></div>}
              <div className="pp-stat"><span className="pp-stat-val">{readyNow}/{n}</span><span className="pp-stat-lbl">ready now</span></div>
            </div>
            {collection.price_note && <p className={c.note}>{collection.price_note}</p>}

            <div className="pp-desc">
              <h2 className="pp-heading">About the collection</h2>
              {String(collection.description || '').split('\n\n').map((para, i) => <p key={i} className={c.para}>{para}</p>)}
            </div>

            {collection.highlights?.length > 0 && (
              <ul className={c.highlights}>
                {collection.highlights.map(h => <li key={h}>{h}</li>)}
              </ul>
            )}

            <section id="homes" className={c.homes}>
              <h2 className="pp-heading">The {n} homes</h2>
              {collection.availability_note && <p className={c.note}>{collection.availability_note}</p>}
              {ordered.map((h, i) => {
                const shown = unlocked ? h.photos : h.photos.slice(0, PREVIEW_PHOTOS);
                const hidden = (h.photos?.length || 0) - shown.length;
                return (
                  <article key={h.key} className={c.home} id={`home-${h.key}`}>
                    <div className={c.homeHead}>
                      <span className={c.homeIndex}>0{i + 1}</span>
                      <div>
                        <p className={c.kicker}>{placeLabel(h)}{h.region ? ` · ${h.region}` : ''}</p>
                        <h3 className={c.homeTitle}>{h.name}</h3>
                      </div>
                      <span className={`${c.ready} ${c['ready_' + h.readiness] || ''}`}>{READINESS[h.readiness] || ''}</span>
                    </div>
                    <div className={c.homePhotos}>
                      {shown.slice(0, 5).map((src, j) => (
                        <button key={src} className={`${c.homePhoto}${j === 0 ? ` ${c.homePhotoMain}` : ''}`} onClick={() => openHome(h, j)} aria-label={`Open photo ${j + 1} of ${h.name}`}>
                          <Img src={src} alt={`${h.name} ${j + 1}`} sizes={j === 0 ? '(max-width: 960px) 100vw, 40vw' : '(max-width: 960px) 50vw, 20vw'} />
                        </button>
                      ))}
                      {shown.length < 5 && (
                        <div className={c.homeFiller}>
                          {h.floorplans?.length > 0
                            ? <button className={c.fillerBtn} onClick={() => unlocked ? window.open(h.floorplans[0], '_blank') : setShowUnlock(true)}><strong>Floor plan</strong><span>{unlocked ? 'Open ↗' : 'Unlock to view'}</span></button>
                            : <div className={c.fillerBtn}><strong>{READINESS[h.readiness]}</strong><span>More photos to follow</span></div>}
                        </div>
                      )}
                      {(hidden > 0 || shown.length > 5) && (
                        <button className={c.homeMore} onClick={() => unlocked ? openHome(h, 5) : setShowUnlock(true)}>
                          {unlocked ? `+${shown.length - 5} photos` : `+${hidden} photos · unlock`}
                        </button>
                      )}
                    </div>
                    {h.photos_note && <p className={c.photoNote}>{h.photos_note}</p>}
                    <div className={c.homeFacts}>
                      {h.size_m2 > 0 && <span><strong>{h.size_m2} m²</strong>{h.home_type?.toLowerCase()}</span>}
                      {h.bedrooms > 0 && <span><strong>{h.bedrooms}</strong>bedrooms{h.extra_beds ? ' + extra beds' : ''}</span>}
                      {h.bathrooms > 0 && <span><strong>{h.bathrooms}</strong>bathrooms{h.guest_toilets ? ` + ${h.guest_toilets} WC` : ''}</span>}
                      {h.plot_m2 > 0 && <span><strong>{Number(h.plot_m2).toLocaleString('en-GB')} m²</strong>plot</span>}
                    </div>
                    <p className={c.para}>{h.description}</p>
                    {h.features?.length > 0 && <ul className={c.features}>{h.features.map(f => <li key={f}>{f}</li>)}</ul>}
                    {h.airport_note && <p className={c.airport}>{h.airport_note}</p>}
                    {h.floorplans?.length > 0 && (
                      unlocked
                        ? <div className={c.plans}>{h.floorplans.map((u, k) => <a key={u} href={u} target="_blank" rel="noreferrer" className={c.planLink}>Floor plan{h.floorplans.length > 1 ? ` ${k + 1}` : ''} ↗</a>)}</div>
                        : <button className={c.planLocked} onClick={() => setShowUnlock(true)}>Floor plan available · unlock the collection</button>
                    )}
                  </article>
                );
              })}
            </section>

            <section className={c.how} id="how">
              <h2 className="pp-heading">How owning a collection works</h2>
              <ol className={c.howList}>
                <li><strong>One purchase, every home.</strong> You buy a share of the company that owns all the homes in the collection. The homes are bought outright, with no mortgage on them.</li>
                <li><strong>Around {Math.round(collection.weeks_per_year || 12)} weeks a year.</strong> Stays are booked through a points calendar across all the homes, with high season costing more points than low season. Most owners use eight to ten weeks.</li>
                <li><strong>Nothing to organise.</strong> The homes are renovated, furnished and equipped for you, then run by a management team: cleaning, bills, repairs, insurance and local authorities.</li>
                <li><strong>One monthly cost.</strong> {collection.monthly_cost > 0 ? `${formatMoney(collection.monthly_cost, collection.currency)} a month covers the fixed costs of all the homes.` : 'A single monthly contribution covers the fixed costs of all the homes.'} Cleaning and utilities are paid per stay.</li>
                <li><strong>For your family, not for rent.</strong> Homes can be lent to family and friends; they are not rented out.</li>
              </ol>
            </section>
          </div>

          <div className="pp-right" id="collection-enquiry">
            <div className={`pp-form-card ${c.formCard}`}>
              <h3 className="pp-form-title">{unlocked ? 'Ask about this collection' : 'Unlock the full collection'}</h3>
              <p className={c.formLead}>{price} for all {n} homes · {collection.monthly_cost > 0 ? `${formatMoney(collection.monthly_cost, collection.currency)} a month` : ''}</p>
              <LeadForm collection={collection} onDone={grant}
                intro={unlocked ? null : `Every photo, the floor plans and the running costs of all ${n} homes.`}
                submitLabel={unlocked ? 'Send my question' : 'Unlock the collection'} />
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {showUnlock && <UnlockDialog collection={collection} onClose={() => setShowUnlock(false)} onDone={grant} />}
      {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} onIndex={i => setLightbox(l => ({ ...l, index: i }))} />}
    </>
  );
}
