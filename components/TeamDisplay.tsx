'use client';

import { GenerateResult, PlayerWithScore } from '@/lib/types';

interface TeamDisplayProps {
  result: GenerateResult;
  showStats?: boolean;
}

function PlayerRow({ p, index, showStats }: { p: PlayerWithScore; index: number; showStats: boolean }) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-white/5 last:border-0">
      <span className="text-white/30 text-sm w-5 text-right shrink-0">{index + 1}.</span>
      <span className="text-white font-medium text-sm flex-1">
        {p.name}
        {p.isCaptain && <span className="ml-1 text-yellow-400 text-xs">★</span>}
      </span>
      {showStats && (
        <span className="text-white/40 text-xs tabular-nums">
          {p.ovr.toFixed(1)} / {p.composite.toFixed(2)}
        </span>
      )}
    </div>
  );
}

export default function TeamDisplay({ result, showStats = false }: TeamDisplayProps) {
  const { teamA, teamB, balance } = result;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Team A */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
          <h2 className="text-blue-300 font-bold text-base mb-3">Team A</h2>
          {teamA.players.map((p, i) => (
            <PlayerRow key={p.name} p={p} index={i} showStats={showStats} />
          ))}
          {showStats && (
            <p className="mt-3 text-xs text-white/30 tabular-nums">
              OVR avg {teamA.meanOvr.toFixed(2)} · σ {teamA.stdDevOvr.toFixed(2)}
            </p>
          )}
        </div>

        {/* Team B */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <h2 className="text-red-300 font-bold text-base mb-3">Team B</h2>
          {teamB.players.map((p, i) => (
            <PlayerRow key={p.name} p={p} index={i} showStats={showStats} />
          ))}
          {showStats && (
            <p className="mt-3 text-xs text-white/30 tabular-nums">
              OVR avg {teamB.meanOvr.toFixed(2)} · σ {teamB.stdDevOvr.toFixed(2)}
            </p>
          )}
        </div>
      </div>

      {showStats && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white/50 space-y-1 tabular-nums">
          <div className="flex justify-between">
            <span>Mean OVR diff</span>
            <span className={balance.meanDiff <= 0.5 ? 'text-emerald-400' : 'text-red-400'}>
              {balance.meanDiff.toFixed(3)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Std dev diff</span>
            <span className={balance.stdDiff <= 0.3 ? 'text-emerald-400' : 'text-red-400'}>
              {balance.stdDiff.toFixed(3)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Composite diff</span>
            <span>{balance.compositeDiff.toFixed(3)}</span>
          </div>
          <div className="flex justify-between">
            <span>Balance check</span>
            <span className={balance.passed ? 'text-emerald-400' : 'text-red-400'}>
              {balance.passed ? 'PASS' : 'WARN'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
