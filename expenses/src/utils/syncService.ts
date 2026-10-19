import {
  getOfflineQueue,
  removeFromOfflineQueue,
  updateQueueOperation,
  addItemToDB,
  updateItemInDB,
  deleteItemFromDB,
  getItemFromDB,
  saveExpensesToDB,
  getExpensesFromDB,
  updateSyncMetadata,
  PendingOperation,
  setItemFailed,
} from './indexedDB';
import { TransactionOrIncomeItem } from '../types/types';
import { processData, dispatchProcessedData } from './dataProcessing';
import {
  notifyItemSynced,
  notifySyncFinish,
  notifySyncStart,
} from './syncCallbacks';
import { checkAndHandleAuthError } from './authErrorHandler';
import { getAdapter } from '../storage';

// Custom error class for authentication failures
export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}
const SYNC_YIELD_BATCH = 5;

let syncQueue: Promise<void> = Promise.resolve();
let backgroundSyncHandle: number | null = null;
let backgroundSyncToken: string | null = null;

const yieldToMainThread = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

const httpStatus = (error: unknown): number | undefined => {
  if (typeof error === 'object' && error && 'status' in error) {
    return (error as { status: number }).status;
  }
  return undefined;
};

async function handleAdapterAuthError(
  status?: number,
  token?: string
): Promise<void> {
  if (status === undefined) {
    return;
  }
  const adapter = getAdapter();
  if (!adapter.isAuthError(status)) {
    return;
  }
  const loggedOut = await checkAndHandleAuthError(
    { status },
    token
      ? {
          headers: new Headers({
            'JWT-Authorization': `Bearer ${token}`,
            Authorization: `Bearer ${token}`,
          }),
        }
      : undefined
  );
  if (loggedOut) {
    throw new AuthenticationError('Authentication failed - user logged out');
  }
  throw new AuthenticationError('Authentication failed');
}

// Check if network is available
export function isOnline(): boolean {
  return navigator.onLine;
}

// Generate a temporary ID for new items created offline
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function fetchServerItem(
  itemId: string,
  token: string
): Promise<TransactionOrIncomeItem | null> {
  try {
    return await getAdapter().fetchOne(token, itemId);
  } catch (error) {
    await handleAdapterAuthError(httpStatus(error), token);
    console.error('Error fetching server item:', error);
    return null;
  }
}

async function syncOperation(
  operation: PendingOperation,
  token: string
): Promise<{ success: boolean; item?: TransactionOrIncomeItem }> {
  const adapter = getAdapter();
  try {
    if (operation.type === 'delete') {
      if (operation.itemId) {
        await adapter.delete(token, operation.itemId);
      }
      return { success: true };
    }

    const localItem = operation.itemId
      ? await getItemFromDB(operation.itemId)
      : null;

    if (operation.type === 'add') {
      const created = await adapter.create(
        token,
        localItem || ({} as TransactionOrIncomeItem),
        operation.data
      );
      return { success: true, item: created };
    }

    if (!localItem) {
      return { success: true };
    }
    const updated = await adapter.update(token, localItem, operation.data);
    return { success: true, item: updated };
  } catch (error) {
    await handleAdapterAuthError(httpStatus(error), token);
    console.error('Error syncing operation:', error);
    return { success: false };
  }
}

// Sync all pending operations
export function syncPendingOperations(
  token: string,
  onItemSynced?: (itemId: string) => void
): Promise<void> {
  syncQueue = syncQueue
    .catch(() => {})
    .then(() => processPendingOperations(token, onItemSynced));
  return syncQueue;
}

async function processSnapshotQueue(
  token: string,
  onItemSynced?: (itemId: string) => void
) {
  const adapter = getAdapter();
  if (!adapter.saveAll) {
    return;
  }

  const queue = await getOfflineQueue();
  if (queue.length === 0) {
    return;
  }

  notifySyncStart();
  let success = false;
  try {
    const localData = (await getExpensesFromDB()) || [];
    const remoteData = await adapter.fetchAll(token);
    const merged = await resolveConflicts(localData, remoteData);
    await adapter.saveAll(token, merged);
    await saveExpensesToDB(merged);

    for (const operation of queue) {
      if (operation.itemId) {
        onItemSynced?.(operation.itemId);
        notifyItemSynced(operation.itemId);
      }
      await removeFromOfflineQueue(operation.id);
    }
    await updateSyncMetadata({ lastSyncTime: Date.now() });
    success = true;
  } catch (error) {
    await handleAdapterAuthError(httpStatus(error), token);
    throw error;
  } finally {
    notifySyncFinish(success);
  }
}

async function processPendingOperations(
  token: string,
  onItemSynced?: (itemId: string) => void
) {
  if (!isOnline()) {
    console.log('Offline - skipping sync');
    return;
  }

  if (getAdapter().mode === 'snapshot') {
    await processSnapshotQueue(token, onItemSynced);
    return;
  }

  const queue = await getOfflineQueue();
  if (queue.length === 0) {
    return;
  }

  notifySyncStart();
  console.log(`Syncing ${queue.length} pending operations...`);

  let processedAny = false;
  let encounteredError = false;

  try {
    // Sort by timestamp to process in order
    const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);

    let processedCount = 0;

    for (const operation of sortedQueue) {
      processedCount += 1;

      try {
        // Pre-check for update operations: compare with server version
        if (operation.type === 'update' && operation.itemId) {
          const localItem = await getItemFromDB(operation.itemId);
          if (!localItem) {
            console.warn(
              `Local item ${operation.itemId} not found, skipping update`
            );
            await removeFromOfflineQueue(operation.id);
            processedAny = true;
            continue;
          }

          // Fetch current server version
          const serverItem = await fetchServerItem(operation.itemId, token);

          if (serverItem) {
            // Compare timestamps: use updated field, fallback to created
            const localUpdated = localItem.updated || localItem.cr || 0;
            const serverUpdated = serverItem.updated || serverItem.cr || 0;

            if (serverUpdated > localUpdated) {
              console.log(
                `Server version is newer for item ${operation.itemId} ` +
                  `(server: ${serverUpdated}, local: ${localUpdated}). ` +
                  `Using server version and skipping local update.`
              );

              await updateItemInDB(serverItem);

              if (serverItem.id) {
                onItemSynced?.(serverItem.id);
                notifyItemSynced(serverItem.id);
              }

              await removeFromOfflineQueue(operation.id);
              processedAny = true;
              continue;
            }
            // If local is newer or equal, proceed with the update
          } else {
            console.warn(
              `Item ${operation.itemId} not found on server, deleting locally to stay in sync`
            );
            await deleteItemFromDB(operation.itemId);
            await removeFromOfflineQueue(operation.id);
            processedAny = true;
            continue;
          }
        }

        // Proceed with the sync operation
        const result = await syncOperation(operation, token);

        if (result.success) {
          processedAny = true;

          if (operation.type === 'add' && result.item) {
            if (operation.itemId && operation.itemId.startsWith('temp_')) {
              const newItem = result.item;
              await deleteItemFromDB(operation.itemId);
              await addItemToDB(newItem);

              if (newItem.id) {
                onItemSynced?.(newItem.id);
                notifyItemSynced(newItem.id);
              }
            } else if (operation.itemId) {
              onItemSynced?.(operation.itemId);
              notifyItemSynced(operation.itemId);
            }
          } else if (operation.type === 'update' && result.item) {
            const updatedItem = result.item;
            await updateItemInDB(updatedItem);

            if (updatedItem.id) {
              onItemSynced?.(updatedItem.id);
              notifyItemSynced(updatedItem.id);
            }
          } else if (operation.type === 'delete' && operation.itemId) {
            onItemSynced?.(operation.itemId);
            notifyItemSynced(operation.itemId);
          }

          await removeFromOfflineQueue(operation.id);
        } else {
          encounteredError = true;
          const updatedOperation = {
            ...operation,
            lastAttempt: Date.now(),
            retryCount: (operation.retryCount || 0) + 1,
          };

          if (updatedOperation.retryCount >= 50) {
            console.error(
              `Operation ${operation.id} failed after 50 retries, removing from queue`
            );
            if (
              operation.itemId &&
              (operation.type === 'add' || operation.type === 'update')
            ) {
              await setItemFailed(operation.itemId, true);
            }
            await removeFromOfflineQueue(operation.id);
          } else {
            await updateQueueOperation(updatedOperation);
          }
        }
      } catch (error) {
        encounteredError = true;
        // If it's an authentication error, re-throw it to stop processing
        if (error instanceof AuthenticationError) {
          throw error;
        }
        console.error(`Error processing operation ${operation.id}:`, error);
      }

      if (processedCount % SYNC_YIELD_BATCH === 0) {
        await yieldToMainThread();
      }
    }

    await updateSyncMetadata({ lastSyncTime: Date.now() });
  } catch (error) {
    encounteredError = true;
    // Re-throw authentication errors so they can be handled by callers
    if (error instanceof AuthenticationError) {
      throw error;
    }
    throw error;
  } finally {
    notifySyncFinish(processedAny && !encounteredError);
  }
}

// Sync data from server and resolve conflicts
export async function syncWithServer(
  token: string,
  dataDispatch: any,
  category: string = '',
  textFilter: string = ''
): Promise<TransactionOrIncomeItem[]> {
  if (!isOnline()) {
    // Return cached data if offline
    const cachedData = await getExpensesFromDB();
    return cachedData || [];
  }

  notifySyncStart();
  let success = false;

  try {
    const adapter = getAdapter();
    const convertedData = await adapter.fetchAll(token);
    const localData = await getExpensesFromDB();

    // Resolve conflicts: last updated wins
    const mergedData = await resolveConflicts(localData || [], convertedData);

    if (adapter.saveAll) {
      await adapter.saveAll(token, mergedData);
    }

    // Save merged data
    await saveExpensesToDB(mergedData);

    if (dataDispatch) {
      processData(mergedData, (processed) => {
        dispatchProcessedData(
          mergedData,
          processed,
          dataDispatch,
          category,
          textFilter
        );
      });
    }

    // Update sync metadata
    await updateSyncMetadata({
      lastSyncTime: Date.now(),
      lastUpdated: Date.now(),
    });

    success = true;
    return mergedData;
  } catch (error) {
    // Re-throw authentication errors so they can be handled by callers
    if (error instanceof AuthenticationError) {
      throw error;
    }
    await handleAdapterAuthError(httpStatus(error), token);
    console.error('Error syncing with server:', error);
    // Return cached data on error (but not for auth errors)
    const cachedData = await getExpensesFromDB();
    return cachedData || [];
  } finally {
    notifySyncFinish(success);
  }
}

// Resolve conflicts: last updated wins
async function resolveConflicts(
  localData: TransactionOrIncomeItem[],
  serverData: TransactionOrIncomeItem[]
): Promise<TransactionOrIncomeItem[]> {
  const localMap = new Map(localData.map((item) => [item.id, item]));
  const serverMap = new Map(serverData.map((item) => [item.id, item]));
  const merged: TransactionOrIncomeItem[] = [];

  // Inspect pending queue to understand local-only items
  const queue = await getOfflineQueue();
  const pendingDeletes = new Set(
    queue.filter((op) => op.type === 'delete').map((op) => op.itemId)
  );
  const pendingAdds = new Set(
    queue.filter((op) => op.type === 'add').map((op) => op.itemId)
  );

  // Process all items from both sources
  const allIds = new Set([...localMap.keys(), ...serverMap.keys()]);

  for (const id of allIds) {
    const localItem = localMap.get(id);
    const serverItem = serverMap.get(id);

    if (!localItem) {
      if (serverItem && !pendingDeletes.has(id)) merged.push(serverItem);
    } else if (!serverItem) {
      const isTempId = id?.startsWith('temp_');
      const hasPendingAdd = pendingAdds.has(id);
      const keepLocalOnly =
        getAdapter().mode === 'snapshot' || isTempId || hasPendingAdd;

      if (keepLocalOnly && !pendingDeletes.has(id)) {
        merged.push(localItem);
      }
    } else {
      // Both exist - last updated wins (use updated timestamp, fallback to created)
      const localUpdated = localItem.updated || localItem.cr || 0;
      const serverUpdated = serverItem.updated || serverItem.cr || 0;

      if (serverUpdated >= localUpdated) {
        merged.push(serverItem);
      } else {
        merged.push(localItem);
      }
    }
  }

  // Sort merged data by date (descending) to maintain consistent ordering
  // This ensures calculations that rely on array order (like averageIncome) work correctly
  return merged.sort((a, b) => {
    const dateComparison = new Date(b.dt).getTime() - new Date(a.dt).getTime();
    if (dateComparison !== 0) {
      return dateComparison;
    }
    return (b.cr || 0) - (a.cr || 0);
  });
}

export function scheduleBackgroundSync(token: string) {
  if (!isOnline()) {
    return;
  }

  backgroundSyncToken = token;

  if (backgroundSyncHandle !== null) {
    return;
  }

  const execute = () => {
    backgroundSyncHandle = null;
    if (!backgroundSyncToken) {
      return;
    }

    syncPendingOperations(backgroundSyncToken).catch((error) => {
      // Authentication errors are already handled (user logged out)
      if (error instanceof AuthenticationError) {
        console.warn('Background sync stopped due to authentication error');
        return;
      }
      console.error('Background sync failed', error);
    });
  };

  if (typeof window !== 'undefined') {
    const idle = (window as any).requestIdleCallback;
    if (typeof idle === 'function') {
      backgroundSyncHandle = idle(execute);
      return;
    }
    backgroundSyncHandle = window.setTimeout(execute, 50);
  } else {
    setTimeout(execute, 50);
  }
}

// Initialize sync on app start
export async function initializeSync(
  token: string,
  dataDispatch: any
): Promise<void> {
  // Load cached data immediately
  const cachedData = await getExpensesFromDB();
  if (cachedData && cachedData.length > 0) {
    // Dispatch cached data for instant display
    // This will be handled by the existing fetchData logic
  }

  // Sync if online
  if (isOnline()) {
    try {
      // First sync pending operations
      await syncPendingOperations(token);

      // Then sync data from server
      await syncWithServer(token, dataDispatch);
    } catch (error) {
      // Authentication errors are already handled (user logged out)
      if (error instanceof AuthenticationError) {
        console.warn('Initial sync stopped due to authentication error');
        return;
      }
      console.error('Error during initial sync:', error);
    }
  }
}

// Listen for online/offline events and trigger sync
interface FilterSnapshot {
  category?: string;
  textFilter?: string;
}

export function setupNetworkListener(
  token: string,
  dataDispatch: any,
  getFilters?: () => FilterSnapshot
): () => void {
  const handleOnline = async () => {
    console.log('Network online - starting sync...');
    try {
      await syncPendingOperations(token);
      const filters = getFilters?.() || {};
      await syncWithServer(
        token,
        dataDispatch,
        filters.category || '',
        filters.textFilter || ''
      );
    } catch (error) {
      // Authentication errors are already handled (user logged out)
      if (error instanceof AuthenticationError) {
        console.warn(
          'Sync after coming online stopped due to authentication error'
        );
        return;
      }
      console.error('Error syncing after coming online:', error);
    }
  };

  window.addEventListener('online', handleOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
