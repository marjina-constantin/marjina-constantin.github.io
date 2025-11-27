// IndexedDB utility for caching expense data
import { TransactionOrIncomeItem } from '../type/types';

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
const DB_VERSION = 1;
const STORE_NAME = 'expenses';

// Open IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
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

