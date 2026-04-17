import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/kv';

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
