import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';

const streamSubjectMap: Record<string, string[]> = {
  jee: ['Physics', 'Chemistry', 'Mathematics'],
  neet: ['Physics', 'Chemistry', 'Biology'],
  boards: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'History', 'Geography', 'Economics'],
  engineering: ['Computer Science', 'Electronics', 'Mechanical Engineering', 'Civil Engineering', 'Electrical Engineering', 'Engineering Mathematics', 'Data Structures & Algorithms', 'Operating Systems', 'DBMS', 'Discrete Mathematics'],
  commerce: ['Accountancy', 'Business Studies', 'Economics', 'Mathematics'],
  arts: ['History', 'Political Science', 'Geography', 'Psychology', 'Sociology'],
  other: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'English', 'History', 'Geography', 'Economics', 'Computer Science'],
};

const steps = [
  {
    title: 'What are you preparing for?',
    type: 'single',
    options: [
      { label: '🎯 JEE Mains + Advanced', value: 'jee' },
      { label: '🩺 NEET', value: 'neet' },
      { label: '📚 Board Exams (10th/12th)', value: 'boards' },
      { label: '💻 Engineering Degree', value: 'engineering' },
      { label: '💰 Commerce', value: 'commerce' },
      { label: '🎨 Arts / Humanities', value: 'arts' },
      { label: '📖 Other / Custom', value: 'other' },
    ],
  },
  {
    title: 'Pick your subjects',
    subtitle: 'Select from below or type your own',
    type: 'multi',
    options: [] as string[], // dynamically set based on stream
  },
  {
    title: 'When do you usually study?',
    subtitle: 'Saathi will schedule reviews around your peak time',
    type: 'single',
    options: [
      { label: '🌅 Morning 6-10am', value: 'morning' },
      { label: '☀️ Afternoon 12-4pm', value: 'afternoon' },
      { label: '🌆 Evening 5-9pm', value: 'evening' },
      { label: '🌙 Night 9pm-12am', value: 'night' },
      { label: '🦉 Late night 12am+', value: 'latenight' },
      { label: '🔄 Varies', value: 'varies' },
    ],
  },
  {
    title: 'How are you feeling about studies right now?',
    type: 'single',
    options: [
      { label: '😤 Overwhelmed', value: 'overwhelmed' },
      { label: '😐 Getting by', value: 'gettingby' },
      { label: '💪 Ready to grind', value: 'ready' },
      { label: '😟 Really struggling', value: 'struggling' },
      { label: '🎯 Confident', value: 'confident' },
    ],
  },
];

const Onboarding = () => {
  const [step, setStep] = useState(0);
  const [examType, setExamType] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [studyTime, setStudyTime] = useState('');
  const [feeling, setFeeling] = useState('');
  const [customSubject, setCustomSubject] = useState('');
  const navigate = useNavigate();
  const { setUser, user } = useApp();

  // If already onboarded, redirect
  useEffect(() => {
    if (user.onboardingComplete && user.isLoggedIn) {
      navigate('/dashboard', { replace: true });
    }
  }, []);

  // Get subject options based on selected stream
  const subjectOptions = streamSubjectMap[examType] || streamSubjectMap['other'];

  const addCustomSubject = () => {
    const trimmed = customSubject.trim();
    if (trimmed && !subjects.includes(trimmed)) {
      setSubjects(prev => [...prev, trimmed]);
      setCustomSubject('');
    }
  };

  const handleSelect = (value: string) => {
    if (step === 0) {
      setExamType(value);
      // Reset subjects when stream changes
      setSubjects([]);
    }
    if (step === 2) setStudyTime(value);
    if (step === 3) setFeeling(value);
  };

  const toggleSubject = (s: string) => {
    setSubjects(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  const currentSelection = step === 0 ? examType : step === 2 ? studyTime : step === 3 ? feeling : '';
  const canNext = step === 1 ? subjects.length > 0 : !!currentSelection;

  const next = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Complete onboarding
      setUser(prev => ({
        ...prev,
        examType,
        subjects,
        studyTime,
        mood: feeling,
        onboardingComplete: true,
        readinessScore: feeling === 'ready' || feeling === 'confident' ? 82 : feeling === 'gettingby' ? 65 : 45,
      }));
      navigate('/dashboard');
    }
  };

  if (step === 4) return null;

  const currentStep = steps[step];
  // For step 1, use dynamic options
  const displayOptions = step === 1 ? subjectOptions : currentStep.options;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6" style={{ background: 'hsl(var(--bg))' }}>
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
              style={{ background: i <= step ? 'hsl(var(--accent))' : 'hsl(var(--surface2))' }} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="font-display text-xl sm:text-2xl font-bold mb-2" style={{ color: 'hsl(var(--text))' }}>
              {currentStep.title}
            </h2>
            {'subtitle' in currentStep && currentStep.subtitle && (
              <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted))' }}>
                {step === 1 && examType ? `Subjects for ${(steps[0].options as {label:string;value:string}[]).find(o => o.value === examType)?.label || examType}:` : currentStep.subtitle as string}
              </p>
            )}

            <div className={`grid gap-3 mb-8 ${step === 1 ? 'grid-cols-2 sm:grid-cols-3' : ''}`}>
              {(displayOptions as any[]).map((opt, i) => {
                const value = typeof opt === 'string' ? opt : opt.value;
                const label = typeof opt === 'string' ? opt : opt.label;
                const selected = step === 1
                  ? subjects.includes(value)
                  : currentSelection === value;

                return (
                  <button
                    key={i}
                    onClick={() => step === 1 ? toggleSubject(value) : handleSelect(value)}
                    className="answer-tile text-left text-sm font-medium transition-all"
                    style={{
                      borderColor: selected ? 'hsl(var(--accent))' : 'hsl(var(--border))',
                      background: selected ? 'hsl(var(--accent-soft))' : 'hsl(var(--surface))',
                      color: 'hsl(var(--text))',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Custom subject input for step 1 (subjects) */}
            {step === 1 && (
              <div className="flex gap-2 mb-8">
                <input
                  type="text"
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomSubject()}
                  placeholder="Type a custom subject..."
                  className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none transition-all focus:ring-2"
                  style={{ background: 'hsl(var(--surface))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--text))' }}
                />
                <button onClick={addCustomSubject} disabled={!customSubject.trim()}
                  className="btn-3d px-4 py-2.5 text-sm font-medium disabled:opacity-40">
                  Add
                </button>
              </div>
            )}

            {/* Show selected custom subjects */}
            {step === 1 && subjects.filter(s => !subjectOptions.includes(s)).length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium mb-2" style={{ color: 'hsl(var(--muted))' }}>Custom subjects:</p>
                <div className="flex flex-wrap gap-2">
                  {subjects.filter(s => !subjectOptions.includes(s)).map((s, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
                      style={{ background: 'hsl(var(--accent-soft))', color: 'hsl(var(--accent))', border: '1px solid hsl(var(--accent))' }}>
                      {s}
                      <button onClick={() => setSubjects(prev => prev.filter(x => x !== s))} className="text-xs opacity-60 hover:opacity-100">✕</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {step > 0 && (
                <button onClick={() => setStep(step - 1)} className="btn-3d-ghost px-6 py-3 text-sm font-medium">
                  ← Back
                </button>
              )}
              <button
                onClick={next}
                disabled={!canNext}
                className="btn-3d flex-1 py-3 text-sm font-semibold disabled:opacity-40"
              >
                {step === 3 ? "Let's begin →" : 'Continue →'}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Onboarding;
