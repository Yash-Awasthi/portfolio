// Run with `node src/three/jollyMind.check.mjs`.
import assert from 'node:assert/strict';
import { decide, region, touchFor, reactionFor, reactLen, IDLE_AFTER, IDLE_EVERY, SLEEP_AFTER, RUN_END, HELLO, CLIPS } from './jollyMind.js';

const base = { nx: 0, ny: 0, touch: null, lastMove: 0, clicks: 0, calm: false };
const at = (over, t = 20) => decide({ ...base, lastMove: t, ...over }, t);

assert.equal(region(0, 0.8), 'closeBelow');
assert.equal(region(0, -0.9), 'closeAbove');
assert.equal(region(1.8, 0), 'curious');
assert.equal(region(4, 0), 'far');

assert.equal(touchFor('LegL', 0.2), 'feet');
assert.equal(touchFor('ArmL', 1), 'waveL');
assert.equal(touchFor('Head', 1.7), 'cheek');
assert.equal(touchFor('Head', 2.2), 'head');
assert.equal(touchFor('Body', 0.9), 'belly');
assert.equal(touchFor(undefined, 1), null);

const run = decide(base, 0.5);
assert.ok(run.runX > 0.5 && run.rootYaw < -1 && run.clip === 'run', 'runs in from the right, facing left');
const turn = decide(base, RUN_END - 0.1);
assert.ok(turn.clip === 'run' && turn.rootYaw > -0.6, 'swings round to face the visitor as he arrives');
assert.equal(decide({ ...base, lastMove: RUN_END + 0.3 }, RUN_END + 0.3).clip, 'bounce', 'a happy hop on arrival');
assert.equal(decide({ ...base, lastMove: HELLO + 1, nx: -1 }, HELLO + 1).clip, 'waveL', 'waves with the hand on the pointer side');
const hi = decide({ ...base, lastMove: HELLO + 1 }, HELLO + 1);
assert.ok(hi.clip === 'wave' && hi.say === 1 && hi.joy === 1, 'waves hello with a happy face');
assert.ok(decide({ ...base, calm: true }, 0.5).runX > 0, 'reduced motion still runs in');

assert.ok(at({ nx: 1 }).headYaw + at({ nx: 1 }).rootYaw > 0.5, 'turns toward a pointer on its right');
assert.ok(at({ ny: 0.8 }).headPitch > 0.3, 'looks down at a pointer close below');
assert.ok(at({ ny: -0.9 }).headPitch < -0.3 && at({ ny: -0.9 }).armL_side > 0.3, 'chin up, arms open above');
assert.ok(Math.abs(at({ nx: 1.8 }).headRoll) > 0.15, 'tilts its head when curious');
assert.ok(at({ touch: 'belly' }).ikL_w === 1 && at({ touch: 'belly' }).ikR_w === 1, 'both hands to the belly');
assert.ok(at({ touch: 'cheek' }).ikR_y > 1.4 && at({ touch: 'cheek' }).ikL_w === 0, 'hand to the cheek');
assert.ok(at({ touch: 'cheek', touchSide: 'L' }).ikL_y > 1.4 && at({ touch: 'cheek', touchSide: 'L' }).ikR_w === 0, 'left side uses the left hand');
assert.ok(at({ touch: 'head', touchSide: 'L' }).ikL_x < 0, 'left head touch reaches left');
assert.equal(at({ touch: 'waveL' }).clip, 'waveL', 'touched arm waves back');
assert.equal(decide({ ...base, touch: 'cheek', lastMove: 18 }, 20).clip, 'shy', 'a pointer resting on his face makes him shy');
assert.ok(at({ tickle: true }).blush === 1 && Math.abs(at({ tickle: true }, 20.07).spineRoll) > 0.03, 'tickling makes him squirm');

const idle = decide({ ...base, lastMove: 0 }, HELLO + 4);
assert.ok(idle.bubble > 0.9 && idle.clip === 'think', 'thinks with a bubble when left alone');
const quirks = new Set(Array.from({ length: 400 }, (_, i) => decide({ ...base, lastMove: 0 }, IDLE_AFTER + i * 0.25).clip));
for (const c of ['yawn', 'stretch', 'dance']) assert.ok(quirks.has(c), `idle quirk: ${c}`);
assert.equal(decide({ ...base, lastMove: 0 }, SLEEP_AFTER + 5).clip, 'sleepy', 'falls asleep after a long idle');
assert.equal(decide({ ...base, lastMove: 60, wakeAt: 60 }, 60.3).clip, 'surprised', 'wakes with a start');
assert.ok(IDLE_EVERY > CLIPS.stretch + 1, 'a quirk fits between thoughts');

const seen = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => reactionFor(n));
assert.equal(new Set(seen).size, 10, 'clicks cycle through different reactions');
for (const [n, c] of seen.entries()) assert.equal(at({ clicks: n + 1, clickAt: 19.8 }).clip, c, `click ${n + 1} plays ${c}`);
assert.ok(at({ clicks: 1, clickAt: 20 - reactLen('bounce') - 0.1 }).clip !== 'bounce', 'a reaction ends');
assert.ok(!['bounce', 'surprised', 'dance'].includes(reactionFor(1, true)), 'reduced motion skips the jumps');

assert.ok(at({ away: true, awayAt: 18 }).headPitch > 0.2, 'droops when the pointer leaves');
assert.equal(at({ backAt: 19.8 }).clip, 'bounce', 'happy when it comes back');
assert.ok(at({ view: 0.6 }).headPitch > 0.2, 'peeks down as the page scrolls');
const bye = at({ byeAt: 19.5 });
assert.ok(bye.clip === 'wave' && bye.line.startsWith('Bye'), 'waves goodbye as the hero leaves');
assert.ok(at({ hiAt: 19.5 }).line.startsWith('Hi again'), 'says hi again on return');
assert.equal(at({ look: { nx: 0.5, ny: 1, kind: 'work' } }).clip, 'clap', 'excited by View work');
assert.ok(at({ look: { nx: -2, ny: -1 } }).headYaw < -0.3, 'looks at a hovered link');
assert.ok(at({ hug: true }).ikR_w === 1 && at({ hug: true }).ikR_x < 0, 'a long press is a hug');

assert.ok(decide({ ...base, calm: true, touch: 'belly' }, 20).ikR_w === 1, 'reduced motion still reacts');
assert.ok(decide({ ...base, calm: true, lastMove: 20, nx: 1 }, 20).rootYaw > 0.25, 'reduced motion still follows the pointer');
const held = at({ grab: { yaw: 2 } });
assert.ok(held.rootYaw === 2 && held.lift > 0.2, 'a grab lifts and spins him');
const lift = (over) => Math.max(...Array.from({ length: 40 }, (_, i) => { const p = at(over, 20 + i * 0.025); return Math.max(p.legR_up, p.legL_up); }));
assert.ok(lift({ turning: 1 }) > 0.04, 'steps while turning');
assert.ok(lift({ touch: 'feet' }) > 0.07, 'shuffles its feet');
assert.ok(at({ nx: 1, ny: -0.5 }).eyeX > 0.5 && at({ nx: 1, ny: -0.5 }).eyeY > 0.2, 'eyes follow the pointer');
console.log('jolly mind ok');
