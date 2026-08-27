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

export default function IbizaFR({ properties }) {
  const canonicalUrl = 'https://co-ownership-property.com/fr/destinations/ibiza/';
  return (
    <>
      <Head>
        <title>Résidence secondaire à Ibiza : copropriété et villas en quote-part [2026]</title>
        <meta name="description" content="Devenez copropriétaire d'une résidence secondaire à Ibiza — villas et fincas dans les meilleures zones (Santa Eulalia, San José, Roca Llisa). À partir d'1/8 avec acte authentique." />
        <link rel="canonical" href={canonicalUrl} />
        {hreflangLinks({ englishPath: '/fr/destinations/ibiza' })}
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:title" content="Copropriété à Ibiza" />
        <meta property="og:description" content="Villas et fincas de luxe en copropriété à Ibiza. Pour une fraction du prix." />
        <meta property="og:url" content={canonicalUrl} />
      </Head>
      <Header />

      <section className="page-hero">
        <p className="eyebrow">Destination · Îles Baléares</p>
        <h1>Copropriété à <em>Ibiza</em></h1>
        <p className="subtitle">Villas, fincas restaurées et maisons d'architecte en copropriété à travers Ibiza — pour une fraction du prix d'achat intégral.</p>
      </section>

      <section className="sec intro-sec">
        <div className="intro-center">
          <p className="eyebrow">Pourquoi Ibiza</p>
          <h2>Une île à deux <em>identités</em></h2>
          <p>Ibiza a un marché immobilier unique en Méditerranée : <strong>offre extrêmement limitée</strong> (l'île fait 572 km² et la majorité est protégée) combinée à une <strong>demande internationale très forte</strong>. Le résultat : des prix parmi les plus résistants d'Europe, avec peu de volatilité et une valorisation constante dans des zones comme Santa Eulalia, Roca Llisa ou les hauteurs de Sant Josep.</p>
          <p>Pour la copropriété, cela se traduit concrètement : une villa avec piscine et vue mer à Ibiza, qui coûterait 2 à 5 millions d'euros à l'achat intégral, devient accessible à partir d'environ <strong>250 000 à 600 000 € la quote-part de 1/8</strong>. C'est l'une des îles offrant le meilleur rapport entre valorisation historique et plaisir personnel sur le marché européen.</p>
        </div>
      </section>

      <section className="sec" style={{background:'var(--white)'}}>
        <div className="sec-inner">
          <h2 style={{textAlign:'center', fontSize:'clamp(1.6rem, 3vw, 2.2rem)', marginBottom:'2rem'}}>Les meilleures zones d'Ibiza pour la copropriété</h2>
          <div className="explainer-grid">
            <div className="explainer-item"><div className="explainer-num">01</div><div className="explainer-divider"></div><h3>Santa Eulalia et Es Canar</h3><p>L'est familial et élégant. Meilleur équilibre entre tranquillité et services. Biens de luxe avec vue mer. Zone préférée des acheteurs cherchant une destination paisible mais culturellement vivante.</p></div>
            <div className="explainer-item"><div className="explainer-num">02</div><div className="explainer-divider"></div><h3>San José et Cala Vadella</h3><p>Le sud-ouest exclusif. Criques spectaculaires, couchers de soleil mondialement célèbres. C'est ici que se trouvent les villas les plus impressionnantes et discrètes de l'île. Marché limité, demande très forte.</p></div>
            <div className="explainer-item"><div className="explainer-num">03</div><div className="explainer-divider"></div><h3>San Juan et Portinatx</h3><p>Le nord préservé. Criques cachées, marchés artisanaux, ambiance bohème raffinée. Offre très limitée mais grande valeur patrimoniale. Pour qui cherche l'Ibiza la moins commerciale.</p></div>
            <div className="explainer-item"><div className="explainer-num">04</div><div className="explainer-divider"></div><h3>Roca Llisa et Cap Martinet</h3><p>Communautés fermées avec golf et beach club. Sécurité et services maximaux. Les prix les plus élevés de l'île, mais l'infrastructure la plus complète pour une résidence secondaire.</p></div>
            <div className="explainer-item"><div className="explainer-num">05</div><div className="explainer-divider"></div><h3>Talamanca et Marina Botafoch</h3><p>Près de la ville, avec marina de superyachts. Appartements de luxe et penthouses avec vue port. Pour qui combine vie urbaine, gastronomie et proximité d'Ibiza ville.</p></div>
            <div className="explainer-item"><div className="explainer-num">06</div><div className="explainer-divider"></div><h3>San Carlos et Las Dalias</h3><p>L'arrière-pays authentique, ambiance bohème. Fincas restaurées, oliveraies, vignobles. Pour qui cherche le lien avec la culture ibicenca traditionnelle. Point d'entrée plus accessible.</p></div>
          </div>
        </div>
      </section>

      <section className="our-homes-section">
        <div className="results-bar" style={{padding:'2rem 1.5rem 1rem'}}>
          <h2 style={{margin:0, fontFamily:'var(--font-playfair, Georgia, serif)', fontSize:'clamp(1.5rem, 3vw, 2rem)', color:'#2C4A5E', textAlign:'center'}}>Biens disponibles à Ibiza</h2>
          <p className="results-count" style={{textAlign:'center', marginTop:'0.5rem'}}>{properties.length} {properties.length === 1 ? 'bien disponible' : 'biens disponibles'} en copropriété</p>
        </div>
        <div className="homes-grid-wrap">
          {properties.length > 0 ? (
            <div className="homes-grid">{properties.map(p => <PropertyCard key={p.slug} property={p} />)}</div>
          ) : (
            <div className="no-results" style={{padding:'3rem 1rem'}}><p>Aucun bien disponible à Ibiza pour le moment. <a href="#newsletter">Inscrivez-vous</a> pour être prévenu des nouvelles annonces.</p></div>
          )}
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
