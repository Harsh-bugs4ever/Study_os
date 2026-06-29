import { useState } from 'react';
import { motion } from 'framer-motion';

const guidedPrompts = ['Struggled with ___', 'Felt good about ___', 'Worried about ___'];

const Reflect = () => {
  const [journalText, setJournalText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showPattern, setShowPattern] = useState(false);

  const handleSubmit = () => {
    if (!journalText.trim()) return;
    setSubmitted(true);
    setTimeout(() => setShowPattern(true), 1500);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h2 className="font-display text-2xl font-bold mb-2" style={{ color: 'hsl(var(--text))' }}>
        Reflect
      </h2>
      <p className="text-sm mb-6" style={{ color: 'hsl(var(--muted))' }}>
        How did that session feel? No pressure — just for you.
      </p>

      {!submitted ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex flex-wrap gap-2 mb-4">
            {guidedPrompts.map(p => (
              <button key={p} onClick={() => setJournalText(prev => prev + (prev ? '\n' : '') + p)}
                className="text-xs px-3 py-1.5 rounded-full border border-border"
                style={{ background: 'hsl(var(--surface2))', color: 'hsl(var(--text-secondary))' }}>
                {p}
              </button>
            ))}
          </div>
          <textarea
            value={journalText}
            onChange={e => setJournalText(e.target.value)}
            placeholder="Write freely..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl border border-border text-sm resize-none outline-none mb-4"
            style={{ background: 'hsl(var(--surface))', color: 'hsl(var(--text))' }}
          />
          <div className="flex gap-3">
            <button onClick={handleSubmit} className="btn-3d text-sm px-6 py-2.5 font-medium">
              Save reflection
            </button>
            <button className="btn-3d-ghost text-sm px-4 py-2.5">Skip for now →</button>
          </div>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
          <div className="card-base text-center">
            <span className="text-3xl mb-2 block">🌿</span>
            <p className="font-display text-sm" style={{ color: 'hsl(var(--text))' }}>
              Reflection saved. Taking a moment to notice how you feel is powerful.
            </p>
          </div>

          {showPattern && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card-base">
              <p className="text-xs font-medium mb-2" style={{ color: 'hsl(var(--muted))' }}>📊 Saathi noticed a pattern</p>
              <p className="font-display text-sm" style={{ color: 'hsl(var(--text))' }}>
                "Your best sessions happen in the evening after 7pm. Your worst follow Sunday nights."
              </p>
              <button className="text-xs mt-2 font-medium" style={{ color: 'hsl(var(--accent))' }}>
                Want to schedule around this? →
              </button>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Reflect;
