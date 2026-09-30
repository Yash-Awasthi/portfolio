export const PAPER = '#eaf0f1';

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

// Linear blend of two #rrggbb colours; `k` is how far toward `b`.
export function mix(a, b, k) {
  const x = rgb(a);
  const y = rgb(b);
  return hex(x.map((v, i) => v + (y[i] - v) * k));
}

// Blend an accent toward paper; `keep` is how much of the accent survives.
export const wash = (color, keep = 0.14) => mix(PAPER, color, keep);

// Colour at scroll line `y` between sorted [position, colour] stops.
export function colourAt(stops, y) {
  if (!stops.length) return PAPER;
  if (y <= stops[0][0]) return stops[0][1];
  const last = stops[stops.length - 1];
  if (y >= last[0]) return last[1];
  const i = stops.findIndex((s) => s[0] > y);
  const [y0, c0] = stops[i - 1];
  const [y1, c1] = stops[i];
  return mix(c0, c1, (y - y0) / (y1 - y0));
}
