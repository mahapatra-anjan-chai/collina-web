import { NextRequest, NextResponse } from 'next/server';
import { generateTeams } from '@/lib/algorithm';
import { getAdjustments } from '@/lib/kv';
import { Player, Position } from '@/lib/types';
import playersData from '@/data/players.json';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { selectedNames }: { selectedNames: string[] } = body;

    if (!Array.isArray(selectedNames) || selectedNames.length !== 16) {
      return NextResponse.json({ error: 'Exactly 16 players required' }, { status: 400 });
    }

    const allPlayers = playersData.VeloCT as Player[];
    const selected = selectedNames
      .map(name => allPlayers.find(p => p.name === name))
      .filter((p): p is Player => p !== undefined);

    if (selected.length !== 16) {
      const notFound = selectedNames.filter(n => !allPlayers.find(p => p.name === n));
      return NextResponse.json({ error: `Players not found: ${notFound.join(', ')}` }, { status: 400 });
    }

    // Validate positions
    const validPositions: Position[] = ['Keeper', 'Defender', 'Mid', 'Striker'];
    const invalidPositions = selected.filter(p => !validPositions.includes(p.position as Position));
    if (invalidPositions.length > 0) {
      return NextResponse.json(
        { error: `Invalid positions for: ${invalidPositions.map(p => p.name).join(', ')}` },
        { status: 400 }
      );
    }

    const adjustments = await getAdjustments();
    const result = generateTeams(selected, adjustments);

    return NextResponse.json(result);
  } catch (err) {
    console.error('Generate error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
