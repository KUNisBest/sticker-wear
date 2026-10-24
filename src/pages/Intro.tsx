import { useEffect, useRef, useState, useCallback } from 'react';

interface IntroProps {
  onEnter: () => void;
}

export default function Intro({ onEnter }: IntroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGlitching, setIsGlitching] = useState(false);
  const rafRef = useRef<number>(0);

  const handleClick = useCallback(() => {
    if (isGlitching) return;
    setIsGlitching(true);
    setTimeout(() => onEnter(), 800);
  }, [isGlitching, onEnter]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 2);

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const W = () => window.innerWidth;
    const H = () => window.innerHeight;

    // Stars
    const stars: Array<{ x: number; y: number; size: number; brightness: number; twinkleSpeed: number }> = [];
    for (let i = 0; i < 350; i++) {
      stars.push({
        x: Math.random() * 3000,
        y: Math.random() * 3000,
        size: Math.random() * 1.2 + 0.2,
        brightness: Math.random() * Math.PI * 2,
        twinkleSpeed: Math.random() * 0.03 + 0.005,
      });
    }

    // Side numbers - large glowing digits flowing vertically
    interface SideNum {
      x: number;
      y: number;
      value: string;
      size: number;
      opacity: number;
      targetOpacity: number;
      speed: number;
      phase: number;
      side: 'left' | 'right';
    }
    const sideNums: SideNum[] = [];

    const spawnSideNum = (side: 'left' | 'right') => {
      const margin = 10;
      const spread = 100;
      const x = side === 'left'
        ? margin + Math.random() * spread
        : W() - margin - Math.random() * spread;
      sideNums.push({
        x, y: -80,
        value: Math.floor(Math.random() * 10).toString(),
        size: Math.random() * 90 + 30,
        opacity: 0, targetOpacity: Math.random() * 0.7 + 0.3,
        speed: Math.random() * 12 + 14,
        phase: Math.random() * Math.PI * 2,
        side,
      });
    };

    // Flow lines (ONE OF A KIND STYLE)
    interface FlowLine {
      x: number;
      baseY: number;
      phase: number;
      speed: number;
      fontSize: number;
    }
    const flowLines: FlowLine[] = [];
    for (let i = 0; i < 16; i++) {
      flowLines.push({
        x: W() * 0.02 + Math.random() * W() * 0.96,
        baseY: Math.random() * H(),
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.5 + 0.25,
        fontSize: Math.random() * 8 + 20,
      });
    }

    // Scan lines - fast sweeping light beams
    interface ScanLine { x: number; speed: number; width: number }
    const scanLines: ScanLine[] = [
      { x: -100, speed: 12, width: 2 },
      { x: -250, speed: 9, width: 1 },
      { x: -400, speed: 15, width: 3 },
    ];

    // Glitch bars (horizontal flash lines like in video)
    interface GlitchBar {
      y: number;
      height: number;
      opacity: number;
      color: string;
      life: number;
    }
    const glitchBars: GlitchBar[] = [];

    // Code fragments
    const codeTexts = ['<1354455547>', '<ERROR_0x404>', '<SYS_INIT>', '<GLITCH>', '<DATA_STREAM>', '<VOID_NODE>', '<MEM_LEAK>', '<CORE_DUMP>'];
    interface CodeFrag { x: number; y: number; text: string; opacity: number; phase: number; fontSize: number }
    const codeFrags: CodeFrag[] = [];

    // Middle area small numbers
    interface MidNum {
      x: number; y: number; value: string;
      size: number; opacity: number; phase: number;
    }
    const midNums: MidNum[] = [];
    for (let i = 0; i < 20; i++) {
      midNums.push({
        x: W() * 0.2 + Math.random() * W() * 0.6,
        y: Math.random() * H(),
        value: Math.floor(Math.random() * 10).toString(),
        size: Math.random() * 14 + 8,
        opacity: 0,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let frame = 0;
    let textReveal = 0;
    const targetText = 'STICKER WEAR';

    const draw = () => {
      frame++;
      const w = W();
      const h = H();

      // Dark background with deep purple-blue tint
      ctx.fillStyle = '#06040a';
      ctx.fillRect(0, 0, w, h);

      // Subtle color wash
      const washPhase = Math.sin(frame * 0.002) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(${washPhase * 15}, 0, ${(1 - washPhase) * 10}, 0.2)`;
      ctx.fillRect(0, 0, w, h);

      // Stars
      for (const s of stars) {
        s.brightness += s.twinkleSpeed;
        const b = Math.sin(s.brightness) * 0.4 + 0.6;
        ctx.globalAlpha = b * 0.7;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(s.x % (w + 200) - 100, s.y % (h + 200) - 100, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // === FLOWING "ONE OF A KIND STYLE" TEXT ===
      for (let i = 0; i < flowLines.length; i++) {
        const fl = flowLines[i];
        fl.phase += fl.speed * 0.015;
        const y = fl.baseY + Math.sin(fl.phase) * 60;
        const visCycle = Math.sin(frame * 0.006 + i * 1.2) * 0.5 + 0.5;
        const op = visCycle * 0.75;
        const blurAmt = (1 - visCycle) * 5;

        if (Math.random() > 0.998) {
          fl.x = w * 0.05 + Math.random() * w * 0.9;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, op);
        if (blurAmt > 0.5) ctx.filter = `blur(${blurAmt}px)`;
        ctx.font = `400 ${fl.fontSize}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(120, 120, 150, ${op})`;
        ctx.fillText('ONE OF A KIND STYLE', fl.x, y);
        ctx.restore();
      }

      // === SIDE NUMBERS === fast spawn, fills in ~1 second
      if (frame % 10 === 0) spawnSideNum('left');
      if (frame % 15 === 0) spawnSideNum('right');

      for (let i = sideNums.length - 1; i >= 0; i--) {
        const n = sideNums[i];
        n.y += n.speed;
        n.phase += 0.02;

        // Fade in then out
        const lifeRatio = n.y / h;
        if (lifeRatio < 0.1) {
          n.opacity += (n.targetOpacity - n.opacity) * 0.05;
        } else if (lifeRatio > 0.7) {
          n.opacity *= 0.97;
        }

        // Random number change
        if (frame % 25 === 0 && Math.random() > 0.6) {
          n.value = Math.floor(Math.random() * 10).toString();
        }

        const blurVal = Math.sin(n.phase) * 6;

        ctx.save();
        ctx.globalAlpha = Math.max(0, n.opacity);

        // Strong white-blue glow
        ctx.shadowColor = n.side === 'left' ? 'rgba(180, 200, 255, 0.8)' : 'rgba(160, 180, 255, 0.8)';
        ctx.shadowBlur = 25 + Math.abs(blurVal) * 2;

        // Outer glow layer
        ctx.fillStyle = `rgba(200, 210, 255, ${n.opacity * 0.3})`;
        ctx.font = `900 ${n.size + 10}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(n.value, n.x, n.y);

        // Main bright layer
        ctx.shadowBlur = 15;
        ctx.fillStyle = `rgba(240, 245, 255, ${n.opacity})`;
        ctx.font = `900 ${n.size}px "JetBrains Mono", monospace`;
        ctx.fillText(n.value, n.x, n.y);

        // Bright core
        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 5;
        ctx.fillStyle = `rgba(255, 255, 255, ${n.opacity * 0.9})`;
        ctx.font = `900 ${n.size * 0.7}px "JetBrains Mono", monospace`;
        ctx.fillText(n.value, n.x, n.y);

        ctx.restore();

        if (n.y > h + 100 || n.opacity < 0.005) {
          sideNums.splice(i, 1);
        }
      }
      while (sideNums.length > 22) sideNums.shift();

      // === MIDDLE SMALL NUMBERS === fill the center void
      for (const mn of midNums) {
        mn.phase += 0.018;
        mn.y -= 8; // float upward fast
        const cycle = Math.sin(mn.phase) * 0.5 + 0.5;
        mn.opacity = cycle * 0.35;

        if (frame % 40 === 0 && Math.random() > 0.7) {
          mn.value = Math.floor(Math.random() * 10).toString();
        }
        if (mn.y < -30) mn.y = h + 30;

        const blurAmt = (1 - cycle) * 4;
        ctx.save();
        ctx.globalAlpha = Math.max(0, mn.opacity);
        if (blurAmt > 0.5) ctx.filter = `blur(${blurAmt}px)`;
        ctx.font = `500 ${mn.size}px "JetBrains Mono", monospace`;
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(130, 130, 160, ${mn.opacity * 0.7})`;
        ctx.fillText(mn.value, mn.x, mn.y);
        ctx.restore();
      }

      // === SCAN LINES ===
      for (const sl of scanLines) {
        sl.x += sl.speed;
        if (sl.x > w + 200) sl.x = -200;

        ctx.save();
        const scanOp = Math.min(1, 0.15 + Math.sin(frame * 0.01) * 0.05);
        const grad = ctx.createLinearGradient(sl.x - 30, 0, sl.x + 30, 0);
        grad.addColorStop(0, `rgba(200, 200, 255, 0)`);
        grad.addColorStop(0.5, `rgba(220, 220, 255, ${scanOp})`);
        grad.addColorStop(1, `rgba(200, 200, 255, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(sl.x - 30, 0, 60, h);

        // Thin bright center line
        ctx.fillStyle = `rgba(255, 255, 255, ${scanOp * 0.5})`;
        ctx.fillRect(sl.x - sl.width / 2, 0, sl.width, h);
        ctx.restore();
      }

      // === GLITCH BARS (horizontal) ===
      if (Math.random() > 0.92) {
        glitchBars.push({
          y: Math.random() * h,
          height: Math.random() * 4 + 1,
          opacity: Math.random() * 0.4 + 0.1,
          color: Math.random() > 0.5 ? '255, 0, 0' : '0, 0, 255',
          life: Math.random() * 8 + 4,
        });
      }
      for (let i = glitchBars.length - 1; i >= 0; i--) {
        const gb = glitchBars[i];
        gb.life--;
        gb.opacity *= 0.9;
        ctx.save();
        ctx.globalAlpha = gb.opacity;
        ctx.fillStyle = `rgba(${gb.color}, ${gb.opacity})`;
        ctx.fillRect(0, gb.y, w, gb.height);
        ctx.restore();
        if (gb.life <= 0 || gb.opacity < 0.01) glitchBars.splice(i, 1);
      }

      // === CODE FRAGMENTS ===
      if (frame % 40 === 0) {
        codeFrags.push({
          x: Math.random() * w,
          y: Math.random() * h,
          text: codeTexts[Math.floor(Math.random() * codeTexts.length)],
          opacity: 0,
          phase: 0,
          fontSize: Math.random() * 3 + 9,
        });
      }
      for (let i = codeFrags.length - 1; i >= 0; i--) {
        const c = codeFrags[i];
        c.phase += 0.025;
        c.opacity = Math.sin(c.phase) * 0.35 + 0.35;
        ctx.save();
        ctx.globalAlpha = Math.max(0, c.opacity);
        ctx.font = `400 ${c.fontSize}px "JetBrains Mono", monospace`;
        ctx.fillStyle = 'rgba(100, 100, 140, 0.5)';
        ctx.fillText(c.text, c.x, c.y);
        ctx.restore();
        if (c.opacity < 0.02) codeFrags.splice(i, 1);
      }
      while (codeFrags.length > 20) codeFrags.shift();

      // === CENTRAL TITLE ===
      if (textReveal < 1) textReveal += 0.006;
      const tr = Math.min(1, textReveal);

      const bgFontSize = Math.min(w * 0.13, 160);
      const fgFontSize = Math.min(w * 0.09, 110);
      const centerY = h * 0.48;

      // Grey background text (larger, layered behind)
      ctx.save();
      ctx.font = `900 ${bgFontSize}px "League Spartan", "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Multi-slice glitch effect for bg text
      const slices = 10;
      const sh = bgFontSize / slices;
      for (let s = 0; s < slices; s++) {
        const sy = centerY - bgFontSize / 2 + s * sh;
        const glitchOff = (1 - tr) > 0.1 ? (Math.random() - 0.5) * 20 * (1 - tr) : 0;

        ctx.save();
        ctx.beginPath();
        ctx.rect(-100, sy, w + 200, sh + 1);
        ctx.clip();

        ctx.fillStyle = `rgba(70, 70, 90, ${0.5 * tr})`;
        ctx.shadowColor = 'rgba(60, 60, 80, 0.4)';
        ctx.shadowBlur = 3;
        ctx.fillText(targetText, w / 2 + glitchOff, centerY);
        ctx.restore();
      }
      ctx.restore();

      // Red glowing foreground text
      ctx.save();
      ctx.font = `900 ${fgFontSize}px "League Spartan", "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Multiple glow layers for intense neon
      for (let g = 6; g >= 1; g--) {
        ctx.shadowColor = `rgba(255, 0, 0, ${0.12 * tr})`;
        ctx.shadowBlur = g * 18;
        ctx.fillStyle = `rgba(255, 10, 10, ${0.08 * tr})`;
        ctx.fillText(targetText, w / 2, centerY);
      }

      // Main red
      ctx.shadowColor = `rgba(255, 0, 0, ${0.9 * tr})`;
      ctx.shadowBlur = 40;
      ctx.fillStyle = `rgba(255, 15, 15, ${tr})`;
      ctx.fillText(targetText, w / 2, centerY);

      // Bright inner
      ctx.shadowColor = `rgba(255, 80, 80, ${0.6 * tr})`;
      ctx.shadowBlur = 12;
      ctx.fillStyle = `rgba(255, 50, 50, ${tr})`;
      ctx.fillText(targetText, w / 2, centerY);

      ctx.restore();

      // Horizontal red glow bars (like in the video around the text)
      const barY1 = centerY - fgFontSize * 0.42;
      const barY2 = centerY + fgFontSize * 0.38;

      for (const barY of [barY1, barY2]) {
        const barOp = (Math.sin(frame * 0.025) * 0.3 + 0.5) * 0.2 * tr;
        ctx.save();
        const bGrad = ctx.createLinearGradient(0, barY - 15, 0, barY + 15);
        bGrad.addColorStop(0, 'rgba(200, 0, 0, 0)');
        bGrad.addColorStop(0.5, `rgba(255, 0, 0, ${barOp})`);
        bGrad.addColorStop(1, 'rgba(200, 0, 0, 0)');
        ctx.fillStyle = bGrad;
        ctx.fillRect(0, barY - 15, w, 30);

        // Bright center
        const bGrad2 = ctx.createLinearGradient(0, barY - 4, 0, barY + 4);
        bGrad2.addColorStop(0, 'rgba(255, 50, 50, 0)');
        bGrad2.addColorStop(0.5, `rgba(255, 30, 30, ${barOp * 1.5})`);
        bGrad2.addColorStop(1, 'rgba(255, 50, 50, 0)');
        ctx.fillStyle = bGrad2;
        ctx.fillRect(0, barY - 4, w, 8);
        ctx.restore();
      }

      // RGB split glitch (occasional)
      if (Math.sin(frame * 0.007) > 0.8) {
        ctx.save();
        const split = 5;
        ctx.globalAlpha = 0.35 * tr;
        ctx.font = `900 ${fgFontSize}px "League Spartan", "Inter", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
        ctx.fillText(targetText, w / 2 - split, centerY);
        ctx.fillStyle = 'rgba(0, 50, 255, 0.4)';
        ctx.fillText(targetText, w / 2 + split, centerY);
        ctx.restore();
      }

      // Block glitch (video-style rectangular displacement)
      if (Math.random() > 0.96) {
        ctx.save();
        const gy = centerY + (Math.random() - 0.5) * fgFontSize * 0.6;
        const gh = Math.random() * 12 + 3;
        const gOff = (Math.random() - 0.5) * 30;
        ctx.globalAlpha = 0.25;

        ctx.drawImage(canvas, 0, gy - gh / 2, w, gh, gOff, gy - gh / 2, w, gh);
        ctx.fillStyle = `rgba(255, 0, 0, 0.15)`;
        ctx.fillRect(0, gy - gh / 2, w, gh);
        ctx.restore();
      }

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(0, 0, 0, 0.55)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      // Subtle noise
      ctx.save();
      ctx.globalAlpha = 0.025;
      for (let i = 0; i < 80; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
        ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
      }
      ctx.restore();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      onClick={handleClick}
      className={`fixed inset-0 overflow-hidden cursor-pointer select-none ${isGlitching ? 'glitch-transition' : ''}`}
      style={{ pointerEvents: isGlitching ? 'none' : 'auto', background: '#06040a' }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
      <div
        className="absolute bottom-[5vh] left-0 right-0 text-center font-mono-data error-blink pointer-events-none z-10"
        style={{ fontSize: '12px', color: 'rgba(140, 140, 170, 0.45)', letterSpacing: '2px' }}
      >
        System initialization failed. Retrying... [Error 0x404]
      </div>
      <div
        className="absolute bottom-[10vh] left-0 right-0 text-center font-mono-data pointer-events-none z-10"
        style={{ fontSize: '11px', color: 'rgba(140, 140, 170, 0.25)', letterSpacing: '6px' }}
      >
        CLICK ANYWHERE TO ENTER
      </div>
    </div>
  );
}
