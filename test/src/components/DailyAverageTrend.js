import React from "react";
import {useData} from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function DailyAverageTrend() {

  const { data } = useData();

  const firstDay = new Date(data.raw[data.raw.length - 1]?.dt);
  const secondMonthDate = new Date(new Date(firstDay).setDate(firstDay.getDate() + 0));
  const getNrOfDaysFromStart = (endDate) => {
    let difference = endDate.getTime() - firstDay.getTime();
    return (difference / (1000 * 3600 * 24)) + 1;
  }

  const dailyExpenses = {};
  const dailyIncomes = [];
  let totalSumAtDate = 0;
  const tomorrow = new Date().setHours(24,0,0,0);
  const dataInChronologicalOrder = data.raw.slice().reverse();

  // Expenses
  for (let item of dataInChronologicalOrder) {
    const itemDate = new Date(item.dt);
    if (item.type === 'incomes' || itemDate >= tomorrow) {
      continue;
    }

    totalSumAtDate += parseInt(item.sum);

    // Skip first month from chart.
    if (itemDate.getTime() < secondMonthDate.getTime()) {
      continue;
    }

    dailyExpenses[item.dt] = [
      itemDate.getTime(),
      parseInt(totalSumAtDate / getNrOfDaysFromStart(new Date(item.dt))),
    ];
  }

  const getDaysInMonth = (monthName) => {
    const date = new Date(monthName);
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  // Incomes
  for (const [month, value] of Object.entries(data.incomeTotals).reverse()) {
    const daysInMonth = getDaysInMonth(month);
    const dailyAverage = value === 0 ? null : parseInt(value / daysInMonth);
    for (let day = 1; day <= daysInMonth; day++) {
      // The Z at the end is intentional, to have the correct time zone.
      const itemDate = new Date(`${month} ${day}Z`);
      dailyIncomes.push([itemDate.getTime(), dailyAverage]);
    }
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
        data: Object.values(dailyExpenses)
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
