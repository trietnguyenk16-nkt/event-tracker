'use client';

import type { EventItem } from './EventList';

type ViewMode = 'list' | 'day' | 'week' | 'month';

function dayKey(date: Date) { return date.toISOString().slice(0, 10); }
function startOfWeek(date: Date) { const copy = new Date(date); const day = copy.getDay(); copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1)); copy.setHours(0, 0, 0, 0); return copy; }
function formatDay(date: Date) { return date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric' }); }

export default function CalendarView({ events, view, onEdit, onDelete, onToggle }: { events: EventItem[]; view: ViewMode; onEdit: (event: EventItem) => void; onDelete: (id: string) => void; onToggle: (event: EventItem) => void }) {
  if (view === 'list') return null;
  const now = new Date();
  const groups = view === 'day' ? [now] : view === 'week' ? Array.from({ length: 7 }, (_, index) => { const date = startOfWeek(now); date.setDate(date.getDate() + index); return date; }) : Array.from({ length: 42 }, (_, index) => { const first = new Date(now.getFullYear(), now.getMonth(), 1); const offset = first.getDay() === 0 ? 6 : first.getDay() - 1; first.setDate(first.getDate() - offset + index); return first; });
  return <div className={view === 'month' ? 'grid grid-cols-7 gap-1.5 sm:gap-2' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'}>{groups.map(date => { const key = dayKey(date); const dayEvents = events.filter(event => event.event_datetime.slice(0, 10) === key); return <section key={key} className={view === 'month' ? 'min-h-24 rounded-2xl border border-ink/10 bg-white/45 p-2 dark:border-white/10 dark:bg-white/[.03] sm:min-h-28 sm:p-3' : 'rounded-2xl border border-ink/10 bg-white/45 p-3 dark:border-white/10 dark:bg-white/[.03]'}><div className="mb-2 flex items-center justify-between gap-2"><p className="text-xs font-bold uppercase tracking-wide opacity-55">{formatDay(date)}</p><span className="text-xs opacity-45">{dayEvents.length || ''}</span></div><div className="space-y-1.5">{dayEvents.map(event => <button key={event.id} onClick={() => onEdit(event)} className="block w-full truncate rounded-lg bg-coral/10 px-2 py-1.5 text-left text-xs font-bold text-coral hover:bg-coral/20 focus:outline-none focus:ring-2 focus:ring-coral" title={event.title}>{new Date(event.event_datetime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {event.title}</button>)}</div>{dayEvents.length > 0 && <div className="sr-only">{dayEvents.map(event => <button key={`${event.id}-toggle`} onClick={() => onToggle(event)}>{event.is_completed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</button>)}</div>}</section>; })}</div>;
}

export type { ViewMode };
