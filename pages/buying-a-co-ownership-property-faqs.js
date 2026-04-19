import Head from 'next/head';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';

const FAQS = [
  {
    q: 'What are co-ownership properties?',
    a: `Co-ownership, also known as fractional ownership, allows individuals to buy a share of a second home with other co-owners through a company (usually an SCI in France or an SL in Spain) that holds 100% of the property deed. You can buy between one and four parts of a property (up to 50%) through a company holding the deed. Each part typically allows you to stay for around 42–44 days per year (6 weeks) for a 1/8th share. A professional management company looks after the property on behalf of all co-owners. Co-ownership allows you to purchase a premium property at a fraction of the cost — the share price includes renovation and furniture upgrades. Running costs, maintenance, and taxes are split equally among co-owners.`,
  },
  {
    q: 'How many years can I own the property?',
    a: 'These are freehold properties (France & Spain) — there is no limit on how many years you can own the property. You can enjoy it for 30 years and pass it along generations. You can sell your share at any point. Currently, many of our share companies have a 99-year life.',
  },
  {
    q: 'Can you visit the property in person or remotely?',
    a: 'A virtual and/or physical visit to each of the properties on sale can be organised, of course.',
  },
  {
    q: 'What is the difference between co-ownership and timeshare?',
    a: `The comparison ends there. Timesharing means you only own time — not real estate. Your name is not on the property deed. Co-ownership gives you a genuine property asset (via a company). Your name is on the property deed like any traditional freehold property. You choose any property on the real estate market. You keep control of service charges and are protected from bad-paying co-owners by an innovative French law contract. You enjoy your property flexibly (from as little as 2–3 nights). You benefit from a turnkey concierge and property manager who can generate rental income when you're not using your home.`,
  },
  {
    q: 'Can I purchase a part through my company?',
    a: `Yes. Owners can use a company or their legal name to purchase a share of the property. On the fractional ownership company side, everything is handled efficiently tax-wise. You should consult your accountant in the country where your company is based — the same applies to any second home abroad.`,
  },
  {
    q: 'Do I pay stamp duty or legal fees separately?',
    a: `No. Stamp duty was paid when the property was purchased and the company was set up. You only pay for the share(s) you need. Everything is included in the price: the property purchase, stamp duty, renovation work, furniture upgrade, interior design, company set-up, and arrangement fees.`,
  },
  {
    q: 'How long is the buying process?',
    a: `The purchase of a fractional share typically takes 1–2 months. When a mortgage is required it can take a few months longer. Selling your share is similar (1–2 months), and transferring your share to a child can be done in under a month for a minimal fee (around €500) — far simpler than transferring a traditional home.`,
  },
  {
    q: 'What type of company holds the co-ownership property?',
    a: `The company type depends on the country: in France it is an SCI (also SCIA or SCI d'attribution), in Spain an SL (Sociedad Limitada), and in the UK a Limited company. These companies hold 100% of the property deed, have their own bank account and tax ID, and no one holds shares apart from the co-owners. Families and friends have used these structures to hold properties together for decades.`,
  },
  {
    q: 'Can I finance my fractional share with a mortgage?',
    a: `Yes, you can finance the purchase with a bullet mortgage, and further mortgage options are coming soon. Most of our clients are cash buyers or raise equity in their main property. Contact us for more information on financing options.`,
  },
  {
    q: 'How many parts can I buy?',
    a: `You can purchase up to 50% of a home (four shares when the property is divided into eight equal parts). Each 1/8 share gives you around 44 days per year; two shares 88 days, three 132, four 176. You can spread additional shares across other properties. Buying up to 50% avoids a majority shareholder who could unduly influence company decisions.`,
  },
  {
    q: 'Can I buy more parts with family or friends?',
    a: `Yes — this is exactly why fractional ownership was created. Multiple individuals can come together through a company to buy a property. Our professionally managed system helps avoid the difficulties that can arise when managing a property among people who know each other.`,
  },
  {
    q: 'Can I bring my own group to share with?',
    a: `Yes. If you already have a group of friends or colleagues in mind, you can arrange for all of you to purchase shares together. The professional management team helps remove emotional dynamics and makes it easier to manage the property if relationships evolve over time.`,
  },
  {
    q: 'Can I buy a part as a foreigner or non-resident?',
    a: `Yes. As a foreigner or non-resident you can purchase a share through a limited company (SCI in France, Limitada in Spain, LLC or Limited in the USA/UK). In France, you only pay the wealth tax (IFI) if the net value of your real estate exceeds €1.3M — so you could own a share of a €5M villa and still pay no wealth tax. There is no nationality restriction on buying real estate in France or Spain.`,
  },
  {
    q: 'By buying only a share, can I enjoy the entire property?',
    a: `Of course. When you purchase a share, you enjoy the full property exclusively during your reserved stays — you will never be there at the same time as other co-owners. You can invite friends and family to join you or stay on their own. You can even post on Instagram from your 5-bed villa in Ibiza — nobody will know you only own a fraction.`,
  },
  {
    q: 'What is the time scale to start enjoying the property?',
    a: `If the share company is already set up, you can start using the property as soon as your share is created — typically one month on average. Some properties undergo renovation first, which may add time. This is still far faster than the buying process for a traditional property.`,
  },
  {
    q: 'Is there a cooling-off period once I sign the reservation contract?',
    a: `Yes. There are typically 2–3 cooling-off periods during the reservation and share-buying process in France. You can cancel without penalty within those windows. All documents are provided in English for our English-speaking clients.`,
  },
  {
    q: 'Is the property fully furnished and equipped?',
    a: `Yes. A co-ownership property is fully furnished and equipped — crockery, bed linens, towels, bathroom products. The house is ready to use from day one, decorated by interior designers to a cohesive, hotel-quality standard.`,
  },
  {
    q: 'Do I own the furniture as well?',
    a: `Yes. When you purchase a share, you also indirectly own a proportional share of the furniture and equipment. If you own one 1/8 share, you indirectly own 1/8 of the furnishings. You hold an ownership stake in the land, the building, and everything inside it.`,
  },
  {
    q: 'If there is a house I love, will you help me find co-buyers?',
    a: `Yes. We have a network of professionals and clients we can work with to find compatible co-owners. If you want to reserve parts for yourself and family members, we can find buyers for the remaining shares. We require a minimum of 50% purchased by you. You do not need to wait for all parts to be sold — you can start enjoying the property as soon as your share is created.`,
  },
];

export default function BuyingFAQs() {
  const [open, setOpen] = useState(null);

  return (
    <>
      <Head>
        <title>Buying a Co-Ownership Property — FAQs | Co-Ownership Property</title>
        <meta name="description" content="Everything you need to know about buying a co-ownership property — legal structure, costs, mortgages, and how the purchase process works from offer to completion." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/buying-a-co-ownership-property-faqs/" />
        <meta property="og:title" content="Buying a Co-Ownership Property — FAQs" />
        <meta property="og:description" content="Everything you need to know about buying a co-ownership property — legal structure, costs, mortgages, and how the purchase process works." />
        <meta property="og:url" content="https://co-ownership-property.com/buying-a-co-ownership-property-faqs/" />
        <meta property="og:type" content="website" />
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

      {/* Hero */}
      <section className="page-hero">
        <p className="eyebrow">Buyer Guides</p>
        <h1>Buying a Co-Ownership Property — <em>FAQs</em></h1>
        <p className="subtitle">Everything you need to know about purchasing a fractional share — from legal structure and costs to the buying process and beyond.</p>
      </section>

      {/* Intro */}
      <section className="sec" style={{ background: 'var(--cream-bg)' }}>
        <div className="sec-inner" style={{ maxWidth: 760, textAlign: 'center' }}>
          <p className="eyebrow">About Co-Ownership</p>
          <h2>The Smart Way to Own a <em>Luxury Holiday Home</em></h2>
          <p className="sec-lead" style={{ marginTop: '1.2rem' }}>
            Fractional ownership lets you buy a genuine deeded share of a professionally managed luxury property — at a fraction of the outright purchase price. Below we answer the most common questions from buyers considering co-ownership for the first time.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="faq-section">
        <p className="faq-eyebrow">Common Questions</p>
        <h2 className="faq-heading">Frequently Asked <em>Questions</em></h2>
        <div className="faq-list">
          {FAQS.map((item, i) => (
            <div key={i} className={`faq-item${open === i ? ' faq-item--open' : ''}`}>
              <button
                className="faq-q bfaq-q"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className="faq-num">{String(i + 1).padStart(2, '0')}</span>
                <span>{item.q}</span>
                <span className={`faq-chevron-arrow${open === i ? ' open' : ''}`} />
              </button>
              {open === i && (
                <div className="faq-a bfaq-a">
                  <p>{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Helpful links */}
      <section className="sec" style={{ background: 'var(--cream-bg)', paddingTop: 60, paddingBottom: 80 }}>
        <div className="sec-inner" style={{ maxWidth: 760 }}>
          <p className="eyebrow" style={{ textAlign: 'center', marginBottom: '2rem' }}>Helpful Resources</p>
          <div className="bfaq-links">
            <a href="/our-homes/" className="bfaq-link">View All Properties →</a>
            <a href="/about-us/" className="bfaq-link">About Co-Ownership Property →</a>
            <a href="/how-it-works/" className="bfaq-link">How Co-Ownership Works →</a>
            <a href="/all-our-blog/" className="bfaq-link">Market Insights &amp; Guides →</a>
            <a href="/staying-in-my-co-ownership-property-faqs/" className="bfaq-link">Staying In Your Property — FAQs →</a>
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
