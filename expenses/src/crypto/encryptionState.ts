import { useSyncExternalStore } from 'react';
import { ROOT_URL } from '../utils/constants';
import { clearKeyText, hasStoredKey, saveKeyText } from './keyStore';

export type EncryptionStatus = 'off' | 'migrating' | 'on' | 'unlocking';

export interface EncryptionSnapshot {
  /** null until the status is known (login response or GET /user). Unknown never means "off". */
  status: EncryptionStatus | null;
  hasKey: boolean;
  /** True while the lock/unlock engine runs on this device. */
  migrationActive: boolean;
  corruptCount: number;
}

const STATUS_VALUES: EncryptionStatus[] = ['off', 'migrating', 'on', 'unlocking'];
const STATUS_MAX_AGE_MS = 60 * 1000;

export const parseStatus = (value: unknown): EncryptionStatus | null =>
  STATUS_VALUES.includes(value as EncryptionStatus) ? (value as EncryptionStatus) : null;

export const isTransitional = (status: EncryptionStatus | null) =>
  status === 'migrating' || status === 'unlocking';

interface Session {
  uid: string;
  token: string;
}

const readStoredUser = (): any => {
  try {
    const text = localStorage.getItem('currentUser');
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
};

export const getSession = (): Session | null => {
  const user = readStoredUser();
  const uid = user?.current_user?.uid;
  const token = user?.jwt_token;
  return uid && token ? { uid: String(uid), token } : null;
};

let snapshot: EncryptionSnapshot = {
  status: parseStatus(readStoredUser()?.current_user?.encryption_status),
  hasKey: hasStoredKey(),
  migrationActive: false,
  corruptCount: 0,
};
let lastStatusCheck = 0;
const listeners = new Set<() => void>();

const update = (patch: Partial<EncryptionSnapshot>) => {
  snapshot = { ...snapshot, ...patch };
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getEncryptionSnapshot = () => snapshot;

export const useEncryptionState = () => useSyncExternalStore(subscribe, getEncryptionSnapshot);

/** Keeps the status in the cached login response too, so a reload starts with the last known value. */
export const setStatus = (status: EncryptionStatus) => {
  lastStatusCheck = Date.now();
  const user = readStoredUser();
  if (user?.current_user && user.current_user.encryption_status !== status) {
    user.current_user.encryption_status = status;
    localStorage.setItem('currentUser', JSON.stringify(user));
  }
  if (snapshot.status !== status) {
    update({ status });
  }
};

export const applyLoginStatus = (value: unknown) => {
  const status = parseStatus(value);
  if (status) {
    setStatus(status);
  } else {
    lastStatusCheck = 0;
    update({ status: null });
  }
};

let pendingRefresh: Promise<EncryptionStatus | null> | null = null;

/** Re-reads field_encryption_status from Drupal. Keeps the current value if the request fails. */
export const refreshStatus = (force = false): Promise<EncryptionStatus | null> => {
  if (!force && snapshot.status && Date.now() - lastStatusCheck < STATUS_MAX_AGE_MS) {
    return Promise.resolve(snapshot.status);
  }
  const session = getSession();
  if (!session || (typeof navigator !== 'undefined' && !navigator.onLine)) {
    return Promise.resolve(snapshot.status);
  }
  if (!pendingRefresh) {
    pendingRefresh = fetch(`${ROOT_URL}/user/${session.uid}?_format=json`, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'JWT-Authorization': `Bearer ${session.token}`,
      },
    })
      .then(async (response) => {
        if (!response.ok) return snapshot.status;
        const user = await response.json();
        const status = parseStatus(user?.field_encryption_status?.[0]?.value) ?? 'off';
        setStatus(status);
        return status;
      })
      .catch(() => snapshot.status)
      .finally(() => {
        pendingRefresh = null;
      });
  }
  return pendingRefresh;
};

export const storeKey = async (input: string) => {
  const text = await saveKeyText(input);
  update({ hasKey: true });
  return text;
};

export const forgetKey = () => {
  clearKeyText();
  update({ hasKey: false });
};

export const setMigrationActive = (migrationActive: boolean) => update({ migrationActive });

export const setCorruptCount = (corruptCount: number) => {
  if (snapshot.corruptCount !== corruptCount) update({ corruptCount });
};

export const isMigrationActive = () => snapshot.migrationActive;

/** Editing is paused on every device while a lock or unlock is in progress. */
export const isWriteBlocked = () => snapshot.migrationActive || isTransitional(snapshot.status);

export const writeBlockedMessage = () =>
  snapshot.status === 'unlocking'
    ? 'Editing is paused while your data is being unlocked.'
    : 'Editing is paused while your data is being locked.';

export const resetEncryptionState = () => {
  clearKeyText();
  lastStatusCheck = 0;
  update({ status: null, hasKey: false, migrationActive: false, corruptCount: 0 });
};
