import {
  addToOfflineQueue,
  addItemToDB,
  updateItemInDB,
  deleteItemFromDB,
  PendingOperation,
  getQueueOperationsByItemId,
  removeQueueOperationsByItemId,
  updateQueueOperation,
} from './indexedDB';
import { TransactionOrIncomeItem } from '../types/types';
import {
  isOnline,
  generateTempId,
  scheduleBackgroundSync,
} from './syncService';
import { getAdapter, getStorageProvider } from '../storage';

function newItemId(): string {
  if (
    getStorageProvider() === 'drive' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID();
  }
  return generateTempId();
}

// Convert form data to TransactionOrIncomeItem format
function convertFormDataToItem(
  formData: any,
  itemId?: string,
  existingItem?: TransactionOrIncomeItem
): TransactionOrIncomeItem {
  const id = itemId || newItemId();
  const type = formData.type;
  const amount = Array.isArray(formData.field_amount)
    ? formData.field_amount[0]
    : formData.field_amount;
  const date = Array.isArray(formData.field_date)
    ? formData.field_date[0]
    : formData.field_date;
  const description = Array.isArray(formData.field_description)
    ? formData.field_description[0]
    : formData.field_description || '';
  const category = Array.isArray(formData.field_category)
    ? formData.field_category[0]
    : formData.field_category || '';
  const now = Date.now();
  const created = existingItem?.cr || now;
  // Set updated timestamp to current time for offline changes
  const updated = now;
  const failed = existingItem?.failed || false;

  return {
    id,
    type,
    sum: amount.toString(),
    dt: date,
    dsc: description,
    cat: category,
    cr: created,
    updated,
    failed,
  };
}

// Add transaction or income (offline-first)
export async function addItemOffline(
  formData: any,
  token: string,
  onSuccess: (item: TransactionOrIncomeItem) => void,
  onError: (error: string) => void
): Promise<void> {
  const item = convertFormDataToItem(formData);
  item.failed = false;

  try {
    // Save to IndexedDB immediately
    await addItemToDB(item);

    // Queue for later sync
    const operation: PendingOperation = {
      id: `add_${item.id}_${Date.now()}`,
      type: 'add',
      itemType: formData.type === 'transaction' ? 'transaction' : 'incomes',
      itemId: item.id,
      data: formData,
      timestamp: Date.now(),
    };

    await addToOfflineQueue(operation);

    if (isOnline()) {
      scheduleBackgroundSync(token);
    }

    onSuccess(item);
  } catch (error) {
    console.error('Error adding item offline:', error);
    onError("Couldn't add this item. Try again.");
  }
}

// Update transaction or income (offline-first)
export async function updateItemOffline(
  formData: any,
  itemId: string,
  token: string,
  existingItem: TransactionOrIncomeItem,
  onSuccess: (item: TransactionOrIncomeItem) => void,
  onError: (error: string) => void
): Promise<void> {
  const updatedItem = convertFormDataToItem(formData, itemId, existingItem);
  // Preserve original created timestamp, but update the item
  updatedItem.cr = existingItem.cr;
  updatedItem.failed = false;

  try {
    // Update in IndexedDB immediately
    await updateItemInDB(updatedItem);

    // Check existing queue operations for this item to avoid duplicates
    const existingOperations = await getQueueOperationsByItemId(itemId);
    const pendingAdd = existingOperations.find((op) => op.type === 'add');
    const pendingUpdate = existingOperations.find((op) => op.type === 'update');

    if (pendingAdd) {
      const updatedOperation = {
        ...pendingAdd,
        data: formData,
        timestamp: Date.now(),
      };
      await updateQueueOperation(updatedOperation);
    } else if (pendingUpdate) {
      const updatedOperation = {
        ...pendingUpdate,
        data: formData,
        timestamp: Date.now(),
      };
      await updateQueueOperation(updatedOperation);
    } else {
      // Queue for later sync
      const operation: PendingOperation = {
        id: `update_${itemId}_${Date.now()}`,
        type: 'update',
        itemType: formData.type === 'transaction' ? 'transaction' : 'incomes',
        itemId: itemId,
        data: formData,
        timestamp: Date.now(),
      };

      await addToOfflineQueue(operation);
    }

    if (isOnline()) {
      scheduleBackgroundSync(token);
    }

    onSuccess(updatedItem);
  } catch (error) {
    console.error('Error updating item offline:', error);
    onError("Couldn't update this item. Try again.");
  }
}

// Delete transaction or income (offline-first)
export async function deleteItemOffline(
  itemId: string,
  itemType: 'transaction' | 'incomes',
  token: string,
  onSuccess: () => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    // Delete from IndexedDB immediately
    await deleteItemFromDB(itemId);

    const existingOperations = await getQueueOperationsByItemId(itemId);
    const hadPendingAdd = existingOperations.some((op) => op.type === 'add');

    if (existingOperations.length) {
      await removeQueueOperationsByItemId(itemId);
    }

    const existsRemotely =
      getAdapter().mode === 'snapshot' || !itemId.startsWith('temp_');
    if (!hadPendingAdd && existsRemotely) {
      // Queue delete only if the item may already exist remotely. Drupal temp
      // ids are local-only until sync; Drive snapshot ids are already the
      // remote key, even if an older row still has a temp_ prefix.
      const operation: PendingOperation = {
        id: `delete_${itemId}_${Date.now()}`,
        type: 'delete',
        itemType,
        itemId: itemId,
        timestamp: Date.now(),
      };

      await addToOfflineQueue(operation);
      if (isOnline()) {
        scheduleBackgroundSync(token);
      }
    }

    onSuccess();
  } catch (error) {
    console.error('Error deleting item offline:', error);
    onError("Couldn't delete this item. Try again.");
  }
}
