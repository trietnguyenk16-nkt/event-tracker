import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const schema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  event_datetime: z.coerce.date(),
  tags: z.array(z.string()).max(20).default([]),
  is_completed: z.boolean().default(false),
  reminder_offset_minutes: z.number().int().min(0).max(10080).nullable().optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
});

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Lọc server-side để client không phải tải toàn bộ dữ liệu.
 * date dùng định dạng YYYY-MM-DD; tag khớp chính xác một phần tử trong mảng tags.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const date = params.get('date')?.trim() || undefined;
  const tag = params.get('tag')?.trim() || undefined;
  const status = params.get('status')?.trim() || 'all';
  const page = Math.max(Number.parseInt(params.get('page') ?? '1', 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(params.get('limit') ?? '50', 10) || 50, 1), 100);

  if (date && (!datePattern.test(date) || Number.isNaN(new Date(`${date}T00:00:00.000Z`).getTime()))) {
    return NextResponse.json({ error: 'date phải có định dạng YYYY-MM-DD hợp lệ' }, { status: 400 });
  }
  if (!['all', 'completed', 'pending'].includes(status)) {
    return NextResponse.json({ error: 'status phải là all, completed hoặc pending' }, { status: 400 });
  }

  const where = {
    ...(date ? {
      event_datetime: {
        gte: new Date(`${date}T00:00:00.000Z`),
        lt: new Date(new Date(`${date}T00:00:00.000Z`).getTime() + 86_400_000),
      },
    } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
    ...(status === 'completed' ? { is_completed: true } : {}),
    ...(status === 'pending' ? { is_completed: false } : {}),
  };

  const [events, total] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { event_datetime: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.event.count({ where }),
  ]);

  return NextResponse.json({
    data: events,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    filters: { date: date ?? null, tag: tag ?? null, status },
  });
}

export async function POST(request: NextRequest) {
  try {
    const event = await db.event.create({ data: schema.parse(await request.json()) });
    return NextResponse.json(event, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
  }
}
