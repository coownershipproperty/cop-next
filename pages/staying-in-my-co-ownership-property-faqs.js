import Head from 'next/head';
import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Newsletter from '@/components/Newsletter';
import ExpertForm from '@/components/ExpertForm';

const FAQS = [
  {
    q: 'How do I book a stay in my co-ownership property?',
    a: `Reservations are made directly through the property management platform — in most cases a dedicated mobile app or online calendar provided by your management company. The calendar is typically open 10 to 24 months in advance, depending on the operator. You browse available dates, select your stay, and the booking is confirmed instantly within your seasonal allowance. Your co-owners book independently on the same system, with the scheduling designed to ensure no two owners are at the property at the same time. Co-owners are also selected with complementary stay preferences to minimise conflicts over peak dates from the outset.`,
  },
  {
    q: 'How far in advance should I book my stay?',
    a: `You can book up to 24 months in advance, with a minimum notice period of two days for last-minute stays. During high and mid seasons, bookings operate through an options system: you can secure a preferred slot at least 120 days before your intended arrival. Most management systems operate two booking categories — advance bookings for peak periods (typically confirmed well ahead of the season) and last-minute bookings (minimum two days' notice, up to 30 days ahead), which are made directly on the calendar without requiring manager validation. The system is designed to give owners maximum flexibility while ensuring fairness across the ownership group.`,
  },
  {
    q: 'How many days per year can I stay in my co-ownership property?',
    a: `Your annual allowance is directly proportional to the number of shares you own. One 1/8 share entitles you to 1/8 of the calendar year — typically 42 to 45 nights, equivalent to around six weeks or 1.5 months per year. These nights are divided across the property's seasons (high, mid, and low for most ski and coastal properties) to ensure all owners receive a fair share of peak-time access on a rotating basis. If you own more than one share, your total allowance scales proportionally: 2 shares = approximately 3 months per year, 3 shares = 4.5 months, and 4 shares (the maximum 50%) = 6 months. Some properties are structured into 1/4 shares, doubling the per-share allowance. Contact us for specific details on the property you are interested in.`,
  },
  {
    q: 'Can I use unused days to generate rental income?',
    a: `In many cases, yes. If you are not planning to use some or all of your allocated time in a given season, many of our co-ownership properties allow you to place those days into a professionally managed rental programme. The management company handles all guest-facing operations — listing, booking, check-in, housekeeping, and checkout — while rental income is returned directly to you. Rental yields in high-demand destinations such as the French Riviera, Ibiza, the French Alps, and Tuscany can be strong enough to cover your annual management fees and in some cases generate a net return. Note that rental permissions vary by property and local regulation — some areas restrict short-term letting, so always confirm with our team for a specific property before purchase.`,
  },
  {
    q: 'What are the arrival and departure times?',
    a: `Standard arrival time is 3:00 pm and standard departure time is 11:00 am. These times are set to allow the housekeeping and cleaning team sufficient time to prepare the property to hotel-quality standards between consecutive owner stays. The exact window may vary slightly by property depending on the cleaning team's schedule and the gap between bookings. If you need an early check-in or late checkout, it is always worth contacting your property manager in advance — where no other stay is scheduled, accommodation is often possible.`,
  },
  {
    q: 'What is the minimum stay length?',
    a: `The standard minimum stay is two nights. However, some co-ownership operators and properties work on a week-by-week basis, particularly ski chalets and resort properties where weekly changeovers are more practical from a logistics standpoint. The minimum stay is designed to balance operational efficiency (cleaning, preparation, and management costs) with flexibility for owners. If you have a specific requirement — for example, a weekend trip or a one-night stop — contact us and we can advise on which properties in our portfolio are most suited to short stays.`,
  },
  {
    q: 'Can I invite guests and family to stay with me?',
    a: `Absolutely. During your reserved stays, the property is entirely yours. You are free to invite friends, family members, and guests to join you, or to allow them to use the property independently during your allocated time. The home is yours for the duration of your booking — every room, every amenity, the pool, garden, and all facilities. There is no restriction on the number of guests up to the property's stated capacity, and no additional charge for guests. You can host a dinner party, have family visiting for the full stay, or lend your time to a friend. The experience is identical to sole ownership.`,
  },
  {
    q: 'Can I lend or give my stay to someone else?',
    a: `Yes. As a co-owner, you have the right to transfer your booked stay to a family member, friend, or guest of your choosing. There is no requirement for you to be physically present during a stay you have allocated to someone else. This is one of the practical advantages of co-ownership over timeshare — you own the asset and the associated time rights, so you can use them as you see fit within the property's house rules. If you are lending your stay to someone unfamiliar with the property or management system, it is good practice to brief them on arrival and departure procedures and house rules in advance.`,
  },
  {
    q: 'What is included when I arrive at the property?',
    a: `The property is prepared to a hotel-ready standard before every arrival. This includes professionally laundered bed linens and towels, a clean and fully equipped kitchen, and all appliances in working order. Most co-ownership properties come stocked with basic essentials — cleaning products, paper goods, and bathroom consumables. Some operators include a welcome pack with local produce or wine. The home is interior-designed to a high standard, fully furnished, and equipped with everything needed for daily use. You do not need to bring anything beyond your personal items and food for your stay.`,
  },
  {
    q: 'Who looks after the property between stays?',
    a: `A dedicated professional property management company is responsible for the home at all times. Between stays they handle cleaning and housekeeping, routine maintenance and inspections, garden and pool care, utility management, and any repairs. If something needs attention during your stay — an appliance issue, a maintenance query, or an emergency — your property manager is contactable directly and typically responds promptly. You will never arrive to find a problem that has gone unaddressed. The management team is your point of contact for everything property-related, leaving you free to simply enjoy your time there.`,
  },
  {
    q: 'What are the ongoing costs of ownership during my stays?',
    a: `Your ongoing costs as a co-owner are shared proportionally between all owners and typically cover: property management fees, maintenance and repairs, insurance, local property taxes, utility costs, and any communal service charges. These costs are split in line with your ownership share — so as a 1/8 shareholder you pay 1/8 of the annual running costs, regardless of how many nights you actually use. Annual costs vary by property and location but are consistently far lower than the equivalent costs of wholly owning a comparable property. There are no additional per-night charges for using the property during your allocated time.`,
  },
  {
    q: 'How does seasonal scheduling work for ski and coastal properties?',
    a: `Ski and coastal properties typically operate across two or three seasons — high, mid, and low (and sometimes an additional shoulder season). Each season has different levels of demand and, accordingly, different booking dynamics. Your annual allowance of nights is divided across these seasons, usually through a rotating schedule that ensures every co-owner receives access to peak-season dates over a multi-year cycle. This prevents any one owner from monopolising Christmas week or peak summer every year. The rotation is managed transparently by the property management company, and the schedule is shared with all owners well in advance of each season.`,
  },
  {
    q: 'Can I swap or exchange my allocated dates with other co-owners?',
    a: `Yes, in many cases. The booking system used by most of our management partners allows owners to see availability and, where another owner agrees, to swap allocated slots. Some operators also allow you to bank unused days in one season and use them in another, subject to availability. This flexibility is one of the practical advantages of the co-ownership model — if your plans change, you are not simply forfeiting your time. Contact your property manager to understand the specific exchange and flexibility options available for your property.`,
  },
  {
    q: 'Are pets allowed at co-ownership properties?',
    a: `Pet policies vary by property and are set out in the co-ownership agreement and house rules. Some properties do welcome pets, while others restrict them to protect furnishings, gardens, and the experience of other owners. If travelling with a pet is important to you, it is something to clarify before purchase — our team can filter available properties based on pet-friendly policies. Where pets are permitted, standard good-practice rules apply: keeping pets off furniture, ensuring the property is clean on departure, and giving advance notice to the management company.`,
  },
  {
    q: 'What happens if something is damaged during my stay?',
    a: `Minor wear and tear is covered by the property's general maintenance budget, shared equally by all co-owners. If damage occurs during your stay that is beyond normal use — for example, accidental breakage of furniture or equipment — you are expected to report it promptly to the property manager. Most co-ownership arrangements include a damage deposit or insurance mechanism to cover such eventualities, ensuring the property is restored to its full standard before the next owner arrives. Transparency and prompt communication with the management team is all that is required; the process is handled professionally and without drama.`,
  },
  {
    q: 'Can I make changes or improvements to the property?',
    a: `Major changes to the property — redecoration, structural modifications, or significant purchases — require agreement from all co-owners and are coordinated through the management company. This is by design: the property is a shared asset and any changes affect all owners. In practice, the management company handles all significant decisions on behalf of the ownership group, and most properties are already furnished and designed to a high standard that requires little intervention. If you have suggestions or improvements in mind, the right approach is to raise them through the co-owners' communication channel or at the periodic owners' review, where all voices are heard.`,
  },
];

export default function StayingFAQs() {
  const [open, setOpen] = useState(null);

  return (
    <>
      <Head>
        <title>Staying in My Co-Ownership Property — FAQs | Co-Ownership Property</title>
        <meta name="description" content="Everything you need to know about staying in your co-ownership property — booking your time, arrival, guests, seasonal scheduling, rental income, and house rules." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://co-ownership-property.com/staying-in-my-co-ownership-property-faqs/" />
        <meta property="og:title" content="Staying in My Co-Ownership Property — FAQs" />
        <meta property="og:description" content="Everything you need to know about staying in your co-ownership property — booking, arrival, guests, seasonal scheduling, and more." />
        <meta property="og:url" content="https://co-ownership-property.com/staying-in-my-co-ownership-property-faqs/" />
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
        <p className="eyebrow">Owner Guides</p>
        <h1>Staying in My Co-Ownership Property — <em>FAQs</em></h1>
        <p className="subtitle">Everything you need to know about booking your time, arriving, hosting guests, and making the most of your co-ownership property.</p>
      </section>

      {/* FAQ Accordion */}
      <section className="faq-section">
        <p className="faq-eyebrow">Common Questions</p>
        <h2 className="faq-heading">Frequently Asked <em>Questions</em></h2>
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

      {/* Helpful links */}
      <section className="sec" style={{ background: 'var(--cream-bg)', paddingTop: 60, paddingBottom: 80 }}>
        <div className="sec-inner" style={{ maxWidth: 760 }}>
          <p className="eyebrow" style={{ textAlign: 'center', marginBottom: '2rem' }}>Useful Resources</p>
          <div className="bfaq-links">
            <a href="/buying-a-co-ownership-property-faqs/" className="bfaq-link">Buying a Co-Ownership Property — FAQs →</a>
            <a href="/how-it-works/" className="bfaq-link">How Co-Ownership Works →</a>
            <a href="/our-homes/" className="bfaq-link">View All Properties →</a>
            <a href="/all-our-blog/" className="bfaq-link">Market Insights &amp; Guides →</a>
            <a href="/terms-and-conditions/" className="bfaq-link">Terms &amp; Conditions →</a>
          </div>
        </div>
      </section>

      <Newsletter />
      <ExpertForm />
      <Footer />
    </>
  );
}
