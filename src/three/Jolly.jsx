import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { CHANNELS, CLIPS, LOOPS, RUN_END, decide, touchFor } from './jollyMind';
import { compileLit } from './Stage';

const URL = '/jolly.glb';
const SHELLS = 48;
const FUR_LEN = 0.11;
const FURRY = ['Body', 'ArmL', 'ArmR', 'LegL', 'LegR'];
const DRAW_BASE = { LegL: 0, LegR: 0, Body: 100, ArmL: 200, ArmR: 200 };

const ROOT = new THREE.Color(0.46, 0.34, 0.25);
const TIP = new THREE.Color(0.70, 0.55, 0.42);
const SKIN = new THREE.Color(0.84, 0.60, 0.42);
const BLUSH = new THREE.Color(0.8, 0.36, 0.33);

// Shared by every shell: per-bone fur lag, the paws pressing in, and the clock for wind and breath.
const FUR_U = {
  uTime: { value: 0 },
  uLag: { value: Array.from({ length: 16 }, () => new THREE.Vector3()) },
  uPress: { value: [new THREE.Vector3(), new THREE.Vector3()] },
  uPressOn: { value: [0, 0] },
  uArm: { value: [0, 0, 0, 0] },
  uCap: { value: Array.from({ length: 4 }, () => new THREE.Vector3()) },
  uJig: { value: new THREE.Vector3() },
};

const FUR_VERT_HEAD = /* glsl */ `
attribute vec4 color;
uniform float uLayer;
uniform float uLen;
uniform float uComb;
uniform float uTime;
uniform vec3 uLag[16];
uniform vec3 uPress[2];
uniform float uPressOn[2];
uniform int uArm[4];
uniform vec3 uCap[4];
uniform vec3 uJig;
varying vec3 vRest;
varying vec3 vRestN;
varying vec3 vFur;
varying float vOccDyn;
varying float vNeck;
`;
const FUR_VERT_BODY = /* glsl */ `
vRest = position;
vRestN = normal;
vFur = color.rgb;
// belly and hood rim hang behind the body's own acceleration, so they jiggle after hops and landings
float jigBelly = smoothstep(0.7, 0.45, abs(position.x)) * smoothstep(0.3, 0.55, position.y) * smoothstep(1.25, 0.95, position.y) * smoothstep(-0.1, 0.3, position.z);
float jigHood = smoothstep(1.55, 1.8, position.y) * smoothstep(0.05, 0.4, position.z);
transformed.y += uJig.y * (jigBelly + 0.5 * jigHood);
transformed += normalize(objectNormal) * (-0.7 * uJig.y * jigBelly);
vec3 furBase = transformed;
// fur shortens where density fades and where surfaces press together (low baked AO)
// the neck band is where hood and torso meet: baked occlusion there is eased off so no seam shows
vNeck = smoothstep(1.0, 1.2, position.y) * smoothstep(1.62, 1.42, position.y);
float furH = uLayer * uLen * color.g * mix(0.25, 1.0, color.r) * mix(mix(0.35, 1.0, smoothstep(0.15, 0.7, color.b)), 1.0, vNeck);
// a paw resting on the fur flattens it, except on its own arm
int furOwn = int(skinWeight.x >= max(skinWeight.y, max(skinWeight.z, skinWeight.w)) ? skinIndex.x : skinWeight.y >= max(skinWeight.z, skinWeight.w) ? skinIndex.y : skinWeight.z >= skinWeight.w ? skinIndex.z : skinIndex.w);
for (int i = 0; i < 2; i++) {
  if (furOwn != uArm[i * 2] && furOwn != uArm[i * 2 + 1]) furH *= 1.0 - 0.55 * uPressOn[i] * smoothstep(0.32, 0.1, distance(furBase, uPress[i]));
}
// shade where a moving arm sits close (belly beside a paw) or where an arm tucks against the body;
// baked AO leaves both out because it cannot follow the pose
vOccDyn = 1.0;
bool furIsArm = furOwn == uArm[0] || furOwn == uArm[1] || furOwn == uArm[2] || furOwn == uArm[3];
for (int i = 0; i < 2; i++) {
  if (furOwn == uArm[i * 2] || furOwn == uArm[i * 2 + 1]) continue;
  vec3 ca = uCap[i * 2];
  vec3 cb = uCap[i * 2 + 1];
  vec3 cd = cb - ca;
  ca -= cd * 0.5;
  cd *= 2.0;
  float ct = clamp(dot(furBase - ca, cd) / max(dot(cd, cd), 1e-4), 0.0, 1.0);
  float cdist = distance(furBase, ca + cd * ct);
  vOccDyn *= 1.0 - 0.5 * smoothstep(0.45, 0.17, cdist);
  // layers of two touching parts would slice through each other, so the fur gives way live
  furH *= mix(0.45, 1.0, smoothstep(0.17, 0.3, cdist));
}
if (furIsArm) {
  float inBody = length((furBase - vec3(0.0, 0.82, 0.04)) / vec3(0.72, 0.58, 0.66));
  vOccDyn *= 1.0 - 0.45 * smoothstep(1.3, 1.0, inBody);
  furH *= mix(0.45, 1.0, smoothstep(1.0, 1.15, inBody));
}
// fur shortens toward the silhouette, where strands seen edge-on would show as pointy tufts
vec3 furNV = normalize(normalMatrix * objectNormal);
vec3 furPV = (modelViewMatrix * vec4(furBase, 1.0)).xyz;
furH *= mix(mix(0.5, 1.0, smoothstep(0.05, 0.4, abs(dot(furNV, normalize(-furPV))))), 1.0, vNeck * 0.7);
// slow breathing ripple running down the body
furH *= 1.0 + 0.06 * sin(uTime * 1.7 - furBase.y * 4.0);
transformed += normalize(objectNormal) * furH;
transformed.y -= uComb * furH * uLayer;
// tips trail behind moving parts and sway in a light breeze; roots stay put
vec3 furLag = uLag[int(skinIndex.x)] * skinWeight.x + uLag[int(skinIndex.y)] * skinWeight.y + uLag[int(skinIndex.z)] * skinWeight.z + uLag[int(skinIndex.w)] * skinWeight.w;
vec3 furWind = vec3(sin(uTime * 1.3 + furBase.y * 3.1 + furBase.z * 2.0), 0.0, sin(uTime * 1.1 + furBase.x * 2.7 + furBase.y * 1.7)) * 0.006;
transformed += (furLag + furWind) * pow(uLayer, 1.6) * color.g;
`;
const FUR_FRAG_HEAD = /* glsl */ `
uniform float uLayer;
uniform float uDensity;
uniform float uLen;
uniform float uSlant;
uniform float uStretch;
uniform vec3 uRoot;
uniform vec3 uTip;
varying vec3 vRest;
varying vec3 vRestN;
varying vec3 vFur;
varying float vOccDyn;
varying float vNeck;
const mat3 FUR_ROT = mat3(0.788, -0.461, 0.408, 0.577, 0.789, -0.211, -0.215, 0.406, 0.888);
vec3 furHash(vec3 p) {
  p = fract(p * vec3(0.1031, 0.1030, 0.0973));
  p += dot(p, p.yxz + 33.33);
  return fract((p.xxy + p.yxx) * p.zyx);
}
`;
// Each grid cell holds one strand of random height that tapers to a point. Shells blend in order
// from the skin out, so the fibres average into soft plush instead of aliasing into grain.
const FUR_FRAG_BODY = /* glsl */ `
float furA = 1.0;
float furAO = mix(vFur.b, 1.0, vNeck);
if (uLayer > 0.0) {
  // strands lean down the skin and the cell stretches along that comb
  vec3 n = normalize(vRestN);
  vec3 comb = vec3(0.0, -1.0, 0.0) - n * dot(vec3(0.0, -1.0, 0.0), n);
  comb = length(comb) > 1e-3 ? normalize(comb) : vec3(1.0, 0.0, 0.0);
  vec3 p = vRest + comb * uLayer * uLen * uSlant;
  vec3 q = FUR_ROT * p * uDensity;
  vec3 c = floor(q);
  vec3 r = furHash(c);
  float h = 0.7 + 0.3 * furHash(c + 17.0).x;
  float rad = 0.78 * (1.0 - pow(uLayer / h, 2.2));
  vec3 off = transpose(FUR_ROT) * (fract(q) - (0.3 + 0.4 * r));
  off -= n * dot(off, n);
  float along = dot(off, comb);
  float d = length(off - comb * along * (1.0 - uStretch));
  furA = (uLayer > h || furHash(c + 5.0).y > vFur.x) ? 0.0 : smoothstep(rad, rad - 0.18, d);
  // stacked shells show as bands where the skin turns away; thin them there
  float facing = abs(dot(normalize(vNormal), normalize(vViewPosition)));
  furA *= mix(mix(mix(0.15, 0.6, uLayer), 1.0, vNeck * 0.75), 1.0, smoothstep(0.05, 0.5, facing)) * mix(smoothstep(0.2, 0.6, furAO), 1.0, 1.0 - uLayer);
  if (furA < 0.01) discard;
}
float occ = mix(furAO, 1.0, uLayer * 0.45) * vOccDyn;
diffuseColor.rgb = mix(uRoot, uTip, pow(uLayer, 0.7)) * mix(0.72, 1.0, uLayer) * mix(0.3, 1.0, occ);
// light catching the tips along the silhouette
float furRim = 1.0 - abs(dot(normalize(vNormal), normalize(vViewPosition)));
diffuseColor.rgb += uTip * 0.35 * pow(furRim, 3.0) * uLayer * occ;
diffuseColor.a = furA;
`;

function furMaterial(layer) {
  const m = new THREE.MeshStandardMaterial({ roughness: 1, metalness: 0, envMapIntensity: 0.18, toneMapped: false });
  if (layer > 0) { m.transparent = true; m.depthWrite = false; }
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, {
      uLayer: { value: layer },
      uLen: { value: FUR_LEN },
      uComb: { value: 0.35 },
      uDensity: { value: 110 },
      uSlant: { value: 1.6 },
      uStretch: { value: 0.45 },
      uRoot: { value: ROOT },
      uTip: { value: TIP },
      ...FUR_U,
    });
    s.vertexShader = FUR_VERT_HEAD + s.vertexShader.replace('#include <skinning_vertex>', '#include <skinning_vertex>\n' + FUR_VERT_BODY);
    s.fragmentShader = FUR_FRAG_HEAD + s.fragmentShader.replace('#include <map_fragment>', FUR_FRAG_BODY);
  };
  m.customProgramCacheKey = () => 'jolly-fur';
  return m;
}

function skinMaterial() {
  const m = new THREE.MeshPhysicalMaterial({ color: SKIN, toneMapped: false, envMapIntensity: 0.4, roughness: 0.55, sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color(1, 0.85, 0.75) });
  m.userData.joy = { value: 0 };
  m.userData.blush = { value: 0 };
  m.onBeforeCompile = (s) => {
    s.uniforms.uBlush = { value: BLUSH };
    s.uniforms.uJoy = m.userData.joy;
    s.uniforms.uShy = m.userData.blush;
    s.vertexShader =
      'attribute vec4 color;\nvarying vec3 vLocal;\nvarying float vOcc;\n' +
      s.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvLocal = position;\nvOcc = color.b;');
    s.fragmentShader =
      'uniform vec3 uBlush;\nuniform float uJoy;\nuniform float uShy;\nvarying vec3 vLocal;\nvarying float vOcc;\n' +
      s.fragmentShader.replace(
        '#include <map_fragment>',
        `float blush = 0.0;
for (int i = 0; i < 2; i++) {
  vec2 c = vec2(i == 0 ? 0.32 : -0.32, -0.11);
  blush = max(blush, min(1.0, 0.75 + 0.2 * uJoy + 0.3 * uShy) * smoothstep(0.17 + 0.03 * uJoy + 0.05 * uShy, 0.0, length(vLocal.xy - c)));
}
diffuseColor.rgb = mix(diffuseColor.rgb, uBlush, blush) * mix(mix(0.55, 0.95, uJoy), 1.0, vOcc);`,
      );
  };
  return m;
}

const EYE = new THREE.MeshStandardMaterial({ color: '#030303', toneMapped: false, envMapIntensity: 0, roughness: 0.45 });
const GLINT = new THREE.MeshBasicMaterial({ color: '#ffffff', toneMapped: false });
const MOUTH = new THREE.MeshBasicMaterial({ color: '#1a1412', side: THREE.DoubleSide });
const MOUTH_LINE = new THREE.Color('#1a1412');
const HIDE = new THREE.MeshBasicMaterial({ visible: false });
const MOUTH_IN = new THREE.Color('#4a2320');
const TONGUE = new THREE.MeshBasicMaterial({ color: '#e5847c', toneMapped: false, side: THREE.DoubleSide });

// Morph targets baked in Blender (jolly_face.py); each part has its own subset of these names.
function setMorph(mesh, name, v) {
  const i = mesh.morphTargetDictionary?.[name];
  if (i != null) mesh.morphTargetInfluences[i] = v;
}

const BUBBLE = new THREE.MeshStandardMaterial({ color: '#fbf7f2', roughness: 0.6, toneMapped: false });
const BUBBLE_PUFFS = [
  [0.5, 2.28, 0.2, 0.045], [0.62, 2.44, 0.2, 0.07], [0.86, 2.66, 0.18, 0.13], [1.02, 2.72, 0.16, 0.12], [0.94, 2.82, 0.16, 0.11],
];
const BLINK_EVERY = [2.5, 5.5];
const SPRING = { base: [95, 13], runX: [400, 40], say: [40, 10], joy: [60, 11], blus: [30, 11], ooh: [200, 22], pout: [120, 16], lid: [300, 35], squi: [200, 24], eyeX: [220, 22], eyeY: [220, 22], head: [130, 16], hand: [60, 8.5], bubb: [18, 8], squa: [300, 14], root: [45, 9], lift: [70, 9], legR: [160, 15], legL: [160, 15] };
const ONE = new THREE.Vector3(1, 1, 1);
const Q = new THREE.Quaternion();
const E = new THREE.Euler();
const P = new THREE.Vector3();
const RAY = new THREE.Raycaster();
const REACHING = new Set(['cheek', 'head', 'belly']);

// Rotates a bone by an offset given in the model frame, measured from its rest pose.
function pose(rig, name, x, y, z, order = 'YXZ') {
  const b = rig[name];
  Q.setFromEuler(E.set(x, y, z, order));
  b.bone.quaternion.copy(b.parentInv).multiply(Q).multiply(b.parent).multiply(b.anim);
}

// Clones the rig (so the cached GLTF stays untouched), swaps in the materials and grows the shells.
function build(source, animations, shells) {
  const scene = cloneSkinned(source);
  const nodes = {};
  scene.traverse((o) => {
    if (o.name) nodes[o.name] = o;
  });
  for (const name of FURRY) {
    const src = nodes[name];
    src.material = shells[0];
    src.frustumCulled = false;
    // rest-pose bounds stand in for skinned ones, which three would recompute per vertex on the CPU
    src.geometry.computeBoundingBox();
    src.geometry.computeBoundingSphere();
    src.boundingBox = src.geometry.boundingBox;
    src.boundingSphere = src.geometry.boundingSphere;
    for (let i = 1; i <= SHELLS; i++) {
      const s = new THREE.SkinnedMesh(src.geometry, shells[i]);
      s.bind(src.skeleton, src.bindMatrix);
      s.boundingBox = src.boundingBox;
      s.boundingSphere = src.boundingSphere;
      s.position.copy(src.position); s.quaternion.copy(src.quaternion); s.scale.copy(src.scale);
      s.frustumCulled = false;
      // the arms draw after the body and the body after the legs, or body fur shows through arm fur
      s.renderOrder = i + DRAW_BASE[name];
      s.raycast = () => {};
      src.parent.add(s);
    }
  }
  nodes.Face.material = skinMaterial();
  nodes.EyeL.material = nodes.EyeR.material = nodes.LashL.material = nodes.LashR.material = EYE;
  nodes.LashL.raycast = nodes.LashR.raycast = () => {};
  nodes.GlintL.material = nodes.GlintR.material = GLINT;
  nodes.Mouth.material = MOUTH;
  nodes.Tongue.material = TONGUE;
  for (const n of ['Mouth', 'Tongue']) nodes[n].raycast = () => {};
  scene.updateMatrixWorld(true);
  const rest = {};
  for (const n of ['EyeL', 'EyeR', 'GlintL', 'GlintR', 'LashL', 'LashR']) rest[n] = nodes[n].position.clone();
  const face = { rest };
  const rig = {};
  for (const name of ['root', 'spine', 'head', 'arm_R', 'hand_R', 'arm_L', 'hand_L', 'leg_R', 'leg_L']) {
    const bone = nodes[name];
    const parent = bone.parent.getWorldQuaternion(new THREE.Quaternion());
    rig[name] = { bone, rest: bone.quaternion.clone(), anim: bone.quaternion.clone(), mix: bone.quaternion.clone(), mixPos: bone.position.clone(), mixScale: bone.scale.clone(), parent, parentInv: parent.clone().invert(), pos: bone.position.clone(), animPos: bone.position.clone(), animScale: bone.scale.clone() };
  }
  for (const [side, sx] of [['R', 1], ['L', -1]]) {
    rig['chain' + side] = {
      s: nodes['arm_' + side].getWorldPosition(new THREE.Vector3()),
      e: nodes['hand_' + side].getWorldPosition(new THREE.Vector3()),
      w: new THREE.Vector3(sx * 0.8, 0.4, 0.15),
    };
  }
  const fur = furRig(nodes);
  const mixer = new THREE.AnimationMixer(scene);
  for (const c of animations) if (import.meta.env.DEV && Math.abs(c.duration - CLIPS[c.name]) > 0.02) console.warn('clip length', c.name, c.duration);
  const clips = Object.fromEntries(animations.map((c) => [c.name, mixer.clipAction(c)]));
  return { scene, nodes, rig, face, mixer, clips, fur, touchable: proxies(nodes) };
}

// One sample point per bone (the weighted centre of the fur it carries), tracked in mesh space with a
// spring follower; the gap between them is how far that bone's fur tips trail.
function furRig(nodes) {
  const { skeleton, bindMatrix, bindMatrixInverse } = nodes.Body;
  const n = skeleton.bones.length;
  const sum = Array.from({ length: n }, () => new THREE.Vector3());
  const wt = new Float32Array(n);
  for (const name of FURRY) {
    const g = nodes[name].geometry;
    const { position: pos, skinIndex: si, skinWeight: sw } = g.attributes;
    for (let v = 0; v < pos.count; v++) {
      for (let k = 0; k < 4; k++) {
        const w = sw.getComponent(v, k);
        const b = si.getComponent(v, k);
        sum[b].x += pos.getX(v) * w;
        sum[b].y += pos.getY(v) * w;
        sum[b].z += pos.getZ(v) * w;
        wt[b] += w;
      }
    }
  }
  const rest = sum.map((p, i) => p.divideScalar(Math.max(wt[i], 1e-6)));
  const idx = (b) => skeleton.bones.indexOf(nodes[b]);
  FUR_U.uArm.value = [idx('arm_R'), idx('hand_R'), idx('arm_L'), idx('hand_L')];
  return { skeleton, bindMatrix, bindMatrixInverse, rest, now: rest.map((p) => p.clone()), q: null, v: rest.map(() => new THREE.Vector3()), hands: [idx('hand_R'), idx('hand_L')], arms: [idx('arm_R'), idx('arm_L')] };
}

const FM = new THREE.Matrix4();
const FV = new THREE.Vector3();
function moveFur(fur, dt, pressR, pressL, t) {
  const { skeleton, bindMatrix, bindMatrixInverse, rest, now } = fur;
  for (let i = 0; i < rest.length; i++) {
    FM.multiplyMatrices(skeleton.bones[i].matrixWorld, skeleton.boneInverses[i]).premultiply(bindMatrixInverse).multiply(bindMatrix);
    now[i].copy(rest[i]).applyMatrix4(FM);
  }
  fur.q ??= now.map((p) => p.clone());
  const steps = Math.ceil(dt * 240);
  const h = dt / Math.max(steps, 1);
  for (let i = 0; i < rest.length; i++) {
    const q = fur.q[i];
    const v = fur.v[i];
    for (let k = 0; k < steps; k++) {
      v.addScaledVector(FV.subVectors(now[i], q).multiplyScalar(70).addScaledVector(v, -7), h);
      q.addScaledVector(v, h);
    }
    FUR_U.uLag.value[i].subVectors(q, now[i]).clampLength(0, 0.08).multiplyScalar(0.7);
  }
  FUR_U.uPress.value[0].copy(now[fur.hands[0]]);
  FUR_U.uPress.value[1].copy(now[fur.hands[1]]);
  fur.hands.forEach((h, i) => {
    FUR_U.uCap.value[i * 2].copy(now[fur.arms[i]]);
    FUR_U.uCap.value[i * 2 + 1].copy(now[h]);
  });
  FUR_U.uPressOn.value[0] = THREE.MathUtils.clamp(pressR, 0, 1);
  FUR_U.uPressOn.value[1] = THREE.MathUtils.clamp(pressL, 0, 1);
  FUR_U.uTime.value = t;
}

const V1 = new THREE.Vector3();
const V2 = new THREE.Vector3();
const V3 = new THREE.Vector3();
const QA = new THREE.Quaternion();
const QB = new THREE.Quaternion();
const QI = new THREE.Quaternion();
const POLE = new THREE.Vector3();

// Two-bone reach: places the paw at `target` with the elbow bent toward `pole`, then blends the
// solved arm and hand rotations over the pose already on the bones by `w`.
function reachFor(rig, side, target, w) {
  const c = rig['chain' + side];
  const l1 = c.s.distanceTo(c.e);
  const l2 = c.e.distanceTo(c.w);
  const dir = V1.subVectors(target, c.s);
  const d = THREE.MathUtils.clamp(dir.length(), Math.abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3);
  dir.normalize();
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  POLE.set(side === 'R' ? 1 : -1, -0.6, -0.3);
  const up = V2.copy(POLE).addScaledVector(dir, -POLE.dot(dir)).normalize();
  const elbow = V3.copy(c.s).addScaledVector(dir, l1 * cosA).addScaledVector(up, l1 * Math.sqrt(Math.max(0, 1 - cosA * cosA)));
  const paw = V2.copy(c.s).addScaledVector(dir, d);
  QA.setFromUnitVectors(V1.subVectors(c.e, c.s).normalize(), elbow.clone().sub(c.s).normalize());
  const rest2 = V1.subVectors(c.w, c.e).normalize().applyQuaternion(QA);
  QB.setFromUnitVectors(rest2, paw.sub(elbow).normalize());
  QI.copy(QA).invert();
  const arm = rig['arm_' + side];
  const hand = rig['hand_' + side];
  const qa = Q.copy(arm.parentInv).multiply(QA).multiply(arm.parent).multiply(arm.rest);
  arm.bone.quaternion.slerp(qa, w);
  const qh = Q.copy(hand.parentInv).multiply(QI).multiply(QB).multiply(QA).multiply(hand.parent).multiply(hand.rest);
  hand.bone.quaternion.slerp(qh, w);
}
const TARGET = new THREE.Vector3();
const NECK = new THREE.Vector3(0, 1.25, 0);

// Raycasting skinned meshes re-skins every vertex on the CPU, so touches hit these low-poly stand-ins
// riding the bones instead: [name, bone, centre, radii] in the model frame.
const PROXIES = [
  ['Head', 'head', [0, 1.8, 0.02], [0.6, 0.56, 0.52]],
  ['Body', 'spine', [0, 0.82, 0.04], [0.72, 0.58, 0.66]],
  ['ArmR', 'arm_R', [0.53, 1.04, 0.04], [0.16, 0.3, 0.16]],
  ['ArmR', 'hand_R', [0.79, 0.62, 0.1], [0.17, 0.26, 0.17]],
  ['ArmL', 'arm_L', [-0.53, 1.04, 0.04], [0.16, 0.3, 0.16]],
  ['ArmL', 'hand_L', [-0.79, 0.62, 0.1], [0.17, 0.26, 0.17]],
  ['LegR', 'leg_R', [0.28, 0.18, 0.04], [0.23, 0.2, 0.23]],
  ['LegL', 'leg_L', [-0.28, 0.18, 0.04], [0.23, 0.2, 0.23]],
];
const PROXY_GEO = new THREE.SphereGeometry(1, 12, 8);
function proxies(nodes) {
  return PROXIES.map(([name, bone, c, r]) => {
    const m = new THREE.Mesh(PROXY_GEO, HIDE);
    m.name = name;
    m.position.fromArray(c);
    m.scale.fromArray(r);
    m.updateMatrixWorld();
    nodes[bone].attach(m);
    return m;
  });
}

export function Jolly({ calm }) {
  const { scene: source, animations } = useGLTF(URL);
  const group = useRef();
  const bubble = useRef();
  const model = useMemo(() => build(source, animations, Array.from({ length: SHELLS + 1 }, (_, i) => furMaterial(i / SHELLS))), [source, animations]);
  const live = useRef(null);
  const gl = useThree((st) => st.gl);
  const camera = useThree((st) => st.camera);
  const stage = useThree((st) => st.scene);
  const clock = useThree((st) => st.clock);
  const [ready, setReady] = useState(false);
  // compile off the main thread first; a synchronous first draw froze the page for ~2s
  useEffect(() => {
    let on = true;
    compileLit(gl, model.scene, camera, stage).then(() => on && setReady(true));
    return () => {
      on = false;
    };
  }, [gl, camera, stage, model]);
  const mind = useRef({ nx: 0, ny: 0, touch: null, lastMove: 0, clicks: 0, clickAt: null, moved: false, clicked: false, tx: 100, press: null, grab: null, dragged: false, turning: 0, touchUntil: 0, ndc: new THREE.Vector2(), cur: null, blinkAt: 2, t0: null, view: 1, wave: [], hold: null, live: new Set(), fade: 0.3 });
  useLayoutEffect(() => {
    live.current = model;
  }, [model]);

  // The hero wrapper ignores pointer events, so hits are cast here from window coordinates.
  useEffect(() => {
    const m = mind.current;
    const now = () => (m.t0 == null ? 0 : clock.elapsedTime - m.t0);
    const stageEl = () => document.getElementById('hero-jolly');
    const toStage = (x, y) => {
      const r = stageEl()?.getBoundingClientRect();
      return r && { nx: (x - (r.left + r.width / 2)) / (r.height / 2), ny: (y - (r.top + r.height / 2)) / (r.height / 2), r };
    };
    const locate = (e) => {
      const p = toStage(e.clientX, e.clientY);
      if (!p) return null;
      m.nx = p.nx;
      m.ny = p.ny;
      m.ndc.set(((e.clientX - p.r.left) / p.r.width) * 2 - 1, -((e.clientY - p.r.top) / p.r.height) * 2 + 1);
      m.moved = true;
      return m;
    };
    const onClick = (e) => {
      if (!locate(e)) return;
      if (!m.dragged) m.clicked = true;
      m.dragged = false;
    };
    const onDown = (e) => {
      if (!locate(e)) return;
      if (e.pointerType === 'mouse' && e.button === 0) m.press = { x: e.clientX, yaw: m.cur?.rootYaw ?? 0 };
      if (e.pointerType === 'touch') m.hold = { x: e.clientX, y: e.clientY, at: now(), on: null };
    };
    const onMove = (e) => {
      if (!locate(e)) return;
      if (m.hold && Math.hypot(e.clientX - m.hold.x, e.clientY - m.hold.y) > 10) m.hold = null;
      // quick back-and-forth over the belly counts as tickling
      if (m.touch === 'belly' && e.pointerType === 'mouse') {
        const dir = Math.sign(e.movementX);
        if (dir && dir !== m.lastDir) m.wave.push(now());
        m.lastDir = dir || m.lastDir;
        m.wave = m.wave.filter((w) => now() - w < 1);
        if (m.wave.length >= 5) m.tickleUntil = now() + 1.2;
      }
      if (!m.grab) return;
      m.grab.yaw = m.grab.yaw0 + ((e.clientX - m.grab.x) / stageEl().clientWidth) * Math.PI * 2.4;
      m.dragged = true;
    };
    const onUp = () => {
      m.press = null;
      m.grab = null;
      if (m.hug) m.dragged = true;
      m.hold = null;
      m.hug = false;
      document.body.style.userSelect = '';
    };
    const onOut = (e) => {
      if (e.relatedTarget || e.pointerType === 'touch') return;
      m.away = true;
      m.awayAt = now();
    };
    const onOver = (e) => {
      if (m.away) {
        m.away = false;
        m.backAt = now();
      }
      // links and buttons draw his eyes; "View work" thrills him
      const a = e.target.closest?.('a, button');
      if (!a || stageEl()?.contains(a)) return (m.look = null);
      const r = a.getBoundingClientRect();
      const p = toStage(r.left + r.width / 2, r.top + r.height / 2);
      m.look = p && { nx: p.nx, ny: p.ny, kind: /view work/i.test(a.textContent) ? 'work' : 'link' };
    };
    const onMenu = (e) => {
      if (m.hug) e.preventDefault();
    };
    const el = stageEl();
    // he waves goodbye as the hero scrolls away and says hi again when it returns
    const io = new IntersectionObserver(
      ([en]) => {
        // the run-in slides the stage in from off screen, which is not a scroll
        if (now() < RUN_END + 0.5) return;
        m.view = en.intersectionRatio;
        if (m.view < 0.35 && !m.gone) {
          m.gone = true;
          m.byeAt = now();
        } else if (m.view > 0.6 && m.gone) {
          m.gone = false;
          m.hiAt = now();
        }
      },
      { threshold: Array.from({ length: 11 }, (_, i) => i / 10) },
    );
    if (el) {
      io.observe(el);
      el.style.webkitTouchCallout = 'none';
    }
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('click', onClick);
    window.addEventListener('contextmenu', onMenu);
    document.addEventListener('pointerout', onOut);
    document.addEventListener('pointerover', onOver);
    return () => {
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('click', onClick);
      window.removeEventListener('contextmenu', onMenu);
      document.removeEventListener('pointerout', onOut);
      document.removeEventListener('pointerover', onOver);
    };
  }, [clock]);

  useFrame((state, dt) => {
    if (!live.current || !ready) return;
    const { rig, nodes, face, mixer, clips } = live.current;
    const m = mind.current;
    m.t0 ??= state.clock.elapsedTime;
    const t = state.clock.elapsedTime - m.t0;
    if (m.moved || m.clicked || m.hold) {
      RAY.setFromCamera(m.ndc, state.camera);
      const hit = RAY.intersectObjects(live.current.touchable, false)[0];
      const name = hit?.object.name;
      let found = hit ? touchFor(name, group.current.worldToLocal(P.copy(hit.point)).y) : null;
      // a paw that reached in to touch is not itself a new touch
      if (found?.startsWith('wave') && REACHING.has(m.touch)) found = m.touch;
      // a touch lingers briefly so a quick pass still plays the reaction
      if (found) { m.touch = found; m.touchUntil = t + 0.7; m.touchSide = group.current.worldToLocal(P.copy(hit.point)).x < 0 ? 'L' : 'R'; }
      // a resting pointer keeps its touch even if the pose slides the part out from under it
      if (m.moved) m.over = !!hit;
      if (m.clicked && hit) {
        m.clicks += 1;
        m.clickAt = t;
      }
      // a press on Jolly picks him up; dragging then spins him
      if (m.press && hit && !m.grab) {
        m.grab = { x: m.press.x, yaw0: m.press.yaw, yaw: m.press.yaw };
        document.body.style.userSelect = 'none';
      }
      // a still finger held on him for a moment is a hug
      if (m.hold) {
        m.hold.on ??= !!hit;
        if (m.hold.on && t - m.hold.at > 0.45) m.hug = true;
      }
      m.press = null;
      document.body.style.cursor = m.grab ? 'grabbing' : hit ? 'grab' : '';
      if (m.moved) {
        if (m.prev?.clip === 'sleepy') m.wakeAt = t;
        m.lastMove = t;
      }
      m.moved = m.clicked = false;
    }
    if (m.touch && !m.over && t > m.touchUntil) m.touch = null;
    m.turning = m.cur ? Math.abs((m.prev?.rootYaw ?? 0) - m.cur.rootYaw) * 6 : 0;
    m.tickle = t < (m.tickleUntil ?? -1);
    const target = decide({ ...m, calm }, t);
    m.prev = target;
    if (!m.cur) {
      m.cur = { ...target };
      m.vel = Object.fromEntries(CHANNELS.map((c) => [c, 0]));
    }
    // underdamped springs give plush follow-through; hands are looser so they trail the arms
    const steps = Math.ceil(Math.min(dt, 0.1) * 240);
    const h = Math.min(dt, 0.1) / Math.max(steps, 1);
    for (let i = 0; i < steps; i++) {
      for (const c of CHANNELS) {
        const [stiff, damp] = SPRING[c.slice(0, 4)] ?? SPRING.base;
        m.vel[c] += ((target[c] - m.cur[c]) * stiff - m.vel[c] * damp) * h;
        m.cur[c] += m.vel[c] * h;
      }
    }
    const p = m.cur;

    // the chosen clip crossfades in, synced to when the mind started it
    const key = target.clip + '@' + target.clipAt;
    if (key !== m.clipKey) {
      const next = clips[target.clip];
      const loop = LOOPS.has(target.clip);
      m.fade = m.action === clips.run ? 0.12 : 0.3;
      if (!m.live.has(next)) next.reset().setEffectiveWeight(0);
      next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
      next.clampWhenFinished = !loop;
      next.time = loop ? 0 : Math.min(Math.max(0, t - target.clipAt), next.getClip().duration);
      next.paused = false;
      next.play();
      m.live.add(next);
      m.action = next;
      m.clipKey = key;
    }
    // weights are faded by hand: three's own fades stall on a finished clip, which then never lets go
    for (const a of m.live) {
      const w = THREE.MathUtils.clamp(a.getEffectiveWeight() + ((a === m.action ? 1 : -1) * Math.min(dt, 0.1)) / m.fade, 0, 1);
      a.setEffectiveWeight(w);
      if (w === 0 && a !== m.action) {
        a.stop();
        m.live.delete(a);
      }
    }
    // the procedural layer goes on top of the clip result; bones go back to that result first because
    // the mixer skips writing a value it already wrote, and would leave last frame's layered pose
    for (const k in rig) {
      const b = rig[k];
      if (!b.bone) continue;
      b.bone.quaternion.copy(b.mix);
      b.bone.position.copy(b.mixPos);
      b.bone.scale.copy(b.mixScale);
    }
    mixer.update(Math.min(dt, 0.1));
    for (const k in rig) {
      const b = rig[k];
      if (!b.bone) continue;
      b.mix.copy(b.bone.quaternion);
      b.mixPos.copy(b.bone.position);
      b.mixScale.copy(b.bone.scale);
      // reduced motion plays every clip at half strength
      b.anim.copy(b.bone.quaternion);
      b.animPos.copy(b.bone.position);
      b.animScale.copy(b.bone.scale);
    }
    pose(rig, 'head', p.headPitch, p.headYaw, -p.headRoll);
    pose(rig, 'spine', p.spinePitch, p.spineYaw, -p.spineRoll);
    // secondary motion: a lagging mass follows the body's vertical acceleration; arms swing with it
    // and a hard landing kicks a short squash
    const J = (m.jig ??= { y: 0, vy: 0, py: 0, pvy: 0, ay: 0, land: 0, landV: 0, init: false });
    const jdt = Math.min(Math.max(dt, 1 / 240), 0.05);
    const ry = rig.root.animPos.y - rig.root.pos.y + p.lift;
    const rvy = (ry - J.py) / jdt;
    if (J.init) {
      J.ay += ((rvy - J.pvy) / jdt - J.ay) * Math.min(1, jdt * 18);
      if (J.pvy < -1 && rvy > J.pvy * 0.5 && ry < 0.05) J.landV += THREE.MathUtils.clamp(-J.pvy * 0.35, 0, 1.4);
    }
    J.init = true;
    J.py = ry;
    J.pvy = rvy;
    J.vy += (-130 * J.y - 9 * J.vy - J.ay * 0.9) * jdt;
    J.y = THREE.MathUtils.clamp(J.y + J.vy * jdt, -0.04, 0.04);
    J.landV += (-300 * J.land - 14 * J.landV) * jdt;
    J.land += J.landV * jdt;
    FUR_U.uJig.value.y = J.y;
    const swing = J.y * 2.5 * (calm ? 0.5 : 1);
    pose(rig, 'arm_R', -p.armR_fwd, 0, p.armR_side + swing, 'XYZ');
    pose(rig, 'arm_L', -p.armL_fwd, 0, -(p.armL_side + swing), 'XYZ');
    pose(rig, 'hand_R', -p.handR_bend, 0, 0);
    pose(rig, 'hand_L', -p.handL_bend, 0, 0);
    for (const side of ['R', 'L']) {
      const w = p[`ik${side}_w`];
      if (w > 0.01) {
        TARGET.set(p[`ik${side}_x`], p[`ik${side}_y`], p[`ik${side}_z`]).divideScalar(Math.max(w, 1e-3));
        // a paw on the head rides the head's own nod and tilt (about its neck pivot)
        const onHead = THREE.MathUtils.smoothstep(TARGET.y, 1.3, 1.5);
        if (onHead > 0) {
          Q.setFromEuler(E.set(p.headPitch, p.headYaw, -p.headRoll, 'YXZ'));
          TARGET.lerp(P.set(0, -1.25, 0).add(TARGET).applyQuaternion(Q).add(NECK), onHead);
        }
        reachFor(rig, side, TARGET, Math.min(1, w));
      }
    }
    pose(rig, 'leg_R', -p.legR, 0, 0);
    pose(rig, 'leg_L', -p.legL, 0, 0);
    rig.leg_R.bone.position.copy(rig.leg_R.animPos).add(P.set(0, p.legR_up, 0));
    rig.leg_L.bone.position.copy(rig.leg_L.animPos).add(P.set(0, p.legL_up, 0));
    pose(rig, 'root', 0, p.rootYaw, p.rootRoll);
    const root = rig.root.bone;
    root.position.copy(rig.root.animPos).add(P.set(0, p.lift, 0));
    const sq = p.squash + J.land;
    root.scale.copy(rig.root.animScale).multiply(P.set(1 + sq * 0.6, 1 - sq, 1 + sq * 0.6));
    live.current.scene.updateMatrixWorld();
    moveFur(live.current.fur, Math.min(dt, 0.1), p.ikR_w, p.ikL_w, t);
    bubble.current.visible = p.bubble > 0.02;
    bubble.current.children.forEach((c, i) => c.scale.setScalar(THREE.MathUtils.clamp(p.bubble * 1.6 - i * 0.15, 0, 1) * BUBBLE_PUFFS[i][3]));
    if (t > m.blinkAt) m.blinkAt = t + BLINK_EVERY[0] + Math.random() * (BLINK_EVERY[1] - BLINK_EVERY[0]);
    const blink = Math.min(1, Math.abs(m.blinkAt - BLINK_EVERY[0] - t - 0.07) / 0.07 + 0.08);
        const joy = THREE.MathUtils.clamp(p.joy, 0, 1);
    const ooh = THREE.MathUtils.clamp(p.ooh, 0, 1);
    const squint = THREE.MathUtils.clamp(p.squint, 0, 1);
    const pout = THREE.MathUtils.clamp(p.pout, 0, 1);
    // eyes dart between small fixed points now and then, with a faint tremor in between
    const sac = (m.sac ??= { x: 0, y: 0, tx: 0, ty: 0, at: 0 });
    if (t > sac.at) {
      sac.at = t + 0.5 + Math.random() * 1.8;
      sac.tx = (Math.random() - 0.5) * 0.5;
      sac.ty = (Math.random() - 0.5) * 0.3;
    }
    const jump = Math.min(1, dt * 30);
    sac.x += (sac.tx - sac.x) * jump;
    sac.y += (sac.ty - sac.y) * jump;
    const look = THREE.MathUtils.clamp(1 - squint - ooh * 0.5, 0.3, 1);
    for (const n of ['EyeL', 'EyeR', 'GlintL', 'GlintR', 'LashL', 'LashR']) {
      // the face curves away to the sides, so a sideways glance also sinks the eye back onto the surface
      const rest = face.rest[n];
      const dx = (p.eyeX + (sac.x + Math.sin(t * 9) * 0.02) * look) * 0.024;
      nodes[n].position.copy(rest).add(P.set(dx, (p.eyeY + sac.y * look + Math.sin(t * 7.3) * 0.02) * 0.02, -Math.sign(rest.x) * 0.45 * dx));
    }
    const c01 = (v) => THREE.MathUtils.clamp(v, 0, 1);
    const happy = squint * (1 - ooh);
    const sleepy = c01(p.lid * 2) * (1 - squint);
    const closed = c01(Math.max(1 - blink, (p.lid - 0.5) * 2)) * (1 - squint) * (1 - ooh * 0.7);
    const shy = c01(p.blush) * (1 - joy);
    for (const n of ['EyeL', 'EyeR']) {
      setMorph(nodes[n], 'blink', c01(closed + happy));
      setMorph(nodes['Lash' + n.slice(-1)], 'show', happy);
      setMorph(nodes[n], 'wide', c01(ooh + 0.22 * joy * (1 - squint)));
      setMorph(nodes[n], 'sleepy', sleepy);
      setMorph(nodes[n], 'shy', shy);
    }
    nodes.EyeL.visible = nodes.EyeR.visible = happy < 0.6;
    for (const n of ['GlintL', 'GlintR']) setMorph(nodes[n], 'hide', c01(Math.max(happy, closed * 1.5, sleepy * 1.4)));
    const open = joy * (1 - ooh) * (1 - pout);
    setMorph(nodes.Mouth, 'open', open);
    setMorph(nodes.Mouth, 'ooh', ooh);
    setMorph(nodes.Mouth, 'pout', pout);
    setMorph(nodes.Mouth, 'shy', shy * (1 - ooh) * (1 - pout));
    setMorph(nodes.Tongue, 'open', open);
    MOUTH.color.lerpColors(MOUTH_LINE, MOUTH_IN, c01(open + ooh));
    nodes.Face.material.userData.joy.value = joy;
    nodes.Face.material.userData.blush.value = THREE.MathUtils.clamp(p.blush, 0, 1);
    const el = document.getElementById('hero-jolly');
    if (el) {
      // the run-in slides the stage in from a full window width to the right, so it starts past the edge
      const dx = p.runX > 0.002 ? Math.round(p.runX * 10000) / 100 : 0;
      if (dx !== m.tx) el.style.transform = dx ? `translateX(${dx}vw)` : '';
      m.tx = dx;
    }
    const say = document.getElementById('jolly-say');
    if (say) {
      const k = THREE.MathUtils.clamp(p.say, 0, 1);
      say.style.opacity = k;
      say.style.transform = `scale(${0.6 + 0.4 * k})`;
      if (target.say && say.textContent !== target.line) say.textContent = target.line;
    }
  });

  return (
    <>
      {/* lights stay outside the hidden group: hidden lights would compile shaders for the wrong light count */}
      <directionalLight position={[-1.5, 3.53, 3.5]} intensity={1.3} color="#fff1e0" />
      <directionalLight position={[0.5, 2.03, -4]} intensity={0.35} color="#fff6ea" />
      <group ref={group} position={[0, -1.47, 0]} visible={ready}>
        <primitive object={model.scene} />
        <group ref={bubble} visible={false}>
          {BUBBLE_PUFFS.map(([x, y, z], i) => (
            <mesh key={i} position={[x, y, z]} material={BUBBLE} raycast={() => null}>
              <sphereGeometry args={[1, 24, 16]} />
            </mesh>
          ))}
        </group>
        {/* the largest pose (arms up, mid-hop, bubble) so the auto-fit never crops */}
        <mesh position={[0, 1.47, 0]} material={HIDE} raycast={() => null}>
          <boxGeometry args={[2.5, 2.95, 1]} />
        </mesh>
      </group>
    </>
  );
}

useGLTF.preload(URL);
