import LegalPage from '@/components/LegalPage';

const email = <a href="mailto:info@co-ownership-property.com">info@co-ownership-property.com</a>;
const sections = [
  { id: 'about', title: 'About this policy', content: <>
    <p>This policy explains how Co-Ownership Property (COP, “we”, “us”) handles personal information in connection with this website, property enquiries and related communications. For privacy questions or requests, contact Premproperty at {email}.</p>
    <p>It covers our property discovery and introduction services. Property sellers, co-ownership operators and other businesses you deal with may have their own privacy notices and responsibilities.</p>
  </> },
  { id: 'information', title: 'Information we handle', content: <>
    <ul>
      <li><strong>Information you provide:</strong> your name, email address, telephone number, messages, preferred language, budget, destinations, properties of interest, buying timeframe and viewing or information requests.</li>
      <li><strong>Your interactions:</strong> enquiries, gallery requests, newsletter subscriptions, saved searches, property alerts, correspondence and records of our follow-up with you.</li>
      <li><strong>Technical and usage information:</strong> IP address, device and browser information, pages visited, referral and campaign information, approximate location and security logs. These details may be personal data; they are not necessarily anonymous.</li>
      <li><strong>Email activity:</strong> delivery, bounce and unsubscribe records. Some emails include a tracking pixel or tracked links that can report opens or clicks; these signals are not always accurate.</li>
      <li><strong>Information from partners:</strong> updates about an introduction, viewing or property enquiry. We may also infer a likely country or language from contact details and approximate location to help route an enquiry; you can ask us to correct this.</li>
    </ul>
    <p>Required form fields are marked. Without the details needed to respond or provide a requested service, we may be unable to do so. Please do not send identity documents, bank details or sensitive personal information through general enquiry forms.</p>
  </> },
  { id: 'purposes', title: 'Why we use information', content: <>
    <p>Our purposes include responding to questions, supplying requested property material, arranging introductions or viewings, providing requested alerts, maintaining enquiry records, securing the website and understanding which content is useful.</p>
    <p>The appropriate legal basis depends on the activity: steps you request before entering a contract or performance of a service agreement; legitimate interests in handling enquiries, maintaining relevant records and preventing abuse, balanced against your rights; compliance with legal obligations; or consent where required, including for optional tracking and electronic marketing.</p>
    <p>A property enquiry is not, by itself, consent to unrelated marketing. You can unsubscribe from promotional emails using the link in the email or by contacting us. Withdrawing consent does not affect processing that was lawful before withdrawal. Requested service messages, such as a reply to an enquiry, are distinct from promotional subscriptions.</p>
  </> },
  { id: 'sharing', title: 'Sharing and service providers', content: <>
    <p>To handle a property enquiry or introduction, relevant contact details and requirements may be shared with the seller, co-ownership operator, local representative or professional involved. Ask us if you would like to know who will receive your information. Those businesses may act as independent controllers for their own services.</p>
    <p>We also use providers for hosting, databases, email delivery, communications, analytics and advertising. The website currently integrates services from Vercel, Supabase, Resend, Google and Meta. Staff and authorised service providers may handle information needed for their work. We may disclose information where required by law or necessary to establish, exercise or defend legal claims.</p>
    <p>Our service is property discovery and introductions, not the sale of contact lists. Sharing information to fulfil an enquiry is different from disclosing it for another business’s independent marketing.</p>
  </> },
  { id: 'cookies', title: 'Cookies, browser storage and tracking', content: <>
    <p>The website uses cookies and similar technologies, including local and session storage. These can remember saved properties, gallery access, previously entered contact details, preferences and dismissed messages. Locally saved information can remain until you clear the site’s browser data; session storage normally ends when the tab or browser session closes.</p>
    <p>Google Analytics, Google Ads and Meta Pixel are integrated for audience measurement, advertising and conversion reporting. Vercel Analytics measures website usage. Campaign and referral details can also be associated with an enquiry. Embedded maps and third-party media may send technical information to their providers.</p>
    <p>Non-essential cookies and similar tracking require prior consent where applicable. Merely browsing the site or reading this policy does not give that consent. Browser settings let you block cookies and clear stored site data, although some convenience features may stop working. Browser controls do not replace a website’s obligation to obtain consent where required.</p>
    <p>For provider information, see <a href="https://policies.google.com/privacy">Google’s privacy policy</a>, <a href="https://www.facebook.com/privacy/policy/">Meta’s privacy policy</a> and <a href="https://vercel.com/docs/analytics/privacy-policy">Vercel Analytics privacy information</a>.</p>
  </> },
  { id: 'international', title: 'International processing', content: <>
    <p>Some providers and property partners operate outside your country, including outside the European Economic Area or the United Kingdom. Handling an overseas property enquiry may therefore involve an international transfer.</p>
    <p>Where data-protection law requires a transfer safeguard, an appropriate mechanism must apply, such as an applicable adequacy decision or approved contractual safeguards. Contact us for information about the recipients, locations and safeguards relevant to your enquiry.</p>
  </> },
  { id: 'retention', title: 'Retention and security', content: <>
    <p>Retention should reflect the reason the information was collected: the duration of an active enquiry or service, an ongoing subscription, relevant legal record-keeping duties and the period needed to deal with a complaint or claim. An opt-out may require a limited suppression record so that you are not added back to a mailing list. Contact us about the retention or deletion of your records.</p>
    <p>We use measures such as encrypted connections and access restrictions to help protect information. No internet service or email system can be guaranteed completely secure. Please tell us promptly if you believe information connected with our service has been compromised.</p>
  </> },
  { id: 'rights', title: 'Your privacy rights', content: <>
    <p>Depending on the law that applies and the circumstances, you may request access, correction, erasure, restriction or portability of your personal data. You may object to processing based on legitimate interests and object at any time to use of your data for direct marketing. Where we rely on consent, you can withdraw it.</p>
    <p>Email {email} to exercise a right. We may need proportionate information to verify your identity. Under the GDPR, we normally respond within one month; a permitted extension of up to two further months may apply to complex or numerous requests, with an explanation within the first month.</p>
    <p>You may complain directly to your competent data-protection authority, including the <a href="https://www.aepd.es/">Spanish Data Protection Agency (AEPD)</a>, or the authority in the EU/EEA country where you live or work. UK residents can contact the <a href="https://ico.org.uk/make-a-complaint/">Information Commissioner’s Office</a>. You do not have to contact us first.</p>
  </> },
  { id: 'other', title: 'External services, children and updates', content: <>
    <p>External links, WhatsApp and services operated by property partners have their own privacy terms. Our property enquiry services are intended for adults. If you believe a child has supplied personal information, please contact us.</p>
    <p>We may revise this policy as the service changes and will show the revision date above. Material changes may require additional notice. Updating this policy or continuing to browse does not replace consent where consent is needed.</p>
  </> },
];

export default function PrivacyPolicy() {
  return <LegalPage title="Privacy Policy" description="How we handle information when you browse homes, make an enquiry or hear from Co-Ownership Property." path="/privacy-policy/" sections={sections} />;
}
