/**
 * Social.tsx — Redesigned
 *
 * Changes from original:
 * - Removed GurkulSocialBackground, mousePos/handleMouseMove, black overlay divs
 * - Replaced hardcoded dark-sepia glass constants with theme CSS variables
 * - Added WellnessBackground (particle + orb + sacred geometry rings)
 * - Added gk-fog-layer
 * - Replaced TiltCard → GlassCard pattern (3D tilt + glow on hover)
 * - Removed FloatingDiya usages
 * - Active user dot uses hsl(var(--success))
 * - Join Circle button uses hsl(var(--accent)) tokens
 * - StatChip uses hsl(var(--surface) / 0.72)
 *
 * NO changes to: features, logic, room data, Supabase calls, routing.
 */

import React, {
  useState, useEffect, useRef, useCallback, useMemo, type ReactNode, type CSSProperties,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Trophy, Clock, BookOpen, MessageCircle, Star, Zap, Target,
  Search, ChevronRight, Crown, Medal, Plus, Lock, Unlock, ArrowLeft,
  Mic, MicOff, Video, VideoOff, MoreVertical, Send, Loader2 } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';

// ─── WellnessBackground ────────────────────────────────────────────────────────
// Ported from MentalHealth: particles + orbs + sacred geometry rings

interface WBParticle {
  x: number; y: number; vx: number; vy: number;
  r: number; alpha: number; aDir: number; pulse: number; pulseSpeed: number;
  hue: number;
}

interface WBOrb {
  x: number; y: number; vx: number; vy: number;
  radius: number; hue: number; alpha: number;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function WellnessBackground({ focusMode }: { focusMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<WBParticle[]>([]);
  const orbsRef = useRef<WBOrb[]>([]);
  const frameRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  const initScene = useCallback((w: number, h: number) => {
    const count = focusMode ? 40 : 70;
    particlesRef.current = Array.from({ length: count }, () => ({
      x: rand(0, w), y: rand(0, h),
      vx: rand(-0.12, 0.12), vy: rand(-0.25, -0.04),
      r: rand(1, 2.8),
      alpha: rand(0.08, 0.4), aDir: Math.random() > 0.5 ? 1 : -1,
      pulse: rand(0, Math.PI * 2), pulseSpeed: rand(0.008, 0.025),
      hue: rand(185, 230),
    }));
    orbsRef.current = Array.from({ length: focusMode ? 2 : 4 }, (_, i) => ({
      x: rand(0.1, 0.9) * w, y: rand(0.1, 0.9) * h,
      vx: rand(-0.08, 0.08), vy: rand(-0.06, 0.06),
      radius: rand(80, 200 + i * 40),
      hue: rand(185, 260),
      alpha: rand(0.018, 0.045),
    }));
  }, [focusMode]);

  const drawRings = useCallback((
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    t: number,
    ringCount: number,
  ) => {
    ctx.save();
    ctx.translate(cx, cy);

    // Outer glow rings
    for (let i = 0; i < ringCount; i++) {
      const r = 80 + i * 52;
      const alpha = (0.025 - i * 0.004) * (focusMode ? 1.4 : 1);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = `hsla(210,60%,70%,${alpha})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Rotating petals — 2 layers
    for (let layer = 0; layer < 2; layer++) {
      const dir = layer % 2 === 0 ? 1 : -1;
      ctx.save();
      ctx.rotate(t * 0.00015 * dir + (layer * Math.PI) / 3);
      const petalCount = 6 + layer * 2;
      for (let p = 0; p < petalCount; p++) {
        ctx.save();
        ctx.rotate((p * Math.PI * 2) / petalCount);
        ctx.beginPath();
        const br = 55 + layer * 35;
        ctx.ellipse(0, -br, 5 + layer * 3, 16 + layer * 7, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `hsla(210,55%,65%,${0.035 + layer * 0.012})`;
        ctx.lineWidth = 0.7;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
    }

    // Centre pulse
    const pulse = Math.sin(t * 0.0018) * 0.3 + 0.7;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
    grad.addColorStop(0, `hsla(210,70%,75%,${0.12 * pulse})`);
    grad.addColorStop(1, 'hsla(210,70%,75%,0)');
    ctx.beginPath();
    ctx.arc(0, 0, 22, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
  }, [focusMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0, h = 0;
    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
      initScene(w, h);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / w, y: e.clientY / h };
    };
    window.addEventListener('mousemove', onMouse);

    const animate = (ts: number) => {
      frameRef.current = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, w, h);

      // Orbs
      orbsRef.current.forEach(orb => {
        orb.x += orb.vx;
        orb.y += orb.vy;
        if (orb.x < -orb.radius) orb.x = w + orb.radius;
        if (orb.x > w + orb.radius) orb.x = -orb.radius;
        if (orb.y < -orb.radius) orb.y = h + orb.radius;
        if (orb.y > h + orb.radius) orb.y = -orb.radius;

        const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
        g.addColorStop(0, `hsla(${orb.hue},55%,65%,${orb.alpha})`);
        g.addColorStop(1, 'hsla(0,0%,0%,0)');
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      // Sacred geometry rings
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      drawRings(ctx, w * 0.5 + (mx - 0.5) * 18, h * 0.38 + (my - 0.5) * 12, ts, focusMode ? 4 : 5);
      if (!focusMode) {
        drawRings(ctx, w * 0.12 + (mx - 0.5) * 7, h * 0.72 + (my - 0.5) * 5, ts * 0.65, 3);
        drawRings(ctx, w * 0.88 + (mx - 0.5) * 7, h * 0.18 + (my - 0.5) * 5, ts * 0.45, 3);
      }

      // Particles
      particlesRef.current.forEach(p => {
        p.x += p.vx + (mx - 0.5) * 0.08;
        p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = rand(0, w); }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        p.pulse += p.pulseSpeed;
        const a = p.alpha * (0.6 + Math.sin(p.pulse) * 0.4);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue},60%,70%,${a})`;
        ctx.fill();
      });
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [initScene, drawRings, focusMode]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

// ─── GlassCard ────────────────────────────────────────────────────────────────
// 3D tilt + directional glow — uses theme CSS variables

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  intensity?: number;
  glowColor?: string;
  delay?: number;
}

function GlassCard({
  children,
  className = '',
  style = {},
  intensity = 8,
  glowColor = 'rgba(212,175,55,0.18)',
  delay = 0,
}: GlassCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const [borderGlow, setBorderGlow] = useState({ x: 50, y: 50, visible: false });
  const rafRef = useRef<number>(0);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      setTilt({ x: -dy * intensity, y: dx * intensity });
      const gx = ((e.clientX - rect.left) / rect.width) * 100;
      const gy = ((e.clientY - rect.top) / rect.height) * 100;
      setGlare({ x: gx, y: gy, opacity: 0.1 });
      setBorderGlow({ x: gx, y: gy, visible: true });
    });
  }, [intensity]);

  const handleMouseLeave = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    setTilt({ x: 0, y: 0 });
    setGlare(g => ({ ...g, opacity: 0 }));
    setBorderGlow(b => ({ ...b, visible: false }));
  }, []);

  return (
    <div
      ref={cardRef}
      className={className}
      style={{
        ...style,
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(0)`,
        transition: 'transform 0.2s ease-out',
        transformStyle: 'preserve-3d',
        position: 'relative',
        willChange: 'transform',
        background: 'hsl(var(--surface) / 0.72)',
        backdropFilter: 'blur(18px) saturate(150%)',
        WebkitBackdropFilter: 'blur(18px) saturate(150%)',
        border: '1px solid hsl(var(--border-strong) / 0.55)',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.06)',
        animationDelay: `${delay}ms`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Shimmer top-edge line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.28), transparent)',
        borderRadius: '16px 16px 0 0',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Directional border glow */}
      {borderGlow.visible && (
        <div style={{
          position: 'absolute', inset: -1,
          borderRadius: '17px',
          background: `radial-gradient(circle at ${borderGlow.x}% ${borderGlow.y}%, ${glowColor} 0%, transparent 60%)`,
          pointerEvents: 'none',
          zIndex: 0,
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'exclude',
          padding: '1px',
        }} />
      )}

      {/* Corner glows */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: 60, height: 60,
        background: `radial-gradient(circle at 0% 0%, ${glowColor} 0%, transparent 70%)`,
        borderRadius: '16px 0 0 0',
        pointerEvents: 'none', zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, right: 0, width: 60, height: 60,
        background: `radial-gradient(circle at 100% 100%, ${glowColor} 0%, transparent 70%)`,
        borderRadius: '0 0 16px 0',
        pointerEvents: 'none', zIndex: 1,
      }} />

      {/* Cursor glare */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit',
        pointerEvents: 'none', transition: 'opacity 0.25s ease',
        opacity: glare.opacity,
        background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,220,120,0.2) 0%, transparent 60%)`,
        zIndex: 2,
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 3 }}>
        {children}
      </div>
    </div>
  );
}

// ─── Theme token helpers ────────────────────────────────────────────────────────
const glass = {
  background: 'hsl(var(--surface) / 0.72)',
  backdropFilter: 'blur(18px) saturate(150%)',
  WebkitBackdropFilter: 'blur(18px) saturate(150%)',
  border: '1px solid hsl(var(--border-strong) / 0.55)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.06)',
} as CSSProperties;

const glassLight = {
  background: 'hsl(var(--surface) / 0.55)',
  backdropFilter: 'blur(14px)',
  WebkitBackdropFilter: 'blur(14px)',
  border: '1px solid hsl(var(--border) / 0.6)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
} as CSSProperties;

const goldText  = { color: 'hsl(var(--accent))' } as CSSProperties;
const mutedText = { color: 'hsl(var(--muted))' } as CSSProperties;
const bodyText  = { color: 'hsl(var(--text))' } as CSSProperties;

// ─── StatChip ────────────────────────────────────────────────────────────────
function StatChip({
  icon, label, value, color,
}: { icon: ReactNode; label: string; value: string | number; color?: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px',
      background: 'hsl(var(--surface) / 0.72)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid hsl(var(--border) / 0.5)',
      borderRadius: 20,
    }}>
      <span style={{ color: color || 'hsl(var(--accent))' }}>{icon}</span>
      <span style={{ ...mutedText, fontSize: 10 }}>{label}</span>
      <span style={{ ...goldText, fontSize: 11, fontWeight: 700 }}>{value}</span>
    </div>
  );
}

// ─── Study Room Data ──────────────────────────────────────────────────────────
const STUDY_ROOMS = [
  {
    id: 'jee-physics', name: 'JEE Physics Circle', subject: 'Physics',
    members: 12, maxMembers: 20, active: 8, streak: 14,
    tags: ['Mechanics', 'Electrostatics', 'Optics'], isLocked: false,
    description: 'Daily problem solving and concept discussions for JEE Physics.',
    leaderboard: [
      { name: 'Arjun S.', xp: 2840, streak: 18 },
      { name: 'Priya M.', xp: 2620, streak: 14 },
      { name: 'Rohit K.', xp: 2310, streak: 11 },
    ],
  },
  {
    id: 'neet-bio', name: 'NEET Biology Hub', subject: 'Biology',
    members: 18, maxMembers: 25, active: 11, streak: 21,
    tags: ['Botany', 'Zoology', 'Human Physiology'], isLocked: false,
    description: 'Comprehensive NEET Biology prep with daily MCQ battles.',
    leaderboard: [
      { name: 'Sneha R.', xp: 3120, streak: 25 },
      { name: 'Ankit V.', xp: 2890, streak: 21 },
      { name: 'Kavya P.', xp: 2540, streak: 16 },
    ],
  },
  {
    id: 'maths-olympiad', name: 'Maths Olympiad Prep', subject: 'Mathematics',
    members: 9, maxMembers: 15, active: 4, streak: 7,
    tags: ['Algebra', 'Number Theory', 'Combinatorics'], isLocked: true,
    description: 'Advanced mathematics for olympiad aspirants.',
    leaderboard: [
      { name: 'Vikram T.', xp: 1980, streak: 9 },
      { name: 'Aisha B.', xp: 1760, streak: 7 },
      { name: 'Dev S.', xp: 1540, streak: 5 },
    ],
  },
  {
    id: 'chemistry-warriors', name: 'Chemistry Warriors', subject: 'Chemistry',
    members: 14, maxMembers: 20, active: 6, streak: 10,
    tags: ['Organic', 'Inorganic', 'Physical Chem'], isLocked: false,
    description: 'Conquer Chemistry together — from basics to advanced.',
    leaderboard: [
      { name: 'Meera J.', xp: 2200, streak: 12 },
      { name: 'Raj N.', xp: 2050, streak: 10 },
      { name: 'Tara S.', xp: 1890, streak: 8 },
    ],
  },
];

// ─── Main Social Component ─────────────────────────────────────────────────────
const Social = () => {
  const { user } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeRoom, setActiveRoom] = useState<typeof STUDY_ROOMS[number] | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; ts: string }[]>([
    { sender: 'Arjun S.', text: 'Anyone solved the Mechanics problem set?', ts: '2m ago' },
    { sender: 'Priya M.', text: 'Yes! The circular motion one was tricky.', ts: '1m ago' },
  ]);
  const [leaderboard, setLeaderboard] = useState<{ name: string; xp: number; rank: number }[]>([]);
  const [loadingLb, setLoadingLb] = useState(true);
  const [micOn, setMicOn] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load leaderboard from Supabase
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, name, xp')
        .order('xp', { ascending: false })
        .limit(10);
      if (data) {
        setLeaderboard(data.map((p, i) => ({ name: p.name || 'Student', xp: p.xp || 0, rank: i + 1 })));
      }
      setLoadingLb(false);
    };
    load();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const filteredRooms = useMemo(() =>
    STUDY_ROOMS.filter(r =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ),
    [searchQuery],
  );

  const sendMessage = () => {
    if (!chatMessage.trim()) return;
    setChatMessages(prev => [...prev, {
      sender: user?.name || 'You',
      text: chatMessage.trim(),
      ts: 'Just now',
    }]);
    setChatMessage('');
  };

  // ─── Study Room View ────────────────────────────────────────────────────────
  if (activeRoom) {
    return (
      <div className="relative min-h-screen overflow-hidden">
        <WellnessBackground focusMode={true} />
        <div className="gk-fog-layer" />

        <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setActiveRoom(null)}
              style={{
                ...glassLight,
                border: '1px solid hsl(var(--border) / 0.5)',
                borderRadius: 10, padding: '7px 12px',
                display: 'flex', alignItems: 'center', gap: 6,
                cursor: 'pointer', ...bodyText, fontSize: 13,
              }}
            >
              <ArrowLeft size={14} /> Back
            </button>
            <div style={{ flex: 1 }}>
              <h2 style={{ ...goldText, fontFamily: 'serif', fontSize: 17, fontWeight: 700, margin: 0 }}>
                {activeRoom.name}
              </h2>
              <p style={{ ...mutedText, fontSize: 11, margin: 0 }}>
                {activeRoom.active} members active now
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setMicOn(!micOn)}
                style={{
                  ...glassLight,
                  border: `1px solid ${micOn ? 'hsl(var(--accent) / 0.5)' : 'hsl(var(--border) / 0.4)'}`,
                  borderRadius: 10, padding: '7px 10px', cursor: 'pointer',
                  color: micOn ? 'hsl(var(--accent))' : 'hsl(var(--muted))',
                }}
              >
                {micOn ? <Mic size={14} /> : <MicOff size={14} />}
              </button>
              <button
                onClick={() => setVideoOn(!videoOn)}
                style={{
                  ...glassLight,
                  border: `1px solid ${videoOn ? 'hsl(var(--accent) / 0.5)' : 'hsl(var(--border) / 0.4)'}`,
                  borderRadius: 10, padding: '7px 10px', cursor: 'pointer',
                  color: videoOn ? 'hsl(var(--accent))' : 'hsl(var(--muted))',
                }}
              >
                {videoOn ? <Video size={14} /> : <VideoOff size={14} />}
              </button>
            </div>
          </div>

          {/* Main room layout */}
          <div style={{ flex: 1, padding: '0 16px 16px', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
            {/* Left: Chat + Info */}
            <GlassCard style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }} glowColor="rgba(212,175,55,0.22)">
              <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid hsl(var(--border) / 0.3)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageCircle size={14} style={goldText} />
                  <span style={{ ...goldText, fontSize: 13, fontWeight: 700 }}>Circle Chat</span>
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0 }}
                  >
                    <div style={{ ...mutedText, fontSize: 10, marginBottom: 2 }}>
                      {msg.sender} · {msg.ts}
                    </div>
                    <div style={{
                      ...bodyText,
                      fontSize: 13,
                      background: 'hsl(var(--surface) / 0.5)',
                      border: '1px solid hsl(var(--border) / 0.35)',
                      borderRadius: 10,
                      padding: '8px 12px',
                      display: 'inline-block',
                      maxWidth: '80%',
                    }}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid hsl(var(--border) / 0.3)', display: 'flex', gap: 8 }}>
                <input
                  value={chatMessage}
                  onChange={e => setChatMessage(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message…"
                  style={{
                    flex: 1,
                    background: 'hsl(var(--surface) / 0.6)',
                    border: '1px solid hsl(var(--border) / 0.5)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    ...bodyText,
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={sendMessage}
                  style={{
                    background: 'hsl(var(--accent) / 0.18)',
                    border: '1px solid hsl(var(--accent) / 0.35)',
                    color: 'hsl(var(--accent))',
                    borderRadius: 10,
                    padding: '8px 14px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 13,
                  }}
                >
                  <Send size={13} />
                </button>
              </div>
            </GlassCard>

            {/* Right: Leaderboard + Members */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <GlassCard style={{ padding: '16px 18px' }} glowColor="rgba(100,200,180,0.14)">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Trophy size={13} style={goldText} />
                  <span style={{ ...goldText, fontSize: 12, fontWeight: 700 }}>Room Leaderboard</span>
                </div>
                {activeRoom.leaderboard.map((lb, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ ...goldText, fontSize: 11, width: 18, textAlign: 'center' }}>
                      {i === 0 ? '🏆' : `#${i + 1}`}
                    </span>
                    <span style={{ flex: 1, ...bodyText, fontSize: 12, fontFamily: 'serif' }}>{lb.name}</span>
                    <span style={{ ...goldText, fontSize: 10, fontWeight: 700 }}>{lb.xp} XP</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Zap size={9} style={{ color: '#FB923C' }} />
                      <span style={{ color: '#FB923C', fontSize: 9 }}>{lb.streak}d</span>
                    </div>
                  </div>
                ))}
              </GlassCard>

              <GlassCard style={{ padding: '16px 18px' }} glowColor="rgba(100,200,180,0.14)">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Users size={13} style={goldText} />
                  <span style={{ ...goldText, fontSize: 12, fontWeight: 700 }}>
                    Active Now ({activeRoom.active})
                  </span>
                </div>
                {Array.from({ length: activeRoom.active }, (_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <div style={{
                      width: 26, height: 26, borderRadius: '50%',
                      background: `hsl(${(i * 47 + 170) % 360},45%,50%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: '#fff', fontWeight: 700, flexShrink: 0,
                      position: 'relative',
                    }}>
                      {String.fromCharCode(65 + i)}
                      <div style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'hsl(var(--success))',
                        boxShadow: '0 0 6px hsl(var(--success))',
                        border: '1px solid hsl(var(--surface))',
                      }} />
                    </div>
                    <span style={{ ...bodyText, fontSize: 11 }}>Member {i + 1}</span>
                  </div>
                ))}
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main Social View ───────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden">
      <WellnessBackground focusMode={false} />
      <div className="gk-fog-layer" />

      <div style={{ position: 'relative', zIndex: 10, padding: '20px 16px', maxWidth: 900, margin: '0 auto' }}>
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 22 }}
        >
          <h1 style={{ ...goldText, fontFamily: 'serif', fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '0.01em' }}>
            Study Circles
          </h1>
          <p style={{ ...mutedText, fontSize: 13, margin: '4px 0 0' }}>
            Join a learning circle, climb the ranks, grow together
          </p>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}
        >
          <StatChip icon={<Users size={11} />} label="Circles" value={STUDY_ROOMS.length} />
          <StatChip icon={<Zap size={11} />} label="Active Now" value={STUDY_ROOMS.reduce((s, r) => s + r.active, 0)} color="#FB923C" />
          <StatChip icon={<Trophy size={11} />} label="Your Rank" value="#7" />
          <StatChip icon={<Star size={11} />} label="Your XP" value={user?.xp ?? 0} />
        </motion.div>

        {/* Search bar */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ marginBottom: 18 }}
        >
          <GlassCard style={{ padding: '10px 14px' }} glowColor="rgba(100,200,180,0.12)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Search size={14} style={mutedText} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search circles by subject or topic…"
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  outline: 'none',
                  ...bodyText,
                  fontSize: 13,
                }}
              />
            </div>
          </GlassCard>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 18, alignItems: 'start' }}>
          {/* Room cards */}
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <AnimatePresence>
                {filteredRooms.map((room, i) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.06 }}
                  >
                    <GlassCard
                      style={{ padding: '18px 20px' }}
                      glowColor="rgba(212,175,55,0.18)"
                      delay={i * 60}
                    >
                      {/* Room header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                          background: 'hsl(var(--accent) / 0.12)',
                          border: '1px solid hsl(var(--accent) / 0.25)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <BookOpen size={18} style={goldText} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <h3 style={{ ...bodyText, fontFamily: 'serif', fontSize: 15, fontWeight: 700, margin: 0 }}>
                              {room.name}
                            </h3>
                            {room.isLocked
                              ? <Lock size={11} style={mutedText} />
                              : <Unlock size={11} style={{ color: 'hsl(var(--success))' }} />}
                          </div>
                          <p style={{ ...mutedText, fontSize: 11, margin: 0 }}>{room.description}</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginBottom: 2 }}>
                            <div style={{
                              width: 6, height: 6, borderRadius: '50%',
                              background: 'hsl(var(--success))',
                              boxShadow: '0 0 6px hsl(var(--success))',
                            }} />
                            <span style={{ ...goldText, fontSize: 10 }}>{room.active} online</span>
                          </div>
                          <span style={{ ...mutedText, fontSize: 10 }}>
                            {room.members}/{room.maxMembers} members
                          </span>
                        </div>
                      </div>

                      {/* Tags */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {room.tags.map(tag => (
                          <span key={tag} style={{
                            background: 'hsl(var(--accent) / 0.1)',
                            border: '1px solid hsl(var(--accent) / 0.22)',
                            color: 'hsl(var(--accent))',
                            fontSize: 9, borderRadius: 20, padding: '2px 8px',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Stats row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Zap size={11} style={{ color: '#FB923C' }} />
                          <span style={{ color: '#FB923C', fontSize: 10 }}>{room.streak}d streak</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Users size={11} style={mutedText} />
                          <span style={{ ...mutedText, fontSize: 10 }}>{room.members} total</span>
                        </div>
                        <div style={{ flex: 1 }} />
                        {/* Member progress bar */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{
                            width: 80, height: 4, background: 'hsl(var(--surface) / 0.8)',
                            borderRadius: 99, overflow: 'hidden',
                          }}>
                            <div style={{
                              height: '100%',
                              width: `${(room.members / room.maxMembers) * 100}%`,
                              background: 'hsl(var(--accent))',
                              borderRadius: 99,
                            }} />
                          </div>
                          <span style={{ ...mutedText, fontSize: 9 }}>
                            {Math.round((room.members / room.maxMembers) * 100)}% full
                          </span>
                        </div>
                      </div>

                      {/* Action */}
                      <button
                        onClick={() => !room.isLocked && setActiveRoom(room)}
                        style={{
                          width: '100%', padding: '8px 0', borderRadius: 10,
                          background: room.isLocked
                            ? 'hsl(var(--surface) / 0.5)'
                            : 'hsl(var(--accent) / 0.18)',
                          border: room.isLocked
                            ? '1px solid hsl(var(--border) / 0.4)'
                            : '1px solid hsl(var(--accent) / 0.35)',
                          color: room.isLocked
                            ? 'hsl(var(--muted))'
                            : 'hsl(var(--accent))',
                          cursor: room.isLocked ? 'not-allowed' : 'pointer',
                          fontSize: 12, fontWeight: 600, fontFamily: 'serif',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          transition: 'all 0.2s',
                        }}
                      >
                        {room.isLocked ? <><Lock size={11} /> Locked Circle</> : <><ChevronRight size={11} /> Join Circle</>}
                      </button>
                    </GlassCard>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Create Circle card */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: filteredRooms.length * 0.06 + 0.1 }}
              >
                <GlassCard style={{ padding: '18px 20px' }} glowColor="rgba(100,200,180,0.12)">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: 'hsl(var(--surface) / 0.5)',
                      border: '1px dashed hsl(var(--border) / 0.6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Plus size={18} style={mutedText} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ ...bodyText, fontFamily: 'serif', fontSize: 14, fontWeight: 600, margin: 0 }}>
                        Create Your Circle
                      </h3>
                      <p style={{ ...mutedText, fontSize: 11, margin: '2px 0 0' }}>
                        Start a study group for your subject
                      </p>
                    </div>
                    <button style={{
                      background: 'hsl(var(--accent) / 0.12)',
                      border: '1px solid hsl(var(--accent) / 0.25)',
                      color: 'hsl(var(--accent))',
                      borderRadius: 10, padding: '7px 14px',
                      cursor: 'pointer', fontSize: 12, fontFamily: 'serif',
                    }}>
                      Create
                    </button>
                  </div>
                </GlassCard>
              </motion.div>
            </div>
          </div>

          {/* Right sidebar: Accountability + Leaderboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Accountability card */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard style={{ padding: '18px 18px' }} glowColor="rgba(100,200,180,0.14)">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <Target size={13} style={goldText} />
                  <span style={{ ...goldText, fontSize: 12, fontWeight: 700, fontFamily: 'serif' }}>
                    Accountability
                  </span>
                </div>
                {[
                  { label: 'Daily Goal', value: '4h study', done: true },
                  { label: 'Quiz Today', value: '2/3 done', done: false },
                  { label: 'Circle Check-in', value: 'Done ✓', done: true },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: item.done ? 'hsl(var(--success))' : 'hsl(var(--border))',
                      boxShadow: item.done ? '0 0 6px hsl(var(--success))' : 'none',
                    }} />
                    <span style={{ flex: 1, ...bodyText, fontSize: 11 }}>{item.label}</span>
                    <span style={{ ...mutedText, fontSize: 10 }}>{item.value}</span>
                  </div>
                ))}
              </GlassCard>
            </motion.div>

            {/* Global Leaderboard */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.28 }}
            >
              <GlassCard style={{ padding: '18px 18px' }} glowColor="rgba(100,200,180,0.14)">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <Trophy size={13} style={goldText} />
                  <span style={{ ...goldText, fontSize: 12, fontWeight: 700, fontFamily: 'serif' }}>
                    Global Rankings
                  </span>
                </div>
                {loadingLb ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                    <Loader2 size={14} style={{ ...goldText, animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : leaderboard.length === 0 ? (
                  <p style={{ ...mutedText, fontSize: 10, textAlign: 'center', padding: '12px 0' }}>
                    No rankings yet
                  </p>
                ) : (
                  leaderboard.slice(0, 7).map((lb, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 8px', borderRadius: 8, marginBottom: 3,
                        background: 'transparent',
                      }}
                    >
                      <span style={{ width: 18, fontSize: 11, ...goldText, fontWeight: 700, textAlign: 'center' }}>
                        {i === 0 ? '🏆' : i === 1 ? <Medal size={11} /> : `#${i + 1}`}
                      </span>
                      <span style={{ flex: 1, ...bodyText, fontSize: 11, fontFamily: 'serif' }}>
                        {lb.name}
                      </span>
                      <span style={{ ...goldText, fontSize: 10, fontWeight: 700 }}>{lb.xp} XP</span>
                    </motion.div>
                  ))
                )}
              </GlassCard>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Social;
