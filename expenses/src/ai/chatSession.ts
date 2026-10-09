import type { GeminiContent } from './client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  status: 'streaming' | 'done' | 'error' | 'stopped';
  activity?: string;
  tokens?: number;
  model?: string;
}

/**
 * In-memory conversation for the current session, so leaving the Assistant
 * page and coming back keeps the chat. Cleared on logout and on reload.
 */
export const chatSession: { messages: ChatMessage[]; history: GeminiContent[] } = {
  messages: [],
  history: [],
};

export const clearChatSession = () => {
  chatSession.messages = [];
  chatSession.history = [];
};
