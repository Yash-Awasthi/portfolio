// CSS cubic-bezier as a function of progress, solved by bisection (x(t) is monotonic for 0 <= x1, x2 <= 1).
export function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      const m = (lo + hi) / 2;
      if (sx(m) < x) lo = m;
      else hi = m;
    }
    return sy((lo + hi) / 2);
  };
}

export const easeOut = bezier(0.23, 1, 0.32, 1);
export const easeInOut = bezier(0.77, 0, 0.175, 1);

// Progress of `p` through the window [a, b], clamped to 0..1.
export const span = (p, a, b) => Math.min(1, Math.max(0, (p - a) / (b - a)));

export const lerp = (a, b, k) => a + (b - a) * k;
