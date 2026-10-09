import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ArrowUp, Check, Copy, KeyRound, RefreshCw, RotateCcw, Sparkles, Square } from 'lucide-react';
import AiMarkdown from '../../components/ai/AiMarkdown';
import { PageLoader } from '../../components/ui/LoadingSpinner';
import { useDataFetcher } from '../../hooks/useDataFetcher';
import { useAiApiKey } from '../../ai/hooks/useAiApiKey';
import { useAiChat } from '../../ai/hooks/useAiChat';
import { ChatMessage } from '../../ai/chatSession';
import { fallbackModelLabel } from '../../ai/config';

const SUGGESTED_PROMPTS = [
  'Cum arată luna curentă față de media mea?',
  'Unde pot economisi 2000 luna viitoare?',
  'Care sunt abonamentele mele și cât mă costă pe an?',
  'Care a fost cea mai scumpă lună și de ce?',
  'Cât am cheltuit pe mâncare anul acesta vs anul trecut?',
  'Ce rată de economisire am avut în fiecare an?',
];

const formatTokens = (tokens: number) =>
  tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : `${tokens}`;

const useOnline = () => {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
};

const AssistantMessage: React.FC<{ message: ChatMessage; onRetry?: () => void }> = ({
  message,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(message.text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={`ai-message ai-message--assistant ai-message--${message.status}`}>
      <div className="ai-message__avatar" aria-hidden>
        <Sparkles size={16} />
      </div>
      <div className="ai-message__body">
        {message.activity && !message.text && (
          <div className="ai-message__activity">
            <span className="ai-shimmer">{message.activity}…</span>
          </div>
        )}
        {message.text && <AiMarkdown text={message.text} />}
        {message.status !== 'streaming' && message.text && (
          <div className="ai-message__footer">
            <button type="button" onClick={copy} aria-label="Copy answer">
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            {onRetry && (
              <button type="button" className="ai-message__retry" onClick={onRetry}>
                <RefreshCw size={14} />
                Retry
              </button>
            )}
            {message.status === 'stopped' && <span>Stopped</span>}
            {!!message.tokens && <span>{formatTokens(message.tokens)} tokens</span>}
            {fallbackModelLabel(message.model) && <span>via {fallbackModelLabel(message.model)}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

const Chat: React.FC<{ apiKey: string; dataLoading: boolean }> = ({ apiKey, dataLoading }) => {
  const { messages, busy, send, retry, stop, reset, hasData, summaryTokens } = useAiChat(apiKey);
  const [input, setInput] = useState('');
  const online = useOnline();
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const pendingPrompt = (location.state as { prompt?: string } | null)?.prompt;
  const sentPromptRef = useRef<string | null>(null);

  // Follow-up questions from insight cards arrive as router state and are sent once.
  useEffect(() => {
    if (!pendingPrompt || !hasData || !online || busy || sentPromptRef.current === pendingPrompt) return;
    sentPromptRef.current = pendingPrompt;
    navigate(location.pathname, { replace: true, state: null });
    send(pendingPrompt);
  }, [pendingPrompt, hasData, online, busy, navigate, location.pathname, send]);

  const lastText = messages[messages.length - 1]?.text;
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, lastText]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }, [input]);

  const canSend = online && hasData && !busy && input.trim().length > 0;

  const submit = (text = input) => {
    if (!online || !hasData || busy || !text.trim()) return;
    send(text);
    setInput('');
  };

  const placeholder = !online
    ? 'Offline: the assistant needs a connection'
    : !hasData
      ? 'Loading your data…'
      : 'Ask about your money…';

  return (
    <div className="ai-chat">
      {messages.length === 0 ? (
        <div className="ai-chat__empty">
          <div className="ai-chat__empty-icon">
            <Sparkles size={28} />
          </div>
          <p>
            Ask anything about your expenses and income. Numbers are calculated on
            your device from your data.
          </p>
          <div className="ai-chips">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="ai-chip"
                disabled={!online || !hasData || dataLoading}
                onClick={() => submit(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
          {hasData && (
            <span className="ai-chat__meta">Data overview: ~{formatTokens(summaryTokens)} tokens per request</span>
          )}
        </div>
      ) : (
        <div className="ai-chat__messages">
          {messages.map((message, index) =>
            message.role === 'user' ? (
              <div key={message.id} className="ai-message ai-message--user">
                <div className="ai-message__body">{message.text}</div>
              </div>
            ) : (
              <AssistantMessage
                key={message.id}
                message={message}
                onRetry={
                  index === messages.length - 1 && message.status === 'error' && online && !busy
                    ? () => retry(message.id)
                    : undefined
                }
              />
            )
          )}
          <div ref={endRef} />
        </div>
      )}

      <div className="ai-composer-dock">
      <form
        className="ai-composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        {messages.length > 0 && (
          <button type="button" className="ai-composer__new" onClick={reset} aria-label="New chat" title="New chat">
            <RotateCcw size={18} />
          </button>
        )}
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          placeholder={placeholder}
          disabled={!online || !hasData}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          aria-label="Message"
        />
        {busy ? (
          <button type="button" className="ai-composer__send" onClick={stop} aria-label="Stop">
            <Square size={16} />
          </button>
        ) : (
          <button type="submit" className="ai-composer__send" disabled={!canSend} aria-label="Send">
            <ArrowUp size={18} />
          </button>
        )}
      </form>
      <p className="ai-disclaimer">AI can make mistakes. Check important numbers.</p>
      </div>
    </div>
  );
};

const Assistant = () => {
  const { loading } = useDataFetcher();
  const { apiKey, status } = useAiApiKey();

  return (
    <div className="assistant-page">
      <h2 className="page-title">Assistant</h2>
      {status === 'loading' && <PageLoader />}
      {status === 'missing' && (
        <div className="ai-setup">
          <div className="ai-chat__empty-icon">
            <KeyRound size={26} />
          </div>
          <p>
            Add your Gemini API key in your profile to use the assistant. You can create a
            free key in Google AI Studio.
          </p>
          <NavLink to="/expenses/user" className="button ai-setup__button">
            Open profile
          </NavLink>
        </div>
      )}
      {status === 'ready' && <Chat apiKey={apiKey} dataLoading={loading} />}
    </div>
  );
};

export default Assistant;
