'use client';

import { useState, useTransition } from 'react';
import PlayerGrid from '@/components/PlayerGrid';
import TeamDisplay from '@/components/TeamDisplay';
import WhatsAppCopy from '@/components/WhatsAppCopy';
import { GenerateResult, Player, PendingPostgame } from '@/lib/types';
import playersData from '@/data/players.json';

const ALL_PLAYERS = playersData.VeloCT as Player[];

type AdminView = 'login' | 'dashboard' | 'pick' | 'teams' | 'postgame';

export default function ManagerPage() {
  const [view, setView] = useState<AdminView>('login');
  const [token, setToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Pick players
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pickError, setPickError] = useState('');

  // Results
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [publishMsg, setPublishMsg] = useState('');

  // Postgame
  const [scoreA, setScoreA] = useState('');
  const [scoreB, setScoreB] = useState('');
  const [pgNotes, setPgNotes] = useState('');
  const [pgMsg, setPgMsg] = useState('');
  const [pgTeamA, setPgTeamA] = useState<string[]>([]);
  const [pgTeamB, setPgTeamB] = useState<string[]>([]);

  // Suggested (publicly generated) teams
  const [suggested, setSuggested] = useState<{ teamA: string[]; teamB: string[]; suggestedAt: string } | null>(null);
  const [suggestedLoaded, setSuggestedLoaded] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [revertMsg, setRevertMsg] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Pending post-game approval
  const [pendingPg, setPendingPg] = useState<PendingPostgame | null>(null);
  const [approveMsg, setApproveMsg] = useState('');
  const [managerNotes, setManagerNotes] = useState('');

  const [isPending, startTransition] = useTransition();

  function handleLogin() {
    if (!tokenInput.trim()) { setLoginError('Enter your manager token'); return; }
    setLoginError('');
    setToken(tokenInput.trim());
    setView('dashboard');
    // Load suggested teams and lock status on login
    Promise.all([
      fetch('/api/suggested').then(r => r.json()).catch(() => ({})),
      fetch('/api/official').then(r => r.json()).catch(() => ({})),
      fetch('/api/postgame').then(r => r.json()).catch(() => ({})),
    ]).then(([suggestedData, officialData, pgData]) => {
      setSuggested(suggestedData.teams ?? null);
      setIsLocked(officialData.teams?.locked === true);
      const pg = pgData.pending ?? null;
      setPendingPg(pg);
      if (pg?.notes) setManagerNotes(pg.notes);
      setSuggestedLoaded(true);
    }).catch(() => setSuggestedLoaded(true));
  }

  function handlePublishSuggested() {
    if (!suggested) return;
    startTransition(async () => {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          teamA: suggested.teamA,
          teamB: suggested.teamB,
          generatedAt: suggested.suggestedAt,
        }),
      });
      if (res.ok) {
        setPublishMsg('✓ Locked & published — teams are now final. No further changes possible.');
        setIsLocked(true);
        setSuggested(null);
      } else {
        setPublishMsg('Failed to publish');
      }
    });
  }

  function handleRevert() {
    startTransition(async () => {
      setRevertMsg('');
      const res = await fetch('/api/revert', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSuggested({ teamA: data.teams.teamA, teamB: data.teams.teamB, suggestedAt: new Date().toISOString() });
        setRevertMsg('Reverted to original algorithm output');
      } else if (res.status === 404) {
        setRevertMsg('No original teams found — generate teams first');
      } else {
        setRevertMsg('Revert failed');
      }
    });
  }

  function handleReset() {
    startTransition(async () => {
      setResetMsg('');
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setSuggested(null);
        setIsLocked(false);
        setShowResetConfirm(false);
        setResetMsg('✓ Cleared — players can now generate fresh teams');
      } else {
        setResetMsg('Reset failed');
        setShowResetConfirm(false);
      }
    });
  }

  function handleApprove() {
    startTransition(async () => {
      setApproveMsg('');
      const res = await fetch('/api/postgame/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ managerNotes }),
      });
      if (res.ok) {
        setPendingPg(null);
        setApproveMsg('✓ Result approved and saved to game history!');
      } else {
        const d = await res.json();
        setApproveMsg(d.error ?? 'Approval failed');
      }
    });
  }

  function handleQuickPostgame() {
    // Load last official teams from KV, then jump to postgame form
    startTransition(async () => {
      const res = await fetch('/api/official');
      const data = await res.json();
      if (!data.teams) {
        setLoginError('No official teams found. Generate and publish teams first.');
        setView('dashboard');
        return;
      }
      setPgTeamA(data.teams.teamA);
      setPgTeamB(data.teams.teamB);
      setScoreA('');
      setScoreB('');
      setPgNotes('');
      setPgMsg('');
      setResult(null);
      setView('postgame');
    });
  }

  function togglePlayer(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setPickError('');
  }

  function handleGenerate() {
    if (selected.size !== 16) { setPickError(`Select exactly 16 (${selected.size} selected)`); return; }
    startTransition(async () => {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedNames: Array.from(selected) }),
      });
      if (!res.ok) { const d = await res.json(); setPickError(d.error ?? 'Error'); return; }
      const data: GenerateResult = await res.json();
      setResult(data);
      setPgTeamA(data.teamA.players.map(p => p.name));
      setPgTeamB(data.teamB.players.map(p => p.name));
      setView('teams');
    });
  }

  function handlePublish() {
    if (!result) return;
    startTransition(async () => {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          teamA: result.teamA.players.map(p => p.name),
          teamB: result.teamB.players.map(p => p.name),
          generatedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) setPublishMsg('✓ Published — group can now see official teams');
      else setPublishMsg('Failed to publish');
    });
  }

  function handlePostgame() {
    const teamA = result ? result.teamA.players.map(p => p.name) : pgTeamA;
    const teamB = result ? result.teamB.players.map(p => p.name) : pgTeamB;
    const resultStr = `Team A ${scoreA} - Team B ${scoreB}`;
    startTransition(async () => {
      const res = await fetch('/api/postgame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ teamA, teamB, result: resultStr, notes: pgNotes, adjustments: [] }),
      });
      if (res.ok) setPgMsg('✓ Result saved!');
      else setPgMsg('Failed to save — check your token');
    });
  }

  // ── Views ──────────────────────────────────────────

  if (view === 'login') return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Manager</h1>
        <p className="text-white/40 text-sm text-center">Enter your manager token to continue</p>
        <input
          type="password"
          value={tokenInput}
          onChange={e => setTokenInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="Manager token"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30"
        />
        {loginError && <p className="text-red-400 text-sm">{loginError}</p>}
        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-xl bg-white text-black font-bold hover:bg-white/90"
        >
          Continue
        </button>
        <a href="/" className="block text-center text-white/30 text-xs hover:text-white/50">
          ← Back to public view
        </a>
      </div>
    </main>
  );

  if (view === 'dashboard') return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">Manager</h1>
          <button onClick={() => setView('login')} className="text-white/30 text-xs hover:text-white/50">Logout</button>
        </div>

        {/* Latest teams card */}
        {!suggestedLoaded && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-white/30 text-sm text-center">Loading latest teams…</p>
          </div>
        )}

        {suggestedLoaded && isLocked && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-center space-y-1">
            <p className="text-emerald-300 font-semibold text-sm">✓ Teams are locked & published</p>
            <p className="text-emerald-400/60 text-xs">No further changes are possible for this game</p>
          </div>
        )}

        {suggestedLoaded && !isLocked && suggested && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Latest Teams</p>
              <p className="text-white/30 text-xs">{new Date(suggested.suggestedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-500/10 rounded-xl p-2">
                <p className="text-blue-300 font-semibold mb-1">Team A</p>
                {suggested.teamA.map(n => <p key={n} className="text-white/60">{n}</p>)}
              </div>
              <div className="bg-red-500/10 rounded-xl p-2">
                <p className="text-red-300 font-semibold mb-1">Team B</p>
                {suggested.teamB.map(n => <p key={n} className="text-white/60">{n}</p>)}
              </div>
            </div>
            {revertMsg && <p className="text-amber-400 text-xs">{revertMsg}</p>}
            {publishMsg && <p className="text-emerald-400 text-xs">{publishMsg}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleRevert}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/60 font-semibold text-xs hover:bg-white/5 active:scale-95 transition-all"
              >
                ↩ Revert to Original
              </button>
              <button
                onClick={handlePublishSuggested}
                disabled={isPending}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 active:scale-95 transition-all"
              >
                {isPending ? '…' : '🔒 Lock & Publish'}
              </button>
            </div>
          </div>
        )}

        {suggestedLoaded && !isLocked && !suggested && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-white/30 text-sm text-center">No teams generated yet today</p>
          </div>
        )}

        {/* Pending post-game result — needs admin approval */}
        {pendingPg && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-amber-300 font-semibold text-sm">⏳ Pending Result</p>
              <p className="text-amber-400/60 text-xs">{new Date(pendingPg.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            {/* Score */}
            <div className="flex items-center justify-center gap-6 py-2">
              <div className="text-center">
                <p className="text-blue-300 text-xs mb-1">Team A</p>
                <p className="text-4xl font-bold text-white">{pendingPg.scoreA}</p>
              </div>
              <p className="text-white/30 text-xl">–</p>
              <div className="text-center">
                <p className="text-red-300 text-xs mb-1">Team B</p>
                <p className="text-4xl font-bold text-white">{pendingPg.scoreB}</p>
              </div>
            </div>
            {pendingPg.notes && (
              <p className="text-white/50 text-xs text-center border-t border-white/10 pt-2">{pendingPg.notes}</p>
            )}
            {/* Teams recap */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-blue-500/10 rounded-xl p-2">
                <p className="text-blue-300 font-semibold mb-1">Team A</p>
                {pendingPg.teamA.map(n => <p key={n} className="text-white/50">{n}</p>)}
              </div>
              <div className="bg-red-500/10 rounded-xl p-2">
                <p className="text-red-300 font-semibold mb-1">Team B</p>
                {pendingPg.teamB.map(n => <p key={n} className="text-white/50">{n}</p>)}
              </div>
            </div>
            {/* Manager notes — pre-filled from submitter, editable before approving */}
            <div>
              <label className="text-xs text-white/40 block mb-1">Official notes (published to history)</label>
              <textarea
                value={managerNotes}
                onChange={e => setManagerNotes(e.target.value)}
                rows={3}
                placeholder="Add your observations before publishing…"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none"
              />
            </div>
            {approveMsg && <p className="text-emerald-400 text-xs">{approveMsg}</p>}
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400 active:scale-95 transition-all"
            >
              {isPending ? 'Approving…' : '✓ Approve & Publish to History'}
            </button>
          </div>
        )}
        {approveMsg && !pendingPg && (
          <p className="text-emerald-400 text-sm text-center">{approveMsg}</p>
        )}

        <div className="border-t border-white/10 pt-4 space-y-3">
          <button
            onClick={() => setView('pick')}
            className="w-full py-4 rounded-2xl border border-white/20 text-white font-semibold text-sm hover:bg-white/5 active:scale-95 transition-all"
          >
            ⚽ Generate New Teams (with stats)
          </button>

          {/* Reset — clears all teams so players can generate fresh */}
          {!showResetConfirm ? (
            <button
              onClick={() => { setResetMsg(''); setShowResetConfirm(true); }}
              className="w-full py-3 rounded-2xl border border-red-500/30 text-red-400/70 text-sm hover:bg-red-500/5 hover:text-red-400 active:scale-95 transition-all"
            >
              🗑 Reset Today's Teams
            </button>
          ) : (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 space-y-3">
              <p className="text-red-300 text-sm font-semibold text-center">Reset everything?</p>
              <p className="text-white/40 text-xs text-center">This clears suggested, official, and original teams. Players will be able to generate from scratch.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-white/20 text-white/50 text-sm hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReset}
                  disabled={isPending}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-400 active:scale-95 transition-all"
                >
                  {isPending ? 'Clearing…' : 'Yes, Reset'}
                </button>
              </div>
            </div>
          )}
          {resetMsg && <p className={`text-sm text-center ${resetMsg.startsWith('✓') ? 'text-emerald-400' : 'text-red-400'}`}>{resetMsg}</p>}
        </div>

        <a href="/" className="block text-center text-white/30 text-xs hover:text-white/50 pt-2">
          ← Back to public view
        </a>
      </div>
    </main>
  );

  if (view === 'pick') return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Pick Players</h1>
          <p className="text-white/40 text-xs mt-0.5">Manager view — showing stats</p>
        </div>
        <button onClick={() => setView('dashboard')} className="text-white/30 text-xs hover:text-white/50">← Back</button>
      </div>

      <PlayerGrid players={ALL_PLAYERS} selected={selected} onToggle={togglePlayer} showStats={true} />

      <div className="sticky bottom-0 pt-4 pb-6 bg-gradient-to-t from-zinc-950 from-60% to-transparent mt-4">
        {pickError && <p className="text-red-400 text-sm text-center mb-3">{pickError}</p>}
        <button
          onClick={handleGenerate}
          disabled={selected.size !== 16 || isPending}
          className={`w-full py-4 rounded-2xl font-bold text-base transition-all
            ${selected.size === 16 ? 'bg-white text-black hover:bg-white/90' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
        >
          {isPending ? 'Generating…' : selected.size === 16 ? 'Generate Teams' : `${selected.size} / 16 selected`}
        </button>
      </div>
    </main>
  );

  if (view === 'teams' && result) return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => setView('pick')} className="text-white/40 text-sm hover:text-white/60">← Back</button>
        <h1 className="text-lg font-bold">Teams (Manager)</h1>
        <div className="w-12" />
      </div>

      <TeamDisplay result={result} showStats={true} />
      <WhatsAppCopy result={result} />

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-sm">Publish Official Teams</h2>
        <p className="text-white/40 text-xs">Saves these teams so the group can view them at /teams.</p>
        {publishMsg && <p className="text-emerald-400 text-sm">{publishMsg}</p>}
        <button
          onClick={handlePublish}
          disabled={isPending}
          className="w-full py-3 rounded-xl bg-emerald-500 text-black font-bold text-sm hover:bg-emerald-400"
        >
          Publish Teams
        </button>
      </div>

      <button
        onClick={() => { setScoreA(''); setScoreB(''); setPgNotes(''); setPgMsg(''); setView('postgame'); }}
        className="w-full py-3 rounded-2xl border border-white/10 text-white/50 text-sm hover:bg-white/5"
      >
        Record Result →
      </button>
    </main>
  );

  if (view === 'postgame') return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => setView(result ? 'teams' : 'dashboard')} className="text-white/40 text-sm hover:text-white/60">← Back</button>
        <h1 className="text-lg font-bold">Record Result</h1>
        <div className="w-12" />
      </div>

      {/* Show team names for context */}
      {(pgTeamA.length > 0 || pgTeamB.length > 0) && (
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <p className="text-blue-300 font-semibold mb-2">Team A</p>
            {pgTeamA.map(n => <p key={n} className="text-white/60">{n}</p>)}
          </div>
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-300 font-semibold mb-2">Team B</p>
            {pgTeamB.map(n => <p key={n} className="text-white/60">{n}</p>)}
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <label className="text-xs text-white/40 block mb-1">Team A goals</label>
            <input
              type="number" min="0" value={scoreA}
              onChange={e => setScoreA(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-center text-xl font-bold focus:outline-none focus:border-white/30"
              placeholder="0"
            />
          </div>
          <span className="text-white/30 text-xl font-bold mt-5">-</span>
          <div className="flex-1">
            <label className="text-xs text-white/40 block mb-1">Team B goals</label>
            <input
              type="number" min="0" value={scoreB}
              onChange={e => setScoreB(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-center text-xl font-bold focus:outline-none focus:border-white/30"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-white/40 block mb-1">Notes (optional)</label>
          <textarea
            value={pgNotes}
            onChange={e => setPgNotes(e.target.value)}
            rows={3}
            placeholder="Who stood out? Any observations for future balancing?"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none"
          />
        </div>

        {pgMsg && <p className="text-emerald-400 text-sm">{pgMsg}</p>}

        <button
          onClick={handlePostgame}
          disabled={!scoreA || !scoreB || isPending}
          className={`w-full py-3 rounded-xl font-bold text-sm transition-all
            ${scoreA && scoreB ? 'bg-white text-black hover:bg-white/90' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
        >
          {isPending ? 'Saving…' : 'Save Result'}
        </button>
      </div>
    </main>
  );

  return null;
}
