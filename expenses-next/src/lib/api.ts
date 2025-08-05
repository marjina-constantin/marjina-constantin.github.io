import { NodeData, TransactionOrIncomeItem, ActionType } from '@/types';
import { parseApiDate } from '@/lib/utils';

const API_BASE_URL = 'https://dev-expenses-api.pantheonsite.io';

export const fetchRequest = async (
  url: string,
  options: RequestInit,
  dataDispatch: (action: ActionType) => void,
  authDispatch: (action: any) => void,
  callback: (data: NodeData) => void
) => {
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (response.status === 401) {
        authDispatch({ type: 'LOGOUT' });
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    callback(data);
  } catch (error) {
    console.error('Fetch request failed:', error);
    dataDispatch({ type: 'SET_ERROR', error });
  }
};

export const fetchData = async (
  token: string,
  dataDispatch: (action: ActionType) => void,
  authDispatch: (action: any) => void,
  category?: string,
  textFilter?: string
) => {
  dataDispatch({ type: 'SET_LOADING', loading: true });
  
  // Use the same URL as original app
  const url = `${API_BASE_URL}/api/expenses`;
  
  const options: RequestInit = {
    method: 'GET',
    headers: new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'JWT-Authorization': `Bearer ${token}`,
    }),
  };

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (response.status === 401) {
        authDispatch({ type: 'LOGOUT' });
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const rawData = await response.json();
    
    // Process both transactions and income data from the same response
    const transactionData = processTransactionData(rawData, category, textFilter);
    const incomeData = processIncomeData(rawData);
    
    // Dispatch both transaction and income data
    dataDispatch({ type: 'SET_DATA', ...transactionData });
    dataDispatch({ type: 'SET_INCOME_DATA', ...incomeData });
  } catch (error) {
    console.error('Fetch data failed:', error);
    dataDispatch({ type: 'SET_ERROR', error });
  } finally {
    dataDispatch({ type: 'SET_LOADING', loading: false });
  }
};

export const fetchIncomeData = async (
  token: string,
  dataDispatch: (action: ActionType) => void,
  authDispatch: (action: any) => void
) => {
  // Use the same URL as original app - income data comes from the same endpoint
  const url = `${API_BASE_URL}/api/expenses`;
  const options: RequestInit = {
    method: 'GET',
    headers: new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'JWT-Authorization': `Bearer ${token}`,
    }),
  };

  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      if (response.status === 401) {
        authDispatch({ type: 'LOGOUT' });
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const rawData = await response.json();
    const processedData = processIncomeData(rawData);
    dataDispatch({ type: 'SET_INCOME_DATA', ...processedData });
  } catch (error) {
    console.error('Fetch income data failed:', error);
    dataDispatch({ type: 'SET_ERROR', error });
  }
};

export const deleteNode = async (
  nodeId: string,
  token: string,
  callback: (response: Response) => void
) => {
  const url = `${API_BASE_URL}/node/${nodeId}?_format=json`;
  const options: RequestInit = {
    method: 'DELETE',
    headers: new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'JWT-Authorization': `Bearer ${token}`,
    }),
  };

  try {
    const response = await fetch(url, options);
    callback(response);
  } catch (error) {
    console.error('Delete node failed:', error);
    callback({ ok: false } as Response);
  }
};

export const createTransaction = async (
  transactionData: any,
  token: string,
  callback: (data: NodeData) => void
) => {
  const url = `${API_BASE_URL}/node?_format=json`;
  const options: RequestInit = {
    method: 'POST',
    headers: new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'JWT-Authorization': `Bearer ${token}`,
    }),
    body: JSON.stringify(transactionData),
  };

  try {
    const response = await fetch(url, options);
    if (response.ok) {
      const data = await response.json();
      callback(data);
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Create transaction failed:', error);
    throw error;
  }
};

export const updateTransaction = async (
  nodeId: string,
  transactionData: any,
  token: string,
  callback: (data: NodeData) => void
) => {
  const url = `${API_BASE_URL}/node/${nodeId}?_format=json`;
  const options: RequestInit = {
    method: 'PATCH',
    headers: new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'JWT-Authorization': `Bearer ${token}`,
    }),
    body: JSON.stringify(transactionData),
  };

  try {
    const response = await fetch(url, options);
    if (response.ok) {
      const data = await response.json();
      callback(data);
    } else {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Update transaction failed:', error);
    throw error;
  }
};

const processTransactionData = (
  rawData: any[],
  category?: string,
  textFilter?: string
) => {
  // Filter out income data - only process transactions
  const transactions = rawData.filter((item: any) => 
    item.type !== 'incomes'
  );

  let filteredTransactions = transactions;

  // Apply category filter
  if (category && category !== '' && category !== '0') {
    filteredTransactions = filteredTransactions.filter(
      (transaction) => transaction.cat === category
    );
  }

  // Apply text filter
  if (textFilter && textFilter.trim() !== '') {
    filteredTransactions = filteredTransactions.filter((transaction) =>
      transaction.dsc?.toLowerCase().includes(textFilter.toLowerCase())
    );
  }

  const groupedData = groupTransactionsByMonth(filteredTransactions);
  const totals = calculateTotals(groupedData);
  const categoryTotals = calculateCategoryTotals(filteredTransactions);
  const totalSpent = filteredTransactions.reduce(
    (sum, transaction) => sum + parseFloat(transaction.sum || '0'),
    0
  );

  return {
    raw: transactions,
    filtered_raw: filteredTransactions,
    groupedData,
    totals,
    categoryTotals,
    totalSpent,
    category,
    textFilter,
  };
};

const processIncomeData = (rawData: any[]) => {
  // Filter only income data
  const income = rawData.filter((item: any) => 
    item.type === 'incomes'
  );

  const groupedData = groupTransactionsByMonth(income);
  const totals = calculateTotals(groupedData);

  return {
    incomeData: income,
    incomeTotals: totals,
  };
};

const groupTransactionsByMonth = (transactions: TransactionOrIncomeItem[]) => {
  const grouped: Record<string, TransactionOrIncomeItem[]> = {};
  
  transactions.forEach((transaction) => {
    const date = parseApiDate(transaction.dt);
    if (!date) {
      // console.warn('Invalid date for transaction:', transaction);
      return;
    }
    
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(transaction);
  });

  // Sort months in descending order
  return Object.fromEntries(
    Object.entries(grouped).sort(([a], [b]) => b.localeCompare(a))
  );
};

const calculateTotals = (groupedData: Record<string, TransactionOrIncomeItem[]>) => {
  const totals: Record<string, number> = {};
  
  Object.entries(groupedData).forEach(([month, transactions]) => {
    totals[month] = transactions.reduce(
      (sum, transaction) => sum + parseFloat(transaction.sum || '0'),
      0
    );
  });
  
  return totals;
};

const calculateCategoryTotals = (transactions: TransactionOrIncomeItem[]) => {
  const categoryTotals: Record<string, { name: string; y: number }> = {};
  
  transactions.forEach((transaction) => {
    if (transaction.cat) {
      const categoryName = getCategoryName(transaction.cat);
      if (!categoryTotals[transaction.cat]) {
        categoryTotals[transaction.cat] = { name: categoryName, y: 0 };
      }
      categoryTotals[transaction.cat].y += parseFloat(transaction.sum || '0');
    }
  });
  
  return categoryTotals;
};

const getCategoryName = (categoryValue: string): string => {
  const categories = [
    { value: '1', label: 'Clothing' },
    { value: '2', label: 'Entertainment' },
    { value: '3', label: 'Food' },
    { value: '4', label: 'Gifts' },
    { value: '5', label: 'Household Items/Supplies' },
    { value: '6', label: 'Housing' },
    { value: '7', label: 'Medical / Healthcare' },
    { value: '8', label: 'Personal' },
    { value: '9', label: 'Transportation' },
    { value: '10', label: 'Utilities' },
    { value: '11', label: 'Travel' },
    { value: '12', label: 'Family' },
    { value: '13', label: 'Investment' },
    { value: '14', label: 'Drinks' },
  ];
  
  const category = categories.find(cat => cat.value === categoryValue);
  return category?.label || 'Unknown';
}; 