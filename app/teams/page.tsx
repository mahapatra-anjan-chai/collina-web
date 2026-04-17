'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TeamDisplay from '@/components/TeamDisplay';
import WhatsAppCopy from '@/components/WhatsAppCopy';
import { GenerateResult } from '@/lib/types';

type OfficialData = { teamA: string[]; teamB: string[]; generatedAt: string };

export default function TeamsPage() {
  const router = useRouter();
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [official, setOfficial] = useState<OfficialData | null>(null);
  // 'mine' | 'official'
  const [viewing, setViewing] = useState<'mine' | 'official'>('mine');

  useEffect(() => {
    const stored = sessionStorage.getItem('collinaResult');
    if (stored) setResult(JSON.parse(stored));

    fetch('/api/official')
      .then(r => r.json())
      .then(data => { if (data.teams) setOfficial(data.teams); })
      .catch(() => {});
  }, []);

  // No session result — redirect to picker or show stub
  if (!result && viewing !== 'official') {
    // If there are official teams, default to showing those
    if (official) {
      setViewing('official');
    } else {
      return (
        <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
          <p className="text-white/40">No teams generated yet.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20"
          >
            ← Pick Players
          </button>
        </main>
      );
    }
  }

  const displayResult: GenerateResult =
    viewing === 'official' && official
      ? buildOfficialDisplay(official)
      : result!;

  const isFinal = viewing === 'official' && official !== null;

  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-white/40 text-sm hover:text-white/60">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">Teams</h1>
          {isFinal && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-black">
              ✓ FINAL
            </span>
          )}
        </div>
        <div className="w-12" />
      </div>

      {/* Official / Mine toggle */}
      {official && result && (
        <div className="flex rounded-xl overflow-hidden border border-white/10 text-sm font-medium">
          <button
            onClick={() => setViewing('mine')}
            className={`flex-1 py-2.5 transition-colors ${
              viewing === 'mine'
                ? 'bg-white/10 text-white'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            My Generation
          </button>
          <button
            onClick={() => setViewing('official')}
            className={`flex-1 py-2.5 transition-colors flex items-center justify-center gap-1.5 ${
              viewing === 'official'
                ? 'bg-emerald-500/20 text-emerald-300'
                : 'text-white/30 hover:text-white/50'
            }`}
          >
            <span>✓ Final Teams</span>
          </button>
        </div>
      )}

      {/* Official-only banner when no local result */}
      {official && !result && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
          <p className="text-emerald-300 text-xs font-semibold">
            ✓ Official teams published {new Date(official.generatedAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {/* Teams */}
      <TeamDisplay result={displayResult} showStats={false} />

      {/* Actions */}
      <WhatsAppCopy result={displayResult} />

      <button
        onClick={() => router.push('/')}
        className="w-full py-3 rounded-2xl border border-white/10 text-white/50 text-sm hover:bg-white/5"
      >
        Regenerate
      </button>
    </main>
  );
}

// Minimal GenerateResult shell from plain name arrays (no stats — public view)
function buildOfficialDisplay(official: OfficialData): GenerateResult {
  const toPlayers = (names: string[]) =>
    names.map(name => ({
      name,
      position: 'Mid' as const,
      dp: 0, defending: 0, shooting: 0, pace: 0,
      ovr: 0, composite: 0,
    }));

  return {
    teamA: {
      name: 'Team A',
      players: toPlayers(official.teamA),
      meanOvr: 0, stdDevOvr: 0, totalComposite: 0,
    },
    teamB: {
      name: 'Team B',
      players: toPlayers(official.teamB),
      meanOvr: 0, stdDevOvr: 0, totalComposite: 0,
    },
    balance: { meanDiff: 0, stdDiff: 0, compositeDiff: 0, swapsPerformed: 0, passed: true },
  };
}
