import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import PropertyCard from '@/components/PropertyCard';
import HreflangLinks from '@/components/HreflangLinks';
import { createClient } from '@supabase/supabase-js';

// Destination FR : /fr/destinations/mallorque/
// Cible identifiée par keyword-research-french.md :
// résidence secondaire Mallorque (~4 000 mo. — destination #1 des Français
// à l'étranger), copropriété Mallorque, acheter villa Mallorque.
// Aucun acteur français n'a de page destination dédiée à Mallorque.

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data } = await supabase
    .from('properties')
    .select('slug, title, title_es, title_fr, img, images, total_images, drive_url, price, currency, share_denominator, country, region, city, beds, size, status, property_type')
    .eq('country', 'Spain')
    .eq('region', 'Mallorca')
    .limit(24);

  const properties = (data || []).map(p => ({
    slug: p.slug, title: p.title, title_es: p.title_es || null, title_fr: p.title_fr || null,
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

export default function MallorqueFR({ properties }) {
  const canonicalUrl = 'https://co-ownership-property.com/fr/destinations/mallorque/';
  return (
    <>
      <Head>
        <title>Résidence secondaire à Mallorque : copropriété et villas en quote-part [2026]</title>
        <meta name="description" content="Devenez copropriétaire d'une résidence secondaire à Mallorque — villas, appartements et fincas dans les meilleures zones (Palma, Pollensa, Andratx, Deià). À partir d'1/8 avec acte authentique." />
        <link rel="canonical" href={canonicalUrl} />
        <HreflangLinks englishPath="/fr/destinations/mallorque" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:title" content="Résidence secondaire à Mallorque : guide complet de la copropriété" />
        <meta property="og:description" content="Villas et appartements de luxe en copropriété à Mallorque. Pour une fraction du prix." />
        <meta property="og:url" content={canonicalUrl} />
      </Head>
      <Header />

      <section className="page-hero">
        <p className="eyebrow">Destination · Îles Baléares</p>
        <h1>Copropriété à <em>Mallorque</em></h1>
        <p className="subtitle">Villas, appartements et fincas en copropriété dans les zones les plus prisées de l'île préférée des acheteurs français à l'étranger.</p>
      </section>

      <section className="sec intro-sec">
        <div className="intro-center">
          <p className="eyebrow">Pourquoi Mallorque</p>
          <h2>L'île qui réunit <em>tout</em></h2>
          <p>Mallorque est, sans débat, la <strong>destination étrangère préférée des Français</strong> pour une résidence secondaire en Méditerranée. Elle combine ce qu'aucune autre destination ne propose simultanément : <strong>excellente connectivité aérienne</strong> (vols directs depuis Paris, Lyon, Marseille, Bordeaux et Nantes en moins de 2h30), <strong>infrastructure premium</strong> en hôtellerie, gastronomie et services, <strong>climat doux toute l'année</strong> qui répartit l'usage entre saisons, et <strong>valorisation immobilière constante</strong> dans les zones premium.</p>
          <p>Pour la copropriété, cela se traduit concrètement : une villa avec piscine dans une zone comme Pollensa, Andratx ou Son Vida, qui coûterait 1,5 à 3 millions d'euros à acquérir intégralement, est accessible à partir d'environ <strong>180 000 à 350 000 € par quote-part de 1/8</strong>, avec droit à 45 nuits annuelles d'usage exclusif et tous les frais répartis entre copropriétaires.</p>
        </div>
      </section>

      <section className="sec" style={{background: 'var(--white)'}}>
        <div className="sec-inner">
          <h2 style={{textAlign:'center', fontSize:'clamp(1.6rem, 3vw, 2.2rem)', marginBottom:'2rem'}}>Les meilleures zones de Mallorque pour la copropriété</h2>

          <div className="explainer-grid">
            <div className="explainer-item">
              <div className="explainer-num">01</div>
              <div className="explainer-divider"></div>
              <h3>Pollensa et Port de Pollença</h3>
              <p>Le nord traditionnel. Attire les familles françaises, britanniques et allemandes. Marché stable, qualité de vie élevée, demande touristique soutenue. Les villas avec piscine vers Cala San Vicente et Formentor sont les plus demandées.</p>
            </div>
            <div className="explainer-item">
              <div className="explainer-num">02</div>
              <div className="explainer-divider"></div>
              <h3>Andratx et Port d'Andratx</h3>
              <p>Le sud-ouest exclusif. Vues spectaculaires sur la mer et la Sierra de Tramuntana. Pas de tourisme de masse. C'est ici que se concentrent les biens haut de gamme de l'île. Idéal pour les copropriétaires recherchant la discrétion.</p>
            </div>
            <div className="explainer-item">
              <div className="explainer-num">03</div>
              <div className="explainer-divider"></div>
              <h3>Deià et Sóller</h3>
              <p>Le cœur culturel. Patrimoine mondial UNESCO. Maisons en pierre seigneuriales, ambiance artistique, restaurants gastronomiques. Offre limitée et demande forte — excellente valorisation historique.</p>
            </div>
            <div className="explainer-item">
              <div className="explainer-num">04</div>
              <div className="explainer-divider"></div>
              <h3>Son Vida et Bendinat</h3>
              <p>La Mallorque résidentielle premium près de Palma. Golfs de championnat, club de polo, sécurité maximale. Combinaison idéale pour qui veut un accès urbain à Palma + une vie résidentielle privée.</p>
            </div>
            <div className="explainer-item">
              <div className="explainer-num">05</div>
              <div className="explainer-divider"></div>
              <h3>Palma et Santa Catalina</h3>
              <p>Pour ceux qui préfèrent la ville : Palma combine culture, marina, gastronomie et architecture historique. Le quartier de Santa Catalina est le plus vibrant. Appartements haut de gamme à partir de 100 000 € la quote-part.</p>
            </div>
            <div className="explainer-item">
              <div className="explainer-num">06</div>
              <div className="explainer-divider"></div>
              <h3>Côte des Pins et Cala Bona</h3>
              <p>L'est plus paisible. Criques préservées, lotissements résidentiels des années 70-80 en cours de rénovation. Point d'entrée plus accessible. Idéal pour une première copropriété mallorquine.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="our-homes-section">
        <div className="results-bar" style={{padding:'2rem 1.5rem 1rem'}}>
          <h2 style={{margin:0, fontFamily:'var(--font-playfair, Georgia, serif)', fontSize:'clamp(1.5rem, 3vw, 2rem)', color:'#2C4A5E', textAlign:'center'}}>Biens disponibles à Mallorque</h2>
          <p className="results-count" style={{textAlign:'center', marginTop:'0.5rem'}}>{properties.length} {properties.length === 1 ? 'bien disponible' : 'biens disponibles'} en copropriété</p>
        </div>

        <div className="homes-grid-wrap">
          {properties.length > 0 ? (
            <div className="homes-grid">
              {properties.map(p => <PropertyCard key={p.slug} property={p} />)}
            </div>
          ) : (
            <div className="no-results" style={{padding:'3rem 1rem'}}>
              <p>Aucun bien disponible à Mallorque pour le moment. <a href="#newsletter">Inscrivez-vous</a> pour être prévenu des nouvelles annonces.</p>
            </div>
          )}
        </div>
      </section>

      <section className="sec faq-sec">
        <div className="sec-inner" style={{textAlign:'center'}}>
          <p className="eyebrow">Questions fréquentes</p>
          <h2>Copropriété à Mallorque : ce qu'il <em>faut savoir</em></h2>
        </div>
        <ul className="faq-list">
          <li className="faq-item"><details><summary><h3>Combien coûte une quote-part à Mallorque ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>La fourchette typique pour une quote-part de 1/8 à Mallorque en 2026 : <strong>100 000 € pour des appartements à Palma</strong>, <strong>jusqu'à 500 000 € pour des villas premium à Andratx, Son Vida ou Deià</strong>. Les villas avec piscine dans les zones intermédiaires comme Pollensa ou Cala d'Or se situent entre 180 000 et 280 000 € la quote-part.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>Comment est-ce structuré juridiquement ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Le modèle professionnel utilise une LLC (Limited Liability Company) constituée spécifiquement pour le bien — la même structure utilisée de manière homogène à travers notre portefeuille international. Vous acquérez un membership interest dans cette LLC devant notaire, ce qui vous confère le bien légale de votre quote-part. La LLC est inscrite comme propriétaire au Registre de la Bien de Mallorque. L'operating agreement fixe le calendrier d'usage, les frais et les règles de revente.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>Quelle fiscalité pour un acheteur français ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>À l'achat : ITP (droits d'enregistrement) de 1 à 1,5% sur la valeur des parts (régime espagnol pour SL non purement immobilière). Annuellement : IBI municipal payé par la SL et réparti au prorata, plus impôt sur le revenu des non-résidents (IRNR) en Espagne — convention fiscale franco-espagnole évite la double imposition. Côté français : votre quote-part entre dans votre patrimoine IFI au prorata.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>Puis-je louer ma semaine quand je ne l'utilise pas ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>À Mallorque, la location de vacances est strictement réglementée : il faut une licence touristique spécifique délivrée par le gouvernement balear. Certains opérateurs de copropriété gèrent cet aspect — demandez avant de signer. Sans licence, la location de vacances n'est pas légale aux Baléares et expose à des amendes importantes.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>Est-ce le bon moment pour acheter à Mallorque ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Les prix à Mallorque ont augmenté d'environ 35% entre 2019 et 2025 selon les principaux indices immobiliers. La demande étrangère (allemande, britannique, française, scandinave) reste très forte et l'offre de neuf est limitée par le moratoire des licences. Tendance : prix stables ou en hausse modérée dans les zones premium. La copropriété donne accès à ce marché à une fraction du coût.</p></div></details></li>
        </ul>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
