import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requestStructured } from '@/lib/ai';

const schema = { type: 'object', additionalProperties: false, properties: { conflicts: { type: 'array', items: { type: 'object', additionalProperties: false, properties: { first_event_id: { type: 'string' }, second_event_id: { type: 'string' }, reason: { type: 'string' }, suggestions: { type: 'array', items: { type: 'string' } } }, required: ['first_event_id', 'second_event_id', 'reason', 'suggestions'] } } }, required: ['conflicts'] };
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const now = new Date();
    const events = await db.event.findMany({ where: { is_completed: false, event_datetime: { gt: now } }, orderBy: { event_datetime: 'asc' }, take: 100 });
    const ruleConflicts = events.flatMap((event, index) => events.slice(index + 1).filter(other => Math.abs(event.event_datetime.getTime() - other.event_datetime.getTime()) < 30 * 60_000).map(other => ({ first_event_id: event.id, second_event_id: other.id, reason: 'Hai sự kiện cách nhau dưới 30 phút.', suggestions: ['Kéo dài khoảng cách giữa hai sự kiện.', 'Giữ nguyên event quan trọng hơn và dời event còn lại.'] })));
    const result = await requestStructured<{ conflicts: Array<{ first_event_id: string; second_event_id: string; reason: string; suggestions: string[] }> }>({ model: body.model, schemaName: 'event_conflicts', schema, system: 'Bạn phân tích xung đột lịch. Chỉ dùng event được cung cấp. Không tự sửa lịch. Trả lời tiếng Việt.', user: JSON.stringify(events.map(event => ({ id: event.id, title: event.title, datetime: event.event_datetime, description: event.description }))) });
    if (!result.ok) return NextResponse.json({ configured: result.reason !== 'missing_key', error: result.reason, conflicts: ruleConflicts, model: result.model });
    return NextResponse.json({ configured: true, conflicts: result.data.conflicts, model: result.model });
  } catch { return NextResponse.json({ error: 'Không thể phân tích conflict' }, { status: 400 }); }
}
