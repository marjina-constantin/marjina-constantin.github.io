import React, { useEffect, useState } from 'react';
import { CloudDownload, KeyRound, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { logout, useAuthDispatch, useAuthState, useData } from '../../context';
import { AuthState } from '../../types/types';
import { fetchData } from '../../utils/utils';
import { getSession, storeKey, useEncryptionState } from '../../crypto/encryptionState';
import { normalizeKey } from '../../crypto/keyFormat';
import { checkKeyAgainstServer } from '../../crypto/migration';
import { preloadGoogleIdentity, readKeyFromDrive } from '../../crypto/driveVault';
import { ButtonSpinner } from '../ui/LoadingSpinner';

const KeyNeededScreen = () => {
  const { token } = useAuthState() as AuthState;
  const dispatch = useAuthDispatch();
  const { dataDispatch } = useData();
  const navigate = useNavigate();
  const { status } = useEncryptionState();
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState<'drive' | 'paste' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    preloadGoogleIdentity().catch(() => {});
  }, []);

  const unlockWith = async (text: string) => {
    const key = await normalizeKey(text);
    const result = await checkKeyAgainstServer(key);
    if (result === 'mismatch') {
      throw new Error("This key doesn't match your data. Check you're using the right one.");
    }
    await storeKey(key);
    fetchData(token, dataDispatch, dispatch);
  };

  const run = async (kind: 'drive' | 'paste', task: () => Promise<void>) => {
    setBusy(kind);
    setError('');
    setNotice('');
    try {
      await task();
    } catch (err) {
      setError((err as Error)?.message || 'Something went wrong. Try again.');
    }
    setBusy(null);
  };

  const handleDrive = () =>
    run('drive', async () => {
      const uid = getSession()?.uid;
      if (!uid) throw new Error('Log in again first.');
      const key = await readKeyFromDrive(uid);
      if (!key) {
        setNotice("There's no key in this Google account's Drive. Paste it below instead.");
        return;
      }
      await unlockWith(key);
    });

  const handlePaste = (event: React.FormEvent) => {
    event.preventDefault();
    run('paste', () => unlockWith(input));
  };

  const handleLogout = async () => {
    await logout(dispatch, dataDispatch);
    navigate('/expenses/login');
  };

  return (
    <div className="key-needed">
      <div className="key-needed__panel">
        <span className="key-needed__icon">
          <Lock size={22} />
        </span>
        <h1>Your data is locked</h1>
        <p className="key-needed__description">
          {status === 'on'
            ? 'Your expenses are encrypted. Add your key to open them on this device.'
            : 'Your account is in the middle of a lock or unlock. Add your key to continue.'}
        </p>

        <button type="button" className="button w-100" onClick={handleDrive} disabled={!!busy}>
          {busy === 'drive' ? <ButtonSpinner /> : <><CloudDownload size={16} /> Get key from Google Drive</>}
        </button>

        <div className="key-needed__divider">
          <span>or</span>
        </div>

        <form className="key-needed__form" onSubmit={handlePaste}>
          <label htmlFor="encryption-key">Paste your key</label>
          <textarea
            id="encryption-key"
            className="privacy-key-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="exk1-XXXX-XXXX-…"
            rows={2}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="characters"
          />
          <button type="submit" className="button-secondary" disabled={!!busy || !input.trim()}>
            {busy === 'paste' ? <ButtonSpinner /> : <><KeyRound size={16} /> Unlock</>}
          </button>
        </form>

        {error && (
          <p className="key-needed__error" role="alert">
            {error}
          </p>
        )}
        {notice && <p className="key-needed__notice">{notice}</p>}

        <details className="key-needed__lost">
          <summary>Lost your key?</summary>
          <p>
            Your data was encrypted on your device with that key, and nobody else has a copy, not even
            the server admin. Without it, the data can&apos;t be read. Check the Google account you
            used when locking, or wherever you saved the key.
          </p>
          <p>Nothing on the server is deleted. If you find the key later, everything is still there.</p>
        </details>

        <button type="button" className="key-needed__logout" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </div>
  );
};

export default KeyNeededScreen;
