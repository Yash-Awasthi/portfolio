import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, RoundedBox, Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';

const COBALT = '#2a45e8';

function Chrome(props) {
  return <meshPhysicalMaterial color="#dcdde3" metalness={1} roughness={0.14} {...props} />;
}
function Clay(props) {
  return <meshPhysicalMaterial color="#f1f1ee" roughness={0.55} clearcoat={0.3} {...props} />;
}
function Cobalt(props) {
  return <meshPhysicalMaterial color={COBALT} roughness={0.28} clearcoat={1} clearcoatRoughness={0.2} {...props} />;
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

export function HeroBlob({ still }) {
  const tilt = useTilt(0.5, still);
  return (
    <group ref={tilt}>
      <Float speed={still ? 0 : 1.4} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh scale={1.2}>
          <icosahedronGeometry args={[1, 64]} />
          <MeshDistortMaterial
            color="#e4e5ea"
            metalness={1}
            roughness={0.08}
            distort={still ? 0.25 : 0.38}
            speed={still ? 0 : 1.6}
          />
        </mesh>
      </Float>
      <Spin speed={0.5} still={still} rotation={[0.5, 0, 0.3]}>
        <mesh position={[1.95, 0, 0]} scale={0.2}>
          <sphereGeometry args={[1, 48, 48]} />
          <Cobalt />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.95, 0.006, 8, 160]} />
          <meshBasicMaterial color="#121214" transparent opacity={0.25} />
        </mesh>
      </Spin>
    </group>
  );
}

function Council({ still }) {
  const seats = [0, 1, 2, 3, 4];
  return (
    <group>
      <mesh scale={0.62}>
        <sphereGeometry args={[1, 64, 64]} />
        <Cobalt />
      </mesh>
      {seats.map((i) => (
        <Spin key={i} speed={0.25 + i * 0.05} still={still} rotation={[0.3 + i * 0.35, i * 1.2, 0]}>
          <mesh position={[1.25 + (i % 2) * 0.25, 0, 0]} scale={0.2}>
            <sphereGeometry args={[1, 40, 40]} />
            <Chrome />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.25 + (i % 2) * 0.25, 0.006, 6, 128]} />
            <meshBasicMaterial color="#121214" transparent opacity={0.22} />
          </mesh>
        </Spin>
      ))}
    </group>
  );
}

function Globe({ still }) {
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
  return (
    <Spin speed={0.18} still={still} rotation={[0.35, 0, 0.15]}>
      <mesh>
        <sphereGeometry args={[1, 64, 64]} />
        <Clay />
      </mesh>
      <Instances limit={dots.length}>
        <sphereGeometry args={[0.028, 10, 10]} />
        <Cobalt />
        {dots.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
      </Instances>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.45, 0.022, 16, 160]} />
        <Chrome />
      </mesh>
    </Spin>
  );
}

function Rings({ still }) {
  return (
    <group>
      <Spin speed={0.35} axis="x" still={still}>
        <mesh>
          <torusGeometry args={[1.35, 0.09, 32, 160]} />
          <Clay />
        </mesh>
      </Spin>
      <Spin speed={-0.45} axis="y" still={still}>
        <mesh>
          <torusGeometry args={[1.02, 0.09, 32, 160]} />
          <Chrome />
        </mesh>
      </Spin>
      <Spin speed={0.6} axis="z" still={still} rotation={[0.6, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.68, 0.09, 32, 128]} />
          <Cobalt />
        </mesh>
      </Spin>
    </group>
  );
}

function Handset({ screen = COBALT, ...props }) {
  return (
    <group {...props}>
      <RoundedBox args={[0.9, 1.8, 0.1]} radius={0.1} smoothness={6}>
        <Chrome />
      </RoundedBox>
      <mesh position={[0, 0, 0.052]}>
        <planeGeometry args={[0.78, 1.66]} />
        <meshPhysicalMaterial color={screen} roughness={0.2} clearcoat={1} />
      </mesh>
    </group>
  );
}

function Phone() {
  return (
    <group rotation={[0.1, -0.35, 0]}>
      <RoundedBox args={[2.6, 1.6, 0.08]} radius={0.04} smoothness={4} position={[-0.35, 0.35, -0.6]}>
        <Clay />
      </RoundedBox>
      <mesh position={[-0.35, 0.35, -0.555]}>
        <planeGeometry args={[2.44, 1.44]} />
        <meshPhysicalMaterial color="#121214" roughness={0.3} clearcoat={1} />
      </mesh>
      <Handset position={[0.95, -0.35, 0.35]} rotation={[0, -0.2, 0.08]} scale={0.8} />
    </group>
  );
}

function Files({ still }) {
  const sheets = [0, 1, 2, 3, 4];
  const ref = useRef();
  useFrame((state) => {
    if (still || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.children.forEach((c, i) => {
      c.rotation.z = -0.35 + i * 0.16 + Math.sin(t * 0.8 + i) * 0.03;
    });
  });
  return (
    <group ref={ref} rotation={[-0.5, 0, 0]}>
      {sheets.map((i) => (
        <group key={i} position={[0, 0, i * 0.08]} rotation={[0, 0, -0.35 + i * 0.16]}>
          <RoundedBox args={[1.9, 1.35, 0.03]} radius={0.02} smoothness={3}>
            {i === sheets.length - 1 ? <Cobalt /> : <Clay />}
          </RoundedBox>
          <RoundedBox args={[0.55, 0.18, 0.03]} radius={0.02} smoothness={3} position={[-0.55, 0.72, 0]}>
            {i === sheets.length - 1 ? <Cobalt /> : <Clay />}
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

function Pair({ still }) {
  const beads = useRef();
  const curve = useMemo(
    () => new THREE.QuadraticBezierCurve3(new THREE.Vector3(-1, 0.2, 0), new THREE.Vector3(0, 1.3, 0.4), new THREE.Vector3(1, 0.2, 0)),
    [],
  );
  useFrame((state) => {
    if (!beads.current) return;
    const t = still ? 0.2 : state.clock.elapsedTime * 0.35;
    beads.current.children.forEach((b, i) => {
      b.position.copy(curve.getPointAt((t + i / 6) % 1));
    });
  });
  return (
    <group position={[0, -0.25, 0]}>
      <Handset position={[-1.25, 0, 0]} rotation={[0, 0.5, 0]} scale={0.75} screen="#f1f1ee" />
      <Handset position={[1.25, 0, 0]} rotation={[0, -0.5, 0]} scale={0.75} screen="#f1f1ee" />
      <group ref={beads}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} scale={0.07}>
            <sphereGeometry args={[1, 24, 24]} />
            <Cobalt />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Chip() {
  const pins = useMemo(() => {
    const out = [];
    for (let i = 0; i < 8; i++) {
      const o = -0.84 + i * 0.24;
      out.push([o, 1.12, 0], [o, -1.12, 0], [1.12, o, 0], [-1.12, o, 0]);
    }
    return out;
  }, []);
  return (
    <group rotation={[-0.9, 0, 0.5]}>
      <RoundedBox args={[2.1, 2.1, 0.18]} radius={0.04} smoothness={4}>
        <meshPhysicalMaterial color="#1b1c20" roughness={0.45} clearcoat={0.6} />
      </RoundedBox>
      <RoundedBox args={[1.1, 1.1, 0.1]} radius={0.03} smoothness={4} position={[0, 0, 0.13]}>
        <Cobalt />
      </RoundedBox>
      <Instances limit={pins.length}>
        <boxGeometry args={[0.1, 0.1, 0.06]} />
        <Chrome />
        {pins.map((p, i) => (
          <Instance key={i} position={p} scale={[i % 4 < 2 ? 1 : 1.6, i % 4 < 2 ? 1.6 : 1, 1]} />
        ))}
      </Instances>
    </group>
  );
}

const SHAPES = { council: Council, globe: Globe, rings: Rings, phone: Phone, files: Files, pair: Pair, chip: Chip };

// Shrinks the current object away, swaps it, and grows the next one in.
export function SwapArtifact({ shape, still }) {
  const [shown, setShown] = useState(shape);
  const ref = useRef();
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const target = shown === shape ? 1 : 0;
    const s = g.scale.x + (target - g.scale.x) * (1 - Math.exp(-dt * (target ? 7 : 14)));
    g.scale.setScalar(Math.max(s, 0.0001));
    g.rotation.y = (1 - s) * 1.2;
    if (!target && s < 0.05) setShown(shape);
  });
  if (still) return <Artifact shape={shape} still />;
  return (
    <group ref={ref}>
      <Artifact shape={shown} still={still} />
    </group>
  );
}

export function Artifact({ shape, still, tilt = 0.3 }) {
  const ref = useTilt(tilt, still);
  const Shape = SHAPES[shape];
  return (
    <group ref={ref}>
      <Float speed={still ? 0 : 1.2} rotationIntensity={0.25} floatIntensity={0.5}>
        <Shape still={still} />
      </Float>
    </group>
  );
}
