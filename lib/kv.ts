import { kv } from '@vercel/kv';
import { WeightAdjustment, GameRecord, OfficialTeams, PendingPostgame, Player } from './types';
import playersData from '@/data/players.json';

const TAB = 'VeloCT';

// ── Session TTL ────────────────────────────────────────────────────────────
// Locked/published teams, the suggested split, and the original algorithm
// output all represent a single night of football. After 24 hours they're
// stale — a Tuesday lock should not still show in Thursday morning's banner.
// We belt-and-braces this: TTL on write (Vercel KV evicts the key) AND a
// read-time staleness check so any pre-existing keys are also cleaned up.
const SESSION_TTL_SECONDS = 24 * 60 * 60;

function isStale(isoTimestamp: string | undefined | null): boolean {
  if (!isoTimestamp) return false;
  const ts = Date.parse(isoTimestamp);
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts > SESSION_TTL_SECONDS * 1000;
}

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
    const data = await kv.get<OfficialTeams>(`official:${TAB}`);
    if (data && isStale(data.generatedAt)) {
      await kv.del(`official:${TAB}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function saveOfficialTeams(teams: OfficialTeams): Promise<void> {
  await kv.set(`official:${TAB}`, teams, { ex: SESSION_TTL_SECONDS });
}

export async function clearOfficialTeams(): Promise<void> {
  await kv.del(`official:${TAB}`);
}

// ── Suggested teams (latest, editable by anyone until locked) ──────────────

export interface SuggestedTeams {
  teamA: string[];
  teamB: string[];
  suggestedAt: string;
}

export async function getSuggestedTeams(): Promise<SuggestedTeams | null> {
  try {
    const data = await kv.get<SuggestedTeams>(`suggested:${TAB}`);
    if (data && isStale(data.suggestedAt)) {
      await kv.del(`suggested:${TAB}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function saveSuggestedTeams(teams: SuggestedTeams): Promise<void> {
  await kv.set(`suggested:${TAB}`, teams, { ex: SESSION_TTL_SECONDS });
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
    const data = await kv.get<OriginalTeams>(`original:${TAB}`);
    if (data && isStale(data.generatedAt)) {
      await kv.del(`original:${TAB}`);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function saveOriginalTeams(teams: OriginalTeams): Promise<void> {
  await kv.set(`original:${TAB}`, teams, { ex: SESSION_TTL_SECONDS });
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

// ── Extra players (manager-added, KV overlay on top of static JSON) ────────

export async function getExtraPlayers(): Promise<Player[]> {
  try {
    const data = await kv.get<Player[]>(`extra_players:${TAB}`);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function saveExtraPlayers(players: Player[]): Promise<void> {
  await kv.set(`extra_players:${TAB}`, players);
}

// ── Removed base players (names of static JSON players hidden by manager) ──

export async function getRemovedPlayers(): Promise<string[]> {
  try {
    const data = await kv.get<string[]>(`removed_players:${TAB}`);
    return data ?? [];
  } catch {
    return [];
  }
}

export async function saveRemovedPlayers(names: string[]): Promise<void> {
  await kv.set(`removed_players:${TAB}`, names);
}

// ── Active players (base − removed + extras) ───────────────────────────────
// The single source of truth used by every read path: home page, generate, etc.

const BASE_PLAYERS = playersData.VeloCT as Player[];

export async function getActivePlayers(): Promise<Player[]> {
  const [extra, removed] = await Promise.all([getExtraPlayers(), getRemovedPlayers()]);
  const removedSet = new Set(removed.map(n => n.toLowerCase()));
  const base = BASE_PLAYERS.filter(p => !removedSet.has(p.name.toLowerCase()));
  return [...base, ...extra];
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
