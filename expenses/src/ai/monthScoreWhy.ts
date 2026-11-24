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
  currency: string,
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
            text: `You explain a 1-10 month score inside a personal expense tracker.
Reply in ${language}. Use only numbers from FACTS. Never invent amounts, merchants, or categories.
why: one or two short sentences, max 28 words, saying why the score is this number.
If comparedTo is "none" and isOpenMonth is true, say the score is from this month's savings so far, not a trend.
If comparedTo is "none" and isOpenMonth is false, say there is not enough history yet to compare.
If comparedTo is a period, mention that period. No preamble.`,
          },
        ],
      },
      contents: [{ role: 'user', parts: [{ text: `FACTS\n${factsPacketForModel(facts, currency)}` }] }],
      generationConfig: {
        temperature: 0.6,
        maxOutputTokens: 256,
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
    .slice(0, 220);
  if (!why) throw new Error('Empty response');
  return why;
}
