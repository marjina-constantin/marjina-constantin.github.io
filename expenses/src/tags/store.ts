import { useSyncExternalStore } from 'react';
import { ROOT_URL } from '../utils/constants';
import { checkAndHandleAuthError } from '../utils/authErrorHandler';
import { getSession } from '../crypto/encryptionState';
import {
  CUSTOM_TAGS_FIELD,
  TAG_MODE_FIELD,
  TagCatalog,
  catalogFromUser,
  emptyCatalog,
  readTagCache,
  registerTagLogout,
  serializeCustomTags,
  writeTagCache,
} from './catalog';

export type TagCatalogStatus = 'idle' | 'loading' | 'ready';

interface TagSnapshot {
  uid: string;
  catalog: TagCatalog;
  status: TagCatalogStatus;
}

const listeners = new Set<() => void>();

const loadInitial = (): TagSnapshot => {
  const session = getSession();
  if (!session) return { uid: '', catalog: emptyCatalog(), status: 'idle' };
  return {
    uid: session.uid,
    catalog: readTagCache(session.uid) ?? emptyCatalog(),
    status: 'loading',
  };
};

let snapshot: TagSnapshot = loadInitial();
let requestId = 0;

const publish = (next: TagSnapshot) => {
  snapshot = next;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => snapshot;

export const resetTagCatalog = () => {
  requestId += 1;
  publish({ uid: '', catalog: emptyCatalog(), status: 'idle' });
};

registerTagLogout(resetTagCatalog);

const userRequest = (method: string, token: string, body?: unknown): RequestInit => ({
  method,
  headers: new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'JWT-Authorization': `Bearer ${token}`,
  }),
  ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
});

export const refreshTagCatalog = async () => {
  const session = getSession();
  if (!session) {
    resetTagCatalog();
    return;
  }

  const id = ++requestId;
  if (snapshot.uid !== session.uid || snapshot.status !== 'ready') {
    publish({
      uid: session.uid,
      catalog: snapshot.uid === session.uid ? snapshot.catalog : readTagCache(session.uid) ?? emptyCatalog(),
      status: 'loading',
    });
  }

  try {
    const options = userRequest('GET', session.token);
    const response = await fetch(`${ROOT_URL}/user/${session.uid}?_format=json`, options);
    if (!response.ok) {
      await checkAndHandleAuthError(response, options);
      throw new Error(`HTTP ${response.status}`);
    }
    const catalog = catalogFromUser(await response.json());
    if (id !== requestId) return;
    writeTagCache(session.uid, catalog);
    publish({ uid: session.uid, catalog, status: 'ready' });
  } catch {
    if (id !== requestId) return;
    publish({ ...snapshot, uid: session.uid, status: 'ready' });
  }
};

export const saveTagCatalog = async (catalog: TagCatalog): Promise<TagCatalog> => {
  const session = getSession();
  if (!session) throw new Error('Not signed in');

  const options = userRequest('PATCH', session.token, {
    [TAG_MODE_FIELD]: [{ value: catalog.mode }],
    [CUSTOM_TAGS_FIELD]: serializeCustomTags(catalog.custom),
  });
  const response = await fetch(`${ROOT_URL}/user/${session.uid}?_format=json`, options);
  if (!response.ok) {
    await checkAndHandleAuthError(response, options);
    throw new Error(`HTTP ${response.status}`);
  }

  const user = await response.json().catch(() => null);
  const saved = user?.[TAG_MODE_FIELD] ? catalogFromUser(user) : catalog;
  writeTagCache(session.uid, saved);
  publish({ uid: session.uid, catalog: saved, status: 'ready' });
  return saved;
};

export function useTagCatalog(): TagCatalog {
  return useSyncExternalStore(subscribe, getSnapshot).catalog;
}

export function useTagCatalogState(): TagSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot);
}
