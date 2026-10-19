import { StorageProviderId } from './types';

export const STORAGE_PROVIDER_KEY = 'storageProvider';

export function getStorageProvider(): StorageProviderId {
  const value = localStorage.getItem(STORAGE_PROVIDER_KEY);
  return value === 'drive' ? 'drive' : 'drupal';
}

export function setStorageProvider(id: StorageProviderId): void {
  localStorage.setItem(STORAGE_PROVIDER_KEY, id);
}

export function clearStorageProvider(): void {
  localStorage.removeItem(STORAGE_PROVIDER_KEY);
  localStorage.removeItem('driveFileId');
}
