import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requestStructured } from '@/lib/ai';

const schema = { type: 'object', additionalProperties: false, properties: { answer: { type: 'string' }, event_ids: { type: 'array', items: { type: 'string' } } }, required: ['answer', 'event_ids'] };
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query = typeof body.query === 'string' ? body.query.trim().slice(0, 1000) : '';
    if (!query) return NextResponse.json({ error: 'Thiếu câu hỏi' }, { status: 400 });
    const all = await db.event.findMany({ orderBy: { event_datetime: 'asc' }, take: 200 });
    const normalized = query.toLowerCase();
    const matches = all.filter(event => `${event.title} ${event.description ?? ''} ${event.tags.join(' ')}`.toLowerCase().includes(normalized));
    const result = await requestStructured<{ answer: string; event_ids: string[] }>({ model: body.model, schemaName: 'calendar_search', schema, system: 'Bạn trả lời câu hỏi về lịch. Chỉ sử dụng event được cung cấp, không bịa thông tin. Trả event_ids làm nguồn.', user: JSON.stringify({ query, events: all.map(event => ({ id: event.id, title: event.title, description: event.description, datetime: event.event_datetime, tags: event.tags })) }) });
    if (!result.ok) return NextResponse.json({ configured: result.reason !== 'missing_key', error: result.reason, answer: matches.length ? `Tìm thấy ${matches.length} sự kiện phù hợp theo tìm kiếm chính xác.` : 'Không tìm thấy sự kiện phù hợp.', event_ids: matches.map(event => event.id), model: result.model });
    return NextResponse.json({ configured: true, ...result.data, model: result.model });
  } catch { return NextResponse.json({ error: 'Không thể tìm kiếm lịch' }, { status: 400 }); }
}
