import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendEventReminder } from '@/lib/email';
import { isReminderDue, isWithinReminderHorizon } from '@/lib/reminders';

/** Cron được Vercel gọi định kỳ; secret chỉ nằm ở request header/server env. */
export async function GET(req: NextRequest) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const candidates = await db.event.findMany({
    where: {
      is_completed: false,
      deleted_at: null,
      email: { not: null },
      reminder_offset_minutes: { not: null },
      reminder_sent_at: null,
      event_datetime: { gt: now, lt: horizon },
    },
  });

  let sent = 0;
  let failed = 0;
  for (const event of candidates) {
    if (!isWithinReminderHorizon(event, now) || !isReminderDue(event, now)) continue;
    try {
      await sendEventReminder({
        to: event.email!,
        title: event.title,
        description: event.description,
        eventDate: event.event_datetime,
      });
      await db.event.update({ where: { id: event.id }, data: { reminder_sent_at: new Date() } });
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error('Reminder failed', event.id, error instanceof Error ? error.message : 'unknown error');
    }
  }

  return NextResponse.json({ checked: candidates.length, sent, failed });
}
