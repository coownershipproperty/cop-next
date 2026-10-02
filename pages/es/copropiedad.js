import Head from 'next/head';
import Nav from '@/components/rd/Nav';
import Footer from '@/components/Footer';
import hreflangLinks from '@/components/HreflangLinks';

// Spanish pillar page targeting `copropiedad` (primary) and
// `propiedad fraccionada` (secondary). This is the keyword-dense,
// authoritative explainer that anchors the rest of the /es/ blog network.
//
// Structure follows the "definitive guide" pattern that ranks for big head
// terms: long-form, sub-headings as questions (FAQ-style), internal links to
// supporting blog posts, jurisdiction-specific legal detail.
export default function CopropiedadPillar() {
  return (
    <>
      <Head>
        <title>Copropiedad: la guía completa para comprar una segunda residencia en España [2026]</title>
        <meta
          name="description"
          content="Guía completa de la copropiedad y propiedad fraccionada en España: cómo funciona, qué se compra exactamente, fiscalidad, costes y diferencias con la multipropiedad. Actualizada 2026."
        />
        <link rel="canonical" href="https://co-ownership-property.com/es/copropiedad/" />
        {hreflangLinks({ englishPath: '/es/copropiedad' })}

        <meta property="og:type" content="article" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:title" content="Copropiedad: la guía completa para comprar una segunda residencia en España" />
        <meta property="og:description" content="Cómo funciona la copropiedad de viviendas en España, modelo legal, fiscalidad y diferencias con la multipropiedad. Guía 2026." />

        {/* FAQ schema markup helps win featured snippets for question-based queries */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: '¿Qué es la copropiedad de una vivienda?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'La copropiedad es un modelo legal en el que varios compradores adquieren una vivienda de forma conjunta. Cada copropietario es titular real de una fracción de la propiedad —normalmente 1/8— y disfruta de aproximadamente 6 semanas de uso al año.',
                  },
                },
                {
                  '@type': 'Question',
                  name: '¿Es lo mismo que la multipropiedad o el timeshare?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'No. La multipropiedad (timeshare) le da derecho a usar una vivienda durante semanas concretas, sin ser dueño de la propiedad. La copropiedad le hace propietario de una parte real de la vivienda, no de un derecho de uso.',
                  },
                },
                {
                  '@type': 'Question',
                  name: '¿Cómo se estructura legalmente la copropiedad en España?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Usted es propietario de una parte real de la vivienda —un octavo, un cuarto—, no de un derecho de uso. Puede venderla, dejarla en herencia, y su valor sube y baja con el de la casa. La estructura legal la organiza nuestro socio para cada vivienda y se la explica en detalle antes de comprar.',
                  },
                },
                {
                  '@type': 'Question',
                  name: '¿Qué impuestos pago al comprar una fracción?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Cómo funciona la fiscalidad depende del país y de la estructura legal de cada vivienda, que nuestro socio le explica antes de comprar; le recomendamos un asesoramiento independiente. Anualmente, el copropietario asume su parte proporcional del IBI (impuesto local) y, si es no residente, del IRPF de no residentes.',
                  },
                },
                {
                  '@type': 'Question',
                  name: '¿Puedo vender mi fracción cuando quiera?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Sí. La fracción es una propiedad transferible. La mayoría de los operadores de copropiedad facilitan el proceso de reventa y, en algunos casos, ofrecen una garantía de recompra después de un periodo determinado (normalmente 2-3 años).',
                  },
                },
              ],
            }),
          }}
        />
      </Head>

      <div className="rd rd-home-light rd-pillar">
      <Nav />

      <main className="cop-pillar">

        {/* Intro ──────────────────────────────────────────────────────────── */}
        <article className="cop-pillar-inner">
          <header className="cop-pillar-header">
            <p className="cop-pillar-eyebrow">Guía completa · Actualizada 2026</p>
            <h1>Copropiedad: la guía completa para comprar una segunda residencia en España</h1>
            <p className="cop-pillar-lead">
              La <strong>copropiedad</strong> —también llamada <strong>propiedad fraccionada</strong>—
              es la forma más eficaz que existe hoy en España para acceder a una segunda
              residencia de lujo sin asumir el coste íntegro de la vivienda. Esta guía explica
              qué es, cómo funciona el modelo legal, qué se paga, en qué se diferencia de la
              multipropiedad, y cómo elegir bien la propiedad adecuada.
            </p>
          </header>

          {/* TOC ──────────────────────────────────────────────────────────── */}
          <nav className="cop-pillar-toc" aria-label="Índice">
            <h2>Índice</h2>
            <ol>
              <li><a href="#que-es">¿Qué es la copropiedad?</a></li>
              <li><a href="#como-funciona">¿Cómo funciona en la práctica?</a></li>
              <li><a href="#vs-multipropiedad">Copropiedad vs. multipropiedad: la diferencia clave</a></li>
              <li><a href="#legal">Modelo legal: qué compra exactamente</a></li>
              <li><a href="#costes">Costes: precio de compra y gastos anuales</a></li>
              <li><a href="#fiscalidad">Fiscalidad: ITP, IBI, IRPF</a></li>
              <li><a href="#destinos">Mejores destinos en España para copropiedad</a></li>
              <li><a href="#elegir">Cómo elegir la propiedad y el operador adecuado</a></li>
              <li><a href="#vender">¿Y si quiero vender mi fracción?</a></li>
              <li><a href="#preguntas">Preguntas frecuentes</a></li>
            </ol>
          </nav>

          {/* 1. What is it ───────────────────────────────────────────────── */}
          <section id="que-es">
            <h2>1. ¿Qué es la copropiedad?</h2>
            <p>
              La <strong>copropiedad</strong> es un modelo de propiedad inmobiliaria en el que
              varios compradores adquieren conjuntamente una vivienda y se reparten
              proporcionalmente tanto el coste como el uso. En el modelo más extendido en
              España y en Europa, la propiedad se divide en <strong>8 fracciones iguales</strong>{' '}
              y cada copropietario adquiere <strong>al menos una fracción (1/8)</strong>, lo
              que le da derecho a aproximadamente <strong>6 semanas de uso exclusivo al año</strong>.
            </p>
            <p>
              No es un concepto nuevo. La copropiedad está expresamente regulada en el Código
              Civil español, en los <em>Artículos 392 a 406</em>. Lo que es relativamente
              reciente —desde alrededor de 2020 en España— es la profesionalización del modelo:
              operadores especializados que se encargan de la compra, la estructura jurídica,
              la gestión profesional de la vivienda, las reservas, el mantenimiento, la
              limpieza, los servicios y el calendario entre los copropietarios.
            </p>
            <p>
              La diferencia con comprar una segunda residencia tradicional es evidente: en
              lugar de pagar 1.200.000 € por una villa de lujo en Mallorca, paga 150.000 €
              por una fracción de 1/8. La diferencia con alquilar es también clara: <strong>es
              propiedad real</strong>. Usted es propietario de una parte real de la vivienda: la
              fracción se hereda, se puede vender, y su valor sube y baja con el de la casa.
            </p>
          </section>

          {/* 2. How it works in practice ─────────────────────────────────── */}
          <section id="como-funciona">
            <h2>2. ¿Cómo funciona en la práctica?</h2>
            <p>El proceso de copropiedad sigue normalmente cinco pasos:</p>
            <ol className="cop-pillar-steps">
              <li>
                <strong>Selección de la propiedad.</strong> Elige la villa o apartamento entre
                las opciones disponibles. En COP encontrará propiedades de los principales
                operadores de copropiedad de España y Europa filtradas por destino, dormitorios,
                precio y características.
              </li>
              <li>
                <strong>Reserva y due diligence legal.</strong> Una vez elegida la fracción
                que desea comprar, firma un acuerdo de reserva con el operador. La fracción
                se reserva durante el periodo necesario para completar la due diligence
                jurídica y la firma definitiva.
              </li>
              <li>
                <strong>Estructura legal y firma.</strong> La estructura legal la organiza
                nuestro socio para cada vivienda y se la explica en detalle antes de comprar.
                Después se firma la compra de su fracción.
              </li>
              <li>
                <strong>Gestión profesional y calendario.</strong> A partir de aquí, el operador
                gestiona la vivienda: mantenimiento, jardín, piscina, limpieza entre estancias,
                seguros, suministros. Cada copropietario reserva sus semanas a través de un
                sistema de reservas, normalmente con un algoritmo de equidad que reparte las
                fechas de temporada alta entre todos los copropietarios año tras año.
              </li>
              <li>
                <strong>Disfrute y, en su caso, reventa.</strong> Disfrute las semanas que le
                tocan al año (típicamente 44-45 noches divididas en varias estancias). Cuando
                quiera vender, su fracción es totalmente transferible.
              </li>
            </ol>
          </section>

          {/* 3. Vs multipropiedad ───────────────────────────────────────── */}
          <section id="vs-multipropiedad">
            <h2>3. Copropiedad vs. multipropiedad: la diferencia clave</h2>
            <p>
              Esta es la pregunta más frecuente en España, y la respuesta importa porque las
              dos figuras son <strong>jurídicamente muy distintas</strong>:
            </p>
            <table className="cop-pillar-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Copropiedad</th>
                  <th>Multipropiedad (timeshare)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>¿Es propiedad inmobiliaria real?</td>
                  <td>Sí. Propietario de una parte real de la vivienda.</td>
                  <td>No. Solo derecho de uso por semanas.</td>
                </tr>
                <tr>
                  <td>Base legal</td>
                  <td>Organizada por nuestro socio para cada vivienda y explicada antes de comprar.</td>
                  <td>Contrato privado o de adhesión.</td>
                </tr>
                <tr>
                  <td>Qué se compra</td>
                  <td>Una parte real de la vivienda (un octavo, un cuarto).</td>
                  <td>Un derecho de uso por semanas.</td>
                </tr>
                <tr>
                  <td>Revalorización del inmueble</td>
                  <td>Sí, beneficio en la reventa.</td>
                  <td>No. El derecho suele perder valor.</td>
                </tr>
                <tr>
                  <td>Reventa</td>
                  <td>Mercado secundario activo.</td>
                  <td>Muy limitado. A menudo imposible.</td>
                </tr>
                <tr>
                  <td>Herencia</td>
                  <td>Se hereda como cualquier propiedad.</td>
                  <td>Variable según contrato.</td>
                </tr>
              </tbody>
            </table>
            <p>
              Hay una historia de fraude asociada a la multipropiedad en España (esquemas de
              ventas agresivas, dificultad para salirse de los contratos, sentencias del
              Tribunal Supremo declarando nulos cientos de contratos) que ha contaminado el
              término. La copropiedad es una figura completamente distinta y legalmente sólida.
            </p>
            <p>
              Para más detalle: <a href="/es/blog/copropiedad-vs-multipropiedad/">Copropiedad
              vs. multipropiedad: las diferencias que importan</a>.
            </p>
          </section>

          {/* 4. Legal model ─────────────────────────────────────────────── */}
          <section id="legal">
            <h2>4. Modelo legal: qué compra exactamente</h2>
            <p>
              Usted es propietario de una <strong>parte real de la vivienda</strong> —un octavo,
              un cuarto—, no de un derecho de uso. Puede venderla, dejarla en herencia, y su
              valor sube y baja con el de la casa.
            </p>
            <p>
              La estructura legal la organiza nuestro socio para cada vivienda y se la explica
              en detalle antes de comprar.
            </p>
            <p>
              Las decisiones importantes (vender la propiedad, hacer reformas estructurales)
              las toman conjuntamente los copropietarios. La gestión ordinaria está delegada
              al operador.
            </p>
          </section>

          {/* 5. Costs ───────────────────────────────────────────────────── */}
          <section id="costes">
            <h2>5. Costes: precio de compra y gastos anuales</h2>
            <p>
              Los costes de la copropiedad se dividen en dos categorías:{' '}
              <strong>el coste de adquisición de la fracción</strong> y los{' '}
              <strong>gastos anuales recurrentes</strong>.
            </p>
            <h3>Coste de adquisición</h3>
            <p>
              El precio de una fracción depende de la propiedad. En España, los rangos típicos
              en 2026 son:
            </p>
            <ul>
              <li><strong>Apartamento en costa española</strong> (Costa Blanca, Costa del Sol): 80.000 € – 150.000 € por 1/8.</li>
              <li><strong>Villa con piscina en Mallorca o Ibiza</strong>: 150.000 € – 350.000 € por 1/8.</li>
              <li><strong>Villa de lujo en Sotogrande, Marbella, Formentera</strong>: 250.000 € – 500.000 € por 1/8.</li>
              <li><strong>Chalet en Baqueira u otro destino de esquí</strong>: 100.000 € – 250.000 € por 1/8.</li>
            </ul>
            <p>
              Los impuestos y gastos de la compra dependen del país y de la estructura legal de
              cada vivienda, que nuestro socio le explica antes de comprar.
            </p>
            <h3>Gastos anuales</h3>
            <p>
              Los gastos anuales se reparten proporcionalmente entre los copropietarios. Para
              un 1/8 incluyen típicamente:
            </p>
            <ul>
              <li>Cuota de gestión profesional del operador.</li>
              <li>Gastos de mantenimiento (jardín, piscina, comunidad, suministros).</li>
              <li>Limpieza entre estancias.</li>
              <li>Seguros (hogar, responsabilidad civil).</li>
              <li>IBI, tasa de basuras y otros impuestos locales.</li>
              <li>Fondo de reserva para reformas y reposición.</li>
            </ul>
            <p>
              Para una villa de gama media en Mallorca, los gastos anuales por 1/8 suelen
              moverse entre <strong>5.000 € y 12.000 €</strong> al año. Para propiedades de
              lujo o con servicios premium pueden ser más altos.
            </p>
          </section>

          {/* 6. Tax ─────────────────────────────────────────────────────── */}
          <section id="fiscalidad">
            <h2>6. Fiscalidad: ITP, IBI, IRPF</h2>
            <p>
              La fiscalidad de la copropiedad en España se divide en tres bloques:
            </p>
            <h3>Al comprar</h3>
            <p>
              <strong>ITP u otros impuestos de compra.</strong> Cómo funciona la fiscalidad
              depende del país y de la estructura legal de cada vivienda, que nuestro socio le
              explica antes de comprar; le recomendamos un asesoramiento independiente.
            </p>
            <h3>Anualmente</h3>
            <p>
              <strong>IBI.</strong> El impuesto local sobre bienes inmuebles se reparte entre los
              copropietarios: cada uno asume su parte proporcional.
            </p>
            <p>
              <strong>IRPF de no residentes.</strong> Si es no residente fiscal en España y
              utiliza la propiedad para uso propio (sin alquilarla), debe declarar la
              imputación de rentas inmobiliarias por su parte proporcional.
              El operador suele facilitar la información fiscal anualmente.
            </p>
            <h3>Al vender</h3>
            <p>
              <strong>Plusvalía.</strong> En la venta de su fracción puede haber ganancia
              patrimonial sujeta a IRPF (residentes) o a IRNR (no residentes).
            </p>
            <p>
              Recomendamos siempre consultar con un asesor fiscal antes de la compra. Cada
              caso —residencia fiscal, importe, comunidad autónoma— tiene matices.
            </p>
          </section>

          {/* 7. Destinations ────────────────────────────────────────────── */}
          <section id="destinos">
            <h2>7. Mejores destinos en España para copropiedad</h2>
            <p>
              No todos los destinos funcionan igual de bien para la copropiedad. Los mejores
              candidatos combinan <strong>alta demanda turística</strong> (que mantiene el
              valor del inmueble), <strong>clima durante todo el año</strong> (que reparte
              el uso entre estaciones) y <strong>infraestructura premium</strong> (que justifica
              el ticket alto). Los más populares en 2026:
            </p>
            <ul>
              <li><strong>Mallorca</strong> — Pollensa, Andratx, Deià, Son Vida. Calidad de vida y revalorización constantes.</li>
              <li><strong>Ibiza</strong> — Santa Eulalia, San Carlos, Roca Llisa. Demanda alta, oferta limitada.</li>
              <li><strong>Sotogrande</strong> — golf, polo, marina. Familias y jubilados de calidad.</li>
              <li><strong>Costa del Sol</strong> — Marbella, Estepona, Benahavís.</li>
              <li><strong>Formentera y Menorca</strong> — propiedades más íntimas, mercado más limitado.</li>
              <li><strong>Costa Blanca</strong> — Jávea, Dénia, Moraira. Punto de entrada más asequible.</li>
              <li><strong>Baqueira-Beret</strong> — único destino de esquí premium en España.</li>
            </ul>
          </section>

          {/* 8. How to choose ──────────────────────────────────────────── */}
          <section id="elegir">
            <h2>8. Cómo elegir la propiedad y el operador adecuado</h2>
            <p>Antes de firmar, las preguntas clave que conviene hacer:</p>
            <ul>
              <li><strong>Estructura legal exacta:</strong> pida que se la expliquen en detalle antes de comprar. ¿Qué dicen los documentos sobre uso, venta y disolución?</li>
              <li><strong>Calendario de uso:</strong> ¿cómo se reparten las semanas de temporada alta? ¿hay un algoritmo de rotación equitativa?</li>
              <li><strong>Gastos anuales:</strong> desglose detallado por concepto. ¿Qué pasa si los costes suben?</li>
              <li><strong>Operador:</strong> ¿cuántos años lleva operando? ¿propiedades en cartera? ¿reseñas verificables?</li>
              <li><strong>Reventa:</strong> ¿cómo se gestiona? ¿comisiones? ¿hay garantía de recompra?</li>
              <li><strong>Qué pasa si el operador cesa:</strong> el inmueble debe seguir siendo de los copropietarios. Verifíquelo en el contrato.</li>
            </ul>
            <p>
              En COP presentamos propiedades de los principales operadores de copropiedad de
              Europa. Nuestra posición como agregador independiente nos permite explicar
              las diferencias entre operadores sin sesgo comercial.
            </p>
          </section>

          {/* 9. Selling ─────────────────────────────────────────────────── */}
          <section id="vender">
            <h2>9. ¿Y si quiero vender mi fracción?</h2>
            <p>
              La fracción de copropiedad <strong>es perfectamente transferible</strong>. La
              reventa se gestiona a través del proceso de reventa de nuestro socio, sin que
              usted tenga que vender toda la casa.
            </p>
            <p>
              La mayoría de los operadores facilitan el proceso de reventa: mantienen una
              lista de espera de compradores interesados, gestionan el contacto, y suelen
              cobrar una comisión (típicamente 5-10% del precio de venta). Algunos ofrecen
              <strong>garantía de recompra</strong> después de un periodo determinado
              (habitualmente 2-3 años) por un porcentaje del precio original.
            </p>
            <p>
              Datos del mercado español de copropiedad en 2025: la revalorización media de
              fracciones en transacciones secundarias ha sido del orden del{' '}
              <strong>10% sobre el precio de compra inicial</strong>, según datos publicados
              por operadores españoles del sector.
            </p>
          </section>

          {/* 10. FAQ ────────────────────────────────────────────────────── */}
          <section id="preguntas">
            <h2>10. Preguntas frecuentes</h2>

            <h3>¿Puedo alquilar mis semanas si no las uso?</h3>
            <p>
              Depende del operador y de los estatutos. Algunos lo permiten dentro de límites,
              otros lo prohíben para preservar el carácter residencial y evitar problemas
              regulatorios con el alquiler vacacional.
            </p>

            <h3>¿Qué pasa si quiero comprar más de una fracción?</h3>
            <p>
              La mayoría de los operadores permiten comprar 2/8 o más, con el correspondiente
              aumento de las semanas anuales de uso. Algunos limitan la concentración por
              copropietario para preservar la diversidad.
            </p>

            <h3>¿Hay financiación disponible?</h3>
            <p>
              Algunos operadores trabajan con bancos asociados que ofrecen financiación
              específica para la compra de fracciones. Las condiciones suelen ser similares a
              una hipoteca tradicional (LTV de 50-65%, tipo competitivo). Consulte directamente
              al operador.
            </p>

            <h3>¿Soy residente fiscal en España si compro una fracción?</h3>
            <p>
              No. La compra de una fracción de propiedad no le convierte en residente fiscal
              español. La residencia fiscal se determina por días de estancia y otros criterios
              del Artículo 9 LIRPF, no por la mera titularidad de inmuebles.
            </p>

            <h3>¿Puedo comprar a través de mi sociedad o de un fideicomiso?</h3>
            <p>
              Sí, la mayoría de los operadores permiten comprar la fracción a través de una
              sociedad o estructura patrimonial.
              Conviene revisarlo en la due diligence con un asesor fiscal.
            </p>
          </section>

          {/* CTA ──────────────────────────────────────────────────────────── */}
          <section className="cop-pillar-cta">
            <h2>Empieza a explorar propiedades</h2>
            <p>
              Vea propiedades en copropiedad disponibles ahora mismo en Mallorca, Ibiza,
              Costa del Sol y otros destinos europeos. Puede filtrar por precio, dormitorios
              y características.
            </p>
            <p>
              <a href="/our-homes/" className="cop-cta-primary">Ver todas las propiedades</a>
              <a href="/es/contacto/" className="cop-cta-secondary">Hablar con un asesor</a>
            </p>
          </section>

        </article>
      </main>

      <Footer />

      </div>
    </>
  );
}
