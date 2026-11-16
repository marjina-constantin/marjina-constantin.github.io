import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Copy } from 'lucide-react';
import {
  AiDebugKind,
  AiDebugStep,
  AiDebugTrace,
  formatDebugMs,
} from '../../ai/debug';

const kindLabel: Record<AiDebugKind, string> = {
  info: 'Info',
  request: 'Request',
  response: 'Response',
  tool: 'Tool',
  warn: 'Warning',
  error: 'Error',
};

const formatClock = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const JsonNode: React.FC<{ name?: string; value: unknown; depth?: number }> = ({
  name,
  value,
  depth = 0,
}) => {
  if (value === null || value === undefined) {
    return (
      <div className="ai-json__row">
        {name ? <span className="ai-json__key">{name}: </span> : null}
        <span className="ai-json__null">null</span>
      </div>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <div className="ai-json__row">
        {name ? <span className="ai-json__key">{name}: </span> : null}
        <span className="ai-json__bool">{String(value)}</span>
      </div>
    );
  }

  if (typeof value === 'number') {
    return (
      <div className="ai-json__row">
        {name ? <span className="ai-json__key">{name}: </span> : null}
        <span className="ai-json__number">{value}</span>
      </div>
    );
  }

  if (typeof value === 'string') {
    const multiline = value.includes('\n') || value.length > 160;
    if (multiline) {
      return (
        <details className="ai-json__block" open={depth < 1 && value.length < 400}>
          <summary>
            {name ? <span className="ai-json__key">{name}</span> : <span>string</span>}
            <span className="ai-json__meta">{value.length.toLocaleString()} chars</span>
          </summary>
          <pre className="ai-json__string ai-json__pre">{value}</pre>
        </details>
      );
    }
    return (
      <div className="ai-json__row">
        {name ? <span className="ai-json__key">{name}: </span> : null}
        <span className="ai-json__string">"{value}"</span>
      </div>
    );
  }

  if (Array.isArray(value) || isPlainObject(value)) {
    const entries = Array.isArray(value)
      ? value.map((item, index) => [String(index), item] as const)
      : Object.entries(value);
    const empty = entries.length === 0;
    const label = Array.isArray(value) ? `[${value.length}]` : `{${entries.length}}`;
    if (empty) {
      return (
        <div className="ai-json__row">
          {name ? <span className="ai-json__key">{name}: </span> : null}
          <span className="ai-json__null">{Array.isArray(value) ? '[]' : '{}'}</span>
        </div>
      );
    }
    const children = entries.map(([key, item]) => (
      <JsonNode key={key} name={key} value={item} depth={depth + 1} />
    ));
    if (!name && depth === 0) {
      return <div className="ai-json__children ai-json__children--root">{children}</div>;
    }
    return (
      <details className="ai-json__block" open={depth < 1}>
        <summary>
          <span className="ai-json__key">{name}</span>
          <span className="ai-json__meta">{label}</span>
        </summary>
        <div className="ai-json__children">{children}</div>
      </details>
    );
  }

  return (
    <div className="ai-json__row">
      {name ? <span className="ai-json__key">{name}: </span> : null}
      <span>{String(value)}</span>
    </div>
  );
};

const DebugStep: React.FC<{ step: AiDebugStep; index: number }> = ({ step, index }) => {
  const [copied, setCopied] = useState(false);
  const hasData = step.data !== undefined;

  const copy = () => {
    navigator.clipboard
      ?.writeText(JSON.stringify({ ...step, data: step.data }, null, 2))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
  };

  return (
    <li className={`ai-debug__step ai-debug__step--${step.kind}`}>
      <span className="ai-debug__dot" aria-hidden>
        {index + 1}
      </span>
      <div className="ai-debug__card">
        <div className="ai-debug__card-head">
          <div className="ai-debug__card-titles">
            <span className="ai-debug__kind">{kindLabel[step.kind]}</span>
            <strong>{step.title}</strong>
            {step.subtitle ? <span className="ai-debug__subtitle">{step.subtitle}</span> : null}
          </div>
          <div className="ai-debug__card-meta">
            {step.durationMs !== undefined ? (
              <span>{formatDebugMs(step.durationMs)}</span>
            ) : null}
            <span>{formatClock(step.at)}</span>
            {hasData && (
              <button type="button" onClick={copy} aria-label="Copy step">
                {copied ? <Check size={13} /> : <Copy size={13} />}
              </button>
            )}
          </div>
        </div>
        {step.summary ? <p className="ai-debug__human">{step.summary}</p> : null}
        {hasData && (
          <details className="ai-debug__payload">
            <summary>Payload</summary>
            <div className="ai-json">
              <JsonNode value={step.data} />
            </div>
          </details>
        )}
      </div>
    </li>
  );
};

const AiDebugPanel: React.FC<{ trace: AiDebugTrace }> = ({ trace }) => {
  const [copied, setCopied] = useState(false);
  const totalMs = (trace.endedAt || Date.now()) - trace.startedAt;
  const counts = useMemo(() => {
    const result = { request: 0, tool: 0, error: 0 };
    for (const step of trace.steps) {
      if (step.kind === 'request') result.request += 1;
      if (step.kind === 'tool') result.tool += 1;
      if (step.kind === 'error') result.error += 1;
    }
    return result;
  }, [trace.steps]);

  const copy = () => {
    navigator.clipboard?.writeText(JSON.stringify(trace, null, 2)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const summary = [
    `${trace.steps.length} step${trace.steps.length === 1 ? '' : 's'}`,
    counts.request ? `${counts.request} request${counts.request === 1 ? '' : 's'}` : '',
    counts.tool ? `${counts.tool} tool${counts.tool === 1 ? '' : 's'}` : '',
    formatDebugMs(totalMs),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <details className="ai-debug" open>
      <summary className="ai-debug__header">
        <ChevronDown size={16} className="ai-debug__chevron" aria-hidden />
        <span className="ai-debug__badge">Debug</span>
        <span className="ai-debug__header-summary">{summary}</span>
        <button
          type="button"
          className="ai-debug__copy"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            copy();
          }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy all'}
        </button>
      </summary>
      <ol className="ai-debug__timeline">
        {trace.steps.map((step, index) => (
          <DebugStep key={step.id} step={step} index={index} />
        ))}
      </ol>
    </details>
  );
};

export default AiDebugPanel;
