import { useEffect, useRef } from "react";

interface ContinuumVaultShield3DProps {
  className?: string;
  interactive?: boolean;
}

type Vec3 = { x: number; y: number; z: number };

interface Pulse {
  edgeIndex: number;
  progress: number;
  speed: number;
}

export function ContinuumVaultShield3D({
  className = "",
  interactive = true,
}: ContinuumVaultShield3DProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!canvas || !parent) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let radius = 1;
    let animationFrameId = 0;
    let disposed = false;

    const phi = (1 + Math.sqrt(5)) / 2;
    const rawVertices: Vec3[] = [
      { x: -1, y: phi, z: 0 },
      { x: 1, y: phi, z: 0 },
      { x: -1, y: -phi, z: 0 },
      { x: 1, y: -phi, z: 0 },
      { x: 0, y: -1, z: phi },
      { x: 0, y: 1, z: phi },
      { x: 0, y: -1, z: -phi },
      { x: 0, y: 1, z: -phi },
      { x: phi, y: 0, z: -1 },
      { x: phi, y: 0, z: 1 },
      { x: -phi, y: 0, z: -1 },
      { x: -phi, y: 0, z: 1 },
    ];

    let vertices: Vec3[] = [];
    let ringNodes: Vec3[] = [];
    let edges: [number, number][] = [];

    const particles = Array.from({ length: 24 }, () => ({
      x: 0,
      y: 0,
      z: 0,
      size: Math.random() * 1.5 + 1,
      speed: (Math.random() * 0.15 + 0.08) * (Math.random() > 0.5 ? 1 : -1),
    }));

    const resize = () => {
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width || 400));
      height = Math.max(1, Math.floor(rect.height || 400));
      canvas.width = width;
      canvas.height = height;
      radius = Math.max(1, Math.min(width, height) * 0.28);

      vertices = rawVertices.map((v) => {
        const len = Math.hypot(v.x, v.y, v.z);
        return {
          x: (v.x / len) * radius,
          y: (v.y / len) * radius,
          z: (v.z / len) * radius,
        };
      });

      ringNodes = Array.from({ length: 16 }, (_, i) => {
        const angle = (i / 16) * Math.PI * 2;
        return {
          x: Math.cos(angle) * radius * 1.45,
          y: Math.sin(angle) * radius * 1.45,
          z: 0,
        };
      });

      edges = [];
      const thresholdSq = Math.pow(radius * 1.15, 2);
      for (let i = 0; i < vertices.length; i++) {
        const vertexA = vertices[i];
        if (!vertexA) continue;

        for (let j = i + 1; j < vertices.length; j++) {
          const vertexB = vertices[j];
          if (!vertexB) continue;

          const dx = vertexA.x - vertexB.x;
          const dy = vertexA.y - vertexB.y;
          const dz = vertexA.z - vertexB.z;
          if (dx * dx + dy * dy + dz * dz < thresholdSq) {
            edges.push([i, j]);
          }
        }
      }

      particles.forEach((particle) => {
        particle.x = (Math.random() - 0.5) * width * 0.8;
        particle.y = (Math.random() - 0.5) * height * 0.8;
        particle.z = (Math.random() - 0.5) * radius * 1.5;
      });
    };

    let targetRotX = 0;
    let targetRotY = 0;
    let rotX = 0;
    let rotY = 0;
    let baseAngle = 0;

    const handleMouseMove = (event: MouseEvent) => {
      if (!interactive) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const nx = (event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
      const ny = (event.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
      targetRotY = Math.max(-0.3, Math.min(0.3, nx * 0.3));
      targetRotX = Math.max(-0.3, Math.min(0.3, -ny * 0.3));
    };

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let prefersReducedMotion = motionQuery.matches;
    const handleMotionChange = (event: MediaQueryListEvent) => {
      prefersReducedMotion = event.matches;
    };

    const pulses: Pulse[] = [
      { edgeIndex: 0, progress: 0, speed: 0.015 },
      { edgeIndex: 5, progress: 0.3, speed: 0.02 },
      { edgeIndex: 12, progress: 0.7, speed: 0.012 },
    ];

    const project = (p: Vec3, cx: number, cy: number, cosY: number, sinY: number, cosX: number, sinX: number) => {
      const x1 = p.x * cosY - p.z * sinY;
      const z1 = p.x * sinY + p.z * cosY;
      const y2 = p.y * cosX - z1 * sinX;
      const z2 = p.y * sinX + z1 * cosX;
      const perspective = 500 / Math.max(50, 500 + z2);

      return {
        x: cx + x1 * perspective,
        y: cy + y2 * perspective,
        z: z2,
        scale: perspective,
      };
    };

    const render = () => {
      if (disposed) return;

      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height / 2;

      if (!prefersReducedMotion) baseAngle += 0.005;
      rotX += (targetRotX - rotX) * 0.08;
      rotY += (targetRotY - rotY) * 0.08;

      const angleY = baseAngle + rotY;
      const angleX = rotX + Math.sin(baseAngle * 0.5) * 0.12;
      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      const projectPoint = (point: Vec3) =>
        project(point, cx, cy, cosY, sinY, cosX, sinX);

      ctx.fillStyle = "rgba(2, 132, 199, 0.2)";
      particles.forEach((particle) => {
        if (!prefersReducedMotion) {
          particle.y += particle.speed;
          if (particle.y > height / 2) particle.y = -height / 2;
          if (particle.y < -height / 2) particle.y = height / 2;
        }
        const point = projectPoint(particle);
        ctx.beginPath();
        ctx.arc(point.x, point.y, particle.size * point.scale, 0, Math.PI * 2);
        ctx.fill();
      });

      const projectedRing = ringNodes.map(projectPoint);
      ctx.strokeStyle = "rgba(15, 23, 42, 0.12)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      projectedRing.forEach((point, index) => {
        const next = projectedRing[(index + 1) % projectedRing.length];

        // Guard indexed values for strict TypeScript configurations.
        if (!point || !next) return;

        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        }
        ctx.lineTo(next.x, next.y);
      });
      ctx.stroke();
      ctx.setLineDash([]);

      const projectedVertices = vertices.map(projectPoint);
      const sortedEdges = edges
        .flatMap(([a, b]) => {
          const vA = projectedVertices[a];
          const vB = projectedVertices[b];

          // Invalid edge indexes should be ignored instead of dereferenced.
          if (!vA || !vB) return [];

          return [{ vA, vB, avgZ: (vA.z + vB.z) / 2 }];
        })
        .sort((a, b) => a.avgZ - b.avgZ);

      sortedEdges.forEach(({ vA, vB, avgZ }) => {
        const alpha = Math.max(0.15, Math.min(0.65, (avgZ + radius) / (2 * radius)));
        ctx.strokeStyle = `rgba(15, 23, 42, ${alpha * 0.4})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(vA.x, vA.y);
        ctx.lineTo(vB.x, vB.y);
        ctx.stroke();
      });

      if (!prefersReducedMotion && edges.length > 0) {
        pulses.forEach((pulse) => {
          pulse.progress += pulse.speed;
          if (pulse.progress > 1) {
            pulse.progress = 0;
            pulse.edgeIndex = Math.floor(Math.random() * edges.length);
          }

          const edge = edges[pulse.edgeIndex];
          if (!edge) return;
          const vA = projectedVertices[edge[0]];
          const vB = projectedVertices[edge[1]];
          if (!vA || !vB) return;

          const px = vA.x + (vB.x - vA.x) * pulse.progress;
          const py = vA.y + (vB.y - vA.y) * pulse.progress;

          ctx.fillStyle = "rgba(2, 132, 199, 0.85)";
          ctx.beginPath();
          ctx.arc(px, py, 3.5, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      projectedVertices.forEach((point) => {
        const alpha = Math.max(0.3, Math.min(1, (point.z + radius) / (2 * radius)));
        const size = point.scale * 3 + 1;

        ctx.fillStyle = `rgba(2, 132, 199, ${alpha * 0.25})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, size * 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(15, 23, 42, ${alpha * 0.9})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = window.requestAnimationFrame(render);
    };

    resize();

    const resizeObserver = typeof ResizeObserver !== "undefined"
      ? new ResizeObserver(resize)
      : null;
    resizeObserver?.observe(parent);
    window.addEventListener("resize", resize);
    if (interactive) window.addEventListener("mousemove", handleMouseMove);
    motionQuery.addEventListener?.("change", handleMotionChange);

    render();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      motionQuery.removeEventListener?.("change", handleMotionChange);
    };
  }, [interactive]);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        className="h-full w-full object-contain"
        aria-hidden="true"
      />
    </div>
  );
}
