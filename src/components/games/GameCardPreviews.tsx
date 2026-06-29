/**
 * GameCardPreviews.tsx
 * 
 * Mini animated SVG/Canvas previews rendered inside each game card.
 * Each one subtly animates to hint at the game's feel.
 */

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────
// Breath Bubbles Preview — floating bubbles
// ─────────────────────────────────────────────
export const BreathBubblePreview = () => {
  const bubbles = Array.from({ length: 7 }, (_, i) => ({
    x: 15 + i * 12,
    delay: i * 0.4,
    size: 8 + (i % 3) * 5,
    opacity: 0.4 + (i % 3) * 0.2,
  }));

  return (
    <div className="relative w-full h-full overflow-hidden">
      {bubbles.map((b, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${b.x}%`,
            bottom: '-20%',
            width: b.size,
            height: b.size,
            background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.9), rgba(120,200,255,${b.opacity}))`,
            boxShadow: `0 0 ${b.size * 0.5}px rgba(120,200,255,0.4), inset 0 -2px 4px rgba(255,255,255,0.3)`,
          }}
          animate={{
            y: [0, -(120 + i * 20)],
            x: [0, Math.sin(i) * 15],
            scale: [1, 1.1, 0.95, 1],
            opacity: [b.opacity, b.opacity + 0.2, b.opacity, 0],
          }}
          transition={{
            duration: 3 + i * 0.3,
            delay: b.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
      {/* Breathing ring */}
      <motion.div
        className="absolute rounded-full border-2"
        style={{
          bottom: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderColor: 'rgba(120,200,255,0.6)',
          width: 28,
          height: 28,
        }}
        animate={{ scale: [1, 1.6, 1], opacity: [0.7, 0.2, 0.7] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────
// Memory Garden Preview — growing plants
// ─────────────────────────────────────────────
export const MemoryGardenPreview = () => {
  const plants = [
    { x: 20, h: 45, color: '#5A9E5D', delay: 0 },
    { x: 40, h: 60, color: '#7CB87F', delay: 0.3 },
    { x: 60, h: 50, color: '#4A8A4D', delay: 0.6 },
    { x: 80, h: 40, color: '#6AAC6D', delay: 0.9 },
  ];

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Ground */}
      <div
        className="absolute bottom-0 left-0 right-0 h-6 rounded-b-xl"
        style={{ background: 'linear-gradient(180deg, #A07840, #7B5833)' }}
      />
      {plants.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: `${p.x}%`, bottom: '16px' }}
        >
          {/* Stem */}
          <motion.div
            style={{
              width: 3,
              background: p.color,
              borderRadius: 2,
              transformOrigin: 'bottom',
              marginLeft: 4,
            }}
            animate={{ height: [0, p.h * 0.6, p.h], scaleX: [1, 1.05, 1] }}
            transition={{ duration: 2, delay: p.delay, repeat: Infinity, repeatDelay: 4 }}
          />
          {/* Leaves */}
          <motion.div
            className="absolute"
            style={{ bottom: p.h * 0.3, left: -8 }}
            animate={{ rotate: [0, -15, 5, 0], opacity: [0, 1, 1, 0.8] }}
            transition={{ duration: 2, delay: p.delay + 0.5, repeat: Infinity, repeatDelay: 4 }}
          >
            <svg width="14" height="10" viewBox="0 0 14 10">
              <ellipse cx="7" cy="5" rx="7" ry="4" fill={p.color} opacity="0.85" />
            </svg>
          </motion.div>
          {/* Flower */}
          <motion.div
            className="absolute"
            style={{ bottom: p.h - 4, left: -3 }}
            animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1, 0] }}
            transition={{ duration: 1, delay: p.delay + 1.2, repeat: Infinity, repeatDelay: 5 }}
          >
            <div style={{
              width: 10, height: 10, borderRadius: '50%',
              background: `radial-gradient(circle, #FFD700, ${p.color})`,
              boxShadow: `0 0 6px rgba(255,200,50,0.5)`
            }} />
          </motion.div>
        </motion.div>
      ))}
      {/* Floating sparkles */}
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="absolute text-yellow-400 text-xs"
          style={{ left: `${25 + i * 25}%`, bottom: '50%' }}
          animate={{ y: [-5, -25, -45], opacity: [0, 1, 0], x: [0, (i - 1) * 8] }}
          transition={{ duration: 2.5, delay: i * 0.8 + 1, repeat: Infinity, repeatDelay: 3 }}
        >
          ✦
        </motion.div>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────
// Zen Tiles Preview — sliding tiles
// ─────────────────────────────────────────────
export const ZenTilesPreview = () => {
  // 3x3 grid with one empty
  const tiles = [
    { id: 1, col: 0, row: 0 }, { id: 2, col: 1, row: 0 }, { id: 3, col: 2, row: 0 },
    { id: 4, col: 0, row: 1 }, { id: 5, col: 1, row: 1 }, /* empty: 2,1 */
    { id: 6, col: 0, row: 2 }, { id: 7, col: 1, row: 2 }, { id: 8, col: 2, row: 2 },
  ];

  const tileColors = [
    'rgba(94,139,93,0.7)', 'rgba(107,160,107,0.7)', 'rgba(80,120,80,0.7)',
    'rgba(120,170,100,0.7)', 'rgba(94,139,93,0.7)',
    'rgba(107,160,107,0.7)', 'rgba(80,120,80,0.7)', 'rgba(120,170,100,0.7)',
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <div className="relative" style={{ width: 72, height: 72 }}>
        {tiles.map((tile, i) => (
          <motion.div
            key={tile.id}
            className="absolute rounded-md flex items-center justify-center text-white text-xs font-bold"
            style={{
              width: 22, height: 22,
              background: tileColors[i],
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              fontSize: 8,
            }}
            animate={{
              left: tile.col * 25,
              top: tile.row * 25,
            }}
            transition={{
              type: 'spring',
              stiffness: 120,
              damping: 15,
              delay: i * 0.1,
            }}
          >
            {tile.id}
          </motion.div>
        ))}
        {/* Sliding animation hint */}
        <motion.div
          className="absolute rounded-md"
          style={{
            width: 22, height: 22,
            background: 'rgba(255,200,100,0.4)',
            border: '1px dashed rgba(255,200,100,0.8)',
            left: 50, top: 25,
          }}
          animate={{ opacity: [0.3, 0.8, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
      {/* Om symbol */}
      <motion.div
        className="absolute top-2 right-3 text-amber-300 opacity-40 font-serif"
        style={{ fontSize: 18 }}
        animate={{ opacity: [0.2, 0.5, 0.2], scale: [0.95, 1.05, 0.95] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        ॐ
      </motion.div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Word Weave Preview — floating letters connecting
// ─────────────────────────────────────────────
export const WordWeavePreview = () => {
  const letters = ['अ', 'B', 'क', 'W', 'ज', 'S', 'म', 'E'];
  const positions = [
    { x: 12, y: 25 }, { x: 35, y: 15 }, { x: 58, y: 30 }, { x: 75, y: 18 },
    { x: 20, y: 55 }, { x: 45, y: 65 }, { x: 65, y: 55 }, { x: 82, y: 65 },
  ];
  const connections = [[0, 2], [1, 3], [4, 6], [5, 7], [2, 5]];

  return (
    <div className="relative w-full h-full overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {connections.map(([a, b], i) => (
          <motion.line
            key={i}
            x1={positions[a].x} y1={positions[a].y}
            x2={positions[b].x} y2={positions[b].y}
            stroke="rgba(255,200,120,0.5)"
            strokeWidth="0.8"
            strokeDasharray="3 2"
            animate={{ opacity: [0, 0.6, 0], strokeDashoffset: [0, -10] }}
            transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, repeatDelay: 1 }}
          />
        ))}
      </svg>
      {letters.map((letter, i) => (
        <motion.div
          key={i}
          className="absolute flex items-center justify-center rounded-full font-bold"
          style={{
            left: `${positions[i].x}%`,
            top: `${positions[i].y}%`,
            width: 22, height: 22,
            fontSize: 9,
            background: 'rgba(255,220,150,0.15)',
            border: '1px solid rgba(255,200,100,0.4)',
            color: 'rgba(255,220,150,0.9)',
            backdropFilter: 'blur(2px)',
            transform: 'translate(-50%, -50%)',
          }}
          animate={{
            y: [0, -4, 0],
            scale: [1, 1.1, 1],
            boxShadow: ['0 0 0px rgba(255,200,100,0)', '0 0 8px rgba(255,200,100,0.5)', '0 0 0px rgba(255,200,100,0)'],
          }}
          transition={{
            duration: 2 + i * 0.2,
            delay: i * 0.25,
            repeat: Infinity,
          }}
        >
          {letter}
        </motion.div>
      ))}
    </div>
  );
};
