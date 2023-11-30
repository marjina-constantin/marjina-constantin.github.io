import { monthNames } from '../utils/constants';

let user = localStorage.getItem("currentUser")
  ? JSON.parse(localStorage.getItem("currentUser"))
  : "";
const token = localStorage.getItem("currentUser")
  ? JSON.parse(localStorage.getItem("currentUser")).jwt_token
  : "";
const theme = localStorage.getItem("theme")
  ? JSON.parse(localStorage.getItem("theme"))
  : "";
const weeklyToSpend = localStorage.getItem("weeklyToSpend")
  ? JSON.parse(localStorage.getItem("weeklyToSpend"))
  : 0;

export const initialState = {
  userDetails: "" || user,
  token: "" || token,
  loading: false,
  errorMessage: null,
  userIsLoggedIn: !!user,
  currency: user?.current_user?.currency || 'MDL',
  theme: theme || 'blue-pink-gradient',
  weeklyToSpend,
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
};

export const AuthReducer = (initialState, action) => {
  switch (action.type) {
    case "REQUEST_LOGIN":
      return {
        ...initialState,
        loading: true
      };
    case "LOGIN_SUCCESS":
      return {
        ...initialState,
        userDetails: action.payload,
        token: action.payload.jwt_token,
        loading: false,
        userIsLoggedIn: true,
        currency: action.payload.current_user.currency || 'MDL'
      };
    case "UPDATE_USER":
      return {
        ...initialState,
        ...action.payload,
      };
    case "LOGOUT":
      return {
        ...initialState,
        user: "",
        token: "",
        userIsLoggedIn: false
      };

    case "LOGIN_ERROR":
      return {
        ...initialState,
        loading: false,
        errorMessage: action.error
      };

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};

export const DataReducer = (initialState, action) => {
  switch (action.type) {
    case "SET_DATA":
      return {
        ...initialState,
        groupedData: action.groupedData,
        totals: action.totals,
        raw: action.raw,
        incomeData: action.incomeData,
        incomeTotals: action.incomeTotals,
        categoryTotals: action.categoryTotals,
        loading: action.loading,
        totalSpent: action.totalSpent,
        totalsPerYearAndMonth: action.totalsPerYearAndMonth,
        totalIncomePerYear: action.totalIncomePerYear,
        totalIncomePerYearAndMonth: action.totalIncomePerYearAndMonth,
        totalPerYear: action.totalPerYear,
      };

    case "FILTER_DATA":
      if ((action.category !== '' || action.textFilter !== '') && initialState.raw) {
        const { raw } = initialState;
        let filtered = raw?.filter(item => item.type === 'transaction') || [];

        if (action.category) {
          filtered = filtered.filter(item => item.cat === action.category);
        }

        if (action.textFilter) {
          const textFilterLower = action.textFilter.toLowerCase();
          filtered = filtered.filter(item =>
            item.dsc?.toLowerCase()?.includes(textFilterLower)
          );
        }
        const newState = filtered.reduce((accumulator, item) => {
          const date = new Date(item.dt);
          const year = date.getFullYear();
          const month = `${monthNames[date.getMonth()]} ${year}`;
          accumulator.groupedData[month] = accumulator.groupedData[month] || [];
          accumulator.groupedData[month].push(item);

          accumulator.totals[month] = (accumulator.totals[month] || 0) + parseFloat(item.sum);
          accumulator.totalSpent = (parseFloat(accumulator.totalSpent) + parseFloat(item.sum)).toFixed(2);

          accumulator.totalsPerYearAndMonth[year] = accumulator.totalsPerYearAndMonth[year] || {};
          accumulator.totalsPerYearAndMonth[year][month] = (accumulator.totalsPerYearAndMonth[year][month] || 0) + parseFloat(item.sum);

          accumulator.totalPerYear[year] = (accumulator.totalPerYear[year] || 0) + parseFloat(item.sum);

          return accumulator;
        }, {
          groupedData: {},
          totals: {},
          totalsPerYearAndMonth: {},
          totalPerYear: {},
          totalSpent: 0
        });
        return {
          ...initialState,
          filtered: newState,
          category: action.category,
          textFilter: action.textFilter,
          filtered_raw: filtered
        };
      }
      return {
        ...initialState,
        filtered: null,
        category: '',
        textFilter: '',
        filtered_raw: null
      };

    case "REMOVE_DATA":
      return initialData;

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};