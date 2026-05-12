import Head from 'next/head';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';

// Post estratégico: explica claramente la diferencia entre copropiedad y
// multipropiedad. Identificado por keyword-research-spanish.md como gap
// fundamental — Vivla cubre el tema pero los snippets destacados de
// Google están vacíos. Estructura optimizada para featured snippets:
// definición clara → tabla comparativa → FAQ.

export default function CopropiedadVsMultipropiedad() {
  const canonicalUrl = 'https://co-ownership-property.com/es/blog/copropiedad-vs-multipropiedad/';
  return (
    <>
      <Head>
        <title>Copropiedad vs. multipropiedad: las diferencias que importan [2026]</title>
        <meta name="description" content="Copropiedad y multipropiedad son cosas muy distintas. Diferencias legales, financieras, fiscales — explicadas claramente con tabla comparativa actualizada 2026." />
        <link rel="canonical" href={canonicalUrl} />
        <HreflangLinks englishPath="/es/blog/copropiedad-vs-multipropiedad" />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:title" content="Copropiedad vs. multipropiedad: las diferencias que importan" />
        <meta property="og:description" content="Cuál es la diferencia real entre copropiedad y multipropiedad en España. Explicación clara y tabla comparativa." />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Copropiedad vs. multipropiedad: las diferencias que importan [2026]',
          datePublished: '2026-05-10',
          author: { '@type': 'Organization', name: 'Co-Ownership Property' },
          publisher: { '@type': 'Organization', name: 'Co-Ownership Property', logo: { '@type': 'ImageObject', url: '/wp-content/uploads/2025/10/COP-Logo-Large.png' } },
          mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
        }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: '¿Cuál es la diferencia entre copropiedad y multipropiedad?', acceptedAnswer: { '@type': 'Answer', text: 'La copropiedad es propiedad inmobiliaria real: eres dueño registrado de una fracción del inmueble (normalmente 1/8) mediante una SL, con escritura pública y registro en el Registro de la Propiedad. La multipropiedad (timeshare) es solo un derecho de uso por semanas determinadas — no eres dueño del inmueble, no se revaloriza, y la reventa suele ser muy difícil.' } },
            { '@type': 'Question', name: '¿La multipropiedad es legal en España?', acceptedAnswer: { '@type': 'Answer', text: 'Sí, está regulada por la Ley 4/2012 de aprovechamiento por turno (timeshare). Sin embargo, miles de contratos de multipropiedad firmados antes de 2012 han sido anulados por sentencias del Tribunal Supremo por incumplimiento de los requisitos legales (duración perpetua, falta de objeto cierto, etc.). La copropiedad como SL es una figura jurídica distinta y plenamente sólida.' } },
            { '@type': 'Question', name: '¿Puedo vender mi multipropiedad?', acceptedAnswer: { '@type': 'Answer', text: 'Técnicamente sí, pero en la práctica es muy difícil. El mercado secundario de multipropiedades está prácticamente muerto en España. Los anuncios "vendo multipropiedad" suelen acabar siendo regalados o transferidos por importes simbólicos. La copropiedad, en cambio, tiene un mercado secundario activo con plusvalías habituales.' } },
            { '@type': 'Question', name: '¿Por qué la copropiedad se revaloriza y la multipropiedad no?', acceptedAnswer: { '@type': 'Answer', text: 'Porque son cosas distintas. La copropiedad es un activo inmobiliario real — su valor sigue al mercado inmobiliario, que históricamente se revaloriza. La multipropiedad es un contrato de derecho de uso, sin valor inmobiliario subyacente — su valor de mercado depende solo de la demanda de derechos de uso, que ha caído con la liberalización del alquiler vacacional.' } },
            { '@type': 'Question', name: '¿Cómo distingo una multipropiedad disfrazada de copropiedad?', acceptedAnswer: { '@type': 'Answer', text: 'Pide siempre tres cosas: (1) la escritura ante notario que te hará dueño de participaciones de una SL propietaria del inmueble; (2) la inscripción de la SL en el Registro de la Propiedad como titular del inmueble; (3) los estatutos sociales con tu derecho de uso. Si te ofrecen un "club", "puntos", o "derechos de uso" sin titularidad registrada, es multipropiedad — sea cual sea el nombre comercial.' } },
          ],
        }) }} />
      </Head>
      <Header />

      <div className="bh-header">
        <div className="bh-header-inner">
          <p className="bh-cat">Comparativa</p>
          <h1 className="bh-title">Copropiedad vs. multipropiedad: las diferencias que importan</h1>
          <p className="bh-sub">Por qué son cosas muy distintas — legalmente, financieramente, y en la práctica.</p>
          <p className="bh-date">Actualizado mayo 2026</p>
        </div>
      </div>

      <div className="blog-layout">
        <main className="blog-main">
          <article className="blog-article">

            <p>Es la pregunta que todo comprador interesado en una segunda residencia hace tarde o temprano: <strong>¿la copropiedad no es lo mismo que la multipropiedad?</strong> La respuesta corta es no. La respuesta larga importa, porque las dos figuras son fundamentalmente distintas — jurídica, financiera y prácticamente.</p>

            <p>En España, la palabra <em>multipropiedad</em> arrastra décadas de mala prensa: contratos abusivos en los años 90 y 2000, miles de sentencias del Tribunal Supremo anulando esquemas fraudulentos, dificultad notoria para revender. La copropiedad como modelo profesional es algo completamente diferente, popularizado en España por operadores como Vivla a partir de 2022. Vamos a desglosar exactamente por qué.</p>

            <h2>La diferencia en una frase</h2>
            <p style={{fontSize:'1.18rem', borderLeft:'4px solid #C9A84C', paddingLeft:'1.25rem', margin:'2rem 0', color:'#2C4A5E'}}>La <strong>copropiedad</strong> te hace dueño real de una fracción de la vivienda, registrada en el Registro de la Propiedad. La <strong>multipropiedad</strong> te da solo el derecho de usar la vivienda durante semanas concretas — no eres dueño del inmueble.</p>

            <h2>Tabla comparativa completa</h2>

            <div className="cop-pillar-table-wrap">
              <table className="cop-pillar-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Copropiedad</th>
                    <th>Multipropiedad (timeshare)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Régimen jurídico</td><td>Propiedad inmobiliaria (SL titular)</td><td>Derecho de aprovechamiento por turno (Ley 4/2012)</td></tr>
                  <tr><td>Escritura ante notario</td><td>Sí, escritura pública</td><td>Generalmente no — contrato privado</td></tr>
                  <tr><td>Registro de la Propiedad</td><td>Sí, inscripción registral</td><td>No habitualmente</td></tr>
                  <tr><td>Naturaleza de lo que compras</td><td>Participaciones de SL = fracción del inmueble</td><td>Derecho de uso por semanas</td></tr>
                  <tr><td>Revalorización</td><td>Sí — sigue al mercado inmobiliario</td><td>No — suele depreciarse</td></tr>
                  <tr><td>Mercado secundario</td><td>Activo — reventa típica en 1-3 meses</td><td>Prácticamente muerto</td></tr>
                  <tr><td>Herencia</td><td>Sí, como cualquier propiedad</td><td>Variable según contrato</td></tr>
                  <tr><td>Cuotas anuales si no usas</td><td>Solo gastos proporcionales reales</td><td>Cuotas fijas obligatorias</td></tr>
                  <tr><td>Asociación con fraude</td><td>Ninguna</td><td>Histórica — TS anuló miles de contratos</td></tr>
                  <tr><td>Duración del derecho</td><td>Indefinida (propiedad)</td><td>Limitada (típicamente 49 años)</td></tr>
                  <tr><td>IBI y otros impuestos</td><td>Pagado por la SL, repartido proporcionalmente</td><td>Repercutido en cuotas anuales</td></tr>
                </tbody>
              </table>
            </div>

            <h2>Por qué se confunden</h2>
            <p>Tres razones explican la confusión generalizada en España:</p>

            <p><strong>1. La superposición superficial.</strong> Ambas figuras implican compartir una vivienda vacacional con otras personas y usarla por semanas. Si te quedas en la apariencia, parecen lo mismo.</p>

            <p><strong>2. El marketing engañoso.</strong> Algunos operadores de multipropiedad de segunda generación se hacen llamar <em>copropiedad</em>, <em>club de propietarios</em>, <em>fraccional</em>, etc., para distanciarse de la mala imagen del término <em>multipropiedad</em>. Pero si la estructura jurídica es de aprovechamiento por turno, sigue siendo multipropiedad — sea cual sea el nombre comercial.</p>

            <p><strong>3. La falta de información clara.</strong> Las plataformas serias de copropiedad son relativamente nuevas en España (desde 2022). Hasta entonces, "compartir una segunda residencia" en la imaginación popular significaba multipropiedad. La copropiedad como producto profesional aún está educando al mercado.</p>

            <h2>El modelo legal de la copropiedad: SL</h2>
            <p>El modelo estándar profesional en España funciona así:</p>
            <ol>
              <li>Se constituye una <strong>Sociedad Limitada (SL)</strong> con la vivienda como único activo.</li>
              <li>La SL es titular registral del inmueble en el Registro de la Propiedad.</li>
              <li>Las participaciones de la SL se dividen en 8 partes iguales (1/8 = 12,5% del capital).</li>
              <li>Cada copropietario adquiere las participaciones correspondientes a su fracción mediante <strong>escritura ante notario</strong>.</li>
              <li>Los estatutos sociales fijan el calendario de uso, los costes compartidos, las reglas de cesión.</li>
            </ol>

            <p>El resultado: eres titular de una fracción real del inmueble, tu propiedad está protegida por el Código Civil (Artículo 392 y siguientes) y por la Ley de Sociedades de Capital, y el bien está inscrito a tu favor (a través de la SL) en el Registro de la Propiedad.</p>

            <h2>El modelo legal de la multipropiedad</h2>
            <p>La multipropiedad — formalmente <em>aprovechamiento por turno de bienes inmuebles</em> — está regulada por la Ley 4/2012 (modernización de la Ley 42/1998). El esquema típico:</p>
            <ol>
              <li>Una sociedad opera el régimen de aprovechamiento por turno sobre un complejo turístico.</li>
              <li>Vende derechos de uso por semanas concretas a compradores.</li>
              <li>El comprador no adquiere propiedad inmobiliaria — solo un derecho real personal.</li>
              <li>Las cuotas anuales son obligatorias mientras dure el contrato.</li>
            </ol>

            <p>La Ley 4/2012 fue una reacción a los abusos masivos del modelo anterior: contratos perpetuos, duraciones indefinidas, dificultad de salir. Pero incluso con la ley moderna, el modelo sigue presentando los problemas estructurales mencionados (no es propiedad real, no se revaloriza, mercado secundario casi inexistente).</p>

            <h2>Qué pasa si quieres salir</h2>

            <p><strong>Salida de una copropiedad:</strong> vendes tus participaciones de la SL a un nuevo copropietario. Operación notarial, plazo típico de 1 a 3 meses. Si la propiedad se ha revalorizado (lo habitual en zonas premium en España), obtienes plusvalía. Los datos del mercado español 2024-2025 muestran revalorizaciones medias del orden del 10% sobre el precio inicial de la fracción.</p>

            <p><strong>Salida de una multipropiedad:</strong> es complicado. El mercado secundario está prácticamente muerto. Muchos propietarios de multipropiedad llevan años intentando "deshacerse" de sus contratos sin éxito, e incluso han llegado a regalar las semanas. Existen empresas especializadas en ayudar a salir de contratos de multipropiedad (a menudo cobrando importantes honorarios) — su mera existencia ilustra la magnitud del problema.</p>

            <h2>Cómo distinguir una de otra al firmar</h2>

            <p>Si te ofrecen una "segunda residencia compartida" o "fraccional", pide tres cosas antes de firmar:</p>

            <ol>
              <li><strong>Copia del modelo de escritura.</strong> Debe ser una compra de participaciones de SL — no un "contrato de adhesión" o "afiliación a un club".</li>
              <li><strong>Comprobación de la inscripción de la SL en el Registro de la Propiedad.</strong> El nombre de la SL debe figurar como titular registral del inmueble. Pide la nota simple actualizada.</li>
              <li><strong>Estatutos sociales.</strong> Tienen que reflejar tu derecho de uso, los costes compartidos, las reglas de cesión, y los derechos de los copropietarios. Léelos con un asesor.</li>
            </ol>

            <p>Si te falta cualquiera de estos tres elementos, no es copropiedad — sea cual sea el nombre comercial.</p>

            <h2>Comparativa de costes a 10 años</h2>
            <p>Imaginemos una segunda residencia de 1.200.000 € en Mallorca. Comparemos los tres escenarios para 10 años:</p>

            <table className="cop-pillar-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Copropiedad 1/8</th>
                  <th>Multipropiedad 4 semanas</th>
                  <th>Compra íntegra</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Coste inicial</td><td>~150.000 €</td><td>~30.000 €</td><td>1.200.000 €</td></tr>
                <tr><td>Gastos anuales</td><td>~7.500 €</td><td>~1.800 €</td><td>~60.000 €</td></tr>
                <tr><td>Total 10 años</td><td>~225.000 €</td><td>~48.000 €</td><td>~1.800.000 €</td></tr>
                <tr><td>Días de uso/año</td><td>~45</td><td>~28</td><td>365 (típico: 35)</td></tr>
                <tr><td>Valor a los 10 años</td><td>~165.000 € (revaloriz. 10%)</td><td>~5.000 € (depreciado)</td><td>~1.320.000 €</td></tr>
                <tr><td>Coste neto real</td><td>~60.000 €</td><td>~43.000 €</td><td>~480.000 €</td></tr>
              </tbody>
            </table>

            <p>La multipropiedad parece más barata en coste neto, pero el valor residual es ~5.000 € (prácticamente cero) tras 10 años — has alquilado el uso, no has invertido. La copropiedad mantiene el valor patrimonial mientras te da más días de uso. La compra íntegra es desproporcionadamente cara para el uso real.</p>

            <h2>Preguntas frecuentes</h2>

            <h3>¿Es la copropiedad legal en España?</h3>
            <p>Sí, plenamente. La copropiedad como figura jurídica está expresamente regulada en el Código Civil (Artículos 392-406) y, en su forma moderna a través de SL, se ampara también en la Ley de Sociedades de Capital. Es una de las formas más sólidas de propiedad inmobiliaria en España.</p>

            <h3>¿Las cuotas de multipropiedad pueden subir con los años?</h3>
            <p>Sí, y suben significativamente. Es uno de los problemas crónicos del modelo: las cuotas anuales aumentan año tras año, a menudo por encima del IPC, sin que el comprador tenga capacidad real de control.</p>

            <h3>¿Una copropiedad puede convertirse en multipropiedad por error?</h3>
            <p>No. Son figuras jurídicas distintas y la documentación es completamente diferente. Si has firmado escritura ante notario para adquirir participaciones de una SL propietaria del inmueble, eres copropietario — no podrías acabar siendo multipropietario por accidente.</p>

            <h3>¿Hay alguna ventaja real en la multipropiedad?</h3>
            <p>El coste inicial es más bajo. Para alguien con presupuesto muy limitado que quiere acceso a vacaciones en una propiedad turística específica durante una o dos semanas concretas al año, y que no le importa que sea solo un derecho de uso (no propiedad), puede tener sentido. Para todos los demás casos, la copropiedad es claramente superior.</p>

            <h3>¿Qué hago si tengo una multipropiedad y quiero salir?</h3>
            <p>Existen abogados especializados en anular contratos de multipropiedad. Muchos contratos firmados antes de 2012 son nulos por las sentencias del Tribunal Supremo. Para contratos posteriores, depende de los términos específicos. Consulta con un abogado especializado.</p>

            <p style={{marginTop:'3rem'}}><strong>Si quieres explorar opciones de copropiedad en España y Europa</strong>, presentamos propiedades de los principales operadores en Mallorca, Ibiza, Costa del Sol, Baqueira y otros destinos premium — todas con escritura ante notario y registro en el Registro de la Propiedad.</p>

            <p style={{marginTop:'1.5rem'}}>
              <a href="/our-homes/" className="cop-cta-primary">Ver propiedades en copropiedad &rarr;</a>
            </p>

          </article>
        </main>

        <aside className="blog-sidebar">
          <section className="bsb-section">
            <h2 className="bsb-heading">Enlaces rápidos</h2>
            <a className="bsb-dest-link" href="/es/copropiedad/">Guía completa de copropiedad <span>→</span></a>
            <a className="bsb-dest-link" href="/es/como-funciona/">Cómo funciona en 4 pasos <span>→</span></a>
            <a className="bsb-dest-link" href="/our-homes/">Ver propiedades disponibles <span>→</span></a>
            <a className="bsb-dest-link" href="/es/contacto/">Hablar con un experto <span>→</span></a>
          </section>
        </aside>
      </div>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
