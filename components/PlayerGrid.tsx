'use client';

import { Player } from '@/lib/types';

interface PlayerGridProps {
  players: Player[];
  selected: Set<string>;
  onToggle: (name: string) => void;
  showStats?: boolean;
}

const POSITION_COLORS: Record<string, string> = {
  Keeper:   'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
  Defender: 'bg-blue-500/20  text-blue-300  border-blue-500/30',
  Mid:      'bg-green-500/20 text-green-300 border-green-500/30',
  Striker:  'bg-red-500/20   text-red-300   border-red-500/30',
};

export default function PlayerGrid({ players, selected, onToggle, showStats = false }: PlayerGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
      {players.map(p => {
        const isSelected = selected.has(p.name);
        const ovr = ((p.dp + p.defending + p.shooting + p.pace) / 4).toFixed(1);
        return (
          <button
            key={p.name}
            onClick={() => onToggle(p.name)}
            className={`
              relative rounded-xl border-2 p-3 text-left transition-all duration-150 min-h-[72px]
              ${isSelected
                ? 'border-emerald-400 bg-emerald-400/10 shadow-lg shadow-emerald-400/20'
                : 'border-white/10 bg-white/5 hover:border-white/25 hover:bg-white/10'
              }
            `}
          >
            {isSelected && (
              <span className="absolute top-2 right-2 text-emerald-400 text-xs font-bold">✓</span>
            )}
            <p className="font-semibold text-white text-sm leading-tight pr-4">{p.name}</p>
            {showStats ? (
              <>
                <span className={`mt-1 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border ${POSITION_COLORS[p.position] ?? ''}`}>
                  {p.position}
                </span>
                <p className="mt-1 text-xs text-white/50">OVR {ovr}</p>
              </>
            ) : (
              <span className={`mt-1 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded border ${POSITION_COLORS[p.position] ?? ''}`}>
                {p.position}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
