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

      {/* ── WhatsApp floating button (mobile only) ── */}
      <a
        href="https://wa.me/447901002763?text=Hi%2C%20I%27d%20like%20to%20find%20out%20more%20about%20co-ownership%20properties."
        className="wa-fab"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with us on WhatsApp"
      >
        <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill="#25D366"/>
          <path d="M23.5 8.5A10.44 10.44 0 0 0 16 5.5C10.2 5.5 5.5 10.2 5.5 16c0 1.85.49 3.65 1.41 5.24L5.5 26.5l5.38-1.41A10.44 10.44 0 0 0 16 26.5c5.8 0 10.5-4.7 10.5-10.5 0-2.8-1.09-5.43-3-7.5zm-7.5 16.14a8.7 8.7 0 0 1-4.44-1.22l-.32-.19-3.2.84.85-3.12-.2-.32A8.72 8.72 0 1 1 16 24.64zm4.77-6.53c-.26-.13-1.54-.76-1.78-.85-.24-.09-.41-.13-.58.13-.17.26-.66.85-.81 1.02-.15.17-.3.19-.56.06-.26-.13-1.1-.4-2.09-1.29-.77-.69-1.29-1.54-1.44-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.46.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.4-.8-1.92-.21-.5-.43-.43-.58-.44h-.5c-.17 0-.45.06-.69.32-.24.26-.9.88-.9 2.14s.92 2.48 1.05 2.65c.13.17 1.81 2.76 4.38 3.87.61.26 1.09.42 1.46.54.61.19 1.17.17 1.61.1.49-.07 1.54-.63 1.75-1.24.22-.6.22-1.12.15-1.24-.06-.11-.24-.17-.5-.3z" fill="#fff"/>
        </svg>
      </a>
    </main>
  );
}
