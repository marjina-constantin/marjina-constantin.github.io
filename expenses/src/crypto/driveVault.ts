// Google Drive App Data as a vault for the encryption key only (never for expense data).
// Uses a Google Identity Services popup, so the page state (e.g. a generated key) survives.
import { GOOGLE_CLIENT_ID } from '../utils/constants';
import { normalizeKey } from './keyFormat';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const FILE_NAME = 'expenses-key.json';
const API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';

export class DriveKeyConflictError extends Error {
  constructor(public existingKey: string) {
    super('A different key is already saved in your Google Drive.');
    this.name = 'DriveKeyConflictError';
  }
}

export class DriveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DriveError';
  }
}

interface VaultFile {
  v: 1;
  uid: string;
  key: string;
  createdAt: string;
}

let scriptPromise: Promise<void> | null = null;
let cachedToken: { value: string; expiresAt: number } | null = null;

/** Load the GIS script ahead of the click, so the popup opens inside the user gesture. */
export const preloadGoogleIdentity = (): Promise<void> => {
  if ((window as any).google?.accounts?.oauth2) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = GIS_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptPromise = null;
        reject(new DriveError("Couldn't load Google sign-in. Check your connection."));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
};

const getAccessToken = async (): Promise<string> => {
  if (cachedToken && cachedToken.expiresAt - Date.now() > 60 * 1000) {
    return cachedToken.value;
  }
  await preloadGoogleIdentity();
  const oauth2 = (window as any).google?.accounts?.oauth2;
  if (!oauth2) throw new DriveError("Couldn't load Google sign-in.");

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPE,
      callback: (response: any) => {
        if (response?.error || !response?.access_token) {
          reject(new DriveError('Google Drive access was not granted.'));
          return;
        }
        if (!oauth2.hasGrantedAllScopes(response, SCOPE)) {
          reject(new DriveError('Allow access to app data in Google Drive to continue.'));
          return;
        }
        cachedToken = {
          value: response.access_token,
          expiresAt: Date.now() + Number(response.expires_in || 3600) * 1000,
        };
        resolve(response.access_token);
      },
      error_callback: () => reject(new DriveError('The Google window was closed.')),
    });
    client.requestAccessToken({ prompt: '' });
  });
};

/** Asks for Drive access now (inside a click), so a later step can use it without a popup. */
export const authorizeDrive = async () => {
  await getAccessToken();
};

const driveFetch = async (url: string, init: RequestInit = {}) => {
  const token = await getAccessToken();
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) },
  });
  if (response.status === 401) cachedToken = null;
  if (!response.ok) {
    throw new DriveError(`Google Drive request failed (${response.status}).`);
  }
  return response;
};

const findFile = async (): Promise<string | null> => {
  const query = encodeURIComponent(`name='${FILE_NAME}'`);
  const response = await driveFetch(
    `${API}?spaces=appDataFolder&q=${query}&fields=files(id,name)&pageSize=10`
  );
  const { files } = await response.json();
  return files?.[0]?.id ?? null;
};

const readFile = async (id: string): Promise<VaultFile | null> => {
  const response = await driveFetch(`${API}/${id}?alt=media`);
  try {
    const data = await response.json();
    return data?.key ? data : null;
  } catch {
    return null;
  }
};

/** Returns the stored key for this user, or null if there's none. */
export const readKeyFromDrive = async (uid: string): Promise<string | null> => {
  const id = await findFile();
  if (!id) return null;
  const file = await readFile(id);
  if (!file) return null;
  if (String(file.uid) !== String(uid)) {
    throw new DriveError('The key in this Google Drive belongs to a different account.');
  }
  return normalizeKey(file.key);
};

/** Saves the key and reads it back. Never overwrites a different key. */
export const saveKeyToDrive = async (uid: string, keyText: string): Promise<void> => {
  const key = await normalizeKey(keyText);
  const existing = await readKeyFromDrive(uid);
  if (existing && existing !== key) {
    throw new DriveKeyConflictError(existing);
  }
  if (!existing) {
    const metadata = { name: FILE_NAME, parents: ['appDataFolder'], mimeType: 'application/json' };
    const content: VaultFile = { v: 1, uid: String(uid), key, createdAt: new Date().toISOString() };
    const body = new FormData();
    body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    body.append('file', new Blob([JSON.stringify(content)], { type: 'application/json' }));
    await driveFetch(`${UPLOAD_API}?uploadType=multipart&fields=id`, { method: 'POST', body });
  }
  if ((await readKeyFromDrive(uid)) !== key) {
    throw new DriveError("The key couldn't be verified in Google Drive. Copy it somewhere safe instead.");
  }
};

export const deleteKeyFromDrive = async (): Promise<void> => {
  const id = await findFile();
  if (id) {
    await driveFetch(`${API}/${id}`, { method: 'DELETE' });
  }
};
