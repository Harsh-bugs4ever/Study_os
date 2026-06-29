import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  ArrowRight, AlertTriangle, Lightbulb, Target, Moon, Timer, Brain,
  Flame, Trophy, Loader2, Smile, Frown, Meh, Zap, Coffee, CloudRain, Sun,
  Volume2, VolumeX
} from 'lucide-react';

interface Particle {
  x: number; y: number; vx: number; vy: number;
  r: number; opacity: number; baseX: number; baseY: number; colorIdx: number;
}
interface LeaderboardEntry { name: string; xp: number; isCurrentUser: boolean; }

const moods = [
  { icon: <Smile size={20} />, label: 'Great', risk: 5 },
  { icon: <Frown size={20} />, label: 'Stressed', risk: 80 },
  { icon: <Coffee size={20} />, label: 'Tired', risk: 65 },
  { icon: <CloudRain size={20} />, label: 'Anxious', risk: 75 },
  { icon: <Zap size={20} />, label: 'Motivated', risk: 10 },
  { icon: <Meh size={20} />, label: 'Numb', risk: 55 },
  { icon: <Frown size={20} />, label: 'Sad', risk: 85 },
  { icon: <Sun size={20} />, label: 'Confident', risk: 8 },
];

const topicsBySubject: Record<string, { continue: string; fading: string; levelUp: string; easyWin: string }> = {
  Physics: { continue: 'Thermodynamics · Chapter 3', fading: 'Mechanics · Rotational Motion', levelUp: 'Electrostatics · 85%+ three sessions', easyWin: 'Modern Physics · Your strongest' },
  Chemistry: { continue: 'Organic Chemistry · Reactions', fading: 'Inorganic Chemistry · Periodic Table', levelUp: 'Physical Chemistry · Equilibrium', easyWin: 'Chemical Bonding · Quick review' },
  Mathematics: { continue: 'Calculus · Integration', fading: 'Coordinate Geometry · Conic Sections', levelUp: 'Probability · 85%+ three sessions', easyWin: 'Trigonometry · Formulae practice' },
  Biology: { continue: 'Genetics · DNA Replication', fading: 'Ecology · Ecosystem Dynamics', levelUp: 'Cell Biology · 85%+ three sessions', easyWin: 'Plant Physiology · Diagram recall' },
  'Computer Science': { continue: 'Data Structures · Trees', fading: 'Algorithms · Sorting', levelUp: 'OOP Concepts · 85%+ three sessions', easyWin: 'HTML/CSS · Quick revision' },
  English: { continue: 'Literature · Poetry Analysis', fading: 'Grammar · Tenses', levelUp: 'Comprehension · 85%+ three sessions', easyWin: 'Vocabulary · Word building' },
  History: { continue: 'Indian Freedom Movement · 1920-1947', fading: 'World War II · Causes', levelUp: 'Ancient India · 85%+ three sessions', easyWin: 'Mughal Empire · Timeline' },
  Economics: { continue: 'Microeconomics · Elasticity', fading: 'Macroeconomics · GDP', levelUp: 'Statistics · 85%+ three sessions', easyWin: 'Indian Economy · Basics' },
  Geography: { continue: 'Climatology · Monsoons', fading: 'Map Work · Rivers', levelUp: 'Human Geography', easyWin: 'Physical Geography · Landforms' },
  'Mechanical Engineering': { continue: 'Mechanics of Materials · Stress Analysis', fading: 'Manufacturing · CNC', levelUp: 'Fluid Mechanics · 85%+', easyWin: 'Engineering Drawing · Quick review' },
  'Civil Engineering': { continue: 'Structural Analysis · Beams', fading: 'Surveying · Leveling', levelUp: 'Geotechnical · 85%+', easyWin: 'Building Materials · Basics' },
  'Electrical Engineering': { continue: 'Power Systems · Transmission', fading: 'Machines · Transformers', levelUp: 'Control Systems · 85%+', easyWin: 'Circuit Theory · Basics' },
  Electronics: { continue: 'Digital Circuits · Flip-flops', fading: 'Signals · Fourier', levelUp: 'Communication · 85%+', easyWin: 'Analog Circuits · Basics' },
  'Engineering Mathematics': { continue: 'Linear Algebra · Eigenvalues', fading: 'Discrete Math · Graph Theory', levelUp: 'Differential Equations · 85%+', easyWin: 'Complex Analysis · Basics' },
  'Data Structures & Algorithms': { continue: 'Trees · AVL Trees', fading: 'Graphs · BFS/DFS', levelUp: 'Dynamic Programming · 85%+', easyWin: 'Arrays & Strings · Practice' },
  'Operating Systems': { continue: 'Process Scheduling · Algorithms', fading: 'Memory Management · Paging', levelUp: 'File Systems · 85%+', easyWin: 'Basics · Deadlocks' },
  DBMS: { continue: 'Normalization · 3NF', fading: 'SQL · Joins', levelUp: 'Transactions · 85%+', easyWin: 'ER Diagrams · Basics' },
  Accountancy: { continue: 'Partnership Accounts', fading: 'Depreciation · Methods', levelUp: 'Company Accounts · 85%+', easyWin: 'Journal Entries · Practice' },
  'Business Studies': { continue: 'Marketing Mix · 4Ps', fading: 'Management Principles', levelUp: 'Financial Markets · 85%+', easyWin: 'Business Environment · Basics' },
  'Political Science': { continue: 'Indian Constitution · Amendments', fading: 'Political Theory · Liberty', levelUp: 'International Relations · 85%+', easyWin: 'Fundamental Rights · Review' },
  Psychology: { continue: 'Learning · Conditioning', fading: 'Personality · Theories', levelUp: 'Disorders · 85%+', easyWin: 'Sensation · Quick review' },
  Sociology: { continue: 'Social Stratification', fading: 'Indian Society · Caste', levelUp: 'Social Change · 85%+', easyWin: 'Sociological Theories · Basics' },
};

// Particle colors: saffron, gold, teal
const PALETTE = [
  [255, 153, 51],
  [212, 175, 55],
  [32, 178, 170],
];

// ── Particle Canvas ──────────────────────────────────────────────────────────
const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const count = Math.min(Math.floor((canvas.width * canvas.height) / 11000), 95);
      particlesRef.current = Array.from({ length: count }, () => {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        return {
          x, y, baseX: x, baseY: y,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          r: Math.random() * 1.8 + 0.8,
          opacity: Math.random() * 0.45 + 0.25,
          colorIdx: Math.floor(Math.random() * 3),
        };
      });
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMouse);

    const draw = () => {
      const { width: W, height: H } = canvas;
      ctx.clearRect(0, 0, W, H);
      const pts = particlesRef.current;
      const { x: mx, y: my } = mouseRef.current;

      pts.forEach(p => {
        p.vx += (p.baseX - p.x) * 0.00035;
        p.vy += (p.baseY - p.y) * 0.00035;
        const dx = p.x - mx; const dy = p.y - my;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          const f = (130 - d) / 130;
          p.vx += (dx / d) * f * 0.7;
          p.vy += (dy / d) * f * 0.7;
        }
        p.vx *= 0.983; p.vy *= 0.983;
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      });

      // Connections
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x; const dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 145) {
            const a = (1 - dist / 145) * 0.22;
            const col = PALETTE[pts[i].colorIdx];
            ctx.beginPath();
            ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${a})`;
            ctx.lineWidth = 0.75;
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }

      // Glowing dots
      pts.forEach(p => {
        const col = PALETTE[p.colorIdx];
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${p.opacity})`);
        g.addColorStop(1, `rgba(${col[0]},${col[1]},${col[2]},0)`);
        ctx.beginPath(); ctx.fillStyle = g;
        ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2); ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0, opacity: 0.8 }} />;
};

// ── Mandala decorations ──────────────────────────────────────────────────────
const MandalaDecor = () => (
  <>
    {/* Bottom-right large mandala */}
    <div className="fixed pointer-events-none select-none" style={{ zIndex: 0, bottom: '-8vh', right: '-6vw', opacity: 0.045 }}>
      <motion.svg width="500" height="500" viewBox="0 0 500 500"
        animate={{ rotate: 360 }} transition={{ duration: 130, repeat: Infinity, ease: 'linear' }}>
        {[0,1,2,3,4,5,6,7].map(k => (
          <g key={k} transform={`rotate(${k*45} 250 250)`}>
            <ellipse cx="250" cy="118" rx="16" ry="38" fill="none" stroke="hsl(var(--accent))" strokeWidth="1" />
            <circle cx="250" cy="82" r="5.5" fill="none" stroke="hsl(var(--accent))" strokeWidth="0.9" />
          </g>
        ))}
        {[55,105,158,200].map(r => (
          <circle key={r} cx="250" cy="250" r={r} fill="none" stroke="hsl(var(--accent))" strokeWidth="0.7" strokeDasharray="4 9" />
        ))}
        {[0,1,2,3,4,5,6,7,8,9,10,11].map(k => (
          <line key={k} x1="250" y1="50" x2="250" y2="450" stroke="hsl(var(--accent))" strokeWidth="0.55"
            transform={`rotate(${k*30} 250 250)`} />
        ))}
      </motion.svg>
    </div>
    {/* Top-left lotus */}
    <div className="fixed pointer-events-none select-none" style={{ zIndex: 0, top: '4vh', left: '3vw', opacity: 0.05 }}>
      <motion.svg width="200" height="200" viewBox="0 0 200 200"
        animate={{ rotate: -360 }} transition={{ duration: 85, repeat: Infinity, ease: 'linear' }}>
        {[0,45,90,135,180,225,270,315].map(angle => (
          <ellipse key={angle} cx="100" cy="48" rx="11" ry="30" fill="hsl(var(--accent))" fillOpacity="0.6"
            transform={`rotate(${angle} 100 100)`} />
        ))}
        <circle cx="100" cy="100" r="16" fill="none" stroke="hsl(var(--accent))" strokeWidth="1.4" />
        <circle cx="100" cy="100" r="5" fill="hsl(var(--accent))" fillOpacity="0.65" />
      </motion.svg>
    </div>
  </>
);

// ── GlassCard with 3D tilt + ripple ─────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  delay?: number;
  intensity?: number;
}

const GlassCard = ({ children, className = '', style = {}, onClick, delay = 0, intensity = 1 }: GlassCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const nextId = useRef(0);

  const rX = useMotionValue(0); const rY = useMotionValue(0);
  const gX = useMotionValue(50); const gY = useMotionValue(50);
  const cfg = { stiffness: 280, damping: 28 };
  const srX = useSpring(rX, cfg); const srY = useSpring(rY, cfg);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = cardRef.current?.getBoundingClientRect(); if (!r) return;
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    rX.set(-dy * 9 * intensity); rY.set(dx * 9 * intensity);
    gX.set((e.clientX - r.left) / r.width * 100);
    gY.set((e.clientY - r.top) / r.height * 100);
  };
  const onLeave = () => { rX.set(0); rY.set(0); gX.set(50); gY.set(50); };

  const glowBg = useTransform([gX, gY] as any, ([x, y]: number[]) =>
    `radial-gradient(circle at ${x}% ${y}%, rgba(255,153,51,0.1) 0%, transparent 58%)`
  );

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = cardRef.current?.getBoundingClientRect(); if (!r) return;
    const id = nextId.current++;
    setRipples(prev => [...prev, { id, x: e.clientX - r.left, y: e.clientY - r.top }]);
    setTimeout(() => setRipples(prev => prev.filter(rp => rp.id !== id)), 650);
    onClick?.();
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 22, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.48, ease: [0.23, 1, 0.32, 1] }}
      style={{ rotateX: srX, rotateY: srY, transformPerspective: 900, transformStyle: 'preserve-3d', position: 'relative', overflow: 'hidden', ...style }}
      className={`gk-glass-card ${className}`}
      onMouseMove={onMove} onMouseLeave={onLeave} onClick={handleClick}
      whileHover={{ scale: 1.012 }} whileTap={{ scale: 0.987 }}
    >
      <motion.div style={{ background: glowBg, position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1, borderRadius: 'inherit' }} />
      <div className="gk-sheen" />
      <div style={{ position: 'relative', zIndex: 2 }}>{children}</div>
      {ripples.map(rp => <span key={rp.id} className="gk-ripple" style={{ left: rp.x, top: rp.y }} />)}
    </motion.div>
  );
};

// ── Ambient Sound Toggle ─────────────────────────────────────────────────────
const AmbientToggle = () => {
  const [playing, setPlaying] = useState(false);
  const nodesRef = useRef<{ ctx: AudioContext; nodes: AudioNode[] } | null>(null);

  const toggle = () => {
    if (playing && nodesRef.current) {
      try { nodesRef.current.ctx.close(); } catch {}
      nodesRef.current = null;
      setPlaying(false);
      return;
    }
    try {
      const ctx = new AudioContext();
      const bufferSize = 2 * ctx.sampleRate;
      const buf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const lpf = ctx.createBiquadFilter(); lpf.type = 'lowpass'; lpf.frequency.value = 220;
      const gain = ctx.createGain(); gain.gain.value = 0.035;
      src.connect(lpf); lpf.connect(gain); gain.connect(ctx.destination); src.start();

      // Om-like tone
      const osc = ctx.createOscillator(); osc.type = 'sine'; osc.frequency.value = 136.1;
      const oscGain = ctx.createGain(); oscGain.gain.value = 0.012;
      osc.connect(oscGain); oscGain.connect(ctx.destination); osc.start();

      nodesRef.current = { ctx, nodes: [src, osc, lpf, gain, oscGain] };
      setPlaying(true);
    } catch {}
  };

  useEffect(() => () => { try { nodesRef.current?.ctx.close(); } catch {} }, []);

  return (
    <motion.button onClick={toggle} className="gk-ambient-btn" title={playing ? 'Stop ambient' : 'Play ambient (Om)'} whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}>
      {playing ? <Volume2 size={13} /> : <VolumeX size={13} />}
      <span>{playing ? 'Om' : 'Om'}</span>
    </motion.button>
  );
};

// ── Main Dashboard ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, setUser } = useApp();
  const { recoveryMode, setRecoveryMode } = useTheme();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLbLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profiles } = await supabase.from('profiles').select('id, name, xp').order('xp', { ascending: false }).limit(10);
      if (profiles) {
        setLeaderboard(profiles.map(p => ({ name: p.name || 'Student', xp: p.xp || 0, isCurrentUser: p.id === session?.user?.id })));
      }
      setLbLoading(false);
    };
    load();
  }, []);

  const recommendations = useMemo(() => {
    const subs = user.subjects.length > 0 ? user.subjects : ['Physics', 'Chemistry', 'Mathematics'];
    const recs: { icon: React.ReactNode; type: string; title: string; subtitle: string; action: string; link: string }[] = [];
    const history = JSON.parse(localStorage.getItem('saathi-learn-history') || '[]');
    if (history.length > 0) {
      const last = history[history.length - 1];
      recs.push({ icon: <Target size={18} />, type: 'Continue where you left off', title: `${last.subject} · ${last.subtopic}`, subtitle: `Step ${last.step || 1}/5 · Resume learning`, action: 'Resume', link: '/learn' });
    }
    subs.slice(0, 3).forEach(sub => {
      const topics = topicsBySubject[sub] || topicsBySubject['Physics'];
      if (recs.length === 0) recs.push({ icon: <Target size={18} />, type: 'Continue where you left off', title: topics.continue, subtitle: '60% complete · ~12 min left', action: 'Resume', link: '/learn' });
      if (recs.length < 4) recs.push({ icon: <AlertTriangle size={18} />, type: 'Memory fading', title: `${sub} · ${topics.fading}`, subtitle: 'Last studied 5 days ago', action: 'Review now', link: '/learn' });
    });
    if (recs.length < 4) {
      const sub = subs[0];
      const topics = topicsBySubject[sub] || topicsBySubject['Physics'];
      recs.push({ icon: <Lightbulb size={18} />, type: 'Ready to level up', title: topics.levelUp, subtitle: 'Try advanced problems today', action: 'Challenge', link: '/quiz' });
    }
    return recs.slice(0, 4);
  }, [user.subjects]);

  const burnoutScore = useMemo(() => {
    let score = 30;
    if (selectedMood !== null) score += moods[selectedMood].risk * 0.4;
    score -= Math.min(user.streak * 2, 20);
    const hour = new Date().getHours();
    if (hour >= 23 || hour < 5) score += 15;
    if (hour >= 6 && hour < 10) score -= 5;
    return Math.max(5, Math.min(95, Math.round(score)));
  }, [selectedMood, user.streak]);

  useEffect(() => {
    if (burnoutScore !== user.burnoutScore) setUser(prev => ({ ...prev, burnoutScore }));
  }, [burnoutScore]);

  const dueTopics = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('saathi-learn-history') || '[]').filter((h: any) => !h.completed).length; }
    catch { return 0; }
  }, []);

  const readinessColor = user.readinessScore >= 80 ? 'hsl(var(--success))' : user.readinessScore >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--danger))';

  const handleMoodSelect = (i: number) => {
    setSelectedMood(i);
    const mood = moods[i];
    const newReadiness = Math.max(20, user.readinessScore - Math.floor(mood.risk * 0.3));
    setUser(prev => ({ ...prev, mood: mood.label, readinessScore: mood.risk < 30 ? Math.min(95, prev.readinessScore + 5) : newReadiness }));
  };

  const greeting = () => { const h = new Date().getHours(); if (h < 12) return 'Good morning'; if (h < 17) return 'Good afternoon'; return 'Good evening'; };

  return (
    <>
      <ParticleCanvas />
      <MandalaDecor />

      {/* Ambient fog depth layer */}
      <div className="gk-fog-layer" />

      {/* Sanskrit verse footer */}
      <div className="fixed bottom-1 left-1/2 -translate-x-1/2 pointer-events-none select-none hidden lg:block" style={{ zIndex: 1 }}>
        <p className="gk-sanskrit-strip">॥ विद्या ददाति विनयं विनयाद्याति पात्रताम् ॥</p>
      </div>

      {/* Ambient toggle floating */}
      <div style={{ position: 'fixed', top: 72, right: 18, zIndex: 50 }}>
        <AmbientToggle />
      </div>

      {/* Main content */}
      <div className="gk-dashboard max-w-6xl mx-auto px-4 lg:px-8 py-6 flex flex-col lg:flex-row gap-6" style={{ position: 'relative', zIndex: 2 }}>

        {/* ─── Left Panel ─── */}
        <div className="flex-1 space-y-5">

          {/* Recovery Mode Banner */}
          {recoveryMode && (
            <GlassCard delay={0} style={{ borderColor: 'hsl(var(--accent))' }}>
              <div className="flex items-center gap-4">
                <Moon size={20} style={{ color: 'hsl(var(--accent))' }} />
                <div className="flex-1">
                  <p className="font-display font-semibold text-sm flex items-center gap-1.5" style={{ color: 'hsl(var(--text))' }}><Moon size={14} /> Recovery Mode Active</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>No pressure, no timers. Saathi thinks you need a gentler day.</p>
                </div>
                <button onClick={() => setRecoveryMode(false)} className="text-xs font-medium px-3 py-1 rounded-lg border border-border" style={{ color: 'hsl(var(--text-secondary))' }}>Exit mode</button>
              </div>
            </GlassCard>
          )}

          {/* Readiness Card */}
          <GlassCard delay={0.05}>
            <div className="gk-card-verse-accent">विद्या विनयं ददाति</div>
            <p className="text-sm mb-0.5" style={{ color: 'hsl(var(--muted))' }}>{greeting()}, {user.name || 'Student'}</p>
            <h2 className="font-display text-xl font-bold mb-4" style={{ color: 'hsl(var(--text))' }}>Today's Readiness</h2>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
              <div className="relative w-40 h-20 flex-shrink-0">
                <svg viewBox="0 0 120 65" className="w-full h-full">
                  <path d="M 10 58 A 50 50 0 0 1 110 58" fill="none" stroke="rgba(128,128,128,0.15)" strokeWidth="10" strokeLinecap="round" />
                  <path d="M 10 58 A 50 50 0 0 1 43 15" fill="none" stroke="hsl(var(--danger))" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
                  <path d="M 43 15 A 50 50 0 0 1 77 15" fill="none" stroke="hsl(var(--warning))" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
                  <path d="M 77 15 A 50 50 0 0 1 110 58" fill="none" stroke="hsl(var(--success))" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
                  <line x1="60" y1="58" x2={60 + 40 * Math.cos(Math.PI - (user.readinessScore / 100) * Math.PI)} y2={58 - 40 * Math.sin(Math.PI - (user.readinessScore / 100) * Math.PI)} stroke="hsl(var(--text))" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="60" cy="58" r="4" fill="hsl(var(--text))" />
                  <text x="60" y="52" textAnchor="middle" fontSize="16" fontWeight="bold" fill={readinessColor}>{user.readinessScore}</text>
                </svg>
              </div>
              <div className="flex-1 w-full">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="flex items-center gap-2"><Smile size={14} style={{ color: 'hsl(var(--accent))' }} /><span style={{ color: 'hsl(var(--text-secondary))' }}>Mood: {user.mood || 'Not set'}</span></div>
                  <div className="flex items-center gap-2"><Moon size={14} style={{ color: 'hsl(var(--accent))' }} /><span style={{ color: 'hsl(var(--text-secondary))' }}>Sleep: {new Date().getHours() < 6 ? 'Late' : new Date().getHours() < 12 ? 'Good' : 'OK'}</span></div>
                  <div className="flex items-center gap-2"><Target size={14} style={{ color: 'hsl(var(--accent))' }} /><span style={{ color: 'hsl(var(--text-secondary))' }}>{dueTopics} topic{dueTopics !== 1 ? 's' : ''} due</span></div>
                </div>
                <div className="mt-3 p-3 rounded-xl" style={{ background: 'hsl(var(--accent-soft))' }}>
                  <p className="text-sm font-display italic" style={{ color: 'hsl(var(--text))' }}>
                    Saathi recommends: "Good energy today. Tackle that {user.subjects[0] || 'Physics'} chapter you've been avoiding."
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Mood Check-in */}
          {selectedMood === null && (
            <GlassCard delay={0.1}>
              <h3 className="font-display text-lg font-semibold mb-4" style={{ color: 'hsl(var(--text))' }}>How are you feeling right now?</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {moods.map((m, i) => (
                  <motion.div key={i} className="flex flex-col items-center gap-1"
                    initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.12 + i * 0.04, type: 'spring', stiffness: 320 }}>
                    <button onClick={() => handleMoodSelect(i)}
                      className="mood-orb w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110"
                      style={{ background: 'hsl(var(--surface2))', color: 'hsl(var(--accent))' }}>
                      {m.icon}
                    </button>
                    <span className="text-[10px]" style={{ color: 'hsl(var(--muted))' }}>{m.label}</span>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          )}

          {selectedMood !== null && (
            <GlassCard delay={0}>
              <div className="text-center py-4">
                <div className="mb-2" style={{ color: 'hsl(var(--accent))' }}>{moods[selectedMood].icon}</div>
                <p className="font-display text-sm" style={{ color: 'hsl(var(--text))' }}>
                  Session adjusted for your <strong>{moods[selectedMood].label.toLowerCase()}</strong> mood
                </p>
              </div>
            </GlassCard>
          )}

          {/* Recommendation Feed */}
          <div>
            <h3 className="font-display text-lg font-semibold mb-3" style={{ color: 'hsl(var(--text))' }}>What Saathi thinks you need today</h3>
            <div className="space-y-3">
              {recommendations.map((r, i) => (
                <GlassCard key={i} delay={0.14 + i * 0.07} onClick={() => navigate(r.link)} intensity={0.65} className="cursor-pointer group">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}>{r.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted))' }}>{r.type}</p>
                      <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--text))' }}>{r.title}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--text-secondary))' }}>{r.subtitle}</p>
                    </div>
                    <span className="text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'hsl(var(--accent))' }}>
                      {r.action} <ArrowRight size={14} />
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <GlassCard delay={0.22} onClick={() => navigate('/mental-health')} className="cursor-pointer">
              <div className="flex items-center gap-4">
                <Timer size={24} style={{ color: 'hsl(var(--accent))' }} />
                <div className="flex-1">
                  <p className="font-display text-sm font-semibold" style={{ color: 'hsl(var(--text))' }}>Focus Timer (Pomodoro)</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>25 min study · 5 min break</p>
                </div>
                <ArrowRight size={16} style={{ color: 'hsl(var(--accent))' }} />
              </div>
            </GlassCard>
            <GlassCard delay={0.27} onClick={() => navigate('/mental-health')} className="cursor-pointer">
              <div className="flex items-center gap-4">
                <Brain size={24} style={{ color: 'hsl(var(--accent))' }} />
                <div className="flex-1">
                  <p className="font-display text-sm font-semibold" style={{ color: 'hsl(var(--text))' }}>Mental Wellbeing</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>Breathing, CBT & more</p>
                </div>
                <ArrowRight size={16} style={{ color: 'hsl(var(--accent))' }} />
              </div>
            </GlassCard>
          </div>
        </div>

        {/* ─── Right Panel ─── */}
        <div className="hidden lg:block w-72 space-y-5">

          {/* Profile */}
          <GlassCard delay={0.08} className="text-center">
            <div className="relative inline-block mb-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display font-bold mx-auto gk-avatar-circle">
                {user.name?.[0] || '?'}
              </div>
              <svg className="absolute inset-0 w-full h-full gk-avatar-ring-svg" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="30" fill="none" stroke="url(#avGrad)" strokeWidth="1.5" strokeDasharray="6 4" />
                <defs>
                  <linearGradient id="avGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF9933" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.4" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="font-display font-semibold text-sm" style={{ color: 'hsl(var(--text))' }}>{user.name || 'Student'}</p>
            <p className="font-display text-xs italic" style={{ color: 'hsl(var(--muted))' }}>{user.heroTitle}</p>
            <div className="mt-2 flex flex-wrap gap-1 justify-center">
              {user.subjects.slice(0, 3).map(s => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}>{s}</span>
              ))}
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'hsl(var(--muted))' }}>XP</span>
                <span className="stat-number" style={{ color: 'hsl(var(--accent))' }}>{user.xp}/500</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'hsl(var(--surface2))' }}>
                <motion.div className="h-full rounded-full gk-xp-bar"
                  initial={{ width: 0 }} animate={{ width: `${(user.xp / 500) * 100}%` }}
                  transition={{ duration: 1.1, delay: 0.4, ease: 'easeOut' }} />
              </div>
            </div>
          </GlassCard>

          {/* Burnout */}
          <GlassCard delay={0.13} className="text-center">
            <h4 className="font-display text-sm font-semibold mb-3" style={{ color: 'hsl(var(--text))' }}>Burnout Risk</h4>
            <div className="relative w-32 h-16 mx-auto mb-2">
              <svg viewBox="0 0 120 60" className="w-full h-full">
                <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="rgba(128,128,128,0.12)" strokeWidth="8" strokeLinecap="round" />
                <path d="M 10 55 A 50 50 0 0 1 43 12" fill="none" stroke="hsl(var(--success))" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
                <path d="M 43 12 A 50 50 0 0 1 77 12" fill="none" stroke="hsl(var(--warning))" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
                <path d="M 77 12 A 50 50 0 0 1 110 55" fill="none" stroke="hsl(var(--danger))" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
                <line x1="60" y1="55" x2={60 + 40 * Math.cos(Math.PI - (burnoutScore / 100) * Math.PI)} y2={55 - 40 * Math.sin(Math.PI - (burnoutScore / 100) * Math.PI)} stroke="hsl(var(--text))" strokeWidth="2" strokeLinecap="round" />
                <circle cx="60" cy="55" r="3" fill="hsl(var(--text))" />
              </svg>
            </div>
            <span className="stat-number text-2xl font-bold" style={{ color: burnoutScore > 60 ? 'hsl(var(--danger))' : burnoutScore > 30 ? 'hsl(var(--warning))' : 'hsl(var(--success))' }}>{burnoutScore}</span>
            <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted))' }}>
              {burnoutScore > 60 ? 'High — consider a break' : burnoutScore > 30 ? 'Moderate — keep it steady' : "Low — you're doing great"}
            </p>
          </GlassCard>

          {/* Streak */}
          <GlassCard delay={0.18} className="text-center">
            <Flame size={28} className="mx-auto mb-1 animate-flame" style={{ color: 'hsl(var(--warning))' }} />
            <p className="stat-number text-2xl font-bold mt-1" style={{ color: 'hsl(var(--text))' }}>{user.streak}</p>
            <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>day streak</p>
          </GlassCard>

          {/* Leaderboard */}
          {!recoveryMode && (
            <GlassCard delay={0.23}>
              <h4 className="font-display text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'hsl(var(--text))' }}>
                <Trophy size={16} style={{ color: 'hsl(var(--warning))' }} /> Leaderboard
              </h4>
              {lbLoading ? (
                <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin" style={{ color: 'hsl(var(--accent))' }} /></div>
              ) : leaderboard.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: 'hsl(var(--muted))' }}>No rankings yet — take a quiz!</p>
              ) : (
                leaderboard.slice(0, 5).map((p, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 text-sm"
                    style={{ borderLeft: p.isCurrentUser ? '2px solid hsl(var(--accent))' : '2px solid transparent', paddingLeft: '8px' }}>
                    <span className="w-4 stat-number text-xs" style={{ color: i < 3 ? 'hsl(var(--warning))' : 'hsl(var(--muted))' }}>
                      {i === 0 ? <Trophy size={12} /> : `#${i + 1}`}
                    </span>
                    <span className="flex-1 truncate" style={{ color: 'hsl(var(--text))' }}>{p.isCurrentUser ? `${p.name} (You)` : p.name}</span>
                    <span className="stat-number text-xs" style={{ color: 'hsl(var(--accent))' }}>{p.xp} XP</span>
                  </div>
                ))
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;
