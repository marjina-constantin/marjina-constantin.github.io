import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AiError, describeAiError, streamGenerate } from '../client';
import { AI_INSIGHT_LIMITS } from '../config';
import { INSIGHT_FEATURES, InsightFeatureId } from '../insights/features';
import { INSIGHT_SCHEMA, INSIGHT_SYSTEM_PROMPT, buildInsightPrompt } from '../prompts';
import {
  Insight,
  InsightEntry,
  InsightTone,
  getAiLanguage,
  getInsightEntry,
  recordAiUsage,
  saveInsightEntry,
} from '../storage';
import { useInsightInput } from './useInsightInput';

const TONES: InsightTone[] = ['positive', 'negative', 'warning', 'tip', 'neutral'];

/** FNV-1a, enough to detect that the data behind an insight changed. */
const hash = (text: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16);
};

const strings = (value: unknown, max: number) =>
  Array.isArray(value)
    ? value.filter((v): v is string => typeof v === 'string' && v.trim() !== '').slice(0, max)
    : [];

const parseInsight = (text: string): Insight => {
  const raw = JSON.parse(text);
  if (typeof raw?.headline !== 'string' || !Array.isArray(raw?.bullets)) {
    throw new AiError('unknown', 'Malformed insight');
  }
  return {
    headline: raw.headline,
    bullets: raw.bullets
      .filter((b: any) => typeof b?.text === 'string')
      .slice(0, 6)
      .map((b: any) => ({ tone: TONES.includes(b.tone) ? b.tone : 'neutral', text: b.text })),
    suggestions: strings(raw.suggestions, 3),
    followUps: strings(raw.followUps, 3),
  };
};

export type InsightStatus = 'idle' | 'loading' | 'error';

export function useAiInsight(apiKey: string, feature: InsightFeatureId, param?: string) {
  const definition = INSIGHT_FEATURES[feature];
  const input = useInsightInput();
  const filter = feature.startsWith('income') ? input.incomeFilter : input.expenseFilter;
  const cacheKey = `${feature}|${param || ''}|${filter}`;

  const [entry, setEntry] = useState<InsightEntry | null>(() => getInsightEntry(cacheKey));
  const [status, setStatus] = useState<InsightStatus>('idle');
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    setEntry(getInsightEntry(cacheKey));
    setStatus('idle');
    setError('');
  }, [cacheKey]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // The data context is only rebuilt when there is a cached insight to compare against.
  const hasEntry = !!entry;
  const currentHash = useMemo(() => {
    if (!hasEntry) return null;
    const context = definition.build(input, param);
    return context ? hash(`${getAiLanguage()}\n${context}`) : null;
  }, [hasEntry, definition, input, param]);
  const stale = !!entry && currentHash !== null && currentHash !== entry.hash;

  const generate = useCallback(async () => {
    const context = definition.build(input, param);
    if (!context) {
      setStatus('error');
      setError('Not enough data for an insight yet.');
      return;
    }
    if (!apiKey) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('loading');
    setError('');

    const language = getAiLanguage();
    try {
      const result = await streamGenerate({
        apiKey,
        tier: 'chat',
        signal: controller.signal,
        request: {
          systemInstruction: { parts: [{ text: INSIGHT_SYSTEM_PROMPT }] },
          contents: [
            { role: 'user', parts: [{ text: buildInsightPrompt(definition.task, language, context) }] },
          ],
          generationConfig: {
            maxOutputTokens: AI_INSIGHT_LIMITS.maxOutputTokens,
            responseMimeType: 'application/json',
            responseSchema: INSIGHT_SCHEMA,
            thinkingConfig: { thinkingLevel: 'low' },
          },
        },
      });
      const tokens = result.usage.totalTokenCount || 0;
      recordAiUsage(tokens);
      const next: InsightEntry = {
        hash: hash(`${language}\n${context}`),
        insight: parseInsight(result.text),
        at: Date.now(),
        tokens,
        model: result.model,
      };
      saveInsightEntry(cacheKey, next);
      setEntry(next);
      setStatus('idle');
    } catch (err) {
      if (controller.signal.aborted) return;
      setStatus('error');
      setError(err instanceof SyntaxError ? 'The AI answer was incomplete. Try again.' : describeAiError(err));
    }
  }, [apiKey, cacheKey, definition, input, param]);

  return { entry, stale, status, error, generate, label: definition.label };
}
