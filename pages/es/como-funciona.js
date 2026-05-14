import Head from 'next/head';
import Image from 'next/image';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';

// Spanish equivalent of /how-it-works/. Uses the same CSS classes from
// globals.css (page-hero, sec, intro-grid, benefits-grid, compare-table,
// model-flow, faq-list) so the design matches the English page exactly.
//
// Terminology baked in from keyword-research-spanish.md:
//   • copropiedad — primary product term
//   • propiedad fraccionada — secondary, used in title tag for search volume
//   • multipropiedad — only used in comparison contexts (timeshare in Spanish)

export default function ComoFunciona() {
  return (
    <>
      <Head>
        <title>Cómo funciona la copropiedad | Propiedad fraccionada explicada — COP</title>
        <meta name="description" content="Aprende cómo funciona la copropiedad y la propiedad fraccionada de viviendas vacacionales. Compra una participación registrada en propiedades de lujo en España y Europa, y comparte solo los gastos." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/es/como-funciona/" />
        <HreflangLinks englishPath="/how-it-works" />
        <meta property="og:title" content="Cómo funciona la copropiedad | Propiedad fraccionada explicada" />
        <meta property="og:description" content="Aprende cómo funciona la copropiedad de viviendas vacacionales de lujo en España y Europa por una fracción del precio." />
        <meta property="og:url" content="https://co-ownership-property.com/es/como-funciona/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/02/1920-x-1080-px-resale-ski-chalet-interior.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header />

      {/* ===== HERO ===== */}
      <section className="page-hero">
        <p className="eyebrow">Copropiedad explicada</p>
        <h1>Cómo <em>funciona</em></h1>
        <p className="subtitle">Posee una participación de una vivienda vacacional de lujo. Disfrútala varias semanas al año. Comparte cada coste. Conserva cada recuerdo.</p>
      </section>

      {/* ===== AS FEATURED IN ===== */}
      <div className="press-bar" role="region" aria-label="Aparecemos en">
        <div className="press-bar-header">
          <span className="press-bar-label">Aparecemos en</span>
        </div>
        <div className="press-marquee-wrap">
          <div className="press-track-outer">
            <div className="press-track">
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-times.png" alt="The Times" width="200" height="50" /></div>
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-ft.png" alt="Financial Times" width="200" height="50" /></div>
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-dailymail.png" alt="Daily Mail" width="200" height="50" /></div>
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-forbes.png" alt="Forbes" width="200" height="50" /></div>
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-express.png" alt="Express" width="200" height="50" /></div>
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-businessinsider.png" alt="Business Insider" width="200" height="50" /></div>
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-luxtravel.png" alt="Luxury Travel Magazine" width="200" height="50" /></div>
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-rollingstone.png" alt="Rolling Stone" width="200" height="50" /></div>
            </div>
            <div className="press-track" aria-hidden="true">
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-times.png" alt="" width="200" height="50" /></div>
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-ft.png" alt="" width="200" height="50" /></div>
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-dailymail.png" alt="" width="200" height="50" /></div>
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-forbes.png" alt="" width="200" height="50" /></div>
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-express.png" alt="" width="200" height="50" /></div>
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-businessinsider.png" alt="" width="200" height="50" /></div>
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-luxtravel.png" alt="" width="200" height="50" /></div>
              <div className="press-logo-item"><img src="/wp-content/uploads/2025/11/press-rollingstone.png" alt="" width="200" height="50" /></div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== EMOTIONAL INTRO ===== */}
      <section className="sec intro-sec">
        <div className="sec-inner">
          <div className="intro-grid">
            <div className="intro-img">
              <Image src="https://cdn.prod.website-files.com/63f61b4f9800c52e560f1914/6910dcda781c75aa91ca0cf7_DJI_0957_58_59_60_61.jpeg" alt="Villa de lujo con piscina en la Costa Azul" fill quality={90} style={{objectFit:'cover'}} sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
            <div className="intro-text">
              <p className="eyebrow">La forma inteligente de poseer</p>
              <h2>Posee una vivienda que vale <em>8 veces</em> tu presupuesto</h2>
              <p className="highlight">Una vivienda vacacional de lujo que costaría millones comprarla sola es tuya por una fracción — con los mismos derechos, la misma escritura y la misma revalorización.</p>
              <p>Con la copropiedad compras una <strong>participación registrada</strong> —típicamente 1/8— de una propiedad premium. Está registrada a tu nombre a través de una sociedad limitada (SL) propia de la propiedad. Disfrutas de la vivienda durante aproximadamente 45 días al año, y todos los costes se reparten proporcionalmente entre los copropietarios.</p>
              <p>Esto no es multipropiedad. No hay puntos, ni clubes, ni truco. Es propiedad inmobiliaria real — del tipo que puedes revender, transmitir a tus hijos, y ver revalorizarse con el tiempo.</p>
              <div className="intro-stats">
                <div>
                  <div className="intro-stat-num">1/8</div>
                  <div className="intro-stat-label">Fracción típica</div>
                </div>
                <div>
                  <div className="intro-stat-num">~45</div>
                  <div className="intro-stat-label">Días / año</div>
                </div>
                <div>
                  <div className="intro-stat-num">360+</div>
                  <div className="intro-stat-label">Propiedades</div>
                </div>
                <div>
                  <div className="intro-stat-num">11</div>
                  <div className="intro-stat-label">Países</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== A TRUSTED TRADITION ===== */}
      <section className="sec heritage-sec">
        <div className="heritage-inner">
          <p className="eyebrow">Una tradición de confianza</p>
          <h2>Esto no es <em>nuevo</em></h2>
          <p>Las familias llevan compartiendo viviendas vacacionales durante siglos. Abuelos que dejan una villa a tres hijos. Primos que heredan un cortijo en la Toscana. Amigos que se juntan para comprar un chalet en los Alpes. La copropiedad es una de las formas más antiguas y naturales de poseer propiedad en Europa.</p>
          <blockquote>Tus abuelos hacían esto. Solo que no tenían una SL para ello.</blockquote>
          <p>En España, la copropiedad —regulada en el Código Civil (Artículos 392-406)— es una figura jurídica clásica. En Francia, la propiedad conjunta se conoce como "indivision". En Italia y Austria, la propiedad compartida de viviendas heredadas ha sido la norma durante generaciones. Lo que ha cambiado no es el concepto — es la infraestructura.</p>
          <p>Hoy, cada propiedad se mantiene en su propia SL con un acuerdo de copropiedad formal, gestión profesional y un calendario justo. Nunca tienes que coordinarte directamente con otros copropietarios. Todo se gestiona por ti. Sin conversaciones incómodas, sin disputas, sin fricciones.</p>
        </div>
      </section>

      {/* ===== WHAT YOU GET ===== */}
      <section className="sec benefits-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
          <p className="eyebrow">Lo que recibes</p>
          <h2>Más que una <em>vivienda vacacional</em></h2>
          <p className="lead" style={{margin: '0 auto'}}>Cada propiedad incluye gestión profesional, protección legal y flexibilidad incorporadas.</p>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">&#x1f3e0;</div>
              <h3>Propiedad real</h3>
              <p>Una participación registrada a tu nombre a través de una SL propia de la propiedad. No es un contrato — es un activo genuino que posees.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">&#x1f4c8;</div>
              <h3>Revalorización</h3>
              <p>Tu fracción se revaloriza como cualquier inversión inmobiliaria. Las ubicaciones premium en España y Europa tienden a crecer de forma constante a lo largo del tiempo.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">&#x1f4b0;</div>
              <h3>Ingresos por alquiler</h3>
              <p>¿No vas a usar tus semanas asignadas? Muchas de nuestras propiedades te permiten alquilarlas y obtener ingresos mientras estás fuera.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">&#x1f504;</div>
              <h3>Intercambio de viviendas</h3>
              <p>La mayoría de las propiedades de nuestro porfolio ofrecen un sistema de intercambio. ¿Te apetece otro destino este año? Intercambia tu estancia con otro copropietario.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">&#x1f5d3;</div>
              <h3>Calendario justo</h3>
              <p>Un calendario rotativo garantiza que cada copropietario obtenga fechas de temporada alta y baja. Verano, Navidad, Semana Santa — todos se turnan equitativamente.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">&#x1f6e0;</div>
              <h3>Totalmente gestionada</h3>
              <p>La gestión profesional se encarga del mantenimiento, reparaciones, limpieza e impuestos locales. Llegas, disfrutas y te vas — el resto está cubierto.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMPARISON ===== */}
      <section className="sec compare-sec">
        <div className="sec-inner">
          <p className="eyebrow">Conoce la diferencia</p>
          <h2>Copropiedad vs. <em>las alternativas</em></h2>
          <p className="lead">No todas las opciones de segunda residencia son iguales. Así se compara la copropiedad.</p>

          <div className="compare-table-scroll">
            <table className="compare-table">
              <thead>
                <tr>
                  <th></th>
                  <th className="compare-highlight">Copropiedad</th>
                  <th>Compra individual</th>
                  <th>Multipropiedad</th>
                  <th>Alquiler vacacional</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Escritura real</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> Sí — participación SL</td>
                  <td><span className="check">&#10003;</span> Sí</td>
                  <td><span className="cross">&#10007;</span> No — contrato de uso</td>
                  <td><span className="cross">&#10007;</span> No</td>
                </tr>
                <tr>
                  <td>Revalorización</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> Beneficio total</td>
                  <td><span className="check">&#10003;</span> Beneficio total</td>
                  <td><span className="cross">&#10007;</span> Suele depreciarse</td>
                  <td><span className="cross">&#10007;</span> Ninguna</td>
                </tr>
                <tr>
                  <td>Coste inicial</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> 1/8 del precio total</td>
                  <td><span className="cross">&#10007;</span> 100% del precio</td>
                  <td><span className="partial">~</span> Variable</td>
                  <td><span className="check">&#10003;</span> Ninguno</td>
                </tr>
                <tr>
                  <td>Gastos corrientes</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> Repartidos 1/8</td>
                  <td><span className="cross">&#10007;</span> 100% sobre ti</td>
                  <td><span className="cross">&#10007;</span> Cuotas anuales fijas</td>
                  <td><span className="partial">~</span> Por estancia</td>
                </tr>
                <tr>
                  <td>Reventa libre</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> Mercado abierto</td>
                  <td><span className="check">&#10003;</span> Mercado abierto</td>
                  <td><span className="cross">&#10007;</span> Muy difícil</td>
                  <td>N/A</td>
                </tr>
                <tr>
                  <td>Transmisión a hijos</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> Sí</td>
                  <td><span className="check">&#10003;</span> Sí</td>
                  <td><span className="cross">&#10007;</span> Habitualmente intransferible</td>
                  <td>N/A</td>
                </tr>
                <tr>
                  <td>Ingresos por alquiler</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> En la mayoría</td>
                  <td><span className="check">&#10003;</span> Sí</td>
                  <td><span className="cross">&#10007;</span> Raramente</td>
                  <td>N/A</td>
                </tr>
                <tr>
                  <td>Gestión profesional</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> Incluida</td>
                  <td><span className="cross">&#10007;</span> La organizas tú</td>
                  <td><span className="partial">~</span> Gestión hotelera</td>
                  <td>N/A</td>
                </tr>
                <tr>
                  <td>Disponibilidad garantizada</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> ~45 días/año</td>
                  <td><span className="check">&#10003;</span> 365 días</td>
                  <td><span className="partial">~</span> Suele estar restringida</td>
                  <td><span className="cross">&#10007;</span> Sujeta a reserva</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== MID CTA ===== */}
      <section className="mid-cta">
        <p>¿Listo para encontrar tu segunda residencia?</p>
        <div className="mid-cta-buttons">
          <a href="#speak-to-expert" className="btn btn-gold">Hablar con un experto</a>
          <a href="#newsletter" className="btn btn-blue">Suscribirme al boletín</a>
        </div>
      </section>

      {/* ===== HOW THE LLC MODEL WORKS ===== */}
      <section className="sec model-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
          <p className="eyebrow">El proceso</p>
          <h2>Cuatro pasos para tu <em>segunda residencia</em></h2>
          <p className="lead" style={{margin: '0 auto'}}>Cada propiedad se mantiene en su propia SL. Compras participaciones de esa SL — lo que te otorga propiedad genuina y registrada con plena protección legal.</p>

          <div className="model-flow">
            <div className="model-step">
              <div className="model-num">1</div>
              <h3>Explora y elige</h3>
              <p>Descubre más de 360 propiedades de lujo curadas. Filtra por destino, estilo de vida, presupuesto y tamaño de fracción.</p>
            </div>
            <div className="model-step">
              <div className="model-num">2</div>
              <h3>Nos encargamos del proceso legal</h3>
              <p>Abogados independientes gestionan toda la escrituración. Se redacta un acuerdo de copropiedad que cubre calendarios, gastos, derechos de reventa y tu protección.</p>
            </div>
            <div className="model-step">
              <div className="model-num">3</div>
              <h3>Compra tu participación</h3>
              <p>Firma la escritura ante notario, registra tu participación en la SL y recibe tu certificado de propiedad. La mayoría de las casas están listas para entrar a vivir.</p>
            </div>
            <div className="model-step">
              <div className="model-num">4</div>
              <h3>Disfruta y gana</h3>
              <p>Empieza a usar tu casa de inmediato. Un calendario rotativo justo asegura que todos disfruten de fechas premium. Alquila las semanas que no uses para obtener ingresos.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="sec faq-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
          <p className="eyebrow">Preguntas habituales</p>
          <h2>Preguntas <em>frecuentes</em></h2>
        </div>
        <ul className="faq-list">
          <li className="faq-item"><details><summary><h3>¿Qué es la copropiedad fraccionada?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>La copropiedad fraccionada es la compra de una participación registrada en una propiedad — típicamente 1/8 o 1/4. Posees tu fracción de forma plena, registrada a través de una SL específica de la propiedad. Puedes usarla durante el tiempo asignado al año (normalmente 45-90 días), revenderla en el mercado libre, o transmitirla a tus hijos. Es propiedad real — no un alquiler, ni un club de vacaciones, ni multipropiedad.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>¿En qué se diferencia de la multipropiedad?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Es fundamentalmente distinta. La copropiedad te da una escritura registrada — propiedad real que se revaloriza. La multipropiedad es un contrato de uso que típicamente se deprecia. Puedes revender una fracción de copropiedad en el mercado libre; las reventas de multipropiedad son notoriamente difíciles. Los costes de la copropiedad son proporcionales y transparentes; las cuotas de multipropiedad continúan independientemente de si usas la propiedad.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>¿Qué es la estructura LLC?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Cada propiedad se mantiene en su propia LLC (Limited Liability Company) dedicada — la misma estructura utilizada de forma homogénea en toda nuestra cartera internacional. Cuando compras una fracción, adquieres un membership interest en esa LLC — lo que te otorga propiedad legal del inmueble proporcional al tamaño de tu fracción. Esta estructura proporciona protección de responsabilidad, simplifica la reventa y garantiza una clara separación legal entre los copropietarios.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>¿Cuánto tiempo puedo usar la propiedad al año?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>El uso depende del tamaño de tu fracción. Una fracción de 1/8 te da aproximadamente 45 días al año (6 semanas). Una fracción de 1/4 proporciona unos 90 días (aproximadamente 3 meses). Un calendario rotativo justo garantiza la distribución equitativa de fechas de temporada alta y baja entre todos los copropietarios — todos disfrutan de semanas de verano, Navidad y Semana Santa con el tiempo.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>¿Puedo vender mi fracción?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Sí. Posees una fracción registrada, así que puedes revenderla en el mercado libre cuando quieras — sujeto a una cláusula de derecho de tanteo para tus copropietarios. La reventa es sencilla y las fracciones en ubicaciones premium tienden a revalorizarse con el tiempo.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>¿Puedo obtener ingresos por alquiler?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>En muchas de nuestras propiedades, sí. Si no vas a usar tus semanas asignadas, puedes alquilarlas y obtener ingresos. El equipo de gestión puede encargarse del proceso de alquiler en tu nombre. La disponibilidad varía según la propiedad — pregúntanos por los detalles de listados específicos.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>¿Y el intercambio de viviendas?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>La mayoría de las propiedades de nuestro porfolio ofrecen un sistema de intercambio. Si quieres pasar tu tiempo asignado en otro destino, puedes organizar un intercambio con un copropietario de otra propiedad. Es una excelente manera de explorar diferentes ubicaciones sin coste adicional.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>¿Qué gastos se comparten entre los propietarios?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Todos los gastos corrientes se reparten proporcionalmente: IBI, seguros, suministros, mantenimiento, reparaciones, limpieza y gestión profesional. Un acuerdo de copropiedad especifica exactamente cómo se gestionan los gastos. Muchas propiedades vienen totalmente amuebladas y reformadas, con los costes incluidos en el precio de la fracción.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>¿Hay restricciones legales en el uso?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Los no residentes en el extranjero tienen límites de uso: típicamente 180 días menos uno antes de activar la residencia fiscal. Los ciudadanos del Reino Unido tras el Brexit pueden estar 90 días por cada periodo móvil de 180 días en toda la UE. Una fracción de 1/8 o 1/4 encaja cómodamente dentro de estos límites. Consulta siempre con tu asesor fiscal sobre tu situación personal.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>¿Puedo transmitir mi fracción a mi familia?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Sí. Tu fracción registrada es un activo genuino que puedes pasar a tus hijos o herederos — como cualquier propiedad. Muchas familias poseen fracciones de copropiedad juntos a través de generaciones. La estructura SL hace que las transmisiones sean sencillas.</p></div></details></li>
        </ul>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/how-it-works.js" strategy="afterInteractive" />
    </>
  );
}
