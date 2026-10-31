import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  gravity: number;
}

interface Rocket {
  x: number;
  y: number;
  vy: number;
  targetY: number;
  color: string;
  exploded: boolean;
}

const PALETTE = [
  "#F5C518",
  "#FF6B4A",
  "#7CFFB2",
  "#6EC8FF",
  "#FF8AD8",
  "#FFFFFF",
  "#FFD166",
];

function burst(x: number, y: number, color: string, into: Particle[]) {
  const count = 28 + Math.floor(Math.random() * 18);
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.2;
    const speed = 1.6 + Math.random() * 3.4;
    into.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 40 + Math.random() * 35,
      color: Math.random() > 0.25 ? color : PALETTE[(Math.random() * PALETTE.length) | 0],
      size: 1.5 + Math.random() * 2.2,
      gravity: 0.035 + Math.random() * 0.025,
    });
  }
}

/**
 * Full-viewport canvas fireworks for bingo unlock celebrations.
 * Honors prefers-reduced-motion (no animation).
 */
export function FireworksOverlay({ bursts = 5 }: { bursts?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let running = true;
    const rockets: Rocket[] = [];
    const particles: Particle[] = [];
    let launched = 0;
    let frame = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const launch = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      rockets.push({
        x: w * (0.15 + Math.random() * 0.7),
        y: h + 8,
        vy: -(7.5 + Math.random() * 3.5),
        targetY: h * (0.18 + Math.random() * 0.32),
        color: PALETTE[(Math.random() * PALETTE.length) | 0],
        exploded: false,
      });
      launched += 1;
    };

    // Stagger first volley so the modal card stays readable.
    const timers = [0, 220, 480, 820, 1200]
      .slice(0, bursts)
      .map((delay) => window.setTimeout(launch, delay));

    const tick = () => {
      if (!running) return;
      frame += 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // Occasional follow-up bursts while the modal is open
      if (frame % 55 === 0 && launched < bursts + 4) launch();

      for (const r of rockets) {
        if (r.exploded) continue;
        r.y += r.vy;
        r.vy += 0.04;
        ctx.beginPath();
        ctx.fillStyle = r.color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = r.color;
        ctx.arc(r.x, r.y, 2.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (r.y <= r.targetY || r.vy >= -0.5) {
          r.exploded = true;
          burst(r.x, r.y, r.color, particles);
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.vx *= 0.985;
        const t = p.life / p.maxLife;
        if (t >= 1) {
          particles.splice(i, 1);
          continue;
        }
        ctx.globalAlpha = 1 - t * t;
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Drop finished rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        if (rockets[i].exploded) rockets.splice(i, 1);
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      timers.forEach((id) => clearTimeout(id));
      window.removeEventListener("resize", resize);
    };
  }, [bursts]);

  return (
    <canvas
      ref={canvasRef}
      className="fireworks"
      aria-hidden="true"
    />
  );
}
