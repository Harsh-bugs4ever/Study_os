// import { useState, useCallback, useRef } from 'react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { CheckCircle, Loader2, Sparkles, ArrowRight, BookOpen, AlertTriangle, Target, PenLine, MessageCircle, Mic, ClipboardCheck, Brain, Zap } from 'lucide-react';
// import { supabase } from '@/integrations/supabase/client';
// import { useApp } from '@/contexts/AppContext';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'sonner';

// interface LearningStep {
//   type: 'hook' | 'fillblank' | 'choice' | 'teachback' | 'summary';
//   instruction: string;
//   content: string;
//   options?: string[];
//   correctIndex?: number;
//   explanation?: string;
// }

// interface LearnHistory {
//   subject: string;
//   subtopic: string;
//   step: number;
//   completed: boolean;
//   timestamp: number;
// }

// const TIMEOUT_MS = 30000;

// const Learn = () => {
//   const { user, setUser } = useApp();
//   const navigate = useNavigate();

//   const [subject, setSubject] = useState('');
//   const [subtopic, setSubtopic] = useState('');
//   const [started, setStarted] = useState(false);
//   const [steps, setSteps] = useState<LearningStep[]>([]);
//   const [concepts, setConcepts] = useState<string[]>([]);
//   const [currentStep, setCurrentStep] = useState(0);
//   const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
//   const [answered, setAnswered] = useState(false);
//   const [teachbackText, setTeachbackText] = useState('');
//   const [showExplanation, setShowExplanation] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [teachbackEval, setTeachbackEval] = useState<{ feedback: string; passed: boolean } | null>(null);
//   const requestIdRef = useRef(0);

//   const [history, setHistory] = useState<LearnHistory[]>(() => {
//     try { return JSON.parse(localStorage.getItem('saathi-learn-history') || '[]'); } catch { return []; }
//   });

//   const getQuickPicks = () => {
//     const picks: { s: string; t: string }[] = [];
//     const subjectTopics: Record<string, string[]> = {
//       Physics: ["Newton's Laws of Motion", 'Thermodynamics', 'Electrostatics', 'Optics', 'Waves'],
//       Chemistry: ['Chemical Bonding', 'Organic Reactions', 'Periodic Table', 'Equilibrium', 'Electrochemistry'],
//       Mathematics: ['Quadratic Equations', 'Calculus - Limits', 'Probability', 'Trigonometry', 'Matrices'],
//       Biology: ['Cell Division (Mitosis)', 'Genetics & DNA', 'Ecology', 'Human Physiology', 'Plant Biology'],
//       'Computer Science': ['Binary Search Algorithm', 'Data Structures - Arrays', 'OOP Concepts', 'SQL Basics', 'Recursion'],
//       English: ['Grammar - Tenses', 'Poetry Analysis', 'Essay Writing', 'Comprehension', 'Vocabulary'],
//       History: ['Indian Freedom Movement', 'World War II', 'Mughal Empire', 'French Revolution', 'Ancient India'],
//       Economics: ['Supply and Demand', 'GDP & National Income', 'Money & Banking', 'Inflation', 'Indian Economy'],
//       Geography: ['Monsoons', 'Rivers of India', 'Map Reading', 'Climatology', 'Human Geography'],
//     };
//     const subs = user.subjects.length > 0 ? user.subjects : ['Physics', 'Chemistry', 'Mathematics'];
//     subs.forEach(sub => {
//       const topics = subjectTopics[sub] || subjectTopics['Physics'];
//       topics.slice(0, 2).forEach(t => picks.push({ s: sub, t }));
//     });
//     return picks.slice(0, 8);
//   };

//   const saveHistory = (sub: string, topic: string, step: number, completed: boolean) => {
//     const entry: LearnHistory = { subject: sub, subtopic: topic, step, completed, timestamp: Date.now() };
//     const updated = [...history.filter(h => !(h.subject === sub && h.subtopic === topic)), entry];
//     setHistory(updated);
//     localStorage.setItem('saathi-learn-history', JSON.stringify(updated));
//   };

//   const fetchWithTimeout = async (body: any, requestId: number): Promise<any> => {
//     const invokePromise = supabase.functions.invoke('generate-learning', { body }).then(({ data, error }) => {
//       if (error) throw new Error(error.message);
//       return data;
//     });

//     const timeoutPromise = new Promise((_, reject) => {
//       setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), TIMEOUT_MS);
//     });

//     const result = await Promise.race([invokePromise, timeoutPromise]);

//     if (requestId !== requestIdRef.current) {
//       throw new Error('STALE_REQUEST');
//     }

//     return result;
//   };

//   const fetchLearningContent = useCallback(async () => {
//     if (!subject.trim() || !subtopic.trim()) {
//       toast.error('Please enter both subject and topic');
//       return;
//     }
//     setLoading(true);
//     setError(null);
//     const requestId = ++requestIdRef.current;

//     try {
//       const [learnData, conceptsData] = await Promise.all([
//         fetchWithTimeout({ subject, subtopic, mode: 'learn' }, requestId),
//         fetchWithTimeout({ subject, subtopic, mode: 'concepts' }, requestId),
//       ]);

//       const learnResult = learnData?.result;
//       const conceptsResult = conceptsData?.result;

//       if (Array.isArray(learnResult) && learnResult.length > 0) {
//         // Validate each step has required fields
//         const validSteps = learnResult.map((s: any, i: number) => ({
//           type: s.type || ['hook', 'fillblank', 'choice', 'teachback', 'summary'][i] || 'choice',
//           instruction: s.instruction || 'Think about this...',
//           content: s.content || s.question || 'Question not available',
//           options: Array.isArray(s.options) ? s.options : undefined,
//           correctIndex: typeof s.correctIndex === 'number' ? s.correctIndex : 0,
//           explanation: s.explanation || (Array.isArray(s.options) && s.options.length > 0
//             ? `The key idea here is: ${s.options[typeof s.correctIndex === 'number' ? s.correctIndex : 0] || 'focus on the highlighted answer'}.`
//             : 'Nice progress — keep building your understanding.'),
//         }));
//         setSteps(validSteps);
//         setStarted(true);
//         saveHistory(subject, subtopic, 0, false);
//       } else {
//         setError('Could not generate learning content. Please try a different topic or try again.');
//       }
//       if (Array.isArray(conceptsResult)) setConcepts(conceptsResult);
//     } catch (err: any) {
//       if (err.message === 'STALE_REQUEST') {
//         return;
//       }

//       if (err.message === 'REQUEST_TIMEOUT') {
//         setError('Request timed out. The AI is taking too long — please try again.');
//       } else {
//         setError(err.message || 'Failed to generate content. Please try again.');
//       }
//     } finally {
//       if (requestId === requestIdRef.current) {
//         setLoading(false);
//       }
//     }
//   }, [subject, subtopic]);

//   const handleAnswer = (index: number) => {
//     if (answered) return;
//     setSelectedAnswer(index);
//     setAnswered(true);
//     setTimeout(() => setShowExplanation(true), 500);
//   };

//   const handleTeachbackSubmit = async () => {
//     if (!teachbackText.trim()) return;
//     setAnswered(true);
//     setLoading(true);
//     const requestId = ++requestIdRef.current;
//     try {
//       const data = await fetchWithTimeout({ subject, subtopic, mode: 'teachback-evaluate', studentExplanation: teachbackText }, requestId);
//       const result = data?.result;
//       if (result && typeof result === 'object') {
//         setTeachbackEval({ feedback: result.feedback || 'Good effort!', passed: result.passed ?? true });
//       } else {
//         setTeachbackEval({ feedback: 'Great thinking! Keep building on this understanding.', passed: true });
//       }
//     } catch (err: any) {
//       if (err.message === 'STALE_REQUEST') return;
//       setTeachbackEval({ feedback: 'Great thinking! Keep building on this understanding.', passed: true });
//     } finally {
//       if (requestId === requestIdRef.current) {
//         setLoading(false);
//         setShowExplanation(true);
//       }
//     }
//   };

//   const nextStep = () => {
//     if (currentStep < steps.length - 1) {
//       const next = currentStep + 1;
//       setCurrentStep(next);
//       setSelectedAnswer(null);
//       setAnswered(false);
//       setShowExplanation(false);
//       setTeachbackText('');
//       setTeachbackEval(null);
//       saveHistory(subject, subtopic, next, false);
//     }
//   };

//   const goToQuiz = () => {
//     saveHistory(subject, subtopic, steps.length - 1, true);
//     setUser(prev => ({ ...prev, currentSubject: subject, currentSubtopic: subtopic } as any));
//     navigate('/quiz', { state: { subject, subtopic } });
//   };

//   const resetLesson = () => {
//     requestIdRef.current += 1;
//     setStarted(false);
//     setCurrentStep(0);
//     setSteps([]);
//     setConcepts([]);
//     setSelectedAnswer(null);
//     setAnswered(false);
//     setShowExplanation(false);
//     setTeachbackText('');
//     setTeachbackEval(null);
//     setError(null);
//     setLoading(false);
//   };

//   const incompleteLessons = history.filter(h => !h.completed);

//   // Topic selection screen
//   if (!started) {
//     return (
//       <div className="max-w-lg mx-auto px-4 py-12">
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
//           <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'hsl(var(--text))' }}>What do you want to learn?</h2>
//           <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted))' }}>
//             Enter any subject and topic — Saathi AI will create an interactive lesson just for you.
//           </p>

//           {error && (
//             <div className="mb-4 p-3 rounded-xl flex items-start gap-2" style={{ background: 'hsl(var(--danger) / 0.1)', border: '1px solid hsl(var(--danger) / 0.3)' }}>
//               <AlertTriangle size={16} className="shrink-0 mt-0.5" style={{ color: 'hsl(var(--danger))' }} />
//               <div>
//                 <p className="text-sm" style={{ color: 'hsl(var(--danger))' }}>{error}</p>
//                 <button onClick={() => { setError(null); fetchLearningContent(); }} className="text-xs font-medium mt-1 underline" style={{ color: 'hsl(var(--accent))' }}>Try again</button>
//               </div>
//             </div>
//           )}

//           {incompleteLessons.length > 0 && (
//             <div className="mb-6">
//               <p className="text-xs font-medium mb-2 flex items-center gap-1" style={{ color: 'hsl(var(--accent))' }}>
//                 <BookOpen size={12} /> Continue where you left off
//               </p>
//               <div className="space-y-2">
//                 {incompleteLessons.slice(-3).map((h, i) => (
//                   <button key={i} onClick={() => { setSubject(h.subject); setSubtopic(h.subtopic); }}
//                     className="w-full text-left p-3 rounded-xl border transition-all hover:border-accent flex items-center justify-between"
//                     style={{ background: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text))' }}>
//                     <div>
//                       <span className="text-sm font-medium">{h.subject} · {h.subtopic}</span>
//                       <span className="text-xs block" style={{ color: 'hsl(var(--muted))' }}>Step {h.step + 1}/5</span>
//                     </div>
//                     <ArrowRight size={14} style={{ color: 'hsl(var(--accent))' }} />
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}

//           <div className="space-y-4 mb-6">
//             <div>
//               <label className="text-xs font-medium mb-1.5 block" style={{ color: 'hsl(var(--text-secondary))' }}>Subject</label>
//               <input type="text" value={subject} onChange={e => setSubject(e.target.value)}
//                 placeholder="e.g., Physics, Chemistry, History, Economics..."
//                 className="w-full px-4 py-3 rounded-xl border border-border text-sm outline-none transition-all focus:ring-2"
//                 style={{ background: 'hsl(var(--surface))', color: 'hsl(var(--text))' }} />
//             </div>
//             <div>
//               <label className="text-xs font-medium mb-1.5 block" style={{ color: 'hsl(var(--text-secondary))' }}>Topic / Subtopic</label>
//               <input type="text" value={subtopic} onChange={e => setSubtopic(e.target.value)}
//                 placeholder="e.g., Newton's Laws, Organic Chemistry, World War 2..."
//                 className="w-full px-4 py-3 rounded-xl border border-border text-sm outline-none transition-all focus:ring-2"
//                 style={{ background: 'hsl(var(--surface))', color: 'hsl(var(--text))' }} />
//             </div>
//           </div>

//           <div className="mb-6">
//             <p className="text-xs font-medium mb-2" style={{ color: 'hsl(var(--muted))' }}>
//               Based on your stream ({user.subjects.join(', ') || 'General'}):
//             </p>
//             <div className="flex flex-wrap gap-2">
//               {getQuickPicks().map((q, i) => (
//                 <button key={i} onClick={() => { setSubject(q.s); setSubtopic(q.t); }}
//                   className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all hover:border-accent"
//                   style={{
//                     background: subject === q.s && subtopic === q.t ? 'hsl(var(--accent-soft))' : 'hsl(var(--surface2))',
//                     borderColor: subject === q.s && subtopic === q.t ? 'hsl(var(--accent))' : 'hsl(var(--border))',
//                     color: 'hsl(var(--text))',
//                   }}>
//                   {q.s} · {q.t}
//                 </button>
//               ))}
//             </div>
//           </div>

//           <button onClick={fetchLearningContent} disabled={!subject.trim() || !subtopic.trim() || loading}
//             className="btn-3d w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40">
//             {loading ? <><Loader2 size={16} className="animate-spin" /> Saathi is preparing your lesson...</> : <><Sparkles size={16} /> Generate interactive lesson</>}
//           </button>
//         </motion.div>
//       </div>
//     );
//   }

//   // Learning flow
//   const step = steps[currentStep];
//   if (!step) {
//     return (
//       <div className="max-w-lg mx-auto px-4 py-12 text-center">
//         <AlertTriangle size={32} className="mx-auto mb-3" style={{ color: 'hsl(var(--warning))' }} />
//         <p className="text-sm mb-4" style={{ color: 'hsl(var(--text))' }}>Something went wrong loading this step.</p>
//         <button onClick={resetLesson} className="btn-3d text-sm px-6 py-2.5">← Back to topic selection</button>
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-4xl mx-auto px-4 lg:px-8 py-6">
//       <div className="flex items-center gap-2 mb-6 text-sm flex-wrap">
//         <button onClick={resetLesson}
//           className="text-xs font-medium px-3 py-1 rounded-lg border border-border" style={{ color: 'hsl(var(--muted))' }}>← Change topic</button>
//         <span className="px-3 py-1 rounded-lg text-xs font-medium" style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))' }}>{subject}</span>
//         <ArrowRight size={12} style={{ color: 'hsl(var(--muted))' }} />
//         <span className="text-xs font-medium" style={{ color: 'hsl(var(--text))' }}>{subtopic}</span>
//       </div>

//       <div className="flex flex-col lg:flex-row gap-6">
//         <div className="flex-1">
//           <div className="flex gap-1.5 mb-6">
//             {steps.map((_, i) => (
//               <div key={i} className="flex-1 h-1.5 rounded-full transition-all" style={{
//                 background: i < currentStep ? 'hsl(var(--accent))' : i === currentStep ? 'hsl(var(--accent) / 0.5)' : 'hsl(var(--surface2))',
//               }} />
//             ))}
//           </div>

//           <AnimatePresence mode="wait">
//             <motion.div key={currentStep} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="card-base">
//               <div className="flex items-center gap-2 mb-3">
//                 <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'hsl(var(--surface2))', color: 'hsl(var(--muted))' }}>
//                   <span className="inline-flex items-center gap-1">{step.type === 'hook' ? <><Target size={10} /> Hook</> : step.type === 'fillblank' ? <><PenLine size={10} /> Fill in</> : step.type === 'choice' ? <><MessageCircle size={10} /> Think deeper</> : step.type === 'teachback' ? <><Mic size={10} /> Teach back</> : <><ClipboardCheck size={10} /> Summary</>}</span>
//                 </span>
//                 <span className="text-xs" style={{ color: 'hsl(var(--muted))' }}>Step {currentStep + 1}/{steps.length}</span>
//               </div>

//               <p className="font-display italic text-sm mb-2" style={{ color: 'hsl(var(--muted))' }}>{step.instruction}</p>
//               <h3 className="font-display text-xl font-semibold mb-6" style={{ color: 'hsl(var(--text))' }}>{step.content}</h3>

//               {step.options && step.type !== 'summary' && step.type !== 'teachback' && (
//                 <div className="space-y-3">
//                   {step.options.map((opt, i) => {
//                     const isCorrect = answered && i === step.correctIndex;
//                     const isWrong = answered && i === selectedAnswer && i !== step.correctIndex;
//                     return (
//                       <button key={i} onClick={() => handleAnswer(i)} disabled={answered}
//                         className="answer-tile w-full text-left text-sm font-medium flex items-center gap-3"
//                         style={{
//                           borderColor: isCorrect ? 'hsl(var(--success))' : isWrong ? 'hsl(var(--danger))' : undefined,
//                           background: isCorrect ? 'hsl(var(--success) / 0.1)' : isWrong ? 'hsl(var(--danger) / 0.1)' : undefined,
//                           color: 'hsl(var(--text))',
//                         }}>
//                         <span className="w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono"
//                           style={{ borderColor: isCorrect ? 'hsl(var(--success))' : isWrong ? 'hsl(var(--danger))' : 'hsl(var(--border))' }}>
//                           {String.fromCharCode(65 + i)}
//                         </span>
//                         {opt}
//                       </button>
//                     );
//                   })}
//                 </div>
//               )}

//               {step.type === 'teachback' && !answered && (
//                 <div className="space-y-3">
//                   <textarea value={teachbackText} onChange={e => setTeachbackText(e.target.value)}
//                     placeholder="Explain this concept in your own words..." rows={4}
//                     className="w-full px-4 py-3 rounded-xl border border-border text-sm resize-none outline-none"
//                     style={{ background: 'hsl(var(--surface2))', color: 'hsl(var(--text))' }} />
//                   <button onClick={handleTeachbackSubmit} disabled={loading || !teachbackText.trim()}
//                     className="btn-3d text-sm px-6 py-2.5 flex items-center gap-2 disabled:opacity-40">
//                     {loading ? <><Loader2 size={14} className="animate-spin" /> Evaluating...</> : 'Submit explanation'}
//                   </button>
//                 </div>
//               )}

//               {step.type === 'summary' && (
//                 <div className="space-y-3 mt-4">
//                   {step.explanation && (
//                     <div className="p-4 rounded-xl mb-3" style={{ background: 'hsl(var(--accent-soft))' }}>
//                       <p className="text-xs font-medium mb-1 flex items-center gap-1" style={{ color: 'hsl(var(--accent))' }}><ClipboardCheck size={12} /> Concept Summary</p>
//                       <p className="font-display text-sm" style={{ color: 'hsl(var(--text))' }}>{step.explanation}</p>
//                     </div>
//                   )}
//                   <div className="flex items-center gap-2 text-sm" style={{ color: 'hsl(var(--success))' }}>
//                     <CheckCircle size={16} />
//                     <span>Concept learned! Memory scheduled for spaced review.</span>
//                   </div>
//                   <div className="flex flex-col sm:flex-row gap-3">
//                     <button onClick={goToQuiz} className="btn-3d text-sm px-6 py-2.5">Take adaptive quiz →</button>
//                     <button onClick={resetLesson} className="btn-3d-ghost text-sm px-4 py-2.5">Learn another topic</button>
//                   </div>
//                 </div>
//               )}

//               {showExplanation && (step.options || step.type === 'teachback') && step.type !== 'summary' && (
//                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-4 rounded-xl" style={{ background: 'hsl(var(--accent-soft))' }}>
//                   {teachbackEval ? (
//                     <>
//                       <div className="flex items-center gap-2 mb-2">
//                         <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{
//                           background: teachbackEval.passed ? 'hsl(var(--success) / 0.15)' : 'hsl(var(--warning) / 0.15)',
//                           color: teachbackEval.passed ? 'hsl(var(--success))' : 'hsl(var(--warning))',
//                         }}>{teachbackEval.passed ? '✓ Understanding confirmed' : '◈ Keep building'}</span>
//                       </div>
//                       <p className="font-display text-sm" style={{ color: 'hsl(var(--text))' }}>{teachbackEval.feedback}</p>
//                     </>
//                   ) : (
//                     <p className="font-display text-sm" style={{ color: 'hsl(var(--text))' }}>{step.explanation || 'Nice try — review the idea and keep going.'}</p>
//                   )}
//                   <button onClick={nextStep} className="btn-3d text-sm mt-3 px-6 py-2">Continue →</button>
//                 </motion.div>
//               )}

//               {/* Auto-advance for steps without options (non-teachback, non-summary) that need manual next */}
//               {!step.options && step.type !== 'teachback' && step.type !== 'summary' && (
//                 <div className="mt-4">
//                   {step.explanation && (
//                     <div className="p-4 rounded-xl mb-3" style={{ background: 'hsl(var(--accent-soft))' }}>
//                       <p className="font-display text-sm" style={{ color: 'hsl(var(--text))' }}>{step.explanation}</p>
//                     </div>
//                   )}
//                   <button onClick={nextStep} className="btn-3d text-sm px-6 py-2">Continue →</button>
//                 </div>
//               )}
//             </motion.div>
//           </AnimatePresence>
//         </div>

//         {/* Concept Map sidebar */}
//         <div className="hidden lg:block w-64">
//           <div className="card-base">
//             <h4 className="font-display text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'hsl(var(--text))' }}><Brain size={14} style={{ color: 'hsl(var(--accent))' }} /> Concept Map</h4>
//             {concepts.length > 0 ? concepts.map((c, i) => (
//               <div key={i} className="flex items-center gap-2 py-2 text-sm">
//                 <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{
//                   background: i < currentStep ? 'hsl(var(--accent))' : 'hsl(var(--surface2))',
//                   color: i < currentStep ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted))',
//                 }}>{i < currentStep ? '✓' : i + 1}</div>
//                 <span style={{ color: i <= currentStep ? 'hsl(var(--text))' : 'hsl(var(--muted))' }}>{c}</span>
//               </div>
//             )) : (
//               <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>Concepts will appear here...</p>
//             )}
//           </div>

//           <div className="card-base mt-4 text-center">
//             <Zap size={24} style={{ color: 'hsl(var(--accent))' }} />
//             <p className="stat-number text-lg font-bold mt-1" style={{ color: 'hsl(var(--accent))' }}>{user.xp} XP</p>
//             <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>Keep learning to level up</p>
//           </div>
//         </div>
//       </div>

//       <div className="lg:hidden mt-4">
//         <div className="card-base">
//           <h4 className="font-display text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'hsl(var(--text))' }}><Brain size={14} style={{ color: 'hsl(var(--accent))' }} /> Concept Map</h4>
//           {concepts.length > 0 ? concepts.map((c, i) => (
//             <div key={i} className="flex items-center gap-2 py-2 text-sm">
//               <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]" style={{
//                 background: i < currentStep ? 'hsl(var(--accent))' : 'hsl(var(--surface2))',
//                 color: i < currentStep ? 'hsl(var(--primary-foreground))' : 'hsl(var(--muted))',
//               }}>{i < currentStep ? '✓' : i + 1}</div>
//               <span style={{ color: i <= currentStep ? 'hsl(var(--text))' : 'hsl(var(--muted))' }}>{c}</span>
//             </div>
//           )) : (
//             <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>Concepts will appear here...</p>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Learn;


import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Loader2, Sparkles, ArrowRight,
  AlertTriangle, Target, PenLine, MessageCircle, Mic,
  ClipboardCheck, Brain, ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useApp } from '@/contexts/AppContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface LearningStep {
  type: 'hook' | 'fillblank' | 'choice' | 'teachback' | 'summary';
  instruction: string;
  content: string;
  options?: string[];
  correctIndex?: number;
  explanation?: string;
}

interface LearnHistory {
  subject: string;
  subtopic: string;
  step: number;
  completed: boolean;
  timestamp: number;
}

interface Particle3D {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  size: number; opacity: number; hue: number;
}

/* ─────────────────────────────────────────────
   SUBJECT DATA
───────────────────────────────────────────── */
const SUBJECTS = [
  { name:'Physics',         emoji:'⚛️',  color:'#4B9FE1', topics:["Newton's Laws",'Thermodynamics','Electrostatics','Optics','Waves'],               orbit:180, speed:0.0008,  angle:0   },
  { name:'Chemistry',       emoji:'🧪',  color:'#5ECFA0', topics:['Chemical Bonding','Organic Reactions','Periodic Table','Equilibrium'],              orbit:240, speed:0.00055, angle:40  },
  { name:'Mathematics',     emoji:'📐',  color:'#F4C94D', topics:['Quadratic Equations','Calculus','Probability','Trigonometry','Matrices'],            orbit:300, speed:0.00045, angle:80  },
  { name:'Biology',         emoji:'🌿',  color:'#E87A9B', topics:['Cell Division','Genetics & DNA','Ecology','Human Physiology'],                      orbit:160, speed:0.001,   angle:120 },
  { name:'Computer Science',emoji:'💻',  color:'#9B72CF', topics:['Binary Search','Data Structures','OOP Concepts','SQL Basics','Recursion'],           orbit:260, speed:0.0007,  angle:160 },
  { name:'English',         emoji:'📖',  color:'#5BC4D5', topics:['Grammar','Poetry Analysis','Essay Writing','Comprehension'],                        orbit:320, speed:0.00038, angle:200 },
  { name:'History',         emoji:'🏛️',  color:'#D4956A', topics:['Indian Freedom','World War II','Mughal Empire','French Revolution'],                orbit:200, speed:0.0009,  angle:240 },
  { name:'Economics',       emoji:'📊',  color:'#4DBEBC', topics:['Supply & Demand','GDP','Money & Banking','Inflation'],                              orbit:275, speed:0.00062, angle:280 },
  { name:'Geography',       emoji:'🌍',  color:'#7AC86B', topics:['Monsoons','Rivers of India','Map Reading','Climatology'],                           orbit:345, speed:0.00042, angle:320 },
];

const TIMEOUT_MS = 30000;

/* ─────────────────────────────────────────────
   COSMIC CANVAS
───────────────────────────────────────────── */
const CosmicCanvas = () => {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const mouseRef   = useRef({ x: 0.5, y: 0.5 });
  const ripplesRef = useRef<{ x:number;y:number;r:number;a:number }[]>([]);
  const pRef       = useRef<Particle3D[]>([]);
  const rafRef     = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const N = window.innerWidth < 768 ? 55 : 110;
    pRef.current = Array.from({ length: N }, () => ({
      x: (Math.random()-0.5)*1800, y: (Math.random()-0.5)*1800,
      z: Math.random()*700+100,
      vx: (Math.random()-0.5)*0.22, vy: (Math.random()-0.5)*0.22, vz: (Math.random()-0.5)*0.12,
      size: Math.random()*1.4+0.4, opacity: Math.random()*0.55+0.2,
      hue: Math.random()*60+200,
    }));

    const project = (p: Particle3D) => {
      const fov = 600;
      const mx = (mouseRef.current.x-0.5)*50;
      const my = (mouseRef.current.y-0.5)*35;
      const sc = fov / (fov + p.z);
      return {
        sx: canvas.width/2  + (p.x+mx)*sc,
        sy: canvas.height/2 + (p.y+my)*sc,
        scale: sc,
      };
    };

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background gradient
      const bg = ctx.createRadialGradient(canvas.width*.5, canvas.height*.4, 0, canvas.width*.5, canvas.height*.4, canvas.width*.9);
      bg.addColorStop(0,   '#08081c');
      bg.addColorStop(0.6, '#040616');
      bg.addColorStop(1,   '#02030e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const arr = pRef.current;

      // Move
      arr.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.z += p.vz;
        if (Math.abs(p.x)>900) p.vx*=-1;
        if (Math.abs(p.y)>900) p.vy*=-1;
        if (p.z>850||p.z<50)   p.vz*=-1;
      });

      // Connections
      for (let i=0;i<arr.length;i++) {
        const a=arr[i], { sx:ax, sy:ay, scale:as }=project(a);
        for (let j=i+1;j<arr.length;j++) {
          const b=arr[j], { sx:bx, sy:by }=project(b);
          const d=Math.hypot(ax-bx,ay-by);
          if (d<110) {
            ctx.beginPath();
            ctx.moveTo(ax,ay); ctx.lineTo(bx,by);
            ctx.strokeStyle=`hsla(${a.hue},65%,65%,${(1-d/110)*0.16*as})`;
            ctx.lineWidth=as*0.5;
            ctx.stroke();
          }
        }
      }

      // Dots
      arr.forEach(p => {
        const { sx, sy, scale }=project(p);
        if (sx<-20||sx>canvas.width+20||sy<-20||sy>canvas.height+20) return;
        const r=p.size*scale*2.2;
        const g=ctx.createRadialGradient(sx,sy,0,sx,sy,r*3);
        g.addColorStop(0,   `hsla(${p.hue},80%,80%,${p.opacity*scale})`);
        g.addColorStop(0.4, `hsla(${p.hue},70%,65%,${p.opacity*scale*0.4})`);
        g.addColorStop(1,   `hsla(${p.hue},55%,50%,0)`);
        ctx.beginPath(); ctx.arc(sx,sy,r*3,0,Math.PI*2);
        ctx.fillStyle=g; ctx.fill();
      });

      // Ripples
      ripplesRef.current = ripplesRef.current.filter(r=>r.a>0.01);
      ripplesRef.current.forEach(rp => {
        rp.r+=5; rp.a*=0.94;
        for (let ring=0;ring<3;ring++) {
          const rr=rp.r-ring*16; if (rr<0) continue;
          ctx.beginPath(); ctx.arc(rp.x,rp.y,rr,0,Math.PI*2);
          ctx.strokeStyle=`rgba(180,140,255,${rp.a*(1-ring*0.3)})`;
          ctx.lineWidth=1.4-ring*0.4; ctx.stroke();
        }
      });
    };
    draw();

    const onMove  = (e: MouseEvent) => { mouseRef.current={x:e.clientX/window.innerWidth,y:e.clientY/window.innerHeight}; };
    const onClick = (e: MouseEvent) => { ripplesRef.current.push({x:e.clientX,y:e.clientY,r:0,a:0.7}); };
    const onTouch = (e: TouchEvent) => { const t=e.touches[0]; ripplesRef.current.push({x:t.clientX,y:t.clientY,r:0,a:0.6}); };

    window.addEventListener('mousemove', onMove);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchstart', onTouch);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('touchstart', onTouch);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0 }} />;
};

/* ─────────────────────────────────────────────
   SOLAR SYSTEM
───────────────────────────────────────────── */
const SolarSystem = ({
  selectedSubject, onSelectSubject, onSelectTopic, userSubjects,
}: {
  selectedSubject:string;
  onSelectSubject:(s:string)=>void;
  onSelectTopic:(s:string,t:string)=>void;
  userSubjects:string[];
}) => {
  const [tick, setTick] = useState(0);
  const [hovered, setHovered] = useState<string|null>(null);
  const rafRef = useRef(0);
  const tickRef = useRef(0);

  useEffect(()=>{
    const loop=()=>{ tickRef.current+=1; setTick(t=>t+1); rafRef.current=requestAnimationFrame(loop); };
    rafRef.current=requestAnimationFrame(loop);
    return ()=>cancelAnimationFrame(rafRef.current);
  },[]);

  const sorted=[...SUBJECTS].sort((a,b)=>{
    const ai=userSubjects.includes(a.name)?-1:1;
    const bi=userSubjects.includes(b.name)?-1:1;
    return ai-bi;
  });

  return (
    <div style={{
      position:'fixed', top:'180px', left:0, right:0, bottom:0, zIndex:1,
      display:'flex', alignItems:'flex-start', justifyContent:'center',
      perspective:'900px', perspectiveOrigin:'50% 44%',
      pointerEvents:'none',
    }}>
      <div style={{ position:'relative', width:1, height:1, transformStyle:'preserve-3d', pointerEvents:'none' }}>

        {/* Knowledge Core */}
        <div style={{
          position:'absolute', width:80, height:80, borderRadius:'50%',
          transform:'translate(-50%,-50%)',
          background:'radial-gradient(circle at 35% 30%, #fffbe0, #f4c94d 38%, #d4860a 70%, #7a3a00)',
          boxShadow:'0 0 30px rgba(244,201,77,.9), 0 0 70px rgba(244,201,77,.5), 0 0 120px rgba(244,201,77,.25)',
          zIndex:10, pointerEvents:'auto',
          animation:'corePulse 3s ease-in-out infinite',
        }}>
          <div style={{ position:'absolute', inset:'14%', borderRadius:'50%', background:'radial-gradient(circle at 30% 28%, rgba(255,255,220,.8), transparent 65%)' }}/>
          <div style={{ position:'absolute', inset:'-4px', borderRadius:'50%', border:'1.5px solid rgba(244,201,77,.35)', animation:'coreRing 5s linear infinite' }}/>
        </div>

        {sorted.map(subj=>{
          const t   = tickRef.current*subj.speed;
          const ang = (subj.angle*Math.PI/180)+t;
          const ox  = Math.cos(ang)*subj.orbit;
          const oy  = Math.sin(ang)*subj.orbit*0.4;
          const oz  = Math.sin(ang)*subj.orbit*0.15;

          const isSel = selectedSubject===subj.name;
          const isHov = hovered===subj.name;
          const scale = isSel?1.35:isHov?1.15:1;
          const glow  = isSel
            ? `0 0 22px ${subj.color}, 0 0 44px ${subj.color}88`
            : isHov ? `0 0 14px ${subj.color}cc` : `0 0 6px ${subj.color}44`;

          return (
            <div key={subj.name}>
              {/* Orbit ring */}
              <div style={{
                position:'absolute',
                width:subj.orbit*2, height:subj.orbit*0.8,
                borderRadius:'50%',
                border:`1px solid ${userSubjects.includes(subj.name)?subj.color+'20':'rgba(100,100,180,.07)'}`,
                transform:`translate(-${subj.orbit}px,-${subj.orbit*0.4}px)`,
                pointerEvents:'none',
              }}/>

              {/* Planet node */}
              <div
                style={{
                  position:'absolute',
                  transform:`translate(${ox-22}px,${oy-22}px) translateZ(${oz}px) scale(${scale})`,
                  width:44, height:44, borderRadius:'50%',
                  background:`radial-gradient(circle at 33% 28%, ${subj.color}ff, ${subj.color}88 55%, ${subj.color}44)`,
                  border:`2px solid ${subj.color}${isSel?'ff':'77'}`,
                  boxShadow:glow,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:18, cursor:'pointer', pointerEvents:'auto',
                  transition:'transform .15s, box-shadow .15s',
                  zIndex:oz>0?6:3, userSelect:'none',
                }}
                onClick={e=>{ e.stopPropagation(); onSelectSubject(subj.name); }}
                onMouseEnter={()=>setHovered(subj.name)}
                onMouseLeave={()=>setHovered(null)}
                title={subj.name}
              >
                {subj.emoji}
              </div>

              {/* Label */}
              <div style={{
                position:'absolute',
                transform:`translate(${ox-40}px,${oy+28}px) translateZ(${oz}px)`,
                width:80, textAlign:'center',
                fontSize:9, fontWeight:700,
                fontFamily:"'DM Mono',monospace",
                letterSpacing:'.08em', textTransform:'uppercase',
                color:isSel?subj.color:isHov?subj.color+'bb':'rgba(180,180,220,.45)',
                textShadow:isSel?`0 0 10px ${subj.color}`:'none',
                transition:'color .2s', pointerEvents:'none',
              }}>
                {subj.name.split(' ')[0]}
              </div>

              {/* Subtopic pills */}
              {(isSel||isHov) && subj.topics.slice(0,4).map((topic,ti)=>{
                const ta=(ti/4)*Math.PI*2-Math.PI/2;
                const tr=72+(ti%2)*18;
                const tx=ox+Math.cos(ta)*tr;
                const ty=oy+Math.sin(ta)*tr*0.55;
                return (
                  <div
                    key={topic}
                    style={{
                      position:'absolute',
                      transform:`translate(${tx-36}px,${ty-10}px)`,
                      padding:'3px 9px', borderRadius:20,
                      background:`${subj.color}20`, border:`1px solid ${subj.color}55`,
                      color:subj.color, fontSize:8.5, fontWeight:600,
                      fontFamily:"'Plus Jakarta Sans',sans-serif",
                      whiteSpace:'nowrap', cursor:'pointer', pointerEvents:'auto',
                      animation:`fadeInScale .25s ease ${ti*.05}s both`,
                      backdropFilter:'blur(6px)', zIndex:8,
                      transition:'all .15s',
                    }}
                    onClick={e=>{ e.stopPropagation(); onSelectTopic(subj.name,topic); }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background=`${subj.color}40`; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background=`${subj.color}20`; }}
                  >
                    {topic}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   GLASS PORTAL — bottom overlay
───────────────────────────────────────────── */
const GlassPortal = ({
  subject, setSubject, subtopic, setSubtopic,
  onStart, loading, error, history, user,
}: {
  subject:string; setSubject:(s:string)=>void;
  subtopic:string; setSubtopic:(s:string)=>void;
  onStart:()=>void; loading:boolean; error:string|null;
  history:LearnHistory[]; user:any;
}) => {
  const [focus, setFocus] = useState<'subj'|'topic'|null>(null);
  const incomplete = history.filter(h=>!h.completed).slice(-3);

  return (
    <motion.div
      initial={{ opacity:0, y:50 }}
      animate={{ opacity:1, y:0 }}
      transition={{ duration:.8, ease:[.16,1,.3,1] }}
      style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:20,
        padding:'0 16px 28px',
        display:'flex', flexDirection:'column', alignItems:'center', gap:10,
        pointerEvents:'none',
      }}
    >
      {/* Header text */}
      <motion.div
        initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:.25 }}
        style={{ textAlign:'center', pointerEvents:'none', marginBottom:2 }}
      >
        <div style={{
          fontSize:10, fontFamily:"'DM Mono',monospace", letterSpacing:'.24em',
          textTransform:'uppercase', color:'rgba(180,130,255,.65)', marginBottom:5,
        }}>
          ✦ Study OS Knowledge Universe ✦
        </div>
        <h1 style={{
          fontFamily:"'Fraunces',serif",
          fontSize:'clamp(20px,3.8vw,36px)', fontWeight:700, lineHeight:1.1,
          background:'linear-gradient(130deg, #f4c94d 0%, #d6a0ff 55%, #5bc4d5 100%)',
          WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text',
        }}>
          Enter the Living World of Knowledge
        </h1>
      </motion.div>

      {/* Resume cards */}
      {incomplete.length>0 && (
        <div style={{
          display:'flex', gap:8, overflowX:'auto', width:'100%', maxWidth:640,
          paddingBottom:2, pointerEvents:'auto',
        }}>
          {incomplete.map((h,i)=>(
            <motion.button key={i}
              initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }}
              transition={{ delay:.4+i*.05 }}
              onClick={()=>{ setSubject(h.subject); setSubtopic(h.subtopic); }}
              style={{
                flexShrink:0, padding:'6px 13px', borderRadius:12,
                background:'rgba(180,120,255,.1)', border:'1px solid rgba(180,120,255,.28)',
                color:'rgba(220,175,255,.85)', fontSize:11,
                fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:600,
                cursor:'pointer', display:'flex', alignItems:'center', gap:6,
                backdropFilter:'blur(10px)', whiteSpace:'nowrap',
              }}
            >
              <span style={{ fontSize:9, opacity:.6 }}>↺</span>
              {h.subject} · {h.subtopic}
              <span style={{ fontSize:9, opacity:.4 }}>Step {h.step+1}/5</span>
            </motion.button>
          ))}
        </div>
      )}

      {/* Main search glass card */}
      <motion.div
        initial={{ opacity:0, scale:.95 }} animate={{ opacity:1, scale:1 }}
        transition={{ delay:.45, duration:.6, ease:[.16,1,.3,1] }}
        style={{
          width:'100%', maxWidth:640,
          background:'rgba(6,6,24,.78)',
          backdropFilter:'blur(28px) saturate(1.5)',
          border:'1px solid rgba(180,140,255,.22)',
          borderRadius:22, padding:'16px 18px',
          boxShadow:'0 0 0 1px rgba(180,140,255,.07), 0 28px 70px rgba(0,0,0,.65), inset 0 1px 0 rgba(255,255,255,.05)',
          pointerEvents:'auto',
        }}
      >
        {error && (
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }}
            style={{
              marginBottom:12, padding:'9px 13px', borderRadius:10,
              background:'rgba(220,70,50,.1)', border:'1px solid rgba(220,70,50,.28)',
              display:'flex', gap:8, alignItems:'flex-start',
            }}
          >
            <AlertTriangle size={13} style={{ color:'#ff7066', flexShrink:0, marginTop:1 }}/>
            <p style={{ color:'#ff9988', fontSize:12, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>{error}</p>
          </motion.div>
        )}

        <div style={{ display:'flex', gap:9, alignItems:'center' }}>
          {/* Subject */}
          <div style={{ flex:1, position:'relative' }}>
            <input
              type="text" value={subject} onChange={e=>setSubject(e.target.value)}
              onFocus={()=>setFocus('subj')} onBlur={()=>setFocus(null)}
              placeholder="Subject…"
              style={{
                width:'100%', padding:'11px 13px',
                borderRadius:13,
                background:focus==='subj'?'rgba(167,139,250,.11)':'rgba(255,255,255,.03)',
                border:`1px solid ${focus==='subj'?'rgba(167,139,250,.45)':'rgba(255,255,255,.07)'}`,
                color:'rgba(230,220,255,.95)', fontSize:13,
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                outline:'none', transition:'all .18s',
              }}
            />
          </div>

          <ChevronRight size={13} style={{ color:'rgba(150,120,200,.35)', flexShrink:0 }}/>

          {/* Topic */}
          <div style={{ flex:1.5, position:'relative' }}>
            <input
              type="text" value={subtopic} onChange={e=>setSubtopic(e.target.value)}
              onFocus={()=>setFocus('topic')} onBlur={()=>setFocus(null)}
              onKeyDown={e=>{ if(e.key==='Enter'&&subject&&subtopic) onStart(); }}
              placeholder="Topic or concept…"
              style={{
                width:'100%', padding:'11px 13px', borderRadius:13,
                background:focus==='topic'?'rgba(91,196,213,.09)':'rgba(255,255,255,.03)',
                border:`1px solid ${focus==='topic'?'rgba(91,196,213,.4)':'rgba(255,255,255,.07)'}`,
                color:'rgba(230,220,255,.95)', fontSize:13,
                fontFamily:"'Plus Jakarta Sans',sans-serif",
                outline:'none', transition:'all .18s',
              }}
            />
          </div>

          {/* Begin */}
          <button
            onClick={onStart}
            disabled={!subject.trim()||!subtopic.trim()||loading}
            style={{
              flexShrink:0, padding:'11px 17px', borderRadius:13,
              background:subject&&subtopic&&!loading
                ? 'linear-gradient(135deg,#a78bfa,#7c3aed)'
                : 'rgba(100,80,160,.28)',
              border:'1px solid rgba(167,139,250,.35)',
              color:'white', fontSize:13,
              fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700,
              cursor:!subject||!subtopic||loading?'not-allowed':'pointer',
              display:'flex', alignItems:'center', gap:6,
              boxShadow:subject&&subtopic?'0 0 18px rgba(167,139,250,.32)':'none',
              opacity:!subject||!subtopic?.trim()?0.48:1,
              transition:'all .2s',
            }}
          >
            {loading?<Loader2 size={14} className="animate-spin"/>:<Sparkles size={14}/>}
            {loading?'Preparing…':'Begin'}
          </button>
        </div>

        {/* Hint */}
        <div style={{
          marginTop:9,
          display:'flex', alignItems:'center', gap:5,
          color:'rgba(155,114,207,.55)', fontSize:11,
          fontFamily:"'DM Mono',monospace",
        }}>
          <span style={{ fontSize:13 }}>✨</span>
          Saathi suggests: click any orbiting node to select a subject
          {user.subjects?.length>0&&(
            <span style={{ marginLeft:'auto', color:'rgba(91,196,213,.38)', fontSize:10 }}>
              Your stream: {user.subjects.slice(0,2).join(', ')}
            </span>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

/* ─────────────────────────────────────────────
   MAIN LEARN COMPONENT
───────────────────────────────────────────── */
const Learn = () => {
  const { user, setUser } = useApp();
  const navigate = useNavigate();

  const [subject,        setSubject]       = useState('');
  const [subtopic,       setSubtopic]      = useState('');
  const [started,        setStarted]       = useState(false);
  const [steps,          setSteps]         = useState<LearningStep[]>([]);
  const [concepts,       setConcepts]      = useState<string[]>([]);
  const [currentStep,    setCurrentStep]   = useState(0);
  const [selectedAnswer, setSelectedAnswer]= useState<number|null>(null);
  const [answered,       setAnswered]      = useState(false);
  const [teachbackText,  setTeachbackText] = useState('');
  const [showExpl,       setShowExpl]      = useState(false);
  const [loading,        setLoading]       = useState(false);
  const [error,          setError]         = useState<string|null>(null);
  const [teachbackEval,  setTeachbackEval] = useState<{feedback:string;passed:boolean}|null>(null);
  const reqIdRef = useRef(0);

  const [history, setHistory] = useState<LearnHistory[]>(()=>{
    try { return JSON.parse(localStorage.getItem('saathi-learn-history')||'[]'); } catch { return []; }
  });

  const saveHistory=(sub:string,topic:string,step:number,completed:boolean)=>{
    const entry:LearnHistory={subject:sub,subtopic:topic,step,completed,timestamp:Date.now()};
    const updated=[...history.filter(h=>!(h.subject===sub&&h.subtopic===topic)),entry];
    setHistory(updated);
    localStorage.setItem('saathi-learn-history',JSON.stringify(updated));
  };

  const fetchWithTimeout=async(body:any,rid:number):Promise<any>=>{
    const inv=supabase.functions.invoke('generate-learning',{body}).then(({data,error})=>{ if(error)throw new Error(error.message); return data; });
    const to=new Promise((_,rej)=>setTimeout(()=>rej(new Error('REQUEST_TIMEOUT')),TIMEOUT_MS));
    const result=await Promise.race([inv,to]);
    if(rid!==reqIdRef.current) throw new Error('STALE_REQUEST');
    return result;
  };

  const fetchLearningContent=useCallback(async()=>{
    if(!subject.trim()||!subtopic.trim()){ toast.error('Please enter both subject and topic'); return; }
    setLoading(true); setError(null);
    const rid=++reqIdRef.current;
    try {
      const [ld,cd]=await Promise.all([
        fetchWithTimeout({subject,subtopic,mode:'learn'},rid),
        fetchWithTimeout({subject,subtopic,mode:'concepts'},rid),
      ]);
      const lr=ld?.result, cr=cd?.result;
      if(Array.isArray(lr)&&lr.length>0){
        const valid=lr.map((s:any,i:number)=>({
          type:s.type||['hook','fillblank','choice','teachback','summary'][i]||'choice',
          instruction:s.instruction||'Think about this…',
          content:s.content||s.question||'Question not available',
          options:Array.isArray(s.options)?s.options:undefined,
          correctIndex:typeof s.correctIndex==='number'?s.correctIndex:0,
          explanation:s.explanation||(Array.isArray(s.options)&&s.options.length>0
            ?`Key idea: ${s.options[typeof s.correctIndex==='number'?s.correctIndex:0]||'…'}.`
            :'Keep building your understanding.'),
        }));
        setSteps(valid); setStarted(true); saveHistory(subject,subtopic,0,false);
      } else { setError('Could not generate content. Please try a different topic.'); }
      if(Array.isArray(cr)) setConcepts(cr);
    } catch(err:any){
      if(err.message==='STALE_REQUEST') return;
      if(err.message==='REQUEST_TIMEOUT') setError('Request timed out — please try again.');
      else setError(err.message||'Failed to generate content.');
    } finally { if(rid===reqIdRef.current) setLoading(false); }
  },[subject,subtopic]);

  const handleAnswer=(idx:number)=>{
    if(answered) return;
    setSelectedAnswer(idx); setAnswered(true);
    setTimeout(()=>setShowExpl(true),500);
  };

  const handleTeachbackSubmit=async()=>{
    if(!teachbackText.trim()) return;
    setAnswered(true); setLoading(true);
    const rid=++reqIdRef.current;
    try {
      const data=await fetchWithTimeout({subject,subtopic,mode:'teachback-evaluate',studentExplanation:teachbackText},rid);
      const r=data?.result;
      if(r&&typeof r==='object') setTeachbackEval({feedback:r.feedback||'Good effort!',passed:r.passed??true});
      else setTeachbackEval({feedback:'Great thinking! Keep building.',passed:true});
    } catch(err:any){
      if(err.message==='STALE_REQUEST') return;
      setTeachbackEval({feedback:'Great thinking! Keep building.',passed:true});
    } finally { if(rid===reqIdRef.current){ setLoading(false); setShowExpl(true); } }
  };

  const nextStep=()=>{
    if(currentStep<steps.length-1){
      const n=currentStep+1;
      setCurrentStep(n); setSelectedAnswer(null); setAnswered(false);
      setShowExpl(false); setTeachbackText(''); setTeachbackEval(null);
      saveHistory(subject,subtopic,n,false);
    }
  };

  const goToQuiz=()=>{
    saveHistory(subject,subtopic,steps.length-1,true);
    setUser(prev=>({...prev,currentSubject:subject,currentSubtopic:subtopic} as any));
    navigate('/quiz',{state:{subject,subtopic}});
  };

  const resetLesson=()=>{
    reqIdRef.current+=1;
    setStarted(false); setCurrentStep(0); setSteps([]); setConcepts([]);
    setSelectedAnswer(null); setAnswered(false); setShowExpl(false);
    setTeachbackText(''); setTeachbackEval(null); setError(null); setLoading(false);
  };

  // ── Global keyframes (injected once) ────────
  const KEYFRAMES = `
    @keyframes corePulse {
      0%,100% { box-shadow:0 0 28px rgba(244,201,77,.85),0 0 60px rgba(244,201,77,.45),0 0 110px rgba(244,201,77,.2); }
      50%      { box-shadow:0 0 40px rgba(244,201,77,1),0 0 90px rgba(244,201,77,.65),0 0 150px rgba(244,201,77,.32); }
    }
    @keyframes coreRing {
      from { transform:rotate(0deg) scale(1.05); opacity:.45; }
      50%  { transform:rotate(180deg) scale(1.18); opacity:.18; }
      to   { transform:rotate(360deg) scale(1.05); opacity:.45; }
    }
    @keyframes fadeInScale {
      from { opacity:0; transform:scale(.65); }
      to   { opacity:1; transform:scale(1); }
    }
    .gl-scroll::-webkit-scrollbar { width:4px; }
    .gl-scroll::-webkit-scrollbar-thumb { background:rgba(167,139,250,.25); border-radius:4px; }
    .gl-scroll::-webkit-scrollbar-track { background:transparent; }
  `;

  // ══════════════════════════════════════════
  // TOPIC SELECTION SCREEN
  // ══════════════════════════════════════════
  if(!started) return (
    <>
      <style>{KEYFRAMES}</style>
      {/* Full-screen canvas overlay that escapes AppLayout */}
      <div style={{ position:'fixed', inset:0, zIndex:50, overflow:'hidden', background:'#02030e' }}>
        <CosmicCanvas/>
        {/* Solar system — desktop only */}
        {typeof window!=='undefined'&&window.innerWidth>=768&&(
          <SolarSystem
            selectedSubject={subject}
            onSelectSubject={s=>{ setSubject(s); setSubtopic(''); }}
            onSelectTopic={(s,t)=>{ setSubject(s); setSubtopic(t); }}
            userSubjects={user.subjects||[]}
          />
        )}
        <GlassPortal
          subject={subject} setSubject={setSubject}
          subtopic={subtopic} setSubtopic={setSubtopic}
          onStart={fetchLearningContent}
          loading={loading} error={error}
          history={history} user={user}
        />
      </div>
    </>
  );

  // ══════════════════════════════════════════
  // LEARNING FLOW
  // ══════════════════════════════════════════
  const step = steps[currentStep];
  if(!step) return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{ position:'fixed', inset:0, background:'#02030e', zIndex:50 }}>
        <CosmicCanvas/>
        <div style={{
          position:'relative', zIndex:10, height:'100vh',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          color:'rgba(220,200,255,.8)', fontFamily:"'Plus Jakarta Sans',sans-serif",
        }}>
          <AlertTriangle size={32} style={{ color:'#ffaa80', marginBottom:12 }}/>
          <p style={{ marginBottom:16 }}>Something went wrong loading this step.</p>
          <button onClick={resetLesson} style={{
            padding:'10px 24px', borderRadius:12,
            background:'rgba(167,139,250,.2)', border:'1px solid rgba(167,139,250,.38)',
            color:'#c4b5fd', cursor:'pointer', fontSize:14,
          }}>← Back</button>
        </div>
      </div>
    </>
  );

  // Subject accent color
  const subj   = SUBJECTS.find(s=>s.name===subject);
  const accent = subj?.color||'#a78bfa';
  const hex2rgb = (h:string) => h.slice(1).match(/.{2}/g)!.map(x=>parseInt(x,16));
  const [r,g,b]= hex2rgb(accent);

  const stepIcons:Record<string,JSX.Element>={
    hook:      <Target size={11}/>,
    fillblank: <PenLine size={11}/>,
    choice:    <MessageCircle size={11}/>,
    teachback: <Mic size={11}/>,
    summary:   <ClipboardCheck size={11}/>,
  };
  const stepLabels:Record<string,string>={
    hook:'Hook', fillblank:'Fill in', choice:'Think deeper',
    teachback:'Teach back', summary:'Summary',
  };

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{ position:'fixed', inset:0, background:'#02030e', zIndex:50 }}>
        <CosmicCanvas/>

        {/* Scrollable flow content */}
        <div className="gl-scroll" style={{
          position:'relative', zIndex:10,
          height:'100vh', overflowY:'auto',
          padding:'24px 16px 56px',
          display:'flex', flexDirection:'column', alignItems:'center',
        }}>
          {/* Breadcrumb */}
          <div style={{
            width:'100%', maxWidth:780,
            display:'flex', alignItems:'center', gap:9,
            marginBottom:20, flexWrap:'wrap',
          }}>
            <button onClick={resetLesson} style={{
              padding:'6px 13px', borderRadius:10,
              background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.09)',
              color:'rgba(180,155,220,.65)', fontSize:12,
              fontFamily:"'DM Mono',monospace", cursor:'pointer',
            }}>← Universe</button>
            <span style={{
              padding:'5px 13px', borderRadius:20,
              background:`rgba(${r},${g},${b},.14)`,
              border:`1px solid rgba(${r},${g},${b},.32)`,
              color:accent, fontSize:12,
              fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700,
            }}>{subject}</span>
            <ArrowRight size={11} style={{ color:'rgba(150,130,200,.4)' }}/>
            <span style={{ color:'rgba(220,210,255,.75)', fontSize:12, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
              {subtopic}
            </span>
          </div>

          {/* Two-column layout */}
          <div style={{ display:'flex', gap:18, width:'100%', maxWidth:780, alignItems:'flex-start' }}>

            {/* Main card */}
            <div style={{ flex:1, minWidth:0 }}>
              {/* Progress */}
              <div style={{ display:'flex', gap:4, marginBottom:18 }}>
                {steps.map((_,i)=>(
                  <div key={i} style={{
                    flex:1, height:3, borderRadius:3,
                    background:i<currentStep?accent:i===currentStep?`rgba(${r},${g},${b},.42)`:'rgba(255,255,255,.05)',
                    boxShadow:i<currentStep?`0 0 7px ${accent}88`:'none',
                    transition:'background .4s',
                  }}/>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={currentStep}
                  initial={{ opacity:0, y:22, scale:.98 }}
                  animate={{ opacity:1, y:0, scale:1 }}
                  exit={{ opacity:0, y:-14, scale:.98 }}
                  transition={{ duration:.38, ease:[.16,1,.3,1] }}
                  style={{
                    background:'rgba(7,7,22,.82)',
                    backdropFilter:'blur(26px) saturate(1.35)',
                    border:'1px solid rgba(180,140,255,.16)',
                    borderRadius:20, padding:'26px 26px 22px',
                    boxShadow:'0 0 0 1px rgba(180,140,255,.05), 0 22px 60px rgba(0,0,0,.58), inset 0 1px 0 rgba(255,255,255,.04)',
                  }}
                >
                  {/* Badge */}
                  <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:14 }}>
                    <span style={{
                      display:'inline-flex', alignItems:'center', gap:5,
                      padding:'4px 10px', borderRadius:20,
                      background:`rgba(${r},${g},${b},.11)`,
                      border:`1px solid rgba(${r},${g},${b},.24)`,
                      color:accent, fontSize:11, fontFamily:"'DM Mono',monospace",
                    }}>
                      {stepIcons[step.type]}
                      {stepLabels[step.type]}
                    </span>
                    <span style={{ fontSize:11, color:'rgba(150,130,200,.45)', fontFamily:"'DM Mono',monospace" }}>
                      {currentStep+1}/{steps.length}
                    </span>
                  </div>

                  <p style={{
                    fontFamily:"'Fraunces',serif", fontStyle:'italic',
                    fontSize:13, color:'rgba(180,160,220,.6)', marginBottom:7,
                  }}>{step.instruction}</p>

                  <h3 style={{
                    fontFamily:"'Fraunces',serif",
                    fontSize:'clamp(16px,2.4vw,21px)', fontWeight:600,
                    color:'rgba(235,225,255,.95)', marginBottom:22, lineHeight:1.45,
                  }}>{step.content}</h3>

                  {/* MCQ */}
                  {step.options&&step.type!=='summary'&&step.type!=='teachback'&&(
                    <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                      {step.options.map((opt,i)=>{
                        const ok  = answered&&i===step.correctIndex;
                        const bad = answered&&i===selectedAnswer&&i!==step.correctIndex;
                        return (
                          <button key={i} onClick={()=>handleAnswer(i)} disabled={answered}
                            style={{
                              width:'100%', textAlign:'left',
                              padding:'13px 16px', borderRadius:14,
                              background:ok?'rgba(110,231,183,.07)':bad?'rgba(252,165,165,.07)':'rgba(255,255,255,.025)',
                              border:`1px solid ${ok?'#6ee7b766':bad?'#fca5a566':'rgba(255,255,255,.07)'}`,
                              color:'rgba(220,210,255,.88)', fontSize:13.5,
                              fontFamily:"'Plus Jakarta Sans',sans-serif",
                              cursor:answered?'default':'pointer',
                              display:'flex', alignItems:'center', gap:11,
                              transition:'all .18s',
                            }}
                            onMouseEnter={e=>{ if(!answered)(e.currentTarget as HTMLElement).style.background='rgba(167,139,250,.08)'; }}
                            onMouseLeave={e=>{ if(!answered)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,.025)'; }}
                          >
                            <span style={{
                              width:25, height:25, borderRadius:'50%', flexShrink:0,
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:10.5, fontFamily:"'DM Mono',monospace", fontWeight:700,
                              background:ok?'rgba(110,231,183,.18)':bad?'rgba(252,165,165,.18)':'rgba(255,255,255,.04)',
                              border:`1px solid ${ok?'#6ee7b7':bad?'#fca5a5':'rgba(255,255,255,.11)'}`,
                              color:ok?'#6ee7b7':bad?'#fca5a5':'rgba(180,160,220,.65)',
                            }}>{String.fromCharCode(65+i)}</span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Teachback */}
                  {step.type==='teachback'&&!answered&&(
                    <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
                      <textarea
                        value={teachbackText} onChange={e=>setTeachbackText(e.target.value)}
                        placeholder="Explain this concept in your own words…" rows={4}
                        style={{
                          padding:'13px 15px', borderRadius:14,
                          background:'rgba(255,255,255,.035)',
                          border:'1px solid rgba(255,255,255,.09)',
                          color:'rgba(220,210,255,.9)', fontSize:13.5,
                          fontFamily:"'Plus Jakarta Sans',sans-serif",
                          resize:'vertical', outline:'none',
                        }}
                        onFocus={e=>e.target.style.borderColor='rgba(167,139,250,.38)'}
                        onBlur={e=>e.target.style.borderColor='rgba(255,255,255,.09)'}
                      />
                      <button onClick={handleTeachbackSubmit} disabled={loading||!teachbackText.trim()}
                        style={{
                          alignSelf:'flex-start', padding:'10px 21px', borderRadius:12,
                          background:'linear-gradient(135deg,#a78bfa,#7c3aed)',
                          border:'none', color:'white', fontSize:13,
                          fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700,
                          cursor:'pointer', display:'flex', alignItems:'center', gap:7,
                          opacity:loading||!teachbackText.trim()?0.48:1,
                        }}
                      >
                        {loading?<><Loader2 size={13} className="animate-spin"/>Evaluating…</>:'Submit explanation'}
                      </button>
                    </div>
                  )}

                  {/* Summary */}
                  {step.type==='summary'&&(
                    <div style={{ display:'flex', flexDirection:'column', gap:13, marginTop:6 }}>
                      {step.explanation&&(
                        <div style={{
                          padding:'15px 17px', borderRadius:14,
                          background:`rgba(${r},${g},${b},.07)`,
                          border:`1px solid rgba(${r},${g},${b},.18)`,
                        }}>
                          <p style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:accent, marginBottom:5, display:'flex', alignItems:'center', gap:4 }}>
                            <ClipboardCheck size={10}/> Concept Summary
                          </p>
                          <p style={{ fontFamily:"'Fraunces',serif", fontSize:14, color:'rgba(230,220,255,.9)', lineHeight:1.65 }}>
                            {step.explanation}
                          </p>
                        </div>
                      )}
                      <div style={{ display:'flex', alignItems:'center', gap:7, color:'#6ee7b7', fontSize:13, fontFamily:"'Plus Jakarta Sans',sans-serif" }}>
                        <CheckCircle size={15}/> Concept learned! Scheduled for spaced review.
                      </div>
                      <div style={{ display:'flex', gap:9, flexWrap:'wrap' }}>
                        <button onClick={goToQuiz} style={{
                          padding:'11px 21px', borderRadius:12,
                          background:'linear-gradient(135deg,#a78bfa,#7c3aed)',
                          border:'none', color:'white', fontSize:13,
                          fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, cursor:'pointer',
                        }}>Take adaptive quiz →</button>
                        <button onClick={resetLesson} style={{
                          padding:'11px 21px', borderRadius:12,
                          background:'rgba(255,255,255,.045)', border:'1px solid rgba(255,255,255,.09)',
                          color:'rgba(200,180,255,.75)', fontSize:13,
                          fontFamily:"'Plus Jakarta Sans',sans-serif", cursor:'pointer',
                        }}>Explore another topic</button>
                      </div>
                    </div>
                  )}

                  {/* Explanation reveal */}
                  {showExpl&&(step.options||step.type==='teachback')&&step.type!=='summary'&&(
                    <motion.div
                      initial={{ opacity:0, y:10, scale:.98 }}
                      animate={{ opacity:1, y:0, scale:1 }}
                      transition={{ duration:.32, ease:[.16,1,.3,1] }}
                      style={{
                        marginTop:15, padding:'15px 17px', borderRadius:14,
                        background:`rgba(${r},${g},${b},.065)`,
                        border:`1px solid rgba(${r},${g},${b},.18)`,
                      }}
                    >
                      {teachbackEval?(
                        <>
                          <span style={{
                            display:'inline-flex', alignItems:'center', gap:4,
                            padding:'3px 9px', borderRadius:20, marginBottom:7,
                            background:teachbackEval.passed?'rgba(110,231,183,.11)':'rgba(251,191,36,.11)',
                            border:`1px solid ${teachbackEval.passed?'rgba(110,231,183,.28)':'rgba(251,191,36,.28)'}`,
                            color:teachbackEval.passed?'#6ee7b7':'#fbbf24',
                            fontSize:11, fontFamily:"'DM Mono',monospace",
                          }}>
                            {teachbackEval.passed?'✓ Understanding confirmed':'◈ Keep building'}
                          </span>
                          <p style={{ fontFamily:"'Fraunces',serif", fontSize:14, color:'rgba(230,220,255,.9)', lineHeight:1.65 }}>
                            {teachbackEval.feedback}
                          </p>
                        </>
                      ):(
                        <p style={{ fontFamily:"'Fraunces',serif", fontSize:14, color:'rgba(230,220,255,.9)', lineHeight:1.65 }}>
                          {step.explanation||'Nice try — review the idea and keep going.'}
                        </p>
                      )}
                      <button onClick={nextStep} style={{
                        marginTop:13, padding:'8px 19px', borderRadius:10,
                        background:'linear-gradient(135deg,#a78bfa,#7c3aed)',
                        border:'none', color:'white', fontSize:12,
                        fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, cursor:'pointer',
                      }}>Continue →</button>
                    </motion.div>
                  )}

                  {/* Non-option non-teachback non-summary auto-continue */}
                  {!step.options&&step.type!=='teachback'&&step.type!=='summary'&&(
                    <div style={{ marginTop:6 }}>
                      {step.explanation&&(
                        <div style={{
                          padding:'13px 15px', borderRadius:12, marginBottom:13,
                          background:`rgba(${r},${g},${b},.065)`,
                          border:`1px solid rgba(${r},${g},${b},.16)`,
                        }}>
                          <p style={{ fontFamily:"'Fraunces',serif", fontSize:14, color:'rgba(230,220,255,.9)', lineHeight:1.65 }}>
                            {step.explanation}
                          </p>
                        </div>
                      )}
                      <button onClick={nextStep} style={{
                        padding:'8px 19px', borderRadius:10,
                        background:'linear-gradient(135deg,#a78bfa,#7c3aed)',
                        border:'none', color:'white', fontSize:12,
                        fontFamily:"'Plus Jakarta Sans',sans-serif", fontWeight:700, cursor:'pointer',
                      }}>Continue →</button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sidebar */}
            <div style={{ width:195, flexShrink:0 }} className="learn-sidebar-lg">
              <style>{`@media(max-width:1023px){.learn-sidebar-lg{display:none!important}}`}</style>

              <div style={{
                background:'rgba(7,7,22,.82)', backdropFilter:'blur(24px)',
                border:'1px solid rgba(180,140,255,.14)', borderRadius:18, padding:'16px 15px',
                boxShadow:'0 20px 55px rgba(0,0,0,.55)',
              }}>
                <h4 style={{
                  fontFamily:"'Plus Jakarta Sans',sans-serif", fontSize:12, fontWeight:700,
                  color:'rgba(200,180,255,.75)', marginBottom:10,
                  display:'flex', alignItems:'center', gap:5,
                }}>
                  <Brain size={12} style={{ color:accent }}/> Concept Map
                </h4>
                {concepts.length>0
                  ? concepts.map((c,i)=>(
                    <div key={i} style={{
                      display:'flex', alignItems:'center', gap:7,
                      paddingBlock:6.5, fontSize:11.5,
                      fontFamily:"'Plus Jakarta Sans',sans-serif",
                      borderBottom:i<concepts.length-1?'1px solid rgba(255,255,255,.034)':'none',
                    }}>
                      <div style={{
                        width:17, height:17, borderRadius:'50%', flexShrink:0,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:8.5, fontFamily:"'DM Mono',monospace",
                        background:i<currentStep?accent:'rgba(255,255,255,.055)',
                        color:i<currentStep?'#08081c':'rgba(150,130,200,.55)',
                        boxShadow:i<currentStep?`0 0 7px ${accent}88`:'none',
                        transition:'all .4s',
                      }}>{i<currentStep?'✓':i+1}</div>
                      <span style={{
                        color:i<=currentStep?'rgba(220,210,255,.88)':'rgba(150,130,200,.4)',
                        transition:'color .3s',
                      }}>{c}</span>
                    </div>
                  ))
                  : <p style={{ fontSize:10.5, color:'rgba(150,130,200,.38)', fontFamily:"'DM Mono',monospace" }}>
                      Concepts loading…
                    </p>
                }
              </div>

              <div style={{
                marginTop:13, background:'rgba(7,7,22,.82)', backdropFilter:'blur(24px)',
                border:'1px solid rgba(180,140,255,.14)', borderRadius:18,
                padding:'14px', textAlign:'center',
                boxShadow:'0 20px 55px rgba(0,0,0,.55)',
              }}>
                <div style={{ fontSize:20, marginBottom:3 }}>⚡</div>
                <div style={{
                  fontFamily:"'Fraunces',serif", fontSize:21, fontWeight:700,
                  color:accent, textShadow:`0 0 14px ${accent}88`,
                }}>
                  {user.xp} XP
                </div>
                <p style={{ fontSize:9.5, color:'rgba(150,130,200,.45)', fontFamily:"'DM Mono',monospace", marginTop:3 }}>
                  Keep learning to level up
                </p>
              </div>
            </div>
          </div>

          {/* Mobile concept chips */}
          {concepts.length>0&&(
            <div style={{ width:'100%', maxWidth:780, marginTop:14 }} className="learn-chips-mobile">
              <style>{`@media(min-width:1024px){.learn-chips-mobile{display:none!important}}`}</style>
              <div style={{
                background:'rgba(7,7,22,.82)', backdropFilter:'blur(22px)',
                border:'1px solid rgba(180,140,255,.13)', borderRadius:16, padding:'13px 14px',
                display:'flex', flexWrap:'wrap', gap:7,
              }}>
                {concepts.map((c,i)=>(
                  <span key={i} style={{
                    padding:'4px 10px', borderRadius:20, fontSize:11,
                    fontFamily:"'Plus Jakarta Sans',sans-serif",
                    background:i<currentStep?`rgba(${r},${g},${b},.14)`:'rgba(255,255,255,.035)',
                    border:`1px solid ${i<currentStep?`rgba(${r},${g},${b},.28)`:'rgba(255,255,255,.06)'}`,
                    color:i<currentStep?accent:'rgba(150,130,200,.45)',
                  }}>
                    {i<currentStep?'✓ ':i+1+'. '}{c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Learn;
