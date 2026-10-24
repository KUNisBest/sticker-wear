import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  isBurst: boolean;
  char: string;
  alpha: number;
}

const MAX_PARTICLES = 800;
const GOLD_COLORS = ['#d4af37', '#c5a028', '#e0bc4a', '#b8941d', '#f0c850'];
const BURST_COLORS = ['#d4af37', '#c5a028', '#e8c044', '#b8941d', '#f5d060', '#a08018'];
const SOURCE_TEXT = 'ONE OF A KIND STYLE';
const COLUMNS = 8;

export default function ParticleRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const groundYRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      groundYRef.current = window.innerHeight * 0.85;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = particlesRef.current;

    const createParticle = (isBurst: boolean, x?: number, y?: number, vx?: number, vy?: number): Particle => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      if (isBurst) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 4 + 1;
        return {
          x: x || w / 2,
          y: y || h * 0.8,
          vx: vx || Math.cos(angle) * speed,
          vy: vy || Math.sin(angle) * speed - 2,
          life: 0,
          maxLife: Math.random() * 40 + 20,
          size: Math.random() * 3 + 1,
          color: BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)],
          isBurst: true,
          char: '',
          alpha: 1,
        };
      }

      const colWidth = w / COLUMNS;
      const col = Math.floor(Math.random() * COLUMNS);
      const charIndex = Math.floor(Math.random() * SOURCE_TEXT.length);

      return {
        x: col * colWidth + colWidth / 2 + (Math.random() - 0.5) * colWidth * 0.6,
        y: -Math.random() * 50,
        vx: (Math.random() - 0.5) * 0.3,
        vy: Math.random() * 1.5 + 0.8,
        life: 0,
        maxLife: Math.random() * 200 + 150,
        size: Math.random() * 2 + 10,
        color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
        isBurst: false,
        char: SOURCE_TEXT[charIndex],
        alpha: Math.random() * 0.4 + 0.6,
      };
    };

    // Spawn initial particles
    for (let i = 0; i < 100; i++) {
      const p = createParticle(false);
      p.y = Math.random() * window.innerHeight;
      particles.push(p);
    }

    let spawnTimer = 0;
    const groundSegments = 120;
    const segmentWidth = () => window.innerWidth / groundSegments;

    const getGroundHeight = (x: number) => {
      const seg = Math.floor(x / segmentWidth());
      const t = seg / groundSegments;
      // Slight wave in the ground
      return groundYRef.current + Math.sin(t * Math.PI * 4) * 5;
    };

    const animate = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      // Semi-transparent clear for trails
      ctx.fillStyle = 'rgba(5, 5, 5, 0.2)';
      ctx.fillRect(0, 0, w, h);

      // Draw faint ground grid lines
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.06)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= groundSegments; i += 10) {
        const x = i * segmentWidth();
        const gh = getGroundHeight(x);
        ctx.beginPath();
        ctx.moveTo(x, gh);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      // Ground plane line
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i <= groundSegments; i++) {
        const x = i * segmentWidth();
        const gh = getGroundHeight(x);
        if (i === 0) ctx.moveTo(x, gh);
        else ctx.lineTo(x, gh);
      }
      ctx.stroke();

      // Spawn new particles
      spawnTimer++;
      if (spawnTimer % 2 === 0 && particles.length < MAX_PARTICLES) {
        particles.push(createParticle(false));
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;

        if (p.isBurst) {
          // Burst particles
          p.vy += 0.15; // gravity
          p.x += p.vx;
          p.y += p.vy;
          p.vx *= 0.98;
          p.alpha = 1 - p.life / p.maxLife;

          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          if (p.life >= p.maxLife || p.alpha <= 0) {
            particles.splice(i, 1);
          }
        } else {
          // Text particles falling
          p.vy += 0.02; // slight gravity accel
          p.x += p.vx;
          p.y += p.vy;

          const groundH = getGroundHeight(p.x);

          // Check ground collision
          if (p.y >= groundH) {
            p.y = groundH;

            // Bounce
            const bounceSpeed = Math.abs(p.vy);
            const BounceDecay = 0.45;
            const Friction = 0.92;

            p.vy = -p.vy * BounceDecay;
            p.vx *= Friction;
            p.vy *= 0.6; // extra vy damping as per design

            // Create burst particles on bounce
            if (bounceSpeed > 1 && particles.length < MAX_PARTICLES - 10) {
              const burstCount = Math.min(10, Math.floor(bounceSpeed * 2));
              for (let b = 0; b < burstCount; b++) {
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * bounceSpeed * 0.8 + 1;
                particles.push({
                  x: p.x,
                  y: p.y,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed - 2,
                  life: 0,
                  maxLife: Math.random() * 40 + 20,
                  size: Math.random() * 3 + 1,
                  color: BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)],
                  isBurst: true,
                  char: '',
                  alpha: 1,
                });
              }
            }

            // Kill if bounce is too small
            if (Math.abs(p.vy) < 0.3) {
              particles.splice(i, 1);
              continue;
            }
          }

          // Fade out near end of life
          if (p.life > p.maxLife * 0.8) {
            p.alpha = (1 - p.life / p.maxLife) * 5;
          }

          // Draw text particle
          ctx.globalAlpha = Math.max(0, Math.min(1, p.alpha));
          ctx.fillStyle = p.color;
          ctx.font = `${p.size}px "JetBrains Mono", monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(p.char, p.x, p.y);

          // Kill if too old
          if (p.life >= p.maxLife) {
            particles.splice(i, 1);
          }
        }
      }

      ctx.globalAlpha = 1;
      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
