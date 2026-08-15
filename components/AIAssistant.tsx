'use client';

import { useEffect, useState } from 'react';
import type { EventItem } from './EventList';
import { formatAIResponse } from '@/lib/aiText';

type AiDraft = Partial<EventItem> & {
  timezone?: string;
  duration_minutes?: number | null;
  needs_clarification?: boolean;
  clarification?: string | null;
};

type Props = { onDraft: (draft: Partial<EventItem>) => void };
type Model = { id: string; label: string; description: string };

export default function AIAssistant({ onDraft }: Props) {
  const [models, setModels] = useState<Model[]>([]);
  const [model, setModel] = useState('gpt-4o-mini');
  const [configured, setConfigured] = useState(false);
  const [capture, setCapture] = useState('');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [draft, setDraft] = useState<AiDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState<'capture' | 'agenda' | 'conflicts' | 'search'>('capture');

  useEffect(() => {
    fetch('/api/ai/models').then(response => response.json()).then(data => {
      setModels(data.models ?? []);
      setModel(data.defaultModel ?? 'gpt-4o-mini');
      setConfigured(Boolean(data.configured));
    }).catch(() => undefined);
  }, []);

  async function run() {
    setBusy(true);
    setResult(null);
    setDraft(null);
    const endpoint = active === 'capture' ? '/api/ai/quick-capture' : active === 'agenda' ? '/api/ai/agenda' : active === 'conflicts' ? '/api/ai/conflicts' : '/api/ai/search';
    const body = active === 'capture' ? { text: capture, model } : active === 'search' ? { query, model } : { model };
    try {
      const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const payload = await response.json();
      setResult(formatAIResponse(active, payload));
      if (active === 'capture' && payload.draft && typeof payload.draft === 'object') setDraft(payload.draft as AiDraft);
    } catch {
      setResult('AI chưa thể kết nối với dịch vụ.\nVui lòng kiểm tra cấu hình OpenAI hoặc thử lại sau.');
    } finally {
      setBusy(false);
    }
  }

  function confirmDraft() {
    if (!draft?.title || !draft.event_datetime || draft.needs_clarification) return;
    onDraft({ title: draft.title, description: draft.description ?? '', event_datetime: draft.event_datetime, tags: draft.tags ?? [], reminder_offset_minutes: draft.reminder_offset_minutes ?? null, email: draft.email ?? null });
    setDraft(null);
  }

  return <section className="rounded-3xl border border-coral/20 bg-coral/[.06] p-4 shadow-sm sm:p-5" aria-labelledby="ai-title">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-coral">AI workspace</p><h2 id="ai-title" className="font-display text-2xl">Trợ lý lịch</h2><p className="mt-1 text-sm opacity-65">AI chỉ tạo đề xuất; bạn luôn xác nhận trước khi lưu.</p></div><label className="text-xs font-bold">Model<select value={model} onChange={event => setModel(event.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-ink/15 bg-white/70 px-3 text-sm dark:border-white/15 dark:bg-white/5 sm:w-52">{models.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
    <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="AI actions">{([['capture', 'Nhập tự nhiên'], ['agenda', 'Agenda 7 ngày'], ['conflicts', 'Conflict'], ['search', 'Hỏi lịch']] as const).map(([key, label]) => <button key={key} onClick={() => { setActive(key); setResult(null); setDraft(null); }} className={'min-h-10 rounded-xl px-3 text-sm font-bold ' + (active === key ? 'bg-ink text-paper' : 'border border-ink/15 dark:border-white/15')}>{label}</button>)}</div>
    {active === 'capture' && <textarea value={capture} onChange={event => setCapture(event.target.value)} placeholder="Ví dụ: Họp với Minh thứ Sáu lúc 14h, nhắc trước 2 giờ" className="mt-4 min-h-24 w-full rounded-2xl border border-ink/15 bg-white/70 p-3 text-base outline-none focus:ring-2 focus:ring-coral/25 dark:border-white/15 dark:bg-white/5" />}
    {active === 'search' && <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Ví dụ: Tuần sau tôi có việc gì liên quan khách hàng?" className="mt-4 min-h-12 w-full rounded-2xl border border-ink/15 bg-white/70 px-3 text-base outline-none focus:ring-2 focus:ring-coral/25 dark:border-white/15 dark:bg-white/5" />}
    {draft && <div className="mt-4 rounded-2xl border border-sage/40 bg-sage/10 p-4" role="status"><p className="text-xs font-bold uppercase tracking-wide text-sage">Bản nháp AI · chưa lưu</p><p className="mt-1 font-bold">{draft.title}</p><p className="mt-1 text-sm opacity-70">{draft.event_datetime ? new Date(draft.event_datetime).toLocaleString('vi-VN') : 'Chưa có thời gian'}</p>{draft.needs_clarification && <p className="mt-2 text-sm font-bold text-coral">Cần làm rõ: {draft.clarification ?? 'Thiếu thông tin ngày hoặc giờ.'}</p>}<div className="mt-3 flex flex-wrap gap-2"><button disabled={Boolean(draft.needs_clarification)} onClick={confirmDraft} className="min-h-10 rounded-xl bg-coral px-3 text-sm font-bold text-white disabled:opacity-50">Xác nhận và chỉnh sửa</button><button onClick={() => setDraft(null)} className="min-h-10 rounded-xl border border-ink/15 px-3 text-sm font-bold dark:border-white/15">Bỏ bản nháp</button></div></div>}
    <div className="mt-3 flex items-center justify-between gap-3"><p className="text-xs opacity-60">{configured ? 'OpenAI đã cấu hình trên server.' : 'Chưa có OPENAI_API_KEY · đang dùng fallback an toàn.'}</p><button onClick={run} disabled={busy || (active === 'capture' && !capture.trim()) || (active === 'search' && !query.trim())} className="min-h-11 rounded-xl bg-coral px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Đang phân tích…' : 'Chạy AI'}</button></div>
    {result && <div className="mt-4 max-h-80 overflow-auto rounded-2xl bg-ink p-4 text-sm leading-7 text-paper whitespace-pre-wrap" role="status">{result}</div>}
  </section>;
}
