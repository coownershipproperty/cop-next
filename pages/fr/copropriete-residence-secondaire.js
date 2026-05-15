import Head from 'next/head';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HreflangLinks from '@/components/HreflangLinks';

// French pillar page targeting `copropriété résidence secondaire`. Special
// considerations for French market (per keyword research):
//  1. `copropriété` alone is legally ambiguous (Loi du 10 juillet 1965 — apartment
//     building co-ownership). We must disambiguate immediately and repeatedly.
//  2. Post-Prello market — French buyers are wary of co-ownership startups
//     failing. The page explicitly addresses "what happens if the operator disappears."
//  3. The structure used across COP's global portfolio is a purpose-built LLC
//     (limited liability company). The page explains the LLC framework in detail
//     because French buyers research legal structures carefully.
//  4. The French market is the highest-opportunity locale in the research
//     (low difficulty, high opportunity) due to Prello's vacuum.
export default function CoproprieteResidenceSecondairePillar() {
  return (
    <>
      <Head>
        <title>Copropriété résidence secondaire : le guide complet 2026 (LLC, fiscalité, achat)</title>
        <meta
          name="description"
          content="Tout savoir sur la copropriété de résidence secondaire en 2026 : fonctionnement, structure LLC, fiscalité (IFI, plus-value), différences avec la multibien, achat sécurisé."
        />
        <link rel="canonical" href="https://co-ownership-property.com/fr/copropriete-residence-secondaire/" />
        <HreflangLinks englishPath="/fr/copropriete-residence-secondaire" />

        <meta property="og:type" content="article" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:title" content="Copropriété résidence secondaire : le guide complet 2026" />
        <meta property="og:description" content="Comment ça marche, comment c'est structuré juridiquement (LLC), quelle fiscalité, comment acheter en sécurité après l'épisode Prello." />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'Qu\'est-ce que la copropriété de résidence secondaire ?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Il s\'agit d\'un modèle où plusieurs acquéreurs deviennent copropriétaires d\'une maison de vacances. Chaque copropriétaire détient typiquement 1/8 de le bien via une LLC (Limited Liability Company) constituée spécifiquement pour ce bien, et bénéficie d\'environ 45 nuits par an d\'usage exclusif. Vous êtes véritablement propriétaire — pas locataire, pas en multibien.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Est-ce la même chose que la copropriété d\'immeuble ?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Non. La copropriété d\'immeuble (Loi de 1965) concerne les parties communes des bâtiments collectifs. La copropriété de résidence secondaire utilise une structure juridique différente — une LLC qui détient le bien, et chaque copropriétaire détient un membership interest (intérêt de membre) correspondant à sa quote-part.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Et si l\'opérateur fait faillite ?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'C\'est précisément pour cela que la structure LLC est importante. Vous êtes membre de la LLC qui détient le bien, pas de l\'opérateur. Si l\'opérateur de gestion cesse son activité, la LLC continue d\'exister, le bien reste enregistré au cadastre au nom de la LLC, et vos droits de copropriétaire sont intacts. Un autre opérateur peut reprendre la gestion.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Comment se passe l\'achat ?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'L\'achat d\'un membership interest dans la LLC se formalise par acte authentique chez le notaire. Vous payez les droits d\'enregistrement applicables à la cession d\'intérêts dans une société à prépondérance immobilière, les frais de notaire, et vous êtes immédiatement copropriétaire avec inscription au registre des membres de la LLC.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Quelle fiscalité ?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Au niveau de l\'IFI : votre quote-part de la valeur du bien entre dans votre patrimoine taxable. Taxe foncière et taxe d\'habitation : payées au prorata par la LLC et refacturées aux membres. Plus-value à la revente : régime des plus-values immobilières (cession d\'intérêts dans une LLC à prépondérance immobilière), avec abattements pour durée de détention.',
                  },
                },
              ],
            }),
          }}
        />
      </Head>

      <Header />

      <main className="cop-pillar">
        <article className="cop-pillar-inner">

          {/* Header ─────────────────────────────────────────────────────── */}
          <header className="cop-pillar-header">
            <p className="cop-pillar-eyebrow">Guide complet · Mis à jour 2026</p>
            <h1>Copropriété de résidence secondaire : le guide complet</h1>
            <p className="cop-pillar-lead">
              La <strong>copropriété de résidence secondaire</strong> — aussi appelée{' '}
              <em>co-ownership</em> ou <em>bien fractionnée</em> — permet à plusieurs
              acquéreurs de devenir véritablement copropriétaires d'une maison de vacances de
              luxe pour une fraction du prix. Ce guide explique comment ça marche, comment
              c'est structuré juridiquement, quelle fiscalité s'applique, et comment acheter
              en sécurité après les difficultés de certains acteurs récents.
            </p>
          </header>

          {/* IMPORTANT disambiguation callout ────────────────────────────── */}
          <aside className="cop-pillar-callout">
            <h2>⚠️ Important : ne pas confondre avec la copropriété d'immeuble</h2>
            <p>
              En France, le mot <em>copropriété</em> désigne habituellement la copropriété
              d'immeuble régie par la <strong>loi du 10 juillet 1965</strong> — celle qui
              concerne les parties communes d'un immeuble (cage d'escalier, hall, toit). Ici,
              il ne s'agit <strong>pas du tout</strong> de cela. La <em>copropriété de
              résidence secondaire</em> repose sur une structure juridique différente : une
              <strong> LLC (Limited Liability Company)</strong> dont vous êtes membre pour
              votre quote-part du bien. Pas de syndic, pas de charges de bâtiment, pas
              d'assemblée générale d'immeuble. Juste vous, vos co-acquéreurs, et une maison.
            </p>
          </aside>

          {/* TOC ────────────────────────────────────────────────────────── */}
          <nav className="cop-pillar-toc" aria-label="Sommaire">
            <h2>Sommaire</h2>
            <ol>
              <li><a href="#definition">Qu'est-ce que la copropriété de résidence secondaire ?</a></li>
              <li><a href="#fonctionnement">Comment ça marche en pratique</a></li>
              <li><a href="#multipropriete">Copropriété vs. multibien : la vraie différence</a></li>
              <li><a href="#sci">La LLC : la structure juridique en détail</a></li>
              <li><a href="#operateur">Et si l'opérateur disparaît ?</a></li>
              <li><a href="#couts">Coûts d'acquisition et frais annuels</a></li>
              <li><a href="#fiscalite">Fiscalité : IFI, taxe foncière, plus-value</a></li>
              <li><a href="#destinations">Meilleures destinations pour les acheteurs francophones</a></li>
              <li><a href="#choisir">Comment choisir le bon opérateur</a></li>
              <li><a href="#revendre">Revendre sa quote-part</a></li>
              <li><a href="#faq">Questions fréquentes</a></li>
            </ol>
          </nav>

          {/* 1. Definition ─────────────────────────────────────────────── */}
          <section id="definition">
            <h2>1. Qu'est-ce que la copropriété de résidence secondaire ?</h2>
            <p>
              La <strong>copropriété de résidence secondaire</strong> est un modèle dans lequel
              plusieurs acquéreurs achètent ensemble une maison de vacances et se répartissent
              proportionnellement le bien, l'usage et les coûts. Le modèle dominant en
              Europe et en France divise le bien en <strong>8 quotes-parts égales</strong>{' '}
              (chacune appelée <em>1/8</em> ou <em>part</em>), chaque copropriétaire détenant
              au minimum 1/8 — ce qui donne droit à environ <strong>45 nuits par an</strong>{' '}
              d'usage exclusif.
            </p>
            <p>
              C'est de la <strong>vrai bien</strong> — pas un droit d'usage temporaire,
              pas une location, pas une multibien. Le bien est inscrit au cadastre au nom
              de la LLC dont vous êtes membre pour votre quote-part. Votre intérêt se
              transmet par succession, se vend sur un marché secondaire, et bénéficie de
              l'éventuelle plus-value du bien immobilier.
            </p>
            <p>
              Concrètement : au lieu d'investir 1.500.000 € pour une villa à Ibiza, vous payez
              ~190.000 € pour 1/8 de cette même villa. Vous y allez 45 nuits par an. Le reste
              du temps, sept autres familles partagent la maison sur un calendrier organisé.
            </p>
          </section>

          {/* 2. How it works ─────────────────────────────────────────────── */}
          <section id="fonctionnement">
            <h2>2. Comment ça marche en pratique</h2>
            <ol className="cop-pillar-steps">
              <li>
                <strong>Choix du bien.</strong> Vous parcourez les biens disponibles. Sur COP,
                vous trouverez des biens en copropriété de plusieurs opérateurs européens
                en un seul endroit, avec filtres par destination, prix, nombre de chambres et
                équipements.
              </li>
              <li>
                <strong>Réservation et due diligence.</strong> Vous signez un accord de
                réservation pour la quote-part choisie. Pendant ce temps, votre notaire (ou
                celui que vous choisissez) examine l'<em>operating agreement</em> de la LLC,
                le règlement intérieur, le calendrier de réservation, et les frais.
              </li>
              <li>
                <strong>Acte authentique chez le notaire.</strong> L'acquisition de votre
                membership interest dans la LLC se formalise par <em>acte authentique</em>,
                signé chez le notaire. Le transfert est inscrit au registre des membres de la
                LLC. Vous êtes désormais membre de la LLC propriétaire du bien.
              </li>
              <li>
                <strong>Gestion par l'opérateur.</strong> L'opérateur prend en charge tous les
                aspects pratiques : entretien, jardin, piscine, ménage entre séjours, factures,
                assurance multirisque habitation, taxes foncières. Vous recevez une facture
                mensuelle ou trimestrielle pour votre quote-part des frais courants.
              </li>
              <li>
                <strong>Réservation et séjours.</strong> Vous réservez vos nuits via la
                plateforme de l'opérateur. La plupart des modèles utilisent un algorithme
                équitable : la rotation des semaines de haute saison fait que chaque
                copropriétaire profite d'un mix de pleine et de basse saison sur la durée.
              </li>
            </ol>
          </section>

          {/* 3. Vs multibien ───────────────────────────────────────── */}
          <section id="multipropriete">
            <h2>3. Copropriété vs. multibien : la vraie différence</h2>
            <p>
              C'est <em>la</em> question que tout acquéreur français se pose, et c'est
              important d'y répondre clairement parce que les deux figures sont
              <strong> juridiquement très différentes</strong>.
            </p>
            <table className="cop-pillar-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Copropriété (résidence secondaire)</th>
                  <th>Multibien (timeshare)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Statut juridique</td>
                  <td>Bien immobilière réelle (via LLC)</td>
                  <td>Droit d'usage / contrat d'adhésion</td>
                </tr>
                <tr>
                  <td>Acte authentique chez notaire</td>
                  <td>Oui</td>
                  <td>Non (contrat privé en règle générale)</td>
                </tr>
                <tr>
                  <td>Inscription au cadastre</td>
                  <td>Oui (la LLC au cadastre)</td>
                  <td>Non</td>
                </tr>
                <tr>
                  <td>Plus-value à la revente</td>
                  <td>Oui (votre quote-part suit le marché immobilier)</td>
                  <td>Non, et souvent perte significative</td>
                </tr>
                <tr>
                  <td>Liquidité / revente</td>
                  <td>Marché secondaire actif</td>
                  <td>Très limitée, parfois impossible</td>
                </tr>
                <tr>
                  <td>Transmission successorale</td>
                  <td>Oui, comme tout bien immobilier</td>
                  <td>Variable selon contrat, souvent compliqué</td>
                </tr>
                <tr>
                  <td>Sortie</td>
                  <td>Vente libre du membership interest</td>
                  <td>Souvent uniquement via résiliation contractuelle</td>
                </tr>
              </tbody>
            </table>
            <p>
              La <strong>multibien</strong> a laissé un mauvais souvenir en France
              (Directive 2008/122/CE adoptée pour réguler les abus, jurisprudence cassant des
              centaines de contrats). La copropriété de résidence secondaire est une figure
              juridique distincte, structurée par une LLC qui détient véritablement le bien
              immobilier.
            </p>
            <p>
              Pour aller plus loin : <a href="/fr/blog/copropriete-vs-multipropriete/">Copropriété
              vs. multibien : les vraies différences</a>.
            </p>
          </section>

          {/* 4. LLC ─────────────────────────────────────────────────────── */}
          <section id="sci">
            <h2>4. La LLC : la structure juridique en détail</h2>
            <p>
              La <strong>LLC (Limited Liability Company)</strong> est le véhicule juridique
              utilisé de manière homogène sur l'ensemble du portefeuille de COP, en France
              comme en Espagne, en Italie, au Portugal ou aux États-Unis. Voici comment elle
              fonctionne :
            </p>
            <ul>
              <li>Une LLC est constituée spécifiquement pour ce bien : son seul objet est de détenir et gérer la villa ou l'appartement concerné.</li>
              <li>La LLC est <strong>propriétaire</strong> du bien — elle est inscrite au cadastre comme propriétaire.</li>
              <li>Les droits dans la LLC sont divisés en <em>membership interests</em> (intérêts de membre) égaux. Pour une copropriété en 1/8, il y a typiquement 8 intérêts égaux.</li>
              <li>Chaque copropriétaire <strong>acquiert le membership interest correspondant à sa quote-part</strong> (typiquement 12,5% pour 1/8). Cet achat se fait par acte authentique chez le notaire.</li>
              <li>L'<em>operating agreement</em> de la LLC fixe les droits et devoirs des membres : calendrier de jouissance, contribution aux charges, règles de cession, gouvernance.</li>
              <li>La LLC est administrée par un gérant (<em>managing member</em> ou prestataire désigné) — généralement la société de gestion sélectionnée par l'opérateur.</li>
            </ul>
            <p>
              <strong>Pourquoi une LLC plutôt que l'indivision ?</strong> L'indivision (Code
              civil, art. 815) permettrait techniquement à plusieurs personnes de détenir un
              bien ensemble, mais elle est notoirement instable : « nul n'est tenu de rester
              dans l'indivision » (art. 815), tout indivisaire peut demander le partage à tout
              moment, et la gestion ordinaire requiert l'accord de la majorité des 2/3. La LLC
              corrige tous ces problèmes : le bien est stable, la gouvernance est claire
              dans l'operating agreement, et la sortie d'un copropriétaire se fait par cession
              du membership interest sans toucher le bien sous-jacente. La LLC offre
              également une protection de la responsabilité personnelle et une cohérence
              juridique d'un pays à l'autre — un atout majeur pour un acquéreur qui détient
              plusieurs biens dans différentes juridictions.
            </p>
            <p>
              Sur le plan fiscal, la LLC à prépondérance immobilière est généralement traitée
              comme une entité transparente au niveau de l'impôt sur le revenu (régime des
              revenus fonciers pour les revenus locatifs éventuels). Pour une résidence
              secondaire en usage propre, le traitement transparent reste le régime par défaut.
              La situation exacte dépend du pays de localisation du bien et de la résidence
              fiscale du membre — votre fiscaliste validera votre cas.
            </p>
          </section>

          {/* 5. Operator failure ────────────────────────────────────────── */}
          <section id="operateur">
            <h2>5. Et si l'opérateur disparaît ?</h2>
            <p>
              C'est <em>la</em> question post-Prello en France. Le marché de la copropriété de
              résidence secondaire a connu en 2024 la cessation d'activité d'un acteur majeur
              ayant levé plusieurs millions d'euros. Pour les futurs copropriétaires, la
              question légitime est : <strong>que se passe-t-il pour les copropriétaires si
              l'opérateur cesse son activité ?</strong>
            </p>
            <p>
              La réponse rassurante repose sur la structure juridique :
            </p>
            <ul>
              <li>
                <strong>La LLC est juridiquement indépendante de l'opérateur.</strong> La LLC
                est propriétaire du bien. L'opérateur agit en tant que gérant ou prestataire
                de services, pas en tant que propriétaire.
              </li>
              <li>
                <strong>Si l'opérateur cesse son activité, la LLC continue d'exister.</strong>{' '}
                Le bien reste enregistré au cadastre au nom de la LLC. Les membres
                (copropriétaires) conservent l'intégralité de leurs droits.
              </li>
              <li>
                <strong>Un autre opérateur peut reprendre la gestion.</strong> Les membres
                de la LLC peuvent voter pour désigner un nouveau gérant ou un nouveau
                prestataire de services. Le bien et le bien ne sont pas en danger.
              </li>
              <li>
                <strong>Les copropriétaires peuvent aussi décider de vendre.</strong> Si les
                membres votent à la majorité requise par l'operating agreement, la LLC peut
                vendre le bien et redistribuer le produit aux membres au prorata de leurs
                intérêts.
              </li>
            </ul>
            <p>
              Sur COP, nous indiquons clairement la structure juridique de chaque bien
              que nous présentons et les garanties associées. C'est pour cela que la due
              diligence préalable à l'achat — examen de l'operating agreement, du règlement
              intérieur, du contrat de gestion — est essentielle.
            </p>
          </section>

          {/* 6. Costs ───────────────────────────────────────────────────── */}
          <section id="couts">
            <h2>6. Coûts d'acquisition et frais annuels</h2>
            <h3>Coût d'acquisition (1/8)</h3>
            <p>Selon la destination et le standing du bien :</p>
            <ul>
              <li><strong>Appartement de standing en ville</strong> (Paris, Bordeaux, Nice) : 200.000 € – 400.000 €.</li>
              <li><strong>Maison en Provence ou Côte d'Azur</strong> : 250.000 € – 500.000 €.</li>
              <li><strong>Villa à Mallorca, Ibiza, Sotogrande</strong> : 150.000 € – 350.000 €.</li>
              <li><strong>Chalet dans les Alpes</strong> : 200.000 € – 450.000 €.</li>
            </ul>
            <p>
              S'ajoutent les <strong>frais de notaire</strong> (typiquement de l'ordre de 5%
              sur la valeur du membership interest pour une LLC à prépondérance immobilière
              en France ; le taux varie selon le pays de localisation du bien).
            </p>
            <h3>Frais annuels (1/8)</h3>
            <p>
              Couverts par votre contribution mensuelle ou trimestrielle, qui inclut :
              entretien (jardin, piscine), ménage entre séjours, charges courantes (eau,
              électricité, internet), assurance, taxes locales, fonds de réserve, et
              honoraires de gestion de l'opérateur.
            </p>
            <p>
              Pour une villa de gamme moyenne, comptez en général{' '}
              <strong>5.000 € à 12.000 € par an pour 1/8</strong>. Pour des biens premium, plus.
              Demandez toujours un budget détaillé prévisionnel sur 3 ans avant de signer.
            </p>
          </section>

          {/* 7. Tax ─────────────────────────────────────────────────────── */}
          <section id="fiscalite">
            <h2>7. Fiscalité : IFI, taxe foncière, plus-value</h2>
            <h3>À l'achat</h3>
            <p>
              <strong>Droits d'enregistrement / frais de notaire :</strong> pour la cession
              d'un membership interest dans une LLC à prépondérance immobilière (assimilée à
              une société à prépondérance immobilière), les droits d'enregistrement applicables
              sont de l'ordre de 5% de la valeur cédée (régime des cessions de parts de
              sociétés à prépondérance immobilière — code général des impôts, art. 726).
              S'ajoutent les émoluments du notaire et les frais d'inscription. Ces taux varient
              si le bien est situé hors de France : chaque juridiction a son régime.
            </p>
            <h3>Pendant la détention</h3>
            <p>
              <strong>IFI (Impôt sur la Fortune Immobilière).</strong> La quote-part de la
              valeur du bien que vous détenez via la LLC entre dans votre patrimoine immobilier
              taxable. Si votre patrimoine immobilier total dépasse 1,3 M€, vous êtes assujetti
              à l'IFI au prorata de votre quote-part.
            </p>
            <p>
              <strong>Taxe foncière et taxe d'habitation.</strong> Payées par la LLC, refacturées
              au prorata aux membres via les charges courantes.
            </p>
            <p>
              <strong>Imposition des revenus.</strong> En cas d'usage propre, pas de revenu
              imposable. Si certaines semaines sont louées (selon ce que l'operating agreement
              de la LLC autorise), les loyers sont imposés au régime des revenus fonciers (ou
              micro-foncier si &lt; 15.000 €/an), la LLC à prépondérance immobilière étant
              généralement traitée de façon transparente.
            </p>
            <h3>À la revente</h3>
            <p>
              <strong>Plus-value.</strong> La cession d'un membership interest dans une LLC à
              prépondérance immobilière suit le régime des plus-values immobilières des
              particuliers : taux d'imposition de 19% + 17,2% de prélèvements sociaux, avec
              abattements pour durée de détention (exonération totale après 22 ans pour l'IR,
              30 ans pour les prélèvements sociaux). Si le bien est hors de France, la
              convention fiscale du pays s'applique.
            </p>
            <p>
              Pour des cas spécifiques (résidence à l'étranger, structures patrimoniales),
              consultez un avocat fiscaliste avant la signature.
            </p>
          </section>

          {/* 8. Destinations ────────────────────────────────────────────── */}
          <section id="destinations">
            <h2>8. Meilleures destinations pour les acheteurs francophones</h2>
            <p>Les destinations les plus prisées des acheteurs francophones en 2026 :</p>
            <ul>
              <li><strong>Mallorca / Ibiza</strong> — destinations #1 et #2 pour les Français à l'étranger. Climat, culture, accessibilité.</li>
              <li><strong>Provence et Côte d'Azur</strong> — domestique, mais hors de portée en pleine propriété pour la plupart.</li>
              <li><strong>Toscane et Sardaigne</strong> — haute saison, immobilier de caractère.</li>
              <li><strong>Algarve (Portugal)</strong> — fiscalité avantageuse pour résidents non-fiscaux portugais (régime RNH revu).</li>
              <li><strong>Alpes (Megève, Courchevel, Chamonix, Verbier)</strong> — chalets de standing en montagne.</li>
            </ul>
          </section>

          {/* 9. How to choose ─────────────────────────────────────────────── */}
          <section id="choisir">
            <h2>9. Comment choisir le bon opérateur</h2>
            <p>Questions essentielles à poser avant de signer :</p>
            <ul>
              <li><strong>Operating agreement de la LLC et règlement intérieur.</strong> Demandez-les. Un avocat ou notaire devrait les relire.</li>
              <li><strong>Calendrier de jouissance.</strong> Algorithme de rotation pour les semaines de haute saison ? Comment sont gérées les demandes en concurrence ?</li>
              <li><strong>Frais.</strong> Détail complet, projection sur 3-5 ans, mécanisme de révision.</li>
              <li><strong>Antécédents de l'opérateur.</strong> Combien de biens en portefeuille ? Depuis quand ? Avis vérifiables ?</li>
              <li><strong>Revente.</strong> Mécanisme, commission, garantie de rachat éventuelle.</li>
              <li><strong>Dépendance à l'opérateur.</strong> Que se passe-t-il en cas de cessation d'activité ? La LLC est-elle juridiquement autonome ?</li>
            </ul>
            <p>
              Sur COP, nous présentons les biens des principaux opérateurs européens. Notre
              position d'agrégateur indépendant nous permet d'expliquer les différences entre
              opérateurs sans biais commercial.
            </p>
          </section>

          {/* 10. Selling ───────────────────────────────────────────────── */}
          <section id="revendre">
            <h2>10. Revendre sa quote-part</h2>
            <p>
              Votre quote-part est <strong>cessible</strong>. La cession se fait par acte
              authentique chez le notaire, en cédant votre membership interest dans la LLC à
              un nouveau copropriétaire. L'opérateur facilite généralement le processus :
            </p>
            <ul>
              <li>Liste d'attente d'acheteurs intéressés tenue par l'opérateur.</li>
              <li>Commission de revente (typiquement 5-10% du prix de cession).</li>
              <li>Certains opérateurs offrent une <strong>garantie de rachat</strong> au bout d'une période donnée (typiquement 2-3 ans).</li>
            </ul>
            <p>
              La plus-value à la revente suit le régime fiscal des plus-values immobilières
              des particuliers (cf. section 7).
            </p>
          </section>

          {/* 11. FAQ ────────────────────────────────────────────────────── */}
          <section id="faq">
            <h2>11. Questions fréquentes</h2>

            <h3>Puis-je louer mes semaines si je ne les utilise pas ?</h3>
            <p>
              Cela dépend de l'operating agreement de la LLC. Certains opérateurs autorisent
              la location dans des limites précises ; d'autres l'interdisent pour préserver
              le caractère résidentiel et éviter les complications réglementaires (location
              saisonnière, déclarations en mairie, etc.).
            </p>

            <h3>Puis-je acheter plus d'1/8 ?</h3>
            <p>
              Oui, la plupart des opérateurs permettent d'acquérir 2/8 ou plus, avec
              augmentation proportionnelle des nuits annuelles. Certains plafonnent la
              concentration par associé.
            </p>

            <h3>Y a-t-il du crédit pour acheter une quote-part ?</h3>
            <p>
              Quelques banques françaises et opérateurs ont des partenariats avec des
              établissements de crédit pour financer une quote-part. Conditions similaires à
              un prêt immobilier classique (LTV 50-65%, taux marché). Demandez à votre
              opérateur les partenaires disponibles.
            </p>

            <h3>L'achat me rend-il résident fiscal du pays où se trouve le bien ?</h3>
            <p>
              Non. La détention d'une quote-part de bien ne crée pas de résidence
              fiscale. La résidence fiscale est déterminée par les critères de l'article 4 B
              du CGI (foyer, séjour principal, activité, intérêts économiques) et par la
              convention fiscale applicable.
            </p>

            <h3>Puis-je acheter à travers une holding personnelle ?</h3>
            <p>
              Oui, la plupart des opérateurs permettent que le membership interest dans la LLC
              soit détenu par une structure patrimoniale (holding personnelle, société civile
              familiale existante, etc.). C'est à examiner avec votre fiscaliste avant la
              signature.
            </p>
          </section>

          {/* CTA ──────────────────────────────────────────────────────────── */}
          <section className="cop-pillar-cta">
            <h2>Explorez les biens disponibles</h2>
            <p>
              Découvrez les biens en copropriété disponibles dès maintenant à Mallorca,
              Ibiza, en Provence, en Toscane et au-delà. Filtrez par prix, nombre de chambres
              et destination.
            </p>
            <p>
              <a href="/our-homes/" className="cop-cta-primary">Voir tous les biens</a>
              <a href="/fr/contact/" className="cop-cta-secondary">Parler à un conseiller</a>
            </p>
          </section>

        </article>
      </main>

      <Footer />
    </>
  );
}
