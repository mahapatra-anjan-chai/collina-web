import { NextRequest, NextResponse } from 'next/server';
import { getSuggestedTeams, saveSuggestedTeams, getOfficialTeams } from '@/lib/kv';

export async function GET() {
  const teams = await getSuggestedTeams();
  if (!teams) return NextResponse.json({ teams: null });
  return NextResponse.json({ teams });
}

export async function POST(request: NextRequest) {
  // Check lock before accepting any manual shuffles
  const official = await getOfficialTeams();
  if (official?.locked) {
    return NextResponse.json({ error: 'Teams are locked by admin' }, { status: 423 });
  }

  try {
    const body = await request.json();
    const { teamA, teamB } = body;

    if (!Array.isArray(teamA) || !Array.isArray(teamB)) {
      return NextResponse.json({ error: 'teamA and teamB must be arrays' }, { status: 400 });
    }
    if (teamA.length + teamB.length !== 16) {
      return NextResponse.json({ error: 'Must have exactly 16 players total' }, { status: 400 });
    }

    await saveSuggestedTeams({
      teamA,
      teamB,
      suggestedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Suggest error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
