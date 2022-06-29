import {categories} from './constants';
import { logout } from '../context'

// const handleErrors = (response) => {
//   if (!response.ok) throw Error(response.statusText);
//   return response.json();
// }
const handleErrors = (response, options, dataDispatch, dispatch) => {
  if (!response.ok) {
    fetch(`https://dev-expenses-api.pantheonsite.io/jwt/token`, options)
      .then(response => {
        if (response.status === 403) {
          logout(dispatch, dataDispatch);
        }
      });
    return (response.statusText);
  }
  return response.json();
}

export const fetchRequest = (url, options, dataDispatch, dispatch, callback) => {
  fetch(url, options)
    .then(response => handleErrors(response, options, dataDispatch, dispatch))
    .then(response => callback(response))
    .catch(error => console.log(error));
}

export const deleteNode = (nid, token, callback) => {
  const fetchOptions = {
    method: 'DELETE',
    headers: new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'JWT-Authorization': 'Bearer ' + token
    }),
  };
  fetch(`https://dev-expenses-api.pantheonsite.io/node/${nid}?_format=json`, fetchOptions)
    .then(response => {
      callback(response);
    });
}

export const fetchData = (token, dataDispatch, dispatch, category = null) => {
  const fetchOptions = {
    method: 'GET',
    headers: new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'JWT-Authorization': 'Bearer ' + token
    }),
  };
  fetchRequest('https://dev-expenses-api.pantheonsite.io/user-expenses?_format=json', fetchOptions, dataDispatch, dispatch, (data) => {
    let groupedData = {};
    let incomeData = [];
    let monthsTotals = {};
    let incomeTotals = {};
    let categoryTotals = {};
    let totalSpent = 0;
    let totalSpentUntilTomorrow = 0;
    const tomorrow = new Date().setHours(24,0,0,0);
    if (data) {
      const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      data.forEach(item => {
        const date = new Date(item.dt);
        const category = item.cat;
        const month = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (!groupedData[month]) {
          groupedData[month] = [];
        }
        if (!monthsTotals[month]) {
          monthsTotals[month] = 0;
        }
        if (!incomeTotals[month]) {
          incomeTotals[month] = 0;
        }
        if (!categoryTotals[category] && category) {
          categoryTotals[category] = {
            name: '',
            y: 0
          };
        }

        if (item.type === 'incomes') {
          incomeData.push(item)
          incomeTotals[month] = (parseFloat(incomeTotals[month]) + parseFloat(item.sum)).toFixed(2);
        } else {
          groupedData[month].push(item);
          monthsTotals[month] = parseFloat((parseFloat(monthsTotals[month]) + parseFloat(item.sum)).toFixed(2));
          categoryTotals[category].name = categories[category].label;
          categoryTotals[category].y = parseFloat((parseFloat(categoryTotals[category].y) + parseFloat(item.sum)).toFixed(2));
          if (date < tomorrow ) {
            totalSpentUntilTomorrow = (parseFloat(totalSpentUntilTomorrow) + parseFloat(item.sum)).toFixed(2);
          }
          totalSpent = (parseFloat(totalSpent) + parseFloat(item.sum)).toFixed(2);
        }
      });
    }
    dataDispatch({
      type: 'SET_DATA',
      raw: data,
      groupedData: groupedData,
      totals: monthsTotals,
      incomeData: incomeData,
      incomeTotals: incomeTotals,
      categoryTotals: categoryTotals,
      loading: false,
      totalSpent,
      totalSpentUntilTomorrow,
    });
    if (category) {
      dataDispatch({ type: 'FILTER_DATA', category: category });
    }
  });
}
