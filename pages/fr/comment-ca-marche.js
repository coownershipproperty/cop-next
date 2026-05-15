import Head from 'next/head';
import Image from 'next/image';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';

// French equivalent of /how-it-works/. Reuses all CSS classes from the
// English page so the visual design is identical. Per the keyword research:
//   • Primary term: copropriété de résidence secondaire (compound)
//   • Disambiguates from apartment-building copropriété (Loi 1965)
//   • Acknowledges co-ownership as accepted French press term
//   • Avoids multibien except in comparison context (timeshare)

export default function CommentCaMarche() {
  return (
    <>
      <Head>
        <title>Comment fonctionne la copropriété de résidence secondaire | COP</title>
        <meta name="description" content="Découvrez comment fonctionne la copropriété de résidence secondaire. Achetez une part enregistrée d'une maison de vacances de luxe en Europe et partagez les coûts." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/fr/comment-ca-marche/" />
        <HreflangLinks englishPath="/how-it-works" />
        <meta property="og:title" content="Comment fonctionne la copropriété de résidence secondaire" />
        <meta property="og:description" content="Devenez copropriétaire d'une résidence secondaire de luxe en Europe pour une fraction du prix. Vrai bien, gestion incluse." />
        <meta property="og:url" content="https://co-ownership-property.com/fr/comment-ca-marche/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2026/02/1920-x-1080-px-resale-ski-chalet-interior.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>
      <Header />

      {/* ===== HERO ===== */}
      <section className="page-hero">
        <p className="eyebrow">La copropriété expliquée</p>
        <h1>Comment ça <em>marche</em></h1>
        <p className="subtitle">Devenez copropriétaire d'une maison de vacances de luxe. Profitez-en plusieurs semaines par an. Partagez chaque coût. Gardez chaque souvenir.</p>
      </section>

      {/* ===== AS FEATURED IN ===== */}
      <div className="press-bar" role="region" aria-label="Vu dans">
        <div className="press-bar-header">
          <span className="press-bar-label">Vu dans</span>
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
              <Image src="https://cdn.prod.website-files.com/63f61b4f9800c52e560f1914/6910dcda781c75aa91ca0cf7_DJI_0957_58_59_60_61.jpeg" alt="Villa de luxe avec piscine sur la Côte d'Azur" fill quality={90} style={{objectFit:'cover'}} sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
            <div className="intro-text">
              <p className="eyebrow">La façon intelligente de posséder</p>
              <h2>Possédez une maison qui vaut <em>8 fois</em> votre budget</h2>
              <p className="highlight">Une maison de vacances de luxe qui coûterait des millions à acquérir seul devient vôtre pour une fraction — avec les mêmes droits, les mêmes actes et la même valorisation.</p>
              <p>Avec la copropriété, vous achetez une <strong>part enregistrée</strong> — typiquement 1/8 — d'un bien premium. Elle est inscrite à votre nom via une LLC (Limited Liability Company) propre à le bien — la même structure utilisée de manière homogène à travers notre portefeuille international. Vous utilisez la maison environ 45 jours par an, et tous les coûts sont partagés au prorata entre copropriétaires.</p>
              <p>Ce n'est pas une multibien. Pas de points, pas de club, pas de piège. C'est une véritable bien immobilière — celle que vous pouvez revendre, transmettre à vos enfants, et regarder prendre de la valeur.</p>
              <div className="intro-stats">
                <div>
                  <div className="intro-stat-num">1/8</div>
                  <div className="intro-stat-label">Quote-part typique</div>
                </div>
                <div>
                  <div className="intro-stat-num">~45</div>
                  <div className="intro-stat-label">Jours / an</div>
                </div>
                <div>
                  <div className="intro-stat-num">360+</div>
                  <div className="intro-stat-label">Biens</div>
                </div>
                <div>
                  <div className="intro-stat-num">11</div>
                  <div className="intro-stat-label">Pays</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== A TRUSTED TRADITION ===== */}
      <section className="sec heritage-sec">
        <div className="heritage-inner">
          <p className="eyebrow">Une tradition de confiance</p>
          <h2>Ce n'est pas <em>nouveau</em></h2>
          <p>Les familles partagent des résidences secondaires depuis des siècles. Des grands-parents qui transmettent une villa à trois enfants. Des cousins qui héritent d'une ferme en Toscane. Des amis qui s'associent pour acheter un chalet dans les Alpes. La copropriété est l'une des formes les plus anciennes et naturelles de détention immobilière en Europe.</p>
          <blockquote>Vos grands-parents faisaient cela. Ils n'avaient simplement pas de LLC pour le formaliser.</blockquote>
          <p>En France, l'indivision — le bien conjointe — est l'une des façons les plus courantes pour les familles de détenir un bien. À travers l'Italie, l'Espagne et l'Autriche, le bien partagée de maisons héritées est la norme depuis des générations. Ce qui a changé, ce n'est pas le concept — c'est l'infrastructure.</p>
          <p>Aujourd'hui, chaque bien est détenue dans sa propre LLC avec un règlement de copropriété formel, une gestion professionnelle et un calendrier équitable. Vous n'avez jamais à vous coordonner directement avec les autres copropriétaires. Tout est géré pour vous. Pas de conversations gênantes, pas de litiges, pas de friction.</p>
        </div>
      </section>

      {/* ===== WHAT YOU GET ===== */}
      <section className="sec benefits-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
          <p className="eyebrow">Ce que vous obtenez</p>
          <h2>Plus qu'une simple <em>maison de vacances</em></h2>
          <p className="lead" style={{margin: '0 auto'}}>Chaque bien inclut une gestion professionnelle, une protection juridique et la flexibilité.</p>

          <div className="benefits-grid">
            <div className="benefit-card">
              <div className="benefit-icon">&#x1f3e0;</div>
              <h3>Vrai bien immobilière</h3>
              <p>Une part enregistrée à votre nom via une LLC propre à le bien. Pas un contrat — un véritable actif que vous possédez.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">&#x1f4c8;</div>
              <h3>Plus-value</h3>
              <p>Votre quote-part prend de la valeur comme tout investissement immobilier. Les emplacements premium en Europe et aux États-Unis se valorisent généralement de manière constante.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">&#x1f4b0;</div>
              <h3>Revenus locatifs</h3>
              <p>Vous n'utilisez pas vos semaines allouées ? De nombreuses biens vous permettent de louer vos semaines inutilisées et de générer des revenus pendant votre absence.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">&#x1f504;</div>
              <h3>Échange de maisons</h3>
              <p>La plupart des biens de notre portefeuille proposent un système d'échange. Envie d'une autre destination cette année ? Échangez votre séjour avec un autre copropriétaire.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">&#x1f5d3;</div>
              <h3>Calendrier équitable</h3>
              <p>Un calendrier rotatif garantit à chaque copropriétaire des dates en haute et basse saison. Été, Noël, Pâques — tout le monde alterne équitablement.</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">&#x1f6e0;</div>
              <h3>Entièrement gérée</h3>
              <p>La gestion immobilière professionnelle s'occupe de l'entretien, des réparations, du ménage et des taxes locales. Vous arrivez, profitez, repartez — le reste est pris en charge.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== COMPARISON ===== */}
      <section className="sec compare-sec">
        <div className="sec-inner">
          <p className="eyebrow">Comprenez la différence</p>
          <h2>Copropriété vs. <em>les alternatives</em></h2>
          <p className="lead">Toutes les options de résidence secondaire ne se valent pas. Voici comment la copropriété se compare.</p>

          <div className="compare-table-scroll">
            <table className="compare-table">
              <thead>
                <tr>
                  <th></th>
                  <th className="compare-highlight">Copropriété</th>
                  <th>Achat individuel</th>
                  <th>Multibien</th>
                  <th>Location de vacances</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Acte de bien réel</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> Oui — membership interest LLC</td>
                  <td><span className="check">&#10003;</span> Oui</td>
                  <td><span className="cross">&#10007;</span> Non — droit d'usage</td>
                  <td><span className="cross">&#10007;</span> Non</td>
                </tr>
                <tr>
                  <td>Plus-value</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> Bénéfice complet</td>
                  <td><span className="check">&#10003;</span> Bénéfice complet</td>
                  <td><span className="cross">&#10007;</span> Se déprécie souvent</td>
                  <td><span className="cross">&#10007;</span> Aucune</td>
                </tr>
                <tr>
                  <td>Coût initial</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> 1/8 du prix total</td>
                  <td><span className="cross">&#10007;</span> 100% du prix</td>
                  <td><span className="partial">~</span> Variable</td>
                  <td><span className="check">&#10003;</span> Aucun</td>
                </tr>
                <tr>
                  <td>Frais courants</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> Partagés à 1/8</td>
                  <td><span className="cross">&#10007;</span> 100% à votre charge</td>
                  <td><span className="cross">&#10007;</span> Frais annuels fixes</td>
                  <td><span className="partial">~</span> Tarif par séjour</td>
                </tr>
                <tr>
                  <td>Revente libre</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> Marché libre</td>
                  <td><span className="check">&#10003;</span> Marché libre</td>
                  <td><span className="cross">&#10007;</span> Très difficile</td>
                  <td>N/A</td>
                </tr>
                <tr>
                  <td>Transmission aux enfants</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> Oui</td>
                  <td><span className="check">&#10003;</span> Oui</td>
                  <td><span className="cross">&#10007;</span> Souvent intransférable</td>
                  <td>N/A</td>
                </tr>
                <tr>
                  <td>Revenus locatifs</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> Sur la plupart</td>
                  <td><span className="check">&#10003;</span> Oui</td>
                  <td><span className="cross">&#10007;</span> Rarement</td>
                  <td>N/A</td>
                </tr>
                <tr>
                  <td>Gestion professionnelle</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> Incluse</td>
                  <td><span className="cross">&#10007;</span> À votre charge</td>
                  <td><span className="partial">~</span> Gestion hôtelière</td>
                  <td>N/A</td>
                </tr>
                <tr>
                  <td>Disponibilité garantie</td>
                  <td className="compare-highlight"><span className="check">&#10003;</span> ~45 jours/an</td>
                  <td><span className="check">&#10003;</span> 365 jours</td>
                  <td><span className="partial">~</span> Souvent restreinte</td>
                  <td><span className="cross">&#10007;</span> Sous réserve</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ===== MID CTA ===== */}
      <section className="mid-cta">
        <p>Prêt à trouver votre résidence secondaire ?</p>
        <div className="mid-cta-buttons">
          <a href="#speak-to-expert" className="btn btn-gold">Parler à un expert</a>
          <a href="#newsletter" className="btn btn-blue">M'abonner à la newsletter</a>
        </div>
      </section>

      {/* ===== HOW THE LLC MODEL WORKS ===== */}
      <section className="sec model-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
          <p className="eyebrow">Le processus</p>
          <h2>Quatre étapes vers votre <em>résidence secondaire</em></h2>
          <p className="lead" style={{margin: '0 auto'}}>Chaque bien est détenue dans sa propre LLC (Limited Liability Company). Vous achetez un membership interest dans cette LLC — vous donnant un bien authentique et enregistrée avec une protection juridique complète.</p>

          <div className="model-flow">
            <div className="model-step">
              <div className="model-num">1</div>
              <h3>Parcourez et choisissez</h3>
              <p>Explorez plus de 360 biens de luxe sélectionnées. Filtrez par destination, style de vie, budget et taille de quote-part.</p>
            </div>
            <div className="model-step">
              <div className="model-num">2</div>
              <h3>Nous gérons le juridique</h3>
              <p>Des notaires indépendants gèrent toute la transaction. Un règlement de copropriété est rédigé couvrant calendriers, frais, droits de revente et votre protection.</p>
            </div>
            <div className="model-step">
              <div className="model-num">3</div>
              <h3>Achetez votre quote-part</h3>
              <p>Signez l'acte authentique chez le notaire, votre membership interest dans la LLC est enregistré, et vous recevez votre certificat de bien. La plupart des maisons sont prêtes à habiter.</p>
            </div>
            <div className="model-step">
              <div className="model-num">4</div>
              <h3>Profitez et gagnez</h3>
              <p>Commencez à utiliser votre maison immédiatement. Un calendrier rotatif équitable assure à chacun des dates premium. Louez les semaines inutilisées pour générer des revenus.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="sec faq-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
          <p className="eyebrow">Questions fréquentes</p>
          <h2>Questions <em>fréquemment</em> posées</h2>
        </div>
        <ul className="faq-list">
          <li className="faq-item"><details><summary><h3>Qu'est-ce que la copropriété de résidence secondaire ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>La copropriété de résidence secondaire est l'achat d'une part enregistrée d'un bien — typiquement 1/8 ou 1/4. Vous possédez votre quote-part de plein droit, enregistrée via une LLC propre à le bien. Vous pouvez l'utiliser pendant le temps qui vous est alloué chaque année (généralement 45 à 90 jours), la revendre sur le marché libre, ou la transmettre à vos enfants. C'est une vrai bien immobilière — pas une location, pas un club, pas une multibien.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>En quoi est-ce différent de la multibien ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Fondamentalement différent. La copropriété vous donne un acte enregistré — une vrai bien qui prend de la valeur. La multipropiété est un contrat d'usage qui se déprécie généralement. Vous pouvez revendre une quote-part de copropriété sur le marché libre ; les reventes de multibien sont notoirement difficiles. Les coûts de la copropriété sont proportionnels et transparents ; les frais de multibien continuent que vous utilisiez le bien ou non.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>Qu'est-ce que la structure LLC ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Chaque bien est détenue dans sa propre LLC (Limited Liability Company) dédiée — la même structure utilisée de manière homogène à travers notre portefeuille international. Lorsque vous achetez une quote-part, vous achetez un membership interest dans cette LLC — vous donnant un bien légale du bien proportionnelle à la taille de votre quote-part. Cette structure offre une protection de la responsabilité, simplifie la revente et garantit une séparation juridique nette entre copropriétaires.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>Combien de temps puis-je utiliser le bien par an ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>L'usage dépend de la taille de votre quote-part. Une quote-part de 1/8 vous donne environ 45 jours par an (6 semaines). Une quote-part de 1/4 fournit environ 90 jours (environ 3 mois). Un calendrier rotatif équitable assure une répartition égale des dates haute et basse saison entre tous les copropriétaires — chacun obtient des semaines d'été, de Noël et de Pâques au fil du temps.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>Puis-je revendre ma quote-part ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Oui. Vous possédez une quote-part enregistrée, vous pouvez donc la revendre sur le marché libre à tout moment — sous réserve d'une clause de droit de préemption pour vos copropriétaires. La revente est simple et les quotes-parts dans des emplacements premium ont tendance à prendre de la valeur avec le temps.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>Puis-je générer des revenus locatifs ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Sur de nombreuses biens, oui. Si vous n'utilisez pas vos semaines allouées, vous pouvez les louer et générer des revenus. L'équipe de gestion peut s'occuper du processus de location pour vous. La disponibilité varie selon le bien — demandez-nous les détails sur des annonces spécifiques.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>Et l'échange de maisons ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>La plupart des biens de notre portefeuille offrent un système d'échange. Si vous souhaitez passer votre temps alloué dans une autre destination, vous pouvez organiser un échange avec un copropriétaire d'une autre bien. C'est un excellent moyen d'explorer différents endroits sans coût supplémentaire.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>Quels coûts sont partagés ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Tous les frais courants sont divisés au prorata : taxe foncière, assurance, charges, entretien, réparations, ménage et gestion professionnelle. Un règlement de copropriété précise exactement comment les frais sont gérés. De nombreuses biens sont entièrement meublées et rénovées, avec ces coûts inclus dans le prix de la quote-part.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>Et si l'opérateur de gestion disparaît ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Question légitime — surtout après l'épisode Prello. La LLC est juridiquement indépendante de l'opérateur. Si l'opérateur cesse son activité, la LLC continue d'exister, le bien reste enregistré au cadastre au nom de la LLC, et vos droits de copropriétaire sont intacts. Un autre opérateur peut reprendre la gestion par vote des membres.</p></div></details></li>
          <li className="faq-item"><details><summary><h3>Puis-je transmettre ma quote-part à ma famille ?</h3><div className="faq-chevron"></div></summary><div className="faq-answer"><p>Oui. Votre quote-part enregistrée est un véritable actif que vous pouvez transmettre à vos enfants ou héritiers — comme tout bien immobilier. De nombreuses familles possèdent des quotes-parts de copropriété ensemble à travers les générations. La structure LLC rend les transmissions simples.</p></div></details></li>
        </ul>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/how-it-works.js" strategy="afterInteractive" />
    </>
  );
}
