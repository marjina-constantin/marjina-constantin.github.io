import React from 'react';
import { Check, X } from 'lucide-react';
import { PreflightCheck } from '../../crypto/migration';
import { ButtonSpinner } from '../ui/LoadingSpinner';

interface PreflightListProps {
  checks: PreflightCheck[] | null;
  checking: boolean;
  onRetry: () => void;
}

const PreflightList = ({ checks, checking, onRetry }: PreflightListProps) => {
  if (!checks || checking) {
    return (
      <div className="privacy-checks privacy-checks--loading">
        <ButtonSpinner />
        <span>Checking your account…</span>
      </div>
    );
  }
  const allOk = checks.every((check) => check.ok);
  return (
    <div className="privacy-checks">
      <ul>
        {checks.map((check) => (
          <li key={check.id} className={check.ok ? 'is-ok' : 'is-bad'}>
            <span className="privacy-checks__icon">{check.ok ? <Check size={14} /> : <X size={14} />}</span>
            <span>
              {check.label}
              {!check.ok && check.hint && <small>{check.hint}</small>}
            </span>
          </li>
        ))}
      </ul>
      {!allOk && (
        <button type="button" className="button-secondary" onClick={onRetry}>
          Check again
        </button>
      )}
    </div>
  );
};

export default PreflightList;
