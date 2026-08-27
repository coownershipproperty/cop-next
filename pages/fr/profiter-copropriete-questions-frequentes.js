import Head from 'next/head';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import hreflangLinks from '@/components/HreflangLinks';

// Localisation FR de /staying-in-my-co-ownership-property-faqs.
// Schéma FAQPage pour Google. La Q8 mentionne timeshare comme
// contraste explicite (autorisé — contexte de comparaison).

const FAQS = [
  {
    q: 'Comment réserver un séjour dans mon bien en copropriété ?',
    a: `Les réservations se font directement via la plateforme de gestion immobilière — dans la plupart des cas une application mobile dédiée ou un calendrier en ligne fourni par la société de gestion. Le calendrier est généralement ouvert 10 à 24 mois à l'avance, selon l'opérateur. Vous consultez les dates disponibles, sélectionnez votre séjour, et la réservation est confirmée instantanément dans le cadre de votre quota saisonnier. Vos copropriétaires réservent indépendamment sur le même système, l'ordonnancement étant conçu pour qu'aucun propriétaire ne soit à le bien en même temps qu'un autre. Les copropriétaires sont également sélectionnés avec des préférences de séjour complémentaires afin de minimiser dès le départ les conflits sur les dates de haute saison.`,
  },
  {
    q: 'Combien de temps à l\'avance dois-je réserver mon séjour ?',
    a: `Vous pouvez réserver jusqu'à 24 mois à l'avance, avec un préavis minimum de deux jours pour les séjours de dernière minute. En haute et moyenne saison, les réservations fonctionnent via un système d'options : vous pouvez sécuriser un créneau préféré au moins 120 jours avant la date d'arrivée prévue. La plupart des systèmes de gestion fonctionnent avec deux catégories de réservation — réservations anticipées pour les périodes de pointe (confirmées bien avant la saison) et réservations de dernière minute (préavis minimum de deux jours, jusqu'à 30 jours à l'avance), qui se font directement sur le calendrier sans validation du gestionnaire. Le système est conçu pour offrir aux propriétaires un maximum de souplesse tout en assurant l'équité au sein du groupe de copropriétaires.`,
  },
  {
    q: 'Combien de jours par an puis-je séjourner dans mon bien en copropriété ?',
    a: `Votre quota annuel est directement proportionnel au nombre de parts que vous détenez. Une part de 1/8 vous donne droit à 1/8 de l'année civile — typiquement 42 à 45 nuits, soit environ six semaines ou 1,5 mois par an. Ces nuits sont réparties entre les saisons de le bien (haute, moyenne et basse pour la plupart des biens de ski et de bord de mer) afin que tous les propriétaires bénéficient équitablement de l'accès aux périodes de pointe en rotation. Si vous détenez plus d'une part, votre quota total évolue proportionnellement : 2 parts ≈ 3 mois par an, 3 parts ≈ 4,5 mois, et 4 parts (le maximum de 50 %) ≈ 6 mois. Certaines biens sont structurées en parts de 1/4, doublant le quota par part. Contactez-nous pour les détails spécifiques de le bien qui vous intéresse.`,
  },
  {
    q: 'Puis-je utiliser les jours non employés pour générer des revenus locatifs ?',
    a: `Dans de nombreux cas, oui. Si vous ne prévoyez pas d'utiliser tout ou partie de votre temps alloué sur une saison donnée, beaucoup de nos biens en copropriété permettent d'inscrire ces jours dans un programme de location géré professionnellement. La société de gestion s'occupe de toutes les opérations face au locataire — annonce, réservation, arrivée, ménage et départ — tandis que les revenus locatifs vous sont reversés directement. Les rendements locatifs dans les destinations à forte demande comme la Côte d'Azur, Ibiza, les Alpes françaises et la Toscane peuvent être suffisamment solides pour couvrir vos frais annuels de gestion et, dans certains cas, générer un rendement net. Notez que les autorisations de location varient selon le bien et la réglementation locale — certaines zones restreignent la location de courte durée, vérifiez toujours auprès de notre équipe pour un bien spécifique avant l'achat.`,
  },
  {
    q: 'Quelles sont les heures d\'arrivée et de départ ?',
    a: `L'heure d'arrivée standard est 15h00 et l'heure de départ standard 11h00. Ces horaires sont fixés pour que l'équipe de ménage et d'entretien dispose du temps nécessaire pour préparer le bien aux standards d'un hôtel entre deux séjours consécutifs. La fenêtre exacte peut varier légèrement selon le bien en fonction du calendrier de l'équipe de ménage et de l'écart entre réservations. Si vous avez besoin d'un check-in anticipé ou d'un départ tardif, il vaut toujours la peine de contacter votre gestionnaire de bien en amont — quand aucun autre séjour n'est programmé, l'aménagement est souvent possible.`,
  },
  {
    q: 'Quelle est la durée minimale de séjour ?',
    a: `La durée minimale de séjour standard est de deux nuits. Cependant, certains opérateurs et biens fonctionnent par semaines complètes, notamment les chalets de ski et les biens-resort où les changements hebdomadaires sont plus pratiques sur le plan logistique. Le minimum de séjour est conçu pour équilibrer l'efficacité opérationnelle (coûts de ménage, de préparation et de gestion) avec la souplesse pour les propriétaires. Si vous avez un besoin spécifique — par exemple un week-end ou une halte d'une nuit — contactez-nous et nous pourrons vous orienter vers les biens de notre portefeuille les plus adaptées aux courts séjours.`,
  },
  {
    q: 'Puis-je inviter de la famille et des amis à séjourner avec moi ?',
    a: `Absolument. Pendant vos séjours réservés, le bien est entièrement à vous. Vous êtes libre d'inviter des amis, des membres de la famille et des invités à vous rejoindre, ou de leur permettre d'utiliser le bien indépendamment pendant votre temps alloué. La maison est à vous pour toute la durée de votre réservation — chaque chambre, chaque équipement, la piscine, le jardin et toutes les installations. Il n'y a pas de limite au nombre d'invités dans la capacité déclarée de le bien, ni de frais supplémentaires pour les invités. Vous pouvez organiser un dîner, recevoir la famille pour tout le séjour, ou prêter votre temps à un ami. L'expérience est identique à celle de la pleine propriété.`,
  },
  {
    q: 'Puis-je prêter ou céder mon séjour à quelqu\'un d\'autre ?',
    a: `Oui. En tant que copropriétaire, vous avez le droit de transférer votre séjour réservé à un membre de votre famille, un ami ou un invité de votre choix. Vous n'êtes pas tenu d'être physiquement présent pendant un séjour que vous avez attribué à quelqu'un d'autre. C'est l'un des avantages pratiques de la copropriété par rapport au timeshare ou à la multibien — vous êtes propriétaire de l'actif et des droits de temps associés, donc vous pouvez les utiliser comme bon vous semble dans le cadre du règlement intérieur. Si vous prêtez votre séjour à quelqu'un qui ne connaît pas le bien ou le système de gestion, il est de bonne pratique de l'informer à l'avance sur les procédures d'arrivée et de départ et sur le règlement intérieur.`,
  },
  {
    q: 'Qu\'est-ce qui est inclus à mon arrivée ?',
    a: `Le bien est préparée aux standards d'un hôtel avant chaque arrivée. Cela comprend le linge de lit et de bain professionnellement lavé, une cuisine propre et entièrement équipée, et tous les appareils en parfait état. La plupart des biens en copropriété arrivent approvisionnées avec les essentiels — produits de ménage, papier et consommables de salle de bains. Certains opérateurs incluent un panier d'accueil avec des produits locaux ou du vin. La maison est aménagée avec un design d'intérieur de haut niveau, entièrement meublée et équipée de tout ce qu'il faut pour l'usage quotidien. Vous n'avez rien à apporter au-delà de vos effets personnels et de la nourriture pour votre séjour.`,
  },
  {
    q: 'Qui s\'occupe de le bien entre les séjours ?',
    a: `Une société professionnelle dédiée de gestion immobilière est responsable de la résidence à tout moment. Entre les séjours, elle gère le ménage et l'entretien général, la maintenance et les inspections de routine, le soin du jardin et de la piscine, la gestion des services publics, et toute réparation. Si quelque chose nécessite votre attention pendant votre séjour — un souci d'appareil, une question d'entretien ou une urgence — votre gestionnaire de bien est joignable directement et répond généralement rapidement. Vous ne tomberez jamais sur un problème resté sans solution. L'équipe de gestion est votre point de contact pour tout ce qui concerne le bien, vous laissant libre de simplement profiter de votre temps sur place.`,
  },
  {
    q: 'Quels sont les coûts récurrents de bien pendant mes séjours ?',
    a: `Vos coûts récurrents en tant que copropriétaire sont partagés proportionnellement entre tous les propriétaires et couvrent généralement : les frais de gestion immobilière, l'entretien et les réparations, les assurances, la taxe foncière et les autres impôts locaux, les charges, et tout service commun. Ces coûts sont répartis en fonction de votre part — ainsi, en tant que titulaire d'un 1/8, vous payez 1/8 des frais annuels, quel que soit le nombre de nuits que vous utilisez réellement. Les coûts annuels varient selon le bien et l'emplacement, mais ils sont systématiquement bien inférieurs aux coûts équivalents de la pleine propriété d'un bien comparable. Il n'y a pas de frais supplémentaires par nuit pour l'usage de le bien pendant votre temps alloué.`,
  },
  {
    q: 'Comment fonctionne la planification saisonnière pour les biens de ski et de bord de mer ?',
    a: `Les biens de ski et de bord de mer fonctionnent généralement sur deux ou trois saisons — haute, moyenne et basse (et parfois une saison intermédiaire supplémentaire). Chaque saison a des niveaux de demande différents et, par conséquent, des dynamiques de réservation différentes. Votre quota annuel de nuits est réparti entre ces saisons, le plus souvent via un calendrier rotatif qui garantit que chaque copropriétaire accède aux dates de haute saison sur un cycle pluriannuel. Cela empêche qu'un même propriétaire monopolise la semaine de Noël ou le pic de l'été chaque année. La rotation est gérée de manière transparente par la société de gestion, et le calendrier est partagé avec tous les propriétaires bien avant chaque saison.`,
  },
  {
    q: 'Puis-je échanger ou troquer mes dates allouées avec d\'autres copropriétaires ?',
    a: `Oui, dans de nombreux cas. Le système de réservation utilisé par la plupart de nos partenaires de gestion permet aux propriétaires de voir la disponibilité et, lorsqu'un autre propriétaire est d'accord, d'échanger des créneaux alloués. Certains opérateurs permettent également de mettre en réserve des jours non utilisés sur une saison pour les employer sur une autre, sous réserve de disponibilité. Cette flexibilité est l'un des avantages pratiques du modèle de copropriété — si vos projets changent, vous ne perdez pas simplement votre temps. Contactez votre gestionnaire de bien pour connaître les options spécifiques d'échange et de souplesse disponibles pour votre bien.`,
  },
  {
    q: 'Les animaux de compagnie sont-ils admis dans les biens en copropriété ?',
    a: `Les politiques relatives aux animaux varient selon le bien et sont précisées dans l'accord de copropriété et le règlement intérieur. Certaines biens accueillent volontiers les animaux, tandis que d'autres les restreignent pour protéger le mobilier, les jardins et l'expérience des autres propriétaires. Si voyager avec un animal est important pour vous, c'est un point à clarifier avant l'achat — notre équipe peut filtrer les biens disponibles selon les politiques pet-friendly. Lorsque les animaux sont admis, les règles de bonne pratique s'appliquent : tenir les animaux à l'écart du mobilier, s'assurer que le bien est propre au départ, et prévenir la société de gestion en amont.`,
  },
  {
    q: 'Que se passe-t-il si quelque chose est endommagé pendant mon séjour ?',
    a: `L'usure mineure est couverte par le budget général d'entretien de le bien, partagé équitablement entre tous les copropriétaires. Si un dommage survient pendant votre séjour au-delà de l'usage normal — par exemple, la casse accidentelle d'un meuble ou d'un équipement — il est attendu que vous le signaliez rapidement au gestionnaire de bien. La plupart des accords de copropriété prévoient un dépôt de garantie ou un mécanisme d'assurance pour couvrir ces éventualités, garantissant que le bien soit restaurée à son plein standard avant l'arrivée du propriétaire suivant. Seules la transparence et la communication rapide avec l'équipe de gestion sont nécessaires ; le processus est géré professionnellement et sans drame.`,
  },
  {
    q: 'Puis-je apporter des changements ou des améliorations à le bien ?',
    a: `Les changements majeurs sur le bien — redécoration, modifications structurelles, ou achats significatifs — requièrent l'accord de tous les copropriétaires et sont coordonnés via la société de gestion. C'est volontaire : le bien est un actif partagé et tout changement affecte tous les propriétaires. En pratique, la société de gestion prend toutes les décisions significatives au nom du groupe de copropriétaires, et la plupart des biens sont déjà meublées et conçues à un niveau élevé qui ne requiert que peu d'intervention. Si vous avez des suggestions ou des améliorations en tête, la bonne démarche est de les soulever via le canal de communication entre copropriétaires ou lors de la revue périodique des propriétaires, où toutes les voix sont entendues.`,
  },
];

export default function StayingFAQsFR() {
  const [open, setOpen] = useState(null);
  const canonicalUrl = 'https://co-ownership-property.com/fr/profiter-copropriete-questions-frequentes/';

  return (
    <>
      <Head>
        <title>Profiter de votre copropriété — questions fréquentes | Co-Ownership Property</title>
        <meta name="description" content="Tout ce qu'il faut savoir pour profiter de votre bien en copropriété — réservations, arrivée, invités, planification saisonnière, revenus locatifs et règlement intérieur." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonicalUrl} />
        {hreflangLinks({ englishPath: '/fr/profiter-copropriete-questions-frequentes' })}
        <meta property="og:title" content="Profiter de votre copropriété — questions fréquentes" />
        <meta property="og:description" content="Réservations, arrivée, invités, planification saisonnière, revenus locatifs et règlement intérieur." />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
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
        <p className="eyebrow">Guide du propriétaire</p>
        <h1>Profiter de votre copropriété — <em>questions fréquentes</em></h1>
        <p className="subtitle">Tout ce qu'il faut savoir pour réserver votre temps, arriver, recevoir des invités et tirer le meilleur parti de votre bien en copropriété.</p>
      </section>

      <section className="faq-section">
        <p className="faq-eyebrow">Questions courantes</p>
        <h2 className="faq-heading">Questions <em>fréquentes</em></h2>
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
          <p className="eyebrow" style={{ textAlign: 'center', marginBottom: '2rem' }}>Ressources utiles</p>
          <div className="bfaq-links">
            <a href="/fr/acheter-copropriete-questions-frequentes/" className="bfaq-link">Acheter une copropriété — FAQ →</a>
            <a href="/fr/comment-ca-marche/" className="bfaq-link">Comment fonctionne la copropriété →</a>
            <a href="/our-homes/" className="bfaq-link">Voir tous les biens →</a>
            <a href="/fr/copropriete-residence-secondaire/" className="bfaq-link">Guide complet de la copropriété →</a>
            <a href="/fr/contact/" className="bfaq-link">Parler à un expert →</a>
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
