import { NextRequest, NextResponse } from 'next/server';
import { requestStructured } from '@/lib/ai';

const schema = { type: 'object', additionalProperties: false, properties: { title: { type: 'string' }, description: { type: ['string', 'null'] }, event_datetime: { type: 'string' }, timezone: { type: 'string' }, duration_minutes: { type: ['integer', 'null'] }, tags: { type: 'array', items: { type: 'string' } }, reminder_offset_minutes: { type: ['integer', 'null'] }, email: { type: ['string', 'null'] }, needs_clarification: { type: 'boolean' }, clarification: { type: ['string', 'null'] } }, required: ['title', 'description', 'event_datetime', 'timezone', 'duration_minutes', 'tags', 'reminder_offset_minutes', 'email', 'needs_clarification', 'clarification'] };
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = typeof body.text === 'string' ? body.text.trim().slice(0, 4000) : '';
    if (!text) return NextResponse.json({ error: 'Thiếu nội dung cần phân tích' }, { status: 400 });
    const result = await requestStructured({ model: body.model, schemaName: 'event_draft', schema, system: 'Bạn là trợ lý nhập lịch tiếng Việt. Trích xuất thành JSON. Dùng timezone Asia/Ho_Chi_Minh nếu người dùng không nói rõ. Nếu thiếu ngày hoặc giờ quan trọng, đặt needs_clarification=true. Không tự bịa địa chỉ email.', user: `Bây giờ là ${new Date().toISOString()}. Hãy tạo bản nháp event từ câu sau:\n${text}` });
    if (!result.ok) return NextResponse.json({ configured: result.reason !== 'missing_key', error: result.reason, draft: null, model: result.model });
    return NextResponse.json({ configured: true, draft: result.data, model: result.model, requiresConfirmation: true });
  } catch { return NextResponse.json({ error: 'Payload không hợp lệ' }, { status: 400 }); }
}
