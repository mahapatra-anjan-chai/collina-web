import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { appendHistory, upsertAdjustments } from '@/lib/kv';
import { WeightAdjustment } from '@/lib/types';

export async function POST(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      teamA,
      teamB,
      result,
      notes,
      adjustments,
    }: {
      teamA: string[];
      teamB: string[];
      result: string;
      notes: string;
      adjustments?: WeightAdjustment[];
    } = body;

    const today = new Date().toISOString().split('T')[0];

    await appendHistory({
      date: today,
      tab: 'VeloCT',
      teamA,
      teamB,
      result,
      notes: notes ?? '',
    });

    if (adjustments && adjustments.length > 0) {
      await upsertAdjustments(adjustments);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Postgame error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
