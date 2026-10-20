import React, { useEffect, useState } from 'react';
import { LockOpen } from 'lucide-react';
import Modal from '../ui/Modal';
import { ButtonSpinner } from '../ui/LoadingSpinner';
import PreflightList from './PreflightList';
import { useAuthState } from '../../context';
import { AuthState } from '../../types/types';
import { syncPendingOperations } from '../../utils/syncService';
import { PreflightCheck, runPreflight, startTransition } from '../../crypto/migration';
import { authorizeDrive, deleteKeyFromDrive, preloadGoogleIdentity } from '../../crypto/driveVault';

type Step = 'checks' | 'confirm';

const CONFIRM_WORD = 'UNLOCK';

const UnlockWizard = ({ onClose }: { onClose: () => void }) => {
  const { token } = useAuthState() as AuthState;
  const [step, setStep] = useState<Step>('checks');
  const [checks, setChecks] = useState<PreflightCheck[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [deleteFromDrive, setDeleteFromDrive] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const runChecks = async () => {
    setChecking(true);
    setChecks(await runPreflight(() => syncPendingOperations(token)));
    setChecking(false);
  };

  useEffect(() => {
    runChecks();
    preloadGoogleIdentity().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = async () => {
    setStarting(true);
    setError('');
    if (deleteFromDrive) {
      // Ask for Drive access now, inside the click; the deletion runs after the unlock finishes.
      try {
        await authorizeDrive();
      } catch (err) {
        setError(`${(err as Error).message} Untick the Drive option to unlock without it.`);
        setStarting(false);
        return;
      }
    }
    startTransition('unlock', deleteFromDrive ? { afterDone: deleteKeyFromDrive } : {});
    onClose();
  };

  const checksOk = !!checks && checks.every((check) => check.ok);

  return (
    <Modal show onClose={() => onClose()}>
      <div className="privacy-wizard">
        <h3 className="privacy-wizard__title">
          <LockOpen size={18} /> Unlock my data
        </h3>
        <ol className="privacy-wizard__steps">
          {['Check', 'Confirm'].map((label, index) => {
            const current = step === 'checks' ? 0 : 1;
            return (
              <li key={label} className={index < current ? 'is-done' : index === current ? 'is-active' : ''}>
                {label}
              </li>
            );
          })}
        </ol>

        {step === 'checks' && (
          <>
            <p>Before we start, let&apos;s make sure nothing gets lost on the way.</p>
            <PreflightList checks={checks} checking={checking} onRetry={runChecks} />
            <div className="privacy-wizard__actions">
              <button type="button" className="button" disabled={!checksOk} onClick={() => setStep('confirm')}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 'confirm' && (
          <>
            <ul className="privacy-wizard__facts">
              <li>
                <strong>Your data becomes readable by the server admin again.</strong>
              </li>
              <li>Your items are decrypted and saved back in plain form, then the encrypted copies are removed.</li>
              <li>Editing is paused until it&apos;s done. You can close the app; it continues where it left off.</li>
              <li>The key is removed from this device at the end.</li>
            </ul>
            <label className="privacy-check">
              <input
                type="checkbox"
                checked={deleteFromDrive}
                onChange={(e) => setDeleteFromDrive(e.target.checked)}
              />
              <span>Also delete the key from Google Drive when it&apos;s done</span>
            </label>
            <label className="privacy-confirm">
              <span>
                Type <strong>{CONFIRM_WORD}</strong> to start
              </span>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoCapitalize="characters"
                autoComplete="off"
              />
            </label>
            {error && <p className="privacy-error" role="alert">{error}</p>}
            <div className="privacy-wizard__actions">
              <button type="button" className="privacy-link" onClick={() => setStep('checks')}>
                Back
              </button>
              <button
                type="button"
                className="button"
                disabled={confirmText.trim().toUpperCase() !== CONFIRM_WORD || starting}
                onClick={handleStart}
              >
                {starting ? <ButtonSpinner /> : 'Start unlocking'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default UnlockWizard;
