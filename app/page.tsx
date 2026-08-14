'use client';

import { useEffect, useMemo, useState } from 'react';
import EventForm from '@/components/EventForm';
import EventList, { EventItem } from '@/components/EventList';
import CalendarView, { ViewMode } from '@/components/CalendarView';

const mockEvents: EventItem[] = [
  { id: 'mock-1', title: 'Review kế hoạch quý III', description: 'Chốt các mốc quan trọng với đội ngũ.', event_datetime: '2026-08-20T09:30:00.000Z', tags: ['công việc', 'planning'], is_completed: false, reminder_offset_minutes: 1440, email: 'demo@example.com' },
  { id: 'mock-2', title: 'Chạy bộ buổi sáng', description: 'Năm kilomet quanh công viên.', event_datetime: '2026-08-22T06:30:00.000Z', tags: ['cá nhân'], is_completed: false, reminder_offset_minutes: 120, email: 'demo@example.com' },
  { id: 'mock-3', title: 'Gửi bản tổng kết', description: 'Đã hoàn thành trong tuần này.', event_datetime: '2026-08-17T16:00:00.000Z', tags: ['công việc'], is_completed: true, reminder_offset_minutes: null, email: null },
];

export default function Home() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [editing, setEditing] = useState<EventItem | null>(null);
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [offline, setOffline] = useState(false);
  const [q, setQ] = useState({ date: '', tag: '', status: 'all' });
  const [view, setView] = useState<ViewMode>('list');
  const [calendarFilter, setCalendarFilter] = useState('all');
  const [eventCalendars, setEventCalendars] = useState<Record<string, string>>({});
  const [calendarVisibility, setCalendarVisibility] = useState<Record<string, boolean>>({ 'Cá nhân': true, 'Công việc': true, 'Gia đình': true });
  const [notificationPrefs, setNotificationPrefs] = useState({ email: true, browser: false, quietHours: false });

  useEffect(() => {
    const cached = localStorage.getItem('events-cache');
    if (cached) setEvents(JSON.parse(cached));
    const savedCalendars = localStorage.getItem('event-calendars');
    if (savedCalendars) setEventCalendars(JSON.parse(savedCalendars));
    const savedVisibility = localStorage.getItem('calendar-visibility');
    if (savedVisibility) setCalendarVisibility(JSON.parse(savedVisibility));
    const savedNotifications = localStorage.getItem('notification-preferences');
    if (savedNotifications) setNotificationPrefs(JSON.parse(savedNotifications));
    const savedView = localStorage.getItem('calendar-view') as ViewMode | null;
    if (savedView) setView(savedView);
    const savedTheme = localStorage.getItem('theme') === 'dark';
    setDark(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme);
    const setConnection = () => setOffline(!navigator.onLine);
    setConnection();
    window.addEventListener('online', setConnection);
    window.addEventListener('offline', setConnection);
    fetch('/api/events')
      .then(response => { if (!response.ok) throw new Error('Database chưa được cấu hình'); return response.json(); })
      .then(payload => { setEvents(payload.data ?? payload); setOffline(false); })
      .catch(() => { setMockMode(true); setOffline(!navigator.onLine); if (!cached) setEvents(mockEvents); });
    return () => { window.removeEventListener('online', setConnection); window.removeEventListener('offline', setConnection); };
  }, []);

  useEffect(() => { localStorage.setItem('events-cache', JSON.stringify(events)); }, [events]);
  useEffect(() => { localStorage.setItem('event-calendars', JSON.stringify(eventCalendars)); }, [eventCalendars]);
  useEffect(() => { localStorage.setItem('calendar-visibility', JSON.stringify(calendarVisibility)); }, [calendarVisibility]);
  useEffect(() => { localStorage.setItem('notification-preferences', JSON.stringify(notificationPrefs)); }, [notificationPrefs]);
  useEffect(() => { localStorage.setItem('calendar-view', view); }, [view]);

  const filtered = useMemo(() => events.filter(event => { const calendar = eventCalendars[event.id] ?? (event.tags.includes('công việc') ? 'Công việc' : 'Cá nhân'); return (!q.date || event.event_datetime.slice(0, 10) === q.date) && (!q.tag || event.tags.some(tag => tag.toLowerCase().includes(q.tag.toLowerCase()))) && (q.status === 'all' || (q.status === 'done' ? event.is_completed : !event.is_completed)) && (calendarFilter === 'all' || calendar === calendarFilter) && calendarVisibility[calendar] !== false; }), [events, q, eventCalendars, calendarFilter, calendarVisibility]);

  async function save(payload: Partial<EventItem>) {
    try {
      const response = await fetch(editing ? `/api/events/${editing.id}` : '/api/events', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!response.ok) throw new Error('Mock fallback');
      const item = await response.json();
      setEvents(current => editing ? current.map(event => event.id === item.id ? item : event) : [item, ...current]);
      setEventCalendars(current => ({ ...current, [item.id]: calendarFilter === 'all' ? 'Cá nhân' : calendarFilter }));
    } catch {
      const item: EventItem = { id: editing?.id ?? `mock-${Date.now()}`, title: payload.title ?? 'Sự kiện mới', description: payload.description, event_datetime: payload.event_datetime ?? new Date().toISOString(), tags: payload.tags ?? [], is_completed: payload.is_completed ?? false, reminder_offset_minutes: payload.reminder_offset_minutes, email: payload.email };
      setMockMode(true);
      setEvents(current => editing ? current.map(event => event.id === item.id ? item : event) : [item, ...current]);
      setEventCalendars(current => ({ ...current, [item.id]: calendarFilter === 'all' ? 'Cá nhân' : calendarFilter }));
    }
    setOpen(false); setEditing(null);
  }

  async function remove(id: string) {
    if (!confirm('Xóa sự kiện này?')) return;
    try { await fetch(`/api/events/${id}`, { method: 'DELETE' }); } catch { /* Mock mode */ }
    setEvents(current => current.filter(event => event.id !== id));
    setEventCalendars(current => { const next = { ...current }; delete next[id]; return next; });
  }

  async function toggle(event: EventItem) {
    try {
      const response = await fetch(`/api/events/${event.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_completed: !event.is_completed }) });
      if (!response.ok) throw new Error('Mock fallback');
      const updated = await response.json();
      setEvents(current => current.map(item => item.id === updated.id ? updated : item));
    } catch {
      setMockMode(true); setEvents(current => current.map(item => item.id === event.id ? { ...item, is_completed: !item.is_completed } : item));
    }
  }

  function theme() { const next = !dark; setDark(next); document.documentElement.classList.toggle('dark', next); localStorage.setItem('theme', next ? 'dark' : 'light'); }
  function openCreate() { setEditing(null); setOpen(true); }

  return <main className="min-h-[100dvh] overflow-x-hidden bg-paper pb-[env(safe-area-inset-bottom)] text-ink dark:bg-[#111820] dark:text-paper">
    <header className="border-b border-ink/10 pt-[env(safe-area-inset-top)] dark:border-white/10"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-5 sm:py-5"><div className="flex min-w-0 items-center gap-3"><img src="/icon.svg" width="40" height="40" alt="Event Tracker" className="shrink-0" /><div className="min-w-0"><p className="truncate font-display text-lg font-bold sm:text-xl">Event Tracker</p><p className="hidden text-xs uppercase tracking-[.2em] opacity-50 xs:block sm:block">Make time visible</p></div></div><div className="flex shrink-0 items-center gap-2">{mockMode && <span className="hidden rounded-full bg-coral/15 px-3 py-2 text-xs font-bold text-coral sm:inline">Mock preview</span>}<button onClick={theme} aria-label="Đổi giao diện sáng tối" className="min-h-11 rounded-full border border-ink/15 px-3 py-2 text-sm dark:border-white/15">{dark ? 'Sáng' : 'Tối'}</button></div></div></header>
    {offline && <div role="status" className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-center text-xs font-bold text-amber-800 dark:text-amber-200">Đang offline · Hiển thị dữ liệu đã lưu trên thiết bị</div>}
    <section className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-5 sm:py-10 lg:grid-cols-[1fr_360px] lg:gap-10"><div className="min-w-0"><div className="rise mb-7 max-w-2xl sm:mb-8"><p className="mb-3 text-xs font-bold uppercase tracking-[.24em] text-coral sm:text-sm">Lịch của bạn, rõ ràng hơn</p><h1 className="font-display text-4xl leading-[.98] sm:text-5xl md:text-7xl">Đừng để điều quan trọng trôi qua.</h1><p className="mt-4 max-w-xl text-base opacity-65 sm:mt-5 sm:text-lg">Ghi lại mốc cần nhớ, lọc theo nhịp sống và nhận nhắc lịch trước khi bắt đầu.</p></div><div className="mb-5 grid gap-2 sm:flex sm:flex-wrap"><label className="sr-only" htmlFor="filter-date">Lọc theo ngày</label><input id="filter-date" type="date" value={q.date} onChange={event => setQ({ ...q, date: event.target.value })} className="min-h-11 w-full rounded-xl border border-ink/15 bg-white/60 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 sm:w-auto" /><label className="sr-only" htmlFor="filter-tag">Lọc theo tag</label><input id="filter-tag" placeholder="Tìm tag" value={q.tag} onChange={event => setQ({ ...q, tag: event.target.value })} className="min-h-11 w-full rounded-xl border border-ink/15 bg-white/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-coral/25 dark:border-white/15 dark:bg-white/5 sm:w-40" /><label className="sr-only" htmlFor="filter-status">Lọc trạng thái</label><select id="filter-status" value={q.status} onChange={event => setQ({ ...q, status: event.target.value })} className="min-h-11 w-full rounded-xl border border-ink/15 bg-white/60 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5 sm:w-auto"><option value="all">Tất cả</option><option value="todo">Chưa xong</option><option value="done">Đã xong</option></select></div><div className="mb-5 space-y-3"><div className="flex flex-wrap gap-2" role="tablist" aria-label="Chế độ xem lịch">{(['list', 'day', 'week', 'month'] as ViewMode[]).map(mode => <button key={mode} onClick={() => setView(mode)} className={'min-h-11 rounded-xl px-3 text-sm font-bold ' + (view === mode ? 'bg-ink text-paper' : 'border border-ink/15 dark:border-white/15')}>{mode === 'list' ? 'Danh sách' : mode === 'day' ? 'Ngày' : mode === 'week' ? 'Tuần' : 'Tháng'}</button>)}</div><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-bold uppercase tracking-wide opacity-55">Lịch</span>{Object.keys(calendarVisibility).map(calendar => <button key={calendar} onClick={() => setCalendarVisibility(current => ({ ...current, [calendar]: !current[calendar] }))} className={'min-h-10 rounded-full px-3 text-xs font-bold ' + (calendarVisibility[calendar] ? 'bg-sage/30' : 'bg-ink/10 opacity-45')}>{calendar}</button>)}<select value={calendarFilter} onChange={event => setCalendarFilter(event.target.value)} aria-label="Lọc lịch" className="min-h-10 rounded-xl border border-ink/15 bg-white/60 px-3 text-xs dark:border-white/15 dark:bg-white/5"><option value="all">Tất cả lịch</option>{Object.keys(calendarVisibility).map(calendar => <option key={calendar} value={calendar}>{calendar}</option>)}</select></div></div>{view === 'list' ? <EventList events={filtered} onEdit={event => { setEditing(event); setOpen(true); }} onDelete={remove} onToggle={toggle} /> : <CalendarView events={filtered} view={view} onEdit={event => { setEditing(event); setOpen(true); }} onDelete={remove} onToggle={toggle} />}</div><aside className="lg:sticky lg:top-6 lg:h-fit"><div className="rounded-3xl bg-ink p-5 text-paper shadow-soft sm:p-6"><p className="text-sm uppercase tracking-[.2em] opacity-50">Tổng quan</p><p className="mt-2 font-display text-5xl">{events.filter(event => !event.is_completed).length}</p><p className="text-sm opacity-60">việc đang chờ</p><p className="mt-6 text-sm opacity-75 sm:mt-8">Nhắc lịch: <strong>1 ngày · 2 giờ · 30 phút</strong></p><div className="mt-4 space-y-2 border-t border-white/15 pt-4 text-xs"><p className="font-bold uppercase tracking-wide opacity-55">Thông báo</p><label className="flex items-center gap-2"><input type="checkbox" checked={notificationPrefs.email} onChange={event => setNotificationPrefs({ ...notificationPrefs, email: event.target.checked })} /> Email reminder</label><label className="flex items-center gap-2"><input type="checkbox" checked={notificationPrefs.browser} onChange={event => setNotificationPrefs({ ...notificationPrefs, browser: event.target.checked })} /> Thông báo trình duyệt</label><label className="flex items-center gap-2"><input type="checkbox" checked={notificationPrefs.quietHours} onChange={event => setNotificationPrefs({ ...notificationPrefs, quietHours: event.target.checked })} /> Giờ yên lặng</label></div><button onClick={openCreate} className="mt-6 min-h-12 w-full rounded-2xl bg-coral px-4 py-3 font-bold transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 sm:mt-8">+ Thêm sự kiện</button></div></aside></section>
    <button onClick={openCreate} aria-label="Thêm sự kiện mới" className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-10 grid min-h-14 min-w-14 place-items-center rounded-full bg-coral px-5 text-2xl font-bold text-white shadow-xl shadow-coral/30 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 lg:hidden">+</button>
    {open && <EventForm initial={editing} onSave={save} onClose={() => { setOpen(false); setEditing(null); }} />}
  </main>;
}
