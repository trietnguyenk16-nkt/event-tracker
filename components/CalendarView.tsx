'use client';

import { useMemo, useState } from 'react';
import type { EventItem } from './EventList';

export type ViewMode = 'list' | 'day' | 'week' | 'month';

function dayKey(date: Date) { return date.toISOString().slice(0, 10); }
function startOfWeek(date: Date) { const copy = new Date(date); const day = copy.getDay(); copy.setDate(copy.getDate() - (day === 0 ? 6 : day - 1)); copy.setHours(0, 0, 0, 0); return copy; }
function formatDay(date: Date) { return date.toLocaleDateString('vi-VN', { weekday: 'short', day: 'numeric', month: 'short' }); }
function addDays(date: Date, amount: number) { const copy = new Date(date); copy.setDate(copy.getDate() + amount); return copy; }

export default function CalendarView({ events, view, onEdit, onDelete: _onDelete, onToggle, onCreate }: { events: EventItem[]; view: ViewMode; onEdit: (event: EventItem) => void; onDelete: (id: string) => void; onToggle: (event: EventItem) => void; onCreate?: (date: Date) => void }) {
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  if (view === 'list') return null;
  const groups = useMemo(() => {
    if (view === 'day') return [anchorDate];
    if (view === 'week') return Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(anchorDate), index));
    const first = new Date(anchorDate.getFullYear(), anchorDate.getMonth(), 1); const offset = first.getDay() === 0 ? 6 : first.getDay() - 1;
    return Array.from({ length: 42 }, (_, index) => addDays(first, index - offset));
  }, [anchorDate, view]);
  const title = view === 'month' ? anchorDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }) : view === 'week' ? `${formatDay(groups[0])} – ${formatDay(groups.at(-1)!)}` : formatDay(anchorDate);
  const move = (direction: number) => setAnchorDate(current => view === 'month' ? new Date(current.getFullYear(), current.getMonth() + direction, 1) : addDays(current, view === 'week' ? direction * 7 : direction));

  return <section aria-label={`Lịch ${view}`}>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-[.18em] opacity-50">Lịch</p><h2 className="font-display text-xl capitalize">{title}</h2></div><div className="flex gap-2"><button onClick={() => setAnchorDate(new Date())} className="min-h-10 rounded-xl border border-ink/15 px-3 text-xs font-bold dark:border-white/15">Hôm nay</button><button onClick={() => move(-1)} aria-label="Khoảng thời gian trước" className="min-h-10 min-w-10 rounded-xl border border-ink/15 px-3 text-lg dark:border-white/15">‹</button><button onClick={() => move(1)} aria-label="Khoảng thời gian sau" className="min-h-10 min-w-10 rounded-xl border border-ink/15 px-3 text-lg dark:border-white/15">›</button></div></div>
    <div className={view === 'month' ? 'grid grid-cols-7 gap-1.5 sm:gap-2' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'}>{groups.map(date => { const key = dayKey(date); const dayEvents = events.filter(event => event.event_datetime.slice(0, 10) === key); const isToday = key === dayKey(new Date()); return <section key={key} className={(view === 'month' ? 'min-h-24 sm:min-h-28 ' : '') + 'rounded-2xl border p-2 dark:border-white/10 dark:bg-white/[.03] ' + (isToday ? 'border-coral/50 bg-coral/[.06]' : 'border-ink/10 bg-white/45')}><button onClick={() => onCreate?.(date)} className="mb-2 flex min-h-8 w-full items-center justify-between gap-2 text-left" aria-label={`Tạo sự kiện ngày ${formatDay(date)}`}><span className="text-xs font-bold uppercase tracking-wide opacity-65">{formatDay(date)}</span><span className="text-xs opacity-45">{dayEvents.length || '＋'}</span></button><div className="space-y-1.5">{dayEvents.length === 0 && view !== 'month' && <p className="py-3 text-xs opacity-45">Chưa có sự kiện</p>}{dayEvents.map(event => <button key={event.id} onClick={() => onEdit(event)} className="block min-h-9 w-full truncate rounded-lg bg-coral/10 px-2 py-1.5 text-left text-xs font-bold text-coral hover:bg-coral/20 focus:outline-none focus:ring-2 focus:ring-coral" title={event.title}>{new Date(event.event_datetime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} {event.title}</button>)}</div>{dayEvents.length > 0 && <div className="sr-only">{dayEvents.map(event => <button key={`${event.id}-toggle`} onClick={() => onToggle(event)}>{event.is_completed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}</button>)}</div>}</section>; })}</div>
  </section>;
}
