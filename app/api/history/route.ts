import { NextRequest, NextResponse } from 'next/server';
import { getHistory } from '@/lib/kv';
import { verifyAdminToken } from '@/lib/auth';
import { kv } from '@vercel/kv';

// Public endpoint — returns all game history within the last 12 months
export async function GET() {
  const history = await getHistory();

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const recent = history
    .filter(g => new Date(g.date) >= oneYearAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // newest first

  return NextResponse.json({ history: recent, total: recent.length });
}

// Admin only — removes duplicate entries (same date + result)
export async function DELETE(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const history = await getHistory();
  const seen = new Set<string>();
  const deduped = history.filter(g => {
    const key = `${g.date}|${g.result}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  await kv.set('history:VeloCT', deduped);
  return NextResponse.json({ ok: true, removed: history.length - deduped.length });
}
