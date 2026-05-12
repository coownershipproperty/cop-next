import Head from 'next/head';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';

// Post stratégique : reprend la phrase signature de Prello (« acheter
// une résidence secondaire à plusieurs ») désormais orpheline depuis la
// liquidation de l'opérateur en septembre 2024. Cible identifiée par
// keyword-research-french.md comme la plus haute valeur du marché FR :
// volume estimé 3 000–5 000 recherches/mois, zéro concurrence active.
// Structure FAQ + featured-snippet-friendly.

export default function AcheterResidenceSecondaireAPlusieurs() {
  const canonicalUrl = 'https://co-ownership-property.com/fr/blog/acheter-residence-secondaire-a-plusieurs/';
  return (
    <>
      <Head>
        <title>Acheter une résidence secondaire à plusieurs : le guide complet [2026]</title>
        <meta name="description" content="Comment acheter une résidence secondaire à plusieurs en 2026 : modèles juridiques (SCI, indivision, copropriété), fiscalité, calendrier, sortie. Guide pratique complet." />
        <link rel="canonical" href={canonicalUrl} />
        <HreflangLinks englishPath="/fr/blog/acheter-residence-secondaire-a-plusieurs" />
        <meta property="og:type" content="article" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:title" content="Acheter une résidence secondaire à plusieurs : le guide complet 2026" />
        <meta property="og:description" content="SCI, indivision, copropriété : comment acheter à plusieurs en 2026, étape par étape." />
        <meta property="og:url" content={canonicalUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: 'Acheter une résidence secondaire à plusieurs : le guide complet 2026',
          datePublished: '2026-05-10',
          author: { '@type': 'Organization', name: 'Co-Ownership Property' },
          publisher: { '@type': 'Organization', name: 'Co-Ownership Property', logo: { '@type': 'ImageObject', url: '/wp-content/uploads/2025/10/COP-Logo-Large.png' } },
          mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
        }) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            { '@type': 'Question', name: 'Combien de personnes peuvent acheter une résidence secondaire à plusieurs ?', acceptedAnswer: { '@type': 'Answer', text: "Il n'existe pas de limite légale stricte. En indivision classique, 2 à 5 acquéreurs est le format le plus courant en France. Avec une SCI, on peut associer jusqu'à 8 ou 16 copropriétaires sans difficulté juridique. Le modèle de copropriété professionnelle utilise typiquement 8 quotes-parts (1/8 chacune) — équilibre entre accessibilité financière et nombre raisonnable de jours d'usage par an (45 nuits)." } },
            { '@type': 'Question', name: 'Quel est le meilleur statut juridique pour acheter à plusieurs ?', acceptedAnswer: { '@type': 'Answer', text: "Pour 2 à 4 personnes proches (couple, famille), l'indivision peut suffire mais reste juridiquement instable (Code civil article 815). Pour 5 personnes ou plus, ou pour des co-acquéreurs qui ne sont pas de la même famille, la SCI (Société Civile Immobilière) est le meilleur choix : stabilité, gouvernance claire dans les statuts, transmission simple des parts, fiscalité maîtrisée." } },
            { '@type': 'Question', name: 'Comment se passe la sortie quand on veut vendre ?', acceptedAnswer: { '@type': 'Answer', text: "En SCI, vous cédez vos parts sociales à un nouvel acquéreur par acte authentique chez le notaire. Les autres associés peuvent disposer d'un droit de préemption selon les statuts. Le bien lui-même n'est pas vendu — il reste détenu par la SCI. C'est nettement plus fluide qu'une indivision où la sortie peut nécessiter de vendre le bien entier." } },
            { '@type': 'Question', name: 'Quels sont les frais à prévoir ?', acceptedAnswer: { '@type': 'Answer', text: "À l'achat : droits d'enregistrement (5% sur la valeur des parts pour une SCI à prépondérance immobilière) + frais de notaire. Annuellement : taxe foncière, charges courantes, entretien, assurance. Avec un opérateur de copropriété professionnel, comptez 5 000 à 12 000 € par an pour 1/8 d'une villa de gamme moyenne." } },
          ],
        }) }} />
      </Head>
      <Header />

      {/* Article header */}
      <div className="bh-header">
        <div className="bh-header-inner">
          <p className="bh-cat">Guide d'acheteur</p>
          <h1 className="bh-title">Acheter une résidence secondaire à plusieurs : le guide complet</h1>
          <p className="bh-sub">Tout savoir avant d'acquérir une maison de vacances à 2, 4 ou 8 — modèles juridiques, fiscalité, calendrier, sortie.</p>
          <p className="bh-date">Mis à jour mai 2026</p>
        </div>
      </div>

      <div className="blog-layout">
        <main className="blog-main">
          <article className="blog-article">

            <p><strong>Acheter une résidence secondaire à plusieurs n'est plus l'idée bizarre que c'était il y a dix ans.</strong> Avec des prix immobiliers qui ont flambé de 30 à 50 % dans les destinations les plus prisées entre 2017 et 2022 — Côte d'Azur, Alpes, Provence, Mallorca — la propriété intégrale d'une maison de vacances est devenue inaccessible pour la majorité des familles qui pouvaient encore l'envisager il y a peu. Acheter à plusieurs est la réponse rationnelle : vous gardez la qualité du bien et la valeur patrimoniale, vous divisez le coût et l'entretien, et vous n'utilisez la maison que la durée où vous y allez réellement de toute façon.</p>

            <p>Mais « acheter à plusieurs » recouvre plusieurs réalités juridiques très différentes. Ce guide explique exactement quels modèles existent en 2026, lequel choisir selon votre situation, et les pièges à éviter.</p>

            <h2>Sommaire</h2>
            <ol>
              <li><a href="#pourquoi">Pourquoi acheter à plusieurs en 2026</a></li>
              <li><a href="#modeles">Les trois modèles juridiques principaux</a></li>
              <li><a href="#sci">La SCI : le standard pour 2 à 16 personnes</a></li>
              <li><a href="#copropriete">La copropriété de résidence secondaire (1/8 type)</a></li>
              <li><a href="#indivision">L'indivision : simple mais instable</a></li>
              <li><a href="#fiscalite">Fiscalité : ce que coûte chaque modèle</a></li>
              <li><a href="#calendrier">Comment organiser le calendrier de jouissance</a></li>
              <li><a href="#sortie">Sortie et revente</a></li>
              <li><a href="#choisir">Quel modèle choisir ? Arbre de décision</a></li>
              <li><a href="#faq">Questions fréquentes</a></li>
            </ol>

            <h2 id="pourquoi">1. Pourquoi acheter à plusieurs en 2026</h2>
            <p>Trois raisons s'imposent.</p>
            <p><strong>L'inaccessibilité du marché.</strong> Une villa avec piscine en Provence à 1,2 M€, un chalet à La Plagne à 950 k€, un appartement à Mougins à 800 k€ : ces prix sont la norme dans les destinations qu'une famille de cadres aurait pu acheter seule en 2015. Aujourd'hui, ils représentent 8 à 15 ans de revenus nets pour le ménage médian éligible — bien au-delà de ce qu'autorise un raisonnement financier rationnel.</p>
            <p><strong>L'usage réel.</strong> L'INSEE estime qu'une résidence secondaire est utilisée en moyenne 35 jours par an. Acheter seul à 100 % pour utiliser 10 % du temps est financièrement absurde : vous payez 365 jours pour en utiliser 35. À plusieurs, chacun obtient le temps qu'il utilise réellement.</p>
            <p><strong>Le partage des frais.</strong> Une résidence secondaire entraîne 8 à 15 % du prix d'achat en frais annuels (taxe foncière, charges, entretien, assurance, gestion). Pour une villa à 1,2 M€, c'est 100 000 à 180 000 € par an. Divisé à 1/8, on tombe à 12 500 à 22 500 € — un budget raisonnable pour un foyer aisé.</p>

            <h2 id="modeles">2. Les trois modèles juridiques principaux</h2>
            <p>Trois véhicules permettent d'acheter une résidence secondaire à plusieurs en France :</p>

            <table className="cop-pillar-table">
              <thead>
                <tr>
                  <th>Modèle</th>
                  <th>Idéal pour</th>
                  <th>Stabilité</th>
                  <th>Sortie</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>SCI</strong></td>
                  <td>2-16 personnes, durée longue</td>
                  <td>Très stable</td>
                  <td>Cession de parts</td>
                </tr>
                <tr>
                  <td><strong>Copropriété (modèle pro 1/8)</strong></td>
                  <td>8 acquéreurs, gestion incluse</td>
                  <td>Très stable (SCI sous-jacente)</td>
                  <td>Marché secondaire géré</td>
                </tr>
                <tr>
                  <td><strong>Indivision</strong></td>
                  <td>2-3 personnes très proches, court terme</td>
                  <td>Instable (article 815 CC)</td>
                  <td>Vente du bien si désaccord</td>
                </tr>
              </tbody>
            </table>

            <h2 id="sci">3. La SCI : le standard pour 2 à 16 personnes</h2>
            <p>La <strong>Société Civile Immobilière</strong> est la solution la plus utilisée en France pour acheter à plusieurs. Vous créez une société civile dont l'unique objet est la détention du bien immobilier. Chaque acquéreur reçoit des parts proportionnelles à sa contribution. La société est propriétaire du bien — pas vous individuellement.</p>
            <p><strong>Avantages :</strong></p>
            <ul>
              <li>Stabilité juridique : un associé qui veut sortir cède ses parts, sans toucher au bien lui-même</li>
              <li>Gouvernance claire : les statuts fixent les règles (calendrier d'usage, charges, vote, cession)</li>
              <li>Transmission simple : les parts sociales se transmettent par donation ou succession comme tout actif financier</li>
              <li>Optimisation fiscale possible (régime IR ou IS selon la situation)</li>
            </ul>
            <p><strong>Inconvénients :</strong></p>
            <ul>
              <li>Frais de constitution (~1 500 € de notaire + statuts)</li>
              <li>Tenue de comptabilité annuelle</li>
              <li>Assemblées générales obligatoires</li>
            </ul>
            <p>Pour une famille élargie ou un groupe d'amis fiables, la SCI faite en bonne et due forme avec un notaire est l'outil de référence. Comptez 4 à 8 semaines de processus avec un notaire pour la constituer correctement.</p>

            <h2 id="copropriete">4. La copropriété de résidence secondaire (modèle 1/8)</h2>
            <p>Variante professionnalisée du modèle SCI, popularisée en Europe depuis 2018-2020. Un opérateur sélectionne une propriété, structure une SCI dédiée, et vend 8 quotes-parts égales. Chaque acquéreur reçoit 1/8 du bien et 45 nuits d'usage par an, gérées via un calendrier rotatif équitable.</p>
            <p><strong>Différence clé avec la SCI traditionnelle :</strong> tout est géré pour vous. Sélection du bien, montage juridique, ameublement, entretien, ménage entre séjours, calendrier, fiscalité — l'opérateur prend tout en charge en échange de frais de gestion. Vous arrivez, profitez, repartez.</p>
            <p>C'est le modèle utilisé par les opérateurs internationaux qui figurent sur Co-Ownership Property. C'est aussi le modèle que <em>Prello</em> avait popularisé en France avant sa cessation d'activité en septembre 2024 — mais d'autres opérateurs européens continuent d'opérer ce modèle de manière saine et durable.</p>
            <p><strong>Idéal si :</strong> vous voulez une résidence secondaire haut de gamme sans aucune charge mentale ; vous n'avez pas 7 amis fiables avec qui acheter ; vous valorisez la professionnalisation de la gestion ; le bien est dans un pays différent du vôtre.</p>

            <h2 id="indivision">5. L'indivision : simple mais instable</h2>
            <p>L'indivision est la situation par défaut quand plusieurs personnes achètent un bien ensemble sans créer de société. C'est ce qui se passe automatiquement, par exemple, après une succession. Chacun détient une quote-part indivise du bien.</p>
            <p><strong>Le problème majeur :</strong> l'article 815 du Code civil dispose que <em>« nul n'est contraint de demeurer dans l'indivision »</em>. Concrètement, n'importe quel indivisaire peut, à tout moment, demander le partage — c'est-à-dire la liquidation forcée de l'indivision. Si un seul des quatre cousins qui ont hérité de la maison familiale veut sortir, et que les autres ne peuvent pas le racheter, le bien doit être vendu.</p>
            <p>Pour limiter ce risque, on peut signer une <strong>convention d'indivision</strong> qui peut interdire le partage pour une durée maximale de 5 ans (renouvelable). Mais cela reste fragile — une SCI offre une stabilité supérieure pour à peine plus de coût initial.</p>
            <p><strong>Idéal seulement si :</strong> vous achetez à 2 ou 3 personnes très proches (couple, frère et sœur), pour un horizon court (5 ans ou moins), et que vous acceptez le risque de devoir liquider en cas de désaccord.</p>

            <h2 id="fiscalite">6. Fiscalité : ce que coûte chaque modèle</h2>

            <h3>À l'achat</h3>
            <p>Pour une <strong>acquisition directe en indivision</strong>, vous payez les droits de mutation à titre onéreux normaux (~7-8 % en France). Pour une <strong>acquisition de parts de SCI à prépondérance immobilière</strong>, les droits sont de 5 % (article 726 CGI). Les frais de notaire et émoluments s'ajoutent dans les deux cas.</p>

            <h3>Pendant la détention</h3>
            <p><strong>IFI (Impôt sur la Fortune Immobilière) :</strong> votre quote-part de la valeur du bien entre dans votre patrimoine taxable. Si votre patrimoine immobilier total dépasse 1,3 M€, vous êtes redevable au prorata.</p>
            <p><strong>Taxe foncière, taxe d'habitation :</strong> dues par la SCI ou les indivisaires, refacturées au prorata.</p>
            <p><strong>Loyers perçus (location partielle) :</strong> imposés au régime des revenus fonciers (réel ou micro-foncier si moins de 15 000 €/an).</p>

            <h3>À la revente</h3>
            <p>La cession de parts de SCI à prépondérance immobilière relève du régime des plus-values immobilières des particuliers (19 % + 17,2 % de prélèvements sociaux), avec abattements pour durée de détention : exonération totale de l'IR après 22 ans, des prélèvements sociaux après 30 ans.</p>

            <h2 id="calendrier">7. Comment organiser le calendrier de jouissance</h2>
            <p>C'est le sujet qui inquiète le plus les futurs co-acquéreurs : qui prend Noël ? Qui a la maison la première semaine d'août ?</p>
            <p>Trois approches dominent :</p>
            <ul>
              <li><strong>Rotation annuelle.</strong> Les semaines premium (juillet-août, Noël, Pâques, vacances scolaires) tournent. Cousin A prend la 1<sup>re</sup> semaine d'août en année 1, la 2<sup>e</sup> en année 2, etc. Sur 8 ans, chacun a profité de toutes les semaines premium.</li>
              <li><strong>Allocation fixe.</strong> Chaque copropriétaire reçoit une allocation fixe : 1 semaine en août, 1 à Noël, 1 à Pâques, 3 hors saison. Plus simple à comprendre, moins équitable si certains préfèrent toujours juillet et d'autres préfèrent septembre.</li>
              <li><strong>Plateforme de réservation.</strong> Modèle utilisé par les opérateurs professionnels. Algorithme qui équilibre les semaines premium sur plusieurs années. Permet aussi les échanges de dernière minute entre copropriétaires.</li>
            </ul>
            <p>Pour 2 à 4 personnes en SCI, la rotation annuelle suffit et se règle dans les statuts. Pour 5+ personnes, une plateforme de réservation est indispensable.</p>

            <h2 id="sortie">8. Sortie et revente</h2>
            <p>La question de la sortie est ce qui fait ou défait le succès d'un achat à plusieurs. Trois scénarios :</p>
            <p><strong>Sortie organisée d'un associé en SCI.</strong> Cession de parts à un acquéreur extérieur ou aux autres associés. Si les statuts prévoient un droit de préemption, les associés ont la priorité. Un avenant statutaire formalise la nouvelle répartition. Délai : 4 à 8 semaines avec notaire.</p>
            <p><strong>Sortie d'un indivisaire en indivision.</strong> Si les autres ne rachètent pas la quote-part, le bien peut être vendu (article 815 CC). Délai : peut prendre des mois et générer des conflits.</p>
            <p><strong>Sortie en copropriété professionnelle (modèle 1/8).</strong> L'opérateur facilite la revente sur un marché secondaire interne ou externe. Certains offrent une garantie de rachat après 2 à 3 ans. Délai : typiquement 1 à 6 mois selon la liquidité du marché et le bien.</p>

            <h2 id="choisir">9. Quel modèle choisir ? Arbre de décision</h2>
            <ul>
              <li><strong>Vous achetez à 2 personnes (couple, frère/sœur), pour 5 ans ou moins ?</strong> → Indivision avec convention.</li>
              <li><strong>Vous achetez à 3-5 personnes proches, pour 10+ ans ?</strong> → SCI familiale créée chez votre notaire.</li>
              <li><strong>Vous voulez le bien sans aucune charge de gestion, et vous n'avez pas 7 co-acquéreurs ?</strong> → Copropriété professionnelle 1/8 (modèle aggregateur).</li>
              <li><strong>Vous voulez constituer un groupe de 5 à 16 personnes vous-même ?</strong> → SCI sur mesure avec gestionnaire externe.</li>
            </ul>

            <h2 id="faq">10. Questions fréquentes</h2>

            <h3>Combien de personnes peuvent acheter ensemble ?</h3>
            <p>Pas de limite légale stricte. En pratique : 2-5 en indivision/SCI familiale, 8 en copropriété professionnelle, jusqu'à 16 en SCI multi-associés.</p>

            <h3>Faut-il être de la même famille ?</h3>
            <p>Non. La SCI accepte tous les associés. Pour des co-acquéreurs sans lien familial, la SCI est même <em>fortement recommandée</em> (l'indivision étant trop fragile en cas de désaccord).</p>

            <h3>Et si l'un de nous fait faillite ?</h3>
            <p>En SCI, les parts d'un associé en faillite peuvent être saisies par ses créanciers. C'est rare mais possible. Une clause d'agrément dans les statuts permet aux autres associés de bloquer l'arrivée d'un nouvel associé non désiré.</p>

            <h3>Et si on n'arrive plus à se mettre d'accord ?</h3>
            <p>En SCI, les statuts définissent à l'avance les règles de prise de décision (majorité simple, qualifiée, unanimité selon le sujet). En indivision, c'est plus risqué. C'est pour cela que la SCI est préférée pour les achats à plusieurs au-delà de 2-3 personnes.</p>

            <h3>Peut-on louer notre résidence secondaire à plusieurs ?</h3>
            <p>Oui, sous réserve des statuts. La location partielle (semaines inutilisées) génère des revenus qui couvrent souvent les frais courants. Vérifiez la réglementation locale (déclaration de meublé de tourisme, autorisation de la mairie dans certaines zones tendues).</p>

            <p style={{marginTop: '3rem'}}><strong>Vous voulez explorer les propriétés disponibles dès maintenant en copropriété professionnelle ?</strong> Nous présentons des résidences secondaires en copropriété en Espagne, en France, en Italie, au Portugal et au-delà — avec la structure juridique SCI, la gestion incluse, et un calendrier d'usage géré.</p>

            <p style={{marginTop: '1.5rem'}}>
              <a href="/our-homes/" className="cop-cta-primary">Voir les propriétés en copropriété &rarr;</a>
            </p>

          </article>
        </main>

        <aside className="blog-sidebar">
          <section className="bsb-section">
            <h2 className="bsb-heading">Liens rapides</h2>
            <a className="bsb-dest-link" href="/fr/copropriete-residence-secondaire/">Le guide pillar de la copropriété <span>→</span></a>
            <a className="bsb-dest-link" href="/fr/comment-ca-marche/">Comment ça marche en 4 étapes <span>→</span></a>
            <a className="bsb-dest-link" href="/our-homes/">Voir les propriétés disponibles <span>→</span></a>
            <a className="bsb-dest-link" href="/fr/contact/">Parler à un expert <span>→</span></a>
          </section>
        </aside>
      </div>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
