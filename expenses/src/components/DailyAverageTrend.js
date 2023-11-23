import React, {useEffect, useState} from "react";
import {useData} from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function DailyAverageTrend() {

  const { data } = useData();
  let initialItems;
  if (data.filtered_raw) {
    initialItems = data.filtered_raw.filter((object, index) => index % 2 === 0);
  } else {
    initialItems = data.raw.filter((object, index) => index % 2 === 0);
  }

  const [items, setItems] = useState(initialItems);
  const isFiltered = !!data.filtered_raw;

  // Re-render the component only when dependencies are changed.
  useEffect(() => {
    let timeout;
    if (data.filtered_raw) {
      timeout = setTimeout(() => {
        setItems(data.filtered_raw);
      }, 250);
    } else {
      timeout = setTimeout(() => {
        setItems(data.raw);
      }, 250);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [data.raw, data.filtered_raw]);

  const firstDay = new Date(data.raw[data.raw.length - 1]?.dt);
  const getNrOfDaysFromStart = (endDate) => {
    let difference = endDate.getTime() - firstDay.getTime();
    return parseInt((difference / (1000 * 3600 * 24))) + 1;
  }

  let dailyExpenses = {};
  let dailyIncomes = {};
  let totalExpensesAtDate = 0;
  let totalIncomesAtDate = 0;
  const dataInChronologicalOrder = items.slice().reverse();

  for (let item of dataInChronologicalOrder) {
    const itemDate = new Date(item.dt);
    if (item.type === 'incomes') {
      totalIncomesAtDate = parseFloat(totalIncomesAtDate) + parseFloat(item.sum);
    }
    else {
      totalExpensesAtDate = parseFloat(totalExpensesAtDate) + parseFloat(item.sum);
    }

    dailyIncomes[item.dt] = [
      itemDate.getTime(),
      parseFloat(parseFloat(totalIncomesAtDate / getNrOfDaysFromStart(itemDate)).toFixed(2)),
    ];
    dailyExpenses[item.dt] = [
      itemDate.getTime(),
      parseFloat(parseFloat(totalExpensesAtDate / getNrOfDaysFromStart(itemDate)).toFixed(2)),
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
    }
  ];
  if (!isFiltered) {
    series.push({
      name: 'Daily incomes',
      data: dailyIncomes
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
      text: 'Daily average trends'
    },
    colors: ['#E91E63', '#4DD0E1'],
    yAxis: {
      title: {
        text: 'Daily average'
      }
    },
    xAxis: {
      type: 'datetime',
      crosshair: true,
    },
    tooltip: {
      xDateFormat: '%Y-%m-%d',
      shared: true,
    },
    credits: {
      enabled: false
    },
    series: series
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={dailyAverageOptions}
    />
  )
}
