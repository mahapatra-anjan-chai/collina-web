'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameRecord } from '@/lib/types';

function resultColour(result: string) {
  const [, aScore, , , bScore] = result.match(/(\d+)\s*-\s*Team B\s*(\d+)/) ?? [];
  if (!aScore) return 'text-white/50';
  return Number(aScore) > Number(bScore)
    ? 'text-blue-300'
    : Number(aScore) < Number(bScore)
      ? 'text-red-300'
      : 'text-yellow-300';
}

function winnerLabel(result: string) {
  const m = result.match(/Team A (\d+) - Team B (\d+)/);
  if (!m) return null;
  const [, a, b] = m;
  if (Number(a) > Number(b)) return { text: 'Team A won', colour: 'bg-blue-500/20 text-blue-300 border-blue-500/30' };
  if (Number(a) < Number(b)) return { text: 'Team B won', colour: 'bg-red-500/20 text-red-300 border-red-500/30' };
  return { text: 'Draw', colour: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' };
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(d => { setHistory(d.history ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const wins = history.filter(g => {
    const m = g.result.match(/Team A (\d+) - Team B (\d+)/);
    return m && Number(m[1]) > Number(m[2]);
  }).length;
  const losses = history.filter(g => {
    const m = g.result.match(/Team A (\d+) - Team B (\d+)/);
    return m && Number(m[1]) < Number(m[2]);
  }).length;
  const draws = history.length - wins - losses;

  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-white/40 text-sm hover:text-white/60">
          ← Home
        </button>
        <h1 className="text-lg font-bold">Match History</h1>
        <div className="w-16" />
      </div>

      {/* Post-Game banner */}
      <button
        onClick={() => router.push('/postgame')}
        className="w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 flex items-center justify-between hover:bg-white/10 active:scale-95 transition-all"
      >
        <div className="text-left">
          <p className="font-semibold text-sm text-white">📝 Log Post-Game Result</p>
          <p className="text-white/40 text-xs mt-0.5">Submit the score after today's game</p>
        </div>
        <span className="text-white/30 text-lg">→</span>
      </button>

      {loading ? (
        <p className="text-white/30 text-sm text-center pt-12">Loading…</p>
      ) : history.length === 0 ? (
        <div className="text-center pt-12 space-y-2">
          <p className="text-white/40">No games recorded yet.</p>
          <p className="text-white/25 text-sm">Results will appear here after each game.</p>
        </div>
      ) : (
        <>
          {/* Season summary */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-white/40 text-xs mb-3">Last 12 months — {history.length} game{history.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-blue-500/10 rounded-xl py-3">
                <p className="text-2xl font-bold text-blue-300">{wins}</p>
                <p className="text-blue-400/60 text-xs mt-0.5">Team A wins</p>
              </div>
              <div className="bg-yellow-500/10 rounded-xl py-3">
                <p className="text-2xl font-bold text-yellow-300">{draws}</p>
                <p className="text-yellow-400/60 text-xs mt-0.5">Draws</p>
              </div>
              <div className="bg-red-500/10 rounded-xl py-3">
                <p className="text-2xl font-bold text-red-300">{losses}</p>
                <p className="text-red-400/60 text-xs mt-0.5">Team B wins</p>
              </div>
            </div>
          </div>

          {/* Game cards */}
          <div className="space-y-3">
            {history.map((game, i) => {
              const label = winnerLabel(game.result);
              const isOpen = expanded === i;
              return (
                <button
                  key={i}
                  onClick={() => setExpanded(isOpen ? null : i)}
                  className="w-full text-left bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/8 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-white/40 text-xs">
                        {new Date(game.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                      {label && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${label.colour}`}>
                          {label.text}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-base font-bold tabular-nums ${resultColour(game.result)}`}>
                        {game.result.replace('Team A ', '').replace('Team B ', '')}
                      </p>
                      <span className="text-white/20 text-xs">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                      {/* Teams */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-blue-500/10 rounded-xl p-2.5">
                          <p className="text-blue-300 font-semibold mb-1.5">Team A</p>
                          {game.teamA.map(n => <p key={n} className="text-white/60 py-0.5">{n}</p>)}
                        </div>
                        <div className="bg-red-500/10 rounded-xl p-2.5">
                          <p className="text-red-300 font-semibold mb-1.5">Team B</p>
                          {game.teamB.map(n => <p key={n} className="text-white/60 py-0.5">{n}</p>)}
                        </div>
                      </div>
                      {/* Notes */}
                      {game.notes && game.notes !== 'No observations recorded.' && (
                        <p className="text-white/50 text-xs leading-relaxed border-t border-white/10 pt-3">
                          📝 {game.notes}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </main>
  );
}
