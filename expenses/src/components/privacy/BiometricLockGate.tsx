import React, {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Fingerprint, Lock, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout, useAuthDispatch, useData } from '../../context';
import {
  assertBiometric,
  biometricErrorMessage,
  clearUnlocked,
  clearUnlockOnLogout,
  isBiometricEnabled,
  isUnlocked,
  markHidden,
  shouldRelockAfterIdle,
} from './biometricLock';

interface BiometricLockGateProps {
  userId: string;
  children: ReactNode;
}

const initialLocked = (userId: string) =>
  Boolean(userId) && isBiometricEnabled(userId) && !isUnlocked(userId);

const BiometricLockGate = ({ userId, children }: BiometricLockGateProps) => {
  const navigate = useNavigate();
  const dispatch = useAuthDispatch();
  const { dataDispatch } = useData();
  const [locked, setLocked] = useState(() => initialLocked(userId));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncLockState = useCallback(() => {
    if (!userId || !isBiometricEnabled(userId)) {
      setLocked(false);
      return;
    }
    setLocked(!isUnlocked(userId));
  }, [userId]);

  useEffect(() => {
    syncLockState();
  }, [syncLockState]);

  useEffect(() => {
    if (!locked || !userId) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      setPending(true);
      setError(null);
      try {
        const result = await assertBiometric(userId, controller.signal);
        if (cancelled) {
          return;
        }
        if (result.error) {
          // Auto-prompt failures stay quiet; the user can tap Unlock.
          if (result.error !== 'cancelled') {
            setError(biometricErrorMessage(result.error));
          }
          return;
        }
        setLocked(false);
      } finally {
        if (!cancelled) {
          setPending(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [locked, userId]);

  useEffect(() => {
    function onVisibility() {
      if (!userId || !isBiometricEnabled(userId)) {
        return;
      }
      if (document.visibilityState === 'hidden') {
        markHidden(userId);
        return;
      }
      if (shouldRelockAfterIdle(userId)) {
        clearUnlocked(userId);
        setLocked(true);
        setError(null);
      }
    }

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [userId]);

  const unlockWithBiometric = async () => {
    setPending(true);
    setError(null);
    try {
      const result = await assertBiometric(userId);
      if (result.error) {
        setError(biometricErrorMessage(result.error));
        return;
      }
      setLocked(false);
    } finally {
      setPending(false);
    }
  };

  const unlockWithGoogle = async () => {
    setPending(true);
    setError(null);
    try {
      clearUnlockOnLogout(userId);
      await logout(dispatch, dataDispatch);
      navigate('/expenses/login');
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <div
        className={
          locked ? 'biometric-gate__content is-hidden' : 'biometric-gate__content'
        }
        aria-hidden={locked || undefined}
      >
        {children}
      </div>
      {locked ? (
        <div className="biometric-lock" role="dialog" aria-modal="true" aria-labelledby="biometric-lock-title">
          <div className="biometric-lock__glow" aria-hidden />
          <div className="biometric-lock__panel">
            <span className="biometric-lock__icon">
              <Lock size={22} aria-hidden />
            </span>
            <h2 id="biometric-lock-title">Unlock Expenses</h2>
            <p className="biometric-lock__body">
              Use biometrics on this device, or sign in again with Google.
            </p>
            {error ? (
              <p role="alert" className="biometric-lock__error">
                {error}
              </p>
            ) : null}
            <div className="biometric-lock__actions">
              <button
                type="button"
                className="button w-100"
                disabled={pending}
                onClick={() => {
                  void unlockWithBiometric();
                }}
              >
                <Fingerprint size={16} aria-hidden />
                {pending ? 'Checking…' : 'Unlock'}
              </button>
              <button
                type="button"
                className="button-secondary w-100"
                disabled={pending}
                onClick={() => {
                  void unlockWithGoogle();
                }}
              >
                <LogIn size={16} aria-hidden />
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

export default BiometricLockGate;
