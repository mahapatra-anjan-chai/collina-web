// One-time seed route: migrates existing game_history from weight_adjustments.json to KV.
// DELETE THIS FILE after seeding.
import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { kv } from '@vercel/kv';
import { GameRecord } from '@/lib/types';

export async function POST(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { history }: { history: GameRecord[] } = body;

    if (!Array.isArray(history)) {
      return NextResponse.json({ error: 'history must be an array' }, { status: 400 });
    }

    await kv.set('history:VeloCT', history);
    return NextResponse.json({ ok: true, seeded: history.length });
  } catch (err) {
    console.error('Seed error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
