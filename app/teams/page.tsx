'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import WhatsAppCopy from '@/components/WhatsAppCopy';
import { GenerateResult } from '@/lib/types';

async function shareTeamsImage() {
  const res = await fetch('/api/share-image');
  if (!res.ok) throw new Error('Image not available');
  const blob = await res.blob();
  const file = new File([blob], 'collina-teams.png', { type: 'image/png' });

  if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: 'Final Teams' });
  } else {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'collina-teams.png';
    a.click();
    URL.revokeObjectURL(url);
  }
}

type Selection = { team: 'A' | 'B'; idx: number } | null;

export default function TeamsPage() {
  const router = useRouter();

  const [teamA, setTeamA] = useState<string[]>([]);
  const [teamB, setTeamB] = useState<string[]>([]);
  const [locked, setLocked] = useState(false);
  const [lockedAt, setLockedAt] = useState<string | null>(null);
  const [lastSuggested, setLastSuggested] = useState<string | null>(null);

  const [selected, setSelected] = useState<Selection>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [suggestMsg, setSuggestMsg] = useState('');
  const [loading, setLoading] = useState(true);

  const [isPending, startTransition] = useTransition();
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');

  useEffect(() => {
    async function load(isBackground = false) {
      const [officialRes, suggestedRes] = await Promise.all([
        fetch('/api/official', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
        fetch('/api/suggested', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
      ]);

      // 1. Check if official teams are locked
      if (officialRes.teams?.locked) {
        setTeamA(officialRes.teams.teamA);
        setTeamB(officialRes.teams.teamB);
        setLocked(true);
        setLockedAt(officialRes.teams.generatedAt);
        if (!isBackground) setLoading(false);
        return;
      }

      // 2. Load latest suggested from KV (so everyone sees the same latest)
      if (suggestedRes.teams) {
        setTeamA(suggestedRes.teams.teamA);
        setTeamB(suggestedRes.teams.teamB);
        setLastSuggested(suggestedRes.teams.suggestedAt);
        if (!isBackground) setLoading(false);
        return;
      }

      // 3. Fall back to this session's local result and auto-save to KV so others see the banner
      if (!isBackground) {
        const stored = sessionStorage.getItem('collinaResult');
        if (stored) {
          const result: GenerateResult = JSON.parse(stored);
          const names = {
            teamA: result.teamA.players.map(p => p.name),
            teamB: result.teamB.players.map(p => p.name),
          };
          setTeamA(names.teamA);
          setTeamB(names.teamB);
          // Auto-save so the banner appears for everyone immediately
          fetch('/api/suggested', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(names),
          }).then(r => {
            if (r.ok) setLastSuggested(new Date().toISOString());
          }).catch(() => {});
        }
        setLoading(false);
      }
    }

    load();

    // Poll every 15s so open tabs auto-update when manager locks or someone suggests
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, []);

  function handleTap(team: 'A' | 'B', idx: number) {
    if (locked) return;

    // Nothing selected yet — select this player
    if (!selected) {
      setSelected({ team, idx });
      return;
    }

    // Tapped the same player — deselect
    if (selected.team === team && selected.idx === idx) {
      setSelected(null);
      return;
    }

    // Tapped someone on the same team — move selection
    if (selected.team === team) {
      setSelected({ team, idx });
      return;
    }

    // Tapped someone on the other team — swap!
    const newA = [...teamA];
    const newB = [...teamB];
    const aIdx = selected.team === 'A' ? selected.idx : idx;
    const bIdx = selected.team === 'B' ? selected.idx : idx;

    const temp = newA[aIdx];
    newA[aIdx] = newB[bIdx];
    newB[bIdx] = temp;

    setTeamA(newA);
    setTeamB(newB);
    setSelected(null);
    setIsDirty(true);
    setSuggestMsg('');
  }

  function handleSuggest() {
    startTransition(async () => {
      const res = await fetch('/api/suggested', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamA, teamB }),
      });
      if (res.status === 423) {
        setSuggestMsg('Teams have been locked by admin — no more changes');
        setLocked(true);
        return;
      }
      if (!res.ok) {
        setSuggestMsg('Failed to save — try again');
        return;
      }
      setIsDirty(false);
      setLastSuggested(new Date().toISOString());
      setSuggestMsg('');
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 3000);
    });
  }

  // Build a minimal GenerateResult for WhatsAppCopy
  function buildResult(): GenerateResult {
    const toPlayers = (names: string[]) =>
      names.map(name => ({
        name, position: 'Mid' as const,
        dp: 0, defending: 0, shooting: 0, pace: 0,
        ovr: 0, composite: 0,
      }));
    return {
      teamA: { name: 'Team A', players: toPlayers(teamA), meanOvr: 0, stdDevOvr: 0, totalComposite: 0 },
      teamB: { name: 'Team B', players: toPlayers(teamB), meanOvr: 0, stdDevOvr: 0, totalComposite: 0 },
      balance: { meanDiff: 0, stdDiff: 0, compositeDiff: 0, swapsPerformed: 0, passed: true },
    };
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-white/30 text-sm">Loading teams…</p>
      </main>
    );
  }

  if (teamA.length === 0) {
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

  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/')} className="text-white/40 text-sm hover:text-white/60">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold">Teams</h1>
          {locked && (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-black">
              ✓ FINAL
            </span>
          )}
        </div>
        <div className="w-12" />
      </div>

      {/* Status banner */}
      {locked ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3">
          <div className="text-center">
            <p className="text-emerald-300 text-sm font-semibold">These are the official final teams</p>
            {lockedAt && (
              <p className="text-emerald-400/60 text-xs mt-0.5">
                Locked · {new Date(lockedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          <button
            onClick={async () => {
              setShareLoading(true);
              setShareError('');
              try {
                await shareTeamsImage();
              } catch {
                setShareError('Could not generate image — try again');
              } finally {
                setShareLoading(false);
              }
            }}
            disabled={shareLoading}
            className="mt-3 w-full py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-sm active:scale-95 transition-all disabled:opacity-60 hover:bg-emerald-400"
          >
            {shareLoading ? 'Generating…' : '⬇ Save as Image'}
          </button>
          {shareError && (
            <p className="text-red-400 text-xs text-center mt-1.5">{shareError}</p>
          )}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
          {selected ? (
            <p className="text-yellow-300 text-xs text-center">
              <span className="font-semibold">{selected.team === 'A' ? teamA[selected.idx] : teamB[selected.idx]}</span>
              {' '}selected — tap someone on the other team to swap
            </p>
          ) : (
            <p className="text-white/40 text-xs text-center">
              Tap a player to select, then tap someone on the other team to swap them
            </p>
          )}
        </div>
      )}

      {/* Team columns */}
      <div className="grid grid-cols-2 gap-3">
        {/* Team A */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3">
          <h2 className="text-blue-300 font-bold text-sm mb-2">Team A</h2>
          {teamA.map((name, i) => {
            const isSelected = selected?.team === 'A' && selected.idx === i;
            const isSwapTarget = selected?.team === 'B';
            return (
              <button
                key={`a-${i}`}
                onClick={() => handleTap('A', i)}
                disabled={locked}
                className={`
                  w-full text-left px-2.5 py-2 rounded-lg text-sm mb-1 last:mb-0 transition-all
                  ${locked ? 'cursor-default text-white/80' : 'cursor-pointer'}
                  ${isSelected
                    ? 'bg-yellow-400/20 border border-yellow-400/50 text-yellow-200 font-semibold'
                    : isSwapTarget
                      ? 'bg-blue-400/10 border border-blue-400/30 text-white hover:bg-blue-400/20'
                      : 'text-white/80 hover:bg-white/5'
                  }
                `}
              >
                <span className="text-white/30 text-xs mr-1.5">{i + 1}.</span>
                {name}
              </button>
            );
          })}
        </div>

        {/* Team B */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3">
          <h2 className="text-red-300 font-bold text-sm mb-2">Team B</h2>
          {teamB.map((name, i) => {
            const isSelected = selected?.team === 'B' && selected.idx === i;
            const isSwapTarget = selected?.team === 'A';
            return (
              <button
                key={`b-${i}`}
                onClick={() => handleTap('B', i)}
                disabled={locked}
                className={`
                  w-full text-left px-2.5 py-2 rounded-lg text-sm mb-1 last:mb-0 transition-all
                  ${locked ? 'cursor-default text-white/80' : 'cursor-pointer'}
                  ${isSelected
                    ? 'bg-yellow-400/20 border border-yellow-400/50 text-yellow-200 font-semibold'
                    : isSwapTarget
                      ? 'bg-red-400/10 border border-red-400/30 text-white hover:bg-red-400/20'
                      : 'text-white/80 hover:bg-white/5'
                  }
                `}
              >
                <span className="text-white/30 text-xs mr-1.5">{i + 1}.</span>
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit button — always visible when not locked */}
      {!locked && (
        <div className="space-y-2">
          {suggestMsg && (
            <p className="text-red-400 text-sm text-center">{suggestMsg}</p>
          )}
          <button
            onClick={handleSuggest}
            disabled={isPending || justSubmitted}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm active:scale-95 transition-all
              ${justSubmitted
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-default'
                : 'bg-white text-black hover:bg-white/90'
              }`}
          >
            {isPending ? 'Submitting…' : justSubmitted ? '✓ Submitted for manager approval' : isDirty ? 'Re-submit Updated Teams' : 'Submit for Manager Approval'}
          </button>
          {lastSuggested && !isDirty && !justSubmitted && (
            <p className="text-white/25 text-xs text-center">
              Last submitted {new Date(lastSuggested).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      )}

      {/* WhatsApp copy */}
      <WhatsAppCopy result={buildResult()} />

      {locked ? (
        <button
          onClick={() => router.push('/postgame')}
          className="w-full py-3 rounded-2xl bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/15 active:scale-95 transition-all"
        >
          Log Result →
        </button>
      ) : (
        <button
          onClick={() => router.push('/')}
          className="w-full py-3 rounded-2xl border border-white/10 text-white/50 text-sm hover:bg-white/5"
        >
          Regenerate from scratch
        </button>
      )}

    </main>
  );
}
