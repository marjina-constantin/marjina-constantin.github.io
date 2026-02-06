import { categories, monthNames } from '../utils/constants';
import {
  AuthState,
  ActionType,
  TransactionOrIncomeItem,
  Accumulator,
  DataItems,
} from '../types/types';

// Cache localStorage values to avoid repeated parsing
let cachedUser: any = null;
let cachedToken: string = '';
let cachedTheme: string = '';

const getCachedUser = () => {
  if (cachedUser === null) {
    try {
      const userStr = localStorage.getItem('currentUser');
      cachedUser = userStr ? JSON.parse(userStr) : '';
      cachedToken = cachedUser?.jwt_token || '';
    } catch {
      cachedUser = '';
      cachedToken = '';
    }
  }
  return cachedUser;
};

const getCachedTheme = () => {
  if (!cachedTheme) {
    try {
      const themeStr = localStorage.getItem('theme');
      cachedTheme = themeStr ? JSON.parse(themeStr) : '';
    } catch {
      cachedTheme = '';
    }
  }
  return cachedTheme;
};

const user = getCachedUser();
const token = cachedToken;
const theme = getCachedTheme();

export const initialState = {
  userDetails: '' || user,
  token: '' || token,
  loading: false,
  errorMessage: null,
  userIsLoggedIn: !!user,
  currency: user?.current_user?.currency || 'MDL',
  theme: theme || 'blue-pink-gradient',
};

export const initialData = {
  groupedData: null,
  totals: null,
  filtered: null,
  raw: [],
  incomeData: null,
  incomeTotals: null,
  categoryTotals: [],
  loading: true,
  totalSpent: 0,
  changedItems: {},
  incomeTextFilter: '',
  incomeSelectedTags: [],
  filteredIncomeData: null,
};

export const AuthReducer = (initialState: AuthState, action: ActionType) => {
  switch (action.type) {
    case 'REQUEST_LOGIN':
      return {
        ...initialState,
        loading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...initialState,
        userDetails: action.payload,
        token: action.payload.jwt_token,
        loading: false,
        userIsLoggedIn: true,
        currency: action.payload.current_user.currency || 'MDL',
      };
    case 'UPDATE_USER':
      return {
        ...initialState,
        ...action.payload,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        user: '',
        token: '',
        userIsLoggedIn: false,
      };

    case 'LOGIN_ERROR':
      return {
        ...initialState,
        loading: false,
        errorMessage: action.error,
      };

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

/**
 * Builds grouped/aggregated state from a filtered list of transactions.
 * Used by both SET_DATA (re-applying filters) and FILTER_DATA.
 */
const buildFilteredState = (items: TransactionOrIncomeItem[]) => {
  return items.reduce(
    (acc: Accumulator, item: TransactionOrIncomeItem) => {
      const date = new Date(item.dt);
      const year = date.getFullYear();
      const month = `${monthNames[date.getMonth()]} ${year}`;
      const sum = parseFloat(item.sum);

      acc.groupedData[month] = acc.groupedData[month] || [];
      acc.groupedData[month].push(item);

      acc.totals[month] = (acc.totals[month] || 0) + sum;
      acc.totalSpent += sum;

      acc.totalsPerYearAndMonth[year] = acc.totalsPerYearAndMonth[year] || {};
      acc.totalsPerYearAndMonth[year][month] =
        (acc.totalsPerYearAndMonth[year][month] || 0) + sum;

      acc.totalPerYear[year] = ((acc.totalPerYear[year] as number) || 0) + sum;

      const cat = item.cat;
      if (cat !== undefined) {
        if (!acc.categoryTotals[cat]) {
          acc.categoryTotals[cat] = { name: '', y: 0 };
        }
        acc.categoryTotals[cat].name =
          // @ts-expect-error YBC
          categories[cat]?.label || '';
        acc.categoryTotals[cat].y += sum || 0;
      }

      return acc;
    },
    {
      groupedData: {},
      totals: {},
      totalsPerYearAndMonth: {},
      totalPerYear: {},
      totalSpent: 0,
      categoryTotals: {},
    }
  );
};

/**
 * Filters transactions by category and/or text search.
 */
const filterTransactions = (
  raw: TransactionOrIncomeItem[],
  category: string,
  textFilter: string
): TransactionOrIncomeItem[] => {
  let filtered = raw.filter((item) => item.type === 'transaction');

  if (category) {
    filtered = filtered.filter((item) => item.cat === category);
  }

  if (textFilter) {
    const lower = textFilter.toLowerCase();
    filtered = filtered.filter((item) =>
      item.dsc?.toLowerCase()?.includes(lower)
    );
  }

  return filtered;
};

/**
 * Filters income data by text and/or hashtag tags.
 */
const filterIncomeItems = (
  incomeData: TransactionOrIncomeItem[],
  textFilter: string,
  selectedTags: string[]
): TransactionOrIncomeItem[] => {
  let filtered = [...incomeData];

  if (textFilter) {
    const lower = textFilter.toLowerCase();
    filtered = filtered.filter((item) =>
      item.dsc?.toLowerCase()?.includes(lower)
    );
  }

  if (selectedTags.length > 0) {
    filtered = filtered.filter((item) => {
      if (!item.dsc) return false;
      return selectedTags.every((tag) => {
        const tagRegex = new RegExp(`#${tag}\\b`, 'i');
        return tagRegex.test(item.dsc);
      });
    });
  }

  return filtered;
};

export const DataReducer = (initialState: DataItems, action: ActionType) => {
  switch (action.type) {
    case 'SET_DATA':
      const changedItems = compareData(initialState.raw, action.raw);
      
      // Preserve filter state
      const preservedCategory = initialState.category || '';
      const preservedTextFilter = initialState.textFilter || '';
      const preservedIncomeTextFilter = initialState.incomeTextFilter || '';
      const preservedIncomeSelectedTags = initialState.incomeSelectedTags || [];
      
      const baseState = {
        ...initialState,
        ...action,
        category: preservedCategory,
        textFilter: preservedTextFilter,
        incomeTextFilter: preservedIncomeTextFilter,
        incomeSelectedTags: preservedIncomeSelectedTags,
        changedItems: {
          ...initialState.changedItems,
          ...changedItems
        },
      };
      
      // Re-apply transaction filters if they were active
      let filteredState: any = null;
      let filteredRaw: TransactionOrIncomeItem[] | null = null;
      
      if ((preservedCategory || preservedTextFilter) && baseState.raw) {
        filteredRaw = filterTransactions(baseState.raw, preservedCategory, preservedTextFilter);
        filteredState = buildFilteredState(filteredRaw);
      }
      
      // Re-apply income filters if they were active
      let filteredIncomeData: TransactionOrIncomeItem[] | null = null;
      if ((preservedIncomeTextFilter || preservedIncomeSelectedTags.length > 0) && baseState.incomeData) {
        filteredIncomeData = filterIncomeItems(baseState.incomeData, preservedIncomeTextFilter, preservedIncomeSelectedTags);
      }
      
      return {
        ...baseState,
        filtered: filteredState,
        filteredRaw,
        filteredIncomeData,
      };

    case 'CLEAR_CHANGED_ITEM':
      const newChangedItems = { ...initialState.changedItems };
      delete newChangedItems[action.id];
      return {
        ...initialState,
        changedItems: newChangedItems
      };

    case 'FILTER_DATA':
      if (
        (action.category !== '' || action.textFilter !== '') &&
        initialState.raw
      ) {
        const filtered = filterTransactions(initialState.raw, action.category, action.textFilter);
        const newState = buildFilteredState(filtered);
        return {
          ...initialState,
          filtered: newState,
          category: action.category,
          textFilter: action.textFilter,
          filteredRaw: filtered,
        };
      }
      return {
        ...initialState,
        filtered: null,
        category: '',
        textFilter: '',
        filteredRaw: null,
      };

    case 'FILTER_INCOME_DATA':
      if (
        (action.textFilter !== '' || (action.selectedTags && action.selectedTags.length > 0)) &&
        initialState.incomeData
      ) {
        const filtered = filterIncomeItems(
          initialState.incomeData,
          action.textFilter || '',
          action.selectedTags || []
        );
        return {
          ...initialState,
          filteredIncomeData: filtered,
          incomeTextFilter: action.textFilter || '',
          incomeSelectedTags: action.selectedTags || [],
        };
      }
      return {
        ...initialState,
        filteredIncomeData: null,
        incomeTextFilter: '',
        incomeSelectedTags: [],
      };

    case 'REMOVE_DATA':
      return initialData;

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

// Optimized compareData - avoids expensive JSON.stringify
const compareData = (oldData, newData) => {
  const changedItems = {};
  if (oldData.length === 0) {
    return changedItems;
  }

  const oldMap = new Map(oldData.map(item => [item.id, item]));
  const newMap = new Map(newData.map(item => [item.id, item]));

  // Helper to compare objects by key fields instead of JSON.stringify
  const hasChanged = (oldItem, newItem) => {
    return (
      oldItem.dt !== newItem.dt ||
      oldItem.sum !== newItem.sum ||
      oldItem.cat !== newItem.cat ||
      oldItem.dsc !== newItem.dsc ||
      oldItem.type !== newItem.type ||
      oldItem.cr !== newItem.cr
    );
  };

  newData.forEach(item => {
    const oldItem = oldMap.get(item.id);
    if (!oldItem) {
      changedItems[item.id] = { type: 'new', data: item };
    } else if (hasChanged(oldItem, item)) {
      changedItems[item.id] = { type: 'updated', data: item };
    }
  });

  oldData.forEach(item => {
    if (!newMap.has(item.id)) {
      changedItems[item.id] = { type: 'removed', data: item };
    }
  });

  return changedItems;
};
