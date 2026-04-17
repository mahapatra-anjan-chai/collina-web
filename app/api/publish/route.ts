import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { saveOfficialTeams, clearSuggestedTeams } from '@/lib/kv';

export async function POST(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { teamA, teamB, generatedAt } = body;

    if (!Array.isArray(teamA) || !Array.isArray(teamB)) {
      return NextResponse.json({ error: 'teamA and teamB must be arrays of names' }, { status: 400 });
    }

    await Promise.all([
      saveOfficialTeams({
        teamA,
        teamB,
        generatedAt: generatedAt ?? new Date().toISOString(),
        locked: true,
      }),
      clearSuggestedTeams(),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Publish error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
