import { describe, expect, it } from 'vitest';
import { isCronAuthorized } from './cronAuth';

describe('cronAuth', () => {
  it('accepts the exact bearer secret and rejects missing or incorrect values', () => {
    expect(isCronAuthorized('Bearer test-cron-secret', 'test-cron-secret')).toBe(true);
    expect(isCronAuthorized('Bearer wrong', 'test-cron-secret')).toBe(false);
    expect(isCronAuthorized(null, 'test-cron-secret')).toBe(false);
    expect(isCronAuthorized('Bearer test-cron-secret', undefined)).toBe(false);
  });
});
