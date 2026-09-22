import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import s from '@/styles/destination-showcase.module.css';

const ORDER = ['spain','france','usa','italy','portugal','austria','england','sweden','germany','croatia','mexico'];
const PHOTOS = Object.fromEntries(ORDER.map(key => [key, `/redesign/countries/${key}-hd.webp`]));

// `tabs` is the locale's destinations.tabs map — { key: { label, desc } }.
// It used to be imported straight from content/home/en-reference.json, which
// meant every language got English country names and English descriptions
// under them. It comes in as a prop now so each locale shows its own.
export default function Destinations({ destinations, tabs, exploreLabel = 'Explore homes in', copy = {} }) {
  const label = key => tabs?.[key]?.label || key;
  const desc = key => tabs?.[key]?.desc || '';
  // The count line and the panel's own link used to be written in English
  // here, so a German reader got "22 homes in the collection" and "Explore
  // properties" under a German heading, beside a German description.
  const countLine = n => ((n === 1 ? copy.countLabelOne : copy.countLabel)
    || `{count} ${n === 1 ? 'home' : 'homes'} in the collection`).replace('{count}', n);
  const exploreCta = copy.exploreCta || 'Explore properties';
  const countries = ORDER.map(key => destinations.find(d => d.key === key)).filter(Boolean);
  const [selected, setSelected] = useState('spain');
  const buttons = useRef({});
  const touchStart = useRef(null);
  const swiped = useRef(false);
  const active = countries.find(d => d.key === selected) || countries[0];

  // Only the selected country's photo and outline are in the DOM, so a tab
  // click started a fresh download and left the panel empty for a moment.
  // The panels go through next/image, so warming the raw file does nothing —
  // the optimised URL is what the browser asks for. Read the width and
  // quality next/image picked for the panel that is already on screen and
  // warm the same URL for the neighbouring countries (and every outline,
  // which is small). Neighbours only: the photos are ~0.5 MB each, so
  // warming all eleven would cost more than the delay it saves.
  const wrap = useRef(null);
  const warmed = useRef(new Set());
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const node = wrap.current;
    if (!node) return;
    const shown = node.querySelector('[data-dest-photo] img');
    if (!shown) return;
    // The panel on screen may still be loading, and its chosen width is only
    // readable once it has: in that case wait for its load event and re-run.
    if (!shown.complete || !shown.currentSrc) {
      const again = () => setTick((n) => n + 1);
      shown.addEventListener('load', again, { once: true });
      return () => shown.removeEventListener('load', again);
    }
    const current = shown.currentSrc;
    if (!current.includes('/_next/image')) return;
    let params;
    try { params = new URL(current, window.location.origin).searchParams; } catch { return; }
    const w = params.get('w');
    const q = params.get('q') || '75';
    if (!w) return;
    const optimised = (src) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=${q}`;
    const warm = (url) => {
      if (!url || warmed.current.has(url)) return;
      warmed.current.add(url);
      const img = new window.Image();
      img.decoding = 'async';
      img.src = url;
    };
    const index = countries.findIndex((d) => d.key === selected);
    for (const step of [1, -1]) {
      const neighbour = countries[(index + step + countries.length) % countries.length];
      if (neighbour) warm(optimised(PHOTOS[neighbour.key] || neighbour.img));
    }
    for (const d of countries) warm(optimised(`/wp-content/uploads/${d.key}-line.webp`));
  }, [countries, selected, tick]);

  if (!active) return null;
  function onKeyDown(event, index) {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % countries.length;
    if (event.key === 'ArrowLeft') next = (index - 1 + countries.length) % countries.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = countries.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    setSelected(countries[next].key);
    buttons.current[countries[next].key]?.focus();
  }
  return <div className={s.showcase} ref={wrap}>
    {/* On a phone the tab strip is 1,047px of content (1,277px in German) in
        a 390px window: four of eleven countries are visible in English,
        three in German, and nothing said the rest were there. The CSS for
        this hint has existed since the redesign — no component ever rendered
        the element. */}
    <p className="destination-swipe-hint" aria-hidden="true">
      <span>{copy.swipeHint || 'Swipe for more countries'}</span><span>→</span>
    </p>
    <div className={s.tabs} role="tablist" aria-label="Choose a country">
      {countries.map((d,i) => <button key={d.key} ref={el => { buttons.current[d.key] = el; }} type="button" role="tab" id={`country-tab-${d.key}`} aria-controls={`country-panel-${d.key}`} aria-selected={active.key === d.key} tabIndex={active.key === d.key ? 0 : -1} onPointerEnter={e => { if (e.pointerType === 'mouse') setSelected(d.key); }} onClick={() => setSelected(d.key)} onKeyDown={e => onKeyDown(e,i)}>{label(d.key)}</button>)}
    </div>
    {countries.map(d => <div key={d.key} role="tabpanel" id={`country-panel-${d.key}`} aria-labelledby={`country-tab-${d.key}`} hidden={active.key !== d.key} tabIndex={0} className={s.panel}
      style={{touchAction:'pan-y'}}
      onTouchStart={e => { touchStart.current = {x:e.touches[0].clientX,y:e.touches[0].clientY}; swiped.current=false; }}
      onTouchEnd={e => {
        const start=touchStart.current; touchStart.current=null;
        if (!start) return;
        const dx=e.changedTouches[0].clientX-start.x, dy=e.changedTouches[0].clientY-start.y;
        if (Math.abs(dx)<50 || Math.abs(dx)<Math.abs(dy)*1.5) return;
        swiped.current=true;
        const next=countries[(countries.findIndex(c=>c.key===active.key)+(dx<0?1:-1)+countries.length)%countries.length];
        setSelected(next.key);
        buttons.current[next.key]?.scrollIntoView({block:'nearest',inline:'center',behavior:'auto'});
      }}
      onClickCapture={e => { if(swiped.current) { e.preventDefault(); swiped.current=false; } }}>
      {active.key === d.key && <>
        <Link href={d.href} className={s.photo} data-dest-photo="1" aria-label={`${exploreLabel} ${label(d.key)}`}>
          <Image src={PHOTOS[d.key] || d.img || `/wp-content/uploads/dest-${d.key}.webp`} alt={label(d.key)} fill sizes="(max-width: 760px) 90vw, 42vw" style={{objectFit:'cover'}} />
        </Link>
        <div className={s.copy}>
          <span className={s.count}>{countLine(d.count)}</span>
          <h3>{label(d.key)}</h3>
          <p>{desc(d.key)}</p>
          <Link className={s.explore} href={d.href}>{exploreCta} <span aria-hidden="true">↗</span></Link>
        </div>
        <div className={s.map} aria-hidden="true"><Image src={`/wp-content/uploads/${d.key}-line.webp`} alt="" fill sizes="(max-width: 760px) 35vw, 20vw" style={{objectFit:'contain'}} /></div>
      </>}
    </div>)}
  </div>;
}
