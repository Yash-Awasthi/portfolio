import { useRef, useEffect, useState } from 'react';

/**
 * Globe — interactive 3D rotating globe showing project locations.
 * Uses canvas for rendering, no external dependencies.
 */
export default function Globe({ projects = [], width = 400, height = 400 }) {
  const canvasRef = useRef(null);
  const rotationRef = useRef({ x: 0.3, y: 0 });
  const animFrameRef = useRef(null);
  const mouseRef = useRef({ isDown: false, lastX: 0, lastY: 0 });
  const drawnRef = useRef([]);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resolved once per project list: resolving inside the frame loop gives a new
    // random point every frame. `??` keeps an explicit 0, which is a real coordinate.
    const plotted = projects.map((project) => ({
      ...project,
      lat: project.lat ?? (Math.random() * 180 - 90),
      lng: project.lng ?? (Math.random() * 360 - 180),
    }));

    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    function projectTo2D(lat, lng, rotation) {
      const latRad = (lat * Math.PI) / 180;
      const lngRad = (lng * Math.PI) / 180;

      const x = Math.cos(latRad) * Math.sin(lngRad - rotation.y);
      const y = -Math.sin(latRad) * Math.cos(rotation.x) + Math.cos(latRad) * Math.cos(lngRad - rotation.y) * Math.sin(rotation.x);
      const z = Math.sin(latRad) * Math.sin(rotation.x) + Math.cos(latRad) * Math.cos(lngRad - rotation.y) * Math.cos(rotation.x);

      return {
        x: cx + x * radius,
        y: cy - y * radius,
        visible: z > 0,
        depth: z,
      };
    }

    function drawGlobe() {
      ctx.clearRect(0, 0, width, height);

      // Globe circle with gradient
      const gradient = ctx.createRadialGradient(cx - radius * 0.2, cy - radius * 0.2, 0, cx, cy, radius);
      gradient.addColorStop(0, '#1a2744');
      gradient.addColorStop(0.7, '#0f1b2d');
      gradient.addColorStop(1, '#060d16');
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Glow effect
      const glow = ctx.createRadialGradient(cx, cy, radius * 0.8, cx, cy, radius * 1.1);
      glow.addColorStop(0, 'rgba(99, 102, 241, 0.1)');
      glow.addColorStop(1, 'rgba(99, 102, 241, 0)');
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.1, 0, Math.PI * 2);
      ctx.fillStyle = glow;
      ctx.fill();

      // Grid lines
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.lineWidth = 0.5;

      // Latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        ctx.beginPath();
        for (let lng = 0; lng <= 360; lng += 5) {
          const p = projectTo2D(lat, lng, rotationRef.current);
          if (p.visible) {
            if (lng === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          } else {
            ctx.moveTo(p.x, p.y);
          }
        }
        ctx.stroke();
      }

      // Longitude lines
      for (let lng = 0; lng < 360; lng += 30) {
        ctx.beginPath();
        for (let lat = -90; lat <= 90; lat += 5) {
          const p = projectTo2D(lat, lng, rotationRef.current);
          if (p.visible) {
            if (lat === -90) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          } else {
            ctx.moveTo(p.x, p.y);
          }
        }
        ctx.stroke();
      }

      // Plot projects as dots
      const visibleProjects = [];
      for (const project of plotted) {
        const p = projectTo2D(project.lat, project.lng, rotationRef.current);

        if (p.visible) {
          visibleProjects.push({ ...project, ...p });
        }
      }

      // Sort by depth (back to front)
      visibleProjects.sort((a, b) => a.depth - b.depth);
      // The dot positions of this frame, for hit-testing on mouse move.
      drawnRef.current = visibleProjects;

      for (const project of visibleProjects) {
        const size = 4 + project.depth * 3;
        const alpha = 0.5 + project.depth * 0.5;

        // Dot glow
        ctx.beginPath();
        ctx.arc(project.x, project.y, size * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${project.color || '99, 102, 241'}, ${alpha * 0.3})`;
        ctx.fill();

        // Dot
        ctx.beginPath();
        ctx.arc(project.x, project.y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${project.color || '99, 102, 241'}, ${alpha})`;
        ctx.fill();

        // Label
        if (project.depth > 0.3 && project.name) {
          ctx.font = `${10 + project.depth * 2}px Inter, sans-serif`;
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
          ctx.fillText(project.name, project.x + size + 4, project.y + 3);
        }
      }

      // Auto-rotate
      if (!mouseRef.current.isDown) {
        rotationRef.current.y += 0.003;
      }

      animFrameRef.current = requestAnimationFrame(drawGlobe);
    }

    drawGlobe();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [projects, width, height]);

  // Mouse/touch interaction
  const handleMouseDown = (e) => {
    mouseRef.current = { isDown: true, lastX: e.clientX, lastY: e.clientY };
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    if (!mouseRef.current.isDown) {
      // Nearest dot within a comfortable radius, so the tooltip is reachable.
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let nearest = null;
      let nearestDist = 18;
      for (const project of drawnRef.current) {
        const dist = Math.hypot(project.x - mx, project.y - my);
        if (dist < nearestDist) {
          nearest = project;
          nearestDist = dist;
        }
      }
      setHoveredProject(nearest);
      return;
    }

    const dx = e.clientX - mouseRef.current.lastX;
    const dy = e.clientY - mouseRef.current.lastY;
    rotationRef.current.y += dx * 0.005;
    rotationRef.current.x += dy * 0.005;
    rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x));
    mouseRef.current = { ...mouseRef.current, lastX: e.clientX, lastY: e.clientY };
  };

  const handleMouseUp = () => {
    mouseRef.current = { ...mouseRef.current, isDown: false };
    setIsDragging(false);
  };

  return (
    <div className="globe-container" style={{ position: 'relative', width, height }}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : 'grab', borderRadius: '50%' }}
      />
      {hoveredProject && (
        <div
          className="globe-tooltip"
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            background: 'rgba(15, 27, 45, 0.95)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
          }}
        >
          <div style={{ fontWeight: 600 }}>{hoveredProject.name}</div>
          <div style={{ opacity: 0.7, fontSize: '11px' }}>{hoveredProject.description}</div>
        </div>
      )}
    </div>
  );
}
