// Jolly's behaviour as plain data: what the pointer, page and touches mean, which authored clip plays
// and which procedural pose is layered over it. Angles are radians in the model's own frame.

export const CHANNELS = [
  'rootYaw', 'rootRoll', 'lift', 'headYaw', 'headPitch', 'headRoll', 'spineYaw', 'spinePitch', 'spineRoll',
  'armR_side', 'armR_fwd', 'handR_bend', 'armL_side', 'armL_fwd', 'handL_bend',
  'legR', 'legL', 'legR_up', 'legL_up', 'squash', 'bubble',
  'ikR_w', 'ikR_x', 'ikR_y', 'ikR_z', 'ikL_w', 'ikL_x', 'ikL_y', 'ikL_z',
  'runX', 'joy', 'squint', 'blush', 'ooh', 'pout', 'lid', 'say', 'eyeX', 'eyeY',
];

// Authored clip lengths in seconds; Jolly.jsx checks them against the GLB. Loops repeat until replaced.
export const CLIPS = {
  run: 0.5, arrive: 31 / 24, bounce: 23 / 24, wave: 20 / 24, waveL: 20 / 24, idle: 4, think: 4, shy: 2, clap: 0.5, dance: 1,
  yawn: 71 / 24, sleepy: 95 / 24, sneeze: 39 / 24, surprised: 25 / 24, peekaboo: 59 / 24, heart: 55 / 24, stretch: 79 / 24,
  spin: 27 / 24, bow: 2, laugh: 51 / 24,
};
export const LOOPS = new Set(['run', 'wave', 'waveL', 'idle', 'think', 'shy', 'clap', 'dance', 'sleepy']);

// Clicks walk through these; reduced motion leaves out the jumps.
const REACT = ['bounce', 'clap', 'peekaboo', 'heart', 'dance', 'surprised', 'sneeze', 'spin', 'bow', 'laugh'];
const REACT_CALM = ['clap', 'peekaboo', 'heart', 'sneeze', 'bow', 'laugh'];
const REACT_FOR = { clap: 1.5, dance: 2.5 };
// After thinking a while he does one of these, in turn, every IDLE_EVERY seconds.
const QUIRKS = ['yawn', 'stretch', 'look', 'dance'];
export const IDLE_AFTER = 4.5;
export const IDLE_EVERY = 11;
export const SLEEP_AFTER = 50;
// Sprint in side-on, swing round to face the visitor as he arrives, a happy hop, then wave hello.
export const RUN_END = 1.8;
const BRAKE = RUN_END * 0.65;
export const HELLO = RUN_END + CLIPS.bounce;
const INTRO = [RUN_END, HELLO + 2.6];
const STEP = 9;

// Paw targets in the model frame (x right, y up from the feet, z toward the viewer); the IK channels
// carry position times weight so blends stay on the line between targets.
const reach = (side, x, y, z) => ({ [`ik${side}_w`]: 1, [`ik${side}_x`]: x, [`ik${side}_y`]: y, [`ik${side}_z`]: z });

// A paw target on an ellipsoid (centre c, radii r): the surface point seen along `u`, pushed out
// along the surface normal by `gap`, the paw radius less the fur it squashes.
const HEAD = { c: [0, 1.8, 0.02], r: [0.6, 0.56, 0.52] };
const BODY = { c: [0, 0.82, 0.04], r: [0.72, 0.58, 0.66] };
function onSurface({ c, r }, u, gap) {
  const t = 1 / Math.hypot(u[0] / r[0], u[1] / r[1], u[2] / r[2]);
  const p = u.map((v, i) => c[i] + v * t);
  const n = p.map((v, i) => (v - c[i]) / (r[i] * r[i]));
  const l = Math.hypot(...n);
  return p.map((v, i) => v + (n[i] / l) * gap);
}

// The same pose with left and right swapped, for a touch on the other side.
function mirrorPose(pose) {
  const out = {};
  for (const k in pose) {
    const m = k.match(/^(ik|arm|hand|leg)([RL])(.*)$/);
    const to = m ? m[1] + (m[2] === 'R' ? 'L' : 'R') + m[3] : k;
    out[to] = k.endsWith('_x') || /Roll$|Yaw$/.test(k) ? -pose[k] : pose[k];
  }
  return out;
}

const POSES = {
  closeBelow: { headPitch: 0.27, spinePitch: 0.12 },
  closeAbove: { headPitch: -0.34, spinePitch: -0.12, armR_side: 0.35, armL_side: 0.35, armR_fwd: 0.3, armL_fwd: 0.3 },
  belly: { ...reach('R', ...onSurface(BODY, [0.3, 0.05, 0.7], 0.14)), ...reach('L', ...onSurface(BODY, [-0.3, 0.05, 0.7], 0.14)), headPitch: 0.25 },
  cheek: { ...reach('R', ...onSurface(HEAD, [0.55, -0.5, 0.7], 0.12)), headRoll: -0.2, headPitch: 0.06 },
  head: { ...reach('R', ...onSurface(HEAD, [0.85, 0.35, 0.3], 0.14)), headPitch: 0.18, headRoll: -0.16 },
  feet: { headPitch: 0.5, spinePitch: 0.2, armR_side: 0.3, armL_side: 0.3 },
  held: { lift: 0.22, armR_side: 0.35, armL_side: 0.35, armR_fwd: 1.1, armL_fwd: 1.1, handR_bend: 0.4, handL_bend: 0.4, headPitch: -0.12, legR: 0.18, legL: 0.18 },
  // arms wrapped round himself, squeezing
  hug: { ...reach('R', ...onSurface(BODY, [-0.22, 0.2, 0.6], 0.07)), ...reach('L', ...onSurface(BODY, [0.22, 0.2, 0.6], 0.07)), headRoll: 0.18, headPitch: 0.1, squash: 0.08 },
  sad: { headPitch: 0.3, spinePitch: 0.1, armR_side: -0.05, armL_side: -0.05, squash: 0.03 },
};

POSES.cheekL = mirrorPose(POSES.cheek);
POSES.headL = mirrorPose(POSES.head);

// Where the pointer sits relative to Jolly, in units of half the stage height (y grows downward).
export function region(nx, ny) {
  const d = Math.hypot(nx, ny);
  if (d < 1.15 && ny > 0.35) return 'closeBelow';
  if (d < 1.15 && ny < -0.45) return 'closeAbove';
  if (d < 2.6) return 'curious';
  return 'far';
}

// Which touch reaction a hit on a named mesh at model height `y` (0 at the feet, 2.32 at the top) asks for.
export function touchFor(name, y) {
  if (!name) return null;
  if (name.startsWith('Leg')) return 'feet';
  if (name === 'ArmR') return 'waveR';
  if (name === 'ArmL') return 'waveL';
  if (name === 'Head') return y > 1.98 ? 'head' : 'cheek';
  if (name === 'Body') return y > 0.3 ? 'belly' : 'feet';
  return null;
}

// The reaction the n-th click plays (n counts from 1).
export function reactionFor(n, calm) {
  const list = calm ? REACT_CALM : REACT;
  return list[(n - 1) % list.length];
}
export const reactLen = (c) => REACT_FOR[c] ?? CLIPS[c];

function add(out, pose, w) {
  for (const k in pose) out[k] += pose[k] * w;
}

// Two-beat step: each foot lifts on its half of the cycle, the hips roll onto the planted one.
function step(out, t, rate, height) {
  const a = Math.sin(t * rate);
  out.legR_up += Math.max(0, a) * height;
  out.legL_up += Math.max(0, -a) * height;
  out.legR += Math.max(0, a) * height * 2.5;
  out.legL += Math.max(0, -a) * height * 2.5;
  out.rootRoll += a * height * 0.5;
  out.spineRoll -= a * height * 0.35;
}

const since = (t, at) => (at == null ? Infinity : t - at);

// Target pose for time `t` (seconds since he appeared). `s` carries pointer, touch, click, idle, page and
// hold state; the result names a clip (`clip`, started at `clipAt`) plus the procedural channels on top.
export function decide(s, t) {
  const out = Object.fromEntries(CHANNELS.map((c) => [c, 0]));
  out.clip = 'idle';
  out.clipAt = 0;
  out.line = 'Hi there!';
  const play = (clip, at = 0) => {
    out.clip = clip;
    out.clipAt = at;
  };
  // reduced motion keeps every reaction but halves the oscillations and drops the jumps
  const amp = s.calm ? 0.5 : 1;

  if (s.leaving) {
    // running off the left edge when the hero comes back into view
    play('run');
    out.rootYaw = -1.25;
    out.spinePitch = 0.15;
    out.eyeX = -0.8;
    out.joy = 0.4;
    return out;
  }
  if (t < RUN_END) {
    // runs in from the right edge facing left, skids, and turns to the visitor as he stops
    out.runX = Math.pow(1 - t / RUN_END, 1.6);
    const gait = 1 - Math.max(0, (t - BRAKE) / (RUN_END - BRAKE));
    out.rootYaw = -1.25 * Math.min(1, gait * 1.6);
    out.spinePitch = 0.15 * gait;
    out.eyeX = -0.8 * gait;
    out.joy = 0.4;
    play('run');
    return out;
  }

  if (s.grab) {
    // held up and spun by the visitor: legs dangle, arms out, a happy wriggle
    add(out, POSES.held, 1);
    out.rootYaw = s.grab.yaw;
    out.legR += Math.sin(t * 7) * 0.1 * amp;
    out.legL += Math.sin(t * 7 + 2) * 0.1 * amp;
    out.armR_fwd += Math.sin(t * 8) * 0.12 * amp;
    out.armL_fwd += Math.sin(t * 8 + 1.5) * 0.12 * amp;
    out.joy = 1;
    out.ooh = 0.25;
    return out;
  }

  // what he looks at: a hovered link or button wins over the bare pointer
  const lx = s.look ? s.look.nx : s.nx;
  const ly = s.look ? s.look.ny : s.ny;
  const lookW = s.touch ? 0.25 : 1;
  out.rootYaw += clamp(lx * 0.3, -0.5, 0.5) * lookW;
  out.headYaw += clamp(lx * 0.3, -0.42, 0.42) * lookW;
  out.headPitch += clamp(ly * 0.24, -0.35, 0.35) * lookW;
  out.spineYaw += clamp(lx * 0.08, -0.14, 0.14) * lookW;
  out.eyeX = clamp(lx * 0.55, -1, 1);
  out.eyeY = clamp(-ly * 0.55, -1, 1);
  if (s.turning > 0.15) step(out, t, STEP, 0.055 * Math.min(1, s.turning) * amp);

  const still = t - s.lastMove;
  const clickFor = since(t, s.clickAt);
  const clicked = s.clicks ? reactionFor(s.clicks, s.calm) : null;
  const reacting = clicked && clickFor < reactLen(clicked);
  const span = INTRO;
  const intro = t >= span[0] && t < span[1];
  const sleeping = !s.touch && !s.away && still > SLEEP_AFTER;
  const idle = !s.touch && !s.away && still > IDLE_AFTER && !sleeping;

  // standing about: weight shifts from foot to foot
  if (!s.touch && !reacting) {
    const sway = Math.sin(t * 0.9);
    out.rootRoll += sway * 0.02 * amp;
    out.legR_up += Math.max(0, -sway - 0.6) * 0.04 * amp;
    out.legL_up += Math.max(0, sway - 0.6) * 0.04 * amp;
  }

  if (s.hug) {
    // a long press on a phone: he hugs himself and glows
    add(out, POSES.hug, 1);
    out.spineRoll += Math.sin(t * 5) * 0.05 * amp;
    out.joy = 1;
    out.squint = 1;
    out.blush = 1;
    return out;
  }
  if (reacting) {
    play(clicked, s.clickAt);
    out.joy = 1;
    // eyes shut only where it fits: content moments, a sneeze, behind the paws; open and bright otherwise
    if (clicked === 'heart' || clicked === 'laugh') out.squint = 1;
    if (clicked === 'dance') out.squint = 0.5 + 0.5 * Math.sin(clickFor * 6.3);
    if (clicked === 'clap') out.squint = 0.25;
    if (clicked === 'bow') out.squint = clamp(Math.sin((clickFor / CLIPS.bow) * Math.PI) * 1.6, 0, 1);
    if (clicked === 'sneeze') {
      out.joy = clickFor < 0.85 ? 0 : 1;
      out.lid = clickFor > 0.55 && clickFor < 0.9 ? 1 : 0;
      out.ooh = clickFor > 0.3 && clickFor < 0.55 ? 1 : 0;
    }
    if (clicked === 'peekaboo') out.joy = clickFor > 1.45 ? 1 : 0;
    if (clicked === 'surprised') out.ooh = clamp(1 - Math.abs(clickFor - 0.4) * 2.5, 0, 1);
    return out;
  }
  if (since(t, s.wakeAt) < CLIPS.surprised) {
    play('surprised', s.wakeAt);
    out.headYaw = out.rootYaw = out.spineYaw = 0;
    out.lid = Math.max(0, 1 - since(t, s.wakeAt) * 4);
    out.ooh = clamp(1 - Math.abs(since(t, s.wakeAt) - 0.5) * 2.5, 0, 1);
    return out;
  }
  if (since(t, s.backAt) < CLIPS.bounce) {
    play('bounce', s.backAt);
    out.joy = 1;
    return out;
  }
  // the hero scrolling away gets a wave goodbye; coming back gets hello again
  if (since(t, s.byeAt) < 2 || since(t, s.hiAt) < 2.4) {
    const bye = since(t, s.byeAt) < 2;
    play('wave', bye ? s.byeAt : s.hiAt);
    out.say = 1;
    out.line = bye ? 'Bye for now!' : 'Hi again!';
    out.joy = 1;
    return out;
  }

  if (s.tickle) {
    // tickled: he squirms, giggling, eyes squeezed shut
    out.spineRoll += Math.sin(t * 22) * 0.12 * amp;
    out.rootRoll += Math.sin(t * 22 + 1) * 0.05 * amp;
    out.squash += Math.abs(Math.sin(t * 11)) * 0.06 * amp;
    add(out, POSES.belly, 0.7);
    out.joy = 1;
    out.squint = 1;
    out.blush = 1;
    return out;
  }
  if (s.touch) {
    // a pointer resting on his face makes him shy
    if ((s.touch === 'cheek' || s.touch === 'head') && still > 1.6) {
      play('shy');
      out.headYaw = out.rootYaw = out.spineYaw = 0;
      out.eyeX = -0.9;
      out.eyeY = -0.6;
      out.blush = 1;
      return out;
    }
    // a touched arm waves back
    if (s.touch === 'waveR' || s.touch === 'waveL') play(s.touch === 'waveR' ? 'wave' : 'waveL');
    else add(out, POSES[s.touch + (s.touchSide === 'L' ? 'L' : '')] ?? POSES[s.touch], 1);
    if (s.touch === 'belly') {
      out.ikR_z += Math.max(0, Math.sin(t * 10)) * 0.1 * amp;
      out.ikL_z += Math.max(0, Math.sin(t * 10 + Math.PI)) * 0.1 * amp;
      out.squash += Math.abs(Math.sin(t * 10)) * 0.025 * amp;
    }
    if (s.touch === 'feet') step(out, t, 7, 0.09 * amp);
    if (s.touch === 'head') out.headPitch += Math.sin(t * 4) * 0.05;
    // each touch has its own face: a pat is bliss, a cheek poke is shy, the belly tickles, the feet are a surprise
    const arm = s.touch === 'waveR' || s.touch === 'waveL';
    out.eyeX = clamp(lx * 0.6, -1, 1);
    out.eyeY = -clamp(ly * 0.5, -1, 1);
    if (s.touch === 'head') { out.joy = 1; out.squint = 1; }
    else if (s.touch === 'cheek') { out.joy = 0.45; out.blush = 0.7; out.eyeY = -0.4; }
    else if (s.touch === 'belly') { out.joy = 1; out.eyeY = -0.8; }
    else if (s.touch === 'feet') { out.joy = 0.6; out.ooh = 0.5 + 0.3 * Math.sin(t * 7); out.eyeY = -0.9; }
    else if (arm) out.joy = 0;
    return out;
  }

  if (s.look?.kind === 'work') {
    // the "View work" button is the best news he has heard all day
    play('clap');
    out.joy = 1;
    return out;
  }
  if (s.away) {
    // the pointer left the window: he droops and searches for it
    add(out, POSES.sad, 1);
    out.pout = 1;
    const sweep = Math.sin(since(t, s.awayAt) * 0.8);
    out.headYaw = sweep * 0.45;
    out.rootYaw = sweep * 0.15;
    out.eyeX = sweep;
    out.eyeY = -0.4;
    return out;
  }
  // scrolled partway: he peeks down at the content below
  const peek = clamp((1 - (s.view ?? 1)) * 2, 0, 1);
  out.headPitch += peek * 0.35;
  out.eyeY -= peek * 0.8;

  if (intro) {
    const hello = t >= HELLO;
    if (hello) play(lx < -0.15 ? 'waveL' : 'wave', HELLO);
    else play('bounce', RUN_END);
    out.say = hello ? 1 : 0;
    out.joy = hello ? 1 : 0;
    return out;
  }
  if (sleeping) {
    play('sleepy');
    out.lid = 1;
    out.eyeX = out.eyeY = 0;
    out.headYaw *= 0.2;
    out.rootYaw *= 0.2;
    return out;
  }
  if (idle) {
    // thinks with a bubble; now and then a quirk breaks it up
    const k = still - IDLE_AFTER;
    const slot = Math.floor(k / IDLE_EVERY);
    const at = k - slot * IDLE_EVERY;
    const quirk = QUIRKS[slot % QUIRKS.length];
    const qAt = IDLE_EVERY - 3.6;
    const qLen = quirk === 'dance' ? 2.5 : quirk === 'look' ? 3 : CLIPS[quirk];
    if (at >= qAt && at < qAt + qLen && !(s.calm && quirk === 'dance')) {
      out.headYaw = out.rootYaw = out.spineYaw = 0;
      if (quirk === 'look') {
        // glances around the page, as if checking who is there
        const g = Math.sin((at - qAt) * 2.1);
        out.headYaw = g * 0.5;
        out.eyeX = g;
        out.eyeY = 0.2;
      } else play(quirk, t - (at - qAt));
      out.lid = quirk === 'yawn' ? 0.8 * Math.sin(Math.PI * clamp((at - qAt) / qLen, 0, 1)) : 0;
      if (quirk === 'yawn') out.ooh = clamp(out.lid * 1.4, 0, 1);
      return out;
    }
    play('think');
    out.bubble = 1;
    out.eyeX = 0.6;
    out.eyeY = 0.8;
    out.headYaw = out.rootYaw = 0;
    return out;
  }

  const where = region(lx, ly);
  if (where === 'closeBelow') add(out, POSES.closeBelow, 1);
  else if (where === 'closeAbove') {
    add(out, POSES.closeAbove, 1);
    out.joy = 0.5;
  } else if (where === 'curious') out.headRoll += -Math.sign(lx || 1) * 0.22 * Math.min(1, Math.abs(lx) + 0.3);
  if (still > 1.5) out.headYaw += Math.sin(t * 0.7) * 0.25 * amp;
  return out;
}

function clamp(v, a, b) {
  return Math.min(b, Math.max(a, v));
}
