export type DurationUnit = 'day' | 'week' | 'month' | 'year';
export type RecurrenceRule = 'daily' | 'weekly' | 'monthly';

type LocalParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function partsFromDate(date: Date, timezone: string): LocalParts {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(date);
  const get = (type: string) => Number(parts.find(part => part.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute'), second: get('second') };
}

function timezoneOffsetMinutes(date: Date, timezone: string): number {
  const p = partsFromDate(date, timezone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

export function isValidTimezone(timezone: string): boolean {
  try { new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(); return true; } catch { return false; }
}

export function localDateTimeToUtc(value: string, timezone: string): Date {
  if (!isValidTimezone(timezone)) throw new Error('Invalid timezone');
  const [datePart, timePart = '00:00'] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const initialOffset = timezoneOffsetMinutes(guess, timezone);
  let result = new Date(guess.getTime() - initialOffset * 60000);
  const correctedOffset = timezoneOffsetMinutes(result, timezone);
  if (correctedOffset !== initialOffset) result = new Date(result.getTime() - (correctedOffset - initialOffset) * 60000);
  return result;
}

export function utcToLocalDateTime(date: Date | string, timezone: string): string {
  const p = partsFromDate(new Date(date), timezone);
  return `${String(p.year).padStart(4, '0')}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}T${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}

function localPartsToString(p: LocalParts): string {
  return `${String(p.year).padStart(4, '0')}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}T${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
}

function addCalendarParts(p: LocalParts, value: number, unit: DurationUnit | RecurrenceRule): LocalParts {
  const calendar = new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second));
  if (unit === 'day' || unit === 'daily') calendar.setUTCDate(calendar.getUTCDate() + value);
  if (unit === 'week' || unit === 'weekly') calendar.setUTCDate(calendar.getUTCDate() + value * 7);
  if (unit === 'month' || unit === 'monthly') {
    const originalDay = calendar.getUTCDate();
    calendar.setUTCDate(1);
    calendar.setUTCMonth(calendar.getUTCMonth() + value);
    const lastDay = new Date(Date.UTC(calendar.getUTCFullYear(), calendar.getUTCMonth() + 1, 0)).getUTCDate();
    calendar.setUTCDate(Math.min(originalDay, lastDay));
  }
  if (unit === 'year') {
    const month = calendar.getUTCMonth();
    calendar.setUTCDate(1);
    calendar.setUTCFullYear(calendar.getUTCFullYear() + value);
    calendar.setUTCMonth(month);
    const lastDay = new Date(Date.UTC(calendar.getUTCFullYear(), month + 1, 0)).getUTCDate();
    calendar.setUTCDate(Math.min(p.day, lastDay));
  }
  return { year: calendar.getUTCFullYear(), month: calendar.getUTCMonth() + 1, day: calendar.getUTCDate(), hour: calendar.getUTCHours(), minute: calendar.getUTCMinutes(), second: calendar.getUTCSeconds() };
}

export function addDuration(date: Date, value: number, unit: DurationUnit, timezone = 'UTC'): Date {
  const local = partsFromDate(date, timezone);
  return localDateTimeToUtc(localPartsToString(addCalendarParts(local, value, unit)), timezone);
}

export function addRecurrence(date: Date, rule: RecurrenceRule, timezone = 'UTC'): Date {
  const local = partsFromDate(date, timezone);
  return localDateTimeToUtc(localPartsToString(addCalendarParts(local, 1, rule)), timezone);
}

export function buildRecurrenceDates(start: Date, rule: RecurrenceRule, timezone: string, count?: number | null, end?: Date | null, max = 60): Date[] {
  const dates: Date[] = [];
  let cursor = start;
  for (let index = 1; index <= max; index += 1) {
    cursor = addRecurrence(cursor, rule, timezone);
    if (end && cursor > end) break;
    dates.push(cursor);
    if (count && index >= count - 1) break;
  }
  return dates;
}
