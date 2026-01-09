import { categories, monthNames } from './constants';
import {
  TransactionOrIncomeItem,
  DataStructure,
  ItemTotal,
} from '../type/types';
import type { ProcessedData } from './dataProcessor.worker';

// Process data using Web Worker (if available) or fallback to main thread
export const processData = (
  data: TransactionOrIncomeItem[],
  callback: (processed: ProcessedData) => void
) => {
  if (typeof Worker !== 'undefined') {
    try {
      const worker = new Worker(
        new URL('./dataProcessor.worker.ts', import.meta.url),
        { type: 'module' }
      );

      worker.onmessage = (e: MessageEvent<ProcessedData>) => {
        callback(e.data);
        worker.terminate();
      };

      worker.onerror = (error) => {
        console.warn('Web Worker error, falling back to main thread:', error);
        processDataMainThread(data, callback);
        worker.terminate();
      };

      worker.postMessage(data);
      return;
    } catch (error) {
      console.warn('Web Worker not available, using main thread:', error);
    }
  }

  processDataMainThread(data, callback);
};

const processDataMainThread = (
  data: TransactionOrIncomeItem[],
  callback: (processed: ProcessedData) => void
) => {
  const groupedData: Record<string, TransactionOrIncomeItem[]> = {};
  const totalsPerYearAndMonth: DataStructure = {};
  const totalPerYear: ItemTotal = {};
  const incomeData: TransactionOrIncomeItem[] = [];
  const monthsTotals: Record<string, number> = {};
  const incomeTotals: Record<string, number> = {};
  const totalIncomePerYear: ItemTotal = {};
  const totalIncomePerYearAndMonth: DataStructure = {};
  const categoryTotals: Record<string, { name: string; y: number }> = {};
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

  callback({
    groupedData,
    totalsPerYearAndMonth,
    totalPerYear,
    incomeData,
    monthsTotals,
    incomeTotals,
    totalIncomePerYear,
    totalIncomePerYearAndMonth,
    categoryTotals,
    totalSpent,
  });
};

export const dispatchProcessedData = (
  data: TransactionOrIncomeItem[],
  processed: ProcessedData,
  dataDispatch: any,
  category: string = '',
  textFilter: string = ''
) => {
  dataDispatch({
    type: 'SET_DATA',
    raw: data,
    groupedData: processed.groupedData,
    totals: processed.monthsTotals,
    incomeData: processed.incomeData,
    incomeTotals: processed.incomeTotals,
    categoryTotals: processed.categoryTotals,
    loading: false,
    totalsPerYearAndMonth: processed.totalsPerYearAndMonth,
    totalIncomePerYear: processed.totalIncomePerYear,
    totalIncomePerYearAndMonth: processed.totalIncomePerYearAndMonth,
    totalPerYear: processed.totalPerYear,
    totalSpent: processed.totalSpent,
  });

  // Keep transaction filtering logic explicit (and isolated) to avoid corrupting base aggregates.
  if (category || textFilter) {
    dataDispatch({
      type: 'FILTER_DATA',
      category,
      textFilter,
    });
  }
};


