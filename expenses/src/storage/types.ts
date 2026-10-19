import { TransactionOrIncomeItem } from '../types/types';

export type StorageProviderId = 'drupal' | 'drive';

export interface StorageUser {
  uid: string | number;
  name: string;
  email?: string;
  currency?: string;
}

export interface LoginResult {
  jwt_token: string;
  current_user: StorageUser;
}

export interface UserProfile {
  currency: string;
  geminiApiKey?: string;
}

export interface StorageAdapter {
  id: StorageProviderId;
  /** Snapshot adapters persist the whole local list, not each queued HTTP call. */
  mode: 'per-item' | 'snapshot';
  login(googleAccessToken: string): Promise<LoginResult>;
  fetchAll(token: string): Promise<TransactionOrIncomeItem[]>;
  fetchOne(token: string, id: string): Promise<TransactionOrIncomeItem | null>;
  create(
    token: string,
    item: TransactionOrIncomeItem,
    formData: unknown
  ): Promise<TransactionOrIncomeItem>;
  update(
    token: string,
    item: TransactionOrIncomeItem,
    formData: unknown
  ): Promise<TransactionOrIncomeItem>;
  delete(token: string, id: string): Promise<void>;
  saveAll?(token: string, items: TransactionOrIncomeItem[]): Promise<void>;
  getProfile(token: string, uid: string | number): Promise<UserProfile>;
  saveProfile(
    token: string,
    uid: string | number,
    patch: Partial<UserProfile>
  ): Promise<UserProfile>;
  verifyAuth(token: string): Promise<boolean>;
  isAuthError(status: number): boolean;
}
