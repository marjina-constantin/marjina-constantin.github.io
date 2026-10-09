import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronUp,
  CircleAlert,
  CircleCheck,
  Info,
  Lightbulb,
  LucideIcon,
  RefreshCw,
  Sparkles,
  TriangleAlert,
} from 'lucide-react';
import { fallbackModelLabel } from '../../ai/config';
import { useAiApiKey } from '../../ai/hooks/useAiApiKey';
import { useAiInsight } from '../../ai/hooks/useAiInsight';
import { InsightFeatureId } from '../../ai/insights/features';
import { InsightTone } from '../../ai/storage';

const TONE_ICONS: Record<InsightTone, LucideIcon> = {
  positive: CircleCheck,
  negative: CircleAlert,
  warning: TriangleAlert,
  tip: Lightbulb,
  neutral: Info,
};

const timeAgo = (at: number) => {
  const minutes = Math.round((Date.now() - at) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return new Date(at).toLocaleDateString();
};

interface AiInsightProps {
  feature: InsightFeatureId;
  /** Feature-specific scope, e.g. the month (YYYY-MM) for the month summary. */
  param?: string;
}

const AiInsight: React.FC<AiInsightProps> = ({ feature, param }) => {
  const navigate = useNavigate();
  const { apiKey, status: keyStatus } = useAiApiKey();
  const { entry, stale, status, error, generate, label } = useAiInsight(apiKey, feature, param);
  const [collapsed, setCollapsed] = useState(false);

  const handleOpen = () => {
    if (keyStatus === 'missing') {
      navigate('/expenses/user');
      return;
    }
    setCollapsed(false);
    if (!entry) generate();
  };

  const askFollowUp = (prompt: string) => navigate('/expenses/assistant', { state: { prompt } });

  if (status === 'loading') {
    return (
      <div className="ai-insight ai-insight--loading" aria-busy="true">
        <div className="ai-insight__header">
          <Sparkles size={16} />
          <span className="ai-shimmer">Analyzing…</span>
        </div>
        <div className="ai-insight__skeleton" />
        <div className="ai-insight__skeleton" />
        <div className="ai-insight__skeleton ai-insight__skeleton--short" />
      </div>
    );
  }

  if (!entry || collapsed) {
    return (
      <div className="ai-insight-trigger">
        <button
          type="button"
          className="ai-pill"
          onClick={handleOpen}
          disabled={keyStatus === 'loading'}
          title={keyStatus === 'missing' ? 'Add a Gemini API key in your profile' : undefined}
        >
          <Sparkles size={14} />
          {label}
        </button>
        {status === 'error' && (
          <span className="ai-insight-trigger__error" role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }

  const { insight } = entry;
  return (
    <div className="ai-insight">
      <div className="ai-insight__header">
        <Sparkles size={16} />
        <h4>{insight.headline}</h4>
        <button type="button" onClick={() => setCollapsed(true)} aria-label="Hide insight">
          <ChevronUp size={16} />
        </button>
      </div>

      <ul className="ai-insight__bullets">
        {insight.bullets.map((bullet, index) => {
          const Icon = TONE_ICONS[bullet.tone];
          return (
            <li key={index} className={`ai-insight__bullet ai-insight__bullet--${bullet.tone}`}>
              <Icon size={15} />
              <span>{bullet.text}</span>
            </li>
          );
        })}
      </ul>

      {insight.suggestions.length > 0 && (
        <div className="ai-insight__suggestions">
          <span className="ai-insight__label">Suggestions</span>
          <ul>
            {insight.suggestions.map((suggestion, index) => (
              <li key={index}>{suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {insight.followUps.length > 0 && (
        <div className="ai-chips ai-insight__followups">
          {insight.followUps.map((question) => (
            <button key={question} type="button" className="ai-chip" onClick={() => askFollowUp(question)}>
              {question}
            </button>
          ))}
        </div>
      )}

      <div className="ai-insight__footer">
        <span className={stale ? 'ai-insight__stale' : undefined}>
          {stale ? 'Data changed since this summary' : timeAgo(entry.at)}
          {entry.tokens > 0 && ` · ${(entry.tokens / 1000).toFixed(1)}k tokens`}
          {fallbackModelLabel(entry.model) && ` · via ${fallbackModelLabel(entry.model)}`}
        </span>
        <button type="button" onClick={generate} aria-label="Regenerate insight">
          <RefreshCw size={13} />
          Refresh
        </button>
      </div>
      {status === 'error' && (
        <p className="ai-insight-trigger__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

export default AiInsight;
