'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TeamDisplay from '@/components/TeamDisplay';
import WhatsAppCopy from '@/components/WhatsAppCopy';
import { GenerateResult } from '@/lib/types';

export default function TeamsPage() {
  const router = useRouter();
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [official, setOfficial] = useState<{ teamA: string[]; teamB: string[]; generatedAt: string } | null>(null);
  const [showOfficial, setShowOfficial] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('collinaResult');
    if (stored) {
      setResult(JSON.parse(stored));
    }

    // Fetch official teams in background
    fetch('/api/official')
      .then(r => r.json())
      .then(data => {
        if (data.teams) setOfficial(data.teams);
      })
      .catch(() => {});
  }, []);

  if (!result) {
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

  // Build a fake result from official names for display
  const officialResult = official && showOfficial
    ? buildOfficialDisplay(official)
    : null;

  const displayResult = officialResult ?? result;

  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-white/40 text-sm hover:text-white/60">
          ← Back
        </button>
        <h1 className="text-lg font-bold">Teams</h1>
        <div className="w-12" />
      </div>

      {/* Official toggle if available */}
      {official && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between">
          <p className="text-amber-300 text-xs">
            Official teams published {new Date(official.generatedAt).toLocaleDateString()}
          </p>
          <button
            onClick={() => setShowOfficial(v => !v)}
            className="text-xs text-amber-300 underline"
          >
            {showOfficial ? 'Show mine' : 'Show official'}
          </button>
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
function buildOfficialDisplay(official: { teamA: string[]; teamB: string[] }): GenerateResult {
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
