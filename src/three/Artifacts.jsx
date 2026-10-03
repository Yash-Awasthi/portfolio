import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, RoundedBox, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from 'motion/react';
import { stagger } from 'animejs';
import { easeOut, easeInOut, span, lerp } from './ease';
import { useStory, OUT } from './story';

const COBALT = '#3d5bd9';
const INK = '#141a1f';

function Chrome(props) {
  return <meshPhysicalMaterial color="#dcdde3" metalness={1} roughness={0.14} {...props} />;
}
function Clay(props) {
  return <meshPhysicalMaterial color="#eef3f3" roughness={0.55} clearcoat={0.3} {...props} />;
}
function Accent({ color = COBALT, ...props }) {
  return <meshPhysicalMaterial color={color} roughness={0.28} clearcoat={1} clearcoatRoughness={0.2} {...props} />;
}

// Each object tells its project's story on a loop. The clock counts from the object's first
// frame, so entrances replay whenever an object is swapped in; `delay` holds the entrance back
// until a page transition has cleared.
function useClock(delay = 0) {
  const start = useRef(null);
  return (state) => {
    if (start.current === null) start.current = state.clock.elapsedTime;
    return Math.max(0, state.clock.elapsedTime - start.current - delay);
  };
}

// Eases the group toward the pointer so every object answers the cursor the same way.
function useTilt(strength = 0.35, still = false) {
  const ref = useRef();
  useFrame((state, dt) => {
    const g = ref.current;
    if (!g || still) return;
    const k = 1 - Math.exp(-dt * 3);
    g.rotation.y += (state.pointer.x * strength - g.rotation.y) * k;
    g.rotation.x += (-state.pointer.y * strength * 0.6 - g.rotation.x) * k;
  });
  return ref;
}

function Spin({ speed = 0.2, axis = 'y', still, children, ...props }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (!still && ref.current) ref.current.rotation[axis] += dt * speed;
  });
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}

// Nexus: a council at a round table. A question drops in and splits to five different models;
// each writes an answer card, the cards turn face down and pass one seat on for blind review,
// the models debate across the table, and the cards gather into one verdict gem.
const SEAT_N = 5;
const TABLE = 1.2;
const SEAT_R = 0.95;
const seatAt = (i, r = SEAT_R) => {
  const a = -Math.PI / 2 + (i / SEAT_N) * Math.PI * 2;
  return [Math.cos(a) * r, Math.sin(a) * r];
};
const MODEL_GEOMETRY = [
  <icosahedronGeometry key="i" args={[1, 0]} />,
  <octahedronGeometry key="o" args={[1, 0]} />,
  <dodecahedronGeometry key="d" args={[1, 0]} />,
  <boxGeometry key="b" args={[1.3, 1.3, 1.3]} />,
  <tetrahedronGeometry key="t" args={[1.2, 0]} />,
];

const councilInit = () => ({
  seats: Array.from({ length: SEAT_N }, () => ({ up: 0 })),
  q: 0,
  fan: 0,
  think: 0,
  cards: 0,
  flip: 0,
  pass: 0,
  debate: 0,
  gather: 0,
  gem: 0,
});

function councilStory({ intro, loop }, s) {
  intro.add(s.seats, { up: [0, 1], duration: 900, ease: OUT, delay: stagger(90) });
  loop
    .add(s, { q: [0, 1], duration: 800 })
    .add(s, { fan: [0, 1], duration: 650 })
    .add(s, { think: [0, 1], duration: 300 }, '<<')
    .add(s, { cards: [0, 1], duration: 700, ease: OUT }, '-=150')
    .add(s, { flip: [0, 1], duration: 650 }, '+=300')
    .add(s, { pass: [0, 1], duration: 850 })
    .add(s, { think: 0, duration: 400 }, '<<')
    .add(s, { debate: [0, 1], duration: 1700, ease: 'linear' })
    .add(s, { gather: [0, 1], duration: 850 })
    .add(s, { gem: [0, 1], duration: 900, ease: OUT }, '-=450')
    .add(s, { gem: 0, duration: 650 }, '+=900')
    .add(s, { q: 0, fan: 0, cards: 0, flip: 0, pass: 0, debate: 0, gather: 0, duration: 1 });
}

function Council({ still, color, delay }) {
  const s = useStory(councilInit, councilStory, { delay, still, at: 0.42 });
  const seats = useRef([]);
  const cards = useRef([]);
  const beads = useRef([]);
  const question = useRef();
  const debaters = useRef([]);
  const gem = useRef();
  useFrame((_, dt) => {
    seats.current.forEach((m, i) => {
      if (!m) return;
      m.position.y = lerp(-0.5, -0.15, s.seats[i].up);
      m.rotation.y += dt * (0.3 + s.think * 3.5);
      m.rotation.x += dt * s.think * 1.5;
    });
    if (question.current) {
      question.current.position.y = lerp(1.1, -0.1, s.q);
      question.current.visible = s.q > 0 && s.fan < 0.02;
    }
    beads.current.forEach((m, i) => {
      if (!m) return;
      const [x, z] = seatAt(i, SEAT_R * s.fan);
      m.position.set(x, -0.1 + Math.sin(s.fan * Math.PI) * 0.25, z);
      m.visible = s.fan > 0.02 && s.fan < 0.98;
    });
    cards.current.forEach((g, i) => {
      if (!g) return;
      // Cards pass one seat on, then gather into the middle.
      const a = -Math.PI / 2 + ((i + s.pass) / SEAT_N) * Math.PI * 2;
      const r = (SEAT_R - 0.32) * (1 - s.gather);
      g.position.set(Math.cos(a) * r, lerp(-0.3, 0.2, s.cards) + s.gather * 0.1, Math.sin(a) * r);
      g.rotation.set(0, -a - Math.PI / 2 + s.flip * Math.PI, 0);
      g.visible = s.cards > 0.01 && s.gather < 0.97;
    });
    debaters.current.forEach((m, i) => {
      if (!m) return;
      // Each bead crosses between seat i and the seat two along, out and back.
      const ph = (s.debate * 2 + i * 0.37) % 1;
      const k = easeInOut(ph < 0.5 ? ph * 2 : 2 - ph * 2);
      const [ax, az] = seatAt(i);
      const [bx, bz] = seatAt((i + 2) % SEAT_N);
      m.position.set(lerp(ax, bx, k), 0.05 + Math.sin(k * Math.PI) * 0.45, lerp(az, bz, k));
      m.visible = s.debate > 0.01 && s.debate < 0.99;
    });
    if (gem.current) {
      gem.current.position.y = lerp(-0.6, 0.75, s.gem);
      gem.current.rotation.y += dt * 1.2;
    }
  });
  return (
    <group rotation={[0.5, 0, 0]} position={[0, 0.1, 0]} scale={1.2}>
      <mesh position={[0, -0.35, 0]}>
        <cylinderGeometry args={[TABLE, TABLE, 0.06, 96]} />
        <Clay />
      </mesh>
      <mesh position={[0, -0.318, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[SEAT_R - 0.02, SEAT_R + 0.02, 96]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>
      {MODEL_GEOMETRY.map((geo, i) => {
        const [x, z] = seatAt(i);
        return (
          <group key={i} position={[x, 0, z]}>
            <mesh ref={(m) => (seats.current[i] = m)} scale={0.15}>
              {geo}
              {i === 0 ? <Accent color={color} flatShading /> : <Chrome flatShading />}
            </mesh>
          </group>
        );
      })}
      {Array.from({ length: SEAT_N }, (_, i) => (
        <group key={i} ref={(g) => (cards.current[i] = g)}>
          <RoundedBox args={[0.26, 0.34, 0.015]} radius={0.01} smoothness={2}>
            <Clay />
          </RoundedBox>
          <mesh position={[-0.02, 0.08, 0.009]}>
            <planeGeometry args={[0.16, 0.025]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0.02, 0.009]}>
            <planeGeometry args={[0.2, 0.02]} />
            <meshBasicMaterial color="#8fb3c9" toneMapped={false} />
          </mesh>
          <mesh position={[-0.03, -0.03, 0.009]}>
            <planeGeometry args={[0.14, 0.02]} />
            <meshBasicMaterial color="#8fb3c9" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, -0.009]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[0.2, 0.28]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh ref={question} scale={0.07}>
        <sphereGeometry args={[1, 24, 24]} />
        <Accent color={color} />
      </mesh>
      {Array.from({ length: SEAT_N }, (_, i) => (
        <mesh key={i} ref={(m) => (beads.current[i] = m)} scale={0.045}>
          <sphereGeometry args={[1, 16, 16]} />
          <Accent color={color} />
        </mesh>
      ))}
      {Array.from({ length: SEAT_N }, (_, i) => (
        <mesh key={i} ref={(m) => (debaters.current[i] = m)} scale={0.05}>
          <sphereGeometry args={[1, 12, 12]} />
          <Chrome />
        </mesh>
      ))}
      <mesh ref={gem} scale={0.2}>
        <octahedronGeometry args={[1, 0]} />
        <Accent color={color} flatShading />
      </mesh>
    </group>
  );
}

// WorldFin: headlines fly in and land where the event happened; a verdict rises from each spot,
// up for invest and down for pull out, while a price line traces round the orbit, scoring the
// calls against the market. Then the markers settle and the next day's news comes in.
const UP = new THREE.Vector3(0, 1, 0);
const EVENTS = [
  [0.4, 0.6, 0.7, 1],
  [-0.92, 0.15, 0.3, 0],
  [0.2, -0.5, 0.84, 1],
  [-0.3, 0.8, -0.5, 1],
  [0.8, -0.2, -0.55, 0],
  [-0.6, -0.6, 0.5, 1],
].map(([x, y, z, invest]) => {
  const n = new THREE.Vector3(x, y, z).normalize();
  return { position: n.toArray(), quaternion: new THREE.Quaternion().setFromUnitVectors(UP, n), invest };
});
const GLOBE_DOTS = (() => {
  const out = [];
  const n = 220;
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = i * 2.399963;
    if ((i * 7) % 5 < 2) out.push([Math.cos(t) * r * 1.02, y * 1.02, Math.sin(t) * r * 1.02]);
  }
  return out;
})();
const PRICE_POINTS = 160;
const PRICE = new Float32Array(
  Array.from({ length: PRICE_POINTS }, (_, i) => {
    const a = (i / (PRICE_POINTS - 1)) * Math.PI * 2;
    const y = Math.sin(i * 0.37) * 0.05 + Math.sin(i * 0.11) * 0.08 + Math.sin(i * 1.3) * 0.02;
    return [Math.cos(a) * 1.5, y, Math.sin(a) * 1.5];
  }).flat(),
);
const STEP = 850;

const globeInit = () => ({ ring: 0, line: 0, ev: EVENTS.map(() => ({ land: 0, mark: 0 })) });

function globeStory({ intro, loop }, s) {
  intro.add(s, { ring: [0, 1], duration: 1500, ease: OUT });
  s.ev.forEach((e, i) => {
    loop.add(e, { land: [0, 1], duration: 750 }, i * STEP).add(e, { mark: [0, 1], duration: 650, ease: OUT }, i * STEP + 700);
  });
  const end = EVENTS.length * STEP + 1600;
  loop
    .add(s, { line: [0, 1], duration: end, ease: 'linear' }, 0)
    .add(s.ev, { mark: 0, duration: 600 }, end)
    .add(s.ev, { land: 0, duration: 1 }, end + 600)
    .add(s, { line: 0, duration: 1 }, end + 600);
}

function Globe({ still, color, delay }) {
  const s = useStory(globeInit, globeStory, { delay, still, at: 0.7 });
  const body = useRef();
  const ring = useRef();
  const cards = useRef([]);
  const marks = useRef([]);
  const price = useRef();
  useFrame((_, dt) => {
    if (body.current && !still) body.current.rotation.y += dt * 0.12;
    if (ring.current) ring.current.rotation.x = lerp(1.1, 0, s.ring);
    price.current?.geometry.setDrawRange(0, Math.floor(s.line * PRICE_POINTS));
    s.ev.forEach((e, i) => {
      const c = cards.current[i];
      if (c) {
        c.position.set(lerp(0.55, 0, easeOut(e.land)), lerp(0.75, -0.04, e.land), 0);
        c.rotation.set(-Math.PI / 2 * e.land, 0, lerp(0.6, 0, e.land));
        c.visible = e.land > 0.001 && e.land < 0.999;
      }
      const m = marks.current[i];
      if (m) m.position.y = lerp(-0.32, 0.02, e.mark);
    });
  });
  return (
    <group rotation={[0.35, 0, 0.15]}>
      <group ref={body}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <Clay />
        </mesh>
        <Instances limit={GLOBE_DOTS.length}>
          <sphereGeometry args={[0.024, 10, 10]} />
          <Accent color={color} />
          {GLOBE_DOTS.map((p, i) => (
            <Instance key={i} position={p} />
          ))}
        </Instances>
        {EVENTS.map((e, i) => (
          <group key={i} position={e.position} quaternion={e.quaternion}>
            <group ref={(g) => (cards.current[i] = g)}>
              <RoundedBox args={[0.34, 0.22, 0.012]} radius={0.01} smoothness={2}>
                <Clay />
              </RoundedBox>
              <mesh position={[-0.04, 0.05, 0.007]}>
                <planeGeometry args={[0.22, 0.03]} />
                <meshBasicMaterial color={INK} />
              </mesh>
              <mesh position={[0, -0.01, 0.007]}>
                <planeGeometry args={[0.26, 0.018]} />
                <meshBasicMaterial color="#8fb3c9" />
              </mesh>
              <mesh position={[-0.05, -0.05, 0.007]}>
                <planeGeometry args={[0.18, 0.018]} />
                <meshBasicMaterial color="#8fb3c9" />
              </mesh>
            </group>
            <group ref={(m) => (marks.current[i] = m)}>
              {/* Invest points out of the globe, pull out points into it. */}
              <group position={[0, 0.13, 0]} rotation={[e.invest ? 0 : Math.PI, 0, 0]}>
                <mesh position={[0, -0.06, 0]}>
                  <cylinderGeometry args={[0.022, 0.022, 0.16, 12]} />
                  {e.invest ? <Accent color={color} /> : <Accent color="#5b5fc7" />}
                </mesh>
                <mesh position={[0, 0.07, 0]}>
                  <coneGeometry args={[0.065, 0.12, 24]} />
                  {e.invest ? <Accent color={color} /> : <Accent color="#5b5fc7" />}
                </mesh>
              </group>
            </group>
          </group>
        ))}
      </group>
      <group ref={ring}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.5, 0.008, 8, 200]} />
          <Chrome />
        </mesh>
        <line ref={price}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[PRICE, 3]} />
          </bufferGeometry>
          <lineBasicMaterial color={color} toneMapped={false} />
        </line>
      </group>
    </group>
  );
}

// AdapFit: the morning's HRV trace runs into a recovery gauge measured against the user's own
// baseline; the needle settles and one of four decisions lifts out: train, reduce, recover, rest.
// Four mornings play in turn, one for each decision.
const GAUGE_TICKS = 36;
const GAUGE_R = 0.8;
const MORNINGS = [0.88, 0.6, 0.38, 0.14];
const WAVE_N = 90;
const WAVE_X = [-1.75, -0.62];
const gaugeAngle = (v) => (Math.PI * 5) / 4 - v * ((Math.PI * 3) / 2);
// One heartbeat per unit: flat, small P wave, sharp QRS spike, T wave.
const beat = (u) => {
  const f = u - Math.floor(u);
  if (f < 0.12) return Math.sin((f / 0.12) * Math.PI) * 0.05;
  if (f < 0.2) return 0;
  if (f < 0.24) return -((f - 0.2) / 0.04) * 0.08;
  if (f < 0.28) return -0.08 + ((f - 0.24) / 0.04) * 0.48;
  if (f < 0.33) return 0.4 - ((f - 0.28) / 0.05) * 0.5;
  if (f < 0.37) return -0.1 + ((f - 0.33) / 0.04) * 0.1;
  if (f < 0.55) return Math.sin(((f - 0.37) / 0.18) * Math.PI) * 0.1;
  return 0;
};

const recoveryInit = () => ({ wave: 0, fill: 0, picks: MORNINGS.map(() => ({ up: 0 })) });

function recoveryStory({ loop }, s) {
  MORNINGS.forEach((v, k) => {
    const t = k * 3600;
    loop
      .add(s, { wave: [0, 1], duration: 1300, ease: 'linear' }, t)
      .add(s, { fill: v, duration: 1100, ease: OUT }, t + 800)
      .add(s.picks[k], { up: 1, duration: 550, ease: OUT }, t + 1800)
      .add(s.picks[k], { up: 0, duration: 450 }, t + 3000)
      .add(s, { wave: 0, duration: 1 }, t + 3500);
  });
  loop.add(s, { fill: 0, duration: 500 }, MORNINGS.length * 3600 - 500);
}

const glyphPart = (args, position, rotation = 0) => (
  <mesh position={position} rotation={[0, 0, rotation]}>
    <planeGeometry args={args} />
    <meshBasicMaterial color={INK} />
  </mesh>
);
// Train: chevron up. Reduce: bar. Recover: ring. Rest: two short bars, a pause.
const PILL_GLYPHS = [
  <>
    {glyphPart([0.07, 0.016], [-0.022, 0, 0], 0.7)}
    {glyphPart([0.07, 0.016], [0.022, 0, 0], -0.7)}
  </>,
  glyphPart([0.1, 0.018], [0, 0, 0]),
  <mesh>
    <ringGeometry args={[0.025, 0.04, 32]} />
    <meshBasicMaterial color={INK} />
  </mesh>,
  <>
    {glyphPart([0.016, 0.07], [-0.02, 0, 0])}
    {glyphPart([0.016, 0.07], [0.02, 0, 0])}
  </>,
];
const TICK_DIM = new THREE.Color('#cfd8db');
const PILL_DIM = new THREE.Color('#eef3f3');

function Recovery({ still, color, delay }) {
  const s = useStory(recoveryInit, recoveryStory, { delay, still, at: 0.12 });
  const wave = useRef();
  const ticks = useRef([]);
  const needle = useRef();
  const pills = useRef([]);
  const lit = useMemo(() => new THREE.Color(color), [color]);
  const [positions] = useState(() => new Float32Array(WAVE_N * 3));
  const phase = useRef(0);
  useFrame((_, dt) => {
    if (!still) phase.current += dt * 0.9;
    if (wave.current) {
      const attr = wave.current.geometry.attributes.position;
      for (let i = 0; i < WAVE_N; i++) {
        const u = i / (WAVE_N - 1);
        attr.setXY(i, lerp(WAVE_X[0], WAVE_X[1], u), beat(u * 2.2 - phase.current) * 0.9);
      }
      attr.needsUpdate = true;
      wave.current.geometry.setDrawRange(0, Math.floor((still ? 1 : s.wave) * WAVE_N));
    }
    if (needle.current) needle.current.rotation.z = gaugeAngle(s.fill);
    ticks.current.forEach((m, i) => {
      const on = THREE.MathUtils.clamp(s.fill * GAUGE_TICKS - i, 0, 1);
      m?.color.copy(TICK_DIM).lerp(lit, on);
    });
    pills.current.forEach((g, k) => {
      if (!g) return;
      const p = still ? (k === 0 ? 1 : 0) : s.picks[k].up;
      g.position.y = -1.14 + p * 0.22;
      g.children[0].material.color.copy(PILL_DIM).lerp(lit, p);
    });
  });
  return (
    <group position={[0.15, 0.12, 0]} scale={0.95} rotation={[0.12, -0.2, 0]}>
      <line ref={wave}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} toneMapped={false} />
      </line>
      <group position={[0.55, 0.12, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.98, 0.98, 0.08, 96]} />
          <Clay />
        </mesh>
        <mesh>
          <torusGeometry args={[0.98, 0.035, 16, 120]} />
          <Chrome />
        </mesh>
        {Array.from({ length: GAUGE_TICKS }, (_, i) => {
          const a = gaugeAngle((i + 0.5) / GAUGE_TICKS);
          return (
            <mesh key={i} position={[Math.cos(a) * GAUGE_R, Math.sin(a) * GAUGE_R, 0.05]} rotation={[0, 0, a]}>
              <boxGeometry args={[0.13, 0.035, 0.01]} />
              <meshBasicMaterial ref={(m) => (ticks.current[i] = m)} color={color} toneMapped={false} />
            </mesh>
          );
        })}
        <group ref={needle} position={[0, 0, 0.08]}>
          <RoundedBox args={[0.62, 0.04, 0.025]} radius={0.012} smoothness={2} position={[0.27, 0, 0]}>
            <meshPhysicalMaterial color={INK} roughness={0.35} clearcoat={1} />
          </RoundedBox>
        </group>
        <mesh position={[0, 0, 0.09]} scale={0.075}>
          <sphereGeometry args={[1, 24, 24]} />
          <Chrome />
        </mesh>
        {PILL_GLYPHS.map((glyph, k) => (
          <group key={k} ref={(g) => (pills.current[k] = g)} position={[-0.75 + k * 0.5, -1.14, 0.1]}>
            <RoundedBox args={[0.42, 0.16, 0.14]} radius={0.07} smoothness={4}>
              <meshPhysicalMaterial color="#eef3f3" roughness={0.4} clearcoat={0.6} />
            </RoundedBox>
            <group position={[0, 0, 0.075]}>{glyph}</group>
          </group>
        ))}
      </group>
    </group>
  );
}

function Handset({ screen = COBALT, screenRef, ...props }) {
  return (
    <group {...props}>
      <RoundedBox args={[0.9, 1.8, 0.1]} radius={0.1} smoothness={6}>
        <Chrome />
      </RoundedBox>
      <mesh position={[0, 0, 0.052]}>
        <planeGeometry args={[0.78, 1.66]} />
        <meshPhysicalMaterial ref={screenRef} color={screen} roughness={0.2} clearcoat={1} />
      </mesh>
    </group>
  );
}

// Children draw on the screen, in the lid's frame: x in -1.02..1.02, y in 0.075..1.375, z 0.036.
function Laptop({ lidRef, still, children }) {
  return (
    <>
      <RoundedBox args={[2.2, 0.08, 1.5]} radius={0.03} smoothness={4}>
        <Clay />
      </RoundedBox>
      <group ref={lidRef} position={[0, 0.04, -0.75]} rotation={[still ? -0.28 : Math.PI / 2, 0, 0]}>
        <RoundedBox args={[2.2, 1.45, 0.06]} radius={0.03} smoothness={4} position={[0, 0.725, 0]}>
          <Clay />
        </RoundedBox>
        <mesh position={[0, 0.725, 0.032]}>
          <planeGeometry args={[2.04, 1.3]} />
          <meshPhysicalMaterial color={INK} roughness={0.3} clearcoat={1} />
        </mesh>
        {children}
      </group>
    </>
  );
}

// PocketDesk: the phone sends commands to the PC through a QUIC relay, the agent's terminal types
// them out, its permission prompt comes back to the phone as a diff card and is approved, then the
// desktop streams to the phone one frame group at a time.
const LINES = [0.9, 0.6, 1.1, 0.75, 0.5];
const PHONE_AT = [1.85, 0.05, 1.0];
const RELAY_AT = [2.0, 1.5, 0.45];
const SCREEN_AT = [0.25, 0.8, -0.5];
const FRAMES = 4;
const FRAME_TINT = ['#2b3440', '#34404c', '#2b3440', '#34404c'];

const deskInit = () => ({
  lid: 0,
  turn: 0,
  cmds: [0, 1, 2].map(() => ({ k: 0 })),
  type: 0,
  diff: 0,
  ok: 0,
  frames: Array.from({ length: FRAMES }, () => ({ k: 0 })),
  view: 0,
});

function deskStory({ intro, loop }, s) {
  intro.add(s, { lid: [0, 1], duration: 1400 }).add(s, { turn: [0, 1], duration: 900, ease: OUT }, 500);
  s.cmds.forEach((c, i) => loop.add(c, { k: [0, 1], duration: 1100 }, i * 160));
  loop
    .add(s, { type: [0, 1], duration: 1300, ease: 'linear' }, 1200)
    .add(s, { diff: [0, 1], duration: 1000 }, 2700)
    .add(s, { ok: [0, 1], duration: 250, ease: OUT }, 3800)
    .add(s, { ok: 0, duration: 450 }, 4100);
  s.frames.forEach((f, i) => loop.add(f, { k: [0, 1], duration: 1100, ease: 'linear' }, 4500 + i * 280));
  loop
    .add(s, { view: [0, 1], duration: 400 }, 5500)
    .add(s, { view: 0, duration: 400 }, 7600)
    .add(s, { type: 0, duration: 400 }, 7000)
    .add(s, { diff: 0, duration: 1 }, 7000)
    .add(s.frames, { k: 0, duration: 1 }, 7400)
    .add(s, { view: 0, duration: 1 }, 8100);
}

const SCREEN_IDLE_DESK = new THREE.Color('#eef3f3');
const SCREEN_STREAM = new THREE.Color('#2b3440');

function Desk({ still, color, delay }) {
  const s = useStory(deskInit, deskStory, { delay, still, at: 0.55 });
  const lid = useRef();
  const phone = useRef();
  const screen = useRef();
  const relay = useRef();
  const cmds = useRef([]);
  const lines = useRef([]);
  const diff = useRef();
  const frames = useRef([]);
  const lit = useMemo(() => new THREE.Color(color), [color]);
  const paths = useMemo(() => {
    const v = (a) => new THREE.Vector3(...a);
    return {
      up: new THREE.CatmullRomCurve3([v([PHONE_AT[0], 0.5, PHONE_AT[2]]), v(RELAY_AT), v(SCREEN_AT)]),
      down: new THREE.CatmullRomCurve3([v(SCREEN_AT), v(RELAY_AT), v([PHONE_AT[0], 0.35, PHONE_AT[2] + 0.1])]),
    };
  }, []);
  useFrame((state, dt) => {
    if (lid.current) lid.current.rotation.x = lerp(Math.PI / 2, -0.28, s.lid);
    if (phone.current) {
      phone.current.rotation.y = lerp(1.6, 0.4, s.turn);
      phone.current.position.y = PHONE_AT[1] + (still ? 0 : Math.sin(state.clock.elapsedTime * 1.3) * 0.04);
    }
    if (relay.current) relay.current.rotation.z += dt * 0.8;
    cmds.current.forEach((m, i) => {
      if (!m) return;
      const k = s.cmds[i].k;
      m.position.copy(paths.up.getPointAt(k));
      m.visible = k > 0.01 && k < 0.99;
    });
    lines.current.forEach((m, i) => {
      if (!m) return;
      const grow = THREE.MathUtils.clamp(s.type * LINES.length - i, 0, 1);
      m.scale.x = Math.max(0.001, grow);
      m.position.x = -0.95 + (LINES[i] * m.scale.x) / 2;
    });
    if (diff.current) {
      diff.current.position.copy(paths.down.getPointAt(s.diff));
      diff.current.rotation.set(0, lerp(0, 0.4, s.diff), 0);
      diff.current.visible = s.diff > 0.01 && s.diff < 0.99;
    }
    frames.current.forEach((m, i) => {
      if (!m) return;
      const k = s.frames[i].k;
      m.position.copy(paths.down.getPointAt(k));
      m.rotation.set(0, lerp(0, 0.4, k), 0);
      m.visible = k > 0.01 && k < 0.99;
    });
    screen.current?.color.copy(SCREEN_IDLE_DESK).lerp(SCREEN_STREAM, s.view).lerp(lit, s.ok);
  });
  return (
    <group rotation={[0.32, -0.55, 0]} position={[-0.45, -0.2, 0]} scale={0.8}>
      <Laptop lidRef={lid} still={still}>
        {LINES.map((w, i) => (
          <mesh key={i} ref={(m) => (lines.current[i] = m)} position={[-0.95, 1.2 - i * 0.2, 0.036]}>
            <planeGeometry args={[w, 0.07]} />
            <meshBasicMaterial color={i % 2 ? '#8fb3c9' : color} toneMapped={false} />
          </mesh>
        ))}
      </Laptop>
      <group ref={phone} position={PHONE_AT}>
        <Handset scale={0.62} screen="#eef3f3" screenRef={screen} />
      </group>
      <group position={RELAY_AT}>
        <mesh ref={relay}>
          <torusGeometry args={[0.16, 0.022, 12, 48]} />
          <Chrome />
        </mesh>
        <mesh scale={0.06}>
          <sphereGeometry args={[1, 20, 20]} />
          <Accent color={color} />
        </mesh>
      </group>
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(m) => (cmds.current[i] = m)} scale={0.05}>
          <sphereGeometry args={[1, 16, 16]} />
          <Accent color={color} />
        </mesh>
      ))}
      <group ref={diff}>
        <RoundedBox args={[0.42, 0.3, 0.015]} radius={0.012} smoothness={2}>
          <Clay />
        </RoundedBox>
        {[0, 1, 2].map((r) => (
          <mesh key={r} position={[-0.02, 0.07 - r * 0.07, 0.009]}>
            <planeGeometry args={[0.3 - r * 0.05, 0.03]} />
            <meshBasicMaterial color={r === 1 ? color : r === 2 ? '#8fb3c9' : INK} toneMapped={false} />
          </mesh>
        ))}
      </group>
      {Array.from({ length: FRAMES }, (_, i) => (
        <group key={i} ref={(g) => (frames.current[i] = g)}>
          <RoundedBox args={[0.46, 0.3, 0.012]} radius={0.01} smoothness={2}>
            <meshPhysicalMaterial color={FRAME_TINT[i]} roughness={0.3} clearcoat={1} />
          </RoundedBox>
          <mesh position={[-0.1 + i * 0.05, 0.03, 0.008]}>
            <planeGeometry args={[0.14, 0.09]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Case Files: every player's case file carries its own seal, derived from their seed. An answer
// slips out of one file into another; the magnifier reads the slip's seal and a thread runs back
// to the file it came from.
const FOLDER_X = [-0.95, 0, 0.95];
// Seal i lights the dots of a 3x3 grid named by its bits; each file's pattern is unique.
const SEALS = [0b101010011, 0b011100110, 0b110001101];
const sealDots = (bits) => Array.from({ length: 9 }, (_, d) => [((d % 3) - 1) * 0.07, (1 - Math.floor(d / 3)) * 0.07, (bits >> d) & 1]);
const SLIP_HOME = new THREE.Vector3(FOLDER_X[0], 0.05, 0);
const SLIP_UP = new THREE.Vector3(FOLDER_X[0], 0.72, 0.1);
const SLIP_COPY = new THREE.Vector3(FOLDER_X[2] - 0.05, 0.05, 0.12);
const LENS_AWAY = new THREE.Vector3(1.5, 0.9, 0.5);
const LENS_ON = new THREE.Vector3(FOLDER_X[2] - 0.05, 0.05, 0.4);
const SEAL_0 = new THREE.Vector3(FOLDER_X[0] + 0.2, 0.3, 0.05);
const THREAD_N = 48;
const THREAD = new Float32Array(
  new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(SLIP_COPY.x, SLIP_COPY.y + 0.12, SLIP_COPY.z + 0.02),
    new THREE.Vector3(0, 0.95, 0.35),
    new THREE.Vector3(SEAL_0.x, SEAL_0.y + 0.1, SEAL_0.z + 0.04),
  )
    .getPoints(THREAD_N - 1)
    .flatMap((v) => v.toArray()),
);

const filesInit = () => ({ folders: FOLDER_X.map(() => ({ up: 0 })), out: 0, go: 0, lens: 0, thread: 0, pulse: 0, back: 0 });

function filesStory({ intro, loop }, s) {
  intro.add(s.folders, { up: [0, 1], duration: 900, ease: OUT, delay: stagger(110) });
  loop
    .add(s, { out: [0, 1], duration: 650, ease: OUT })
    .add(s, { go: [0, 1], duration: 1000 })
    .add(s, { lens: [0, 1], duration: 850 }, '+=150')
    .add(s, { thread: [0, 1], duration: 750, ease: 'linear' })
    .add(s, { pulse: [0, 1], duration: 300, ease: OUT })
    .add(s, { pulse: 0, duration: 450 }, '+=250')
    .add(s, { lens: 0, thread: 0, duration: 650 }, '+=500')
    .add(s, { back: [0, 1], duration: 1000 })
    .add(s, { out: 0, go: 0, back: 0, duration: 1 }, '+=300');
}

function Files({ still, color, delay }) {
  const s = useStory(filesInit, filesStory, { delay, still, at: 0.5 });
  const folders = useRef([]);
  const slip = useRef();
  const lens = useRef();
  const thread = useRef();
  const seal0 = useRef();
  useFrame(() => {
    folders.current.forEach((g, i) => g && (g.position.y = lerp(-1.6, 0, s.folders[i].up)));
    if (slip.current) {
      // Out of its own file, across to another, and later home again over the same arc.
      const across = s.back > 0 ? 1 - s.back : s.go;
      const at = slip.current.position;
      at.lerpVectors(SLIP_HOME, SLIP_UP, s.out);
      if (across > 0) {
        at.lerpVectors(SLIP_UP, SLIP_COPY, across);
        at.y += Math.sin(across * Math.PI) * 0.35;
      }
      if (s.back >= 1) at.copy(SLIP_HOME);
    }
    lens.current?.position.lerpVectors(LENS_AWAY, LENS_ON, s.lens);
    thread.current?.geometry.setDrawRange(0, Math.floor(s.thread * THREAD_N));
    if (seal0.current) seal0.current.position.z = 0.025 + s.pulse * 0.12;
  });
  return (
    <group rotation={[-0.12, -0.35, 0]} scale={0.95}>
      {FOLDER_X.map((x, i) => (
        <group key={i} ref={(g) => (folders.current[i] = g)} position={[x, 0, -i * 0.05]} rotation={[0, 0, (i - 1) * -0.06]}>
          <RoundedBox args={[0.8, 1.05, 0.04]} radius={0.02} smoothness={3}>
            <Clay />
          </RoundedBox>
          <RoundedBox args={[0.3, 0.12, 0.04]} radius={0.02} smoothness={3} position={[-0.2, 0.56, 0]}>
            <Clay />
          </RoundedBox>
          <mesh position={[-0.12, 0.38, 0.022]}>
            <planeGeometry args={[0.38, 0.035]} />
            <meshBasicMaterial color={INK} />
          </mesh>
          {[0, 1, 2, 3].map((r) => (
            <mesh key={r} position={[-0.08 - (r % 2) * 0.05, 0.1 - r * 0.11, 0.022]}>
              <planeGeometry args={[0.5 - (r % 2) * 0.1, 0.025]} />
              <meshBasicMaterial color="#8fb3c9" />
            </mesh>
          ))}
          <group ref={i === 0 ? seal0 : undefined} position={[0.2, 0.3, 0.025]}>
            {sealDots(SEALS[i]).map(([dx, dy, on], d) => (
              <mesh key={d} position={[dx, dy, 0]}>
                <circleGeometry args={[0.024, 16]} />
                <meshBasicMaterial color={on ? color : '#cfd8db'} toneMapped={false} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
      <group ref={slip} position={SLIP_HOME.toArray()}>
        <RoundedBox args={[0.36, 0.24, 0.015]} radius={0.01} smoothness={2}>
          <meshPhysicalMaterial color="#ffffff" roughness={0.4} clearcoat={0.5} />
        </RoundedBox>
        <group position={[0.08, 0, 0.009]} scale={0.8}>
          {sealDots(SEALS[0]).map(([dx, dy, on], d) => (
            <mesh key={d} position={[dx, dy, 0]}>
              <circleGeometry args={[0.024, 16]} />
              <meshBasicMaterial color={on ? color : '#cfd8db'} toneMapped={false} />
            </mesh>
          ))}
        </group>
        <mesh position={[-0.1, 0.04, 0.009]}>
          <planeGeometry args={[0.1, 0.025]} />
          <meshBasicMaterial color={INK} />
        </mesh>
      </group>
      <group ref={lens} position={LENS_AWAY.toArray()} rotation={[0, 0, -0.6]}>
        <mesh>
          <torusGeometry args={[0.2, 0.03, 16, 64]} />
          <Chrome />
        </mesh>
        <mesh position={[0, -0.36, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.32, 16]} />
          <Accent color={color} />
        </mesh>
      </group>
      <line ref={thread}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[THREAD, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color={color} toneMapped={false} />
      </line>
    </group>
  );
}

// Ping: above each phone a hand closes from open into the same sign. Both lock, the same six-digit
// check lights on both screens, the phones turn to each other and the sealed card crosses.
const SCREEN_IDLE = new THREE.Color('#eef3f3');
const DIGIT_DIM = new THREE.Color('#cfd8db');
const FINGER_X = [-0.18, -0.06, 0.06, 0.18];
const FINGER_LEN = [0.36, 0.44, 0.42, 0.32];
// Peace sign: index and middle stay up; ring, little finger and thumb fold.
const FOLDS = [1, 0, 0, 1, 1];

function Hand({ setFinger, setRing }) {
  return (
    <group>
      <RoundedBox args={[0.5, 0.52, 0.14]} radius={0.07} smoothness={4}>
        <Clay />
      </RoundedBox>
      {FINGER_X.map((x, i) => (
        <group key={i} ref={(g) => setFinger(i, g)} position={[x, 0.24, 0]}>
          <mesh position={[0, FINGER_LEN[3 - i] / 2 + 0.02, 0]}>
            <capsuleGeometry args={[0.052, FINGER_LEN[3 - i], 6, 12]} />
            <Clay />
          </mesh>
        </group>
      ))}
      <group ref={(g) => setFinger(4, g)} position={[-0.25, -0.05, 0]} rotation={[0, 0, 0.75]}>
        <mesh position={[0, 0.14, 0]}>
          <capsuleGeometry args={[0.052, 0.2, 6, 12]} />
          <Clay />
        </mesh>
      </group>
      <mesh position={[0, 0.1, -0.12]}>
        <torusGeometry args={[0.5, 0.012, 8, 96]} />
        <meshBasicMaterial ref={setRing} color="#cfd8db" toneMapped={false} />
      </mesh>
    </group>
  );
}

const pairInit = () => ({ curl: 0, lock: 0, digits: Array.from({ length: 6 }, () => ({ on: 0 })), face: 0, send: 0, glow: 0 });

function pairStory({ loop }, s) {
  loop
    .add(s, { curl: [0, 1], duration: 900 }, 300)
    .add(s, { lock: [0, 1], duration: 300, ease: OUT }, 1200)
    .add(s.digits, { on: [0, 1], duration: 220, delay: stagger(90) }, 1500)
    .add(s, { face: [0, 1], duration: 700 }, 2400)
    .add(s, { send: [0, 1], duration: 1300 }, 3100)
    .add(s, { glow: [0, 1], duration: 250, ease: OUT }, 4300)
    .add(s, { glow: 0, duration: 500 }, 4900)
    .add(s, { face: 0, lock: 0, duration: 700 }, 5400)
    .add(s.digits, { on: 0, duration: 300 }, 5400)
    .add(s, { curl: 0, send: 0, duration: 800 }, 5700);
}

function Pair({ still, color, delay }) {
  const s = useStory(pairInit, pairStory, { delay, still, at: 0.42 });
  const phones = useRef([]);
  const screens = useRef([]);
  const fingers = useRef([]);
  const rings = useRef([]);
  const digits = useRef([]);
  const beads = useRef();
  const lit = useMemo(() => new THREE.Color(color), [color]);
  const curve = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.68, -0.2, 0.25), new THREE.Vector3(0, 0.55, 0.45), new THREE.Vector3(0.68, -0.2, 0.25)),
    [],
  );
  useFrame(() => {
    const turn = lerp(0.12, 0.6, s.face);
    phones.current.forEach((g, p) => g && (g.rotation.y = p ? -turn : turn));
    fingers.current.forEach((g, n) => {
      if (!g) return;
      const i = n % 5;
      const fold = FOLDS[i] * s.curl;
      if (i === 4) g.rotation.set(0, fold * 1.1, 0.75 - fold * 0.9);
      else {
        g.rotation.x = -fold * 2.4;
        // The two raised fingers spread into a V.
        g.rotation.z = FOLDS[i] ? 0 : s.curl * (i === 1 ? 0.22 : -0.22);
      }
    });
    rings.current.forEach((r) => r?.color.copy(DIGIT_DIM).lerp(lit, s.lock));
    digits.current.forEach((m, i) => m?.color.copy(DIGIT_DIM).lerp(lit, s.digits[i % 6].on));
    beads.current?.children.forEach((b, i) => {
      const k = span(s.send, i * 0.06, 0.7 + i * 0.06);
      b.position.copy(curve.getPointAt(easeInOut(k)));
      b.visible = !still && k > 0 && k < 1;
    });
    screens.current.forEach((sc) => sc?.color.copy(SCREEN_IDLE).lerp(lit, s.glow));
  });
  return (
    <group position={[0, -0.45, 0]} scale={0.85}>
      {[-1, 1].map((side, p) => (
        <group key={side}>
          <group ref={(g) => (phones.current[p] = g)} position={[side * 0.95, -0.15, 0]}>
            <Handset scale={0.68} screen="#eef3f3" screenRef={(m) => (screens.current[p] = m)} />
            {Array.from({ length: 6 }, (_, d) => (
              <mesh key={d} position={[-0.2 + d * 0.08, 0.25, 0.04]}>
                <boxGeometry args={[0.055, 0.09, 0.01]} />
                <meshBasicMaterial ref={(m) => (digits.current[p * 6 + d] = m)} color="#cfd8db" toneMapped={false} />
              </mesh>
            ))}
          </group>
          <group position={[side * 0.95, 1.25, 0.1]} scale={1.0} rotation={[0.15, side * -0.3, 0]}>
            <Hand setFinger={(i, g) => (fingers.current[p * 5 + i] = g)} setRing={(m) => (rings.current[p] = m)} />
          </group>
        </group>
      ))}
      <group ref={beads}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} scale={0.06}>
            <sphereGeometry args={[1, 24, 24]} />
            <Accent color={color} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Trace i sits on one of the chip's four sides; `d` is its distance from the centre.
const TRACE_OFFSETS = [-0.36, -0.12, 0.12, 0.36];
function trace(i, d) {
  const side = i % 4;
  const o = TRACE_OFFSETS[i >> 2];
  if (side === 0) return [o, d];
  if (side === 1) return [o, -d];
  if (side === 2) return [d, o];
  return [-d, o];
}

// RISC-V attn: signals run in along the pins, the die lifts and turns as the instruction executes,
// then seats back into the package.
function Chip({ still, color, delay }) {
  const clock = useClock(delay);
  const die = useRef();
  const signals = useRef();
  const pins = useMemo(() => {
    const out = [];
    for (let i = 0; i < 8; i++) {
      const o = -0.84 + i * 0.24;
      out.push([o, 1.12, 0], [o, -1.12, 0], [1.12, o, 0], [-1.12, o, 0]);
    }
    return out;
  }, []);
  useFrame((state) => {
    const t = still ? 0 : clock(state);
    const p = (t % 6) / 6;
    const lift = easeInOut(span(p, 0.3, 0.45)) * (1 - easeOut(span(p, 0.7, 0.85)));
    if (die.current) {
      die.current.position.z = 0.13 + lift * 0.5;
      die.current.rotation.z = easeInOut(span(p, 0.4, 0.65)) * (Math.PI / 2);
    }
    signals.current?.children.forEach((s, i) => {
      const k = easeInOut(span(p, 0.02 + (i >> 2) * 0.05 + (i % 4) * 0.012, 0.22 + (i >> 2) * 0.05 + (i % 4) * 0.012));
      const [x, y] = trace(i, lerp(1.1, 0.58, k));
      s.position.set(x, y, 0.105);
      s.visible = !still && k > 0 && k < 1;
    });
  });
  return (
    <group rotation={[-0.9, 0, 0.5]}>
      <RoundedBox args={[2.1, 2.1, 0.18]} radius={0.04} smoothness={4}>
        <meshPhysicalMaterial color="#1b2127" roughness={0.45} clearcoat={0.6} />
      </RoundedBox>
      <group ref={die} position={[0, 0, 0.13]}>
        <RoundedBox args={[1.1, 1.1, 0.1]} radius={0.03} smoothness={4}>
          <Accent color={color} />
        </RoundedBox>
      </group>
      <Instances limit={pins.length}>
        <boxGeometry args={[0.1, 0.1, 0.06]} />
        <Chrome />
        {pins.map((p, i) => (
          <Instance key={i} position={p} scale={[i % 4 < 2 ? 1 : 1.6, i % 4 < 2 ? 1.6 : 1, 1]} />
        ))}
      </Instances>
      {Array.from({ length: 16 }, (_, i) => {
        const [x, y] = trace(i, 0.84);
        const along = i % 4 < 2;
        return (
          <mesh key={i} position={[x, y, 0.092]}>
            <boxGeometry args={along ? [0.03, 0.54, 0.004] : [0.54, 0.03, 0.004]} />
            <meshBasicMaterial color="#5c6b78" />
          </mesh>
        );
      })}
      <group ref={signals}>
        {Array.from({ length: 16 }, (_, i) => (
          <mesh key={i}>
            <boxGeometry args={[0.07, 0.07, 0.03]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// A key lying along +x: bow at the origin, teeth near x = 0.9, tip at x = 1.2. `mat` makes one
// material per mesh.
function KeyBody({ mat }) {
  return (
    <group>
      <mesh>
        <torusGeometry args={[0.26, 0.075, 24, 64]} />
        {mat()}
      </mesh>
      <RoundedBox args={[0.95, 0.13, 0.08]} radius={0.03} smoothness={3} position={[0.735, 0, 0]}>
        {mat()}
      </RoundedBox>
      <RoundedBox args={[0.09, 0.17, 0.08]} radius={0.02} smoothness={3} position={[0.8, -0.13, 0]}>
        {mat()}
      </RoundedBox>
      <RoundedBox args={[0.09, 0.12, 0.08]} radius={0.02} smoothness={3} position={[0.95, -0.105, 0]}>
        {mat()}
      </RoundedBox>
    </group>
  );
}

// Key Router: a Claude Code session on the laptop holds a disposable gateway key. Its requests go
// to the Cloudflare edge, which swaps in the real key and calls the provider; replies stream back
// into the terminal. The edge's TTL dial drains, and the expired key turns and drops away.
const TICKS = 24;
const TICK_OFF = new THREE.Color('#cfd8db');
const arc = (a, b, lift) =>
  new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(...a),
    new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + lift, (a[2] + b[2]) / 2 + 0.2),
    new THREE.Vector3(...b),
  );

const PUFFS = [
  [0, 0, 0, 0.42],
  [-0.42, -0.1, 0, 0.3],
  [0.43, -0.08, 0, 0.32],
  [-0.2, 0.24, 0, 0.3],
  [0.22, 0.26, 0.05, 0.28],
  [0, -0.16, 0.15, 0.3],
];
// Edge locations: dots on the cloud's front surface that no other puff covers.
const EDGE_DOTS = (() => {
  const out = [];
  PUFFS.forEach(([x, y, z, r], k) => {
    const n = 90;
    for (let i = 0; i < n; i++) {
      const v = 1 - (i / (n - 1)) * 2;
      const rr = Math.sqrt(1 - v * v);
      const a = i * 2.399963;
      const p = [x + Math.cos(a) * rr * r * 1.02, y + v * r * 1.02, z + Math.sin(a) * rr * r * 1.02];
      const covered = PUFFS.some(([ox, oy, oz, or], j) => j !== k && Math.hypot(p[0] - ox, p[1] - oy, p[2] - oz) < or);
      const onDial = Math.hypot(p[0], p[1] - 0.02) < 0.3 && p[2] > 0.3;
      if (!covered && !onDial && p[2] > z && (i * 7) % 5 < 1) out.push(p);
    }
  });
  return out;
})();

// Claude Code's welcome box, drawn as four hairlines on the screen.
const BOX = [
  [0, 1.29, 1.8, 0.012],
  [0, 1.03, 1.8, 0.012],
  [-0.9, 1.16, 0.012, 0.27],
  [0.9, 1.16, 0.012, 0.27],
];
const REPLY = [1.3, 0.9, 1.5, 0.7];

function Edge({ still, color, delay }) {
  const clock = useClock(delay);
  const lid = useRef();
  const star = useRef();
  const lines = useRef([]);
  const gate = useRef();
  const real = useRef();
  const ticks = useRef([]);
  const out = useRef();
  const back = useRef();
  const lit = useMemo(() => new THREE.Color(color), [color]);
  const paths = useMemo(
    () => ({
      toEdge: arc([-0.15, 0.72, 0.3], [-0.05, 0.8, 0.4], 0.35),
      toModel: arc([1.0, 0.2, 0.25], [1.15, -0.08, 0.25], 0.25),
      fromModel: arc([1.15, -0.4, 0.3], [0.6, 0.35, 0.4], -0.3),
      fromEdge: arc([0.0, 0.3, 0.45], [-0.8, 0.1, 0.4], -0.4),
    }),
    [],
  );
  useFrame((state, dt) => {
    const t = still ? 0 : clock(state);
    if (lid.current) lid.current.rotation.x = still ? -0.28 : lerp(Math.PI / 2, -0.28, easeInOut(span(t, 0.1, 1.2)));
    if (real.current) real.current.position.x = still ? 0 : lerp(-0.45, 0, easeOut(span(t, 0.3, 1.3)));
    const p = still ? 0.62 : t > 1.4 ? ((t - 1.4) % 9) / 9 : 0;
    const busy = p > 0.12 && p < 0.7;
    if (star.current && !still) star.current.rotation.z -= dt * (busy ? 4 : 0.6);
    if (gate.current) {
      const up = easeOut(span(p, 0, 0.1)) * (1 - easeInOut(span(p, 0.88, 0.97)));
      gate.current.position.y = lerp(0.05, 0.62, up);
      gate.current.rotation.x = (Math.PI / 2) * Math.max(1 - up, easeInOut(span(p, 0.82, 0.88)));
    }
    const left = TICKS * Math.min(span(p, 0.02, 0.12), 1 - span(p, 0.14, 0.82));
    ticks.current.forEach((m, i) => m?.color.copy(TICK_OFF).lerp(lit, THREE.MathUtils.clamp(left - i, 0, 1)));
    const move = (group, path, a, gap, len) =>
      group?.children.forEach((b, i) => {
        const k = span(p, a + i * gap, a + i * gap + len);
        b.position.copy(path.getPointAt(easeInOut(k)));
        b.visible = !still && k > 0 && k < 1;
      });
    move(out.current?.children[0], paths.toEdge, 0.12, 0.04, 0.14);
    move(out.current?.children[1], paths.toModel, 0.26, 0.04, 0.14);
    move(back.current?.children[0], paths.fromModel, 0.42, 0.025, 0.12);
    move(back.current?.children[1], paths.fromEdge, 0.52, 0.025, 0.14);
    lines.current.forEach((m, i) => {
      if (!m) return;
      const grow = still ? 1 : easeOut(span(p, 0.58 + i * 0.04, 0.68 + i * 0.04)) * (1 - span(p, 0.93, 1));
      m.scale.x = Math.max(0.001, grow);
      m.position.x = -0.82 + (REPLY[i] * m.scale.x) / 2;
    });
  });
  return (
    <group rotation={[0.18, -0.25, 0]} position={[0.05, -0.2, 0]} scale={0.92}>
      <group position={[-0.8, -0.6, 0.15]} rotation={[0, 0.45, 0]} scale={0.6}>
        <Laptop lidRef={lid} still={still}>
          {BOX.map(([x, y, w, h], i) => (
            <mesh key={i} position={[x, y, 0.036]}>
              <planeGeometry args={[w, h]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
          ))}
          <group ref={star} position={[-0.72, 1.16, 0.037]}>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <mesh key={i} rotation={[0, 0, (i * Math.PI) / 6]}>
                <planeGeometry args={[0.22, 0.032]} />
                <meshBasicMaterial color={color} toneMapped={false} />
              </mesh>
            ))}
          </group>
          <mesh position={[-0.15, 1.16, 0.036]}>
            <planeGeometry args={[0.9, 0.06]} />
            <meshBasicMaterial color="#8fb3c9" toneMapped={false} />
          </mesh>
          <mesh position={[-0.9, 0.86, 0.036]} rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[0.07, 0.07]} />
            <meshBasicMaterial color={color} toneMapped={false} />
          </mesh>
          {REPLY.map((w, i) => (
            <mesh key={i} ref={(m) => (lines.current[i] = m)} position={[-0.82, 0.86 - i * 0.17, 0.036]}>
              <planeGeometry args={[w, 0.06]} />
              <meshBasicMaterial color={i ? '#8fb3c9' : '#dfe6f1'} toneMapped={false} />
            </mesh>
          ))}
        </Laptop>
      </group>

      <group ref={gate} position={[-0.65, 0.62, 0.3]}>
        <group rotation={[0, 0, 0.25]} scale={0.42}>
          <KeyBody mat={() => <Accent color={color} />} />
        </group>
      </group>

      <group position={[0.35, 0.62, 0]}>
        {PUFFS.map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]} scale={r}>
            <sphereGeometry args={[1, 48, 48]} />
            <Clay />
          </mesh>
        ))}
        <Instances limit={EDGE_DOTS.length}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <Accent color={color} />
          {EDGE_DOTS.map((d, i) => (
            <Instance key={i} position={d} />
          ))}
        </Instances>
        {Array.from({ length: TICKS }, (_, i) => {
          const a = Math.PI / 2 - (i / TICKS) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 0.17, 0.02 + Math.sin(a) * 0.17, 0.47]} rotation={[0, 0, a]}>
              <boxGeometry args={[0.05, 0.016, 0.006]} />
              <meshBasicMaterial ref={(m) => (ticks.current[i] = m)} color={color} toneMapped={false} />
            </mesh>
          );
        })}
        <group position={[0.4, -0.18, 0.05]} rotation={[0, 0, -0.62]}>
          <group ref={real}>
            <group scale={0.55}>
              <KeyBody mat={() => <Chrome />} />
            </group>
          </group>
        </group>
      </group>

      <group position={[1.15, -0.5, 0]} rotation={[0, -0.35, 0]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, i * 0.17, 0]}>
            <RoundedBox args={[0.6, 0.14, 0.46]} radius={0.03} smoothness={3}>
              <Chrome />
            </RoundedBox>
            <mesh position={[0.2, 0, 0.232]}>
              <boxGeometry args={[0.1, 0.025, 0.004]} />
              <meshBasicMaterial color={color} toneMapped={false} />
            </mesh>
          </group>
        ))}
      </group>

      <group ref={out}>
        {[
          (i) => <Accent key={i} color={color} />,
          (i) => <Chrome key={i} />,
        ].map((mat, g) => (
          <group key={g}>
            {[0, 1, 2].map((i) => (
              <mesh key={i} scale={0.045}>
                <sphereGeometry args={[1, 16, 16]} />
                {mat(i)}
              </mesh>
            ))}
          </group>
        ))}
      </group>
      <group ref={back}>
        {[
          (i) => <Chrome key={i} />,
          (i) => <Accent key={i} color={color} />,
        ].map((mat, g) => (
          <group key={g}>
            {[0, 1, 2, 3, 4].map((i) => (
              <mesh key={i} scale={0.03}>
                <sphereGeometry args={[1, 12, 12]} />
                {mat(i)}
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </group>
  );
}

const SHAPES = { council: Council, globe: Globe, rings: Recovery, phone: Desk, files: Files, pair: Pair, chip: Chip, key: Edge };

// Turntable swap that never leaves the frame: the current object turns edge-on, the next turns
// in from the other side and replays its entrance.
export function SwapArtifact({ shape, color, still }) {
  const [shown, setShown] = useState({ shape, color, at: null });
  const ref = useRef();
  const leaving = useRef(null);
  const arrived = useRef(null);
  useFrame((state) => {
    const g = ref.current;
    if (!g) return;
    const now = state.clock.elapsedTime;
    if (shown.shape !== shape) {
      if (leaving.current === null) leaving.current = now;
      const k = easeInOut(span(now - leaving.current, 0, 0.35));
      g.rotation.y = k * (Math.PI / 2);
      g.scale.setScalar(1 - k * 0.12);
      if (k >= 1) {
        leaving.current = null;
        arrived.current = null;
        setShown({ shape, color });
      }
      return;
    }
    if (arrived.current === null) arrived.current = now;
    const k = easeOut(span(now - arrived.current, 0, 0.7));
    g.rotation.y = lerp(-Math.PI / 2, 0, k);
    g.scale.setScalar(lerp(0.88, 1, k));
  });
  const calm = useReducedMotion();
  if (still || calm) return <Artifact key={shape} shape={shape} color={color} still={still} />;
  return (
    <group ref={ref}>
      <Artifact key={shown.shape} shape={shown.shape} color={shown.color} still={still} />
    </group>
  );
}

export function Artifact({ shape, color, still, delay = 0, tilt = 0.3 }) {
  const calm = useReducedMotion();
  const ref = useTilt(calm ? 0 : tilt, still);
  const Shape = SHAPES[shape];
  return (
    <group ref={ref}>
      <Float speed={still || calm ? 0 : 1.2} rotationIntensity={0.15} floatIntensity={0.4}>
        <Shape still={still} color={color} delay={delay} />
      </Float>
    </group>
  );
}

// Hero: an atom whose electrons are the projects. Each runs its own story in miniature on a
// tilted orbit around a nucleus made of every project's colour. Pointing at one stops the orbits
// and names it; clicking opens it.
const ORBITS = [
  { tilt: [1.15, 0, 0.35], r: 1.45, speed: 0.22 },
  { tilt: [1.15, 0, -1.0], r: 1.65, speed: -0.18 },
  { tilt: [0.35, 0.9, 0.1], r: 1.85, speed: 0.15 },
  { tilt: [1.9, -0.6, 0.5], r: 2.05, speed: -0.12 },
];
const SEAT = new THREE.Vector3();
const NUCLEUS = Array.from({ length: 8 }, (_, i) => {
  const y = 1 - (i / 7) * 2;
  const r = Math.sqrt(1 - y * y);
  const a = i * 2.399963;
  return [Math.cos(a) * r * 0.2, y * 0.2, Math.sin(a) * r * 0.2];
});

export function HeroOrrery({ projects, hovered, onHover, onPick }) {
  const calm = useReducedMotion();
  const tilt = useTilt(calm ? 0 : 0.35);
  const angle = useRef(0);
  const orbits = useRef([]);
  const electrons = useRef([]);
  const core = useRef([]);
  useFrame((state, dt) => {
    if (!calm && hovered === null) angle.current += dt;
    orbits.current.forEach((g, i) => g && (g.rotation.z = angle.current * ORBITS[i].speed));
    electrons.current.forEach((g, i) => {
      if (!g) return;
      const k = 1 - Math.exp(-dt * 8);
      const s = g.scale.x + ((hovered === i ? 0.36 : 0.26) - g.scale.x) * k;
      g.scale.setScalar(s);
      // Cancel every parent rotation so each miniature stays upright, facing the viewer.
      g.parent.getWorldQuaternion(g.quaternion).invert();
    });
    core.current.forEach((m, i) => {
      if (!m) return;
      const k = 1 - Math.exp(-dt * 6);
      m.position.lerp(SEAT.fromArray(NUCLEUS[i]).multiplyScalar(hovered === i ? 1.9 : 1), k);
    });
  });
  const enter = (i) => (e) => {
    e.stopPropagation();
    onHover(i);
  };
  const leave = () => onHover(null);
  return (
    <group ref={tilt}>
      <Spin speed={calm ? 0 : 0.25}>
        {NUCLEUS.map((p, i) => (
          <mesh key={i} ref={(m) => (core.current[i] = m)} position={p} scale={0.15}>
            <sphereGeometry args={[1, 32, 32]} />
            <Accent color={projects[i % projects.length].color} />
          </mesh>
        ))}
      </Spin>
      {ORBITS.map((o, i) => (
        <group key={i} rotation={o.tilt}>
          <mesh>
            <torusGeometry args={[o.r, 0.005, 8, 200]} />
            <meshBasicMaterial color={INK} transparent opacity={0.18} />
          </mesh>
          <group ref={(g) => (orbits.current[i] = g)}>
            {projects
              .map((p, j) => [p, j])
              .filter(([, j]) => j % ORBITS.length === i)
              .map(([p, j], n) => {
                const a = n * Math.PI + i * 0.7;
                return (
                  <group key={p.slug} position={[Math.cos(a) * o.r, Math.sin(a) * o.r, 0]}>
                    <group>
                      <group ref={(g) => (electrons.current[j] = g)} scale={0.26}>
                        <MiniShape shape={p.shape} color={p.color} still={calm} />
                      </group>
                      <mesh
                        visible={false}
                        onPointerOver={enter(j)}
                        onPointerOut={leave}
                        onClick={(e) => {
                          e.stopPropagation();
                          leave();
                          onPick(p.slug);
                        }}
                      >
                        <sphereGeometry args={[0.36, 12, 12]} />
                      </mesh>
                    </group>
                  </group>
                );
              })}
          </group>
        </group>
      ))}
    </group>
  );
}

function MiniShape({ shape, color, still }) {
  const Shape = SHAPES[shape];
  return <Shape color={color} still={still} delay={0} />;
}
