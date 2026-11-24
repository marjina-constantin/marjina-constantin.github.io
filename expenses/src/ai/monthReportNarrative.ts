import { streamGenerate } from './client';
import { getAiLanguage, recordAiUsage } from './storage';
import {
  MonthReportFacts,
  MonthReportNarrative,
  factsPacketForModel,
} from './monthReport';

const NARRATIVE_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    scoreWhy: { type: 'string' },
    wentWell: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['label', 'text'],
      },
    },
    exploded: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          text: { type: 'string' },
        },
        required: ['label', 'text'],
      },
    },
    nextMonth: { type: 'string' },
    joke: { type: 'string' },
  },
  required: ['headline', 'scoreWhy', 'wentWell', 'exploded', 'nextMonth', 'joke'],
};

const clip = (value: unknown, max: number) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.slice(0, max);
};

const stories = (value: unknown, fallback: MonthReportNarrative['wentWell']) => {
  if (!Array.isArray(value) || !value.length) return fallback.slice(0, 3);
  const parsed = value
    .map((row) => ({
      label: clip((row as { label?: unknown }).label, 40),
      text: clip((row as { text?: unknown }).text, 180),
    }))
    .filter((row) => row.label && row.text)
    .slice(0, 3);
  return parsed.length ? parsed : fallback.slice(0, 3);
};

const parseNarrative = (text: string, fallback: MonthReportNarrative): MonthReportNarrative => {
  const parsed = JSON.parse(text) as Partial<MonthReportNarrative>;
  const headline = clip(parsed.headline, 90);
  if (!headline) return fallback;
  return {
    headline,
    scoreWhy: clip(parsed.scoreWhy, 90) || fallback.scoreWhy,
    wentWell: stories(parsed.wentWell, fallback.wentWell),
    exploded: stories(parsed.exploded, fallback.exploded),
    nextMonth: clip(parsed.nextMonth, 200) || fallback.nextMonth,
    joke: clip(parsed.joke, 140),
  };
};

export async function generateMonthReportNarrative(
  apiKey: string,
  facts: MonthReportFacts,
  fallback: MonthReportNarrative,
  currency: string,
  signal?: AbortSignal
): Promise<MonthReportNarrative> {
  const language = getAiLanguage();
  const result = await streamGenerate({
    apiKey,
    tier: 'lite',
    signal,
    request: {
      systemInstruction: {
        parts: [
          {
            text: `You write the short copy for a monthly money report inside a personal expense tracker.
Reply in ${language}. Use only numbers from FACTS. Never invent amounts, merchants, or categories.
headline: one sentence, no numbers unless they are in FACTS, max 12 words.
scoreWhy: why the score is what it is, one short clause.
wentWell / exploded: at most 3 each, prefer the lists in FACTS, keep their category labels, mention the delta already in FACTS.
nextMonth: one concrete suggestion with a number from FACTS. If nothing is off, say so.
joke: one dry, fond, ironic line about the spending, not the person. Skip numbers. Empty string if the month is genuinely bad (savings below 0).
No preamble.`,
          },
        ],
      },
      contents: [{ role: 'user', parts: [{ text: `FACTS\n${factsPacketForModel(facts, currency)}` }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
        responseSchema: NARRATIVE_SCHEMA,
        thinkingConfig: { thinkingLevel: 'minimal' },
      },
    },
  });
  recordAiUsage(result.usage.totalTokenCount || 0);
  try {
    return parseNarrative(result.text, fallback);
  } catch {
    return fallback;
  }
}
