import { NextResponse } from 'next/server';
import { getSuggestedTeams } from '@/lib/kv';

export async function GET() {
  const teams = await getSuggestedTeams();
  if (!teams) {
    return NextResponse.json({ teams: null });
  }
  return NextResponse.json({ teams });
}
