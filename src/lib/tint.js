import { animate, motionValue } from 'motion/react';

export const PAPER = '#eaf0f1';

// One page-wide wash colour, animated outside React so a section change never re-renders the tree.
export const tint = motionValue(PAPER);

let running;
export function setTint(color) {
  if (tint.get() === color) return;
  running?.stop();
  running = animate(tint, color, { duration: 1.1, ease: [0.16, 1, 0.3, 1] });
}

// Text-safe version of an accent: mixed toward ink so small type keeps AA contrast on the wash.
export const ink = (color) => `color-mix(in oklab, ${color} 72%, #141a1f)`;

// Blend an accent toward paper; `keep` is how much of the accent survives.
export function wash(color, keep = 0.14) {
  const a = parseInt(color.slice(1), 16);
  const b = parseInt(PAPER.slice(1), 16);
  const ch = (n, s) => (n >> s) & 255;
  const mix = (s) => Math.round(ch(a, s) * keep + ch(b, s) * (1 - keep));
  return `#${((mix(16) << 16) | (mix(8) << 8) | mix(0)).toString(16).padStart(6, '0')}`;
}
