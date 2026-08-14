import { describe, expect, it } from 'vitest';
import { addDuration, addRecurrence, buildRecurrenceDates, localDateTimeToUtc, utcToLocalDateTime } from './dateRules';

describe('dateRules', () => {
  it('preserves local time across timezone conversion', () => {
    const utc = localDateTimeToUtc('2026-08-20T14:30', 'Asia/Ho_Chi_Minh');
    expect(utc.toISOString()).toBe('2026-08-20T07:30:00.000Z');
    expect(utcToLocalDateTime(utc, 'America/Los_Angeles')).toBe('2026-08-20T00:30');
  });

  it('handles month-end duration and leap years', () => {
    const jan31 = localDateTimeToUtc('2024-01-31T09:00', 'UTC');
    expect(utcToLocalDateTime(addDuration(jan31, 1, 'month', 'UTC'), 'UTC')).toBe('2024-02-29T09:00');
    const leap = localDateTimeToUtc('2024-02-29T09:00', 'UTC');
    expect(utcToLocalDateTime(addDuration(leap, 1, 'year', 'UTC'), 'UTC')).toBe('2025-02-28T09:00');
  });

  it('builds bounded weekly recurrence dates', () => {
    const start = localDateTimeToUtc('2026-08-03T10:00', 'UTC');
    const dates = buildRecurrenceDates(start, 'weekly', 'UTC', 4);
    expect(dates).toHaveLength(3);
    expect(utcToLocalDateTime(dates[2], 'UTC')).toBe('2026-08-24T10:00');
    expect(utcToLocalDateTime(addRecurrence(start, 'monthly', 'UTC'), 'UTC')).toBe('2026-09-03T10:00');
  });
});
