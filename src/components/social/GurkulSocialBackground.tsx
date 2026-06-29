/**
 * GurkulSocialBackground.tsx
 *
 * Immersive canvas-based banyan tree scene for the Social / Study Together page.
 * Features:
 *  - Large central banyan tree (वट वृक्ष) with aerial roots
 *  - Guru sitting cross-legged, teaching
 *  - Multiple students sitting in a semicircle
 *  - Continuously falling leaves
 *  - Subtle wind sway animation
 *  - Mouse parallax / depth shift
 *  - Fireflies at dusk
 *  - 60fps target via requestAnimationFrame delta-cap
 */

import { useEffect, useRef, useCallback } from 'react';

// ─── Types ────────────────────────────────────
interface Leaf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  scale: number;
  opacity: number;
  color: string;
  wobble: number;
  wobbleSpeed: number;
}

interface Firefly {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  opacityDir: number;
  phase: number;
}

// ─── Palette ──────────────────────────────────
const C = {
  skyTop:    '#1A0F2E',
  skyMid:    '#2D1B4E',
  skyHorizon:'#6B3F7A',
  sunsetOrange:'#C2694A',
  horizonGlow:'#E8956D',
  groundDark: '#1C1208',
  groundMid:  '#2E1E0A',
  groundLight:'#3D2810',
  grassDark:  '#1B3A1C',
  grassMid:   '#254D26',
  grassLight: '#2E6030',
  trunkDark:  '#1A0D05',
  trunkMid:   '#2C1708',
  trunkLight: '#3E2210',
  leafDark:   '#0E2A0E',
  leafMid:    '#1A4A1A',
  leafLight:  '#246B24',
  leafHighlight:'#2E8B2E',
  leafFall1:  '#8B6914',
  leafFall2:  '#A0522D',
  leafFall3:  '#556B2F',
  leafFall4:  '#6B8E23',
  skinDark:   '#8B5E3C',
  skinLight:  '#C8916A',
  saffron:    '#FF8C00',
  white:      '#FFFFF0',
  ochre:      '#CC7722',
};

// ─── Helpers ──────────────────────────────────
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const PI2 = Math.PI * 2;

// ─── Draw: Banyan Tree ────────────────────────
function drawBanyanTree(
  ctx: CanvasRenderingContext2D,
  cx: number, groundY: number,
  t: number, mx: number
) {
  const wind = Math.sin(t * 0.4) * 0.018 + mx * 0.012;

  // === Aerial roots (hanging from branches) ===
  ctx.save();
  ctx.strokeStyle = C.trunkDark;
  ctx.lineWidth = 2.5;
  const rootPositions = [-180, -130, -60, 60, 140, 200, -240, 250];
  const rootHeights = [0.6, 0.5, 0.7, 0.65, 0.55, 0.72, 0.45, 0.5];
  rootPositions.forEach((rx, i) => {
    const sway = Math.sin(t * 0.5 + i * 1.2) * 8 * wind * 30;
    const startY = groundY - 400 + i * 20;
    const endY = groundY - 40 + (i % 2 === 0 ? 20 : 0);
    const rootH = (endY - startY) * rootHeights[i];
    ctx.beginPath();
    ctx.moveTo(cx + rx, startY);
    ctx.bezierCurveTo(
      cx + rx + sway * 2, startY + rootH * 0.3,
      cx + rx + sway * 3, startY + rootH * 0.7,
      cx + rx + sway * 1.5, startY + rootH
    );
    ctx.globalAlpha = 0.6;
    ctx.stroke();
    // Thicker secondary trunk where root reaches ground
    if (rootHeights[i] > 0.6) {
      ctx.lineWidth = 4;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(cx + rx + sway * 1.5, startY + rootH);
      ctx.lineTo(cx + rx + sway * 1.5, groundY);
      ctx.stroke();
      ctx.lineWidth = 2.5;
    }
  });
  ctx.globalAlpha = 1;
  ctx.restore();

  // === Main trunk ===
  ctx.save();
  const trunkGrad = ctx.createLinearGradient(cx - 35, 0, cx + 35, 0);
  trunkGrad.addColorStop(0, C.trunkDark);
  trunkGrad.addColorStop(0.35, C.trunkMid);
  trunkGrad.addColorStop(0.65, C.trunkLight);
  trunkGrad.addColorStop(1, C.trunkDark);
  ctx.fillStyle = trunkGrad;
  ctx.beginPath();
  ctx.moveTo(cx - 30, groundY);
  ctx.bezierCurveTo(cx - 32, groundY - 150, cx - 28, groundY - 300, cx - 18, groundY - 480);
  ctx.bezierCurveTo(cx - 14, groundY - 500, cx + 14, groundY - 500, cx + 18, groundY - 480);
  ctx.bezierCurveTo(cx + 28, groundY - 300, cx + 32, groundY - 150, cx + 30, groundY);
  ctx.closePath();
  ctx.fill();

  // Trunk highlight
  ctx.beginPath();
  ctx.fillStyle = 'rgba(100,60,20,0.15)';
  ctx.ellipse(cx + 5, groundY - 200, 8, 120, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // === Main branches ===
  ctx.save();
  ctx.strokeStyle = C.trunkMid;
  ctx.lineCap = 'round';
  const branches = [
    { startX: cx - 10, startY: groundY - 450, angle: -0.5, len: 200, w: 12 },
    { startX: cx + 10, startY: groundY - 430, angle: 0.45, len: 220, w: 11 },
    { startX: cx - 5,  startY: groundY - 380, angle: -0.8, len: 160, w: 9 },
    { startX: cx + 5,  startY: groundY - 370, angle: 0.75, len: 170, w: 9 },
    { startX: cx - 8,  startY: groundY - 300, angle: -1.0, len: 130, w: 7 },
    { startX: cx + 8,  startY: groundY - 290, angle: 0.95, len: 140, w: 7 },
    { startX: cx,      startY: groundY - 480, angle: -0.15, len: 180, w: 10 },
  ];
  branches.forEach((b, bi) => {
    const sway = Math.sin(t * 0.45 + bi * 0.8) * wind * b.len * 0.3;
    ctx.lineWidth = b.w;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(b.startX, b.startY);
    const endX = b.startX + Math.cos(b.angle) * b.len + sway;
    const endY = b.startY - Math.sin(Math.abs(b.angle)) * b.len * 0.5;
    ctx.quadraticCurveTo(
      b.startX + Math.cos(b.angle) * b.len * 0.5 + sway * 0.5,
      b.startY - 30,
      endX, endY
    );
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.restore();

  // === Foliage clusters (multiple layered ellipses) ===
  const leafClusters = [
    { ox: 0,    oy: -520, rx: 200, ry: 120 },
    { ox: -160, oy: -480, rx: 130, ry: 90 },
    { ox: 170,  oy: -470, rx: 140, ry: 95 },
    { ox: -270, oy: -420, rx: 110, ry: 75 },
    { ox: 280,  oy: -400, rx: 120, ry: 80 },
    { ox: -80,  oy: -560, rx: 150, ry: 85 },
    { ox: 90,   oy: -550, rx: 160, ry: 90 },
    { ox: -200, oy: -350, rx: 100, ry: 65 },
    { ox: 210,  oy: -340, rx: 105, ry: 68 },
    { ox: 0,    oy: -450, rx: 180, ry: 100 },
    { ox: -130, oy: -590, rx: 120, ry: 70 },
    { ox: 140,  oy: -585, rx: 125, ry: 72 },
  ];

  leafClusters.forEach((lc, i) => {
    const sway = Math.sin(t * 0.4 + i * 0.6) * wind * 40;
    const swayY = Math.sin(t * 0.35 + i * 0.5) * 5;
    const px = cx + lc.ox + sway;
    const py = groundY + lc.oy + swayY;

    // Dark back layer
    const g1 = ctx.createRadialGradient(px, py + 10, 0, px, py, lc.rx);
    g1.addColorStop(0, C.leafMid);
    g1.addColorStop(0.6, C.leafDark);
    g1.addColorStop(1, 'rgba(10,30,10,0)');
    ctx.beginPath();
    ctx.ellipse(px, py + 5, lc.rx, lc.ry, 0, 0, PI2);
    ctx.fillStyle = g1;
    ctx.fill();

    // Mid layer
    const g2 = ctx.createRadialGradient(px - 10, py - 10, 0, px, py, lc.rx * 0.85);
    g2.addColorStop(0, C.leafHighlight + 'CC');
    g2.addColorStop(0.4, C.leafMid + 'AA');
    g2.addColorStop(1, 'rgba(20,60,20,0)');
    ctx.beginPath();
    ctx.ellipse(px - 5, py - 5, lc.rx * 0.85, lc.ry * 0.85, 0.1, 0, PI2);
    ctx.fillStyle = g2;
    ctx.fill();

    // Top highlight
    ctx.beginPath();
    ctx.ellipse(px - lc.rx * 0.2, py - lc.ry * 0.3, lc.rx * 0.4, lc.ry * 0.3, -0.2, 0, PI2);
    ctx.fillStyle = 'rgba(46,139,46,0.25)';
    ctx.fill();
  });

  // === Ground roots spread ===
  ctx.save();
  ctx.strokeStyle = C.trunkDark;
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  [-1.2, -0.7, 0, 0.7, 1.2].forEach((angle, i) => {
    ctx.globalAlpha = 0.5 - Math.abs(angle) * 0.1;
    ctx.lineWidth = 6 - i * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx + angle * 10, groundY);
    ctx.bezierCurveTo(
      cx + angle * 40, groundY + 8,
      cx + angle * 80, groundY + 5,
      cx + angle * 130, groundY + 2
    );
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

// ─── Draw: Guru (teacher) ─────────────────────
function drawGuru(ctx: CanvasRenderingContext2D, x: number, groundY: number, t: number) {
  ctx.save();
  ctx.translate(x, groundY - 2);

  // Breathing animation
  const breathe = Math.sin(t * 0.8) * 1.5;

  // Mat / आसन
  ctx.fillStyle = 'rgba(180,140,80,0.7)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 28, 8, 0, 0, PI2);
  ctx.fill();

  // Body (saffron dhoti/robe)
  ctx.fillStyle = C.saffron;
  ctx.beginPath();
  ctx.ellipse(0, -20 - breathe * 0.3, 18, 22 + breathe * 0.3, 0, 0, PI2);
  ctx.fill();

  // Cross-legged legs
  ctx.fillStyle = '#8B5E3C';
  ctx.beginPath();
  ctx.ellipse(-12, -6, 14, 7, 0.3, 0, PI2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(12, -6, 14, 7, -0.3, 0, PI2);
  ctx.fill();

  // Shawl
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.moveTo(-16, -25);
  ctx.bezierCurveTo(-20, -20 + breathe, -18, -10, -10, -5);
  ctx.bezierCurveTo(-5, -3, 5, -3, 10, -5);
  ctx.bezierCurveTo(18, -10, 20, -20 + breathe, 16, -25);
  ctx.bezierCurveTo(10, -28, -10, -28, -16, -25);
  ctx.closePath();
  ctx.fill();

  // Head
  ctx.fillStyle = C.skinDark;
  ctx.beginPath();
  ctx.ellipse(0, -44 - breathe * 0.5, 11, 12, 0, 0, PI2);
  ctx.fill();

  // White beard
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.moveTo(-8, -38);
  ctx.bezierCurveTo(-10, -30, -8, -22, -5, -18 + breathe);
  ctx.bezierCurveTo(-2, -15, 2, -15, 5, -18 + breathe);
  ctx.bezierCurveTo(8, -22, 10, -30, 8, -38);
  ctx.closePath();
  ctx.fill();

  // White hair / topknot
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.ellipse(0, -54 - breathe * 0.3, 8, 10, 0, 0, PI2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -62 - breathe * 0.2, 5, 0, PI2);
  ctx.fill();

  // Eyes (closed, meditating)
  ctx.strokeStyle = C.trunkDark;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(-4, -44, 2.5, 0.1 * Math.PI, 0.9 * Math.PI, false);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(4, -44, 2.5, 0.1 * Math.PI, 0.9 * Math.PI, false);
  ctx.stroke();

  // Right arm raised (teaching gesture - abhaya mudra)
  const armSway = Math.sin(t * 0.6) * 2;
  ctx.fillStyle = C.skinDark;
  // Right arm up
  ctx.beginPath();
  ctx.moveTo(14, -30 + breathe);
  ctx.bezierCurveTo(20, -35 + armSway, 24, -44 + armSway, 22, -52 + armSway);
  ctx.bezierCurveTo(20, -50 + armSway, 16, -48 + armSway, 14, -42 + armSway);
  ctx.bezierCurveTo(12, -36, 12, -32, 14, -30 + breathe);
  ctx.fill();
  // Right hand
  ctx.beginPath();
  ctx.ellipse(22, -54 + armSway, 5, 6, 0.3, 0, PI2);
  ctx.fill();
  // Left arm resting
  ctx.beginPath();
  ctx.moveTo(-14, -28 + breathe);
  ctx.bezierCurveTo(-20, -24, -22, -16, -18, -10);
  ctx.bezierCurveTo(-16, -8, -12, -8, -10, -10);
  ctx.bezierCurveTo(-10, -16, -12, -24, -14, -28 + breathe);
  ctx.fill();

  // Tilak on forehead
  ctx.fillStyle = '#FF4500';
  ctx.beginPath();
  ctx.ellipse(0, -48, 2, 4, 0, 0, PI2);
  ctx.fill();

  ctx.restore();
}

// ─── Draw: Student ────────────────────────────
function drawStudent(
  ctx: CanvasRenderingContext2D,
  x: number, groundY: number,
  t: number,
  color: string,
  headColor: string,
  facing: 'left' | 'right',
  activity: 'reading' | 'writing' | 'listening',
  scale: number = 1
) {
  ctx.save();
  ctx.translate(x, groundY);
  ctx.scale(scale * (facing === 'left' ? -1 : 1), scale);

  const breathe = Math.sin(t * 0.7 + x * 0.01) * 1.2;
  const headNod = activity === 'listening' ? Math.sin(t * 0.5 + x) * 3 : 0;

  // Mat
  ctx.fillStyle = 'rgba(180,140,80,0.5)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 20, 6, 0, 0, PI2);
  ctx.fill();

  // Cross-legged base
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.ellipse(-9, -5, 11, 6, 0.3, 0, PI2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(9, -5, 11, 6, -0.3, 0, PI2);
  ctx.fill();

  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -18 - breathe * 0.2, 14, 18 + breathe * 0.2, 0, 0, PI2);
  ctx.fill();

  // Head
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.ellipse(0, -36 - breathe * 0.3, 9, 10, 0, 0, PI2);
  ctx.fill();

  // Hair
  ctx.fillStyle = C.trunkDark;
  ctx.beginPath();
  ctx.ellipse(0, -42, 9, 5, 0, 0, PI2);
  ctx.fill();

  // Activity-specific arm/prop
  if (activity === 'reading') {
    // Hold a palm-leaf manuscript
    ctx.fillStyle = C.skinDark;
    ctx.beginPath();
    ctx.moveTo(8, -22 + breathe);
    ctx.bezierCurveTo(14, -20, 18, -15, 16, -8);
    ctx.bezierCurveTo(14, -6, 10, -6, 8, -8);
    ctx.bezierCurveTo(6, -14, 6, -18, 8, -22 + breathe);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-8, -22 + breathe);
    ctx.bezierCurveTo(-14, -20, -16, -14, -14, -8);
    ctx.bezierCurveTo(-12, -6, -8, -6, -6, -8);
    ctx.bezierCurveTo(-5, -14, -6, -18, -8, -22 + breathe);
    ctx.fill();
    // Book/manuscript
    ctx.fillStyle = '#D4A855';
    ctx.beginPath();
    ctx.roundRect(-14, -14, 28, 10, 2);
    ctx.fill();
    ctx.strokeStyle = C.trunkDark;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(0, -4);
    ctx.stroke();
    // Text lines on manuscript
    ctx.strokeStyle = C.trunkDark;
    ctx.lineWidth = 0.8;
    ctx.globalAlpha = 0.4;
    [-10, -6, -2].forEach(ly => {
      ctx.beginPath();
      ctx.moveTo(-11, ly);
      ctx.lineTo(-2, ly);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(2, ly);
      ctx.lineTo(11, ly);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  } else if (activity === 'writing') {
    // Writing on ground with stylus
    const writeSway = Math.sin(t * 2 + x) * 5;
    ctx.fillStyle = C.skinDark;
    ctx.beginPath();
    ctx.moveTo(10, -20 + breathe);
    ctx.bezierCurveTo(16, -15 + writeSway * 0.3, 20, -5 + writeSway, 16, 2);
    ctx.bezierCurveTo(13, 4, 9, 2, 9, -2);
    ctx.bezierCurveTo(9, -10, 8, -16, 10, -20 + breathe);
    ctx.fill();
    // Stylus
    ctx.strokeStyle = C.trunkMid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(15, -5 + writeSway);
    ctx.lineTo(20, 8 + writeSway * 0.5);
    ctx.stroke();
    // Left arm resting
    ctx.fillStyle = C.skinDark;
    ctx.beginPath();
    ctx.moveTo(-8, -20 + breathe);
    ctx.bezierCurveTo(-14, -15, -16, -5, -14, 0);
    ctx.bezierCurveTo(-12, 2, -8, 2, -7, -2);
    ctx.bezierCurveTo(-6, -10, -6, -16, -8, -20 + breathe);
    ctx.fill();
  } else {
    // Listening — hands in lap
    ctx.fillStyle = C.skinDark;
    ctx.beginPath();
    ctx.ellipse(-6, -12, 7, 5, 0.4, 0, PI2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(6, -12, 7, 5, -0.4, 0, PI2);
    ctx.fill();
  }

  // Head nod for listeners
  if (headNod !== 0) {
    ctx.save();
    ctx.translate(0, -36);
    ctx.rotate(headNod * 0.04);
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.ellipse(0, 0, 9, 10, 0, 0, PI2);
    ctx.fill();
    ctx.fillStyle = C.trunkDark;
    ctx.beginPath();
    ctx.ellipse(0, -6, 9, 5, 0, 0, PI2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();
}

// ─── Draw: Sky + Ground ───────────────────────
function drawEnvironment(ctx: CanvasRenderingContext2D, w: number, h: number, groundY: number) {
  // Sky gradient - evening/dusk ambiance
  const sky = ctx.createLinearGradient(0, 0, 0, groundY);
  sky.addColorStop(0,    C.skyTop);
  sky.addColorStop(0.35, C.skyMid);
  sky.addColorStop(0.7,  C.skyHorizon);
  sky.addColorStop(0.88, C.sunsetOrange);
  sky.addColorStop(1,    C.horizonGlow);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, groundY);

  // Moon
  const moonX = w * 0.82;
  const moonY = h * 0.1;
  const moonGlow = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 90);
  moonGlow.addColorStop(0, 'rgba(255,255,230,0.3)');
  moonGlow.addColorStop(0.5, 'rgba(200,200,180,0.1)');
  moonGlow.addColorStop(1, 'rgba(200,200,180,0)');
  ctx.fillStyle = moonGlow;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 90, 0, PI2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,220,0.95)';
  ctx.beginPath();
  ctx.arc(moonX, moonY, 22, 0, PI2);
  ctx.fill();
  // Moon crescent shadow
  ctx.fillStyle = C.skyMid;
  ctx.beginPath();
  ctx.arc(moonX + 8, moonY - 2, 18, 0, PI2);
  ctx.fill();

  // Stars
  ctx.fillStyle = 'rgba(255,255,240,0.9)';
  const starPositions = [
    [0.1, 0.05], [0.2, 0.12], [0.35, 0.04], [0.5, 0.08],
    [0.65, 0.03], [0.75, 0.14], [0.9, 0.06], [0.15, 0.2],
    [0.45, 0.18], [0.6, 0.22], [0.25, 0.26], [0.8, 0.1],
    [0.55, 0.28], [0.05, 0.3], [0.88, 0.25], [0.4, 0.32],
  ];
  starPositions.forEach(([sx, sy]) => {
    ctx.beginPath();
    ctx.arc(sx * w, sy * groundY, 1.2, 0, PI2);
    ctx.fill();
  });

  // Ground layers
  const ground = ctx.createLinearGradient(0, groundY, 0, h);
  ground.addColorStop(0,   C.groundMid);
  ground.addColorStop(0.3, C.groundDark);
  ground.addColorStop(1,   '#0D0800');
  ctx.fillStyle = ground;
  ctx.fillRect(0, groundY, w, h - groundY);

  // Grass strip
  ctx.fillStyle = C.grassDark;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let gx = 0; gx <= w; gx += 5) {
    ctx.lineTo(gx, groundY + Math.sin(gx * 0.04) * 3);
  }
  ctx.lineTo(w, groundY + 14);
  ctx.lineTo(0, groundY + 14);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = C.grassMid;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 2);
  for (let gx = 0; gx <= w; gx += 4) {
    ctx.lineTo(gx, groundY + 5 + Math.sin(gx * 0.05 + 1) * 2);
  }
  ctx.lineTo(w, groundY + 12);
  ctx.lineTo(0, groundY + 12);
  ctx.closePath();
  ctx.fill();
}

// ─── Draw: Diya (oil lamp) ────────────────────
function drawDiya(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save();
  ctx.translate(x, y);

  const flicker = Math.sin(t * 6 + x) * 0.15 + 0.85;

  // Lamp base
  ctx.fillStyle = '#C8860A';
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.bezierCurveTo(-9, 5, 9, 5, 8, 0);
  ctx.bezierCurveTo(6, -4, -6, -4, -8, 0);
  ctx.fill();
  ctx.fillStyle = '#E8A020';
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 4, 0, 0, PI2);
  ctx.fill();

  // Flame glow
  const glowR = ctx.createRadialGradient(0, -8 * flicker, 0, 0, -8, 20);
  glowR.addColorStop(0, `rgba(255,200,50,${0.5 * flicker})`);
  glowR.addColorStop(0.5, `rgba(255,120,20,${0.25 * flicker})`);
  glowR.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.fillStyle = glowR;
  ctx.beginPath();
  ctx.arc(0, -8, 20, 0, PI2);
  ctx.fill();

  // Flame
  ctx.fillStyle = `rgba(255,220,80,${flicker})`;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.bezierCurveTo(-3, -8, -2, -14 * flicker, 0, -16 * flicker);
  ctx.bezierCurveTo(2, -14 * flicker, 3, -8, 0, -2);
  ctx.fill();
  ctx.fillStyle = `rgba(255,140,30,${flicker * 0.8})`;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.bezierCurveTo(-1.5, -7, -1, -12 * flicker, 0, -14 * flicker);
  ctx.bezierCurveTo(1, -12 * flicker, 1.5, -7, 0, -2);
  ctx.fill();

  ctx.restore();
}

// ─── Main Component ───────────────────────────
interface Props {
  mousePos?: { x: number; y: number };
}

export const GurkulSocialBackground: React.FC<Props> = ({ mousePos }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const leavesRef = useRef<Leaf[]>([]);
  const firefliesRef = useRef<Firefly[]>([]);
  const lastTsRef = useRef(0);

  const LEAF_COLORS = [C.leafFall1, C.leafFall2, C.leafFall3, C.leafFall4, C.leafMid, C.leafLight];

  const spawnLeaf = useCallback((w: number, h: number): Leaf => ({
    x: rand(w * 0.1, w * 0.9),
    y: rand(-80, -10),
    vx: rand(-0.8, 0.8),
    vy: rand(0.6, 1.4),
    rotation: rand(0, PI2),
    rotSpeed: rand(-0.04, 0.04),
    scale: rand(0.6, 1.4),
    opacity: rand(0.6, 0.9),
    color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
    wobble: rand(0, PI2),
    wobbleSpeed: rand(0.02, 0.06),
  }), []);

  const initParticles = useCallback((w: number, h: number) => {
    leavesRef.current = Array.from({ length: 30 }, () => {
      const l = spawnLeaf(w, h);
      l.y = rand(0, h); // distribute vertically on init
      return l;
    });
    firefliesRef.current = Array.from({ length: 18 }, (_, i) => ({
      x: rand(w * 0.05, w * 0.95),
      y: rand(h * 0.5, h * 0.85),
      vx: rand(-0.3, 0.3),
      vy: rand(-0.2, 0.2),
      radius: rand(1.5, 3),
      opacity: Math.random(),
      opacityDir: rand(0.008, 0.02),
      phase: i * 0.4,
    }));
  }, [spawnLeaf]);

  const drawLeaf = useCallback((ctx: CanvasRenderingContext2D, leaf: Leaf) => {
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rotation);
    ctx.globalAlpha = leaf.opacity;
    ctx.fillStyle = leaf.color;
    ctx.beginPath();
    ctx.scale(leaf.scale, leaf.scale);
    ctx.moveTo(0, -5);
    ctx.bezierCurveTo(4, -3, 5, 2, 3, 5);
    ctx.bezierCurveTo(1, 7, -1, 7, -3, 5);
    ctx.bezierCurveTo(-5, 2, -4, -3, 0, -5);
    ctx.fill();
    // Vein
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(0, 5);
    ctx.stroke();
    ctx.restore();
  }, []);

  const drawScene = useCallback((
    ctx: CanvasRenderingContext2D,
    w: number, h: number,
    t: number,
    mx: number, my: number
  ) => {
    const groundY = h * 0.65;

    // Parallax offset from mouse
    const px = (mx - 0.5) * 18;
    const py = (my - 0.5) * 8;

    ctx.save();
    ctx.translate(px * 0.3, py * 0.3);

    // ── Environment ──
    drawEnvironment(ctx, w, h, groundY);

    ctx.restore();

    // ── Tree (main layer) ──
    ctx.save();
    ctx.translate(px * 0.15, py * 0.1);
    drawBanyanTree(ctx, w * 0.5, groundY, t, (mx - 0.5));
    ctx.restore();

    // ── Guru & Students ──
    ctx.save();
    ctx.translate(px * 0.05, py * 0.05);

    const studentY = groundY + 2;
    const guruX = w * 0.5;

    // Diya lamps
    drawDiya(ctx, guruX - 60, studentY - 8, t);
    drawDiya(ctx, guruX + 60, studentY - 8, t);
    drawDiya(ctx, guruX - 130, studentY - 4, t);

    // Students in a semicircle around the guru
    const students = [
      { x: guruX - 220, scale: 0.72, color: '#4A6FA5', head: C.skinDark, facing: 'right' as const, act: 'reading' as const },
      { x: guruX - 160, scale: 0.78, color: '#7A3B1E', head: C.skinLight, facing: 'right' as const, act: 'writing' as const },
      { x: guruX - 95,  scale: 0.82, color: '#2E6B3A', head: C.skinDark, facing: 'right' as const, act: 'listening' as const },
      { x: guruX + 95,  scale: 0.82, color: '#9B4F1A', head: C.skinLight, facing: 'left' as const,  act: 'listening' as const },
      { x: guruX + 160, scale: 0.78, color: '#3A5A78', head: C.skinDark, facing: 'left' as const,  act: 'reading' as const },
      { x: guruX + 220, scale: 0.72, color: '#6B3A7A', head: C.skinLight, facing: 'left' as const,  act: 'writing' as const },
    ];

    students.forEach(s => {
      drawStudent(ctx, s.x, studentY, t, s.color, s.head, s.facing, s.act, s.scale);
    });

    // Guru (center)
    drawGuru(ctx, guruX, studentY, t);

    ctx.restore();

    // ── Falling leaves ──
    ctx.save();
    ctx.translate(px * 0.08, 0);
    leavesRef.current.forEach(leaf => {
      leaf.wobble += leaf.wobbleSpeed;
      leaf.x += leaf.vx + Math.sin(leaf.wobble) * 0.6;
      leaf.y += leaf.vy;
      leaf.rotation += leaf.rotSpeed;
      if (leaf.y > h + 20) {
        Object.assign(leaf, spawnLeaf(w, h));
      }
      drawLeaf(ctx, leaf);
    });
    ctx.restore();

    // ── Fireflies ──
    ctx.save();
    ctx.translate(px * 0.02, py * 0.02);
    firefliesRef.current.forEach(ff => {
      ff.x += ff.vx + Math.sin(t * 0.3 + ff.phase) * 0.4;
      ff.y += ff.vy + Math.cos(t * 0.25 + ff.phase) * 0.3;
      ff.opacity += ff.opacityDir;
      if (ff.opacity > 1 || ff.opacity < 0) ff.opacityDir *= -1;
      ff.opacity = Math.max(0, Math.min(1, ff.opacity));

      if (ff.x < 0) ff.x = w;
      if (ff.x > w) ff.x = 0;
      if (ff.y < h * 0.5) ff.vy = Math.abs(ff.vy);
      if (ff.y > h * 0.9) ff.vy = -Math.abs(ff.vy);

      const glow = ctx.createRadialGradient(ff.x, ff.y, 0, ff.x, ff.y, ff.radius * 8);
      glow.addColorStop(0, `rgba(200,255,120,${ff.opacity * 0.8})`);
      glow.addColorStop(0.4, `rgba(180,255,100,${ff.opacity * 0.3})`);
      glow.addColorStop(1, 'rgba(150,255,80,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(ff.x, ff.y, ff.radius * 8, 0, PI2);
      ctx.fill();
      ctx.fillStyle = `rgba(220,255,150,${ff.opacity})`;
      ctx.beginPath();
      ctx.arc(ff.x, ff.y, ff.radius, 0, PI2);
      ctx.fill();
    });
    ctx.restore();

    // ── Ground mist / atmosphere ──
    const mist = ctx.createLinearGradient(0, groundY + 10, 0, groundY + 60);
    mist.addColorStop(0, 'rgba(120,80,40,0.12)');
    mist.addColorStop(1, 'rgba(60,30,10,0)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, groundY + 10, w, 50);

    // ── Vignette ──
    const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.25, w / 2, h / 2, h * 0.85);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);

  }, [drawLeaf, spawnLeaf]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * Math.min(window.devicePixelRatio, 2);
      canvas.height = canvas.offsetHeight * Math.min(window.devicePixelRatio, 2);
      ctx.scale(Math.min(window.devicePixelRatio, 2), Math.min(window.devicePixelRatio, 2));
      initParticles(canvas.offsetWidth, canvas.offsetHeight);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const animate = (ts: number) => {
      const delta = Math.min(ts - lastTsRef.current, 50) / 16.67;
      lastTsRef.current = ts;
      timeRef.current += 0.016 * delta;

      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const mx = (mousePos?.x ?? 0.5);
      const my = (mousePos?.y ?? 0.5);

      ctx.clearRect(0, 0, w, h);
      drawScene(ctx, w, h, timeRef.current, mx, my);

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [initParticles, drawScene, mousePos]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
};

export default GurkulSocialBackground;