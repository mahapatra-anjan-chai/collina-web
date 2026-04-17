'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { OfficialTeams, PendingPostgame, GameRecord } from '@/lib/types';

type PageState = 'loading' | 'no-teams' | 'form' | 'pending' | 'approved';

export default function PostgamePage() {
  const router = useRouter();

  const [pageState, setPageState] = useState<PageState>('loading');
  const [official, setOfficial] = useState<OfficialTeams | null>(null);
  const [pending, setPending] = useState<PendingPostgame | null>(null);
  const [latestResult, setLatestResult] = useState<GameRecord | null>(null);

  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [notes, setNotes] = useState('');
  const [submitMsg, setSubmitMsg] = useState('');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      const [officialRes, postgameRes] = await Promise.all([
        fetch('/api/official').then(r => r.json()).catch(() => ({})),
        fetch('/api/postgame').then(r => r.json()).catch(() => ({})),
      ]);

      const teams: OfficialTeams | null = officialRes.teams ?? null;
      const pendingData: PendingPostgame | null = postgameRes.pending ?? null;
      const latest: GameRecord | null = postgameRes.latestResult ?? null;

      setOfficial(teams);
      setPending(pendingData);
      setLatestResult(latest);

      if (!teams?.locked) {
        setPageState('no-teams');
      } else if (pendingData) {
        setPageState('pending');
      } else {
        setPageState('form');
      }
    }
    load();
  }, []);

  function handleSubmit() {
    if (!scoreA || !scoreB) return;
    startTransition(async () => {
      const res = await fetch('/api/postgame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scoreA: Number(scoreA), scoreB: Number(scoreB), notes }),
      });
      if (res.ok) {
        const newPending: PendingPostgame = {
          teamA: official!.teamA,
          teamB: official!.teamB,
          scoreA: Number(scoreA),
          scoreB: Number(scoreB),
          notes,
          submittedAt: new Date().toISOString(),
        };
        setPending(newPending);
        setPageState('pending');
      } else {
        const d = await res.json();
        setSubmitMsg(d.error ?? 'Failed to submit');
      }
    });
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-white/30 text-sm">Loading…</p>
      </main>
    );
  }

  // ── No locked teams yet ────────────────────────────────────────────────────
  if (pageState === 'no-teams') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white/50 text-center">Teams haven't been finalised yet.</p>
        <p className="text-white/30 text-sm text-center">Come back here after the admin locks the teams.</p>
        <button
          onClick={() => router.push('/teams')}
          className="px-6 py-3 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20"
        >
          ← See Teams
        </button>
      </main>
    );
  }

  // ── Pending (submitted, awaiting admin approval) ───────────────────────────
  if (pageState === 'pending' && pending) {
    return (
      <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => router.push('/teams')} className="text-white/40 text-sm hover:text-white/60">← Teams</button>
          <h1 className="text-lg font-bold">Post-Game</h1>
          <div className="w-16" />
        </div>

        {/* Pending banner */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-center space-y-1">
          <p className="text-amber-300 font-semibold text-sm">⏳ Result submitted — awaiting admin approval</p>
          <p className="text-amber-400/60 text-xs">
            Submitted {new Date(pending.submittedAt).toLocaleTimeString()}
          </p>
        </div>

        {/* Score */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-blue-300 text-xs font-semibold mb-1">Team A</p>
              <p className="text-5xl font-bold text-white">{pending.scoreA}</p>
            </div>
            <p className="text-white/30 text-2xl font-bold">–</p>
            <div className="text-center">
              <p className="text-red-300 text-xs font-semibold mb-1">Team B</p>
              <p className="text-5xl font-bold text-white">{pending.scoreB}</p>
            </div>
          </div>
          {pending.notes && (
            <p className="mt-4 text-white/50 text-sm text-center border-t border-white/10 pt-4">
              {pending.notes}
            </p>
          )}
        </div>

        {/* Teams recap */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <p className="text-blue-300 font-semibold mb-2">Team A</p>
            {pending.teamA.map(n => <p key={n} className="text-white/60 py-0.5">{n}</p>)}
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-300 font-semibold mb-2">Team B</p>
            {pending.teamB.map(n => <p key={n} className="text-white/60 py-0.5">{n}</p>)}
          </div>
        </div>

        {/* Latest approved result (if exists) */}
        {latestResult && <ApprovedResult record={latestResult} />}
      </main>
    );
  }

  // ── Form (locked teams, no result yet) ────────────────────────────────────
  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push('/teams')} className="text-white/40 text-sm hover:text-white/60">← Teams</button>
        <h1 className="text-lg font-bold">Log Result</h1>
        <div className="w-16" />
      </div>

      {/* Teams — read-only */}
      {official && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <p className="text-blue-300 font-semibold mb-2">Team A</p>
            {official.teamA.map(n => <p key={n} className="text-white/70 py-0.5">{n}</p>)}
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-300 font-semibold mb-2">Team B</p>
            {official.teamB.map(n => <p key={n} className="text-white/70 py-0.5">{n}</p>)}
          </div>
        </div>
      )}

      {/* Score + notes form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-white/40 block mb-1">Team A goals</label>
            <input
              type="number" min="0" value={scoreA}
              onChange={e => setScoreA(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-white text-center text-2xl font-bold focus:outline-none focus:border-white/30"
              placeholder="0"
            />
          </div>
          <span className="text-white/30 text-xl font-bold mt-5">–</span>
          <div className="flex-1">
            <label className="text-xs text-white/40 block mb-1">Team B goals</label>
            <input
              type="number" min="0" value={scoreB}
              onChange={e => setScoreB(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-3 text-white text-center text-2xl font-bold focus:outline-none focus:border-white/30"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/40 block mb-1">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Who stood out? Any observations?"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none"
          />
        </div>

        {submitMsg && <p className="text-red-400 text-sm">{submitMsg}</p>}

        <button
          onClick={handleSubmit}
          disabled={!scoreA || !scoreB || isPending}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all
            ${scoreA && scoreB ? 'bg-white text-black hover:bg-white/90' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
        >
          {isPending ? 'Submitting…' : 'Submit Result'}
        </button>
        <p className="text-white/25 text-xs text-center">Result will be visible to everyone and sent to admin for approval</p>
      </div>

      {/* Latest approved result */}
      {latestResult && <ApprovedResult record={latestResult} />}
    </main>
  );
}

function ApprovedResult({ record }: { record: GameRecord }) {
  return (
    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
      <p className="text-emerald-400 text-xs font-semibold">✓ Last Approved Result — {record.date}</p>
      <p className="text-white font-bold text-lg text-center">{record.result}</p>
      {record.notes && <p className="text-white/50 text-sm text-center">{record.notes}</p>}
    </div>
  );
}
