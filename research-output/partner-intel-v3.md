# Partner Operations Intel v3 — sitemap-driven crawl

A net-new findings document compiled by re-crawling each of the five COP partner sites with a sitemap-driven approach (rather than the 18-dimension framework used in v1 and v2). This document is **additive to** `partner-intel-v2.md` — it surfaces operational features that v2 either missed entirely or treated only in passing, with the largest single gap being the home-swap / exchange networks. Every quote in this document traces to a URL listed in the Sources section.

Last refreshed: 2026-05-27.

---

## Method + scope

v2 worked from a fixed list of 18 dimensions per partner. The flaw: any operational feature outside those 18 buckets got lost. For v3, the method is inverted — fetch each partner's `sitemap.xml`, enumerate every page, visit every static / editorial page, then categorize at the end. The result is a meaningfully richer picture of how each operator runs, especially around home-swap (a v2 miss flagged by David Olsson), the owner app, referral programs, loyalty tiers, AI / digital experience, and several legal nuances v2 under-treated.

For each partner the crawl involved: (1) `{root}/robots.txt` for the sitemap location; (2) the full `sitemap.xml` (or sitemap-index where applicable); (3) categorizing URLs by path prefix; (4) reading every static page (`/how-it-works`, `/faq*`, `/swap*`, `/financing*`, `/about`, `/press`, `/communities`, `/service-promise`, `/scheduling`, `/legal-structure`, etc.); (5) sampling 3–5 substantive blog posts per partner; (6) sampling 1–2 property listing pages to check property-level disclosures.

v3 does not re-paraphrase v2. Where a topic was fully covered in v2, this document references v2 and moves on. Where v2 was thin or wrong, v3 documents the new finding verbatim with citation.

---

## Page-type enumeration per partner

| Partner | Sitemap root | Total URLs | Languages | Static pages | FAQ pages | Listings | Blog posts | Notable content types |
|---|---|---:|---|---:|---:|---:|---:|---|
| Pacaso | `pacaso.com/xmlsitemap-index.xml` → 9 sub-sitemaps | 153 static pages (excluding 1,000s of US city-level destination pages, ~50 blog posts, ~190 listings) | English only on `.com`; international destination sub-domains separate | ~50 (incl. 7 swap-related, 12 separate FAQ sub-pages) | 12 (`/faq/owner`, `/faq/buyer`, `/faq/financing`, `/faq/resale`, `/faq/seller`, `/faq/scheduling`, `/faq/agent`, `/faq/property-management`, `/faq/swap`, `/faq/infinity`, `/faq/listings`, `/faq/neighbor`) | ~190 (listings sub-sitemap) | ~50 | "Alternatives" comparison pages (Ancana, MYNE, Inspirato, Exclusive Resorts, Timbers, August, Four Seasons, Paris Perfect); 16+ webinar landing pages; `/quarterly-collections`; `/pacaso-collector`; `/communities`; `/service-promise`; `/design-certified-homes`; `/2025-co-ownership-index-report` |
| MYNE Homes | `myne-homes.com/sitemap.xml` | 1,955 URLs | English (default), German (`/de/`), Swedish (`/se/`), Dutch (`/nl/`) | ~110 EN + 3× translations | 1 FAQ page (`/faq`) with 14 JSON-LD Qs | 364 (91 listings × 4 languages) | 28 EN blog posts + translations | 30 "collections" pages by destination; 21 `/lp/press/` press-mention landing pages; "concept" pages (`/concept/11-reasons`, `/concept/desired-times`, `/concept/resources`) |
| Vivla | `vivla.com/sitemap.xml` | 204 URLs | English (default) and Spanish (toggle via Weglot) | ~50 | 8 FAQ sub-pages (`/faqs`, `/faqs/buyers`, `/faqs/booking`, `/faqs/homes`, `/faqs/renting`, `/faqs/renting-guide`, `/faqs/legal`, `/faqs/exchange`, `/faqs/exchange-2026`) | ~95 listings + 5 `/upcoming/` | 66 | Dedicated `/andbank` landing page; `/legal-structure`; `/resale-liquidity-guide`; `/cost-investment-comparison`; `/ownership-booking-model`; `/vivla-studio`; `/vivla-community`; `/partners`; 6 `/music*` Spotify-playlist pages |
| &Hamlet | `andhamlet.com/sitemap.xml` | 131 URLs | English (`/`) and Norwegian (`/no/`); `/dk/` (Danish) blocked in robots | ~17 EN top-level + 31 `/resources/` long-form articles | 1 FAQ page (`/faq`) | 16 listings | 31 `/resources/` articles (a magazine-style format) | `/partnership` for agents; `/resources/referral-program`; `/resources/scheduling-system-and-dates`; `/resources/ownership-structure`; `/resources/an-overview-of-your-ownership-costs`; `/resources/the-distinction-between-hamlet-ownership-and-timeshare`; `/resources/exclusive-co-ownership-hamlets-management-role`; `/resources/a-sustainable-future-with-multiple-owners` |
| Abitaro | `ownabitaro.com/sitemap_index.xml` → page-sitemap.xml | 3 URLs (`/`, `/sign-up/`, `/homepage/`) | English only | 3 | None — no FAQ | 5 inline on `/` | None | Single-page WordPress site, Yoast SEO; entire offering is on the homepage |

**Net findings on scope:**

- **Pacaso has the densest operational documentation by far** (12 separate FAQ sub-pages, 7 dedicated swap pages, multiple referral/loyalty programs). Reading every page took ~50 fetches.
- **MYNE has the broadest language reach** of any partner (4 languages: EN/DE/SE/NL) — a finding completely absent from v2's coverage. Vivla supports 2 (EN/ES); &Hamlet supports 2 (EN/NO); Pacaso and Abitaro are EN-only.
- **&Hamlet's content is published as a 31-article magazine** under `/resources/`, including market updates, owner testimonials, and operational explainers — v2 sampled only a few of these.
- **Abitaro has effectively no operational documentation.** Three URLs in the entire sitemap. The "exclusive rental program" mentioned on the homepage has no dedicated page, no FAQ, no terms.

---

## Pacaso — net-new findings beyond v2

### Pacaso "Swap" home-exchange network (v2's biggest miss — now fully detailed)

This is the operational program v2 mentioned in a single sentence. v3 finds it is one of Pacaso's most heavily-developed product features, with **7 dedicated public pages**: `/swap`, `/swap-collections`, `/swap-connections`, `/owner-swap-resources`, `/faq/swap`, `/webinar/pacaso-owner-swap`, `/webinar/pacaso-swap-benefits`. There is also `/faq/infinity` for the new whole-home exchange tier (see next section).

**How it works (verbatim from `/faq/swap` and `/swap`):**

- **Two swap types** (per `/faq/swap`): (1) swapping stays with other co-owners of your own home, via the Book tab in the app; (2) swapping stays with owners of other Pacaso homes worldwide, via the Swap tab.
- **Two payment modes within the cross-home swap:** (i) **1:1 stay-for-stay swaps** (the default), and (ii) **Swap Credits** (auto-generated for high-demand stays, redeemable instantly without 1:1 reciprocity).
- **Share-value threshold** (verbatim, `/faq/swap`): "Owners can initiate swaps, or instantly reserve a swappable stay with a credit, with swappable stays in homes up to $300,000 over your share price (share value threshold). For example, if your share price is $500,000, you have access to swap availability with homes that are $800,000/share or less. Although you may not be able to access inventory at all levels, owners in homes over your share value threshold can still initiate swaps with you."
- **Swap credits — auto-generation** (verbatim, `/swap`): "Pacaso's intelligent swap scoring system identifies high-demand, high-value stays within the Pacaso portfolio. When high-valuable stays become available for swap, the system automatically generates a swap credit for the owner's stay. That stay continues to be swappable in the system for other owners to confirm, and the credit is instantly available in the owner's account, ready for immediate use."
- **Credit redemption** (verbatim, `/swap`): "Your swap credits can be used on any stay that's been made available for swap. Share value thresholds apply. When you find a stay that you like, you can use your credit to confirm the swap instantly, without waiting for owner approval."
- **Asymmetry permitted** (verbatim, `/swap`): "Without possessing swap credits, you must make a 1:1 swap, meaning you exchange your stay for another owner's stay. However, you are not required to swap the same stay dates. For example, you could swap a stay in July for a stay in March. Your swap can also be imbalanced: For example, you can swap your Christmas stay for an advance stay in another home or even a 14-night stay for a 7-night stay."
- **Response window** (`/faq/swap`): The receiving owner has **5 days** to accept or decline a swap request (this is the canonical time; the older `/owner-swap-resources` page references both 3-day and 5-day windows).
- **Filter and preference settings** (`/owner-swap-resources`): owners can favorite specific homes or markets to be notified of new swap availability, or block homes/markets they don't want to see.
- **Anonymity** (`/owner-swap-resources`): "All swaps will be anonymous going forward." Pacaso explicitly removed an older friend-to-friend connections feature in favor of platform-mediated swaps.
- **Commitment terms** (`/owner-swap-resources`): "Confirmed swaps cannot be modified or canceled. The monthly expenses of my home continue to be my responsibility, regardless of any confirmed home swaps. I am responsible for cleaning fees and charges for any damage I incur in another home."
- **Damage policy** (`/owner-swap-resources`): "If I incur damage to another Pacaso home during a swapped stay, this feature will be permanently removed from my app."
- **Resale impact** (`/owner-swap-resources`): "If I have confirmed home swaps on my calendar at resale, the swaps will be honored, which could impact the value of my resale."
- **Special-vehicle exclusion** (`/owner-swap-resources`): "If a swapped stay has an insured vehicle (e.g., golf cart, duffy boat), these are NOT available to swap-stay users."
- **Opt-out mechanism** (`/owner-swap-resources`): An entire home can be removed from the Swap program if the owners vote to do so. Send an email to the Home Manager; if the vote passes, the home is permanently removed (pending requests cancelled; confirmed swaps still honored). However see the Infinity exception below.

**Swap-eligible network scope:** Pacaso's `/swap-collections` page shows confirmed swap-network homes across the US (Napa, Corona Del Mar, Santa Barbara, Jackson WY, Malibu, Calistoga, Park City UT, Newport Beach), plus international Pacaso homes per `/from-the-ceo`: "high-demand homes mean high swap potential across the Collection" — implying the global Pacaso portfolio is the network.

**CEO marketing of Swap** (`/from-the-ceo`, April 2026): Austin Allison explicitly markets new international homes (Tuscany, London Mayfair, Paris Saint-Germain, Paris Seine, Punta de Mita, Cabo Costa Azul) as Swap-network destinations: "What's worth underscoring is that these international homes are often in high-demand. And that matters for every Pacaso owner, because high-demand homes mean high swap potential across the Collection."

### Pacaso Infinity — new invitation-only whole-home exchange tier (launched February 2026)

**Wholly missed by v2**: an entire new product line. Per Pacaso's press release `2026-02-03-Pacaso-Introduces-Infinity` and `/faq/infinity`:

- **Definition** (`/faq/infinity`): "Infinity by Pacaso is the newest evolution of Global Swap, giving you access to an expanded network of remarkable, highly vetted whole homes in desirable destinations."
- **What's new**: Infinity adds **whole-home owners (not just Pacaso co-owners)** to the Swap network. These are private second-home owners whose homes have been vetted and onboarded into the swap pool.
- **Vetting** (`/faq/infinity`): "Every Infinity home undergoes a thorough review of the homeowner, the property, and the property management team."
- **Marketed Infinity destinations** (`/faq/infinity`): "Mexico City, St. Barts, Napa Valley, New York City, Tuscany, and more."
- **Live date** (`/faq/infinity`): "Pacaso owners will be able to make their first Infinity home swaps beginning in Q1 2026."
- **Mechanics**: Same as standard Pacaso Swap — share-value threshold applies, swap credits work the same way, the Pacaso AI scoring model assigns relative share value to Infinity whole homes.
- **Opt-out caveat** (`/faq/infinity`): "If you want to host a vote with your ownership group to remove your home from the Swap program, we can support facilitation of this vote; however, there is not an option to vote to remove Infinity homes from the Swap platform for your home as these homes are Pacasos." — i.e. Infinity participation is opt-in at the network level but **mandatory if you're in the broader Swap program**.
- **Owner participation** (`/faq/infinity`): "We're inviting standout whole-home owners to join the Infinity network. If you own a second home that you think would be an excellent fit — or know someone who does — Pacaso would love to learn more."
- **Branding** in third-party press (Robb Report, May 2026): "Infinity, an invitation-only exchange program that opens the swap concept to vetted whole-home owners." Press coverage calls Infinity "the $100K key to an ultra-exclusive home swap club" — a per-membership figure not stated on Pacaso's own page; **confirm with David / Pacaso**.

### Pacaso owner app / scheduling system (SmartStay™) — full operational rules

v2 covered SmartStay at a high level. v3 finds:

- **Advance vs short-notice stay rules** (`/faq/scheduling`):
  - Advance stays: 8 days to 24 months in advance; **6 advance stays per share at a time**.
  - Short-notice stays: 2–30 days in advance for US homes; **2–60 days for European homes** (a Europe-specific window v2 missed).
  - For homes with unsold shares: short-notice window narrows to 2–7 days.
- **Stay length math** (`/faq/scheduling`): "Stays must be for a minimum of two nights, with longer stays using multiple advance stays. For example, 2–7 nights counts as one, 8–14 nights as two, 15–21 nights as three, and so on."
- **No cap on consecutive nights** (`/faq/scheduling`): "Our scheduling rules offer even more flexibility — if dates are available, owners can use all six of their stays consecutively, with no set cap on total nights." This **directly closes v2's open question Q-Pacaso-5**.
- **Spacing rule** (`/faq/scheduling`): "The period between any two of your stays must be equal to 7-nights or more. However, in an effort to support splitting up longer stays for swapping, you can book two consecutive stays (1 night in between). These stays will be merged in the short notice window automatically if no swap has been confirmed."
- **Special dates** (`/faq/scheduling`): "Special dates include select U.S. federal holidays as well as popular local events. They vary for each region, but they are clearly marked in the scheduling calendar in the Pacaso app. Special date stays require a 3-night minimum." Each owner gets 1 special-date stay per share.
- **Cancellations** (`/faq/scheduling`): "Stay cancellations will trigger a notification to the other co-owners, alerting them of the newly available dates. If you cancel a stay that has confirmed guests, your guests will receive a stay cancellation notification and the stay will be removed from the guest view of their Pacaso app." (No explicit penalty for cancellation; the only consequence is loss of an advance-stay slot if not re-booked.)
- **Arrival flexibility** (`/faq/scheduling`): Earlier arrivals / later departures can be requested; notification given 48 hours prior.

### Pacaso Collector loyalty / multi-share ownership program

**Wholly missed by v2.** Per `/pacaso-collector` and `/collector-first-look`:

- **Qualifying threshold**: "To become a Pacaso Collector, you must own more than 1/8 ownership in Pacaso homes — either by purchasing a 1/4 share of a single Pacaso or by owning multiple 1/8 shares across different homes or within the same residence."
- **Collector benefit**: "When you purchase a Pacaso, you'll receive a credit at closing that covers the first 12 months of estimated Operating Expenses, giving you an immediate benefit and reducing your initial payment."
- **Applies to resale Pacasos too**: "Yes, purchases of Select Resale Pacaso homes can qualify for this offer, but they're subject to seller approval."
- **Marketed scope**: A `/collector-first-look` page invites Collectors to early-access new homes before the general market.

### Pacaso quarterly collections (price-lock promotion)

Per `/quarterly-collections`: Pacaso markets quarterly themed collections (Spring/Summer 2026 collection) where "well-qualified buyers can secure introductory pricing on the Pacaso 2026 Spring/Summer Collection. With prices subject to change and several homes already sold out, now is the time to lock in your place in the collection." Themes are geographic (Mexico retreats, Rocky Mountain escapes, European homes, Southern coast). Not in v2.

### Pacaso referral program — formal structure

Per `/referral-program` (general public) and `/owner-referral` (existing-owner program):

- **Compensation**: "If you purchase a Pacaso within one year of being referred, a three-month operating expense credit will be applied directly to both your account and your referring friend's account." Both sides of the referral get 3 months of operating expense credit. Not in v2.
- **Agent referral program** (`/faq/agent`): Real estate agents receive **3% referral commission** on the share price (not the whole-home price) for any Pacaso they refer to a closing. Pacaso operates a dedicated **Pacaso Agent Referral Dashboard** for tracking. v2 did not document the 3% rate.
- **International agents welcome** (`/faq/agent`): "Yes! You or your buyer can be located anywhere in the country, and you even work with international buyers."
- **Multi-share commission** (`/faq/agent`): "If you bring multiple buyers, you'll receive a referral commission for each share sold."

### Pacaso crypto / payment options — much more detailed than v2 captured

Per `/faq/financing`:

- **Accepted cryptocurrencies**: Bitcoin (BTC), Ethereum (ETH), Litecoin (LTC), Bitcoin Cash (BCH), Dogecoin (DOGE), Wrapped Bitcoin (WBTC), and **five USD-pegged stablecoins**: GUSD, USDC, USDP, DAI, BUSD. ERC20 stablecoins only.
- **Crypto fee**: "Pacaso collects a 1% transaction fee which we pass through to BitPay for their services. Pacaso does not charge or retain any additional fees."
- **Crypto + financing combination**: "Yes, eligible buyers can finance up to 70% of their purchase and pay their down payment in crypto. Monthly financing installments may only be paid in US dollars."
- **Refund behavior**: "deposit funds will be returned in US dollars" — i.e. you pay deposit in BTC, get refunded in USD if the deal falls through.
- **Operational scope**: "Pacaso is not accepting crypto directly for monthly owner expenses" — operating expenses are USD-only.

### Pacaso financing — additional v3 detail

Per `/faq/financing` and `/financing-offers`:

- **Banking partners** (verbatim, `/faq/financing`): "As a global company, Pacaso works with all large money center banks." — Pacaso does **not name specific bank partners**.
- **No prepayment penalty**: "There is no prepayment penalty for buyers who finance with our banking partners."
- **Approval pace**: "approval takes just a few days" once driver's license, pay stubs, a tax return, current bank statement, and credit report are provided.
- **Pacaso as guarantor**: "If one owner defaults, Pacaso steps in as the guarantor of the loan and continues to make all payment obligations of the loan and any associated operating expense of that owner."
- **Closure point — Q-Pacaso-3**: Pacaso's site **does not directly state** whether the 70% LTV product is available to non-US buyers or for European Pacaso homes. Whether explicit operator silence on this point means "no" or "case-by-case" remains David's question to ask the Pacaso sales rep. v3 cannot close this.

### Pacaso listings curation — Available Now, Coming Soon, third-party, Prospect

A whole new categorization v2 did not capture. Per `/faq/listings`:

- **Available Now homes**: Pacaso-owned, fully furnished, stay-ready.
- **Coming Soon listings**: Pacaso has closed on the home but not yet design-installed; pricing is estimated.
- **Third-party / Prospect listings**: Whole homes Pacaso displays via IDX/MLS feeds; if buyer interest hits a threshold ("unlocks the listing"), Pacaso pursues acquisition. "The $5,000 reservation deposit is refundable on a home until Pacaso is under contract on the home. Once a buyer places a $10,000 deposit, this becomes non-refundable, unless Pacaso does not move forward on the home due to inspection failure or other unforeseen circumstances."
- **Crowd-sourcing acquisition**: Pacaso has converted its acquisition pipeline into a buyer-demand-driven model — buyers signal interest, Pacaso evaluates, then purchases. A clear product evolution from v1's "Pacaso buys homes outright."
- **Whole-home pricing displayed in select markets** (`/faq/buyer`): "Select listings may display whole home pricing in certain markets to comply with local MLS rules." This explains the inconsistent pricing display COP buyers may see across Pacaso's site.
- **AI-driven curation** (`/faq/agent`): "We have established a set of home criteria, and using AI, use those parameters to curate listings from IDX feeds that meet the baseline criteria to become a future Pacaso. Criteria is set based on a large dataset of vacation home buyer preferences."

### Pacaso owner experience terms — formal event/experience program

Per `/owner-experience-terms`: Pacaso runs branded owner events ("Experiences") with formal terms. ACH authorization required, 7-day transfer notice, waitlist mechanic. Governed by Delaware law; disputes via binding AAA arbitration. The existence of a formal owner-event program (beyond just home access) was not in v2.

### Pacaso AI-generated CEO avatar — operational note

Per `/from-the-ceo` April 2026 newsletter: "The video was created using an AI-generated avatar of Austin Allison so we can share more from him, more often." A novel operational detail — Pacaso uses an AI avatar of the CEO for owner-facing video content. Likely material for any partner-comparison narrative around technology adoption.

### Pacaso pets, restrictions, code of conduct

Per `/faq/buyer`:

- **Pets**: "Yes. Owners may bring up to two dogs to their home, with some restrictions." (Cats and other animals not addressed.)
- **Personal storage**: Each owner has designated storage space for personal items.
- **Code of Conduct**: "All Pacaso owners must adhere to our owner Code of Conduct. For example, Pacaso owners are prohibited from renting out their homes or hosting events that would be disruptive to the neighborhood."
- **Neighbor relations** (`/faq/neighbor`): Pacaso publishes a 9 p.m.–7 a.m. quiet-hours rule, has a dedicated `neighbors@pacaso.com` inbox, and an entire `/communities` page positioning Pacaso as a counter-narrative to "controversial second-home buyers." This is reputational architecture, not just operational policy.

### Pacaso design — owners can't customize freely

Per `/design-certified-homes`:

- **Design is brand-controlled**: "In general, no. Our design work is a critical part of our service and brand. Each piece is selected to align with the overall creative vision of the home, and we have rigorous standards in terms of form, function, and quality."
- **Replacement authority**: "In order to uphold our brand standards, Pacaso's Design team may decide to replace old or worn items. This does not require an owner vote, and the ownership group will need to pay for any replacements deemed necessary by Pacaso."
- **Owner-requested changes**: Require Design-team brand-standards review, then owner vote, then owner-group payment.
- **White-glove logistics**: "Most wholesale items must go to a receiving warehouse. We then use a white glove logistics partner to consolidate items at the warehouse, transport items to the home, and assemble and install each item."

### Pacaso resale — additional v3 detail

Per `/faq/resale`:

- **Buyer transaction costs on resale**: "For the buyer, there are no title, inspection or service fees on resale transactions. Buyers make a small non-refundable contribution to the reserve account for the Pacaso home at the time of closing. Buyers who choose to finance their purchase also pay a financing fee at closing."
- **Marketing escalation** (`/faq/resale`): "If we don't have an offer right away, we'll include the home as an active listing on our website, and work with our local partner agents to hold open houses and market the listing through their networks. We then market your listing…" — there is a multi-step escalation from existing-owner-only marketing to broad open-market exposure.
- **Negotiation permitted**: "Yes, we think of the resale marketplace as fluid and moving in line with the open market, so buyers are welcome to bring offers. The seller can choose to accept or decline any offer."

### Pacaso seller program — selling part of your existing home to Pacaso

Per `/faq/seller`:

- **Inverted onboarding**: Pacaso has a structured program where an existing whole-home owner can sell part of their home (up to 50% retained by the seller) into Pacaso. "Once half of the available ownership interest is sold, Pacaso works with the seller to contribute the home into a property-specific LLC. Following contribution, owners can begin using the home while the company sells the remaining ownership."
- **Owner-vetting language**: "We vet all owners, who agree to a common-sense owner code of conduct. The home will be reserved for the exclusive use of owners and their guests."
- v2 mentioned this in passing; v3 documents the formal program exists with a dedicated FAQ page.

### Pacaso property management — in-house vs third-party transition

Per `/faq/property-management`:

- **2022 transition**: Pacaso "sunset relationships with third-party property managers and brought property management in-house with local, full-time Pacaso employees" across most markets.
- **Caveat**: "In emerging Pacaso markets, we may continue to use third-party managers." Most markets use full-time Pacaso employees.
- **Operational stack**: Dedicated local Home Manager + after-hours Virtual Home Manager + in-house maintenance team + vendor management + financial management (bill payment, including utilities, insurance and property taxes).

### Pacaso service promise — first dedicated page in v3 sample

Per `/service-promise`: A 4-pillar promise structure (Proactive maintenance / Premium turnover / Dedicated service / Empowered ownership) — published as a formal commitment document. Not in v2.

---

## MYNE Homes — net-new findings beyond v2

### MYNE exchange programme (the swap program v2 missed)

MYNE has a named "MYNE exchange programme" — verbatim from `/faq`:

> "**Can I swap my holiday dates with Co-Owners of other MYNE properties?** As a Co-Owner, you can take part in the MYNE exchange programme to swap your holiday dates with other Co-Owners. Choose your preferred MYNE destination, select a holiday date and duration, and determine property features (e.g., number of bedrooms). **The MYNE Owner Service will then search for Co-Owners in suitable MYNE properties who would be willing to swap stays with you.**"

Verbatim from `/how-myne-works`: "You can request to swap stays with other MYNE Co-Owners to discover and enjoy other properties under MYNE management."

Verbatim from `/concept/11-reasons` (a key explainer page): "You can open up a whole portfolio of dream holiday homes in the most beautiful places in Europe with just one share in a MYNE home. As a MYNE Co-Owner, you can stay in other MYNE homes and if your needs change, you can easily exchange or sell your share."

**Mechanics (vs Pacaso's):**

- **Concierge-mediated, not platform-mediated.** MYNE's exchange is brokered by the **MYNE Owner Service** team, who searches for compatible co-owners willing to swap, rather than an algorithmic / app-native marketplace. This is a meaningful operational difference from Pacaso's Swap (entirely self-serve in the app) and from Vivla's Keys system (semi-self-serve with Guest Experience Manager confirmation).
- **Network scope**: All MYNE properties under MYNE management, across all 9 countries (Spain, Italy, Germany, Austria, France, Portugal, Croatia, Sweden, England).
- **Eligibility**: All MYNE co-owners are eligible.
- **Costs**: Not explicitly stated. MYNE's exchange appears to be free-of-additional-charge (no swap fee mentioned); the request mechanism is via the Owner Service.
- **Volume / typical usage**: Not stated. **Open question for David.**

### MYNE Satisfaction Guarantee — 12-month exchange-or-money-back (missed by v2)

Verbatim from `/concept/11-reasons`:

> "**Within the first 12 months of purchasing a share, if you are not happy with your MYNE home, you have the option to transfer your ownership to a MYNE home of equal or greater value.** If we add a new property to our portfolio that you like even more than your original purchase, this satisfaction guarantee will also help you. **All transaction costs are on MYNE's account — you are only liable for the difference between the share prices.** Alternatively, you can sell your share at any time after 12 months — MYNE will be happy to be of assistance."

This is a material new finding. MYNE explicitly publishes a 12-month satisfaction guarantee that lets a buyer exchange their share into a different MYNE property (with MYNE absorbing transaction costs). v2 mentioned "MYNE Satisfaction Guarantee" only as a placeholder collapsed item in the FAQ; v3 documents the actual mechanic verbatim.

**This is structurally similar to (but more buyer-friendly than) Vivla's first-12-months exchange option.** Both Spanish/European partners offer a first-year mulligan; Pacaso and &Hamlet do not.

### MYNE €99/month MYNE Service Fee — confirmed verbatim

Verbatim from `/blog/hassle-free-ownership`: "In addition, owners pay a monthly fee of 99 EUR to MYNE, which covers the administration of the limited liability company, ongoing customer support and the operation of the technology."

This **closes v2's open question Q-MYNE-1** to a meaningful degree: MYNE's all-in monthly operating cost includes a fixed **€99/share/month MYNE Service Fee** (the same headline figure as &Hamlet's NOK 1,000 / €99 platform fee — making this an emerging European-market convergence point). The other components (consumption-based costs, fixed costs per share) remain budget-driven and property-specific.

### MYNE language support — 4 languages (missed by v2)

Sitemap analysis reveals MYNE publishes its entire site in **English, German, Swedish, and Dutch** (paths: `/`, `/de/`, `/se/`, `/nl/`). Approximately 489 URLs per language version. v2 treated MYNE as DE-EN bilingual; v3 corrects this — **MYNE supports 4 languages**, reflecting its market presence in DACH (DE), Scandinavia (SE) and Benelux (NL). This is the broadest language footprint of any COP partner.

### MYNE booking window — confirmed 2 days to 2 years

Verbatim from `/blog/the-alternative-to-traditional-vacation-property-financing`: "Co-owners can conveniently reserve their stays 2 days to 2 years in advance via the MYNE Ownership app." v2 said this was "not re-verified verbatim in v2"; v3 confirms it on a current MYNE page.

### MYNE 24/7 service via WhatsApp

Per `/how-myne-works`: "24/7 MYNE service via phone, email, and WhatsApp." A specific channel commitment (WhatsApp) v2 did not surface. Relevant because European buyers expect this; American buyers may find it novel.

### MYNE owner-pairing logic — operationally explicit

Per `/concept/desired-times`, MYNE publishes 7 archetypal owner profiles ("Mr Weber," "The Taylors," "The Peters family," "The Riedels," "The Walthers," "Ms Wolff & Mr Marx," "Mr Brandner") and explains how it pairs them to minimize calendar conflicts. Examples:

- Mr Weber: Mallorca cyclist, March–June + Sep–Nov.
- Peters family: summer months with young children.
- Walthers: school-holiday-tied family.
- Ms Wolff & Mr Marx: late fall/winter to escape German winter.

This is far more operationally explicit than the general "compatible usage needs" language v2 captured. Buyers can be told what profile they fit before being matched into a property.

### MYNE rental — operator-run program, no commission disclosure

Per `/faq`: "**Can the property be let?** In principle, your share is your property. This means you can decide if you wish to use the property for the available period or let it out, as long as you do not put the other Co-Owners at a disadvantage, and the property has a rental licence. You can let friends or family stay there without having to be there in person. Whether you take a fee from them is up to you. **However, we also provide a professional letting service to external third parties.**"

MYNE's rental program exists but the commission split is not disclosed publicly — **Q-MYNE-3 from v2 remains open**.

### MYNE — first-year exchange-into-MYNE-share is operationally similar to but smaller than Vivla's

Both MYNE and Vivla offer 12-month satisfaction-exchange guarantees. The key difference:

- **MYNE**: Buyer pays only the **difference between share prices** (if upgrading to a higher-value property); MYNE absorbs all transaction costs.
- **Vivla**: Same mechanic ("During the first 12 months, a VIVLA co-owner can exchange his fraction in a VIVLA home for any other available VIVLA fraction. If the price of the new fraction is higher, he pays the difference. If it is lower, the difference remains as a credit to cover the maintenance costs of the new fraction." — per `/faqs/legal`).

This shared mechanic is worth flagging as a "European co-ownership market standard" — Pacaso and Abitaro do not offer it; &Hamlet does not offer it.

### MYNE press footprint — UK-focused

v2 noted UK launch as "early phase." v3 finds MYNE has 21 dedicated press-mention landing pages, many UK-focused (Daily Mail, Daily Star, Daily Express, This is Money, Property Industry Eye, The Independent, ATV Today, Times). Combined with the 1 England property in COP catalog, this suggests MYNE is **investing heavily in UK marketing ahead of inventory** — relevant context for UK COP buyers.

### MYNE collections / destination depth — 30 dedicated collection pages

MYNE publishes 30 named destination collection pages (Algarve, Austria, Baltic Sea, Cote d'Azur, Croatia, England, France, Germany, Ibiza, Istria, Lake Como, Lake Maggiore, Salzburger Land, Sardinia, Stockholm Archipelago, Sylt, Tuscany, Italy, Lake Garda, London, Mallorca, Portugal, Spain, Sweden, Tyrol, North Sea, Tenerife, Costa del Sol, plus city-properties). The deepest destination publishing of any COP partner.

---

## Vivla — net-new findings beyond v2

### Vivla's "Keys" exchange system — the most operationally-complete exchange model of any COP partner

Vivla has two exchange products documented on separate pages:

**Legacy program (`/faqs/exchange`):**

> "It works in a very simple way, if you offer a week to exchange, you get a week in another Vivla house within the same season. This allows you to move on to enjoy the rest of the houses."
> "This is a 30-day period, which opens after the two rounds of choice of stays have closed, during which owners can request to exchange their stays with other owners."
> "It's simple: you can exchange between owners of the same VIVLA house or of different VIVLA houses in different destinations, **as long as you do it within the same period of the election year and exchange the same number of stays.** If the exchange is between different seasons, it will be done under a specific parity."
> Process: "One owner will request it, and the Guest Experience Manager (GEM) will contact the other owner to confirm if there is mutual interest in the exchange."

**Keys (2026) program (`/faqs/exchange-2026`)** — fully detailed:

> "**The Keys** — They are internal credits that allow you to book stays in other homes within the Vivla community. They are not money — they represent access."
> "**How do I earn them?** [Implied from listing weeks; see below]"
> "**Do they expire?** Yes. **Each Key lasts 24 months**, but we'll notify you ahead of time (90, 30, and 7 days). You also have a **one-time 12-month extension** to avoid losing them."
> "**Do the Keys have any monetary value?** No. They cannot be converted into cash or transferred to other owners. They are a symbolic system of access and balance within the community."
> "**Where can I see my Keys?** In your Vivla app. You'll always see your Key wallet. When browsing the exchange pool, you'll see the cost of each stay in Keys and have a clear record of all your movements — like a personal travel bank."
> "**What is a 1:1 exchange?** When you list a week that matches another owner's listed week on the same dates, both of you receive a notification to see if you'd like to book each other's homes."
> "**Can I withdraw [a listed week] later?** Yes, as long as it hasn't been booked **and was listed in low season or less than 9 months in advance.**"

**Comparison: Pacaso Swap vs MYNE Exchange vs Vivla Keys**

| Feature | Pacaso Swap | MYNE Exchange | Vivla Keys |
|---|---|---|---|
| Currency | Swap Credits (auto-generated for high-value stays) | 1:1 stay swap (concierge-mediated) | Keys (24-month credits, expire) |
| Mediation | Self-serve in the Pacaso app | MYNE Owner Service brokers | Vivla app + Guest Experience Manager confirms |
| Network scope | All Pacaso homes + Infinity whole-home network (6 countries) | All MYNE homes (9 countries) | All Vivla homes (Spain only, 10+ destinations) |
| 1:1 swap path | Yes (default if no credit) | Default (only path) | Yes (matching-week notification) |
| Value threshold | $300k above your share value | Not stated | Same-season parity rule |
| Credit expiry | Not stated | N/A | 24 months + 12-month one-time extension |
| Transferable | Anonymous; not transferable | Not stated | Not transferable; "no monetary value" |
| Damage policy | Stay-user pays cleaning + damages; repeat offenders lose feature permanently | Not stated | Not stated |
| Resale impact | Confirmed swaps honored at resale | Not stated | Not stated |

### Vivla annual fees — definitive 1.5–2% figure (resolves v2's contradiction)

v2 flagged that Vivla's site had **both** "2% to 2.5%" (how-it-works) and "3.5% to 4%" (FAQs). v3 finds the **current canonical figure is 1.5%–2%**, consistent across three current pages:

- `/faqs/buyers`: "They vary depending on each house, usually between **1.5% and 2% per year of the price of the fraction.** That is to say, if my fraction costs 100 thousand euros, it is normal that my monthly maintenance cost is around 200 euros."
- `/faqs/booking`: identical language.
- `/andbank`: identical language.
- `/partners` (the agent-referral page): identical language.

The 1.5%–2% figure is the canonical operating-cost band — corresponds to roughly €1,800–€2,400/year per €100k 1/8 share, or about €150–€200/month. **This closes v2's Q-Vivla-1.**

### Vivla — Andbank is a shareholder (not just a financing partner)

**Wholly missed by v2.** Per `/andbank` (legal disclosure at the bottom of the page):

> "It is hereby expressly noted to the clients of Andbank España Banca Privada, S.A.U. that the bank, **through its group company ACTYUS FINTECH I, FIL, a fund managed by ACTYUS PRIVATE EQUITY SGIIC, S.A., holds 3% of the share capital of VIVLA LIFESTYLE, S.L.**"

Andbank isn't just a Lombard-loan partner — it's a 3% equity investor in Vivla. This explains why `/andbank` exists as a dedicated landing page (for Andbank's wealth-management clients) and why Vivla has structural alignment with Andbank's lending product. v2 documented Andbank-via-Lombard but did not capture the equity relationship.

### Vivla — 10+ destination network in v3 (vs ~7 in v2 era)

Per `/why-vivla`: "you get full access to a growing network of homes across **10+ destinations**." Current marketed destinations (per `/andbank` page): Ibiza, Menorca, Costa de la Luz, Costa Blanca, Costa del Sol, Cantabria, Formentera, Baqueira, Madrid, Asturias — exactly 10. v2 listed ~7 destinations; v3 confirms the growth.

### Vivla — 3 separate liquidity windows (vs v2's 1)

Per `/faqs/legal`: "**VIVLA co-owners have three liquidity windows:**"
1. "During the first 12 months, a VIVLA co-owner can exchange his fraction in a VIVLA home for any other available VIVLA fraction." (First-year satisfaction exchange.)
2. "After the 12th month, a VIVLA co-owner can put the fraction up for sale at the price he/she considers." (Open-market resale.)
3. "After 10 years you can liquidate your fraction if you wish." (Long-term liquidation — likely refers to forced liquidation if Vivla winds down the SL after 10 years, but operator language is ambiguous; **confirm with David**.)

v2 only described #2. The 10-year liquidation window (#3) is operationally meaningful — possibly the cap on the SL's intended duration. Worth a Vivla open question.

### Vivla — formal legal-structure page with control measures

Per `/legal-structure`:

- **8 shares per SL, max 4 (50%) per owner**: "The Company's Share Capital is divided into eight Shares. Each Owner can acquire up to a maximum of 4 Shares (50%) to avoid gaining control of the Company." This is a control mechanic v2 did not detail — it prevents any single owner from voting-blocking the rest.
- **Single-purpose SL**: "The sole purpose of the Company is the acquisition and holding of the Property."
- **Transfer pricing** (legal-structure page): "Transfer Pricing by Garrigues, Appraisal by Savills." Vivla uses Garrigues (Spain's largest law firm) for the transfer-pricing structure and Savills for valuations.
- **Legal entity buyers allowed**: "Yes, purchasing through a legal entity is fully supported by the Shareholders Agreement. You simply need to designate one individual representative for communications with VIVLA." — corporate / family-office / trust buyers are accepted.
- **Group purchases**: "Yes, a single share can be purchased by up to 3 people (friends or family). However, one person must act as the representative for all administrative dealings with VIVLA." — Vivla explicitly allows friend-groups or extended families to co-buy a single share.
- **Equity / Shareholder Loan / Market-Rent Usage Fee structure** (per `/legal-structure`): Vivla splits the purchase into Equity + Shareholder Loan for tax efficiency; owners pay a Market-Rent Usage Fee that offsets the loan interest — a "Zero Sum" structure where the SL has no net P&L from inter-company flows. Sophisticated tax engineering v2 mentioned only briefly.

### Vivla — Rental program: contradictory info on "no commission"

The `/andbank` page states: "Yes, it is your house and you can rent it out. We take care of doing it for you so you don't have to worry about anything, **and we do not charge any commission for this.** The price is set based on the market."

But `/faqs/renting` states: "We charge a **15% commission** on the rental price, which includes the integral management of reservations, marketing, customer service and price optimization."

These are inconsistent. The Andbank landing page may use simplified language for a specific (Andbank-client) audience, while the FAQ documents the standard commercial terms. **Worth flagging for David — confirm canonical rental commission rate.**

### Vivla — Rental income distribution rule

Per `/faqs/booking`: "Rental profit is shared **equally only among owners who have chosen to rent their stays**, and is based on the number of weeks rented within a season. In addition, the economic value of all weeks within a season is considered equal." — i.e. owners who opt in to rental form a pool; high-season weeks are not weighted higher within the same season. v2 did not document this distribution logic.

### Vivla — Guest cancellation policy

Per `/faqs/renting`: "Guests must cancel at least 60 days prior to arrival to receive a 50% refund of all nights. If you cancel after that time, you will receive 100% of all nights." — i.e. **owner gets 100% if guest cancels under 60 days out** (this is the rental-program standard set by Vivla; owner-protective).

### Vivla — Insurance built into rental program

Per `/faqs/renting`: "We have an insurance that covers possible damages caused during stays. In addition, platforms such as Airbnb offer additional guarantees for hosts." Vivla provides liability coverage for the rental program; the operator-procured insurance is an additional layer beyond Airbnb's host guarantee.

### Vivla — Persistent assets / partners ecosystem

Per `/why-vivla`, Vivla's stated partner network: **"Garrigues, Andbank, Savills, Lucas Fox, Engel & Völkers, RE/MAX Collection, and more."** Six named external partners. Lucas Fox and Engel & Völkers are luxury Spanish real-estate brokerages — implies Vivla uses them for sourcing and resale.

### Vivla — Booking system rotation logic

Per `/faqs/booking`, the year-2-onward fairness rule is explicit:

> "In the first year, the order is determined by the date of purchase. From the second year onwards, our innovative system comes into action. It consists of two rounds: In the first round, the system identifies the most disadvantaged owner from the previous year, giving them first choice. In the second round, the order is determined according to who has been most [disadvantaged in Round 1]."

The exchange window opens *after* both rounds close — i.e. the calendar process is Round 1 → Round 2 → 30-day exchange period → external rental window. Detailed enough that v3 buyers can predict the calendar process.

### Vivla — what happens to your stays if you don't pay

Per `/faqs/legal`: "The partners' agreement establishes that you are not allowed to enter the housing, as long as you do not pay. Your housing is put up for rent to ensure the payment of your expenses." — Vivla can rent out a defaulting owner's weeks to recover dues. Operator-protective; the share owner does not get evicted but loses use until balance cleared.

### Vivla — Music playlists (operational detail worth noting)

Vivla maintains 6 `/music*` pages (`/music`, `/music-bedroom`, `/music-bathroom`, `/music-dining`, `/music-kitchen`, `/music-living-room`, `/music-outdoor`) — curated Spotify playlists by room. Minor but a brand-experience touch worth flagging.

### Vivla — VIVLA Studio (in-house interior design)

Per `/vivla-studio`: The Vivla Studio is an in-house team combining architecture + interior design. Lead designer Maria Rivero Alonso (Madrid, Shanghai, London, Brussels background; founded "House öf Lime" in 2017). Vivla brands the design service as part of the "VIVLA Certified" property quality assurance. v2 mentioned this only in passing.

---

## &Hamlet — net-new findings beyond v2

### Home-swap / exchange — **&Hamlet has NO swap or exchange program**

Confirmed across the sitemap. &Hamlet's `/sitemap.xml` contains no `/swap`, `/exchange`, or `/network` pages. The `/faq` page makes no mention of swap, exchange, or network-of-other-homes. The `/resources/` magazine of 31 articles has no swap article.

This is operationally significant. **&Hamlet is the only COP partner with no inter-home exchange / swap program of any kind.** Owners get exclusive access to their specific &Hamlet home and that's the entirety of the offering — there's no portfolio-network upside.

This is consistent with &Hamlet's "exclusivity" / "carefully curated, small portfolio" positioning. Per `/resources/the-distinction-between-hamlet-ownership-and-timeshare`: "For &Hamlet owners, sharing the property is a curated experience, limited to a maximum of seven other owners, with a minimum of one. This deliberate exclusivity results in a significantly reduced number of individuals accessing the property…"

### &Hamlet referral / partnership program — formal rates

Per `/partnership` and `/resources/referral-program`:

- **Norway-property referrals**: 3% commission to the referring agent.
- **Spain-property referrals**: **5% commission** to the referring agent.
- **Coverage** (verbatim, `/resources/referral-program`): "For you as a real estate agent, we offer a finder's fee if you bring a buyer to us. You will receive a 5% referral commission of the client's purchase price from &Hamlet if your client ends up buying from &Hamlet."
- **Worldwide eligibility** (verbatim, `/partnership`): "After you introduce the buyer to &Hamlet, we take care of everything. You can refer from anywhere in the world."
- **Property-onboarding threshold** (per `/resources/referral-program`): "Our concept can be promoted to owners if the property has an expected market value above **EUR 700,000**, has a newer standard, and is located in attractive destinations, or by further agreement."

The 5% Spain referral commission is meaningful — it's higher than Pacaso's 3% and applies broadly. Strong incentive for Spanish luxury agents to refer to &Hamlet.

### &Hamlet — formal scheduling-system explainer (resource page)

`/resources/scheduling-system-and-dates` documents the scheduling logic in operator-authored long-form. v2 covered the scheduling parameters; v3 adds:

- **The 45-day baseline matches Norwegian-owner survey data** (verbatim): "In a national survey conducted by &Hamlet, holiday home owners in Norway reported using their second homes for an average of only 43 days per year. When you purchase a 1/8 ownership in an &Hamlet, you are guaranteed to use your property for at least 45 days per year — giving you the same number of days as the average use of a vacation home." — i.e. the 45-day figure is intentionally calibrated to typical Norwegian whole-home usage. Operationally framed as "you'd use your own home this much anyway."

### &Hamlet — sustainability research-backed positioning

Per `/resources/a-sustainable-future-with-multiple-owners`: &Hamlet commissioned (or hosts) Kristiania University College student research (Felix Rose & Tobias Alsos Aarø) on sharing-economy benefits in the cabin market, anchored on Kate Raworth's "Doughnut Economics" framework. v2 missed this. Worth flagging because:
- Pacaso has `/communities` (defensive against "second-home buyers hurt the community");
- &Hamlet has academic-research positioning that vacancy reduction is environmentally and economically positive.
- Both are reputational architecture — neither operator is purely transactional.

### &Hamlet — usage rate vs typical Norwegian cabin

Per `/partnership`: "Cabins in Norway sit empty on average for over 300 days a year and are therefore only used 10-15% of the time, while a &Hamlet is typically used **80-90%** of the time." Pacaso uses nearly identical 90% language for US homes (`/communities`). Same defensive narrative deployed in two countries.

### &Hamlet — formal insurance scope

Per `/faq`: "&Hamlet ensures that the building and interiors are at all times insured in a well recognized insurance company. The insurance payments are already included as part of the monthly homes expenses and distributed according to ownershare." — operator-procured property and contents insurance, pass-through pricing. v2 was silent on insurance specifics.

### &Hamlet — damage policy

Per `/faq`: "The holiday home is thoroughly cleaned and inspected between stays. Any direct damage related to the holiday home and interiors, or if items are missing, will be charged to the owner who was using the holiday home at the time." — owner who used the home pays for damage. Same as Pacaso's policy.

### &Hamlet — storage policy

Per `/faq`: "Each owner has their own lockable cabinet or small storage room for personal belongings. Personal belongings can not be stored in the rest of the home." Per the FAQ, external storage for large items (bikes, ski equipment) can be arranged by &Hamlet for an extra cost, including chain-oiling and tire-pumping (verbatim).

### &Hamlet — booking-window canonical figure

Per `/resources/scheduling-system-and-dates` (closes a v2 ambiguity): "The reservation system allows you to book a stay up to **two years in advance and as close as 48 hours before arrival.**" — booking window 48 hours to 24 months, with 2-day-to-30-day short-notice bonus stays not counting against the 45-day allocation.

### &Hamlet — purchase-onboarding deposit

Per `/faq`: "Upon purchase, a deposit equivalent to **6 months' worth of expenses** will be paid." — v2 had this but worth re-flagging; this is the buyer's working-capital contribution to the LLC at close.

### &Hamlet — no separate Italy or France legal-entity disclosure

`/resources/ownership-structure` documents Norway (direct land-registry registration, 2.5% document fee) and Spain (SL, 12–14% closing costs) **only**. France and Italy are not specifically documented as separate entity types on &Hamlet's site. **Q-Hamlet-2 from v2 remains open** — operator silent on French / Italian entity structures.

### &Hamlet — sales / resale marketing channels

Per `/partnership` and `/resources/referral-program`:

> "You can expect to see the property advertised on social media, digital advertising, YouTube, &Hamlet's platform, **Finn.no** [Norway's largest property portal], print advertising, and through our partners."

Marketing reach includes Finn.no (Norway's dominant property portal) — this is meaningful for Norwegian-sourced buyers but doesn't extend to Spain / France / Italy listings in the same way.

### &Hamlet — operator's Spain resale strategy

The `/partnership` page describes the resale-onboarding process explicitly: "The sales process is quite similar to selling 8 identical apartments in an apartment building." — i.e. each share is sold separately like an apartment in a building, not as a single transaction. Useful framing for agents and buyers.

---

## Abitaro — net-new findings beyond v2

### Sitemap analysis confirms Abitaro has effectively NO operational documentation

Abitaro's complete published sitemap is 3 URLs: `/`, `/sign-up/`, `/homepage/`. There is:

- **No FAQ page.**
- **No swap / exchange page or program disclosure.**
- **No financing page or terms.**
- **No scheduling-system page.**
- **No legal-structure page.**
- **No service-promise / management-scope page.**
- **No referral / partner page.**
- **No press / about-us / company page.**
- **No language support other than English.**

The entire offering is on the homepage. The homepage `<h2>` headings are: "Own a luxury Miami home, for a fraction of the price"; "The future of luxury real estate co-ownership"; "A curated Real Estate Portfolio"; 5 unit listings (Smart Brickell 305, 602, 1604, 2101, 2303); "How the Abitaro Program works" (3 steps: Choose Your Property / Become a Co-Owner / Flexible Usage & Hassle-Free Management); "Benefits of Abitaro."

### Abitaro — "exclusive rental program" but no operational details

Per homepage (verbatim): "Enjoy flexible usage, hassle-free property management, and the option to **rent out your share** when you're not using it — through Abitaro's exclusive rental program."

This is the entirety of the public information on the rental program. **No commission rate, no schedule, no operational mechanics, no contract terms.** v2's "10% guaranteed returns" language is NOT visible on the homepage at this v3 crawl — it appears Abitaro's rental marketing has softened from v2's findings.

### Abitaro — no home-swap / exchange program

Confirmed: no mention of swap, exchange, or network of homes anywhere on Abitaro's public site. The 5 listings are all in the same building (Smart Brickell), so there's effectively no portfolio to swap between.

### Abitaro — no owner-app or technology description

Smart Brickell has a building-level smart-home app per Habitat Group's site, but Abitaro itself does not document any owner-facing app, scheduling system, or booking platform. **Q-Abitaro-3 from v2 (days/year + scheduling) remains entirely open.**

### Abitaro — confirmed: 5 units, all in one building

The 5 units (305, 602, 1604, 2101, 2303) at 239 SW 9th St, Miami, FL 33130. All in the Smart Brickell development. v2 noted the same and v3 confirms — Abitaro's inventory has not expanded since v2's crawl. COP has 3 of these 5 in its catalog (305, 2101, 2303).

### Abitaro — entry-price confirmed lowest-of-five-partners

Unit 602 (Studio, 456 sq.ft.) — 1/8 share starts at **$74,000**. Lowest entry price across all 5 COP partners.

### Abitaro — no formal language / currency / international-buyer treatment

Abitaro's site is English-only, USD-only. **For COP's UK / European buyers, Abitaro has no international-buyer documentation.** All financing, tax, and operational concerns must be addressed via direct contact with the Abitaro / Habitat Group sales team.

---

## Cross-partner feature matrix (v3 additions)

### Matrix C — Home-swap / exchange program (the v2 miss)

| Partner | Program name | Network scope | Mechanics | Credit system | Mediation | Eligibility cost | Volume / usage |
|---|---|---|---|---|---|---|---|
| **Pacaso** | **Swap** + **Infinity** (Q1 2026 launch for whole-home tier) | All Pacaso homes worldwide (6 countries: US, Mexico, France, UK, Italy, Spain) + vetted whole homes via Infinity (Mexico City, St. Barts, Napa, NYC, Tuscany, more) | 1:1 stay-for-stay swap (any dates, asymmetric allowed) OR Swap Credits (auto-generated for high-value stays). Share-value threshold: can swap up to $300k above your share price. Confirmed swaps cannot be modified or cancelled. | Yes — auto-generated by AI scoring model; instantly redeemable; share-value thresholds apply | Self-serve in Pacaso app | Free; cleaning fees and damages charged to swap user | Not stated; volume implied to be material from Austin Allison's `/from-the-ceo` framing |
| **MYNE Homes** | **MYNE exchange programme** | All MYNE homes across 9 European countries | 1:1 stay swap; bedroom-count + feature filter; same-season-period parity | None — no credit system; pure 1:1 stay matching | Concierge-mediated by MYNE Owner Service team | Not stated; implied free | Not stated |
| **Vivla** | **Keys** (2026 rebrand of legacy exchange) + first-12-month fraction exchange | All Vivla homes across 10+ Spanish destinations | List a week → earn Keys; spend Keys on other-home stays. 1:1 matching also possible when two owners list same week. First-year buyers can exchange entire fraction (not just a week) into a different Vivla home | Yes — **Keys, 24-month expiry, one-time 12-month extension; not transferable; no monetary value** | Self-serve in Vivla app; Guest Experience Manager confirms 1:1 stay matches | Free | Not stated; described as "personal travel bank" |
| **&Hamlet** | **No swap or exchange program** | N/A | N/A | N/A | N/A | N/A | N/A |
| **Abitaro** | **No swap or exchange program** | N/A (5 units, same building) | N/A | N/A | N/A | N/A | N/A |

### Matrix D — Owner app and digital platform

| Partner | App name | Scheduling | Swap interface | Rental management | Storage tracking | Other features | AI / automation |
|---|---|---|---|---|---|---|---|
| **Pacaso** | **Pacaso app**, powered by **SmartStay™** | Yes — Book tab | Yes — Swap tab (separate) | Not in-app (rentals prohibited) | Per-home storage assigned at acquisition | Eva Digital Concierge chat widget on website; AI-generated CEO avatar for owner-update videos | AI listing curation (IDX); AI swap-scoring model; AI-generated CEO avatar |
| **MYNE Homes** | **MYNE Co-Owner App** | Yes — 2 days to 2 years in advance | Concierge-mediated, request via app | Operator-provided rental service (separate from app for guests) | Personal items stored on-site per home | Concierge add-ons (airport pickup, grocery, fridge stock) bookable via app; WhatsApp/phone/email 24/7 | Not stated |
| **Vivla** | **Vivla app** | Yes — 2 rounds + exchange window + rental | Yes — Keys wallet visible in app; Key cost shown per stay | Owners check available weeks via app; rental income credited to fee account | Storage spaces per home (e.g. ski storage Baqueira) | Owner community/events; recommendations from other owners | AirDNA + Hostaway for dynamic rental pricing |
| **&Hamlet** | **&Hamlet app** | Yes — 48 hours to 24 months | No (no swap program) | Not in-app (rentals prohibited) | Per-home lockable cabinet / small storage room | App-managed reservations only | Not stated |
| **Abitaro** | Not documented | Not documented | N/A | Not documented | Not documented | Building-level Smart Brickell smart-home app (HVAC, lighting) — different system | Not documented |

### Matrix E — Loyalty / multi-share / referral programs

| Partner | Multi-share loyalty tier | Buyer referral reward | Existing-owner referral | Agent referral commission | Multi-property holders |
|---|---|---|---|---|---|
| **Pacaso** | **Pacaso Collector** — auto-enroll if you own > 1/8 (either a 1/4 in one home or multi-1/8 across homes); first-12-month operating-expense credit at closing; resale Pacasos qualify too | Same — referred buyers and the referrer each get 3 months of operating-expense credit if purchase within 1 year of referral | Same as buyer referral | **3%** on share price; international and out-of-market eligible | Implicitly the "Collector" identity — Pacaso markets buying multiple Pacasos as a portfolio strategy |
| **MYNE Homes** | Not formally documented; portfolio language ("build up your own portfolio of shares") but no named tier | Not documented | Not documented | Not documented | Marketed as a behavior ("more and more Co-Owners are choosing to build up their own portfolio") but no formal program |
| **Vivla** | Up to 4 shares per house (50% cap) per owner; not a loyalty tier per se | Not documented | Not documented | Yes — partner program for agents worldwide; rate not publicly stated (but `/partners` framework exists) | Not documented |
| **&Hamlet** | Up to 4 shares per house (1/2 cap) — stay length scales with shares owned (1 share = 2 weeks max; 2 shares = 3 weeks; 3 shares = 4 weeks; 4 shares = 5 weeks) | Not documented | Not documented | **Norway 3% / Spain 5%** on share price (worldwide referrals); minimum-property-value threshold for referred sellers: €700,000 | Stay-length tier increases with shares owned |
| **Abitaro** | Not documented | Not documented | Not documented | Not documented | Not documented |

### Matrix F — Currency and language support

| Partner | Currencies accepted | Languages supported | Geographic markets |
|---|---|---|---|
| **Pacaso** | USD primarily; **crypto** (BTC, ETH, LTC, BCH, DOGE, WBTC + 5 stablecoins) via BitPay for non-financed portion; EUR / GBP for European properties (operationally; not detailed publicly) | English only on `.com` | US (161), Mexico (12), France (7), UK (6), Italy (3), Spain (1) |
| **MYNE Homes** | EUR primarily; conventional bank financing in local currency; "Buy now, pay later" MYNE-internal financing | **English, German, Swedish, Dutch** (4 languages) | Spain (41), Italy (18), Germany (11), Austria (10), France (9), Portugal (4), Croatia (3), Sweden (2), UK (1) |
| **Vivla** | EUR; **100% financing via Andbank Lombard product** (portfolio-collateralized); also implied access to standard Spanish mortgage market (BBVA in partner network) | **English, Spanish** (Weglot toggle) | Spain only (34 in COP, 10+ destinations marketed) |
| **&Hamlet** | EUR for Spain/France/Italy properties; NOK for Norway; **dual NOK/USD currency toggle on the site UI** | **English, Norwegian** (`/no/`); Danish (`/dk/`) blocked in robots, suggesting Denmark is a planned market | Norway (not on COP), Spain (8), France (2-3), Italy (1) |
| **Abitaro** | **USD only** (no other currency documented) | **English only** | US (3) — Brickell, Miami |

### Matrix G — Booking flexibility (consolidated)

| Partner | Advance booking window | Short-notice window | Min stay | Max consecutive stay | Spacing rule | Special-date allocation |
|---|---|---|---|---|---|---|
| **Pacaso** | 8 days to 24 months in advance (24 months = 2 years) | 2–30 days US; 2–60 days Europe (2–7 days if home has unsold shares) | 2 nights | **No cap on consecutive nights** (use all 6 advance stays back-to-back) | 7-night gap between stays (1-night exception for swap-prep) | 1 special-date stay per share; 3-night minimum |
| **MYNE Homes** | 2 days to 2 years | Implicit in 2-day window | Not stated | Not stated | "Transparent reservation rules" with owner-compatibility matching | Not stated |
| **Vivla** | Annual calendar opens in September for following year; 2-round selection | After Round 2 + exchange window closes, remaining weeks rentable | Variable (week-based; ski-stay 5 days) | Multi-week stays bundled | Same-season parity within exchange | Disadvantage-rotation across years |
| **&Hamlet** | 48 hours to 24 months | 2–30 days (these don't count toward 45-day cap) | 2 nights | 2 weeks per share (1 share = 2 weeks; up to 5 weeks for 4 shares) | Equivalent days between two reservations + the first stay | 1 reservation per popular holiday + 3 reservations during peak season |
| **Abitaro** | Not documented | Not documented | Not documented | Not documented | Not documented | Not documented |

### Matrix H — Insurance, restrictions, and operator-level policies

| Partner | Property insurance | Pets | Smoking | Events/parties | Quiet hours | Sub-letting | Min owner age |
|---|---|---|---|---|---|---|---|
| **Pacaso** | Pass-through to LLC, included in operating estimate | Up to 2 dogs per home (with some restrictions) | Not specifically documented | "Prohibits owners from hosting events that would be disruptive to the neighborhood" | **9 p.m.–7 a.m. quiet hours** | Rentals prohibited (sub-letting prohibited) | 18+ (per Owner Experience Terms) |
| **MYNE Homes** | Pass-through, included in 3-bucket fee structure | Not documented | Not documented | Not documented | Not documented | Permitted (owner can rent or let friends/family use days) | Not documented |
| **Vivla** | Pass-through; **operator-procured liability insurance for rental program** specifically | Not documented | Not documented | Not documented | Not documented | Permitted (operator runs the rental program) | Not documented |
| **&Hamlet** | Pass-through; "well recognized insurance company"; payments included in monthly | Not documented | Not documented | Not documented | Not documented | **Prohibited** (rentals prohibited; friends/family use allowed) | Not documented |
| **Abitaro** | Not documented | Not documented | Not documented | Not documented | Not documented | Not documented (operator markets rental as feature) | Not documented |

### Matrix I — Satisfaction guarantees and exit flexibility (within initial 12 months)

| Partner | First-year satisfaction guarantee | Mechanic | Operator absorbs transaction costs | Standard hold period before resale |
|---|---|---|---|---|
| **Pacaso** | None documented | N/A | N/A | 12 months from purchase if home has unsold shares; immediate if fully sold |
| **MYNE Homes** | **Yes** — within first 12 months, exchange share into any MYNE home of equal or greater value | Buyer pays only difference in share prices | **Yes** — MYNE absorbs all transaction costs | After 12 months, sell at any time |
| **Vivla** | **Yes** — within first 12 months, exchange fraction for any other available Vivla fraction | Buyer pays/receives difference; lower-value yields a maintenance credit | Implied yes (not explicitly stated) | Three liquidity windows: 12-month exchange / open-market resale / 10-year liquidation |
| **&Hamlet** | None documented | N/A | N/A | No formal hold period documented; "Every co-owner can sell their owner share(s) whenever they want" |
| **Abitaro** | Not documented | N/A | N/A | Not documented |

### Matrix J — Cooling-off period and deposit refundability

| Partner | Formal cooling-off period | Reservation deposit refundability | Specifics |
|---|---|---|---|
| **Pacaso** | None advertised (real estate transaction, not consumer good) | **$5,000 reservation deposit is refundable** on third-party-listing homes until Pacaso is under contract on the home. **$10,000 deposit becomes non-refundable** (unless Pacaso doesn't proceed due to inspection failure) | For Available Now homes, standard real-estate purchase process applies |
| **MYNE Homes** | Not documented (likely defers to EU national consumer law) | Not documented | Implicit via standard German/Spanish/Austrian property purchase |
| **Vivla** | Not documented | "You will be able to reserve your fraction by making a deposit, if the purchase does not go through it will be returned to you and if it goes ahead it will be discounted from the total amount" — reservation deposit is fully refundable up to notarial signing | Spanish-law standard applies post-signing |
| **&Hamlet** | Not documented | Not documented; 6-month operating-expense deposit at purchase (working capital, not refundable in the cooling-off sense) | |
| **Abitaro** | **Florida Condominium Act §718.503**: statutory 3-day right to void condo purchase contracts after receipt of condominium documents | Not documented | Florida-law statutory protection, not an Abitaro-specific buyer right |

### Matrix K — Termination scenarios (if the operator fails)

| Partner | Documented continuity plan | Asset access if operator winds down |
|---|---|---|
| **Pacaso** | Owners can vote to remove Pacaso as program manager and self-manage the home (per `/faq/owner`) | LLC continues; new manager appointed by owner vote |
| **MYNE Homes** | Not explicitly documented | Property held in GmbH & Co. KG; owners remain shareholders of the KG |
| **Vivla** | **Most explicitly documented:** "When we sell the house we become only the administrator of the property, so it would be a change of administrator. You can also do it if you do not like our management. In case of disappearance, Vivla commits itself to transfer the list of local suppliers… and to transfer the use of its application for life and free of charge." (`/faqs/legal`); also reinforced on `/legal-structure`: "Owners can vote to dissolve the company or simply appoint a new administrator. VIVLA provides a perpetual license for the reservation technology, ensuring you can continue managing the property even without us." | New administrator + perpetual app license |
| **&Hamlet** | Not explicitly documented | Implied via SL / land-registry structure |
| **Abitaro** | Not documented | Not documented |

### Matrix L — Tax / accounting support

| Partner | Year-end tax document | Operator-arranged tax filings | Partner advisors |
|---|---|---|---|
| **Pacaso** | "K-1 tax forms" provided to owners; Pacaso "handles property tax payments" (per `/faq/buyer`) | US-side: yes via LLC | Local tax counsel per market |
| **MYNE Homes** | Yes — "At the end of each year, you will receive a detailed document that you can pass on to your tax advisor" (`/faq`) | "MYNE handles the general tax management of the property, including regional taxation of income from letting and leasing in the respective countries" | KPMG, Dentons, Cuatrecasas |
| **Vivla** | Yes — included in SL bookkeeping (Inés Cortijo, ex-EY Auditor, manages financial operations) | Yes — bookkeeping at the SL level | Garrigues (legal); Savills (valuation) |
| **&Hamlet** | "We handle all accounting in the co-ownership, arrange for electricity and internet providers, payment of municipal fees" (`/resources/exclusive-co-ownership-hamlets-management-role`); year-end reconciliation explicit | Yes at the SL / company level | Not named publicly |
| **Abitaro** | Not documented | Not documented | Not documented |

---

## Updates / corrections to v2

1. **Vivla annual fees: 1.5%–2% is the canonical figure.** v2 reported BOTH "2%–2.5%" (how-it-works) and "3.5%–4%" (FAQs) and flagged uncertainty. v3 finds the current canonical figure across multiple Vivla pages (`/faqs/buyers`, `/faqs/booking`, `/andbank`, `/partners`) is **1.5%–2%**. The older 3.5–4% language has been removed. **Closes Q-Vivla-1.**

2. **Pacaso max consecutive stay: there is no cap.** v2 listed this as Q-Pacaso-5 ("max consecutive stay length under SmartStay"). v3 finds (`/faq/scheduling`): "if dates are available, owners can use all six of their stays consecutively, with **no set cap on total nights**." **Closes Q-Pacaso-5.**

3. **Pacaso agent referral commission is 3%.** v2 did not have this rate. v3 confirms via `/faq/agent`.

4. **Pacaso has a formal Collector loyalty program** (multi-share owners). v2 missed it entirely.

5. **Pacaso Infinity launched February 2026** — a new invitation-only whole-home exchange tier. v2 missed it (Infinity was announced after v2 was compiled).

6. **MYNE supports 4 languages, not 2.** v2 implied German + English; v3 confirms German, English, Swedish, Dutch via sitemap inspection.

7. **MYNE €99/month service fee** is verbatim — matches &Hamlet's NOK 1,000 / €99 figure. v2 noted MYNE doesn't publish a fee figure; v3 finds it does, in `/blog/hassle-free-ownership`.

8. **MYNE has an explicit 12-month satisfaction guarantee** allowing exchange into another MYNE home with operator-paid transaction costs. v2 mentioned the guarantee as a placeholder; v3 documents the full mechanic.

9. **Andbank holds 3% of Vivla's equity** (via ACTYUS FINTECH I FIL). v2 documented Andbank as a financing partner only; v3 finds Andbank is also an equity investor. Material for any "financing partner" claim downstream.

10. **&Hamlet has NO swap program.** v2 was silent; v3 confirms this is operationally significant — &Hamlet is the only COP partner with no inter-home exchange of any kind. Consistent with &Hamlet's "exclusive single-home" positioning.

11. **&Hamlet agent commission: 3% Norway / 5% Spain.** v2 missed this rate split; v3 documents it via `/partnership` and `/resources/referral-program`.

12. **Pacaso accepts more cryptocurrencies than v2 captured** — full list: BTC, ETH, LTC, BCH, DOGE, WBTC + GUSD, USDC, USDP, DAI, BUSD (ERC20 stablecoins only).

13. **Pacaso uses an AI-generated avatar of CEO Austin Allison** for owner-facing video communications. Disclosed at the bottom of `/from-the-ceo`. Operationally novel; worth noting in any technology comparison.

14. **Pacaso curates listings via AI** from MLS/IDX feeds based on buyer-demand criteria. The "third-party / Prospect listing" model is a meaningful evolution from v1's "Pacaso buys homes outright."

15. **Vivla has 3 distinct liquidity windows**, not 1: (i) first 12 months exchange; (ii) after 12 months open-market sale; (iii) after 10 years liquidation. The 10-year window is operationally meaningful and worth Vivla confirmation.

---

## Open questions for David (v3-specific)

Numbered list of new claims needing David's confirmation. Shorter than v2's 28 because v3 focused on net-new findings; many v2 questions remain open but are not duplicated here.

1. **Pacaso Swap — share-value-threshold reciprocity.** When a higher-share owner initiates a swap with a lower-share owner whose value sits below the threshold, the lower-share owner gets an "[i]ndependent confirmation" notification. What's the exact UX and what does the lower-share owner get in exchange? Is the imbalance compensated with credits?

2. **Pacaso Infinity — invitation criteria and any per-membership fee.** Robb Report referred to "the $100K key" but Pacaso's own `/faq/infinity` doesn't state a fee. Is there a one-time / annual Infinity-network fee for participating whole-home owners?

3. **Pacaso Infinity — opt-out fully impossible for Pacaso co-owners?** Per `/faq/infinity`: "there is not an option to vote to remove Infinity homes from the Swap platform for your home as these homes are Pacasos." Confirm: does that mean a Pacaso ownership group can opt out of being swappable with other Pacasos, but cannot specifically opt out of Infinity exposure?

4. **Pacaso Collector — does the 12-month operating-expense credit apply to a Collector's first share or every share they buy?** Per `/pacaso-collector`: "When you purchase a Pacaso, you'll receive a credit at closing that covers the first 12 months of estimated Operating Expenses." Confirm whether this is a one-time credit per purchase or capped per Collector.

5. **MYNE rental commission split — operator percentage retained?** Q-MYNE-3 remains open; v3 did not surface a figure.

6. **MYNE exchange programme — does it have a per-swap fee?** Not stated on MYNE's site. Confirm.

7. **MYNE — "Buy now, pay later" payment plan terms?** Q-MYNE-4 from v2 remains open: interest rate, eligibility for non-DACH residents, maximum financing amount.

8. **Vivla Keys — how are Keys awarded?** The `/faqs/exchange-2026` page implies you earn Keys by listing weeks for exchange, but doesn't quantify (e.g. listing 1 low-season week = how many Keys?). What's the conversion rate?

9. **Vivla — 10-year liquidation window.** Per `/faqs/legal`: "after 10 years you can liquidate your fraction if you wish." Is this a forced-liquidation provision in the SL bylaws (i.e. all SL co-owners can vote to dissolve after 10 years), or simply a "yes you can still sell after 10 years" reaffirmation? Need clarity.

10. **Vivla rental commission — 15% (per `/faqs/renting`) or 0% (per `/andbank`)?** Two different operator pages give contradictory rates. Confirm.

11. **Vivla — Andbank's 3% equity stake.** Does Andbank's equity stake create any preferential terms for Andbank's private-banking clients (e.g. reduced Lombard rates, preferential property access)? Per `/andbank` it appears to function as a dedicated landing page for Andbank's wealth-management referrals; confirm the structural relationship.

12. **&Hamlet — no swap program is intentional?** Confirm with &Hamlet team: is the absence of inter-home swap a deliberate positioning ("you get YOUR &Hamlet only") or simply not-yet-built?

13. **&Hamlet — Italy / France entity types?** Q-Hamlet-2 from v2 still open: the `/resources/ownership-structure` page documents Norway (direct land-registry) and Spain (SL) only.

14. **&Hamlet — resale commission percentage.** Q-Hamlet-3 from v2 still open. The FAQ says "there will be a commission fee" but doesn't state %.

15. **&Hamlet — 5% Spain agent referral applies only to referrals from outside agents, not when an &Hamlet owner refers a friend?** Confirm whether owner referrals get a different / lower / no rate.

16. **Pacaso — does the "Buyers make a small non-refundable contribution to the reserve account" on resale (`/faq/resale`) have a published % or fixed amount?** v3 did not surface a figure.

17. **All partners — cooling-off period.** Other than Abitaro's Florida statutory 3-day right, no partner publishes a buyer-protection cooling-off window. Confirm whether each operator offers any unpublished standard rescission period (within 14 days of signing, etc.).

18. **Abitaro — given the absence of documented operational specs, is there a private buyer brochure / FAQ that covers the same topics other partners publish openly?** If so, can COP buyers access it pre-deposit?

---

## Sources

### Pacaso (sitemap-driven crawl, 2026-05-27)
- Sitemap index: https://www.pacaso.com/xmlsitemap-index.xml (9 sub-sitemaps)
- Pages sitemap (153 URLs): https://www.pacaso.com/xmlsitemap/pages/sitemap/1.xml
- robots.txt: https://www.pacaso.com/robots.txt

**Visited URLs:**
- https://www.pacaso.com/swap
- https://www.pacaso.com/faq/swap
- https://www.pacaso.com/swap-collections
- https://www.pacaso.com/swap-connections
- https://www.pacaso.com/owner-swap-resources
- https://www.pacaso.com/faq/infinity
- https://www.pacaso.com/faq/scheduling
- https://www.pacaso.com/scheduling
- https://www.pacaso.com/faq/owner
- https://www.pacaso.com/faq/buyer
- https://www.pacaso.com/faq/financing
- https://www.pacaso.com/faq/resale
- https://www.pacaso.com/faq/seller
- https://www.pacaso.com/faq/agent
- https://www.pacaso.com/faq/property-management
- https://www.pacaso.com/faq/listings
- https://www.pacaso.com/faq/neighbor
- https://www.pacaso.com/financing
- https://www.pacaso.com/financing-offers
- https://www.pacaso.com/service-promise
- https://www.pacaso.com/owner-experience-terms
- https://www.pacaso.com/referral-program
- https://www.pacaso.com/owner-referral
- https://www.pacaso.com/pacaso-collector
- https://www.pacaso.com/collector-first-look
- https://www.pacaso.com/communities
- https://www.pacaso.com/design-certified-homes
- https://www.pacaso.com/quarterly-collections
- https://www.pacaso.com/2025-co-ownership-index-report
- https://www.pacaso.com/from-the-ceo
- https://www.pacaso.com/intl-ownership
- https://press.pacaso.com/news (press centre index)
- https://press.pacaso.com/2026-02-03-Pacaso-Introduces-Infinity (Infinity launch press release)

### MYNE Homes (sitemap-driven crawl, 2026-05-27)
- Sitemap: https://www.myne-homes.com/sitemap.xml (1,955 URLs, 4 languages)
- robots.txt: https://www.myne-homes.com/robots.txt

**Visited URLs:**
- https://www.myne-homes.com/how-myne-works
- https://www.myne-homes.com/faq
- https://www.myne-homes.com/about-us
- https://www.myne-homes.com/concept/11-reasons
- https://www.myne-homes.com/concept/desired-times
- https://www.myne-homes.com/concept/resources
- https://www.myne-homes.com/press
- https://www.myne-homes.com/blog/the-MYNE-service-promise
- https://www.myne-homes.com/blog/Managed-Co-Ownership
- https://www.myne-homes.com/blog/hassle-free-ownership
- https://www.myne-homes.com/blog/how-to-finance-co-ownership
- https://www.myne-homes.com/blog/different-models-of-ownership
- https://www.myne-homes.com/blog/the-alternative-to-traditional-vacation-property-financing
- https://www.myne-homes.com/blog/become-a-co-owner
- https://www.myne-homes.com/blog/With-co-ownership-to-a-return-on-investment
- https://www.myne-homes.com/blog/the-first-holiday
- https://www.myne-homes.com/listings/sellin-garten-modern-garden-apartment-sea-view-sauna-pool (listing sample)

### Vivla (sitemap-driven crawl, 2026-05-27)
- Sitemap: https://www.vivla.com/sitemap.xml (204 URLs)
- robots.txt: https://www.vivla.com/robots.txt

**Visited URLs:**
- https://www.vivla.com/how-it-works
- https://www.vivla.com/why-vivla
- https://www.vivla.com/legal-structure
- https://www.vivla.com/ownership-booking-model
- https://www.vivla.com/resale-liquidity-guide
- https://www.vivla.com/cost-investment-comparison
- https://www.vivla.com/vivla-studio
- https://www.vivla.com/vivla-community
- https://www.vivla.com/andbank
- https://www.vivla.com/partners
- https://www.vivla.com/owners
- https://www.vivla.com/about-us
- https://www.vivla.com/new-destinations
- https://www.vivla.com/press
- https://www.vivla.com/music
- https://www.vivla.com/faqs/buyers
- https://www.vivla.com/faqs/booking
- https://www.vivla.com/faqs/homes
- https://www.vivla.com/faqs/renting
- https://www.vivla.com/faqs/legal
- https://www.vivla.com/faqs/exchange
- https://www.vivla.com/faqs/exchange-2026

### &Hamlet (sitemap-driven crawl, 2026-05-27)
- Sitemap: https://www.andhamlet.com/sitemap.xml (131 URLs)
- robots.txt: https://www.andhamlet.com/robots.txt

**Visited URLs:**
- https://www.andhamlet.com/how-it-works
- https://www.andhamlet.com/faq
- https://www.andhamlet.com/our-story
- https://www.andhamlet.com/homes
- https://www.andhamlet.com/partnership
- https://www.andhamlet.com/resources
- https://www.andhamlet.com/resources/scheduling-system-and-dates
- https://www.andhamlet.com/resources/referral-program
- https://www.andhamlet.com/resources/exclusive-co-ownership-hamlets-management-role
- https://www.andhamlet.com/resources/the-distinction-between-hamlet-ownership-and-timeshare
- https://www.andhamlet.com/resources/a-sustainable-future-with-multiple-owners
- https://www.andhamlet.com/resources/ownership-structure
- https://www.andhamlet.com/resources/an-overview-of-your-ownership-costs
- https://www.andhamlet.com/resources/partial-sale
- https://www.andhamlet.com/terms-of-service

### Abitaro (sitemap-driven crawl, 2026-05-27)
- Sitemap: https://ownabitaro.com/sitemap_index.xml → https://ownabitaro.com/page-sitemap.xml (3 URLs total)
- robots.txt: https://ownabitaro.com/robots.txt

**Visited URLs:**
- https://ownabitaro.com/ (homepage — the entirety of Abitaro's published operational content)
- https://ownabitaro.com/sign-up/
- https://ownabitaro.com/homepage/

---

End of v3.
