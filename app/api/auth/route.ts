import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';

// Lightweight token verification — no side effects
export async function GET(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
