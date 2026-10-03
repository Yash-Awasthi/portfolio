import { Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { View, PerspectiveCamera } from '@react-three/drei';

// One WebGL context for the whole site; every 3D spot is a View drawn into it.
export function Stage() {
  return (
    <Canvas
      className="!fixed inset-0 !pointer-events-none"
      style={{ position: 'fixed', zIndex: 2 }}
      eventSource={document.getElementById('root')}
      dpr={[2, 2.5]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        // the error check reads link status, which waits on the compile and blocked the page for ~1s
        gl.debug.checkShaderErrors = import.meta.env.DEV;
      }}
    >
      <View.Port />
    </Canvas>
  );
}

// Studio reflections, baked from the old Lightformer rig: the top half holds RGB mantissas, the bottom
// half the exponent. Filtering it at load needed a shader whose compile froze the page for ~0.3 s.
let studio;
function loadStudio() {
  studio ??= new Promise((ok, fail) => {
    const im = new window.Image();
    im.onload = () => ok(im);
    im.onerror = fail;
    im.src = '/studio-env.png';
  }).then((im) => {
    const w = im.width;
    const h = im.height / 2;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h * 2;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(im, 0, 0);
    const px = ctx.getImageData(0, 0, w, h * 2).data;
    const out = new Uint16Array(w * h * 4);
    const half = THREE.DataUtils.toHalfFloat;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        const k = 2 ** (px[((h + y) * w + x) * 4] - 128) / 255;
        const o = ((h - 1 - y) * w + x) * 4;
        out[o] = half(px[i] * k);
        out[o + 1] = half(px[i + 1] * k);
        out[o + 2] = half(px[i + 2] * k);
        out[o + 3] = half(1);
      }
    }
    const t = new THREE.DataTexture(out, w, h, THREE.RGBAFormat, THREE.HalfFloatType);
    t.mapping = THREE.CubeUVReflectionMapping;
    t.minFilter = t.magFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    return t;
  });
  return studio;
}

// Lights `scene` with the studio, then compiles `object` without blocking the main thread.
export function compileLit(gl, object, camera, scene) {
  return loadStudio().then((t) => {
    scene.environment = t;
    return gl.compileAsync(object, camera, scene);
  });
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
    // measure only once the content is shown, with fresh matrices
    if (!g || !g.parent.visible || ++tick.current % 10) return;
    g.updateWorldMatrix(true, true);
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

// `bare` drops the default lights for content that brings its own.
export function Scene({ className, style, children, fov = 35, radius = 1.9, bare = false, ...props }) {
  const content = useRef();
  return (
    <View className={className} style={style} {...props}>
      <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={fov} />
      <Fit radius={radius} target={content} />
      {!bare && <ambientLight intensity={0.4} />}
      {!bare && <directionalLight position={[3, 5, 4]} intensity={1.2} />}
      <Compiled target={content}>{children}</Compiled>
    </View>
  );
}

// Content stays hidden until its shaders finish compiling in the background; drawing it first
// compiled them on the main thread and froze the page.
function Compiled({ target, children }) {
  const [ready, setReady] = useState(false);
  const { gl, camera, scene } = useThree();
  const compile = () => compileLit(gl, target.current, camera, scene).then(() => setReady(true));
  return (
    <group visible={ready}>
      <group ref={target}>
        <Suspense fallback={null}>
          {children}
          <OnMount run={compile} />
        </Suspense>
      </group>
    </group>
  );
}

// Inside Suspense this runs once every sibling has loaded.
export function OnMount({ run }) {
  const once = useRef(run);
  useEffect(() => {
    once.current();
  }, []);
  return null;
}
