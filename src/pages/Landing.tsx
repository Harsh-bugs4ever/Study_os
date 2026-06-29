import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smile, Frown, Moon, Dumbbell, Glasses, Flame, Zap, Trophy,
  Target, Brain, Users, ArrowRight, Sparkles, BookOpen,
  MessageSquare, Layers, HelpCircle, CheckCircle, RefreshCw, BarChart2
} from 'lucide-react';
import gurukulLogo from '@/assets/gurukul-logo.png';

/* ─── Design Tokens (StudyOS Light-First System) ─── */
const T = {
  bg:           '#F1EFE8', // Page background
  card:         '#FFFFFF', // Card background
  textPrimary:  '#2C2C2A', // Main text
  textSec:      '#5F5E5A', // Secondary labels
  textMuted:    '#888780', // Muted text
  border:       '#D3D1C7', // Default borders
  borderStrong: '#85B7EB', // Hover/Focus borders
  primary:      '#185FA5', // Primary brand blue
  primaryHover: '#0C447C', // Primary dark blue
  primaryTint:  '#E6F1FB', // Tint for hover backgrounds
  success:      '#1D9E75', // Teal - Mastered
  successTint:  '#E1F5EE',
  successText:  '#085041',
  warning:      '#BA7517', // Amber - Due for review
  warningTint:  '#FAEEDA',
  warningText:  '#854F0B',
  ai:           '#7F77DD', // Purple - AI/Cognee
  aiTint:       '#EEEDFE',
  aiText:       '#3C3489',
  danger:       '#E24B4A', // Red - Weak concept
  dangerTint:   '#FCEBEB',
  dangerText:   '#A32D2D',
};

/* ─── Mock Data for Interactive OS Dashboard ─── */
interface MoodData {
  score: number;
  message: string;
  tasks: { text: string; done: boolean; type: 'quiz' | 'read' | 'rest' }[];
  accentColor: string;
  themeTint: string;
}

const moodStateData: Record<number, MoodData> = {
  0: {
    score: 35,
    message: "Low energy detected. Let's focus on restorative learning.",
    tasks: [
      { text: "Read Lora summary: Thermodynamics laws", done: false, type: 'read' },
      { text: "10-minute mindfulness focus break", done: true, type: 'rest' },
      { text: "Listen to ambient binaural study focus track", done: false, type: 'rest' }
    ],
    accentColor: T.danger,
    themeTint: T.dangerTint,
  },
  1: {
    score: 52,
    message: "A bit rough today. Quick reviews instead of heavy sessions.",
    tasks: [
      { text: "Spaced repetition: 5 due cards in Physics", done: false, type: 'quiz' },
      { text: "Glance at Lora revision notes: Organic reactions", done: false, type: 'read' },
      { text: "Record sleep/wellbeing metrics", done: true, type: 'rest' }
    ],
    accentColor: T.warning,
    themeTint: T.warningTint,
  },
  2: {
    score: 64,
    message: "Mild fatigue. Good time for audio summaries or visual concept maps.",
    tasks: [
      { text: "Explore Cognee knowledge graph for Organic Chemistry", done: false, type: 'read' },
      { text: "Short practice quiz: 5 MCQ on Calculus", done: false, type: 'quiz' },
      { text: "Hydrate and stretch break", done: true, type: 'rest' }
    ],
    accentColor: T.ai,
    themeTint: T.aiTint,
  },
  3: {
    score: 82,
    message: "State optimal. Ready for intensive mock test or new core concepts.",
    tasks: [
      { text: "Complete JEE Advanced practice quiz: Mechanics", done: false, type: 'quiz' },
      { text: "Interactive teach-back session with Saathi AI", done: false, type: 'read' },
      { text: "Review 3 weak concepts from yesterday", done: false, type: 'quiz' }
    ],
    accentColor: T.primary,
    themeTint: T.primaryTint,
  },
  4: {
    score: 94,
    message: "Peak performance mode. Let's unlock complex subjects.",
    tasks: [
      { text: "Solve advanced level calculus equation set", done: false, type: 'quiz' },
      { text: "Generate new AI study flashcards for Biology", done: false, type: 'read' },
      { text: "Maintain perfect 7-day streak goals", done: true, type: 'quiz' }
    ],
    accentColor: T.success,
    themeTint: T.successTint,
  }
};

const moodIcons = [
  { Icon: Smile,    label: 'Good'   },
  { Icon: Frown,    label: 'Rough'  },
  { Icon: Moon,     label: 'Tired'  },
  { Icon: Dumbbell, label: 'Pumped' },
  { Icon: Glasses,  label: 'Focus'  },
];

const Landing = () => {
  const [selectedMood, setSelectedMood] = useState<number>(3); // Default: Focus
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'adaptive' | 'saathi' | 'graph'>('adaptive');
  const [chatStep, setChatStep] = useState<number>(0);
  const [copiedText, setCopiedText] = useState<string>('');

  const currentMoodData = moodStateData[selectedMood] || moodStateData[3];

  // Simulated Chatbot Messages
  const chatbotConversation = [
    {
      sender: 'user',
      text: "Can you help me understand chemical bonding simply?"
    },
    {
      sender: 'saathi',
      text: "Absolutely! Think of atoms like people wanting stability. Covalent bonding is like sharing a umbrella — both atoms hold onto the same electrons. Ionic bonding is like gifting a spare umbrella to someone who has none. Shall we test this with a quick interactive check?"
    },
    {
      sender: 'user',
      text: "Yes, let's do the check!"
    },
    {
      sender: 'saathi',
      text: "Perfect! If Atom A completely transfers one electron to Atom B, what type of bond is formed? (Covalent or Ionic?)"
    },
    {
      sender: 'user',
      text: "It must be Ionic since it's a complete transfer!"
    },
    {
      sender: 'saathi',
      text: "Correct! 🎉 You've mastered the core concept. Let's mark this node as 'Mastered' (Teal) on your Study OS Knowledge Graph."
    }
  ];

  const handleNextChat = () => {
    if (chatStep < chatbotConversation.length - 1) {
      setChatStep(prev => prev + 1);
    } else {
      setChatStep(0); // Reset loop
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(''), 2000);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.textPrimary, fontFamily: 'Inter, sans-serif' }}>
      
      {/* ─── STICKY HEADER ─── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: '64px',
        background: T.card, borderBottom: `0.5px solid ${T.border}`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={gurukulLogo} alt="Study OS Logo" style={{ width: 28, height: 28 }} />
          <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.3px' }}>Study OS</span>
          <span style={{
            fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
            background: T.aiTint, color: T.aiText,
            padding: '2px 8px', borderRadius: 4, fontWeight: 500
          }}>v1.0-LIGHT</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/auth" style={{
            fontSize: 13, fontWeight: 500, color: T.textSec,
            textDecoration: 'none', transition: 'color 0.15s ease',
            alignSelf: 'center'
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = T.primary}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = T.textSec}
          >
            Sign in
          </Link>
          <Link to="/auth" style={{
            display: 'inline-flex', alignItems: 'center',
            background: T.primary, color: '#FFFFFF',
            borderRadius: 8, padding: '8px 16px',
            fontSize: 13, fontWeight: 500, textDecoration: 'none',
            transition: 'background 0.15s ease', cursor: 'pointer'
          }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.primaryHover}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.primary}
          >
            Enter App
          </Link>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 24px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
          
          {/* Hero Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: T.aiTint, color: T.aiText,
                padding: '4px 12px', borderRadius: 99,
                fontSize: 11, fontWeight: 500
              }}>
                <Sparkles size={11} /> Mindful, Adaptive Learning Environment
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 500,
              lineHeight: 1.15, letterSpacing: '-0.8px', color: T.textPrimary
            }}>
              The Operating System for <span style={{ color: T.primary }}>Stress-Free</span> Learning.
            </h1>

            <p style={{
              fontSize: 16, lineHeight: 1.7, color: T.textSec,
              fontFamily: 'Lora, Georgia, serif', maxWidth: '480px'
            }}>
              Study OS adapts continuously to your cognitive state, mood, and sleep levels. No rigid schedules. Just science-backed spaced repetition and AI support mapped to your readiness.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <Link to="/auth" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: T.primary, color: '#FFFFFF',
                borderRadius: 8, padding: '12px 24px',
                fontSize: 14, fontWeight: 500, textDecoration: 'none',
                transition: 'background 0.15s ease'
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.primaryHover}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.primary}
              >
                Get Started Free <ArrowRight size={14} />
              </Link>
              <a href="#features-explorer" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'transparent', color: T.primary,
                border: `1px solid ${T.borderStrong}`, borderRadius: 8,
                padding: '12px 24px', fontSize: 14, fontWeight: 500,
                textDecoration: 'none', transition: 'background 0.15s ease'
              }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.primaryTint}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                Learn How It Works
              </a>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <span className="tag-mastered">✓ No Ads</span>
              <span className="tag-progress">✦ Space Repetition</span>
              <span className="tag-ai">⚛ Cognee Graph</span>
            </div>
          </div>

          {/* Hero Right Column: Interactive OS Dashboard Preview */}
          <div style={{ position: 'relative' }}>
            <div style={{
              background: T.card, border: `0.5px solid ${T.border}`,
              borderRadius: 12, padding: 24,
              boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
              display: 'flex', flexDirection: 'column', gap: 20
            }}>
              
              {/* Header inside mockup */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: currentMoodData.accentColor }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: T.textSec, fontFamily: 'JetBrains Mono, monospace' }}>
                    STUDY_STATE: {selectedMood === 0 ? "LOW" : selectedMood === 1 ? "CAUTIOUS" : selectedMood === 2 ? "MID" : selectedMood === 3 ? "OPTIMAL" : "PEAK"}
                  </span>
                </div>
                <span className="stat-number" style={{ fontSize: 10, color: T.textMuted }}>SYS_CONNECTED</span>
              </div>

              {/* Gauge & Info Panel */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, alignItems: 'center' }}>
                
                {/* Radial Gauge */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: 120, height: 60 }}>
                    <svg viewBox="0 0 120 60" style={{ width: '100%', height: '100%' }}>
                      <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="#E6F1FB" strokeWidth="8" strokeLinecap="round" />
                      <path
                        d="M 10 55 A 50 50 0 0 1 110 55"
                        fill="none"
                        stroke={currentMoodData.accentColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray="314"
                        strokeDashoffset={314 - (314 * (currentMoodData.score / 100)) / 2}
                        style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      textAlign: 'center', display: 'flex', flexDirection: 'column'
                    }}>
                      <span style={{ fontSize: 22, fontWeight: 600, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
                        {currentMoodData.score}
                      </span>
                      <span style={{ fontSize: 9, color: T.textMuted }}>READINESS</span>
                    </div>
                  </div>
                </div>

                {/* State message block */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: T.textMuted }}>RECOMMENDED PATH</span>
                  <p style={{
                    fontSize: 12, lineHeight: 1.4, color: T.textPrimary,
                    fontFamily: 'Lora, Georgia, serif', fontWeight: 500
                  }}>
                    "{currentMoodData.message}"
                  </p>
                </div>
              </div>

              {/* Mood selector buttons (Clickable to change dashboard state) */}
              <div style={{ borderTop: `0.5px solid ${T.border}`, paddingTop: 16 }}>
                <p style={{ fontSize: 11, color: T.textMuted, marginBottom: 8, fontWeight: 500 }}>
                  Adjust your current state:
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                  {moodIcons.map(({ Icon, label }, index) => {
                    const isActive = selectedMood === index;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedMood(index)}
                        title={label}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          flex: 1, padding: '8px 4px', borderRadius: 8,
                          border: `1px solid ${isActive ? currentMoodData.accentColor : T.border}`,
                          background: isActive ? currentMoodData.themeTint : 'transparent',
                          color: isActive ? currentMoodData.accentColor : T.textMuted,
                          cursor: 'pointer', transition: 'all 0.2s ease', outline: 'none'
                        }}
                      >
                        <Icon size={16} />
                        <span style={{ fontSize: 9, fontWeight: 500 }}>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Task List from state check */}
              <div style={{ background: T.bg, borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: '0.04em' }}>TODAY'S ADAPTIVE CHECKLIST</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {currentMoodData.tasks.map((task, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={task.done}
                        readOnly
                        style={{
                          width: 14, height: 14, accentColor: currentMoodData.accentColor,
                          border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'default'
                        }}
                      />
                      <span style={{
                        fontSize: 12,
                        textDecoration: task.done ? 'line-through' : 'none',
                        color: task.done ? T.textMuted : T.textPrimary,
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats Row inside preview */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center', borderTop: `0.5px solid ${T.border}`, paddingTop: 16 }}>
                <div>
                  <span className="stat-number" style={{ fontSize: 16, fontWeight: 600, color: T.textPrimary }}>7 Days</span>
                  <p style={{ fontSize: 9, color: T.textMuted }}>Streak <Flame size={9} style={{ display: 'inline', color: T.warning }} /></p>
                </div>
                <div>
                  <span className="stat-number" style={{ fontSize: 16, fontWeight: 600, color: T.textPrimary }}>340 XP</span>
                  <p style={{ fontSize: 9, color: T.textMuted }}>Today <Zap size={9} style={{ display: 'inline', color: T.primary }} /></p>
                </div>
                <div>
                  <span className="stat-number" style={{ fontSize: 16, fontWeight: 600, color: T.textPrimary }}>L2 Hero</span>
                  <p style={{ fontSize: 9, color: T.textMuted }}>Level <Trophy size={9} style={{ display: 'inline', color: T.success }} /></p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ─── INTERACTIVE FEATURES EXPLORER ─── */}
      <div id="features-explorer" style={{ background: T.card, borderTop: `0.5px solid ${T.border}`, borderBottom: `0.5px solid ${T.border}`, padding: '64px 24px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span className="tag-progress">Features Explorer</span>
            <h2 style={{ fontSize: 26, fontWeight: 500, marginTop: 12, color: T.textPrimary }}>
              Explore the Three Core Pillars of Study OS
            </h2>
            <p style={{ color: T.textSec, fontSize: 14, fontFamily: 'Lora, Georgia, serif', marginTop: 8 }}>
              Click any tab to view the live interactive preview of our technology stack.
            </p>
          </div>

          {/* Navigation Tabs */}
          <div style={{
            display: 'flex', justifyContent: 'center', gap: 12,
            borderBottom: `0.5px solid ${T.border}`, paddingBottom: 16, marginBottom: 32
          }}>
            {[
              { id: 'adaptive', label: 'Adaptive Spaced Repetition', icon: <Layers size={14} /> },
              { id: 'saathi', label: 'Saathi AI Companion', icon: <MessageSquare size={14} /> },
              { id: 'graph', label: 'Knowledge Graph Visualization', icon: <BarChart2 size={14} /> }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 16px', borderRadius: 8,
                    border: `1px solid ${isActive ? T.primary : 'transparent'}`,
                    background: isActive ? T.primaryTint : 'transparent',
                    color: isActive ? T.primary : T.textSec,
                    fontSize: 13, fontWeight: 500, cursor: 'pointer',
                    transition: 'all 0.15s ease', outline: 'none'
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab content area */}
          <div style={{ minHeight: '300px' }}>
            <AnimatePresence mode="wait">
              {activeTab === 'adaptive' && (
                <motion.div
                  key="adaptive"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, alignItems: 'center' }}
                >
                  {/* Left Column - Card explanation */}
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>Spaced repetition scaled to your state</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: T.textSec, fontFamily: 'Lora, Georgia, serif', marginBottom: 16 }}>
                      Traditional flashcard apps force you to review even if you are exhausted. Study OS monitors your readiness level and automatically redistributes reviews so you optimize memory retention without burning out.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div className="tag-mastered" style={{ width: 'fit-content' }}>✓ Teal: Mastered (intervals extended)</div>
                      <div className="tag-due" style={{ width: 'fit-content' }}>✦ Amber: Due (review now)</div>
                      <div className="tag-weak" style={{ width: 'fit-content' }}>✖ Red: Weak (needs rebuilding)</div>
                    </div>
                  </div>

                  {/* Right Column - Interactive Flashcard component */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div
                      onClick={() => setIsFlipped(!isFlipped)}
                      style={{
                        width: '100%', maxWidth: '320px', height: '200px',
                        cursor: 'pointer', perspective: '1000px', position: 'relative'
                      }}
                    >
                      <motion.div
                        style={{
                          width: '100%', height: '100%',
                          transformStyle: 'preserve-3d',
                          position: 'relative'
                        }}
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                      >
                        {/* Front Side */}
                        <div style={{
                          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                          background: T.card, border: `0.5px solid ${T.border}`, borderRadius: 12,
                          padding: 24, display: 'flex', flexDirection: 'column',
                          justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: T.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>PHYSICS_DECK</span>
                            <span className="tag-due">DUE NOW</span>
                          </div>
                          <p style={{ fontSize: 15, fontWeight: 500, textAlign: 'center', margin: '20px 0' }}>
                            What is Newton's Third Law of Motion?
                          </p>
                          <span style={{ fontSize: 10, color: T.textMuted, textAlign: 'center' }}>Click card to flip and view answer</span>
                        </div>

                        {/* Back Side */}
                        <div style={{
                          position: 'absolute', inset: 0, backfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)',
                          background: T.primaryTint, border: `1px solid ${T.borderStrong}`, borderRadius: 12,
                          padding: 24, display: 'flex', flexDirection: 'column',
                          justifyContent: 'space-between', boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 10, color: T.primary, fontFamily: 'JetBrains Mono, monospace' }}>ANSWER</span>
                            <span className="tag-mastered">MASTERED</span>
                          </div>
                          <p style={{ fontSize: 14, lineHeight: 1.5, textAlign: 'center', margin: '12px 0', color: T.primary }}>
                            For every action, there is an equal and opposite reaction.
                          </p>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                            <button className="tag-weak" style={{ border: 'none', cursor: 'pointer' }}>Hard</button>
                            <button className="tag-mastered" style={{ border: 'none', cursor: 'pointer' }}>Easy</button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'saathi' && (
                <motion.div
                  key="saathi"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, alignItems: 'center' }}
                >
                  {/* Left Column - Explain Saathi companion */}
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>Meet Saathi: Your Mindful AI Companion</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: T.textSec, fontFamily: 'Lora, Georgia, serif', marginBottom: 16 }}>
                      Saathi is not just a chatbot. Powered by your state history, Saathi knows when you are struggling and will simplify concepts on the fly using intuitive analogies, practice prompts, or mindful suggestions.
                    </p>
                    <button
                      onClick={handleNextChat}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        background: T.ai, color: '#FFFFFF', border: 'none',
                        borderRadius: 8, padding: '10px 18px', fontSize: 13,
                        fontWeight: 500, cursor: 'pointer', transition: 'background 0.15s'
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#6961C4'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.ai}
                    >
                      <RefreshCw size={13} />
                      {chatStep === chatbotConversation.length - 1 ? 'Restart Chat Demo' : 'Advance Conversation'}
                    </button>
                  </div>

                  {/* Right Column - Chat conversation demo box */}
                  <div style={{
                    background: T.bg, borderRadius: 12, border: `0.5px solid ${T.border}`,
                    padding: 16, height: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderBottom: `0.5px solid ${T.border}`, paddingBottom: 8, marginBottom: 8 }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: T.ai, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontSize: 10 }}>⚛</div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: T.textPrimary }}>Saathi AI Session</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }} className="gl-scroll">
                      {chatbotConversation.slice(0, chatStep + 1).map((msg, i) => {
                        const isUser = msg.sender === 'user';
                        return (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                              alignSelf: isUser ? 'flex-end' : 'flex-start',
                              maxWidth: '85%',
                              background: isUser ? T.card : T.aiTint,
                              color: T.textPrimary,
                              border: isUser ? `0.5px solid ${T.border}` : `1px solid ${T.borderStrong}`,
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: 12,
                              lineHeight: 1.4
                            }}
                          >
                            <p>{msg.text}</p>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div style={{ fontSize: 10, color: T.textMuted, textAlign: 'center', paddingTop: 8, borderTop: `0.5px solid ${T.border}`, marginTop: 8 }}>
                      Use the button on the left to walk through the conversation
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'graph' && (
                <motion.div
                  key="graph"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, alignItems: 'center' }}
                >
                  {/* Left Column - Explain Cognee Graph */}
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 12 }}>Cognitive Knowledge Graphs</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: T.textSec, fontFamily: 'Lora, Georgia, serif', marginBottom: 16 }}>
                      Study OS compiles your concepts into an active knowledge graph. Instead of looking at list pages, see how concepts connect to each other. Your mastery state is color-coded so you know exactly which nodes to review next.
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <span className="tag-mastered">Teal = Mastered (80%+)</span>
                      <span className="tag-progress">Blue = Core Subject</span>
                      <span className="tag-due">Amber = Due for Review</span>
                      <span className="tag-weak">Red = Weak Concept</span>
                    </div>
                  </div>

                  {/* Right Column - SVG Mock graph */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{
                      width: '100%', maxWidth: '320px', height: '240px',
                      background: T.card, border: `0.5px solid ${T.border}`, borderRadius: 12,
                      padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
                    }}>
                      <svg width="240" height="180" viewBox="0 0 240 180">
                        {/* Lines connecting nodes */}
                        <line x1="120" y1="90" x2="60" y2="50" stroke={T.border} strokeWidth="1.5" />
                        <line x1="120" y1="90" x2="180" y2="50" stroke={T.border} strokeWidth="1.5" />
                        <line x1="120" y1="90" x2="70" y2="130" stroke={T.border} strokeWidth="1.5" />
                        <line x1="120" y1="90" x2="170" y2="130" stroke={T.border} strokeWidth="1.5" />
                        <line x1="60" y1="50" x2="180" y2="50" stroke={T.border} strokeWidth="1" strokeDasharray="3 3" />

                        {/* Central Node - Organic Chem (Blue) */}
                        <circle cx="120" cy="90" r="14" fill={T.primary} stroke={T.borderStrong} strokeWidth="2" />
                        <text x="120" y="93" fill="#FFF" fontSize="8" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">CORE</text>

                        {/* Node 1 - Alkanes (Teal Mastered) */}
                        <circle cx="60" cy="50" r="10" fill={T.success} />
                        <text x="60" y="34" fill={T.textSec} fontSize="7" fontWeight="500" textAnchor="middle" fontFamily="sans-serif">Alkanes</text>

                        {/* Node 2 - Alkenes (Amber Review) */}
                        <circle cx="180" cy="50" r="10" fill={T.warning} />
                        <text x="180" y="34" fill={T.textSec} fontSize="7" fontWeight="500" textAnchor="middle" fontFamily="sans-serif">Alkenes</text>

                        {/* Node 3 - Bonding (Red Weak) */}
                        <circle cx="70" cy="130" r="10" fill={T.danger} />
                        <text x="70" y="148" fill={T.textSec} fontSize="7" fontWeight="500" textAnchor="middle" fontFamily="sans-serif">Bonding</text>

                        {/* Node 4 - Hybridization (Purple AI) */}
                        <circle cx="170" cy="130" r="10" fill={T.ai} />
                        <text x="170" y="148" fill={T.textSec} fontSize="7" fontWeight="500" textAnchor="middle" fontFamily="sans-serif">Hybrid</text>
                      </svg>

                      <div style={{
                        position: 'absolute', bottom: 10, left: 10,
                        fontSize: 9, color: T.textMuted, fontFamily: 'JetBrains Mono, monospace'
                      }}>
                        COGNEE_MEM_GRAPH_ACTIVE
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* ─── TECHNICAL CODE / MATH INTEGRATION SHOWCASE ─── */}
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '64px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
          
          {/* Code Left - Equations & Explanations */}
          <div>
            <span className="tag-ai">Math & Equation Parsing</span>
            <h2 style={{ fontSize: 24, fontWeight: 500, marginTop: 12, marginBottom: 16 }}>
              Perfect Rendering of Complex Formulas
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: T.textSec, fontFamily: 'Lora, Georgia, serif', marginBottom: 20 }}>
              Study OS natively renders beautiful LaTeX formatting, physics equations, and code blocks. Students get pixel-perfect formula syntax alongside clear, serif-based Lora explanations designed for maximum readability.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.primary }} />
                <span style={{ fontSize: 13, color: T.textPrimary }}>Native math expressions and symbols</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.primary }} />
                <span style={{ fontSize: 13, color: T.textPrimary }}>JetBrains Mono alignment for equations</span>
              </div>
            </div>
          </div>

          {/* Code Right - Rendered block with copy button */}
          <div style={{
            background: T.card, border: `0.5px solid ${T.border}`, borderRadius: 12,
            padding: 20, display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `0.5px solid ${T.border}`, paddingBottom: 10 }}>
              <span style={{ fontSize: 11, color: T.textMuted, fontFamily: 'JetBrains Mono, monospace' }}>MATH_EQUATION_RENDER</span>
              <button
                onClick={() => copyToClipboard("F = G * (m1 * m2) / r^2")}
                style={{
                  background: T.primaryTint, color: T.primary, border: 'none',
                  borderRadius: 6, padding: '4px 10px', fontSize: 10,
                  fontWeight: 500, cursor: 'pointer', outline: 'none'
                }}
              >
                {copiedText === "F = G * (m1 * m2) / r^2" ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            <div style={{ background: T.bg, padding: 16, borderRadius: 8, textAlign: 'center' }}>
              <p style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 16,
                fontWeight: 500, color: T.primary
              }}>
                F = G · (m₁ · m₂) / r²
              </p>
            </div>

            <p style={{ fontSize: 13, lineHeight: 1.6, color: T.textSec, fontFamily: 'Lora, Georgia, serif' }}>
              <strong>Gravitational Attraction Formula:</strong> The force (F) between two masses is directly proportional to the product of their masses and inversely proportional to the square of the distance (r) between their centers.
            </p>
          </div>

        </div>
      </div>

      {/* ─── WELLBEING QUOTE SECTION ─── */}
      <div style={{ background: T.primaryTint, padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <span style={{ fontSize: 24, color: T.primary }}>🌿</span>
          <p style={{
            fontFamily: 'Lora, Georgia, serif', fontSize: 18,
            fontStyle: 'italic', lineHeight: 1.7, color: T.primaryHover
          }}>
            "We built Study OS because study platforms shouldn't just measure what you know. They must treat your cognitive energy, fatigue levels, and mental wellbeing as key components of learning."
          </p>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: T.textSec, letterSpacing: '0.1em' }}>
            STUDY OS MANIFESTO
          </span>
        </div>
      </div>

      {/* ─── FINAL CALL TO ACTION ─── */}
      <div style={{ maxWidth: 1140, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 32, fontWeight: 500, marginBottom: 12 }}>Begin Your Journey</h2>
        <p style={{
          fontSize: 16, color: T.textSec, fontFamily: 'Lora, Georgia, serif',
          maxWidth: '520px', margin: '0 auto 28px', lineHeight: 1.6
        }}>
          Ditch the rigid planners. Tap into your readiness state, study alongside Saathi, and watch your knowledge graph grow.
        </p>

        <Link to="/auth" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: T.primary, color: '#FFFFFF',
          borderRadius: 8, padding: '14px 32px',
          fontSize: 15, fontWeight: 500, textDecoration: 'none',
          transition: 'background 0.15s'
        }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = T.primaryHover}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = T.primary}
        >
          Create Your Free Account <ArrowRight size={15} />
        </Link>
      </div>

      {/* ─── FOOTER WITH SANSKRIT STRIP ─── */}
      <footer style={{
        background: T.card, borderTop: `0.5px solid ${T.border}`,
        padding: '40px 24px 32px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          
          {/* Sanskrit verse accent strip */}
          <div className="gk-sanskrit-strip" style={{ fontSize: 11, color: T.textMuted }}>
            ॥ सा विद्या या विमुक्तये ॥ That is true knowledge which liberates ॥
          </div>

          <div style={{
            width: '100%', maxWidth: 1140, display: 'flex', flexWrap: 'wrap',
            justifyContent: 'space-between', alignItems: 'center', gap: 16,
            borderTop: `0.5px solid ${T.border}`, paddingTop: 20
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img src={gurukulLogo} alt="Study OS Logo" style={{ width: 22, height: 22 }} />
              <span style={{ fontSize: 14, fontWeight: 600 }}>Study OS</span>
            </div>
            <p style={{ fontSize: 12, color: T.textMuted }}>
              © {new Date().getFullYear()} Study OS · Built with care for Indian students
            </p>
            <div style={{ display: 'flex', gap: 16 }}>
              <Link to="/auth" style={{ fontSize: 12, color: T.textMuted, textDecoration: 'none' }}>App</Link>
              <Link to="/auth" style={{ fontSize: 12, color: T.textMuted, textDecoration: 'none' }}>Login</Link>
              <a href="#features-explorer" style={{ fontSize: 12, color: T.textMuted, textDecoration: 'none' }}>Features</a>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default Landing;
