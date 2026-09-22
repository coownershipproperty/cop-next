import { useEffect, useRef } from 'react';

/** Keep access dialogs keyboard-safe without opening the phone keyboard on arrival. */
export default function useModalFocus(onClose) {
  const overlayRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    const siblings = [];
    let branch = overlay;
    while (branch.parentElement && branch !== document.body) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement) {
          siblings.push([sibling, sibling.inert]);
          sibling.inert = true;
        }
      }
      branch = branch.parentElement;
    }
    document.body.style.overflow = 'hidden';
    const focusable = () => [...overlay.querySelectorAll('button, a[href], input, select, textarea, [tabindex]')]
      .filter(el => !el.disabled && el.tabIndex >= 0 && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[aria-hidden="true"]'));
    focusable()[0]?.focus({ preventScroll: true });
    function onKeyDown(event) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closeRef.current(); }
      if (event.key === 'Tab') {
        const items = focusable(), first = items[0], last = items[items.length - 1];
        if (!first) { event.preventDefault(); return; }
        if (event.shiftKey && (document.activeElement === first || !overlay.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !overlay.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      siblings.forEach(([element, inert]) => { element.inert = inert; });
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);
  return overlayRef;
}
