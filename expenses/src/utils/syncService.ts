import {
  addToOfflineQueue,
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
  getSyncMetadata,
  PendingOperation,
  setItemFailed,
} from './indexedDB';
import { TransactionOrIncomeItem } from '../type/types';
import { processData, dispatchProcessedData } from './dataProcessing';
import { notifyItemSynced, notifySyncFinish, notifySyncStart } from './syncCallbacks';

const ROOT_URL = 'https://dev-expenses-api.pantheonsite.io';
const SYNC_YIELD_BATCH = 5;

let syncQueue: Promise<void> = Promise.resolve();
let backgroundSyncHandle: number | null = null;
let backgroundSyncToken: string | null = null;

const yieldToMainThread = () =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, 0);
  });

const parseTimestamp = (value: any): number | undefined => {
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

// Convert API payload (list or single node) to TransactionOrIncomeItem
function convertNodeDataToItem(nodeData: any): TransactionOrIncomeItem {

  // Determine ID (handles new simplified format and legacy node payload)
  const id =
    (nodeData.id !== undefined ? nodeData.id : undefined)?.toString() ||
    nodeData.nid?.[0]?.value?.toString() ||
    '';

  // Determine type
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

// Check if network is available
export function isOnline(): boolean {
  return navigator.onLine;
}

// Generate a temporary ID for new items created offline
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Fetch current server version of an item
async function fetchServerItem(
  itemId: string,
  token: string
): Promise<TransactionOrIncomeItem | null> {
  try {
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'JWT-Authorization': `Bearer ${token}`,
      }),
    };

    const response = await fetch(
      `${ROOT_URL}/node/${itemId}?_format=json`,
      fetchOptions
    );

    if (!response.ok) {
      if (response.status === 404) {
        // Item doesn't exist on server (might have been deleted)
        return null;
      }
      if (response.status === 403) {
        throw new Error('Authentication failed');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const nodeData = await response.json();
    return convertNodeDataToItem(nodeData);
  } catch (error) {
    console.error('Error fetching server item:', error);
    return null;
  }
}

// Sync a single pending operation
async function syncOperation(
  operation: PendingOperation,
  token: string
): Promise<{ success: boolean; data?: any; newId?: string }> {
  try {
    const fetchOptions: RequestInit = {
      method: operation.method,
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'JWT-Authorization': `Bearer ${token}`,
      }),
    };

    if (operation.data && operation.method !== 'DELETE') {
      fetchOptions.body = JSON.stringify(operation.data);
    }

    const response = await fetch(operation.url, fetchOptions);

    if (!response.ok) {
      // Treat missing remote resource for delete as success (already removed)
      if (operation.type === 'delete' && response.status === 404) {
        return { success: true };
      }
      // Handle token expiration
      if (response.status === 403) {
        throw new Error('Authentication failed');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let data: any = null;
    if (response.status !== 204) {
      try {
        data = await response.json();
      } catch (error) {
        console.warn('No JSON payload returned for operation', operation.id, error);
      }
    }
    return { success: true, data };
  } catch (error) {
    console.error('Error syncing operation:', error);
    return { success: false };
  }
}

// Sync all pending operations
export function syncPendingOperations(
  token: string,
  onItemSynced?: (itemId: string) => void
): Promise<void> {
  syncQueue = syncQueue.catch(() => {}).then(() =>
    processPendingOperations(token, onItemSynced)
  );
  return syncQueue;
}

async function processPendingOperations(
  token: string,
  onItemSynced?: (itemId: string) => void
) {
  if (!isOnline()) {
    console.log('Offline - skipping sync');
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
            console.warn(`Local item ${operation.itemId} not found, skipping update`);
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

          if (operation.type === 'add' && result.data) {
            if (operation.itemId && operation.itemId.startsWith('temp_')) {
              const nodeData = result.data;
              const newItem = convertNodeDataToItem(nodeData);

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
          } else if (operation.type === 'update' && result.data) {
            const nodeData = result.data;
            const updatedItem = convertNodeDataToItem(nodeData);
            await updateItemInDB(updatedItem);

            if (updatedItem.id) {
              onItemSynced?.(updatedItem.id);
              notifyItemSynced(updatedItem.id);
            }
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
        console.error(`Error processing operation ${operation.id}:`, error);
      }

      if (processedCount % SYNC_YIELD_BATCH === 0) {
        await yieldToMainThread();
      }
    }

    await updateSyncMetadata({ lastSyncTime: Date.now() });
  } catch (error) {
    encounteredError = true;
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
    const fetchOptions = {
      method: 'GET',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'JWT-Authorization': `Bearer ${token}`,
      }),
    };

    const response = await fetch(
      `${ROOT_URL}/api/expenses`,
      fetchOptions
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Authentication failed');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    let serverData: any[] = await response.json();
    
    // Convert API response to TransactionOrIncomeItem format
    // Handle both NodeData format (with nested arrays) and simplified format
    const convertedData: TransactionOrIncomeItem[] = serverData.map((item: any) => {
      // If already in TransactionOrIncomeItem format (has 'id' and 'dt' directly)
      if (item.id && item.dt && !item.nid) {
        const created =
          parseTimestamp(item.cr ?? item.created) ?? Date.now();
        const updated =
          parseTimestamp(item.upd ?? item.updated) ?? created;

        return {
          ...item,
          cr: created,
          updated,
          failed: !!item.failed,
        };
      }
      // Otherwise, convert from NodeData format
      return convertNodeDataToItem(item);
    });
    
    const localData = await getExpensesFromDB();

    // Resolve conflicts: last updated wins
    const mergedData = await resolveConflicts(localData || [], convertedData);

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
    console.error('Error syncing with server:', error);
    // Return cached data on error
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
  const localMap = new Map(localData.map(item => [item.id, item]));
  const serverMap = new Map(serverData.map(item => [item.id, item]));
  const merged: TransactionOrIncomeItem[] = [];

  // Inspect pending queue to understand local-only items
  const queue = await getOfflineQueue();
  const pendingDeletes = new Set(
    queue.filter(op => op.type === 'delete').map(op => op.itemId)
  );
  const pendingAdds = new Set(
    queue.filter(op => op.type === 'add').map(op => op.itemId)
  );

  // Process all items from both sources
  const allIds = new Set([...localMap.keys(), ...serverMap.keys()]);

  for (const id of allIds) {
    const localItem = localMap.get(id);
    const serverItem = serverMap.get(id);

    if (!localItem) {
      // Only on server - add it
      if (serverItem) merged.push(serverItem);
    } else if (!serverItem) {
      const isTempId = id?.startsWith('temp_');
      const hasPendingAdd = pendingAdds.has(id);

      // Only keep local-only entries if they're still queued for creation
      if ((isTempId || hasPendingAdd) && !pendingDeletes.has(id)) {
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

  return merged;
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
export async function initializeSync(token: string, dataDispatch: any): Promise<void> {
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
      console.error('Error syncing after coming online:', error);
    }
  };

  window.addEventListener('online', handleOnline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

