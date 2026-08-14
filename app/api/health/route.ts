import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const started = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: 'ok', database: 'ok', duration_ms: Date.now() - started, timestamp: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ status: 'degraded', database: 'unavailable', duration_ms: Date.now() - started }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
