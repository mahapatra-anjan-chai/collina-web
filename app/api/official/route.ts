import { NextResponse } from 'next/server';
import { getOfficialTeams } from '@/lib/kv';

export async function GET() {
  try {
    const teams = await getOfficialTeams();
    if (!teams) {
      return NextResponse.json({ teams: null });
    }
    // Strip stats — public sees names only
    return NextResponse.json({
      teams: {
        teamA: teams.teamA,
        teamB: teams.teamB,
        generatedAt: teams.generatedAt,
        locked: teams.locked,
      },
    }, {
      headers: { 'Cache-Control': 'public, max-age=120, stale-while-revalidate=30' },
    });
  } catch (err) {
    console.error('Official error:', err);
    return NextResponse.json({ teams: null });
  }
}
