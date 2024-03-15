// @ts-nocheck
import { useEffect, useState } from 'react';
import { useData } from '../context';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

export default function DailyAverageTrend() {
  const { data } = useData();
  const [items, setItems] = useState([]);
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
  const getNrOfDaysFromStart = (endDate) => {
    const difference = endDate.getTime() - firstDay.getTime();
    return parseInt(difference / (1000 * 3600 * 24)) + 1;
  };

  const dailyExpenses = {};
  const dailyIncomes = {};
  let totalExpensesAtDate = 0;
  let totalIncomesAtDate = 0;
  const dataInChronologicalOrder = items.slice().reverse();

  for (const item of dataInChronologicalOrder) {
    const itemDate = new Date(item.dt);
    if (item.type === "incomes") {
      totalIncomesAtDate += parseFloat(item.sum);
    } else {
      totalExpensesAtDate += parseFloat(item.sum);
    }

    dailyIncomes[item.dt] = [
      itemDate.getTime(),
      parseFloat((totalIncomesAtDate / getNrOfDaysFromStart(itemDate)).toFixed(2)),
    ];
    dailyExpenses[item.dt] = [
      itemDate.getTime(),
      parseFloat((totalExpensesAtDate / getNrOfDaysFromStart(itemDate)).toFixed(2)),
    ];
  }

  const dailyExpensesValues = Object.values(dailyExpenses);
  const dailyIncomesValues = Object.values(dailyIncomes);
  if (dailyExpensesValues.length > 14 && !isFiltered) {
    dailyExpensesValues.splice(0, 14);
    dailyIncomesValues.splice(0, 14);
  }

  const series = [
    {
      name: "Daily expenses",
      data: dailyExpensesValues,
    },
  ];
  if (!isFiltered) {
    series.push({
      name: "Daily incomes",
      data: dailyIncomesValues,
    });
  }

  const dailyAverageOptions = {
    chart: {
      type: "line",
      zoomType: "x",
    },
    boost: {
      useGPUTranslations: true,
    },
    title: {
      text: "Daily average trends",
    },
    colors: ["#E91E63", "#4DD0E1"],
    yAxis: {
      title: {
        text: "Daily average",
      },
    },
    xAxis: {
      type: "datetime",
      crosshair: true,
    },
    tooltip: {
      xDateFormat: "%e %b %Y",
      shared: true,
      split: true,
    },
    credits: {
      enabled: false,
    },
    series: series,
  };

  return <HighchartsReact highcharts={Highcharts} options={dailyAverageOptions} />;
}
