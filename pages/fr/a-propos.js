import Head from 'next/head';
import Image from 'next/image';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';

export default function APropos() {
  return (
    <>
      <Head>
        <title>À propos | Co-Ownership Property</title>
        <meta name="description" content="Rencontrez l'équipe de Co-Ownership Property. Fondée en 2022 par David Olsson, nous aidons les acheteurs avisés à accéder à des résidences secondaires de luxe via la copropriété." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://co-ownership-property.com/fr/a-propos/" />
        <HreflangLinks englishPath="/about-us" />
        <meta property="og:title" content="À propos | Co-Ownership Property" />
        <meta property="og:description" content="Rencontrez l'équipe qui aide les acheteurs avisés à accéder à des résidences secondaires de luxe via la copropriété." />
        <meta property="og:url" content="https://co-ownership-property.com/fr/a-propos/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
        <meta property="og:image" content="https://co-ownership-property.com/wp-content/uploads/2025/11/ibiza-villa.jpg" />
      </Head>
      <Header />

      <section className="page-hero">
        <p className="eyebrow">Notre histoire</p>
        <h1>À <em>propos</em></h1>
        <p className="subtitle">Rencontrez notre équipe dirigeante dédiée à rendre la copropriété de résidence secondaire de luxe plus accessible et transparente.</p>
      </section>

      <div className="press-bar" role="region" aria-label="Vu dans">
        <div className="press-bar-header"><span className="press-bar-label">Vu dans</span></div>
        <div className="press-marquee-wrap"><div className="press-track-outer">
          <div className="press-track">
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-times.png" alt="The Times" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-ft.png" alt="Financial Times" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-dailymail.png" alt="Daily Mail" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-forbes.png" alt="Forbes" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-express.png" alt="Express" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-businessinsider.png" alt="Business Insider" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-luxtravel.png" alt="Luxury Travel Magazine" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-rollingstone.png" alt="Rolling Stone" width={200} height={50} /></div>
          </div>
          <div className="press-track" aria-hidden="true">
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-times.png" alt="" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-ft.png" alt="" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-dailymail.png" alt="" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-forbes.png" alt="" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-express.png" alt="" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-businessinsider.png" alt="" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-luxtravel.png" alt="" width={200} height={50} /></div>
            <div className="press-logo-item"><Image src="/wp-content/uploads/2025/11/press-rollingstone.png" alt="" width={200} height={50} /></div>
          </div>
        </div></div>
      </div>

      <section className="sec intro-sec">
        <div className="intro-center">
          <p className="eyebrow">Qui sommes-nous</p>
          <h2>Une agence pour la <em>copropriété</em> premium</h2>
          <p>Depuis 2022, Co-Ownership Property se consacre exclusivement aux résidences secondaires en copropriété premium dans les destinations les plus prisées au monde.</p>
          <p>Nous sommes à 100% du côté de l'acheteur, et collaborons uniquement avec les opérateurs les plus réputés et transparents en Europe et aux États-Unis. Nous ne sommes liés à aucune plateforme ni promoteur en particulier. Si un bien ne répond pas à nos standards, il n'apparaît pas sur ce site.</p>
        </div>
      </section>

      <section className="sec team-sec">
        <div className="sec-inner" style={{textAlign: 'center'}}>
          <p className="eyebrow">L'équipe</p>
          <h2>Rencontrez les personnes <em>derrière COP</em></h2>

          <div className="team-grid">
            <div className="team-card">
              <div className="team-photo">
                <Image src="/wp-content/uploads/2025/11/unnamed-4-1.jpg" alt="David Olsson" fill style={{objectFit:"cover"}} sizes="140px" />
              </div>
              <h3>David Olsson</h3>
              <span className="team-role">Fondateur</span>
              <p className="team-bio">Plus de 20 ans à vendre des biens premium à la montagne (principalement dans le neuf) dans plus de 40 stations des Alpes françaises. David a vu le marché se transformer alors que les clients qui pouvaient autrefois acheter étaient progressivement écartés par les prix de plus en plus élevés. Il a fondé COP en 2022 parce qu'il pensait que les biens exceptionnels devaient aussi être accessibles à ceux qui les aiment — pas seulement à ceux qui peuvent se les offrir.</p>
            </div>
            <div className="team-card">
              <div className="team-photo">
                <Image src="/wp-content/uploads/2025/12/1761762811297.jpg" alt="Dylan Olsson" fill style={{objectFit:"cover"}} sizes="140px" />
              </div>
              <h3>Dylan Olsson</h3>
              <span className="team-role">Ventes</span>
              <p className="team-bio">Élevé entre Londres et Marbella, avec des racines dans quatre pays, Dylan a grandi dans le milieu de la vente à l'international. Après avoir obtenu son diplôme en business à l'Université de Manchester, il s'est donné pour mission de combler l'écart entre l'aspiration et la réalité — rendant les maisons de vacances haut de gamme accessibles à plus de personnes via une approche transparente, plus centrée sur les besoins du client.</p>
            </div>
            <div className="poppy-card">
              <div className="team-photo">
                <Image src="/wp-content/uploads/2025/11/unnamed-8.jpg" alt="Poppy" fill style={{objectFit:"cover"}} sizes="140px" />
              </div>
              <div>
                <h3 style={{color: '#fff'}}>Poppy</h3>
                <span className="team-role">Responsable sécurité</span>
                <p className="team-bio">Tolérance zéro envers les écureuils, les facteurs et les chats non autorisés. Connue pour accepter des pots-de-vin sous forme de Caprice des Dieux ou de caresses prolongées.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sec story-sec">
        <div className="sec-inner">
          <div className="story-grid">
            <div className="story-img">
              <Image src="/wp-content/uploads/2026/02/1920-x-1080-px-resale-ski-chalet-interior.jpg" alt="Intérieur de chalet alpin de luxe" fill quality={90} style={{objectFit:"cover"}} sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
            <div className="story-text">
              <p className="eyebrow">Pourquoi nous avons commencé</p>
              <h2>Un marché qui laissait <em>des gens de côté</em></h2>
              <p>David a passé plus de deux décennies à vendre des biens premium dans les Alpes françaises. Au début, les taux hypothécaires français étaient inférieurs à 2%, les durées s'étendaient à 25 ans, et les prix dans les stations alpines — bien que jamais bon marché — gardaient un rapport raisonnable avec ceux de Paris. Acheter un bien à la montagne était une aspiration réaliste pour une famille de cadres de classe moyenne.</p>
              <p>Ce monde a progressivement disparu. Entre 2017 et 2022, les prix dans les stations les plus convoitées ont augmenté de 30 à 50%, dépassant dans certaines zones les prix au mètre carré parisiens. Le chalet à Méribel, l'appartement à Chamonix — étaient devenus le territoire des acheteurs cash avec de très gros moyens.</p>
              <blockquote>Les clients avec qui je travaillais depuis des années voulaient toujours acheter — ils ne pouvaient simplement plus se le permettre. Ils étaient écartés par les nouveaux prix au m².
                <span className="quote-attr">David Olsson — Fondateur</span>
              </blockquote>
            </div>
          </div>
        </div>
      </section>

      <section className="sec" style={{background: 'var(--white)'}}>
        <div className="sec-inner">
          <div className="story-grid">
            <div className="story-text">
              <p className="eyebrow">La solution</p>
              <h2>Une manière plus logique de <em>posséder sa résidence secondaire</em></h2>
              <p>Là où un bien alpin entier nécessite désormais plus de 800 000 €, une quote-part fractionnée met le vrai bien à portée à partir d'environ 100 000 €. Vous possédez une part enregistrée d'un bien premium, il prend de la valeur avec le marché, et vous décidez quand vendre.</p>
              <p>Une seule quote-part de 1/8 vous donne six semaines d'usage par an — 45 jours. Le propriétaire moyen d'une résidence secondaire utilise son bien seulement 35 jours par an, donc une quote-part dépasse déjà l'usage personnel typique.</p>
              <p>Et rien ne vous empêche d'aller plus loin : achetez deux quotes-parts dans le même bien, ou combinez une quote-part dans un chalet alpin avec une autre dans une villa à Ibiza. Les biens fonctionnent indépendamment, la structure est la même, et votre calendrier vous appartient.</p>
              <blockquote>La résidence secondaire moyenne reste vide 330 jours par an. Une quote-part vous donne plus de temps dans un bien exceptionnel — pour une fraction du coût.</blockquote>
            </div>
            <div className="story-img">
              <Image src="/wp-content/uploads/2025/11/ibiza-villa.jpg" alt="Villa à Ibiza avec piscine" fill quality={90} style={{objectFit:"cover"}} sizes="(max-width: 900px) 100vw, 50vw" />
            </div>
          </div>
        </div>
      </section>

      <section style={{background: 'var(--blue)', padding: '60px 3rem', textAlign: 'center'}}>
        <p style={{fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem'}}>Prêt à trouver votre résidence secondaire ?</p>
        <div style={{display: 'flex', gap: '1.2rem', justifyContent: 'center', flexWrap: 'wrap'}}>
          <a href="#speak-to-expert" style={{display: 'inline-block', padding: '14px 36px', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Nunito Sans',sans-serif", background: 'var(--warm-gold)', color: '#fff', textDecoration: 'none'}}>Parler à un expert</a>
          <a href="#newsletter" style={{display: 'inline-block', padding: '13px 36px', fontSize: '0.78rem', fontWeight: '700', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: "'Nunito Sans',sans-serif", background: 'transparent', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', textDecoration: 'none'}}>M'abonner à la newsletter</a>
        </div>
      </section>

      <section className="sec testi-sec" style={{background: 'var(--cream-bg)'}}>
        <div className="sec-inner" style={{textAlign: 'center'}}>
          <p className="eyebrow">Ce que disent nos clients</p>
          <h2>Vrais propriétaires, vraies <em>histoires</em></h2>

          <div className="testi-grid">
            <div className="testi-card">
              <div className="testi-photo"><Image src="/wp-content/uploads/2026/02/Hedda-testimonial-south-of-France.jpg" alt="Astrid" fill style={{objectFit:"cover"}} sizes="90px" /></div>
              <div className="testi-name">Astrid</div>
              <span className="testi-loc">Mougins, sud de la France</span>
              <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testi-quote">Dès le premier séjour, tout a été d'une simplicité parfaite. C'est comme arriver chez soi avec le confort d'un hôtel. Les lits sont faits, les serviettes prêtes — rien à penser. Chaque visite commence par le calme, pas par les corvées. Je l'adore déjà, et je n'ai à m'occuper de rien.</p>
            </div>
            <div className="testi-card">
              <div className="testi-photo"><Image src="/wp-content/uploads/2026/02/Middle-aged-couple-from-the-UK-with-mountain-and-ski-slopes-behind.-La-Plagne.jpg" alt="Harry et Nicole" fill style={{objectFit:"cover"}} sizes="90px" /></div>
              <div className="testi-name">Harry et Nicole</div>
              <span className="testi-loc">La Plagne, Alpes françaises</span>
              <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testi-quote">Posséder un chez-soi dans les Alpes françaises avait toujours été un rêve. La copropriété offrait la solution parfaite — tous les avantages d'une maison de montagne de luxe sans le stress et le coût de gérer un bien entier. Notre fils peut maintenant inviter ses amis du collège à skier aux vacances. Cela a vraiment fait de notre rêve une réalité.</p>
            </div>
            <div className="testi-card">
              <div className="testi-photo"><Image src="/wp-content/uploads/2026/02/Young-couple-from-LA-review-about-Lake-Tahoe-property.jpg" alt="Mateo et Anne" fill style={{objectFit:"cover"}} sizes="90px" /></div>
              <div className="testi-name">Mateo et Anne</div>
              <span className="testi-loc">Lac Tahoe, Californie</span>
              <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testi-quote">Nous montons de Los Angeles à Tahoe chaque été depuis des années, mais ne pouvions justifier une maison entière. Ce modèle de bien nous a semblé la voie médiane parfaite. Nous possédons enfin un morceau de cette terre sans la culpabilité d'un emprunt sous-utilisé. Transparent dès le premier jour — nous ne pourrions être plus heureux.</p>
            </div>
            <div className="testi-card">
              <div className="testi-photo"><Image src="/wp-content/uploads/2026/02/Family-swimming-in-Mallorca-300x300.jpg" alt="Jan et famille" fill style={{objectFit:"cover"}} sizes="90px" /></div>
              <div className="testi-name">Jan et famille</div>
              <span className="testi-loc">Port d'Andratx, Majorque</span>
              <div className="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
              <p className="testi-quote">J'ai vendu ma résidence secondaire en France, encaissé la plus-value, et utilisé seulement un quart pour acheter une villa beaucoup plus belle. Plus de culpabilité. La villa est superbe, les enfants l'adorent, et les semaines restantes sont louées — couvrant largement les frais mensuels. Hautement recommandé.</p>
            </div>
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/about-us.js" strategy="afterInteractive" />
    </>
  );
}
