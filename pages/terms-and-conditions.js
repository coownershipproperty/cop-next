import LegalPage from '@/components/LegalPage';

const sections = [
  { id: 'scope', title: 'About COP and these terms', content: <>
    <p>Co-Ownership Property (COP, “we”, “us”) provides property information and helps prospective buyers discover co-ownership opportunities and connect with the relevant property professionals. These terms cover use of co-ownership-property.com and its enquiry tools.</p>
    <p>They are not a reservation, purchase, ownership or property-management agreement. Any such arrangement requires separate documentation with the relevant parties. Sending an enquiry or unlocking a gallery does not commit you to buy a share.</p>
    <p>Contact Premproperty at <a href="mailto:info@co-ownership-property.com">info@co-ownership-property.com</a> with questions about the website or these terms.</p>
  </> },
  { id: 'ownership', title: 'Understanding co-ownership', content: <>
    <p>Co-ownership means an ownership interest in a property, held directly or through a property-owning entity such as an LLC or local equivalent. The precise structure depends on the property and jurisdiction. It should not be confused with a holiday points scheme or a contractual right to use accommodation.</p>
    <p>The share offered, title structure, annual use, booking arrangements, running costs, management, rental permissions and exit rights must be checked in the documents for the particular home. References to a one-eighth share or around 45 days a year are examples, not universal entitlements.</p>
    <p>Resale, gifting and inheritance can be subject to local law, taxes, fees, eligibility requirements and the co-ownership agreement, including approval or pre-emption rights. There is no universal transfer cost or guaranteed resale period.</p>
  </> },
  { id: 'listings', title: 'Listings, prices and illustrations', content: <>
    <p>Listings are invitations to enquire, not binding offers. Prices, availability and property details can change. Confirm current information and obtain the relevant documents before paying money or entering an agreement.</p>
    <p>A displayed price generally relates to the stated share, not the whole property, unless expressly described otherwise. Check the original currency and whether taxes, legal and notarial costs, registration, financing, management charges, reserves and other fees are included. Currency conversions are indicative and are not a quoted exchange rate.</p>
    <p>Areas, distances, maps, annual-use figures and running-cost illustrations are approximate unless confirmed otherwise. Photographs, renderings, staging, proposed finishes and floor plans may be illustrative and may not show the final specification or current condition. Confirm what is included in the purchase.</p>
    <p>Let us know if you spot an error so we can investigate and correct it.</p>
  </> },
  { id: 'advice', title: 'Independent advice and due diligence', content: <>
    <p>Our listings, articles, guides and calculators provide general information. They are not personalised legal, tax, financial or investment advice. Obtain independent professional advice appropriate to the property, ownership structure and your circumstances before purchasing.</p>
    <p>Calculator results and examples depend on their assumptions. They do not guarantee finance, eligibility, tax treatment, rental income, capital appreciation or a future sale price. Ownership involves ongoing expenses and the risk of loss; selling a share can take time.</p>
  </> },
  { id: 'partners', title: 'Introductions and third parties', content: <>
    <p>Property sellers, operators, managers, lenders and advisers are responsible for the services and contractual obligations they undertake. An introduction does not itself make COP a party to their agreement or authorise us to commit them to a sale or service.</p>
    <p>Ask us about our role and any applicable fees or referral arrangements for a particular introduction before proceeding. Any service for which we charge you must be explained and agreed separately.</p>
    <p>Third-party links and embedded services are provided for convenience. Review the relevant provider’s terms and privacy information. A link alone is not a guarantee of that provider’s content or performance.</p>
  </> },
  { id: 'use', title: 'Using the website and contacting us', content: <>
    <p>Use the website lawfully. Do not interfere with its operation, introduce malicious software, attempt unauthorised access, misuse enquiry forms or use personal information obtained through the site for unsolicited contact.</p>
    <p>Please provide accurate contact details and submit only information you are entitled to share. Do not include unnecessary sensitive information in general forms. Personal information is handled as explained in our <a href="/privacy-policy/">Privacy Policy</a>; sending an enquiry does not make your correspondence public.</p>
    <p>We may restrict abusive or unlawful use and temporarily suspend features for maintenance or security. We do not promise uninterrupted availability.</p>
  </> },
  { id: 'content', title: 'Website content and intellectual property', content: <>
    <p>Website text, branding, layouts and media belong to COP or their respective owners and are used subject to applicable rights. You may view, save and print pages for your personal property research.</p>
    <p>Unless permitted by law or the rights holder, do not republish content, commercially exploit images or branding, or systematically extract and redistribute listings. These restrictions do not remove exceptions or rights provided by applicable law.</p>
  </> },
  { id: 'liability', title: 'Responsibility and your statutory rights', content: <>
    <p>We take reasonable care in presenting the website, but information can contain errors or become outdated. You should verify material details before relying on them in a property transaction.</p>
    <p>To the extent permitted by applicable law, we are not responsible for losses caused by events beyond our reasonable control or for the independent acts of third-party providers. This does not exclude responsibility that the law places on us for our own conduct.</p>
    <p>Nothing in these terms excludes or limits liability for fraud, fraudulent misrepresentation, death or personal injury caused by negligence, or any liability that cannot lawfully be excluded or limited. Your mandatory consumer rights remain unaffected.</p>
  </> },
  { id: 'law', title: 'Governing law and complaints', content: <>
    <p>These website terms are governed by Spanish law. If you are a consumer, this choice does not deprive you of mandatory protections afforded by the law that would otherwise apply, including the law of your country of habitual residence where applicable.</p>
    <p>Disputes may be brought before the courts competent under applicable law. Nothing in these terms removes a consumer’s right to bring proceedings in their home jurisdiction where the law provides that right.</p>
    <p>If something goes wrong, please contact <a href="mailto:info@co-ownership-property.com">info@co-ownership-property.com</a> with the relevant page or property and a description of the issue. Contacting us does not restrict your right to use a regulator, competent dispute-resolution body or court.</p>
  </> },
  { id: 'changes', title: 'Changes to these terms', content: <>
    <p>We may update these website terms to reflect changes to the service or applicable law. The revision date appears above. Changes do not retrospectively alter a separate signed agreement or remove accrued rights. Where notice or agreement is legally required, posting an update alone is not sufficient.</p>
    <p>If a provision is unenforceable, the remaining provisions continue to apply to the extent permitted by law.</p>
  </> },
];

export default function TermsAndConditions() {
  return <LegalPage title="Terms & Conditions" description="The terms for browsing Co-Ownership Property, using our enquiry tools and exploring property opportunities." path="/terms-and-conditions/" sections={sections} />;
}
