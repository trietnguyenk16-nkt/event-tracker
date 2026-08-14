import { describe, expect, it } from 'vitest';
import { buildEventReminderHtml } from './email';
import { isReminderDue, isWithinReminderHorizon } from './reminders';

const now = new Date('2026-08-14T10:00:00.000Z');
const base = { is_completed: false, email: 'test@example.com', reminder_sent_at: null };

describe('reminder timing', () => {
  it('đến hạn với reminder 30 phút', () => {
    expect(isReminderDue({ ...base, reminder_offset_minutes: 30, event_datetime: new Date('2026-08-14T10:30:00.000Z') }, now)).toBe(true);
  });

  it('chưa đến hạn với reminder 2 giờ', () => {
    expect(isReminderDue({ ...base, reminder_offset_minutes: 120, event_datetime: new Date('2026-08-14T13:30:00.000Z') }, now)).toBe(false);
  });

  it('đến hạn với reminder 1 ngày', () => {
    expect(isReminderDue({ ...base, reminder_offset_minutes: 1440, event_datetime: new Date('2026-08-15T09:00:00.000Z') }, now)).toBe(true);
  });

  it('không gửi cho event đã hoàn thành', () => {
    expect(isReminderDue({ ...base, is_completed: true, reminder_offset_minutes: 30, event_datetime: new Date('2026-08-14T10:30:00.000Z') }, now)).toBe(false);
  });

  it('không gửi lặp khi reminder_sent_at đã có', () => {
    expect(isReminderDue({ ...base, reminder_sent_at: new Date('2026-08-14T09:00:00.000Z'), reminder_offset_minutes: 30, event_datetime: new Date('2026-08-14T10:30:00.000Z') }, now)).toBe(false);
  });

  it('không gửi khi thiếu email hoặc cấu hình reminder', () => {
    expect(isReminderDue({ ...base, email: null, reminder_offset_minutes: 30, event_datetime: new Date('2026-08-14T10:30:00.000Z') }, now)).toBe(false);
    expect(isReminderDue({ ...base, reminder_offset_minutes: null, event_datetime: new Date('2026-08-14T10:30:00.000Z') }, now)).toBe(false);
  });

  it('chỉ xét event trong horizon 24 giờ', () => {
    expect(isWithinReminderHorizon({ ...base, event_datetime: new Date('2026-08-15T09:59:59.000Z') }, now)).toBe(true);
    expect(isWithinReminderHorizon({ ...base, event_datetime: new Date('2026-08-15T10:00:00.000Z') }, now)).toBe(false);
  });
});

describe('reminder email template', () => {
  it('escape nội dung HTML trong email reminder', () => {
    const html = buildEventReminderHtml({ title: '<script>alert(1)</script>', description: 'A & B', eventDate: now });
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('A &amp; B');
    expect(html).not.toContain('<script>');
  });
});
