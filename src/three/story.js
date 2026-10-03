import { useEffect, useState } from 'react';
import { createTimeline, cubicBezier } from 'animejs';

export const OUT = cubicBezier(0.23, 1, 0.32, 1);
export const IN_OUT = cubicBezier(0.77, 0, 0.175, 1);

// A scene's story as two anime.js timelines over one plain object that useFrame reads: `intro`
// plays once, then `loop` repeats. `still` holds the story at fraction `at` of the loop.
export function useStory(init, build, { delay = 0, still = false, at = 0.5 } = {}) {
  const [s] = useState(init);
  useEffect(() => {
    const defaults = { ease: IN_OUT, duration: 600 };
    const intro = createTimeline({ autoplay: false, delay: delay * 1000, defaults });
    const loop = createTimeline({ autoplay: false, loop: true, defaults });
    build({ intro, loop }, s);
    if (still) {
      intro.seek(intro.duration);
      loop.seek(loop.iterationDuration * at);
    } else if (intro.duration > 0) {
      intro.then(() => loop.play());
      intro.play();
    } else {
      // An empty timeline never completes, so a story without an entrance only waits out the delay.
      const t = setTimeout(() => loop.play(), delay * 1000);
      return () => {
        clearTimeout(t);
        loop.revert();
      };
    }
    return () => {
      intro.revert();
      loop.revert();
    };
  }, [s, build, delay, still, at]);
  return s;
}
