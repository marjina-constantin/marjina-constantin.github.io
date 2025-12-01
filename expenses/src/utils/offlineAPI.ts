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
import { TransactionOrIncomeItem } from '../type/types';
import { isOnline, generateTempId, scheduleBackgroundSync } from './syncService';

const ROOT_URL = 'https://dev-expenses-api.pantheonsite.io';

// Convert form data to TransactionOrIncomeItem format
function convertFormDataToItem(
  formData: any,
  itemId?: string,
  existingItem?: TransactionOrIncomeItem
): TransactionOrIncomeItem {
  const id = itemId || generateTempId();
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
  const tempId = generateTempId();
  const item = convertFormDataToItem(formData, tempId);
  item.failed = false;

  try {
    // Save to IndexedDB immediately
    await addItemToDB(item);

    // Queue for later sync
    const operation: PendingOperation = {
      id: `add_${tempId}_${Date.now()}`,
      type: 'add',
      itemType: formData.type === 'transaction' ? 'transaction' : 'incomes',
      itemId: tempId,
      data: formData,
      url: `${ROOT_URL}/node?_format=json`,
      method: 'POST',
      timestamp: Date.now(),
    };

    await addToOfflineQueue(operation);

    if (isOnline()) {
      scheduleBackgroundSync(token);
    }

    onSuccess(item);
  } catch (error) {
    console.error('Error adding item offline:', error);
    onError('Failed to add item. Please try again.');
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
        url: `${ROOT_URL}/node/${itemId}?_format=json`,
        method: 'PATCH',
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
    onError('Failed to update item. Please try again.');
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

    if (!hadPendingAdd && !itemId.startsWith('temp_')) {
      // Queue delete only if item exists on server
      const operation: PendingOperation = {
        id: `delete_${itemId}_${Date.now()}`,
        type: 'delete',
        itemType,
        itemId: itemId,
        url: `${ROOT_URL}/node/${itemId}?_format=json`,
        method: 'DELETE',
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
    onError('Failed to delete item. Please try again.');
  }
}

