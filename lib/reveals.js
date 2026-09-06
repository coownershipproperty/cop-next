/**
 * Reveal-on-scroll for redesigned (.rd) pages. Elements are tagged with
 * [data-rv] (automatically for the standard blocks below), hidden ONLY once
 * html.rv-ready confirms this code is live, and faded in as they enter the
 * viewport. If anything fails, rv-ready is never set and the page renders
 * fully visible - reveals degrade to nothing, never to hidden content.
 */
export function initReveals(router) {
  if (typeof window === 'undefined') return () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const AUTO = [
    '.rd .section-heading', '.rd .section-subtitle', '.rd .explainer-intro',
    '.rd .pc-browse-all', '.rd .cta-band-heading', '.rd .cta-band-sub',
    '.rd .cta-band-buttons', '.rd .dest-tabs', '.rd .lp-subtitle',
    '.rd .lp-footer', '.rd .faq-eyebrow', '.rd .faq-heading', '.rd .faq-subheading',
  ].join(', ');
  const AUTO_STAGGER = [
    '.rd .explainer-grid', '.rd .testimonials-grid', '.rd .latest-posts-grid',
    '.rd .faq-list',
  ].join(', ');

  let io = null;
  let timers = [];

  function scan() {
    try {
      if (!document.querySelector('.rd')) return;
      document.querySelectorAll(AUTO).forEach(el => {
        if (!el.hasAttribute('data-rv')) el.setAttribute('data-rv', '');
      });
      document.querySelectorAll(AUTO_STAGGER).forEach(grid => {
        [...grid.children].forEach((el, i) => {
          if (!el.hasAttribute('data-rv')) el.setAttribute('data-rv', String((i % 4) + 1));
        });
      });
      const els = document.querySelectorAll('[data-rv]:not(.rv-in)');
      if (!els.length) return;
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
      // Only hide-then-reveal once the observer is genuinely in place.
      document.documentElement.classList.add('rv-ready');
      // Anything already in view when we arm gets shown immediately on the
      // observer's first pass; this is just a safety net against a stall.
      timers.push(setTimeout(() => {
        document.querySelectorAll('[data-rv]:not(.rv-in)').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.top < innerHeight && r.bottom > 0) el.classList.add('rv-in');
        });
      }, 1200));
    } catch (e) {
      // Fail visible: never leave content hidden.
      document.documentElement.classList.remove('rv-ready');
      document.querySelectorAll('[data-rv]').forEach(el => el.classList.add('rv-in'));
    }
  }

  scan();
  const late = setTimeout(scan, 400);
  const rescan = () => setTimeout(scan, 60);
  router?.events?.on('routeChangeComplete', rescan);
  return () => {
    router?.events?.off('routeChangeComplete', rescan);
    clearTimeout(late);
    timers.forEach(clearTimeout);
    if (io) io.disconnect();
  };
}
