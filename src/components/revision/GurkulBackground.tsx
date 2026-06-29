import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  size: number; opacity: number; wobble: number; wobbleSpeed: number;
}
interface FloatingBook {
  x: number; y: number; z: number;
  rotX: number; rotY: number; rotZ: number;
  vRotX: number; vRotY: number; vRotZ: number;
  scale: number; color: string; type: 'book' | 'scroll' | 'leaf';
  floatOffset: number; floatSpeed: number;
}
interface OilLamp {
  x: number; y: number; flicker: number; flickerSpeed: number;
  glowRadius: number; glowPhase: number;
}

export function GurkulBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;

    // Dust particles
    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.15, vy: -Math.random() * 0.2 - 0.05,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.25 + 0.05,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: Math.random() * 0.01 + 0.003,
    }));

    // Floating objects
    const floaters: FloatingBook[] = Array.from({ length: 7 }, (_, i) => ({
      x: (i + 1) * (W / 8), y: H * 0.2 + Math.random() * H * 0.5,
      z: Math.random() * 200 - 100,
      rotX: Math.random() * 30 - 15,
      rotY: Math.random() * 360,
      rotZ: Math.random() * 20 - 10,
      vRotX: (Math.random() - 0.5) * 0.1,
      vRotY: (Math.random() - 0.5) * 0.15,
      vRotZ: (Math.random() - 0.5) * 0.05,
      scale: 0.6 + Math.random() * 0.6,
      color: ['#8B6914', '#A0522D', '#6B4226', '#C4A35A', '#7B5B3A'][Math.floor(Math.random() * 5)],
      type: ['book', 'scroll', 'leaf'][Math.floor(Math.random() * 3)] as any,
      floatOffset: Math.random() * Math.PI * 2,
      floatSpeed: 0.003 + Math.random() * 0.004,
    }));

    // Oil lamps
    const lamps: OilLamp[] = Array.from({ length: 4 }, (_, i) => ({
      x: (W / 5) * (i + 1), y: H * 0.85 + Math.random() * H * 0.1,
      flicker: Math.random() * Math.PI * 2,
      flickerSpeed: 0.05 + Math.random() * 0.05,
      glowRadius: 60 + Math.random() * 40,
      glowPhase: Math.random() * Math.PI * 2,
    }));

    let t = 0;

    const drawBook = (x: number, y: number, scale: number, color: string, rotY: number) => {
      const w = 28 * scale, h = 36 * scale, depth = 8 * scale;
      const r = (rotY * Math.PI) / 180;
      const skew = Math.sin(r) * depth;
      const dimFactor = 0.4 + Math.abs(Math.cos(r)) * 0.6;

      ctx.save();
      ctx.translate(x, y);

      // Book shadow
      ctx.fillStyle = `rgba(0,0,0,0.08)`;
      ctx.beginPath();
      ctx.ellipse(0, h / 2 + 4, w * 0.6, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Book spine
      ctx.fillStyle = adjustColorBrightness(color, dimFactor * 0.7);
      ctx.beginPath();
      ctx.rect(-w / 2 - skew, -h / 2, skew + 3, h);
      ctx.fill();

      // Book cover
      ctx.fillStyle = adjustColorBrightness(color, dimFactor);
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 2);
      ctx.fill();

      // Gold page edges
      ctx.fillStyle = `rgba(212,175,55,${dimFactor * 0.4})`;
      ctx.beginPath();
      ctx.rect(w / 2 - 3, -h / 2 + 2, 3, h - 4);
      ctx.fill();

      // Cover lines (pages detail)
      ctx.strokeStyle = `rgba(255,255,255,${dimFactor * 0.12})`;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 4; i++) {
        const ly = -h / 2 + 8 + i * 6 * scale;
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 4, ly); ctx.lineTo(w / 2 - 4, ly);
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawScroll = (x: number, y: number, scale: number, color: string, rotY: number) => {
      const w = 16 * scale, h = 38 * scale;
      const r = (rotY * Math.PI) / 180;
      const dimFactor = 0.5 + Math.abs(Math.cos(r)) * 0.5;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r * 0.3);

      // Scroll rod top
      ctx.fillStyle = adjustColorBrightness('#8B6914', dimFactor * 0.9);
      ctx.beginPath();
      ctx.roundRect(-w / 2 - 3, -h / 2 - 3, w + 6, 7, 3);
      ctx.fill();

      // Scroll body
      ctx.fillStyle = adjustColorBrightness('#F5DEB3', dimFactor * 0.9);
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2 + 4, w, h - 8, 1);
      ctx.fill();

      // Scroll lines
      ctx.strokeStyle = `rgba(100,70,30,${dimFactor * 0.2})`;
      ctx.lineWidth = 0.7;
      for (let i = 0; i < 6; i++) {
        const ly = -h / 2 + 10 + i * 5;
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 3, ly); ctx.lineTo(w / 2 - 3, ly);
        ctx.stroke();
      }

      // Scroll rod bottom
      ctx.fillStyle = adjustColorBrightness('#8B6914', dimFactor * 0.9);
      ctx.beginPath();
      ctx.roundRect(-w / 2 - 3, h / 2 - 4, w + 6, 7, 3);
      ctx.fill();

      ctx.restore();
    };

    const drawPalmLeaf = (x: number, y: number, scale: number, rotY: number) => {
      const len = 50 * scale;
      const r = (rotY * Math.PI) / 180;
      const dimFactor = 0.4 + Math.abs(Math.cos(r)) * 0.6;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(r * 0.2 - 0.3);

      // Leaf veins background
      ctx.fillStyle = adjustColorBrightness('#C4A35A', dimFactor * 0.7);
      ctx.beginPath();
      ctx.ellipse(0, 0, len / 2, 7 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Main rib
      ctx.strokeStyle = adjustColorBrightness('#8B6914', dimFactor * 0.9);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-len / 2, 0); ctx.lineTo(len / 2, 0);
      ctx.stroke();

      // Cross veins
      ctx.lineWidth = 0.5;
      for (let i = -3; i <= 3; i++) {
        const lx = i * (len / 8);
        ctx.beginPath();
        ctx.moveTo(lx, -4 * scale); ctx.lineTo(lx, 4 * scale);
        ctx.stroke();
      }

      ctx.restore();
    };

    const drawOilLamp = (lamp: OilLamp, now: number) => {
      const { x, y } = lamp;
      const flicker = Math.sin(now * lamp.flickerSpeed + lamp.flicker) * 0.3 + 0.7;
      const glow = lamp.glowRadius * (0.85 + flicker * 0.15);

      // Glow pool on floor
      const glowGrad = ctx.createRadialGradient(x, y, 0, x, y, glow);
      glowGrad.addColorStop(0, `rgba(255,170,50,${0.06 * flicker})`);
      glowGrad.addColorStop(0.5, `rgba(255,120,30,${0.03 * flicker})`);
      glowGrad.addColorStop(1, 'rgba(255,100,20,0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.ellipse(x, y, glow, glow * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lamp body
      ctx.fillStyle = `rgba(139,105,20,0.7)`;
      ctx.beginPath();
      ctx.ellipse(x, y - 4, 9, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(160,125,40,0.5)`;
      ctx.beginPath();
      ctx.moveTo(x - 9, y - 4); ctx.lineTo(x - 7, y + 4); ctx.lineTo(x + 7, y + 4); ctx.lineTo(x + 9, y - 4);
      ctx.closePath(); ctx.fill();

      // Flame
      const fh = 14 * flicker;
      const fGrad = ctx.createRadialGradient(x, y - 8, 0, x, y - 8, fh);
      fGrad.addColorStop(0, `rgba(255,240,180,${0.9 * flicker})`);
      fGrad.addColorStop(0.3, `rgba(255,160,40,${0.7 * flicker})`);
      fGrad.addColorStop(1, 'rgba(255,80,0,0)');
      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.moveTo(x - 3, y - 4);
      ctx.quadraticCurveTo(x + 4, y - 10, x, y - 4 - fh);
      ctx.quadraticCurveTo(x - 4, y - 10, x - 3, y - 4);
      ctx.fill();
    };

    function adjustColorBrightness(hex: string, factor: number): string {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${Math.round(r * factor)},${Math.round(g * factor)},${Math.round(b * factor)},0.55)`;
    }

    const render = () => {
      t += 1;
      ctx.clearRect(0, 0, W, H);

      // Parallax offset from mouse
      const mx = (mouseRef.current.x - 0.5) * 30;
      const my = (mouseRef.current.y - 0.5) * 20;

      // Background gradient — deep warm dark
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, 'rgba(30,18,8,1)');
      bg.addColorStop(0.5, 'rgba(22,14,6,1)');
      bg.addColorStop(1, 'rgba(15,9,4,1)');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Ambient light blobs (sandalwood + gold)
      const ambients = [
        { cx: W * 0.2, cy: H * 0.3, r: W * 0.35, color: [255, 140, 50] },
        { cx: W * 0.8, cy: H * 0.6, r: W * 0.3, color: [212, 175, 55] },
        { cx: W * 0.5, cy: H * 0.8, r: W * 0.25, color: [180, 100, 30] },
      ];
      ambients.forEach(({ cx, cy, r, color }) => {
        const g = ctx.createRadialGradient(cx + mx * 0.3, cy + my * 0.3, 0, cx + mx * 0.3, cy + my * 0.3, r);
        g.addColorStop(0, `rgba(${color.join(',')},0.055)`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      });

      // Oil lamps
      lamps.forEach(lamp => drawOilLamp({ ...lamp, x: lamp.x + mx * 0.5, y: lamp.y + my * 0.3 }, t));

      // Floating objects with parallax
      floaters.forEach((f, i) => {
        f.rotY += f.vRotY;
        f.rotX += f.vRotX;
        f.rotZ += f.vRotZ;
        const floatY = Math.sin(t * f.floatSpeed + f.floatOffset) * 12;
        const depth = (f.z + 100) / 200; // 0–1
        const px = f.x + mx * (depth * 0.6 + 0.1);
        const py = f.y + floatY + my * (depth * 0.5 + 0.1);
        const alpha = 0.15 + depth * 0.25;

        ctx.globalAlpha = alpha;
        if (f.type === 'book') drawBook(px, py, f.scale, f.color, f.rotY);
        else if (f.type === 'scroll') drawScroll(px, py, f.scale, f.color, f.rotY);
        else drawPalmLeaf(px, py, f.scale, f.rotY);
        ctx.globalAlpha = 1;
      });

      // Dust particles
      particles.forEach(p => {
        p.wobble += p.wobbleSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.15 + mx * 0.002;
        p.y += p.vy;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;

        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2.5);
        glow.addColorStop(0, `rgba(255,200,100,${p.opacity})`);
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle wood grain floor line
      ctx.strokeStyle = `rgba(139,90,43,0.08)`;
      ctx.lineWidth = 1;
      for (let gy = H * 0.75; gy < H; gy += 20) {
        ctx.beginPath();
        ctx.moveTo(0, gy + Math.sin(t * 0.002 + gy) * 2);
        ctx.lineTo(W, gy + Math.sin(t * 0.002 + gy + 1) * 2);
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(render);
    };

    render();

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('mousemove', onMouse);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}