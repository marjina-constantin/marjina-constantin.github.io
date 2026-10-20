import React, { useEffect, useState } from 'react';
import { Check, CloudUpload, Copy, Lock, LockOpen, ShieldCheck } from 'lucide-react';
import { useNotification } from '../../context';
import { notificationType } from '../../utils/constants';
import { getSession, isTransitional, useEncryptionState } from '../../crypto/encryptionState';
import { getKeyText } from '../../crypto/keyStore';
import { cancelLock, resumeTransition, useTransitionProgress } from '../../crypto/migration';
import { DriveKeyConflictError, preloadGoogleIdentity, saveKeyToDrive } from '../../crypto/driveVault';
import { ButtonSpinner } from '../ui/LoadingSpinner';
import LockWizard from './LockWizard';
import UnlockWizard from './UnlockWizard';

const PrivacySettings = () => {
  const showNotification = useNotification();
  const { status, hasKey, corruptCount } = useEncryptionState();
  const progress = useTransitionProgress();
  const [wizard, setWizard] = useState<'lock' | 'unlock' | null>(null);
  const [driveBusy, setDriveBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const running = progress.state === 'running';

  useEffect(() => {
    preloadGoogleIdentity().catch(() => {});
  }, []);

  const handleCopy = async () => {
    const key = getKeyText();
    if (!key) return;
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showNotification("Couldn't copy the key. Try again.", notificationType.ERROR);
    }
  };

  const handleSaveToDrive = async () => {
    const key = getKeyText();
    const uid = getSession()?.uid;
    if (!key || !uid) return;
    setDriveBusy(true);
    try {
      await saveKeyToDrive(uid, key);
      showNotification('Key saved in your Google Drive.', notificationType.SUCCESS);
    } catch (error) {
      showNotification(
        error instanceof DriveKeyConflictError
          ? 'Your Google Drive has a different key. It was left untouched.'
          : (error as Error).message,
        notificationType.ERROR
      );
    }
    setDriveBusy(false);
  };

  return (
    <div className="privacy-settings">
      <div className="privacy-settings__title">
        <ShieldCheck size={16} />
        <span>Privacy</span>
      </div>

      {status === null && (
        <div className="privacy-settings__row">
          <span>Checking lock status…</span>
          <ButtonSpinner />
        </div>
      )}

      {status === 'off' && (
        <>
          <p className="privacy-hint">
            Encrypt your expenses and income on this device before they&apos;re sent. Nobody else can read
            them, not even the server admin. <strong>If you lose the key, your data is gone for good.</strong>
          </p>
          <button type="button" className="button" onClick={() => setWizard('lock')}>
            <Lock size={14} /> Lock my data
          </button>
        </>
      )}

      {status === 'on' && (
        <>
          <div className="privacy-settings__row">
            <span>Your data is locked</span>
            <span className="privacy-settings__badge">
              <Lock size={12} /> Encrypted
            </span>
          </div>
          <div className="privacy-settings__actions">
            <button type="button" className="button-secondary" onClick={handleCopy} disabled={!hasKey}>
              {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy key'}
            </button>
            <button type="button" className="button-secondary" onClick={handleSaveToDrive} disabled={!hasKey || driveBusy}>
              {driveBusy ? <ButtonSpinner /> : <><CloudUpload size={14} /> Save to Drive</>}
            </button>
          </div>
          <button type="button" className="button-secondary" onClick={() => setWizard('unlock')} disabled={!hasKey}>
            <LockOpen size={14} /> Unlock my data
          </button>
        </>
      )}

      {isTransitional(status) && (
        <>
          <p className="privacy-hint">
            {status === 'migrating' ? 'Locking' : 'Unlocking'} is {running ? 'in progress' : 'paused'}. Your
            data is safe either way.
          </p>
          {!running && hasKey && (
            <div className="privacy-settings__actions">
              <button type="button" className="button" onClick={() => resumeTransition()}>
                Continue
              </button>
              {status === 'migrating' && (
                <button type="button" className="button-secondary" onClick={() => cancelLock()}>
                  Cancel and unlock
                </button>
              )}
            </div>
          )}
          {hasKey && (
            <button type="button" className="privacy-link" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy key'}
            </button>
          )}
        </>
      )}

      {corruptCount > 0 && (
        <p className="privacy-error">
          {corruptCount} item{corruptCount === 1 ? '' : 's'} couldn&apos;t be decrypted. They were kept as
          they were.
        </p>
      )}

      {wizard === 'lock' && <LockWizard onClose={() => setWizard(null)} />}
      {wizard === 'unlock' && <UnlockWizard onClose={() => setWizard(null)} />}
    </div>
  );
};

export default PrivacySettings;
