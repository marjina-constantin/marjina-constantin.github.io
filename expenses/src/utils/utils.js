import {categories, monthNames} from './constants';
import { logout } from '../context';

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

export const formatDataForChart = (data) => {
  const seriesData = [];

  for (const year in data) {
    const yearSeries = {
      name: year,
      data: [],
    };

    for (const month of monthNames) {
      if (data[year][`${month} ${year}`]) {
        const monthValue = data[year][`${month} ${year}`];
        yearSeries.data.push([month, monthValue]);
      }
    }

    if (yearSeries.data.length > 0) {
      seriesData.push(yearSeries);
    }
  }

  return seriesData;
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

export const fetchData = (token, dataDispatch, dispatch, category = null, textFilter = '') => {
  const fetchOptions = {
    method: 'GET',
    headers: new Headers({
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'JWT-Authorization': 'Bearer ' + token
    }),
  };
  fetchRequest('https://dev-expenses-api.pantheonsite.io/api/expenses', fetchOptions, dataDispatch, dispatch, (data) => {
    let groupedData = {};
    const totalsPerYearAndMonth = {};
    const totalPerYear = {};
    let incomeData = [];
    let monthsTotals = {};
    let incomeTotals = {};
    let totalIncomePerYear = {};
    let totalIncomePerYearAndMonth = {};
    let categoryTotals = {};
    let totalSpent = 0;
    const updateYearAndMonth = (year, month) => {
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
      if (!incomeTotals[month]) {
        incomeTotals[month] = 0;
      }
      if (!totalIncomePerYearAndMonth[year]) {
        totalIncomePerYearAndMonth[year] = {};
      }
      if (!totalIncomePerYearAndMonth[year][month]) {
        totalIncomePerYearAndMonth[year][month] = 0;
      }
      if (!totalIncomePerYear[year]) {
        totalIncomePerYear[year] = 0;
      }
      if (!totalPerYear[year]) {
        totalPerYear[year] = 0;
      }
    }

    const updateTotals = (item, year, month) => {
      const { cat, sum, type } = item;
      if (type === 'incomes') {
        totalIncomePerYear[year] = (parseFloat(totalIncomePerYear[year]) + parseFloat(sum)).toFixed(2);
        totalIncomePerYearAndMonth[year][month] += parseFloat(sum);
        incomeData.push(item);
        incomeTotals[month] = parseFloat((parseFloat(incomeTotals[month]) + parseFloat(sum)).toFixed(2));
      } else if (type === 'transaction') {
        groupedData[month].push(item);
        monthsTotals[month] = parseFloat((parseFloat(monthsTotals[month]) + parseFloat(sum)).toFixed(2));
        categoryTotals[cat].name = categories[cat].label;
        categoryTotals[cat].y = parseFloat((parseFloat(categoryTotals[cat].y) + parseFloat(sum)).toFixed(2));
        totalSpent = (parseFloat(totalSpent) + parseFloat(sum)).toFixed(2);
        totalsPerYearAndMonth[year][month] += parseFloat(sum);
        totalPerYear[year] = (parseFloat(totalPerYear[year]) + parseFloat(sum)).toFixed(2);
      }
    }
    if (data) {
      data.forEach(item => {
        const { dt, cat } = item;
        const date = new Date(dt);
        const year = date.getFullYear();
        const month = `${monthNames[date.getMonth()]} ${year}`;

        if (!categoryTotals[cat] && cat) {
          categoryTotals[cat] = {
            name: '',
            y: 0
          };
        }
        updateYearAndMonth(year, month);
        updateTotals(item, year, month);
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
      totalsPerYearAndMonth,
      totalIncomePerYear,
      totalIncomePerYearAndMonth,
      totalPerYear,
      totalSpent,
    });
    if (category || textFilter) {
      dataDispatch({ type: 'FILTER_DATA', category: category, textFilter });
    }
  });
}

export const formatNumber = (value) => {
  // Try to parse the value as a floating-point number
  const parsedValue = parseFloat(value);

  // Check if the parsed value is a valid number
  if (!isNaN(parsedValue)) {
    // Use a specific locale or options if needed
    return parsedValue.toLocaleString();
  } else {
    // Handle non-numeric values or invalid input
    return "Invalid Input";
  }
}
