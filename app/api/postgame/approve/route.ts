import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { getPendingPostgame, clearPendingPostgame, appendHistory, upsertAdjustments } from '@/lib/kv';
import { WeightAdjustment } from '@/lib/types';

// POST — admin only. Approves pending result → writes to history.
export async function POST(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const pending = await getPendingPostgame();
  const body = await request.json().catch(() => ({}));

  // Direct-write mode: manager supplies all fields in body (e.g. retroactive logging)
  const isDirect = !pending && body.teamA && body.teamB && body.scoreA !== undefined && body.scoreB !== undefined;

  if (!pending && !isDirect) {
    return NextResponse.json({ error: 'No pending result to approve' }, { status: 404 });
  }

  try {
    const teamA: string[] = body.teamA ?? pending!.teamA;
    const teamB: string[] = body.teamB ?? pending!.teamB;
    const adjustments: WeightAdjustment[] = body.adjustments ?? [];
    // Manager's notes are the final official notes written to history
    const finalNotes: string = body.managerNotes ?? (pending?.notes ?? '');

    const scoreA = body.scoreA ?? pending!.scoreA;
    const scoreB = body.scoreB ?? pending!.scoreB;
    const resultStr = `Team A ${scoreA} - Team B ${scoreB}`;
    const gameDate: string = body.date ?? new Date().toISOString().split('T')[0];

    await Promise.all([
      appendHistory({
        date: gameDate,
        tab: 'VeloCT',
        teamA,
        teamB,
        result: resultStr,
        notes: finalNotes,
      }),
      adjustments.length > 0 ? upsertAdjustments(adjustments) : Promise.resolve(),
      pending ? clearPendingPostgame() : Promise.resolve(),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Approve error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
