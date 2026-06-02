import "@/styles/globals.css";
import "@/styles/locale-pages.css";
import { Playfair_Display, Nunito_Sans } from 'next/font/google';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Script from 'next/script';
import { trackConversion } from '@/lib/gtag';
import { Analytics } from '@vercel/analytics/react';
import LiveViewingsBadge from '@/components/LiveViewingsBadge';
import GeoDestinationNudge from '@/components/GeoDestinationNudge';

const GA_ID = 'G-83RBNEXX4E';
const GADS_ID = 'AW-4882418749';
const META_PIXEL_ID = '900153063012762';

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
  const router = useRouter();
  const isGallery = router.pathname.startsWith('/gallery');
  const [waVisible, setWaVisible] = useState(false);
  const [waDismissed, setWaDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem('wa_dismissed') === '1') {
      setWaDismissed(true);
      return;
    }
    function revealWaFab() {
      setWaVisible(true);
      window.removeEventListener('touchstart', revealWaFab);
      window.removeEventListener('scroll', revealWaFab);
    }
    window.addEventListener('touchstart', revealWaFab, { passive: true });
    window.addEventListener('scroll', revealWaFab, { passive: true });
    return () => {
      window.removeEventListener('touchstart', revealWaFab);
      window.removeEventListener('scroll', revealWaFab);
    };
  }, []);

  function dismissWa(e) {
    e.preventDefault();
    e.stopPropagation();
    setWaDismissed(true);
    if (typeof window !== 'undefined') localStorage.setItem('wa_dismissed', '1');
  }

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
      {/* ── Google Analytics 4 ── */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${GA_ID}', { page_path: window.location.pathname });
        gtag('config', '${GADS_ID}');
      `}</Script>

      {/* ── Meta Pixel ── (activate by adding NEXT_PUBLIC_META_PIXEL_ID to .env.local) */}
      {META_PIXEL_ID && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
            document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}</Script>
          <noscript>
            <img height="1" width="1" style={{display:'none'}}
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      <Component {...pageProps} />
      <Analytics />

      {/* ── Live Viewings floating chip (bottom-right, sitewide) ── */}
      {!isGallery && <LiveViewingsBadge />}

      {/* ── Geo-aware destination nudge ("In Mallorca? See homes nearby →") ──
          Hidden on /our-homes/ and /gallery/ — the component handles its own
          route gating, no need to gate at the mount point. */}
      {!isGallery && <GeoDestinationNudge />}

      {/* ── WhatsApp floating button (mobile only, hidden on gallery) ── */}
      {!isGallery && !waDismissed && (
        <div className={`wa-wrap${waVisible ? ' wa-visible' : ''}`}>
          <a
            href="https://wa.me/447901002763?text=Hi%2C%20I%27d%20like%20to%20find%20out%20more%20about%20co-ownership%20properties."
            className="wa-fab"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            onClick={() => trackConversion('whatsapp_click', 'Contact', { method: 'whatsapp' })}
          >
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <circle cx="16" cy="16" r="16" fill="#25D366"/>
              <path d="M23.5 8.5A10.44 10.44 0 0 0 16 5.5C10.2 5.5 5.5 10.2 5.5 16c0 1.85.49 3.65 1.41 5.24L5.5 26.5l5.38-1.41A10.44 10.44 0 0 0 16 26.5c5.8 0 10.5-4.7 10.5-10.5 0-2.8-1.09-5.43-3-7.5zm-7.5 16.14a8.7 8.7 0 0 1-4.44-1.22l-.32-.19-3.2.84.85-3.12-.2-.32A8.72 8.72 0 1 1 16 24.64zm4.77-6.53c-.26-.13-1.54-.76-1.78-.85-.24-.09-.41-.13-.58.13-.17.26-.66.85-.81 1.02-.15.17-.3.19-.56.06-.26-.13-1.1-.4-2.09-1.29-.77-.69-1.29-1.54-1.44-1.8-.15-.26-.02-.4.11-.53.12-.12.26-.3.39-.46.13-.15.17-.26.26-.43.09-.17.04-.32-.02-.45-.06-.13-.58-1.4-.8-1.92-.21-.5-.43-.43-.58-.44h-.5c-.17 0-.45.06-.69.32-.24.26-.9.88-.9 2.14s.92 2.48 1.05 2.65c.13.17 1.81 2.76 4.38 3.87.61.26 1.09.42 1.46.54.61.19 1.17.17 1.61.1.49-.07 1.54-.63 1.75-1.24.22-.6.22-1.12.15-1.24-.06-.11-.24-.17-.5-.3z" fill="#fff"/>
            </svg>
          </a>
          <button className="wa-dismiss" onClick={dismissWa} aria-label="Dismiss WhatsApp button">×</button>
        </div>
      )}
    </main>
  );
}
