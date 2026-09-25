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
import { loadCollections, loadCollection, formatMoney, placeLabel, weeksLabel, COLLECTIONS_PREVIEW } from '@/lib/collections';
import ps from '@/styles/property-redesign.module.css';
import c from '@/styles/collections.module.css';

const SITE = 'https://co-ownership-property.com';
const PREVIEW_PHOTOS = 5; // photos per home shown before the unlock
// Public vs gated (David, 24 Sep 2026): the public page shows photographs of
// homes that are ready to use, and nothing else. Homes still being prepared or
// chosen are locked: their own photos (if any) and the photos of past homes in
// the same place (example_photos, always labelled) open only after the unlock.
// A home with no public photo is represented by a destination view
// (collections.destination_photos), never by another home.
const isOpen = h => h?.readiness === 'ready' && h.photos?.length > 0;
const STATUS = { ready: 'Ready to use', soon: 'Coming soon', in_preparation: 'Being prepared', searching: 'Being chosen', example: 'Being chosen' };
const EXAMPLE_LABEL = 'Example of a past home';

export async function getStaticPaths() {
  const all = await loadCollections({ withHomes: false });
  return { paths: all.map(x => ({ params: { slug: x.slug } })), fallback: 'blocking' };
}

export async function getStaticProps({ params }) {
  const collection = await loadCollection(params.slug);
  if (!collection) return { notFound: true, revalidate: 3600 };
  return { props: { collection }, revalidate: 3600 };
}



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
        <p className={c.dialogSub}>All {photos} photographs of the {collection.homes.length} homes{plans ? ', and the floor plans' : ''}.</p>
        <LeadForm collection={collection} onDone={() => { onDone(); setTimeout(onClose, 1400); }} compact />
      </div>
    </div>
  );
}

function Lightbox({ photos, index, onClose, onIndex, title, noteFor }) {
  const note = noteFor ? noteFor(index) : null;
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
      {note && <span className={c.lbNote} onClick={e => e.stopPropagation()}>{note}</span>}
    </div>
  );
}

export default function CollectionPage({ collection }) {
  const router = useRouter();
  const [unlocked, grant] = useAccess(collection.slug);
  const [showUnlock, setShowUnlock] = useState(false);
  const [lightbox, setLightbox] = useState(null); // { photos, index, title }
  const [mobileSlide, setMobileSlide] = useState(0);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowBar(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const homes = collection.homes || [];
  const leadKey = typeof router.query.home === 'string' ? router.query.home : null;
  const ordered = useMemo(() => {
    // Only a home that is open to the public can lead the gallery.
    const lead = homes.find(h => h.key === leadKey && isOpen(h)) || homes.find(isOpen);
    return lead ? [lead, ...homes.filter(h => h.key !== lead.key)] : homes;
  }, [homes, leadKey]);
  const dests = collection.destination_photos || [];
  const destOf = h => dests.find(d => d.key === h?.key) || null;
  const faceOf = h => (isOpen(h) ? h.photos[0] : destOf(h)?.src) || null;
  // Everything a home offers once unlocked: its own photos, then past examples.
  const gatedOf = h => [...(h.photos || []), ...(h.example_photos || [])];
  const lead = ordered[0];
  const n = collection.homes_count || homes.length;
  const nWord = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] || String(n);
  const totalPhotos = homes.reduce((t, h) => t + gatedOf(h).length, 0);
  const leadOpen = isOpen(lead);
  const hasSki = homes.some(h => (h.search_terms || []).includes('ski') || /chamonix|ski/i.test(`${h.city} ${h.chapter}`));
  // No home open yet (a collection still forming): lead with destination views.
  const heroPhotos = leadOpen ? lead.photos : dests.map(d => d.src);
  const heroCaption = i => leadOpen ? (lead.chapter || lead.city) : (dests[i]?.place || '');
  const secondPhotos = leadOpen ? [heroPhotos[1], faceOf(ordered[1])].filter(Boolean) : heroPhotos.slice(1, 3);
  const publicCount = homes.filter(isOpen).reduce((t, h) => t + Math.min(PREVIEW_PHOTOS, h.photos.length), 0);
  const lockedCount = Math.max(0, totalPhotos - publicCount);
  const planCount = homes.reduce((t, h) => t + (h.floorplans?.length || 0), 0);
  const price = formatMoney(collection.price, collection.currency);
  const weeks = weeksLabel(collection);
  const canonical = `${SITE}/collections/${collection.slug}/`;
  const places = ordered.map(h => h.city);
  const metaDesc = `${n} homes in ${places.slice(0, -1).join(', ')} and ${places.slice(-1)}, in a single purchase. Circa ${Math.round(collection.weeks_per_year || 12)} weeks a year across the homes, every one of them looked after for you.`;
  const stripHome = ordered.slice(1).find(isOpen);
  const stripPhoto = stripHome ? (stripHome.photos[1] || stripHome.photos[0]) : (heroPhotos[3] || heroPhotos[1]);
  const stripCaption = stripHome ? (stripHome.chapter || stripHome.city) : (dests[heroPhotos.indexOf(stripPhoto)]?.place || '');
  const ctaPhoto = heroPhotos[3] || heroPhotos[0];

  function openHome(h, i = 0) {
    if (!h) return;
    if (!unlocked && !isOpen(h)) { setShowUnlock(true); return; }
    const own = unlocked ? (h.photos || []) : h.photos.slice(0, PREVIEW_PHOTOS);
    const photos = unlocked ? [...own, ...(h.example_photos || [])] : own;
    if (!photos.length) return;
    // Lightbox note: shown on the example photos only.
    const noteFor = k => (k >= own.length ? (h.example_note || EXAMPLE_LABEL) : (!isOpen(h) ? h.photos_note || null : null));
    setLightbox({ photos, index: Math.min(i, photos.length - 1), title: h.name, noteFor });
  }
  function openHero(i = 0) {
    if (leadOpen) openHome(lead, i);
    else if (!unlocked) setShowUnlock(true);
  }
  function openAll() {
    if (!unlocked) { setShowUnlock(true); return; }
    const photos = []; const notes = [];
    ordered.forEach(h => {
      (h.photos || []).forEach(p => { photos.push(p); notes.push(null); });
      (h.example_photos || []).forEach(p => { photos.push(p); notes.push((h.example_note || EXAMPLE_LABEL)); });
    });
    setLightbox({ photos, index: 0, title: collection.name, noteFor: k => notes[k] });
  }
  function chooseLead(key) {
    const h = homes.find(x => x.key === key);
    if (!isOpen(h)) { document.getElementById(`home-${key}`)?.scrollIntoView({ behavior: 'smooth' }); return; }
    router.replace({ pathname: router.pathname, query: { ...router.query, home: key } }, undefined, { shallow: true, scroll: false });
    setMobileSlide(0);
  }
  const mobileSlides = leadOpen
    ? [...heroPhotos.slice(0, 3), ...ordered.slice(1).map(faceOf).filter(Boolean)]
    : heroPhotos;

  return (
    <>
      <Head>
        <title>{`${collection.name}: ${n} homes across Europe`}</title>
        <meta name="description" content={metaDesc} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonical} />
        {(COLLECTIONS_PREVIEW || collection.status !== 'Live') && <meta name="robots" content="noindex,nofollow" />}
        <meta property="og:title" content={`${collection.name} | Co-Ownership Property`} />
        <meta property="og:description" content={metaDesc} />
        {collection.hero_image && <meta property="og:image" content={collection.hero_image} />}
      </Head>
      <div className={`rd ${ps.page} ${c.page}`}>
        <Nav propertyHero ctaHref="#unlock" />

        {/* ── Mobile: swipe through the lead home, then one photo of each other home ── */}
        <div className={c.mobGallery}>
          <div className={c.mobTrack} style={{ transform: `translateX(${-mobileSlide * 100}%)` }}>
            {mobileSlides.map((src, i) => (
              <div key={i} className={c.mobSlide} onClick={() => (leadOpen && i < 3 ? openHome(lead, i) : openHero(i))}>
                <Img src={src} alt={`${collection.name} ${i + 1}`} priority={i === 0} />
              </div>
            ))}
            <div className={`${c.mobSlide} ${c.mobLock}`} onClick={openAll}>
              <span className={c.lockTitle}>{unlocked ? 'Every photograph' : `${lockedCount} more photographs`}</span>
              <span className={c.lockSub}>{unlocked ? `${totalPhotos} photos of ${n} homes` : (planCount ? 'and the floor plans' : `of all ${n} homes`)}</span>
              <span className={c.lockBtn}>{unlocked ? 'Open the gallery' : 'Unlock the collection'}</span>
            </div>
          </div>
          {mobileSlide > 0 && <button className={`${c.mobArrow} ${c.mobPrev}`} onClick={() => setMobileSlide(s => s - 1)} aria-label="Previous photo">‹</button>}
          {mobileSlide < mobileSlides.length && <button className={`${c.mobArrow} ${c.mobNext}`} onClick={() => setMobileSlide(s => s + 1)} aria-label="Next photo">›</button>}
          <span className={`${c.tag} ${c.tagOnPhoto}`}><span className={c.tagRule} aria-hidden="true" />A collection of {nWord} homes</span>
          {!leadOpen && mobileSlide < mobileSlides.length && <span className={`${c.exampleBadge} ${c.exampleBadgeMob}`}>{dests[mobileSlide]?.place}</span>}
          <span className={c.mobCount}>{Math.min(mobileSlide + 1, mobileSlides.length + 1)} / {mobileSlides.length + 1}</span>
        </div>

        {/* ── Desktop: the property-page gallery, led by the chosen home ── */}
        <div className={`pp-gallery ${c.gallery}`}>
          <div className="pp-gallery-hero" onClick={() => openHero(0)}>
            {heroPhotos[0] && <Img src={heroPhotos[0]} alt={`${lead.name}, ${placeLabel(lead)}`} priority sizes="75vw" />}
            <span className={`${c.tag} ${c.tagOnPhoto}`}><span className={c.tagRule} aria-hidden="true" />A collection of {nWord} homes</span>
            <span className={c.galleryCaption}>{heroCaption(0)}</span>
          </div>
          <div className="pp-gallery-thumb" onClick={() => leadOpen ? openHome(lead, 1) : openHero(1)}>
            {secondPhotos[0] && <Img src={secondPhotos[0]} alt={`${collection.name} 2`} sizes="25vw" />}
            {!leadOpen && <span className={c.thumbCaption}>{heroCaption(1)}</span>}
          </div>
          <div className="pp-gallery-thumb" onClick={() => leadOpen ? openHome(ordered[1] || lead, 0) : openHero(2)}>
            {secondPhotos[1] && <Img src={secondPhotos[1]} alt={`${collection.name} 3`} sizes="25vw" />}
            {(leadOpen ? ordered[1] : dests[2]) && <span className={c.thumbCaption}>{leadOpen ? (ordered[1].chapter || ordered[1].city) : heroCaption(2)}</span>}
          </div>
          <div className="pp-gallery-lock" onClick={openAll}>
            <div className="pp-lock-strip" aria-hidden="true">
              {ordered.slice(1, 5).map(h => ({ key: h.key, src: faceOf(h) || (h.photos || [])[0] })).filter(x => x.src).map(x => <div key={x.key} className="pp-lock-strip-cell" style={{ backgroundImage: `url('${x.src}')` }} />)}
            </div>
            <span className="pp-lock-title">{unlocked ? 'Every photograph' : `${lockedCount} more photographs`}</span>
            <span className="pp-lock-sub">{unlocked ? `${totalPhotos} photos of ${n} homes` : `All ${n} homes${planCount ? ', and the floor plans' : ''}`}</span>
            <span className="pp-lock-cta-btn">{unlocked ? 'Open the gallery' : 'Unlock the collection'}</span>
          </div>
        </div>

        <main>
          {/* ── Introduction ── */}
          <section className={`${c.intro} rd-container`}>
            <p className={c.eyebrow}>A collection of {nWord} homes</p>
            <h1 className={c.title}>{collection.name}</h1>
            {collection.tagline && <p className={c.lede}>{collection.tagline}</p>}
            <dl className={c.keyFacts}>
              <div><dt>For all {n} homes</dt><dd>{price}</dd></div>
              <div><dt>Homes</dt><dd>{n}</dd></div>
              <div><dt>Weeks a year</dt><dd>{weeks}</dd></div>
            </dl>
            {collection.availability_note && <p className={c.availNote}>{collection.availability_note}</p>}
            <div className={c.introActions}>
              <button type="button" className={c.btnPrimary} onClick={() => unlocked ? openAll() : setShowUnlock(true)}>{unlocked ? 'See every photograph' : 'Unlock the full collection'}</button>
              <a className={c.btnText} href="#homes">Meet the homes <span aria-hidden="true">↓</span></a>
            </div>
            <nav className={c.destinations} aria-label="Homes in this collection">
              {ordered.map(h => (
                <button key={h.key} type="button" className={`${c.destination}${h.key === lead.key ? ` ${c.destinationActive}` : ''}`} onClick={() => chooseLead(h.key)} aria-current={h.key === lead.key ? 'true' : undefined}>{h.chapter || h.city}</button>
              ))}
            </nav>
          </section>

          {/* ── The story ── */}
          <section className={`${c.story} rd-container`}>
            <div className={c.storyText}>
              <h2 className={c.h2}>A home for every season</h2>
              {String(collection.description || '').split('\n\n').map((para, i) => <p key={i} className={c.para}>{para}</p>)}
            </div>
            {collection.highlights?.length > 0 && (
              <ul className={c.highlights}>
                {collection.highlights.map(h => <li key={h}>{h}</li>)}
              </ul>
            )}
          </section>

          {stripPhoto && (
            <figure className={c.strip}>
              <Img src={stripPhoto} alt={stripCaption || collection.name} sizes="100vw" />
              <figcaption>{stripCaption}</figcaption>
            </figure>
          )}

          {/* ── The homes, one chapter each ── */}
          <section id="homes" className={`${c.homes} rd-container`}>
            <p className={c.eyebrow}>The homes</p>
            <h2 className={c.h2}>{nWord[0].toUpperCase() + nWord.slice(1)} places to call home</h2>
            {ordered.map((h, i) => {
              const open = isOpen(h);
              const own = h.photos || [];
              const ex = h.example_photos || [];
              // What this chapter may show right now.
              const gal = open ? (unlocked ? own : own.slice(0, PREVIEW_PHOTOS)) : (unlocked ? [...own, ...ex] : []);
              const isEx = k => k >= own.length; // index into gal is an example photo
              const hidden = open ? own.length - gal.length : 0;
              const rest = gal.slice(1, 4);
              const dest = destOf(h);
              const place = h.chapter || h.city;
              const status = STATUS[h.readiness] || '';
              return (
                <article key={h.key} className={c.chapter} id={`home-${h.key}`}>
                  <header className={c.chapterHead}>
                    <p className={c.chapterNo}>{String(i + 1).padStart(2, '0')} <span aria-hidden="true">—</span> {h.chapter || h.region}</p>
                    <h3 className={c.chapterTitle}>{h.name}</h3>
                    <p className={c.chapterPlace}>{placeLabel(h)}</p>
                  </header>
                  {gal[0] ? (
                    <button className={c.chapterHero} onClick={() => openHome(h, 0)} aria-label={`Open the photos of ${h.name}`}>
                      <Img src={gal[0]} alt={`${h.name}, ${placeLabel(h)}`} sizes="(max-width: 960px) 100vw, 1180px" />
                      {isEx(0) && <span className={c.exampleBadge}>{EXAMPLE_LABEL}</span>}
                    </button>
                  ) : (
                    <button type="button" className={c.lockedPanel} onClick={() => !unlocked && setShowUnlock(true)} disabled={unlocked}>
                      {(own[0] || dest) && (
                        <span className={own[0] ? c.lockedBgBlur : c.lockedBg}>
                          <Img src={own[0] || dest.src} alt="" sizes="(max-width: 960px) 100vw, 1180px" />
                        </span>
                      )}
                      <span className={c.lockedShade} aria-hidden="true" />
                      {!own[0] && dest && <span className={c.lockedPlace}>{dest.place}</span>}
                      <span className={c.lockedInner}>
                        <span className={c.searchingKicker}>{status}</span>
                        <span className={c.searchingTitle}>
                          {unlocked ? 'Photographs to follow' : own.length ? 'Unlock to see this home' : ex.length ? 'See a past home like it' : 'This home is being chosen'}
                        </span>
                        <span className={c.searchingSub}>
                          {unlocked ? 'We will add them as soon as the home is secured.'
                            : own.length ? `${own.length} photographs${h.photos_note && /before|bought/i.test(h.photos_note) ? ' of the home as bought' : ''}, opened with the collection.`
                            : ex.length ? `While this home is ${status.toLowerCase()}, unlock the collection to see a home from our earlier collections.`
                            : 'Photographs will follow as soon as it is secured.'}
                        </span>
                        {!unlocked && <span className={c.lockBtn}>Unlock the collection</span>}
                      </span>
                    </button>
                  )}
                  {gal.length > 0 && isEx(0) && h.example_note && <p className={c.exampleNote}>{h.example_note}</p>}
                  {gal.length > 0 && !open && !isEx(0) && h.photos_note && <p className={c.exampleNote}>{h.photos_note}{ex.length ? ` Further on: ${(h.example_note || EXAMPLE_LABEL).charAt(0).toLowerCase()}${(h.example_note || EXAMPLE_LABEL).slice(1)}` : ''}</p>}
                  <div className={c.chapterBody}>
                    <dl className={c.homeFacts}>
                      {!open && status && <div><dt>Status</dt><dd>{status}</dd></div>}
                      {h.size_m2 > 0 && <div><dt>Size</dt><dd>{h.size_m2} m²</dd></div>}
                      {h.bedrooms > 0 && <div><dt>Bedrooms</dt><dd>{h.bedrooms}{h.extra_beds ? ' + extra beds' : ''}</dd></div>}
                      {h.bathrooms > 0 && <div><dt>Bathrooms</dt><dd>{h.bathrooms}{h.guest_toilets ? ` + ${h.guest_toilets} WC` : ''}</dd></div>}
                      {h.plot_m2 > 0 && <div><dt>Plot</dt><dd>{Number(h.plot_m2).toLocaleString('en-GB')} m²</dd></div>}
                      {h.airport_note && <div><dt>Arriving</dt><dd>{h.airport_note.replace(/^About /, 'About ')}</dd></div>}
                    </dl>
                    <div>
                      <p className={c.para}>{h.description}</p>
                      {h.features?.length > 0 && <p className={c.features}>{h.features.join('  ·  ')}</p>}
                      {h.floorplans?.length > 0 && (
                        unlocked
                          ? <p className={c.plans}>{h.floorplans.map((u, k) => <a key={u} href={u} target="_blank" rel="noreferrer">Floor plan{h.floorplans.length > 1 ? ` ${k + 1}` : ''} ↗</a>)}</p>
                          : <button className={c.planLocked} onClick={() => setShowUnlock(true)}>Floor plan <span aria-hidden="true">·</span> unlock to view</button>
                      )}
                    </div>
                  </div>
                  {rest.length > 0 && (
                    <div className={c.chapterRow}>
                      {rest.map((src, j) => (
                        <button key={src} className={c.rowPhoto} onClick={() => openHome(h, j + 1)} aria-label={`Photo ${j + 2} of ${h.name}`}>
                          <Img src={src} alt={`${h.name} ${j + 2}`} sizes="(max-width: 960px) 50vw, 25vw" />
                          {isEx(j + 1) && !isEx(0) && <span className={c.exampleBadgeSmall}>{EXAMPLE_LABEL}</span>}
                        </button>
                      ))}
                      <button className={c.rowMore} onClick={() => unlocked ? openHome(h, 4) : setShowUnlock(true)}>
                        {(hidden > 0 || gal.length > 4)
                          ? <><strong>{unlocked ? `+${gal.length - 4}` : `+${hidden}`}</strong><span>{unlocked ? 'more photographs' : 'photographs to unlock'}</span></>
                          : <><strong>More soon</strong><span>further photographs to follow</span></>}
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          {/* ── How it works, briefly ── */}
          <section className={`${c.how} rd-container`}>
            <p className={c.eyebrow}>How it works</p>
            <h2 className={c.h2}>Owning a collection</h2>
            <ol className={c.howGrid}>
              <li><span>01</span><h3>One purchase</h3><p>You own a share of the company that holds every home in the collection. The homes are bought outright, with no mortgage on them.</p></li>
              <li><span>02</span><h3>Circa {Math.round(collection.weeks_per_year || 12)} weeks a year</h3><p>A shared calendar spreads the year fairly across the homes{hasSki ? ', with at least one ski week' : ''}. Longer stays are common outside high season.</p></li>
              <li><span>03</span><h3>Nothing to organise</h3><p>Renovated, furnished and equipped for you, then cleaned, maintained and insured between your stays.</p></li>
              <li><span>04</span><h3>For family and friends</h3><p>Lend your weeks to the people you love. The homes are kept for owners, never rented out.</p></li>
            </ol>
          </section>

          {/* ── Unlock ── */}
          <section className={c.cta} id="unlock">
            {ctaPhoto && <Img src={ctaPhoto} alt="" sizes="100vw" />}
            <span className={c.ctaShade} aria-hidden="true" />
            <div className={`${c.ctaInner} rd-container`}>
              <div className={c.ctaCopy}>
                <p className={c.eyebrowLight}>{collection.name}</p>
                <h2 className={c.ctaTitle}>{unlocked ? 'Speak to us about the collection' : 'See the whole collection'}</h2>
                <p className={c.ctaText}>{unlocked ? 'Ask us anything, from the calendar to the paperwork. We answer personally, usually within a day.' : `Every photograph of the ${nWord} homes${planCount ? ", the floor plans," : ""} and a personal introduction when you are ready.`}</p>
              </div>
              <div className={c.ctaForm}>
                <LeadForm collection={collection} onDone={grant} submitLabel={unlocked ? 'Send my question' : 'Unlock the collection'} />
              </div>
            </div>
          </section>
        </main>

        <div className={`${c.mobBar}${showBar ? '' : ` ${c.mobBarHidden}`}`}>
          <span><strong>{price}</strong><small>all {n} homes</small></span>
          <button type="button" onClick={() => unlocked ? openAll() : setShowUnlock(true)}>{unlocked ? 'See every photo' : 'Unlock'}</button>
        </div>

        <Footer />
      </div>

      {showUnlock && <UnlockDialog collection={collection} onClose={() => setShowUnlock(false)} onDone={grant} />}
      {lightbox && <Lightbox {...lightbox} onClose={() => setLightbox(null)} onIndex={i => setLightbox(l => ({ ...l, index: i }))} />}
    </>
  );
}
