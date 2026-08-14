/** Gửi email qua Resend; secret chỉ dùng phía server. */
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function escapeEmailHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[character] ?? character));
}

export function buildEventReminderHtml(input: { title: string; description?: string | null; eventDate: Date }) {
  return `<div style="font-family:Arial;max-width:560px"><h1>${escapeEmailHtml(input.title)}</h1><p>Sự kiện diễn ra lúc <strong>${input.eventDate.toLocaleString('vi-VN')}</strong>.</p>${input.description ? `<p>${escapeEmailHtml(input.description)}</p>` : ''}</div>`;
}

export async function sendEventReminder(input: { to: string; title: string; description?: string | null; eventDate: Date }) {
  if (!resend) throw new Error('Thiếu RESEND_API_KEY');
  return resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'Event Tracker <onboarding@resend.dev>',
    to: input.to,
    subject: `Nhắc lịch: ${input.title}`,
    html: buildEventReminderHtml(input),
  });
}
