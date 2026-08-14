import { describe, expect, it } from 'vitest';
import { eventsToCsv, normalizeImportRow, parseCsv, rowIdempotencyKey } from './importExport';

describe('importExport', () => {
  it('round-trips quoted CSV fields and tags', () => {
    const csv = eventsToCsv([{ title: 'Họp, quan trọng', description: 'Dòng 1\nDòng 2', event_datetime: '2026-08-20T07:30:00.000Z', timezone: 'Asia/Ho_Chi_Minh', tags: ['công việc', 'urgent'], is_completed: false, reminder_offset_minutes: 120, email: 'a@example.com', duration_value: null, duration_unit: null, recurrence_rule: null, recurrence_end: null, recurrence_count: null }]);
    const rows = parseCsv(csv);
    expect(rows[0].title).toBe('Họp, quan trọng');
    expect(rows[0].description).toContain('Dòng 2');
    expect(rows[0].tags).toBe('công việc|urgent');
  });

  it('reports missing title and malformed date without throwing', () => {
    const result = normalizeImportRow({ title: '', event_datetime: 'not-a-date' });
    expect(result.success).toBe(false);
  });

  it('creates a stable duplicate key for the same row', () => {
    const row = { title: 'Planning', event_datetime: new Date('2026-08-20T07:30:00.000Z'), timezone: 'Asia/Ho_Chi_Minh', tags: ['work'] };
    expect(rowIdempotencyKey(row)).toBe(rowIdempotencyKey({ ...row }));
  });
});
