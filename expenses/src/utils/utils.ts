import { categories, monthNames } from './constants';
import { logout } from '../context';
import {
  DataStructure,
  ItemTotal,
  TransactionOrIncomeItem,
} from '../type/types';
import {
  getExpensesFromDB,
  saveExpensesToDB,
  isIndexedDBAvailable,
} from './indexedDB';
import { processData, dispatchProcessedData } from './dataProcessing';

const handleErrors = (
  response: Response,
  options: RequestInit,
  dataDispatch: any,
  dispatch: any
) => {
  if (!response.ok) {
    fetch('https://dev-expenses-api.pantheonsite.io/jwt/token', options).then(
      (response) => {
        if (response.status === 403) {
          logout(dispatch, dataDispatch);
        }
      }
    );
    return response.statusText;
  }
  return response.json();
};

export const formatDataForChart = (data: DataStructure) => {
  const seriesData = [];

  for (const year in data) {
    const yearSeries = {
      name: year,
      data: [],
    };

    for (const month of monthNames) {
      if (data[year][`${month} ${year}`]) {
        const monthValue = data[year][`${month} ${year}`];
        // @ts-expect-error TBD
        yearSeries.data.push([month, monthValue]);
      }
    }

    if (yearSeries.data.length > 0) {
      seriesData.push(yearSeries);
    }
  }

  return seriesData;
};

export const fetchRequest = (
  url: string,
  options: RequestInit,
  dataDispatch: any,
  dispatch: any,
  callback: any
) => {
  fetch(url, options)
    .then((response) => handleErrors(response, options, dataDispatch, dispatch))
    .then((response) => callback(response))
    .catch((error) => console.log(error));
};

export const deleteNode = async (nid: string, token: string, callback: any) => {
  // Import offline API dynamically to avoid circular dependencies
  const { deleteItemOffline } = await import('./offlineAPI');
  const { getItemFromDB } = await import('./indexedDB');
  
  // Get item to determine type
  const item = await getItemFromDB(nid);
  const itemType = item?.type === 'transaction' ? 'transaction' : 'incomes';
  
  await deleteItemOffline(
    nid,
    itemType,
    token,
    () => {
      // Success callback - return a mock Response object for compatibility
      callback({
        ok: true,
        status: 200,
        statusText: 'OK',
      });
    },
    (error: string) => {
      // Error callback - return a mock Response object for compatibility
      callback({
        ok: false,
        status: 500,
        statusText: error,
      });
    }
  );
};

export const fetchData = async (
  token: string,
  dataDispatch: any,
  dispatch: any,
  category: string = '',
  textFilter: string = ''
) => {
  // Try to load from IndexedDB first for instant display
  if (isIndexedDBAvailable()) {
    const cachedData = await getExpensesFromDB();
    if (cachedData && cachedData.length > 0) {
      // Process cached data immediately (instant load!)
      processData(cachedData, (processed) => {
        dispatchProcessedData(cachedData, processed, dataDispatch, category, textFilter);
      });
    }
  }

  // Sync with server (handles online/offline automatically)
  const { syncWithServer, syncPendingOperations } = await import('./syncService');
  
  try {
    // First sync pending operations (callbacks handled in App.tsx SyncSetup)
    await syncPendingOperations(token);
    
    // Then sync data from server
    await syncWithServer(
      token,
      dataDispatch,
      category,
      textFilter
    );
  } catch (error) {
    console.error('Error during sync:', error);
    // Fallback to direct API call if sync fails
    const fetchOptions = {
      method: 'GET',
      headers: new Headers({
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'JWT-Authorization': 'Bearer ' + token,
      }),
    };

    fetchRequest(
      'https://dev-expenses-api.pantheonsite.io/api/expenses',
      fetchOptions,
      dataDispatch,
      dispatch,
      async (data: TransactionOrIncomeItem[]) => {
        // Save to IndexedDB for next time
        if (isIndexedDBAvailable()) {
          await saveExpensesToDB(data);
        }

        // Process data (using Web Worker if available)
        processData(data, (processed) => {
          dispatchProcessedData(data, processed, dataDispatch, category, textFilter);
        });
      }
    );
  }
};

export const formatNumber = (value: unknown): string => {
  // Try to parse the value as a floating-point number
  const parsedValue = parseFloat(value as string);

  // Check if the parsed value is a valid number
  if (!isNaN(parsedValue)) {
    let formattedValue = parsedValue.toFixed(2);
    if (formattedValue.endsWith('.00')) {
      formattedValue = formattedValue.slice(0, -3);
    }
    formattedValue = formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return formattedValue;
  } else {
    // Handle non-numeric values or invalid input
    return 'Invalid Input';
  }
};

export const getCategory: { [key: string]: string } = categories.reduce(
  (acc, item) => {
    // @ts-expect-error TBC
    acc[item.value] = item.label;
    return acc;
  },
  {}
);
