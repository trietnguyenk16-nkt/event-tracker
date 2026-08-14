import { createHash } from 'node:crypto';
import { eventSchema, type EventPayload } from './eventSchema';

export const exportFields = ['title', 'description', 'event_datetime', 'timezone', 'tags', 'is_completed', 'reminder_offset_minutes', 'email', 'duration_value', 'duration_unit', 'recurrence_rule', 'recurrence_end', 'recurrence_count'] as const;

export type ExportEvent = Record<(typeof exportFields)[number], unknown>;

export function rowIdempotencyKey(row: Partial<EventPayload>): string {
  const stable = [row.title, row.event_datetime instanceof Date ? row.event_datetime.toISOString() : row.event_datetime, row.timezone ?? 'Asia/Ho_Chi_Minh', (row.tags ?? []).join('|')].join('|');
  return `import-${createHash('sha256').update(stable).digest('hex').slice(0, 40)}`;
}

function csvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join('|') : value instanceof Date ? value.toISOString() : value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function eventsToCsv(events: ExportEvent[]): string {
  return [exportFields.join(','), ...events.map(event => exportFields.map(field => csvCell(event[field])).join(','))].join('\n');
}

export function parseCsv(input: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]; const next = input[i + 1];
    if (char === '"' && quoted && next === '"') { cell += '"'; i += 1; continue; }
    if (char === '"') { quoted = !quoted; continue; }
    if (char === ',' && !quoted) { row.push(cell); cell = ''; continue; }
    if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && next === '\n') i += 1; row.push(cell); if (row.some(value => value !== '')) rows.push(row); row = []; cell = ''; continue; }
    cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const headers = (rows.shift() ?? []).map(header => header.trim());
  return rows.map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ''])));
}

function parseBoolean(value: unknown): boolean {
  return value === true || value === 'true' || value === '1' || value === 'yes';
}

export function normalizeImportRow(raw: Record<string, unknown>) {
  const tags = Array.isArray(raw.tags) ? raw.tags.map(String) : String(raw.tags ?? '').split(/[|,]/).map(tag => tag.trim()).filter(Boolean);
  const candidate = { ...raw, tags, is_completed: parseBoolean(raw.is_completed), reminder_offset_minutes: raw.reminder_offset_minutes === '' || raw.reminder_offset_minutes == null ? null : Number(raw.reminder_offset_minutes), duration_value: raw.duration_value === '' || raw.duration_value == null ? null : Number(raw.duration_value), recurrence_count: raw.recurrence_count === '' || raw.recurrence_count == null ? null : Number(raw.recurrence_count), recurrence_end: raw.recurrence_end || null, timezone: raw.timezone || 'Asia/Ho_Chi_Minh', email: raw.email || null, description: raw.description || null, duration_unit: raw.duration_unit || null, recurrence_rule: raw.recurrence_rule || null };
  return eventSchema.safeParse(candidate);
}
