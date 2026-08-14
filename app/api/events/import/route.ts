import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rateLimit';
import { normalizeImportRow, parseCsv, rowIdempotencyKey } from '@/lib/importExport';
import type { EventPayload } from '@/lib/eventSchema';

function responseJson(data: unknown, init: ResponseInit, headers: ReturnType<typeof rateLimitHeaders>) {
  return NextResponse.json(data, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });
}

export async function POST(request: NextRequest) {
  const rate = checkRateLimit(request, 'events-import', 10);
  if (!rate.allowed) return responseJson({ error: 'Quá nhiều lần import, hãy thử lại sau.' }, { status: 429 }, rateLimitHeaders(rate));
  try {
    const contentType = request.headers.get('content-type') ?? '';
    let raw: unknown;
    let preview = false;
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData(); const file = form.get('file'); preview = form.get('preview') === 'true';
      if (!(file instanceof File)) return responseJson({ error: 'Thiếu file import' }, { status: 400 }, rateLimitHeaders(rate));
      const text = await file.text(); raw = file.name.toLowerCase().endsWith('.csv') ? parseCsv(text) : JSON.parse(text);
    } else {
      const body = await request.json(); preview = body.preview === true; raw = body.events ?? body.rows ?? body;
      if (typeof raw === 'string') raw = raw.trim().startsWith('[') ? JSON.parse(raw) : parseCsv(raw);
    }
    const rows = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' && 'events' in raw && Array.isArray((raw as { events: unknown }).events) ? (raw as { events: unknown[] }).events : []);
    const errors: Array<{ row: number; error: string }> = [];
    const valid: Array<{ data: EventPayload; key: string }> = [];
    rows.forEach((row, index) => { const parsed = normalizeImportRow((row ?? {}) as Record<string, unknown>); if (!parsed.success) errors.push({ row: index + 2, error: parsed.error.issues.map(issue => `${issue.path.join('.') || 'row'}: ${issue.message}`).join('; ') }); else valid.push({ data: parsed.data, key: rowIdempotencyKey(parsed.data) }); });
    if (preview) return responseJson({ preview: true, total: rows.length, valid: valid.length, errors, sample: valid.slice(0, 5).map(item => item.data) }, { status: 200 }, rateLimitHeaders(rate));
    let created = 0; let skipped = 0;
    await db.$transaction(async tx => {
      for (const item of valid) {
        const existing = await tx.event.findFirst({ where: { OR: [{ idempotency_key: item.key }, { title: item.data.title, event_datetime: item.data.event_datetime, timezone: item.data.timezone, deleted_at: null }] } });
        if (existing) { skipped += 1; continue; }
        await tx.event.create({ data: { ...item.data, idempotency_key: item.key } });
        created += 1;
      }
    });
    return responseJson({ preview: false, total: rows.length, created, skipped, errors }, { status: 201 }, rateLimitHeaders(rate));
  } catch (error) {
    return responseJson({ error: error instanceof Error ? error.message : 'File import không hợp lệ' }, { status: 400 }, rateLimitHeaders(rate));
  }
}
