import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const WORDS_DB = ['force', 'mass', 'atom', 'cell', 'wave', 'heat', 'ion', 'gas', 'acid', 'base', 'bond', 'mole', 'volt', 'watt', 'ohm', 'lens', 'ray', 'flux'];

function pickLettersAndWords() {
  const shuffled = [...WORDS_DB].sort(() => Math.random() - 0.5);
  const targets = shuffled.slice(0, 4);
  const allLetters = targets.join('').split('');
  for (let i = 0; i < 4; i++) {
    allLetters.push(String.fromCharCode(97 + Math.floor(Math.random() * 26)));
  }
  for (let i = allLetters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allLetters[i], allLetters[j]] = [allLetters[j], allLetters[i]];
  }
  return { letters: allLetters, targets };
}

const WordWeave = ({ onEnd }: { onEnd: () => void }) => {
  const { letters, targets } = useMemo(() => pickLettersAndWords(), []);
  const [selected, setSelected] = useState<number[]>([]);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const currentWord = selected.map(i => letters[i]).join('');

  const toggleLetter = (idx: number) => {
    if (selected.includes(idx)) {
      setSelected(prev => prev.filter(i => i !== idx));
    } else {
      setSelected(prev => [...prev, idx]);
    }
    setFeedback(null);
  };

  const submitWord = () => {
    const word = currentWord.toLowerCase();
    if (word.length < 3) return;
    if (WORDS_DB.includes(word) && !foundWords.includes(word)) {
      setFoundWords(prev => [...prev, word]);
      setFeedback('correct');
    } else {
      setFeedback('wrong');
    }
    setTimeout(() => { setFeedback(null); setSelected([]); }, 800);
  };

  const allFound = targets.every(t => foundWords.includes(t));

  return (
    <div className="card-base text-center">
      <div className="flex items-center justify-between mb-4">
        <span className="font-display text-lg font-semibold" style={{ color: 'hsl(var(--text))' }}>📝 Word Weave</span>
        <span className="text-xs" style={{ color: 'hsl(var(--muted))' }}>{foundWords.length}/{targets.length} target words</span>
      </div>

      <div className="mb-2">
        <p className="text-xs" style={{ color: 'hsl(var(--muted))' }}>Find these words: {targets.map(t => foundWords.includes(t) ? `✅ ${t}` : `⬜ ${t}`).join('  ·  ')}</p>
      </div>

      <div className="h-10 flex items-center justify-center mb-4">
        <span className="font-mono text-xl tracking-widest font-bold" style={{
          color: feedback === 'correct' ? 'hsl(var(--success))' : feedback === 'wrong' ? 'hsl(var(--danger))' : 'hsl(var(--text))',
        }}>
          {currentWord || 'Select letters...'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        {letters.map((letter, i) => (
          <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={() => toggleLetter(i)}
            className="w-10 h-10 rounded-xl font-mono text-base font-bold flex items-center justify-center uppercase transition-all border"
            style={{
              background: selected.includes(i) ? 'hsl(var(--accent))' : 'hsl(var(--surface2))',
              color: selected.includes(i) ? 'hsl(var(--primary-foreground))' : 'hsl(var(--text))',
              borderColor: selected.includes(i) ? 'hsl(var(--accent))' : 'hsl(var(--border))',
            }}>
            {letter}
          </motion.button>
        ))}
      </div>

      <div className="flex gap-2 justify-center mb-4">
        <button onClick={submitWord} disabled={currentWord.length < 3} className="btn-3d text-sm px-6 py-2 disabled:opacity-40">Submit</button>
        <button onClick={() => setSelected([])} className="btn-3d-ghost text-sm px-4 py-2">Clear</button>
      </div>

      {foundWords.length > 0 && (
        <div className="flex flex-wrap gap-2 justify-center mt-2">
          {foundWords.map(w => (
            <span key={w} className="px-2 py-1 rounded-lg text-xs font-mono font-medium"
              style={{ background: 'hsl(var(--accent) / 0.15)', color: 'hsl(var(--accent))' }}>{w}</span>
          ))}
        </div>
      )}

      {allFound && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
          <p className="font-display text-sm mb-3" style={{ color: 'hsl(var(--text))' }}>You found all target words! ✨</p>
          <button onClick={onEnd} className="btn-3d text-sm px-6 py-2">Back to studying</button>
        </motion.div>
      )}
    </div>
  );
};

export default WordWeave;
