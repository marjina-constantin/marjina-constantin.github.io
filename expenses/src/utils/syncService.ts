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
} from './indexedDB';
import { TransactionOrIncomeItem } from '../type/types';

const ROOT_URL = 'https://dev-expenses-api.pantheonsite.io';

// Convert NodeData from API to TransactionOrIncomeItem format
function convertNodeDataToItem(nodeData: any): TransactionOrIncomeItem {
  const nid = nodeData.nid?.[0]?.value?.toString() || '';
  const type = nodeData.type?.[0]?.value || '';
  const amount = nodeData.field_amount?.[0]?.value || '0';
  const date = nodeData.field_date?.[0]?.value || '';
  const description = nodeData.field_description?.[0]?.value || '';
  const category = nodeData.field_category?.[0]?.value || '';
  const created = parseInt(nodeData.created?.[0]?.value || '0', 10);
  
  // Extract last updated timestamp - prefer 'upd' (API response), then 'updated', fallback to 'changed' or 'revision_timestamp'
  let updated: number | undefined;
  if (nodeData.upd !== undefined) {
    // API response uses 'upd' for smaller payload
    updated = typeof nodeData.upd === 'number' ? nodeData.upd : parseInt(nodeData.upd, 10);
  } else if (nodeData.updated !== undefined) {
    updated = typeof nodeData.updated === 'number' ? nodeData.updated : parseInt(nodeData.updated, 10);
  } else if (nodeData.updated?.[0]?.value) {
    // NodeData format with nested array
    updated = parseInt(nodeData.updated[0].value, 10);
  } else if (nodeData.changed?.[0]?.value) {
    updated = parseInt(nodeData.changed[0].value, 10);
  } else if (nodeData.revision_timestamp?.[0]?.value) {
    updated = parseInt(nodeData.revision_timestamp[0].value, 10);
  }
  // If no updated timestamp found, use created timestamp as fallback
  if (!updated) {
    updated = created;
  }

  return {
    id: nid,
    type,
    sum: amount,
    dt: date,
    dsc: description,
    cat: category,
    cr: created,
    updated,
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
      // Handle token expiration
      if (response.status === 403) {
        throw new Error('Authentication failed');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error syncing operation:', error);
    return { success: false };
  }
}

// Sync all pending operations
export async function syncPendingOperations(
  token: string,
  onItemSynced?: (itemId: string) => void
): Promise<void> {
  if (!isOnline()) {
    console.log('Offline - skipping sync');
    return;
  }

  const queue = await getOfflineQueue();
  if (queue.length === 0) {
    return;
  }

  console.log(`Syncing ${queue.length} pending operations...`);

  // Sort by timestamp to process in order
  const sortedQueue = [...queue].sort((a, b) => a.timestamp - b.timestamp);

  for (const operation of sortedQueue) {
    try {
      // Pre-check for update operations: compare with server version
      if (operation.type === 'update' && operation.itemId) {
        const localItem = await getItemFromDB(operation.itemId);
        if (!localItem) {
          console.warn(`Local item ${operation.itemId} not found, skipping update`);
          await removeFromOfflineQueue(operation.id);
          continue;
        }

        // Fetch current server version
        const serverItem = await fetchServerItem(operation.itemId, token);
        
        if (serverItem) {
          // Compare timestamps: use updated field, fallback to created
          const localUpdated = localItem.updated || localItem.cr || 0;
          const serverUpdated = serverItem.updated || serverItem.cr || 0;

          if (serverUpdated > localUpdated) {
            // Server version is newer - use server version and skip local update
            console.log(
              `Server version is newer for item ${operation.itemId} ` +
              `(server: ${serverUpdated}, local: ${localUpdated}). ` +
              `Using server version and skipping local update.`
            );
            
            // Update local with server version
            await updateItemInDB(serverItem);
            
            // Notify that item was synced (with server version)
            if (onItemSynced && serverItem.id) {
              onItemSynced(serverItem.id);
            }
            
            // Remove from queue (we've resolved the conflict by using server version)
            await removeFromOfflineQueue(operation.id);
            continue;
          }
          // If local is newer or equal, proceed with the update
        } else {
          // Item doesn't exist on server (might have been deleted)
          // Check if we should still try to update or skip
          console.warn(`Item ${operation.itemId} not found on server, skipping update`);
          await removeFromOfflineQueue(operation.id);
          continue;
        }
      }

      // Proceed with the sync operation
      const result = await syncOperation(operation, token);

      if (result.success) {
        // Handle successful sync based on operation type
        if (operation.type === 'add' && result.data) {
          // Update local item with server ID if it was a temp ID
          if (operation.itemId && operation.itemId.startsWith('temp_')) {
            const nodeData = result.data;
            const newItem = convertNodeDataToItem(nodeData);
            
            // Remove old temp item and add new one with server ID
            await deleteItemFromDB(operation.itemId);
            await addItemToDB(newItem);
            
            // Notify that item was synced
            if (onItemSynced && newItem.id) {
              onItemSynced(newItem.id);
            }
          } else if (onItemSynced && operation.itemId) {
            onItemSynced(operation.itemId);
          }
        } else if (operation.type === 'update' && result.data) {
          // Update local item with server response
          const nodeData = result.data;
          const updatedItem = convertNodeDataToItem(nodeData);
          await updateItemInDB(updatedItem);
          
          // Notify that item was synced
          if (onItemSynced && updatedItem.id) {
            onItemSynced(updatedItem.id);
          }
        } else if (operation.type === 'delete') {
          // Item already deleted locally, just remove from queue
          // No need to notify for deletes
        }

        // Remove from queue on success
        await removeFromOfflineQueue(operation.id);
      } else {
        // Increment retry count
        const updatedOperation = {
          ...operation,
          lastAttempt: Date.now(),
          retryCount: (operation.retryCount || 0) + 1,
        };

        // Remove after too many retries (e.g., 5)
        if (updatedOperation.retryCount >= 5) {
          console.error(`Operation ${operation.id} failed after 5 retries, removing from queue`);
          await removeFromOfflineQueue(operation.id);
        } else {
          await updateQueueOperation(updatedOperation);
        }
      }
    } catch (error) {
      console.error(`Error processing operation ${operation.id}:`, error);
      // Continue with next operation
    }
  }

  // Update sync metadata
  await updateSyncMetadata({ lastSyncTime: Date.now() });
}

// Sync data from server and resolve conflicts
export async function syncWithServer(
  token: string,
  dataDispatch: any,
  onItemSynced?: (itemId: string) => void
): Promise<TransactionOrIncomeItem[]> {
  if (!isOnline()) {
    // Return cached data if offline
    const cachedData = await getExpensesFromDB();
    return cachedData || [];
  }

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
        // API response uses 'upd' for smaller payload, convert to 'updated' for local storage
        const updated = item.upd !== undefined 
          ? (typeof item.upd === 'number' ? item.upd : parseInt(item.upd, 10))
          : (item.updated || item.cr || Date.now());
        
        return {
          ...item,
          updated, // Store as 'updated' locally, but read from 'upd' in API response
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

    // Update sync metadata
    await updateSyncMetadata({
      lastSyncTime: Date.now(),
      lastUpdated: Date.now(),
    });

    return mergedData;
  } catch (error) {
    console.error('Error syncing with server:', error);
    // Return cached data on error
    const cachedData = await getExpensesFromDB();
    return cachedData || [];
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

  // Get pending delete operations
  const queue = await getOfflineQueue();
  const pendingDeletes = new Set(
    queue.filter(op => op.type === 'delete').map(op => op.itemId)
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
      // Only local - check if it's pending delete
      if (!pendingDeletes.has(id)) {
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
export function setupNetworkListener(
  token: string,
  dataDispatch: any,
  onSyncStart?: () => void,
  onSyncFinish?: (success: boolean) => void,
  onItemSynced?: (itemId: string) => void
): () => void {
  const handleOnline = async () => {
    console.log('Network online - starting sync...');
    if (onSyncStart) onSyncStart();
    try {
      await syncPendingOperations(token, onItemSynced);
      await syncWithServer(token, dataDispatch, onItemSynced);
      if (onSyncFinish) onSyncFinish(true);
    } catch (error) {
      console.error('Error syncing after coming online:', error);
      if (onSyncFinish) onSyncFinish(false);
    }
  };

  window.addEventListener('online', handleOnline);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}

