'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { TransactionOrIncomeItem, DataItems, ActionType } from '@/types';

interface DataContextType {
  state: DataItems;
  dispatch: (action: ActionType) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const initialState: DataItems = {
  raw: [],
  filtered_raw: [],
  groupedData: null,
  totals: null,
  filtered: null,
  incomeData: [],
  incomeTotals: null,
  categoryTotals: [],
  loading: false,
  totalIncomePerYearAndMonth: {},
  totalSpent: 0,
  totalPerYear: {},
  category: '',
  textFilter: '',
  totalsPerYearAndMonth: {},
  totalIncomePerYear: {},
  changedItems: {},
};

const dataReducer = (state: DataItems, action: ActionType): DataItems => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.loading || false,
      };
    case 'SET_DATA':
      return {
        ...state,
        raw: action.raw || [],
        groupedData: action.groupedData || null,
        totals: action.totals || null,
        categoryTotals: action.categoryTotals || [],
        totalSpent: action.totalSpent || 0,
        category: action.category || '',
        textFilter: action.textFilter || '',
        loading: false,
      };
    case 'SET_INCOME_DATA':
      return {
        ...state,
        incomeData: action.incomeData || [],
        incomeTotals: action.incomeTotals || null,
        loading: false,
      };
    case 'SET_FILTERED_DATA':
      return {
        ...state,
        filtered: action.payload || null,
        loading: false,
      };
    case 'SET_ERROR':
      return {
        ...state,
        loading: false,
      };
    case 'RESET_DATA':
      return {
        ...initialState,
        loading: false,
      };
    case 'CLEAR_DATA':
      return {
        ...initialState,
        loading: false,
      };
    case 'CLEAR_CHANGED_ITEM':
      const newChangedItems = { ...state.changedItems };
      if (action.payload?.id) {
        delete newChangedItems[action.payload.id];
      }
      return {
        ...state,
        changedItems: newChangedItems,
      };
    case 'UPDATE_CHANGED_ITEMS':
      return {
        ...state,
        changedItems: action.payload || {},
      };
    default:
      return state;
  }
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dataReducer, initialState);

  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}; 