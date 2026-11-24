import { streamGenerate } from './client';
import { getAiLanguage, recordAiUsage } from './storage';
import { MonthScoreFacts, factsPacketForModel } from './monthScore';

const WHY_SCHEMA = {
  type: 'object',
  properties: {
    why: { type: 'string' },
  },
  required: ['why'],
};

const clip = (value: string) => value.replace(/\s+/g, ' ').trim().slice(0, 360);

const whyFromUnknown = (value: unknown): string => {
  if (typeof value === 'string') return clip(value);
  if (value && typeof value === 'object' && 'why' in value) {
    return clip(String((value as { why?: unknown }).why ?? ''));
  }
  return '';
};

const readWhy = (text: string): string => {
  const raw = text.trim();
  if (!raw) throw new Error('Empty response');

  const fromJson = (value: string) => {
    const parsed = JSON.parse(value) as unknown;
    return whyFromUnknown(parsed);
  };

  try {
    const why = fromJson(raw);
    if (why) return why;
  } catch {
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        const why = fromJson(raw.slice(start, end + 1));
        if (why) return why;
      } catch {
        // Model ignored JSON mode; use the sentence if it looks like copy.
      }
    }
  }

  const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  if (stripped !== raw) return readWhy(stripped);
  if (!raw.startsWith('{')) return clip(raw);
  throw new Error('Empty response');
};

export async function generateMonthScoreWhy(
  apiKey: string,
  facts: MonthScoreFacts,
  signal?: AbortSignal
): Promise<string> {
  const language = getAiLanguage();
  const result = await streamGenerate({
    apiKey,
    tier: 'lite',
    signal,
    request: {
      systemInstruction: {
        parts: [
          {
            text: `You turn a score formula into spoken ${language}.
Reply with JSON only: {"why":"..."}.
Use only scoreSteps and skipped from FACTS. Never invent extra reasons, merchants, or numbers.
Start at 6 and mention every plus/minus with the human reason already in the step.
If skipped has items, add one short clause for them.
End with the final score. 2-4 short sentences. No preamble. No bullet list.`,
          },
        ],
      },
      contents: [{ role: 'user', parts: [{ text: `FACTS\n${factsPacketForModel(facts)}` }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
        responseSchema: WHY_SCHEMA,
        thinkingConfig: { thinkingLevel: 'minimal' },
      },
    },
  });
  if (signal?.aborted) {
    const error = new Error('Stopped');
    error.name = 'AbortError';
    throw error;
  }
  recordAiUsage(result.usage.totalTokenCount || 0);
  return readWhy(result.text);
}
