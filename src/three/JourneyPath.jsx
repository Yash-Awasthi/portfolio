import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const COBALT = new THREE.Color('#2a45e8');
const CLAY = new THREE.Color('#d9d9d6');

// `progress` is a Motion value (0..1) read inside the frame loop, never through React state.
export function JourneyPath({ progress, count }) {
  const group = useRef();
  const traveler = useRef();
  const nodes = useRef([]);
  const drawn = useRef();

  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-2.6, -1.3, 0.6),
        new THREE.Vector3(-1.2, -0.2, -0.8),
        new THREE.Vector3(0.2, -0.9, 0.7),
        new THREE.Vector3(1.3, 0.4, -0.5),
        new THREE.Vector3(2.5, 1.2, 0.4),
      ]),
    [],
  );
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 240, 0.018, 8, false), [curve]);
  const lit = useMemo(() => new THREE.TubeGeometry(curve, 240, 0.028, 8, false), [curve]);
  const stops = useMemo(() => Array.from({ length: count }, (_, i) => curve.getPointAt(i / (count - 1))), [curve, count]);
  const indexCount = lit.index.count;

  useFrame((state, dt) => {
    const p = THREE.MathUtils.clamp(progress.get(), 0, 1);
    const k = 1 - Math.exp(-dt * 6);
    if (group.current) {
      group.current.rotation.y += (-0.35 + p * 0.7 + state.pointer.x * 0.15 - group.current.rotation.y) * k;
      group.current.rotation.x += (0.18 - state.pointer.y * 0.08 - group.current.rotation.x) * k;
    }
    traveler.current?.position.copy(curve.getPointAt(p));
    // Draw the travelled part of the path in cobalt by growing the second mesh's index range.
    drawn.current?.geometry.setDrawRange(0, Math.floor((indexCount * p) / 6) * 6);
    nodes.current.forEach((m, i) => {
      if (!m) return;
      const on = p >= i / (count - 1) - 0.02;
      m.material.color.lerp(on ? COBALT : CLAY, k);
      const s = on ? 0.13 : 0.09;
      m.scale.setScalar(m.scale.x + (s - m.scale.x) * k);
    });
  });

  return (
    <group ref={group}>
      <mesh geometry={tube}>
        <meshStandardMaterial color="#c9c9c5" roughness={0.6} />
      </mesh>
      <mesh ref={drawn} geometry={lit}>
        <meshStandardMaterial color="#2a45e8" roughness={0.3} />
      </mesh>
      {stops.map((pt, i) => (
        <mesh key={i} position={pt} ref={(m) => (nodes.current[i] = m)} scale={0.09}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshPhysicalMaterial color="#d9d9d6" roughness={0.3} clearcoat={1} />
        </mesh>
      ))}
      <mesh ref={traveler} scale={0.2}>
        <sphereGeometry args={[1, 48, 48]} />
        <meshPhysicalMaterial color="#dcdde3" metalness={1} roughness={0.12} />
      </mesh>
    </group>
  );
}
