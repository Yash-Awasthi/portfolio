import { useEffect } from 'react';
import { motionValue, useScroll } from 'motion/react';
import { PAPER, colourAt } from './colour';

export { PAPER, wash } from './colour';

// The page-wide wash. Set straight from scroll position, never through React state.
export const tint = motionValue(PAPER);

// Text-safe version of an accent: mixed toward ink so small type keeps AA contrast on the wash.
export const ink = (color) => `color-mix(in oklab, ${color} 72%, #141a1f)`;

// Every element with `data-wash` is a colour stop at its vertical centre. The wash is the linear
// blend between the two stops either side of the middle of the viewport.
export function useScrollWash(key) {
  const { scrollY } = useScroll();
  useEffect(() => {
    let stops = [];
    const update = () => tint.set(colourAt(stops, window.scrollY + window.innerHeight / 2));
    const measure = () => {
      stops = [...document.querySelectorAll('[data-wash]')]
        .map((el) => {
          const r = el.getBoundingClientRect();
          return [r.top + window.scrollY + r.height / 2, el.dataset.wash];
        })
        .sort((a, b) => a[0] - b[0]);
      update();
    };
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener('resize', measure);
    const off = scrollY.on('change', update);
    measure();
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      off();
    };
  }, [key, scrollY]);
}
