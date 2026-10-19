import { checkAndHandleAuthError } from '../utils/authErrorHandler';
import { getAdapter } from '../storage';

export const maskApiKey = (key: string) =>
  key.length > 8 ? `${key.slice(0, 4)}••••••••${key.slice(-4)}` : '••••••••';

let serverKeyRequest: Promise<string> | null = null;

/** Reads the key from the active storage profile. Concurrent calls share one request. */
export const fetchApiKeyFromServer = (
  uid: number | string,
  token: string
): Promise<string> => {
  if (!serverKeyRequest) {
    serverKeyRequest = getAdapter()
      .getProfile(token, uid)
      .then((profile) => profile.geminiApiKey?.trim() || '')
      .catch(async (error) => {
        const status = (error as { status?: number })?.status;
        if (status) {
          await checkAndHandleAuthError({ status });
        }
        throw error;
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
  try {
    await getAdapter().saveProfile(token, uid, { geminiApiKey: key });
  } catch (error) {
    const status = (error as { status?: number })?.status;
    if (status) {
      await checkAndHandleAuthError({ status });
    }
    throw error;
  }
};
