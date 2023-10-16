let user = localStorage.getItem("currentUser")
  ? JSON.parse(localStorage.getItem("currentUser"))
  : "";
let token = localStorage.getItem("currentUser")
  ? JSON.parse(localStorage.getItem("currentUser")).jwt_token
  : "";
let theme = localStorage.getItem("theme")
  ? JSON.parse(localStorage.getItem("theme"))
  : "";

export const initialState = {
  userDetails: "" || user,
  token: "" || token,
  loading: false,
  errorMessage: null,
  userIsLoggedIn: !!user,
  currency: user?.current_user?.currency || 'MDL',
  theme: theme || 'bondi-blue'
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
        // Create separate filtered arrays for category and text filters.
        let filteredByCategory = initialState.raw;
        let filteredByText = initialState.raw;

        if (action.category !== '') {
          filteredByCategory = initialState.raw.filter(item => item.cat === action.category);
        }

        if (action.textFilter !== '') {
          filteredByText = initialState.raw.filter(item =>
            item.dsc?.toLowerCase()?.includes(action.textFilter?.toLowerCase())
          );
        }

        // Merge the two filtered arrays (keeping items that satisfy both filters).
        const filtered = filteredByCategory.filter(item =>
          filteredByText.includes(item)
        );
        let groupedData = {};
        let monthsTotals = {};
        let totalSpent = 0;
        const totalsPerYearAndMonth = {};
        const totalPerYear = {};
        const monthNames = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        filtered.forEach(item => {
          const date = new Date(item.dt);
          const year = date.getFullYear();
          const month = `${monthNames[date.getMonth()]} ${year}`;
          if (!totalsPerYearAndMonth[year]) {
            totalsPerYearAndMonth[year] = {};
          }
          if (!totalsPerYearAndMonth[year][month]) {
            totalsPerYearAndMonth[year][month] = 0;
          }
          if (!groupedData[month]) {
            groupedData[month] = [];
          }
          if (!monthsTotals[month]) {
            monthsTotals[month] = 0;
          }
          if (!totalPerYear[year]) {
            totalPerYear[year] = 0;
          }
          groupedData[month].push(item);
          monthsTotals[month] = parseFloat((parseFloat(monthsTotals[month]) + parseFloat(item.sum)).toFixed(2));
          totalSpent = (parseFloat(totalSpent) + parseFloat(item.sum)).toFixed(2);
          totalsPerYearAndMonth[year][month] += parseFloat(item.sum);
          totalPerYear[year] = (parseFloat(totalPerYear[year]) + parseFloat(item.sum)).toFixed(2);
        });
        const newState = {
          groupedData: groupedData,
          totals: monthsTotals,
          totalsPerYearAndMonth,
          totalPerYear,
          totalSpent,
        };
        return {
          ...initialState,
          filtered: newState,
          category: action.category,
          filtered_raw: filtered
        };
      }
      return {
        ...initialState,
        filtered: null,
        category: '',
        filtered_raw: null
      };

    case "REMOVE_DATA":
      return initialData;

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};