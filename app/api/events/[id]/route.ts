import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { checkRateLimit, rateLimitHeaders } from '@/lib/rateLimit';
import { db } from '@/lib/db';
import { eventSchema } from '@/lib/eventSchema';

const patchSchema = eventSchema.partial().extend({ is_completed: z.boolean().optional() });

function changedFields(before: Record<string, unknown>, after: Record<string, unknown>) {
  const changes: Record<string, { before: unknown; after: unknown }> = {};
  for (const key of Object.keys(after)) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) changes[key] = { before: before[key], after: after[key] };
  }
  return changes;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rate = checkRateLimit(req, 'events-write', 30);
  if (!rate.allowed) return NextResponse.json({ error: 'Quá nhiều yêu cầu, hãy thử lại sau.' }, { status: 429, headers: rateLimitHeaders(rate) });
  try {
    const { id } = await params;
    const body = await req.json();
    const scope = body.scope === 'series' ? 'series' : 'single';
    const data = patchSchema.parse(body);
    const { scope: _scope, ...patch } = data as typeof data & { scope?: string };
    const result = await db.$transaction(async tx => {
      const current = await tx.event.findUniqueOrThrow({ where: { id }, include: { generated_events: true } });
      const seriesRoot = current.source_event_id ? await tx.event.findUniqueOrThrow({ where: { id: current.source_event_id }, include: { generated_events: true } }) : current;
      const targetIds = scope === 'series' ? [seriesRoot.id, ...seriesRoot.generated_events.map(event => event.id)] : [current.id];
      const action = patch.is_completed === true && !current.is_completed ? 'completed' : patch.is_completed === false && current.is_completed ? 'reopened' : 'updated';
      const updated = [];
      for (const targetId of targetIds) {
        const before = await tx.event.findUniqueOrThrow({ where: { id: targetId } });
        const item = await tx.event.update({ where: { id: targetId }, data: { ...patch, ...(patch.is_completed === false ? { reminder_sent_at: null } : {}) } });
        await tx.eventHistory.create({ data: { event_id: targetId, action, changes: changedFields(before as unknown as Record<string, unknown>, item as unknown as Record<string, unknown>) as Prisma.InputJsonValue } });
        updated.push(item);
      }
      return updated.length === 1 ? updated[0] : updated;
    });
    return NextResponse.json(result, { headers: rateLimitHeaders(rate) });
  } catch (error) {
    console.error('[events] update failed', error instanceof Error ? error.message : 'unknown');
    return NextResponse.json({ error: 'Không thể cập nhật', request_id: rate.requestId }, { status: 400, headers: rateLimitHeaders(rate) });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rate = checkRateLimit(req, 'events-write', 30);
  if (!rate.allowed) return NextResponse.json({ error: 'Quá nhiều yêu cầu, hãy thử lại sau.' }, { status: 429, headers: rateLimitHeaders(rate) });
  try {
    const { id } = await params;
    const scope = new URL(req.url).searchParams.get('scope') === 'series' ? 'series' : 'single';
    const result = await db.$transaction(async tx => {
      const current = await tx.event.findUniqueOrThrow({ where: { id }, include: { generated_events: true } });
      const seriesRoot = current.source_event_id ? await tx.event.findUniqueOrThrow({ where: { id: current.source_event_id }, include: { generated_events: true } }) : current;
      const targetIds = scope === 'series' ? [seriesRoot.id, ...seriesRoot.generated_events.map(event => event.id)] : [current.id];
      for (const targetId of targetIds) {
        const before = await tx.event.findUniqueOrThrow({ where: { id: targetId } });
        await tx.event.update({ where: { id: targetId }, data: { deleted_at: new Date() } });
        await tx.eventHistory.create({ data: { event_id: targetId, action: 'deleted', changes: { before: { deleted_at: before.deleted_at }, after: { deleted_at: 'now' } } } });
      }
      return { deleted: targetIds.length };
    });
    return NextResponse.json(result, { headers: rateLimitHeaders(rate) });
  } catch {
    return NextResponse.json({ error: 'Không thể xóa', request_id: rate.requestId }, { status: 400, headers: rateLimitHeaders(rate) });
  }
}
