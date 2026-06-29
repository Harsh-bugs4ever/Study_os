import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { Award, Flame, Target, BookOpen, Clock, TrendingUp, BarChart3, Brain, Trophy, Zap, Heart, Activity, Moon, Sun, Droplets, Dumbbell, PenLine, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownRight, FileText, Search, Star, Shield, Gamepad2, Users, Sparkles, Calendar, CheckCircle2, ChevronLeft, ChevronRight, Smile, Frown, Meh, AlertCircle, Loader2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, Cell, AreaChart, Area } from 'recharts';
import { GyanBackground } from '@/components/profile/GyanBackground';
import { GlassCard } from '@/components/profile/GlassCard';
import { GyanChakra } from '@/components/profile/GyanChakra';



// --- Badge data with categories ---
const allBadges = [
  { id: 'onFire', icon: <Flame size={18}/>, label: 'On Fire', desc: '5 correct in a row', earned: true, category: 'study' },
  { id: 'comebackKid', icon: <Shield size={18}/>, label: 'Comeback Kid', desc: 'Improved after failing', earned: true, category: 'study' },
  { id: 'nightOwl', icon: <Moon size={18}/>, label: 'Night Owl', desc: 'Studied after 10pm', earned: true, category: 'study' },
  { id: 'earlyBird', icon: <Sun size={18}/>, label: 'Early Bird', desc: 'Studied before 8am', earned: false, category: 'study' },
  { id: 'bigBrain', icon: <Brain size={18}/>, label: 'Big Brain', desc: '100% on hard', earned: false, category: 'study' },
  { id: 'bossSlayer', icon: <Zap size={18}/>, label: 'Boss Slayer', desc: '10 bosses defeated', earned: false, category: 'study' },
  { id: 'focusMaster', icon: <Target size={18}/>, label: 'Focus Master', desc: '5 Pomodoros in one day', earned: false, category: 'study' },
  { id: 'firstFlash', icon: <BookOpen size={18}/>, label: 'First Flashcard', desc: 'Created first card', earned: true, category: 'revision' },
  { id: '100cards', icon: <BarChart3 size={18}/>, label: '100 Cards', desc: 'Reviewed 100 cards', earned: false, category: 'revision' },
  { id: 'deckMaster', icon: <Award size={18}/>, label: 'Deck Master', desc: 'Mastered a full deck', earned: false, category: 'revision' },
  { id: 'firstBreath', icon: <Heart size={18}/>, label: 'First Breathing', desc: 'Completed breathing', earned: true, category: 'wellbeing' },
  { id: 'moodStreak7', icon: <Activity size={18}/>, label: '7-Day Mood', desc: '7-day mood streak', earned: false, category: 'wellbeing' },
  { id: 'cbtChamp', icon: <Brain size={18}/>, label: 'CBT Champion', desc: '10 CBT exercises', earned: false, category: 'wellbeing' },
  { id: 'zenMaster', icon: <Star size={18}/>, label: 'Zen Master', desc: '30 wellness activities', earned: false, category: 'wellbeing' },
  { id: 'firstRoom', icon: <Users size={18}/>, label: 'First Room', desc: 'Joined a study room', earned: true, category: 'social' },
  { id: 'helped10', icon: <Sparkles size={18}/>, label: 'Peer Helper', desc: 'Helped 10 peers', earned: false, category: 'social' },
  { id: 'resilient', icon: <Shield size={18}/>, label: 'Resilient', desc: 'Session with low wellbeing', earned: true, category: 'study' },
];

const moodLevels = [
  { label: 'No Data', color: 'hsl(var(--surface3))', icon: null },
  { label: 'Bad', color: 'hsl(0 55% 50%)', icon: <Frown size={12} /> },
  { label: 'Stressed', color: 'hsl(25 65% 52%)', icon: <AlertCircle size={12} /> },
  { label: 'Okay', color: 'hsl(45 70% 50%)', icon: <Meh size={12} /> },
  { label: 'Good', color: 'hsl(100 45% 45%)', icon: <Smile size={12} /> },
  { label: 'Great', color: 'hsl(150 50% 38%)', icon: <Heart size={12} /> },
];

// Leaderboard component for Profile
const ProfileLeaderboard = ({ user, navigate }: { user: any; navigate: any }) => {
  const [lb, setLb] = useState<{ name: string; xp: number; isCurrentUser: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profiles } = await supabase.from('profiles').select('id, name, xp').order('xp', { ascending: false }).limit(10);
      if (profiles) {
        setLb(profiles.map(p => ({
          name: p.name || 'Student', xp: p.xp || 0, isCurrentUser: p.id === session?.user?.id,
        })));
      }
      setLoading(false);
    };
    load();
  }, []);

  const GOLD_LB    = 'hsl(var(--accent))';
  const TEXT_LB    = 'hsl(var(--text))';
  const TEXT_DIM_LB = 'hsl(var(--text-secondary))';

  return (
    <div>
      <h3 style={{ color: GOLD_LB, fontSize: 13, fontWeight: 700, fontFamily: 'serif', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Trophy size={14} color="#FB923C" /> श्रेष्ठ छात्र — Leaderboard
      </h3>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
          <Loader2 size={14} style={{ color: GOLD_LB, animation: 'spin 1s linear infinite' }} />
        </div>
      ) : lb.length === 0 ? (
        <p style={{ color: TEXT_DIM_LB, fontSize: 10, textAlign: 'center', padding: '12px 0' }}>No rankings yet</p>
      ) : (
        <>
          {lb.slice(0, 5).map((p, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 10, marginBottom: 4,
                background: p.isCurrentUser ? 'hsl(var(--accent) / 0.08)' : 'transparent',
                borderLeft: p.isCurrentUser ? '2px solid hsl(var(--accent))' : '2px solid transparent',
              }}
            >
              <span style={{ width: 18, fontSize: 11, color: i < 3 ? '#FB923C' : TEXT_DIM_LB, fontWeight: 700, textAlign: 'center', flexShrink: 0 }}>
                {i === 0 ? '🏆' : `#${i + 1}`}
              </span>
              <span style={{ flex: 1, fontSize: 11, color: TEXT_LB, fontFamily: 'serif' }}>
                {p.isCurrentUser ? `${p.name} (You)` : p.name}
              </span>
              <span style={{ fontSize: 10, color: GOLD_LB, fontWeight: 700 }}>{p.xp} XP</span>
            </motion.div>
          ))}
          <button onClick={() => navigate('/social')}
            style={{
              width: '100%', padding: '7px', marginTop: 8,
              background: 'hsl(var(--accent) / 0.07)', border: '1px solid hsl(var(--accent) / 0.2)',
              borderRadius: 10, color: TEXT_DIM_LB, fontSize: 10, cursor: 'pointer',
              fontFamily: 'serif', transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--accent) / 0.14)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'hsl(var(--accent) / 0.07)')}
          >
            View Full Rankings →
          </button>
        </>
      )}
    </div>
  );
};

const Profile = () => {
  const { user, setUser } = useApp();
  const { recoveryMode } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'quests' | 'wellbeing'>('overview');
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [moodRange, setMoodRange] = useState<'7d' | '30d'>('7d');
  const [calendarView, setCalendarView] = useState<'week' | 'month' | '3month'>('month');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [showQuestHistory, setShowQuestHistory] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const [wellbeingSubTab, setWellbeingSubTab] = useState<'activity' | 'journal'>('activity');
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  // --- Data ---
  const pulseData = useMemo(() => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({
    day: d, focus: Math.floor(30+Math.random()*70), accuracy: Math.floor(40+Math.random()*55), energy: Math.floor(20+Math.random()*80),
  })), []);

  const subjectData = useMemo(() => {
    const subs = user.subjects.length > 0 ? user.subjects : ['Physics','Chemistry','Mathematics'];
    return subs.map(s => ({
      subject: s.slice(0,4), fullName: s,
      completion: Math.floor(15+Math.random()*70), quizzes: Math.floor(2+Math.random()*15),
      accuracy: Math.floor(40+Math.random()*50), timeSpent: `${Math.floor(1+Math.random()*8)}h ${Math.floor(Math.random()*59)}m`,
      topicsCompleted: Math.floor(1+Math.random()*12), streak: Math.floor(1+Math.random()*7), rank: Math.floor(1+Math.random()*20),
      topics: [
        { name: 'Basics', quizzes: 3, accuracy: 85, mastery: 'high', lastAttempted: '2d ago', status: 'high' },
        { name: 'Intermediate', quizzes: 5, accuracy: 62, mastery: 'medium', lastAttempted: '1d ago', status: 'medium' },
        { name: 'Advanced', quizzes: 2, accuracy: 40, mastery: 'low', lastAttempted: '5d ago', status: 'low' },
        { name: 'Applications', quizzes: 1, accuracy: 55, mastery: 'medium', lastAttempted: '3d ago', status: 'medium' },
        { name: 'Practice Sets', quizzes: 4, accuracy: 72, mastery: 'high', lastAttempted: '1d ago', status: 'high' },
        { name: 'Revision', quizzes: 2, accuracy: 30, mastery: 'low', lastAttempted: '7d ago', status: 'low' },
      ],
      strengths: ['Basics', 'Formulas', 'Theory'],
      weaknesses: ['Problem Solving', 'Applications', 'Proofs'],
    }));
  }, [user.subjects]);

  const radarData = useMemo(() => [
    { skill: 'Accuracy', value: 72 }, { skill: 'Speed', value: 58 }, { skill: 'Consistency', value: 85 },
    { skill: 'Retention', value: 63 }, { skill: 'Focus', value: 70 }, { skill: 'Resilience', value: 78 },
  ], []);

  const learnHistory = JSON.parse(localStorage.getItem('saathi-learn-history') || '[]');
  const completedTopics = learnHistory.filter((h: any) => h.completed).length;

  // Leaderboard is now on Social page - removed hardcoded data

  const moodData = useMemo(() => {
    const days = moodRange === '7d' ? 7 : 30;
    return Array.from({ length: days }, (_, i) => ({
      day: `D${i + 1}`, mood: Math.floor(2 + Math.random() * 3), burnout: Math.floor(20 + Math.random() * 50),
    }));
  }, [moodRange]);

  // Calendar data - generate for 3 months
  const calendarData = useMemo(() => {
    const data: Record<string, { mood: number; note: string; sleep: number; anxiety: number; focus: number; exercises: string[] }> = {};
    for (let m = -2; m <= 0; m++) {
      const month = new Date(calendarYear, calendarMonth + m, 1);
      const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${month.getFullYear()}-${month.getMonth()}-${d}`;
        const logged = Math.random() > 0.25;
        data[key] = {
          mood: logged ? Math.floor(1 + Math.random() * 5) : 0,
          note: logged && Math.random() > 0.6 ? ['Felt good after breathing', 'Stressed about exam', 'Great study session', 'Tired but productive'][Math.floor(Math.random() * 4)] : '',
          sleep: logged ? Math.floor(4 + Math.random() * 5) : 0,
          anxiety: logged ? Math.floor(1 + Math.random() * 9) : 0,
          focus: logged ? Math.floor(1 + Math.random() * 5) : 0,
          exercises: logged && Math.random() > 0.5 ? ['Breathing', 'CBT'].slice(0, Math.floor(1 + Math.random() * 2)) : [],
        };
      }
    }
    return data;
  }, [calendarMonth, calendarYear]);

  const sleepData = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ day: `D${i+1}`, hours: 5 + Math.random() * 3 })), []);
  const anxietyData = useMemo(() => Array.from({ length: 7 }, (_, i) => ({ day: `D${i+1}`, level: 2 + Math.random() * 6 })), []);
  const habitData = useMemo(() => ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({ day: d, pct: Math.floor(30 + Math.random() * 70) })), []);

  const recentActivities = [
    { icon: <Target size={14}/>, text: 'Completed Physics quiz — 80%', time: '2h ago' },
    { icon: <Heart size={14}/>, text: 'Breathing exercise completed', time: '3h ago' },
    { icon: <BookOpen size={14}/>, text: 'Reviewed 12 flashcards', time: '5h ago' },
    { icon: <Brain size={14}/>, text: 'CBT thought reframe done', time: '6h ago' },
    { icon: <Flame size={14}/>, text: 'Streak extended to 7 days!', time: 'Yesterday' },
  ];

  const wellbeingActivities = [
    { text: '4-7-8 Breathing', time: '2h ago', type: 'breathing' },
    { text: 'CBT Thought Reframe', time: '5h ago', type: 'cbt' },
    { text: '25min Focus Session', time: '6h ago', type: 'focus' },
    { text: 'Mood check-in: Good', time: 'Yesterday', type: 'mood' },
    { text: '5-4-3-2-1 Grounding', time: '2d ago', type: 'grounding' },
  ];

  const journalEntries = [
    { mood: 'Good', moodIcon: <Smile size={12} />, note: 'Good study session, felt productive', time: 'Today 2:30 PM', sleep: 7, anxiety: 3 },
    { mood: 'Okay', moodIcon: <Meh size={12} />, note: 'Average day, a bit tired', time: 'Yesterday 9 PM', sleep: 6, anxiety: 5 },
    { mood: 'Bad', moodIcon: <Frown size={12} />, note: 'Stressed about exam prep', time: '2 days ago', sleep: 5, anxiety: 7 },
    { mood: 'Good', moodIcon: <Smile size={12} />, note: 'Great score on practice test!', time: '3 days ago', sleep: 8, anxiety: 2 },
  ];

  const weeklyQuests = [
    { title: 'Complete 5 quizzes', progress: 3, total: 5, xp: 50 },
    { title: 'Defeat 2 bosses', progress: 1, total: 2, xp: 40 },
    { title: 'Study 3 subjects', progress: 2, total: 3, xp: 30 },
    { title: 'Maintain 3-day streak', progress: Math.min(user.streak, 3), total: 3, xp: 35 },
    { title: '5 Pomodoro sessions', progress: 2, total: 5, xp: 45 },
  ];

  const dailyQuests = [
    { title: 'Review 10 flashcards', progress: 4, total: 10, xp: 15 },
    { title: 'Log your mood', progress: 1, total: 1, xp: 5 },
    { title: 'Do breathing exercise', progress: 0, total: 1, xp: 10 },
    { title: 'Complete 1 quiz', progress: 0, total: 1, xp: 20 },
  ];

  const milestoneQuests = [
    { title: 'Review 500 flashcards', progress: 87, total: 500, xp: 200 },
    { title: '30-day streak', progress: user.streak, total: 30, xp: 300 },
    { title: 'Master 10 topics', progress: completedTopics, total: 10, xp: 250 },
  ];

  const questHistory = [
    { title: 'Complete 3 quizzes', date: '2 days ago', xp: 30 },
    { title: 'First breathing exercise', date: '3 days ago', xp: 10 },
    { title: '3-day streak', date: '4 days ago', xp: 35 },
  ];

  // Calendar helpers
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(calendarYear, calendarMonth, 1).getDay() + 6) % 7; // Mon=0
  const today = new Date();
  const isToday = (d: number) => today.getDate() === d && today.getMonth() === calendarMonth && today.getFullYear() === calendarYear;

  const calendarStats = useMemo(() => {
    let logged = 0, moodSum = 0, bestDay = 1, bestMood = 0, streak = 0, maxStreak = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${calendarYear}-${calendarMonth}-${d}`;
      const entry = calendarData[key];
      if (entry && entry.mood > 0) {
        logged++;
        moodSum += entry.mood;
        if (entry.mood > bestMood) { bestMood = entry.mood; bestDay = d; }
        streak++;
        if (streak > maxStreak) maxStreak = streak;
      } else { streak = 0; }
    }
    const avgMood = logged > 0 ? moodSum / logged : 0;
    return { logged, avgMood, bestDay, maxStreak };
  }, [calendarData, daysInMonth, calendarMonth, calendarYear]);

  const prevMonth = () => { if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(y => y - 1); } else setCalendarMonth(m => m - 1); setSelectedDay(null); };
  const nextMonth = () => { if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(y => y + 1); } else setCalendarMonth(m => m + 1); setSelectedDay(null); };

  const QuestCard = ({ q, i }: { q: typeof weeklyQuests[0]; i: number }) => {
    const done = q.progress >= q.total;
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
        className="p-2.5 rounded-xl" style={{ background: done ? 'hsl(var(--success) / 0.08)' : 'hsl(var(--surface2))' }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium" style={{ color: done ? 'hsl(var(--success))' : 'hsl(var(--text))' }}>
            {done ? '✓ ' : ''}{q.title}
          </span>
          <span className="stat-number text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}>+{q.xp}</span>
        </div>
        <div className="w-full h-1 rounded-full" style={{ background: 'hsl(var(--surface3))' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${(q.progress / q.total) * 100}%`, background: done ? 'hsl(var(--success))' : 'hsl(var(--accent))' }} />
        </div>
      </motion.div>
    );
  };

  // Render calendar grid
  const renderCalendarGrid = () => {
    const cells = [];
    const cellSize = calendarView === 'week' ? 40 : calendarView === '3month' ? 14 : 20;
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push(<div key={`empty-${i}`} style={{ width: cellSize, height: cellSize }} />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${calendarYear}-${calendarMonth}-${d}`;
      const entry = calendarData[key];
      const mood = entry?.mood || 0;
      const ml = moodLevels[mood];
      const isSelected = selectedDay === d;
      const isHov = hoveredDay === d;
      cells.push(
        <motion.div
          key={d}
          whileHover={{ scale: 1.2 }}
          onClick={() => setSelectedDay(selectedDay === d ? null : d)}
          onMouseEnter={() => setHoveredDay(d)}
          onMouseLeave={() => setHoveredDay(null)}
          style={{
            width: cellSize, height: cellSize, background: ml.color,
            opacity: mood === 0 ? 0.3 : 0.85, borderRadius: 4, cursor: 'pointer',
            boxShadow: isSelected
              ? '0 0 0 2px hsl(var(--accent)), 0 0 8px hsl(var(--accent) / 0.4)'
              : isToday(d) ? '0 0 0 1.5px hsl(var(--accent))' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', transition: 'box-shadow 0.2s',
          }}
        >
          {calendarView !== '3month' && (
            <span style={{ fontSize: 7, fontWeight: 500, position: 'absolute', top: 1, left: 2, color: mood > 0 ? 'rgba(255,255,255,0.85)' : 'hsl(var(--muted))' }}>{d}</span>
          )}
          {calendarView === 'week' && mood > 0 && ml.icon && (
            <span style={{ color: 'white', display: 'flex' }}>{ml.icon}</span>
          )}
          {isHov && mood > 0 && calendarView !== '3month' && (
            <div style={{ position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)', zIndex: 50, pointerEvents: 'none', minWidth: 120 }}>
              <div style={{ borderRadius: 10, padding: '6px 10px', background: 'hsl(var(--surface))', border: '1px solid hsl(var(--accent) / 0.25)', backdropFilter: 'blur(12px)' }}>
                <p style={{ fontSize: 9, fontWeight: 600, color: 'hsl(var(--text))', marginBottom: 2 }}>{monthNames[calendarMonth]} {d}</p>
                <p style={{ fontSize: 9, color: ml.color, display: 'flex', alignItems: 'center', gap: 3 }}>{ml.icon} {ml.label}</p>
                {entry?.note && <p style={{ fontSize: 8, marginTop: 2, color: 'hsl(var(--text-secondary))', fontStyle: 'italic' }}>{entry.note}</p>}
              </div>
            </div>
          )}
        </motion.div>
      );
    }
    return cells;
  };

  // ─── Color constants — use CSS variables so all 3 themes work ───────────────
  const GOLD      = 'hsl(var(--accent))';
  const GOLD_DIM  = 'hsl(var(--accent) / 0.7)';
  const GOLD_MUTED = 'hsl(var(--accent) / 0.35)';
  const TEXT_COLOR = 'hsl(var(--text))';
  const TEXT_DIM   = 'hsl(var(--text-secondary))';
  const BORDER     = 'hsl(var(--accent) / 0.18)';
  const SUCCESS_C  = 'hsl(var(--success))';
  const WARNING_C  = 'hsl(var(--warning))';
  const DANGER_C   = 'hsl(var(--danger))';
  const chartTooltipStyle = {
    background: 'hsl(var(--surface))',
    border: '1px solid hsl(var(--accent) / 0.25)',
    borderRadius: 12, fontSize: 10, color: 'hsl(var(--text))',
  };

  // ─── Animated number counter ────────────────────────────────────────────────
  const AnimatedNumber = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
    const [display, setDisplay] = useState(0);
    useEffect(() => {
      let frame: number;
      const start = Date.now();
      const dur = 900;
      const animate = () => {
        const t = Math.min((Date.now() - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        setDisplay(Math.round(value * eased));
        if (t < 1) frame = requestAnimationFrame(animate);
      };
      frame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frame);
    }, [value]);
    return <>{display}{suffix}</>;
  };

  // ─── Glow Progress Bar ──────────────────────────────────────────────────────
  const GlowBar = ({ value, max, color = GOLD, height = 6 }: { value: number; max: number; color?: string; height?: number }) => {
    const pct = Math.min((value / max) * 100, 100);
    return (
      <div style={{ width: '100%', height, borderRadius: height, background: 'hsl(var(--surface2))', position: 'relative' }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.23, 1, 0.32, 1] }}
          style={{
            height, borderRadius: height,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 10px ${color}60, 0 0 4px ${color}40`,
            position: 'relative',
          }}
        />
      </div>
    );
  };

  // ─── Section title ──────────────────────────────────────────────────────────
  const STitle = ({ icon, title, sk }: { icon: React.ReactNode; title: string; sk: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ color: GOLD, display: 'flex' }}>{icon}</span>
      <span style={{ color: TEXT_COLOR, fontSize: 13, fontWeight: 700, fontFamily: 'serif' }}>{title}</span>
      <span style={{ color: TEXT_DIM, fontSize: 10, fontFamily: 'serif', fontStyle: 'italic' }}>{sk}</span>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: 'transparent' }}>
      <GyanBackground />
      <div style={{ position: 'relative', zIndex: 10, maxWidth: 1000, margin: '0 auto', padding: '24px 16px 48px' }}>

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} style={{ marginBottom: 20 }}>
          <GlassCard style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', flexShrink: 0,
                background: 'radial-gradient(circle, hsl(var(--accent) / 0.2) 0%, rgba(255,140,20,0.1) 100%)',
                border: '2px solid hsl(var(--accent) / 0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700, color: GOLD, fontFamily: 'serif',
                boxShadow: '0 0 24px hsl(var(--accent) / 0.2)',
              }}>{user.name?.[0] || '?'}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <h2 style={{ color: TEXT_COLOR, fontSize: 20, fontWeight: 800, fontFamily: 'serif', margin: '0 0 2px' }}>{user.name || 'Student'}</h2>
                <p style={{ color: TEXT_DIM, fontSize: 11, fontFamily: 'serif', fontStyle: 'italic', margin: '0 0 10px' }}>
                  {user.heroTitle} · Level {user.heroLevel} · {user.examType?.toUpperCase()} · {user.subjects.join(', ')}
                </p>
                <div style={{ maxWidth: 280 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, color: TEXT_DIM }}>ज्ञान Points</span>
                    <span style={{ fontSize: 9, color: GOLD, fontWeight: 700 }}>{user.xp} / 500 XP</span>
                  </div>
                  <GlowBar value={user.xp} max={500} height={6} />
                </div>
              </div>
              <button onClick={() => { setUser(prev => ({ ...prev, onboardingComplete: false })); navigate('/onboarding'); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12,
                  background: 'hsl(var(--accent) / 0.08)', border: '1px solid hsl(var(--accent) / 0.25)',
                  color: GOLD, fontSize: 11, fontWeight: 600, fontFamily: 'serif', cursor: 'pointer',
                }}>
                <PenLine size={12} /> Edit Preferences
              </button>
            </div>
            <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,hsl(var(--accent) / 0.3),transparent)', margin: '18px 0 14px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
              {[
                { icon: <Flame size={18}/>, value: user.streak, suffix: 'd', label: 'Streak', color: WARNING_C },
                { icon: <Target size={18}/>, value: 78, suffix: '%', label: 'Accuracy', color: GOLD },
                { icon: <BookOpen size={18}/>, value: completedTopics, suffix: '', label: 'Topics', color: SUCCESS_C },
                { icon: <Trophy size={18}/>, override: '—', label: 'Rank', color: WARNING_C },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.07 }}
                  style={{ textAlign: 'center', padding: '12px 8px', borderRadius: 12, background: 'hsl(var(--accent) / 0.05)', border: '1px solid hsl(var(--accent) / 0.1)' }}>
                  <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{s.icon}</div>
                  <p style={{ color: TEXT_COLOR, fontSize: 16, fontWeight: 800, fontFamily: 'serif', margin: '0 0 2px' }}>
                    {(s as any).override ?? ((s as any).value != null ? <AnimatedNumber value={(s as any).value} suffix={(s as any).suffix ?? ''} /> : '—')}
                  </p>
                  <p style={{ color: TEXT_DIM, fontSize: 9, margin: 0 }}>{s.label}</p>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Gyana Chakra ── */}
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.3 }} style={{ marginBottom: 20 }}>
          <GlassCard style={{ padding: '28px 20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <h3 style={{ color: GOLD, fontSize: 16, fontWeight: 700, fontFamily: 'serif', margin: '0 0 2px', textShadow: '0 0 20px hsl(var(--accent) / 0.4)' }}>
                ⟨ ज्ञान चक्र ⟩ Gyana Chakra
              </h3>
              <p style={{ color: TEXT_DIM, fontSize: 10, fontFamily: 'serif', fontStyle: 'italic', margin: '0 0 8px' }}>
                Sacred Knowledge Wheel — Click a segment to navigate
              </p>
              <GyanChakra onSectionSelect={setActiveTab} activeTab={activeTab} />
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Tabs ── */}
        <div style={{
          display: 'flex', gap: 6, padding: 6, borderRadius: 16, marginBottom: 20,
          background: 'hsl(var(--surface) / 0.85)', backdropFilter: 'blur(12px)',
          border: '1px solid hsl(var(--accent) / 0.12)', position: 'sticky', top: 0, zIndex: 20,
        }}>
          {(['overview', 'subjects', 'quests', 'wellbeing'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              flex: 1, padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
              fontSize: 11, fontWeight: 600, fontFamily: 'serif', textTransform: 'capitalize',
              background: activeTab === tab ? 'linear-gradient(135deg,hsl(var(--accent) / 0.22),hsl(var(--accent) / 0.10))' : 'transparent',
              color: activeTab === tab ? GOLD : TEXT_DIM,
              border: activeTab === tab ? '1px solid hsl(var(--accent) / 0.3)' : '1px solid transparent',
              boxShadow: activeTab === tab ? '0 0 16px hsl(var(--accent) / 0.12)' : 'none',
              transition: 'all 0.2s',
            }}>
              {tab === 'overview' ? '✦ Overview' : tab === 'subjects' ? '📚 Subjects' : tab === 'quests' ? '⚔ Quests' : '🌿 Wellbeing'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ══ OVERVIEW ══ */}
          {activeTab === 'overview' && (
            <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <GlassCard style={{ padding: '18px 20px' }}>
                  <STitle icon={<TrendingUp size={14}/>} title="Learning Pulse" sk="अध्ययन तरंग" />
                  <div style={{ height: 160 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={pulseData}>
                        <XAxis dataKey="day" tick={{ fontSize: 9, fill: TEXT_DIM }} axisLine={false} tickLine={false} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <Line type="monotone" dataKey="focus" stroke={GOLD} strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="accuracy" stroke={SUCCESS_C} strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="energy" stroke={WARNING_C} strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
                    {[{ l: 'Focus', c: GOLD }, { l: 'Accuracy', c: SUCCESS_C }, { l: 'Energy', c: WARNING_C }].map(x => (
                      <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: x.c, boxShadow: `0 0 6px ${x.c}` }} />
                        <span style={{ fontSize: 9, color: TEXT_DIM }}>{x.l}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
                <GlassCard style={{ padding: '18px 20px' }}>
                  <STitle icon={<Brain size={14}/>} title="Skill Analysis" sk="कौशल विश्लेषण" />
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData} outerRadius="72%">
                        <PolarGrid stroke="hsl(var(--accent) / 0.12)" />
                        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 9, fill: TEXT_DIM }} />
                        <Radar dataKey="value" stroke={GOLD} fill={GOLD} fillOpacity={0.12} strokeWidth={2} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                <GlassCard style={{ padding: '18px 20px' }}>
                  <STitle icon={<Activity size={14}/>} title="Recent Activity" sk="गतिविधि" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 150, overflowY: 'auto' }}>
                    {recentActivities.map((a, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'hsl(var(--accent) / 0.04)', border: '1px solid hsl(var(--accent) / 0.07)' }}>
                        <span style={{ color: GOLD, display: 'flex', flexShrink: 0 }}>{a.icon}</span>
                        <span style={{ flex: 1, fontSize: 10, color: TEXT_COLOR, lineHeight: 1.3 }}>{a.text}</span>
                        <span style={{ fontSize: 9, color: TEXT_DIM, flexShrink: 0 }}>{a.time}</span>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
                <GlassCard style={{ padding: '18px 20px', borderLeft: '3px solid hsl(var(--accent) / 0.4)' }}>
                  <STitle icon={<Sparkles size={14}/>} title="Saathi's Summary" sk="साथी संदेश" />
                  <p style={{ color: TEXT_DIM, fontSize: 11, lineHeight: 1.7, fontFamily: 'serif', fontStyle: 'italic' }}>
                    "You completed 2 quizzes today with 80% accuracy — solid! Focus dipped after 4PM. 12 flashcards due."
                  </p>
                  <div style={{ marginTop: 10, padding: '6px 10px', borderRadius: 8, background: 'hsl(var(--accent) / 0.05)', border: '1px solid hsl(var(--accent) / 0.12)', fontSize: 9, color: GOLD_DIM }}>
                    ✦ You studied while anxious 3 times this week
                  </div>
                </GlassCard>
                <GlassCard style={{ padding: '18px 20px' }}>
                  <STitle icon={<Calendar size={14}/>} title="Coming Up" sk="आगामी" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[
                      { text: '12 flashcards due', tag: 'Rev', color: GOLD },
                      { text: 'Quest expires in 2d', tag: 'Quest', color: WARNING_C },
                      { text: 'Thermodynamics basics', tag: 'Learn', color: SUCCESS_C },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'hsl(var(--accent) / 0.04)', border: '1px solid hsl(var(--accent) / 0.07)' }}>
                        <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 8, fontWeight: 700, background: `${item.color}18`, color: item.color, flexShrink: 0 }}>{item.tag}</span>
                        <span style={{ fontSize: 10, color: TEXT_COLOR }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
              {!recoveryMode && (
                <GlassCard style={{ padding: '16px 20px' }}>
                  <ProfileLeaderboard user={user} navigate={navigate} />
                </GlassCard>
              )}
            </motion.div>
          )}

          {/* ══ SUBJECTS ══ */}
          {activeTab === 'subjects' && (
            <motion.div key="subjects" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {subjectData.map((s, si) => (
                <GlassCard key={si} style={{ padding: '16px 20px' }}>
                  <button onClick={() => { setExpandedSubject(expandedSubject === s.fullName ? null : s.fullName); setShowAllTopics(false); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'hsl(var(--accent) / 0.1)', border: '1px solid hsl(var(--accent) / 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <BookOpen size={16} color={GOLD} />
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <p style={{ color: TEXT_COLOR, fontSize: 14, fontWeight: 700, fontFamily: 'serif', margin: '0 0 2px' }}>{s.fullName}</p>
                        <p style={{ color: TEXT_DIM, fontSize: 10, margin: 0 }}>{s.quizzes} quizzes · {s.accuracy}% accuracy</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ position: 'relative', width: 40, height: 40 }}>
                        <svg viewBox="0 0 36 36" style={{ width: 40, height: 40, transform: 'rotate(-90deg)' }}>
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--accent) / 0.12)" strokeWidth="3" />
                          <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                            stroke={s.completion > 60 ? SUCCESS_C : s.completion > 30 ? GOLD : WARNING_C}
                            strokeWidth="3" strokeDasharray={`${s.completion}, 100`} strokeLinecap="round" />
                        </svg>
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: TEXT_COLOR }}>{s.completion}%</span>
                      </div>
                      {expandedSubject === s.fullName ? <ChevronUp size={14} color={GOLD_MUTED} /> : <ChevronDown size={14} color={GOLD_MUTED} />}
                    </div>
                  </button>
                  <AnimatePresence>
                    {expandedSubject === s.fullName && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid hsl(var(--accent) / 0.1)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                            {[
                              { l: 'Quizzes', v: s.quizzes }, { l: 'Accuracy', v: `${s.accuracy}%` },
                              { l: 'Time', v: s.timeSpent }, { l: 'Topics', v: s.topicsCompleted },
                              { l: 'Streak', v: `${s.streak}d` }, { l: 'Rank', v: `#${s.rank}` },
                            ].map((st, i) => (
                              <div key={i} style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 10, flexShrink: 0, background: 'hsl(var(--accent) / 0.06)', border: '1px solid hsl(var(--accent) / 0.12)' }}>
                                <p style={{ color: GOLD, fontSize: 12, fontWeight: 700, fontFamily: 'serif', margin: '0 0 2px' }}>{st.v}</p>
                                <p style={{ color: TEXT_DIM, fontSize: 9, margin: 0 }}>{st.l}</p>
                              </div>
                            ))}
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
                              <p style={{ color: SUCCESS_C, fontSize: 10, fontWeight: 700, marginBottom: 6 }}>✦ Strengths</p>
                              {s.strengths.map((st, i) => <p key={i} style={{ color: TEXT_COLOR, fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}><CheckCircle2 size={9} color={SUCCESS_C} /> {st}</p>)}
                            </div>
                            <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)' }}>
                              <p style={{ color: DANGER_C, fontSize: 10, fontWeight: 700, marginBottom: 6 }}>⚠ Weak Areas</p>
                              {s.weaknesses.map((w, i) => <p key={i} style={{ color: TEXT_COLOR, fontSize: 10, marginBottom: 3 }}>{w}</p>)}
                            </div>
                          </div>
                          <div>
                            <p style={{ color: TEXT_COLOR, fontSize: 11, fontWeight: 600, fontFamily: 'serif', marginBottom: 8 }}>Topic Breakdown</p>
                            <div style={{ overflowX: 'auto' }}>
                              <table style={{ width: '100%', fontSize: 10, borderCollapse: 'collapse' }}>
                                <thead><tr>{['Topic','Quiz','Acc%','Status'].map(h => <th key={h} style={{ color: TEXT_DIM, fontWeight: 600, padding: '4px 8px', textAlign: h === 'Topic' ? 'left' : 'center' }}>{h}</th>)}</tr></thead>
                                <tbody>
                                  {(showAllTopics ? s.topics : s.topics.slice(0, 3)).map((t, ti) => (
                                    <tr key={ti} style={{ borderTop: '1px solid hsl(var(--accent) / 0.07)' }}>
                                      <td style={{ padding: '6px 8px', color: TEXT_COLOR, fontWeight: 600 }}>{t.name}</td>
                                      <td style={{ padding: '6px 8px', color: TEXT_DIM, textAlign: 'center' }}>{t.quizzes}</td>
                                      <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                        <span style={{ padding: '2px 6px', borderRadius: 8, background: t.accuracy > 70 ? 'rgba(74,222,128,0.12)' : t.accuracy > 50 ? 'hsl(var(--accent) / 0.12)' : 'rgba(248,113,113,0.12)', color: t.accuracy > 70 ? SUCCESS_C : t.accuracy > 50 ? GOLD : DANGER_C, fontWeight: 700 }}>{t.accuracy}%</span>
                                      </td>
                                      <td style={{ padding: '6px 8px', color: TEXT_DIM, textAlign: 'center' }}>{t.status}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                            {s.topics.length > 3 && <button onClick={() => setShowAllTopics(!showAllTopics)} style={{ fontSize: 10, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', marginTop: 6, fontFamily: 'serif' }}>{showAllTopics ? 'Show less ↑' : `Show all ${s.topics.length} →`}</button>}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              ))}
            </motion.div>
          )}

          {/* ══ QUESTS ══ */}
          {activeTab === 'quests' && (
            <motion.div key="quests" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <GlassCard style={{ padding: '18px 20px' }}>
                  <STitle icon={<Sun size={14}/>} title="Daily Quests" sk="दैनिक कर्म" />
                  {dailyQuests.map((q, i) => {
                    const done = q.progress >= q.total;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ padding: '10px 14px', borderRadius: 12, background: done ? 'rgba(74,222,128,0.07)' : 'hsl(var(--accent) / 0.05)', border: `1px solid ${done ? 'rgba(74,222,128,0.2)' : BORDER}`, marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: done ? SUCCESS_C : TEXT_COLOR, fontFamily: 'serif' }}>{done ? '✓ ' : ''}{q.title}</span>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'hsl(var(--accent) / 0.1)', color: GOLD, fontWeight: 700 }}>+{q.xp} XP</span>
                        </div>
                        <GlowBar value={q.progress} max={q.total} color={done ? SUCCESS_C : GOLD} height={4} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}><span style={{ fontSize: 9, color: TEXT_DIM }}>{q.progress}/{q.total}</span></div>
                      </motion.div>
                    );
                  })}
                </GlassCard>
                <GlassCard style={{ padding: '18px 20px' }}>
                  <STitle icon={<Zap size={14}/>} title="Weekly Quests" sk="साप्ताहिक कर्म" />
                  {weeklyQuests.map((q, i) => {
                    const done = q.progress >= q.total;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        style={{ padding: '10px 14px', borderRadius: 12, background: done ? 'rgba(74,222,128,0.07)' : 'hsl(var(--accent) / 0.05)', border: `1px solid ${done ? 'rgba(74,222,128,0.2)' : BORDER}`, marginBottom: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: done ? SUCCESS_C : TEXT_COLOR, fontFamily: 'serif' }}>{done ? '✓ ' : ''}{q.title}</span>
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'hsl(var(--accent) / 0.1)', color: GOLD, fontWeight: 700 }}>+{q.xp} XP</span>
                        </div>
                        <GlowBar value={q.progress} max={q.total} color={done ? SUCCESS_C : GOLD} height={4} />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}><span style={{ fontSize: 9, color: TEXT_DIM }}>{q.progress}/{q.total}</span></div>
                      </motion.div>
                    );
                  })}
                </GlassCard>
              </div>
              <GlassCard style={{ padding: '18px 20px' }}>
                <STitle icon={<Trophy size={14}/>} title="Milestones" sk="मील के पत्थर" />
                <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
                  {milestoneQuests.map((q, i) => (
                    <div key={i} style={{ minWidth: 200, padding: '12px 16px', borderRadius: 12, flexShrink: 0, background: 'hsl(var(--accent) / 0.05)', border: '1px solid hsl(var(--accent) / 0.15)' }}>
                      <p style={{ color: TEXT_COLOR, fontSize: 11, fontWeight: 600, marginBottom: 8, fontFamily: 'serif' }}>{q.title}</p>
                      <GlowBar value={q.progress} max={q.total} height={5} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                        <span style={{ fontSize: 9, color: TEXT_DIM }}>{q.progress}/{q.total}</span>
                        <span style={{ fontSize: 9, color: GOLD, fontWeight: 700 }}>+{q.xp} XP</span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
              <GlassCard style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Award size={14} color={GOLD} /><span style={{ color: TEXT_COLOR, fontSize: 13, fontWeight: 700, fontFamily: 'serif' }}>Badges</span><span style={{ color: TEXT_DIM, fontSize: 10, fontStyle: 'italic', fontFamily: 'serif' }}>पदक</span></div>
                  <button onClick={() => setShowAllBadges(!showAllBadges)} style={{ fontSize: 10, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'serif' }}>{showAllBadges ? 'Show less' : 'Show all →'}</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(70px,1fr))', gap: 8 }}>
                  {(showAllBadges ? allBadges : allBadges.slice(0, 8)).map((b, i) => (
                    <motion.div key={b.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.025 }}
                      style={{ textAlign: 'center', padding: '10px 6px', borderRadius: 12, background: b.earned ? 'hsl(var(--accent) / 0.08)' : 'hsl(var(--accent) / 0.02)', border: b.earned ? '1px solid hsl(var(--accent) / 0.2)' : '1px solid hsl(var(--accent) / 0.07)', opacity: b.earned ? 1 : 0.4, boxShadow: b.earned ? '0 0 12px hsl(var(--accent) / 0.08)' : 'none' }}>
                      <div style={{ color: b.earned ? GOLD : TEXT_DIM, display: 'flex', justifyContent: 'center', marginBottom: 4 }}>{b.icon}</div>
                      <p style={{ color: TEXT_COLOR, fontSize: 9, fontWeight: 600 }}>{b.label}</p>
                      {!b.earned && <span style={{ fontSize: 8 }}>🔒</span>}
                    </motion.div>
                  ))}
                </div>
              </GlassCard>
              <GlassCard style={{ padding: '16px 20px' }}>
                <button onClick={() => setShowQuestHistory(!showQuestHistory)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Clock size={14} color={GOLD_MUTED} /><span style={{ color: TEXT_COLOR, fontSize: 13, fontWeight: 700, fontFamily: 'serif' }}>Quest History</span><span style={{ color: TEXT_DIM, fontSize: 10, fontStyle: 'italic', fontFamily: 'serif' }}>इतिहास</span></div>
                  {showQuestHistory ? <ChevronUp size={14} color={GOLD_MUTED} /> : <ChevronDown size={14} color={GOLD_MUTED} />}
                </button>
                <AnimatePresence>
                  {showQuestHistory && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {questHistory.map((q, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 10, background: 'hsl(var(--accent) / 0.04)', border: '1px solid hsl(var(--accent) / 0.08)' }}>
                            <div><p style={{ color: TEXT_COLOR, fontSize: 11, fontWeight: 600, fontFamily: 'serif' }}>{q.title}</p><p style={{ color: TEXT_DIM, fontSize: 9 }}>{q.date}</p></div>
                            <span style={{ color: SUCCESS_C, fontSize: 11, fontWeight: 700 }}>+{q.xp} XP</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            </motion.div>
          )}

          {/* ══ WELLBEING ══ */}
          {activeTab === 'wellbeing' && (
            <motion.div key="wellbeing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
                {[
                  { label: 'Wellness', disp: '72', icon: <Heart size={18}/>, color: SUCCESS_C },
                  { label: 'Mood', disp: 'Good', icon: <Activity size={18}/>, color: GOLD },
                  { label: 'Streak', disp: '5d', icon: <Flame size={18}/>, color: WARNING_C },
                  { label: 'Burnout', disp: 'Low', icon: <Shield size={18}/>, color: SUCCESS_C },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                    <GlassCard style={{ padding: '14px 8px', textAlign: 'center' }}>
                      <div style={{ color: s.color, display: 'flex', justifyContent: 'center', marginBottom: 6 }}>{s.icon}</div>
                      <p style={{ color: TEXT_COLOR, fontSize: 16, fontWeight: 800, fontFamily: 'serif', margin: '0 0 2px' }}>{s.disp}</p>
                      <p style={{ color: TEXT_DIM, fontSize: 9, margin: 0 }}>{s.label}</p>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <GlassCard style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <STitle icon={<Activity size={12}/>} title="Mood Trend" sk="मनोदशा" />
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(['7d','30d'] as const).map(r => (
                        <button key={r} onClick={() => setMoodRange(r)} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, cursor: 'pointer', background: moodRange === r ? 'hsl(var(--accent) / 0.15)' : 'transparent', border: moodRange === r ? '1px solid hsl(var(--accent) / 0.3)' : '1px solid transparent', color: moodRange === r ? GOLD : TEXT_DIM }}>{r}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ height: 112 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={moodData}>
                        <XAxis dataKey="day" tick={{ fontSize: 8, fill: TEXT_DIM }} axisLine={false} tickLine={false} />
                        <YAxis hide domain={[0, 5]} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <defs><linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={SUCCESS_C} stopOpacity="0.3"/><stop offset="100%" stopColor={SUCCESS_C} stopOpacity="0"/></linearGradient></defs>
                        <Area type="monotone" dataKey="mood" stroke={SUCCESS_C} fill="url(#moodGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
                <GlassCard style={{ padding: '18px 20px' }}>
                  <STitle icon={<Shield size={12}/>} title="Burnout Trend" sk="थकान स्तर" />
                  <div style={{ height: 112 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={moodData}>
                        <XAxis dataKey="day" tick={{ fontSize: 8, fill: TEXT_DIM }} axisLine={false} tickLine={false} />
                        <YAxis hide domain={[0, 100]} />
                        <Tooltip contentStyle={chartTooltipStyle} />
                        <defs><linearGradient id="burnGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={WARNING_C} stopOpacity="0.3"/><stop offset="100%" stopColor={WARNING_C} stopOpacity="0"/></linearGradient></defs>
                        <Area type="monotone" dataKey="burnout" stroke={WARNING_C} fill="url(#burnGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </div>
              {/* Mood Calendar */}
              <GlassCard style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 14, fontSize: 10, color: TEXT_DIM }}>
                  {[
                    { l: `${calendarStats.logged} days logged`, i: <Calendar size={10}/> },
                    { l: `Avg: ${moodLevels[Math.round(calendarStats.avgMood)]?.label || 'N/A'}`, i: <Smile size={10}/> },
                    { l: `Best: ${monthNames[calendarMonth]} ${calendarStats.bestDay}`, i: <Star size={10}/> },
                    { l: `Streak: ${calendarStats.maxStreak}d`, i: <Flame size={10}/> },
                  ].map((s, i) => <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{s.i}<strong style={{ color: TEXT_COLOR }}>{s.l.split(':')[0]}</strong>{s.l.includes(':') ? ':' + s.l.split(':').slice(1).join(':') : ''}</span>)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={prevMonth} style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--accent) / 0.08)', border: '1px solid hsl(var(--accent) / 0.15)', cursor: 'pointer' }}><ChevronLeft size={14} color={GOLD_MUTED} /></button>
                    <h3 style={{ color: TEXT_COLOR, fontSize: 13, fontWeight: 700, fontFamily: 'serif', margin: 0 }}>{monthNames[calendarMonth]} {calendarYear}</h3>
                    <button onClick={nextMonth} style={{ width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--accent) / 0.08)', border: '1px solid hsl(var(--accent) / 0.15)', cursor: 'pointer' }}><ChevronRight size={14} color={GOLD_MUTED} /></button>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {(['week','month','3month'] as const).map(v => (
                      <button key={v} onClick={() => setCalendarView(v)} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, cursor: 'pointer', background: calendarView === v ? 'hsl(var(--accent) / 0.15)' : 'transparent', border: calendarView === v ? '1px solid hsl(var(--accent) / 0.3)' : '1px solid transparent', color: calendarView === v ? GOLD : TEXT_DIM, fontWeight: 600 }}>{v === '3month' ? '3M' : v === 'week' ? 'W' : 'M'}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
                  {['M','T','W','T','F','S','S'].map((d, i) => <div key={i} style={{ textAlign: 'center', fontSize: 8, fontWeight: 600, color: TEXT_DIM }}>{d}</div>)}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, maxHeight: calendarView === '3month' ? 120 : 'auto' }}>
                  {renderCalendarGrid()}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid hsl(var(--accent) / 0.1)' }}>
                  {moodLevels.slice(1).map((ml, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: ml.color }} /><span style={{ fontSize: 9, color: TEXT_DIM }}>{ml.label}</span></div>)}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><div style={{ width: 10, height: 10, borderRadius: 3, background: 'hsl(var(--accent) / 0.1)', opacity: 0.4 }} /><span style={{ fontSize: 9, color: TEXT_DIM }}>No Data</span></div>
                </div>
                <AnimatePresence>
                  {selectedDay && (() => {
                    const key = `${calendarYear}-${calendarMonth}-${selectedDay}`;
                    const entry = calendarData[key];
                    if (!entry || entry.mood === 0) return null;
                    const ml = moodLevels[entry.mood];
                    return (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ marginTop: 12, padding: '14px 16px', borderRadius: 12, overflow: 'hidden', background: 'hsl(var(--accent) / 0.05)', border: '1px solid hsl(var(--accent) / 0.15)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_COLOR, display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'serif' }}>
                            {monthNames[calendarMonth]} {selectedDay} — <span style={{ color: ml.color, display: 'flex', alignItems: 'center', gap: 3 }}>{ml.icon} {ml.label}</span>
                          </span>
                          <button onClick={() => setSelectedDay(null)} style={{ color: TEXT_DIM, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>✕</button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, textAlign: 'center' }}>
                          {[
                            { v: `${entry.sleep}h`, l: 'Sleep', c: GOLD },
                            { v: `${entry.anxiety}/10`, l: 'Anxiety', c: WARNING_C },
                            { v: String(entry.focus), l: 'Focus', c: SUCCESS_C },
                            { v: String(entry.exercises.length || 0), l: 'Exercises', c: GOLD },
                          ].map((s, i) => (
                            <div key={i} style={{ padding: '6px', borderRadius: 8, background: 'hsl(var(--accent) / 0.05)' }}>
                              <p style={{ color: s.c, fontSize: 12, fontWeight: 700, margin: '0 0 2px', fontFamily: 'serif' }}>{s.v}</p>
                              <p style={{ color: TEXT_DIM, fontSize: 9, margin: 0 }}>{s.l}</p>
                            </div>
                          ))}
                        </div>
                        {entry.note && <p style={{ fontSize: 10, marginTop: 8, fontStyle: 'italic', color: TEXT_DIM }}>"{entry.note}"</p>}
                        {entry.exercises.length > 0 && <p style={{ fontSize: 9, marginTop: 4, color: TEXT_DIM }}>Activities: {entry.exercises.join(', ')}</p>}
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>
              </GlassCard>
              <GlassCard style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {(['activity', 'journal'] as const).map(t => (
                    <button key={t} onClick={() => setWellbeingSubTab(t)} style={{ padding: '4px 14px', borderRadius: 10, cursor: 'pointer', fontSize: 10, fontWeight: 600, textTransform: 'capitalize', fontFamily: 'serif', background: wellbeingSubTab === t ? 'hsl(var(--accent) / 0.15)' : 'transparent', border: wellbeingSubTab === t ? '1px solid hsl(var(--accent) / 0.3)' : '1px solid transparent', color: wellbeingSubTab === t ? GOLD : TEXT_DIM }}>{t}</button>
                  ))}
                </div>
                {wellbeingSubTab === 'activity' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 150, overflowY: 'auto' }}>
                    {wellbeingActivities.map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderRadius: 8, background: 'hsl(var(--accent) / 0.04)', border: '1px solid hsl(var(--accent) / 0.07)' }}>
                        <span style={{ fontSize: 10, color: TEXT_COLOR }}>{a.text}</span>
                        <span style={{ fontSize: 9, color: TEXT_DIM }}>{a.time}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 150, overflowY: 'auto' }}>
                    {journalEntries.map((j, i) => (
                      <div key={i} style={{ padding: '8px 12px', borderRadius: 10, background: 'hsl(var(--accent) / 0.04)', border: '1px solid hsl(var(--accent) / 0.07)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 4, color: TEXT_COLOR, fontFamily: 'serif' }}><span style={{ color: GOLD }}>{j.moodIcon}</span>{j.note}</span>
                          <span style={{ fontSize: 9, color: TEXT_DIM, flexShrink: 0, marginLeft: 8 }}>{j.time}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 10, fontSize: 9, color: TEXT_DIM }}>
                          <span><Moon size={8} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />{j.sleep}h</span>
                          <span><AlertCircle size={8} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />{j.anxiety}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                {[
                  { title: 'Sleep', sk: 'नींद', data: sleepData, key: 'hours', color: GOLD, icon: <Moon size={10} />, bar: false },
                  { title: 'Anxiety', sk: 'चिंता', data: anxietyData, key: 'level', color: WARNING_C, icon: <Activity size={10} />, bar: false },
                  { title: 'Habits', sk: 'आदतें', data: habitData, key: 'pct', color: GOLD, icon: null, bar: true },
                ].map((chart, ci) => (
                  <GlassCard key={ci} style={{ padding: '12px 14px' }}>
                    <p style={{ color: TEXT_COLOR, fontSize: 10, fontWeight: 600, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {chart.icon && <span style={{ color: chart.color }}>{chart.icon}</span>}
                      {chart.title} <span style={{ color: TEXT_DIM, fontSize: 9, fontStyle: 'italic' }}>{chart.sk}</span>
                    </p>
                    <div style={{ height: 56 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        {chart.bar ? (
                          <BarChart data={chart.data}>
                            <Bar dataKey={chart.key} radius={[2, 2, 0, 0]}>
                              {chart.data.map((_, i) => <Cell key={i} fill={`hsl(var(--accent) / ${0.3 + i * 0.08})`} />)}
                            </Bar>
                          </BarChart>
                        ) : (
                          <AreaChart data={chart.data}>
                            <defs><linearGradient id={`grad-${ci}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={chart.color} stopOpacity="0.3"/><stop offset="100%" stopColor={chart.color} stopOpacity="0"/></linearGradient></defs>
                            <Area type="monotone" dataKey={chart.key} stroke={chart.color} fill={`url(#grad-${ci})`} strokeWidth={1.5} />
                          </AreaChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  </GlassCard>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <GlassCard style={{ padding: '18px 20px', borderLeft: '3px solid hsl(var(--accent) / 0.4)' }}>
                  <STitle icon={<Sparkles size={14}/>} title="Saathi Insights" sk="साथी दृष्टि" />
                  <p style={{ color: TEXT_DIM, fontSize: 11, lineHeight: 1.7, fontFamily: 'serif', fontStyle: 'italic' }}>
                    "Your mood improves on days you do breathing exercises. Try scheduling breaks every 90 mins. Best focus days: Mon–Wed."
                  </p>
                </GlassCard>
                <GlassCard style={{ padding: '18px 20px' }}>
                  <STitle icon={<FileText size={12}/>} title="Weekly Report" sk="साप्ताहिक रिपोर्ट" />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                    {[{ l: 'Mood', v: '3.8' },{ l: 'Focus', v: '4h 20m' },{ l: 'Activities', v: '12' },{ l: 'Badges', v: '2 new' },{ l: 'vs Last', v: '+15%' },{ l: 'Habit %', v: '72%' }].map((s, i) => (
                      <div key={i} style={{ textAlign: 'center', padding: '6px', borderRadius: 8, background: 'hsl(var(--accent) / 0.05)' }}>
                        <p style={{ color: GOLD, fontSize: 11, fontWeight: 700, fontFamily: 'serif', margin: '0 0 2px' }}>{s.v}</p>
                        <p style={{ color: TEXT_DIM, fontSize: 9, margin: 0 }}>{s.l}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              </div>
            </motion.div>
          )}

        </AnimatePresence>

        {/* ── Weekly Report Card ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ marginTop: 20 }}>
          <GlassCard style={{ padding: '20px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <FileText size={14} color={GOLD} />
              <h3 style={{ color: TEXT_COLOR, fontSize: 14, fontWeight: 700, fontFamily: 'serif', margin: 0 }}>Weekly Report Card</h3>
              <span style={{ color: TEXT_DIM, fontSize: 10, fontStyle: 'italic', fontFamily: 'serif' }}>साप्ताहिक प्रगति पत्र</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'center' }}>
              {[
                { l: 'XP Earned', v: `+${Math.floor(user.xp * 0.3)}`, c: GOLD },
                { l: 'Accuracy', v: '82%', c: SUCCESS_C },
                { l: 'Top Percentile', v: '15%', c: WARNING_C },
                { l: 'Cards', v: '47', c: GOLD },
                { l: 'Retention', v: '78%', c: SUCCESS_C },
                { l: 'Mood', v: 'Good', c: GOLD },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <p style={{ color: s.c, fontSize: 14, fontWeight: 800, fontFamily: 'serif', margin: '0 0 3px' }}>{s.v}</p>
                  <p style={{ color: TEXT_DIM, fontSize: 9, margin: 0 }}>{s.l}</p>
                </div>
              ))}
            </div>
            <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,hsl(var(--accent) / 0.3),transparent)', margin: '14px 0' }} />
            <p style={{ color: TEXT_DIM, fontSize: 11, textAlign: 'center', fontFamily: 'serif', fontStyle: 'italic', margin: 0 }}>
              ✦ "You studied while anxious 3 times this week — that's rare discipline." ✦
            </p>
          </GlassCard>
        </motion.div>

      </div>
    </div>
  );
};

export default Profile;
