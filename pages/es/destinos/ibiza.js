import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import PropertyCard from '@/components/PropertyCard';
import hreflangLinks from '@/components/HreflangLinks';
import { createClient } from '@supabase/supabase-js';
import { localeColumns, pickLocalized } from '@/lib/i18n';

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data } = await supabase
    .from('properties')
    .select(`slug, ${localeColumns(['title'])}, img, images, total_images, drive_url, price, currency, share_denominator, country, region, city, beds, size, status, property_type`)
    .eq('country', 'Spain').eq('region', 'Ibiza')
    .in('status', ['Live', 'for_sale'])
    .limit(24);

  const properties = (data || []).map(p => ({
    slug: p.slug, title: p.title, ...pickLocalized(p, ['title'], { locales: ['es'] }), ...pickLocalized(p, ['title'], { locales: ['fr'] }),
    img: p.img, images: (p.images || []).slice(0, 3),
    totalImages: p.total_images || 0, driveUrl: p.drive_url || null,
    price: p.price || null, currency: p.currency || 'EUR',
    share_denominator: p.share_denominator || null,
    country: p.country, region: p.region, city: p.city || '',
    beds: p.beds || 0, size: p.size || 0,
    label: '', status: p.status || '', property_type: p.property_type || '',
  }));
  return { props: { properties }, revalidate: 3600 };
}

export default function IbizaES({ properties }) {
  const canonicalUrl = 'https://co-ownership-property.com/es/destinos/ibiza/';
  return (
    <>
      <Head>
        <title>Copropiedad en Ibiza: villas y casas en propiedad fraccionada [2026]</title>
        <meta name="description" content="Propiedades en copropiedad en Ibiza — villas y casas en Santa Eulalia, San José, San Juan y otras zonas. Propiedad real con escritura ante notario, desde una fracción del precio." />
        <link rel="canonical" href={canonicalUrl} />
        {hreflangLinks({ englishPath: '/es/destinos/ibiza' })}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:title" content="Copropiedad en Ibiza" />
        <meta property="og:description" content="Villas y casas de lujo en copropiedad en Ibiza. Desde una fracción del precio." />
        <meta property="og:url" content={canonicalUrl} />
      </Head>
      <Header />

      <section className="page-hero">
        <p className="eyebrow">Destino · Islas Baleares</p>
        <h1>Copropiedad en <em>Ibiza</em></h1>
        <p className="subtitle">Villas, fincas restauradas y casas de diseño en copropiedad por toda Ibiza — desde una fracción del precio de la compra íntegra.</p>
      </section>

      <section className="sec intro-sec">
        <div className="intro-center">
          <p className="eyebrow">Por qué Ibiza</p>
          <h2>Una isla con dos <em>identidades</em></h2>
          <p>Ibiza tiene un mercado inmobiliario único en el Mediterráneo: <strong>oferta extremadamente limitada</strong> (la isla mide 572 km² y la mayoría está protegida) combinada con <strong>demanda internacional muy alta</strong>. El resultado: precios entre los más resistentes de Europa, con poca volatilidad y revalorización constante en zonas como Santa Eulalia, Roca Llisa o las afueras de Sant Josep.</p>
          <p>Para la copropiedad, esto se traduce en algo importante: una villa con piscina y vistas al mar en Ibiza, que costaría 2 a 5 millones de euros como compra íntegra, está al alcance desde aproximadamente <strong>250.000 a 600.000 € por una fracción de 1/8</strong>. Es una de las islas con mejor relación entre revalorización histórica y disfrute personal en el mercado europeo.</p>
        </div>
      </section>

      <section className="sec" style={{background:'var(--white)'}}>
        <div className="sec-inner">
          <h2 style={{textAlign:'center', fontSize:'clamp(1.6rem, 3vw, 2.2rem)', marginBottom:'2rem'}}>Las mejores zonas de Ibiza para copropiedad</h2>
          <div className="explainer-grid">
            <div className="explainer-item"><div className="explainer-num">01</div><div className="explainer-divider"></div><h3>Santa Eulalia y Es Canar</h3><p>El este familiar y elegante. Mejor balance entre tranquilidad y servicios. Propiedades de lujo con vistas al mar. La zona favorita de los compradores que buscan un destino relajado pero con vida cultural.</p></div>
            <div className="explainer-item"><div className="explainer-num">02</div><div className="explainer-divider"></div><h3>San José y Cala Vadella</h3><p>El suroeste exclusivo. Calas espectaculares, atardeceres mundialmente famosos. Aquí están algunas de las villas más espectaculares y discretas de la isla. Mercado limitado, demanda altísima.</p></div>
            <div className="explainer-item"><div className="explainer-num">03</div><div className="explainer-divider"></div><h3>San Juan y Portinatx</h3><p>El norte virgen. Calas escondidas, mercados artesanales, ambiente bohemio refinado. Inventario muy limitado pero con gran valor patrimonial. Para quien busca la Ibiza menos comercial.</p></div>
            <div className="explainer-item"><div className="explainer-num">04</div><div className="explainer-divider"></div><h3>Roca Llisa y Cap Martinet</h3><p>Comunidades cerradas con campo de golf y club de playa. Máxima seguridad y servicio. Los precios más elevados de la isla, pero con la infraestructura más completa para una segunda residencia.</p></div>
            <div className="explainer-item"><div className="explainer-num">05</div><div className="explainer-divider"></div><h3>Talamanca y Marina Botafoch</h3><p>Cerca de la ciudad, con marina de superyates. Apartamentos de lujo y áticos con vistas al puerto. Para quien combina vida urbana, gastronomía y cercanía a Ibiza ciudad.</p></div>
            <div className="explainer-item"><div className="explainer-num">06</div><div className="explainer-divider"></div><h3>San Carlos y Las Dalias</h3><p>El interior auténtico, ambiente bohemio. Fincas restauradas, almazaras, viñedos. Para quien busca conexión con la cultura ibicenca tradicional. Punto de entrada más asequible.</p></div>
          </div>
        </div>
      </section>

      <section className="our-homes-section">
        <div className="results-bar" style={{padding:'2rem 1.5rem 1rem'}}>
          <h2 style={{margin:0, fontFamily:'var(--font-playfair, Georgia, serif)', fontSize:'clamp(1.5rem, 3vw, 2rem)', color:'#2C4A5E', textAlign:'center'}}>Propiedades disponibles en Ibiza</h2>
          <p className="results-count" style={{textAlign:'center', marginTop:'0.5rem'}}>{properties.length} {properties.length === 1 ? 'propiedad disponible' : 'propiedades disponibles'} en copropiedad</p>
        </div>
        <div className="homes-grid-wrap">
          {properties.length > 0 ? (
            <div className="homes-grid">{properties.map(p => <PropertyCard key={p.slug} property={p} />)}</div>
          ) : (
            <div className="no-results" style={{padding:'3rem 1rem'}}><p>No hay propiedades disponibles en Ibiza en este momento. <a href="#newsletter">Suscríbete</a> para que te avisemos cuando añadamos nuevas.</p></div>
          )}
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
