// IndexedDB utility for caching expense data
import { TransactionOrIncomeItem } from '../type/types';
import { notifyQueueUpdated } from './syncCallbacks';

// Sort function to match TransactionsTable sorting (by date desc, then created desc)
const sortExpenses = (data: TransactionOrIncomeItem[]): TransactionOrIncomeItem[] => {
  return [...data].sort((a, b) => {
    // First, compare by 'dt' (date) - descending
    const dateComparison = new Date(b.dt).getTime() - new Date(a.dt).getTime();
    if (dateComparison !== 0) {
      return dateComparison;
    }
    // If 'dt' values are equal, compare by 'created' - descending
    return (b.cr || 0) - (a.cr || 0);
  });
};

const DB_NAME = 'expenses-db';
const DB_VERSION = 2; // Incremented for new stores
const STORE_NAME = 'expenses';
const QUEUE_STORE_NAME = 'offlineQueue';
const SYNC_METADATA_STORE_NAME = 'syncMetadata';

export interface PendingOperation {
  id: string; // Unique operation ID
  type: 'add' | 'update' | 'delete';
  itemType: 'transaction' | 'incomes';
  itemId?: string; // For update/delete operations
  data?: any; // For add/update operations
  url: string;
  method: string;
  timestamp: number; // When the operation was created
  lastAttempt?: number; // Last sync attempt timestamp
  retryCount?: number;
}

export interface SyncMetadata {
  key: string;
  lastSyncTime: number;
  lastUpdated: number; // Last time any item was updated
}

// Open IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create expenses store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const expensesStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        expensesStore.createIndex('updated', 'cr', { unique: false });
      }
      
      // Create offline queue store
      if (!db.objectStoreNames.contains(QUEUE_STORE_NAME)) {
        const queueStore = db.createObjectStore(QUEUE_STORE_NAME, { keyPath: 'id' });
        queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        queueStore.createIndex('itemId', 'itemId', { unique: false });
      }
      
      // Create sync metadata store
      if (!db.objectStoreNames.contains(SYNC_METADATA_STORE_NAME)) {
        db.createObjectStore(SYNC_METADATA_STORE_NAME, { keyPath: 'key' });
      }
    };
  });
}

// Save expense data to IndexedDB
export async function saveExpensesToDB(
  data: TransactionOrIncomeItem[]
): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // Clear existing data
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Add all items
    const addPromises = data.map(
      (item) =>
        new Promise<void>((resolve, reject) => {
          const request = store.put(item);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        })
    );

    await Promise.all(addPromises);
    transaction.oncomplete = () => db.close();
  } catch (error) {
    console.error('Error saving to IndexedDB:', error);
  }
}

// Get expense data from IndexedDB (sorted consistently)
export async function getExpensesFromDB(): Promise<TransactionOrIncomeItem[] | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        const data = request.result as TransactionOrIncomeItem[];
        transaction.oncomplete = () => db.close();
        // Sort data before returning to match API response order
        const sortedData = data.length > 0 ? sortExpenses(data) : null;
        resolve(sortedData);
      };
      request.onerror = () => {
        transaction.oncomplete = () => db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error reading from IndexedDB:', error);
    return null;
  }
}

// Clear all data from IndexedDB
export async function clearExpensesDB(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Error clearing IndexedDB:', error);
  }
}

// Check if IndexedDB is available
export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== 'undefined';
}

// Individual item operations for offline support
export async function addItemToDB(item: TransactionOrIncomeItem): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Error adding item to IndexedDB:', error);
    throw error;
  }
}

export async function updateItemInDB(item: TransactionOrIncomeItem): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(item);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Error updating item in IndexedDB:', error);
    throw error;
  }
}

export async function setItemFailed(itemId: string, failed: boolean): Promise<void> {
  if (!itemId) return;
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    await new Promise<void>((resolve, reject) => {
      const getRequest = store.get(itemId);
      getRequest.onsuccess = () => {
        const existing = getRequest.result;
        if (!existing) {
          resolve();
          return;
        }
        existing.failed = failed;
        const putRequest = store.put(existing);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
      getRequest.onerror = () => reject(getRequest.error);
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Error updating failed flag:', error);
  }
}

export async function deleteItemFromDB(itemId: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(itemId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('Error deleting item from IndexedDB:', error);
    throw error;
  }
}

export async function getItemFromDB(itemId: string): Promise<TransactionOrIncomeItem | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get(itemId);
      request.onsuccess = () => {
        transaction.oncomplete = () => db.close();
        resolve(request.result || null);
      };
      request.onerror = () => {
        transaction.oncomplete = () => db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting item from IndexedDB:', error);
    return null;
  }
}

// Offline queue operations
export async function addToOfflineQueue(operation: PendingOperation): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(QUEUE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        ...operation,
        timestamp: operation.timestamp || Date.now(),
        retryCount: operation.retryCount || 0,
      });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => {
        db.close();
        notifyQueueUpdated();
      };
    });
  } catch (error) {
    console.error('Error adding to offline queue:', error);
    throw error;
  }
}

export async function getOfflineQueue(): Promise<PendingOperation[]> {
  try {
    const db = await openDB();
    const transaction = db.transaction(QUEUE_STORE_NAME, 'readonly');
    const store = transaction.objectStore(QUEUE_STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        transaction.oncomplete = () => db.close();
        resolve(request.result || []);
      };
      request.onerror = () => {
        transaction.oncomplete = () => db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting offline queue:', error);
    return [];
  }
}

export async function removeFromOfflineQueue(operationId: string): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(QUEUE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.delete(operationId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => {
        db.close();
        notifyQueueUpdated();
      };
    });
  } catch (error) {
    console.error('Error removing from offline queue:', error);
    throw error;
  }
}

export async function updateQueueOperation(operation: PendingOperation): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(QUEUE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE_NAME);
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(operation);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => {
        db.close();
        notifyQueueUpdated();
      };
    });
  } catch (error) {
    console.error('Error updating queue operation:', error);
    throw error;
  }
}

export async function getQueueOperationsByItemId(itemId: string): Promise<PendingOperation[]> {
  if (!itemId) {
    return [];
  }
  try {
    const db = await openDB();
    const transaction = db.transaction(QUEUE_STORE_NAME, 'readonly');
    const store = transaction.objectStore(QUEUE_STORE_NAME);
    const index = store.index('itemId');

    return await new Promise((resolve, reject) => {
      const request = index.getAll(itemId);
      request.onsuccess = () => {
        transaction.oncomplete = () => db.close();
        resolve(request.result || []);
      };
      request.onerror = () => {
        transaction.oncomplete = () => db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting operations by itemId:', error);
    return [];
  }
}

export async function removeQueueOperationsByItemId(itemId: string): Promise<void> {
  if (!itemId) {
    return;
  }
  try {
    const db = await openDB();
    const transaction = db.transaction(QUEUE_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(QUEUE_STORE_NAME);
    const index = store.index('itemId');

    await new Promise<void>((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only(itemId));
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });

    transaction.oncomplete = () => {
      db.close();
      notifyQueueUpdated();
    };
  } catch (error) {
    console.error('Error removing queue operations by itemId:', error);
    throw error;
  }
}

// Sync metadata operations
export async function getSyncMetadata(): Promise<SyncMetadata | null> {
  try {
    const db = await openDB();
    const transaction = db.transaction(SYNC_METADATA_STORE_NAME, 'readonly');
    const store = transaction.objectStore(SYNC_METADATA_STORE_NAME);
    
    return new Promise((resolve, reject) => {
      const request = store.get('main');
      request.onsuccess = () => {
        transaction.oncomplete = () => db.close();
        resolve(request.result || null);
      };
      request.onerror = () => {
        transaction.oncomplete = () => db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error getting sync metadata:', error);
    return null;
  }
}

export async function updateSyncMetadata(metadata: Partial<SyncMetadata>): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(SYNC_METADATA_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(SYNC_METADATA_STORE_NAME);
    
    // Read existing metadata within the same transaction
    const existing = await new Promise<SyncMetadata | null>((resolve, reject) => {
      const request = store.get('main');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    
    const updated: SyncMetadata = {
      key: 'main',
      lastSyncTime: metadata.lastSyncTime ?? existing?.lastSyncTime ?? 0,
      lastUpdated: metadata.lastUpdated ?? existing?.lastUpdated ?? Date.now(),
    };
    
    await new Promise<void>((resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    // Close DB after transaction completes
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      db.close();
    };
  } catch (error) {
    console.error('Error updating sync metadata:', error);
    throw error;
  }
}

