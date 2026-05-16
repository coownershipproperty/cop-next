import Head from 'next/head';
import Script from 'next/script';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';
import HreflangLinks from '@/components/HreflangLinks';

export default function ContactFR() {
  return (
    <>
      <Head>
        <title>Contact | Co-Ownership Property</title>
        <meta name="description" content="Parlez à l'équipe COP. Questions sur la copropriété de résidence secondaire ? Nous répondons sous quelques heures — sans pression commerciale, sans engagement." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="https://co-ownership-property.com/fr/contact/" />
        <HreflangLinks englishPath="/contact" />
        <meta property="og:title" content="Contacter Co-Ownership Property" />
        <meta property="og:description" content="Questions sur la copropriété ? Parlez à notre équipe — sans pression commerciale, sans engagement." />
        <meta property="og:url" content="https://co-ownership-property.com/fr/contact/" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="fr_FR" />
      </Head>
      <Header />

      <section className="page-hero">
        <p className="eyebrow">Nous sommes là pour vous aider</p>
        <h1>Nous <em>contacter</em></h1>
        <p className="subtitle">Questions sur la copropriété, sur un bien en particulier, ou simplement envie de comprendre comment tout cela fonctionne ? Nous vous donnerons des réponses directes — sans pression commerciale.</p>
      </section>

      <section className="trust-sec">
        <div className="trust-inner">
          <p className="eyebrow" style={{textAlign: 'center'}}>Comment nous travaillons</p>
          <h2 style={{textAlign: 'center', fontSize: 'clamp(1.8rem,3.5vw,2.4rem)', marginBottom: '0'}}>À quoi vous attendre quand vous nous contactez</h2>
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">&#x2709;</div>
              <h3>Écrivez-nous directement</h3>
              <p>Préférez écrire ? Contactez-nous à<br /><a href="mailto:info@co-ownership-property.com">info@co-ownership-property.com</a><br />Nous lisons chaque message personnellement.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">&#x23F0;</div>
              <h3>Réponse rapide</h3>
              <p>Nous répondons généralement sous quelques heures — souvent plus vite. Pour les demandes des États-Unis, merci de tenir compte du décalage horaire. Nous vous répondrons toujours.</p>
            </div>
            <div className="trust-card">
              <div className="trust-icon">&#x2713;</div>
              <h3>Sans pression, sans engagement</h3>
              <p>Nous posons des questions, vous orientons vers les biens qui vous correspondent, et laissons la décision entièrement entre vos mains. Nous sommes indépendants — pas liés à une plateforme ou un promoteur.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="links-sec">
        <div className="links-inner">
          <p className="eyebrow" style={{textAlign: 'center'}}>Vous vous renseignez encore ?</p>
          <h2 style={{textAlign: 'center', fontSize: 'clamp(1.6rem,3vw,2.2rem)', marginBottom: '0'}}>Pas encore prêt à nous contacter ?</h2>
          <div className="links-grid">
            <a href="/fr/comment-ca-marche/" className="link-card">
              <span className="link-cat">Comment ça marche</span>
              <span className="link-title">Le processus d'achat, étape par étape</span>
              <span className="link-desc">De la première demande aux contrats signés — ce qui se passe, dans quel ordre, et ce que vous devez préparer.</span>
              <span className="link-arrow">Lire le guide &rarr;</span>
            </a>
            <a href="/fr/copropriete-residence-secondaire/" className="link-card">
              <span className="link-cat">La comparaison</span>
              <span className="link-title">Copropriété vs. acheter le bien en entier</span>
              <span className="link-desc">Usage, coûts, plus-value et sortie — présentés côte à côte sans marketing.</span>
              <span className="link-arrow">Voir la comparaison &rarr;</span>
            </a>
            <a href="/all-our-blog/" className="link-card">
              <span className="link-cat">Notre blog</span>
              <span className="link-title">Analyses de marché et guides d'acheteurs</span>
              <span className="link-desc">Articles approfondis sur les destinations, le juridique, les retours sur investissement et tout ce qu'un acheteur avisé doit savoir.</span>
              <span className="link-arrow">Voir les articles &rarr;</span>
            </a>
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
      <Script src="/js/contact.js" strategy="afterInteractive" />
    </>
  );
}
