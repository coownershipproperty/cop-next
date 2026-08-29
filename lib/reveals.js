/**
 * Reveal-on-scroll: any element with [data-rv] fades and rises into place
 * the first time it enters the viewport. Stagger siblings by setting
 * data-rv="1..6" (each step adds 90ms). Re-scans after route changes so
 * client-side navigations get the same entrance. Respects reduced motion
 * (elements simply appear).
 */
export function initReveals(router) {
  if (typeof window === 'undefined') return () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let io = null;
  function scan() {
    const els = document.querySelectorAll('[data-rv]:not(.rv-in)');
    if (reduced) { els.forEach(el => el.classList.add('rv-in')); return; }
    if (!io) {
      io = new IntersectionObserver((entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add('rv-in');
            io.unobserve(en.target);
          }
        }
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    }
    els.forEach(el => io.observe(el));
  }

  scan();
  const rescan = () => setTimeout(scan, 60);
  router?.events?.on('routeChangeComplete', rescan);
  return () => {
    router?.events?.off('routeChangeComplete', rescan);
    if (io) io.disconnect();
  };
}
