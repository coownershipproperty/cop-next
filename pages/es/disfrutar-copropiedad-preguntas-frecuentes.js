import Head from 'next/head';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import hreflangLinks from '@/components/HreflangLinks';

// Localización ES de /staying-in-my-co-ownership-property-faqs.
// Esquema FAQPage para Google. La Q8 menciona timeshare como
// contraste explícito (autorizada — contexto de comparación).

const FAQS = [
  {
    q: '¿Cómo reservo una estancia en mi propiedad en copropiedad?',
    a: `Las reservas se realizan directamente a través de la plataforma de gestión inmobiliaria — en la mayoría de los casos una aplicación móvil dedicada o un calendario en línea proporcionado por la empresa de gestión. El calendario suele estar abierto con entre 10 y 24 meses de antelación, según el operador. Usted consulta las fechas disponibles, selecciona su estancia y la reserva se confirma al instante dentro de su asignación estacional. Sus copropietarios reservan de forma independiente en el mismo sistema, con una programación diseñada para que nunca coincidan dos propietarios en la propiedad al mismo tiempo. Los copropietarios también se seleccionan con preferencias de estancia complementarias para minimizar desde el inicio los conflictos por las fechas más demandadas.`,
  },
  {
    q: '¿Con cuánta antelación debo reservar mi estancia?',
    a: `Puede reservar con hasta 24 meses de antelación, con un plazo mínimo de aviso de dos días para estancias de última hora. Durante la temporada alta y media, las reservas funcionan con un sistema de opciones: puede asegurar un espacio preferente al menos 120 días antes de la fecha prevista de llegada. La mayoría de los sistemas de gestión operan con dos categorías de reserva — reservas anticipadas para periodos punta (que se confirman con bastante antelación a la temporada) y reservas de última hora (mínimo dos días de aviso, hasta 30 días antes), que se hacen directamente en el calendario sin requerir validación del gestor. El sistema está diseñado para dar a los propietarios la máxima flexibilidad garantizando la equidad dentro del grupo de copropietarios.`,
  },
  {
    q: '¿Cuántos días al año puedo alojarme en mi propiedad en copropiedad?',
    a: `Su asignación anual es directamente proporcional al número de participaciones que posea. Una participación de 1/8 le da derecho a 1/8 del año natural — típicamente 42 a 45 noches, equivalentes a unas seis semanas o 1,5 meses al año. Estas noches se reparten entre las temporadas de la propiedad (alta, media y baja en la mayoría de las propiedades de esquí y costeras) para garantizar que todos los propietarios reciban una parte justa del acceso a los periodos punta de forma rotatoria. Si posee más de una participación, su asignación total escala proporcionalmente: 2 participaciones ≈ 3 meses al año, 3 participaciones ≈ 4,5 meses, y 4 participaciones (el máximo del 50 %) ≈ 6 meses. Algunas propiedades se estructuran en participaciones de 1/4, duplicando la asignación por participación. Consulte con nosotros los detalles específicos de la propiedad que le interese.`,
  },
  {
    q: '¿Puedo usar los días no aprovechados para generar ingresos por alquiler?',
    a: `En muchos casos, sí. Si no piensa utilizar parte o todo su tiempo asignado en una temporada concreta, muchas de nuestras propiedades en copropiedad permiten colocar esos días en un programa de alquiler gestionado profesionalmente. La empresa de gestión se ocupa de todas las operaciones de cara al huésped — anuncio, reserva, entrada, limpieza y salida — mientras que los ingresos por alquiler se le devuelven directamente. La rentabilidad en destinos de alta demanda como la Costa del Sol, Ibiza, los Alpes franceses o la Toscana puede ser suficiente para cubrir sus cuotas anuales de gestión y, en algunos casos, generar una rentabilidad neta. Tenga en cuenta que los permisos de alquiler varían según la propiedad y la normativa local — algunas zonas restringen el alquiler de corta estancia, así que confirme siempre con nuestro equipo el caso de una propiedad concreta antes de la compra.`,
  },
  {
    q: '¿Cuáles son los horarios de llegada y salida?',
    a: `La hora estándar de llegada es las 15:00 y la hora estándar de salida las 11:00. Estos horarios están fijados para que el equipo de limpieza y mantenimiento disponga del tiempo necesario para preparar la propiedad con calidad de hotel entre estancias consecutivas. La ventana exacta puede variar ligeramente según la propiedad, dependiendo del calendario del equipo de limpieza y del intervalo entre reservas. Si necesita una entrada anticipada o una salida tardía, siempre conviene contactar con su gestor de propiedad con antelación — cuando no hay otra estancia programada, suele ser posible.`,
  },
  {
    q: '¿Cuál es la estancia mínima?',
    a: `La estancia mínima estándar es de dos noches. Sin embargo, algunos operadores y propiedades de copropiedad funcionan por semanas completas, especialmente chalets de esquí y propiedades resort donde los cambios semanales son más prácticos desde el punto de vista logístico. La estancia mínima está diseñada para equilibrar la eficiencia operativa (costes de limpieza, preparación y gestión) con la flexibilidad para los propietarios. Si tiene un requisito específico — por ejemplo, una escapada de fin de semana o una parada de una sola noche — contáctenos y podremos asesorarle sobre las propiedades de nuestra cartera más adecuadas para estancias cortas.`,
  },
  {
    q: '¿Puedo invitar a familia y amigos a alojarse conmigo?',
    a: `Por supuesto. Durante sus estancias reservadas, la propiedad es enteramente suya. Es libre de invitar a amigos, familiares y huéspedes a acompañarle, o de permitirles utilizar la propiedad de forma independiente durante su tiempo asignado. La casa es suya durante toda la duración de su reserva — cada habitación, cada servicio, la piscina, el jardín y todas las instalaciones. No hay restricción en el número de huéspedes hasta la capacidad declarada de la propiedad, ni cargo adicional por huéspedes. Puede organizar una cena, recibir a la familia para toda la estancia o ceder su tiempo a un amigo. La experiencia es idéntica a la propiedad plena.`,
  },
  {
    q: '¿Puedo prestar o ceder mi estancia a otra persona?',
    a: `Sí. Como copropietario, tiene derecho a transferir su estancia reservada a un familiar, amigo o huésped de su elección. No es necesario que esté físicamente presente durante una estancia que haya cedido a otra persona. Esta es una de las ventajas prácticas de la copropiedad frente a la multipropiedad o el timeshare — usted es propietario del activo y de los derechos de tiempo asociados, por lo que puede usarlos como considere oportuno dentro de las normas de la casa. Si presta su estancia a alguien que no conoce la propiedad o el sistema de gestión, conviene informarle por adelantado sobre los procedimientos de llegada, salida y las normas de la casa.`,
  },
  {
    q: '¿Qué incluye la propiedad cuando llego?',
    a: `La propiedad se prepara con calidad de hotel antes de cada llegada. Esto incluye sábanas y toallas lavadas profesionalmente, una cocina limpia y totalmente equipada, y todos los electrodomésticos en perfecto estado. La mayoría de las propiedades en copropiedad llegan abastecidas con esenciales básicos — productos de limpieza, papel y consumibles de baño. Algunos operadores incluyen un pack de bienvenida con producto local o vino. La casa está diseñada con interiorismo de alto nivel, totalmente amueblada y equipada con todo lo necesario para el uso diario. No necesita aportar nada más allá de sus objetos personales y la comida para su estancia.`,
  },
  {
    q: '¿Quién cuida la propiedad entre estancias?',
    a: `Una empresa profesional dedicada de gestión inmobiliaria es responsable de la vivienda en todo momento. Entre estancias se encarga de la limpieza y el housekeeping, el mantenimiento rutinario y las inspecciones, el cuidado del jardín y la piscina, la gestión de suministros y cualquier reparación. Si algo necesita atención durante su estancia — una incidencia con un electrodoméstico, una duda de mantenimiento o una emergencia — su gestor de propiedad está contactable directamente y suele responder con prontitud. Nunca llegará a encontrarse con un problema sin atender. El equipo de gestión es su punto de contacto para todo lo relacionado con la propiedad, dejándole libre simplemente para disfrutar de su tiempo allí.`,
  },
  {
    q: '¿Cuáles son los costes recurrentes de propiedad durante mis estancias?',
    a: `Sus costes recurrentes como copropietario se reparten proporcionalmente entre todos los propietarios y suelen cubrir: cuotas de gestión inmobiliaria, mantenimiento y reparaciones, seguros, impuestos locales (IBI), suministros y cualquier cuota de servicios comunitarios. Estos costes se reparten conforme a su participación — así, como titular de 1/8 paga 1/8 de los gastos anuales, independientemente de cuántas noches utilice realmente. Los costes anuales varían según la propiedad y la ubicación, pero son consistentemente mucho más bajos que los costes equivalentes de la propiedad plena de un inmueble comparable. No hay cargos adicionales por noche por el uso de la propiedad durante su tiempo asignado.`,
  },
  {
    q: '¿Cómo funciona la programación estacional en propiedades de esquí y costeras?',
    a: `Las propiedades de esquí y costeras suelen operar en dos o tres temporadas — alta, media y baja (y a veces una temporada intermedia adicional). Cada temporada tiene niveles diferentes de demanda y, en consecuencia, dinámicas de reserva distintas. Su asignación anual de noches se reparte entre estas temporadas, normalmente mediante un calendario rotatorio que garantiza que cada copropietario reciba acceso a las fechas de temporada alta a lo largo de un ciclo plurianual. Esto evita que un mismo propietario monopolice la semana de Navidad o el pico de verano todos los años. La rotación la gestiona de forma transparente la empresa gestora y el calendario se comparte con todos los propietarios con suficiente antelación a cada temporada.`,
  },
  {
    q: '¿Puedo intercambiar o canjear mis fechas asignadas con otros copropietarios?',
    a: `Sí, en muchos casos. El sistema de reservas utilizado por la mayoría de nuestros socios de gestión permite a los propietarios ver la disponibilidad y, cuando otro propietario está de acuerdo, intercambiar fechas asignadas. Algunos operadores también permiten acumular días no utilizados en una temporada y usarlos en otra, sujeto a disponibilidad. Esta flexibilidad es una de las ventajas prácticas del modelo de copropiedad — si sus planes cambian, no está simplemente perdiendo su tiempo. Contacte con su gestor de propiedad para conocer las opciones específicas de intercambio y flexibilidad disponibles para su propiedad.`,
  },
  {
    q: '¿Se admiten mascotas en las propiedades en copropiedad?',
    a: `Las políticas sobre mascotas varían según la propiedad y se recogen en el acuerdo de copropiedad y en las normas de la casa. Algunas propiedades sí dan la bienvenida a mascotas, mientras que otras las restringen para proteger el mobiliario, los jardines y la experiencia de los demás propietarios. Si viajar con mascota es importante para usted, es algo que conviene aclarar antes de la compra — nuestro equipo puede filtrar las propiedades disponibles según las políticas pet-friendly. Donde se admiten mascotas, se aplican las normas habituales de buen uso: mantenerlas alejadas del mobiliario, asegurar que la propiedad quede limpia a la salida, y dar aviso previo a la empresa gestora.`,
  },
  {
    q: '¿Qué pasa si algo se daña durante mi estancia?',
    a: `El desgaste menor está cubierto por el presupuesto general de mantenimiento de la propiedad, compartido equitativamente entre todos los copropietarios. Si durante su estancia se produce un daño más allá del uso normal — por ejemplo, una rotura accidental de mobiliario o equipamiento — se espera que lo comunique con prontitud al gestor de la propiedad. La mayoría de los acuerdos de copropiedad incluyen un mecanismo de fianza o de seguro para cubrir estas eventualidades, garantizando que la propiedad quede restaurada a su plena calidad antes de la llegada del siguiente propietario. Solo se requiere transparencia y comunicación inmediata con el equipo de gestión; el proceso se gestiona profesionalmente y sin dramatismos.`,
  },
  {
    q: '¿Puedo hacer cambios o mejoras en la propiedad?',
    a: `Los cambios mayores en la propiedad — redecoración, modificaciones estructurales o compras significativas — requieren el acuerdo de todos los copropietarios y se coordinan a través de la empresa de gestión. Esto es por diseño: la propiedad es un activo compartido y cualquier cambio afecta a todos los propietarios. En la práctica, la empresa de gestión maneja todas las decisiones significativas en nombre del grupo de copropietarios, y la mayoría de las propiedades ya están amuebladas y diseñadas a un nivel alto que requiere poca intervención. Si tiene sugerencias o mejoras en mente, lo correcto es plantearlas a través del canal de comunicación entre copropietarios o en la revisión periódica entre propietarios, donde se escuchan todas las voces.`,
  },
];

export default function StayingFAQsES() {
  const [open, setOpen] = useState(null);
  const canonicalUrl = 'https://co-ownership-property.com/es/disfrutar-copropiedad-preguntas-frecuentes/';

  return (
    <>
      <Head>
        <title>Disfrutar de su copropiedad — preguntas frecuentes | Co-Ownership Property</title>
        <meta name="description" content="Todo lo que necesita saber para disfrutar de su propiedad en copropiedad — reservas, llegada, invitados, programación estacional, ingresos por alquiler y normas de la casa." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonicalUrl} />
        {hreflangLinks({ englishPath: '/es/disfrutar-copropiedad-preguntas-frecuentes' })}
        <meta property="og:title" content="Disfrutar de su copropiedad — preguntas frecuentes" />
        <meta property="og:description" content="Reservas, llegada, invitados, programación estacional, ingresos por alquiler y normas de la casa." />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="es_ES" />
        <meta name="twitter:card" content="summary_large_image" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": FAQS.map(({ q, a }) => ({
            "@type": "Question",
            "name": q,
            "acceptedAnswer": { "@type": "Answer", "text": a },
          })),
        }) }} />
      </Head>
      <Header />

      <section className="page-hero">
        <p className="eyebrow">Guía del propietario</p>
        <h1>Disfrutar de su copropiedad — <em>preguntas frecuentes</em></h1>
        <p className="subtitle">Todo lo que necesita saber sobre cómo reservar su tiempo, llegar, recibir invitados y sacar el máximo partido a su propiedad en copropiedad.</p>
      </section>

      <section className="faq-section">
        <p className="faq-eyebrow">Preguntas habituales</p>
        <h2 className="faq-heading">Preguntas <em>frecuentes</em></h2>
        <div className="bfaq-list">
          {FAQS.map((item, i) => (
            <div key={i} className="bfaq-row">
              <button
                className="bfaq-btn"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className="bfaq-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="bfaq-question">{item.q}</span>
                <span className={`bfaq-arrow${open === i ? ' bfaq-arrow--open' : ''}`} />
              </button>
              {open === i && (
                <div className="bfaq-answer">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="sec" style={{ background: 'var(--cream-bg)', paddingTop: 60, paddingBottom: 80 }}>
        <div className="sec-inner" style={{ maxWidth: 760 }}>
          <p className="eyebrow" style={{ textAlign: 'center', marginBottom: '2rem' }}>Recursos útiles</p>
          <div className="bfaq-links">
            <a href="/es/comprar-copropiedad-preguntas-frecuentes/" className="bfaq-link">Comprar una copropiedad — FAQ →</a>
            <a href="/es/como-funciona/" className="bfaq-link">Cómo funciona la copropiedad →</a>
            <a href="/our-homes/" className="bfaq-link">Ver todas las propiedades →</a>
            <a href="/es/copropiedad/" className="bfaq-link">Guía completa de copropiedad →</a>
            <a href="/es/contacto/" className="bfaq-link">Hablar con un experto →</a>
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
