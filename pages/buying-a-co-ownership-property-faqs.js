import PublicFaq, { PublicFaqSection } from '@/components/PublicFaq';
import PublicPageHeader from '@/components/PublicPageHeader';
import Head from 'next/head';
import hreflangLinks from '@/components/HreflangLinks';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';

const FAQS = [
  {
    q: 'What exactly is a co-ownership property, and how does fractional ownership work?',
    a: `A co-ownership property — also called a fractional ownership property — is a luxury second home purchased jointly by a small group of owners, typically up to eight. You own a real share of the home — an eighth, a quarter — not a right to use it. You can sell it, pass it on to your heirs, and it rises and falls in value with the house. The legal set-up is arranged by our partner for each home and walked through with you before you buy. A professional management company handles all day-to-day operations — maintenance, housekeeping, pool care, and rental income when the home is not in use — so you simply arrive, enjoy, and leave.`,
  },
  {
    q: 'How is co-ownership different from timeshare? Why is it a better option?',
    a: `The difference is fundamental. A timeshare gives you the right to use a property for a fixed period each year — you own time, not real estate. You own no part of the property, the asset does not appreciate, and you are locked into a membership or points system that is notoriously difficult to exit. Co-ownership gives you a genuine property asset. You own a real share of the home, not a right to use it, and you share in any capital appreciation. You can sell, gift, or pass your share on to family with minimal legal complexity. You enjoy the property flexibly — from as little as 2–3 nights — rather than a fixed week every year. And a professional concierge and management team handles everything, including the option to generate rental income during weeks you are not using the home.`,
  },
  {
    q: 'How many shares can I buy, and how many days does each share give me?',
    a: `Most properties are structured into eight equal shares, with each 1/8 share giving you around six weeks of private use a year. Most operators let you buy more than one share of the same home, and each extra share adds the same amount of time; how many you may hold is set per home, and we confirm it for any home you ask about. If you want to own more time overall, you can purchase shares across multiple properties in different destinations. Usage is usually managed via a rotating schedule or digital booking platform that ensures all owners enjoy fair access to peak-season dates over time.`,
  },
  {
    q: 'What is included in the purchase price of a fractional ownership share?',
    a: `The price of a co-ownership share is fully all-inclusive. It covers your share of the home, any stamp duty or transfer taxes, the full cost of the property purchase, renovation and refurbishment works, professional interior design, furniture and equipment, and the legal set-up arranged by our partner. There are no hidden extras or surprise legal fees at completion. Ongoing costs — annual property management, maintenance, insurance, local taxes, and utilities — are split proportionally between all co-owners, keeping your annual outgoings very low compared to sole ownership of a comparable property.`,
  },
  {
    q: 'Do I pay stamp duty or legal fees separately when I buy a fractional share?',
    a: `In general, no — purchase costs are bundled into the share price, so there are no surprise legal fees at completion. Exactly which taxes and fees apply depends on the country and the home's legal set-up, which our partner explains before you buy; we recommend independent advice.`,
  },
  {
    q: 'Can I buy a fractional property share as a foreigner or non-resident?',
    a: `Absolutely. There are no nationality restrictions on purchasing real estate in France, Spain, Italy, Portugal, or the United States — and co-ownership is available to residents and non-residents alike. A key tax benefit for non-residents buying in France is that the wealth tax (IFI) only applies if the net value of your French real estate assets exceeds €1.3 million. Because you own a fraction of the property rather than the whole, you could co-own a €5 million villa and still remain below that threshold — paying no French wealth tax at all. How tax works depends on the country and the home's legal set-up, which our partner explains before you buy; we recommend independent advice.`,
  },
  {
    q: 'Can I purchase a share through my limited company rather than in my personal name?',
    a: `Yes. You can purchase a fractional share either in your personal name or through your own limited company, trust, or holding structure. How tax works depends on the country and the home's legal set-up, which our partner explains before you buy; we recommend independent advice. You should also speak to your own accountant about any reporting obligations in your home country — the same due diligence you would apply to any second home investment abroad.`,
  },
  {
    q: 'How long does the buying process take for a fractional ownership share?',
    a: `The purchase of a fractional share is typically far quicker than buying a whole property. For cash buyers, the process from reservation to completion usually takes 4–8 weeks. This includes the reservation contract, cooling-off period, purchase documentation (in English for our anglophone clients), and settlement. If a mortgage is involved, it may take a few months longer. When you want to sell, resale is handled through our partner's resale process, without you having to sell the whole house. You can also pass your share on to a child or family member, which makes fractional ownership well suited to estate planning.`,
  },
  {
    q: 'Is there a cooling-off period after I sign the reservation contract?',
    a: `Yes, buyer protections are built into the co-ownership process. In France, buyers typically benefit from two to three distinct cooling-off periods at different stages of the reservation and share-purchase process. During each window you can withdraw from the purchase without any financial penalty. All contracts and documents are provided in English as well as the local language for our international clients. This transparency and legal protection is one of the reasons co-ownership has been used by families and friends to co-own holiday properties across France and Spain for decades.`,
  },
  {
    q: 'Can I enjoy the entire property even though I only own a fraction of it?',
    a: `Yes — completely. When you book your usage time, you have exclusive access to the entire property: every bedroom, garden, pool, terrace, and amenity. Co-owners rotate their stays so you will never be at the property at the same time as another owner. You are free to invite friends and family to join you, or to allow them to stay independently during your allocated time. In every practical sense, the experience is indistinguishable from whole ownership — the difference is simply the price you paid and the costs you share. You can host dinner parties, post on social media, and treat it entirely as your own home.`,
  },
  {
    q: 'How is usage time divided fairly between co-owners?',
    a: `Usage is allocated through a clearly defined and fair rotation system. Each 1/8 share gives you around six weeks a year, structured so that all co-owners access high-season and shoulder-season weeks equitably over a multi-year cycle. Many properties also use a digital booking platform that allows owners to reserve specific dates, swap weeks with other owners, or extend stays where availability permits. The property management company administers the schedule and handles all coordination, so owners never need to negotiate directly with each other.`,
  },
  {
    q: 'Can I rent out my weeks when I am not using the property?',
    a: `In many cases, yes. A number of our co-ownership properties allow owners to place unused weeks into a professionally managed rental programme. The management company handles guest marketing, booking, check-in, housekeeping, and maintenance. Rental income is returned to you directly. In high-demand destinations — the French Riviera, Ibiza, the French Alps, Colorado — rental yields can be strong enough to offset your annual running costs significantly, and in some cases generate a net return on your investment. Always confirm the rental policy for a specific property with our team before purchase.`,
  },
  {
    q: 'Who manages the property and what does that include?',
    a: `Every co-ownership property on our platform is looked after by a dedicated professional property management company. Their remit covers everything: routine maintenance and repairs, professional housekeeping between every stay, pool and garden care, utility management, local tax compliance, and emergency call-out. When you arrive, the home is hotel-ready — fresh linens, stocked essentials, everything in perfect order. You do not need to coordinate tradespeople, worry about the boiler, or spend your holiday managing a property. That burden is entirely removed.`,
  },
  {
    q: 'How long can I own a fractional property share? Is it freehold?',
    a: `Yes — the properties are genuine freehold assets (in France and Spain). There is no fixed end date on your ownership. You can hold your share for 10, 30, or 50 years, pass it to your children, or sell it at any time. This is a fundamentally different proposition from a timeshare or holiday club membership, which typically expire or carry heavy exit clauses. Your fractional share is a real property asset that appreciates with the underlying real estate market.`,
  },
  {
    q: 'Is the property fully furnished, and do I own the furniture too?',
    a: `Yes on both counts. Every co-ownership property is delivered turnkey — professionally designed interiors, high-quality furniture, fully equipped kitchen, bed linens, towels, and everything needed for daily use from day one. You do not need to bring anything or spend a penny on fit-out. As a co-owner, you also own a share of the furnishings and equipment proportional to your share. One 1/8 share equates to 1/8 of the furniture value. This is reflected in the overall value of your share.`,
  },
  {
    q: 'Can I buy shares together with family members or friends?',
    a: `Yes — and this is one of the most popular ways people structure a co-ownership purchase. Groups of friends, siblings, or extended family members can each buy one or more shares independently, all in the same home. Our professional management structure is specifically designed to remove the friction that often arises when families manage shared property informally. A clear legal framework, rotating usage schedule, and neutral management company mean relationships stay intact — regardless of how the property is used over time.`,
  },
  {
    q: 'Can I bring my own group of people to share a property with?',
    a: `Absolutely. If you have a ready-made group — ski friends who want a French Alps chalet, colleagues looking for a Côte d'Azur villa, or family members wanting a shared base in Italy — we can source and structure a co-ownership property specifically around your group. You arrange among yourselves who buys how many shares, and we handle all the legal, management, and logistics. The professional management layer means even closely bonded groups benefit from a clear framework that protects everyone's interests as circumstances change over the years.`,
  },
  {
    q: 'If I find a property I love, can you help me find co-buyers for the remaining shares?',
    a: `Yes. If you identify a property you want to co-own but need other buyers for the remaining shares, we can source them from our qualified buyer network. We require you to commit to a minimum of 50% of the total shares upfront. Critically, you do not need to wait for all shares to be sold before you can start using the property — your usage rights begin as soon as your share is created. This means you can start enjoying the home while the remaining shares are placed with vetted co-owners, rather than sitting out the process.`,
  },
  {
    q: 'How quickly can I start using the property after completing my purchase?',
    a: `For properties where the legal set-up is already in place and the home is ready to use, you can typically begin making bookings within days of completing your share purchase — with first stays possible within weeks. If the property is still under renovation or interior design at the time of purchase, there will be a fit-out period before it is ready for use. In either case, the timeline is considerably faster than buying a traditional property, where conveyancing, renovations, and furnishing typically take six months to a year or more before you can actually enjoy the home.`,
  },
  {
    q: 'Can I get a mortgage to finance a fractional ownership share?',
    a: `Sometimes. For some homes, financing may be available through a partner bank depending on where you live and where the home is — it is not available in every country, and the terms differ from a standard mortgage. Most of our buyers purchase outright or release equity from their main residence. Tell us which home you are looking at and where you are resident, and we will confirm what applies before you rely on it. Take independent financial advice before you commit.`,
  },
];

export default function BuyingFAQs() {

  return (
    <>
      <Head>
        <title>Buying a Co-Ownership Property — FAQs | Co-Ownership Property</title>
        {hreflangLinks({ englishPath: '/buying-a-co-ownership-property-faqs' })}
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
      <PublicPageHeader>
        <p className="eyebrow">Buyer Guides</p>
        <h1>Buying a Co-Ownership Property — <em>FAQs</em></h1>
        <p className="subtitle">Everything you need to know about purchasing a fractional share — from legal structure and costs to the buying process and beyond.</p>
        <p className="subtitle" style={{marginTop: '0.6rem', fontSize: '0.95rem'}}>
          Looking for shorter, single-question answers? See our independent <a href="/faq/">buyer&rsquo;s Q&amp;A</a> covering pricing, resale, ownership, tax, and the difference from timeshare.
        </p>
      </PublicPageHeader>

      {/* FAQ Accordion */}
      <PublicFaqSection>
        <p className="faq-eyebrow">Common Questions</p>
        <h2 className="faq-heading">Frequently Asked <em>Questions</em></h2>
        <PublicFaq items={FAQS} />
      </PublicFaqSection>

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
