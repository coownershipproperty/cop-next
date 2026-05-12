import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import PropertyCard from '@/components/PropertyCard';
import HreflangLinks from '@/components/HreflangLinks';
import { createClient } from '@supabase/supabase-js';

// Destination landing page: /es/destinos/mallorca/
// Targets per keyword-research-spanish.md:
//   • copropiedad Mallorca (~)
//   • segunda residencia Mallorca fraccionada
//   • comprar fracción casa Mallorca
//   • mejores zonas Mallorca segunda residencia
// Vivla covers Mallorca with marketing posts but has no proper destination
// landing page. This page is the SEO answer.

export async function getStaticProps() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data } = await supabase
    .from('properties')
    .select('slug, title, title_es, title_fr, img, images, total_images, drive_url, price, currency, country, region, city, beds, size, status, property_type')
    .eq('country', 'Spain')
    .eq('region', 'Mallorca')
    .limit(24);

  const properties = (data || []).map(p => ({
    slug: p.slug, title: p.title, title_es: p.title_es || null, title_fr: p.title_fr || null,
    img: p.img, images: (p.images || []).slice(0, 3),
    totalImages: p.total_images || 0, driveUrl: p.drive_url || null,
    price: p.price || null, currency: p.currency || 'EUR',
    country: p.country, region: p.region, city: p.city || '',
    beds: p.beds || 0, size: p.size || 0,
    label: '', status: p.status || '', property_type: p.property_type || '',
  }));

  return { props: { properties }, revalidate: 3600 };
}

export default function MallorcaES({ properties }) {
  const canonicalUrl = 'https://co-ownership-property.com/es/destinos/mallorca/';
  return (
    <>
      <Head>
        <title>Copropiedad en Mallorca: villas y apartamentos en propiedad fraccionada [2026]</title>
        <meta name="description" content="Propiedades en copropiedad en Mallorca — villas, apartamentos y fincas en Palma, Pollensa, Andratx, Deià y otras zonas premium. Desde 1/8 con escritura ante notario." />
        <link rel="canonical" href={canonicalUrl} />
        <HreflangLinks englishPath="/es/destinos/mallorca" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:title" content="Copropiedad en Mallorca: la guía completa" />
        <meta property="og:description" content="Villas y apartamentos de lujo en copropiedad por toda Mallorca. Desde una fracción del precio." />
        <meta property="og:url" content={canonicalUrl} />
      </Head>
      <Header />

      <section className="page-hero">
        <p className="eyebrow">Destino · Islas Baleares</p>
        <h1>Copropiedad en <em>Mallorca</em></h1>
        <p className="subtitle">Villas, apartamentos y fincas en copropiedad por las zonas más exclusivas de la isla más codiciada del Mediterráneo.</p>
      </section>

      <section className="sec intro-sec">
        <div className="intro-center">
          <p className="eyebrow">Por qué Mallorca</p>
          <h2>La isla que combina <em>todo</em></h2>
          <p>Mallorca es, sin discusión, el destino europeo más sólido para la inversión en una segunda residencia. Combina lo que ningún otro destino mediterráneo ofrece a la vez: <strong>buena conectividad aérea</strong> (vuelos directos desde casi todas las capitales europeas), <strong>infraestructura premium</strong> en hostelería, gastronomía y servicios, <strong>clima durante todo el año</strong> que reparte el uso entre estaciones, y <strong>revalorización inmobiliaria constante</strong> en las zonas premium.</p>
          <p>Para la copropiedad, esto se traduce en algo concreto: una villa con piscina en una zona como Pollensa, Andratx o Son Vida, que costaría 1,5 a 3 millones de euros adquirida íntegramente, está al alcance desde aproximadamente <strong>180.000 a 350.000 euros por una fracción de 1/8</strong>, con derecho a 6 semanas anuales de uso exclusivo y todos los gastos repartidos entre los copropietarios.</p>
        </div>
      </section>

      <section className="sec" style={{background: 'var(--white)'}}>
        <div className="sec-inner">
          <h2 style={{textAlign:'center', fontSize:'clamp(1.6rem, 3vw, 2.2rem)', marginBottom:'2rem'}}>Las mejores zonas de Mallorca para copropiedad</h2>

          <div className="explainer-grid">
            <div className="explainer-item">
              <div className="explainer-num">01</div>
              <div className="explainer-divider"></div>
              <h3>Pollensa y Port de Pollença</h3>
              <p>El norte tradicional. Atrae a familias británicas y alemanas. Mercado estable, calidad de vida alta, demanda turística sostenida. Las villas con piscina en zonas como Cala San Vicente y Formentor son las más demandadas.</p>
            </div>
            <div className="explainer-item">
              <div className="explainer-num">02</div>
              <div className="explainer-divider"></div>
              <h3>Andratx y Port d'Andratx</h3>
              <p>El suroeste exclusivo. Vistas espectaculares al mar y la Sierra de Tramuntana. Cero turismo masivo. Aquí se concentran las propiedades de gama más alta de la isla. Excelente para copropietarios que buscan privacidad.</p>
            </div>
            <div className="explainer-item">
              <div className="explainer-num">03</div>
              <div className="explainer-divider"></div>
              <h3>Deià y Sóller</h3>
              <p>El corazón cultural. Patrimonio de la Humanidad UNESCO. Casas señoriales de piedra, ambiente artístico, restaurantes de nivel. Inventario limitado y demanda alta — muy buena revalorización histórica.</p>
            </div>
            <div className="explainer-item">
              <div className="explainer-num">04</div>
              <div className="explainer-divider"></div>
              <h3>Son Vida y Bendinat</h3>
              <p>La Mallorca residencial premium cerca de Palma. Campos de golf de campeonato, club de polo, máxima seguridad. Combinación perfecta para quien quiere acceso urbano a Palma + privacidad residencial.</p>
            </div>
            <div className="explainer-item">
              <div className="explainer-num">05</div>
              <div className="explainer-divider"></div>
              <h3>Palma y Santa Catalina</h3>
              <p>Para los que prefieren ciudad: Palma combina cultura, marina, gastronomía y arquitectura histórica. El barrio de Santa Catalina es la zona más vibrante. Apartamentos de gama alta a partir de 100.000 € por fracción.</p>
            </div>
            <div className="explainer-item">
              <div className="explainer-num">06</div>
              <div className="explainer-divider"></div>
              <h3>Costa de los Pinos y Cala Bona</h3>
              <p>El este más tranquilo. Calas vírgenes, urbanizaciones residenciales de los años 70-80 ahora siendo renovadas. Punto de entrada más accesible. Ideal para un primer paso en copropiedad mallorquina.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="our-homes-section">
        <div className="results-bar" style={{padding:'2rem 1.5rem 1rem'}}>
          <h2 style={{margin:0, fontFamily:'var(--font-playfair, Georgia, serif)', fontSize:'clamp(1.5rem, 3vw, 2rem)', color:'#2C4A5E', textAlign:'center'}}>Propiedades disponibles en Mallorca</h2>
          <p className="results-count" style={{textAlign:'center', marginTop:'0.5rem'}}>{properties.length} {properties.length === 1 ? 'propiedad disponible' : 'propiedades disponibles'} en copropiedad</p>
        </div>

        <div className="homes-grid-wrap">
          {properties.length > 0 ? (
            <div className="homes-grid">
              {properties.map(p => <PropertyCard key={p.slug} property={p} />)}
            </div>
          ) : (
            <div className="no-results" style={{padding:'3rem 1rem'}}>
              <p>No hay propiedades disponibles en Mallorca en este momento. <a href="#newsletter">Suscríbete</a> para que te avisemos cuando añadamos nuevas.</p>
            </div>
          )}
        </div>
      </section>

      <section className="sec faq-sec">
        <div className="sec-inner" style={{textAlign:'center'}}>
          <p className="eyebrow">Preguntas frecuentes</p>
          <h2>Copropiedad en Mallorca: lo que <em>debes saber</em></h2>
        </div>
        <ul className="faq-list">
          <li className="faq-item"><details><summary><h3>¿Cuánto cuesta una fracción de propiedad en Mallorca?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>El rango típico para una fracción de 1/8 en Mallorca en 2026 va desde <strong>100.000 € para apartamentos en Palma</strong> hasta <strong>500.000 € para villas premium en Andratx, Son Vida o Deià</strong>. Las villas con piscina en zonas medias como Pollensa o Cala d'Or se mueven entre 180.000 y 280.000 € por 1/8.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>¿Cómo se estructura legalmente?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>El modelo profesional estándar utiliza una Sociedad Limitada (SL) cuyo único activo es la vivienda. Compras participaciones de esa SL ante notario, lo que te otorga propiedad legal de tu fracción. La SL es titular registral del inmueble en el Registro de la Propiedad de Mallorca. Estatutos sociales fijan el calendario de uso, gastos y derechos de reventa.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>¿Qué impuestos se pagan en Mallorca?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Al comprar: ITP del 1-1,5% sobre el valor de las participaciones (régimen general en Baleares para SL no inmobiliarias puras). Anualmente: IBI municipal pagado por la SL y repartido proporcionalmente, más IRPF de no residentes si aplica. Los tipos balear están entre los más favorables de España para no residentes.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>¿Puedo alquilar mi semana cuando no la uso?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>En Mallorca, el alquiler vacacional está regulado: necesitas licencia turística específica de la Consellería de Turismo del Gobierno Balear. Algunos operadores de copropiedad gestionan esta parte por ti — pregúntalo antes de firmar. Sin licencia, el alquiler vacacional no es legal en Baleares.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>¿Es buen momento para comprar en Mallorca?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Los precios en Mallorca han subido aproximadamente un 35% entre 2019 y 2025 según los principales índices inmobiliarios. La demanda extranjera (alemana, británica, escandinava) sigue muy alta y la oferta de obra nueva está limitada por la moratoria de licencias. Tendencia: precios estables o en alza moderada en zonas premium. La copropiedad permite acceso a este mercado a una fracción del coste.</p></div></details></li>
        </ul>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
