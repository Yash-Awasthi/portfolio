import { useLayoutEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { View, PerspectiveCamera, Environment, Lightformer } from '@react-three/drei';

// One WebGL context for the whole site; every 3D spot is a View drawn into it.
export function Stage() {
  return (
    <Canvas
      className="!fixed inset-0 !pointer-events-none"
      style={{ position: 'fixed', zIndex: 0 }}
      eventSource={document.getElementById('root')}
      dpr={[1.5, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <View.Port />
    </Canvas>
  );
}

function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#e2eaec']} />
      <Lightformer form="rect" intensity={1} color="#141a1f" position={[0, -1.2, -4]} scale={[12, 0.6, 1]} />
      <Lightformer form="rect" intensity={1} color="#141a1f" position={[-4, 2.5, 2]} scale={[0.5, 6, 1]} rotation-y={Math.PI / 2} />
      <Lightformer intensity={2.2} position={[0, 5, -2]} scale={[10, 2, 1]} rotation-x={Math.PI / 2} />
      <Lightformer intensity={1.4} position={[-5, 1, 1]} scale={[3, 8, 1]} rotation-y={Math.PI / 2} />
      <Lightformer intensity={1.4} position={[5, 1, 1]} scale={[3, 8, 1]} rotation-y={-Math.PI / 2} />
      <Lightformer intensity={0.9} color="#3d5bd9" position={[0, -3, 3]} scale={[6, 1, 1]} />
      <Lightformer intensity={0.7} color="#2a8f8a" position={[-4, -1, 3]} scale={[1, 5, 1]} rotation-y={Math.PI / 3} />
      <Lightformer intensity={0.7} color="#5b5fc7" position={[4, 2, 3]} scale={[1, 5, 1]} rotation-y={-Math.PI / 3} />
      <Lightformer form="ring" intensity={1.6} position={[2, 1, 6]} scale={3} />
    </Environment>
  );
}

// Starts from a sphere of `radius`, then frames the measured content as tightly as it has been seen
// to reach (entrances and swings included): it fills the view and is never cut.
const BOX = new THREE.Box3();
function Fit({ radius, target }) {
  const camera = useThree((st) => st.camera);
  const size = useThree((st) => st.size);
  const need = useRef(0);
  const tick = useRef(0);
  const seen = useRef(false);
  useLayoutEffect(() => {
    const v = THREE.MathUtils.degToRad(camera.fov) / 2;
    const h = Math.atan(Math.tan(v) * (size.width / size.height));
    need.current = radius / Math.sin(Math.min(v, h));
    seen.current = false;
    camera.position.set(0, 0, need.current);
    camera.updateProjectionMatrix();
  }, [camera, size, radius]);
  useFrame(() => {
    const g = target.current;
    if (!g || ++tick.current % 10) return;
    BOX.setFromObject(g);
    if (BOX.isEmpty()) return;
    const v = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    const x = Math.max(Math.abs(BOX.min.x), Math.abs(BOX.max.x));
    const y = Math.max(Math.abs(BOX.min.y), Math.abs(BOX.max.y));
    const want = (Math.max(y / v, x / (v * (size.width / size.height))) + BOX.max.z) * 1.04;
    if (!seen.current || want > need.current) need.current = want;
    seen.current = true;
    camera.position.set(0, 0, camera.position.z + (need.current - camera.position.z) * 0.15);
  });
  return null;
}

export function Scene({ className, style, children, fov = 35, radius = 1.9, ...props }) {
  const content = useRef();
  return (
    <View className={className} style={style} {...props}>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={fov} />
      <Fit radius={radius} target={content} />
      <Studio />
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
      <group ref={content}>{children}</group>
    </View>
  );
}
