// Web Worker for processing expense data (runs off main thread)
import { TransactionOrIncomeItem, DataStructure, ItemTotal } from '../type/types';
import { categories, monthNames } from './constants';

export interface ProcessedData {
  groupedData: Record<string, TransactionOrIncomeItem[]>;
  totalsPerYearAndMonth: DataStructure;
  totalPerYear: ItemTotal;
  incomeData: TransactionOrIncomeItem[];
  monthsTotals: Record<string, number>;
  incomeTotals: Record<string, number>;
  totalIncomePerYear: ItemTotal;
  totalIncomePerYearAndMonth: DataStructure;
  categoryTotals: Record<string, { name: string; y: number }>;
  totalSpent: number;
}

// Process expense data in Web Worker
self.onmessage = function (e: MessageEvent<TransactionOrIncomeItem[]>) {
  const data = e.data;
  
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
        categoryTotals[categoryKey].name = categories[categoryKey]?.label || '';
        categoryTotals[categoryKey].y = parseFloat(
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

  const processedData: ProcessedData = {
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
  };

  // Send processed data back to main thread
  self.postMessage(processedData);
};

