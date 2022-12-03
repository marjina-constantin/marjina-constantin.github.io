import React, {useEffect} from "react";
import {useData} from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function DailyAverageTrend() {

  const { data } = useData();
  const items = data.filtered_raw || data.raw;
  const isFiltered = !!data.filtered_raw;

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data.raw, data.filtered_raw]);

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

  const previousItem = dailyExpenses[dailyExpenses.length - 32];
  const currentItem = dailyExpenses[dailyExpenses.length - 1];
  const daysDifference = (currentItem[0] - previousItem[0]) / (1000 * 3600 * 24);
  const expensesDelta = (currentItem[1] - previousItem[1]) / daysDifference;

  for (let daysInterval = 1; daysInterval <= 30; daysInterval++) {
    dailyExpenses.push([
      new Date(new Date().setDate(new Date().getDate() + daysInterval)).setHours(0,0,0,0),
      parseFloat(parseFloat(currentItem[1] + (expensesDelta * daysInterval)).toFixed(2)),
    ]);
  }

  const series = [
    {
      name: 'Daily expenses',
      data: dailyExpenses,
      zoneAxis: 'x',
      zones: [
        { value: currentItem[0] },
        { dashStyle: 'dot'}
      ]
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
      type: 'spline',
      zoomType: 'x',
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
