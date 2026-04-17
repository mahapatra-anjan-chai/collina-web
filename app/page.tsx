'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import PlayerGrid from '@/components/PlayerGrid';
import { Player } from '@/lib/types';
import playersData from '@/data/players.json';

const ALL_PLAYERS = playersData.VeloCT as Player[];

export default function HomePage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function toggle(name: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
    setError('');
  }

  async function handleGenerate() {
    if (selected.size !== 16) {
      setError(`Select exactly 16 players (${selected.size} selected)`);
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedNames: Array.from(selected) }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? 'Failed to generate teams');
          return;
        }

        const result = await res.json();
        sessionStorage.setItem('collinaResult', JSON.stringify(result));
        router.push('/teams');
      } catch {
        setError('Network error — please try again');
      }
    });
  }

  const count = selected.size;

  return (
    <main className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">VeloCT</h1>
            <p className="text-white/40 text-sm mt-0.5">Pick 16 players for today</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/history" className="text-white/20 text-xs hover:text-white/40 transition-colors">history</a>
            <a href="/admin" className="text-white/20 text-xs hover:text-white/40 transition-colors">admin</a>
          </div>
        </div>
      </div>

      <PlayerGrid players={ALL_PLAYERS} selected={selected} onToggle={toggle} showStats={false} />

      <div className="sticky bottom-0 pt-4 pb-6 bg-gradient-to-t from-zinc-950 from-60% to-transparent mt-4">
        {error && (
          <p className="text-red-400 text-sm text-center mb-3">{error}</p>
        )}
        <button
          onClick={handleGenerate}
          disabled={count !== 16 || isPending}
          className={`
            w-full py-4 rounded-2xl font-bold text-base transition-all duration-200
            ${count === 16
              ? 'bg-white text-black hover:bg-white/90 active:scale-95'
              : 'bg-white/10 text-white/30 cursor-not-allowed'
            }
          `}
        >
          {isPending
            ? 'Generating…'
            : count === 16
              ? 'Generate Teams'
              : `${count} / 16 selected`
          }
        </button>
      </div>
    </main>
  );
}
