import { describe, expect, it } from 'vitest';
import { checkRateLimit, rateLimitHeaders } from './rateLimit';

describe('rateLimit', () => {
  it('blocks bursts and exposes retry metadata', () => {
    const request = new Request('https://example.test/api/events', { headers: { 'x-forwarded-for': '198.51.100.10', 'x-request-id': 'smoke-123' } });
    const first = checkRateLimit(request, 'test-burst', 2, 60_000);
    const second = checkRateLimit(request, 'test-burst', 2, 60_000);
    const third = checkRateLimit(request, 'test-burst', 2, 60_000);
    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(third.allowed).toBe(false);
    expect(third.requestId).toBe('smoke-123');
    expect(rateLimitHeaders(third)['Retry-After']).toBeDefined();
  });
});
