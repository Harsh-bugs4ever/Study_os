// import { useState, useEffect, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { useTheme } from '@/contexts/ThemeContext';
// import { useApp } from '@/contexts/AppContext';
// import { Moon, Heart, Wind, Timer, Brain, Sparkles, RotateCcw, Shield, Star, Phone, Activity, CheckSquare, ArrowLeft, Plus, Pencil, X, Eye, Hand, Ear } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';

// const actInterventions = [
//   { type: 'defusion', icon: <Wind size={20} />, title: 'Cognitive Defusion', content: 'Notice what thoughts showed up about this quiz.', instruction: 'Can you hold them lightly — like clouds passing?' },
//   { type: 'self_compassion', icon: <Heart size={20} />, title: 'Self-Compassion', content: "This is a hard moment. That's okay.", instruction: 'What would you say to a friend who just struggled with this?' },
//   { type: 'values', icon: <Sparkles size={20} />, title: 'Values Clarification', content: 'Before we start — why does this matter to you?', instruction: 'Take 10 seconds to remember your reason.' },
//   { type: 'acceptance', icon: <Activity size={20} />, title: 'Radical Acceptance', content: "Some days are harder. That doesn't mean you're failing.", instruction: 'Can you sit with this feeling without pushing it away?' },
//   { type: 'present_moment', icon: <Shield size={20} />, title: 'Present Moment', content: 'Right now, in this moment, you are safe.', instruction: 'Name 3 things you can see, 2 you can hear, 1 you can feel.' },
// ];

// const cbtSteps = [
//   { title: 'Identify the thought', prompt: "What's the negative thought bothering you right now?" },
//   { title: 'Evidence FOR this thought', prompt: 'What evidence supports this thought?' },
//   { title: 'Evidence AGAINST it', prompt: 'What evidence contradicts this thought? What would a friend say?' },
//   { title: 'Balanced thought', prompt: 'Now write a more balanced, realistic version of this thought.' },
// ];

// const affirmations = [
//   "I am capable of learning and growing every day.",
//   "Struggling with a concept doesn't mean I'm failing — it means I'm learning.",
//   "My pace is my own. I don't need to compare myself to anyone.",
//   "I've overcome challenges before, and I'll overcome this too.",
//   "Taking a break is not giving up — it's recharging.",
//   "My worth isn't defined by my exam scores.",
//   "Every small step forward counts.",
//   "I deserve kindness — especially from myself.",
// ];

// const helplines = [
//   { name: 'Vandrevala Foundation', number: '1860-2662-345', available: '24/7' },
//   { name: 'iCall', number: '9152987821', available: 'Mon-Sat, 8am-10pm' },
//   { name: 'AASRA', number: '9820466726', available: '24/7' },
//   { name: 'Snehi', number: '044-24640050', available: '24/7' },
// ];

// const groundingSenses = [
//   { num: 5, sense: 'SEE', icon: <Eye size={28} />, color: 'hsl(var(--accent))', placeholder: 'Name 5 things you can see...' },
//   { num: 4, sense: 'TOUCH', icon: <Hand size={28} />, color: 'hsl(var(--success))', placeholder: 'Name 4 things you can touch...' },
//   { num: 3, sense: 'HEAR', icon: <Ear size={28} />, color: 'hsl(var(--warning))', placeholder: 'Name 3 things you can hear...' },
//   { num: 2, sense: 'SMELL', icon: <Wind size={28} />, color: 'hsl(var(--danger))', placeholder: 'Name 2 things you can smell...' },
//   { num: 1, sense: 'TASTE', icon: <Sparkles size={28} />, color: 'hsl(var(--accent))', placeholder: 'Name 1 thing you can taste...' },
// ];

// type Overlay = null | 'breathing' | 'cbt' | 'act' | 'grounding';

// const MentalHealth = () => {
//   const { user } = useApp();
//   const { recoveryMode, setRecoveryMode } = useTheme();
//   const navigate = useNavigate();

//   // Overlay state
//   const [overlay, setOverlay] = useState<Overlay>(null);

//   // Breathing
//   const [breathType, setBreathType] = useState<'478' | 'box'>('box');
//   const [breathPhase, setBreathPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale' | 'hold2'>('idle');
//   const [breathCycle, setBreathCycle] = useState(0);
//   const [breathTotal] = useState(5);
//   const [breathCountdown, setBreathCountdown] = useState(4);
//   const [breathDone, setBreathDone] = useState(false);
//   const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   // CBT
//   const [cbtStep, setCbtStep] = useState(0);
//   const [cbtAnswers, setCbtAnswers] = useState<string[]>(['', '', '', '']);

//   // ACT
//   const [actIndex, setActIndex] = useState(0);

//   // Grounding
//   const [groundingStep, setGroundingStep] = useState(0);
//   const [groundingInputs, setGroundingInputs] = useState<string[]>(['', '', '', '', '']);

//   // Pomodoro
//   const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
//   const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
//   const [pomodoroActive, setPomodoroActive] = useState(false);
//   const [pomodoroBreak, setPomodoroBreak] = useState(false);
//   const [pomodoroSessions, setPomodoroSessions] = useState(0);

//   // New features
//   const [sleepRating, setSleepRating] = useState(0);
//   const [sleepHours, setSleepHours] = useState('');
//   const [anxietyLevel, setAnxietyLevel] = useState(3);
//   const [affirmationIndex, setAffirmationIndex] = useState(0);
//   const [showSOS, setShowSOS] = useState(false);
//   const defaultHabits = [
//     { key: 'meditate', label: 'Meditate 5 min', done: false },
//     { key: 'exercise', label: 'Move/Exercise', done: false },
//     { key: 'journal', label: 'Journal', done: false },
//     { key: 'hydrate', label: 'Drink water', done: false },
//     { key: 'sleep7', label: 'Sleep 7+ hrs', done: false },
//   ];
//   const [habits, setHabits] = useState(() => {
//     const saved = localStorage.getItem('gurukul-habits');
//     return saved ? JSON.parse(saved) : defaultHabits;
//   });
//   const [editingHabits, setEditingHabits] = useState(false);
//   const [newHabitLabel, setNewHabitLabel] = useState('');

//   useEffect(() => { localStorage.setItem('gurukul-habits', JSON.stringify(habits)); }, [habits]);

//   // Pomodoro timer
//   useEffect(() => {
//     if (!pomodoroActive) return;
//     const interval = setInterval(() => {
//       setPomodoroSeconds(prev => {
//         if (prev === 0) {
//           if (pomodoroMinutes === 0) {
//             setPomodoroActive(false);
//             if (pomodoroBreak) { setPomodoroBreak(false); setPomodoroMinutes(25); }
//             else { setPomodoroSessions(p => p + 1); setPomodoroBreak(true); setPomodoroMinutes(5); }
//             return 0;
//           }
//           setPomodoroMinutes(m => m - 1);
//           return 59;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//     return () => clearInterval(interval);
//   }, [pomodoroActive, pomodoroMinutes, pomodoroBreak]);

//   // Breathing engine
//   useEffect(() => {
//     if (overlay !== 'breathing' || breathPhase === 'idle' || breathDone) return;
//     const durations: Record<string, Record<string, number>> = {
//       box: { inhale: 4, hold: 4, exhale: 4, hold2: 4 },
//       '478': { inhale: 4, hold: 7, exhale: 8 },
//     };
//     const seq = breathType === 'box' ? ['inhale', 'hold', 'exhale', 'hold2'] : ['inhale', 'hold', 'exhale'];
//     const currentIdx = seq.indexOf(breathPhase);
//     const dur = durations[breathType][breathPhase] || 4;
//     setBreathCountdown(dur);

//     breathIntervalRef.current = setInterval(() => {
//       setBreathCountdown(prev => {
//         if (prev <= 1) {
//           const nextIdx = currentIdx + 1;
//           if (nextIdx >= seq.length) {
//             const newCycle = breathCycle + 1;
//             setBreathCycle(newCycle);
//             if (newCycle >= breathTotal) { setBreathDone(true); setBreathPhase('idle'); return 0; }
//             setBreathPhase(seq[0] as any);
//           } else {
//             setBreathPhase(seq[nextIdx] as any);
//           }
//           return 0;
//         }
//         return prev - 1;
//       });
//     }, 1000);
//     return () => { if (breathIntervalRef.current) clearInterval(breathIntervalRef.current); };
//   }, [overlay, breathPhase, breathType, breathCycle, breathTotal, breathDone]);

//   const startBreathing = () => { setBreathDone(false); setBreathCycle(0); setBreathPhase('inhale'); };
//   const closeOverlay = () => { setOverlay(null); setBreathPhase('idle'); setBreathDone(false); setBreathCycle(0); setCbtStep(0); setCbtAnswers(['', '', '', '']); setGroundingStep(0); setGroundingInputs(['', '', '', '', '']); };

//   const pomodoroProgress = pomodoroBreak
//     ? ((5 * 60 - (pomodoroMinutes * 60 + pomodoroSeconds)) / (5 * 60)) * 100
//     : ((25 * 60 - (pomodoroMinutes * 60 + pomodoroSeconds)) / (25 * 60)) * 100;

//   const habitCount = habits.filter((h: any) => h.done).length;

//   // ============ FULL-SCREEN OVERLAYS ============
//   if (overlay === 'breathing') {
//     const circleScale = breathPhase === 'inhale' ? 1.6 : (breathPhase === 'hold' || breathPhase === 'hold2') ? 1.6 : 1;
//     const phaseLabel = breathPhase === 'inhale' ? 'Breathe In...' : breathPhase === 'hold' || breathPhase === 'hold2' ? 'Hold...' : breathPhase === 'exhale' ? 'Breathe Out...' : '';
//     return (
//       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//         className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
//         style={{ background: 'linear-gradient(180deg, hsl(180 30% 8%), hsl(220 30% 12%))' }}>
//         <button onClick={closeOverlay} className="absolute top-6 left-6 text-white/60 hover:text-white flex items-center gap-2 text-sm z-10"><ArrowLeft size={18} /> Back</button>
//         {breathDone ? (
//           <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
//             <span className="text-6xl mb-4 block">🌿</span>
//             <h2 className="font-display text-2xl font-bold text-white mb-2">Great job!</h2>
//             <p className="text-white/60 mb-2">You completed {breathTotal} cycles</p>
//             <p className="text-white/40 text-sm mb-6">{breathType === 'box' ? 'Box Breathing' : '4-7-8 Breathing'} · {breathTotal * (breathType === 'box' ? 16 : 19)}s total</p>
//             <button onClick={closeOverlay} className="btn-3d px-8 py-3 text-sm font-semibold">Done</button>
//           </motion.div>
//         ) : breathPhase === 'idle' ? (
//           <div className="text-center">
//             <Wind size={48} className="mx-auto mb-6 text-white/60" />
//             <h2 className="font-display text-2xl font-bold text-white mb-4">Choose your breathing</h2>
//             <div className="flex gap-3 mb-8">
//               {[{ type: 'box' as const, label: 'Box (4-4-4-4)' }, { type: '478' as const, label: '4-7-8' }].map(b => (
//                 <button key={b.type} onClick={() => setBreathType(b.type)}
//                   className="px-5 py-3 rounded-xl text-sm font-medium transition-all"
//                   style={{ background: breathType === b.type ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', color: 'white', border: breathType === b.type ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
//                   {b.label}
//                 </button>
//               ))}
//             </div>
//             <button onClick={startBreathing} className="px-8 py-3 rounded-xl text-white font-semibold" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
//               Start breathing
//             </button>
//           </div>
//         ) : (
//           <div className="text-center">
//             <motion.div animate={{ scale: circleScale }} transition={{ duration: breathCountdown > 0 ? breathCountdown : 4, ease: 'easeInOut' }}
//               className="w-48 h-48 rounded-full flex items-center justify-center mx-auto mb-8 relative"
//               style={{ background: 'radial-gradient(circle, rgba(100,200,180,0.2), rgba(100,200,180,0.05))', boxShadow: '0 0 60px rgba(100,200,180,0.15), inset 0 0 30px rgba(100,200,180,0.1)' }}>
//               <motion.div animate={{ scale: circleScale * 0.6 }} transition={{ duration: breathCountdown > 0 ? breathCountdown : 4, ease: 'easeInOut' }}
//                 className="w-20 h-20 rounded-full flex items-center justify-center"
//                 style={{ background: 'rgba(100,200,180,0.15)' }}>
//                 <span className="font-display text-3xl font-bold text-white">{breathCountdown}</span>
//               </motion.div>
//             </motion.div>
//             <motion.p key={breathPhase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
//               className="font-display text-xl text-white/80 mb-4">{phaseLabel}</motion.p>
//             <p className="text-white/40 text-sm">Cycle {breathCycle + 1} of {breathTotal}</p>
//             <button onClick={() => { setBreathPhase('idle'); setBreathDone(false); setBreathCycle(0); }}
//               className="mt-8 text-white/40 text-xs hover:text-white/60">Stop</button>
//           </div>
//         )}
//       </motion.div>
//     );
//   }

//   if (overlay === 'cbt') {
//     const isLast = cbtStep >= cbtSteps.length;
//     return (
//       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//         className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6"
//         style={{ background: 'linear-gradient(180deg, hsl(200 25% 10%), hsl(230 25% 14%))' }}>
//         <button onClick={closeOverlay} className="absolute top-6 left-6 text-white/60 hover:text-white flex items-center gap-2 text-sm"><ArrowLeft size={18} /> Back</button>
//         {!isLast && (
//           <div className="w-full max-w-md mb-8">
//             <div className="flex gap-1">
//               {cbtSteps.map((_, i) => (
//                 <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i <= cbtStep ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)' }} />
//               ))}
//             </div>
//           </div>
//         )}
//         <AnimatePresence mode="wait">
//           {isLast ? (
//             <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full text-center">
//               <Brain size={48} className="mx-auto mb-4 text-white/60" />
//               <h2 className="font-display text-xl font-bold text-white mb-4">Thought Reframed</h2>
//               <div className="space-y-3 mb-6 text-left">
//                 {cbtSteps.map((s, i) => (
//                   <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
//                     <p className="text-xs text-white/40 mb-1">{s.title}</p>
//                     <p className="text-sm text-white/80">{cbtAnswers[i] || '(skipped)'}</p>
//                   </div>
//                 ))}
//               </div>
//               <button onClick={closeOverlay} className="btn-3d px-8 py-3 text-sm font-semibold">Done</button>
//             </motion.div>
//           ) : (
//             <motion.div key={cbtStep} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="max-w-md w-full text-center">
//               <Brain size={36} className="mx-auto mb-4 text-white/40" />
//               <p className="text-xs text-white/40 mb-2">Step {cbtStep + 1} of {cbtSteps.length}</p>
//               <h2 className="font-display text-lg font-bold text-white mb-2">{cbtSteps[cbtStep].title}</h2>
//               <p className="text-sm text-white/60 mb-6">{cbtSteps[cbtStep].prompt}</p>
//               <textarea value={cbtAnswers[cbtStep]} onChange={e => { const a = [...cbtAnswers]; a[cbtStep] = e.target.value; setCbtAnswers(a); }}
//                 placeholder="Write your thoughts..." rows={4}
//                 className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-4"
//                 style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }} />
//               <button onClick={() => setCbtStep(cbtStep + 1)}
//                 className="px-8 py-3 rounded-xl text-white font-semibold" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
//                 {cbtStep < cbtSteps.length - 1 ? 'Next →' : 'See Summary'}
//               </button>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.div>
//     );
//   }

//   if (overlay === 'act') {
//     const a = actInterventions[actIndex];
//     return (
//       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//         className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6"
//         style={{ background: 'linear-gradient(180deg, hsl(260 20% 10%), hsl(280 20% 14%))' }}>
//         <button onClick={closeOverlay} className="absolute top-6 left-6 text-white/60 hover:text-white flex items-center gap-2 text-sm"><ArrowLeft size={18} /> Back</button>
//         <AnimatePresence mode="wait">
//           <motion.div key={actIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-md w-full text-center">
//             <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(255,255,255,0.08)' }}>
//               <span className="text-white/60">{a.icon}</span>
//             </div>
//             <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">{a.type.replace('_', ' ')}</p>
//             <h2 className="font-display text-xl font-bold text-white mb-4">{a.title}</h2>
//             <p className="font-display text-lg italic text-white/80 mb-4 leading-relaxed">{a.content}</p>
//             <p className="text-sm text-white/50 mb-8">{a.instruction}</p>
//             <div className="flex gap-3 justify-center">
//               <button onClick={() => setActIndex((actIndex + 1) % actInterventions.length)}
//                 className="px-6 py-3 rounded-xl text-white font-semibold" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
//                 Next exercise →
//               </button>
//               <button onClick={closeOverlay} className="px-6 py-3 rounded-xl text-white/60 font-medium" style={{ background: 'rgba(255,255,255,0.05)' }}>Done</button>
//             </div>
//             <p className="text-xs text-white/30 mt-6">{actIndex + 1} of {actInterventions.length}</p>
//           </motion.div>
//         </AnimatePresence>
//       </motion.div>
//     );
//   }

//   if (overlay === 'grounding') {
//     const isDone = groundingStep >= groundingSenses.length;
//     const g = groundingSenses[groundingStep];
//     return (
//       <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//         className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6"
//         style={{ background: 'linear-gradient(180deg, hsl(160 25% 8%), hsl(180 20% 12%))' }}>
//         <button onClick={closeOverlay} className="absolute top-6 left-6 text-white/60 hover:text-white flex items-center gap-2 text-sm"><ArrowLeft size={18} /> Back</button>
//         {!isDone && (
//           <div className="w-full max-w-md mb-8">
//             <div className="flex gap-1">
//               {groundingSenses.map((_, i) => (
//                 <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i <= groundingStep ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)' }} />
//               ))}
//             </div>
//             <p className="text-xs text-white/40 text-center mt-2">{groundingStep + 1} / {groundingSenses.length}</p>
//           </div>
//         )}
//         <AnimatePresence mode="wait">
//           {isDone ? (
//             <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full text-center">
//               <Shield size={48} className="mx-auto mb-4 text-white/60" />
//               <h2 className="font-display text-xl font-bold text-white mb-4">You're grounded 🌿</h2>
//               <div className="space-y-2 mb-6 text-left">
//                 {groundingSenses.map((s, i) => (
//                   <div key={i} className="p-2 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.06)' }}>
//                     <span className="text-white/40">{s.num} {s.sense}: </span>
//                     <span className="text-white/80">{groundingInputs[i] || '—'}</span>
//                   </div>
//                 ))}
//               </div>
//               <button onClick={closeOverlay} className="btn-3d px-8 py-3 text-sm font-semibold">Done</button>
//             </motion.div>
//           ) : (
//             <motion.div key={groundingStep} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="max-w-md w-full text-center">
//               <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
//                 <span style={{ color: g.color }}>{g.icon}</span>
//               </div>
//               <h2 className="font-display text-3xl font-bold text-white mb-2">Name {g.num} things you can {g.sense}</h2>
//               <textarea value={groundingInputs[groundingStep]}
//                 onChange={e => { const inputs = [...groundingInputs]; inputs[groundingStep] = e.target.value; setGroundingInputs(inputs); }}
//                 placeholder={g.placeholder} rows={3}
//                 className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-4 mt-4"
//                 style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }} />
//               <button onClick={() => setGroundingStep(groundingStep + 1)}
//                 className="px-8 py-3 rounded-xl text-white font-semibold" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
//                 Next →
//               </button>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </motion.div>
//     );
//   }

//   return (
//     <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="font-display text-2xl font-bold flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
//             <Brain size={24} style={{ color: 'hsl(var(--accent))' }} /> Mental Wellbeing
//           </h2>
//           <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted))' }}>Your emotional state is a learning variable, not a separate problem.</p>
//         </div>
//         <div className="flex items-center gap-2">
//           <button onClick={() => navigate('/journal')}
//             className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all hover:scale-105"
//             style={{ borderColor: 'hsl(var(--accent))', color: 'hsl(var(--accent))', background: 'hsl(var(--accent) / 0.08)' }}>
//             <Pencil size={14} /> Journal
//           </button>
//           <button onClick={() => setShowSOS(true)}
//             className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all hover:scale-105"
//             style={{ borderColor: 'hsl(var(--danger))', color: 'hsl(var(--danger))', background: 'hsl(var(--danger) / 0.08)' }}>
//             <Phone size={14} /> SOS Help
//           </button>
//         </div>
//       </div>

//       {/* SOS Modal */}
//       <AnimatePresence>
//         {showSOS && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.6)' }}
//             onClick={() => setShowSOS(false)}>
//             <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
//               className="card-base max-w-md w-full" onClick={e => e.stopPropagation()}>
//               <h3 className="font-display text-lg font-bold mb-2 flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
//                 <Shield size={20} style={{ color: 'hsl(var(--danger))' }} /> You're not alone
//               </h3>
//               <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted))' }}>If you're in crisis, please reach out. These helplines are free and confidential.</p>
//               <div className="space-y-2 mb-4">
//                 {helplines.map((h, i) => (
//                   <a key={i} href={`tel:${h.number}`} className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.02]"
//                     style={{ background: 'hsl(var(--surface2))' }}>
//                     <div><p className="text-sm font-medium" style={{ color: 'hsl(var(--text))' }}>{h.name}</p><p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>{h.available}</p></div>
//                     <span className="stat-number text-sm font-bold" style={{ color: 'hsl(var(--accent))' }}>{h.number}</span>
//                   </a>
//                 ))}
//               </div>
//               <button onClick={() => setShowSOS(false)} className="btn-3d-ghost w-full text-sm py-2">Close</button>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* Row 1: Focus Timer + Burnout Risk */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
//         {/* Focus Timer */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card-base text-center">
//           <h3 className="font-display text-base font-semibold mb-4 flex items-center justify-center gap-2" style={{ color: 'hsl(var(--text))' }}>
//             <Timer size={18} style={{ color: 'hsl(var(--accent))' }} /> Focus Timer
//           </h3>
//           <div className="relative w-36 h-36 mx-auto mb-3">
//             <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
//               <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--surface2))" strokeWidth="5" />
//               <circle cx="50" cy="50" r="42" fill="none" stroke={pomodoroBreak ? 'hsl(var(--success))' : 'hsl(var(--accent))'} strokeWidth="5" strokeLinecap="round"
//                 strokeDasharray={264} strokeDashoffset={264 - (pomodoroProgress / 100) * 264} style={{ transition: 'stroke-dashoffset 1s linear' }} />
//             </svg>
//             <div className="absolute inset-0 flex flex-col items-center justify-center">
//               <p className="stat-number text-2xl font-bold" style={{ color: pomodoroBreak ? 'hsl(var(--success))' : 'hsl(var(--text))' }}>
//                 {String(pomodoroMinutes).padStart(2, '0')}:{String(pomodoroSeconds).padStart(2, '0')}
//               </p>
//               <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted))' }}>{pomodoroBreak ? 'Break' : 'Focus'} · {pomodoroSessions} done</p>
//             </div>
//           </div>
//           <div className="flex gap-2 justify-center">
//             {!pomodoroActive ? (
//               <button onClick={() => setPomodoroActive(true)} className="btn-3d text-xs px-5 py-2">{pomodoroBreak ? 'Start break' : 'Start focus'}</button>
//             ) : (
//               <button onClick={() => setPomodoroActive(false)} className="btn-3d-ghost text-xs px-5 py-2">Pause</button>
//             )}
//             <button onClick={() => { setPomodoroActive(false); setPomodoroMinutes(25); setPomodoroSeconds(0); setPomodoroBreak(false); }} className="btn-3d-ghost text-xs px-3 py-2"><RotateCcw size={14} /></button>
//           </div>
//         </motion.div>

//         {/* Burnout Risk + Recovery */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="card-base">
//           <h3 className="font-display text-base font-semibold mb-3 text-center" style={{ color: 'hsl(var(--text))' }}>Burnout Risk</h3>
//           <div className="relative w-40 h-20 mx-auto mb-3">
//             <svg viewBox="0 0 120 60" className="w-full h-full">
//               <defs><linearGradient id="burnout-g" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="hsl(var(--success))" /><stop offset="50%" stopColor="hsl(var(--warning))" /><stop offset="100%" stopColor="hsl(var(--danger))" /></linearGradient></defs>
//               <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="hsl(var(--surface2))" strokeWidth="10" strokeLinecap="round" />
//               <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="url(#burnout-g)" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
//               <line x1="60" y1="55" x2={60 + 40 * Math.cos(Math.PI - (user.burnoutScore / 100) * Math.PI)} y2={55 - 40 * Math.sin(Math.PI - (user.burnoutScore / 100) * Math.PI)} stroke="hsl(var(--text))" strokeWidth="2.5" strokeLinecap="round" />
//               <circle cx="60" cy="55" r="4" fill="hsl(var(--text))" />
//             </svg>
//           </div>
//           <div className="text-center mb-3">
//             <span className="stat-number text-2xl font-bold" style={{ color: user.burnoutScore > 60 ? 'hsl(var(--danger))' : user.burnoutScore > 30 ? 'hsl(var(--warning))' : 'hsl(var(--success))' }}>{user.burnoutScore}</span>
//           </div>
//           <div className="flex gap-2 justify-center mb-3">
//             <button onClick={() => navigate('/games')} className="text-xs px-3 py-1.5 rounded-lg border border-border" style={{ color: 'hsl(var(--text-secondary))' }}><Sparkles size={12} className="inline mr-1" /> Play a game</button>
//             <button onClick={() => setRecoveryMode(!recoveryMode)} className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${recoveryMode ? 'border-accent' : 'border-border'}`}
//               style={{ color: recoveryMode ? 'hsl(var(--accent))' : 'hsl(var(--text-secondary))', background: recoveryMode ? 'hsl(var(--accent-soft))' : 'transparent' }}>
//               <Moon size={12} className="inline mr-1" /> {recoveryMode ? 'Recovery ON' : 'Recovery mode'}
//             </button>
//           </div>
//           {recoveryMode && (
//             <div className="p-2 rounded-lg text-[10px] text-center" style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}>
//               Active — all pressure elements hidden. Try breathing or a game.
//             </div>
//           )}
//         </motion.div>
//       </div>

//       {/* Row 2: Exercise Cards — entry points to full-screen overlays */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//         {[
//           { label: 'Breathing', icon: <Wind size={22} />, desc: 'Box or 4-7-8 technique', action: () => setOverlay('breathing') },
//           { label: 'CBT', icon: <Brain size={22} />, desc: 'Reframe negative thoughts', action: () => setOverlay('cbt') },
//           { label: 'ACT', icon: <Heart size={22} />, desc: 'Acceptance exercises', action: () => setOverlay('act') },
//           { label: 'Grounding', icon: <Shield size={22} />, desc: '5-4-3-2-1 sensory', action: () => setOverlay('grounding') },
//         ].map((ex, i) => (
//           <motion.button key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
//             onClick={ex.action} className="card-base text-center py-5 hover:scale-[1.02] transition-transform cursor-pointer group">
//             <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-colors"
//               style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}>
//               {ex.icon}
//             </div>
//             <p className="font-display text-sm font-semibold mb-1" style={{ color: 'hsl(var(--text))' }}>{ex.label}</p>
//             <p className="text-[10px]" style={{ color: 'hsl(var(--muted))' }}>{ex.desc}</p>
//           </motion.button>
//         ))}
//       </div>

//       {/* Row 3: Affirmation + Sleep + Anxiety */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         {/* Affirmation */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="card-base flex flex-col justify-between">
//           <div>
//             <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}><Sparkles size={16} style={{ color: 'hsl(var(--accent))' }} /> Affirmation</h3>
//             <p className="font-display text-sm italic leading-relaxed" style={{ color: 'hsl(var(--text))' }}>"{affirmations[affirmationIndex]}"</p>
//           </div>
//           <button onClick={() => setAffirmationIndex((affirmationIndex + 1) % affirmations.length)} className="btn-3d-ghost text-xs px-4 py-2 mt-3 self-start">Next →</button>
//         </motion.div>

//         {/* Sleep */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card-base">
//           <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}><Moon size={16} style={{ color: 'hsl(var(--accent))' }} /> Sleep Quality</h3>
//           <div className="flex gap-1 mb-3">
//             {[1, 2, 3, 4, 5].map(s => (
//               <button key={s} onClick={() => setSleepRating(s)} className="transition-transform hover:scale-110" style={{ opacity: s <= sleepRating ? 1 : 0.3 }}>
//                 <Star size={20} fill={s <= sleepRating ? 'hsl(var(--warning))' : 'none'} style={{ color: 'hsl(var(--warning))' }} />
//               </button>
//             ))}
//           </div>
//           <input type="number" placeholder="Hours slept" value={sleepHours} onChange={e => setSleepHours(e.target.value)}
//             className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none" style={{ background: 'hsl(var(--surface2))', color: 'hsl(var(--text))' }} min="0" max="24" />
//         </motion.div>

//         {/* Anxiety */}
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="card-base">
//           <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}><Activity size={16} style={{ color: 'hsl(var(--accent))' }} /> Anxiety</h3>
//           <input type="range" min="1" max="10" value={anxietyLevel} onChange={e => setAnxietyLevel(Number(e.target.value))} className="w-full h-2 rounded-full appearance-none cursor-pointer mb-2"
//             style={{ background: 'linear-gradient(to right, hsl(var(--success)), hsl(var(--warning)), hsl(var(--danger)))' }} />
//           <div className="flex justify-between text-[10px]" style={{ color: 'hsl(var(--muted))' }}><span>Calm</span><span>High</span></div>
//           <div className="mt-2 text-center">
//             <span className="stat-number text-xl font-bold" style={{ color: anxietyLevel <= 3 ? 'hsl(var(--success))' : anxietyLevel <= 6 ? 'hsl(var(--warning))' : 'hsl(var(--danger))' }}>{anxietyLevel}/10</span>
//           </div>
//         </motion.div>
//       </div>

//       {/* Row 4: Daily Habits (editable) */}
//       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-base">
//         <div className="flex items-center justify-between mb-3">
//           <h3 className="font-display text-sm font-semibold flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
//             <CheckSquare size={16} style={{ color: 'hsl(var(--accent))' }} /> Daily Habits
//             <span className="text-[10px] stat-number" style={{ color: 'hsl(var(--accent))' }}>{habitCount}/{habits.length}</span>
//           </h3>
//           <button onClick={() => setEditingHabits(!editingHabits)} className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--accent))' }}>
//             <Pencil size={12} /> {editingHabits ? 'Done' : 'Edit'}
//           </button>
//         </div>
//         <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
//           {habits.map((h: any, i: number) => (
//             <div key={i} className="flex items-center gap-2">
//               <button onClick={() => { const u = [...habits]; u[i] = { ...u[i], done: !u[i].done }; setHabits(u); }}
//                 className="flex-1 flex items-center gap-2 p-2.5 rounded-lg text-xs transition-all"
//                 style={{ background: h.done ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--surface2))', color: h.done ? 'hsl(var(--success))' : 'hsl(var(--text))' }}>
//                 <div className="w-4 h-4 rounded border flex items-center justify-center text-[10px]"
//                   style={{ borderColor: h.done ? 'hsl(var(--success))' : 'hsl(var(--border))', background: h.done ? 'hsl(var(--success))' : 'transparent', color: 'white' }}>{h.done && '✓'}</div>
//                 {h.label}
//               </button>
//               {editingHabits && (
//                 <button onClick={() => setHabits(habits.filter((_: any, j: number) => j !== i))} className="text-xs p-1 rounded" style={{ color: 'hsl(var(--danger))' }}><X size={14} /></button>
//               )}
//             </div>
//           ))}
//         </div>
//         {editingHabits && (
//           <div className="flex gap-2 mt-3">
//             <input value={newHabitLabel} onChange={e => setNewHabitLabel(e.target.value)} placeholder="New habit..."
//               className="flex-1 px-3 py-2 rounded-lg border border-border text-xs outline-none" style={{ background: 'hsl(var(--surface2))', color: 'hsl(var(--text))' }} />
//             <button onClick={() => { if (newHabitLabel.trim()) { setHabits([...habits, { key: Date.now().toString(), label: newHabitLabel.trim(), done: false }]); setNewHabitLabel(''); } }}
//               className="btn-3d text-xs px-3 py-2"><Plus size={14} /></button>
//           </div>
//         )}
//       </motion.div>
//     </div>
//   );
// };

// export default MentalHealth;


 import { useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { useApp } from '@/contexts/AppContext';
import {
  Moon, Heart, Wind, Timer, Brain, Sparkles, RotateCcw,
  Shield, Star, Phone, Activity, CheckSquare, ArrowLeft,
  Plus, Pencil, X, Eye, Hand, Ear
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const actInterventions = [
  { type: 'defusion', icon: <Wind size={20} />, title: 'Cognitive Defusion', content: 'Notice what thoughts showed up about this quiz.', instruction: 'Can you hold them lightly — like clouds passing?' },
  { type: 'self_compassion', icon: <Heart size={20} />, title: 'Self-Compassion', content: "This is a hard moment. That's okay.", instruction: 'What would you say to a friend who just struggled with this?' },
  { type: 'values', icon: <Sparkles size={20} />, title: 'Values Clarification', content: 'Before we start — why does this matter to you?', instruction: 'Take 10 seconds to remember your reason.' },
  { type: 'acceptance', icon: <Activity size={20} />, title: 'Radical Acceptance', content: "Some days are harder. That doesn't mean you're failing.", instruction: 'Can you sit with this feeling without pushing it away?' },
  { type: 'present_moment', icon: <Shield size={20} />, title: 'Present Moment', content: 'Right now, in this moment, you are safe.', instruction: 'Name 3 things you can see, 2 you can hear, 1 you can feel.' },
];

const cbtSteps = [
  { title: 'Identify the thought', prompt: "What's the negative thought bothering you right now?" },
  { title: 'Evidence FOR this thought', prompt: 'What evidence supports this thought?' },
  { title: 'Evidence AGAINST it', prompt: 'What evidence contradicts this thought? What would a friend say?' },
  { title: 'Balanced thought', prompt: 'Now write a more balanced, realistic version of this thought.' },
];

const affirmations = [
  "I am capable of learning and growing every day.",
  "Struggling with a concept doesn't mean I'm failing — it means I'm learning.",
  "My pace is my own. I don't need to compare myself to anyone.",
  "I've overcome challenges before, and I'll overcome this too.",
  "Taking a break is not giving up — it's recharging.",
  "My worth isn't defined by my exam scores.",
  "Every small step forward counts.",
  "I deserve kindness — especially from myself.",
];

const helplines = [
  { name: 'Vandrevala Foundation', number: '1860-2662-345', available: '24/7' },
  { name: 'iCall', number: '9152987821', available: 'Mon-Sat, 8am-10pm' },
  { name: 'AASRA', number: '9820466726', available: '24/7' },
  { name: 'Snehi', number: '044-24640050', available: '24/7' },
];

const groundingSenses = [
  { num: 5, sense: 'SEE', icon: <Eye size={28} />, color: 'hsl(var(--accent))', placeholder: 'Name 5 things you can see...' },
  { num: 4, sense: 'TOUCH', icon: <Hand size={28} />, color: 'hsl(var(--success))', placeholder: 'Name 4 things you can touch...' },
  { num: 3, sense: 'HEAR', icon: <Ear size={28} />, color: 'hsl(var(--warning))', placeholder: 'Name 3 things you can hear...' },
  { num: 2, sense: 'SMELL', icon: <Wind size={28} />, color: 'hsl(var(--danger))', placeholder: 'Name 2 things you can smell...' },
  { num: 1, sense: 'TASTE', icon: <Sparkles size={28} />, color: 'hsl(var(--accent))', placeholder: 'Name 1 thing you can taste...' },
];

type Overlay = null | 'breathing' | 'cbt' | 'act' | 'grounding';

// ─────────────────────────────────────────────────────────────────────────────
// INTERACTIVE PARTICLE BACKGROUND
// Canvas-based animated background that:
//  - Renders floating particles (dots + diamond shapes) inspired by ancient symbols
//  - Draws subtle sacred geometry mandala rings at center
//  - Renders ambient light orbs that drift slowly
//  - Particles gently repel from cursor (parallax depth effect)
//  - All animation slows to 20% speed in focus mode
// ─────────────────────────────────────────────────────────────────────────────
const WellnessBackground = ({ focusMode }: { focusMode: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const animRef = useRef<number>(0);
  const stateRef = useRef<{
    particles: any[];
    orbs: any[];
    t: number;
    isDark: boolean;
  }>({ particles: [], orbs: [], t: 0, isDark: false });

  // Build particle and orb arrays once on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const isDark = document.documentElement.getAttribute('data-theme') !== 'paper';
    const COUNT = window.innerWidth < 640 ? 28 : 55;

    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28 - 0.1,
      r: Math.random() * 2.2 + 0.5,
      opacity: Math.random() * 0.45 + 0.08,
      hue: Math.floor(Math.random() * 3),
      type: Math.random() > 0.72 ? 'diamond' : 'circle',
      phase: Math.random() * Math.PI * 2,
    }));

    const orbs = Array.from({ length: 5 }, (_, i) => ({
      x: (canvas.width / 5) * (i + 0.5),
      y: canvas.height * (0.25 + Math.random() * 0.5),
      r: 90 + Math.random() * 110,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.12,
      phase: Math.random() * Math.PI * 2,
      hueArr: [176, 150, 130, 28, 200][i],
    }));

    stateRef.current = { particles, orbs, t: 0, isDark };
    return () => ro.disconnect();
  }, []);

  // Main draw loop — restarts when focusMode changes
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
      const mx = mouseRef.current.x * w;
      const my = mouseRef.current.y * h;

      ctx.clearRect(0, 0, w, h);

      // Ambient orbs
      orbs.forEach(orb => {
        orb.x += orb.vx * speed;
        orb.y += orb.vy * speed;
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
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r * pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      // Sacred geometry rings centered on canvas
      const cx = w / 2, cy = h / 2;
      [75, 150, 225, 300].forEach((r, i) => {
        const rot1 = t * 0.0004 * (i % 2 === 0 ? 1 : -1);
        const alpha = (focusMode ? 0.03 : 0.022 + Math.sin(t * 0.003 + i) * 0.008);
        const color = isDark ? `rgba(212,175,55,${alpha})` : `rgba(139,105,20,${alpha})`;
        // Dashed circle
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.setLineDash([3, 7]);
        ctx.stroke();
        ctx.setLineDash([]);
        // Dot markers on each ring
        for (let d = 0; d < 8; d++) {
          const ang = (d / 8) * Math.PI * 2 + rot1;
          ctx.beginPath();
          ctx.arc(cx + r * Math.cos(ang), cy + r * Math.sin(ang), 1.3, 0, Math.PI * 2);
          ctx.fillStyle = isDark ? `rgba(212,175,55,${alpha * 5})` : `rgba(139,105,20,${alpha * 5})`;
          ctx.fill();
        }
      });

      // Particles
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
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        const op = Math.max(0, (focusMode ? p.opacity * 0.35 : p.opacity) + Math.sin(t * 0.009 + p.phase) * 0.04);
        ctx.fillStyle = `${COLORS[p.hue]}${op})`;

        if (p.type === 'diamond') {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(Math.PI / 4 + t * 0.002);
          ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      stateRef.current.t = t + 1;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [focusMode]);

  // Track cursor for parallax
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight };
    };
    window.addEventListener('mousemove', handle, { passive: true });
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SVG ROTATING MANDALA CENTERPIECE
// Layered SVG mandala with:
//  - 4 independently rotating ring layers at different speeds/directions
//  - Cursor-reactive 3D tilt via CSS perspective transform
//  - SVG glow filter for soft ambient light
//  - Slows gracefully in focus mode
// ─────────────────────────────────────────────────────────────────────────────
const MandalaOrb = ({ focusMode, isDark }: { focusMode: boolean; isDark: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / Math.max(rect.width / 2, 1);
      const dy = (e.clientY - cy) / Math.max(rect.height / 2, 1);
      setTilt({ x: dy * -10, y: dx * 10 });
    };
    window.addEventListener('mousemove', handle, { passive: true });
    return () => window.removeEventListener('mousemove', handle);
  }, []);

  const gold = isDark ? '#D4AF37' : '#8B6914';
  const teal = isDark ? '#64C8B4' : '#1E7864';
  const sage = isDark ? '#96C896' : '#3C8246';
  const glow = isDark ? 'rgba(212,175,55,0.18)' : 'rgba(139,105,20,0.1)';
  const slowMult = focusMode ? 2.8 : 1;

  return (
    <div ref={containerRef} style={{ perspective: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}>
      <style>{`
        @keyframes mSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes mSpinR { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes mPulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
      `}</style>
      <div
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: 'transform 0.12s ease-out',
          filter: `drop-shadow(0 0 28px ${glow}) drop-shadow(0 0 6px ${glow})`,
        }}
      >
        <svg width="200" height="200" viewBox="-100 -100 200 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="mg">
              <feGaussianBlur stdDeviation="1.5" result="b"/>
              <feComposite in="SourceGraphic" in2="b" operator="over"/>
            </filter>
            <radialGradient id="cg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={gold} stopOpacity="0.25"/>
              <stop offset="100%" stopColor={gold} stopOpacity="0"/>
            </radialGradient>
          </defs>

          {/* Core ambient glow */}
          <circle cx="0" cy="0" r="28" fill="url(#cg)"/>

          {/* Outermost ring — slow reverse */}
          <g style={{ animation: `mSpinR ${35 * slowMult}s linear infinite`, transformOrigin: 'center' }}>
            <circle cx="0" cy="0" r="72" fill="none" stroke={sage} strokeWidth="0.4" strokeOpacity="0.28" strokeDasharray="2 8"/>
            {[0,45,90,135,180,225,270,315].map((a,i) => (
              <g key={i} transform={`rotate(${a})`}>
                <path d="M0 42 L4 56 L0 70 L-4 56Z" fill={sage} fillOpacity="0.3"/>
                <circle cx="0" cy="46" r="1.4" fill={sage} fillOpacity="0.55"/>
              </g>
            ))}
          </g>

          {/* Middle ring — medium forward */}
          <g style={{ animation: `mSpin ${22 * slowMult}s linear infinite`, transformOrigin: 'center' }}>
            <circle cx="0" cy="0" r="50" fill="none" stroke={teal} strokeWidth="0.5" strokeOpacity="0.38"/>
            {[0,30,60,90,120,150,180,210,240,270,300,330].map((a,i) => (
              <ellipse key={i} transform={`rotate(${a})`} cx="0" cy="48" rx="2" ry="4" fill={teal} fillOpacity="0.42"/>
            ))}
            {[0,60,120,180,240,300].map((a,i) => (
              <g key={i} transform={`rotate(${a})`}>
                <path d="M0 35 Q6 42 0 49 Q-6 42 0 35Z" fill={teal} fillOpacity="0.28"/>
              </g>
            ))}
          </g>

          {/* Inner ring — faster reverse */}
          <g style={{ animation: `mSpinR ${13 * slowMult}s linear infinite`, transformOrigin: 'center' }}>
            <circle cx="0" cy="0" r="30" fill="none" stroke={gold} strokeWidth="0.6" strokeOpacity="0.48"/>
            {[0,45,90,135,180,225,270,315].map((a,i) => (
              <g key={i} transform={`rotate(${a})`}>
                <path d="M0 22 L3 30 L0 38 L-3 30Z" fill={gold} fillOpacity="0.52"/>
              </g>
            ))}
          </g>

          {/* Star polygon — ultra slow */}
          <g style={{ animation: `mSpin ${65 * slowMult}s linear infinite`, transformOrigin: 'center' }}>
            {[0,72,144,216,288].map((a,i) => (
              <g key={i} transform={`rotate(${a})`}>
                <path d="M0 0 L3.5 14 L-3.5 14Z" fill={gold} fillOpacity="0.18"/>
              </g>
            ))}
          </g>

          {/* Static lotus petals */}
          {[0,60,120,180,240,300].map((a,i) => (
            <ellipse key={i} transform={`rotate(${a})`} cx="0" cy="9" rx="3.2" ry="7" fill={gold} fillOpacity="0.62"/>
          ))}

          {/* Core dot with glow */}
          <circle cx="0" cy="0" r="4" fill={gold} fillOpacity="0.92" filter="url(#mg)"
            style={{ animation: `mPulse ${3 * slowMult}s ease-in-out infinite` }}/>
          <circle cx="0" cy="0" r="2" fill="white" fillOpacity="0.35"/>
        </svg>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3D TILT + GLASSMORPHISM CARD
// On mouse enter/move: card tilts toward cursor via CSS perspective transform
// On mouse leave: smoothly resets
// Glass surface: semi-transparent background + blur + soft border
// ─────────────────────────────────────────────────────────────────────────────
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
    const el = cardRef.current;
    if (!el) return;
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
        }}/>
        {children}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const MentalHealth = () => {
  const { user } = useApp();
  const { theme, recoveryMode, setRecoveryMode } = useTheme();
  const navigate = useNavigate();
  const isDark = theme !== 'paper';

  const [overlay, setOverlay] = useState<Overlay>(null);

  // ── Breathing state ──
  const [breathType, setBreathType] = useState<'478' | 'box'>('box');
  const [breathPhase, setBreathPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale' | 'hold2'>('idle');
  const [breathCycle, setBreathCycle] = useState(0);
  const [breathTotal] = useState(5);
  const [breathCountdown, setBreathCountdown] = useState(4);
  const [breathDone, setBreathDone] = useState(false);
  const breathIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── CBT state ──
  const [cbtStep, setCbtStep] = useState(0);
  const [cbtAnswers, setCbtAnswers] = useState<string[]>([''  , '', '', '']);

  // ── ACT state ──
  const [actIndex, setActIndex] = useState(0);

  // ── Grounding state ──
  const [groundingStep, setGroundingStep] = useState(0);
  const [groundingInputs, setGroundingInputs] = useState<string[]>(['', '', '', '', '']);

  // ── Pomodoro state ──
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [pomodoroSeconds, setPomodoroSeconds] = useState(0);
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroBreak, setPomodoroBreak] = useState(false);
  const [pomodoroSessions, setPomodoroSessions] = useState(0);

  // ── Wellness features ──
  const [sleepRating, setSleepRating] = useState(0);
  const [sleepHours, setSleepHours] = useState('');
  const [anxietyLevel, setAnxietyLevel] = useState(3);
  const [affirmationIndex, setAffirmationIndex] = useState(0);
  const [showSOS, setShowSOS] = useState(false);

  const defaultHabits = [
    { key: 'meditate', label: 'Meditate 5 min', done: false },
    { key: 'exercise', label: 'Move/Exercise', done: false },
    { key: 'journal', label: 'Journal', done: false },
    { key: 'hydrate', label: 'Drink water', done: false },
    { key: 'sleep7', label: 'Sleep 7+ hrs', done: false },
  ];
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('gurukul-habits');
    return saved ? JSON.parse(saved) : defaultHabits;
  });
  const [editingHabits, setEditingHabits] = useState(false);
  const [newHabitLabel, setNewHabitLabel] = useState('');

  useEffect(() => { localStorage.setItem('gurukul-habits', JSON.stringify(habits)); }, [habits]);

  // Pomodoro timer tick
  useEffect(() => {
    if (!pomodoroActive) return;
    const interval = setInterval(() => {
      setPomodoroSeconds(prev => {
        if (prev === 0) {
          if (pomodoroMinutes === 0) {
            setPomodoroActive(false);
            if (pomodoroBreak) { setPomodoroBreak(false); setPomodoroMinutes(25); }
            else { setPomodoroSessions(p => p + 1); setPomodoroBreak(true); setPomodoroMinutes(5); }
            return 0;
          }
          setPomodoroMinutes(m => m - 1);
          return 59;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [pomodoroActive, pomodoroMinutes, pomodoroBreak]);

  // Breathing engine
  useEffect(() => {
    if (overlay !== 'breathing' || breathPhase === 'idle' || breathDone) return;
    const durations: Record<string, Record<string, number>> = {
      box: { inhale: 4, hold: 4, exhale: 4, hold2: 4 },
      '478': { inhale: 4, hold: 7, exhale: 8 },
    };
    const seq = breathType === 'box' ? ['inhale', 'hold', 'exhale', 'hold2'] : ['inhale', 'hold', 'exhale'];
    const currentIdx = seq.indexOf(breathPhase);
    const dur = durations[breathType][breathPhase] || 4;
    setBreathCountdown(dur);

    breathIntervalRef.current = setInterval(() => {
      setBreathCountdown(prev => {
        if (prev <= 1) {
          const nextIdx = currentIdx + 1;
          if (nextIdx >= seq.length) {
            const newCycle = breathCycle + 1;
            setBreathCycle(newCycle);
            if (newCycle >= breathTotal) { setBreathDone(true); setBreathPhase('idle'); return 0; }
            setBreathPhase(seq[0] as any);
          } else {
            setBreathPhase(seq[nextIdx] as any);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (breathIntervalRef.current) clearInterval(breathIntervalRef.current); };
  }, [overlay, breathPhase, breathType, breathCycle, breathTotal, breathDone]);

  const startBreathing = () => { setBreathDone(false); setBreathCycle(0); setBreathPhase('inhale'); };
  const closeOverlay = () => {
    setOverlay(null); setBreathPhase('idle'); setBreathDone(false); setBreathCycle(0);
    setCbtStep(0); setCbtAnswers(['', '', '', '']);
    setGroundingStep(0); setGroundingInputs(['', '', '', '', '']);
  };

  const pomodoroProgress = pomodoroBreak
    ? ((5 * 60 - (pomodoroMinutes * 60 + pomodoroSeconds)) / (5 * 60)) * 100
    : ((25 * 60 - (pomodoroMinutes * 60 + pomodoroSeconds)) / (25 * 60)) * 100;

  const habitCount = habits.filter((h: any) => h.done).length;

  // ── OVERLAY: BREATHING ────────────────────────────────────────────────────
  if (overlay === 'breathing') {
    const circleScale = breathPhase === 'inhale' ? 1.6 : (breathPhase === 'hold' || breathPhase === 'hold2') ? 1.6 : 1;
    const phaseLabel = breathPhase === 'inhale' ? 'Breathe In...' : breathPhase === 'hold' || breathPhase === 'hold2' ? 'Hold...' : breathPhase === 'exhale' ? 'Breathe Out...' : '';
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(180deg, hsl(180 30% 8%), hsl(220 30% 12%))' }}>
        <button onClick={closeOverlay} className="absolute top-6 left-6 text-white/60 hover:text-white flex items-center gap-2 text-sm z-10"><ArrowLeft size={18} /> Back</button>
        {breathDone ? (
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
            <span className="text-6xl mb-4 block">🌿</span>
            <h2 className="font-display text-2xl font-bold text-white mb-2">Great job!</h2>
            <p className="text-white/60 mb-2">You completed {breathTotal} cycles</p>
            <p className="text-white/40 text-sm mb-6">{breathType === 'box' ? 'Box Breathing' : '4-7-8 Breathing'} · {breathTotal * (breathType === 'box' ? 16 : 19)}s total</p>
            <button onClick={closeOverlay} className="btn-3d px-8 py-3 text-sm font-semibold">Done</button>
          </motion.div>
        ) : breathPhase === 'idle' ? (
          <div className="text-center">
            <Wind size={48} className="mx-auto mb-6 text-white/60" />
            <h2 className="font-display text-2xl font-bold text-white mb-4">Choose your breathing</h2>
            <div className="flex gap-3 mb-8">
              {[{ type: 'box' as const, label: 'Box (4-4-4-4)' }, { type: '478' as const, label: '4-7-8' }].map(b => (
                <button key={b.type} onClick={() => setBreathType(b.type)}
                  className="px-5 py-3 rounded-xl text-sm font-medium transition-all"
                  style={{ background: breathType === b.type ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)', color: 'white', border: breathType === b.type ? '1px solid rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
                  {b.label}
                </button>
              ))}
            </div>
            <button onClick={startBreathing} className="px-8 py-3 rounded-xl text-white font-semibold"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
              Start breathing
            </button>
          </div>
        ) : (
          <div className="text-center">
            <motion.div animate={{ scale: circleScale }} transition={{ duration: breathCountdown > 0 ? breathCountdown : 4, ease: 'easeInOut' }}
              className="w-48 h-48 rounded-full flex items-center justify-center mx-auto mb-8 relative"
              style={{ background: 'radial-gradient(circle, rgba(100,200,180,0.2), rgba(100,200,180,0.05))', boxShadow: '0 0 60px rgba(100,200,180,0.15), inset 0 0 30px rgba(100,200,180,0.1)' }}>
              <motion.div animate={{ scale: circleScale * 0.6 }} transition={{ duration: breathCountdown > 0 ? breathCountdown : 4, ease: 'easeInOut' }}
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(100,200,180,0.15)' }}>
                <span className="font-display text-3xl font-bold text-white">{breathCountdown}</span>
              </motion.div>
            </motion.div>
            <motion.p key={breathPhase} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="font-display text-xl text-white/80 mb-4">{phaseLabel}</motion.p>
            <p className="text-white/40 text-sm">Cycle {breathCycle + 1} of {breathTotal}</p>
            <button onClick={() => { setBreathPhase('idle'); setBreathDone(false); setBreathCycle(0); }}
              className="mt-8 text-white/40 text-xs hover:text-white/60">Stop</button>
          </div>
        )}
      </motion.div>
    );
  }

  if (overlay === 'cbt') {
    const isLast = cbtStep >= cbtSteps.length;
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(180deg, hsl(200 25% 10%), hsl(230 25% 14%))' }}>
        <button onClick={closeOverlay} className="absolute top-6 left-6 text-white/60 hover:text-white flex items-center gap-2 text-sm"><ArrowLeft size={18} /> Back</button>
        {!isLast && (
          <div className="w-full max-w-md mb-8">
            <div className="flex gap-1">
              {cbtSteps.map((_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i <= cbtStep ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>
          </div>
        )}
        <AnimatePresence mode="wait">
          {isLast ? (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full text-center">
              <Brain size={48} className="mx-auto mb-4 text-white/60" />
              <h2 className="font-display text-xl font-bold text-white mb-4">Thought Reframed</h2>
              <div className="space-y-3 mb-6 text-left">
                {cbtSteps.map((s, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <p className="text-xs text-white/40 mb-1">{s.title}</p>
                    <p className="text-sm text-white/80">{cbtAnswers[i] || '(skipped)'}</p>
                  </div>
                ))}
              </div>
              <button onClick={closeOverlay} className="btn-3d px-8 py-3 text-sm font-semibold">Done</button>
            </motion.div>
          ) : (
            <motion.div key={cbtStep} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="max-w-md w-full text-center">
              <Brain size={36} className="mx-auto mb-4 text-white/40" />
              <p className="text-xs text-white/40 mb-2">Step {cbtStep + 1} of {cbtSteps.length}</p>
              <h2 className="font-display text-lg font-bold text-white mb-2">{cbtSteps[cbtStep].title}</h2>
              <p className="text-sm text-white/60 mb-6">{cbtSteps[cbtStep].prompt}</p>
              <textarea value={cbtAnswers[cbtStep]} onChange={e => { const a = [...cbtAnswers]; a[cbtStep] = e.target.value; setCbtAnswers(a); }}
                placeholder="Write your thoughts..." rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-4"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }} />
              <button onClick={() => setCbtStep(cbtStep + 1)}
                className="px-8 py-3 rounded-xl text-white font-semibold" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
                {cbtStep < cbtSteps.length - 1 ? 'Next →' : 'See Summary'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (overlay === 'act') {
    const a = actInterventions[actIndex];
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(180deg, hsl(260 20% 10%), hsl(280 20% 14%))' }}>
        <button onClick={closeOverlay} className="absolute top-6 left-6 text-white/60 hover:text-white flex items-center gap-2 text-sm"><ArrowLeft size={18} /> Back</button>
        <AnimatePresence mode="wait">
          <motion.div key={actIndex} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <span className="text-white/60">{a.icon}</span>
            </div>
            <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">{a.type.replace('_', ' ')}</p>
            <h2 className="font-display text-xl font-bold text-white mb-4">{a.title}</h2>
            <p className="font-display text-lg italic text-white/80 mb-4 leading-relaxed">{a.content}</p>
            <p className="text-sm text-white/50 mb-8">{a.instruction}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setActIndex((actIndex + 1) % actInterventions.length)}
                className="px-6 py-3 rounded-xl text-white font-semibold" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                Next exercise →
              </button>
              <button onClick={closeOverlay} className="px-6 py-3 rounded-xl text-white/60 font-medium" style={{ background: 'rgba(255,255,255,0.05)' }}>Done</button>
            </div>
            <p className="text-xs text-white/30 mt-6">{actIndex + 1} of {actInterventions.length}</p>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    );
  }

  if (overlay === 'grounding') {
    const isDone = groundingStep >= groundingSenses.length;
    const g = groundingSenses[groundingStep];
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex flex-col items-center justify-center p-6"
        style={{ background: 'linear-gradient(180deg, hsl(160 25% 8%), hsl(180 20% 12%))' }}>
        <button onClick={closeOverlay} className="absolute top-6 left-6 text-white/60 hover:text-white flex items-center gap-2 text-sm"><ArrowLeft size={18} /> Back</button>
        {!isDone && (
          <div className="w-full max-w-md mb-8">
            <div className="flex gap-1">
              {groundingSenses.map((_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full" style={{ background: i <= groundingStep ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)' }} />
              ))}
            </div>
            <p className="text-xs text-white/40 text-center mt-2">{groundingStep + 1} / {groundingSenses.length}</p>
          </div>
        )}
        <AnimatePresence mode="wait">
          {isDone ? (
            <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full text-center">
              <Shield size={48} className="mx-auto mb-4 text-white/60" />
              <h2 className="font-display text-xl font-bold text-white mb-4">{"You're grounded 🌿"}</h2>
              <div className="space-y-2 mb-6 text-left">
                {groundingSenses.map((s, i) => (
                  <div key={i} className="p-2 rounded-lg text-sm" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <span className="text-white/40">{s.num} {s.sense}: </span>
                    <span className="text-white/80">{groundingInputs[i] || '—'}</span>
                  </div>
                ))}
              </div>
              <button onClick={closeOverlay} className="btn-3d px-8 py-3 text-sm font-semibold">Done</button>
            </motion.div>
          ) : (
            <motion.div key={groundingStep} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="max-w-md w-full text-center">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <span style={{ color: g.color }}>{g.icon}</span>
              </div>
              <h2 className="font-display text-3xl font-bold text-white mb-2">Name {g.num} things you can {g.sense}</h2>
              <textarea value={groundingInputs[groundingStep]}
                onChange={e => { const inputs = [...groundingInputs]; inputs[groundingStep] = e.target.value; setGroundingInputs(inputs); }}
                placeholder={g.placeholder} rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none mb-4 mt-4"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.15)' }} />
              <button onClick={() => setGroundingStep(groundingStep + 1)}
                className="px-8 py-3 rounded-xl text-white font-semibold" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
                Next →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ── MAIN PAGE ─────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen">
      {/* Interactive particle + mandala background */}
      <WellnessBackground focusMode={pomodoroActive} />

      {/* Focus mode dim overlay — activates when Pomodoro runs */}
      <AnimatePresence>
        {pomodoroActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: 1, background: 'rgba(0,0,0,0.15)', backdropFilter: 'blur(0.5px)' }} />
        )}
      </AnimatePresence>

      {/* Content layer */}
      <div className="relative max-w-5xl mx-auto px-4 py-6 space-y-6" style={{ zIndex: 2 }}>

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
              <Brain size={24} style={{ color: 'hsl(var(--accent))' }} /> Mental Wellbeing
            </h2>
            <p className="text-sm mt-1" style={{ color: 'hsl(var(--muted))' }}>
              Your emotional state is a learning variable, not a separate problem.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/journal')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all hover:scale-105"
              style={{ borderColor: 'hsl(var(--accent))', color: 'hsl(var(--accent))', background: 'hsl(var(--accent) / 0.08)' }}>
              <Pencil size={14} /> Journal
            </button>
            <button onClick={() => setShowSOS(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all hover:scale-105"
              style={{ borderColor: 'hsl(var(--danger))', color: 'hsl(var(--danger))', background: 'hsl(var(--danger) / 0.08)' }}>
              <Phone size={14} /> SOS Help
            </button>
          </div>
        </motion.div>

        {/* ── Hero Row: Mandala + Focus Timer ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Mandala Hero */}
          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.06 }}>
            <GlassCard glowColor="rgba(212,175,55,0.22)" intensity={6} style={{ height: '100%' }}>
              <div className="flex flex-col items-center justify-center py-3 gap-3">
                <AnimatePresence>
                  {pomodoroActive && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase"
                      style={{ background: 'hsl(var(--accent) / 0.14)', color: 'hsl(var(--accent))', border: '1px solid hsl(var(--accent) / 0.28)' }}>
                      ✦ Focus Mode Active
                    </motion.div>
                  )}
                </AnimatePresence>

                <MandalaOrb focusMode={pomodoroActive} isDark={isDark} />

                <div className="text-center">
                  <p className="font-display text-sm font-medium" style={{ color: 'hsl(var(--text))' }}>Gurukul Mandala</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'hsl(var(--muted))' }}>
                    {pomodoroActive ? 'Breathe. Stay present.' : 'Symbol of focus & mindfulness'}
                  </p>
                </div>

                <div className="w-full px-2">
                  <AnimatePresence mode="wait">
                    <motion.p key={affirmationIndex}
                      initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                      className="font-display text-xs italic text-center leading-relaxed"
                      style={{ color: 'hsl(var(--text-secondary))' }}>
                      "{affirmations[affirmationIndex]}"
                    </motion.p>
                  </AnimatePresence>
                  <button onClick={() => setAffirmationIndex((affirmationIndex + 1) % affirmations.length)}
                    className="block mx-auto mt-2 text-[10px] hover:opacity-60 transition-opacity"
                    style={{ color: 'hsl(var(--accent))' }}>
                    Next ›
                  </button>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Focus Timer */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }}>
            <GlassCard glowColor={pomodoroActive ? 'rgba(100,200,180,0.28)' : 'rgba(100,200,180,0.12)'} intensity={8} style={{ height: '100%' }}>
              <h3 className="font-display text-base font-semibold mb-4 flex items-center justify-center gap-2" style={{ color: 'hsl(var(--text))' }}>
                <Timer size={18} style={{ color: 'hsl(var(--accent))' }} /> Focus Timer
              </h3>
              <div className="relative w-40 h-40 mx-auto mb-4">
                {pomodoroActive && (
                  <div className="absolute inset-0 rounded-full"
                    style={{ animation: 'pulse 2s ease-in-out infinite', boxShadow: `0 0 40px ${pomodoroBreak ? 'rgba(100,200,100,0.28)' : 'rgba(100,200,180,0.28)'}` }} />
                )}
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--surface2))" strokeWidth="5" />
                  <circle cx="50" cy="50" r="42" fill="none"
                    stroke={pomodoroBreak ? 'hsl(var(--success))' : 'hsl(var(--accent))'} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={264} strokeDashoffset={264 - (pomodoroProgress / 100) * 264}
                    style={{ transition: 'stroke-dashoffset 1s linear', filter: pomodoroActive ? 'drop-shadow(0 0 4px hsl(var(--accent)))' : 'none' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="stat-number text-2xl font-bold" style={{ color: pomodoroBreak ? 'hsl(var(--success))' : 'hsl(var(--text))' }}>
                    {String(pomodoroMinutes).padStart(2, '0')}:{String(pomodoroSeconds).padStart(2, '0')}
                  </p>
                  <p className="text-[10px] mt-1" style={{ color: 'hsl(var(--muted))' }}>
                    {pomodoroBreak ? 'Break' : 'Focus'} · {pomodoroSessions} done
                  </p>
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                {!pomodoroActive ? (
                  <button onClick={() => setPomodoroActive(true)} className="btn-3d text-xs px-5 py-2">
                    {pomodoroBreak ? 'Start break' : 'Start focus'}
                  </button>
                ) : (
                  <button onClick={() => setPomodoroActive(false)} className="btn-3d-ghost text-xs px-5 py-2">Pause</button>
                )}
                <button onClick={() => { setPomodoroActive(false); setPomodoroMinutes(25); setPomodoroSeconds(0); setPomodoroBreak(false); }}
                  className="btn-3d-ghost text-xs px-3 py-2"><RotateCcw size={14} /></button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* ── Row 2: Burnout + Sleep + Anxiety ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <GlassCard glowColor="rgba(200,100,80,0.16)" intensity={10}>
              <h3 className="font-display text-sm font-semibold mb-3 text-center" style={{ color: 'hsl(var(--text))' }}>Burnout Risk</h3>
              <div className="relative w-36 h-20 mx-auto mb-2">
                <svg viewBox="0 0 120 60" className="w-full h-full">
                  <defs>
                    <linearGradient id="burnout-g" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="hsl(var(--success))" />
                      <stop offset="50%" stopColor="hsl(var(--warning))" />
                      <stop offset="100%" stopColor="hsl(var(--danger))" />
                    </linearGradient>
                  </defs>
                  <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="hsl(var(--surface2))" strokeWidth="10" strokeLinecap="round" />
                  <path d="M 10 55 A 50 50 0 0 1 110 55" fill="none" stroke="url(#burnout-g)" strokeWidth="10" strokeLinecap="round" opacity="0.6" />
                  <line x1="60" y1="55"
                    x2={60 + 40 * Math.cos(Math.PI - (user.burnoutScore / 100) * Math.PI)}
                    y2={55 - 40 * Math.sin(Math.PI - (user.burnoutScore / 100) * Math.PI)}
                    stroke="hsl(var(--text))" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="60" cy="55" r="4" fill="hsl(var(--text))" />
                </svg>
              </div>
              <div className="text-center mb-3">
                <span className="stat-number text-2xl font-bold"
                  style={{ color: user.burnoutScore > 60 ? 'hsl(var(--danger))' : user.burnoutScore > 30 ? 'hsl(var(--warning))' : 'hsl(var(--success))' }}>
                  {user.burnoutScore}
                </span>
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                <button onClick={() => navigate('/games')} className="text-xs px-3 py-1.5 rounded-lg border border-border" style={{ color: 'hsl(var(--text-secondary))' }}>
                  <Sparkles size={12} className="inline mr-1" /> Play a game
                </button>
                <button onClick={() => setRecoveryMode(!recoveryMode)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${recoveryMode ? 'border-accent' : 'border-border'}`}
                  style={{ color: recoveryMode ? 'hsl(var(--accent))' : 'hsl(var(--text-secondary))', background: recoveryMode ? 'hsl(var(--accent-soft))' : 'transparent' }}>
                  <Moon size={12} className="inline mr-1" /> {recoveryMode ? 'Recovery ON' : 'Recovery mode'}
                </button>
              </div>
              {recoveryMode && (
                <div className="mt-2 p-2 rounded-lg text-[10px] text-center" style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}>
                  Active — all pressure elements hidden. Try breathing or a game.
                </div>
              )}
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}>
            <GlassCard glowColor="rgba(140,140,220,0.16)" intensity={10}>
              <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
                <Moon size={16} style={{ color: 'hsl(var(--accent))' }} /> Sleep Quality
              </h3>
              <div className="flex gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <button key={s} onClick={() => setSleepRating(s)} className="transition-transform hover:scale-125" style={{ opacity: s <= sleepRating ? 1 : 0.3 }}>
                    <Star size={22} fill={s <= sleepRating ? 'hsl(var(--warning))' : 'none'} style={{ color: 'hsl(var(--warning))' }} />
                  </button>
                ))}
              </div>
              <input type="number" placeholder="Hours slept" value={sleepHours} onChange={e => setSleepHours(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-xs outline-none"
                style={{ background: 'hsl(var(--surface2))', color: 'hsl(var(--text))' }} min="0" max="24" />
            </GlassCard>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
            <GlassCard glowColor="rgba(200,160,80,0.16)" intensity={10}>
              <h3 className="font-display text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
                <Activity size={16} style={{ color: 'hsl(var(--accent))' }} /> Anxiety Level
              </h3>
              <input type="range" min="1" max="10" value={anxietyLevel} onChange={e => setAnxietyLevel(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer mb-2"
                style={{ background: 'linear-gradient(to right, hsl(var(--success)), hsl(var(--warning)), hsl(var(--danger)))' }} />
              <div className="flex justify-between text-[10px]" style={{ color: 'hsl(var(--muted))' }}>
                <span>Calm</span><span>High</span>
              </div>
              <div className="mt-3 text-center">
                <span className="stat-number text-2xl font-bold"
                  style={{ color: anxietyLevel <= 3 ? 'hsl(var(--success))' : anxietyLevel <= 6 ? 'hsl(var(--warning))' : 'hsl(var(--danger))' }}>
                  {anxietyLevel}/10
                </span>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* ── Row 3: Exercise Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Breathing', icon: <Wind size={22} />, desc: 'Box or 4-7-8 technique', action: () => setOverlay('breathing'), glow: 'rgba(100,200,180,0.22)' },
            { label: 'CBT', icon: <Brain size={22} />, desc: 'Reframe negative thoughts', action: () => setOverlay('cbt'), glow: 'rgba(100,140,220,0.22)' },
            { label: 'ACT', icon: <Heart size={22} />, desc: 'Acceptance exercises', action: () => setOverlay('act'), glow: 'rgba(220,100,150,0.22)' },
            { label: 'Grounding', icon: <Shield size={22} />, desc: '5-4-3-2-1 sensory', action: () => setOverlay('grounding'), glow: 'rgba(140,200,100,0.22)' },
          ].map((ex, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <GlassCard glowColor={ex.glow} intensity={13} onClick={ex.action} style={{ height: '100%' }}>
                <div className="text-center py-2 group">
                  <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
                    style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}>
                    {ex.icon}
                  </div>
                  <p className="font-display text-sm font-semibold mb-1" style={{ color: 'hsl(var(--text))' }}>{ex.label}</p>
                  <p className="text-[10px]" style={{ color: 'hsl(var(--muted))' }}>{ex.desc}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        {/* ── Row 4: Daily Habits ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.26 }}>
          <GlassCard glowColor="rgba(212,175,55,0.12)" intensity={5}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-sm font-semibold flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
                <CheckSquare size={16} style={{ color: 'hsl(var(--accent))' }} /> Daily Habits
                <span className="text-[10px] stat-number" style={{ color: 'hsl(var(--accent))' }}>{habitCount}/{habits.length}</span>
              </h3>
              <button onClick={() => setEditingHabits(!editingHabits)} className="text-xs flex items-center gap-1" style={{ color: 'hsl(var(--accent))' }}>
                <Pencil size={12} /> {editingHabits ? 'Done' : 'Edit'}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {habits.map((h: any, i: number) => (
                <div key={i} className="flex items-center gap-2">
                  <button onClick={() => { const u = [...habits]; u[i] = { ...u[i], done: !u[i].done }; setHabits(u); }}
                    className="flex-1 flex items-center gap-2 p-2.5 rounded-xl text-xs transition-all hover:scale-[1.02]"
                    style={{ background: h.done ? 'hsl(var(--success) / 0.12)' : 'hsl(var(--surface2))', color: h.done ? 'hsl(var(--success))' : 'hsl(var(--text))' }}>
                    <div className="w-4 h-4 rounded border flex items-center justify-center text-[10px] transition-all"
                      style={{ borderColor: h.done ? 'hsl(var(--success))' : 'hsl(var(--border))', background: h.done ? 'hsl(var(--success))' : 'transparent', color: 'white' }}>
                      {h.done && '✓'}
                    </div>
                    {h.label}
                  </button>
                  {editingHabits && (
                    <button onClick={() => setHabits(habits.filter((_: any, j: number) => j !== i))} className="text-xs p-1 rounded" style={{ color: 'hsl(var(--danger))' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {editingHabits && (
              <div className="flex gap-2 mt-3">
                <input value={newHabitLabel} onChange={e => setNewHabitLabel(e.target.value)} placeholder="New habit..."
                  className="flex-1 px-3 py-2 rounded-lg border border-border text-xs outline-none"
                  style={{ background: 'hsl(var(--surface2))', color: 'hsl(var(--text))' }} />
                <button onClick={() => { if (newHabitLabel.trim()) { setHabits([...habits, { key: Date.now().toString(), label: newHabitLabel.trim(), done: false }]); setNewHabitLabel(''); } }}
                  className="btn-3d text-xs px-3 py-2"><Plus size={14} /></button>
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* ── Enhancement Hints ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 }}>
          <div className="flex gap-2 flex-wrap">
            {[{ icon: '🎵', label: 'Nature sounds' }, { icon: '🌬️', label: 'Guided breathing' }, { icon: '📿', label: 'Mantra timer' }].map((hint, i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px]"
                style={{ background: 'hsl(var(--surface2) / 0.65)', backdropFilter: 'blur(10px)', color: 'hsl(var(--muted))', border: '1px solid hsl(var(--border) / 0.45)' }}>
                {hint.icon} {hint.label} <span style={{ color: 'hsl(var(--accent))' }}>· coming soon</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── SOS Modal ── */}
      <AnimatePresence>
        {showSOS && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowSOS(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="max-w-md w-full rounded-2xl p-6"
              style={{ background: 'hsl(var(--surface) / 0.96)', backdropFilter: 'blur(20px)', border: '1px solid hsl(var(--border-strong) / 0.5)' }}
              onClick={e => e.stopPropagation()}>
              <h3 className="font-display text-lg font-bold mb-2 flex items-center gap-2" style={{ color: 'hsl(var(--text))' }}>
                <Shield size={20} style={{ color: 'hsl(var(--danger))' }} /> {"You're not alone"}
              </h3>
              <p className="text-sm mb-4" style={{ color: 'hsl(var(--muted))' }}>
                If you're in crisis, please reach out. These helplines are free and confidential.
              </p>
              <div className="space-y-2 mb-4">
                {helplines.map((h, i) => (
                  <a key={i} href={`tel:${h.number}`}
                    className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.02]"
                    style={{ background: 'hsl(var(--surface2))' }}>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'hsl(var(--text))' }}>{h.name}</p>
                      <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>{h.available}</p>
                    </div>
                    <span className="stat-number text-sm font-bold" style={{ color: 'hsl(var(--accent))' }}>{h.number}</span>
                  </a>
                ))}
              </div>
              <button onClick={() => setShowSOS(false)} className="btn-3d-ghost w-full text-sm py-2">Close</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MentalHealth;