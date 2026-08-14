import { z } from 'zod';

export const eventSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(5000).optional().nullable(),
  event_datetime: z.coerce.date(),
  tags: z.array(z.string()).max(20).default([]),
  is_completed: z.boolean().default(false),
  reminder_offset_minutes: z.number().int().min(0).max(10080).nullable().optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
});

export type EventPayload = z.infer<typeof eventSchema>;
