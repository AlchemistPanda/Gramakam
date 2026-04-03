'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Zap, ArrowRight, Loader2 } from 'lucide-react';
import { getTopGameScores } from '@/lib/services';
import type { GameScore } from '@/types';

function rankBadge(i: number) {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return `${i + 1}.`;
}

export default function GameLeaderboard() {
  const [scores, setScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      try {
        const data = await getTopGameScores(5);
        setScores(data);
      } catch {
        setScores([]);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  return (
    <section className="relative section-padding bg-gradient-to-br from-charcoal via-charcoal to-black overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="container-custom relative z-10">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Trophy size={28} className="text-amber-400" />
              <p className="text-amber-400 uppercase tracking-[0.2em] text-sm font-semibold">Play & Compete</p>
            </div>
            <h2 className="heading-lg text-cream mb-2">Spotlight Game Leaderboard</h2>
            <p className="text-white/60 text-lg">Join the competition and see if you can top the charts!</p>
          </div>

          {/* Leaderboard */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={32} className="text-amber-400 animate-spin" />
              <p className="text-white/50 text-sm">Loading scores…</p>
            </div>
          ) : scores.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/60 mb-6">Be the first to play and claim the top spot!</p>
              <Link
                href="/game"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold px-8 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95"
              >
                <Zap size={18} /> Start Playing Now
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2 mb-8">
                {scores.map((entry, i) => (
                  <div
                    key={entry.id}
                    className={`flex items-center gap-4 px-6 py-4 rounded-xl backdrop-blur-sm transition-all ${
                      i === 0
                        ? 'bg-amber-400/20 border border-amber-400/40 transform scale-[1.02]'
                        : i === 1
                          ? 'bg-gray-400/10 border border-gray-400/20'
                          : i === 2
                            ? 'bg-amber-800/20 border border-amber-800/30'
                            : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    <span className={`text-2xl font-bold w-12 text-center ${i === 0 ? 'text-amber-300' : i < 3 ? 'text-white/70' : 'text-white/40'}`}>
                      {rankBadge(i)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold truncate text-lg">{entry.name}</p>
                      <p className="text-white/50 text-xs">Level {entry.level}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-3xl font-bold ${i === 0 ? 'text-amber-300' : 'text-white'}`}>{entry.score}</p>
                      <p className="text-white/30 text-xs">points</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <div className="text-center">
                <Link
                  href="/game"
                  className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold px-8 py-4 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-400/30"
                >
                  <Zap size={18} /> Play Now &amp; Beat These Scores <ArrowRight size={16} />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
