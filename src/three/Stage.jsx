import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { useReducedMotion } from 'motion/react';
import { View, PerspectiveCamera, Environment, Lightformer, ContactShadows } from '@react-three/drei';

// One WebGL context for the whole site; every 3D spot is a View drawn into it.
export function Stage() {
  const reduce = useReducedMotion();
  return (
    <Canvas
      frameloop={reduce ? 'demand' : 'always'}
      className="!fixed inset-0 !pointer-events-none"
      style={{ position: 'fixed', zIndex: 0 }}
      eventSource={document.getElementById('root')}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
    >
      <View.Port />
      {reduce && <RedrawOnScroll />}
    </Canvas>
  );
}

// With reduced motion nothing animates, so frames are drawn only when Views move on screen.
function RedrawOnScroll() {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const redraw = () => invalidate();
    window.addEventListener('scroll', redraw, { passive: true });
    window.addEventListener('resize', redraw);
    return () => {
      window.removeEventListener('scroll', redraw);
      window.removeEventListener('resize', redraw);
    };
  }, [invalidate]);
  return null;
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

export function Scene({ className, style, children, fov = 35, z = 6, shadow = true, ...props }) {
  return (
    <View className={className} style={style} {...props}>
      <PerspectiveCamera makeDefault position={[0, 0, z]} fov={fov} />
      <Studio />
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 5, 4]} intensity={1.2} />
      {children}
      {shadow && <ContactShadows position={[0, -1.55, 0]} opacity={0.22} scale={5} blur={2.8} far={3} color="#141a1f" />}
    </View>
  );
}
