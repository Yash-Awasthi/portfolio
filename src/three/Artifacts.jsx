import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, RoundedBox, Instances, Instance, useGLTF } from '@react-three/drei';
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
// Cheap glass: translucent clearcoat shell, no transmission pass, so two hands cost nothing extra.
const GLASS = new THREE.MeshPhysicalMaterial({
  color: '#7f9fd6',
  metalness: 0.35,
  roughness: 0.08,
  clearcoat: 1,
  clearcoatRoughness: 0.05,
  transparent: true,
  opacity: 0.82,
  envMapIntensity: 2,
});
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

const HERO_MOONS = ['#3d5bd9', '#2a8f8a', '#5b5fc7'];

// Reduced motion keeps each object's own story but drops pointer tilt, bobbing and the carousel.
export function HeroBlob({ still }) {
  const calm = useReducedMotion();
  const tilt = useTilt(calm ? 0 : 0.5, still);
  return (
    <group ref={tilt}>
      <Float speed={still || calm ? 0 : 1.4} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh scale={1.2}>
          <icosahedronGeometry args={[1, 64]} />
          <MeshDistortMaterial color="#e4e5ea" metalness={1} roughness={0.08} distort={still ? 0.25 : 0.38} speed={still ? 0 : 1.6} />
        </mesh>
      </Float>
      {HERO_MOONS.map((c, i) => (
        <Spin key={c} speed={0.5 - i * 0.12} still={still} rotation={[0.5 + i * 0.5, i * 1.9, 0.3 - i * 0.4]}>
          <mesh position={[1.75 + i * 0.22, 0, 0]} scale={0.17 - i * 0.03}>
            <sphereGeometry args={[1, 48, 48]} />
            <Accent color={c} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.75 + i * 0.22, 0.005, 8, 160]} />
            <meshBasicMaterial color={c} transparent opacity={0.35} />
          </mesh>
        </Spin>
      ))}
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

// WorldFin: the globe turns while events land on it as pillars that rise and settle back.
const UP = new THREE.Vector3(0, 1, 0);
const EVENTS = [
  [0.4, 0.6, 0.7],
  [-0.7, 0.3, 0.65],
  [0.2, -0.5, 0.84],
  [-0.3, 0.8, -0.5],
  [0.8, -0.2, -0.55],
  [-0.6, -0.6, 0.5],
].map((v) => {
  const n = new THREE.Vector3(...v).normalize();
  return { position: n.toArray(), quaternion: new THREE.Quaternion().setFromUnitVectors(UP, n) };
});

function Globe({ still, color, delay }) {
  const clock = useClock(delay);
  const body = useRef();
  const ring = useRef();
  const pillars = useRef([]);
  const dots = useMemo(() => {
    const out = [];
    const n = 220;
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / (n - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const t = i * 2.399963;
      if ((i * 7) % 5 < 2) out.push([Math.cos(t) * r * 1.02, y * 1.02, Math.sin(t) * r * 1.02]);
    }
    return out;
  }, []);
  useFrame((state) => {
    const t = still ? 4 : clock(state);
    if (body.current) body.current.rotation.y = 0.4 + t * 0.18;
    if (ring.current) ring.current.rotation.x = lerp(Math.PI / 2 + 1.1, Math.PI / 2, easeOut(span(t, 0, 1.6)));
    pillars.current.forEach((m, i) => {
      if (!m) return;
      const phase = ((t + i * 1.1) % 6.6) / 6.6;
      const h = still ? 0.6 : easeOut(span(phase, 0, 0.12)) * (1 - easeInOut(span(phase, 0.55, 0.75)));
      m.scale.y = Math.max(0.001, h);
      m.position.y = (0.55 * m.scale.y) / 2;
    });
  });
  return (
    <group rotation={[0.35, 0, 0.15]}>
      <group ref={body}>
        <mesh>
          <sphereGeometry args={[1, 64, 64]} />
          <Clay />
        </mesh>
        <Instances limit={dots.length}>
          <sphereGeometry args={[0.028, 10, 10]} />
          <Accent color={color} />
          {dots.map((p, i) => (
            <Instance key={i} position={p} />
          ))}
        </Instances>
        {EVENTS.map((e, i) => (
          <group key={i} position={e.position} quaternion={e.quaternion}>
            <mesh ref={(m) => (pillars.current[i] = m)}>
              <cylinderGeometry args={[0.035, 0.035, 0.55, 12]} />
              <Accent color={color} />
            </mesh>
          </group>
        ))}
      </group>
      <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.45, 0.022, 16, 160]} />
        <Chrome />
      </mesh>
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
// "HAND Victory sign" by Abdelmoneim on Sketchfab (CC BY 4.0), drawn in glass. The model faces +x.
useGLTF.preload('/hand-v.glb');
function Victory({ s, mirror }) {
  const { scene } = useGLTF('/hand-v.glb');
  const ref = useRef();
  const hand = useMemo(() => {
    const g = scene.clone(true);
    g.traverse((o) => {
      if (o.isMesh) o.material = GLASS;
    });
    const box = new THREE.Box3().setFromObject(g);
    const k = 1.05 / (box.max.y - box.min.y);
    const c = box.getCenter(new THREE.Vector3());
    g.scale.setScalar(k);
    g.position.set(-c.x * k, -c.y * k, -c.z * k);
    return g;
  }, [scene]);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    g.scale.setScalar(lerp(0.92, 1, s.lock));
  });
  return (
    <group position={[0, 0.27, 0]} scale={[mirror ? -1 : 1, 1, 1]}>
      <group ref={ref} rotation={[0, 0, -0.1]}>
        <group rotation={[0, Math.PI / 2, 0]}>
          <primitive object={hand} />
        </group>
      </group>
    </group>
  );
}

const pairInit = () => ({ lock: 0, digits: Array.from({ length: 6 }, () => ({ on: 0 })), face: 0, send: 0, glow: 0 });

function pairStory({ loop }, s) {
  loop
    .add(s, { lock: [0, 1], duration: 300, ease: OUT }, 1200)
    .add(s.digits, { on: [0, 1], duration: 220, delay: stagger(90) }, 1500)
    .add(s, { face: [0, 1], duration: 700 }, 2400)
    .add(s, { send: [0, 1], duration: 1300 }, 3100)
    .add(s, { glow: [0, 1], duration: 250, ease: OUT }, 4300)
    .add(s, { glow: 0, duration: 500 }, 4900)
    .add(s, { face: 0, lock: 0, duration: 700 }, 5400)
    .add(s.digits, { on: 0, duration: 300 }, 5400)
    .add(s, { send: 0, duration: 800 }, 5700);
}

function Pair({ still, color, delay }) {
  const s = useStory(pairInit, pairStory, { delay, still, at: 0.42 });
  const phones = useRef([]);
  const screens = useRef([]);
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
          <group position={[side * 0.95, 1.25, 0.1]} scale={1.0}>
            <Victory s={s} mirror={side < 0} />
          </group>
          <mesh position={[side * 0.95, 1.52, -0.3]}>
            <torusGeometry args={[0.62, 0.012, 8, 96]} />
            <meshBasicMaterial ref={(m) => (rings.current[p] = m)} color="#cfd8db" toneMapped={false} />
          </mesh>
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

// Key Router: the edge is a cloud. The real provider key slides into it and stays; a disposable
// gateway key turns out of the other side. Requests arc over the cloud and change colour as the
// real key is swapped in, replies stream back underneath, the TTL dial on the cloud drains, and
// the expired key turns edge-on and retracts.
const TICKS = 24;
const TICK_OFF = new THREE.Color('#cfd8db');
const PUFFS = [
  [0, 0, 0, 0.42],
  [-0.42, -0.1, 0, 0.3],
  [0.43, -0.08, 0, 0.32],
  [-0.2, 0.24, 0, 0.3],
  [0.22, 0.26, 0.05, 0.28],
  [0, -0.16, 0.15, 0.3],
];
// Edge locations: sparse dots on the cloud's front that no other puff covers and the dial leaves free.
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
const KEY_SCALE = 0.75;
const KEY_Y = -0.08;
const REAL_IN = -1.45;
const GATE_OUT = 1.45;
const GATE_IN = 0.6;
const gateArc = (a, b, h) =>
  new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a), new THREE.Vector3((a[0] + b[0]) / 2, h, 0.45), new THREE.Vector3(...b));
const GATE_PATHS = {
  inbound: gateArc([1.45, 0.12, 0.25], [0, 0.82, 0.3], 0.95),
  outbound: gateArc([0, 0.82, 0.3], [-1.45, 0.12, 0.25], 0.95),
  back: gateArc([-1.35, -0.3, 0.3], [1.35, -0.3, 0.3], -0.95),
};

const gateInit = () => ({ real: 0, out: 0, ttl: 0, asks: [0, 1, 2].map(() => ({ k: 0 })), replies: [0, 1, 2, 3, 4].map(() => ({ k: 0 })) });

function gateStory({ intro, loop }, s) {
  intro.add(s, { real: [0, 1], duration: 1000, ease: OUT });
  loop
    .add(s, { out: [0, 1], duration: 1000, ease: OUT })
    .add(s, { ttl: [0, 1], duration: 700, ease: OUT }, 200)
    .add(s.asks, { k: [0, 1], duration: 1700, delay: stagger(380) }, 1300)
    .add(s.replies, { k: [0, 1], duration: 1300, delay: stagger(140) }, 3300)
    .add(s, { ttl: 0, duration: 4600, ease: 'linear' }, 1000)
    .add(s, { out: 0, duration: 1000 }, 5800)
    .add(s.asks, { k: 0, duration: 1 }, 6800)
    .add(s.replies, { k: 0, duration: 1 }, 6800);
}

function KeyGate({ still, color, delay }) {
  const s = useStory(gateInit, gateStory, { delay, still, at: 0.32 });
  const real = useRef();
  const gate = useRef();
  const ticks = useRef([]);
  const asks = useRef([]);
  const replies = useRef();
  const lit = useMemo(() => new THREE.Color(color), [color]);
  useFrame(() => {
    if (real.current) real.current.position.x = lerp(REAL_IN - 0.45, REAL_IN, s.real);
    if (gate.current) {
      gate.current.position.x = lerp(GATE_IN, GATE_OUT, s.out);
      // Edge-on while inside the cloud, flat once out.
      gate.current.rotation.x = (Math.PI / 2) * (1 - s.out);
    }
    ticks.current.forEach((m, i) => m?.color.copy(TICK_OFF).lerp(lit, THREE.MathUtils.clamp(s.ttl * TICKS - i, 0, 1)));
    // Each request is two beads: the gateway key's colour up to the edge, chrome after the swap.
    asks.current.forEach((pair, i) => {
      if (!pair) return;
      const k = s.asks[i].k;
      const [before, after] = pair.children;
      before.position.copy(GATE_PATHS.inbound.getPointAt(easeInOut(Math.min(1, k * 2))));
      after.position.copy(GATE_PATHS.outbound.getPointAt(easeInOut(Math.max(0, k * 2 - 1))));
      before.visible = !still && k > 0.01 && k < 0.5;
      after.visible = !still && k >= 0.5 && k < 0.99;
    });
    replies.current?.children.forEach((b, i) => {
      const k = s.replies[i].k;
      b.position.copy(GATE_PATHS.back.getPointAt(easeInOut(k)));
      b.visible = !still && k > 0.01 && k < 0.99;
    });
  });
  return (
    <group rotation={[0.22, -0.32, 0]} scale={0.92}>
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
      <group ref={real} position={[REAL_IN, KEY_Y, 0]} scale={KEY_SCALE}>
        <KeyBody mat={() => <Chrome />} />
      </group>
      <group ref={gate} position={[GATE_IN, KEY_Y, 0]}>
        <group rotation={[0, 0, Math.PI]} scale={KEY_SCALE}>
          <KeyBody mat={() => <Accent color={color} />} />
        </group>
      </group>
      {[0, 1, 2].map((i) => (
        <group key={i} ref={(g) => (asks.current[i] = g)}>
          <mesh scale={0.065}>
            <sphereGeometry args={[1, 20, 20]} />
            <Accent color={color} />
          </mesh>
          <mesh scale={0.065}>
            <sphereGeometry args={[1, 20, 20]} />
            <Chrome />
          </mesh>
        </group>
      ))}
      <group ref={replies}>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} scale={0.04}>
            <sphereGeometry args={[1, 16, 16]} />
            <Accent color={color} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

const SHAPES = { council: Council, globe: Globe, rings: Recovery, phone: Desk, files: Files, pair: Pair, chip: Chip, key: KeyGate };

// Globe-turn swap: the current object and the next sit back to back on one axis and turn together
// through half a revolution, so the swap is a single continuous motion with no pause between them.
const TURN = 1;
export function SwapArtifact({ shape, color, still }) {
  const [cur, setCur] = useState({ shape, color, delay: 0 });
  const [next, setNext] = useState(null);
  const [warm, setWarm] = useState(0);
  const refs = useRef({});
  const t0 = useRef(null);
  const others = Object.keys(SHAPES).filter((k) => k !== cur.shape && k !== next?.shape);
  useFrame((state) => {
    // Each other shape draws for a few frames at near-zero size, one at a time, so its shaders
    // compile before the first hover rather than during a turn.
    if (warm < others.length * 3) setWarm(warm + 1);
    if (!next) {
      if (shape !== cur.shape) setNext({ shape, color, delay: TURN / 2 });
      return;
    }
    const a = refs.current[cur.shape];
    const b = refs.current[next.shape];
    if (!a || !b) return;
    const now = state.clock.elapsedTime;
    if (t0.current === null) t0.current = now;
    const k = easeInOut(span(now - t0.current, 0, TURN));
    const turn = k * Math.PI;
    const dip = 1 - 0.12 * Math.sin(turn);
    a.rotation.y = turn;
    b.rotation.y = turn - Math.PI;
    a.visible = turn < Math.PI / 2;
    b.visible = !a.visible;
    a.scale.setScalar(dip);
    b.scale.setScalar(dip);
    if (k >= 1) {
      t0.current = null;
      a.rotation.y = 0;
      b.rotation.y = 0;
      a.visible = true;
      setCur(next);
      setNext(null);
    }
  });
  const calm = useReducedMotion();
  if (still || calm) return <Artifact key={shape} shape={shape} color={color} still={still} />;
  const w = others[Math.floor(warm / 3)];
  return (
    <>
      {[cur, next].filter(Boolean).map((it) => (
        <group key={it.shape} ref={(g) => (refs.current[it.shape] = g)} visible={it === cur || false}>
          <Artifact shape={it.shape} color={it.color} delay={it.delay} />
        </group>
      ))}
      {w && (
        <group key={`warm-${w}`} scale={0.001}>
          <Artifact shape={w} color={color} still />
        </group>
      )}
    </>
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
