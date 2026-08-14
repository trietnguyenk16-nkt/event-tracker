import OpenAI from 'openai';

export const OPENAI_MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o mini', description: 'Nhanh, tiết kiệm; phù hợp quick capture và tìm kiếm.' },
  { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini', description: 'Cân bằng tốc độ và chất lượng suy luận.' },
  { id: 'gpt-4.1', label: 'GPT-4.1', description: 'Chất lượng cao hơn cho agenda và conflict.' },
] as const;

export type OpenAIModelId = (typeof OPENAI_MODELS)[number]['id'];
export const DEFAULT_OPENAI_MODEL: OpenAIModelId = (process.env.OPENAI_MODEL as OpenAIModelId) || 'gpt-4o-mini';

export function isAllowedModel(value: unknown): value is OpenAIModelId {
  return typeof value === 'string' && OPENAI_MODELS.some(model => model.id === value);
}

export function getOpenAIModel(value?: unknown): OpenAIModelId {
  return isAllowedModel(value) ? value : (isAllowedModel(DEFAULT_OPENAI_MODEL) ? DEFAULT_OPENAI_MODEL : 'gpt-4o-mini');
}

export function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 15_000, maxRetries: 1 });
}

export async function requestStructured<T>({ model, system, user, schemaName, schema }: { model?: unknown; system: string; user: string; schemaName: string; schema: Record<string, unknown> }): Promise<{ ok: true; data: T; model: OpenAIModelId } | { ok: false; reason: 'missing_key' | 'provider_error' | 'invalid_output'; model: OpenAIModelId }> {
  const selectedModel = getOpenAIModel(model);
  const client = getOpenAIClient();
  if (!client) return { ok: false, reason: 'missing_key', model: selectedModel };
  try {
    const response = await client.chat.completions.create({
      model: selectedModel,
      temperature: 0.2,
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      response_format: { type: 'json_schema', json_schema: { name: schemaName, strict: true, schema } },
    });
    const content = response.choices[0]?.message?.content;
    if (!content) return { ok: false, reason: 'invalid_output', model: selectedModel };
    return { ok: true, data: JSON.parse(content) as T, model: selectedModel };
  } catch (error) {
    console.error('[AI] provider request failed', error instanceof Error ? error.message : 'unknown');
    return { ok: false, reason: 'provider_error', model: selectedModel };
  }
}
