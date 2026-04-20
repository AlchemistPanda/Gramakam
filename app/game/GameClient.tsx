'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Trophy, Heart, Zap, Play, RotateCcw, Star, ChevronRight, Loader2 } from 'lucide-react';
import { submitGameScore, getTopGameScores } from '@/lib/services';
import { soundManager } from '@/lib/sounds';
import GameQuiz, { ALL_QUESTIONS, type QuizQuestion } from './GameQuiz';
import type { GameScore } from '@/types';

// ── Types ──────────────────────────────────────────────────────────────────
interface Spotlight {
  id: string;
  x: number;        // % from left
  y: number;        // % from top
  born: number;     // timestamp
  lifetime: number; // ms before it disappears
  size: number;     // px radius
}

type Screen = 'menu' | 'playing' | 'gameover' | 'leaderboard';

// ── Level configuration ────────────────────────────────────────────────────
function getLevelConfig(level: number) {
  const capped = Math.min(level, 12);
  return {
    lifetime: Math.max(600, 2400 - capped * 150),
    spawnInterval: Math.max(400, 1800 - capped * 110),
    maxSimultaneous: Math.min(1 + Math.floor(capped / 2), 6),
    hitsToLevel: 8,
    scorePerHit: 10 + (level - 1) * 5,
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────
function randomSpot(existing: Spotlight[], stageW: number, stageH: number, isMobileDevice: boolean) {
  // Margins for spotlight bubble size (radius up to 67px on mobile, 56px on desktop)
  const MARGIN_H = 14;
  const MARGIN_TOP = isMobileDevice ? 18 : 14; // Extra margin at top for mobile HUD
  const MARGIN_BOTTOM = 14;
  const CENTER_X = 50, CENTER_Y = 50, CENTER_AVOID = 14;
  let x = 0, y = 0, tries = 0;
  do {
    x = MARGIN_H + Math.random() * (100 - MARGIN_H * 2);
    y = MARGIN_TOP + Math.random() * (100 - MARGIN_TOP - MARGIN_BOTTOM);
    const tooCenter = Math.abs(x - CENTER_X) < CENTER_AVOID && Math.abs(y - CENTER_Y) < CENTER_AVOID;
    const tooClose = existing.some((s) => Math.hypot(s.x - x, s.y - y) < 18);
    if (!tooCenter && !tooClose) break;
    tries++;
  } while (tries < 30);
  return { x, y };
}

// ── Rank badge ─────────────────────────────────────────────────────────────
function rankBadge(i: number) {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return `${i + 1}.`;
}

// ── Leaderboard list ───────────────────────────────────────────────────────
function LeaderboardList({
  scores,
  highlightName,
  loading,
}: {
  scores: GameScore[];
  highlightName?: string;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-white/50">
        <Loader2 size={28} className="animate-spin" />
        <p className="text-sm">Loading scores…</p>
      </div>
    );
  }
  if (scores.length === 0) {
    return <p className="text-white/50 py-6">No scores yet. Be the first!</p>;
  }
  return (
    <div className="w-full space-y-2">
      {scores.map((entry, i) => {
        const isHighlight = highlightName && entry.name === highlightName;
        return (
          <div
            key={entry.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isHighlight
                ? 'bg-amber-400/30 border border-amber-400/60 scale-[1.02]'
                : i === 0 ? 'bg-amber-400/20 border border-amber-400/40'
                : i === 1 ? 'bg-gray-400/10 border border-gray-400/20'
                : i === 2 ? 'bg-amber-800/20 border border-amber-800/30'
                : 'bg-white/5'
            }`}
          >
            <span className={`font-bold text-lg w-7 text-center ${i === 0 ? 'text-amber-300' : i < 3 ? 'text-white/70' : 'text-white/30'}`}>
              {rankBadge(i)}
            </span>
            <span className="flex-1 text-left font-medium truncate" style={{ color: isHighlight ? '#fcd34d' : 'white' }}>
              {entry.name}
              {isHighlight && <span className="ml-1 text-xs text-amber-300/80">(you)</span>}
            </span>
            <span className="text-white/50 text-xs">Lv.{entry.level}</span>
            <span className="text-amber-300 font-bold">{entry.score}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function GameClient() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [spotlights, setSpotlights] = useState<Spotlight[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [hits, setHits] = useState(0);
  const [combo, setCombo] = useState(0);
  const [popups, setPopups] = useState<{ id: string; x: number; y: number; text: string }[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [playerPhone, setPlayerPhone] = useState('');
  const [namePending, setNamePending] = useState(false);
  const [shake, setShake] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizTimePerQuestion, setQuizTimePerQuestion] = useState(10);
  const [isMuted, setIsMuted] = useState(false);
  const [comboAnimatingAt, setComboAnimatingAt] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [lifeLostPrompt, setLifeLostPrompt] = useState(false);
  const usedQuestionIdsRef = useRef<Set<string>>(new Set()); // tracks questions across whole game

  // Global leaderboard state
  const [globalScores, setGlobalScores] = useState<GameScore[]>([]);
  const [scoresLoading, setScoresLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastSubmittedName, setLastSubmittedName] = useState('');

  const stageRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef({
    running: false,
    score: 0,
    lives: 3,
    level: 1,
    hits: 0,
    combo: 0,
    spawnTimer: null as ReturnType<typeof setTimeout> | null,
    tickTimer: null as ReturnType<typeof setInterval> | null,
  });

  // ── Fetch global scores ────────────────────────────────────────────────
  const fetchScores = useCallback(async () => {
    setScoresLoading(true);
    try {
      console.log('Fetching game scores...');
      const scores = await getTopGameScores(10);
      console.log('Fetched scores:', scores);
      setGlobalScores(scores);
    } catch (err) {
      console.error('Failed to fetch scores:', err);
      // silently fail — no scores shown
    } finally {
      setScoresLoading(false);
    }
  }, []);

  // Detect mobile on mount
  useEffect(() => {
    const isTouchDevice = () => {
      return (
        (typeof window !== 'undefined' && ('ontouchstart' in window)) ||
        (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0)
      );
    };
    setIsMobile(isTouchDevice());
  }, []);

  useEffect(() => {
    fetchScores();
    return () => {
      if (gameRef.current.spawnTimer) clearTimeout(gameRef.current.spawnTimer);
      if (gameRef.current.tickTimer) clearInterval(gameRef.current.tickTimer);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Countdown after quiz before resuming game ─────────────────────────
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;

    const timer = setTimeout(() => {
      if (countdown === 1) {
        // Resume the game! Clear stale spotlights first — they've all expired
        // during the quiz + countdown period, and the first tick would otherwise
        // immediately detect them as expired and trigger another quiz.
        setSpotlights([]);
        setCountdown(null);
        gameRef.current.running = true;
        spawnSpotlight();
        scheduleSpawn();
        gameRef.current.tickTimer = setInterval(tick, 80);
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Spawn a spotlight ──────────────────────────────────────────────────
  const spawnSpotlight = useCallback(() => {
    if (!gameRef.current.running) return;
    setSpotlights((prev) => {
      const cfg = getLevelConfig(gameRef.current.level);
      if (prev.length >= cfg.maxSimultaneous) return prev;
      const { x, y } = randomSpot(prev, 100, 100, isMobile);
      // Spotlights with reduced size
      const baseSize = isMobile ? 55 : 40;
      const sizeVariance = isMobile ? 12 : 16;
      const size = baseSize + Math.random() * sizeVariance;
      return [
        ...prev,
        { id: `${Date.now()}-${Math.random()}`, x, y, born: Date.now(), lifetime: cfg.lifetime, size },
      ];
    });
  }, [isMobile]);

  const scheduleSpawn = useCallback(() => {
    if (!gameRef.current.running) return;
    const cfg = getLevelConfig(gameRef.current.level);
    gameRef.current.spawnTimer = setTimeout(() => {
      spawnSpotlight();
      scheduleSpawn();
    }, cfg.spawnInterval);
  }, [spawnSpotlight]);

  // ── Tick: remove expired spotlights → show quiz to save life ───────────
  const tick = useCallback(() => {
    if (!gameRef.current.running) return;
    setSpotlights((prev) => {
      const now = Date.now();
      const expired = prev.filter((s) => now - s.born >= s.lifetime);
      if (expired.length > 0) {
        soundManager.playMiss();
        triggerHaptic('heavy'); // Strong haptic for miss
        gameRef.current.combo = 0;
        setCombo(0);
        setShake(true);
        setTimeout(() => setShake(false), 500);

        // Show quiz to try to save one life
        if (gameRef.current.lives > 0) {
          // Pause the game
          gameRef.current.running = false;
          if (gameRef.current.spawnTimer) clearTimeout(gameRef.current.spawnTimer);
          if (gameRef.current.tickTimer) clearInterval(gameRef.current.tickTimer);

          // 1st life lost → 1 question (10s), 2nd → 2 questions (8s), 3rd → 3 questions (5s)
          const lifeBeingLost = 4 - gameRef.current.lives;
          const questionsNeeded = lifeBeingLost;
          const timePerQ = 10;

          // Pick unused questions; reset pool if not enough unused ones left
          const available = ALL_QUESTIONS.filter(q => !usedQuestionIdsRef.current.has(q.id));
          const pool = available.length >= questionsNeeded ? available : ALL_QUESTIONS;
          const selected = [...pool].sort(() => Math.random() - 0.5).slice(0, questionsNeeded);
          selected.forEach(q => usedQuestionIdsRef.current.add(q.id));

          setQuizQuestions(selected);
          setQuizTimePerQuestion(timePerQ);
          setLifeLostPrompt(true);
          setTimeout(() => {
            setLifeLostPrompt(false);
            setQuizOpen(true);
          }, 2500);
        } else {
          gameRef.current.running = false;
          setTimeout(() => endGame(), 300);
        }
      }
      return prev.filter((s) => now - s.born < s.lifetime);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleQuizCorrect = () => {
    // Correct answer: save 1 life, show countdown before resuming
    setQuizOpen(false);
    setCountdown(3);

    // Ensure state is synced with gameRef before pausing
    console.log('Quiz correct - Current game state:', {
      score: gameRef.current.score,
      level: gameRef.current.level,
      lives: gameRef.current.lives,
    });

    // Sync React state with gameRef
    setScore(gameRef.current.score);
    setLevel(gameRef.current.level);
    setLives(gameRef.current.lives);
  };

  const handleQuizIncorrect = () => {
    // Incorrect answer: lose 1 life
    const newLives = Math.max(0, gameRef.current.lives - 1);
    gameRef.current.lives = newLives;
    setLives(newLives);

    console.log('Quiz incorrect - Current game state:', {
      score: gameRef.current.score,
      level: gameRef.current.level,
      lives: newLives,
    });

    setQuizOpen(false);

    if (newLives <= 0) {
      gameRef.current.running = false;
      setTimeout(() => endGame(), 300);
    } else {
      // Show countdown before resuming
      setCountdown(3);
  
      // Sync state
      setScore(gameRef.current.score);
      setLevel(gameRef.current.level);
    }
  };

  // ── Hit a spotlight ────────────────────────────────────────────────────
  const hitSpotlight = useCallback((id: string, x: number, y: number) => {
    if (!gameRef.current.running) return;
    setShowTutorial(false); // dismiss tutorial on first hit
    const cfg = getLevelConfig(gameRef.current.level);

    gameRef.current.combo += 1;
    const multiplier = Math.min(gameRef.current.combo, 5);
    const pts = cfg.scorePerHit * multiplier;
    gameRef.current.score += pts;
    gameRef.current.hits += 1;
    setScore(gameRef.current.score);
    setCombo(gameRef.current.combo);

    // Play sound and haptic - use multiplier-specific sound
    if (multiplier > 1) {
      soundManager.playComboX(multiplier);
      triggerHaptic('heavy'); // Strong vibration for combos
      setComboAnimatingAt(Date.now());
    } else {
      soundManager.playHit();
      triggerHaptic('light'); // Light vibration for hit
    }

    const popupText = multiplier > 1 ? `${multiplier}x COMBO! +${pts}` : `+${pts}`;
    const popupId = `${Date.now()}-${Math.random()}`;
    setPopups((prev) => [...prev, { id: popupId, x, y, text: popupText }]);
    setTimeout(() => setPopups((prev) => prev.filter((p) => p.id !== popupId)), 900);

    setSpotlights((prev) => prev.filter((s) => s.id !== id));

    if (gameRef.current.hits >= cfg.hitsToLevel) {
      gameRef.current.hits = 0;
      gameRef.current.level += 1;
      soundManager.playLevelUp();
      triggerHaptic('heavy'); // Haptic for level up
      setLevel(gameRef.current.level);
    }
    setHits(gameRef.current.hits);
  }, []);

  // ── Start / End ────────────────────────────────────────────────────────
  const startGame = () => {
    gameRef.current = { running: true, score: 0, lives: 3, level: 1, hits: 0, combo: 0, spawnTimer: null, tickTimer: null };
    usedQuestionIdsRef.current = new Set(); // reset question tracker for new game
    setScore(0); setLives(3); setLevel(1); setHits(0); setCombo(0);
    setSpotlights([]);
    setPopups([]);
    setLastSubmittedName('');
    setShowTutorial(true);
    setScreen('playing');
    setTimeout(() => {
      spawnSpotlight();
      scheduleSpawn();
      gameRef.current.tickTimer = setInterval(tick, 80);
    }, 300);
    // Auto-dismiss tutorial after 3 seconds
    setTimeout(() => setShowTutorial(false), 3000);
  };

  const endGame = useCallback(() => {
    if (gameRef.current.spawnTimer) clearTimeout(gameRef.current.spawnTimer);
    if (gameRef.current.tickTimer) clearInterval(gameRef.current.tickTimer);
    soundManager.playGameOver();
    setSpotlights([]);
    setScreen('gameover');
    setNamePending(true);
  }, []);

  const submitScore = async () => {
    const name = playerName.trim() || 'Anonymous';
    const phone = playerPhone.trim();
    setSubmitting(true);
    try {
      console.log('Submitting score:', { name, phone, score: gameRef.current.score, level: gameRef.current.level });
      await submitGameScore({
        name,
        phone: phone || undefined,
        score: gameRef.current.score,
        level: gameRef.current.level,
      });
      console.log('Score submitted successfully');
      setLastSubmittedName(name);
    } catch (err) {
      console.error('Failed to submit score:', err);
      // still proceed even if submission fails
    } finally {
      setSubmitting(false);
    }
    setNamePending(false);
    // refresh leaderboard then show it
    await fetchScores();
    setScreen('leaderboard');
  };

  const goToLeaderboard = async () => {
    await fetchScores();
    setScreen('leaderboard');
  };

  const handleToggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    soundManager.setMuted(newMutedState);
  };

  // Haptic feedback for hits (if supported by device)
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 30,
        heavy: 50,
      };
      navigator.vibrate(patterns[type]);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100svh-4rem)] md:min-h-[calc(100svh-5rem)] bg-black flex flex-col items-center justify-center overflow-hidden select-none" style={{ touchAction: 'manipulation' }}>

      {/* ── MENU ── */}
      {screen === 'menu' && (
        <div className="flex flex-col items-center gap-4 md:gap-6 px-4 md:px-6 py-4 md:py-6 text-center z-10 w-full max-w-sm max-h-screen overflow-y-auto">
          <div className="text-5xl animate-pulse">🎭</div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-amber-300 mb-1" style={{ fontFamily: 'var(--font-heading)', textShadow: '0 0 30px #fbbf24' }}>
              Spotlight!
            </h1>
            <p className="text-white/60 text-xs">A Gramakam Theatre Game</p>
          </div>
          <Image src="/images/gramakam-logo-white.png" alt="Gramakam" width={80} height={80} className="opacity-60" />
          <div className="bg-white/5 rounded-2xl p-3 max-w-xs text-left space-y-2 text-xs text-white/70">
            <p className="text-white font-semibold text-center mb-1 text-sm">How to play</p>
            <p>🔦 Tap spotlights before they fade</p>
            <p>💥 Chain hits for combo multipliers</p>
            <p>❤️ 3 lives — miss 3 and it&apos;s over</p>
            <p>⚡ Each level gets faster</p>
          </div>
          <button
            onClick={startGame}
            className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold px-10 py-4 rounded-2xl text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-400/30"
          >
            Let the Show Begin!
          </button>

          {/* Global leaderboard preview on menu */}
          <div className="w-full">
            <div className="flex items-center justify-center gap-2 mb-3">
              <span className="text-amber-300 text-sm font-semibold uppercase tracking-wider">Global Top 10</span>
            </div>
            <LeaderboardList scores={globalScores} loading={scoresLoading} />
          </div>
        </div>
      )}

      {/* ── PLAYING ── */}
      {screen === 'playing' && (
        <div className="w-full h-[calc(100svh-4rem)] md:h-[calc(100svh-5rem)] relative overflow-hidden select-none">

          {/* Stage background */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 100%, #1a0a00 0%, #0a0500 50%, #000 100%)',
            }}
          />

          {/* Stage floor lines */}
          <div className="absolute bottom-0 left-0 right-0 h-24 opacity-20">
            {[0, 8, 16, 24].map((i) => (
              <div key={i} className="absolute w-full border-t border-amber-900/60" style={{ bottom: `${i}px` }} />
            ))}
          </div>

          {/* Left curtain */}
          <div
            className="absolute top-0 left-0 w-16 md:w-24 h-full"
            style={{
              background: 'linear-gradient(to right, #4a0000 0%, #2a0000 60%, transparent 100%)',
              boxShadow: 'inset -20px 0 40px rgba(0,0,0,0.5)',
            }}
          />
          {/* Right curtain */}
          <div
            className="absolute top-0 right-0 w-16 md:w-24 h-full"
            style={{
              background: 'linear-gradient(to left, #4a0000 0%, #2a0000 60%, transparent 100%)',
              boxShadow: 'inset 20px 0 40px rgba(0,0,0,0.5)',
            }}
          />

          {/* Top arch / proscenium */}
          <div
            className="absolute top-0 left-0 right-0 h-12"
            style={{ background: 'linear-gradient(to bottom, #1a0000 0%, transparent 100%)' }}
          />

          {/* Gramakam logo center with dates */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0 flex flex-col items-center gap-4">
            <Image src="/images/gramakam-logo-white.png" alt="" width={220} height={220} className="opacity-25" />
            <p className="text-white/30 text-sm font-semibold tracking-wide">April 18–22</p>
          </div>

          {/* HUD */}
          <div className={`absolute ${isMobile ? 'top-4' : 'top-2'} left-0 right-0 z-20 flex items-center justify-between ${isMobile ? 'px-2 py-2 gap-1' : 'px-4 py-3 gap-4'} transition-transform ${shake ? 'animate-bounce' : ''}`}>
            {/* Score */}
            <div className={`bg-black/60 backdrop-blur-sm rounded-lg ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'} text-center flex-shrink-0`}>
              <p className={`text-white/50 uppercase tracking-wider ${isMobile ? 'text-[7px] leading-tight' : 'text-[9px]'}`}>Score</p>
              <p className={`text-amber-300 font-bold leading-tight ${isMobile ? 'text-base' : 'text-lg'}`}>{score}</p>
            </div>

            {/* Level - center */}
            <div className={`bg-black/60 backdrop-blur-sm rounded-lg ${isMobile ? 'px-2 py-1' : 'px-4 py-2'} text-center flex-grow`}>
              <p className={`text-white/50 uppercase tracking-wider leading-tight ${isMobile ? 'text-[6px]' : 'text-[9px]'}`}>Level</p>
              <p className={`text-amber-300 font-bold leading-tight ${isMobile ? 'text-lg' : 'text-2xl'}`}>{level}</p>
              <div className={`flex gap-0.5 justify-center ${isMobile ? 'mt-0.5' : 'mt-1'}`}>
                {Array.from({ length: getLevelConfig(level).hitsToLevel }).map((_, i) => (
                  <div key={i} className={`${isMobile ? 'h-0.5 w-1.5' : 'h-1 w-2'} rounded-full transition-all ${i < hits % getLevelConfig(level).hitsToLevel ? 'bg-amber-400' : 'bg-white/20'}`} />
                ))}
              </div>
            </div>

            {/* Lives */}
            <div className={`bg-black/60 backdrop-blur-sm rounded-lg ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'} text-center flex-shrink-0`}>
              <p className={`text-white/50 uppercase tracking-wider leading-tight ${isMobile ? 'text-[7px]' : 'text-[9px]'}`}>Lives</p>
              <div className={`flex gap-0.5 mt-0.5`}>
                {[0, 1, 2].map((i) => (
                  <Heart key={i} size={isMobile ? 12 : 14} className={`transition-all ${i < lives ? 'text-red-400 fill-red-400' : 'text-white/20'}`} />
                ))}
              </div>
            </div>

            {/* Mute & Difficulty - right side */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Difficulty Indicator */}
              <div className={`bg-black/60 backdrop-blur-sm rounded-lg ${isMobile ? 'px-1.5 py-1' : 'px-2 py-1.5'} text-center hidden sm:block`}>
                <p className={`text-white/50 uppercase tracking-wider leading-tight ${isMobile ? 'text-[6px]' : 'text-[7px]'}`}>Difficulty</p>
                <div className="flex gap-0.5 mt-0.5">
                  {Array.from({ length: Math.min(level, 5) }).map((_, i) => (
                    <div key={i} className={`w-1 h-2 rounded-full ${i < Math.ceil(level / 3) ? 'bg-red-400' : 'bg-white/20'}`} />
                  ))}
                </div>
              </div>
              
              {/* Mute Button */}
              <button
                onClick={handleToggleMute}
                className={`bg-black/60 backdrop-blur-sm rounded-lg ${isMobile ? 'px-2 py-1' : 'px-3 py-1.5'} hover:bg-black/80 text-white transition-all active:scale-95`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>
            </div>
          </div>

          {/* Combo banner with multiplier */}
          {combo >= 2 && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
              <div className={`bg-gradient-to-r from-amber-500/15 to-red-500/15 border border-amber-400/30 text-white font-bold rounded-full flex items-center gap-1 transition-all transform backdrop-blur-[2px] ${isMobile ? 'px-3 py-1 text-xs' : 'px-5 py-1.5 text-sm'} ${comboAnimatingAt && Date.now() - comboAnimatingAt < 300 ? 'scale-110' : 'scale-100'}`}>
                <Zap size={isMobile ? 11 : 14} className="fill-amber-300 text-amber-300" />
                <span className="text-amber-300">{combo}x</span>
                <span className={`text-amber-200 font-black ${isMobile ? 'text-xs' : 'text-base'}`}>×{Math.min(combo, 5)}</span>
              </div>
            </div>
          )}

          {/* Life lost interstitial — shown before quiz */}
          {lifeLostPrompt && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
              <div className="bg-black/80 backdrop-blur-sm rounded-3xl border-2 border-red-500/50 px-10 py-8 flex flex-col items-center gap-3 text-center mx-4">
                <div className="text-5xl animate-bounce">💔</div>
                <p className="text-red-400 font-bold text-xl">You lost a life!</p>
                <p className="text-white/70 text-sm leading-relaxed">
                  But you get a chance to win it back —<br />answer the question correctly!
                </p>
                <div className="flex gap-1 mt-1">
                  {[0, 1, 2].map((i) => (
                    <Heart key={i} size={16} className={`transition-all ${i < lives ? 'text-red-400 fill-red-400' : 'text-white/20'}`} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Countdown overlay after quiz */}
          {countdown !== null && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none">
              <div className="bg-black/70 backdrop-blur-sm rounded-3xl border-2 border-amber-400/60 px-16 py-10 flex flex-col items-center gap-2">
                <p className="text-white/60 text-sm uppercase tracking-widest">Get Ready!</p>
                <p className="text-7xl font-black text-amber-300 animate-pulse">
                  {countdown > 0 ? countdown : 'START!'}
                </p>
              </div>
            </div>
          )}

          {/* Tutorial: arrow + label anchored to the first real spotlight */}
          {showTutorial && spotlights.length > 0 && (() => {
            const first = spotlights[0];
            // Place label above the spotlight; flip to below if too close to top
            const above = first.y > 25;
            return (
              <div
                className="absolute z-25 pointer-events-none flex flex-col items-center gap-1"
                style={{
                  left: `${first.x}%`,
                  top: `${first.y}%`,
                  transform: 'translateX(-50%)',
                }}
              >
                {above && (
                  <>
                    <p className="text-white font-bold text-sm px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm whitespace-nowrap"
                      style={{ textShadow: '0 0 10px rgba(0,0,0,0.9)' }}>
                      {isMobile ? '👆 Tap this!' : '🖱️ Click this!'}
                    </p>
                    {/* Arrow pointing down to spotlight */}
                    <div className="text-amber-300 text-2xl leading-none" style={{ animation: 'tapBounce 0.6s ease-in-out infinite alternate' }}>▼</div>
                  </>
                )}
                {!above && (
                  <>
                    {/* Arrow pointing up to spotlight */}
                    <div className="text-amber-300 text-2xl leading-none" style={{ animation: 'tapBounce 0.6s ease-in-out infinite alternate' }}>▲</div>
                    <p className="text-white font-bold text-sm px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm whitespace-nowrap"
                      style={{ textShadow: '0 0 10px rgba(0,0,0,0.9)' }}>
                      {isMobile ? '👆 Tap this!' : '🖱️ Click this!'}
                    </p>
                  </>
                )}
              </div>
            );
          })()}

          {/* Stage – interactive area */}
          <div ref={stageRef} className={`absolute inset-0 z-10 ${isMobile ? 'cursor-auto' : 'cursor-crosshair'}`}>
            {spotlights.map((spot) => (
              <SpotlightCircle
                key={spot.id}
                spot={spot}
                onHit={(x, y) => hitSpotlight(spot.id, x, y)}
              />
            ))}

            {popups.map((p) => (
              <div
                key={p.id}
                className="absolute z-30 pointer-events-none font-bold text-amber-300 text-sm whitespace-nowrap"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  transform: 'translate(-50%, -50%)',
                  animation: 'floatUp 0.9s ease-out forwards',
                  textShadow: '0 0 10px #fbbf24',
                }}
              >
                {p.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GAME OVER ── */}
      {screen === 'gameover' && (
        <div className="flex flex-col items-center gap-6 px-6 text-center max-w-sm mx-auto w-full">
          <div className="text-5xl">🎭</div>
          <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
            Curtains Down!
          </h2>
          <div className="flex gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-amber-300">{score}</p>
              <p className="text-white/50 text-sm">Score</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">{level}</p>
              <p className="text-white/50 text-sm">Level</p>
            </div>
          </div>

          {namePending ? (
            <div className="w-full space-y-3">
              <p className="text-white/70 text-sm">Enter your details for the global leaderboard</p>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !submitting && submitScore()}
                placeholder="Your name"
                maxLength={20}
                autoFocus
                disabled={submitting}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center placeholder-white/30 outline-none focus:border-amber-400 transition-colors disabled:opacity-50"
              />
              <input
                type="tel"
                inputMode="tel"
                value={playerPhone}
                onChange={(e) => setPlayerPhone(e.target.value.replace(/[^\d+\s-]/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && !submitting && submitScore()}
                placeholder="Mobile (optional — for prize contact)"
                maxLength={15}
                disabled={submitting}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-center placeholder-white/30 outline-none focus:border-amber-400 transition-colors disabled:opacity-50"
              />
              <p className="text-white/40 text-[11px] leading-relaxed">
                🏆 Top scorers may win prizes. Leave your mobile so we can reach you.
              </p>
              <button
                onClick={submitScore}
                disabled={submitting}
                className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                {submitting ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving…</>
                ) : (
                  <>Save Score <ChevronRight size={18} /></>
                )}
              </button>
              <button
                onClick={() => { setNamePending(false); goToLeaderboard(); }}
                disabled={submitting}
                className="text-white/40 hover:text-white text-sm transition-colors"
              >
                Skip &amp; view leaderboard
              </button>
            </div>
          ) : null}

          {!namePending && (
            <div className="flex gap-3 w-full">
              <button
                onClick={startGame}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:scale-105"
              >
                <RotateCcw size={16} /> Play Again
              </button>
              <button
                onClick={goToLeaderboard}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Trophy size={16} /> Scores
              </button>
            </div>
          )}
          {!namePending && (
            <button onClick={() => setScreen('menu')} className="text-white/40 hover:text-white text-sm transition-colors">
              Back to Menu
            </button>
          )}
        </div>
      )}

      {/* ── LEADERBOARD ── */}
      {screen === 'leaderboard' && (
        <div className="flex flex-col items-center gap-6 px-6 w-full max-w-sm text-center py-10">
          <Trophy size={40} className="text-amber-300" />
          <div>
            <h2 className="text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              Global Leaderboard
            </h2>
            <p className="text-white/40 text-xs mt-1">Top 10 players worldwide</p>
          </div>

          <LeaderboardList
            scores={globalScores}
            loading={scoresLoading}
            highlightName={lastSubmittedName || undefined}
          />

          <div className="flex gap-3 w-full">
            <button
              onClick={startGame}
              className="flex-1 bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <Play size={16} /> Play
            </button>
            <button
              onClick={() => setScreen('menu')}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-all"
            >
              Menu
            </button>
          </div>
        </div>
      )}

      {/* ── Quiz Modal ── */}
      <GameQuiz
        isOpen={quizOpen}
        questions={quizQuestions}
        timePerQuestion={quizTimePerQuestion}
        onCorrect={handleQuizCorrect}
        onIncorrect={handleQuizIncorrect}
      />

      {/* ── Global CSS animation ── */}
      <style jsx global>{`
        @keyframes floatUp {
          0%   { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
          100% { opacity: 0; transform: translate(-50%, -150%) scale(0.8); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.85; }
        }
        @keyframes pop {
          0%   { transform: scale(0.4); opacity: 0; }
          60%  { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1);   opacity: 1; }
        }
        @keyframes pulse-scale {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 20px rgba(251, 191, 36, 0.6); }
          50%      { box-shadow: 0 0 40px rgba(251, 191, 36, 0.9); }
        }
        @keyframes tapBounce {
          0%   { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.3) translate(-4px, -6px); }
        }
      `}</style>
    </div>
  );
}

// ── Spotlight Circle ────────────────────────────────────────────────────────
function SpotlightCircle({ spot, onHit }: { spot: Spotlight; onHit: (x: number, y: number) => void }) {
  const [progress, setProgress] = useState(1);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      const elapsed = Date.now() - spot.born;
      const p = Math.max(0, 1 - elapsed / spot.lifetime);
      setProgress(p);
      if (p > 0) rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafRef.current);
  }, [spot.born, spot.lifetime]);

  const r = spot.size;
  const circumference = 2 * Math.PI * (r - 4);
  const dash = circumference * progress;

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onHit(spot.x, spot.y);
  };

  const hue = Math.round(30 * progress);
  const light = Math.round(55 + 10 * progress);

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        left: `${spot.x}%`,
        top: `${spot.y}%`,
        transform: 'translate(-50%, -50%)',
        animation: 'pop 0.2s ease-out',
        touchAction: 'manipulation',
      }}
      onClick={handleClick}
      onTouchStart={handleClick}
    >
      {/* Glow halo */}
      <div
        style={{
          position: 'absolute',
          inset: `-${r * 0.4}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle, hsla(${hue},100%,${light}%,0.25) 0%, transparent 70%)`,
          animation: 'flicker 0.4s ease-in-out infinite alternate',
          pointerEvents: 'none',
        }}
      />

      {/* Main light circle */}
      <svg width={r * 2} height={r * 2} style={{ overflow: 'visible', display: 'block' }}>
        <defs>
          <radialGradient id={`glow-${spot.id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={`hsl(${hue},100%,${light + 10}%)`} stopOpacity="0.9" />
            <stop offset="60%" stopColor={`hsl(${hue},100%,${light}%)`} stopOpacity="0.6" />
            <stop offset="100%" stopColor={`hsl(${hue},100%,50%)`} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={r} cy={r} r={r - 4} fill={`url(#glow-${spot.id})`} />
        <circle
          cx={r} cy={r} r={r - 4}
          fill="none"
          stroke={`hsl(${hue},100%,${light}%)`}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          strokeDashoffset="0"
          transform={`rotate(-90 ${r} ${r})`}
          style={{ transition: 'stroke 0.1s' }}
        />
        <text
          x={r} y={r + 5}
          textAnchor="middle"
          fontSize={r * 0.55}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
        >
          ✨
        </text>
      </svg>
    </div>
  );
}
