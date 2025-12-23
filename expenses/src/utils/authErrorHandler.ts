import { logout } from '../context/actions';

// Store dispatch functions for authentication error handling
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

/**
 * Handle authentication errors (403 responses)
 * Checks if the token is actually expired and logs out if so
 */
export async function handleAuthError(
  response: Response,
  options?: RequestInit
): Promise<boolean> {
  // If we already know it's a 403, verify it's actually an auth issue
  if (response.status === 403) {
    // Double-check by trying to validate the token
    const verifyOptions: RequestInit = {
      method: 'GET',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options?.headers as Headers),
      }),
    };

    try {
      const verifyResponse = await fetch(
        'https://dev-expenses-api.pantheonsite.io/jwt/token',
        verifyOptions
      );

      if (verifyResponse.status === 403) {
        // Token is definitely expired, log out
        if (dispatch && dataDispatch) {
          console.warn('JWT token expired, logging out user');
          await logout(dispatch, dataDispatch);
          return true; // Indicates user was logged out
        } else {
          console.error(
            'Authentication error detected but dispatch functions not initialized'
          );
        }
      }
    } catch (error) {
      console.error('Error verifying token:', error);
      // If verification fails, assume token is expired and log out
      if (dispatch && dataDispatch) {
        console.warn('Token verification failed, logging out user');
        await logout(dispatch, dataDispatch);
        return true;
      }
    }
  }

  return false; // No logout occurred
}

/**
 * Check if a response indicates an authentication error and handle it
 * Returns true if the user was logged out, false otherwise
 */
export async function checkAndHandleAuthError(
  response: Response,
  options?: RequestInit
): Promise<boolean> {
  if (response.status === 403) {
    return await handleAuthError(response, options);
  }
  return false;
}

