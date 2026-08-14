import { describe, expect, it } from 'vitest';
import { eventSchema } from './eventSchema';

describe('eventSchema', () => {
  it('normalizes a valid event payload with defaults', () => {
    const parsed = eventSchema.parse({ title: '  Họp Minh  ', event_datetime: '2026-08-20T14:00:00+07:00' });
    expect(parsed.title).toBe('Họp Minh');
    expect(parsed.tags).toEqual([]);
    expect(parsed.is_completed).toBe(false);
    expect(parsed.event_datetime).toBeInstanceOf(Date);
  });

  it('rejects malformed or unsafe event input', () => {
    expect(eventSchema.safeParse({ title: '', event_datetime: 'not-a-date' }).success).toBe(false);
    expect(eventSchema.safeParse({ title: 'Valid', event_datetime: '2026-08-20', tags: new Array(21).fill('tag') }).success).toBe(false);
    expect(eventSchema.safeParse({ title: 'Valid', event_datetime: '2026-08-20', reminder_offset_minutes: 10081 }).success).toBe(false);
    expect(eventSchema.safeParse({ title: 'Valid', event_datetime: '2026-08-20', email: 'not-an-email' }).success).toBe(false);
  });
});
