import React, {useEffect} from "react";
import {useData} from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function SavingsHistory() {

  const { data } = useData();
  const items = data.raw;

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data.raw]);

  let savings = {};
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

    savings[item.dt] = [
      itemDate.getTime(),
      parseFloat(parseFloat(((totalExpensesAtDate / totalIncomesAtDate) - 1) * -100).toFixed(2)),
    ];
  }

  savings = Object.values(savings);

  if (savings.length > 14) {
    savings.splice(0, 14);
  }

  const series = [
    {
      name: 'Savings',
      data: savings,
      negativeColor: '#E91E63'
    }
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
      text: 'Savings history'
    },
    colors: ['#4DD0E1'],
    yAxis: {
      title: {
        text: '%'
      }
    },
    xAxis: {
      type: 'datetime',
    },
    tooltip: {
      xDateFormat: '%Y-%m-%d',
      valueSuffix: '%',
    },
    credits: {
      enabled: false
    },
    series: series
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={savingsOptions}
    />
  )
}