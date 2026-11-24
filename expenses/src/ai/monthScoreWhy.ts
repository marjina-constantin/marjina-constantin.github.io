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
Use only SCORE_STEPS and skipped from FACTS. Never invent extra reasons, merchants, or numbers.
Start at 6 and mention every plus/minus with the human reason already in the step.
If skipped has items, add one short clause for them.
End with the final score. 2-4 short sentences. No preamble. No bullet list.`,
          },
        ],
      },
      contents: [{ role: 'user', parts: [{ text: `FACTS\n${factsPacketForModel(facts)}` }] }],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 384,
        responseMimeType: 'application/json',
        responseSchema: WHY_SCHEMA,
        thinkingConfig: { thinkingLevel: 'minimal' },
      },
    },
  });
  recordAiUsage(result.usage.totalTokenCount || 0);
  const parsed = JSON.parse(result.text) as { why?: unknown };
  const why = String(parsed.why ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 360);
  if (!why) throw new Error('Empty response');
  return why;
}
