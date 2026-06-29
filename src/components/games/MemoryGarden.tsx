import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const conceptPairs = [
  { concept: 'F = ma', meaning: "Newton's 2nd Law" },
  { concept: 'E = mc²', meaning: 'Mass-energy equivalence' },
  { concept: 'PV = nRT', meaning: 'Ideal gas law' },
  { concept: 'V = IR', meaning: "Ohm's Law" },
  { concept: 'KE = ½mv²', meaning: 'Kinetic energy' },
  { concept: 'pH = -log[H⁺]', meaning: 'pH definition' },
  { concept: 'ΔG = ΔH - TΔS', meaning: 'Gibbs free energy' },
  { concept: 'W = Fd', meaning: 'Work done' },
];

interface Card {
  id: number;
  text: string;
  pairId: number;
  flipped: boolean;
  matched: boolean;
}

const MemoryGarden = ({ onEnd }: { onEnd: () => void }) => {
  const [gameCards, setGameCards] = useState<Card[]>(() => {
    const selected = conceptPairs.slice(0, 6);
    const deck: Card[] = [];
    selected.forEach((pair, i) => {
      deck.push({ id: i * 2, text: pair.concept, pairId: i, flipped: false, matched: false });
      deck.push({ id: i * 2 + 1, text: pair.meaning, pairId: i, flipped: false, matched: false });
    });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  });
  const [flippedIds, setFlippedIds] = useState<number[]>([]);
  const [matches, setMatches] = useState(0);
  const [locked, setLocked] = useState(false);

  const handleFlip = (id: number) => {
    if (locked) return;
    const card = gameCards.find(c => c.id === id);
    if (!card || card.flipped || card.matched) return;

    const newCards = gameCards.map(c => c.id === id ? { ...c, flipped: true } : c);
    setGameCards(newCards);
    const newFlipped = [...flippedIds, id];
    setFlippedIds(newFlipped);

    if (newFlipped.length === 2) {
      setLocked(true);
      const first = newCards.find(c => c.id === newFlipped[0])!;
      const second = newCards.find(c => c.id === newFlipped[1])!;
      
      if (first.pairId === second.pairId) {
        setTimeout(() => {
          setGameCards(prev => prev.map(c => c.pairId === first.pairId ? { ...c, matched: true } : c));
          setMatches(m => m + 1);
          setFlippedIds([]);
          setLocked(false);
        }, 600);
      } else {
        setTimeout(() => {
          setGameCards(prev => prev.map(c => newFlipped.includes(c.id) ? { ...c, flipped: false } : c));
          setFlippedIds([]);
          setLocked(false);
        }, 1000);
      }
    }
  };

  const allMatched = matches === 6;

  return (
    <div className="card-base">
      <div className="flex items-center justify-between mb-4">
        <span className="font-display text-lg font-semibold" style={{ color: 'hsl(var(--text))' }}>🌱 Memory Garden</span>
        <span className="text-xs" style={{ color: 'hsl(var(--muted))' }}>{matches}/6 matched</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {gameCards.map(card => (
          <motion.button key={card.id} onClick={() => handleFlip(card.id)} whileTap={{ scale: 0.95 }}
            className="aspect-square rounded-xl flex items-center justify-center p-2 text-xs font-medium transition-all border"
            style={{
              background: card.matched ? 'hsl(var(--accent) / 0.15)' : card.flipped ? 'hsl(var(--surface))' : 'hsl(var(--surface2))',
              borderColor: card.matched ? 'hsl(var(--accent))' : card.flipped ? 'hsl(var(--border))' : 'hsl(var(--border))',
              color: card.flipped || card.matched ? 'hsl(var(--text))' : 'transparent',
            }}>
            {card.flipped || card.matched ? card.text : '🌿'}
          </motion.button>
        ))}
      </div>

      {allMatched && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-6">
          <span className="text-3xl mb-2 block">🌸</span>
          <p className="font-display text-sm mb-3" style={{ color: 'hsl(var(--text))' }}>You matched 6 concepts while relaxing 🌱</p>
          <button onClick={onEnd} className="btn-3d text-sm px-6 py-2">Back to studying</button>
        </motion.div>
      )}
    </div>
  );
};

export default MemoryGarden;
