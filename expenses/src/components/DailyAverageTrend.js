import React from "react";
import {useData} from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function DailyAverageTrend() {

  const { data } = useData();

  const firstDay = new Date(data.raw[data.raw.length - 1]?.dt);
  const getNrOfDaysFromStart = (endDate) => {
    let difference = endDate.getTime() - firstDay.getTime();
    return (difference / (1000 * 3600 * 24)) + 1;
  }

  let dailyExpenses = {};
  let dailyIncomes = {};
  let totalExpensesAtDate = 0;
  let totalIncomesAtDate = 0;
  const dataInChronologicalOrder = data.raw.slice().reverse();

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
  if (dailyExpenses.length > 14) {
    dailyExpenses.splice(0, 14);
    dailyIncomes.splice(0, 14);
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
    series: [
      {
        name: 'Daily expenses',
        data: dailyExpenses
      },
      {
        name: 'Daily incomes',
        data: dailyIncomes
      }
    ]
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={dailyAverageOptions}
    />
  )
}
