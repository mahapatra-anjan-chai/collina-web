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
  if (!pending) {
    return NextResponse.json({ error: 'No pending result to approve' }, { status: 404 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const teamA: string[] = body.teamA ?? pending.teamA;
    const teamB: string[] = body.teamB ?? pending.teamB;
    const adjustments: WeightAdjustment[] = body.adjustments ?? [];
    // Manager's notes are the final official notes written to history
    const finalNotes: string = body.managerNotes ?? pending.notes ?? '';

    const resultStr = `Team A ${pending.scoreA} - Team B ${pending.scoreB}`;
    const today = new Date().toISOString().split('T')[0];

    await appendHistory({
      date: today,
      tab: 'VeloCT',
      teamA,
      teamB,
      result: resultStr,
      notes: finalNotes,
    });

    if (adjustments.length > 0) {
      await upsertAdjustments(adjustments);
    }

    await clearPendingPostgame();

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Approve error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
