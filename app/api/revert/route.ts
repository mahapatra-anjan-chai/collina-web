import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { revertSuggestedToOriginal } from '@/lib/kv';

export async function POST(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const original = await revertSuggestedToOriginal();
  if (!original) {
    return NextResponse.json({ error: 'No original teams to revert to' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, teams: original });
}
