export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

/** Drupal user field that stores the user's own Gemini API key. */
export const AI_KEY_FIELD = 'field_gemini_api_key';

/**
 * Model candidates per tier, tried in order. The free tier has a separate quota
 * per model, so when one hits its limit (429) or is retired (404) the next one
 * is used. The first model is retried once its cooldown passes.
 */
export const AI_MODELS = {
  chat: ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'],
  lite: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'],
} as const;

/** Cooldown after a per-minute limit when the API does not send a retry delay. */
export const AI_DEFAULT_COOLDOWN_SECONDS = 60;

export type AiModelTier = keyof typeof AI_MODELS;

/** Short model label, shown only when a fallback model answered. */
export const fallbackModelLabel = (model?: string): string | null =>
  model && model !== AI_MODELS.chat[0] ? model.replace(/^gemini-/, '') : null;

export const AI_LIMITS = {
  /** Safety cap per step; includes thinking tokens. Actual usage is much lower. */
  chatMaxOutputTokens: 4096,
  /** Tool-call rounds per question before the model is forced to answer. */
  maxToolRounds: 5,
  /** Past user+model turns kept in the request (older ones are dropped). */
  maxHistoryTurns: 6,
  toolRowsDefault: 50,
  toolRowsMax: 300,
  toolGroupsDefault: 60,
  toolGroupsMax: 200,
  summaryTopDescriptions: 30,
};

export const AI_STORAGE_KEYS = {
  apiKey: 'geminiApiKey',
  shareDescriptions: 'aiShareDescriptions',
  usage: 'aiUsage',
  language: 'aiLanguage',
  insights: 'aiInsights',
  modelCooldowns: 'aiModelCooldowns',
};

export const AI_LANGUAGES = ['Romanian', 'English', 'Russian'] as const;

export const AI_INSIGHT_LIMITS = {
  maxOutputTokens: 2048,
  /** Cached insights kept on the device (oldest are evicted). */
  cacheEntries: 40,
};
