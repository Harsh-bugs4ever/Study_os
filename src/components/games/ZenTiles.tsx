import { useState } from 'react';
import { motion } from 'framer-motion';

const GRID = 3;
const TOTAL = GRID * GRID;

const tileColors = [
  'hsl(var(--accent) / 0.3)', 'hsl(var(--accent) / 0.5)', 'hsl(var(--accent) / 0.7)',
  'hsl(var(--accent) / 0.9)', 'hsl(var(--success) / 0.4)', 'hsl(var(--warning) / 0.4)',
  'hsl(var(--accent) / 0.45)', 'hsl(var(--accent) / 0.65)',
];

function generatePuzzle(): number[] {
  const tiles = Array.from({ length: TOTAL }, (_, i) => i);
  for (let i = 0; i < 100; i++) {
    const emptyIdx = tiles.indexOf(0);
    const row = Math.floor(emptyIdx / GRID);
    const col = emptyIdx % GRID;
    const neighbors: number[] = [];
    if (row > 0) neighbors.push(emptyIdx - GRID);
    if (row < GRID - 1) neighbors.push(emptyIdx + GRID);
    if (col > 0) neighbors.push(emptyIdx - 1);
    if (col < GRID - 1) neighbors.push(emptyIdx + 1);
    const swap = neighbors[Math.floor(Math.random() * neighbors.length)];
    [tiles[emptyIdx], tiles[swap]] = [tiles[swap], tiles[emptyIdx]];
  }
  return tiles;
}

const ZenTiles = ({ onEnd }: { onEnd: () => void }) => {
  const [tiles, setTiles] = useState(() => generatePuzzle());
  const [moves, setMoves] = useState(0);

  const isSolved = tiles.every((t, i) => t === i);

  const handleTap = (idx: number) => {
    if (tiles[idx] === 0) return;
    const emptyIdx = tiles.indexOf(0);
    const row = Math.floor(idx / GRID), col = idx % GRID;
    const eRow = Math.floor(emptyIdx / GRID), eCol = emptyIdx % GRID;
    if ((Math.abs(row - eRow) === 1 && col === eCol) || (Math.abs(col - eCol) === 1 && row === eRow)) {
      const next = [...tiles];
      [next[idx], next[emptyIdx]] = [next[emptyIdx], next[idx]];
      setTiles(next);
      setMoves(m => m + 1);
    }
  };

  return (
    <div className="card-base text-center">
      <div className="flex items-center justify-between mb-4">
        <span className="font-display text-lg font-semibold" style={{ color: 'hsl(var(--text))' }}>🪨 Zen Tiles</span>
        <span className="stat-number text-xs" style={{ color: 'hsl(var(--muted))' }}>{moves} moves</span>
      </div>

      <div className="inline-grid gap-2 mx-auto" style={{ gridTemplateColumns: `repeat(${GRID}, 1fr)` }}>
        {tiles.map((tile, idx) => (
          <button key={idx} onClick={() => handleTap(idx)}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl font-display text-lg font-bold flex items-center justify-center transition-all"
            style={{
              background: tile === 0 ? 'hsl(var(--surface2))' : tileColors[tile - 1] || 'hsl(var(--accent) / 0.5)',
              border: tile === 0 ? '2px dashed hsl(var(--border))' : '1px solid hsl(var(--border))',
              color: tile === 0 ? 'transparent' : 'hsl(var(--text))',
              cursor: tile === 0 ? 'default' : 'pointer',
              opacity: tile === 0 ? 0.3 : 1,
            }}>
            {tile || ''}
          </button>
        ))}
      </div>

      {isSolved && moves > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6">
          <span className="text-3xl block mb-2">✨</span>
          <p className="font-display text-sm mb-3" style={{ color: 'hsl(var(--text))' }}>Completed in {moves} moves. Beautiful patience.</p>
          <button onClick={onEnd} className="btn-3d text-sm px-6 py-2">Back to studying</button>
        </motion.div>
      )}

      <button onClick={() => { setTiles(generatePuzzle()); setMoves(0); }} className="text-xs mt-4 block mx-auto" style={{ color: 'hsl(var(--muted))' }}>
        Shuffle again
      </button>
    </div>
  );
};

export default ZenTiles;
