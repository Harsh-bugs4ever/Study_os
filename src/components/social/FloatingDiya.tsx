/**
 * FloatingDiya.tsx
 * Interactive floating diya (oil lamp) — a small 3D ornament inside the UI.
 * Hover → soft rotation glow. Click → pulse bloom.
 */
import { useRef, useState, useEffect } from 'react';

export const FloatingDiya: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);
  const lastTsRef = useRef(0);
  const [hovered, setHovered] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const pulseRef = useRef(0);
  const rotRef = useRef(0);

  const handleClick = () => {
    setPulsing(true);
    pulseRef.current = 1;
    setTimeout(() => setPulsing(false), 600);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;

    const animate = (ts: number) => {
      const dt = Math.min(ts - lastTsRef.current, 50) / 16.67;
      lastTsRef.current = ts;
      tRef.current += 0.016 * dt;
      const t = tRef.current;

      // Rotate when hovered
      if (hovered) rotRef.current += 0.025 * dt;
      if (pulseRef.current > 0) pulseRef.current = Math.max(0, pulseRef.current - 0.04 * dt);

      ctx.clearRect(0, 0, W, H);
      ctx.save();
      ctx.translate(W / 2, H / 2);
      ctx.rotate(rotRef.current);

      const scale = 1 + Math.sin(t * 1.2) * 0.04 + pulseRef.current * 0.25;
      ctx.scale(scale, scale);

      const flicker = 0.85 + Math.sin(t * 7) * 0.12;
      const gAlpha = (hovered ? 0.6 : 0.35) + pulseRef.current * 0.4;

      // Outer glow (bloom)
      const bigGlow = ctx.createRadialGradient(0, -18, 0, 0, -10, 55 + pulseRef.current * 30);
      bigGlow.addColorStop(0, `rgba(255,180,40,${gAlpha})`);
      bigGlow.addColorStop(0.4, `rgba(255,100,20,${gAlpha * 0.4})`);
      bigGlow.addColorStop(1, 'rgba(255,60,0,0)');
      ctx.fillStyle = bigGlow;
      ctx.beginPath();
      ctx.arc(0, -10, 55 + pulseRef.current * 30, 0, Math.PI * 2);
      ctx.fill();

      // Diya body
      const bodyGrad = ctx.createLinearGradient(-20, 5, 20, 15);
      bodyGrad.addColorStop(0, '#B8720A');
      bodyGrad.addColorStop(0.5, '#E8A020');
      bodyGrad.addColorStop(1, '#A06010');
      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.moveTo(-20, 5);
      ctx.bezierCurveTo(-22, 14, 22, 14, 20, 5);
      ctx.bezierCurveTo(16, -6, -16, -6, -20, 5);
      ctx.closePath();
      ctx.fill();

      // Bowl highlight
      ctx.fillStyle = 'rgba(255,220,100,0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 4, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wick
      ctx.fillStyle = '#5A3010';
      ctx.beginPath();
      ctx.ellipse(6, 2, 3, 2, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Flame
      const fH = (18 + Math.sin(t * 9) * 3) * flicker;
      const flameGrad = ctx.createLinearGradient(0, -5, 0, -5 - fH);
      flameGrad.addColorStop(0, `rgba(255,80,10,${0.9 * flicker})`);
      flameGrad.addColorStop(0.4, `rgba(255,160,30,${0.95 * flicker})`);
      flameGrad.addColorStop(0.7, `rgba(255,220,80,${0.9 * flicker})`);
      flameGrad.addColorStop(1, `rgba(255,255,200,${0.5 * flicker})`);
      ctx.fillStyle = flameGrad;
      ctx.beginPath();
      ctx.moveTo(6, -2);
      ctx.bezierCurveTo(6 - 5, -fH * 0.4, 6 - 4, -fH * 0.8, 6, -5 - fH);
      ctx.bezierCurveTo(6 + 4, -fH * 0.8, 6 + 5, -fH * 0.4, 6, -2);
      ctx.fill();
      // Inner flame
      ctx.fillStyle = `rgba(255,255,200,${0.7 * flicker})`;
      ctx.beginPath();
      ctx.moveTo(6, -4);
      ctx.bezierCurveTo(6 - 2, -fH * 0.5, 6 - 2, -fH * 0.85, 6, -5 - fH * 0.9);
      ctx.bezierCurveTo(6 + 2, -fH * 0.85, 6 + 2, -fH * 0.5, 6, -4);
      ctx.fill();

      // Om symbol lightly on diya
      ctx.fillStyle = 'rgba(255,200,80,0.3)';
      ctx.font = 'bold 11px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('ॐ', -4, 6);

      ctx.restore();
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [hovered]);

  return (
    <div
      style={{ cursor: 'pointer', display: 'inline-block' }}
      title="Jyoti — click for blessings ✨"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        width={120}
        height={120}
        style={{
          display: 'block',
          filter: pulsing ? 'drop-shadow(0 0 16px rgba(255,160,40,0.8))' : 'drop-shadow(0 0 6px rgba(255,140,20,0.4))',
          transition: 'filter 0.3s ease',
        }}
      />
    </div>
  );
};

export default FloatingDiya;