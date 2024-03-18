import React, { useEffect, useState } from 'react';
import { useData } from '../context';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { TransactionOrIncomeItem, Daily, DataState } from '../type/types';

export default function DailyAverageTrend() {
  const { data } = useData() as DataState;

  const [items, setItems] = useState<TransactionOrIncomeItem[]>([]);
  const isFiltered = !!data.filtered_raw;

  // Re-render the component only when dependencies are changed.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setItems(data.filtered_raw || data.raw);
    }, 200);

    return () => {
      clearTimeout(timeout);
    };
  }, [data.raw, data.filtered_raw]);

  const firstDay = new Date(data.raw[data.raw.length - 1]?.dt);
  const getNrOfDaysFromStart = (endDate: Date) => {
    const difference = endDate.getTime() - firstDay.getTime();
    return parseInt(String(difference / (1000 * 3600 * 24))) + 1;
  };

  let dailyExpenses: Daily[] = [];
  let dailyIncomes: Daily[] = [];
  let totalExpensesAtDate = 0;
  let totalIncomesAtDate = 0;
  const dataInChronologicalOrder = items.slice().reverse();

  for (const item of dataInChronologicalOrder) {
    const itemDate = new Date((item as TransactionOrIncomeItem).dt);
    if ((item as TransactionOrIncomeItem).type === 'incomes') {
      totalIncomesAtDate =
        parseFloat(String(totalIncomesAtDate)) +
        parseFloat((item as TransactionOrIncomeItem).sum);
    } else {
      totalExpensesAtDate =
        parseFloat(String(totalExpensesAtDate)) +
        parseFloat((item as TransactionOrIncomeItem).sum);
    }

    // @ts-expect-error TBC
    dailyIncomes[(item as TransactionOrIncomeItem).dt] = [
      itemDate.getTime(),
      parseFloat(
        parseFloat(
          String(totalIncomesAtDate / getNrOfDaysFromStart(itemDate))
        ).toFixed(2)
      ),
    ];
    // @ts-expect-error TBC
    dailyExpenses[(item as TransactionOrIncomeItem).dt] = [
      itemDate.getTime(),
      parseFloat(
        parseFloat(
          String(totalExpensesAtDate / getNrOfDaysFromStart(itemDate))
        ).toFixed(2)
      ),
    ];
  }

  dailyExpenses = Object.values(dailyExpenses);
  dailyIncomes = Object.values(dailyIncomes);
  if (dailyExpenses.length > 14 && !isFiltered) {
    dailyExpenses.splice(0, 14);
    dailyIncomes.splice(0, 14);
  }

  const series = [
    {
      name: 'Daily expenses',
      data: dailyExpenses,
    },
  ];
  if (!isFiltered) {
    series.push({
      name: 'Daily incomes',
      data: dailyIncomes,
    });
  }

  const dailyAverageOptions = {
    chart: {
      type: 'line',
      zoomType: 'x',
    },
    boost: {
      useGPUTranslations: true,
    },
    title: {
      text: 'Daily average trends',
    },
    colors: ['#E91E63', '#4DD0E1'],
    yAxis: {
      title: {
        text: 'Daily average',
      },
    },
    xAxis: {
      type: 'datetime',
      crosshair: true,
    },
    tooltip: {
      xDateFormat: '%e %b %Y',
      shared: true,
      split: true,
    },
    credits: {
      enabled: false,
    },
    series: series,
  };

  return (
    <HighchartsReact highcharts={Highcharts} options={dailyAverageOptions} />
  );
}
