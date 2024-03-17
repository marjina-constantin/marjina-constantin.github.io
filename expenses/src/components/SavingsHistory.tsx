import React, { useEffect, useState } from 'react';
import { useData } from '../context';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { DataState, TransactionOrIncomeItem } from '../type/types';

interface SavingsData {
  [key: string]: [number, number];
}

export default function SavingsHistory() {
  const { data } = useData() as DataState;
  const [items, setItems] = useState<TransactionOrIncomeItem[]>([]);

  // Re-render the component only when dependencies are changed.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setItems(data.raw);
    }, 200);

    return () => {
      clearTimeout(timeout);
    };
  }, [data.raw]);

  const savings: SavingsData = {};
  let totalExpensesAtDate = 0;
  let totalIncomesAtDate = 0;
  const dataInChronologicalOrder = items.slice().reverse();

  for (const item of dataInChronologicalOrder) {
    const itemDate = new Date((item as TransactionOrIncomeItem).dt);
    if ((item as TransactionOrIncomeItem).type === 'incomes') {
      totalIncomesAtDate =
        totalIncomesAtDate + parseFloat((item as TransactionOrIncomeItem).sum);
    } else {
      totalExpensesAtDate =
        totalExpensesAtDate + parseFloat((item as TransactionOrIncomeItem).sum);
    }

    const num = Number(
      ((totalExpensesAtDate / totalIncomesAtDate - 1) * -100).toFixed(2)
    );
    savings[(item as TransactionOrIncomeItem).dt] = [itemDate.getTime(), num];
  }

  const savingsArray = Object.values(savings);

  if (savingsArray.length > 14) {
    savingsArray.splice(0, 14);
  }

  const series = [
    {
      name: 'Savings',
      data: savingsArray,
      negativeColor: '#E91E63',
    },
  ];

  const savingsOptions = {
    chart: {
      type: 'line',
      zoomType: 'x',
    },
    boost: {
      useGPUTranslations: true,
    },
    title: {
      text: 'Savings history',
    },
    colors: ['#4DD0E1'],
    yAxis: {
      title: {
        text: '%',
      },
    },
    xAxis: {
      type: 'datetime',
      crosshair: true,
    },
    tooltip: {
      xDateFormat: '%e %b %Y',
      valueSuffix: '%',
    },
    credits: {
      enabled: false,
    },
    series: series,
  };

  return <HighchartsReact highcharts={Highcharts} options={savingsOptions} />;
}
