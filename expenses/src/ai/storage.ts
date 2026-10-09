import { AI_INSIGHT_LIMITS, AI_LANGUAGES, AI_STORAGE_KEYS } from './config';

export const getStoredApiKey = (): string =>
  localStorage.getItem(AI_STORAGE_KEYS.apiKey) || '';

export const setStoredApiKey = (key: string) => {
  if (key) {
    localStorage.setItem(AI_STORAGE_KEYS.apiKey, key);
  } else {
    localStorage.removeItem(AI_STORAGE_KEYS.apiKey);
  }
};

/** Session flag: Drupal confirmed there is no key, so components don't ask again. */
export const keyLookup = { serverHasNoKey: false };

export const getShareDescriptions = (): boolean =>
  localStorage.getItem(AI_STORAGE_KEYS.shareDescriptions) !== 'false';

export const setShareDescriptions = (value: boolean) => {
  localStorage.setItem(AI_STORAGE_KEYS.shareDescriptions, String(value));
};

export interface AiUsage {
  date: string;
  requests: number;
  tokens: number;
}

const todayKey = () => new Date().toISOString().slice(0, 10);

export const getAiUsage = (): AiUsage => {
  try {
    const usage = JSON.parse(localStorage.getItem(AI_STORAGE_KEYS.usage) || 'null');
    if (usage?.date === todayKey()) return usage;
  } catch {
    // ignore malformed value
  }
  return { date: todayKey(), requests: 0, tokens: 0 };
};

export const recordAiUsage = (tokens: number) => {
  const usage = getAiUsage();
  localStorage.setItem(
    AI_STORAGE_KEYS.usage,
    JSON.stringify({ ...usage, requests: usage.requests + 1, tokens: usage.tokens + tokens })
  );
};

export const getAiLanguage = (): string => {
  const value = localStorage.getItem(AI_STORAGE_KEYS.language);
  return value && (AI_LANGUAGES as readonly string[]).includes(value) ? value : AI_LANGUAGES[0];
};

export const setAiLanguage = (value: string) => {
  localStorage.setItem(AI_STORAGE_KEYS.language, value);
};

export type InsightTone = 'positive' | 'negative' | 'warning' | 'tip' | 'neutral';

export interface Insight {
  headline: string;
  bullets: { tone: InsightTone; text: string }[];
  suggestions: string[];
  followUps: string[];
}

export interface InsightEntry {
  /** Hash of the data + language the insight was generated from. */
  hash: string;
  insight: Insight;
  at: number;
  tokens: number;
  model?: string;
  /** The user minimized the card; it stays a pill until opened again. */
  collapsed?: boolean;
}

const readInsights = (): Record<string, InsightEntry> => {
  try {
    return JSON.parse(localStorage.getItem(AI_STORAGE_KEYS.insights) || '{}') || {};
  } catch {
    return {};
  }
};

export const getInsightEntry = (key: string): InsightEntry | null => readInsights()[key] || null;

export const saveInsightEntry = (key: string, entry: InsightEntry) => {
  const entries = { ...readInsights(), [key]: entry };
  const keys = Object.keys(entries).sort((a, b) => entries[b].at - entries[a].at);
  keys.slice(AI_INSIGHT_LIMITS.cacheEntries).forEach((k) => delete entries[k]);
  localStorage.setItem(AI_STORAGE_KEYS.insights, JSON.stringify(entries));
};

/** Model → timestamp (ms) until which it is rate limited. Expired entries are dropped. */
export const getModelCooldowns = (): Record<string, number> => {
  try {
    const all = JSON.parse(localStorage.getItem(AI_STORAGE_KEYS.modelCooldowns) || '{}') || {};
    const now = Date.now();
    return Object.fromEntries(
      Object.entries(all).filter(([, until]) => typeof until === 'number' && until > now)
    ) as Record<string, number>;
  } catch {
    return {};
  }
};

export const setModelCooldown = (model: string, until: number) => {
  localStorage.setItem(
    AI_STORAGE_KEYS.modelCooldowns,
    JSON.stringify({ ...getModelCooldowns(), [model]: until })
  );
};

/** Removes every AI-related value from this device (used on logout). */
export const clearAiLocalData = () => {
  Object.values(AI_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  keyLookup.serverHasNoKey = false;
};
