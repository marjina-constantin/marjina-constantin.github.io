import { AI_LANGUAGES, AI_STORAGE_KEYS } from './config';

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

/** Model → timestamp (ms) until which it is rate limited. Expired entries are dropped. */
export const getModelCooldowns = (): Record<string, number> => {
  try {
    const all = JSON.parse(localStorage.getItem(AI_STORAGE_KEYS.modelCooldowns) || '{}') || {};
    const log = getModelLimitLog();
    for (const [model, record] of Object.entries(log)) {
      all[model] = effectiveCooldownUntil(record);
    }
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

/** Last rate-limit (429) error received for a model, kept for diagnosis. */
export interface ModelLimitRecord {
  at: number;
  /** Cooldown applied by the app. */
  until: number;
  daily: boolean;
  retryAfterSeconds?: number;
  quotaId?: string;
  limit?: number;
}

/** Prefer Google's retryDelay when the record still has one. */
export const effectiveCooldownUntil = (record: ModelLimitRecord) =>
  record.retryAfterSeconds
    ? record.at + record.retryAfterSeconds * 1000
    : record.until;

export const getModelLimitLog = (): Record<string, ModelLimitRecord> => {
  try {
    return JSON.parse(localStorage.getItem(AI_STORAGE_KEYS.modelLimits) || '{}') || {};
  } catch {
    return {};
  }
};

export const saveModelLimit = (model: string, record: ModelLimitRecord) => {
  localStorage.setItem(
    AI_STORAGE_KEYS.modelLimits,
    JSON.stringify({ ...getModelLimitLog(), [model]: record })
  );
};

/** Removes every AI-related value from this device (used on logout). */
export const clearAiLocalData = () => {
  Object.values(AI_STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  keyLookup.serverHasNoKey = false;
};
