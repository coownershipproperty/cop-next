// /contact/ — the English contact page.
//
// Markup lives in components/rd/ContactView.js and copy in
// content/contact/en.json, because the same component now renders all ten
// languages. See the note at the top of that component.
import ContactView from '@/components/rd/ContactView';
import { localeJsonStaticProps } from '@/lib/home-page-data';

export const getStaticProps = localeJsonStaticProps('contact', 'en');

export default function Contact(props) {
  return <ContactView locale="en" {...props} />;
}
