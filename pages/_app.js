import "@/styles/globals.css";
import { Playfair_Display, Nunito_Sans } from 'next/font/google';
import { useEffect } from 'react';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const nunito = Nunito_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Intercept all #newsletter anchor clicks and center the section in the viewport
    function handleNewsletterClick(e) {
      const anchor = e.target.closest('a[href="#newsletter"]');
      if (!anchor) return;
      const target = document.getElementById('newsletter');
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    document.addEventListener('click', handleNewsletterClick);
    return () => document.removeEventListener('click', handleNewsletterClick);
  }, []);

  return (
    <main className={`${playfair.variable} ${nunito.variable}`}>
      <Component {...pageProps} />
    </main>
  );
}
