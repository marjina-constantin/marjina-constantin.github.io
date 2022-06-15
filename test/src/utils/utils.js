import {categories} from './constants'

// const handleErrors = (response) => {
//   if (!response.ok) throw Error(response.statusText);
//   return response.json();
// }
const handleErrors = (response) => {
  if (!response.ok) return (response.statusText);
  return response.json();
}

export const fetchRequest = (url, options, callback) => {
  fetch(url, options)
    .then(handleErrors)
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

export const fetchData = (token, dataDispatch, category = null) => {
  const fetchOptions = {
    method: 'GET',
    headers: new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'JWT-Authorization': 'Bearer ' + token
    }),
  };
  fetchRequest('https://dev-expenses-api.pantheonsite.io/user-expenses?_format=json', fetchOptions, (data) => {
    let groupedData = {};
    let incomeData = [];
    let monthsTotals = {};
    let incomeTotals = {};
    let categoryTotals = {};
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
          incomeTotals[month] += parseInt(item.sum);
        } else {
          groupedData[month].push(item);
          monthsTotals[month] += parseInt(item.sum);
          categoryTotals[category].name = categories[category].label;
          categoryTotals[category].y += parseInt(item.sum);
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
    });
    if (category) {
      dataDispatch({ type: 'FILTER_DATA', category: category });
    }
  });
}
