import { useState, useMemo, useCallback, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Sparkles, ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AnimatedBook } from '@/components/revision/AnimatedBook';

// ─── Types (UNCHANGED) ───────────────────────────────────────────────────────
interface Flashcard {
  id: string; front: string; back: string;
  rating: number; nextReview: number; reviewCount: number; interval: number;
}
interface Deck {
  id: string; name: string; subject: string;
  cards: Flashcard[]; lastStudied: number;
}

// ─── WellnessBackground (copied from MentalHealth) ───────────────────────────
const WellnessBackground = ({ focusMode }: { focusMode: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animRef = useRef<number>(0);
  const stateRef = useRef<{ particles: any[]; orbs: any[]; t: number; isDark: boolean }>
    ({ particles: [], orbs: [], t: 0, isDark: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'paper';
    const COUNT = window.innerWidth < 640 ? 28 : 55;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.28, vy: (Math.random() - 0.5) * 0.28 - 0.1,
      r: Math.random() * 2.2 + 0.5, opacity: Math.random() * 0.45 + 0.08,
      hue: Math.floor(Math.random() * 3), type: Math.random() > 0.72 ? 'diamond' : 'circle',
      phase: Math.random() * Math.PI * 2,
    }));
    const orbs = Array.from({ length: 5 }, (_, i) => ({
      x: (canvas.width / 5) * (i + 0.5), y: canvas.height * (0.25 + Math.random() * 0.5),
      r: 90 + Math.random() * 110, vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.12, phase: Math.random() * Math.PI * 2,
      hueArr: [176, 150, 130, 28, 200][i],
    }));
    stateRef.current = { particles, orbs, t: 0, isDark };
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const draw = () => {
      const { particles, orbs, isDark } = stateRef.current;
      const t = stateRef.current.t;
      const speed = focusMode ? 0.18 : 1;
      const w = canvas.width, h = canvas.height;
      const mx = mouseRef.current.x * w, my = mouseRef.current.y * h;
      ctx.clearRect(0, 0, w, h);
      orbs.forEach(orb => {
        orb.x += orb.vx * speed; orb.y += orb.vy * speed;
        if (orb.x < -orb.r) orb.x = w + orb.r;
        if (orb.x > w + orb.r) orb.x = -orb.r;
        if (orb.y < -orb.r) orb.y = h + orb.r;
        if (orb.y > h + orb.r) orb.y = -orb.r;
        const pulse = Math.sin(t * 0.004 + orb.phase) * 0.25 + 0.8;
        const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r * pulse);
        const a = isDark ? 0.055 : 0.035;
        g.addColorStop(0, `hsla(${orb.hueArr}, 42%, 60%, ${a})`);
        g.addColorStop(1, `hsla(${orb.hueArr}, 42%, 60%, 0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(orb.x, orb.y, orb.r * pulse, 0, Math.PI * 2); ctx.fill();
      });
      const cx = w / 2, cy = h / 2;
      [75, 150, 225, 300].forEach((r, i) => {
        const rot1 = t * 0.0004 * (i % 2 === 0 ? 1 : -1);
        const alpha = focusMode ? 0.03 : 0.022 + Math.sin(t * 0.003 + i) * 0.008;
        const color = isDark ? `rgba(212,175,55,${alpha})` : `rgba(139,105,20,${alpha})`;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = color; ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 7]); ctx.stroke(); ctx.setLineDash([]);
        for (let d = 0; d < 8; d++) {
          const ang = (d / 8) * Math.PI * 2 + rot1;
          ctx.beginPath();
          ctx.arc(cx + r * Math.cos(ang), cy + r * Math.sin(ang), 1.3, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? `rgba(212,175,55,${alpha * 5})` : `rgba(139,105,20,${alpha * 5})`;
          ctx.fill();
        }
      });
      const COLORS = [
        isDark ? 'rgba(212,175,55,' : 'rgba(139,105,20,',
        isDark ? 'rgba(100,200,180,' : 'rgba(30,120,100,',
        isDark ? 'rgba(150,200,140,' : 'rgba(60,130,70,',
      ];
      particles.forEach(p => {
        const dx = mx - p.x, dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const repel = dist < 110 ? ((110 - dist) / 110) * 1.4 : 0;
        p.x += (p.vx - dx * repel * 0.009) * speed;
        p.y += (p.vy - dy * repel * 0.009) * speed;
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0;
        const op = Math.max(0, (focusMode ? p.opacity * 0.35 : p.opacity) + Math.sin(t * 0.009 + p.phase) * 0.04);
        ctx.fillStyle = `${COLORS[p.hue]}${op})`;
        if (p.type === 'diamond') {
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(Math.PI / 4 + t * 0.002);
          ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2); ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        }
      });
      stateRef.current.t = t + 1;
      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [focusMode]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener('mousemove', handle, { passive: true });
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }} />;
};

// ─── GlassCard (same pattern as MentalHealth/Dashboard) ──────────────────────
const GlassCard = ({
  children, className = '', style = {}, glowColor = 'rgba(100,200,180,0.14)',
  intensity = 10, onClick,
}: {
  children: ReactNode; className?: string; style?: React.CSSProperties;
  glowColor?: string; intensity?: number; onClick?: () => void;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [xform, setXform] = useState('perspective(700px)');
  const [hovered, setHovered] = useState(false);

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = cardRef.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setXform(`perspective(700px) rotateX(${(-y * intensity).toFixed(2)}deg) rotateY(${(x * intensity).toFixed(2)}deg) scale(1.02)`);
  }, [intensity]);

  const onLeave = useCallback(() => {
    setXform('perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)');
    setHovered(false);
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onMouseEnter={() => setHovered(true)}
      onClick={onClick}
      style={{
        transform: xform,
        transition: 'transform 0.14s ease-out, box-shadow 0.28s ease',
        boxShadow: hovered
          ? `0 12px 40px ${glowColor}, 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.08)`
          : '0 2px 12px rgba(0,0,0,0.05)',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: '1rem',
        ...style,
      }}
    >
      <div
        className={`relative overflow-hidden rounded-2xl p-5 h-full ${className}`}
        style={{
          background: 'hsl(var(--surface) / 0.72)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          border: '1px solid hsl(var(--border-strong) / 0.55)',
        }}
      >
        {/* Shimmer top edge */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
          background: 'linear-gradient(90deg, transparent, hsl(var(--accent) / 0.28), transparent)',
        }} />
        <div className="gk-sheen" />
        {children}
      </div>
    </div>
  );
};

// ─── Shared sub-components ────────────────────────────────────────────────────
const Label = ({ children }: { children: ReactNode }) => (
  <div style={{
    fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase' as const,
    color: 'hsl(var(--accent) / 0.55)', fontFamily: 'DM Mono, monospace', marginBottom: 10,
  }}>
    ✦ {children}
  </div>
);

const PrimaryBtn = ({ children, onClick, disabled, full }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean; full?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex items-center justify-center gap-2 ${full ? 'w-full' : ''}`}
    style={{
      background: disabled ? 'hsl(var(--surface2))' : 'hsl(var(--accent))',
      color: disabled ? 'hsl(var(--muted))' : 'hsl(var(--primary-foreground))',
      border: '1px solid hsl(var(--accent) / 0.4)',
      borderRadius: 11, padding: '10px 20px', fontSize: 13,
      fontWeight: 600, fontFamily: 'Plus Jakarta Sans, sans-serif',
      cursor: disabled ? 'not-allowed' : 'pointer',
      boxShadow: disabled ? 'none' : '0 4px 18px hsl(var(--accent) / 0.25)',
      transition: 'all 0.15s ease',
    }}
    onMouseEnter={e => { if (!disabled) (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; }}
  >{children}</button>
);

const GhostBtn = ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1.5"
    style={{
      background: 'hsl(var(--surface2))',
      color: 'hsl(var(--text-secondary))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 10, padding: '8px 14px', fontSize: 12,
      fontFamily: 'Plus Jakarta Sans, sans-serif', cursor: 'pointer',
      transition: 'all 0.15s ease',
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLElement).style.background = 'hsl(var(--surface3))';
      (e.currentTarget as HTMLElement).style.color = 'hsl(var(--accent))';
      (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--accent) / 0.4)';
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLElement).style.background = 'hsl(var(--surface2))';
      (e.currentTarget as HTMLElement).style.color = 'hsl(var(--text-secondary))';
      (e.currentTarget as HTMLElement).style.borderColor = 'hsl(var(--border))';
    }}
  >{children}</button>
);

const GlassInput = (p: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...p}
    style={{
      background: 'hsl(var(--surface2))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 10, color: 'hsl(var(--text))',
      padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%',
      fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'border-color 0.2s',
    }}
    onFocus={e => (e.target.style.borderColor = 'hsl(var(--accent))')}
    onBlur={e => (e.target.style.borderColor = 'hsl(var(--border))')}
  />
);

const GlassTextarea = (p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...p}
    style={{
      background: 'hsl(var(--surface2))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 10, color: 'hsl(var(--text))',
      padding: '10px 14px', fontSize: 13, outline: 'none', width: '100%',
      fontFamily: 'Plus Jakarta Sans, sans-serif', transition: 'border-color 0.2s',
      resize: 'none',
    } as any}
    onFocus={e => (e.target.style.borderColor = 'hsl(var(--accent))')}
    onBlur={e => (e.target.style.borderColor = 'hsl(var(--border))')}
  />
);

function GoldBar({ pct }: { pct: number }) {
  return (
    <div style={{ height: 3, borderRadius: 99, background: 'hsl(var(--surface3))', overflow: 'hidden', marginTop: 10 }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        style={{ height: '100%', background: 'linear-gradient(90deg, hsl(var(--accent)), hsl(var(--success)))', borderRadius: 99 }}
      />
    </div>
  );
}

function badgeStyle(rating: number) {
  if (rating >= 3) return { bg: 'hsl(var(--success) / 0.12)', c: 'hsl(var(--success))', t: 'Mastered' };
  if (rating > 0)  return { bg: 'hsl(var(--warning) / 0.12)', c: 'hsl(var(--warning))',  t: 'Learning' };
  return { bg: 'hsl(var(--accent) / 0.1)', c: 'hsl(var(--accent))', t: 'New' };
}

// ─── DeckCard ─────────────────────────────────────────────────────────────────
function DeckCard({ d, idx, due, pct, mastered, onOpen, onDelete }: {
  d: Deck; idx: number; due: number; pct: number; mastered: number;
  onOpen: () => void; onDelete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.07 }}
    >
      <GlassCard onClick={onOpen} glowColor="hsl(var(--accent) / 0.18)" intensity={8} className="group cursor-pointer">
        <div className="gk-card-verse-accent">॥ अभ्यास ॥</div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <p className="font-display text-base font-semibold truncate" style={{ color: 'hsl(var(--text))' }}>{d.name}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--muted))', fontFamily: 'DM Mono', letterSpacing: '0.1em' }}>
              {d.subject.toUpperCase()} · {d.cards.length} CARDS
            </p>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
            style={{ color: 'hsl(var(--danger))', background: 'hsl(var(--danger) / 0.08)' }}
          ><Trash2 size={12} /></button>
        </div>
        <div className="flex items-center gap-4 mb-1">
          <span className="text-xs" style={{ color: 'hsl(var(--accent))', fontFamily: 'DM Mono' }}>
            {due} due
          </span>
          <span className="text-xs" style={{ color: 'hsl(var(--success))', fontFamily: 'DM Mono' }}>
            {mastered} mastered
          </span>
          <span className="text-xs ml-auto" style={{ color: 'hsl(var(--muted))', fontFamily: 'DM Mono' }}>
            {pct}%
          </span>
        </div>
        <GoldBar pct={pct} />
      </GlassCard>
    </motion.div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MAIN REVISION COMPONENT — ALL LOGIC UNCHANGED
// ════════════════════════════════════════════════════════════════════════════
const Revision = () => {
  const { user } = useApp();

  const [decks, setDecks] = useState<Deck[]>(() =>
    JSON.parse(localStorage.getItem('gurukul-flashcards') || '[]'));
  const [activeDeck, setActiveDeck]       = useState<string | null>(null);
  const [studyMode, setStudyMode]         = useState(false);
  const [currentCard, setCurrentCard]     = useState(0);
  const [flipped, setFlipped]             = useState(false);
  const [creating, setCreating]           = useState(false);
  const [newDeckName, setNewDeckName]     = useState('');
  const [newDeckSubject, setNewDeckSubject] = useState('');
  const [aiGenerating, setAiGenerating]   = useState(false);
  const [aiTopic, setAiTopic]             = useState('');
  const [aiSubject, setAiSubject]         = useState('');
  const [aiCount, setAiCount]             = useState(10);
  const [addingCard, setAddingCard]       = useState(false);
  const [newFront, setNewFront]           = useState('');
  const [newBack, setNewBack]             = useState('');

  // ── UNCHANGED LOGIC ────────────────────────────────────────────────────────
  const saveDecks = (d: Deck[]) => {
    setDecks(d); localStorage.setItem('gurukul-flashcards', JSON.stringify(d));
  };

  const deck = useMemo(() => decks.find(d => d.id === activeDeck), [decks, activeDeck]);

  const dueCards = useMemo(() => {
    if (!deck) return [];
    const now = Date.now();
    return deck.cards.filter(c => c.nextReview <= now || c.rating === 0);
  }, [deck]);

  const createDeck = () => {
    if (!newDeckName.trim()) return;
    const d: Deck = { id: Date.now().toString(), name: newDeckName.trim(), subject: newDeckSubject.trim() || 'General', cards: [], lastStudied: 0 };
    saveDecks([...decks, d]); setNewDeckName(''); setNewDeckSubject(''); setCreating(false);
    toast.success('Deck created!');
  };

  const deleteDeck = (id: string) => {
    saveDecks(decks.filter(d => d.id !== id)); if (activeDeck === id) setActiveDeck(null);
  };

  const addCard = () => {
    if (!newFront.trim() || !newBack.trim() || !deck) return;
    const card: Flashcard = { id: Date.now().toString(), front: newFront.trim(), back: newBack.trim(), rating: 0, nextReview: 0, reviewCount: 0, interval: 0 };
    const updated = decks.map(d => d.id === deck.id ? { ...d, cards: [...d.cards, card] } : d);
    saveDecks(updated); setNewFront(''); setNewBack(''); setAddingCard(false);
    toast.success('Card added!');
  };

  const generateAICards = useCallback(async () => {
    if (!aiSubject.trim() || !aiTopic.trim()) { toast.error('Enter subject and topic'); return; }
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-learning', {
        body: { subject: aiSubject, subtopic: aiTopic, mode: 'flashcards', numQuestions: aiCount },
      });
      if (error) throw error;
      const result = data?.result;
      if (Array.isArray(result) && result.length > 0) {
        const cards: Flashcard[] = result.map((item: any, i: number) => ({
          id: `ai-${Date.now()}-${i}`, front: item.front || item.question || `Concept ${i + 1}`,
          back: item.back || item.answer || 'Review your notes for this concept.',
          rating: 0, nextReview: 0, reviewCount: 0, interval: 0,
        }));
        const d: Deck = { id: Date.now().toString(), name: `${aiSubject} — ${aiTopic}`, subject: aiSubject, cards, lastStudied: 0 };
        saveDecks([...decks, d]); setAiTopic(''); setAiSubject('');
        toast.success(`Created deck with ${cards.length} flashcards!`);
      } else { toast.error('Could not generate flashcards. Try a different topic.'); }
    } catch (err: any) { toast.error(err.message || 'Failed to generate'); }
    finally { setAiGenerating(false); }
  }, [aiSubject, aiTopic, aiCount, decks]);

  const rateCard = (rating: 1 | 2 | 3 | 4) => {
    if (!deck) return;
    const card = dueCards[currentCard]; if (!card) return;
    const intervals = { 1: 1, 2: 10, 3: 1440, 4: 5760 };
    const nextReview = Date.now() + intervals[rating] * 60000;
    const updated = decks.map(d => d.id === deck.id ? {
      ...d, lastStudied: Date.now(),
      cards: d.cards.map(c => c.id === card.id ? { ...c, rating, nextReview, reviewCount: c.reviewCount + 1, interval: intervals[rating] / 1440 } : c),
    } : d);
    saveDecks(updated); setFlipped(false);
    if (currentCard < dueCards.length - 1) setCurrentCard(prev => prev + 1);
    else { setStudyMode(false); setCurrentCard(0); toast.success('Session complete! 🌿'); }
  };

  // ── STUDY MODE ──────────────────────────────────────────────────────────────
  if (studyMode && deck && dueCards.length > 0) {
    const card = dueCards[currentCard];
    if (!card) { setStudyMode(false); return null; }

    return (
      <div className="relative min-h-screen">
        <WellnessBackground focusMode={true} />
        <div className="gk-fog-layer" />
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="fixed inset-0 z-10 flex flex-col items-center justify-center p-6"
        >
          <button
            onClick={() => { setStudyMode(false); setCurrentCard(0); setFlipped(false); }}
            className="absolute top-6 left-6 flex items-center gap-2 text-sm"
            style={{ color: 'hsl(var(--text-secondary))', fontFamily: 'Plus Jakarta Sans' }}
          >
            <ArrowLeft size={15} /> Back
          </button>

          <div className="absolute top-6 right-6 text-xs"
            style={{ color: 'hsl(var(--muted))', fontFamily: 'DM Mono', letterSpacing: '0.12em' }}>
            {deck.name}
          </div>

          {/* Progress bar */}
          <div className="w-full max-w-lg mb-8">
            <div className="flex justify-between text-xs mb-2" style={{ color: 'hsl(var(--muted))', fontFamily: 'DM Mono' }}>
              <span>{currentCard + 1} / {dueCards.length}</span>
              <span>{Math.round((currentCard / dueCards.length) * 100)}%</span>
            </div>
            <div className="flex gap-1">
              {dueCards.map((_, i) => (
                <div key={i} className="flex-1 rounded-full" style={{
                  height: 3,
                  background: i < currentCard
                    ? 'hsl(var(--accent))'
                    : i === currentCard
                    ? 'hsl(var(--accent) / 0.3)'
                    : 'hsl(var(--border))',
                  transition: 'all 0.3s ease',
                }} />
              ))}
            </div>
          </div>

          {/* Flashcard flip */}
          <div className="w-full max-w-lg cursor-pointer" style={{ perspective: 1000 }}
            onClick={() => setFlipped(!flipped)}>
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.55, type: 'spring', stiffness: 90, damping: 18 }}
              style={{ transformStyle: 'preserve-3d', position: 'relative', width: '100%', minHeight: 270 }}
            >
              {/* Front */}
              <div style={{
                position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                background: 'hsl(var(--surface) / 0.85)', backdropFilter: 'blur(24px)',
                border: '1px solid hsl(var(--border-strong))', borderRadius: 22,
                boxShadow: '0 24px 64px rgba(0,0,0,0.12)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '44px 36px', minHeight: 270,
              }}>
                <div style={{ fontSize: 8, letterSpacing: '0.35em', color: 'hsl(var(--muted))', fontFamily: 'DM Mono', marginBottom: 22 }}>
                  ✦ QUESTION ✦
                </div>
                <p style={{ fontFamily: "'Fraunces', serif", fontSize: 21, lineHeight: 1.65, color: 'hsl(var(--text))', textAlign: 'center' }}>
                  {card.front}
                </p>
                <div style={{ marginTop: 30, fontSize: 9, color: 'hsl(var(--muted))', fontFamily: 'DM Mono', letterSpacing: '0.12em' }}>
                  tap to reveal answer
                </div>
              </div>

              {/* Back */}
              <div style={{
                position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
                background: 'hsl(var(--accent) / 0.06)', backdropFilter: 'blur(24px)',
                border: '1px solid hsl(var(--accent) / 0.22)', borderRadius: 22,
                boxShadow: '0 24px 64px rgba(0,0,0,0.10)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '44px 36px', minHeight: 270,
              }}>
                <div style={{ fontSize: 8, letterSpacing: '0.35em', color: 'hsl(var(--accent) / 0.55)', fontFamily: 'DM Mono', marginBottom: 22 }}>
                  ✦ ANSWER ✦
                </div>
                <p style={{ fontFamily: "'Fraunces', serif", fontSize: 19, lineHeight: 1.7, color: 'hsl(var(--text))', textAlign: 'center' }}>
                  {card.back}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Rating buttons */}
          <AnimatePresence>
            {flipped && (
              <motion.div
                initial={{ opacity: 0, y: 22 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="flex gap-3 mt-7 w-full max-w-lg"
              >
                {[
                  { r: 1 as const, label: 'Again', color: 'hsl(var(--danger))',   time: '1 min',  bg: 'hsl(var(--danger) / 0.1)'  },
                  { r: 2 as const, label: 'Hard',  color: 'hsl(var(--warning))',  time: '10 min', bg: 'hsl(var(--warning) / 0.1)' },
                  { r: 3 as const, label: 'Good',  color: 'hsl(var(--success))',  time: '1 day',  bg: 'hsl(var(--success) / 0.1)' },
                  { r: 4 as const, label: 'Easy',  color: 'hsl(var(--accent))',   time: '4 days', bg: 'hsl(var(--accent) / 0.1)'  },
                ].map(b => (
                  <button key={b.r} onClick={() => rateCard(b.r)}
                    className="flex-1 py-3 px-2 rounded-2xl text-center"
                    style={{
                      background: b.bg,
                      border: `1px solid ${b.color.replace(')', ' / 0.25)')}`,
                      backdropFilter: 'blur(10px)', transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px) scale(1.04)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.transform = '';
                    }}>
                    <p className="text-sm font-semibold" style={{ color: b.color }}>{b.label}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: b.color, opacity: 0.55, fontFamily: 'DM Mono' }}>{b.time}</p>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }

  // ── DECK DETAIL ─────────────────────────────────────────────────────────────
  if (activeDeck && deck) {
    const mastered  = deck.cards.filter(c => c.rating >= 3).length;
    const learning  = deck.cards.filter(c => c.rating > 0 && c.rating < 3).length;
    const newCards  = deck.cards.filter(c => c.rating === 0).length;

    return (
      <div className="relative min-h-screen">
        <WellnessBackground focusMode={false} />
        <div className="gk-fog-layer" />
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
          className="relative z-10 max-w-3xl mx-auto px-4 py-8 space-y-5"
        >
          <button
            onClick={() => setActiveDeck(null)}
            className="flex items-center gap-1.5 text-xs mb-2"
            style={{ color: 'hsl(var(--text-secondary))', fontFamily: 'DM Mono', letterSpacing: '0.1em' }}
          >
            <ArrowLeft size={13} /> ALL DECKS
          </button>

          {/* Header card */}
          <GlassCard glowColor="hsl(var(--accent) / 0.22)" intensity={5}>
            <div className="gk-card-verse-accent">॥ विद्या ॥</div>
            <h2 className="font-display text-2xl font-bold mb-1" style={{ color: 'hsl(var(--text))' }}>{deck.name}</h2>
            <p className="text-xs mb-5" style={{ color: 'hsl(var(--muted))', fontFamily: 'DM Mono', letterSpacing: '0.12em' }}>
              {deck.subject.toUpperCase()} · {deck.cards.length} CARDS
            </p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { n: mastered, label: 'Mastered', color: 'hsl(var(--success))' },
                { n: learning, label: 'Learning',  color: 'hsl(var(--warning))'  },
                { n: newCards, label: 'New',        color: 'hsl(var(--accent))'   },
              ].map(({ n, label, color }) => (
                <div key={label} className="text-center py-3 rounded-xl"
                  style={{ background: 'hsl(var(--surface2))', border: '1px solid hsl(var(--border))' }}>
                  <p className="text-xl font-bold" style={{ color, fontFamily: 'DM Mono' }}>{n}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'hsl(var(--muted))', letterSpacing: '0.1em' }}>
                    {label.toUpperCase()}
                  </p>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <PrimaryBtn
                onClick={() => { setStudyMode(true); setCurrentCard(0); setFlipped(false); }}
                disabled={dueCards.length === 0}
                full
              >
                <BookOpen size={14} /> Study Session ({dueCards.length} due)
              </PrimaryBtn>
              <GhostBtn onClick={() => setAddingCard(true)}><Plus size={14} /></GhostBtn>
            </div>
          </GlassCard>

          {/* Add card */}
          <AnimatePresence>
            {addingCard && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <GlassCard glowColor="hsl(var(--accent) / 0.14)">
                  <Label>Add New Card</Label>
                  <div className="space-y-3">
                    <GlassInput value={newFront} onChange={e => setNewFront(e.target.value)} placeholder="Question / Front side" />
                    <GlassTextarea value={newBack} onChange={e => setNewBack(e.target.value)} placeholder="Answer / Back side" rows={3} />
                    <div className="flex gap-2">
                      <PrimaryBtn onClick={addCard}>Add Card</PrimaryBtn>
                      <GhostBtn onClick={() => { setAddingCard(false); setNewFront(''); setNewBack(''); }}>Cancel</GhostBtn>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cards list */}
          {deck.cards.length > 0 && (
            <GlassCard glowColor="hsl(var(--accent) / 0.10)">
              <Label>Cards in this Deck</Label>
              <div className="space-y-2">
                {deck.cards.map((c, i) => {
                  const b = badgeStyle(c.rating);
                  return (
                    <motion.div
                      key={c.id}
                      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: 'hsl(var(--surface2))', border: '1px solid hsl(var(--border))' }}
                    >
                      <span className="w-5 text-center text-xs" style={{ color: 'hsl(var(--muted))', fontFamily: 'DM Mono' }}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'hsl(var(--text))' }}>{c.front}</p>
                        <p className="text-xs truncate mt-0.5" style={{ color: 'hsl(var(--muted))' }}>{c.back}</p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                        style={{ background: b.bg, color: b.c, letterSpacing: '0.04em' }}>{b.t}</span>
                    </motion.div>
                  );
                })}
              </div>
            </GlassCard>
          )}
        </motion.div>
      </div>
    );
  }

  // ── HUB VIEW ────────────────────────────────────────────────────────────────
  const totalCards    = decks.reduce((a, d) => a + d.cards.length, 0);
  const totalDue      = decks.reduce((a, d) => a + d.cards.filter(c => c.nextReview <= Date.now() || c.rating === 0).length, 0);
  const totalMastered = decks.reduce((a, d) => a + d.cards.filter(c => c.rating >= 3).length, 0);

  return (
    <div className="relative min-h-screen">
      <WellnessBackground focusMode={false} />
      <div className="gk-fog-layer" />

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
        className="relative z-10 max-w-4xl mx-auto px-4 py-8 space-y-6"
      >

        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: -18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="flex items-center gap-8 flex-wrap"
        >
          <AnimatedBook />
          <div>
            <div style={{
              fontSize: 9, letterSpacing: '0.3em', textTransform: 'uppercase',
              color: 'hsl(var(--accent) / 0.55)', fontFamily: 'DM Mono', marginBottom: 6,
            }}>
              ✦ STUDY OS MINDFUL ✦
            </div>
            <h1 className="font-display" style={{
              fontSize: 'clamp(24px,4vw,38px)', fontWeight: 700, lineHeight: 1.15,
              background: 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(var(--text)) 60%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Revision Hub
            </h1>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: 13, marginTop: 5, fontFamily: 'Plus Jakarta Sans' }}>
              Spaced repetition for long-term memory
            </p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 11, color: 'hsl(var(--muted))', letterSpacing: '0.14em', marginTop: 5 }}>
              श्रुतं मे गोपय नित्यम् — Preserve what you have heard
            </p>
          </div>
        </motion.div>

        {/* ── Stats row ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-3"
        >
          {[
            { v: totalDue,      label: 'Due Today', color: 'hsl(var(--accent))'  },
            { v: totalMastered, label: 'Mastered',  color: 'hsl(var(--success))' },
            { v: totalCards,    label: 'Total',     color: 'hsl(var(--text))'    },
          ].map(({ v, label, color }) => (
            <GlassCard key={label} glowColor="hsl(var(--accent) / 0.10)" intensity={6} className="!p-0">
              <div className="flex flex-col items-center justify-center py-4 px-2">
                <span className="text-2xl font-bold" style={{ color, fontFamily: 'DM Mono' }}>{v}</span>
                <span className="text-[10px] mt-1 uppercase tracking-widest" style={{ color: 'hsl(var(--muted))' }}>{label}</span>
              </div>
            </GlassCard>
          ))}
        </motion.div>

        {/* ── AI Generator ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <GlassCard glowColor="hsl(var(--accent) / 0.16)" intensity={5}>
            <div className="gk-card-verse-accent">॥ विद्या ॥</div>
            <Label>AI Flashcard Generator</Label>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={15} style={{ color: 'hsl(var(--accent))' }} />
              <span style={{ fontFamily: "'Fraunces', serif", color: 'hsl(var(--text))', fontSize: 15, fontWeight: 600 }}>
                Generate from any topic
              </span>
            </div>
            <div className="flex gap-2 mb-3">
              <GlassInput value={aiSubject} onChange={e => setAiSubject(e.target.value)} placeholder="Subject (e.g. Physics)" />
              <GlassInput value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="Topic (e.g. Newton's Laws)" />
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span style={{ fontSize: 10, color: 'hsl(var(--muted))', fontFamily: 'DM Mono', letterSpacing: '0.1em' }}>CARDS:</span>
              {[5, 10, 15, 20].map(n => (
                <button key={n} onClick={() => setAiCount(n)} className="px-3 py-1 rounded-lg text-xs font-medium"
                  style={{
                    background: aiCount === n ? 'hsl(var(--accent) / 0.14)' : 'hsl(var(--surface2))',
                    border: `1px solid ${aiCount === n ? 'hsl(var(--accent) / 0.42)' : 'hsl(var(--border))'}`,
                    color: aiCount === n ? 'hsl(var(--accent))' : 'hsl(var(--muted))',
                    fontFamily: 'DM Mono', transition: 'all 0.15s ease', cursor: 'pointer',
                  }}>{n}</button>
              ))}
            </div>
            <PrimaryBtn
              onClick={generateAICards}
              disabled={aiGenerating || !aiSubject.trim() || !aiTopic.trim()}
              full
            >
              {aiGenerating
                ? <><Loader2 size={13} className="animate-spin" /> Generating wisdom...</>
                : <><Sparkles size={13} /> Generate {aiCount} Flashcards</>}
            </PrimaryBtn>
          </GlassCard>
        </motion.div>

        {/* ── My Decks ── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <Label>Your Collection</Label>
              <h3 className="font-display text-lg font-semibold" style={{ color: 'hsl(var(--text))' }}>My Decks</h3>
            </div>
            <GhostBtn onClick={() => setCreating(true)}><Plus size={13} /> New Deck</GhostBtn>
          </div>

          <AnimatePresence>
            {creating && (
              <motion.div initial={{ opacity: 0, y: -10, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0 }} className="mb-4">
                <GlassCard glowColor="hsl(var(--accent) / 0.14)">
                  <Label>New Deck</Label>
                  <div className="space-y-3">
                    <GlassInput value={newDeckName} onChange={e => setNewDeckName(e.target.value)} placeholder="Deck name" />
                    <GlassInput value={newDeckSubject} onChange={e => setNewDeckSubject(e.target.value)} placeholder="Subject" />
                    <div className="flex gap-2">
                      <PrimaryBtn onClick={createDeck}>Create Deck</PrimaryBtn>
                      <GhostBtn onClick={() => setCreating(false)}>Cancel</GhostBtn>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          {decks.length === 0 ? (
            <GlassCard glowColor="hsl(var(--accent) / 0.08)">
              <div className="text-center py-8">
                <div style={{ fontSize: 38, opacity: 0.18, marginBottom: 14 }}>📚</div>
                <p style={{ fontFamily: "'Fraunces', serif", color: 'hsl(var(--text-secondary))', fontSize: 16 }}>No decks yet</p>
                <p style={{ color: 'hsl(var(--muted))', fontSize: 12, marginTop: 6 }}>Create one manually or generate with AI</p>
              </div>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {decks.map((d, idx) => {
                const due      = d.cards.filter(c => c.nextReview <= Date.now() || c.rating === 0).length;
                const mastered = d.cards.filter(c => c.rating >= 3).length;
                const pct      = d.cards.length > 0 ? Math.round((mastered / d.cards.length) * 100) : 0;
                return (
                  <DeckCard key={d.id} d={d} idx={idx} due={due} pct={pct} mastered={mastered}
                    onOpen={() => setActiveDeck(d.id)} onDelete={() => deleteDeck(d.id)} />
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Footer */}
        <div className="pt-2 flex justify-center">
          <p className="gk-sanskrit-strip">॥ सा विद्या या विमुक्तये ॥ That is true knowledge which liberates ॥</p>
        </div>

      </motion.div>
    </div>
  );
};

export default Revision;