import { categories, monthNames } from './constants';
import { logout } from '../context';
import {
  DataStructure,
  ItemTotal,
  TransactionOrIncomeItem,
} from '../type/types';

const handleErrors = (
  response: Response,
  options: RequestInit,
  dataDispatch: any,
  dispatch: any
) => {
  if (!response.ok) {
    fetch('https://dev-expenses-api.pantheonsite.io/jwt/token', options).then(
      (response) => {
        if (response.status === 403) {
          logout(dispatch, dataDispatch);
        }
      }
    );
    return response.statusText;
  }
  return response.json();
};

export const formatDataForChart = (data: DataStructure) => {
  const seriesData = [];

  for (const year in data) {
    const yearSeries = {
      name: year,
      data: [],
    };

    for (const month of monthNames) {
      if (data[year][`${month} ${year}`]) {
        const monthValue = data[year][`${month} ${year}`];
        // @ts-expect-error TBD
        yearSeries.data.push([month, monthValue]);
      }
    }

    if (yearSeries.data.length > 0) {
      seriesData.push(yearSeries);
    }
  }

  return seriesData;
};

export const fetchRequest = (
  url: string,
  options: RequestInit,
  dataDispatch: any,
  dispatch: any,
  callback: any
) => {
  fetch(url, options)
    .then((response) => handleErrors(response, options, dataDispatch, dispatch))
    .then((response) => callback(response))
    .catch((error) => console.log(error));
};

export const deleteNode = (nid: string, token: string, callback: any) => {
  const fetchOptions = {
    method: 'DELETE',
    headers: new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'JWT-Authorization': 'Bearer ' + token,
    }),
  };
  fetch(
    `https://dev-expenses-api.pantheonsite.io/node/${nid}?_format=json`,
    fetchOptions
  ).then((response) => {
    callback(response);
  });
};

export const fetchData = (
  token: string,
  dataDispatch: any,
  dispatch: any,
  category: string = '',
  textFilter: string = ''
) => {
  const fetchOptions = {
    method: 'GET',
    headers: new Headers({
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'JWT-Authorization': 'Bearer ' + token,
    }),
  };
  fetchRequest(
    'https://dev-expenses-api.pantheonsite.io/api/expenses',
    fetchOptions,
    dataDispatch,
    dispatch,
    (data: TransactionOrIncomeItem[]) => {
      const groupedData: Record<string, TransactionOrIncomeItem[]> = {};
      const totalsPerYearAndMonth: DataStructure = {};
      const totalPerYear: ItemTotal = {};
      const incomeData: TransactionOrIncomeItem[] = [];
      const monthsTotals: Record<string, number> = {};
      const incomeTotals: Record<string, number> = {};
      const totalIncomePerYear: ItemTotal = {};
      const totalIncomePerYearAndMonth: DataStructure = {};
      const categoryTotals:
        | Record<string, { name: string; y: number }>
        | never[] = {};
      let totalSpent = 0;
      const updateYearAndMonth = (year: string | number, month: string) => {
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
      };

      const updateTotals = (
        item: TransactionOrIncomeItem,
        year: number | string,
        month: string
      ) => {
        const { cat, sum, type } = item;
        if (type === 'incomes') {
          totalIncomePerYear[year] =
            (totalIncomePerYear[year] as number) + parseFloat(sum);
          totalIncomePerYearAndMonth[year][month] += parseFloat(sum);
          incomeData.push(item);
          incomeTotals[month] = parseFloat(
            (incomeTotals[month] + parseFloat(sum)).toFixed(2)
          );
        } else if (type === 'transaction') {
          groupedData[month].push(item);
          monthsTotals[month] = parseFloat(
            (monthsTotals[month] + parseFloat(sum)).toFixed(2)
          );
          if (cat && categoryTotals[cat]) {
            const categoryKey = cat as keyof typeof categories;
            // @ts-expect-error
            categoryTotals[categoryKey].name = categories[categoryKey].label;
            // @ts-expect-error
            categoryTotals[categoryKey].y = parseFloat(
              // @ts-expect-error
              (categoryTotals[categoryKey].y + parseFloat(sum)).toFixed(2)
            );
          }
          totalSpent = totalSpent + parseFloat(sum);
          totalsPerYearAndMonth[year][month] += parseFloat(sum);
          totalPerYear[year] = (totalPerYear[year] as number) + parseFloat(sum);
        }
      };
      if (data) {
        data.forEach((item: TransactionOrIncomeItem) => {
          const { dt, cat } = item;
          const date = new Date(dt);
          const year = date.getFullYear();
          const month = `${monthNames[date.getMonth()]} ${year}`;

          if (cat && !categoryTotals[cat]) {
            categoryTotals[cat] = {
              name: '',
              y: 0,
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
        dataDispatch({
          type: 'FILTER_DATA',
          category: category,
          textFilter,
        });
      }
    }
  );
};

export const formatNumber = (value: unknown): string => {
  // Try to parse the value as a floating-point number
  const parsedValue = parseFloat(value as string);

  // Check if the parsed value is a valid number
  if (!isNaN(parsedValue)) {
    let formattedValue = parsedValue.toFixed(2);
    if (formattedValue.endsWith('.00')) {
      formattedValue = formattedValue.slice(0, -3);
    }
    formattedValue = formattedValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return formattedValue;
  } else {
    // Handle non-numeric values or invalid input
    return 'Invalid Input';
  }
};

export const getCategory: { [key: string]: string } = categories.reduce(
  (acc, item) => {
    // @ts-expect-error TBC
    acc[item.value] = item.label;
    return acc;
  },
  {}
);
