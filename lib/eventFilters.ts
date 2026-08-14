import type { EventItem } from '@/components/EventList';

export type EventFilters = { date?: string; tag?: string; status?: 'all' | 'todo' | 'done'; calendar?: string; calendars?: Record<string, boolean>; eventCalendars?: Record<string, string> };

export function filterEvents(events: EventItem[], filters: EventFilters): EventItem[] {
  return events.filter(event => {
    const calendar = filters.eventCalendars?.[event.id] ?? (event.tags.includes('công việc') ? 'Công việc' : 'Cá nhân');
    return (!filters.date || event.event_datetime.slice(0, 10) === filters.date)
      && (!filters.tag || event.tags.some(tag => tag.toLowerCase().includes(filters.tag!.toLowerCase())))
      && (!filters.status || filters.status === 'all' || (filters.status === 'done' ? event.is_completed : !event.is_completed))
      && (!filters.calendar || filters.calendar === 'all' || calendar === filters.calendar)
      && (filters.calendars?.[calendar] !== false);
  });
}
