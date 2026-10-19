import { LoginPayload } from '../types/types';
import { clearExpensesDB } from '../utils/indexedDB';
import { clearAiLocalData, setStoredApiKey } from '../ai/storage';
import { clearChatSession } from '../ai/chatSession';
import {
  clearStorageProvider,
  getAdapter,
  setStorageProvider,
  StorageProviderId,
} from '../storage';

export async function loginUser(
  dispatch: any,
  loginPayload: LoginPayload & { storage?: StorageProviderId }
) {
  const storage: StorageProviderId =
    loginPayload.storage === 'drive' ? 'drive' : 'drupal';

  try {
    dispatch({ type: 'REQUEST_LOGIN' });
    setStorageProvider(storage);
    const adapter = getAdapter(storage);
    const data = await adapter.login(loginPayload.access_token);

    if (data.current_user) {
      try {
        const profile = await adapter.getProfile(
          data.jwt_token,
          data.current_user.uid
        );
        data.current_user.currency =
          profile.currency || data.current_user.currency || 'MDL';
        if (profile.geminiApiKey) {
          setStoredApiKey(profile.geminiApiKey);
        }
      } catch (error) {
        const status = (error as { status?: number })?.status;
        if (storage === 'drive' && (status === 403 || status === 401)) {
          throw new Error(
            status === 401
              ? 'Google Drive access was denied. Try the Drive login again.'
              : 'Google Drive API is not enabled for this app yet.'
          );
        }
        console.warn('Could not load profile during login', error);
      }

      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      localStorage.setItem('currentUser', JSON.stringify(data));
      return data;
    }

    dispatch({ type: 'LOGIN_ERROR', error: 'Login failed' });
  } catch (error) {
    clearStorageProvider();
    dispatch({
      type: 'LOGIN_ERROR',
      error: error instanceof Error ? error.message : error,
    });
  }
}

export async function logout(dispatch: any, dataDispatch: any) {
  await dispatch({ type: 'LOGOUT' });
  await dataDispatch({ type: 'REMOVE_DATA' });
  localStorage.removeItem('currentUser');
  localStorage.removeItem('token');
  clearStorageProvider();
  clearAiLocalData();
  clearChatSession();
  await clearExpensesDB();
}
