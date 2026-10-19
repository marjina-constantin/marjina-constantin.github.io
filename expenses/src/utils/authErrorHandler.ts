import { logout } from '../context/actions';
import { getAdapter } from '../storage';

let dispatch: any = null;
let dataDispatch: any = null;

/**
 * Initialize the authentication error handler with dispatch functions
 * This should be called once when the app starts (e.g., in App.tsx)
 */
export function initializeAuthErrorHandler(
  authDispatch: any,
  appDataDispatch: any
): void {
  dispatch = authDispatch;
  dataDispatch = appDataDispatch;
}

export async function handleAuthError(
  response?: { status: number },
  options?: RequestInit
): Promise<boolean> {
  const status = response?.status;
  const adapter = getAdapter();
  if (status === undefined || !adapter.isAuthError(status)) {
    return false;
  }

  const token =
    (options?.headers instanceof Headers
      ? options.headers.get('JWT-Authorization') ||
        options.headers.get('Authorization')
      : undefined) || undefined;
  const bearer = token?.replace(/^Bearer\s+/i, '');

  try {
    const stillValid = bearer ? await adapter.verifyAuth(bearer) : false;
    if (!stillValid && dispatch && dataDispatch) {
      console.warn('Auth token expired, logging out user');
      await logout(dispatch, dataDispatch);
      return true;
    }
  } catch (error) {
    console.error('Error verifying token:', error);
    if (dispatch && dataDispatch) {
      console.warn('Token verification failed, logging out user');
      await logout(dispatch, dataDispatch);
      return true;
    }
  }

  return false;
}

export async function checkAndHandleAuthError(
  response: { status: number },
  options?: RequestInit
): Promise<boolean> {
  const adapter = getAdapter();
  if (adapter.isAuthError(response.status)) {
    return await handleAuthError(response, options);
  }
  return false;
}
