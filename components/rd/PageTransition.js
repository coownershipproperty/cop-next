// Slide-up page transition for the redesigned (.rd) pages, in the manner of
// Framer's "slide up": the page you are leaving stays put as a static ghost,
// the nav pill stays where it is, and the new page rises over both.
//
// Mechanics: on routeChangeStart we clone the leaving .rd page's DOM into a
// fixed, non-interactive layer (offset by the current scroll so nothing
// jumps), and clone its nav into a second layer above everything. When the
// new page mounts it is wrapped in .rd-page-enter, which animates from
// translateY(100vh) to rest; its own nav is hidden until the animation ends,
// then the ghost layers are removed and the real nav takes over in the same
// spot. Only fires when the page being LEFT is an .rd page, so legacy pages
// are untouched. Reduced-motion users get a plain swap.
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

const DURATION_MS = 900;

export default function PageTransition({ children }) {
  const router = useRouter();
  const [enterKey, setEnterKey] = useState(0);
  const [entering, setEntering] = useState(false);
  const armed = useRef(false);
  const ghosts = useRef([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function clearGhosts() {
      ghosts.current.forEach((g) => g.remove());
      ghosts.current = [];
      document.documentElement.classList.remove('rd-transitioning');
    }

    function onStart(url, { shallow } = {}) {
      if (shallow || reduced) return;
      const page = document.querySelector('.rd');
      if (!page) return;
      if (url.split('?')[0] === router.asPath.split('?')[0]) return;
      clearGhosts();

      const nav = page.querySelector('.rd-nav-wrap');
      const layer = document.createElement('div');
      layer.className = 'rd-ghost';
      const clone = page.cloneNode(true);
      clone.querySelectorAll('.rd-nav-wrap, script, video').forEach((n) => n.remove());
      clone.style.top = `-${window.scrollY}px`;
      clone.querySelectorAll('[data-rv]').forEach((n) => n.classList.add('rv-in'));
      layer.appendChild(clone);
      document.body.appendChild(layer);
      ghosts.current.push(layer);

      if (nav) {
        const navLayer = document.createElement('div');
        navLayer.className = 'rd-ghost-nav';
        navLayer.appendChild(nav.cloneNode(true));
        document.body.appendChild(navLayer);
        ghosts.current.push(navLayer);
      }
      document.documentElement.classList.add('rd-transitioning');
      armed.current = true;
    }

    function onDone() {
      if (!armed.current) return;
      armed.current = false;
      setEnterKey((k) => k + 1);
      setEntering(true);
      // Hold the ghost for the length of the slide, then hand over. The
      // wrapper's transform/will-change must go too: while they are present
      // the wrapper is the containing block for every position:fixed child
      // (the nav pill, the legacy header) — the iPhone-menu lesson.
      setTimeout(() => { clearGhosts(); setEntering(false); }, DURATION_MS + 60);
    }

    function onError() { armed.current = false; clearGhosts(); setEntering(false); }

    router.events.on('routeChangeStart', onStart);
    router.events.on('routeChangeComplete', onDone);
    router.events.on('routeChangeError', onError);
    return () => {
      router.events.off('routeChangeStart', onStart);
      router.events.off('routeChangeComplete', onDone);
      router.events.off('routeChangeError', onError);
      clearGhosts();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.asPath]);

  // Re-key the wrapper on every transition so the CSS animation restarts.
  return (
    <div key={enterKey} className={entering ? 'rd-page-enter' : undefined}>
      {children}
    </div>
  );
}
