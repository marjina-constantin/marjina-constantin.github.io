import { LoginPayload, UserData } from '../types/types';
import { clearExpensesDB } from '../utils/indexedDB';
import { ROOT_URL } from '../utils/constants';
import { clearAiLocalData } from '../ai/storage';
import { clearChatSession } from '../ai/chatSession';
import { applyLoginStatus, resetEncryptionState } from '../crypto/encryptionState';
import { resetTagsOnLogout } from '../tags/catalog';

const SERVER_UNAVAILABLE_MESSAGE =
  "Couldn't reach the server. Check your connection and try again in a few minutes.";

export async function loginUser(dispatch: any, loginPayload: LoginPayload) {
  const requestOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginPayload),
  };

  try {
    dispatch({ type: 'REQUEST_LOGIN' });
    const response = await fetch(
      `${ROOT_URL}/user/login/google?_format=json`,
      requestOptions
    );
    // An outage returns an HTML error page, so the body may not be JSON.
    const data: UserData | null = await response.json().catch(() => null);

    if (data?.current_user) {
      localStorage.setItem('currentUser', JSON.stringify(data));
      applyLoginStatus(data.current_user.encryption_status);
      dispatch({ type: 'LOGIN_SUCCESS', payload: data });
      return data;
    }

    const serverError = data?.errors?.[0];
    dispatch({
      type: 'LOGIN_ERROR',
      error:
        typeof serverError === 'string' && serverError
          ? serverError
          : SERVER_UNAVAILABLE_MESSAGE,
    });
  } catch {
    dispatch({ type: 'LOGIN_ERROR', error: SERVER_UNAVAILABLE_MESSAGE });
  }
}

export async function logout(dispatch: any, dataDispatch: any) {
  await dispatch({ type: 'LOGOUT' });
  await dataDispatch({ type: 'REMOVE_DATA' });
  localStorage.removeItem('currentUser');
  localStorage.removeItem('token');
  resetTagsOnLogout();
  resetEncryptionState();
  clearAiLocalData();
  clearChatSession();
  // Clear IndexedDB cache on logout
  await clearExpensesDB();
}
