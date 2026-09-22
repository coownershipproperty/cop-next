/**
 * lib/email/templateList.js
 *
 * The list of React Email templates that /admin/email-previews offers and
 * /api/admin/ui/email-preview will render. An explicit list, not a directory
 * read: the name arrives on a query string and this is the whole of the
 * validation.
 *
 * It lives here rather than in the API route because the preview page needs it
 * too, and importing an API route into a page would drag the mailer, the admin
 * auth and @react-email/render into the browser bundle.
 */
export const TEMPLATES = [
  'newsletter', 'new-listings-digest', 'personalised-newsletter',
  'property-alert', 'price-drop-alert', 'seasonal-spotlight',
  'gallery-nurture', 'nurture-day3', 'nurture-day7', 'nurture-day14',
  'nurture-floor-plan', 'floor-plan', 'discreet-brochure',
  'welcome-1', 'welcome-2', 'welcome-3',
  're-engagement', 'destination-market-report', 'collection-access',
  'viewings-france', 'year-of-weekends',
];

export default TEMPLATES;
