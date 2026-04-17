import { NextRequest } from 'next/server';

export function verifyAdminToken(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  const token = authHeader.slice(7);
  return token === process.env.ADMIN_TOKEN;
}
