import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import hreflangLinks from '@/components/HreflangLinks';
import Nav from '@/components/rd/Nav';
import Footer from '@/components/Footer';
import ExpertForm from '@/components/ExpertForm';
import Newsletter from '@/components/Newsletter';
import s from '@/styles/how-it-works.module.css';

const FAQS = [
  ['What is co-ownership of a holiday home?', 'You buy a legal ownership share in a home with a small group of other owners. Your share gives you an agreed amount of use, and you share the running costs. A professional team manages the home. The legal structure and ownership documents depend on the property and country.'],
  ['How is it different from a timeshare?', 'The homes in our collection offer an ownership interest in a specific property, often through a property-owning company, rather than a holiday points membership. Timeshare arrangements vary and some are deeded too, so it is important to compare the actual ownership, usage and resale terms—not just the label.'],
  ['What does the share price include?', 'The home is fully furnished and equipped. Purchase taxes, legal fees and other acquisition costs vary by home and country and may be additional. We set out the share price, purchase costs and ongoing budget before you decide.'],
  ['How much time do I get?', 'A one-eighth share typically gives you around six weeks a year. Your exact allocation, advance-booking window, peak-season access and any short-notice stays are set by the agreement for your home. Additional shares generally provide additional use.'],
  ['Can family and friends stay?', 'Yes. Family and friends can stay with your permission. We explain the guest arrangements, occupancy limits and any charges for the home you choose.'],
  ['Can I rent out unused weeks?', 'Where rentals are permitted, the rental programme is fully managed: the team handles bookings, guest communication, arrivals and changeovers. Other homes are reserved for owners and their guests. We confirm eligibility, fees and the rental arrangements for your home before you buy.'],
  ['Will I still get peak-season stays?', 'Yes—co-ownership includes access to peak season, with time spread across high, mid and quieter seasons under the home’s booking rules. Popular dates are shared fairly rather than reserved permanently for one owner. We explain the allocation and booking windows for the home you choose.'],
  ['How do owners share popular dates?', 'Different travel preferences help. Where the managing team matches the owner group, it looks for complementary needs—for example, a mix of households planning around school holidays and owners who prefer travelling outside them. It is not a fixed four-and-four quota; the booking system still governs access to popular dates.'],
  ['Who looks after the property?', 'The team managing the home coordinates housekeeping, maintenance, repairs and the arrangements for each stay. Owners fund the running costs under the agreed budget. We explain the services, fees and reserve arrangements before purchase.'],
  ['What if another owner stops paying?', 'The managing team covers the shortfall while they resolve the missed payment. Your use of the home is not affected.'],
  ['Is the property mortgaged?', 'The property’s debt position is part of the purchase checks. Ask us for the ownership documents confirming any borrowing, restrictions on mortgaging the home and how individual share financing is kept separate. A property-owning company does not, by itself, mean the home has no debt.'],
  ['Can I sell my share later?', 'Yes, subject to the ownership agreement. There may be an initial holding period and a right of first refusal for existing owners. We explain the resale process and costs for your home. Finding a buyer takes time, and neither a sale date nor a sale price is guaranteed.'],
  ['Can I spread the purchase price?', 'Some homes offer interest-free instalments directly, without a bank loan. Ask us which homes qualify and for the payment schedule. Mortgage financing is a separate option on selected homes, depending on your residence and the lender’s criteria.'],
  ['Can I buy more than one share?', 'Yes, where additional shares are available. Owning more shares gives you more time in the home, with your allocation set out in its booking rules. You can also explore a share in another destination.'],
];
const STEPS = [
  ['Find your place.', 'Browse the collection or tell us the destinations, seasons and kind of home you have in mind. We help you narrow the choice.'],
  ['See the full picture.', 'Review availability, purchase costs, the running-cost budget and booking rules for the exact home—not an illustrative promise.'],
  ['Make it yours.', 'Confirm the reservation terms, then review the purchase and ownership documents with your own advisers. Your purchase contract is with the team responsible for the home.'],
  ['Arrive. Settle in.', 'Once the purchase is complete, arrange your stays through the owners’ booking system. The management team prepares the home for your arrival.'],
];
const COMPARISON = [
  ['The same beautiful home', '€1.2 million committed to owning the whole property.', '€150,000 for a ⅛ share. The same home, location and quality—for an eighth of the purchase price.'],
  ['More capital available', 'The full purchase price is tied to one second home.', 'Keep €1.05 million available for other investments, a share in another destination, or additional shares for more time here.'],
  ['A share of the running costs', 'Fund the whole home’s upkeep, insurance and property bills throughout the year—even when you are away.', 'Pay ⅛ of the shared property running costs with a ⅛ share, rather than carrying the whole home yourself.'],
  ['Time that fits your holidays', 'Buy all fifty-two weeks, even if you only visit for four to six.', 'Around six weeks a year with a typical ⅛ share. Want longer stays? Additional shares can give you more time, where available.'],
  ['Your holiday—not another job', 'Leaks, repairs, cleaners, garden and pool care: organise it yourself or find and oversee people from a distance.', 'The team coordinates maintenance, housekeeping and preparations between stays. Arrive to a home that is ready for you.'],
  ['Rentals without the day-to-day work', 'Handle listings, guest messages, check-ins and changeovers—or appoint and oversee a rental manager.', 'Where licensing and the ownership model permit rentals, the team handles bookings, guests and changeovers through the managed programme.'],
  ['Ownership with long-term potential', 'Own the entire property and its exposure to changes in value.', 'Own a real share that can benefit if the home appreciates, with the option to resell—not simply pay for holidays.'],
];

function ComparisonEmphasis({ text }) {
  const phrases = /(€1\.05 million available|⅛ of the shared property running costs|Around six weeks)/g;
  return text.split(phrases).map((part, i) => i % 2 ? <strong key={i}>{part}</strong> : part);
}

const FULL_OWNERSHIP_HEADINGS = {
  'More capital available': 'More capital tied to one home',
  'A share of the running costs': 'Pay all the running costs',
  'Time that fits your holidays': 'Pay for weeks you may not use',
  'Your holiday—not another job': 'The upkeep is your responsibility',
  'Rentals without the day-to-day work': 'Manage rentals—or oversee a manager',
  'Ownership with long-term potential': 'All the exposure in one property',
};

function OwnershipComparison() {
  return <section className={`${s.section} rd-container ${s.benefits}`} id="comparison" aria-labelledby="compare-title">
    <p className={s.kicker}>Buying alone vs co-owning</p>
    <h2 id="compare-title">The same home.<br />A fraction of the commitment.</h2>
    <div className={s.ownershipClarifier}>
      <h3>Real ownership. Not a timeshare.</h3>
      <p>You buy a real share of the property—not just the right to stay there. Depending on the home, ownership is held directly on the deed or through the company that owns it, with your rights recorded in the purchase documents.</p>
    </div>
    <p className={s.benefitLead}>Industry estimates suggest many second-home owners use their properties for just four to six weeks a year. A typical ⅛ share gives you around six weeks—without buying the whole home.</p>
    <div className={s.budgetExample}>
      <div><span>Buy the whole home</span><strong>€1.2 million</strong><p>Full ownership of the property.</p></div>
      <span className={s.budgetArrow} aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12h16m-6-6 6 6-6 6" /></svg></span>
      <div><span>Own a ⅛ share of the same home</span><strong>€150,000</strong><p>€1.05 million less committed to one property.</p></div>
    </div>
    <div className={s.flowComparison}>{COMPARISON.slice(1).map(([label,alone,shared]) => <div className={s.flowRow} key={label}>
      <div><span className={s.comparisonLabel}>Full ownership</span><h3>{FULL_OWNERSHIP_HEADINGS[label]}</h3><p>{alone}</p></div>
      <span className={s.flowArrow} aria-hidden="true">→</span>
      <div><span className={s.comparisonLabel}>Co-ownership</span><h3>{label}</h3><p><ComparisonEmphasis text={shared} /></p></div>
    </div>)}</div>
    <p className={s.note}>Illustrative purchase-price comparison: €1,200,000 ÷ 8 = €150,000, before acquisition fees and taxes. Not a property offer.</p>
    <p className={s.note}>Shared costs follow the home’s ownership budget; management fees and individual stay charges vary. Usage follows the booking rules, and additional shares depend on availability. Property and share values can fall as well as rise; resale is subject to ownership terms and finding a buyer.</p>
  </section>;
}

export default function HowItWorks() {
  const scrollCleanup = useRef(null);
  useEffect(() => () => scrollCleanup.current?.(), []);
  function scrollToSection(event) {
    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(anchor.hash.slice(1));
    if (!target) return;
    event.preventDefault();
    window.history.pushState(null, '', anchor.hash);
    const heading = target.querySelector(`.${s.kicker}`) || target;
    // Layout offsets ignore entrance-animation transforms and section padding.
    let top = 0;
    for (let element = heading; element; element = element.offsetParent) top += element.offsetTop;
    const navigation = document.querySelector('.rd-nav');
    const navigationWrap = document.querySelector('.rd-nav-wrap');
    const inset = parseFloat(navigationWrap ? getComputedStyle(navigationWrap).top : '0') || 0;
    const clearance = (navigation?.offsetHeight || 64) + inset + 24;
    scrollCleanup.current?.();
    const start = window.scrollY;
    const destination = Math.max(0, Math.min(top - clearance, document.documentElement.scrollHeight - window.innerHeight));
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: destination, behavior: 'instant' });
      return;
    }
    const duration = 1100;
    const startedAt = performance.now();
    let frame;
    const stop = () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchstart', stop);
      window.removeEventListener('keydown', stopOnKey);
      scrollCleanup.current = null;
    };
    const stopOnKey = event => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' ', 'Escape', 'Tab'].includes(event.key)) stop();
    };
    const tick = now => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = (1 - Math.cos(Math.PI * progress)) / 2;
      window.scrollTo({ top: start + (destination - start) * eased, behavior: 'instant' });
      if (progress < 1) frame = requestAnimationFrame(tick);
      else stop();
    };
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchstart', stop, { passive: true });
    window.addEventListener('keydown', stopOnKey);
    scrollCleanup.current = stop;
    frame = requestAnimationFrame(tick);
  }
  const [inventory, setInventory] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/properties.json', { signal:controller.signal })
      .then(response => { if (!response.ok) throw new Error('Inventory unavailable'); return response.json(); })
      .then(feed => {
        const homes = feed.dataFeedElement;
        if (!Array.isArray(homes) || !homes.length) return;
        const prices = homes.filter(home => home.offers?.priceCurrency === 'EUR').map(home => Number(home.offers.price)).filter(price => Number.isFinite(price) && price > 0);
        setInventory({ homes:homes.length, countries:new Set(homes.map(home => home.address?.addressCountry).filter(Boolean)).size, from:prices.length ? Math.min(...prices) : null });
      }).catch(() => {});
    return () => controller.abort();
  }, []);
  const description = 'Understand luxury co-ownership: what you own, how stays are booked, shared running costs, resale and the steps to a fully managed second home.';
  return <>
    <Head>
      <title>How Co-Ownership Works | COP</title>
      <meta name="description" content={description} />
      <link rel="canonical" href="https://co-ownership-property.com/how-it-works/" />
      {hreflangLinks({englishPath:'/how-it-works'})}
      <meta property="og:title" content="Own the home. Share the cost. | COP" />
      <meta property="og:description" content={description} />
      <meta property="og:url" content="https://co-ownership-property.com/how-it-works/" />
      <meta property="og:type" content="website" />
      <meta property="og:image" content="https://co-ownership-property.com/redesign/mouans-sartoux-original-5k.jpg" />
      <meta name="twitter:card" content="summary_large_image" />
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({'@context':'https://schema.org','@type':'FAQPage',mainEntity:FAQS.map(([q,a]) => ({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))})}} />
    </Head>
    <div className={`rd rd-home-light rd-how ${s.page}`} onClick={scrollToSection}>
      <Nav ctaHref="#enquire" />
      <main>
        <section className={`${s.hero} rd-container`} aria-labelledby="how-title">
          <div className={s.heroCopy}>
            <p className={s.kicker}>A different way to own</p>
            <h1 id="how-title">Own the home.<br /><span>Share the cost.</span></h1>
            <p className={s.lead}>A remarkable second home. A share of the purchase price and running costs. And a professional team taking care of it, so your time there feels like time off.</p>
            <div className={s.actions}><Link className="rd-btn rd-btn-primary" href="/our-homes/">Browse the homes <span aria-hidden="true">↗</span></Link><a className={s.textLink} href="#enquire">Ask us a question <span aria-hidden="true">↗</span></a></div>
            <p className={s.heroFoot}>Less to look after. More to look forward to.</p>
            {inventory && <p className={s.inventory}>{inventory.from && <strong>Shares from {new Intl.NumberFormat('en-IE', {style:'currency', currency:'EUR', maximumFractionDigits:0}).format(inventory.from)}</strong>}<span>{inventory.homes} homes for sale · {inventory.countries} countries</span></p>}
          </div>
          <figure className={s.heroImage}>
            <Image src="/redesign/mouans-sartoux-original-5k.jpg" alt="Mouans-Sartoux villa, landscaped terraces and swimming pool on the Côte d’Azur" width={5184} height={3457} sizes="(max-width: 760px) calc(100vw - 40px), 52vw" priority style={{ backgroundColor: '#eeeee9' }} />
          </figure>
        </section>

        <nav className={`${s.chapterNav} rd-container`} aria-label="On this page">
          {[['comparison','Why co-own?'],['ownership','What you own'],['stays','Your time there'],['buying','The buying process'],['questions','Your questions']].map(([id,label]) => <a key={id} href={`#${id}`}>{label}<span aria-hidden="true">↘</span></a>)}
        </nav>

        <OwnershipComparison />

        <figure className={s.propertyStrip} data-rv><Image src="/redesign/santa-barbara-sunset.jpg" alt="Santa Barbara home and pool beneath mountains and a sunset sky" fill sizes="100vw" /><figcaption>A place to come back to.</figcaption></figure>
        <section className={`${s.fit} rd-container`} aria-labelledby="fit-title">
          <div><p className={s.kicker}>Who this suits</p><h2 id="fit-title">A second home.<br />Not a second job.</h2></div>
          <div><h3>A place you will return to.</h3><p>For people who want a real second home for roughly four to eight weeks a year, with a share size and booking arrangement that fit their plans. You want the familiarity of your own place, without managing it from a distance.</p><h3>Not for every kind of buyer.</h3><p>If you need a year-round home, unrestricted access or a purchase primarily for rental yield, this is not the same proposition.</p></div>
        </section>

        <section className={`${s.section} rd-container ${s.idea}`} id="ownership">
          <div data-rv><p className={s.kicker}>01 / The ownership</p><h2>One beautiful home.<br />A smaller share<br />of the responsibility.</h2><p className={s.body}>You do not need a whole second home to have a place of your own. With co-ownership, a small group of owners shares one home, its costs and the time spent there.</p></div>
          <div className={s.ownershipPhoto} data-rv>
            <Image src="/redesign/cala-codolar-ibiza.jpg" alt="Pool and palm-lined garden at Cala Codolar, Ibiza, overlooking the sea and Es Vedrà" width={1838} height={1225} sizes="(max-width: 760px) 100vw, 45vw" />
          </div>
        </section>
        <section className={`${s.ownershipDetails} rd-container`} aria-label="What ownership includes">
          {[
            ['Real ownership. A place of your own.', 'You own a real share of the home—not a booking or a membership. Ownership is held directly or through the company that owns the property, with your rights recorded in the purchase documents.'],
            ['Beautifully designed. Ready to enjoy.', 'Designer interiors, quality furnishings and carefully chosen equipment make the home feel special from your first stay. Our partners take care of the details, from the living spaces to the finishing touches.'],
            ['Yours to enjoy. Yours to pass on.', 'Your share is an asset, not a holiday allowance. Enjoy it today, with the option to sell, gift or pass it on to family in the future, under the ownership terms for your home.'],
          ].map(([title,text],i) => <article key={title} data-rv><span className={s.detailNumber}>0{i+1}</span><h3>{title}</h3><p>{text}</p></article>)}
        </section>

        <section className={`${s.section} rd-container ${s.stays}`} id="stays">
          <div className={s.stayImage} data-rv><Image src="/redesign/spain-sunny-v1.png" alt="A sunlit villa terrace and pool overlooking a Mediterranean bay" width={1536} height={1024} sizes="(max-width: 760px) 100vw, 45vw" unoptimized /></div>
          <div data-rv><p className={s.kicker}>02 / Your time there</p><h2>Make room for<br />the good weeks.</h2><p className={s.body}>A one-eighth share gives you around six weeks a year in your own second home, spread across the seasons. Plan longer holidays, shorter escapes and time with family and friends through the owners’ booking system.</p>
          </div>
            <div className={`${s.lines} ${s.stayDetails}`} data-rv>{[
              ['Plan ahead. Or be spontaneous.', 'Reserve through the owners’ booking system. Advance windows and short-notice stays vary by home; we explain the exact allowance and rules.'],
              ['Peak season is part of the picture.', 'Your time includes access to high, mid and quieter seasons—not just the weeks nobody else wants. Popular dates are shared through the home’s booking system, with the allocation and booking windows explained before you buy.'],
              ['Different owners. Different rhythms.', 'Where owner groups are matched, complementary travel preferences help: some households plan around school holidays, while others prefer quieter weeks. A thoughtful mix reduces competition for the same dates; the booking rules keep access fair.'],
              ['Bring the people you love.', 'Family and friends can stay with your permission. Enjoy the home together, or let them have a stay of their own.'],
            ].map(([title,text]) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section className={`${s.section} ${s.journey} rd-container`} id="buying"><div className={s.sectionHeading} data-rv><div><p className={s.kicker}>03 / From interest to arrival</p><h2>Four steps.<br />A place of your own.</h2></div><a className={s.textLink} href="#enquire">Let’s start a conversation ↗</a></div><ol className={s.steps}>{STEPS.map(([title,text],i) => <li key={title} data-rv><span>0{i+1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol></section>

        <section className={`${s.section} rd-container ${s.faqSection}`} id="questions"><div><p className={s.kicker}>04 / Your questions</p><h2>Straight answers.</h2><p className={s.body}>And if your question is about a particular home, just ask.</p><a className={s.textLink} href="#enquire">Speak to us ↗</a></div><div className={s.faqs}>{FAQS.map(([q,a]) => <details key={q}><summary>{q}<span aria-hidden="true">+</span></summary><p>{a}</p></details>)}</div></section>

        <section className="rd-section rd-collection-closing" aria-label="Newsletter"><div className="rd-container"><div className="rd-news" data-rv><div className="rd-news-body"><Newsletter editorial /></div></div></div></section>
        <section className="rd-section rd-collection-closing" id="enquire" aria-label="Enquiry" style={{scrollMarginTop:110}}><div className="rd-container rd-enquiry-editorial" data-rv><ExpertForm /></div></section>
      </main>
      <Footer />
    </div>
  </>;
}
