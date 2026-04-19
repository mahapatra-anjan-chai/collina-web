import { NextRequest, NextResponse } from 'next/server';
import { getExtraPlayers, saveExtraPlayers } from '@/lib/kv';
import { verifyAdminToken } from '@/lib/auth';
import { Player, Position } from '@/lib/types';
import playersData from '@/data/players.json';

const BASE_PLAYERS = playersData.VeloCT as Player[];
const VALID_POSITIONS: Position[] = ['Keeper', 'Defender', 'Mid', 'Striker'];

// GET — public. Returns merged list: static base + manager-added players.
export async function GET() {
  const extra = await getExtraPlayers();
  return NextResponse.json({ players: [...BASE_PLAYERS, ...extra] });
}

// POST — manager only. Adds a new player to extra_players KV.
export async function POST(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const { name, position, dp, defending, shooting, pace, notes } = body;

  // Validate required fields
  if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  if (!VALID_POSITIONS.includes(position)) return NextResponse.json({ error: 'Invalid position' }, { status: 400 });

  const skills = { dp: Number(dp), defending: Number(defending), shooting: Number(shooting), pace: Number(pace) };
  for (const [key, val] of Object.entries(skills)) {
    if (isNaN(val) || val < 0 || val > 10) {
      return NextResponse.json({ error: `${key} must be between 0 and 10` }, { status: 400 });
    }
  }

  // Check for duplicate name across base + extra
  const extra = await getExtraPlayers();
  const allNames = [...BASE_PLAYERS, ...extra].map(p => p.name.toLowerCase());
  if (allNames.includes(name.trim().toLowerCase())) {
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

// DELETE — manager only. Removes a player from extra_players by name.
// Cannot delete base (static JSON) players.
export async function DELETE(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const name = body?.name?.trim();
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 });

  const isBase = BASE_PLAYERS.some(p => p.name.toLowerCase() === name.toLowerCase());
  if (isBase) return NextResponse.json({ error: 'Cannot delete a base player' }, { status: 403 });

  const extra = await getExtraPlayers();
  const filtered = extra.filter(p => p.name.toLowerCase() !== name.toLowerCase());

  if (filtered.length === extra.length) {
    return NextResponse.json({ error: 'Player not found' }, { status: 404 });
  }

  await saveExtraPlayers(filtered);
  return NextResponse.json({ ok: true });
}
