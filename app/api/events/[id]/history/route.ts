import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const history = await db.eventHistory.findMany({ where: { event_id: id }, orderBy: { created_at: 'desc' }, take: 100 });
    return NextResponse.json({ data: history });
  } catch {
    return NextResponse.json({ error: 'Không thể tải lịch sử' }, { status: 404 });
  }
}
