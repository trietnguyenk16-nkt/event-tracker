import { describe, expect, it } from 'vitest';
import { filterEvents } from './eventFilters';
import type { EventItem } from '@/components/EventList';

const events: EventItem[] = [
  { id: '1', title: 'Planning', event_datetime: '2026-08-20T09:00:00.000Z', tags: ['công việc', 'planning'], is_completed: false },
  { id: '2', title: 'Gym', event_datetime: '2026-08-20T18:00:00.000Z', tags: ['cá nhân'], is_completed: true },
  { id: '3', title: 'Dinner', event_datetime: '2026-08-21T18:00:00.000Z', tags: ['gia đình'], is_completed: false },
];

describe('filterEvents', () => {
  it('filters by date, tag and completion status', () => {
    expect(filterEvents(events, { date: '2026-08-20' })).toHaveLength(2);
    expect(filterEvents(events, { tag: 'plan' })[0]?.id).toBe('1');
    expect(filterEvents(events, { status: 'todo' }).map(event => event.id)).toEqual(['1', '3']);
    expect(filterEvents(events, { status: 'done' }).map(event => event.id)).toEqual(['2']);
  });

  it('filters by explicit calendar mapping and visibility', () => {
    const result = filterEvents(events, {
      calendar: 'Gia đình',
      eventCalendars: { '3': 'Gia đình' },
      calendars: { 'Cá nhân': true, 'Công việc': true, 'Gia đình': true },
    });
    expect(result.map(event => event.id)).toEqual(['3']);
    expect(filterEvents(events, { calendars: { 'Công việc': false } }).map(event => event.id)).toEqual(['2', '3']);
  });

  it('uses the work tag as a calendar fallback', () => {
    expect(filterEvents(events, { calendar: 'Công việc' }).map(event => event.id)).toEqual(['1']);
  });
});
