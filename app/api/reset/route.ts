import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { clearOfficialTeams, clearSuggestedTeams } from '@/lib/kv';
import { kv } from '@vercel/kv';

const TAB = 'VeloCT';

export async function POST(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Wipe team state only — pending post-game results are preserved
  // (already-approved results are in history:VeloCT and are never touched)
  await Promise.all([
    clearOfficialTeams(),
    clearSuggestedTeams(),
    kv.del(`original:${TAB}`),
  ]);

  return NextResponse.json({ ok: true });
}
