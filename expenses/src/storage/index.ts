import { driveAdapter } from './drive';
import { drupalAdapter } from './drupal';
import { getStorageProvider } from './provider';
import { StorageAdapter, StorageProviderId } from './types';

export {
  getStorageProvider,
  setStorageProvider,
  clearStorageProvider,
} from './provider';
export type {
  StorageAdapter,
  StorageProviderId,
  LoginResult,
  UserProfile,
} from './types';

export function getAdapter(id?: StorageProviderId): StorageAdapter {
  return (id || getStorageProvider()) === 'drive'
    ? driveAdapter
    : drupalAdapter;
}
