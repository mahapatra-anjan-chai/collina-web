'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PlayerGrid from '@/components/PlayerGrid';
import GeneratingOverlay from '@/components/GeneratingOverlay';
import { Player, GenerateResult } from '@/lib/types';
import playersData from '@/data/players.json';

const ALL_PLAYERS = playersData.VeloCT as Player[];

function useSortedPlayers() {
  const [regulars, setRegulars] = useState<Player[]>([]);
  const [others, setOthers]     = useState<Player[]>(ALL_PLAYERS);
  const [loaded, setLoaded]     = useState(false);

  useEffect(() => {
    fetch('/api/history')
      .then(r => r.json())
      .then(({ history = [] }) => {
        const last5 = history.slice(0, 5);
        const counts: Record<string, number> = {};
        for (const game of last5) {
          for (const name of [...(game.teamA ?? []), ...(game.teamB ?? [])]) {
            counts[name] = (counts[name] ?? 0) + 1;
          }
        }
        const appeared = new Set(Object.keys(counts));
        const regs = ALL_PLAYERS
          .filter(p => appeared.has(p.name))
          .sort((a, b) => (counts[b.name] ?? 0) - (counts[a.name] ?? 0) || a.name.localeCompare(b.name));
        const rest = ALL_PLAYERS
          .filter(p => !appeared.has(p.name))
          .sort((a, b) => a.name.localeCompare(b.name));
        setRegulars(regs);
        setOthers(rest);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return { regulars, others, loaded };
}

export default function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const { regulars, others, loaded } = useSortedPlayers();

  // Generating overlay state
  const [generating, setGenerating] = useState(false);
  const [apiResult, setApiResult] = useState<GenerateResult | null>(null);
  const [apiError, setApiError] = useState('');
  const selectedPlayers = ALL_PLAYERS.filter(p => selected.has(p.name));

  function toggle(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setError('');
  }

  function handleGenerate() {
    if (selected.size !== 16) {
      setError(`Select exactly 16 players (${selected.size} selected)`);
      return;
    }
    setApiResult(null);
    setApiError('');
    setGenerating(true);

    // Fire API call — result stored when ready, overlay picks it up
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
      router.push('/teams');
    }
  }, [apiResult, apiError, router]);

  const count = selected.size;

  return (
    <>
      {generating && (
        <GeneratingOverlay
          players={selectedPlayers}
          apiReady={!!apiResult || !!apiError}
          onDone={handleOverlayDone}
        />
      )}

      <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
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
          <PlayerGrid players={ALL_PLAYERS} selected={selected} onToggle={toggle} showStats={false} />
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
            disabled={count !== 16 || generating}
            className={`
              w-full py-4 rounded-2xl font-bold text-base transition-all duration-200
              ${count === 16 && !generating
                ? 'bg-white text-black hover:bg-white/90 active:scale-95'
                : 'bg-white/10 text-white/30 cursor-not-allowed'
              }
            `}
          >
            {count === 16 ? 'Generate Teams' : `${count} / 16 selected`}
          </button>
        </div>
      </main>
    </>
  );
}
