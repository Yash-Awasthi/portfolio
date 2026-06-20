import { useEffect, useRef } from 'react';
import * as THREE from 'three';

// ── Config ────────────────────────────────────────────────────────────────────
const PARTICLE_COUNT   = 190;
const SPHERE_RADIUS    = 190;
const CONNECTION_DIST  = 72;
const ROTATE_Y         = 0.00055;
const PARALLAX_STR     = 55;
const PARALLAX_EASE    = 0.038;
const PULSE_SPAWN_INT  = 55;   // frames between ambient pulse spawns
const MAX_PULSES       = 35;

// ── Glow sprite ───────────────────────────────────────────────────────────────
function buildGlowTex(r, g, b) {
  const size = 64, half = 32;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');
  const gr  = ctx.createRadialGradient(half, half, 0, half, half, half);
  gr.addColorStop(0,    `rgba(${r},${g},${b},1)`);
  gr.addColorStop(0.28, `rgba(${r},${g},${b},0.65)`);
  gr.addColorStop(0.65, `rgba(${r},${g},${b},0.12)`);
  gr.addColorStop(1,    `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

// ── Fibonacci sphere positions ─────────────────────────────────────────────────
function fibSphere(n, radius) {
  const pts = [];
  const phi = Math.PI * (Math.sqrt(5) - 1);
  for (let i = 0; i < n; i++) {
    const y   = 1 - (i / (n - 1)) * 2;
    const r   = Math.sqrt(1 - y * y);
    const th  = phi * i;
    const rad = radius * (0.45 + 0.55 * Math.pow(Math.random(), 0.5));
    pts.push(new THREE.Vector3(
      Math.cos(th) * r * rad,
      y * rad,
      Math.sin(th) * r * rad,
    ));
  }
  return pts;
}

export default function HeroScene() {
  const mountRef = useRef(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;

    let W = el.clientWidth;
    let H = el.clientHeight;
    const isMobile = W < 640;
    const count    = isMobile ? 95 : PARTICLE_COUNT;
    const connDist = isMobile ? 80 : CONNECTION_DIST;

    // ── Renderer ────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    el.appendChild(renderer.domElement);

    // ── Scene + perspective camera ──────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(58, W / H, 1, 4000);
    camera.position.set(0, 0, 580);

    // camera parallax target
    let camTX = 0, camTY = 0;
    let mouseNX = 0, mouseNY = 0;

    // ── Main group (everything rotates together) ────────────────────────
    const group = new THREE.Group();
    scene.add(group);

    // ── Particle positions ──────────────────────────────────────────────
    const lpos = fibSphere(count, SPHERE_RADIUS);

    // ── Glow textures ───────────────────────────────────────────────────
    const nodeTex  = buildGlowTex(255, 215, 0);   // gold
    const pulseTex = buildGlowTex(255, 255, 200);  // near-white

    const nodeMat = new THREE.SpriteMaterial({
      map: nodeTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const pulseMat = new THREE.SpriteMaterial({
      map: pulseTex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // ── Node sprites ────────────────────────────────────────────────────
    const sprites = lpos.map((p, i) => {
      const s = new THREE.Sprite(nodeMat);
      s.position.copy(p);
      // vary base size — inner nodes slightly bigger
      const d = p.length() / SPHERE_RADIUS;
      s.scale.setScalar(10 + (1 - d) * 6);
      s.userData.baseScale = s.scale.x;
      s.userData.phase     = i * 0.43 + Math.random() * Math.PI;
      group.add(s);
      return s;
    });

    // ── Outer wireframe cage (icosahedron) ──────────────────────────────
    const cageGeo = new THREE.IcosahedronGeometry(SPHERE_RADIUS * 1.35, 2);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0xFFD700,
      wireframe: true,
      transparent: true,
      opacity: 0.028,
    });
    group.add(new THREE.Mesh(cageGeo, cageMat));

    // Inner cage (slower spin via group itself, we counter-spin to keep static feel)
    const innerCageGeo = new THREE.OctahedronGeometry(SPHERE_RADIUS * 0.55, 1);
    const innerCageMat = new THREE.MeshBasicMaterial({
      color: 0xFFDD00,
      wireframe: true,
      transparent: true,
      opacity: 0.05,
    });
    const innerCage = new THREE.Mesh(innerCageGeo, innerCageMat);
    group.add(innerCage);

    // ── Edge list (pre-computed, static in group space) ─────────────────
    const edges = [];
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        if (lpos[i].distanceTo(lpos[j]) < connDist) {
          edges.push({ i, j, phase: Math.random() * Math.PI * 2 });
        }
      }
    }

    const maxSeg = Math.min(edges.length, count * 5);
    const posArr = new Float32Array(maxSeg * 6);
    const colArr = new Float32Array(maxSeg * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    lineGeo.setAttribute('color',    new THREE.BufferAttribute(colArr, 3));
    const lineMesh = new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    group.add(lineMesh);

    // ── Pulse dot pool ──────────────────────────────────────────────────
    const POOL = 30;
    const dotPool = Array.from({ length: POOL }, () => {
      const s = new THREE.Sprite(pulseMat);
      s.scale.setScalar(20);
      s.visible = false;
      group.add(s);
      return s;
    });
    const pulses  = []; // {edgeIdx, t, speed, dotIdx}
    let pulseTimer = 0;

    const spawnPulse = (edgeIdx) => {
      if (pulses.length >= MAX_PULSES) return;
      const dotIdx = dotPool.findIndex(d => !d.visible);
      if (dotIdx < 0) return;
      dotPool[dotIdx].visible = true;
      pulses.push({ edgeIdx: edgeIdx ?? Math.floor(Math.random() * edges.length), t: 0, speed: 0.011 + Math.random() * 0.009, dotIdx });
    };

    // Start a few right away so it isn't empty on load
    setTimeout(() => { for (let i = 0; i < 5; i++) spawnPulse(); }, 400);

    // ── Raycasting for click ────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const onClick = (e) => {
      const rect = el.getBoundingClientRect();
      const ndc  = new THREE.Vector2(
        ((e.clientX - rect.left) / W) * 2 - 1,
       -(((e.clientY - rect.top) / H) * 2 - 1),
      );
      raycaster.setFromCamera(ndc, camera);
      // find closest edge midpoint to ray
      let best = Infinity, bestIdx = 0;
      for (let i = 0; i < edges.length; i++) {
        const mid = new THREE.Vector3().addVectors(lpos[edges[i].i], lpos[edges[i].j]).multiplyScalar(0.5);
        // transform mid to world space via group's matrix
        mid.applyMatrix4(group.matrixWorld);
        const d = raycaster.ray.distanceToPoint(mid);
        if (d < best) { best = d; bestIdx = i; }
      }
      // Burst pulses from that region
      for (let k = 0; k < 8; k++) {
        spawnPulse((bestIdx + k * 13) % edges.length);
      }
    };
    el.addEventListener('click', onClick);

    // ── Mouse ──────────────────────────────────────────────────────────
    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      mouseNX =  ((e.clientX - rect.left) / W) * 2 - 1;
      mouseNY = -(((e.clientY - rect.top) / H) * 2 - 1);
    };
    const onMouseLeave = () => { mouseNX = 0; mouseNY = 0; };
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    // ── Resize ──────────────────────────────────────────────────────────
    let resizeTid;
    const onResize = () => {
      clearTimeout(resizeTid);
      resizeTid = setTimeout(() => {
        W = el.clientWidth; H = el.clientHeight;
        camera.aspect = W / H;
        camera.updateProjectionMatrix();
        renderer.setSize(W, H);
      }, 80);
    };
    window.addEventListener('resize', onResize);

    // ── Animation loop ──────────────────────────────────────────────────
    let raf, frame = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      frame++;

      // ── Group rotation ────────────────────────────────────────────
      group.rotation.y += ROTATE_Y;
      group.rotation.x  = Math.sin(frame * 0.00022) * 0.18;
      // inner cage counter-rotates for extra depth
      innerCage.rotation.y -= ROTATE_Y * 2.3;
      innerCage.rotation.x  = Math.cos(frame * 0.00031) * 0.3;

      // ── Camera parallax ───────────────────────────────────────────
      camTX += (mouseNX * PARALLAX_STR - camTX) * PARALLAX_EASE;
      camTY += (mouseNY * PARALLAX_STR - camTY) * PARALLAX_EASE;
      camera.position.x = camTX;
      camera.position.y = camTY;
      camera.lookAt(0, 0, 0);

      // ── Sprite pulse ──────────────────────────────────────────────
      for (let i = 0; i < sprites.length; i++) {
        const s = sprites[i];
        const p = 1 + 0.22 * Math.sin(frame * 0.017 + s.userData.phase);
        s.scale.setScalar(s.userData.baseScale * p);
      }

      // ── Edge lines ────────────────────────────────────────────────
      const usedSeg = Math.min(edges.length, maxSeg);
      for (let e = 0; e < usedSeg; e++) {
        const { i, j, phase } = edges[e];
        const p0 = lpos[i], p1 = lpos[j];
        const b6 = e * 6;
        posArr[b6]   = p0.x; posArr[b6+1] = p0.y; posArr[b6+2] = p0.z;
        posArr[b6+3] = p1.x; posArr[b6+4] = p1.y; posArr[b6+5] = p1.z;

        // Breathing edge brightness
        const a = 0.07 + 0.06 * Math.sin(frame * 0.007 + phase);
        colArr[b6]   = a;        colArr[b6+1] = a * 0.843; colArr[b6+2] = 0;
        colArr[b6+3] = a;        colArr[b6+4] = a * 0.843; colArr[b6+5] = 0;
      }
      lineGeo.attributes.position.needsUpdate = true;
      lineGeo.attributes.color.needsUpdate    = true;
      lineGeo.setDrawRange(0, usedSeg * 2);

      // ── Ambient pulse spawn ───────────────────────────────────────
      if (++pulseTimer >= PULSE_SPAWN_INT && edges.length) {
        pulseTimer = 0;
        spawnPulse();
      }

      // ── Animate pulses ────────────────────────────────────────────
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.t += p.speed;

        if (p.dotIdx >= 0) {
          const { i: ei, j: ej } = edges[p.edgeIdx];
          const dot = dotPool[p.dotIdx];
          dot.position.lerpVectors(lpos[ei], lpos[ej], Math.min(p.t, 1));
          const fade = Math.sin(Math.min(p.t, 1) * Math.PI); // brighten then fade
          dot.scale.setScalar(20 * fade + 4);
          dot.material.opacity = 0.9 * fade;
        }

        if (p.t >= 1) {
          // release dot
          if (p.dotIdx >= 0) {
            dotPool[p.dotIdx].visible = false;
            dotPool[p.dotIdx].material.opacity = 1;
          }
          // propagate with ~70% chance
          if (Math.random() > 0.3 && edges.length) {
            const next = (p.edgeIdx + Math.floor(1 + Math.random() * 9)) % edges.length;
            spawnPulse(next);
          }
          pulses.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    };

    tick();

    // ── Cleanup ─────────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(resizeTid);
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
      el.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      [nodeTex, pulseTex].forEach(t => t.dispose());
      [nodeMat, pulseMat, cageMat, innerCageMat].forEach(m => m.dispose());
      [lineGeo, cageGeo, innerCageGeo].forEach(g => g.dispose());
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 cursor-crosshair"
      title="Click to send pulses"
    />
  );
}
