import { useCallback } from 'react';
import { useLenis } from 'lenis/react';

export function useScrollTo() {
  const lenis = useLenis();
  return useCallback(
    (id, immediate = false) => {
      const el = id === 'top' ? 0 : document.getElementById(id);
      if (el === null) return;
      if (lenis) {
        // Lenis caches the scroll limit; after a route swap it can still hold the old page's height.
        lenis.resize();
        lenis.scrollTo(el, { offset: id === 'top' ? 0 : -64, immediate, force: true });
      }
      else if (el === 0) window.scrollTo(0, 0);
      else el.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth' });
    },
    [lenis],
  );
}
