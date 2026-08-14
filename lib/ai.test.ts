import { describe, expect, it } from 'vitest';
import { getOpenAIModel, isAllowedModel, OPENAI_MODELS, requestStructured } from './ai';

describe('OpenAI configuration', () => {
  it('exposes only the safe model allowlist', () => {
    expect(OPENAI_MODELS.map(model => model.id)).toEqual(['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-4.1']);
    expect(isAllowedModel('gpt-4o-mini')).toBe(true);
    expect(isAllowedModel('not-a-model')).toBe(false);
    expect(getOpenAIModel('not-a-model')).toBe('gpt-4o-mini');
  });

  it('falls back without making a provider request when the key is absent', async () => {
    const previous = process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    const result = await requestStructured({ model: 'gpt-4o-mini', schemaName: 'test', schema: { type: 'object' }, system: 'test', user: 'test' });
    expect(result).toMatchObject({ ok: false, reason: 'missing_key', model: 'gpt-4o-mini' });
    if (previous) process.env.OPENAI_API_KEY = previous;
  });
});
