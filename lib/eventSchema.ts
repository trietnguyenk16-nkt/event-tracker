import { z } from 'zod';
import { isValidTimezone } from './dateRules';

export const eventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  event_datetime: z.coerce.date(),
  timezone: z.string().refine(isValidTimezone, 'Timezone không hợp lệ').default('Asia/Ho_Chi_Minh'),
  tags: z.array(z.string()).max(20).default([]),
  is_completed: z.boolean().default(false),
  reminder_offset_minutes: z.number().int().min(0).max(10080).nullable().optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  duration_value: z.number().int().positive().max(3650).nullable().optional(),
  duration_unit: z.enum(['day', 'week', 'month', 'year']).nullable().optional(),
  recurrence_rule: z.enum(['daily', 'weekly', 'monthly']).nullable().optional(),
  recurrence_end: z.coerce.date().nullable().optional(),
  recurrence_count: z.number().int().positive().max(60).nullable().optional(),
});

export type EventPayload = z.infer<typeof eventSchema>;
