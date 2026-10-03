import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, RoundedBox, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';
import { useReducedMotion } from 'motion/react';
import { easeOut, easeInOut, span, lerp } from './ease';

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

// Nexus: the orchestrator fans a task out to a ring of models, answers flow back along the
// spokes, and a debate bead circles the ring between them.
const SEATS = 6;
const RING = 1.35;

function Council({ still, color, delay }) {
  const clock = useClock(delay);
  const core = useRef();
  const arms = useRef([]);
  const debate = useRef();
  useFrame((state) => {
    const t = still ? 6 : clock(state);
    if (core.current) {
      core.current.rotation.set(t * 0.25, t * 0.4, 0);
      core.current.scale.setScalar(0.5 + Math.sin(t * 2.2) * 0.02);
    }
    arms.current.forEach((arm, i) => {
      if (!arm) return;
      const r = RING * easeOut(span(t, 0.1 + i * 0.07, 1.3 + i * 0.07));
      const [spoke, seat, packet] = arm.children;
      spoke.scale.y = Math.max(r, 0.001);
      spoke.position.x = r / 2;
      seat.position.x = r;
      seat.rotation.y = t * 0.6 + i;
      const phase = (t * 0.45 + i / SEATS) % 1;
      const out = phase < 0.5 ? easeInOut(phase * 2) : easeInOut(2 - phase * 2);
      packet.position.x = r * (0.22 + out * 0.66);
    });
    if (debate.current) {
      const a = t * 0.6;
      const r = RING * easeOut(span(t, 0.6, 1.8));
      debate.current.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    }
  });
  return (
    <group rotation={[0.5, 0, 0]}>
      <Spin speed={0.1} still={still}>
        <mesh ref={core}>
          <icosahedronGeometry args={[1, 0]} />
          <Accent color={color} flatShading />
        </mesh>
        {Array.from({ length: SEATS }, (_, i) => (
          <group key={i} rotation={[0, (i / SEATS) * Math.PI * 2, 0]} ref={(g) => (arms.current[i] = g)}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.008, 0.008, 1, 6]} />
              <meshBasicMaterial color={INK} transparent opacity={0.22} />
            </mesh>
            <RoundedBox args={[0.32, 0.32, 0.32]} radius={0.08} smoothness={4}>
              <Chrome />
            </RoundedBox>
            <mesh scale={0.055}>
              <sphereGeometry args={[1, 20, 20]} />
              <Accent color={color} />
            </mesh>
          </group>
        ))}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[RING, 0.008, 8, 180]} />
          <meshBasicMaterial color={INK} transparent opacity={0.16} />
        </mesh>
        <mesh ref={debate} scale={0.08}>
          <sphereGeometry args={[1, 24, 24]} />
          <Chrome />
        </mesh>
      </Spin>
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

// AdapFit: three rings drift apart like a day's load, then settle concentric as recovery lands.
const SPREAD = [
  [0.9, 0.2, 0.3],
  [-0.5, 0.9, -0.2],
  [0.2, -0.7, 0.8],
];
const RADII = [1.35, 1.02, 0.68];

function Rings({ still, color, delay }) {
  const clock = useClock(delay);
  const rings = useRef([]);
  useFrame((state) => {
    const t = still ? 0 : clock(state);
    const p = (t % 8) / 8;
    const settle = easeInOut(span(p, 0.1, 0.4)) * (1 - easeInOut(span(p, 0.65, 0.95)));
    rings.current.forEach((m, i) => {
      if (!m) return;
      const [x, y, z] = SPREAD[i];
      m.rotation.set(lerp(x, Math.PI / 2 - 0.35, settle), lerp(y, 0, settle), lerp(z + t * 0.3 * (i + 1), 0, settle));
    });
  });
  return (
    <group>
      {RADII.map((r, i) => (
        <mesh key={r} ref={(m) => (rings.current[i] = m)}>
          <torusGeometry args={[r, 0.09, 32, 160]} />
          {i === 0 ? <Clay /> : i === 1 ? <Chrome /> : <Accent color={color} />}
        </mesh>
      ))}
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

// PocketDesk: the laptop lid opens, the phone turns to face it, commands travel across and the
// terminal on screen fills line by line.
const LINES = [0.9, 0.6, 1.1, 0.75, 0.5];

function Desk({ still, color, delay }) {
  const clock = useClock(delay);
  const lid = useRef();
  const phone = useRef();
  const beads = useRef();
  const lines = useRef([]);
  const arc = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(1.8, 0.2, 1.05),
        new THREE.Vector3(1.2, 1.4, 0.5),
        new THREE.Vector3(0.1, 0.7, -0.6),
      ),
    [],
  );
  useFrame((state) => {
    const t = still ? 10 : clock(state);
    if (lid.current) lid.current.rotation.x = lerp(Math.PI / 2, -0.28, easeInOut(span(t, 0.1, 1.5)));
    const p = t < 2 ? 0 : ((t - 2) % 7) / 7;
    if (phone.current) {
      phone.current.rotation.y = 0.4 + easeInOut(span(p, 0, 0.18)) * Math.PI * 2;
      phone.current.position.y = 0.05 + (still ? 0 : Math.sin(t * 1.3) * 0.05);
    }
    beads.current?.children.forEach((b, i) => {
      const k = span(p, 0.2 + i * 0.04, 0.48 + i * 0.04);
      b.position.copy(arc.getPointAt(easeInOut(k)));
      b.visible = !still && k > 0 && k < 1;
    });
    lines.current.forEach((m, i) => {
      if (!m) return;
      const grow = still ? 1 : easeOut(span(p, 0.5 + i * 0.06, 0.62 + i * 0.06)) * (1 - span(p, 0.94, 1));
      m.scale.x = Math.max(0.001, grow);
      m.position.x = -0.95 + (LINES[i] * m.scale.x) / 2;
    });
  });
  return (
    <group rotation={[0.32, -0.55, 0]} position={[-0.45, -0.1, 0]} scale={0.82}>
      <Laptop lidRef={lid} still={still}>
        {LINES.map((w, i) => (
          <mesh key={i} ref={(m) => (lines.current[i] = m)} position={[-0.95, 1.2 - i * 0.2, 0.036]}>
            <planeGeometry args={[w, 0.07]} />
            <meshBasicMaterial color={i % 2 ? '#8fb3c9' : color} toneMapped={false} />
          </mesh>
        ))}
      </Laptop>
      <group ref={phone} position={[1.85, 0.05, 1.0]}>
        <Handset scale={0.62} screen={color} />
      </group>
      <group ref={beads}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} scale={0.05}>
            <sphereGeometry args={[1, 16, 16]} />
            <Accent color={color} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Case Files: the stack fans open, the case file on top slides out to be read, then everything closes.
const SHEETS = 5;

function Files({ still, color, delay }) {
  const clock = useClock(delay);
  const sheets = useRef([]);
  useFrame((state) => {
    const t = still ? 0 : clock(state);
    const p = (t % 7) / 7;
    const fan = still ? 0.8 : easeInOut(span(p, 0.08, 0.35)) * (1 - easeInOut(span(p, 0.78, 0.98)));
    const pull = easeOut(span(p, 0.38, 0.55)) * (1 - easeInOut(span(p, 0.68, 0.8)));
    sheets.current.forEach((g, i) => {
      if (!g) return;
      const top = i === SHEETS - 1;
      g.rotation.z = lerp(0, -0.42 + i * 0.2, fan);
      g.position.set(top ? pull * 0.55 : 0, top ? pull * 0.75 : 0, i * 0.08 + (top ? pull * 0.25 : 0));
    });
  });
  return (
    <group rotation={[-0.55, 0.15, 0]}>
      {Array.from({ length: SHEETS }, (_, i) => {
        const top = i === SHEETS - 1;
        return (
          <group key={i} ref={(g) => (sheets.current[i] = g)}>
            <RoundedBox args={[1.9, 1.35, 0.03]} radius={0.02} smoothness={3}>
              {top ? <Accent color={color} /> : <Clay />}
            </RoundedBox>
            <RoundedBox args={[0.55, 0.18, 0.03]} radius={0.02} smoothness={3} position={[-0.55, 0.72, 0]}>
              {top ? <Accent color={color} /> : <Clay />}
            </RoundedBox>
          </group>
        );
      })}
    </group>
  );
}

// Ping: two phones turn to face each other, the card crosses between them, both screens confirm,
// and they turn away again.
const SCREEN_IDLE = new THREE.Color('#eef3f3');

function Pair({ still, color, delay }) {
  const clock = useClock(delay);
  const left = useRef();
  const right = useRef();
  const beads = useRef();
  const screenA = useRef();
  const screenB = useRef();
  const lit = useMemo(() => new THREE.Color(color), [color]);
  const curve = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.72, 0.15, 0.25), new THREE.Vector3(0, 1.15, 0.45), new THREE.Vector3(0.72, 0.15, 0.25)),
    [],
  );
  useFrame((state) => {
    const t = still ? 0 : clock(state);
    const p = (t % 7) / 7;
    const face = still ? 1 : easeInOut(span(p, 0.04, 0.22)) * (1 - easeInOut(span(p, 0.84, 0.98)));
    const turn = lerp(0.12, 0.62, face);
    if (left.current) left.current.rotation.y = turn;
    if (right.current) right.current.rotation.y = -turn;
    beads.current?.children.forEach((b, i) => {
      const k = span(p, 0.26 + i * 0.035, 0.56 + i * 0.035);
      b.position.copy(curve.getPointAt(easeInOut(k)));
      b.visible = !still && k > 0 && k < 1;
    });
    const glow = easeOut(span(p, 0.6, 0.66)) * (1 - easeInOut(span(p, 0.74, 0.84)));
    for (const s of [screenA.current, screenB.current]) s?.color.copy(SCREEN_IDLE).lerp(lit, glow);
  });
  return (
    <group position={[0, -0.25, 0]}>
      <group ref={left} position={[-1.05, 0, 0]}>
        <Handset scale={0.85} screen="#eef3f3" screenRef={screenA} />
      </group>
      <group ref={right} position={[1.05, 0, 0]}>
        <Handset scale={0.85} screen="#eef3f3" screenRef={screenB} />
      </group>
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

const SHAPES = { council: Council, globe: Globe, rings: Rings, phone: Desk, files: Files, pair: Pair, chip: Chip, key: Edge };

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
