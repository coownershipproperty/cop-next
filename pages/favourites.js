import Head from 'next/head';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';


export default function Favourites() {
  return (
    <>
      <Head>
        <title>My Favourites | Co-Ownership Property</title>
        <meta name="description" content="Your saved co-ownership properties on Co-Ownership Property." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
{/* HERO */}
    <section className="page-hero">
        <p className="eyebrow">Saved Properties</p>
        <h1>My <em>Favourites</em></h1>
        <p className="subtitle">Properties you've saved for later. Click a card to view details or speak to an expert about any home.</p>
    </section>

    {/* GRID */}
    <section className="fav-sec">
        <div className="fav-inner">
            <div className="fav-header">
                <p className="fav-count" id="fav-count"></p>
                <button className="clear-favs-btn" id="clear-favs" style={{display: 'none'}}>Clear all</button>
            </div>
            <div id="fav-grid" className="fav-grid"></div>
            <div id="fav-empty" className="fav-empty" style={{display: 'none'}}>
                <div className="fav-empty-icon">&#9825;</div>
                <h2>No Saved Properties Yet</h2>
                <p>Browse our collection and tap the heart icon on any property to save it here.</p>
                <a href="/our-homes/" className="btn-gold">Browse Properties</a>
            </div>
        </div>
    </section>

        {/* ===== NEWSLETTER SIGNUP (shared partial) ===== */}
    
        {/* ===== SPEAK TO AN EXPERT (shared partial) ===== */}
      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/favourites.js" strategy="afterInteractive" />
    </>
  );
}