import { kv } from '@vercel/kv';
import { WeightAdjustment, GameRecord, OfficialTeams, PendingPostgame } from './types';

const TAB = 'VeloCT';

// ── Adjustments ────────────────────────────────────────────────────────────

export async function getAdjustments(): Promise<WeightAdjustment[]> {
  try {
    const data = await kv.get<WeightAdjustment[]>(`adjustments:${TAB}`);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function saveAdjustments(adjustments: WeightAdjustment[]): Promise<void> {
  await kv.set(`adjustments:${TAB}`, adjustments);
}

export async function upsertAdjustments(incoming: WeightAdjustment[]): Promise<WeightAdjustment[]> {
  const existing = await getAdjustments();
  const merged = [...existing];
  for (const adj of incoming) {
    const idx = merged.findIndex(
      a => a.playerName === adj.playerName && a.attribute === adj.attribute
    );
    if (idx >= 0) merged[idx] = adj;
    else merged.push(adj);
  }
  await saveAdjustments(merged);
  return merged;
}

// ── Game history ────────────────────────────────────────────────────────────

export async function getHistory(): Promise<GameRecord[]> {
  try {
    const data = await kv.get<GameRecord[]>(`history:${TAB}`);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function appendHistory(record: GameRecord): Promise<void> {
  const history = await getHistory();
  history.push(record);

  // Prune entries older than 1 year
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const pruned = history.filter(g => new Date(g.date) >= oneYearAgo);

  await kv.set(`history:${TAB}`, pruned);
}

// ── Official (locked/published) teams ──────────────────────────────────────

export async function getOfficialTeams(): Promise<OfficialTeams | null> {
  try {
    return await kv.get<OfficialTeams>(`official:${TAB}`);
  } catch {
    return null;
  }
}

export async function saveOfficialTeams(teams: OfficialTeams): Promise<void> {
  await kv.set(`official:${TAB}`, teams);
}

// ── Suggested teams (latest, editable by anyone until locked) ──────────────

export interface SuggestedTeams {
  teamA: string[];
  teamB: string[];
  suggestedAt: string;
}

export async function getSuggestedTeams(): Promise<SuggestedTeams | null> {
  try {
    return await kv.get<SuggestedTeams>(`suggested:${TAB}`);
  } catch {
    return null;
  }
}

export async function saveSuggestedTeams(teams: SuggestedTeams): Promise<void> {
  await kv.set(`suggested:${TAB}`, teams);
}

export async function clearSuggestedTeams(): Promise<void> {
  await kv.del(`suggested:${TAB}`);
}

// ── Original teams (algorithm output, immutable) ────────────────────────────
// Stored separately so admin can always revert manual shuffles back to this.

export interface OriginalTeams {
  teamA: string[];
  teamB: string[];
  generatedAt: string;
}

export async function getOriginalTeams(): Promise<OriginalTeams | null> {
  try {
    return await kv.get<OriginalTeams>(`original:${TAB}`);
  } catch {
    return null;
  }
}

export async function saveOriginalTeams(teams: OriginalTeams): Promise<void> {
  await kv.set(`original:${TAB}`, teams);
}

// ── Pending post-game result ────────────────────────────────────────────────
// Submitted by anyone after the game. Admin must approve before it hits history.

export async function getPendingPostgame(): Promise<PendingPostgame | null> {
  try {
    return await kv.get<PendingPostgame>(`pending_postgame:${TAB}`);
  } catch {
    return null;
  }
}

export async function savePendingPostgame(data: PendingPostgame): Promise<void> {
  await kv.set(`pending_postgame:${TAB}`, data);
}

export async function clearPendingPostgame(): Promise<void> {
  await kv.del(`pending_postgame:${TAB}`);
}

// Copies original back to suggested (admin revert)
export async function revertSuggestedToOriginal(): Promise<OriginalTeams | null> {
  const original = await getOriginalTeams();
  if (!original) return null;
  await saveSuggestedTeams({
    teamA: original.teamA,
    teamB: original.teamB,
    suggestedAt: new Date().toISOString(),
  });
  return original;
}
