import "@/styles/globals.css";
import { useEffect } from 'react';
import { Playfair_Display, Nunito_Sans } from 'next/font/google';

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

function addImageFadeIn() {
  document.querySelectorAll('.prop-card-img').forEach(img => {
    if (img.complete) {
      img.classList.add('loaded');
    } else {
      img.onload = () => img.classList.add('loaded');
    }
  });
}

export default function App({ Component, pageProps }) {
  useEffect(() => { addImageFadeIn(); }, []);
  return (
    <main className={`${playfair.variable} ${nunito.variable}`}>
      <Component {...pageProps} />
    </main>
  );
}
