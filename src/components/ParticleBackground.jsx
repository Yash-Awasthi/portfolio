import { useEffect, useRef } from 'react';
import { SimplexNoise } from '../lib/webgl_particles';

/**
 * Animated particle constellation background.
 * Uses simplex noise for organic flow field motion.
 * Extracted from: particles.js, three-nebula, r3f-flow-field-particles.
 */
export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    const noise = new SimplexNoise(Date.now());
    const particles = [];
    const PARTICLE_COUNT = 80;
    const CONNECTION_DIST = 120;
    const NOISE_SCALE = 0.003;
    const SPEED = 0.4;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: 0,
        vy: 0,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    let t = 0;
    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.01;

      // Update particle positions using flow field
      for (const p of particles) {
        const angle = noise.noise2D(p.x * NOISE_SCALE, p.y * NOISE_SCALE + t) * Math.PI * 2;
        p.vx += Math.cos(angle) * SPEED * 0.1;
        p.vy += Math.sin(angle) * SPEED * 0.1;
        p.vx *= 0.95;
        p.vy *= 0.95;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around edges
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      }

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(100, 200, 100, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 200, 100, ${p.opacity})`;
        ctx.fill();
      }
    }

    function animate() {
      frame();
      animId = requestAnimationFrame(animate);
    }

    // The reduced-motion rule in index.css reaches CSS animations only; this loop is
    // JavaScript, so one frame is drawn and no further frame is scheduled.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      frame();
    } else {
      animate();
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.6,
      }}
    />
  );
}
