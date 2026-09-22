import { useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

// Native snapshots keep video, fixed headers and the old scroll position intact.
export default function PageTransition({ children }) {
  const router = useRouter();
  const pending = useRef(null);
  const container = useRef(null);
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    function fallback() {
      const node = container.current;
      if (!node || reduced.matches) return;
      node.classList.remove('cop-transition-fallback');
      void node.offsetWidth;
      node.classList.add('cop-transition-fallback');
    }
    function finish() {
      const current = pending.current;
      if (!current) document.documentElement.removeAttribute('data-cop-navigating');
      // View transitions suspend rendering until this promise resolves. Waiting
      // for requestAnimationFrame here deadlocks and makes the browser skip it.
      current?.resolve();
      if (current) {
        current.complete = true;
        if (current.failed) {
          fallback();
          pending.current = null;
          document.documentElement.removeAttribute('data-cop-navigating');
        }
      }
    }
    function error() {
      document.documentElement.removeAttribute('data-cop-navigating');
      pending.current?.transition?.skipTransition();
      pending.current?.resolve();
      pending.current = null;
    }
    function start(url, { shallow } = {}) {
      window.dispatchEvent(new Event('rd:navigation'));
      error();
      if (shallow || reduced.matches || url.split(/[?#]/)[0] === location.pathname) return;
      document.documentElement.setAttribute('data-cop-navigating', '');
      const current = {};
      const committed = new Promise(resolve => { current.resolve = resolve; });
      pending.current = current;
      if (!document.startViewTransition) { current.failed = true; return; }
      current.transition = document.startViewTransition(() => committed);
      current.transition.ready.catch(e => {
        current.failed = true;
        if (current.complete && pending.current === current) fallback();
        if (process.env.NODE_ENV === 'development') console.warn('[COP transition] animation skipped:', e.message);
      });
      current.transition.finished.catch(() => {}).finally(() => {
        if (pending.current === current && current.complete) {
          pending.current = null;
          document.documentElement.removeAttribute('data-cop-navigating');
        }
      });
    }
    function click(event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target.closest?.('a[href]');
      if (!anchor || anchor.hasAttribute('download') || anchor.hasAttribute('data-no-transition') || (anchor.target && anchor.target !== '_self')) return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return;
      if (url.pathname === location.pathname && url.search === location.search) return;
      if (/^\/(api|auth|admin)(\/|$)/.test(url.pathname) || /\.[a-z0-9]{2,8}$/i.test(url.pathname)) return;
      event.preventDefault();
      router.push(url.pathname + url.search + url.hash).catch(e => { if (!e.cancelled) location.assign(url.href); });
    }
    router.events.on('routeChangeStart', start);
    router.events.on('routeChangeComplete', finish);
    router.events.on('routeChangeError', error);
    document.addEventListener('click', click);
    return () => {
      error();
      router.events.off('routeChangeStart', start);
      router.events.off('routeChangeComplete', finish);
      router.events.off('routeChangeError', error);
      document.removeEventListener('click', click);
    };
  }, [router.events]);
  return <div className="cop-page-content" ref={container} onAnimationEnd={e => { if (e.target === container.current) container.current.classList.remove('cop-transition-fallback'); }}>{children}</div>;
}
