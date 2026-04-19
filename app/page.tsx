'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PlayerGrid from '@/components/PlayerGrid';
import GeneratingOverlay from '@/components/GeneratingOverlay';
import { Player, GenerateResult } from '@/lib/types';
import playersData from '@/data/players.json';

const BASE_PLAYERS = playersData.VeloCT as Player[];

function useSortedPlayers() {
  const [regulars, setRegulars] = useState<Player[]>([]);
  const [others, setOthers]     = useState<Player[]>(BASE_PLAYERS);
  const [loaded, setLoaded]     = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/history').then(r => r.json()).catch(() => ({ history: [] })),
      fetch('/api/players', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
    ]).then(([{ history = [] }, playersRes]) => {
      const allPlayers: Player[] = playersRes.players?.length ? playersRes.players : BASE_PLAYERS;
      const last5 = history.slice(0, 5);
      const counts: Record<string, number> = {};
      for (const game of last5) {
        for (const name of [...(game.teamA ?? []), ...(game.teamB ?? [])]) {
          counts[name] = (counts[name] ?? 0) + 1;
        }
      }
      const appeared = new Set(Object.keys(counts));
      const regs = allPlayers
        .filter(p => appeared.has(p.name))
        .sort((a, b) => (counts[b.name] ?? 0) - (counts[a.name] ?? 0) || a.name.localeCompare(b.name));
      const rest = allPlayers
        .filter(p => !appeared.has(p.name))
        .sort((a, b) => a.name.localeCompare(b.name));
      setRegulars(regs);
      setOthers(rest);
      setLoaded(true);
    }).catch(() => setLoaded(true));
  }, []);

  return { regulars, others, loaded };
}

export default function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const { regulars, others, loaded } = useSortedPlayers();

  // Teams-ready banner — initialise from sessionStorage so back-navigation restores it instantly
  const [teamsBanner, setTeamsBanner] = useState<null | 'locked' | 'suggested'>(() => {
    if (typeof window === 'undefined') return null;
    return (sessionStorage.getItem('collina_banner') as 'locked' | 'suggested' | null) ?? null;
  });

  function applyBanner(val: 'locked' | 'suggested') {
    sessionStorage.setItem('collina_banner', val);
    setTeamsBanner(val);
  }

  useEffect(() => {
    async function checkTeams() {
      const [official, suggested] = await Promise.all([
        fetch('/api/official', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
        fetch('/api/suggested', { cache: 'no-store' }).then(r => r.json()).catch(() => ({})),
      ]);
      if (official.teams?.locked) { applyBanner('locked'); return; }
      if (suggested.teams) { applyBanner('suggested'); return; }
      // Nothing in KV — clear any stale banner (e.g. after manager reset)
      sessionStorage.removeItem('collina_banner');
      setTeamsBanner(null);
    }
    checkTeams();
    const interval = setInterval(checkTeams, 15000);
    return () => clearInterval(interval);
  }, []);

  // Generating overlay state
  const [generating, setGenerating] = useState(false);
  const [apiResult, setApiResult] = useState<GenerateResult | null>(null);
  const [apiError, setApiError] = useState('');
  const [showWarning, setShowWarning] = useState<null | '14' | '15'>(null);
  const allPlayers = [...regulars, ...others];
  const selectedPlayers = allPlayers.filter(p => selected.has(p.name));

  function toggle(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setError('');
  }

  function fireGenerate() {
    setApiResult(null);
    setApiError('');
    setGenerating(true);
    fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ selectedNames: Array.from(selected) }),
    })
      .then(async res => {
        if (!res.ok) {
          const data = await res.json();
          setApiError(data.error ?? 'Failed to generate teams');
        } else {
          setApiResult(await res.json());
        }
      })
      .catch(() => setApiError('Network error — please try again'));
  }

  function handleGenerate() {
    const n = selected.size;
    if (n < 14 || n > 16) return;
    if (n === 14) { setShowWarning('14'); return; }
    if (n === 15) { setShowWarning('15'); return; }
    fireGenerate();
  }

  function handleConfirmWarning() {
    setShowWarning(null);
    fireGenerate();
  }

  // Called by overlay when animation completes AND API is ready
  const handleOverlayDone = useCallback(() => {
    if (apiError) {
      setGenerating(false);
      setError(apiError);
      setApiError('');
      return;
    }
    if (apiResult) {
      sessionStorage.setItem('collinaResult', JSON.stringify(apiResult));
      applyBanner('suggested'); // show banner immediately on back-navigation
      router.push('/teams');
    }
  }, [apiResult, apiError, router]);

  const count = selected.size;
  const canGenerate = count >= 14 && count <= 16;
  const buttonLabel = count === 14 ? 'Generate Teams (7v7)' : count === 15 ? 'Generate Teams (8v7)' : count === 16 ? 'Generate Teams (8v8)' : `${count} / 14–16 selected`;
  const buttonClass = count === 14
    ? 'bg-amber-500 text-black hover:bg-amber-400 active:scale-95'
    : count === 15
    ? 'bg-lime-400 text-black hover:bg-lime-300 active:scale-95'
    : count === 16
    ? 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95'
    : 'bg-white/10 text-white/30 cursor-not-allowed';

  return (
    <>
      {/* Warning popup — 14 players */}
      {showWarning === '14' && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center px-6">
          <div className="relative w-full max-w-sm bg-zinc-900 border border-amber-500/40 rounded-3xl p-8 space-y-5 text-center">
            <button onClick={() => setShowWarning(null)} className="absolute top-4 right-4 text-white/30 hover:text-white/60 text-xl leading-none">✕</button>
            <div className="text-6xl">😮‍💨</div>
            <div className="space-y-2">
              <p className="text-amber-300 font-bold text-xl tracking-tight">No subs tonight</p>
              <p className="text-white/50 text-sm leading-relaxed">With 14 players, both teams play with no substitutes. Quality may drop as players tire.</p>
            </div>
            <button onClick={handleConfirmWarning} className="w-full py-3.5 rounded-2xl font-bold text-base bg-amber-500 text-black hover:bg-amber-400 active:scale-95 transition-all">Got It</button>
            <button onClick={() => setShowWarning(null)} className="w-full text-white/30 text-sm hover:text-white/50 transition-colors">Go Back</button>
          </div>
        </div>
      )}

      {/* Warning popup — 15 players */}
      {showWarning === '15' && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center px-6">
          <div className="relative w-full max-w-sm bg-zinc-900 border border-lime-400/40 rounded-3xl p-8 space-y-5 text-center">
            <button onClick={() => setShowWarning(null)} className="absolute top-4 right-4 text-white/30 hover:text-white/60 text-xl leading-none">✕</button>
            <div className="text-6xl">⚠️</div>
            <div className="space-y-2">
              <p className="text-lime-300 font-bold text-xl tracking-tight">One team has a sub</p>
              <p className="text-white/50 text-sm leading-relaxed">With 15 players, one team will have a substitute. They may have a slight advantage.</p>
            </div>
            <button onClick={handleConfirmWarning} className="w-full py-3.5 rounded-2xl font-bold text-base bg-lime-400 text-black hover:bg-lime-300 active:scale-95 transition-all">Got It</button>
            <button onClick={() => setShowWarning(null)} className="w-full text-white/30 text-sm hover:text-white/50 transition-colors">Go Back</button>
          </div>
        </div>
      )}

      {generating && (
        <GeneratingOverlay
          players={selectedPlayers}
          apiReady={!!apiResult || !!apiError}
          result={apiResult ?? undefined}
          onDone={handleOverlayDone}
        />
      )}

      <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
        {/* Teams-ready banner */}
        {teamsBanner === 'locked' && (
          <button
            onClick={() => router.push('/teams')}
            className="w-full mb-4 bg-emerald-500/15 border border-emerald-500/40 rounded-2xl px-5 py-4 flex items-center justify-between hover:bg-emerald-500/25 active:scale-95 transition-all"
          >
            <div className="text-left">
              <p className="font-semibold text-sm text-emerald-300">✅ Today's teams are locked in!</p>
              <p className="text-emerald-400/60 text-xs mt-0.5">Manager has confirmed the final split — tap to see</p>
            </div>
            <span className="text-emerald-400/60 text-lg">→</span>
          </button>
        )}
        {teamsBanner === 'suggested' && (
          <button
            onClick={() => router.push('/teams')}
            className="w-full mb-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl px-5 py-4 flex items-center justify-between hover:bg-blue-500/15 active:scale-95 transition-all"
          >
            <div className="text-left">
              <p className="font-semibold text-sm text-blue-300">👀 A team split has been suggested</p>
              <p className="text-blue-400/50 text-xs mt-0.5">Tap to view or swap — manager hasn't locked it yet</p>
            </div>
            <span className="text-blue-400/50 text-lg">→</span>
          </button>
        )}

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">VeloCT</h1>
              <p className="text-white/40 text-sm mt-0.5">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a href="/how-it-works" className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs font-medium hover:bg-white/15 hover:text-white transition-colors">⚖️ Ratings</a>
              <a href="/history"      className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs font-medium hover:bg-white/15 hover:text-white transition-colors">📋 History</a>
              <a href="/manager"      className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-xs font-medium hover:bg-white/15 hover:text-white transition-colors">⚙️ Manager</a>
            </div>
          </div>
        </div>

        {/* Player grid */}
        {!loaded ? (
          <PlayerGrid players={allPlayers} selected={selected} onToggle={toggle} showStats={false} />
        ) : (
          <div className="space-y-4">
            {regulars.length > 0 && (
              <div className="space-y-2">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-1">Recent regulars</p>
                <PlayerGrid players={regulars} selected={selected} onToggle={toggle} showStats={false} />
              </div>
            )}
            {others.length > 0 && (
              <div className="space-y-2">
                {regulars.length > 0 && (
                  <p className="text-white/20 text-xs font-semibold uppercase tracking-widest px-1 pt-2">Full squad</p>
                )}
                <PlayerGrid players={others} selected={selected} onToggle={toggle} showStats={false} />
              </div>
            )}
          </div>
        )}

        {/* Sticky generate button */}
        <div className="sticky bottom-0 pt-4 pb-6 bg-gradient-to-t from-zinc-950 from-60% to-transparent mt-4">
          {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || generating}
            className={`w-full py-4 rounded-2xl font-bold text-base transition-all duration-200 ${generating ? 'bg-white/10 text-white/30 cursor-not-allowed' : buttonClass}`}
          >
            {buttonLabel}
          </button>
        </div>
      </main>
    </>
  );
}
