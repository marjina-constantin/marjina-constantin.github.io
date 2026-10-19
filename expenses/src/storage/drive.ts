import { TransactionOrIncomeItem } from '../types/types';
import { LoginResult, StorageAdapter, UserProfile } from './types';

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3';
const FILE_NAME = 'expenses.json';
const FILE_ID_KEY = 'driveFileId';

interface DriveStore {
  version: 1;
  profile: UserProfile;
  items: TransactionOrIncomeItem[];
}

const emptyStore = (): DriveStore => ({
  version: 1,
  profile: { currency: 'MDL', geminiApiKey: '' },
  items: [],
});

const authHeaders = (token: string, extra?: Record<string, string>) => ({
  Authorization: `Bearer ${token}`,
  ...extra,
});

const statusError = (status: number, message?: string) => {
  const error = new Error(message || `HTTP ${status}`) as Error & {
    status: number;
  };
  error.status = status;
  return error;
};

async function googleJson(token: string, url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...authHeaders(token),
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  if (!response.ok) {
    throw statusError(response.status);
  }
  if (response.status === 204) {
    return null;
  }
  return response.json();
}

async function findFileId(token: string): Promise<string | null> {
  const cached = localStorage.getItem(FILE_ID_KEY);
  if (cached) {
    return cached;
  }
  const query = encodeURIComponent(`name='${FILE_NAME}'`);
  const data = await googleJson(
    token,
    `${DRIVE_API}/files?spaces=appDataFolder&q=${query}&fields=files(id,name)`
  );
  const id = data?.files?.[0]?.id as string | undefined;
  if (id) {
    localStorage.setItem(FILE_ID_KEY, id);
  }
  return id || null;
}

async function downloadStore(
  token: string,
  fileId: string
): Promise<DriveStore> {
  const response = await fetch(`${DRIVE_API}/files/${fileId}?alt=media`, {
    headers: authHeaders(token),
  });
  if (!response.ok) {
    if (response.status === 404) {
      localStorage.removeItem(FILE_ID_KEY);
      return emptyStore();
    }
    throw statusError(response.status);
  }
  try {
    const data = await response.json();
    if (!data || !Array.isArray(data.items)) {
      return emptyStore();
    }
    return {
      version: 1,
      profile: {
        currency: data.profile?.currency || 'MDL',
        geminiApiKey: data.profile?.geminiApiKey || '',
      },
      items: data.items,
    };
  } catch {
    return emptyStore();
  }
}

async function loadStore(
  token: string
): Promise<{ fileId: string | null; store: DriveStore }> {
  const fileId = await findFileId(token);
  if (!fileId) {
    return { fileId: null, store: emptyStore() };
  }
  return { fileId, store: await downloadStore(token, fileId) };
}

async function createFile(token: string, store: DriveStore): Promise<string> {
  const metadata = {
    name: FILE_NAME,
    parents: ['appDataFolder'],
    mimeType: 'application/json',
  };
  const boundary = 'expenses_app_data';
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: application/json\r\n\r\n' +
    `${JSON.stringify(store)}\r\n` +
    `--${boundary}--`;

  const response = await fetch(
    `${DRIVE_UPLOAD}/files?uploadType=multipart&fields=id`,
    {
      method: 'POST',
      headers: authHeaders(token, {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      }),
      body,
    }
  );
  if (!response.ok) {
    throw statusError(
      response.status,
      response.status === 403
        ? 'Google Drive API is not enabled for this app yet.'
        : undefined
    );
  }
  const data = await response.json();
  const id = data.id as string;
  localStorage.setItem(FILE_ID_KEY, id);
  return id;
}

async function updateFile(
  token: string,
  fileId: string,
  store: DriveStore
): Promise<void> {
  const response = await fetch(
    `${DRIVE_UPLOAD}/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: authHeaders(token, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(store),
    }
  );
  if (response.status === 404) {
    localStorage.removeItem(FILE_ID_KEY);
    await createFile(token, store);
    return;
  }
  if (!response.ok) {
    throw statusError(response.status);
  }
}

async function persist(token: string, store: DriveStore): Promise<void> {
  const fileId = localStorage.getItem(FILE_ID_KEY) || (await findFileId(token));
  if (fileId) {
    await updateFile(token, fileId, store);
    return;
  }
  await createFile(token, store);
}

export const driveAdapter: StorageAdapter = {
  id: 'drive',
  mode: 'snapshot',

  async login(googleAccessToken: string): Promise<LoginResult> {
    const data = await googleJson(
      googleAccessToken,
      'https://www.googleapis.com/oauth2/v3/userinfo'
    );
    const name = data?.name || data?.email || 'Google user';
    return {
      jwt_token: googleAccessToken,
      current_user: {
        uid: data?.sub || name,
        name,
        email: data?.email,
        currency: 'MDL',
      },
    };
  },

  async fetchAll(token: string): Promise<TransactionOrIncomeItem[]> {
    const { store } = await loadStore(token);
    return store.items;
  },

  async fetchOne(
    token: string,
    id: string
  ): Promise<TransactionOrIncomeItem | null> {
    const { store } = await loadStore(token);
    return store.items.find((item) => item.id === id) || null;
  },

  async create(
    _token: string,
    item: TransactionOrIncomeItem
  ): Promise<TransactionOrIncomeItem> {
    return item;
  },

  async update(
    _token: string,
    item: TransactionOrIncomeItem
  ): Promise<TransactionOrIncomeItem> {
    return item;
  },

  async delete(): Promise<void> {
    // Snapshot sync writes the local list; deletes are already applied in IndexedDB.
  },

  async saveAll(
    token: string,
    items: TransactionOrIncomeItem[]
  ): Promise<void> {
    const { store } = await loadStore(token);
    await persist(token, { ...store, items });
  },

  async getProfile(token: string): Promise<UserProfile> {
    const { store } = await loadStore(token);
    return store.profile;
  },

  async saveProfile(
    token: string,
    _uid: string | number,
    patch: Partial<UserProfile>
  ): Promise<UserProfile> {
    const { store } = await loadStore(token);
    const profile = {
      currency: patch.currency ?? store.profile.currency ?? 'MDL',
      geminiApiKey:
        patch.geminiApiKey !== undefined
          ? patch.geminiApiKey
          : store.profile.geminiApiKey || '',
    };
    await persist(token, { ...store, profile });
    return profile;
  },

  async verifyAuth(token: string): Promise<boolean> {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v3/userinfo',
      { headers: authHeaders(token) }
    );
    return response.ok;
  },

  isAuthError(status: number): boolean {
    return status === 401;
  },
};
