import { ROOT_URL } from '../utils/constants';
import { checkAndHandleAuthError } from '../utils/authErrorHandler';
import { AI_KEY_FIELD } from './config';

export const maskApiKey = (key: string) =>
  key.length > 8 ? `${key.slice(0, 4)}••••••••${key.slice(-4)}` : '••••••••';

const userRequestOptions = (method: string, token: string, body?: unknown): RequestInit => ({
  method,
  headers: new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'JWT-Authorization': `Bearer ${token}`,
  }),
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});

let serverKeyRequest: Promise<string> | null = null;

/** Reads the key from the Drupal user profile. Concurrent calls share one request. */
export const fetchApiKeyFromServer = (uid: number | string, token: string): Promise<string> => {
  if (!serverKeyRequest) {
    const options = userRequestOptions('GET', token);
    serverKeyRequest = fetch(`${ROOT_URL}/user/${uid}?_format=json`, options)
      .then(async (response) => {
        if (!response.ok) {
          await checkAndHandleAuthError(response, options);
          throw new Error(`HTTP ${response.status}`);
        }
        const user = await response.json();
        return (user?.[AI_KEY_FIELD]?.[0]?.value as string | undefined)?.trim() || '';
      })
      .finally(() => {
        serverKeyRequest = null;
      });
  }
  return serverKeyRequest;
};

export const saveApiKeyToServer = async (
  uid: number | string,
  token: string,
  key: string
): Promise<void> => {
  const options = userRequestOptions('PATCH', token, {
    [AI_KEY_FIELD]: key ? [{ value: key }] : [],
  });
  const response = await fetch(`${ROOT_URL}/user/${uid}?_format=json`, options);
  if (!response.ok) {
    await checkAndHandleAuthError(response, options);
    throw new Error(`HTTP ${response.status}`);
  }
};
