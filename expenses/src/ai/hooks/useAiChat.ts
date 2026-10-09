import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthState, useData } from '../../context';
import { AuthState } from '../../types/types';
import { AiError, GeminiContent, GeminiRequest, describeAiError, streamGenerate } from '../client';
import { AI_LIMITS } from '../config';
import { ChatMessage, chatSession, clearChatSession } from '../chatSession';
import { buildDataSummary } from '../context/summary';
import { getAiItems } from '../data';
import { buildChatSystemInstruction } from '../prompts';
import { getShareDescriptions, recordAiUsage } from '../storage';
import { toolDeclarations } from '../tools/definitions';
import { TOOL_LABELS, executeTool } from '../tools/executors';

const newId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/** Keeps the last N user+model pairs. Past turns are already text-only. */
const trimHistory = (history: GeminiContent[]) =>
  history.slice(-AI_LIMITS.maxHistoryTurns * 2);

export function useAiChat(apiKey: string) {
  const { data } = useData();
  const { currency } = useAuthState() as AuthState;
  const [messages, setMessages] = useState<ChatMessage[]>(chatSession.messages);
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const shareDescriptions = getShareDescriptions();
  const items = useMemo(() => getAiItems(data.raw || []), [data.raw]);
  const summary = useMemo(
    () => buildDataSummary(items, currency, shareDescriptions),
    [items, currency, shareDescriptions]
  );

  useEffect(() => {
    chatSession.messages = messages;
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const patchMessage = useCallback((id: string, patch: Partial<ChatMessage>) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }, []);

  const send = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed || busy || !apiKey) return;

      const assistantId = newId();
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'user', text: trimmed, status: 'done' },
        { id: assistantId, role: 'assistant', text: '', status: 'streaming', activity: 'Thinking' },
      ]);
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;
      const userTurn: GeminiContent = { role: 'user', parts: [{ text: trimmed }] };
      const contents: GeminiContent[] = [...trimHistory(chatSession.history), userTurn];
      const systemInstruction = { parts: [{ text: buildChatSystemInstruction(summary) }] };
      const toolContext = { items, shareDescriptions };

      let previousText = '';
      let tokens = 0;
      let model: string | undefined;

      try {
        for (let round = 0; round <= AI_LIMITS.maxToolRounds; round++) {
          const forceAnswer = round === AI_LIMITS.maxToolRounds;
          const request: GeminiRequest = {
            systemInstruction,
            contents,
            tools: [{ functionDeclarations: toolDeclarations }],
            ...(forceAnswer && { toolConfig: { functionCallingConfig: { mode: 'NONE' } } }),
            generationConfig: {
              maxOutputTokens: AI_LIMITS.chatMaxOutputTokens,
              thinkingConfig: { thinkingLevel: 'low' },
            },
          };

          const result = await streamGenerate({
            apiKey,
            tier: 'chat',
            request,
            signal: controller.signal,
            onText: (text) =>
              patchMessage(assistantId, {
                text: previousText ? `${previousText}\n\n${text}` : text,
                activity: undefined,
              }),
          });

          const stepTokens = result.usage.totalTokenCount || 0;
          tokens += stepTokens;
          recordAiUsage(stepTokens);
          contents.push({ role: 'model', parts: result.parts, model: result.model });
          model = result.model;
          if (result.text) {
            previousText = previousText ? `${previousText}\n\n${result.text}` : result.text;
          }

          if (!result.functionCalls.length || forceAnswer) break;

          patchMessage(assistantId, {
            activity: TOOL_LABELS[result.functionCalls[0].name] || 'Working',
          });
          contents.push({
            role: 'user',
            parts: result.functionCalls.map((call) => ({
              functionResponse: {
                ...(call.id && { id: call.id }),
                name: call.name,
                response: executeTool(call.name, call.args, toolContext),
              },
            })),
          });
        }

        if (!previousText) {
          throw new AiError('unknown', 'Empty response');
        }

        chatSession.history = [
          ...chatSession.history,
          userTurn,
          { role: 'model', parts: [{ text: previousText }] },
        ];
        patchMessage(assistantId, { text: previousText, status: 'done', activity: undefined, tokens, model });
      } catch (error) {
        const stopped = controller.signal.aborted;
        const errorText = describeAiError(error);
        patchMessage(assistantId, {
          text: stopped || !previousText ? previousText || errorText : `${previousText}\n\n_${errorText}_`,
          status: stopped ? 'stopped' : 'error',
          activity: undefined,
          tokens: tokens || undefined,
        });
      } finally {
        abortRef.current = null;
        setBusy(false);
      }
    },
    [apiKey, busy, items, patchMessage, shareDescriptions, summary]
  );

  /** Re-asks the question behind a failed answer, replacing both messages. */
  const retry = useCallback(
    (assistantId: string) => {
      if (busy) return;
      const index = messages.findIndex((m) => m.id === assistantId);
      const question = messages[index - 1];
      if (index < 1 || question?.role !== 'user') return;
      setMessages((prev) => prev.filter((m) => m.id !== assistantId && m.id !== question.id));
      send(question.text);
    },
    [busy, messages, send]
  );

  const stop = useCallback(() => abortRef.current?.abort(), []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    clearChatSession();
    setMessages([]);
  }, []);

  return {
    messages,
    busy,
    send,
    retry,
    stop,
    reset,
    hasData: items.length > 0,
    summaryTokens: Math.round(summary.length / 4),
  };
}
