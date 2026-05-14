import Head from 'next/head';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';

// Localización ES de /buying-a-co-ownership-property-faqs.
// Esquema FAQPage para Google. Mantiene la comparación explícita
// con la multipropiedad/timeshare en la Q2, sin posicionar el
// producto como tal en el resto del contenido.

const FAQS = [
  {
    q: '¿Qué es exactamente una propiedad en copropiedad y cómo funciona la propiedad fraccional?',
    a: `Una propiedad en copropiedad — también llamada propiedad fraccional — es una segunda residencia de lujo adquirida conjuntamente por un grupo pequeño de propietarios, normalmente hasta ocho, a través de una LLC (Limited Liability Company) constituida específicamente para ese inmueble. Esa LLC es titular del 100 % del inmueble en el Registro de la Propiedad, y la misma estructura se utiliza de forma homogénea en toda la cartera internacional — España, Francia, Italia, Portugal y Estados Unidos. Cada comprador adquiere mediante escritura un membership interest (participación) en esa LLC — y, por extensión, una titularidad real sobre el propio inmueble. A diferencia de la multipropiedad o timeshare, su nombre (o el de su sociedad) figura detrás de la titularidad registral, usted se beneficia de la revalorización y puede vender su participación en el mercado abierto cuando lo desee. Una empresa profesional de gestión se ocupa de todas las operaciones del día a día — mantenimiento, limpieza, piscina, jardín y, en su caso, el alquiler de las semanas no utilizadas — para que usted simplemente llegue, disfrute y se vaya.`,
  },
  {
    q: '¿En qué se diferencia la copropiedad de la multipropiedad o timeshare? ¿Por qué es una opción mejor?',
    a: `La diferencia es fundamental. La multipropiedad o timeshare (en España regulada como aprovechamiento por turno) le da el derecho a usar una propiedad durante un período fijo cada año — usted compra tiempo, no inmueble. Su nombre no figura en ninguna titularidad registral, el activo no se revaloriza y queda atrapado en un sistema de membresía o puntos notoriamente difícil de abandonar. La copropiedad le da un activo inmobiliario real, escriturado. Usted es titular de una fracción de una vivienda real a través de una estructura societaria. Su nombre (o el de su sociedad) aparece en la titularidad. Participa en cualquier revalorización del capital. Puede vender, donar o transmitir su participación a su familia con mínima complejidad legal. Disfruta de la propiedad con flexibilidad — desde tan solo dos o tres noches — en lugar de una semana fija cada año. Y un equipo profesional de conserjería y gestión se ocupa de todo, incluida la opción de generar ingresos por alquiler durante las semanas que usted no use la vivienda.`,
  },
  {
    q: '¿Cuántas participaciones puedo comprar y cuántos días me da cada una?',
    a: `La mayoría de las propiedades se estructuran en ocho participaciones iguales, y cada participación de 1/8 le da derecho a unos 42-45 días de uso privado al año — aproximadamente seis semanas. Normalmente puede adquirir entre una y cuatro participaciones de la misma propiedad (hasta el 50 %), lo que le permite acumular 44, 88, 132 o hasta 176 días al año. Se evita que un solo titular supere el 50 % para garantizar que ningún copropietario pueda dominar las decisiones de la sociedad. Si quiere disponer de más tiempo en total, puede comprar participaciones en varias propiedades de distintos destinos. El uso suele gestionarse mediante un calendario rotatorio o una plataforma digital de reservas que garantiza a todos los copropietarios un acceso equitativo a las fechas de temporada alta a lo largo del tiempo.`,
  },
  {
    q: '¿Qué incluye el precio de compra de una participación de copropiedad fraccional?',
    a: `El precio de una participación de copropiedad es plenamente todo incluido. Cubre su titularidad escriturada, los impuestos de transmisión, el coste íntegro de la adquisición del inmueble, las obras de renovación y acondicionamiento, el interiorismo profesional, el mobiliario y el equipamiento, así como la constitución legal de la sociedad propietaria. No hay extras ocultos ni sorpresas notariales al cerrar. Los costes recurrentes — gestión anual de la propiedad, mantenimiento, seguros, impuestos locales y suministros — se reparten proporcionalmente entre todos los copropietarios, manteniendo sus gastos anuales muy bajos en comparación con la propiedad plena de un inmueble equivalente.`,
  },
  {
    q: '¿Pago el ITP o los honorarios legales por separado al comprar una participación fraccional?',
    a: `No — y esta es una de las ventajas financieras clave de la copropiedad. El ITP y los gastos notariales se pagaron una sola vez cuando la propiedad se adquirió originalmente y se constituyó la sociedad. Cuando usted compra una participación de esa sociedad ya existente, no está provocando una nueva transmisión inmobiliaria, así que no se aplica un nuevo ITP completo. Todos los costes están integrados en el precio de la participación. Esto hace que el proceso de compra sea significativamente más eficiente en costes que adquirir una propiedad entera, donde solo el ITP puede representar entre un 7 % y un 10 % del precio en España o Francia.`,
  },
  {
    q: '¿Puedo comprar una participación fraccional como extranjero o no residente?',
    a: `Por supuesto. No hay restricciones por nacionalidad para adquirir inmuebles en España, Francia, Italia, Portugal o Estados Unidos — y la copropiedad funciona a través de la misma estructura LLC en cada mercado, disponible tanto para residentes como no residentes. En cada país, los copropietarios mantienen un membership interest en una LLC constituida específicamente para el inmueble. Una ventaja fiscal importante para no residentes que compran en Francia es que el impuesto sobre patrimonio inmobiliario (IFI) solo se aplica si el valor neto de sus activos inmobiliarios en Francia supera los 1,3 millones de euros. Como usted es titular de una fracción del inmueble y no de la totalidad, podría ser copropietario de una villa de 5 millones y mantenerse por debajo del umbral — sin pagar IFI alguno.`,
  },
  {
    q: '¿Puedo comprar la participación a través de mi sociedad limitada en lugar de a título personal?',
    a: `Sí. Puede adquirir una participación fraccional a título personal o a través de su propia sociedad limitada, fideicomiso o estructura holding. La sociedad copropietaria que es titular del inmueble es completamente independiente de sus finanzas personales o corporativas. Desde el punto de vista fiscal, todo lo que ocurre dentro de la sociedad titular del inmueble se gestiona de forma eficiente en nombre de todos los copropietarios. Conviene que hable con su asesor fiscal sobre cualquier obligación de declaración en su país de residencia — la misma diligencia que aplicaría a cualquier inversión en una segunda residencia en el extranjero.`,
  },
  {
    q: '¿Cuánto tarda el proceso de compra de una participación fraccional?',
    a: `La compra de una participación fraccional es típicamente mucho más rápida que la adquisición de una vivienda entera. Para compradores al contado, el proceso desde la reserva hasta la firma suele durar entre 4 y 8 semanas. Esto incluye el contrato de reserva, los plazos de desistimiento, la documentación de transmisión de participaciones (en castellano y/o inglés según preferencia) y la firma final. Si hay hipoteca de por medio, el proceso puede prolongarse algunos meses más. Vender una participación funciona en un plazo similar. Transmitir una participación a un hijo o familiar es aún más sencillo — puede hacerse en menos de un mes, a menudo por importes legales muy reducidos, lo que convierte a la copropiedad en una de las estructuras inmobiliarias más amigables para la planificación sucesoria.`,
  },
  {
    q: '¿Existe un período de desistimiento después de firmar el contrato de reserva?',
    a: `Sí, las protecciones del comprador están integradas en el proceso de copropiedad. En España y Francia, los compradores se benefician habitualmente de dos o tres períodos distintos de desistimiento en diferentes fases del proceso de reserva y compra de participaciones. Durante cada ventana puede retirarse de la operación sin penalización económica. Todos los contratos y documentos se proporcionan en castellano (y en otros idiomas según corresponda al cliente). Esta transparencia y protección legal es una de las razones por las que la copropiedad lleva décadas siendo utilizada por familias y amigos para compartir segundas residencias en España, Francia y otros países.`,
  },
  {
    q: '¿Puedo disfrutar de toda la propiedad aunque solo posea una fracción?',
    a: `Sí — completamente. Cuando reserva su tiempo de uso, dispone de acceso exclusivo a toda la propiedad: cada dormitorio, jardín, piscina, terraza y servicio. Los copropietarios rotan sus estancias, así que nunca coincidirá en el inmueble con otro propietario. Puede invitar a amigos y familiares a acompañarle, o permitirles alojarse de forma independiente durante su tiempo asignado. En todos los aspectos prácticos, la experiencia es indistinguible de la propiedad plena — la diferencia está únicamente en el precio que pagó y en los costes que comparte. Puede organizar cenas, publicar en redes sociales y tratar la propiedad enteramente como su propia casa.`,
  },
  {
    q: '¿Cómo se reparte el tiempo de uso entre los copropietarios de forma justa?',
    a: `El uso se asigna mediante un sistema de rotación claro y equitativo. Cada participación de 1/8 le da derecho a unos 42-45 días al año, estructurados para que todos los copropietarios accedan a semanas de temporada alta y media de forma equitativa a lo largo de un ciclo plurianual. Muchas propiedades utilizan además una plataforma digital de reservas que permite a los propietarios reservar fechas concretas, intercambiar semanas con otros propietarios o ampliar estancias cuando hay disponibilidad. La empresa de gestión administra el calendario y se encarga de toda la coordinación, así que los propietarios nunca tienen que negociar entre sí directamente.`,
  },
  {
    q: '¿Puedo alquilar mis semanas cuando no uso la propiedad?',
    a: `En muchos casos, sí. Algunas de nuestras propiedades en copropiedad permiten a los propietarios incorporar las semanas no utilizadas a un programa de alquiler gestionado profesionalmente. La empresa de gestión se ocupa del marketing, la reserva, la entrada del huésped, la limpieza y el mantenimiento. Los ingresos por alquiler se le devuelven directamente. En destinos de alta demanda — Costa del Sol, Ibiza, los Alpes franceses, Colorado — la rentabilidad por alquiler puede ser suficiente para compensar significativamente los costes anuales, y en algunos casos generar una rentabilidad neta sobre la inversión. Confirme siempre la política de alquiler de una propiedad concreta con nuestro equipo antes de la compra.`,
  },
  {
    q: '¿Quién gestiona la propiedad y qué incluye esa gestión?',
    a: `Cada propiedad en copropiedad de nuestra plataforma está atendida por una empresa profesional de gestión dedicada. Su ámbito cubre absolutamente todo: mantenimiento rutinario y reparaciones, limpieza profesional entre cada estancia, cuidado de piscina y jardín, gestión de suministros, cumplimiento fiscal local y atención de emergencias. Cuando usted llega, la vivienda está lista a estándar de hotel — sábanas limpias, esenciales abastecidos, todo en perfecto orden. No necesita coordinar gremios, preocuparse por la caldera ni dedicar sus vacaciones a gestionar una propiedad. Esa carga queda completamente eliminada.`,
  },
  {
    q: '¿Cuánto tiempo puedo conservar mi participación fraccional? ¿Es plena propiedad?',
    a: `Sí — las propiedades son activos en plena propiedad (en España y Francia). No hay fecha de finalización en su titularidad. Puede conservar su participación durante 10, 30 o 50 años, transmitirla a sus hijos o venderla en cualquier momento. Muchas estructuras societarias utilizadas tienen una vida legal de 99 años, pero en la práctica su titularidad es indefinida. Esta es una proposición fundamentalmente distinta de la multipropiedad o la membresía de un club vacacional, que suelen caducar o conllevan cláusulas de salida onerosas. Su participación fraccional es un activo inmobiliario real que se revaloriza con el mercado inmobiliario subyacente.`,
  },
  {
    q: '¿Está la propiedad totalmente amueblada? ¿También soy dueño del mobiliario?',
    a: `Sí en ambos casos. Cada propiedad en copropiedad se entrega llave en mano — interiorismo profesional, mobiliario de alta calidad, cocina completamente equipada, sábanas, toallas y todo lo necesario para el uso diario desde el primer día. No tiene que aportar nada ni gastar un euro en equipamiento. Como copropietario, también tiene una participación indirecta en el mobiliario y el equipamiento proporcional a su parte. Una participación de 1/8 equivale a 1/8 del valor del mobiliario. Esto se refleja en el valor total del activo que usted posee.`,
  },
  {
    q: '¿Puedo comprar participaciones junto a familiares o amigos?',
    a: `Sí — y esta es una de las formas más populares en que la gente estructura una compra en copropiedad. Grupos de amigos, hermanos o miembros de la familia extendida pueden adquirir cada uno una o más participaciones de manera independiente, todas dentro de la misma sociedad propietaria. Nuestra estructura de gestión profesional está específicamente diseñada para eliminar la fricción que a menudo surge cuando las familias gestionan propiedades compartidas de manera informal. Un marco legal claro, un calendario de uso rotatorio y una empresa de gestión neutral garantizan que las relaciones se mantengan intactas — independientemente de cómo se use la propiedad a lo largo del tiempo.`,
  },
  {
    q: '¿Puedo traer mi propio grupo de personas para compartir una propiedad?',
    a: `Por supuesto. Si tiene un grupo ya formado — amigos de esquí que quieren un chalet en los Alpes franceses, compañeros que buscan una villa en la Costa Brava o familiares que quieren una base compartida en Italia — podemos buscar y estructurar una copropiedad específicamente alrededor de su grupo. Ustedes deciden quién compra cuántas participaciones y nosotros nos ocupamos de toda la parte legal, de gestión y de logística. La capa de gestión profesional asegura que incluso los grupos más unidos se beneficien de un marco claro que protege los intereses de todos a medida que las circunstancias cambian con los años.`,
  },
  {
    q: 'Si encuentro una propiedad que me encanta, ¿pueden ayudarme a encontrar copropietarios para el resto de las participaciones?',
    a: `Sí. Si identifica una propiedad que quiere compartir pero necesita otros compradores para las participaciones restantes, podemos buscarlos en nuestra red de compradores cualificados. Le pedimos que se comprometa con un mínimo del 50 % de las participaciones totales por adelantado. Lo importante: no tiene que esperar a que se vendan todas las participaciones para empezar a utilizar la propiedad — su derecho de uso empieza en cuanto se constituye su participación. Esto significa que puede empezar a disfrutar de la vivienda mientras el resto de participaciones se colocan entre copropietarios verificados, en lugar de quedarse fuera del proceso.`,
  },
  {
    q: '¿Cuán pronto puedo empezar a usar la propiedad tras completar mi compra?',
    a: `En propiedades donde la sociedad ya está constituida y la vivienda lista para uso, normalmente puede empezar a hacer reservas en cuestión de días tras completar la compra de su participación — con las primeras estancias posibles en semanas. Si la propiedad sigue en proceso de renovación o interiorismo en el momento de la compra, habrá un período de acondicionamiento antes de que esté lista para uso. En cualquier caso, el plazo es considerablemente más rápido que comprar una propiedad tradicional, donde los trámites, las reformas y el amueblamiento típicamente requieren entre seis meses y más de un año antes de poder disfrutar realmente del inmueble.`,
  },
  {
    q: '¿Puedo financiar la compra de una participación fraccional con hipoteca?',
    a: `Sí, hay financiación disponible para compras de copropiedad fraccional. La estructura más habitual hoy es la hipoteca bullet, donde se toma prestado contra el valor de su participación. La mayoría de nuestros compradores son al contado o liberan capital de su vivienda principal para financiar la compra — lo que hace el modelo accesible sin la complejidad de gestionar una hipoteca nueva. Dicho esto, el mercado hipotecario para copropiedad fraccional está evolucionando rápidamente y van apareciendo opciones más flexibles. Contacte con nuestro equipo para conocer las opciones de financiación más actuales para su situación y el país de compra.`,
  },
];

export default function BuyingFAQsES() {
  const [open, setOpen] = useState(null);
  const canonicalUrl = 'https://co-ownership-property.com/es/comprar-copropiedad-preguntas-frecuentes/';

  return (
    <>
      <Head>
        <title>Comprar una copropiedad — preguntas frecuentes | Co-Ownership Property</title>
        <meta name="description" content="Todo lo que necesita saber para comprar una propiedad en copropiedad — estructura legal, costes, hipotecas y cómo funciona el proceso de compra desde la reserva hasta la firma." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonicalUrl} />
        <HreflangLinks englishPath="/es/comprar-copropiedad-preguntas-frecuentes" />
        <meta property="og:title" content="Comprar una copropiedad — preguntas frecuentes" />
        <meta property="og:description" content="Estructura legal, costes, hipotecas y proceso de compra para una propiedad en copropiedad." />
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
        <p className="eyebrow">Guía del comprador</p>
        <h1>Comprar una copropiedad — <em>preguntas frecuentes</em></h1>
        <p className="subtitle">Todo lo que necesita saber para adquirir una participación fraccional — desde la estructura legal y los costes hasta el proceso de compra y todo lo que viene después.</p>
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
            <a href="/our-homes/" className="bfaq-link">Ver todas las propiedades →</a>
            <a href="/es/sobre-nosotros/" className="bfaq-link">Sobre Co-Ownership Property →</a>
            <a href="/es/como-funciona/" className="bfaq-link">Cómo funciona la copropiedad →</a>
            <a href="/es/copropiedad/" className="bfaq-link">Guía completa de copropiedad →</a>
            <a href="/es/disfrutar-copropiedad-preguntas-frecuentes/" className="bfaq-link">Disfrutar de su copropiedad — FAQ →</a>
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
