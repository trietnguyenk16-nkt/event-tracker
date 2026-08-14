import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requestStructured } from '@/lib/ai';

const schema = { type: 'object', additionalProperties: false, properties: { summary: { type: 'string' }, priorities: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { event_id: { type: 'string' }, reason: { type: 'string' }, score: { type: 'integer' } }, required: ['event_id', 'reason', 'score'] } }, risks: { type: 'array', items: { type: 'string' } } }, required: ['summary', 'priorities', 'risks'] };
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const from = new Date(typeof body.from === 'string' ? body.from : new Date().toISOString());
    const to = new Date(from.getTime() + 7 * 86_400_000);
    const events = await db.event.findMany({ where: { event_datetime: { gte: from, lt: to } }, orderBy: { event_datetime: 'asc' }, take: 100 });
    const result = await requestStructured<{ summary: string; priorities: Array<{ event_id: string; reason: string; score: number }>; risks: string[] }>({ model: body.model, schemaName: 'agenda_insight', schema, system: 'Bạn phân tích lịch cá nhân. Chỉ dùng event được cung cấp, không bịa deadline. Ưu tiên event gần nhất, chưa hoàn thành, có reminder hoặc tag công việc. Trả lời tiếng Việt ngắn gọn.', user: JSON.stringify(events.map(event => ({ id: event.id, title: event.title, description: event.description, datetime: event.event_datetime, tags: event.tags, completed: event.is_completed, reminder: event.reminder_offset_minutes }))) });
    if (!result.ok) return NextResponse.json({ configured: result.reason !== 'missing_key', error: result.reason, fallback: { summary: `${events.length} sự kiện trong 7 ngày tới.`, priorities: events.filter(event => !event.is_completed).slice(0, 3).map((event, index) => ({ event_id: event.id, reason: index === 0 ? 'Sự kiện sắp diễn ra nhất.' : 'Chưa hoàn thành.', score: 100 - index * 10 })), risks: [] }, model: result.model });
    return NextResponse.json({ configured: true, insight: result.data, model: result.model });
  } catch { return NextResponse.json({ error: 'Không thể tạo agenda' }, { status: 400 }); }
}
