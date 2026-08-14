import { NextRequest, NextResponse } from 'next/server';
import { eventSchema } from '@/lib/eventSchema';
import { db } from '@/lib/db';
import { addDuration, buildRecurrenceDates } from '@/lib/dateRules';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rateLimit';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const recurrenceRules = ['daily', 'weekly', 'monthly'] as const;

function historyData(action: string, changes: unknown) {
  return { action, changes: changes as object };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const date = params.get('date')?.trim() || undefined;
  const tag = params.get('tag')?.trim() || undefined;
  const status = params.get('status')?.trim() || 'all';
  const page = Math.max(Number.parseInt(params.get('page') ?? '1', 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(params.get('limit') ?? '50', 10) || 50, 1), 100);

  if (date && (!datePattern.test(date) || Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime()))) return NextResponse.json({ error: 'date phải có định dạng YYYY-MM-DD hợp lệ' }, { status: 400 });
  if (!['all', 'completed', 'pending'].includes(status)) return NextResponse.json({ error: 'status phải là all, completed hoặc pending' }, { status: 400 });

  const where = {
    deleted_at: null,
    ...(date ? { event_datetime: { gte: new Date(`${date}T00:00:00.000Z`), lt: new Date(new Date(`${date}T00:00:00.000Z`).getTime() + 86_400_000) } } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(status === 'completed' ? { is_completed: true } : {}),
    ...(status === 'pending' ? { is_completed: false } : {}),
  };
  const [events, total] = await Promise.all([
    db.event.findMany({ where, orderBy: { event_datetime: 'asc' }, skip: (page - 1) * limit, take: limit }),
    db.event.count({ where }),
  ]);
  return NextResponse.json({ data: events, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }, filters: { date: date ?? null, tag: tag ?? null, status } });
}

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, 'events-write', 30);
  if (!rate.allowed) return NextResponse.json({ error: 'Quá nhiều yêu cầu, hãy thử lại sau.' }, { status: 429, headers: rateLimitHeaders(rate) });
  try {
    const body = await request.json();
    const parsed = eventSchema.parse(body);
    const idempotencyKey = typeof body.idempotency_key === 'string' ? body.idempotency_key.slice(0, 120) : undefined;
    const generateDuration = body.generate_duration === true;
    const generateRecurrence = body.generate_recurrence === true;
    if (parsed.duration_value && !parsed.duration_unit) return NextResponse.json({ error: 'Duration cần có đơn vị thời gian' }, { status: 400 });
    if (parsed.recurrence_rule && !recurrenceRules.includes(parsed.recurrence_rule)) return NextResponse.json({ error: 'Recurrence rule không hợp lệ' }, { status: 400 });

    const result = await db.$transaction(async tx => {
      if (idempotencyKey) {
        const existing = await tx.event.findUnique({ where: { idempotency_key: idempotencyKey }, include: { generated_events: true } });
        if (existing) return existing;
      }
      const root = await tx.event.create({ data: { ...parsed, idempotency_key: idempotencyKey } });
      await tx.eventHistory.create({ data: { event_id: root.id, ...historyData('created', { fields: Object.keys(parsed) }) } });
      if (generateDuration && parsed.duration_value && parsed.duration_unit) {
        const targetDate = addDuration(parsed.event_datetime, parsed.duration_value, parsed.duration_unit, parsed.timezone);
        const existing = await tx.event.findFirst({ where: { source_event_id: root.id, event_datetime: targetDate, duration_value: parsed.duration_value, duration_unit: parsed.duration_unit, deleted_at: null } });
        if (!existing) {
          const child = await tx.event.create({ data: { ...parsed, event_datetime: targetDate, source_event_id: root.id, recurrence_rule: null, recurrence_end: null, recurrence_count: null, recurrence_index: null, idempotency_key: null } });
          await tx.eventHistory.create({ data: { event_id: child.id, ...historyData('created', { generatedFrom: root.id, duration: `${parsed.duration_value} ${parsed.duration_unit}` }) } });
        }
      }
      if (generateRecurrence && parsed.recurrence_rule) {
        const dates = buildRecurrenceDates(parsed.event_datetime, parsed.recurrence_rule, parsed.timezone, parsed.recurrence_count, parsed.recurrence_end);
        for (const [index, eventDate] of dates.entries()) {
          const existing = await tx.event.findFirst({ where: { source_event_id: root.id, recurrence_index: index + 1, deleted_at: null } });
          if (existing) continue;
          const child = await tx.event.create({ data: { ...parsed, event_datetime: eventDate, source_event_id: root.id, duration_value: null, duration_unit: null, recurrence_index: index + 1, idempotency_key: null } });
          await tx.eventHistory.create({ data: { event_id: child.id, ...historyData('created', { generatedFrom: root.id, recurrenceIndex: index + 1 }) } });
        }
      }
      return tx.event.findUniqueOrThrow({ where: { id: root.id }, include: { generated_events: true } });
    });
    return NextResponse.json(result, { status: 201, headers: rateLimitHeaders(rate) });
  } catch (error) {
    console.error('[events] create failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ hoặc không thể tạo sự kiện', request_id: rate.requestId }, { status: 400, headers: rateLimitHeaders(rate) });
  }
}
