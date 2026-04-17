import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/auth';
import { getAdjustments, upsertAdjustments } from '@/lib/kv';
import { WeightAdjustment } from '@/lib/types';

export async function GET() {
  try {
    const adjustments = await getAdjustments();
    return NextResponse.json({ adjustments });
  } catch (err) {
    console.error('Adjustments GET error:', err);
    return NextResponse.json({ adjustments: [] });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyAdminToken(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { adjustments }: { adjustments: WeightAdjustment[] } = body;

    if (!Array.isArray(adjustments)) {
      return NextResponse.json({ error: 'adjustments must be an array' }, { status: 400 });
    }

    const merged = await upsertAdjustments(adjustments);
    return NextResponse.json({ ok: true, adjustments: merged });
  } catch (err) {
    console.error('Adjustments POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
