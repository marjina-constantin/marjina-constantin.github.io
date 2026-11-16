import type { GeminiPart, GeminiRequest, GeminiResult, GeminiUsage } from './client';
import { AI_STORAGE_KEYS } from './config';

export type AiDebugKind = 'info' | 'request' | 'response' | 'tool' | 'warn' | 'error';

export interface AiDebugStep {
  id: string;
  at: number;
  kind: AiDebugKind;
  title: string;
  subtitle?: string;
  /** Short plain-language explanation, used for tool steps. */
  summary?: string;
  durationMs?: number;
  data?: unknown;
}

export interface AiDebugTrace {
  startedAt: number;
  endedAt?: number;
  steps: AiDebugStep[];
}

export const isAiDebugEnabled = (): boolean =>
  localStorage.getItem(AI_STORAGE_KEYS.debug) === 'true';

export const setAiDebugEnabled = (value: boolean) => {
  if (value) {
    localStorage.setItem(AI_STORAGE_KEYS.debug, 'true');
  } else {
    localStorage.removeItem(AI_STORAGE_KEYS.debug);
  }
};

const newStepId = () => `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

export const createDebugTrace = (): AiDebugTrace => ({
  startedAt: Date.now(),
  steps: [],
});

export const pushDebugStep = (
  trace: AiDebugTrace,
  step: Omit<AiDebugStep, 'id' | 'at'>
): AiDebugTrace => {
  trace.steps.push({
    id: newStepId(),
    at: Date.now(),
    ...step,
  });
  return snapshotTrace(trace);
};

export const finishDebugTrace = (trace: AiDebugTrace): AiDebugTrace => {
  trace.endedAt = Date.now();
  return snapshotTrace(trace);
};

export const snapshotTrace = (trace: AiDebugTrace): AiDebugTrace => ({
  startedAt: trace.startedAt,
  endedAt: trace.endedAt,
  steps: [...trace.steps],
});

export const formatDebugMs = (ms: number) =>
  ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(2)}s`;

export const formatDebugBytes = (value: unknown) => {
  const size = JSON.stringify(value)?.length ?? 0;
  return size >= 1024 ? `${(size / 1024).toFixed(1)} KB` : `${size} B`;
};

export const formatDebugUsage = (usage?: GeminiUsage) => {
  if (!usage) return '';
  const parts: string[] = [];
  if (usage.promptTokenCount) parts.push(`${usage.promptTokenCount.toLocaleString()} in`);
  if (usage.candidatesTokenCount) parts.push(`${usage.candidatesTokenCount.toLocaleString()} out`);
  if (usage.thoughtsTokenCount) parts.push(`${usage.thoughtsTokenCount.toLocaleString()} think`);
  if (usage.cachedContentTokenCount) {
    parts.push(`${usage.cachedContentTokenCount.toLocaleString()} cached`);
  }
  if (usage.totalTokenCount) parts.push(`${usage.totalTokenCount.toLocaleString()} total`);
  return parts.join(' · ');
};

const compactSignature = (value?: string) =>
  value ? `${value.length} chars` : undefined;

export const snapshotParts = (parts: GeminiPart[]) =>
  parts.map((part) => {
    if (!part.thoughtSignature) return part;
    const { thoughtSignature, ...rest } = part;
    return { ...rest, thoughtSignature: compactSignature(thoughtSignature) };
  });

export const snapshotRequest = (model: string, url: string, request: GeminiRequest) => ({
  method: 'POST',
  url,
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': '(hidden)',
  },
  model,
  generationConfig: request.generationConfig,
  toolConfig: request.toolConfig,
  tools: request.tools?.[0]?.functionDeclarations?.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  })),
  systemInstruction: request.systemInstruction?.parts?.map((part) => part.text).join('\n') || '',
  contents: request.contents.map(({ model: _model, ...content }) => ({
    ...content,
    parts: snapshotParts(content.parts),
  })),
});

export const snapshotResponse = (result: GeminiResult, chunkCount: number) => ({
  model: result.model,
  finishReason: result.finishReason,
  sseChunks: chunkCount,
  usage: result.usage,
  text: result.text,
  thoughts: result.parts
    .filter((part) => part.thought && part.text)
    .map((part) => part.text),
  functionCalls: result.functionCalls,
  parts: snapshotParts(result.parts),
});
