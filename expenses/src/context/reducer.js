let user = localStorage.getItem("currentUser")
  ? JSON.parse(localStorage.getItem("currentUser"))
  : "";
let token = localStorage.getItem("currentUser")
  ? JSON.parse(localStorage.getItem("currentUser")).jwt_token
  : "";

export const initialState = {
  userDetails: "" || user,
  token: "" || token,
  loading: false,
  errorMessage: null,
  userIsLoggedIn: !!user,
  currency: user?.current_user?.currency || 'MDL'
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
        totalSpentUntilTomorrow: action.totalSpentUntilTomorrow,
      };

    case "FILTER_DATA":
      if (action.category !== '' && initialState.raw) {
        const filtered = initialState.raw.filter(item => item.cat === action.category);
        let groupedData = {};
        let monthsTotals = {};
        const monthNames = ["January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        filtered.forEach(item => {
          const date = new Date(item.dt);
          const month = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
          if (!groupedData[month]) {
            groupedData[month] = [];
          }
          if (!monthsTotals[month]) {
            monthsTotals[month] = 0;
          }
          groupedData[month].push(item);
          monthsTotals[month] = parseFloat((parseFloat(monthsTotals[month]) + parseFloat(item.sum)).toFixed(2));
        });
        const newState = {
          groupedData: groupedData,
          totals: monthsTotals,
        };
        return {
          ...initialState,
          filtered: newState,
          category: action.category
        };
      }
      return {
        ...initialState,
        filtered: null,
        category: '',
      };

    case "REMOVE_DATA":
      return initialData;

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
};