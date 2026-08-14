import { randomUUID } from 'node:crypto';

const buckets = new Map<string, { count: number; resetAt: number }>();

export function requestId(request: Request): string {
  return request.headers.get('x-request-id')?.slice(0, 80) || randomUUID();
}

export function clientKey(request: Request, bucket: string): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return `${bucket}:${forwarded || request.headers.get('x-real-ip') || 'unknown'}`;
}

export function checkRateLimit(request: Request, bucket: string, limit = 30, windowMs = 60_000) {
  const key = clientKey(request, bucket);
  const now = Date.now();
  const previous = buckets.get(key);
  const current = !previous || previous.resetAt <= now ? { count: 0, resetAt: now + windowMs } : previous;
  current.count += 1;
  buckets.set(key, current);
  if (buckets.size > 10_000) {
    for (const [entryKey, entry] of buckets) if (entry.resetAt <= now) buckets.delete(entryKey);
  }
  return { allowed: current.count <= limit, remaining: Math.max(limit - current.count, 0), retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1), requestId: requestId(request) };
}

export function rateLimitHeaders(result: { remaining: number; retryAfterSeconds: number; requestId: string }) {
  return { 'X-RateLimit-Remaining': String(result.remaining), 'X-Request-ID': result.requestId, ...(result.remaining === 0 ? { 'Retry-After': String(result.retryAfterSeconds) } : {}) };
}
