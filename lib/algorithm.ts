import { Player, PlayerWithScore, Position, WeightAdjustment, Team, GenerateResult } from './types';

// Position weight matrix: [dp, defending, shooting, pace]
const POSITION_WEIGHTS: Record<Position, [number, number, number, number]> = {
  Keeper:   [0.05, 0.50, 0.00, 0.45],
  Defender: [0.10, 0.45, 0.05, 0.40],
  Mid:      [0.40, 0.20, 0.25, 0.15],
  Striker:  [0.25, 0.05, 0.40, 0.30],
};

function round(n: number, decimals = 3): number {
  return Math.round(n * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stdDev(arr: number[]): number {
  const m = mean(arr);
  return Math.sqrt(arr.reduce((sum, x) => sum + Math.pow(x - m, 2), 0) / arr.length);
}

function median(arr: number[]): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function percentile(arr: number[], p: number): number {
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function computeOverall(p: Player): number {
  return round((p.dp + p.defending + p.shooting + p.pace) / 4, 2);
}

export function computeComposite(
  p: Player,
  allPlayers: Player[],
  globalOverrides?: Partial<Record<Position, [number, number, number, number]>>
): number {
  let [wDp, wDef, wShoot, wPace] = globalOverrides?.[p.position] ?? POSITION_WEIGHTS[p.position];

  // Defending Override Rule (Defenders only)
  if (p.position === 'Defender') {
    const allDef = allPlayers.map(x => x.defending);
    const allOvr = allPlayers.map(x => computeOverall(x));
    const medianOvr = median(allOvr);
    const p75Def = percentile(allDef, 75);

    if (computeOverall(p) < medianOvr && p.defending > p75Def) {
      wDef *= 1.25;
      const total = wDp + wDef + wShoot + wPace;
      wDp /= total;
      wDef /= total;
      wShoot /= total;
      wPace /= total;
    }
  }

  return round(p.dp * wDp + p.defending * wDef + p.shooting * wShoot + p.pace * wPace, 3);
}

// Serpentine pick: A,B,B,A,A,B,B,A,...
// pair_num = Math.floor(i/2); pos_in_pair = i%2
// teamAFirst=true:  even pair → A,B; odd pair → B,A
// teamAFirst=false: even pair → B,A; odd pair → A,B
function serpentinePick(i: number, teamAFirst: boolean): 'A' | 'B' {
  const pairNum = Math.floor(i / 2);
  const posInPair = i % 2;
  if (teamAFirst) {
    return pairNum % 2 === 0
      ? (posInPair === 0 ? 'A' : 'B')
      : (posInPair === 0 ? 'B' : 'A');
  } else {
    return pairNum % 2 === 0
      ? (posInPair === 0 ? 'B' : 'A')
      : (posInPair === 0 ? 'A' : 'B');
  }
}

function teamStats(team: PlayerWithScore[]): { meanOvr: number; stdDevOvr: number; totalComposite: number } {
  const ovrs = team.map(p => p.ovr);
  return {
    meanOvr: round(mean(ovrs), 3),
    stdDevOvr: round(stdDev(ovrs), 3),
    totalComposite: round(team.reduce((s, p) => s + p.composite, 0), 3),
  };
}

function applyAdjustments(players: Player[], adjustments: WeightAdjustment[]): Player[] {
  return players.map(p => {
    const adj = adjustments.filter(a => a.playerName === p.name);
    if (adj.length === 0) return p;
    const modified = { ...p };
    for (const a of adj) {
      modified[a.attribute] = round(modified[a.attribute] * a.modifier, 2);
    }
    return modified;
  });
}

export function generateTeams(
  rawPlayers: Player[],
  adjustments: WeightAdjustment[] = [],
  globalOverrides?: Partial<Record<Position, [number, number, number, number]>>
): GenerateResult {
  // Apply per-player weight adjustments
  const players = applyAdjustments(rawPlayers, adjustments);

  // Compute scores for all players
  const scored: PlayerWithScore[] = players.map(p => ({
    ...p,
    ovr: computeOverall(p),
    composite: computeComposite(p, players, globalOverrides),
  }));

  // Group by position, sort descending by composite
  const positionOrder: Position[] = ['Keeper', 'Defender', 'Mid', 'Striker'];
  const groups: Partial<Record<Position, PlayerWithScore[]>> = {};
  for (const pos of positionOrder) {
    const group = scored.filter(p => p.position === pos);
    group.sort((a, b) => b.composite - a.composite);
    if (group.length > 0) groups[pos] = group;
  }

  // Serpentine draft
  const teamA: PlayerWithScore[] = [];
  const teamB: PlayerWithScore[] = [];
  let teamAFirst = true;

  for (const pos of positionOrder) {
    const group = groups[pos];
    if (!group || group.length === 0) continue;

    const n = group.length;
    const evenCount = n % 2 === 0 ? n : n - 1;

    // Assign even picks
    for (let i = 0; i < evenCount; i++) {
      const team = serpentinePick(i, teamAFirst);
      if (team === 'A') teamA.push(group[i]);
      else teamB.push(group[i]);
    }

    // Handle odd leftover: goes to team with lower cumulative composite
    if (n % 2 === 1) {
      const leftover = group[n - 1];
      const sumA = teamA.reduce((s, p) => s + p.composite, 0);
      const sumB = teamB.reduce((s, p) => s + p.composite, 0);
      if (sumA <= sumB) teamA.push(leftover);
      else teamB.push(leftover);
    }

    teamAFirst = !teamAFirst;
  }

  // Swap phase: up to 3 iterations to reduce mean OVR diff
  let swapsPerformed = 0;
  for (let iter = 0; iter < 3; iter++) {
    const statsA = teamStats(teamA);
    const statsB = teamStats(teamB);
    const diff = Math.abs(statsA.meanOvr - statsB.meanOvr);

    if (diff <= 0.5) break;

    let bestDiff = diff;
    let bestSwap: [number, number] | null = null;

    for (let i = 0; i < teamA.length; i++) {
      for (let j = 0; j < teamB.length; j++) {
        if (teamA[i].position !== teamB[j].position) continue;

        const newA = [...teamA.slice(0, i), teamB[j], ...teamA.slice(i + 1)];
        const newB = [...teamB.slice(0, j), teamA[i], ...teamB.slice(j + 1)];
        const newDiff = Math.abs(mean(newA.map(p => p.ovr)) - mean(newB.map(p => p.ovr)));
        const newStdDiff = Math.abs(stdDev(newA.map(p => p.ovr)) - stdDev(newB.map(p => p.ovr)));

        if (newDiff < bestDiff && newStdDiff <= 0.3) {
          bestDiff = newDiff;
          bestSwap = [i, j];
        }
      }
    }

    if (bestSwap) {
      const [i, j] = bestSwap;
      const tmp = teamA[i];
      teamA[i] = teamB[j];
      teamB[j] = tmp;
      swapsPerformed++;
    } else {
      break;
    }
  }

  // Mark captains
  const maxCompA = Math.max(...teamA.map(p => p.composite));
  const maxCompB = Math.max(...teamB.map(p => p.composite));
  teamA.forEach(p => { p.isCaptain = p.composite === maxCompA; });
  teamB.forEach(p => { p.isCaptain = p.composite === maxCompB; });

  const statsA = teamStats(teamA);
  const statsB = teamStats(teamB);
  const totalSum = statsA.totalComposite + statsB.totalComposite;
  const compositeDiff = Math.abs(statsA.totalComposite - statsB.totalComposite);

  return {
    teamA: { name: 'Team A', players: teamA, ...statsA },
    teamB: { name: 'Team B', players: teamB, ...statsB },
    balance: {
      meanDiff: round(Math.abs(statsA.meanOvr - statsB.meanOvr), 3),
      stdDiff: round(Math.abs(statsA.stdDevOvr - statsB.stdDevOvr), 3),
      compositeDiff: round(compositeDiff, 3),
      swapsPerformed,
      passed:
        Math.abs(statsA.meanOvr - statsB.meanOvr) <= 0.5 &&
        Math.abs(statsA.stdDevOvr - statsB.stdDevOvr) <= 0.3 &&
        (totalSum === 0 || compositeDiff / totalSum <= 0.1),
    },
  };
}
