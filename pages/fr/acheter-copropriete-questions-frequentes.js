import Head from 'next/head';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import hreflangLinks from '@/components/HreflangLinks';

// Localisation FR de /buying-a-co-ownership-property-faqs.
// Schéma FAQPage pour Google. Conserve la comparaison explicite
// avec la multibien/timeshare/temps partagé dans la Q2, sans
// positionner notre produit comme tel ailleurs dans le contenu.

const FAQS = [
  {
    q: 'Qu\'est-ce qu\'un bien en copropriété, et comment fonctionne le bien fractionnée ?',
    a: `Un bien en copropriété — aussi appelée bien fractionnée — est une résidence secondaire de luxe acquise conjointement par un petit groupe de propriétaires, typiquement jusqu'à huit, via une LLC (Limited Liability Company) constituée spécifiquement pour ce bien. Cette LLC détient 100 % du titre de propriété, et la même structure est utilisée de manière homogène à travers tout le portefeuille international — France, Espagne, Italie, Portugal et États-Unis. Chaque acheteur acquiert par acte authentique un membership interest dans cette LLC — et, par extension, une véritable bien sur le bien immobilier lui-même. À la différence d'une multibien ou d'un timeshare, votre nom (ou celui de votre société) figure derrière le titre de propriété, vous bénéficiez de toute appréciation de valeur, et vous pouvez vendre votre part sur le marché ouvert quand vous le souhaitez. Une société professionnelle de gestion s'occupe de toutes les opérations quotidiennes — entretien, ménage, piscine, jardin et, le cas échéant, la location des semaines non utilisées — pour que vous arriviez, profitiez, et repartiez.`,
  },
  {
    q: 'En quoi la copropriété diffère-t-elle du timeshare ou de la multibien ? Pourquoi est-ce une meilleure option ?',
    a: `La différence est fondamentale. Un timeshare ou une multibien (en France régie par le régime de la jouissance d'immeubles à temps partagé) vous donne uniquement le droit d'utiliser un bien pendant une période fixe chaque année — vous achetez du temps, pas de l'immobilier. Votre nom ne figure sur aucun titre de propriété, l'actif ne prend pas de valeur, et vous êtes enfermé dans un système d'adhésion ou de points notoirement difficile à quitter. La copropriété vous donne un actif immobilier véritable, acté. Vous êtes propriétaire d'une fraction d'une vraie résidence via une structure sociétaire. Votre nom (ou celui de votre société) figure sur le titre. Vous participez à toute appréciation du capital. Vous pouvez vendre, donner ou transmettre votre part à votre famille avec une complexité juridique minimale. Vous profitez de le bien avec souplesse — à partir de deux ou trois nuits seulement — au lieu d'une semaine fixe chaque année. Et une équipe professionnelle de conciergerie et de gestion s'occupe de tout, y compris l'option de générer des revenus locatifs durant les semaines que vous n'utilisez pas.`,
  },
  {
    q: 'Combien de parts puis-je acheter, et combien de jours chaque part me donne-t-elle ?',
    a: `La plupart des biens sont structurées en huit parts égales, chaque part de 1/8 donnant droit à environ 42 à 45 jours d'usage privé par an — soit environ six semaines. Vous pouvez généralement acquérir entre une et quatre parts d'une même bien (jusqu'à 50 %), ce qui vous permet de cumuler 44, 88, 132 ou jusqu'à 176 jours par an. On évite qu'un titulaire dépasse 50 % afin qu'aucun copropriétaire ne puisse dominer les décisions de la société. Si vous souhaitez disposer de plus de temps au total, vous pouvez acquérir des parts dans plusieurs biens réparties sur différentes destinations. L'usage est généralement géré via un calendrier rotatif ou une plateforme numérique de réservation qui garantit à tous les copropriétaires un accès équitable aux dates de haute saison dans le temps.`,
  },
  {
    q: 'Qu\'est-ce qui est inclus dans le prix d\'achat d\'une part en copropriété fractionnée ?',
    a: `Le prix d'une part en copropriété est pleinement tout compris. Il couvre votre titre de propriété acté, les droits de mutation et frais de transfert, le coût intégral de l'acquisition du bien, les travaux de rénovation et d'aménagement, le design d'intérieur professionnel, le mobilier et l'équipement, ainsi que la constitution juridique de la société propriétaire. Il n'y a pas d'extras cachés ni de surprises juridiques à la signature. Les coûts récurrents — gestion annuelle de le bien, entretien, assurances, impôts locaux et charges — sont répartis proportionnellement entre tous les copropriétaires, gardant vos dépenses annuelles très faibles par rapport à le bien entier d'un bien équivalent.`,
  },
  {
    q: 'Dois-je payer les droits de mutation ou les frais de notaire séparément en achetant une part fractionnée ?',
    a: `Non — et c'est l'un des principaux avantages financiers de la copropriété. Les droits de mutation et les honoraires notariaux ont été payés une seule fois lors de l'acquisition initiale du bien et de la constitution de la société propriétaire. Lorsque vous achetez une part de cette société existante, vous ne déclenchez pas une nouvelle mutation immobilière, donc aucun nouveau droit de mutation plein ne s'applique. Tous les coûts sont intégrés au prix de la part. Cela rend le processus d'achat nettement plus efficient que l'acquisition d'un bien entier, où les seuls droits de mutation peuvent représenter 7 à 10 % du prix d'achat en France ou en Espagne.`,
  },
  {
    q: 'Puis-je acheter une part fractionnée en tant qu\'étranger ou non-résident ?',
    a: `Absolument. Il n'y a pas de restrictions de nationalité pour l'acquisition immobilière en France, Espagne, Italie, Portugal ou aux États-Unis — et la copropriété fonctionne via la même structure LLC dans chaque marché, accessible aux résidents comme aux non-résidents. Dans chaque pays, les copropriétaires détiennent un membership interest dans une LLC constituée spécifiquement pour le bien. Un avantage fiscal clé pour les non-résidents qui achètent en France : l'Impôt sur la Fortune Immobilière (IFI) ne s'applique que si la valeur nette de vos actifs immobiliers français dépasse 1,3 million d'euros. Comme vous détenez une fraction du bien plutôt que la totalité, vous pourriez être copropriétaire d'une villa à 5 millions d'euros tout en restant sous ce seuil — sans payer d'IFI français du tout.`,
  },
  {
    q: 'Puis-je acquérir une part via ma société plutôt qu\'à titre personnel ?',
    a: `Oui. Vous pouvez acquérir une part fractionnée à titre personnel ou via votre propre société, trust ou structure holding. La société copropriétaire qui détient le bien est entièrement indépendante de vos finances personnelles ou corporatives. Sur le plan fiscal, tout ce qui se passe au sein de la société propriétaire du bien est géré de façon efficiente au nom de tous les copropriétaires. Il convient de discuter avec votre expert-comptable de toute obligation déclarative dans votre pays de résidence — la même diligence que vous appliqueriez à tout investissement en résidence secondaire à l'étranger.`,
  },
  {
    q: 'Combien de temps prend le processus d\'achat d\'une part fractionnée ?',
    a: `L'achat d'une part fractionnée est typiquement bien plus rapide que l'acquisition d'un bien entier. Pour les acheteurs au comptant, le processus de la réservation à la signature dure habituellement 4 à 8 semaines. Cela comprend le contrat de réservation, le délai de rétractation, la documentation de transmission de parts (en français et/ou anglais selon préférence) et la signature finale chez le notaire. Si un prêt est impliqué, le délai peut s'allonger de quelques mois. Vendre une part suit un calendrier similaire. Transmettre une part à un enfant ou à un proche est encore plus simple — cela peut se faire en moins d'un mois, souvent pour de modestes frais juridiques, ce qui fait de la copropriété l'une des structures immobilières les plus favorables à la transmission patrimoniale.`,
  },
  {
    q: 'Y a-t-il un délai de rétractation après la signature du contrat de réservation ?',
    a: `Oui, les protections de l'acquéreur sont intégrées au processus de copropriété. En France, les acheteurs bénéficient habituellement de deux à trois délais de rétractation distincts à différentes étapes de la réservation et de l'achat de parts. Pendant chaque fenêtre, vous pouvez vous retirer de l'opération sans pénalité financière. Tous les contrats et documents sont fournis en français (et en anglais selon préférence). Cette transparence et cette protection juridique font partie des raisons pour lesquelles la copropriété est utilisée depuis des décennies par des familles et des amis pour partager une résidence secondaire en France, en Espagne et ailleurs.`,
  },
  {
    q: 'Puis-je profiter de toute le bien même si je n\'en détiens qu\'une fraction ?',
    a: `Oui — entièrement. Lorsque vous réservez votre temps d'usage, vous disposez d'un accès exclusif à toute le bien : chaque chambre, le jardin, la piscine, la terrasse et tous les équipements. Les copropriétaires tournent leurs séjours, donc vous ne croiserez jamais un autre propriétaire dans la maison. Vous êtes libre d'inviter des amis et de la famille à vous rejoindre, ou de leur permettre de séjourner indépendamment pendant votre temps alloué. En pratique, l'expérience est indiscernable de la pleine propriété — la différence tient au prix que vous avez payé et aux coûts que vous partagez. Vous pouvez organiser des dîners, publier sur les réseaux sociaux et traiter le bien entièrement comme votre propre résidence.`,
  },
  {
    q: 'Comment le temps d\'usage est-il réparti équitablement entre copropriétaires ?',
    a: `L'usage est attribué via un système de rotation clair et équitable. Chaque part de 1/8 donne droit à environ 42 à 45 jours par an, structurés pour que tous les copropriétaires accèdent aux semaines de haute et moyenne saison équitablement sur un cycle pluriannuel. De nombreuses biens utilisent en plus une plateforme numérique de réservation qui permet aux propriétaires de réserver des dates précises, d'échanger des semaines avec d'autres propriétaires ou de prolonger un séjour lorsque la disponibilité le permet. La société de gestion administre le calendrier et gère toute la coordination, de sorte que les propriétaires n'ont jamais à négocier directement entre eux.`,
  },
  {
    q: 'Puis-je louer mes semaines lorsque je n\'utilise pas le bien ?',
    a: `Dans de nombreux cas, oui. Plusieurs de nos biens en copropriété permettent aux propriétaires d'inscrire leurs semaines inutilisées dans un programme de location géré professionnellement. La société de gestion s'occupe du marketing, de la réservation, de l'arrivée du locataire, du ménage et de l'entretien. Les revenus locatifs vous sont reversés directement. Dans les destinations à forte demande — la Côte d'Azur, Ibiza, les Alpes françaises, le Colorado — les rendements locatifs peuvent être suffisamment solides pour compenser significativement vos charges annuelles, et générer dans certains cas un rendement net sur votre investissement. Vérifiez toujours la politique de location d'un bien spécifique auprès de notre équipe avant l'achat.`,
  },
  {
    q: 'Qui gère le bien et qu\'est-ce que cela comprend ?',
    a: `Chaque bien en copropriété de notre plateforme est suivie par une société de gestion professionnelle dédiée. Son périmètre couvre absolument tout : entretien courant et réparations, ménage professionnel entre chaque séjour, soin de la piscine et du jardin, gestion des fournisseurs, conformité fiscale locale et intervention d'urgence. À votre arrivée, la résidence est prête comme à l'hôtel — linge frais, essentiels approvisionnés, tout en ordre. Vous n'avez pas à coordonner d'artisans, à vous inquiéter de la chaudière ou à passer vos vacances à gérer un bien. Cette charge est entièrement supprimée.`,
  },
  {
    q: 'Combien de temps puis-je conserver ma part fractionnée ? Est-ce de la pleine propriété ?',
    a: `Oui — les biens sont des actifs en pleine propriété (en France et en Espagne). Il n'y a pas de date de fin sur votre titre. Vous pouvez conserver votre part pendant 10, 30 ou 50 ans, la transmettre à vos enfants ou la vendre à tout moment. Beaucoup de structures sociétaires utilisées ont une durée légale de 99 ans, mais en pratique votre bien est indéfinie. C'est une proposition fondamentalement différente d'un timeshare ou d'une adhésion à un club de vacances, qui expirent typiquement ou imposent des clauses de sortie lourdes. Votre part fractionnée est un véritable actif immobilier qui prend de la valeur avec le marché immobilier sous-jacent.`,
  },
  {
    q: 'Le bien est-elle entièrement meublée, et le mobilier m\'appartient-il aussi ?',
    a: `Oui dans les deux cas. Chaque bien en copropriété est livrée clé en main — intérieurs professionnellement conçus, mobilier de haute qualité, cuisine entièrement équipée, linge, serviettes, et tout le nécessaire à l'usage quotidien dès le premier jour. Vous n'avez rien à apporter et rien à dépenser en aménagement. En tant que copropriétaire, vous détenez également une part indirecte du mobilier et de l'équipement proportionnelle à votre part. Une part de 1/8 équivaut à 1/8 de la valeur du mobilier. Cela se reflète dans la valeur globale du patrimoine que vous possédez.`,
  },
  {
    q: 'Puis-je acheter des parts ensemble avec des membres de ma famille ou des amis ?',
    a: `Oui — et c'est l'une des manières les plus populaires de structurer un achat en copropriété. Des groupes d'amis, de frères et sœurs ou de membres de la famille étendue peuvent chacun acquérir une ou plusieurs parts indépendamment, toutes au sein de la même société propriétaire. Notre structure de gestion professionnelle est précisément conçue pour supprimer les frictions qui surviennent fréquemment quand des familles gèrent un bien partagé de manière informelle. Un cadre juridique clair, un calendrier d'usage rotatif et une société de gestion neutre garantissent que les relations restent intactes — quelle que soit l'évolution de l'usage au fil du temps.`,
  },
  {
    q: 'Puis-je amener mon propre groupe pour partager un bien ?',
    a: `Absolument. Si vous avez un groupe déjà constitué — amis de ski qui veulent un chalet dans les Alpes françaises, collègues à la recherche d'une villa sur la Côte d'Azur, ou membres de la famille voulant une base partagée en Italie — nous pouvons sourcer et structurer une copropriété spécifiquement autour de votre groupe. Vous organisez entre vous qui achète combien de parts, et nous gérons toute la partie juridique, la gestion et la logistique. La couche de gestion professionnelle assure que même les groupes les plus soudés bénéficient d'un cadre clair qui protège les intérêts de chacun à mesure que les circonstances évoluent au fil des années.`,
  },
  {
    q: 'Si je trouve un bien qui me plaît, pouvez-vous m\'aider à trouver des co-acquéreurs pour les parts restantes ?',
    a: `Oui. Si vous identifiez un bien que vous souhaitez partager mais qu'il vous manque des acheteurs pour les parts restantes, nous pouvons les chercher dans notre réseau d'acquéreurs qualifiés. Nous vous demandons de vous engager sur un minimum de 50 % des parts totales en amont. Important : vous n'avez pas à attendre que toutes les parts soient vendues pour commencer à utiliser le bien — votre droit d'usage commence dès que votre part est constituée. Cela signifie que vous pouvez commencer à profiter de la maison pendant que les parts restantes sont placées auprès de copropriétaires vérifiés, plutôt que de rester sur la touche.`,
  },
  {
    q: 'Combien de temps après l\'achat puis-je commencer à utiliser le bien ?',
    a: `Pour les biens où la société est déjà constituée et la résidence prête à l'usage, vous pouvez généralement commencer à réserver dans les jours qui suivent la finalisation de l'achat — avec les premiers séjours possibles en quelques semaines. Si le bien est encore en rénovation ou en cours d'aménagement intérieur au moment de l'achat, il y aura une période d'achèvement avant qu'elle ne soit prête. Dans tous les cas, le délai est considérablement plus rapide que l'achat d'un bien traditionnel, où les procédures, les rénovations et l'ameublement prennent typiquement six mois à plus d'un an avant que vous ne puissiez réellement profiter de la résidence.`,
  },
  {
    q: 'Puis-je financer l\'achat d\'une part fractionnée par un prêt ?',
    a: `Oui, un financement est disponible pour les achats en copropriété fractionnée. La structure aujourd'hui la plus répandue est le prêt in fine, où vous empruntez contre la valeur de votre part. La majorité de nos acheteurs paient au comptant ou libèrent du capital de leur résidence principale pour financer l'achat — ce qui rend le modèle accessible sans la complexité d'arranger un nouveau prêt. Cela dit, le marché du crédit pour la copropriété fractionnée évolue rapidement, et des options plus souples apparaissent. Contactez notre équipe pour discuter des options de financement les plus récentes adaptées à votre situation et au pays d'achat.`,
  },
];

export default function BuyingFAQsFR() {
  const [open, setOpen] = useState(null);
  const canonicalUrl = 'https://co-ownership-property.com/fr/acheter-copropriete-questions-frequentes/';

  return (
    <>
      <Head>
        <title>Acheter une copropriété — questions fréquentes | Co-Ownership Property</title>
        <meta name="description" content="Tout ce qu'il faut savoir pour acheter un bien en copropriété — structure juridique, coûts, prêts, et fonctionnement du processus d'achat de la réservation à la signature." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href={canonicalUrl} />
        {hreflangLinks({ englishPath: '/fr/acheter-copropriete-questions-frequentes' })}
        <meta property="og:title" content="Acheter une copropriété — questions fréquentes" />
        <meta property="og:description" content="Structure juridique, coûts, prêts et processus d'achat d'un bien en copropriété." />
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
        <p className="eyebrow">Guide de l'acquéreur</p>
        <h1>Acheter une copropriété — <em>questions fréquentes</em></h1>
        <p className="subtitle">Tout ce qu'il faut savoir pour acquérir une part fractionnée — de la structure juridique et des coûts au processus d'achat et tout ce qui suit.</p>
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
            <a href="/our-homes/" className="bfaq-link">Voir tous les biens →</a>
            <a href="/fr/a-propos/" className="bfaq-link">À propos de Co-Ownership Property →</a>
            <a href="/fr/comment-ca-marche/" className="bfaq-link">Comment fonctionne la copropriété →</a>
            <a href="/fr/copropriete-residence-secondaire/" className="bfaq-link">Guide complet de la copropriété →</a>
            <a href="/fr/profiter-copropriete-questions-frequentes/" className="bfaq-link">Profiter de votre copropriété — FAQ →</a>
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
