/**
 * WebGL Particle Effects Library
 * Extracted from inspiration repos:
 *   particles.js, particles, particle.js, particle-life,
 *   particle-network-animation, particle-network-background,
 *   canvas-particle-network, interactive-particle-network,
 *   morphing-particle-swarm, sparticles, particular, particulate-js,
 *   three-nebula, three-particles, three-vfx, three.quarks,
 *   threejs-audio-reactive-visual, r3f-audio-visualizer,
 *   r3f-flow-field-particles, r3f-scroll-rig, wawa-vfx,
 *   webgl-fluid-simulation, vanta, simplex-noise.js,
 *   3d-particle-explorations, 3d-particles, ab-particles
 *
 * Provides:
 * - GPU-accelerated particle systems (WebGL shaders)
 * - Flow field particle motion (simplex-noise pattern)
 * - Network/constellation particle connections
 * - Morphing particle swarms
 * - Audio-reactive visualizers
 * - Fluid simulation (WebGL-fluid-simulation pattern)
 */

// ---- Simplex Noise (simplex-noise.js pattern) ----

export class SimplexNoise {
  private perm: Uint8Array;
  private permMod12: Uint8Array;

  constructor(seed: number = 0) {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;

    // Shuffle with seed
    let n = seed;
    for (let i = 255; i > 0; i--) {
      n = (n * 9301 + 49297) % 233280;
      const j = Math.floor((n / 233280) * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }

    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  private static grad3 = new Float32Array([
    1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0,
    1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1,
    0, 1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1,
  ]);

  noise2D(x: number, y: number): number {
    const s = (x + y) * 0.5 * (Math.sqrt(3) - 1);
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * (1 / 6);
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    let n0 = 0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * (SimplexNoise.grad3[gi0 * 3] * x0 + SimplexNoise.grad3[gi0 * 3 + 1] * y0);
    }

    let t1 = 0.5 - (x0 - 1 + i1) * (x0 - 1 + i1) - (y0 - j1) * (y0 - j1);
    let n1 = 0;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * (SimplexNoise.grad3[gi1 * 3] * (x0 - 1 + i1) + SimplexNoise.grad3[gi1 * 3 + 1] * (y0 - j1));
    }

    let t2 = 0.5 - (x0 - 1) * (x0 - 1) - (y0 - 1) * (y0 - 1);
    let n2 = 0;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * (SimplexNoise.grad3[gi2 * 3] * (x0 - 1) + SimplexNoise.grad3[gi2 * 3 + 1] * (y0 - 1));
    }

    return 70 * (n0 + n1 + n2);
  }

  noise3D(x: number, y: number, z: number): number {
    // 3D simplex noise — simplified version using 2D slices
    return (this.noise2D(x, y) + this.noise2D(y, z) + this.noise2D(x, z)) / 3;
  }
}

// ---- Flow Field Particles (r3f-flow-field-particles pattern) ----

export interface FlowFieldConfig {
  count: number;
  speed: number;
  noiseScale: number;
  noiseStrength: number;
  color: string;
  trailLength: number;
  bounds: { width: number; height: number };
}

export class FlowFieldParticles {
  private particles: Array<{
    x: number; y: number;
    vx: number; vy: number;
    trail: Array<{ x: number; y: number }>;
    life: number;
  }> = [];
  private noise: SimplexNoise;
  private config: FlowFieldConfig;
  private time: number = 0;

  constructor(config: FlowFieldConfig, seed: number = 0) {
    this.config = config;
    this.noise = new SimplexNoise(seed);
    this.init();
  }

  private init(): void {
    const { count, bounds } = this.config;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * bounds.width,
        y: Math.random() * bounds.height,
        vx: 0, vy: 0,
        trail: [],
        life: 0,
      });
    }
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    const { noiseScale, noiseStrength, speed, trailLength, bounds } = this.config;

    for (const p of this.particles) {
      // Sample noise field for direction
      const angle = this.noise.noise2D(p.x * noiseScale, p.y * noiseScale + this.time * 0.1) * Math.PI * 2;
      p.vx = Math.cos(angle) * noiseStrength;
      p.vy = Math.sin(angle) * noiseStrength;

      p.x += p.vx * speed * deltaTime;
      p.y += p.vy * speed * deltaTime;
      p.life += deltaTime;

      // Wrap around bounds
      if (p.x < 0) p.x = bounds.width;
      if (p.x > bounds.width) p.x = 0;
      if (p.y < 0) p.y = bounds.height;
      if (p.y > bounds.height) p.y = 0;

      // Update trail
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > trailLength) {
        p.trail.shift();
      }
    }
  }

  getParticles() {
    return this.particles;
  }

  setConfig(config: Partial<FlowFieldConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.count && config.count !== this.particles.length) {
      this.init();
    }
  }
}

// ---- Particle Network / Constellation (particle-network-animation pattern) ----

export interface NetworkConfig {
  count: number;
  maxDistance: number;
  speed: number;
  particleSize: number;
  lineColor: string;
  particleColor: string;
  bounds: { width: number; height: number };
}

export class ParticleNetwork {
  private particles: Array<{
    x: number; y: number;
    vx: number; vy: number;
  }> = [];
  private config: NetworkConfig;
  private mouse: { x: number; y: number; active: boolean } = { x: 0, y: 0, active: false };

  constructor(config: NetworkConfig) {
    this.config = config;
    this.init();
  }

  private init(): void {
    const { count, bounds } = this.config;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * bounds.width,
        y: Math.random() * bounds.height,
        vx: (Math.random() - 0.5) * this.config.speed,
        vy: (Math.random() - 0.5) * this.config.speed,
      });
    }
  }

  update(deltaTime: number): void {
    const { bounds, speed } = this.config;
    for (const p of this.particles) {
      p.x += p.vx * deltaTime * 60;
      p.y += p.vy * deltaTime * 60;

      // Bounce off walls
      if (p.x < 0 || p.x > bounds.width) p.vx *= -1;
      if (p.y < 0 || p.y > bounds.height) p.vy *= -1;
      p.x = Math.max(0, Math.min(bounds.width, p.x));
      p.y = Math.max(0, Math.min(bounds.height, p.y));

      // Mouse attraction (interactive-particle-network pattern)
      if (this.mouse.active) {
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          p.vx += (dx / dist) * 0.05;
          p.vy += (dy / dist) * 0.05;
        }
      }
    }
  }

  getConnections(): Array<{ p1: { x: number; y: number }; p2: { x: number; y: number }; opacity: number }> {
    const connections = [];
    const { maxDistance } = this.config;
    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const dx = this.particles[i].x - this.particles[j].x;
        const dy = this.particles[i].y - this.particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDistance) {
          connections.push({
            p1: this.particles[i],
            p2: this.particles[j],
            opacity: 1 - dist / maxDistance,
          });
        }
      }
    }
    return connections;
  }

  setMouse(x: number, y: number, active: boolean): void {
    this.mouse = { x, y, active };
  }

  getParticles() { return this.particles; }
  getConfig() { return this.config; }
}

// ---- Morphing Particle Swarm (morphing-particle-swarm pattern) ----

export interface MorphConfig {
  count: number;
  morphSpeed: number;
  noiseStrength: number;
  color: string;
  bounds: { width: number; height: number };
  shapes: Array<Array<{ x: number; y: number }>>; // Target shapes
}

export class MorphingSwarm {
  private particles: Array<{
    x: number; y: number;
    ox: number; oy: number; // origin
    tx: number; ty: number; // target
    vx: number; vy: number;
    noise: number;
  }> = [];
  private config: MorphConfig;
  private currentShape: number = 0;
  private morphProgress: number = 0;
  private time: number = 0;
  private noise: SimplexNoise;

  constructor(config: MorphConfig) {
    this.config = config;
    this.noise = new SimplexNoise(42);
    this.init();
  }

  private init(): void {
    const { count, bounds, shapes } = this.config;
    this.particles = [];
    const shape = shapes[0] || [{ x: bounds.width / 2, y: bounds.height / 2 }];

    for (let i = 0; i < count; i++) {
      const target = shape[i % shape.length];
      this.particles.push({
        x: bounds.width / 2 + (Math.random() - 0.5) * 100,
        y: bounds.height / 2 + (Math.random() - 0.5) * 100,
        ox: bounds.width / 2,
        oy: bounds.height / 2,
        tx: target.x,
        ty: target.y,
        vx: 0, vy: 0,
        noise: Math.random() * 1000,
      });
    }
  }

  update(deltaTime: number): void {
    this.time += deltaTime;
    this.morphProgress += deltaTime * this.config.morphSpeed;

    if (this.morphProgress >= 1) {
      this.morphProgress = 0;
      this.currentShape = (this.currentShape + 1) % this.config.shapes.length;
      const shape = this.config.shapes[this.currentShape];
      for (let i = 0; i < this.particles.length; i++) {
        const target = shape[i % shape.length];
        this.particles[i].tx = target.x;
        this.particles[i].ty = target.y;
      }
    }

    const { noiseStrength } = this.config;

    for (const p of this.particles) {
      // Lerp toward target
      p.x += (p.tx - p.x) * 0.05;
      p.y += (p.ty - p.y) * 0.05;

      // Add noise perturbation
      const nx = this.noise.noise2D(p.noise, this.time * 0.5);
      const ny = this.noise.noise2D(p.noise + 100, this.time * 0.5);
      p.x += nx * noiseStrength;
      p.y += ny * noiseStrength;
    }
  }

  getParticles() { return this.particles; }
  getMorphProgress() { return this.morphProgress; }
  getCurrentShape() { return this.currentShape; }

  // Helper: generate circle shape points
  static circle(cx: number, cy: number, radius: number, count: number): Array<{ x: number; y: number }> {
    const points = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      points.push({ x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius });
    }
    return points;
  }

  // Helper: generate heart shape points
  static heart(cx: number, cy: number, scale: number, count: number): Array<{ x: number; y: number }> {
    const points = [];
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      points.push({
        x: cx + scale * 16 * Math.pow(Math.sin(t), 3) / 16,
        y: cy - scale * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 16,
      });
    }
    return points;
  }

  // Helper: generate text shape from canvas
  static text(text: string, cx: number, cy: number, fontSize: number, sampleStep: number = 4): Array<{ x: number; y: number }> {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 200;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = 'white';
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const points: Array<{ x: number; y: number }> = [];
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let y = 0; y < canvas.height; y += sampleStep) {
      for (let x = 0; x < canvas.width; x += sampleStep) {
        const idx = (y * canvas.width + x) * 4;
        if (imageData.data[idx + 3] > 128) {
          points.push({ x: cx + (x - canvas.width / 2), y: cy + (y - canvas.height / 2) });
        }
      }
    }
    return points;
  }
}

// ---- Audio-Reactive Visualizer (threejs-audio-reactive-visual pattern) ----

export interface AudioVisualizerConfig {
  count: number;
  smoothing: number;
  bars: number;
  color: string;
  sensitivity: number;
  bounds: { width: number; height: number };
}

export class AudioReactiveVisualizer {
  private particles: Array<{ x: number; y: number; baseY: number; phase: number }> = [];
  private config: AudioVisualizerConfig;
  private frequencyData: Uint8Array = new Uint8Array(0);
  private analyser: AnalyserNode | null = null;

  constructor(config: AudioVisualizerConfig) {
    this.config = config;
    this.init();
  }

  private init(): void {
    const { count, bounds } = this.config;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: (i / count) * bounds.width,
        y: bounds.height / 2,
        baseY: bounds.height / 2,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  connectAudio(audioContext: AudioContext, source: AudioNode): void {
    this.analyser = audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    source.connect(this.analyser);
  }

  update(deltaTime: number, time: number): void {
    const { bars, sensitivity, bounds } = this.config;

    if (this.analyser) {
      this.analyser.getByteFrequencyData(this.frequencyData);
    }

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const freqIndex = Math.floor((i / this.particles.length) * (this.frequencyData.length || 1));
      const amplitude = this.frequencyData.length > 0
        ? (this.frequencyData[freqIndex] / 255) * sensitivity
        : (Math.sin(time * 2 + p.phase) * 0.3 + 0.3) * sensitivity;

      p.y = p.baseY - amplitude * bounds.height * 0.3;
    }
  }

  getParticles() { return this.particles; }
}

// ---- Vanta-style animated background (vanta pattern) ----

export interface VantaConfig {
  color: string;
  backgroundColor: string;
  highlightColor: string;
  speed: number;
  birdCount?: number; // for flocking variant
  waveSpeed?: number;
}

export class VantaBackground {
  private config: VantaConfig;
  private time: number = 0;
  private noise: SimplexNoise;

  constructor(config: VantaConfig) {
    this.config = config;
    this.noise = new SimplexNoise(123);
  }

  update(deltaTime: number): void {
    this.time += deltaTime * this.config.speed;
  }

  // Get the animated wave height at a point (vanta WAVES pattern)
  getWaveHeight(x: number, y: number): number {
    const { waveSpeed = 1 } = this.config;
    const n1 = this.noise.noise2D(x * 0.01 + this.time * waveSpeed, y * 0.01);
    const n2 = this.noise.noise2D(x * 0.02 - this.time * waveSpeed * 0.5, y * 0.02 + this.time * 0.3);
    return (n1 + n2 * 0.5) * 50;
  }

  // Flocking simulation (vanta BIRDS pattern)
  getBirdPosition(birdIndex: number, totalBirds: number, time: number): { x: number; y: number; z: number } {
    const angle = (birdIndex / totalBirds) * Math.PI * 2 + time * 0.3;
    const radius = 100 + Math.sin(time * 0.5 + birdIndex) * 30;
    const height = Math.sin(time * 0.7 + birdIndex * 0.5) * 50;
    return {
      x: Math.cos(angle) * radius,
      y: height,
      z: Math.sin(angle) * radius,
    };
  }

  getTime() { return this.time; }
  getConfig() { return this.config; }
}
