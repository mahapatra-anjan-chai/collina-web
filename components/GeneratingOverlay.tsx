'use client';

import { useState, useEffect } from 'react';
import { Player, GenerateResult } from '@/lib/types';

const PHASE_DURATION = 1400; // ms per phase

const SKILL_LABELS = ['Pass', 'Def', 'Shot', 'Pace'];
const POSITION_WEIGHTS = [
  { label: 'Keeper',   emoji: '🥅', colour: 'text-yellow-300', bar: 'bg-yellow-400',  weights: [5,  50, 0,  45] },
  { label: 'Defender', emoji: '🛡️', colour: 'text-blue-300',   bar: 'bg-blue-400',    weights: [10, 45, 5,  40] },
  { label: 'Mid',      emoji: '⚡', colour: 'text-purple-300', bar: 'bg-purple-400',  weights: [40, 20, 25, 15] },
  { label: 'Striker',  emoji: '🎯', colour: 'text-emerald-300',bar: 'bg-emerald-400', weights: [25, 5,  40, 30] },
];

function snakeTeam(i: number): 'A' | 'B' {
  return Math.floor(i / 2) % 2 === 0 ? 'A' : 'B';
}

interface Props {
  players: Player[];          // the 16 selected players
  apiReady: boolean;          // true once the API has responded
  result?: GenerateResult;    // filled once API returns — used in balance phase
  onDone: () => void;         // called when animation finishes AND apiReady
}

export default function GeneratingOverlay({ players, apiReady, result, onDone }: Props) {
  const [phase, setPhase] = useState(0);
  const [visible, setVisible] = useState(true);
  const [draftStep, setDraftStep] = useState(0);
  const [waitingForApi, setWaitingForApi] = useState(false);

  // Advance through phases 0→4
  useEffect(() => {
    if (waitingForApi) return; // hold on phase 4 until API ready
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
        setPhase(p => {
          const next = p + 1;
          if (next >= 5) {
            // Reached end — check if API is ready
            return 4; // stay on 4 (done screen)
          }
          if (next === 2) setDraftStep(0);
          return next;
        });
        setVisible(true);
      }, 180);
    }, PHASE_DURATION);
    return () => clearTimeout(t);
  }, [phase, waitingForApi]);

  // When we reach phase 4, wait for API if needed
  useEffect(() => {
    if (phase === 4) {
      if (apiReady) {
        // Brief pause on trophy screen then done
        const t = setTimeout(onDone, 600);
        return () => clearTimeout(t);
      } else {
        setWaitingForApi(true);
      }
    }
  }, [phase, apiReady, onDone]);

  // API arrived while we were waiting on phase 4
  useEffect(() => {
    if (waitingForApi && apiReady) {
      setWaitingForApi(false);
      const t = setTimeout(onDone, 600);
      return () => clearTimeout(t);
    }
  }, [waitingForApi, apiReady, onDone]);

  // Draft step sub-animation
  useEffect(() => {
    if (phase !== 2 || draftStep >= players.length) return;
    const t = setTimeout(() => setDraftStep(s => s + 1), PHASE_DURATION / (players.length + 2));
    return () => clearTimeout(t);
  }, [phase, draftStep, players.length]);

  const teamA = players.filter((_, i) => i < draftStep && snakeTeam(i) === 'A');
  const teamB = players.filter((_, i) => i < draftStep && snakeTeam(i) === 'B');

  // Position pill colours
  const posColour: Record<string, { text: string; bg: string; border: string }> = {
    Keeper:   { text: 'text-yellow-300', bg: 'bg-yellow-400/10',  border: 'border-yellow-400/40' },
    Defender: { text: 'text-blue-300',   bg: 'bg-blue-400/10',    border: 'border-blue-400/40'   },
    Mid:      { text: 'text-purple-300', bg: 'bg-purple-400/10',  border: 'border-purple-400/40' },
    Striker:  { text: 'text-emerald-300',bg: 'bg-emerald-400/10', border: 'border-emerald-400/40'},
  };
  const abbr: Record<string, string> = { Keeper: 'GK', Defender: 'DEF', Mid: 'MID', Striker: 'STR' };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center px-4">

      {/* Phase card */}
      <div
        className="w-full max-w-sm transition-all duration-200"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.97)' }}
      >

        {/* Phase 0 — Reading the squad */}
        {phase === 0 && (
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 text-center space-y-5">
            <div className="text-7xl animate-bounce">⚽</div>
            <div>
              <p className="text-white font-bold text-xl tracking-tight">Reading the squad</p>
              <p className="text-white/40 text-sm mt-1">{players.length} players locked in</p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center pt-1">
              {players.map((p, i) => {
                const c = posColour[p.position] ?? posColour.Mid;
                return (
                  <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${c.text} ${c.bg} ${c.border}`}>
                    {abbr[p.position] ?? p.position}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Phase 1 — Computing ratings */}
        {phase === 1 && (
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="text-center space-y-1">
              <div className="text-5xl">🧮</div>
              <p className="text-white font-bold text-lg tracking-tight mt-2">Computing ratings</p>
              <p className="text-white/40 text-xs">Position-weighted composite scores</p>
            </div>
            <div className="space-y-2">
              {POSITION_WEIGHTS.map(pos => (
                <div key={pos.label} className="bg-white/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{pos.emoji}</span>
                    <span className={`text-xs font-semibold ${pos.colour}`}>{pos.label}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {pos.weights.map((w, i) => (
                      <div key={i} className="text-center">
                        <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-1">
                          <div className={`h-full rounded-full ${pos.bar}`} style={{ width: `${w}%` }} />
                        </div>
                        <p className="text-white/30 text-[9px]">{SKILL_LABELS[i]}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase 2 — Running the draft */}
        {phase === 2 && (
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-6 space-y-4">
            <div className="text-center space-y-1">
              <div className="text-5xl">🔀</div>
              <p className="text-white font-bold text-lg mt-2">Running the draft</p>
              <p className="text-white/40 text-xs">Serpentine pick · {draftStep} / {players.length} assigned</p>
            </div>
            <div className="flex gap-1 justify-center flex-wrap">
              {players.map((_, i) => {
                const t = snakeTeam(i);
                const done = i < draftStep;
                return (
                  <div key={i} className={`w-5 h-5 rounded-md text-[9px] font-bold flex items-center justify-center transition-all duration-100 ${
                    done ? (t === 'A' ? 'bg-blue-500 text-white' : 'bg-red-500 text-white') : 'bg-white/10 text-white/20'
                  }`}>
                    {done ? t : '·'}
                  </div>
                );
              })}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 min-h-[80px]">
                <p className="text-blue-300 text-[10px] font-bold mb-1.5">Team A ({teamA.length})</p>
                {teamA.map(p => <p key={p.name} className="text-white/70 text-[10px] py-0.5">{p.name}</p>)}
              </div>
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2.5 min-h-[80px]">
                <p className="text-red-300 text-[10px] font-bold mb-1.5">Team B ({teamB.length})</p>
                {teamB.map(p => <p key={p.name} className="text-white/70 text-[10px] py-0.5">{p.name}</p>)}
              </div>
            </div>
          </div>
        )}

        {/* Phase 3 — Balancing */}
        {phase === 3 && <BalancePhase result={result} />}

        {/* Phase 4 — Done */}
        {phase === 4 && (
          <div className="bg-emerald-950/60 border border-emerald-500/30 rounded-3xl p-8 text-center space-y-4">
            <div className="text-7xl">🏆</div>
            <div>
              <p className="text-emerald-300 font-bold text-2xl tracking-tight">Teams are ready!</p>
              <p className="text-white/40 text-sm mt-1">
                {waitingForApi ? 'Finalising…' : 'Good luck out there ⚽'}
              </p>
            </div>
            <div className="flex justify-center gap-4 pt-1">
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl px-5 py-3">
                <p className="text-blue-300 text-xs font-bold">Team A</p>
                <p className="text-blue-200 text-lg font-bold">{result?.teamA.players.length ?? Math.ceil(players.length / 2)}</p>
                <p className="text-blue-400/60 text-[10px]">players</p>
              </div>
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-5 py-3">
                <p className="text-red-300 text-xs font-bold">Team B</p>
                <p className="text-red-200 text-lg font-bold">{result?.teamB.players.length ?? Math.floor(players.length / 2)}</p>
                <p className="text-red-400/60 text-[10px]">players</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex gap-2 mt-8">
        {[0,1,2,3,4].map(p => (
          <div
            key={p}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: phase === p ? 24 : 8,
              backgroundColor: p <= phase ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

function BalancePhase({ result }: { result?: GenerateResult }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 80);
    return () => clearInterval(t);
  }, []);

  const progress = Math.min(tick / 10, 1);
  const balanced = progress > 0.85;

  let aScore: string;
  let bScore: string;
  let diff: string;

  if (result && balanced) {
    // Snap to real numbers once animation converges
    aScore = result.teamA.meanOvr.toFixed(2);
    bScore = result.teamB.meanOvr.toFixed(2);
    diff = Math.abs(result.teamA.meanOvr - result.teamB.meanOvr).toFixed(2);
  } else {
    const spread = (1 - progress) * 0.4;
    const mid = result ? (result.teamA.meanOvr + result.teamB.meanOvr) / 2 : 7.2;
    aScore = (mid - spread / 2 + Math.sin(tick * 0.6) * spread * 0.15).toFixed(2);
    bScore = (mid + spread / 2 - Math.sin(tick * 0.6) * spread * 0.15).toFixed(2);
    diff = Math.abs(Number(aScore) - Number(bScore)).toFixed(2);
  }

  return (
    <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 text-center space-y-5">
      <div className="text-6xl">{balanced ? '✅' : '⚖️'}</div>
      <div>
        <p className="text-white font-bold text-xl">Balancing the teams</p>
        <p className="text-white/40 text-sm mt-1">Checking ratings &amp; spread</p>
      </div>
      <div className="flex items-center justify-between px-2">
        <div className="text-center">
          <p className="text-blue-300 text-xs mb-1">Team A</p>
          <p className="text-2xl font-bold tabular-nums text-white">{aScore}</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-colors ${
            balanced ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
          }`}>Δ {diff}</div>
          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${balanced ? 'bg-emerald-400' : 'bg-amber-400'}`}
              style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
        <div className="text-center">
          <p className="text-red-300 text-xs mb-1">Team B</p>
          <p className="text-2xl font-bold tabular-nums text-white">{bScore}</p>
        </div>
      </div>
      <p className={`text-xs transition-colors ${balanced ? 'text-emerald-400' : 'text-white/30'}`}>
        {balanced ? '✓ Within tolerance' : 'Optimising swaps…'}
      </p>
    </div>
  );
}
