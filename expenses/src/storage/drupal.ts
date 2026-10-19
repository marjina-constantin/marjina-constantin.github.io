import { ROOT_URL } from '../utils/constants';
import { TransactionOrIncomeItem } from '../types/types';
import { AI_KEY_FIELD } from '../ai/config';
import { LoginResult, StorageAdapter, UserProfile } from './types';

const jsonHeaders = (token: string) =>
  new Headers({
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'JWT-Authorization': `Bearer ${token}`,
  });

const parseTimestamp = (value: unknown): number | undefined => {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'number') {
    return value > 1e12 ? value : value * 1000;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }
    const numeric = Number(trimmed);
    if (!Number.isNaN(numeric)) {
      return numeric > 1e12 ? numeric : numeric * 1000;
    }
    const parsed = Date.parse(trimmed);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

export function convertNodeDataToItem(nodeData: any): TransactionOrIncomeItem {
  const id =
    (nodeData.id !== undefined ? nodeData.id : undefined)?.toString() ||
    nodeData.nid?.[0]?.value?.toString() ||
    '';

  let type = '';
  if (typeof nodeData.type === 'string') {
    type = nodeData.type;
  } else if (Array.isArray(nodeData.type) && nodeData.type.length > 0) {
    type = nodeData.type[0]?.value || nodeData.type[0]?.target_id || '';
  }

  const amountValue =
    nodeData.sum ??
    nodeData.field_amount?.[0]?.value ??
    nodeData.field_amount?.[0]?.target_id ??
    '0';
  const sum = amountValue?.toString() || '0';

  const date = nodeData.dt || nodeData.field_date?.[0]?.value || '';
  const description =
    nodeData.dsc || nodeData.field_description?.[0]?.value || '';

  const categoryEntry = nodeData.field_category?.[0];
  const category =
    (nodeData.cat !== undefined ? nodeData.cat : undefined)?.toString() ||
    (categoryEntry?.target_id ?? categoryEntry?.value ?? '').toString();

  const created =
    parseTimestamp(
      nodeData.cr ??
        nodeData.created?.[0]?.value ??
        nodeData.created ??
        undefined
    ) ?? Date.now();

  const updated =
    parseTimestamp(
      nodeData.upd ??
        nodeData.updated ??
        nodeData.updated?.[0]?.value ??
        nodeData.changed?.[0]?.value ??
        nodeData.revision_timestamp?.[0]?.value
    ) ?? created;

  return {
    id,
    type,
    sum,
    dt: date,
    dsc: description,
    cat: category,
    cr: created,
    updated,
    failed: !!nodeData.failed,
  };
}

const toItems = (serverData: any[]): TransactionOrIncomeItem[] =>
  serverData.map((item: any) => {
    if (item.id && item.dt && !item.nid) {
      const created = parseTimestamp(item.cr ?? item.created) ?? Date.now();
      const updated = parseTimestamp(item.upd ?? item.updated) ?? created;
      return {
        ...item,
        cr: created,
        updated,
        failed: !!item.failed,
      };
    }
    return convertNodeDataToItem(item);
  });

async function parseJson(response: Response) {
  if (response.status === 204) {
    return null;
  }
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export const drupalAdapter: StorageAdapter = {
  id: 'drupal',
  mode: 'per-item',

  async login(googleAccessToken: string): Promise<LoginResult> {
    const response = await fetch(`${ROOT_URL}/user/login/google?_format=json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ access_token: googleAccessToken }),
    });
    const data = await response.json();
    if (!data?.current_user || !data?.jwt_token) {
      throw new Error(data?.errors?.[0] || 'Login failed');
    }
    return data as LoginResult;
  },

  async fetchAll(token: string): Promise<TransactionOrIncomeItem[]> {
    const response = await fetch(`${ROOT_URL}/api/expenses`, {
      method: 'GET',
      headers: jsonHeaders(token),
    });
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as Error & {
        status: number;
      };
      error.status = response.status;
      throw error;
    }
    const serverData = await response.json();
    return toItems(Array.isArray(serverData) ? serverData : []);
  },

  async fetchOne(
    token: string,
    id: string
  ): Promise<TransactionOrIncomeItem | null> {
    const response = await fetch(`${ROOT_URL}/node/${id}?_format=json`, {
      method: 'GET',
      headers: jsonHeaders(token),
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as Error & {
        status: number;
      };
      error.status = response.status;
      throw error;
    }
    return convertNodeDataToItem(await response.json());
  },

  async create(
    token: string,
    _item: TransactionOrIncomeItem,
    formData: unknown
  ): Promise<TransactionOrIncomeItem> {
    const response = await fetch(`${ROOT_URL}/node?_format=json`, {
      method: 'POST',
      headers: jsonHeaders(token),
      body: JSON.stringify(formData),
    });
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as Error & {
        status: number;
      };
      error.status = response.status;
      throw error;
    }
    const data = await parseJson(response);
    return data ? convertNodeDataToItem(data) : _item;
  },

  async update(
    token: string,
    item: TransactionOrIncomeItem,
    formData: unknown
  ): Promise<TransactionOrIncomeItem> {
    const response = await fetch(`${ROOT_URL}/node/${item.id}?_format=json`, {
      method: 'PATCH',
      headers: jsonHeaders(token),
      body: JSON.stringify(formData),
    });
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as Error & {
        status: number;
      };
      error.status = response.status;
      throw error;
    }
    const data = await parseJson(response);
    return data ? convertNodeDataToItem(data) : item;
  },

  async delete(token: string, id: string): Promise<void> {
    const response = await fetch(`${ROOT_URL}/node/${id}?_format=json`, {
      method: 'DELETE',
      headers: jsonHeaders(token),
    });
    if (response.status === 404) {
      return;
    }
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as Error & {
        status: number;
      };
      error.status = response.status;
      throw error;
    }
  },

  async getProfile(token: string, uid: string | number): Promise<UserProfile> {
    const response = await fetch(`${ROOT_URL}/user/${uid}?_format=json`, {
      method: 'GET',
      headers: jsonHeaders(token),
    });
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as Error & {
        status: number;
      };
      error.status = response.status;
      throw error;
    }
    const user = await response.json();
    return {
      currency: user?.field_currency?.[0]?.value || 'MDL',
      geminiApiKey:
        (user?.[AI_KEY_FIELD]?.[0]?.value as string | undefined)?.trim() || '',
    };
  },

  async saveProfile(
    token: string,
    uid: string | number,
    patch: Partial<UserProfile>
  ): Promise<UserProfile> {
    const body: Record<string, unknown> = {};
    if (patch.currency !== undefined) {
      body.field_currency = [patch.currency];
    }
    if (patch.geminiApiKey !== undefined) {
      body[AI_KEY_FIELD] = patch.geminiApiKey
        ? [{ value: patch.geminiApiKey }]
        : [];
    }
    const response = await fetch(`${ROOT_URL}/user/${uid}?_format=json`, {
      method: 'PATCH',
      headers: jsonHeaders(token),
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}`) as Error & {
        status: number;
      };
      error.status = response.status;
      throw error;
    }
    const user = await parseJson(response);
    return {
      currency: user?.field_currency?.[0]?.value || patch.currency || 'MDL',
      geminiApiKey:
        (user?.[AI_KEY_FIELD]?.[0]?.value as string | undefined)?.trim() ||
        patch.geminiApiKey ||
        '',
    };
  },

  async verifyAuth(token: string): Promise<boolean> {
    const response = await fetch(`${ROOT_URL}/jwt/token`, {
      method: 'GET',
      headers: jsonHeaders(token),
    });
    return response.ok;
  },

  isAuthError(status: number): boolean {
    return status === 403;
  },
};
