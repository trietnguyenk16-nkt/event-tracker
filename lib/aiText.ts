type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord { return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : {}; }
function text(value: unknown, fallback = '') { return typeof value === 'string' ? value.trim() : fallback; }
function list(value: unknown): unknown[] { return Array.isArray(value) ? value : []; }
function titleCase(value: string) { return value ? value.charAt(0).toUpperCase() + value.slice(1) : value; }

export function formatAIResponse(active: 'capture' | 'agenda' | 'conflicts' | 'search', payload: unknown): string {
  const root = record(payload);
  if (root.error && !root.draft && !root.insight && !root.agenda && !root.conflicts && !root.answer) return `AI chưa thể xử lý yêu cầu.\n${text(root.error, 'Vui lòng thử lại sau.')}`;
  if (active === 'capture') {
    const draft = record(root.draft);
    if (!draft.title) return text(root.error, 'Chưa tạo được bản nháp sự kiện.');
    const when = text(draft.event_datetime, 'chưa có thời gian');
    const clarification = draft.needs_clarification ? text(draft.clarification, 'Cần bổ sung ngày hoặc giờ.') : '';
    return `Bản nháp sự kiện\n\n${text(draft.title)}\nThời gian: ${when}${draft.timezone ? ` (${text(draft.timezone)})` : ''}${draft.description ? `\nMô tả: ${text(draft.description)}` : ''}${list(draft.tags).length ? `\nTags: ${list(draft.tags).map(item => text(item)).filter(Boolean).join(', ')}` : ''}${clarification ? `\n\nCần làm rõ: ${clarification}` : '\n\nBạn có thể xác nhận và chỉnh sửa bản nháp trước khi lưu.'}`;
  }
  if (active === 'search') {
    return text(root.answer, text(root.error, 'Không tìm thấy thông tin phù hợp trong lịch.'));
  }
  if (active === 'conflicts') {
    const conflicts = list(root.conflicts);
    if (!conflicts.length) return 'Không phát hiện xung đột đáng chú ý trong khoảng thời gian đã kiểm tra.';
    return `Phát hiện ${conflicts.length} nhóm xung đột\n\n${conflicts.map((item, index) => { const conflict = record(item); const reason = text(conflict.reason, 'Các sự kiện có thời gian gần nhau.'); const suggestions = list(conflict.suggestions).map(value => text(value)).filter(Boolean); return `${index + 1}. ${reason}${suggestions.length ? `\n   Gợi ý: ${suggestions.join('; ')}` : ''}`; }).join('\n\n')}`;
  }
  const insight = record(root.insight ?? root.agenda ?? root);
  const summary = text(insight.summary ?? insight.overview, 'Đây là tổng quan lịch của bạn.');
  const priorities = list(insight.priorities ?? insight.items ?? insight.events);
  if (!priorities.length) return titleCase(summary);
  return `Tổng quan lịch\n\n${summary}\n\nƯu tiên đề xuất:\n${priorities.map((item, index) => { const entry = record(item); const label = text(entry.title ?? entry.name, `Mục ${index + 1}`); const reason = text(entry.reason ?? entry.description, 'Nên kiểm tra trong lịch.'); return `${index + 1}. ${label} — ${reason}`; }).join('\n')}`;
}
