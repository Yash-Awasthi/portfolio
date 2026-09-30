// Run with `node src/three/ease.check.mjs`.
import assert from 'node:assert/strict';
import { bezier, easeOut, easeInOut, span } from './ease.js';

const linear = bezier(0, 0, 1, 1);
for (const x of [0, 0.25, 0.5, 0.75, 1]) assert.ok(Math.abs(linear(x) - x) < 1e-4);
assert.equal(easeOut(0), 0);
assert.equal(easeOut(1), 1);
assert.ok(easeOut(0.2) > 0.6, 'strong ease-out is well ahead early');
assert.ok(easeInOut(0.5) > 0.4 && easeInOut(0.5) < 0.7, 'ease-in-out crosses the middle near halfway');
assert.ok(easeInOut(0.1) < 0.05, 'ease-in-out starts slow');
let prev = 0;
for (let x = 0; x <= 1; x += 0.01) {
  const y = easeInOut(x);
  assert.ok(y >= prev - 1e-9, 'monotonic');
  prev = y;
}
assert.ok(Math.abs(span(0.5, 0.2, 0.8) - 0.5) < 1e-9);
assert.equal(span(0.1, 0.2, 0.8), 0);
assert.equal(span(0.9, 0.2, 0.8), 1);
console.log('ease ok');
