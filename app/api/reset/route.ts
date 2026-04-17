import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { clearOfficialTeams, clearSuggestedTeams, clearPendingPostgame } from '@/lib/kv';
import { kv } from '@vercel/kv';

const TAB = 'VeloCT';

export async function POST(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Wipe all team state so players can generate fresh
  await Promise.all([
    clearOfficialTeams(),
    clearSuggestedTeams(),
    clearPendingPostgame(),
    kv.del(`original:${TAB}`),
  ]);

  return NextResponse.json({ ok: true });
}
