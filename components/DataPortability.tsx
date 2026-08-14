'use client';

import { useRef, useState } from 'react';

export default function DataPortability({ onImported }: { onImported: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<{ total: number; valid: number; errors: Array<{ row: number; error: string }>; sample: unknown[] } | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function exportData(format: 'json' | 'csv') {
    const response = await fetch(`/api/events/export?format=${format}`);
    if (!response.ok) { setMessage('Không thể export dữ liệu.'); return; }
    const blob = await response.blob(); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `event-tracker-export.${format}`; link.click(); URL.revokeObjectURL(url);
  }

  async function importFile(shouldPreview: boolean) {
    if (!file) return;
    setBusy(true); setMessage('');
    try {
      const form = new FormData(); form.append('file', file); form.append('preview', String(shouldPreview));
      const response = await fetch('/api/events/import', { method: 'POST', body: form }); const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? 'Import thất bại');
      if (shouldPreview) setPreview(payload); else { setMessage(`Đã thêm ${payload.created}, bỏ qua ${payload.skipped}, lỗi ${payload.errors.length}.`); setPreview(null); setFile(null); if (inputRef.current) inputRef.current.value = ''; onImported(); }
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Import thất bại'); } finally { setBusy(false); }
  }

  return <section className="rounded-3xl border border-ink/10 bg-white/50 p-4 dark:border-white/10 dark:bg-white/[.04] sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-display text-xl">Sao lưu dữ liệu</h2><p className="mt-1 text-xs opacity-60">Export JSON/CSV hoặc import có preview, không tự ghi khi file còn lỗi.</p></div><div className="flex gap-2"><button onClick={() => exportData('json')} className="min-h-10 rounded-xl border border-ink/15 px-3 text-xs font-bold dark:border-white/15">JSON</button><button onClick={() => exportData('csv')} className="min-h-10 rounded-xl border border-ink/15 px-3 text-xs font-bold dark:border-white/15">CSV</button></div></div><div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"><input ref={inputRef} type="file" accept=".json,.csv,application/json,text/csv" onChange={event => { setFile(event.target.files?.[0] ?? null); setPreview(null); setMessage(''); }} className="min-h-11 min-w-0 flex-1 rounded-xl border border-ink/15 bg-white/60 px-3 py-2 text-sm dark:border-white/15 dark:bg-white/5" /><button disabled={!file || busy} onClick={() => importFile(true)} className="min-h-11 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-paper disabled:opacity-40">Xem preview</button></div>{preview && <div className="mt-4 rounded-2xl bg-sky-500/10 p-3 text-sm"><p className="font-bold">{preview.total} dòng · {preview.valid} hợp lệ · {preview.errors.length} lỗi</p>{preview.errors.length > 0 && <ul className="mt-2 max-h-28 overflow-auto text-xs text-red-700 dark:text-red-300">{preview.errors.slice(0, 8).map(error => <li key={`${error.row}-${error.error}`}>Dòng {error.row}: {error.error}</li>)}</ul>}<button disabled={busy || preview.valid === 0} onClick={() => importFile(false)} className="mt-3 min-h-10 rounded-xl bg-coral px-4 py-2 text-xs font-bold text-white disabled:opacity-40">Import {preview.valid} dòng hợp lệ</button></div>}{message && <p role="status" className="mt-3 text-sm font-bold">{message}</p>}</section>;
}
