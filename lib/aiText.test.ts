import { describe, expect, it } from 'vitest';
import { formatAIResponse } from './aiText';

describe('formatAIResponse', () => {
  it('formats agenda insight as readable Vietnamese text', () => {
    const output = formatAIResponse('agenda', { insight: { summary: 'Bạn có 3 sự kiện.', priorities: [{ title: 'Họp khách hàng', reason: 'Sự kiện gần nhất.' }] } });
    expect(output).toContain('Tổng quan lịch');
    expect(output).toContain('Họp khách hàng');
    expect(output).not.toContain('{');
  });

  it('formats conflicts and search without exposing structured JSON', () => {
    expect(formatAIResponse('conflicts', { conflicts: [{ reason: 'Hai sự kiện trùng giờ', suggestions: ['Đổi lịch một sự kiện'] }] })).toContain('Gợi ý');
    expect(formatAIResponse('search', { answer: 'Có một cuộc họp vào thứ Sáu.' })).toBe('Có một cuộc họp vào thứ Sáu.');
  });

  it('keeps quick capture clarification readable', () => {
    const output = formatAIResponse('capture', { draft: { title: 'Họp Minh', event_datetime: '', needs_clarification: true, clarification: 'Thiếu giờ bắt đầu' } });
    expect(output).toContain('Bản nháp sự kiện');
    expect(output).toContain('Cần làm rõ: Thiếu giờ bắt đầu');
  });
});
