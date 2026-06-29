/**
 * Games.tsx — Immersive Gurukul Mind Break Games Page
 * 
 * Features:
 * - Full animated Gurukul world canvas background
 * - Glassmorphism 3D game cards with cursor-tracked tilt
 * - Per-game mini-previews + unique glow themes
 * - Portal transition into games
 * - Post-game mindful message overlay
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import BreathBubbles from '@/components/games/BreathBubbles';
import MemoryGarden from '@/components/games/MemoryGarden';
import ZenTiles from '@/components/games/ZenTiles';
import WordWeave from '@/components/games/WordWeave';
import { GurkulWorldBackground } from '@/components/games/GurkulWorldBackground';
import { GameCard3D } from '@/components/games/GameCard3D';
import {
  BreathBubblePreview,
  MemoryGardenPreview,
  ZenTilesPreview,
  WordWeavePreview,
} from '@/components/games/GameCardPreviews';

// ── Game definitions with visual themes ──
const games = [
  {
    id: 'breath',
    title: 'Breath Bubbles',
    tagline: 'Float with every breath. Calm arrives.',
    time: '2–3 min',
    gradient: 'linear-gradient(135deg, rgba(30,80,120,0.85) 0%, rgba(20,120,160,0.75) 50%, rgba(10,90,130,0.85) 100%)',
    glowColor: '#4FC3F7',
    accentColor: 'rgba(79,195,247,0.9)',
    preview: <BreathBubblePreview />,
  },
  {
    id: 'memory',
    title: 'Memory Garden',
    tagline: 'Grow your mind like a garden.',
    time: '3–5 min',
    gradient: 'linear-gradient(135deg, rgba(30,80,40,0.85) 0%, rgba(50,110,55,0.75) 50%, rgba(25,75,35,0.85) 100%)',
    glowColor: '#81C784',
    accentColor: 'rgba(129,199,132,0.9)',
    preview: <MemoryGardenPreview />,
  },
  {
    id: 'zen',
    title: 'Zen Tiles',
    tagline: 'Slide into stillness, piece by piece.',
    time: '2–5 min',
    gradient: 'linear-gradient(135deg, rgba(80,55,25,0.85) 0%, rgba(120,85,35,0.75) 50%, rgba(90,65,20,0.85) 100%)',
    glowColor: '#FFB74D',
    accentColor: 'rgba(255,183,77,0.9)',
    preview: <ZenTilesPreview />,
  },
  {
    id: 'word',
    title: 'Word Weave',
    tagline: 'Weave words, weave thoughts.',
    time: '3–5 min',
    gradient: 'linear-gradient(135deg, rgba(70,30,80,0.85) 0%, rgba(100,50,110,0.75) 50%, rgba(60,25,75,0.85) 100%)',
    glowColor: '#CE93D8',
    accentColor: 'rgba(206,147,216,0.9)',
    preview: <WordWeavePreview />,
  },
];

// Post-game mindful messages
const postGameMessages: Record<string, { msg: string; emoji: string }> = {
  breath: {
    emoji: '🌬️',
    msg: "Your breath regulated cortisol. You've created the perfect learning state.",
  },
  memory: {
    emoji: '🌱',
    msg: 'Concepts reinforced while relaxing. Your brain was learning even at rest.',
  },
  zen: {
    emoji: '🧩',
    msg: 'Gentle puzzle-solving warms your prefrontal cortex — ready to study.',
  },
  word: {
    emoji: '📖',
    msg: 'Language processing is active. Ideal state for reading-heavy topics.',
  },
};

// ── Main component ──
const Games = () => {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [showPostMessage, setShowPostMessage] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState(false);

  const handleGameEnd = (gameId: string) => {
    setActiveGame(null);
    setShowPostMessage(gameId);
    setTimeout(() => setShowPostMessage(null), 6000);
  };

  const handleSelectGame = (id: string) => {
    setTransitioning(true);
    setTimeout(() => {
      setActiveGame(id);
      setTransitioning(false);
    }, 450);
  };

  // Active game view
  if (activeGame) {
    return (
      <motion.div
        className="max-w-3xl mx-auto px-4 py-6"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <button
          onClick={() => handleGameEnd(activeGame)}
          className="flex items-center gap-1.5 text-sm mb-6 px-3 py-1.5 rounded-lg border transition-all hover:scale-105"
          style={{
            color: 'hsl(var(--muted))',
            borderColor: 'hsl(var(--border))',
            background: 'hsl(var(--surface))',
          }}
        >
          <ArrowLeft size={14} />
          Back to Mind Break
        </button>
        {activeGame === 'breath' && <BreathBubbles onEnd={() => handleGameEnd('breath')} />}
        {activeGame === 'memory' && <MemoryGarden onEnd={() => handleGameEnd('memory')} />}
        {activeGame === 'zen' && <ZenTiles onEnd={() => handleGameEnd('zen')} />}
        {activeGame === 'word' && <WordWeave onEnd={() => handleGameEnd('word')} />}
      </motion.div>
    );
  }

  // Main lobby
  return (
    <div className="relative overflow-hidden" style={{ minHeight: 'calc(100vh - 60px)' }}>

      {/* 3D World Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      >
        <GurkulWorldBackground />
      </div>

      {/* Overlay gradient for readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background: 'linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.28) 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative px-4 pt-8 pb-16 max-w-2xl mx-auto" style={{ zIndex: 2 }}>

        {/* Post-game message */}
        <AnimatePresence>
          {showPostMessage && postGameMessages[showPostMessage] && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-6 rounded-2xl p-4 text-center"
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.25)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
            >
              <div className="text-2xl mb-2">{postGameMessages[showPostMessage].emoji}</div>
              <p
                className="text-sm italic"
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontFamily: "'Fraunces', serif",
                }}
              >
                {postGameMessages[showPostMessage].msg}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hero Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          {/* Sanskrit label */}
          <motion.div
            className="flex items-center gap-2 mb-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div
              className="h-px flex-1"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(255,200,100,0.6))' }}
            />
            <span
              className="text-xs tracking-widest uppercase px-3 py-1 rounded-full"
              style={{
                color: 'rgba(255,220,150,0.85)',
                background: 'rgba(255,200,100,0.1)',
                border: '1px solid rgba(255,200,100,0.25)',
                fontFamily: "'DM Mono', monospace",
              }}
            >
              मन की शांति
            </span>
            <div
              className="h-px flex-1"
              style={{ background: 'linear-gradient(90deg, rgba(255,200,100,0.6), transparent)' }}
            />
          </motion.div>

          <motion.h1
            className="text-center mb-2"
            style={{
              fontFamily: "'Fraunces', serif",
              fontWeight: 700,
              fontSize: 'clamp(26px, 5.5vw, 40px)',
              color: 'rgba(255,255,255,0.97)',
              textShadow: '0 2px 20px rgba(0,0,0,0.4), 0 0 60px rgba(255,180,80,0.2)',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            🌿 Mind Break Games
          </motion.h1>

          <motion.p
            className="text-center"
            style={{
              color: 'rgba(255,220,180,0.8)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Sometimes rest means gentle play — no pressure, no scores.
          </motion.p>
        </motion.div>

        {/* Game Cards Grid */}
        <AnimatePresence>
          {!transitioning && (
            <motion.div
              className="grid sm:grid-cols-2 gap-4"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
            >
              {games.map((game, i) => (
                <GameCard3D
                  key={game.id}
                  index={i}
                  id={game.id}
                  title={game.title}
                  tagline={game.tagline}
                  time={game.time}
                  gradient={game.gradient}
                  glowColor={game.glowColor}
                  accentColor={game.accentColor}
                  preview={game.preview}
                  onSelect={handleSelectGame}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Portal transition overlay */}
        <AnimatePresence>
          {transitioning && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center"
              style={{ zIndex: 50, pointerEvents: 'none' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(255,200,100,0.35), rgba(255,150,50,0.15), transparent)',
                }}
                initial={{ width: 0, height: 0 }}
                animate={{ width: '160vmax', height: '160vmax' }}
                transition={{ duration: 0.45, ease: 'easeIn' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom tagline */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <p
            className="text-xs"
            style={{
              color: 'rgba(255,200,150,0.45)',
              fontFamily: "'DM Mono', monospace",
              letterSpacing: '0.1em',
            }}
          >
            ✦ Like the ancient gurukuls — play is learning ✦
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Games;
