import "@/styles/globals.css";
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

export default function App({ Component, pageProps }) {
  return (
    <main className={`${playfair.variable} ${nunito.variable}`}>
      <Component {...pageProps} />
    </main>
  );
}
