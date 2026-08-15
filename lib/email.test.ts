import { describe, expect, it } from 'vitest';
import { buildEventReminderHtml, escapeEmailHtml } from './email';

describe('email reminders', () => {
  it('escapes user-controlled title and description', () => {
    const html = buildEventReminderHtml({ title: '<script>alert(1)</script>', description: 'A & B', eventDate: new Date('2026-08-20T07:30:00.000Z') });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('A &amp; B');
  });

  it('escapes all HTML-sensitive characters', () => {
    expect(escapeEmailHtml(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&#039;');
  });
});
