// import { useState, useRef, useEffect, useCallback } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useApp } from '@/contexts/AppContext';
// import { useTheme } from '@/contexts/ThemeContext';
// import { supabase } from '@/integrations/supabase/client';
// import { Zap, HelpCircle, Loader2, Sparkles, AlertCircle, Wind, Shield, Swords, Heart, Trophy, Flame, Users } from 'lucide-react';
// import { toast } from 'sonner';

// interface Question {
//   question: string;
//   options: string[];
//   correct: number;
//   explanation: string;
//   concept: string;
//   difficulty: 'easy' | 'medium' | 'hard';
//   hint?: string;
// }

// interface BossQuestion {
//   question: string;
//   options: string[];
//   correct: number;
//   explanation: string;
// }

// const Quiz = () => {
//   const { user, setUser } = useApp();
//   const { recoveryMode } = useTheme();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const state = location.state as { subject?: string; subtopic?: string } | null;

//   const [subject, setSubject] = useState(state?.subject || '');
//   const [subtopic, setSubtopic] = useState(state?.subtopic || '');
//   const [numQuestions, setNumQuestions] = useState(5);
//   const [quizStarted, setQuizStarted] = useState(false);

//   const [questions, setQuestions] = useState<Question[]>([]);
//   const [currentQ, setCurrentQ] = useState(0);
//   const [selected, setSelected] = useState<number | null>(null);
//   const [answered, setAnswered] = useState(false);
//   const [showHint, setShowHint] = useState(false);
//   const [correctStreak, setCorrectStreak] = useState(0);
//   const [wrongStreak, setWrongStreak] = useState(0);
//   const [totalCorrect, setTotalCorrect] = useState(0);
//   const [sessionXP, setSessionXP] = useState(0);
//   const [showBoss, setShowBoss] = useState(false);
//   const [bossHP, setBossHP] = useState(99);
//   const [bossShake, setBossShake] = useState(false);
//   const [bossDefeated, setBossDefeated] = useState(false);
//   const [brainFog, setBrainFog] = useState(false);
//   const [quizDone, setQuizDone] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [stuckCount, setStuckCount] = useState(0);
//   const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
//   const [encouragement, setEncouragement] = useState<string | null>(null);
//   const [breakTimer, setBreakTimer] = useState(30);
//   const [breakActive, setBreakActive] = useState(false);
//   const [breathPhase, setBreathPhase] = useState<'idle' | 'in' | 'hold' | 'out'>('idle');
//   const [weakConcepts, setWeakConcepts] = useState<string[]>([]);
//   const [bossTimer, setBossTimer] = useState(60);
//   const [bossQCount, setBossQCount] = useState(0);
//   const [bossQuestions, setBossQuestions] = useState<BossQuestion[]>([]);
//   const [bossCurrentQ, setBossCurrentQ] = useState(0);
//   const [bossSelected, setBossSelected] = useState<number | null>(null);
//   const [bossAnswered, setBossAnswered] = useState(false);
//   const [bossLoading, setBossLoading] = useState(false);
//   const qStartTime = useRef(Date.now());
//   const responseTimes = useRef<number[]>([]);

//   const getQuickPicks = () => {
//     const subjectTopics: Record<string, string[]> = {
//       Physics: ['Thermodynamics', "Newton's Laws", 'Electrostatics', 'Optics'],
//       Chemistry: ['Chemical Bonding', 'Organic Reactions', 'Periodic Table', 'Equilibrium'],
//       Mathematics: ['Quadratic Equations', 'Calculus', 'Probability', 'Trigonometry'],
//       Biology: ['Cell Division', 'Genetics', 'Ecology', 'Human Physiology'],
//       'Computer Science': ['Binary Search', 'Data Structures', 'OOP', 'SQL'],
//       English: ['Grammar', 'Poetry', 'Essay Writing', 'Comprehension'],
//       History: ['Freedom Movement', 'World War II', 'Mughal Empire', 'French Revolution'],
//       Economics: ['Supply & Demand', 'GDP', 'Banking', 'Inflation'],
//     };
//     const subs = user.subjects.length > 0 ? user.subjects : ['Physics', 'Chemistry', 'Mathematics'];
//     const picks: { s: string; t: string }[] = [];
//     subs.forEach(sub => {
//       const topics = subjectTopics[sub] || [];
//       topics.slice(0, 2).forEach(t => picks.push({ s: sub, t }));
//     });
//     return picks.slice(0, 6);
//   };

//   const fetchQuiz = useCallback(async () => {
//     if (!subject.trim() || !subtopic.trim()) { toast.error('Please enter subject and topic'); return; }
//     setLoading(true);
//     try {
//       const { data, error } = await supabase.functions.invoke('generate-learning', { body: { subject, subtopic, mode: 'quiz', numQuestions } });
//       if (error) throw error;
//       const result = data?.result;
//       if (Array.isArray(result) && result.length > 0) {
//         setQuestions(result.slice(0, numQuestions));
//         setQuizStarted(true);
//         qStartTime.current = Date.now();
//       } else { toast.error('Could not generate quiz. Try again.'); }
//     } catch (err: any) { toast.error(err.message || 'Failed to generate quiz'); }
//     finally { setLoading(false); }
//   }, [subject, subtopic, numQuestions]);

//   useEffect(() => {
//     if (state?.subject && state?.subtopic && !quizStarted && questions.length === 0) fetchQuiz();
//   }, [state, quizStarted, questions.length, fetchQuiz]);

//   // Adaptive difficulty & boss trigger after 3 consecutive correct
//   useEffect(() => {
//     if (correctStreak >= 3 && difficulty !== 'hard') {
//       setDifficulty(prev => prev === 'easy' ? 'medium' : 'hard');
//       setEncouragement('Difficulty increased — you\'re on fire!');
//       setTimeout(() => setEncouragement(null), 3000);
//     }
//     // Boss battle after 3 consecutive correct answers
//     if (correctStreak >= 3 && !showBoss && !recoveryMode && quizStarted) {
//       setCorrectStreak(0);
//       setTimeout(() => triggerBoss(), 1000);
//     }
//   }, [correctStreak]);

//   // Brain fog after 3 consecutive wrong answers
//   useEffect(() => {
//     if (wrongStreak >= 3 && !brainFog) setBrainFog(true);
//   }, [wrongStreak]);

//   useEffect(() => {
//     if (!breakActive) return;
//     if (breakTimer <= 0) { setBreakActive(false); setBrainFog(false); setDifficulty('easy'); setEncouragement('Welcome back — switched to easier questions.'); setTimeout(() => setEncouragement(null), 4000); return; }
//     const t = setTimeout(() => setBreakTimer(prev => prev - 1), 1000);
//     return () => clearTimeout(t);
//   }, [breakActive, breakTimer]);

//   useEffect(() => {
//     if (!breakActive) { setBreathPhase('idle'); return; }
//     const cycle = () => { setBreathPhase('in'); setTimeout(() => setBreathPhase('hold'), 4000); setTimeout(() => setBreathPhase('out'), 8000); setTimeout(() => setBreathPhase('in'), 12000); };
//     cycle();
//     const interval = setInterval(cycle, 12000);
//     return () => clearInterval(interval);
//   }, [breakActive]);

//   // Boss timer
//   useEffect(() => {
//     if (!showBoss || bossDefeated) return;
//     if (bossTimer <= 0) { setShowBoss(false); setBossDefeated(false); setBossHP(99); setBossTimer(60); setBossQCount(0); setBossQuestions([]); setBossCurrentQ(0); toast.error("Time's up! Boss escaped. Keep going!"); return; }
//     const t = setTimeout(() => setBossTimer(prev => prev - 1), 1000);
//     return () => clearTimeout(t);
//   }, [showBoss, bossTimer, bossDefeated]);

//   const q = questions[currentQ];

//   const handleAnswer = (index: number) => {
//     if (answered) return;
//     const rt = Date.now() - qStartTime.current;
//     responseTimes.current.push(rt);
//     const avg = responseTimes.current.length > 2 ? responseTimes.current.reduce((a, b) => a + b, 0) / responseTimes.current.length : rt;
//     const ratio = rt / avg;
//     if (responseTimes.current.length > 3 && ratio > 2.2) setBrainFog(true);

//     setSelected(index);
//     setAnswered(true);
//     const isCorrect = index === q.correct;

//     if (isCorrect) {
//       const xp = q.difficulty === 'hard' ? 30 : q.difficulty === 'medium' ? 20 : 10;
//       setSessionXP(prev => prev + xp);
//       setTotalCorrect(prev => prev + 1);
//       setCorrectStreak(prev => prev + 1);
//       setWrongStreak(0);
//       setUser(prev => ({ ...prev, xp: prev.xp + xp }));
//     } else {
//       setCorrectStreak(0);
//       setWrongStreak(prev => prev + 1);
//       if (q.concept && !weakConcepts.includes(q.concept)) setWeakConcepts(prev => [...prev, q.concept]);
//     }

//     // Boss trigger is now handled by the correctStreak useEffect above
//   };

//   const triggerBoss = async () => {
//     setBossLoading(true);
//     setShowBoss(true);
//     setBossHP(99);
//     setBossTimer(60);
//     setBossDefeated(false);
//     setBossQCount(0);
//     setBossCurrentQ(0);
//     setBossSelected(null);
//     setBossAnswered(false);

//     try {
//       const { data, error } = await supabase.functions.invoke('generate-learning', {
//         body: { subject, subtopic, mode: 'boss-battle' },
//       });
//       if (error) throw error;
//       const result = data?.result;
//       if (Array.isArray(result) && result.length > 0) {
//         setBossQuestions(result.slice(0, 3));
//       } else {
//         // Fallback boss questions
//         setBossQuestions([
//           { question: `What is the most important application of ${subtopic} in real life?`, options: ['Engineering', 'Medicine', 'Space Science', 'All of the above'], correct: 3, explanation: 'This concept has wide applications across all fields!' },
//           { question: `Which concept is a prerequisite for understanding ${subtopic}?`, options: ['Basic Mathematics', 'Fundamentals', 'Observation', 'Critical thinking'], correct: 1, explanation: 'Strong fundamentals are key to mastering any topic.' },
//           { question: `How would you explain ${subtopic} to a 5-year-old?`, options: ['Using analogies', 'With formulas', 'Through experiments', 'Using simple analogies and examples'], correct: 3, explanation: 'Simple analogies make complex concepts accessible.' },
//         ]);
//       }
//     } catch {
//       setBossQuestions([
//         { question: `What is the core principle behind ${subtopic}?`, options: ['Conservation', 'Equilibrium', 'Transformation', 'Depends on context'], correct: 3, explanation: 'Context matters in understanding core principles.' },
//         { question: `If you could teach ${subtopic} in one sentence, what would it be?`, options: ['A formula', 'A story', 'An analogy', 'A question'], correct: 2, explanation: 'Analogies are the most powerful teaching tools.' },
//         { question: `What makes ${subtopic} challenging for most students?`, options: ['Abstract thinking', 'Too many formulas', 'Lack of practice', 'All of these'], correct: 3, explanation: 'Multiple factors contribute to difficulty.' },
//       ]);
//     } finally {
//       setBossLoading(false);
//     }
//   };

//   const handleBossAnswer = (index: number) => {
//     if (bossAnswered) return;
//     setBossSelected(index);
//     setBossAnswered(true);
//     const bq = bossQuestions[bossCurrentQ];
//     if (!bq) return;

//     if (index === bq.correct) {
//       const newHP = bossHP - 33;
//       setBossHP(newHP);
//       setBossShake(true);
//       setBossQCount(prev => prev + 1);
//       setTimeout(() => setBossShake(false), 500);
//       if (newHP <= 0) {
//         setBossDefeated(true);
//         setSessionXP(prev => prev + 80);
//         setUser(prev => ({ ...prev, xp: prev.xp + 80 }));
//       }
//     }
//   };

//   const nextBossQuestion = () => {
//     if (bossCurrentQ < bossQuestions.length - 1 && !bossDefeated) {
//       setBossCurrentQ(prev => prev + 1);
//       setBossSelected(null);
//       setBossAnswered(false);
//     } else if (!bossDefeated) {
//       // Boss survived
//       setShowBoss(false);
//       setBossQuestions([]);
//       toast('Boss survived! Keep going to trigger another battle!');
//     }
//   };

//   const handleStuck = () => {
//     setStuckCount(prev => prev + 1);
//     setAnswered(true);
//     setSelected(-1);
//     if (q.concept && !weakConcepts.includes(q.concept)) setWeakConcepts(prev => [...prev, q.concept]);
//     setEncouragement(`${Math.floor(Math.random() * 40) + 10} students also got stuck on this. You're not alone.`);
//     setTimeout(() => setEncouragement(null), 4000);
//   };

//   const nextQuestion = () => {
//     if (currentQ < questions.length - 1) {
//       setCurrentQ(prev => prev + 1);
//       setSelected(null); setAnswered(false); setShowHint(false);
//       qStartTime.current = Date.now();
//     } else setQuizDone(true);
//   };

//   const startBreak = () => { setBreakTimer(30); setBreakActive(true); };

//   const dismissBrainFog = (action: string) => {
//     setBrainFog(false);
//     setWrongStreak(0);
//     if (action === 'game') navigate('/games');
//     if (action === 'easier') { setDifficulty('easy'); setEncouragement('Switched to easier questions.'); setTimeout(() => setEncouragement(null), 3000); }
//     if (action === 'breathe') startBreak();
//   };

//   // Topic selection with question count
//   if (!quizStarted) {
//     return (
//       <div className="max-w-lg mx-auto px-4 py-12">
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//           <h2 className="font-display text-2xl font-bold mb-2 flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
//             <Sparkles size={22} style={{ color: 'hsl(var(--accent))' }} /> Adaptive Quiz
//           </h2>
//           <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted))' }}>AI generates questions that adapt to your level.</p>

//           <div className="space-y-4 mb-6">
//             <div>
//               <label className="text-xs font-medium mb-1.5 block" style={{ color: 'hsl(var(--text-secondary))' }}>Subject</label>
//               <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g., Physics, Biology..."
//                 className="w-full px-4 py-3 rounded-xl border border-border text-sm outline-none" style={{ background: 'hsl(var(--surface))', color: 'hsl(var(--text))' }} />
//             </div>
//             <div>
//               <label className="text-xs font-medium mb-1.5 block" style={{ color: 'hsl(var(--text-secondary))' }}>Topic</label>
//               <input type="text" value={subtopic} onChange={e => setSubtopic(e.target.value)} placeholder="e.g., Thermodynamics..."
//                 className="w-full px-4 py-3 rounded-xl border border-border text-sm outline-none" style={{ background: 'hsl(var(--surface))', color: 'hsl(var(--text))' }} />
//             </div>
//             <div>
//               <label className="text-xs font-medium mb-1.5 block" style={{ color: 'hsl(var(--text-secondary))' }}>Number of Questions</label>
//               <div className="flex gap-2">
//                 {[3, 5, 10].map(n => (
//                   <button key={n} onClick={() => setNumQuestions(n)}
//                     className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all border"
//                     style={{
//                       background: numQuestions === n ? 'hsl(var(--accent))' : 'hsl(var(--surface2))',
//                       color: numQuestions === n ? 'hsl(var(--primary-foreground))' : 'hsl(var(--text))',
//                       borderColor: numQuestions === n ? 'hsl(var(--accent))' : 'hsl(var(--border))',
//                     }}>{n} Qs</button>
//                 ))}
//               </div>
//             </div>
//           </div>

//           <div className="mb-6">
//             <p className="text-xs font-medium mb-2" style={{ color: 'hsl(var(--muted))' }}>Quick picks:</p>
//             <div className="flex flex-wrap gap-2">
//               {getQuickPicks().map((qp, i) => (
//                 <button key={i} onClick={() => { setSubject(qp.s); setSubtopic(qp.t); }}
//                   className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:border-accent"
//                   style={{
//                     background: subject === qp.s && subtopic === qp.t ? 'hsl(var(--accent-soft))' : 'hsl(var(--surface2))',
//                     borderColor: subject === qp.s && subtopic === qp.t ? 'hsl(var(--accent))' : 'hsl(var(--border))',
//                     color: 'hsl(var(--text))',
//                   }}>{qp.s} · {qp.t}</button>
//               ))}
//             </div>
//           </div>

//           <button onClick={fetchQuiz} disabled={!subject.trim() || !subtopic.trim() || loading}
//             className="btn-3d w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
//             {loading ? <><Loader2 size={16} className="animate-spin" /> Generating quiz...</> : <><Sparkles size={16} /> Start Quiz ({numQuestions} questions)</>}
//           </button>
//         </motion.div>
//       </div>
//     );
//   }

//   // Breathing break
//   if (breakActive) {
//     const circleScale = breathPhase === 'in' ? 1.4 : breathPhase === 'hold' ? 1.4 : 1;
//     return (
//       <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6" style={{ background: 'linear-gradient(180deg, hsl(180 30% 8%), hsl(220 30% 12%))' }}>
//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center max-w-sm">
//           <Wind size={40} className="mx-auto mb-4 text-white/60" />
//           <h2 className="font-display text-xl font-bold mb-2 text-white">Breathe with Saathi</h2>
//           <p className="text-sm mb-8 text-white/50">You'll resume with easier questions after this.</p>
//           <div className="relative flex items-center justify-center mb-8">
//             <motion.div animate={{ scale: circleScale }} transition={{ duration: 4, ease: 'easeInOut' }}
//               className="w-32 h-32 rounded-full flex items-center justify-center"
//               style={{ background: 'rgba(100,200,180,0.15)', border: '2px solid rgba(100,200,180,0.3)', boxShadow: '0 0 40px rgba(100,200,180,0.1)' }}>
//               <span className="font-display text-lg font-semibold text-white/80">
//                 {breathPhase === 'in' ? 'In' : breathPhase === 'hold' ? 'Hold' : breathPhase === 'out' ? 'Out' : '...'}
//               </span>
//             </motion.div>
//           </div>
//           <p className="stat-number text-3xl font-bold mb-2 text-white/80">{breakTimer}s</p>
//           <button onClick={() => { setBreakActive(false); setBrainFog(false); setDifficulty('easy'); }} className="mt-6 text-xs text-white/40 hover:text-white/60">Skip & resume →</button>
//         </motion.div>
//       </div>
//     );
//   }

//   // Brain Fog card
//   if (brainFog) {
//     return (
//       <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'linear-gradient(180deg, hsl(180 20% 10%), hsl(200 20% 14%))' }}>
//         <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full p-8 rounded-2xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
//           <div className="text-center mb-6">
//             <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(100,200,180,0.15)' }}>
//               <Shield size={28} className="text-white/60" />
//             </div>
//             <h3 className="font-display text-xl font-bold mb-2 text-white">Saathi noticed</h3>
//             <p className="text-sm text-white/50">Your brain might need a moment.<br/>Every option is valid. No guilt.</p>
//           </div>
//           <div className="space-y-2.5">
//             {[
//               { icon: <Wind size={16} />, label: 'Breathe with me — 30s', action: 'breathe' },
//               { icon: <Sparkles size={16} />, label: 'Play a mind break game', action: 'game' },
//               { icon: <Shield size={16} />, label: 'Give me easier questions', action: 'easier' },
//               { icon: <Zap size={16} />, label: "I'm fine, keep going →", action: 'continue' },
//             ].map(opt => (
//               <button key={opt.action} onClick={() => dismissBrainFog(opt.action)}
//                 className="w-full text-left flex items-center gap-3 p-3.5 rounded-xl transition-all hover:scale-[1.02]"
//                 style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
//                 <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white/60" style={{ background: 'rgba(255,255,255,0.08)' }}>{opt.icon}</span>
//                 <p className="text-sm font-medium text-white/80">{opt.label}</p>
//               </button>
//             ))}
//           </div>
//         </motion.div>
//       </div>
//     );
//   }

//   // Boss Battle with QUESTIONS
//   if (showBoss) {
//     const segments = [{ filled: bossHP > 66 }, { filled: bossHP > 33 }, { filled: bossHP > 0 }];
//     const bq = bossQuestions[bossCurrentQ];

//     if (bossDefeated) {
//       return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'linear-gradient(180deg, hsl(0 20% 8%), hsl(0 15% 12%))' }}>
//           <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 text-center max-w-sm">
//             <motion.div className="mb-4" animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] }} transition={{ duration: 0.6 }}><Trophy size={64} className="mx-auto text-yellow-400" /></motion.div>
//             <h2 className="font-display text-3xl font-bold mb-2 text-white">Victory!</h2>
//             <p className="text-sm mb-6 text-white/50">Boss defeated! +80 XP bonus earned.</p>
//             <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
//               className="inline-flex items-center gap-2 px-6 py-3 rounded-xl mb-6" style={{ background: 'rgba(255,215,0,0.15)', border: '1px solid rgba(255,215,0,0.3)' }}>
//               <Zap size={20} className="text-yellow-400" /><span className="stat-number text-2xl font-bold text-yellow-400">+80 XP</span>
//             </motion.div><br />
//             <button onClick={() => { setShowBoss(false); setBossQuestions([]); }} className="btn-3d px-8 py-3 font-semibold mt-2">Continue Quiz →</button>
//           </motion.div>
//         </div>
//       );
//     }

//     return (
//       <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'linear-gradient(180deg, hsl(0 20% 8%), hsl(0 15% 12%))' }}>
//         <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%)' }} />
//         <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 w-full max-w-lg">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="font-display text-xl font-bold text-white flex items-center gap-2"><Swords size={20} className="text-red-400" /> Boss Battle</h2>
//             <span className="stat-number text-sm px-3 py-1 rounded-full" style={{ background: bossTimer <= 10 ? 'rgba(255,60,60,0.2)' : 'rgba(255,255,255,0.1)', color: bossTimer <= 10 ? '#ff6060' : 'rgba(255,255,255,0.6)' }}>⏱ {bossTimer}s</span>
//           </div>

//           <div className="flex items-center gap-4 mb-4">
//             <motion.div animate={bossShake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : bossHP <= 33 ? { x: [-2, 2, -2, 2, 0] } : {}}
//               transition={{ duration: 0.4, repeat: bossHP <= 33 && !bossShake ? Infinity : 0 }}
//               className="text-6xl" style={{ filter: `drop-shadow(0 0 ${bossHP > 60 ? 30 : 15}px rgba(220,38,38,0.5))` }}>🐉</motion.div>
//             <div className="flex-1">
//               <div className="flex gap-1.5 mb-1">
//                 {segments.map((seg, i) => (
//                   <div key={i} className="flex-1 h-3 rounded-md overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
//                     <motion.div initial={{ width: '100%' }} animate={{ width: seg.filled ? '100%' : '0%' }} className="h-full rounded-md"
//                       style={{ background: bossHP <= 33 ? 'hsl(0 70% 50%)' : bossHP <= 66 ? 'hsl(28 80% 55%)' : 'hsl(0 60% 50%)' }} />
//                   </div>
//                 ))}
//               </div>
//               <p className="stat-number text-xs text-white/40">HP: {Math.max(0, bossHP)}/99 · Q{bossCurrentQ + 1}/3</p>
//             </div>
//           </div>

//           {bossLoading ? (
//             <div className="text-center py-12">
//               <Loader2 size={32} className="animate-spin mx-auto text-white/40 mb-3" />
//               <p className="text-sm text-white/50">Boss is preparing questions...</p>
//             </div>
//           ) : bq ? (
//             <div className="space-y-3">
//               <div className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
//                 <p className="text-sm font-medium text-white leading-relaxed">{bq.question}</p>
//               </div>

//               <div className="space-y-2">
//                 {bq.options.map((opt, i) => {
//                   const isCorrect = bossAnswered && i === bq.correct;
//                   const isWrong = bossAnswered && i === bossSelected && i !== bq.correct;
//                   return (
//                     <button key={i} onClick={() => handleBossAnswer(i)} disabled={bossAnswered}
//                       className="w-full text-left p-3 rounded-xl text-sm font-medium flex items-center gap-3 transition-all"
//                       style={{
//                         background: isCorrect ? 'rgba(80,200,120,0.15)' : isWrong ? 'rgba(255,80,80,0.15)' : 'rgba(255,255,255,0.06)',
//                         border: `1px solid ${isCorrect ? 'rgba(80,200,120,0.4)' : isWrong ? 'rgba(255,80,80,0.4)' : 'rgba(255,255,255,0.08)'}`,
//                         color: 'rgba(255,255,255,0.85)',
//                       }}>
//                       <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono flex-shrink-0"
//                         style={{ borderColor: isCorrect ? 'rgba(80,200,120,0.6)' : isWrong ? 'rgba(255,80,80,0.6)' : 'rgba(255,255,255,0.2)' }}>
//                         {String.fromCharCode(65 + i)}
//                       </span>
//                       {opt}
//                     </button>
//                   );
//                 })}
//               </div>

//               {bossAnswered && (
//                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
//                   <p className="text-xs text-white/70">{bq.explanation}</p>
//                   {!bossDefeated && (
//                     <button onClick={nextBossQuestion} className="mt-2 px-4 py-2 rounded-lg text-xs font-medium"
//                       style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
//                       {bossCurrentQ < bossQuestions.length - 1 ? 'Next Boss Question →' : 'End Battle'}
//                     </button>
//                   )}
//                 </motion.div>
//               )}
//             </div>
//           ) : (
//             <p className="text-white/50 text-center py-8">No questions available</p>
//           )}

//           <button onClick={() => { setShowBoss(false); setBossQuestions([]); }} className="block mx-auto mt-4 text-xs text-white/30">Skip boss</button>
//         </motion.div>
//       </div>
//     );
//   }

//   // Quiz Done
//   if (quizDone) {
//     const accuracy = Math.round((totalCorrect / questions.length) * 100);
//     return (
//       <div className="max-w-lg mx-auto px-4 py-12">
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-base text-center">
//           <Sparkles size={36} className="mx-auto mb-3" style={{ color: 'hsl(var(--accent))' }} />
//           <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'hsl(var(--text))' }}>Session Complete!</h2>
//           <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted))' }}>{subject} · {subtopic}</p>
//           <div className="grid grid-cols-4 gap-4 my-6">
//             <div><p className="stat-number text-2xl font-bold" style={{ color: 'hsl(var(--accent))' }}>{accuracy}%</p><p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>Accuracy</p></div>
//             <div><p className="stat-number text-2xl font-bold" style={{ color: 'hsl(var(--accent))' }}>+{sessionXP}</p><p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>XP</p></div>
//             <div><p className="stat-number text-2xl font-bold" style={{ color: 'hsl(var(--accent))' }}>{totalCorrect}/{questions.length}</p><p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>Correct</p></div>
//             <div><p className="stat-number text-2xl font-bold" style={{ color: 'hsl(var(--warning))' }}>{stuckCount}</p><p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>Stuck</p></div>
//           </div>
//           {weakConcepts.length > 0 && (
//             <div className="p-3 rounded-xl mb-4 text-left" style={{ background: 'hsl(var(--surface2))' }}>
//               <p className="text-xs font-medium mb-2" style={{ color: 'hsl(var(--warning))' }}>Weak areas:</p>
//               <div className="flex flex-wrap gap-1.5">
//                 {weakConcepts.map((c, i) => (
//                   <span key={i} className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--warning) / 0.15)', color: 'hsl(var(--warning))' }}>{c}</span>
//                 ))}
//               </div>
//             </div>
//           )}
//           <div className="flex gap-3 justify-center">
//             <button onClick={() => navigate('/revision')} className="btn-3d px-6 py-2.5 text-sm font-semibold">Create flashcards →</button>
//             <button onClick={() => { setQuizStarted(false); setQuizDone(false); setCurrentQ(0); setSessionXP(0); setTotalCorrect(0); setCorrectStreak(0); setWrongStreak(0); setStuckCount(0); setQuestions([]); setWeakConcepts([]); }}
//               className="btn-3d-ghost px-6 py-2.5 text-sm">New quiz</button>
//           </div>
//         </motion.div>
//       </div>
//     );
//   }

//   if (!q) return null;

//   return (
//     <div className="max-w-3xl mx-auto px-4 lg:px-8 py-6">
//       <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
//         <div className="flex items-center gap-3">
//           <button onClick={() => setQuizStarted(false)} className="text-xs" style={{ color: 'hsl(var(--muted))' }}>← Back</button>
//           <span className="px-2 py-0.5 rounded text-xs font-medium" style={{
//             background: difficulty === 'hard' ? 'hsl(var(--danger) / 0.15)' : difficulty === 'medium' ? 'hsl(var(--warning) / 0.15)' : 'hsl(var(--success) / 0.15)',
//             color: difficulty === 'hard' ? 'hsl(var(--danger))' : difficulty === 'medium' ? 'hsl(var(--warning))' : 'hsl(var(--success))',
//           }}>{difficulty}</span>
//         </div>
//         <div className="flex items-center gap-3">
//           <button onClick={startBreak} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-border hover:border-accent transition-all" style={{ color: 'hsl(var(--muted))' }}>
//             <Wind size={12} /> 30s break
//           </button>
//           <span className="text-sm" style={{ color: 'hsl(var(--muted))' }}>Q{currentQ + 1}/{questions.length}</span>
//           <span className="stat-number text-sm flex items-center gap-1" style={{ color: 'hsl(var(--accent))' }}><Zap size={14} /> +{sessionXP}</span>
//           {correctStreak >= 2 && <span className="stat-number text-sm flex items-center gap-1" style={{ color: 'hsl(var(--warning))' }}><Flame size={14} /> {correctStreak}</span>}
//         </div>
//       </div>

//       <AnimatePresence>
//         {encouragement && (
//           <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="card-base mb-4 text-center py-2">
//             <p className="text-sm font-display" style={{ color: 'hsl(var(--accent))' }}>{encouragement}</p>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       <div className="flex gap-1 mb-6">
//         {questions.map((_, i) => (
//           <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i < currentQ ? 'hsl(var(--accent))' : i === currentQ ? 'hsl(var(--accent) / 0.5)' : 'hsl(var(--surface2))' }} />
//         ))}
//       </div>

//       <AnimatePresence mode="wait">
//         <motion.div key={currentQ} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
//           <div className="card-base mb-4">
//             <p className="text-xs mb-2" style={{ color: 'hsl(var(--muted))' }}>{q.concept}</p>
//             <h3 className="text-base font-medium mb-1" style={{ color: 'hsl(var(--text))' }}>{q.question}</h3>
//             {q.hint && !showHint && !answered && (
//               <button onClick={() => setShowHint(true)} className="flex items-center gap-1 text-xs mt-2" style={{ color: 'hsl(var(--accent))' }}><HelpCircle size={12} /> Hint</button>
//             )}
//             {showHint && <p className="text-xs mt-2 p-2 rounded-lg" style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--text-secondary))' }}>💡 {q.hint}</p>}
//           </div>

//           <div className="space-y-3">
//             {q.options.map((opt, i) => {
//               const isCorrect = answered && i === q.correct;
//               const isWrong = answered && i === selected && i !== q.correct;
//               return (
//                 <button key={i} onClick={() => handleAnswer(i)} disabled={answered}
//                   className={`answer-tile w-full text-left text-sm font-medium flex items-center gap-3 ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
//                   style={{
//                     borderColor: isCorrect ? 'hsl(var(--success))' : isWrong ? 'hsl(var(--danger))' : undefined,
//                     background: isCorrect ? 'hsl(var(--success) / 0.1)' : isWrong ? 'hsl(var(--danger) / 0.1)' : undefined,
//                     color: 'hsl(var(--text))',
//                     animation: isCorrect ? 'correctBounce3D 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' : isWrong ? 'wrongShake3D 0.4s ease' : undefined,
//                   }}>
//                   <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono"
//                     style={{ borderColor: isCorrect ? 'hsl(var(--success))' : isWrong ? 'hsl(var(--danger))' : 'hsl(var(--border))' }}>{String.fromCharCode(65 + i)}</span>
//                   {opt}
//                 </button>
//               );
//             })}
//           </div>

//           {!answered && (
//             <div className="flex items-center justify-between mt-4">
//               <button onClick={handleStuck} className="flex items-center gap-2 text-xs" style={{ color: 'hsl(var(--muted))' }}><AlertCircle size={14} /> I'm stuck</button>
//               {stuckCount > 0 && <span className="text-[11px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'hsl(var(--warning) / 0.1)', color: 'hsl(var(--warning))' }}><Users size={10} /> {stuckCount} stuck today</span>}
//             </div>
//           )}

//           {answered && (
//             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-base mt-4">
//               {selected === -1 && <p className="font-display text-sm mb-2" style={{ color: 'hsl(var(--warning))' }}>Correct answer: <strong>{q.options[q.correct]}</strong></p>}
//               <p className="font-display text-sm" style={{ color: 'hsl(var(--text))' }}>{q.explanation}</p>
//               <button onClick={nextQuestion} className="btn-3d text-sm mt-3 px-6 py-2">{currentQ < questions.length - 1 ? 'Next →' : 'Finish →'}</button>
//             </motion.div>
//           )}
//         </motion.div>
//       </AnimatePresence>
//     </div>
//   );
// };

// export default Quiz;


import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { useTheme } from '@/contexts/ThemeContext';
import { callBackend } from '@/lib/backend';
import { Zap, HelpCircle, Loader2, Sparkles, AlertCircle, Wind, Shield, Swords, Trophy, Flame, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Question {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  concept: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hint?: string;
}

interface BossQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

// ── Neural Network Background Canvas ─────────────────────────────────────────
const NeuralBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const NUM = Math.min(65, Math.floor(window.innerWidth / 22));
    const DIST = 140;

    interface P { x:number;y:number;z:number;vx:number;vy:number;vz:number;r:number; }
    const pts: P[] = Array.from({ length: NUM }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      z: Math.random() * 2 + 0.3, vx: (Math.random()-0.5)*0.35, vy: (Math.random()-0.5)*0.35,
      vz: (Math.random()-0.5)*0.005, r: Math.random() * 2.5 + 1,
    }));

    const onMM = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMM);

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        const dx = mouseRef.current.x - p.x, dy = mouseRef.current.y - p.y;
        const d = Math.sqrt(dx*dx+dy*dy);
        if (d < 120) { const f=(120-d)/120*0.6; p.vx -= dx/d*f; p.vy -= dy/d*f; }
        p.x += p.vx*p.z; p.y += p.vy*p.z; p.z += p.vz;
        if (p.z<0.3||p.z>2.3) p.vz*=-1;
        if (p.x<0) p.x=canvas.width; if (p.x>canvas.width) p.x=0;
        if (p.y<0) p.y=canvas.height; if (p.y>canvas.height) p.y=0;
        p.vx*=0.995; p.vy*=0.995;
      });
      for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++) {
        const a=pts[i],b=pts[j];
        const dx=a.x-b.x,dy=a.y-b.y,dist=Math.sqrt(dx*dx+dy*dy);
        if (dist<DIST) {
          const alpha=(1-dist/DIST)*0.18*((a.z+b.z)/2);
          const mdx=mouseRef.current.x-(a.x+b.x)/2, mdy=mouseRef.current.y-(a.y+b.y)/2;
          const glow=Math.sqrt(mdx*mdx+mdy*mdy)<200?0.14:0;
          const g=ctx.createLinearGradient(a.x,a.y,b.x,b.y);
          g.addColorStop(0,`rgba(100,220,190,${alpha+glow})`);
          g.addColorStop(0.5,`rgba(160,130,255,${(alpha+glow)*0.7})`);
          g.addColorStop(1,`rgba(100,180,255,${alpha+glow})`);
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y);
          ctx.strokeStyle=g; ctx.lineWidth=0.7*((a.z+b.z)/2); ctx.stroke();
        }
      }
      pts.forEach(p => {
        const dx=mouseRef.current.x-p.x,dy=mouseRef.current.y-p.y;
        const near=Math.sqrt(dx*dx+dy*dy)<150;
        const alpha=0.4+p.z*0.2+(near?0.3:0);
        const r=p.r*p.z+(near?1:0);
        ctx.beginPath(); ctx.arc(p.x,p.y,r,0,Math.PI*2);
        const grd=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r*2.5);
        grd.addColorStop(0,`rgba(180,230,210,${alpha})`);
        grd.addColorStop(1,'rgba(100,160,255,0)');
        ctx.fillStyle=grd; ctx.fill();
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize',resize); window.removeEventListener('mousemove',onMM); };
  }, []);

  return <canvas ref={canvasRef} style={{ position:'fixed',inset:0,zIndex:0,opacity:0.7,pointerEvents:'none' }} />;
};

// ── Knowledge Mandala ──────────────────────────────────────────────────────────
const KnowledgeMandala = ({ visible }: { visible: boolean }) => {
  const syms = ['∇','Ω','Σ','φ','π','λ'];
  return (
    <div style={{ position:'fixed', right:-80, top:'50%', transform:'translateY(-50%)', zIndex:1, opacity:visible?0.17:0, transition:'opacity 1s', width:320, height:320, pointerEvents:'none' }}>
      <svg viewBox="0 0 320 320" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="160" cy="160" r="140" stroke="url(#mg1)" strokeWidth="0.5" strokeDasharray="4 6" opacity="0.6">
          <animateTransform attributeName="transform" type="rotate" values="0 160 160;360 160 160" dur="60s" repeatCount="indefinite"/>
        </circle>
        <circle cx="160" cy="160" r="100" stroke="url(#mg2)" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.7">
          <animateTransform attributeName="transform" type="rotate" values="360 160 160;0 160 160" dur="40s" repeatCount="indefinite"/>
        </circle>
        <circle cx="160" cy="160" r="60" stroke="url(#mg1)" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.8">
          <animateTransform attributeName="transform" type="rotate" values="0 160 160;360 160 160" dur="25s" repeatCount="indefinite"/>
        </circle>
        <circle cx="160" cy="160" r="12" fill="url(#cg)" opacity="0.9">
          <animate attributeName="r" values="10;14;10" dur="3s" repeatCount="indefinite"/>
        </circle>
        {syms.map((s,i)=>{
          const a=(i/syms.length)*360;
          return (
            <g key={i}>
              <circle cx="160" cy="20" r="10" fill="rgba(100,220,190,0.12)" stroke="rgba(100,220,190,0.35)" strokeWidth="0.5">
                <animateTransform attributeName="transform" type="rotate" values={`${a} 160 160;${a+360} 160 160`} dur="60s" repeatCount="indefinite"/>
              </circle>
              <text x="160" y="24" textAnchor="middle" fontSize="8" fill="rgba(150,240,210,0.7)" fontFamily="serif">
                {s}
                <animateTransform attributeName="transform" type="rotate" values={`${a} 160 160;${a+360} 160 160`} dur="60s" repeatCount="indefinite"/>
              </text>
            </g>
          );
        })}
        {Array.from({length:8}).map((_,i)=>{
          const a=(i/8)*Math.PI*2;
          return <line key={i} x1={160+Math.cos(a)*20} y1={160+Math.sin(a)*20} x2={160+Math.cos(a)*135} y2={160+Math.sin(a)*135} stroke="rgba(180,140,255,0.15)" strokeWidth="0.4" strokeDasharray="2 4">
            <animateTransform attributeName="transform" type="rotate" values="0 160 160;360 160 160" dur="80s" repeatCount="indefinite"/>
          </line>;
        })}
        <defs>
          <radialGradient id="cg" cx="50%" cy="50%"><stop offset="0%" stopColor="rgba(100,230,200,1)"/><stop offset="100%" stopColor="rgba(100,130,255,0)"/></radialGradient>
          <linearGradient id="mg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="rgba(100,220,190,0.8)"/><stop offset="100%" stopColor="rgba(100,130,255,0.8)"/></linearGradient>
          <linearGradient id="mg2" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="rgba(200,160,255,0.8)"/><stop offset="100%" stopColor="rgba(100,220,190,0.8)"/></linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// ── Tilt Card ─────────────────────────────────────────────────────────────────
const TiltCard = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el=ref.current; if(!el) return;
    const r=el.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-0.5, y=(e.clientY-r.top)/r.height-0.5;
    el.style.transform=`perspective(700px) rotateY(${x*7}deg) rotateX(${-y*7}deg) scale3d(1.015,1.015,1.015)`;
    el.style.boxShadow=`${-x*18}px ${-y*18}px 40px rgba(100,220,190,0.07),0 8px 32px rgba(0,0,0,0.35)`;
  };
  const onLeave = () => {
    const el=ref.current; if(!el) return;
    el.style.transform='perspective(700px) rotateY(0deg) rotateX(0deg) scale3d(1,1,1)';
    el.style.boxShadow='0 4px 24px rgba(0,0,0,0.25)';
  };
  return <div ref={ref} style={{...style,transition:'transform 0.18s ease,box-shadow 0.18s ease'}} onMouseMove={onMove} onMouseLeave={onLeave}>{children}</div>;
};

// ── Style constants ───────────────────────────────────────────────────────────
const G: React.CSSProperties = {
  background:'rgba(12,18,28,0.6)',
  backdropFilter:'blur(22px)',
  WebkitBackdropFilter:'blur(22px)',
  border:'1px solid rgba(100,220,190,0.14)',
  boxShadow:'0 4px 24px rgba(0,0,0,0.32),inset 0 1px 0 rgba(255,255,255,0.05)',
};
const GL: React.CSSProperties = {
  background:'rgba(100,220,190,0.06)',
  backdropFilter:'blur(10px)',
  WebkitBackdropFilter:'blur(10px)',
  border:'1px solid rgba(100,220,190,0.16)',
};
const BG = 'linear-gradient(135deg,#050d14 0%,#0a1628 40%,#0d1f1a 100%)';

// ── Quiz Component ────────────────────────────────────────────────────────────
const Quiz = () => {
  const { user, setUser } = useApp();
  const { recoveryMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as { subject?: string; subtopic?: string } | null;

  const [subject, setSubject] = useState(state?.subject || '');
  const [subtopic, setSubtopic] = useState(state?.subtopic || '');
  const [numQuestions, setNumQuestions] = useState(5);
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [sessionXP, setSessionXP] = useState(0);
  const [showBoss, setShowBoss] = useState(false);
  const [bossHP, setBossHP] = useState(99);
  const [bossShake, setBossShake] = useState(false);
  const [bossDefeated, setBossDefeated] = useState(false);
  const [brainFog, setBrainFog] = useState(false);
  const [quizDone, setQuizDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stuckCount, setStuckCount] = useState(0);
  const [difficulty, setDifficulty] = useState<'easy'|'medium'|'hard'>('medium');
  const [encouragement, setEncouragement] = useState<string|null>(null);
  const [breakTimer, setBreakTimer] = useState(30);
  const [breakActive, setBreakActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'idle'|'in'|'hold'|'out'>('idle');
  const [weakConcepts, setWeakConcepts] = useState<string[]>([]);
  const [bossTimer, setBossTimer] = useState(60);
  const [bossQCount, setBossQCount] = useState(0);
  const [bossQuestions, setBossQuestions] = useState<BossQuestion[]>([]);
  const [bossCurrentQ, setBossCurrentQ] = useState(0);
  const [bossSelected, setBossSelected] = useState<number|null>(null);
  const [bossAnswered, setBossAnswered] = useState(false);
  const [bossLoading, setBossLoading] = useState(false);
  const qStart = useRef(Date.now());
  const times = useRef<number[]>([]);

  const getQuickPicks = () => {
    const map: Record<string,string[]> = {
      Physics:['Thermodynamics',"Newton's Laws",'Electrostatics','Optics'],
      Chemistry:['Chemical Bonding','Organic Reactions','Periodic Table','Equilibrium'],
      Mathematics:['Quadratic Equations','Calculus','Probability','Trigonometry'],
      Biology:['Cell Division','Genetics','Ecology','Human Physiology'],
      'Computer Science':['Binary Search','Data Structures','OOP','SQL'],
      English:['Grammar','Poetry','Essay Writing','Comprehension'],
      History:['Freedom Movement','World War II','Mughal Empire','French Revolution'],
      Economics:['Supply & Demand','GDP','Banking','Inflation'],
    };
    const subs=user.subjects.length>0?user.subjects:['Physics','Chemistry','Mathematics'];
    const picks:{s:string;t:string}[]=[];
    subs.forEach(s=>(map[s]||[]).slice(0,2).forEach(t=>picks.push({s,t})));
    return picks.slice(0,6);
  };

  const fetchQuiz = useCallback(async () => {
    if (!subject.trim()||!subtopic.trim()) { toast.error('Please enter subject and topic'); return; }
    setLoading(true);
    try {
      const data=await callBackend('generate-learning',{subject,subtopic,mode:'quiz',numQuestions});
      const r=data?.result;
      if (Array.isArray(r)&&r.length>0) { setQuestions(r.slice(0,numQuestions)); setQuizStarted(true); qStart.current=Date.now(); }
      else toast.error('Could not generate quiz. Try again.');
    } catch(e:any) { toast.error(e.message||'Failed to generate quiz'); }
    finally { setLoading(false); }
  },[subject,subtopic,numQuestions]);

  useEffect(()=>{ if(state?.subject&&state?.subtopic&&!quizStarted&&questions.length===0) fetchQuiz(); },[state,quizStarted,questions.length,fetchQuiz]);

  useEffect(()=>{
    if(correctStreak>=3&&difficulty!=='hard') { setDifficulty(p=>p==='easy'?'medium':'hard'); setEncouragement("Difficulty increased — you're on fire!"); setTimeout(()=>setEncouragement(null),3000); }
    if(correctStreak>=3&&!showBoss&&!recoveryMode&&quizStarted) { setCorrectStreak(0); setTimeout(()=>triggerBoss(),1000); }
  },[correctStreak]);

  useEffect(()=>{ if(wrongStreak>=3&&!brainFog) setBrainFog(true); },[wrongStreak]);

  useEffect(()=>{
    if(!breakActive) return;
    if(breakTimer<=0) { setBreakActive(false); setBrainFog(false); setDifficulty('easy'); setEncouragement('Welcome back — switched to easier questions.'); setTimeout(()=>setEncouragement(null),4000); return; }
    const t=setTimeout(()=>setBreakTimer(p=>p-1),1000); return ()=>clearTimeout(t);
  },[breakActive,breakTimer]);

  useEffect(()=>{
    if(!breakActive){setBreathPhase('idle');return;}
    const c=()=>{setBreathPhase('in');setTimeout(()=>setBreathPhase('hold'),4000);setTimeout(()=>setBreathPhase('out'),8000);setTimeout(()=>setBreathPhase('in'),12000);};
    c(); const i=setInterval(c,12000); return ()=>clearInterval(i);
  },[breakActive]);

  useEffect(()=>{
    if(!showBoss||bossDefeated) return;
    if(bossTimer<=0){setShowBoss(false);setBossDefeated(false);setBossHP(99);setBossTimer(60);setBossQCount(0);setBossQuestions([]);setBossCurrentQ(0);toast.error("Time's up! Boss escaped.");return;}
    const t=setTimeout(()=>setBossTimer(p=>p-1),1000); return ()=>clearTimeout(t);
  },[showBoss,bossTimer,bossDefeated]);

  const q=questions[currentQ];

  const handleAnswer=(i:number)=>{
    if(answered) return;
    const rt=Date.now()-qStart.current; times.current.push(rt);
    const avg=times.current.length>2?times.current.reduce((a,b)=>a+b,0)/times.current.length:rt;
    if(times.current.length>3&&rt/avg>2.2) setBrainFog(true);
    setSelected(i); setAnswered(true);
    const ok=i===q.correct;
    if(ok){const xp=q.difficulty==='hard'?30:q.difficulty==='medium'?20:10;setSessionXP(p=>p+xp);setTotalCorrect(p=>p+1);setCorrectStreak(p=>p+1);setWrongStreak(0);setUser(p=>({...p,xp:p.xp+xp}));}
    else{setCorrectStreak(0);setWrongStreak(p=>p+1);if(q.concept&&!weakConcepts.includes(q.concept))setWeakConcepts(p=>[...p,q.concept]);}
  };

  const triggerBoss=async()=>{
    setBossLoading(true);setShowBoss(true);setBossHP(99);setBossTimer(60);setBossDefeated(false);setBossQCount(0);setBossCurrentQ(0);setBossSelected(null);setBossAnswered(false);
    const fb=[
      {question:`What is the most important application of ${subtopic} in real life?`,options:['Engineering','Medicine','Space Science','All of the above'],correct:3,explanation:'Wide applications across all fields!'},
      {question:`Which concept is a prerequisite for understanding ${subtopic}?`,options:['Basic Mathematics','Fundamentals','Observation','Critical thinking'],correct:1,explanation:'Strong fundamentals are key.'},
      {question:`How would you explain ${subtopic} to a 5-year-old?`,options:['Using analogies','With formulas','Through experiments','Simple analogies and examples'],correct:3,explanation:'Simple analogies make complex concepts accessible.'},
    ];
    try {
      const data=await callBackend('generate-learning',{subject,subtopic,mode:'boss-battle'});
      const r=data?.result;
      setBossQuestions(Array.isArray(r)&&r.length>0?r.slice(0,3):fb);
    } catch { setBossQuestions(fb); }
    finally { setBossLoading(false); }
  };

  const handleBossAnswer=(i:number)=>{
    if(bossAnswered) return;
    setBossSelected(i); setBossAnswered(true);
    const bq=bossQuestions[bossCurrentQ]; if(!bq) return;
    if(i===bq.correct){const nh=bossHP-33;setBossHP(nh);setBossShake(true);setBossQCount(p=>p+1);setTimeout(()=>setBossShake(false),500);if(nh<=0){setBossDefeated(true);setSessionXP(p=>p+80);setUser(p=>({...p,xp:p.xp+80}));}}
  };

  const nextBossQ=()=>{
    if(bossCurrentQ<bossQuestions.length-1&&!bossDefeated){setBossCurrentQ(p=>p+1);setBossSelected(null);setBossAnswered(false);}
    else if(!bossDefeated){setShowBoss(false);setBossQuestions([]);toast('Boss survived! Keep going!');}
  };

  const handleStuck=()=>{setStuckCount(p=>p+1);setAnswered(true);setSelected(-1);if(q.concept&&!weakConcepts.includes(q.concept))setWeakConcepts(p=>[...p,q.concept]);setEncouragement(`${Math.floor(Math.random()*40)+10} students also got stuck. You're not alone.`);setTimeout(()=>setEncouragement(null),4000);};
  const nextQuestion=()=>{if(currentQ<questions.length-1){setCurrentQ(p=>p+1);setSelected(null);setAnswered(false);setShowHint(false);qStart.current=Date.now();}else setQuizDone(true);};
  const startBreak=()=>{setBreakTimer(30);setBreakActive(true);};
  const dismissFog=(a:string)=>{setBrainFog(false);setWrongStreak(0);if(a==='game')navigate('/games');if(a==='easier'){setDifficulty('easy');setEncouragement('Switched to easier questions.');setTimeout(()=>setEncouragement(null),3000);}if(a==='breathe')startBreak();};

  const dfCol=(d:string)=>d==='hard'?'#f87171':d==='medium'?'#fb923c':'#64dcc0';

  // ── Setup screen ────────────────────────────────────────────────────────────
  if(!quizStarted) return (
    <div style={{position:'relative',minHeight:'100vh',width:'100%',overflow:'hidden',background:BG}}>
      <NeuralBackground/>
      <KnowledgeMandala visible={true}/>
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        <div style={{position:'absolute',top:'15%',left:'10%',width:400,height:400,borderRadius:'50%',background:'radial-gradient(circle,rgba(100,220,190,0.055) 0%,transparent 70%)',filter:'blur(40px)'}}/>
        <div style={{position:'absolute',bottom:'20%',right:'15%',width:320,height:320,borderRadius:'50%',background:'radial-gradient(circle,rgba(140,100,255,0.065) 0%,transparent 70%)',filter:'blur(40px)'}}/>
      </div>
      <div style={{position:'relative',zIndex:10,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'48px 16px'}}>
        <div style={{width:'100%',maxWidth:580}}>
          <motion.div initial={{opacity:0,y:-28}} animate={{opacity:1,y:0}} transition={{duration:0.7,ease:[0.22,1,0.36,1]}} style={{textAlign:'center',marginBottom:36}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 16px',borderRadius:24,...GL,borderColor:'rgba(100,220,190,0.28)',marginBottom:16}}>
              <Sparkles size={12} style={{color:'#64dcc0'}}/>
              <span style={{fontSize:11,color:'rgba(100,220,190,0.85)',fontFamily:'DM Mono,monospace',letterSpacing:'0.1em'}}>ADAPTIVE INTELLIGENCE</span>
            </div>
            <h1 style={{fontFamily:'Fraunces,serif',fontSize:'clamp(2rem,5vw,3rem)',fontWeight:700,color:'#e4f0ec',lineHeight:1.1,marginBottom:10}}>Knowledge Forge</h1>
            <p style={{color:'rgba(160,210,200,0.45)',fontSize:13,fontFamily:'Plus Jakarta Sans,sans-serif'}}>AI-powered questions that evolve with your mind</p>
          </motion.div>

          <motion.div initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{duration:0.7,delay:0.15,ease:[0.22,1,0.36,1]}}>
            <TiltCard style={{...G,borderRadius:24,padding:32}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:18}}>
                {[{label:'Subject',val:subject,set:setSubject,ph:'e.g. Physics, Biology…'},{label:'Topic',val:subtopic,set:setSubtopic,ph:'e.g. Thermodynamics…'}].map(f=>(
                  <div key={f.label}>
                    <label style={{display:'block',fontSize:10,fontFamily:'DM Mono,monospace',letterSpacing:'0.09em',color:'rgba(100,220,190,0.65)',marginBottom:7,textTransform:'uppercase'}}>{f.label}</label>
                    <input value={f.val} onChange={e=>f.set(e.target.value)} placeholder={f.ph} style={{width:'100%',padding:'12px 15px',borderRadius:13,background:'rgba(100,220,190,0.04)',border:'1px solid rgba(100,220,190,0.18)',color:'#d0e8e2',fontSize:13,outline:'none',fontFamily:'Plus Jakarta Sans,sans-serif',backdropFilter:'blur(8px)',boxSizing:'border-box',transition:'border-color 0.2s'}}
                      onFocus={e=>{e.target.style.borderColor='rgba(100,220,190,0.55)';e.target.style.boxShadow='0 0 0 3px rgba(100,220,190,0.07)';}}
                      onBlur={e=>{e.target.style.borderColor='rgba(100,220,190,0.18)';e.target.style.boxShadow='none';}}/>
                  </div>
                ))}
              </div>

              <div style={{marginBottom:22}}>
                <label style={{display:'block',fontSize:10,fontFamily:'DM Mono,monospace',letterSpacing:'0.09em',color:'rgba(100,220,190,0.65)',marginBottom:9,textTransform:'uppercase'}}>Questions</label>
                <div style={{display:'flex',gap:10}}>
                  {[3,5,10].map(n=>(
                    <motion.button key={n} whileHover={{scale:1.04}} whileTap={{scale:0.96}} onClick={()=>setNumQuestions(n)} style={{flex:1,padding:'11px 0',borderRadius:12,fontSize:13,fontWeight:600,fontFamily:'Plus Jakarta Sans,sans-serif',cursor:'pointer',background:numQuestions===n?'rgba(100,220,190,0.18)':'rgba(255,255,255,0.04)',border:`1px solid ${numQuestions===n?'rgba(100,220,190,0.45)':'rgba(255,255,255,0.07)'}`,color:numQuestions===n?'#64dcc0':'rgba(200,230,225,0.45)',boxShadow:numQuestions===n?'0 0 16px rgba(100,220,190,0.11)':'none',transition:'all 0.2s'}}>{n} Qs</motion.button>
                  ))}
                </div>
              </div>

              <div style={{marginBottom:26}}>
                <p style={{fontSize:10,fontFamily:'DM Mono,monospace',letterSpacing:'0.09em',color:'rgba(180,200,195,0.35)',marginBottom:11,textTransform:'uppercase'}}>Quick picks</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                  {getQuickPicks().map((qp,i)=>{const act=subject===qp.s&&subtopic===qp.t;return(
                    <motion.button key={i} whileHover={{scale:1.04}} whileTap={{scale:0.96}} onClick={()=>{setSubject(qp.s);setSubtopic(qp.t);}} style={{padding:'5px 13px',borderRadius:20,fontSize:11,fontFamily:'Plus Jakarta Sans,sans-serif',fontWeight:500,cursor:'pointer',background:act?'rgba(100,220,190,0.13)':'rgba(255,255,255,0.04)',border:`1px solid ${act?'rgba(100,220,190,0.42)':'rgba(255,255,255,0.07)'}`,color:act?'#64dcc0':'rgba(190,220,215,0.5)',transition:'all 0.18s'}}>{qp.s} · {qp.t}</motion.button>
                  );})}
                </div>
              </div>

              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}} onClick={fetchQuiz} disabled={!subject.trim()||!subtopic.trim()||loading} style={{width:'100%',padding:'14px',borderRadius:15,fontSize:14,fontWeight:600,fontFamily:'Plus Jakarta Sans,sans-serif',cursor:!subject.trim()||!subtopic.trim()||loading?'not-allowed':'pointer',opacity:!subject.trim()||!subtopic.trim()?0.38:1,background:'linear-gradient(135deg,rgba(45,175,150,0.9) 0%,rgba(70,115,215,0.9) 100%)',border:'1px solid rgba(100,220,190,0.28)',color:'#fff',letterSpacing:'0.02em',display:'flex',alignItems:'center',justifyContent:'center',gap:8,boxShadow:'0 4px 24px rgba(45,175,150,0.22)',transition:'all 0.2s'}}>
                {loading?<><Loader2 size={15} style={{animation:'spin 1s linear infinite'}}/> Forging questions…</>:<><Sparkles size={15}/> Begin the Journey ({numQuestions} questions)</>}
              </motion.button>
            </TiltCard>
          </motion.div>
          {recoveryMode&&<motion.p initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.5}} style={{textAlign:'center',marginTop:14,fontSize:11,color:'rgba(100,220,190,0.4)',fontFamily:'DM Mono,monospace'}}>🌿 Recovery Mode Active — Gentle questions enabled</motion.p>}
        </div>
      </div>
      <style>{`input::placeholder{color:rgba(160,210,200,0.28)!important;} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Breathing break ─────────────────────────────────────────────────────────
  if(breakActive){
    const sc=breathPhase==='in'||breathPhase==='hold'?1.4:1;
    return(
      <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:24,background:'linear-gradient(180deg,#050d14,#091a1a)'}}>
        <NeuralBackground/>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{position:'relative',zIndex:10,textAlign:'center',maxWidth:360}}>
          <Wind size={40} style={{color:'rgba(100,220,190,0.55)',margin:'0 auto 16px',display:'block'}}/>
          <h2 style={{fontFamily:'Fraunces,serif',fontSize:22,fontWeight:700,color:'#e4f0ec',marginBottom:8}}>Breathe with Saathi</h2>
          <p style={{fontSize:12,color:'rgba(160,210,200,0.4)',marginBottom:40,lineHeight:1.6}}>You'll resume with easier questions after this.</p>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',marginBottom:28}}>
            <motion.div animate={{scale:sc}} transition={{duration:4,ease:'easeInOut'}} style={{width:128,height:128,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(100,220,190,0.06)',border:'1.5px solid rgba(100,220,190,0.22)',boxShadow:'0 0 60px rgba(100,220,190,0.07)'}}>
              <span style={{fontFamily:'Fraunces,serif',fontSize:17,fontWeight:600,color:'rgba(190,235,225,0.8)'}}>{breathPhase==='in'?'In':breathPhase==='hold'?'Hold':breathPhase==='out'?'Out':'…'}</span>
            </motion.div>
          </div>
          <p style={{fontFamily:'DM Mono,monospace',fontSize:30,fontWeight:700,color:'rgba(190,235,225,0.75)'}}>{breakTimer}s</p>
          <button onClick={()=>{setBreakActive(false);setBrainFog(false);setDifficulty('easy');}} style={{marginTop:24,fontSize:11,color:'rgba(160,210,200,0.3)',cursor:'pointer',background:'none',border:'none',fontFamily:'Plus Jakarta Sans,sans-serif'}}>Skip & resume →</button>
        </motion.div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Brain fog ───────────────────────────────────────────────────────────────
  if(brainFog) return(
    <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:24,background:'linear-gradient(180deg,#050d14,#091a1a)'}}>
      <NeuralBackground/>
      <motion.div initial={{opacity:0,scale:0.92}} animate={{opacity:1,scale:1}} style={{...G,borderRadius:24,padding:36,maxWidth:440,width:'100%',position:'relative',zIndex:10}}>
        <div style={{textAlign:'center',marginBottom:24}}>
          <div style={{width:58,height:58,borderRadius:'50%',margin:'0 auto 14px',display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(100,220,190,0.09)',border:'1px solid rgba(100,220,190,0.18)'}}>
            <Shield size={26} style={{color:'rgba(100,220,190,0.75)'}}/>
          </div>
          <h3 style={{fontFamily:'Fraunces,serif',fontSize:21,fontWeight:700,color:'#e4f0ec',marginBottom:7}}>Saathi noticed</h3>
          <p style={{fontSize:12,color:'rgba(160,210,200,0.42)',lineHeight:1.7}}>Your brain might need a moment.<br/>Every option is valid. No guilt.</p>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:9}}>
          {[{icon:<Wind size={15}/>,label:'Breathe with me — 30s',a:'breathe'},{icon:<Sparkles size={15}/>,label:'Play a mind break game',a:'game'},{icon:<Shield size={15}/>,label:'Give me easier questions',a:'easier'},{icon:<Zap size={15}/>,label:"I'm fine, keep going →",a:'continue'}].map(o=>(
            <motion.button key={o.a} whileHover={{scale:1.02,x:4}} onClick={()=>dismissFog(o.a)} style={{...GL,width:'100%',textAlign:'left',display:'flex',alignItems:'center',gap:12,padding:'12px 15px',borderRadius:13,cursor:'pointer'}}>
              <span style={{width:32,height:32,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(100,220,190,0.09)',color:'rgba(100,220,190,0.75)',flexShrink:0}}>{o.icon}</span>
              <span style={{fontSize:13,fontWeight:500,color:'rgba(210,235,230,0.78)',fontFamily:'Plus Jakarta Sans,sans-serif'}}>{o.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );

  // ── Boss battle ─────────────────────────────────────────────────────────────
  if(showBoss){
    const segs=[{f:bossHP>66},{f:bossHP>33},{f:bossHP>0}];
    const bq=bossQuestions[bossCurrentQ];
    if(bossDefeated) return(
      <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(180deg,#0f0608,#180a0a)'}}>
        <NeuralBackground/>
        <motion.div initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}} style={{position:'relative',zIndex:10,textAlign:'center',maxWidth:380}}>
          <motion.div animate={{rotate:[0,10,-10,0],scale:[1,1.2,1]}} transition={{duration:0.6}}><Trophy size={60} style={{color:'#fbbf24',margin:'0 auto',display:'block'}}/></motion.div>
          <h2 style={{fontFamily:'Fraunces,serif',fontSize:34,fontWeight:700,color:'#e4f0ec',margin:'16px 0 8px'}}>Victory!</h2>
          <p style={{fontSize:12,color:'rgba(220,200,180,0.45)',marginBottom:24}}>Boss defeated! +80 XP bonus earned.</p>
          <motion.div initial={{y:20,opacity:0}} animate={{y:0,opacity:1}} transition={{delay:0.3}} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'11px 22px',borderRadius:13,background:'rgba(251,191,36,0.11)',border:'1px solid rgba(251,191,36,0.28)',marginBottom:24}}>
            <Zap size={19} style={{color:'#fbbf24'}}/><span style={{fontFamily:'DM Mono,monospace',fontSize:24,fontWeight:700,color:'#fbbf24'}}>+80 XP</span>
          </motion.div><br/>
          <motion.button whileHover={{scale:1.04}} onClick={()=>{setShowBoss(false);setBossQuestions([]);}} style={{padding:'12px 30px',borderRadius:13,background:'linear-gradient(135deg,rgba(45,175,150,0.9),rgba(70,115,215,0.9))',border:'1px solid rgba(100,220,190,0.28)',color:'#fff',fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}>Continue Quiz →</motion.button>
        </motion.div>
      </div>
    );
    return(
      <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'center',justifyContent:'center',padding:16,background:'linear-gradient(180deg,#0f0608,#180a0a)'}}>
        <NeuralBackground/>
        <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.65) 100%)',pointerEvents:'none'}}/>
        <motion.div initial={{scale:0.8,opacity:0}} animate={{scale:1,opacity:1}} style={{...G,borderRadius:24,padding:26,width:'100%',maxWidth:520,position:'relative',zIndex:10,borderColor:'rgba(220,60,60,0.18)'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
            <h2 style={{fontFamily:'Fraunces,serif',fontSize:19,fontWeight:700,color:'#f87171',display:'flex',alignItems:'center',gap:8}}><Swords size={19} style={{color:'#f87171'}}/> Boss Battle</h2>
            <span style={{fontFamily:'DM Mono,monospace',fontSize:12,padding:'4px 11px',borderRadius:20,background:bossTimer<=10?'rgba(255,60,60,0.18)':'rgba(255,255,255,0.06)',color:bossTimer<=10?'#ff6060':'rgba(255,255,255,0.45)'}}>⏱ {bossTimer}s</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:15,marginBottom:18}}>
            <motion.div animate={bossShake?{x:[-8,8,-6,6,-3,3,0]}:bossHP<=33?{x:[-2,2,-2,2,0]}:{}} transition={{duration:0.4,repeat:bossHP<=33&&!bossShake?Infinity:0}} style={{fontSize:48,filter:`drop-shadow(0 0 ${bossHP>60?28:14}px rgba(220,38,38,0.5))`}}>🐉</motion.div>
            <div style={{flex:1}}>
              <div style={{display:'flex',gap:5,marginBottom:4}}>{segs.map((s,i)=><div key={i} style={{flex:1,height:9,borderRadius:5,overflow:'hidden',background:'rgba(255,255,255,0.05)'}}><motion.div initial={{width:'100%'}} animate={{width:s.f?'100%':'0%'}} style={{height:'100%',borderRadius:5,background:bossHP<=33?'#ef4444':bossHP<=66?'#f97316':'#dc2626'}}/></div>)}</div>
              <p style={{fontFamily:'DM Mono,monospace',fontSize:10,color:'rgba(255,255,255,0.3)'}}>HP: {Math.max(0,bossHP)}/99 · Q{bossCurrentQ+1}/3</p>
            </div>
          </div>
          {bossLoading?<div style={{textAlign:'center',padding:'38px 0'}}><Loader2 size={30} style={{animation:'spin 1s linear infinite',color:'rgba(255,255,255,0.28)',margin:'0 auto 10px',display:'block'}}/><p style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>Boss is preparing…</p></div>:bq?(
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <div style={{...GL,borderRadius:13,padding:15,borderColor:'rgba(220,60,60,0.13)'}}>
                <p style={{fontSize:13,fontWeight:500,color:'rgba(255,255,255,0.82)',lineHeight:1.65,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{bq.question}</p>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:7}}>
                {bq.options.map((o,i)=>{const ic=bossAnswered&&i===bq.correct,iw=bossAnswered&&i===bossSelected&&i!==bq.correct;return(
                  <motion.button key={i} whileHover={!bossAnswered?{x:4}:{}} onClick={()=>handleBossAnswer(i)} disabled={bossAnswered} style={{width:'100%',textAlign:'left',padding:'10px 13px',borderRadius:11,fontSize:12,fontWeight:500,display:'flex',alignItems:'center',gap:9,cursor:bossAnswered?'default':'pointer',background:ic?'rgba(80,200,120,0.1)':iw?'rgba(255,80,80,0.1)':'rgba(255,255,255,0.04)',border:`1px solid ${ic?'rgba(80,200,120,0.32)':iw?'rgba(255,80,80,0.32)':'rgba(255,255,255,0.06)'}`,color:'rgba(255,255,255,0.78)',fontFamily:'Plus Jakarta Sans,sans-serif',transition:'all 0.14s'}}>
                    <span style={{width:24,height:24,borderRadius:'50%',border:`1px solid ${ic?'rgba(80,200,120,0.55)':iw?'rgba(255,80,80,0.55)':'rgba(255,255,255,0.18)'}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontFamily:'DM Mono,monospace',flexShrink:0}}>{String.fromCharCode(65+i)}</span>{o}
                  </motion.button>
                );})}
              </div>
              {bossAnswered&&<motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{...GL,borderRadius:11,padding:13}}>
                <p style={{fontSize:11,color:'rgba(255,255,255,0.55)',lineHeight:1.65,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{bq.explanation}</p>
                {!bossDefeated&&<motion.button whileHover={{scale:1.02}} onClick={nextBossQ} style={{marginTop:9,padding:'6px 15px',borderRadius:7,fontSize:11,fontWeight:600,background:'rgba(255,255,255,0.08)',border:'1px solid rgba(255,255,255,0.11)',color:'rgba(255,255,255,0.75)',cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}>{bossCurrentQ<bossQuestions.length-1?'Next Boss Question →':'End Battle'}</motion.button>}
              </motion.div>}
            </div>
          ):<p style={{color:'rgba(255,255,255,0.3)',textAlign:'center',padding:'30px 0'}}>No questions available</p>}
          <button onClick={()=>{setShowBoss(false);setBossQuestions([]);}} style={{display:'block',margin:'14px auto 0',fontSize:10,color:'rgba(255,255,255,0.18)',cursor:'pointer',background:'none',border:'none',fontFamily:'DM Mono,monospace'}}>skip boss</button>
        </motion.div>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  // ── Quiz done ───────────────────────────────────────────────────────────────
  if(quizDone){
    const acc=Math.round((totalCorrect/questions.length)*100);
    return(
      <div style={{position:'relative',minHeight:'100vh',width:'100%',overflow:'hidden',background:BG}}>
        <NeuralBackground/><KnowledgeMandala visible={true}/>
        <div style={{position:'relative',zIndex:10,minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'48px 16px'}}>
          <motion.div initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{duration:0.7,ease:[0.22,1,0.36,1]}}>
            <TiltCard style={{...G,borderRadius:24,padding:34,maxWidth:520,width:'100%',textAlign:'center'}}>
              <motion.div animate={{rotate:[0,5,-5,0],scale:[1,1.1,1]}} transition={{delay:0.3,duration:0.8}}>
                <Sparkles size={42} style={{color:'#64dcc0',margin:'0 auto 14px',display:'block'}}/>
              </motion.div>
              <h2 style={{fontFamily:'Fraunces,serif',fontSize:26,fontWeight:700,color:'#e4f0ec',marginBottom:5}}>Session Complete!</h2>
              <p style={{fontSize:12,color:'rgba(160,210,200,0.4)',marginBottom:26}}>{subject} · {subtopic}</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:26}}>
                {[{v:`${acc}%`,l:'Accuracy'},{v:`+${sessionXP}`,l:'XP Earned'},{v:`${totalCorrect}/${questions.length}`,l:'Correct'},{v:stuckCount.toString(),l:'Stuck',w:true}].map((s,i)=>(
                  <motion.div key={i} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}} transition={{delay:0.12*i+0.18}} style={{...GL,borderRadius:13,padding:'13px 6px'}}>
                    <p style={{fontFamily:'DM Mono,monospace',fontSize:20,fontWeight:700,color:s.w?'#fb923c':'#64dcc0',marginBottom:3}}>{s.v}</p>
                    <p style={{fontSize:10,color:'rgba(160,210,200,0.38)',fontFamily:'Plus Jakarta Sans,sans-serif'}}>{s.l}</p>
                  </motion.div>
                ))}
              </div>
              {weakConcepts.length>0&&<div style={{...GL,borderRadius:13,padding:13,marginBottom:22,textAlign:'left'}}>
                <p style={{fontSize:10,fontWeight:600,color:'#fb923c',marginBottom:7,fontFamily:'DM Mono,monospace',textTransform:'uppercase',letterSpacing:'0.08em'}}>Weak areas:</p>
                <div style={{display:'flex',flexWrap:'wrap',gap:5}}>{weakConcepts.map((c,i)=><span key={i} style={{fontSize:10,padding:'2px 9px',borderRadius:20,background:'rgba(251,146,60,0.1)',border:'1px solid rgba(251,146,60,0.22)',color:'#fb923c',fontFamily:'Plus Jakarta Sans,sans-serif'}}>{c}</span>)}</div>
              </div>}
              <div style={{display:'flex',gap:10,justifyContent:'center'}}>
                <motion.button whileHover={{scale:1.03}} onClick={()=>navigate('/revision')} style={{padding:'11px 22px',borderRadius:13,background:'linear-gradient(135deg,rgba(45,175,150,0.9),rgba(70,115,215,0.9))',border:'1px solid rgba(100,220,190,0.28)',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}>Create flashcards →</motion.button>
                <motion.button whileHover={{scale:1.03}} onClick={()=>{setQuizStarted(false);setQuizDone(false);setCurrentQ(0);setSessionXP(0);setTotalCorrect(0);setCorrectStreak(0);setWrongStreak(0);setStuckCount(0);setQuestions([]);setWeakConcepts([]);}} style={{padding:'11px 22px',borderRadius:13,...GL,color:'rgba(190,230,225,0.65)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}>New quiz</motion.button>
              </div>
            </TiltCard>
          </motion.div>
        </div>
      </div>
    );
  }

  if(!q) return null;

  // ── Active quiz ─────────────────────────────────────────────────────────────
  return(
    <div style={{position:'relative',minHeight:'100vh',width:'100%',overflow:'hidden',background:BG}}>
      <NeuralBackground/><KnowledgeMandala visible={true}/>
      <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0}}>
        <div style={{position:'absolute',top:'8%',left:'4%',width:480,height:480,borderRadius:'50%',background:'radial-gradient(circle,rgba(100,220,190,0.038) 0%,transparent 70%)',filter:'blur(40px)'}}/>
        <div style={{position:'absolute',bottom:'12%',right:'8%',width:340,height:340,borderRadius:'50%',background:'radial-gradient(circle,rgba(140,100,255,0.048) 0%,transparent 70%)',filter:'blur(40px)'}}/>
      </div>

      <div style={{position:'relative',zIndex:10,width:'100%',maxWidth:1080,margin:'0 auto',padding:'24px 20px 40px'}}>
        {/* Top bar */}
        <motion.div initial={{opacity:0,y:-14}} animate={{opacity:1,y:0}} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:22,flexWrap:'wrap',gap:10}}>
          <div style={{display:'flex',alignItems:'center',gap:11}}>
            <button onClick={()=>setQuizStarted(false)} style={{fontSize:11,color:'rgba(160,210,200,0.38)',background:'none',border:'none',cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}>← Back</button>
            <span style={{padding:'2px 9px',borderRadius:20,fontSize:10,fontWeight:600,fontFamily:'DM Mono,monospace',background:`rgba(${difficulty==='hard'?'239,68,68':difficulty==='medium'?'251,146,60':'100,220,190'},0.1)`,color:dfCol(difficulty),border:`1px solid rgba(${difficulty==='hard'?'239,68,68':difficulty==='medium'?'251,146,60':'100,220,190'},0.22)`}}>{difficulty}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:13}}>
            <button onClick={startBreak} style={{display:'flex',alignItems:'center',gap:5,fontSize:10,padding:'4px 11px',borderRadius:20,...GL,color:'rgba(160,210,200,0.45)',cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}><Wind size={10}/> 30s break</button>
            <span style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'rgba(160,210,200,0.38)'}}>Q{currentQ+1}/{questions.length}</span>
            <span style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'#64dcc0',display:'flex',alignItems:'center',gap:3}}><Zap size={12}/> +{sessionXP}</span>
            {correctStreak>=2&&<motion.span initial={{scale:0}} animate={{scale:1}} style={{fontFamily:'DM Mono,monospace',fontSize:12,color:'#fb923c',display:'flex',alignItems:'center',gap:3}}><Flame size={12}/> {correctStreak}</motion.span>}
          </div>
        </motion.div>

        {/* Encouragement */}
        <AnimatePresence>
          {encouragement&&<motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}} style={{...GL,borderRadius:11,padding:'9px 15px',marginBottom:14,textAlign:'center',borderColor:'rgba(100,220,190,0.22)'}}>
            <p style={{fontSize:12,color:'#64dcc0',fontFamily:'Plus Jakarta Sans,sans-serif'}}>{encouragement}</p>
          </motion.div>}
        </AnimatePresence>

        {/* Progress */}
        <div style={{display:'flex',gap:4,marginBottom:26}}>
          {questions.map((_,i)=><motion.div key={i} initial={{scaleX:0}} animate={{scaleX:1}} transition={{delay:i*0.04}} style={{flex:1,height:3,borderRadius:3,background:i<currentQ?'#64dcc0':i===currentQ?'rgba(100,220,190,0.38)':'rgba(255,255,255,0.05)'}}/>)}
        </div>

        {/* Two-column layout */}
        <div style={{display:'grid',gridTemplateColumns:'minmax(0,1.05fr) minmax(0,0.95fr)',gap:20,alignItems:'start'}}>
          {/* Left: Question */}
          <AnimatePresence mode="wait">
            <motion.div key={currentQ} initial={{opacity:0,x:-22}} animate={{opacity:1,x:0}} exit={{opacity:0,x:22}} transition={{duration:0.32,ease:[0.22,1,0.36,1]}}>
              <TiltCard style={{...G,borderRadius:21,padding:26,marginBottom:14}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
                  <span style={{fontSize:9,fontFamily:'DM Mono,monospace',color:'rgba(100,220,190,0.52)',letterSpacing:'0.09em',textTransform:'uppercase'}}>{q.concept}</span>
                  <span style={{fontSize:9,fontFamily:'DM Mono,monospace',color:'rgba(160,210,200,0.22)'}}>#{currentQ+1}</span>
                </div>
                <h3 style={{fontSize:15,fontWeight:600,color:'#cce8e2',lineHeight:1.65,marginBottom:14,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{q.question}</h3>
                {q.hint&&!showHint&&!answered&&<motion.button whileHover={{scale:1.03}} onClick={()=>setShowHint(true)} style={{display:'flex',alignItems:'center',gap:4,fontSize:10,color:'rgba(100,220,190,0.55)',background:'none',border:'none',cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif',marginTop:2}}><HelpCircle size={11}/> Reveal hint</motion.button>}
                {showHint&&<motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} style={{padding:'9px 13px',borderRadius:9,background:'rgba(100,220,190,0.06)',border:'1px solid rgba(100,220,190,0.16)',marginTop:9}}>
                  <p style={{fontSize:11,color:'rgba(170,235,215,0.65)',fontFamily:'Plus Jakarta Sans,sans-serif',lineHeight:1.6}}>💡 {q.hint}</p>
                </motion.div>}
              </TiltCard>

              <AnimatePresence>
                {answered&&<motion.div initial={{opacity:0,y:11}} animate={{opacity:1,y:0}} exit={{opacity:0}}>
                  <TiltCard style={{...G,borderRadius:18,padding:20,borderColor:selected===q.correct?'rgba(100,220,190,0.22)':'rgba(239,68,68,0.18)'}}>
                    {selected===-1&&<p style={{fontSize:12,fontWeight:600,color:'#fb923c',marginBottom:7,fontFamily:'Plus Jakarta Sans,sans-serif'}}>Correct: <strong>{q.options[q.correct]}</strong></p>}
                    <p style={{fontSize:12,color:'rgba(190,225,220,0.7)',lineHeight:1.72,fontFamily:'Plus Jakarta Sans,sans-serif'}}>{q.explanation}</p>
                    <motion.button whileHover={{scale:1.03}} onClick={nextQuestion} style={{marginTop:14,padding:'9px 20px',borderRadius:11,background:'linear-gradient(135deg,rgba(45,175,150,0.85),rgba(70,115,215,0.85))',border:'1px solid rgba(100,220,190,0.23)',color:'#fff',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}>
                      {currentQ<questions.length-1?'Next Question →':'Finish Quiz →'}
                    </motion.button>
                  </TiltCard>
                </motion.div>}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* Right: Options */}
          <AnimatePresence mode="wait">
            <motion.div key={`o-${currentQ}`} initial={{opacity:0,x:22}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-22}} transition={{duration:0.32,ease:[0.22,1,0.36,1]}} style={{display:'flex',flexDirection:'column',gap:9}}>
              {q.options.map((opt,i)=>{
                const ic=answered&&i===q.correct, iw=answered&&i===selected&&i!==q.correct;
                return(
                  <motion.button key={i} initial={{opacity:0,x:14}} animate={{opacity:1,x:0}} transition={{delay:i*0.06}} whileHover={!answered?{x:5,scale:1.01}:{}} whileTap={!answered?{scale:0.98}:{}} onClick={()=>handleAnswer(i)} disabled={answered} style={{width:'100%',textAlign:'left',padding:'13px 15px',borderRadius:15,fontSize:13,fontWeight:500,display:'flex',alignItems:'center',gap:11,cursor:answered?'default':'pointer',fontFamily:'Plus Jakarta Sans,sans-serif',background:ic?'rgba(80,200,120,0.09)':iw?'rgba(239,68,68,0.09)':'rgba(255,255,255,0.04)',border:`1px solid ${ic?'rgba(80,200,120,0.36)':iw?'rgba(239,68,68,0.36)':'rgba(255,255,255,0.06)'}`,color:ic?'#6ee7b7':iw?'#f87171':'rgba(200,232,227,0.75)',backdropFilter:'blur(8px)',boxShadow:ic?'0 0 18px rgba(80,200,120,0.07)':iw?'0 0 18px rgba(239,68,68,0.07)':'none',transition:'all 0.14s'}}>
                    <span style={{width:26,height:26,borderRadius:'50%',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontFamily:'DM Mono,monospace',background:ic?'rgba(80,200,120,0.13)':iw?'rgba(239,68,68,0.13)':'rgba(255,255,255,0.05)',border:`1px solid ${ic?'rgba(80,200,120,0.45)':iw?'rgba(239,68,68,0.45)':'rgba(255,255,255,0.13)'}`,color:ic?'#6ee7b7':iw?'#f87171':'rgba(190,225,220,0.45)'}}>{String.fromCharCode(65+i)}</span>
                    <span style={{flex:1}}>{opt}</span>
                    {ic&&<span style={{fontSize:15}}>✓</span>}
                    {iw&&<span style={{fontSize:15}}>✗</span>}
                  </motion.button>
                );
              })}
              {!answered&&<motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.28}} style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:3,padding:'0 3px'}}>
                <button onClick={handleStuck} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'rgba(160,210,200,0.32)',background:'none',border:'none',cursor:'pointer',fontFamily:'Plus Jakarta Sans,sans-serif'}}><AlertCircle size={12}/> I'm stuck</button>
                {stuckCount>0&&<span style={{fontSize:9,padding:'2px 7px',borderRadius:20,background:'rgba(251,146,60,0.07)',color:'rgba(251,146,60,0.45)',border:'1px solid rgba(251,146,60,0.13)',display:'flex',alignItems:'center',gap:3,fontFamily:'DM Mono,monospace'}}><Users size={8}/> {stuckCount} stuck today</span>}
              </motion.div>}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media(max-width:700px){
          .quiz-two-col{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
};

export default Quiz;