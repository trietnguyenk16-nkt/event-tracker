import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { eventsToCsv, exportFields, type ExportEvent } from '@/lib/importExport';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rateLimit';

function eventForExport(event: Record<string, unknown>): ExportEvent {
  return Object.fromEntries(exportFields.map(field => [field, event[field]])) as ExportEvent;
}

export async function GET(request: NextRequest) {
  const rate = checkRateLimit(request, 'events-export', 20);
  if (!rate.allowed) return NextResponse.json({ error: 'Quá nhiều lần export, hãy thử lại sau.' }, { status: 429, headers: rateLimitHeaders(rate) });
  const params = request.nextUrl.searchParams;
  const format = params.get('format') === 'csv' ? 'csv' : 'json';
  const dateFrom = params.get('dateFrom'); const dateTo = params.get('dateTo'); const tag = params.get('tag'); const status = params.get('status');
  const events = await db.event.findMany({ where: { deleted_at: null, ...(dateFrom || dateTo ? { event_datetime: { ...(dateFrom ? { gte: new Date(`${dateFrom}T00:00:00.000Z`) } : {}), ...(dateTo ? { lt: new Date(new Date(`${dateTo}T00:00:00.000Z`).getTime() + 86_400_000) } : {}) } } : {}), ...(tag ? { tags: { has: tag } } : {}), ...(status === 'completed' ? { is_completed: true } : status === 'pending' ? { is_completed: false } : {}) }, orderBy: { event_datetime: 'asc' } });
  const safeEvents = events.map(event => eventForExport(event as unknown as Record<string, unknown>));
  if (format === 'csv') return new NextResponse(eventsToCsv(safeEvents), { headers: { ...rateLimitHeaders(rate), 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="event-tracker-export.csv"' } });
  return new NextResponse(JSON.stringify({ version: 1, exported_at: new Date().toISOString(), events: safeEvents }, null, 2), { headers: { ...rateLimitHeaders(rate), 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="event-tracker-export.json"' } });
}
