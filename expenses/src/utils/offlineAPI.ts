import {
  addToOfflineQueue,
  addItemToDB,
  updateItemInDB,
  deleteItemFromDB,
  PendingOperation,
} from './indexedDB';
import { TransactionOrIncomeItem } from '../type/types';
import { isOnline, generateTempId } from './syncService';

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

  return {
    id,
    type,
    sum: amount.toString(),
    dt: date,
    dsc: description,
    cat: category,
    cr: created,
    updated,
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

  try {
    // Save to IndexedDB immediately
    await addItemToDB(item);

    if (isOnline()) {
      // Try to sync immediately if online
      try {
        const fetchOptions: RequestInit = {
          method: 'POST',
          headers: new Headers({
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'JWT-Authorization': `Bearer ${token}`,
          }),
          body: JSON.stringify(formData),
        };

        const response = await fetch(
          `${ROOT_URL}/node?_format=json`,
          fetchOptions
        );

        if (response.ok) {
          const nodeData = await response.json();
          const serverItem = convertNodeDataToItem(nodeData);
          
          // Replace temp item with server item
          await deleteItemFromDB(tempId);
          await addItemToDB(serverItem);
          
          onSuccess(serverItem);
          return;
        }
      } catch (error) {
        console.warn('Online add failed, queueing for later:', error);
      }
    }

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

  try {
    // Update in IndexedDB immediately
    await updateItemInDB(updatedItem);

    if (isOnline()) {
      // Try to sync immediately if online
      try {
        const fetchOptions: RequestInit = {
          method: 'PATCH',
          headers: new Headers({
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'JWT-Authorization': `Bearer ${token}`,
          }),
          body: JSON.stringify(formData),
        };

        const response = await fetch(
          `${ROOT_URL}/node/${itemId}?_format=json`,
          fetchOptions
        );

        if (response.ok) {
          const nodeData = await response.json();
          const serverItem = convertNodeDataToItem(nodeData);
          
          // Update with server response
          await updateItemInDB(serverItem);
          
          onSuccess(serverItem);
          return;
        }
      } catch (error) {
        console.warn('Online update failed, queueing for later:', error);
      }
    }

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

    if (isOnline()) {
      // Try to sync immediately if online
      try {
        const fetchOptions: RequestInit = {
          method: 'DELETE',
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

        if (response.ok) {
          onSuccess();
          return;
        }
      } catch (error) {
        console.warn('Online delete failed, queueing for later:', error);
      }
    }

    // Queue for later sync
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
    onSuccess();
  } catch (error) {
    console.error('Error deleting item offline:', error);
    onError('Failed to delete item. Please try again.');
  }
}

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

