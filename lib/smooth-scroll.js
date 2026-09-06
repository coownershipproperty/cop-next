/**
 * Inertial (lerp) smooth scrolling - wheel input accumulates into a target
 * position and a rAF loop eases the page toward it, so scrolling glides and
 * settles instead of stepping. Native behaviour is preserved on touch
 * devices, for reduced-motion users, and inside nested scrollable regions.
 *
 * v2 - fixes over v1:
 *  - Frame-rate independent easing (dt-based), so it never feels slower on
 *    a loaded main thread.
 *  - Hard resync on visibilitychange/focus: rAF pauses in background tabs,
 *    and v1 could resume with a stale position and yank the page. The loop
 *    now cancels and resyncs from the real scrollY instead.
 *  - Cheap wheel handling: the nested-scrollable check only walks elements
 *    that can actually scroll (scrollHeight > clientHeight), capped depth.
 */
export function initSmoothScroll({ ease = 0.11, wheelMultiplier = 1 } = {}) {
  if (typeof window === 'undefined') return () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touchOnly = window.matchMedia('(hover: none)').matches;
  if (reduced || touchOnly) return () => {};

  let target = 0;
  let current = 0;
  let raf = null;
  let active = false;
  let lastT = 0;

  const maxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    active = false;
  }

  function resync() {
    stop();
    target = window.scrollY;
    current = window.scrollY;
  }

  function frame(t) {
    const dt = lastT ? Math.min(64, t - lastT) : 16.7;
    lastT = t;
    // Exponential smoothing, normalised to a 60fps reference frame.
    const k = 1 - Math.pow(1 - ease, dt / 16.7);
    current += (target - current) * k;
    if (Math.abs(target - current) < 0.5) {
      current = target;
      window.scrollTo({ top: current, behavior: 'instant' });
      stop();
      return;
    }
    window.scrollTo({ top: current, behavior: 'instant' });
    raf = requestAnimationFrame(frame);
  }

  function inNestedScroller(start) {
    let el = start, depth = 0;
    while (el && el !== document.body && el !== document.documentElement && depth < 12) {
      if (el.scrollHeight > el.clientHeight + 1) {
        const oy = getComputedStyle(el).overflowY;
        if (oy === 'auto' || oy === 'scroll') return true;
      }
      el = el.parentElement;
      depth++;
    }
    return false;
  }

  function onWheel(e) {
    if (e.ctrlKey || e.metaKey || e.defaultPrevented) return;
    if (inNestedScroller(e.target)) return;
    e.preventDefault();
    if (!active) {
      current = window.scrollY;
      target = window.scrollY;
      lastT = 0;
      active = true;
      raf = requestAnimationFrame(frame);
    }
    target = Math.min(maxScroll(), Math.max(0, target + e.deltaY * wheelMultiplier));
  }

  // Anything else that moves the page (anchors, keyboard, scrollbar,
  // router navigation) wins immediately.
  function onNativeScroll() {
    if (!active) { target = window.scrollY; current = window.scrollY; }
  }
  function onVisibility() { resync(); }

  resync();
  // The legacy stylesheet sets `scroll-behavior: smooth`, which would make
  // the browser animate every per-frame scrollTo below - two easing systems
  // stacked = mush. The engine owns easing, so force instant scrolls.
  const prevBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('scroll', onNativeScroll, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('focus', onVisibility);
  return () => {
    stop();
    document.documentElement.style.scrollBehavior = prevBehavior;
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('scroll', onNativeScroll);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('focus', onVisibility);
  };
}
