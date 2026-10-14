import type { GeminiContent } from './client';
import { AI_LIMITS, AI_STORAGE_KEYS } from './config';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  status: 'streaming' | 'done' | 'error' | 'stopped';
  activity?: string;
  tokens?: number;
  model?: string;
  /** Model that failed this turn, used to offer retry with the next one. */
  failedModel?: string;
}

/** Messages kept on the device; older ones are dropped. */
const MAX_STORED_MESSAGES = 60;

/** An answer that was streaming when the chat closed can't be resumed; it becomes retryable. */
export const markInterrupted = (messages: ChatMessage[]): ChatMessage[] =>
  messages.map((m) =>
    m.status === 'streaming'
      ? {
          ...m,
          status: 'error',
          activity: undefined,
          text: m.text || 'Interrupted before the answer finished.',
        }
      : m
  );

const load = (): { messages: ChatMessage[]; history: GeminiContent[] } => {
  try {
    const stored = JSON.parse(
      localStorage.getItem(AI_STORAGE_KEYS.chat) || 'null'
    );
    if (!Array.isArray(stored?.messages) || !Array.isArray(stored?.history))
      throw new Error();
    return {
      messages: markInterrupted(stored.messages),
      history: stored.history,
    };
  } catch {
    return { messages: [], history: [] };
  }
};

/**
 * The conversation, kept in memory and in localStorage so it survives
 * navigation and reloads. Cleared on logout and on "New chat".
 */
export const chatSession: {
  messages: ChatMessage[];
  history: GeminiContent[];
} = load();

export const saveChatSession = () => {
  const data = {
    messages: chatSession.messages.slice(-MAX_STORED_MESSAGES),
    history: chatSession.history.slice(-AI_LIMITS.maxHistoryTurns * 2),
  };
  try {
    localStorage.setItem(AI_STORAGE_KEYS.chat, JSON.stringify(data));
  } catch {
    // Storage full: keep the chat in memory only.
  }
};

// Saves the in-progress question too when the page is reloaded or closed mid-answer.
window.addEventListener('pagehide', saveChatSession);

export const clearChatSession = () => {
  chatSession.messages = [];
  chatSession.history = [];
  localStorage.removeItem(AI_STORAGE_KEYS.chat);
};
