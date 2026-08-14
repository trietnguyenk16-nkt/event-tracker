'use client';

import { useEffect, useState } from 'react';

type HistoryItem = { id: string; action: string; changes: Record<string, unknown> | null; created_at: string };

const labels: Record<string, string> = { created: 'Tạo', updated: 'Cập nhật', completed: 'Hoàn thành', reopened: 'Mở lại', deleted: 'Xóa' };

export default function EventHistory({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetch(`/api/events/${eventId}/history`).then(response => response.json()).then(payload => setItems(payload.data ?? [])).catch(() => setItems([])).finally(() => setLoading(false)); }, [eventId]);
  if (loading) return <p className="mt-3 text-sm opacity-60">Đang tải lịch sử…</p>;
  if (!items.length) return <p className="mt-3 text-sm opacity-60">Chưa có lịch sử thay đổi.</p>;
  return <ol className="mt-3 space-y-3 border-l border-ink/15 pl-4 dark:border-white/15">{items.map(item => <li key={item.id}><p className="text-sm font-bold">{labels[item.action] ?? item.action}</p><time className="text-xs opacity-55">{new Date(item.created_at).toLocaleString('vi-VN')}</time>{item.changes && <pre className="mt-1 max-h-28 overflow-auto whitespace-pre-wrap text-[11px] opacity-70">{JSON.stringify(item.changes, null, 2)}</pre>}</li>)}</ol>;
}
