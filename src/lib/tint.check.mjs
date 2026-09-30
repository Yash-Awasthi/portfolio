// Run with `node src/lib/tint.check.mjs`.
import assert from 'node:assert/strict';
import { mix, colourAt, wash, PAPER } from './colour.js';

assert.equal(mix('#000000', '#ffffff', 0), '#000000');
assert.equal(mix('#000000', '#ffffff', 1), '#ffffff');
assert.equal(mix('#000000', '#ffffff', 0.5), '#808080');
const stops = [
  [100, '#000000'],
  [300, '#ffffff'],
];
assert.equal(colourAt(stops, 0), '#000000', 'before the first stop holds its colour');
assert.equal(colourAt(stops, 200), '#808080', 'halfway between stops is the midpoint');
assert.equal(colourAt(stops, 999), '#ffffff', 'after the last stop holds its colour');
assert.equal(colourAt([], 50), PAPER);
assert.equal(wash(PAPER), PAPER);
console.log('tint ok');
