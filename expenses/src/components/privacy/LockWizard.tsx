import React, { useEffect, useState } from 'react';
import { Check, CloudDownload, CloudUpload, Lock } from 'lucide-react';
import Modal from '../ui/Modal';
import { ButtonSpinner } from '../ui/LoadingSpinner';
import KeyBox from './KeyBox';
import PreflightList from './PreflightList';
import { useAuthState } from '../../context';
import { AuthState } from '../../types/types';
import { syncPendingOperations } from '../../utils/syncService';
import { getSession, storeKey } from '../../crypto/encryptionState';
import { generateKey, normalizeKey } from '../../crypto/keyFormat';
import { PreflightCheck, runPreflight, startTransition } from '../../crypto/migration';
import {
  DriveKeyConflictError,
  preloadGoogleIdentity,
  readKeyFromDrive,
  saveKeyToDrive,
} from '../../crypto/driveVault';

type Step = 'checks' | 'key' | 'confirm';
type DriveState = 'idle' | 'busy' | 'saved';

const CONFIRM_WORD = 'LOCK';

const LockWizard = ({ onClose }: { onClose: () => void }) => {
  const { token } = useAuthState() as AuthState;
  const [step, setStep] = useState<Step>('checks');
  const [checks, setChecks] = useState<PreflightCheck[] | null>(null);
  const [checking, setChecking] = useState(false);

  const [keyText, setKeyText] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedConfirmed, setSavedConfirmed] = useState(false);
  const [driveState, setDriveState] = useState<DriveState>('idle');
  const [conflictKey, setConflictKey] = useState('');
  const [usingExisting, setUsingExisting] = useState(false);
  const [pasted, setPasted] = useState('');

  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);

  const uid = getSession()?.uid || '';

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

  const selectKey = (key: string, fromDrive: boolean) => {
    setKeyText(key);
    setCopied(false);
    setSavedConfirmed(false);
    setConflictKey('');
    setDriveState(fromDrive ? 'saved' : 'idle');
    setError('');
  };

  const handleGenerate = async () => selectKey(await generateKey(), false);

  const handleSaveToDrive = async () => {
    setDriveState('busy');
    setError('');
    try {
      await saveKeyToDrive(uid, keyText);
      setDriveState('saved');
    } catch (err) {
      setDriveState('idle');
      if (err instanceof DriveKeyConflictError) {
        setConflictKey(err.existingKey);
      } else {
        setError((err as Error).message);
      }
    }
  };

  const handleLoadFromDrive = async () => {
    setDriveState('busy');
    setError('');
    try {
      const key = await readKeyFromDrive(uid);
      if (key) {
        selectKey(key, true);
      } else {
        setDriveState('idle');
        setError("There's no key in this Google account's Drive.");
      }
    } catch (err) {
      setDriveState('idle');
      setError((err as Error).message);
    }
  };

  const handleUsePasted = async () => {
    setError('');
    try {
      selectKey(await normalizeKey(pasted), false);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      await storeKey(keyText);
    } catch (err) {
      setError((err as Error).message);
      setStarting(false);
      return;
    }
    startTransition('lock');
    onClose();
  };

  const keySaved = driveState === 'saved' || (copied && savedConfirmed);
  const checksOk = !!checks && checks.every((check) => check.ok);

  return (
    <Modal show onClose={() => onClose()}>
      <div className="privacy-wizard">
        <h3 className="privacy-wizard__title">
          <Lock size={18} /> Lock my data
        </h3>
        <ol className="privacy-wizard__steps">
          {['Check', 'Key', 'Confirm'].map((label, index) => {
            const current = ['checks', 'key', 'confirm'].indexOf(step);
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
              <button type="button" className="button" disabled={!checksOk} onClick={() => setStep('key')}>
                Continue
              </button>
            </div>
          </>
        )}

        {step === 'key' && (
          <>
            <p>
              This key encrypts your data on this device. Nobody else has it, not even the server admin.{' '}
              <strong>If you lose it, your data can&apos;t be recovered.</strong>
            </p>

            {!keyText && !usingExisting && (
              <div className="privacy-wizard__choices">
                <button type="button" className="button" onClick={handleGenerate}>
                  Generate my key
                </button>
                <button type="button" className="privacy-link" onClick={() => setUsingExisting(true)}>
                  I already have a key
                </button>
              </div>
            )}

            {!keyText && usingExisting && (
              <div className="privacy-wizard__existing">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleLoadFromDrive}
                  disabled={driveState === 'busy'}
                >
                  {driveState === 'busy' ? <ButtonSpinner /> : <><CloudDownload size={14} /> Get it from Google Drive</>}
                </button>
                <textarea
                  className="privacy-key-input"
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  placeholder="Or paste it here: exk1-XXXX-…"
                  rows={2}
                  spellCheck={false}
                  autoComplete="off"
                />
                <div className="privacy-wizard__actions">
                  <button type="button" className="privacy-link" onClick={() => setUsingExisting(false)}>
                    Back
                  </button>
                  <button type="button" className="button-secondary" disabled={!pasted.trim()} onClick={handleUsePasted}>
                    Use this key
                  </button>
                </div>
              </div>
            )}

            {keyText && (
              <>
                <KeyBox value={keyText} onCopied={() => setCopied(true)} />

                <button
                  type="button"
                  className={`privacy-drive${driveState === 'saved' ? ' is-saved' : ''}`}
                  onClick={handleSaveToDrive}
                  disabled={driveState !== 'idle'}
                >
                  {driveState === 'busy' && <ButtonSpinner />}
                  {driveState === 'saved' && <><Check size={16} /> Saved in your Google Drive</>}
                  {driveState === 'idle' && <><CloudUpload size={16} /> Save to Google Drive (recommended)</>}
                </button>
                <p className="privacy-hint">
                  Stored in a hidden app folder of your Google Drive, so you can open your data on other devices.
                </p>

                {conflictKey && (
                  <div className="privacy-alert">
                    <p>Your Google Drive already has a different key from an earlier lock.</p>
                    <button type="button" className="button-secondary" onClick={() => selectKey(conflictKey, true)}>
                      Use the key from Google Drive
                    </button>
                  </div>
                )}

                {driveState !== 'saved' && (
                  <label className="privacy-check">
                    <input
                      type="checkbox"
                      checked={savedConfirmed}
                      onChange={(e) => setSavedConfirmed(e.target.checked)}
                    />
                    <span>I copied my key and saved it somewhere safe</span>
                  </label>
                )}
              </>
            )}

            {error && <p className="privacy-error" role="alert">{error}</p>}

            <div className="privacy-wizard__actions">
              <button type="button" className="privacy-link" onClick={() => setStep('checks')}>
                Back
              </button>
              <button type="button" className="button" disabled={!keyText || !keySaved} onClick={() => setStep('confirm')}>
                Continue
              </button>
            </div>
            {keyText && !keySaved && (
              <p className="privacy-hint">Save the key to Google Drive, or copy it and tick the box, to continue.</p>
            )}
          </>
        )}

        {step === 'confirm' && (
          <>
            <ul className="privacy-wizard__facts">
              <li>Your expenses and income get encrypted, then the readable copies are removed from the server.</li>
              <li>Editing is paused until it&apos;s done. You can keep browsing.</li>
              <li>You can close the app at any time. It continues where it left off.</li>
              <li>Loans and payments (the other app) aren&apos;t covered.</li>
            </ul>
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
              <button type="button" className="privacy-link" onClick={() => setStep('key')}>
                Back
              </button>
              <button
                type="button"
                className="button"
                disabled={confirmText.trim().toUpperCase() !== CONFIRM_WORD || starting}
                onClick={handleStart}
              >
                {starting ? <ButtonSpinner /> : 'Start locking'}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default LockWizard;
