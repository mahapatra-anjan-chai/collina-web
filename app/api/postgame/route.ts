import { NextRequest, NextResponse } from 'next/server';
import { getOfficialTeams, getPendingPostgame, savePendingPostgame, getHistory } from '@/lib/kv';

// GET — returns pending submission + latest approved result (public)
export async function GET() {
  const [pending, history] = await Promise.all([
    getPendingPostgame(),
    getHistory(),
  ]);
  const latestResult = history.length > 0 ? history[history.length - 1] : null;
  return NextResponse.json({ pending, latestResult });
}

// POST — public submission (no auth). Goes to pending, not history.
export async function POST(request: NextRequest) {
  const official = await getOfficialTeams();
  if (!official?.locked) {
    return NextResponse.json(
      { error: 'Teams must be finalised before logging a result' },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { scoreA, scoreB, notes, teamA, teamB } = body;

    if (scoreA === undefined || scoreB === undefined) {
      return NextResponse.json({ error: 'scoreA and scoreB are required' }, { status: 400 });
    }

    // Use user-submitted teams if provided (field subs), otherwise fall back to official
    const finalTeamA: string[] = Array.isArray(teamA) && teamA.length > 0 ? teamA : official.teamA;
    const finalTeamB: string[] = Array.isArray(teamB) && teamB.length > 0 ? teamB : official.teamB;

    await savePendingPostgame({
      teamA: finalTeamA,
      teamB: finalTeamB,
      scoreA: Number(scoreA),
      scoreB: Number(scoreB),
      notes: notes ?? '',
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Postgame submit error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
