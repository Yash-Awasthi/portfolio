import { useSyncExternalStore } from 'react';

// Where Jolly is: in the hero ('hero'), parked in the corner ('pinned'), running off the left edge
// ('leaving') or gone while the hero stage resets ('gap'). There is only ever one Jolly.
let phase = 'hero';
const subs = new Set();

export const getPhase = () => phase;
export function setPhase(p) {
  if (p === phase) return;
  phase = p;
  subs.forEach((f) => f());
}
export const usePhase = () =>
  useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    getPhase,
  );
export const isFixed = (p) => p === 'pinned' || p === 'leaving';
export const heroBottom = () => document.getElementById('top')?.getBoundingClientRect().bottom ?? 0;
// The hero is "behind" the reader once its bottom edge has gone past the top of the window.
export const HERO_GONE = 40;
// Scrolling back up this far brings the pinned Jolly home.
export const HERO_BACK = 220;

export function togglePin() {
  if (phase === 'hero') setPhase('pinned');
  else if (phase === 'pinned') setPhase('leaving');
}
