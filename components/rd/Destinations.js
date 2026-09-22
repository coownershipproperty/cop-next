import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import copy from '@/content/home/en-reference.json';
import s from '@/styles/destination-showcase.module.css';

const ORDER = ['spain','france','usa','italy','portugal','austria','england','sweden','germany','croatia','mexico'];
const PHOTOS = Object.fromEntries(ORDER.map(key => [key, `/redesign/countries/${key}-hd.webp`]));

export default function Destinations({ destinations }) {
  const countries = ORDER.map(key => destinations.find(d => d.key === key)).filter(Boolean);
  const [selected, setSelected] = useState('spain');
  const buttons = useRef({});
  const touchStart = useRef(null);
  const swiped = useRef(false);
  const active = countries.find(d => d.key === selected) || countries[0];
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
  return <div className={s.showcase}>
    <div className={s.tabs} role="tablist" aria-label="Choose a country">
      {countries.map((d,i) => <button key={d.key} ref={el => { buttons.current[d.key] = el; }} type="button" role="tab" id={`country-tab-${d.key}`} aria-controls={`country-panel-${d.key}`} aria-selected={active.key === d.key} tabIndex={active.key === d.key ? 0 : -1} onPointerEnter={e => { if (e.pointerType === 'mouse') setSelected(d.key); }} onClick={() => setSelected(d.key)} onKeyDown={e => onKeyDown(e,i)}>{copy.destinations.tabs[d.key].label}</button>)}
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
        <Link href={d.href} className={s.photo} aria-label={`Explore homes in ${copy.destinations.tabs[d.key].label}`}>
          <Image src={PHOTOS[d.key] || d.img || `/wp-content/uploads/dest-${d.key}.webp`} alt={`Homes in ${copy.destinations.tabs[d.key].label}`} fill sizes="(max-width: 760px) 90vw, 42vw" style={{objectFit:'cover'}} />
        </Link>
        <div className={s.copy}>
          <span className={s.count}>{d.count} {d.count === 1 ? 'home' : 'homes'} in the collection</span>
          <h3>{copy.destinations.tabs[d.key].label}</h3>
          <p>{copy.destinations.tabs[d.key].desc}</p>
          <Link className={s.explore} href={d.href}>Explore properties <span aria-hidden="true">↗</span></Link>
        </div>
        <div className={s.map} aria-hidden="true"><Image src={`/wp-content/uploads/${d.key}-line.webp`} alt="" fill sizes="(max-width: 760px) 35vw, 20vw" style={{objectFit:'contain'}} /></div>
      </>}
    </div>)}
  </div>;
}
