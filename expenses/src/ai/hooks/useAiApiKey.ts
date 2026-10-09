import { useCallback, useEffect, useState } from 'react';
import { useAuthState } from '../../context';
import { AuthState } from '../../types/types';
import { fetchApiKeyFromServer, saveApiKeyToServer } from '../apiKey';
import { getStoredApiKey, keyLookup, setStoredApiKey } from '../storage';

export type ApiKeyStatus = 'loading' | 'ready' | 'missing';

/**
 * The key lives in the Drupal profile and is mirrored in localStorage. If this
 * device has no copy yet (new login / new device), it is pulled once from Drupal.
 */
export function useAiApiKey() {
  const { token, userDetails } = useAuthState() as AuthState;
  const uid = userDetails?.current_user?.uid;
  const [apiKey, setApiKey] = useState(getStoredApiKey);
  const [status, setStatus] = useState<ApiKeyStatus>(
    apiKey ? 'ready' : keyLookup.serverHasNoKey ? 'missing' : 'loading'
  );

  useEffect(() => {
    if (apiKey || keyLookup.serverHasNoKey || !uid || !token) {
      setStatus(apiKey ? 'ready' : 'missing');
      return;
    }
    let cancelled = false;
    fetchApiKeyFromServer(uid, token)
      .then((key) => {
        keyLookup.serverHasNoKey = !key;
        if (cancelled) return;
        setStoredApiKey(key);
        setApiKey(key);
        setStatus(key ? 'ready' : 'missing');
      })
      .catch(() => {
        if (!cancelled) setStatus('missing');
      });
    return () => {
      cancelled = true;
    };
  }, [apiKey, uid, token]);

  const save = useCallback(
    async (key: string) => {
      const trimmed = key.trim();
      await saveApiKeyToServer(uid, token, trimmed);
      keyLookup.serverHasNoKey = !trimmed;
      setStoredApiKey(trimmed);
      setApiKey(trimmed);
      setStatus(trimmed ? 'ready' : 'missing');
    },
    [uid, token]
  );

  return { apiKey, status, save };
}
