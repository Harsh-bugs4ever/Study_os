import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, AlertTriangle, Lightbulb, Heart, Target, Moon, Timer, Brain, Flame, Trophy, Loader2, Smile, Frown, Meh, Zap, Coffee, CloudRain, Sun, Shield } from 'lucide-react';

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

interface LeaderboardEntry { name: string; xp: number; isCurrentUser: boolean; }

const Dashboard = () => {
  const { user, setUser } = useApp();
  const { recoveryMode, setRecoveryMode } = useTheme();
  const navigate = useNavigate();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbLoading, setLbLoading] = useState(true);

  // Real leaderboard - show ALL signed up users
  useEffect(() => {
    const load = async () => {
      setLbLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profiles } = await supabase.from('profiles').select('id, name, xp').order('xp', { ascending: false }).limit(10);
      if (profiles) {
        setLeaderboard(profiles.map(p => ({
          name: p.name || 'Student', xp: p.xp || 0, isCurrentUser: p.id === session?.user?.id,
        })));
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
      if (recs.length === 0) {
        recs.push({ icon: <Target size={18} />, type: 'Continue where you left off', title: topics.continue, subtitle: '60% complete · ~12 min left', action: 'Resume', link: '/learn' });
      }
      if (recs.length < 4) {
        recs.push({ icon: <AlertTriangle size={18} />, type: 'Memory fading', title: `${sub} · ${topics.fading}`, subtitle: 'Last studied 5 days ago', action: 'Review now', link: '/learn' });
      }
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

  // Due topics from history
  const dueTopics = useMemo(() => {
    try {
      const history = JSON.parse(localStorage.getItem('saathi-learn-history') || '[]');
      return history.filter((h: any) => !h.completed).length;
    } catch { return 0; }
  }, []);

  const readinessColor = user.readinessScore >= 80 ? 'hsl(var(--success))' : user.readinessScore >= 50 ? 'hsl(var(--warning))' : 'hsl(var(--danger))';

  const handleMoodSelect = (i: number) => {
    setSelectedMood(i);
    const mood = moods[i];
    const newReadiness = Math.max(20, user.readinessScore - Math.floor(mood.risk * 0.3));
    setUser(prev => ({
      ...prev, mood: mood.label,
      readinessScore: mood.risk < 30 ? Math.min(95, prev.readinessScore + 5) : newReadiness,
    }));
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 space-y-6">
        {recoveryMode && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="card-base flex items-center gap-4" style={{ borderColor: 'hsl(var(--accent))' }}>
            <Moon size={20} style={{ color: 'hsl(var(--accent))' }} />
            <div className="flex-1">
              <p className="font-display font-semibold text-sm flex items-center gap-1.5" style={{ color: 'hsl(var(--text))' }}><Moon size={14} /> Recovery Mode Active</p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>No pressure, no timers. Saathi thinks you need a gentler day.</p>
            </div>
            <button onClick={() => setRecoveryMode(false)} className="text-xs font-medium px-3 py-1 rounded-lg border border-border" style={{ color: 'hsl(var(--text-secondary))' }}>Exit mode</button>
          </motion.div>
        )}

        {/* Readiness Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-base">
          <p className="text-sm mb-1" style={{ color: 'hsl(var(--muted))' }}>{greeting()}, {user.name || 'Student'}</p>
          <h2 className="font-display text-xl font-bold mb-4" style={{ color: 'hsl(var(--text))' }}>Today's Readiness</h2>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="relative w-40 h-20 flex-shrink-0">
              <svg viewBox="0 0 120 65" className="w-full h-full">
                <path d="M 10 58 A 50 50 0 0 1 110 58" fill="none" stroke="hsl(var(--surface2))" strokeWidth="10" strokeLinecap="round" />
                <path d="M 10 58 A 50 50 0 0 1 43 15" fill="none" stroke="hsl(var(--danger))" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
                <path d="M 43 15 A 50 50 0 0 1 77 15" fill="none" stroke="hsl(var(--warning))" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
                <path d="M 77 15 A 50 50 0 0 1 110 58" fill="none" stroke="hsl(var(--success))" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
                <line x1="60" y1="58"
                  x2={60 + 40 * Math.cos(Math.PI - (user.readinessScore / 100) * Math.PI)}
                  y2={58 - 40 * Math.sin(Math.PI - (user.readinessScore / 100) * Math.PI)}
                  stroke="hsl(var(--text))" strokeWidth="2.5" strokeLinecap="round" />
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
        </motion.div>

        {/* Mood Check-in */}
        {selectedMood === null && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-base">
            <h3 className="font-display text-lg font-semibold mb-4" style={{ color: 'hsl(var(--text))' }}>How are you feeling right now?</h3>
            <div className="flex flex-wrap gap-3 justify-center">
              {moods.map((m, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <button onClick={() => handleMoodSelect(i)} className="mood-orb w-12 h-12 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: 'hsl(var(--surface2))', color: 'hsl(var(--accent))' }}>{m.icon}</button>
                  <span className="text-[10px]" style={{ color: 'hsl(var(--muted))' }}>{m.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {selectedMood !== null && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card-base text-center py-4">
            <div className="mb-2" style={{ color: 'hsl(var(--accent))' }}>{moods[selectedMood].icon}</div>
            <p className="font-display text-sm" style={{ color: 'hsl(var(--text))' }}>
              Session adjusted for your <strong>{moods[selectedMood].label.toLowerCase()}</strong> mood
            </p>
          </motion.div>
        )}

        {/* Recommendation Feed */}
        <div>
          <h3 className="font-display text-lg font-semibold mb-3" style={{ color: 'hsl(var(--text))' }}>What Saathi thinks you need today</h3>
          <div className="space-y-3">
            {recommendations.map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="card-base flex items-center gap-4 cursor-pointer group" onClick={() => navigate(r.link)}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}>{r.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium mb-1" style={{ color: 'hsl(var(--muted))' }}>{r.type}</p>
                  <p className="text-sm font-semibold truncate" style={{ color: 'hsl(var(--text))' }}>{r.title}</p>
                  <p className="text-xs" style={{ color: 'hsl(var(--text-secondary))' }}>{r.subtitle}</p>
                </div>
                <span className="text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'hsl(var(--accent))' }}>
                  {r.action} <ArrowRight size={14} />
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="card-base flex items-center gap-4 cursor-pointer" onClick={() => navigate('/mental-health')}>
            <Timer size={24} style={{ color: 'hsl(var(--accent))' }} />
            <div className="flex-1">
              <p className="font-display text-sm font-semibold" style={{ color: 'hsl(var(--text))' }}>Focus Timer (Pomodoro)</p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>25 min study · 5 min break</p>
            </div>
            <ArrowRight size={16} style={{ color: 'hsl(var(--accent))' }} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="card-base flex items-center gap-4 cursor-pointer" onClick={() => navigate('/mental-health')}>
            <Brain size={24} style={{ color: 'hsl(var(--accent))' }} />
            <div className="flex-1">
              <p className="font-display text-sm font-semibold" style={{ color: 'hsl(var(--text))' }}>Mental Wellbeing</p>
              <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>Breathing, CBT & more</p>
            </div>
            <ArrowRight size={16} style={{ color: 'hsl(var(--accent))' }} />
          </motion.div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden lg:block w-72 space-y-6">
        <div className="card-base text-center">
          <div className="relative inline-block mb-3">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-display font-bold mx-auto"
              style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}>{user.name?.[0] || '?'}</div>
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
            <div className="w-full h-1.5 rounded-full" style={{ background: 'hsl(var(--surface2))' }}>
              <div className="h-full rounded-full" style={{ width: `${(user.xp / 500) * 100}%`, background: 'hsl(var(--accent))' }} />
            </div>
          </div>
        </div>

        {/* Burnout Gauge */}
        <div className="card-base text-center">
          <h4 className="font-display text-sm font-semibold mb-3" style={{ color: 'hsl(var(--text))' }}>Burnout Risk</h4>
          <div className="relative w-32 h-16 mx-auto mb-2">
            <svg viewBox="0 0 120 60" className="w-full h-full">
              <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="hsl(var(--surface2))" strokeWidth="8" strokeLinecap="round" />
              <path d="M 10 55 A 50 50 0 0 1 43 12" fill="none" stroke="hsl(var(--success))" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
              <path d="M 43 12 A 50 50 0 0 1 77 12" fill="none" stroke="hsl(var(--warning))" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
              <path d="M 77 12 A 50 50 0 0 1 110 55" fill="none" stroke="hsl(var(--danger))" strokeWidth="8" strokeLinecap="round" opacity="0.6" />
              <line x1="60" y1="55"
                x2={60 + 40 * Math.cos(Math.PI - (burnoutScore / 100) * Math.PI)}
                y2={55 - 40 * Math.sin(Math.PI - (burnoutScore / 100) * Math.PI)}
                stroke="hsl(var(--text))" strokeWidth="2" strokeLinecap="round" />
              <circle cx="60" cy="55" r="3" fill="hsl(var(--text))" />
            </svg>
          </div>
          <span className="stat-number text-2xl font-bold" style={{
            color: burnoutScore > 60 ? 'hsl(var(--danger))' : burnoutScore > 30 ? 'hsl(var(--warning))' : 'hsl(var(--success))'
          }}>{burnoutScore}</span>
          <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted))' }}>
            {burnoutScore > 60 ? 'High — consider a break' : burnoutScore > 30 ? 'Moderate — keep it steady' : 'Low — you\'re doing great'}
          </p>
        </div>

        <div className="card-base text-center">
          <Flame size={28} className="mx-auto mb-1" style={{ color: 'hsl(var(--warning))' }} />
          <p className="stat-number text-2xl font-bold mt-1" style={{ color: 'hsl(var(--text))' }}>{user.streak}</p>
          <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>day streak</p>
        </div>

        {!recoveryMode && (
        <div className="card-base">
          <h4 className="font-display text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'hsl(var(--text))' }}>
            <Trophy size={16} style={{ color: 'hsl(var(--warning))' }} /> Leaderboard
          </h4>
          {lbLoading ? (
            <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin" style={{ color: 'hsl(var(--accent))' }} /></div>
          ) : leaderboard.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: 'hsl(var(--muted))' }}>No rankings yet — take a quiz!</p>
          ) : (
            leaderboard.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 text-sm" style={{
                borderLeft: p.isCurrentUser ? '2px solid hsl(var(--accent))' : '2px solid transparent', paddingLeft: '8px',
              }}>
                <span className="w-4 stat-number text-xs" style={{ color: i < 3 ? 'hsl(var(--warning))' : 'hsl(var(--muted))' }}>
                  {i === 0 ? <Trophy size={12} /> : `#${i + 1}`}
                </span>
                <span className="flex-1 truncate" style={{ color: 'hsl(var(--text))' }}>{p.isCurrentUser ? `${p.name} (You)` : p.name}</span>
                <span className="stat-number text-xs" style={{ color: 'hsl(var(--accent))' }}>{p.xp} XP</span>
              </div>
            ))
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
