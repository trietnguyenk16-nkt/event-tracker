import { NextResponse } from 'next/server';
import { DEFAULT_OPENAI_MODEL, OPENAI_MODELS } from '@/lib/ai';

export async function GET() {
  return NextResponse.json({ configured: Boolean(process.env.OPENAI_API_KEY), defaultModel: DEFAULT_OPENAI_MODEL, models: OPENAI_MODELS });
}
