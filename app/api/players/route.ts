import { NextRequest, NextResponse } from 'next/server';
import {
  getActivePlayers,
  getExtraPlayers,
  saveExtraPlayers,
  getRemovedPlayers,
  saveRemovedPlayers,
} from '@/lib/kv';
import { verifyAdminToken } from '@/lib/auth';
import { Player, Position } from '@/lib/types';
import playersData from '@/data/players.json';

const BASE_PLAYERS = playersData.VeloCT as Player[];
const VALID_POSITIONS: Position[] = ['Keeper', 'Defender', 'Mid', 'Striker'];

// GET — public. Returns active players: base (minus removed) + manager-added extras.
export async function GET() {
  const activePlayers = await getActivePlayers();
  return NextResponse.json({ players: activePlayers });
}

// POST — manager only. Adds a new player to extra_players KV.
export async function POST(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const { name, position, dp, defending, shooting, pace, notes } = body;

  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!VALID_POSITIONS.includes(position)) return NextResponse.json({ error: 'Invalid position' }, { status: 400 });

  const skills = { dp: Number(dp), defending: Number(defending), shooting: Number(shooting), pace: Number(pace) };
  for (const [key, val] of Object.entries(skills)) {
    if (isNaN(val) || val < 0 || val > 10) {
      return NextResponse.json({ error: `${key} must be between 0 and 10` }, { status: 400 });
    }
  }

  // Duplicate check against active players only (excluding removed base players)
  const [extra, removed] = await Promise.all([getExtraPlayers(), getRemovedPlayers()]);
  const removedSet = new Set(removed.map(n => n.toLowerCase()));
  const activeNames = [
    ...BASE_PLAYERS.filter(p => !removedSet.has(p.name.toLowerCase())).map(p => p.name.toLowerCase()),
    ...extra.map(p => p.name.toLowerCase()),
  ];
  if (activeNames.includes(name.trim().toLowerCase())) {
    return NextResponse.json({ error: `A player named "${name.trim()}" already exists` }, { status: 409 });
  }

  const newPlayer: Player = {
    name: name.trim(),
    position,
    dp: skills.dp,
    defending: skills.defending,
    shooting: skills.shooting,
    pace: skills.pace,
    ...(notes?.trim() ? { notes: notes.trim() } : {}),
  };

  await saveExtraPlayers([...extra, newPlayer]);
  return NextResponse.json({ ok: true, player: newPlayer });
}

// DELETE — manager only. Removes any player by name.
// Base players go into removed_players KV (filtered out of GET).
// Extra players are removed from extra_players KV directly.
export async function DELETE(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const [extra, removed] = await Promise.all([getExtraPlayers(), getRemovedPlayers()]);
  const nameLower = name.toLowerCase();

  const isBase = BASE_PLAYERS.some(p => p.name.toLowerCase() === nameLower);
  const isExtra = extra.some(p => p.name.toLowerCase() === nameLower);

  if (!isBase && !isExtra) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  if (isBase) {
    // Add to removed list so GET filters them out
    if (!removed.map(n => n.toLowerCase()).includes(nameLower)) {
      await saveRemovedPlayers([...removed, name]);
    }
  } else {
    // Remove from extra_players
    await saveExtraPlayers(extra.filter(p => p.name.toLowerCase() !== nameLower));
  }

  return NextResponse.json({ ok: true });
}
