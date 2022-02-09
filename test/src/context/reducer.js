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
  userIsLoggedIn: !!user
};

export const initialData = {
  groupedData: null,
  totals: null,
  filtered: null,
  raw: [],
  incomeData: null,
  incomeTotals: null,
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
        userIsLoggedIn: true
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
      };

    case "FILTER_DATA":
      if (action.category !== '') {
        const filtered = initialState.raw.filter(item => item.cat === action.category);
        let groupedData = {};
        let monthsTotals = {};
        filtered.forEach(item => {
          const date = new Date(item.dt);
          const month = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
          if (!groupedData[month]) {
            groupedData[month] = [];
          }
          if (!monthsTotals[month]) {
            monthsTotals[month] = 0;
          }
          groupedData[month].push(item);
          monthsTotals[month] += parseInt(item.sum);
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