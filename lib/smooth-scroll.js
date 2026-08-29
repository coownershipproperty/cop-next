/**
 * Inertial (lerp) smooth scrolling — the "glide and settle" feel of
 * high-end marketing sites. Wheel input accumulates into a target scroll
 * position; a requestAnimationFrame loop eases the real scroll position
 * toward it every frame. Native scrolling is left untouched on touch
 * devices (where momentum already feels right), for users who prefer
 * reduced motion, and inside any element that scrolls on its own.
 *
 * Original implementation — no external dependency, ~2KB.
 */
export function initSmoothScroll({ ease = 0.09, wheelMultiplier = 1 } = {}) {
  if (typeof window === 'undefined') return () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touchOnly = window.matchMedia('(hover: none)').matches;
  if (reduced || touchOnly) return () => {};

  let target = window.scrollY;
  let current = window.scrollY;
  let raf = null;
  let active = false;

  const maxScroll = () =>
    Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

  // If anything else moves the page (anchor jump, router navigation,
  // keyboard, scrollbar drag), resync instead of fighting it.
  function onNativeScroll() {
    if (!active) { target = window.scrollY; current = window.scrollY; }
  }

  function frame() {
    current += (target - current) * ease;
    if (Math.abs(target - current) < 0.5) {
      current = target;
      active = false;
    }
    window.scrollTo(0, current);
    raf = active ? requestAnimationFrame(frame) : null;
  }

  function onWheel(e) {
    // Let pinch-zoom and modified scrolls behave natively.
    if (e.ctrlKey || e.metaKey) return;
    // Skip when the pointer is inside a nested scrollable region.
    let el = e.target;
    while (el && el !== document.body) {
      const s = getComputedStyle(el);
      if (/(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 1) return;
      el = el.parentElement;
    }
    e.preventDefault();
    if (!active) { current = window.scrollY; }
    target = Math.min(maxScroll(), Math.max(0, target + e.deltaY * wheelMultiplier));
    if (!active) { active = true; raf = requestAnimationFrame(frame); }
  }

  window.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('scroll', onNativeScroll, { passive: true });
  return () => {
    window.removeEventListener('wheel', onWheel);
    window.removeEventListener('scroll', onNativeScroll);
    if (raf) cancelAnimationFrame(raf);
  };
}
