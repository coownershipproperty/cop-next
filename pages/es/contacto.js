import Head from 'next/head';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import hreflangLinks from '@/components/HreflangLinks';

export default function Contacto() {
  return (
    <>
      <Head>
        <title>Contacto | Co-Ownership Property</title>
        <meta name="description" content="Habla con el equipo de COP. ¿Preguntas sobre copropiedad fraccionada? Respondemos en pocas horas — sin presión comercial, sin compromiso." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://co-ownership-property.com/es/contacto/" />
        {hreflangLinks({ englishPath: '/contact' })}
        <meta property="og:title" content="Contacta con Co-Ownership Property" />
        <meta property="og:description" content="¿Preguntas sobre copropiedad fraccionada? Habla con nuestro equipo — sin presión comercial, sin compromiso." />
        <meta property="og:url" content="https://co-ownership-property.com/es/contacto/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_ES" />
      </Head>
      <Header />

      <section className="page-hero">
        <p className="eyebrow">Estamos aquí para ayudar</p>
        <h1>Ponte en <em>contacto</em></h1>
        <p className="subtitle">¿Preguntas sobre copropiedad, una propiedad concreta, o simplemente quieres entender cómo funciona todo? Te daremos respuestas claras — sin presión comercial.</p>
      </section>

      <section className="trust-sec">
        <div className="trust-inner">
          <p className="eyebrow" style={{textAlign: 'center'}}>Cómo trabajamos</p>
          <h2 style={{textAlign: 'center', fontSize: 'clamp(1.8rem,3.5vw,2.4rem)', marginBottom: '0'}}>Qué esperar cuando nos contactas</h2>
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">&#x2709;</div>
              <h3>Escríbenos directamente</h3>
              <p>¿Prefieres escribir? Contáctanos en<br /><a href="mailto:info@co-ownership-property.com">info@co-ownership-property.com</a><br />Leemos cada mensaje personalmente.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">&#x23F0;</div>
              <h3>Respuesta rápida</h3>
              <p>Solemos responder en pocas horas — a menudo más rápido. Para consultas de EE. UU., ten en cuenta la diferencia horaria. Siempre te contestaremos.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">&#x2713;</div>
              <h3>Sin presión, sin compromiso</h3>
              <p>Hacemos preguntas, te orientamos hacia las propiedades adecuadas, y dejamos la decisión enteramente en tus manos. Somos independientes — no estamos vinculados a ninguna plataforma o promotora.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="links-sec">
        <div className="links-inner">
          <p className="eyebrow" style={{textAlign: 'center'}}>¿Sigues investigando?</p>
          <h2 style={{textAlign: 'center', fontSize: 'clamp(1.6rem,3vw,2.2rem)', marginBottom: '0'}}>¿Aún no listo para contactar?</h2>
          <div className="links-grid">
            <a href="/es/como-funciona/" className="link-card">
              <span className="link-cat">Cómo funciona</span>
              <span className="link-title">El proceso de compra, paso a paso</span>
              <span className="link-desc">Desde la primera consulta hasta los contratos firmados — qué ocurre, en qué orden, y qué necesitas preparar.</span>
              <span className="link-arrow">Leer la guía &rarr;</span>
            </a>
            <a href="/es/copropiedad/" className="link-card">
              <span className="link-cat">La comparación</span>
              <span className="link-title">Copropiedad vs. comprar la propiedad entera</span>
              <span className="link-desc">Uso, costes, revalorización y salida — expuestos uno al lado del otro sin marketing.</span>
              <span className="link-arrow">Ver comparación &rarr;</span>
            </a>
            <a href="/all-our-blog/" className="link-card">
              <span className="link-cat">Nuestro blog</span>
              <span className="link-title">Análisis de mercado y guías para compradores</span>
              <span className="link-desc">Artículos en profundidad sobre destinos, aspectos legales, retornos de inversión y todo lo que un comprador inteligente necesita saber.</span>
              <span className="link-arrow">Ver artículos &rarr;</span>
            </a>
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/contact.js" strategy="afterInteractive" />
    </>
  );
}
