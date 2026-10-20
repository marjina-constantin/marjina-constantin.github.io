export const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta';

/** Drupal user field that stores the user's own Gemini API key. */
export const AI_KEY_FIELD = 'field_gemini_api_key';

/**
 * Model candidates per tier, tried in order. The free tier has a separate quota
 * per model, so when one hits its limit (429) or is retired (404) the next one
 * is used. The first model is retried once its cooldown passes.
 */
export const AI_MODELS = {
  chat: ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'],
  lite: ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.6-flash'],
} as const;

/** Cooldown when a 429 has no retryDelay. */
export const AI_DEFAULT_COOLDOWN_SECONDS = 60;

export type AiModelTier = keyof typeof AI_MODELS;

/** Short model label shown under answers, e.g. "3.8-flash". */
export const modelLabel = (model?: string): string | null =>
  model ? model.replace(/^gemini-/, '') : null;

/** Next model in the chat list after `after`, or the second model if none is given. */
export const nextChatModel = (after?: string): string | null => {
  const list = AI_MODELS.chat as readonly string[];
  const index = after ? list.indexOf(after) : 0;
  return index >= 0 ? list[index + 1] || null : list[1] || null;
};

export const AI_LIMITS = {
  /** Safety cap per step; includes thinking tokens. Actual usage is much lower. */
  chatMaxOutputTokens: 4096,
  /** Tool-call rounds per question before the model is forced to answer. */
  maxToolRounds: 5,
  /** Past user+model turns kept in the request (older ones are dropped). */
  maxHistoryTurns: 8,
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
  /** Kept so logout still clears insight cards cached before they were removed. */
  insights: 'aiInsights',
  chat: 'aiChat',
  chatShowSuggestions: 'aiChatShowSuggestions',
  modelCooldowns: 'aiModelCooldowns',
  modelLimits: 'aiModelLimits',
};

export const AI_LANGUAGES = ['Romanian', 'English', 'Russian'] as const;
