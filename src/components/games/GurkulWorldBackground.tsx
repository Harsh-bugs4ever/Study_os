/**
 * GurkulWorldBackground.tsx
 * 
 * Fully animated Gurukul-inspired 3D-ish background scene.
 * Uses HTML Canvas + CSS animations for high-performance rendering.
 * No external 3D dependencies — pure WebGL-quality feel via layered canvas.
 */

import { useEffect, useRef, useCallback } from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  opacityDir: number;
  color: string;
  type: 'dust' | 'firefly' | 'petal';
  angle: number;
  angleSpeed: number;
  life: number;
}

interface Child {
  x: number;
  y: number;
  phase: number;
  speed: number;
  scale: number;
  color: string;
  activity: 'run' | 'play' | 'sit';
}

interface Tree {
  x: number;
  y: number;
  scale: number;
  sway: number;
  swaySpeed: number;
  color: string;
  darkColor: string;
  layer: number;
}

// ─────────────────────────────────────────────
// Color palette
// ─────────────────────────────────────────────
const COLORS = {
  sky1:    '#FFD9A0',
  sky2:    '#FFA94D',
  sky3:    '#E8753A',
  horizon: '#FFE0B2',
  ground1: '#C8A96E',
  ground2: '#A07840',
  grass:   '#7CB87F',
  grassDark:'#5A9E5D',
  treeA:   '#5A8A55',
  treeB:   '#3D6B38',
  treeC:   '#2E5229',
  dust:    'rgba(255,220,150,0.6)',
  firefly: 'rgba(255,255,180,0.9)',
  petal:   'rgba(255,160,120,0.7)',
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ─────────────────────────────────────────────
// Draw helpers
// ─────────────────────────────────────────────

function drawTree(ctx: CanvasRenderingContext2D, tree: Tree, t: number) {
  const { x, y, scale, sway, swaySpeed, color, darkColor } = tree;
  const swayAmt = Math.sin(t * swaySpeed + tree.x) * sway;
  
  ctx.save();
  ctx.translate(x, y);

  // Trunk
  ctx.beginPath();
  ctx.fillStyle = '#7B5833';
  const tw = 8 * scale;
  const th = 45 * scale;
  ctx.fillRect(-tw / 2 + swayAmt * 0.3, -th, tw, th);

  // Crown layers (parallax sway)
  for (let i = 0; i < 3; i++) {
    const cr = (30 + i * 8) * scale;
    const cy = -th - cr * 0.4 + i * 12 * scale + swayAmt * (0.5 + i * 0.2);
    const gradient = ctx.createRadialGradient(swayAmt * 0.5, cy - cr * 0.3, 0, swayAmt * 0.5, cy, cr);
    gradient.addColorStop(0, i === 0 ? color : darkColor);
    gradient.addColorStop(1, darkColor);
    ctx.beginPath();
    ctx.ellipse(swayAmt * (0.5 + i * 0.15), cy, cr, cr * 0.85, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    // Leaf highlight
    ctx.beginPath();
    ctx.ellipse(swayAmt * 0.5 - cr * 0.2, cy - cr * 0.25, cr * 0.4, cr * 0.25, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = color + '88';
    ctx.fill();
  }

  ctx.restore();
}

function drawChild(ctx: CanvasRenderingContext2D, child: Child, t: number) {
  const { x, y, phase, speed, scale, color, activity } = child;
  
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const bounce = Math.abs(Math.sin(t * speed * 2 + phase)) * (activity === 'run' ? 6 : 2);
  const armSwing = Math.sin(t * speed * 3 + phase) * 20;
  const legSwing = Math.sin(t * speed * 3 + phase) * 18;

  ctx.translate(0, -bounce);

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-5, -14, 10, 14, 3);
  ctx.fill();

  // Head
  ctx.fillStyle = '#F4C27F';
  ctx.beginPath();
  ctx.ellipse(0, -20, 6.5, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hair
  ctx.fillStyle = '#3D2B1F';
  ctx.beginPath();
  ctx.ellipse(0, -24, 6, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  if (activity !== 'sit') {
    // Arms
    ctx.strokeStyle = '#F4C27F';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, -10);
    ctx.lineTo(-12, -10 + armSwing * 0.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, -10);
    ctx.lineTo(12, -10 - armSwing * 0.3);
    ctx.stroke();

    // Legs
    ctx.beginPath();
    ctx.moveTo(-2, 0);
    ctx.lineTo(-4, 10 + Math.sin(t * speed * 3 + phase) * 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(4, 10 - Math.sin(t * speed * 3 + phase) * 4);
    ctx.stroke();
  } else {
    // Sitting pose
    ctx.strokeStyle = '#F4C27F';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-5, -8);
    ctx.lineTo(-10, -2 + Math.sin(t + phase) * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(5, -8);
    ctx.lineTo(10, -2 - Math.sin(t + phase) * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.lineTo(-8, 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(4, 0);
    ctx.lineTo(8, 8);
    ctx.stroke();
  }

  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.globalAlpha = p.opacity;
  
  if (p.type === 'dust') {
    ctx.fillStyle = COLORS.dust;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.type === 'firefly') {
    // Glow
    const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
    g.addColorStop(0, 'rgba(255,255,180,0.8)');
    g.addColorStop(1, 'rgba(255,255,100,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
    ctx.fill();
    // Core
    ctx.fillStyle = COLORS.firefly;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Petal
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillStyle = COLORS.petal;
    ctx.beginPath();
    ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  ctx.restore();
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────
export const GurkulWorldBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<Particle[]>([]);
  const childrenRef = useRef<Child[]>([]);
  const treesRef = useRef<Tree[]>([]);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const lastTimeRef = useRef(0);

  const initScene = useCallback((w: number, h: number) => {
    const ground = h * 0.68;

    // Initialize trees (3 layers for parallax)
    treesRef.current = [
      // Far layer
      { x: w * 0.05, y: ground - 10, scale: 0.6, sway: 2, swaySpeed: 0.4, color: COLORS.treeA, darkColor: COLORS.treeC, layer: 0 },
      { x: w * 0.18, y: ground - 5,  scale: 0.55, sway: 1.5, swaySpeed: 0.35, color: COLORS.treeA, darkColor: COLORS.treeC, layer: 0 },
      { x: w * 0.78, y: ground - 8,  scale: 0.58, sway: 2, swaySpeed: 0.45, color: COLORS.treeA, darkColor: COLORS.treeC, layer: 0 },
      { x: w * 0.92, y: ground - 12, scale: 0.62, sway: 1.8, swaySpeed: 0.38, color: COLORS.treeA, darkColor: COLORS.treeC, layer: 0 },
      // Mid layer
      { x: w * 0.08, y: ground + 5,  scale: 0.85, sway: 3, swaySpeed: 0.5, color: COLORS.treeB, darkColor: COLORS.treeC, layer: 1 },
      { x: w * 0.88, y: ground + 2,  scale: 0.9,  sway: 2.5, swaySpeed: 0.48, color: COLORS.treeB, darkColor: COLORS.treeC, layer: 1 },
      // Near layer
      { x: w * 0.02, y: ground + 20, scale: 1.1,  sway: 4, swaySpeed: 0.6, color: COLORS.treeB, darkColor: COLORS.treeC, layer: 2 },
      { x: w * 0.96, y: ground + 18, scale: 1.2,  sway: 3.5, swaySpeed: 0.55, color: COLORS.treeB, darkColor: COLORS.treeC, layer: 2 },
    ];

    // Initialize children
    const activities: Array<'run' | 'play' | 'sit'> = ['run', 'play', 'sit', 'run', 'play'];
    const clothColors = ['#E07A5F', '#3D405B', '#81B29A', '#F2CC8F', '#D4A5A5'];
    childrenRef.current = Array.from({ length: 5 }, (_, i) => ({
      x: w * (0.22 + i * 0.14),
      y: ground + 15,
      phase: i * 1.2,
      speed: 0.6 + i * 0.1,
      scale: 0.75 + Math.random() * 0.2,
      color: clothColors[i],
      activity: activities[i],
    }));

    // Initialize particles
    particlesRef.current = Array.from({ length: 60 }, (_, i) => ({
      x: Math.random() * w,
      y: Math.random() * h * 0.75,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.1 - Math.random() * 0.2,
      size: 1 + Math.random() * 2,
      opacity: Math.random() * 0.5,
      opacityDir: 0.005 + Math.random() * 0.01,
      color: COLORS.dust,
      type: i < 35 ? 'dust' : i < 50 ? 'firefly' : 'petal',
      angle: Math.random() * Math.PI * 2,
      angleSpeed: (Math.random() - 0.5) * 0.02,
      life: Math.random(),
    }));
  }, []);

  const drawScene = useCallback((ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => {
    const ground = h * 0.68;
    const mx = mousePosRef.current.x / w; // normalized 0-1

    // ── Sky gradient ──
    const skyGrad = ctx.createLinearGradient(0, 0, 0, ground);
    skyGrad.addColorStop(0, '#FF9A6C');
    skyGrad.addColorStop(0.4, '#FFB577');
    skyGrad.addColorStop(0.7, '#FFD4A0');
    skyGrad.addColorStop(1, COLORS.horizon);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, ground);

    // ── Sun ──
    const sunX = w * (0.75 + mx * 0.05);
    const sunY = h * 0.12;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 80);
    sunGrad.addColorStop(0, 'rgba(255,255,200,0.95)');
    sunGrad.addColorStop(0.2, 'rgba(255,220,100,0.7)');
    sunGrad.addColorStop(0.5, 'rgba(255,180,60,0.3)');
    sunGrad.addColorStop(1, 'rgba(255,140,30,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
    ctx.fill();
    // Sun core
    ctx.fillStyle = 'rgba(255,255,220,0.9)';
    ctx.beginPath();
    ctx.arc(sunX, sunY, 22, 0, Math.PI * 2);
    ctx.fill();

    // ── God rays ──
    ctx.save();
    ctx.globalAlpha = 0.06 + Math.sin(t * 0.3) * 0.02;
    for (let r = 0; r < 8; r++) {
      const angle = (r / 8) * Math.PI * 2 + t * 0.05;
      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      const rx = sunX + Math.cos(angle) * w * 1.5;
      const ry = sunY + Math.sin(angle) * h * 1.5;
      ctx.lineTo(rx + Math.cos(angle + 0.1) * 60, ry + Math.sin(angle + 0.1) * 60);
      ctx.lineTo(rx - Math.cos(angle + 0.1) * 60, ry - Math.sin(angle + 0.1) * 60);
      ctx.closePath();
      ctx.fillStyle = 'rgba(255,210,120,1)';
      ctx.fill();
    }
    ctx.restore();

    // ── Haze / horizon glow ──
    const hazeGrad = ctx.createLinearGradient(0, ground - 60, 0, ground);
    hazeGrad.addColorStop(0, 'rgba(255,200,130,0)');
    hazeGrad.addColorStop(1, 'rgba(255,200,130,0.25)');
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, ground - 60, w, 60);

    // ── Far trees (layer 0) ──
    treesRef.current.filter(tr => tr.layer === 0).forEach(tr => drawTree(ctx, tr, t));

    // ── Mid ground ──
    const midGrad = ctx.createLinearGradient(0, ground, 0, h);
    midGrad.addColorStop(0, '#D4AA6E');
    midGrad.addColorStop(0.3, '#C29858');
    midGrad.addColorStop(1, '#A07840');
    ctx.fillStyle = midGrad;
    ctx.fillRect(0, ground, w, h - ground);

    // ── Grass band ──
    ctx.fillStyle = COLORS.grass;
    ctx.beginPath();
    ctx.moveTo(0, ground);
    for (let gx = 0; gx <= w; gx += 4) {
      const gy = Math.sin(gx * 0.02 + t * 0.5) * 3;
      ctx.lineTo(gx, ground + gy);
    }
    ctx.lineTo(w, ground + 12);
    ctx.lineTo(0, ground + 12);
    ctx.closePath();
    ctx.fill();

    // Dark grass detail
    ctx.fillStyle = COLORS.grassDark;
    ctx.beginPath();
    ctx.moveTo(0, ground + 4);
    for (let gx = 0; gx <= w; gx += 3) {
      const gy = Math.sin(gx * 0.025 + t * 0.6 + 1) * 2;
      ctx.lineTo(gx, ground + 6 + gy);
    }
    ctx.lineTo(w, ground + 12);
    ctx.lineTo(0, ground + 12);
    ctx.closePath();
    ctx.fill();

    // ── Mid trees (layer 1) ──
    treesRef.current.filter(tr => tr.layer === 1).forEach(tr => drawTree(ctx, tr, t));

    // ── Path / मिट्टी ──
    const pathGrad = ctx.createLinearGradient(w * 0.35, 0, w * 0.65, 0);
    pathGrad.addColorStop(0, 'rgba(180,130,80,0)');
    pathGrad.addColorStop(0.3, 'rgba(200,160,100,0.6)');
    pathGrad.addColorStop(0.7, 'rgba(200,160,100,0.6)');
    pathGrad.addColorStop(1, 'rgba(180,130,80,0)');
    ctx.beginPath();
    ctx.moveTo(w * 0.35, ground + 5);
    ctx.bezierCurveTo(w * 0.38, ground + 40, w * 0.45, ground + 80, w * 0.5, h);
    ctx.bezierCurveTo(w * 0.55, ground + 80, w * 0.62, ground + 40, w * 0.65, ground + 5);
    ctx.closePath();
    ctx.fillStyle = pathGrad;
    ctx.fill();

    // ── Children ──
    childrenRef.current.forEach(child => {
      // Gentle horizontal drift
      if (child.activity === 'run') {
        child.x += Math.sin(t * child.speed * 0.5 + child.phase) * 0.4;
        child.x = Math.max(w * 0.15, Math.min(w * 0.85, child.x));
      }
      drawChild(ctx, child, t);
    });

    // ── Near trees (layer 2) ──
    treesRef.current.filter(tr => tr.layer === 2).forEach(tr => drawTree(ctx, tr, t));

    // ── Depth of field vignette for far bg ──
    const dofGrad = ctx.createLinearGradient(0, 0, 0, ground * 0.5);
    dofGrad.addColorStop(0, 'rgba(255,150,80,0.15)');
    dofGrad.addColorStop(1, 'rgba(255,150,80,0)');
    ctx.fillStyle = dofGrad;
    ctx.fillRect(0, 0, w, ground * 0.5);

    // ── Particles ──
    particlesRef.current.forEach(p => {
      // Mouse attraction for dust
      if (p.type === 'dust') {
        const dx = mousePosRef.current.x - p.x;
        const dy = mousePosRef.current.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          p.vx += (dx / dist) * 0.02;
          p.vy += (dy / dist) * 0.02;
        }
      }

      p.x += p.vx;
      p.y += p.vy;
      p.angle += p.angleSpeed;
      p.opacity += p.opacityDir;

      if (p.opacity >= 0.7 || p.opacity <= 0) p.opacityDir *= -1;
      if (p.y < -20 || p.x < -20 || p.x > w + 20) {
        p.y = Math.random() > 0.5 ? h * 0.8 : Math.random() * h;
        p.x = Math.random() * w;
        p.vx = (Math.random() - 0.5) * 0.3;
        p.vy = -0.1 - Math.random() * 0.2;
      }

      // Fireflies only appear lower
      if (p.type === 'firefly' && p.y < ground * 0.4) {
        p.y = ground + Math.random() * 60;
      }

      drawParticle(ctx, p);
    });

    // ── Overlay vignette ──
    const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h);
    vignette.addColorStop(0, 'rgba(0,0,0,0)');
    vignette.addColorStop(1, 'rgba(0,0,0,0.25)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initScene(canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mousePosRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    canvas.addEventListener('mousemove', onMouseMove);

    let lastTs = 0;
    const animate = (ts: number) => {
      const delta = Math.min(ts - lastTs, 50) / 16.67; // normalized to 60fps
      lastTs = ts;
      timeRef.current += 0.016 * delta;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawScene(ctx, canvas.width, canvas.height, timeRef.current);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
    };
  }, [initScene, drawScene]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

export default GurkulWorldBackground;
