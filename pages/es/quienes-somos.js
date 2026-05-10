import Head from 'next/head';
import Image from 'next/image';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';

export default function QuienesSomos() {
  return (
    <>
      <Head>
        <title>Quiénes somos | Co-Ownership Property</title>
        <meta name="description" content="Conoce al equipo detrás de Co-Ownership Property. Fundada en 2022 por David Olsson, ayudamos a compradores inteligentes a acceder a segundas residencias de lujo a través de la copropiedad fraccionada." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://co-ownership-property.com/es/quienes-somos/" />
        <HreflangLinks englishPath="/about-us" />
        <meta property="og:title" content="Quiénes somos | Co-Ownership Property" />
        <meta property="og:description" content="Conoce al equipo que ayuda a compradores inteligentes a acceder a segundas residencias de lujo a través de la copropiedad." />
        <meta property="og:url" content="https://co-ownership-property.com/es/quienes-somos/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2025/11/ibiza-villa.jpg" />
      </Head>
      <Header />

      <section className="page-hero">
        <p className="eyebrow">Nuestra historia</p>
        <h1>Quiénes <em>somos</em></h1>
        <p className="subtitle">Conoce al equipo dedicado a hacer accesible, transparente e inteligente la propiedad de una segunda residencia de lujo.</p>
      </section>

      <div className="press-bar" role="region" aria-label="Aparecemos en">
        <div className="press-bar-header"><span className="press-bar-label">Aparecemos en</span></div>
        <div className="press-marquee-wrap"><div className="press-track-outer">
          <div className="press-track">
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-times.png" alt="The Times" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-ft.png" alt="Financial Times" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-dailymail.png" alt="Daily Mail" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-forbes.png" alt="Forbes" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-express.png" alt="Express" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-businessinsider.png" alt="Business Insider" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-luxtravel.png" alt="Luxury Travel Magazine" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-rollingstone.png" alt="Rolling Stone" width={200} height={50} /></div>
          </div>
          <div className="press-track" aria-hidden="true">
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-times.png" alt="" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-ft.png" alt="" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-dailymail.png" alt="" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-forbes.png" alt="" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-express.png" alt="" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-businessinsider.png" alt="" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-luxtravel.png" alt="" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-rollingstone.png" alt="" width={200} height={50} /></div>
          </div>
        </div></div>
      </div>

      <section className="sec intro-sec">
        <div className="intro-center">
          <p className="eyebrow">Quiénes somos</p>
          <h2>Una agencia para <em>copropiedad</em> premium</h2>
          <p>Desde 2022, Co-Ownership Property se ha dedicado exclusivamente a segundas residencias en propiedad fraccionada premium en los destinos más deseados del mundo.</p>
          <p>Actuando 100% del lado del comprador, colaboramos solo con los operadores más reputados, transparentes y profesionalmente gestionados de Europa y Estados Unidos. No estamos vinculados a ninguna plataforma o promotora en concreto. Si una propiedad no cumple nuestros estándares, no aparece en este sitio.</p>
        </div>
      </section>

      <section className="sec team-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
          <p className="eyebrow">El equipo</p>
          <h2>Conoce a las personas <em>detrás de COP</em></h2>

          <div className="team-grid">
            <div className="team-card">
              <div className="team-photo">
                <Image src="/wp-content/uploads/2025/11/unnamed-4-1.jpg" alt="David Olsson" fill style={{objectFit:"cover"}} sizes="140px" />
              </div>
              <h3>David Olsson</h3>
              <span className="team-role">Fundador</span>
              <p className="team-bio">Más de 20 años vendiendo propiedades premium de esquí en más de 40 estaciones alpinas francesas. David vio cómo el mercado se transformaba y los clientes que antes podían comprar quedaban progresivamente fuera del mercado. Fundó COP en 2022 porque creía que las propiedades excepcionales debían pertenecer a quienes las aman — no solo a quienes pueden permitírselas íntegramente.</p>
            </div>
            <div className="team-card">
              <div className="team-photo">
                <Image src="/wp-content/uploads/2025/12/1761762811297.jpg" alt="Dylan Olsson" fill style={{objectFit:"cover"}} sizes="140px" />
              </div>
              <h3>Dylan Olsson</h3>
              <span className="team-role">Ventas</span>
              <p className="team-bio">Criado entre Londres y Marbella, con raíces en cuatro países, Dylan creció con un instinto natural para entender al comprador internacional. Tras graduarse en negocios por la Universidad de Manchester, se propuso reducir la distancia entre la aspiración y la realidad — haciendo accesibles las viviendas vacacionales de alta gama a más personas mediante un enfoque transparente centrado en el cliente.</p>
            </div>
            <div className="poppy-card">
              <div className="team-photo">
                <Image src="/wp-content/uploads/2025/11/unnamed-8.jpg" alt="Poppy" fill style={{objectFit:"cover"}} sizes="140px" />
              </div>
              <div>
                <h3 style={{color: '#fff'}}>Poppy</h3>
                <span className="team-role">Jefa de seguridad</span>
                <p className="team-bio">Tolerancia cero con ardillas, carteros y gatos no autorizados. Se sabe que acepta sobornos en forma de queso cheddar o caricias en la barriga.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec story-sec">
        <div className="sec-inner">
          <div className="story-grid">
            <div className="story-img">
              <Image src="/wp-content/uploads/2026/02/1920-x-1080-px-resale-ski-chalet-interior.jpg" alt="Interior de chalet alpino de lujo" fill quality={90} style={{objectFit:"cover"}} sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
            <div className="story-text">
              <p className="eyebrow">Por qué empezamos</p>
              <h2>Un mercado que dejaba <em>gente atrás</em></h2>
              <p>David pasó más de dos décadas vendiendo propiedades premium en los Alpes franceses. En los primeros años, los tipos hipotecarios franceses estaban por debajo del 2%, los plazos llegaban a 25 años, y los precios en estaciones alpinas — aunque nunca baratos — guardaban una relación razonable con los de París. Comprar una propiedad de esquí era una aspiración realista para una familia profesional.</p>
              <p>Ese mundo desapareció gradualmente. Entre 2017 y 2022, los precios en las estaciones más demandadas subieron entre un 30% y un 50%, en algunas zonas superando los precios por metro cuadrado de París. El chalet en Méribel, el piso en Chamonix — se habían convertido en territorio de compradores en efectivo.</p>
              <blockquote>Los clientes con los que había trabajado durante años seguían queriendo comprar — pero ya no podían permitírselo. Simplemente, los precios se habían disparado.
                <span className="quote-attr">David Olsson — Fundador</span>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" style={{background: 'var(--white)'}}>
        <div className="sec-inner">
          <div className="story-grid">
            <div className="story-text">
              <p className="eyebrow">La solución</p>
              <h2>Una mejor forma de <em>poseer</em></h2>
              <p>Cuando una propiedad alpina entera puede requerir hoy más de 800.000 €, una participación fraccionada pone la propiedad real al alcance desde aproximadamente 100.000 €. Posees una participación registrada de una propiedad premium, se revaloriza con el mercado, y decides cuándo vender.</p>
              <p>Una sola fracción de 1/8 te da seis semanas de uso al año — 45 días. El propietario medio de una segunda residencia usa su propiedad solo 35 días al año, así que una participación fraccionada ya supera el uso personal típico.</p>
              <p>Y no hay nada que te impida ir más allá: comprar dos participaciones de la misma propiedad, o combinar una en un chalet alpino con otra en una villa de Ibiza. Las propiedades funcionan de forma independiente, la estructura de propiedad es la misma, y tu calendario es tuyo para organizar.</p>
              <blockquote>La segunda residencia media está vacía 330 días al año. Una fracción te da más tiempo en una propiedad excepcional — por una fracción del coste.</blockquote>
            </div>
            <div className="story-img">
              <Image src="/wp-content/uploads/2025/11/ibiza-villa.jpg" alt="Villa de Ibiza con piscina" fill quality={90} style={{objectFit:"cover"}} sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      <section style={{background: 'var(--blue)', padding: '60px 3rem', textAlign: 'center'}}>
        <p style={{fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem'}}>¿Listo para encontrar tu segunda residencia?</p>
        <div style={{display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap'}}>
          <a href="#speak-to-expert" style={{display: 'inline-block', padding: '14px 36px', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Nunito Sans',sans-serif", background: 'var(--warm-gold)', color: '#fff', textDecoration: 'none'}}>Hablar con un experto</a>
          <a href="#newsletter" style={{display: 'inline-block', padding: '13px 36px', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Nunito Sans',sans-serif", background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', textDecoration: 'none'}}>Suscribirme al boletín</a>
        </div>
      </section>

      <section className="sec testi-sec" style={{background: 'var(--cream-bg)'}}>
        <div className="sec-inner" style={{textAlign: 'center'}}>
          <p className="eyebrow">Lo que dicen nuestros clientes</p>
          <h2>Propietarios reales, historias <em>reales</em></h2>

          <div className="testi-grid">
            <div className="testi-card">
              <div className="testi-photo"><Image src="/wp-content/uploads/2026/02/Hedda-testimonial-south-of-France.jpg" alt="Astrid" fill style={{objectFit:"cover"}} sizes="90px" /></div>
              <div className="testi-name">Astrid</div>
              <span className="testi-loc">Mougins, sur de Francia</span>
              <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testi-quote">Desde la primera estancia, todo fue muy sencillo. Es como llegar a tu propia casa con la comodidad de un hotel. Las camas hechas, las toallas listas — nada en lo que pensar. Cada visita empieza con calma, no con tareas. Ya me encanta, y no tengo que preocuparme por nada.</p>
            </div>
            <div className="testi-card">
              <div className="testi-photo"><Image src="/wp-content/uploads/2026/02/Middle-aged-couple-from-the-UK-with-mountain-and-ski-slopes-behind.-La-Plagne.jpg" alt="Harry y Nicole" fill style={{objectFit:"cover"}} sizes="90px" /></div>
              <div className="testi-name">Harry y Nicole</div>
              <span className="testi-loc">La Plagne, Alpes franceses</span>
              <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testi-quote">Tener una casa en los Alpes franceses siempre había sido un sueño. La copropiedad ofrecía la solución perfecta — todas las ventajas de una casa de montaña de lujo sin el estrés y el coste de gestionar una propiedad entera. Nuestro hijo ahora puede invitar a sus amigos del colegio a esquiar en vacaciones. Realmente hizo nuestro sueño realidad.</p>
            </div>
            <div className="testi-card">
              <div className="testi-photo"><Image src="/wp-content/uploads/2026/02/Young-couple-from-LA-review-about-Lake-Tahoe-property.jpg" alt="Mateo y Anne" fill style={{objectFit:"cover"}} sizes="90px" /></div>
              <div className="testi-name">Mateo y Anne</div>
              <span className="testi-loc">Lago Tahoe, California</span>
              <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testi-quote">Llevamos años subiendo de Los Ángeles a Tahoe cada verano, pero no podíamos justificar una casa entera. Este modelo nos pareció el término medio perfecto. Por fin tenemos un trozo de esa tierra sin la culpa de una hipoteca infrautilizada. Transparente desde el primer día — no podríamos estar más contentos.</p>
            </div>
            <div className="testi-card">
              <div className="testi-photo"><Image src="/wp-content/uploads/2026/02/Family-swimming-in-Mallorca-300x300.jpg" alt="Jan y familia" fill style={{objectFit:"cover"}} sizes="90px" /></div>
              <div className="testi-name">Jan y familia</div>
              <span className="testi-loc">Port d'Andratx, Mallorca</span>
              <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testi-quote">Vendí mi casa de vacaciones en Francia, me quedé con la plusvalía y usé solo una cuarta parte para comprar una villa mucho mejor. Sin culpas. La villa es espectacular, los niños la adoran, y las semanas que no usamos se alquilan — más que cubriendo los gastos mensuales. Muy recomendable.</p>
            </div>
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/about-us.js" strategy="afterInteractive" />
    </>
  );
}
