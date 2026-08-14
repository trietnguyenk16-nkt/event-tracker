/** Logic thuần cho reminder, tách khỏi database/email để test dễ và không gửi thật. */
export type ReminderCandidate = {
  is_completed: boolean;
  email?: string | null;
  reminder_offset_minutes?: number | null;
  reminder_sent_at?: Date | null;
  event_datetime: Date;
};

export function isReminderDue(event: ReminderCandidate, now: Date): boolean {
  if (event.is_completed || !event.email || event.reminder_sent_at || event.reminder_offset_minutes == null) return false;
  const dueAt = event.event_datetime.getTime() - event.reminder_offset_minutes * 60_000;
  return dueAt <= now.getTime();
}

export function isWithinReminderHorizon(event: ReminderCandidate, now: Date, horizonMinutes = 1_440): boolean {
  const eventTime = event.event_datetime.getTime();
  const nowTime = now.getTime();
  return eventTime > nowTime && eventTime < nowTime + horizonMinutes * 60_000;
}
