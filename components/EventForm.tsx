'use client';

import { useState } from 'react';
import type { EventItem } from './EventList';

export default function EventForm({ initial, onSave, onClose }: { initial: Partial<EventItem> | null; onSave: (p: Partial<EventItem>) => Promise<void>; onClose: () => void }) {
  const [f, setF] = useState({ title: initial?.title ?? '', description: initial?.description ?? '', event_datetime: initial?.event_datetime?.slice(0, 16) ?? '', tags: initial?.tags?.join(', ') ?? '', reminder_offset_minutes: String(initial?.reminder_offset_minutes ?? 1440), email: initial?.email ?? '' });
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await onSave({ ...f, tags: f.tags.split(',').map(x => x.trim()).filter(Boolean), reminder_offset_minutes: Number(f.reminder_offset_minutes) || null });
    } finally { setBusy(false); }
  }
  const field = 'mt-1 min-h-12 w-full rounded-xl border border-ink/15 bg-white/60 px-3 py-3 font-normal outline-none transition focus:border-coral focus:ring-2 focus:ring-coral/25 dark:border-white/15 dark:bg-white/5';
  return <div className="fixed inset-0 z-20 flex items-end justify-center bg-ink/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="event-form-title">
    <form onSubmit={submit} className="max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-paper px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 text-ink shadow-2xl dark:bg-[#19232d] dark:text-paper sm:max-w-lg sm:rounded-3xl sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[.2em] text-coral">{initial ? 'Chỉnh sửa' : 'Sự kiện mới'}</p><h2 id="event-form-title" className="font-display text-3xl">Điều cần nhớ</h2></div><button type="button" onClick={onClose} aria-label="Đóng biểu mẫu" className="grid min-h-11 min-w-11 place-items-center rounded-full text-2xl opacity-60 transition hover:bg-ink/5 focus:outline-none focus:ring-2 focus:ring-coral">×</button></div>
      <div className="space-y-4"><label className="block text-sm font-bold">Tiêu đề<input required autoFocus value={f.title} onChange={e => setF({ ...f, title: e.target.value })} className={field} /></label><label className="block text-sm font-bold">Thời gian<input required type="datetime-local" value={f.event_datetime} onChange={e => setF({ ...f, event_datetime: e.target.value })} className={field} /></label><label className="block text-sm font-bold">Mô tả<textarea rows={3} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} className={field} /></label><label className="block text-sm font-bold">Tags<input value={f.tags} onChange={e => setF({ ...f, tags: e.target.value })} placeholder="công việc, cá nhân" className={field} /></label><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-bold">Nhắc trước<select value={f.reminder_offset_minutes} onChange={e => setF({ ...f, reminder_offset_minutes: e.target.value })} className={field}><option value="1440">1 ngày</option><option value="120">2 giờ</option><option value="30">30 phút</option><option value="0">Không nhắc</option></select></label><label className="block text-sm font-bold">Email<input type="email" inputMode="email" autoComplete="email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} className={field} /></label></div></div>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:flex sm:justify-end"><button type="button" onClick={onClose} className="min-h-12 rounded-xl px-4 py-3 text-sm font-bold transition hover:bg-ink/5">Hủy</button><button disabled={busy} className="min-h-12 rounded-xl bg-coral px-5 py-3 text-sm font-bold text-white transition hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 disabled:opacity-60">{busy ? 'Đang lưu…' : 'Lưu sự kiện'}</button></div>
    </form>
  </div>;
}
