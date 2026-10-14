import { AI_DEFAULT_COOLDOWN_SECONDS, AI_MODELS, AiModelTier, GEMINI_API_URL } from './config';
import { getModelCooldowns, saveModelLimit, setModelCooldown } from './storage';

export interface GeminiPart {
  text?: string;
  thought?: boolean;
  thoughtSignature?: string;
  functionCall?: { id?: string; name: string; args?: Record<string, unknown> };
  functionResponse?: { id?: string; name: string; response: Record<string, unknown> };
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
  /** Model that produced this turn. Local only, never sent to the API. */
  model?: string;
}

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters?: Record<string, unknown>;
}

export interface GeminiRequest {
  systemInstruction?: { parts: { text: string }[] };
  contents: GeminiContent[];
  tools?: { functionDeclarations: GeminiFunctionDeclaration[] }[];
  toolConfig?: { functionCallingConfig: { mode: 'AUTO' | 'ANY' | 'NONE' } };
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    responseMimeType?: string;
    responseSchema?: Record<string, unknown>;
    thinkingConfig?: { thinkingLevel?: 'minimal' | 'low' | 'medium' | 'high' };
  };
}

export interface GeminiUsage {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  thoughtsTokenCount?: number;
  cachedContentTokenCount?: number;
  totalTokenCount?: number;
}

export interface GeminiResult {
  /** Model parts exactly as received (signatures included), for the history. */
  parts: GeminiPart[];
  text: string;
  functionCalls: NonNullable<GeminiPart['functionCall']>[];
  usage: GeminiUsage;
  finishReason?: string;
  model: string;
}

export type AiErrorKind = 'invalid_key' | 'quota' | 'offline' | 'blocked' | 'model' | 'unknown';

export class AiError extends Error {
  constructor(
    public kind: AiErrorKind,
    message: string,
    public retryAfterSeconds?: number,
    public daily = false,
    public quota?: { quotaId?: string; limit?: number },
    public model?: string
  ) {
    super(message);
    this.name = 'AiError';
  }
}

const parseRetryDelay = (details: any[] | undefined): number | undefined => {
  const retry = details?.find((d) => typeof d?.retryDelay === 'string')?.retryDelay;
  const seconds = retry ? parseFloat(retry) : NaN;
  return Number.isNaN(seconds) ? undefined : Math.ceil(seconds);
};

const isDailyQuota = (message: string, details: any[] | undefined) =>
  /per ?day/i.test(message) ||
  !!details?.some((d) =>
    d?.violations?.some((v: any) => /PerDay/i.test(`${v?.quotaId ?? ''}${v?.quotaMetric ?? ''}`))
  );

/** Free tier daily quotas reset at midnight Pacific time. */
const msUntilPacificMidnight = () => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    hourCycle: 'h23',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date());
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
  const elapsed = get('hour') * 3600 + get('minute') * 60 + get('second');
  return (24 * 3600 - elapsed) * 1000 + 60_000;
};

const cooldownUntil = (error: AiError) =>
  Date.now() +
  (error.daily
    ? msUntilPacificMidnight()
    : (error.retryAfterSeconds ?? AI_DEFAULT_COOLDOWN_SECONDS) * 1000);

/** Signatures from another model fail validation, so they are replaced with the documented bypass value. */
const SKIP_SIGNATURE = 'skip_thought_signature_validator';

const contentsFor = (contents: GeminiContent[], model: string) =>
  contents.map(({ model: author, ...content }) =>
    author && author !== model
      ? {
          ...content,
          parts: content.parts.map((part) =>
            part.thoughtSignature ? { ...part, thoughtSignature: SKIP_SIGNATURE } : part
          ),
        }
      : content
  );

const toAiError = async (response: Response): Promise<AiError> => {
  let message = `HTTP ${response.status}`;
  let details: any[] | undefined;
  try {
    const body = await response.json();
    message = body?.error?.message || message;
    details = body?.error?.details;
  } catch {
    // non-JSON error body
  }
  if (response.status === 429) {
    const violations: any[] = details?.flatMap((d) => d?.violations || []) || [];
    const violation =
      violations.find((v) => /PerDay/i.test(`${v?.quotaId ?? ''}`)) ||
      violations.find((v) => v?.quotaId || v?.quotaMetric);
    const limit = Number(message.match(/limit:\s*(\d+)/i)?.[1]) || undefined;
    return new AiError('quota', message, parseRetryDelay(details), isDailyQuota(message, details), {
      quotaId: violation?.quotaId || violation?.quotaMetric,
      limit,
    });
  }
  if (
    response.status === 401 ||
    response.status === 403 ||
    /api key/i.test(message)
  ) {
    return new AiError('invalid_key', message);
  }
  if (response.status === 404) {
    return new AiError('model', message);
  }
  return new AiError('unknown', message);
};

const headers = (apiKey: string) => ({
  'Content-Type': 'application/json',
  'x-goog-api-key': apiKey,
});

/** Models that returned 404 for this key during the session. */
const unavailableModels = new Set<string>();

async function* readSse(response: Response, signal?: AbortSignal) {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      if (signal?.aborted) return;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let separator: number;
      while ((separator = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, separator).trim();
        buffer = buffer.slice(separator + 1);
        if (line.startsWith('data:')) {
          const payload = line.slice(5).trim();
          if (payload) yield JSON.parse(payload);
        }
      }
    }
    const rest = buffer.trim();
    if (rest.startsWith('data:') && rest.slice(5).trim()) {
      yield JSON.parse(rest.slice(5).trim());
    }
  } finally {
    reader.releaseLock();
  }
}

interface StreamOptions {
  apiKey: string;
  tier: AiModelTier;
  request: GeminiRequest;
  signal?: AbortSignal;
  onText?: (textSoFar: string) => void;
  /** Start from this model (and later ones). Used when retrying with an alternate. */
  preferModel?: string;
}

/**
 * Streams one model step. Text is surfaced through `onText` as it arrives;
 * function calls and the raw parts are returned when the step completes.
 */
export async function streamGenerate({
  apiKey,
  tier,
  request,
  signal,
  onText,
  preferModel,
}: StreamOptions): Promise<GeminiResult> {
  if (!navigator.onLine) {
    throw new AiError('offline', 'No internet connection');
  }

  const list: string[] = [...AI_MODELS[tier]];
  const start = preferModel ? list.indexOf(preferModel) : 0;
  const models = list.slice(start >= 0 && preferModel ? start : 0).filter((m) => !unavailableModels.has(m));
  const candidates = models.filter((m) => !getModelCooldowns()[m]);

  if (models.length && !candidates.length) throw allLimitedError(models);

  let lastError: AiError | null = null;

  for (const model of candidates) {
    const response = await fetch(
      `${GEMINI_API_URL}/models/${model}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        headers: headers(apiKey),
        body: JSON.stringify({ ...request, contents: contentsFor(request.contents, model) }),
        signal,
      }
    );

    if (!response.ok) {
      lastError = await toAiError(response);
      if (lastError.kind === 'model') {
        unavailableModels.add(model);
        continue;
      }
      if (lastError.kind === 'quota') {
        const until = cooldownUntil(lastError);
        setModelCooldown(model, until);
        saveModelLimit(model, {
          at: Date.now(),
          until,
          daily: lastError.daily,
          retryAfterSeconds: lastError.retryAfterSeconds,
          ...lastError.quota,
          message: lastError.message.slice(0, 800),
        });
        continue;
      }
      lastError.model = model;
      throw lastError;
    }

    const parts: GeminiPart[] = [];
    let text = '';
    let usage: GeminiUsage = {};
    let finishReason: string | undefined;

    for await (const chunk of readSse(response, signal)) {
      const candidate = chunk?.candidates?.[0];
      if (chunk?.promptFeedback?.blockReason) {
        throw new AiError('blocked', `Blocked: ${chunk.promptFeedback.blockReason}`);
      }
      for (const part of (candidate?.content?.parts || []) as GeminiPart[]) {
        parts.push(part);
        if (part.text && !part.thought) {
          text += part.text;
          onText?.(text);
        }
      }
      if (candidate?.finishReason) finishReason = candidate.finishReason;
      if (chunk?.usageMetadata) usage = chunk.usageMetadata;
    }

    const functionCalls = parts
      .filter((p) => p.functionCall)
      .map((p) => p.functionCall!);

    return { parts, text, functionCalls, usage, finishReason, model };
  }

  if (lastError?.kind === 'quota') throw allLimitedError(models);
  throw lastError || new AiError('model', 'No available model');
}

const allLimitedError = (models: string[]) => {
  const cooldowns = getModelCooldowns();
  const waitMs = Math.min(...models.map((m) => cooldowns[m] ?? Date.now())) - Date.now();
  return new AiError(
    'quota',
    'All models are rate limited',
    Math.max(1, Math.ceil(waitMs / 1000)),
    waitMs > 3600_000
  );
};

/** Validates the key and model access without spending generation quota. */
export async function testApiKey(apiKey: string): Promise<string> {
  let lastError: AiError | null = null;
  for (const model of AI_MODELS.chat) {
    const response = await fetch(`${GEMINI_API_URL}/models/${model}`, {
      headers: headers(apiKey),
    });
    if (response.ok) return model;
    lastError = await toAiError(response);
    if (lastError.kind !== 'model') throw lastError;
  }
  throw lastError || new AiError('model', 'No available model');
}

export const describeAiError = (error: unknown): string => {
  if (error instanceof AiError) {
    switch (error.kind) {
      case 'invalid_key':
        return 'Your Gemini API key was rejected. Check it in Profile → AI assistant.';
      case 'quota':
        if (error.daily) {
          return 'Daily free tier limit reached on all models. It resets at midnight Pacific time (~10:00 in Chișinău).';
        }
        return error.retryAfterSeconds
          ? `Free tier limit reached on all models. Try again in ${error.retryAfterSeconds}s.`
          : 'Free tier limit reached on all models. Try again a bit later.';
      case 'offline':
        return 'You are offline. The assistant needs an internet connection.';
      case 'blocked':
        return 'The model declined to answer this request.';
      case 'model':
        return 'The AI model is not available for this key.';
      default:
        return `AI request failed: ${error.message}`;
    }
  }
  if ((error as Error)?.name === 'AbortError') return 'Stopped.';
  return 'AI request failed. Try again.';
};
