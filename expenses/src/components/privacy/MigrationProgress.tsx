import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Lock, LockOpen, Minimize2, Pause, Play, X } from 'lucide-react';
import { useAuthDispatch, useAuthState, useData } from '../../context';
import { AuthState } from '../../types/types';
import { fetchData } from '../../utils/utils';
import { isTransitional, useEncryptionState } from '../../crypto/encryptionState';
import {
  cancelLock,
  Direction,
  dismissTransition,
  requestPause,
  resumeTransition,
  TransitionProgress,
  useTransitionProgress,
} from '../../crypto/migration';

const STEP_LABELS: Record<Direction, string[]> = {
  lock: ['Encrypt', 'Verify', 'Clean up'],
  unlock: ['Decrypt', 'Verify', 'Clean up'],
};

const PHASE_VERB: Record<Direction, Record<string, string>> = {
  lock: { transform: 'Encrypting', verify: 'Verifying', cleanup: 'Cleaning up' },
  unlock: { transform: 'Decrypting', verify: 'Verifying', cleanup: 'Cleaning up' },
};

const formatEta = (ms: number | null) => {
  if (ms === null) return '';
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'less than a minute left';
  return `about ${minutes} min left`;
};

const titleFor = (progress: TransitionProgress, direction: Direction) => {
  const locking = direction === 'lock';
  switch (progress.state) {
    case 'done':
      return locking ? 'Your data is locked' : 'Your data is unlocked';
    case 'paused':
      return locking ? 'Locking paused' : 'Unlocking paused';
    case 'failed':
      return locking ? 'Locking needs attention' : 'Unlocking needs attention';
    default:
      return locking ? 'Locking your data' : 'Unlocking your data';
  }
};

const phaseLine = (progress: TransitionProgress, direction: Direction) => {
  if (progress.state === 'done') return 'All done';
  if (progress.phase === 'prepare') return 'Getting ready…';
  if (progress.phase === 'finalize') return 'Finishing…';
  const verb = PHASE_VERB[direction][progress.phase];
  const count = `${progress.phaseDone.toLocaleString()} of ${progress.phaseTotal.toLocaleString()}`;
  const eta = progress.state === 'running' ? formatEta(progress.etaMs) : '';
  return [`${verb} ${count}`, eta].filter(Boolean).join(' · ');
};

const ProgressRing = ({ percent }: { percent: number }) => {
  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg className="migration-ring" width="22" height="22" viewBox="0 0 22 22" aria-hidden>
      <circle className="migration-ring__track" cx="11" cy="11" r={radius} />
      <circle
        className="migration-ring__fill"
        cx="11"
        cy="11"
        r={radius}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - percent / 100)}
      />
    </svg>
  );
};

const MigrationProgress = () => {
  const progress = useTransitionProgress();
  const { status, hasKey, corruptCount } = useEncryptionState();
  const { userIsLoggedIn, token } = useAuthState() as AuthState;
  const dispatch = useAuthDispatch();
  const { data, dataDispatch } = useData();
  const [minimized, setMinimized] = useState(false);
  const [hideCorrupt, setHideCorrupt] = useState(false);

  useEffect(() => {
    if (progress.state === 'running') {
      setMinimized(false);
    }
    if (progress.state === 'done') {
      fetchData(token, dataDispatch, dispatch, data.category, data.textFilter);
      const timer = window.setTimeout(dismissTransition, 3500);
      return () => window.clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress.state]);

  if (!userIsLoggedIn) {
    return null;
  }

  const direction: Direction = progress.direction ?? (status === 'unlocking' ? 'unlock' : 'lock');
  const locking = direction === 'lock';
  const percent = Math.floor(progress.percent);
  const Icon = locking ? Lock : LockOpen;

  if (progress.state === 'idle') {
    if (isTransitional(status) && hasKey) {
      return (
        <div className="migration-bar" role="status">
          <Icon size={16} />
          <span>{locking ? 'Locking is paused.' : 'Unlocking is paused.'}</span>
          <button type="button" onClick={() => resumeTransition()}>
            Continue
          </button>
          {locking && (
            <button type="button" className="migration-bar__secondary" onClick={() => cancelLock()}>
              Cancel
            </button>
          )}
        </div>
      );
    }
    if (corruptCount > 0 && !hideCorrupt) {
      return (
        <div className="migration-bar migration-bar--warning" role="status">
          <AlertTriangle size={16} />
          <span>
            {corruptCount} item{corruptCount === 1 ? '' : 's'} couldn&apos;t be decrypted. They were
            kept as they were.
          </span>
          <button type="button" className="migration-bar__icon" onClick={() => setHideCorrupt(true)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      );
    }
    return null;
  }

  const stopped = progress.state === 'paused' || progress.state === 'failed';

  if (minimized && progress.state === 'running') {
    return (
      <button
        type="button"
        className="migration-pill"
        onClick={() => setMinimized(false)}
        aria-label={`${titleFor(progress, direction)}, ${percent}%`}
      >
        <ProgressRing percent={progress.percent} />
        <Icon size={14} />
        <span>{percent}%</span>
      </button>
    );
  }

  if (minimized && stopped) {
    return (
      <div className="migration-bar" role="status">
        <Icon size={16} />
        <span>
          {titleFor(progress, direction)} at {percent}%
        </span>
        <button type="button" onClick={() => resumeTransition()}>
          Continue
        </button>
        <button type="button" className="migration-bar__secondary" onClick={() => setMinimized(false)}>
          Details
        </button>
      </div>
    );
  }

  const steps = STEP_LABELS[direction];

  return (
    <div
      className={`migration-card migration-card--${progress.state}`}
      role="status"
      aria-live="polite"
    >
      <div className="migration-card__header">
        <span className="migration-card__icon">
          {progress.state === 'done' ? <Check size={18} /> : <Icon size={18} />}
        </span>
        <h3>{titleFor(progress, direction)}</h3>
        {progress.state !== 'done' && (
          <button
            type="button"
            className="migration-card__minimize"
            onClick={() => setMinimized(true)}
            aria-label="Minimize"
          >
            <Minimize2 size={16} />
          </button>
        )}
      </div>

      <ol className="migration-steps">
        {steps.map((label, index) => {
          const state =
            progress.step > index || progress.state === 'done'
              ? 'done'
              : progress.step === index
                ? 'active'
                : 'todo';
          return (
            <li key={label} className={`migration-steps__item is-${state}`}>
              <span className="migration-steps__dot">
                {state === 'done' ? <Check size={12} /> : index + 1}
              </span>
              <span>{label}</span>
            </li>
          );
        })}
      </ol>

      <div className="migration-card__bar" aria-hidden>
        <div className="migration-card__fill" style={{ width: `${progress.percent}%` }} />
      </div>

      <div className="migration-card__numbers">
        <span>{phaseLine(progress, direction)}</span>
        <strong>{percent}%</strong>
      </div>

      {progress.message && (
        <p className={`migration-card__message${stopped ? ' is-warning' : ''}`}>{progress.message}</p>
      )}
      {progress.state === 'running' && (
        <p className="migration-card__hint">You can keep browsing. Editing is paused until it&apos;s done.</p>
      )}

      {progress.failures.length > 0 && (
        <details className="migration-card__failures">
          <summary>
            {progress.failures.length} item{progress.failures.length === 1 ? '' : 's'} skipped
          </summary>
          <ul>
            {progress.failures.slice(0, 50).map((failure) => (
              <li key={failure.id}>
                <span>{failure.dt || `#${failure.id}`}</span>
                {failure.sum && <span>{failure.sum}</span>}
                <em>{failure.reason}</em>
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="migration-card__actions">
        {progress.state === 'running' && (
          <button type="button" className="button-secondary" onClick={requestPause}>
            <Pause size={14} /> Pause
          </button>
        )}
        {stopped && (
          <>
            <button type="button" className="button" onClick={() => resumeTransition()}>
              <Play size={14} /> {progress.failures.length ? 'Retry' : 'Continue'}
            </button>
            {locking && (
              <button type="button" className="button-secondary" onClick={() => cancelLock()}>
                Cancel and unlock
              </button>
            )}
          </>
        )}
        {progress.state === 'done' && (
          <button type="button" className="button-secondary" onClick={dismissTransition}>
            Close
          </button>
        )}
      </div>
    </div>
  );
};

export default MigrationProgress;
