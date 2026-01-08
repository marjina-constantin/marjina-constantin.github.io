import { categories, monthNames } from '../utils/constants';
import {
  AuthState,
  ActionType,
  TransactionOrIncomeItem,
  Accumulator,
  DataItems,
} from '../type/types';

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

export const DataReducer = (initialState: DataItems, action: ActionType) => {
  switch (action.type) {
    case 'SET_DATA':
      const changedItems = compareData(initialState.raw, action.raw);
      return {
        ...initialState,
        ...action,
        changedItems: {
          ...initialState.changedItems,
          ...changedItems
        },
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
        const { raw } = initialState;
        let filtered =
          raw?.filter(
            (item: TransactionOrIncomeItem) => item.type === 'transaction'
          ) || [];

        if (action.category) {
          filtered = filtered.filter((item) => item.cat === action.category);
        }

        if (action.textFilter) {
          const textFilterLower = action.textFilter.toLowerCase();
          filtered = filtered.filter((item) =>
            item.dsc?.toLowerCase()?.includes(textFilterLower)
          );
        }
        const newState = filtered.reduce(
          (accumulator: Accumulator, item: TransactionOrIncomeItem) => {
            const date = new Date((item as TransactionOrIncomeItem).dt);
            const year = date.getFullYear();
            const month = `${monthNames[date.getMonth()]} ${year}`;
            accumulator.groupedData[month] =
              accumulator.groupedData[month] || [];
            accumulator.groupedData[month].push(
              item as TransactionOrIncomeItem
            );

            accumulator.totals[month] =
              (accumulator.totals[month] || 0) +
              parseFloat((item as TransactionOrIncomeItem).sum);
            accumulator.totalSpent =
              accumulator.totalSpent +
              parseFloat((item as TransactionOrIncomeItem).sum);

            accumulator.totalsPerYearAndMonth[year] =
              accumulator.totalsPerYearAndMonth[year] || {};
            accumulator.totalsPerYearAndMonth[year][month] =
              (accumulator.totalsPerYearAndMonth[year][month] || 0) +
              parseFloat(item.sum);

            accumulator.totalPerYear[year] =
              ((accumulator.totalPerYear[year] as number) || 0) +
              parseFloat((item as TransactionOrIncomeItem).sum);

            const cat = (item as TransactionOrIncomeItem).cat;
            if (cat !== undefined) {
              if (!accumulator.categoryTotals[cat]) {
                accumulator.categoryTotals[cat] = {
                  name: '',
                  y: 0,
                };
              }
              accumulator.categoryTotals[cat].name =
                // @ts-expect-error YBC
                categories[cat]?.label || '';
              accumulator.categoryTotals[cat].y +=
                parseFloat((item as TransactionOrIncomeItem).sum) || 0;
            }

            return accumulator;
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
        return {
          ...initialState,
          filtered: newState,
          category: action.category,
          textFilter: action.textFilter,
          filtered_raw: filtered,
        };
      }
      return {
        ...initialState,
        filtered: null,
        category: '',
        textFilter: '',
        filtered_raw: null,
      };

    case 'FILTER_INCOME_DATA':
      if (
        (action.textFilter !== '' || (action.selectedTags && action.selectedTags.length > 0)) &&
        initialState.incomeData
      ) {
        const { incomeData } = initialState;
        let filtered = [...incomeData];

        // Filter by text
        if (action.textFilter) {
          const textFilterLower = action.textFilter.toLowerCase();
          filtered = filtered.filter((item) =>
            item.dsc?.toLowerCase()?.includes(textFilterLower)
          );
        }

        // Filter by tags
        if (action.selectedTags && action.selectedTags.length > 0) {
          filtered = filtered.filter((item) => {
            if (!item.dsc) return false;
            // Check if item contains all selected tags
            return action.selectedTags.every(tag => {
              const tagRegex = new RegExp(`#${tag}\\b`, 'i');
              return tagRegex.test(item.dsc);
            });
          });
        }

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
