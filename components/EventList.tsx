'use client';

import { useState } from 'react';
import EventHistory from './EventHistory';

export type EventItem = {
  id: string;
  title: string;
  description?: string | null;
  event_datetime: string;
  timezone?: string;
  tags: string[];
  is_completed: boolean;
  reminder_offset_minutes?: number | null;
  email?: string | null;
  duration_value?: number | null;
  duration_unit?: string | null;
  source_event_id?: string | null;
  recurrence_rule?: string | null;
  recurrence_end?: string | null;
  recurrence_count?: number | null;
  recurrence_index?: number | null;
};

const unitLabels: Record<string, string> = { day: 'ngày', week: 'tuần', month: 'tháng', year: 'năm' };

export default function EventList({ events, onEdit, onDelete, onToggle }: { events: EventItem[]; onEdit: (e: EventItem) => void; onDelete: (id: string) => void; onToggle: (e: EventItem) => void }) {
  const [historyId, setHistoryId] = useState<string | null>(null);
  if (!events.length) return <div className="rounded-3xl border border-dashed border-ink/20 px-5 py-14 text-center dark:border-white/20 sm:px-6 sm:py-16"><p className="font-display text-2xl">Chưa có mốc nào ở đây.</p><p className="mt-2 text-sm opacity-55">Thêm một sự kiện để bắt đầu.</p></div>;
  return <div className="space-y-3">{events.map(event => <article key={event.id} className="rise rounded-3xl border border-ink/10 bg-white/55 p-4 shadow-sm transition hover:shadow-soft dark:border-white/10 dark:bg-white/[.04] sm:p-5"><div className="flex min-w-0 gap-3 sm:gap-4"><button onClick={() => onToggle(event)} aria-label={event.is_completed ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'} className={'mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-coral ' + (event.is_completed ? 'border-coral bg-coral' : 'border-ink/25 dark:border-white/30')}>{event.is_completed && <span className="text-sm font-bold text-white">✓</span>}</button><div className="min-w-0 flex-1"><div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><h2 className={'break-words font-display text-xl leading-tight sm:text-2xl ' + (event.is_completed ? 'line-through opacity-40' : '')}>{event.title}</h2><p className="mt-1 text-sm text-coral">{new Date(event.event_datetime).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}</p><p className="mt-1 text-xs opacity-50">{event.timezone ?? 'Asia/Ho_Chi_Minh'}</p></div><div className="flex shrink-0 gap-2 text-sm"><button onClick={() => onEdit(event)} className="min-h-11 rounded-xl px-3 font-bold underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-coral">Sửa</button><button onClick={() => onDelete(event.id)} className="min-h-11 rounded-xl px-3 font-bold text-coral underline underline-offset-4 focus:outline-none focus:ring-2 focus:ring-coral">Xóa</button></div></div>{event.description && <p className="mt-3 break-words text-sm opacity-65">{event.description}</p>}<div className="mt-3 flex flex-wrap gap-2">{event.tags.map(tag => <span key={tag} className="rounded-full bg-sage/25 px-2.5 py-1 text-xs">#{tag}</span>)}{event.reminder_offset_minutes ? <span className="rounded-full bg-coral/10 px-2.5 py-1 text-xs text-coral">nhắc trước {event.reminder_offset_minutes >= 1440 ? '1 ngày' : event.reminder_offset_minutes >= 120 ? '2 giờ' : '30 phút'}</span> : null}{event.duration_value && event.duration_unit ? <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs">sinh sau {event.duration_value} {unitLabels[event.duration_unit] ?? event.duration_unit}</span> : null}{event.recurrence_rule ? <span className="rounded-full bg-sky-500/15 px-2.5 py-1 text-xs">lặp {event.recurrence_rule}{event.recurrence_index ? ` · lần ${event.recurrence_index}` : ''}</span> : null}{event.source_event_id ? <span className="rounded-full bg-ink/10 px-2.5 py-1 text-xs">sinh từ event khác</span> : null}</div><button onClick={() => setHistoryId(historyId === event.id ? null : event.id)} className="mt-3 min-h-10 rounded-xl px-2 text-xs font-bold underline underline-offset-4">{historyId === event.id ? 'Ẩn lịch sử' : 'Xem lịch sử'}</button>{historyId === event.id && <EventHistory eventId={event.id} />}</div></div></article>)}</div>;
}
