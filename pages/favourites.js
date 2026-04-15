import Layout from '../components/Layout';
import Link from 'next/link';
import { useState, useEffect } from 'react';
export default function Favourites() {
  const [favs, setFavs] = useState([]);
  useEffect(() => {
    try { setFavs(Object.values(JSON.parse(localStorage.getItem('cop_favourites')||'{}'))) }
    catch {}
  }, []);
  return (
    <Layout title="My Favourites" description="Your saved co-ownership properties.">
      <section style={{background:'var(--blue)',padding:'7rem 2rem 4rem',textAlign:'center'}}>
        <div className="eyebrow" style={{color:'var(--gold)',marginBottom:'1rem'}}>Saved</div>
        <h1 style={{fontFamily:'Playfair Display,serif',fontSize:'clamp(2.5rem,5vw,4rem)',fontWeight:400,color:'white'}}>My <em>Favourites</em></h1>
      </section>
      <section style={{background:'var(--cream)',padding:'5rem 2rem',textAlign:'center'}}>
        {favs.length === 0 ? (
          <div>
            <div style={{fontSize:'3rem',marginBottom:'1rem',opacity:0.3}}>♡</div>
            <h3 style={{fontFamily:'Playfair Display,serif',fontSize:'1.5rem',color:'var(--blue)',marginBottom:'1rem'}}>No saved properties yet</h3>
            <p style={{color:'var(--muted)',marginBottom:'2rem'}}>Click the heart icon on any property to save it here.</p>
            <Link href="/our-homes" className="btn-gold" style={{display:'inline-block'}}>Browse Properties</Link>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',gap:'2rem',maxWidth:'var(--max)',margin:'0 auto'}}>
            {favs.map((p,i) => <div key={i} style={{background:'white',padding:'1rem'}}>{p.title||'Property'}</div>)}
          </div>
        )}
      </section>
    </Layout>
  );
}
