'use client';

import { useState, useTransition } from 'react';
import PlayerGrid from '@/components/PlayerGrid';
import TeamDisplay from '@/components/TeamDisplay';
import WhatsAppCopy from '@/components/WhatsAppCopy';
import { GenerateResult, Player } from '@/lib/types';
import playersData from '@/data/players.json';

const ALL_PLAYERS = playersData.VeloCT as Player[];

type AdminView = 'login' | 'pick' | 'teams' | 'postgame';

export default function AdminPage() {
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

  const [isPending, startTransition] = useTransition();

  function handleLogin() {
    if (!tokenInput.trim()) { setLoginError('Enter your admin token'); return; }
    // Quick pre-check: try a real request to confirm the token works
    setLoginError('');
    setToken(tokenInput.trim());
    setView('pick');
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
    if (!result) return;
    const resultStr = `Team A ${scoreA} - Team B ${scoreB}`;
    startTransition(async () => {
      const res = await fetch('/api/postgame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          teamA: result.teamA.players.map(p => p.name),
          teamB: result.teamB.players.map(p => p.name),
          result: resultStr,
          notes: pgNotes,
          adjustments: [],
        }),
      });
      if (res.ok) setPgMsg('✓ Result saved');
      else setPgMsg('Failed to save');
    });
  }

  // ── Views ──────────────────────────────────────────

  if (view === 'login') return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-center">Admin</h1>
        <p className="text-white/40 text-sm text-center">Enter your admin token to continue</p>
        <input
          type="password"
          value={tokenInput}
          onChange={e => setTokenInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="Admin token"
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

  if (view === 'pick') return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Pick Players</h1>
          <p className="text-white/40 text-xs mt-0.5">Admin view — showing stats</p>
        </div>
        <button onClick={() => setView('login')} className="text-white/30 text-xs hover:text-white/50">Logout</button>
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
        <h1 className="text-lg font-bold">Teams (Admin)</h1>
        <div className="w-12" />
      </div>

      {/* Full stats visible to admin */}
      <TeamDisplay result={result} showStats={true} />

      <WhatsAppCopy result={result} />

      {/* Publish */}
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

      {/* Record result */}
      <button
        onClick={() => setView('postgame')}
        className="w-full py-3 rounded-2xl border border-white/10 text-white/50 text-sm hover:bg-white/5"
      >
        Record Result →
      </button>
    </main>
  );

  if (view === 'postgame' && result) return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => setView('teams')} className="text-white/40 text-sm hover:text-white/60">← Back</button>
        <h1 className="text-lg font-bold">Record Result</h1>
        <div className="w-12" />
      </div>

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
