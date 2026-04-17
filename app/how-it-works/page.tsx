import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'How It Works — Collina' };

const POSITION_WEIGHTS = [
  { position: 'Keeper',   dp: 5,  def: 50, shoot: 0,  pace: 45 },
  { position: 'Defender', dp: 10, def: 45, shoot: 5,  pace: 40 },
  { position: 'Mid',      dp: 40, def: 20, shoot: 25, pace: 15 },
  { position: 'Striker',  dp: 25, def: 5,  shoot: 40, pace: 30 },
];

function Bar({ pct, colour }: { pct: number; colour: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colour}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-white/50 text-xs tabular-nums w-8 text-right">{pct}%</span>
    </div>
  );
}

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/" className="text-white/40 text-sm hover:text-white/60">← Home</Link>
        <h1 className="text-lg font-bold">How It Works</h1>
        <div className="w-16" />
      </div>

      <p className="text-white/50 text-sm leading-relaxed">
        Teams are split by an algorithm — not random, not manual. Here's exactly what it does.
        Individual player ratings are never shown publicly.
      </p>

      {/* Step 1 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-white/10 text-white/60 text-xs flex items-center justify-center font-bold shrink-0">1</span>
          <h2 className="font-bold text-base">Position-Weighted Score</h2>
        </div>
        <p className="text-white/50 text-sm leading-relaxed pl-8">
          Every player has four skill ratings (Dribbling & Passing, Defending, Shooting, Pace).
          Rather than treating all skills equally, the algorithm weights them by position —
          what matters for a Keeper is very different from what matters for a Striker.
        </p>

        <div className="space-y-3 pl-8">
          {POSITION_WEIGHTS.map(({ position, dp, def, shoot, pace }) => (
            <div key={position} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5">
              <p className="font-semibold text-sm">{position}</p>
              <div className="space-y-1.5">
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <span className="text-white/40 text-xs">Dribbling & Pass</span>
                  <Bar pct={dp} colour="bg-blue-400" />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <span className="text-white/40 text-xs">Defending</span>
                  <Bar pct={def} colour="bg-emerald-400" />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <span className="text-white/40 text-xs">Shooting</span>
                  <Bar pct={shoot} colour="bg-red-400" />
                </div>
                <div className="grid grid-cols-[120px_1fr] items-center gap-2">
                  <span className="text-white/40 text-xs">Pace</span>
                  <Bar pct={pace} colour="bg-yellow-400" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Step 2 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-white/10 text-white/60 text-xs flex items-center justify-center font-bold shrink-0">2</span>
          <h2 className="font-bold text-base">Serpentine Draft</h2>
        </div>
        <p className="text-white/50 text-sm leading-relaxed pl-8">
          Within each position group, players are sorted strongest → weakest by their composite score.
          They're then allocated in a snake pattern so no team gets all the top players:
        </p>

        <div className="pl-8 space-y-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <div className="grid grid-cols-9 gap-1 text-center text-xs mb-3">
              {['1st','2nd','3rd','4th','5th','6th','7th','8th','…'].map((n, i) => (
                <div key={i} className="text-white/30">{n}</div>
              ))}
            </div>
            <div className="grid grid-cols-9 gap-1 text-center text-xs">
              {[
                { t: 'A', c: 'bg-blue-500/30 text-blue-300' },
                { t: 'B', c: 'bg-red-500/30 text-red-300' },
                { t: 'B', c: 'bg-red-500/30 text-red-300' },
                { t: 'A', c: 'bg-blue-500/30 text-blue-300' },
                { t: 'A', c: 'bg-blue-500/30 text-blue-300' },
                { t: 'B', c: 'bg-red-500/30 text-red-300' },
                { t: 'B', c: 'bg-red-500/30 text-red-300' },
                { t: 'A', c: 'bg-blue-500/30 text-blue-300' },
                { t: '…', c: 'bg-white/5 text-white/30' },
              ].map(({ t, c }, i) => (
                <div key={i} className={`rounded-lg py-2 font-bold ${c}`}>{t}</div>
              ))}
            </div>
            <p className="text-white/30 text-xs mt-3 text-center">A, B, B, A, A, B, B, A… alternating in pairs</p>
          </div>
          <p className="text-white/40 text-xs pl-1">
            The strongest player and the second strongest go to opposite teams. This repeats across all position groups so the draft always alternates which team picks first.
          </p>
        </div>
      </section>

      {/* Step 3 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-white/10 text-white/60 text-xs flex items-center justify-center font-bold shrink-0">3</span>
          <h2 className="font-bold text-base">Balance Check</h2>
        </div>
        <p className="text-white/50 text-sm leading-relaxed pl-8">
          After the draft, two checks are run on both teams. If either fails, the algorithm
          tries swapping same-position players (up to 3 times) until balance is achieved.
        </p>

        <div className="pl-8 space-y-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <div>
                <p className="text-sm font-semibold">Average rating gap ≤ 0.5</p>
                <p className="text-white/40 text-xs mt-0.5">The mean overall rating of both teams must be within 0.5 points of each other (on a 0–10 scale).</p>
              </div>
            </div>
            <div className="border-t border-white/10" />
            <div className="flex items-start gap-3">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <div>
                <p className="text-sm font-semibold">Spread gap ≤ 0.3</p>
                <p className="text-white/40 text-xs mt-0.5">The standard deviation of ratings within each team must be within 0.3 — so neither team is lopsided with one star and seven passengers.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step 4 */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-white/10 text-white/60 text-xs flex items-center justify-center font-bold shrink-0">4</span>
          <h2 className="font-bold text-base">Learning from Past Games</h2>
        </div>
        <p className="text-white/50 text-sm leading-relaxed pl-8">
          After each game the admin can log the result and add observations. Over time, if a player consistently outperforms or underperforms their rating, the algorithm's weights for that player can be adjusted — so future splits get more accurate with every game played.
        </p>
      </section>

      <div className="border-t border-white/10 pt-4 pb-8">
        <p className="text-white/25 text-xs text-center">
          Individual ratings are private and never shown publicly. Only the algorithm output (the teams) is visible.
        </p>
      </div>

    </main>
  );
}
