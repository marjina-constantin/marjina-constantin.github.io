import React, {useEffect} from "react";
import {useData} from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function DailyAverageTrend() {

  const { data } = useData();

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data.raw, data.filtered_raw]);

  const series = [
    {
      name: 'Daily expenses',
      data: data.dailyExpenses
    },
    {
      name: 'Daily incomes',
      data: data.dailyIncomes
    }
  ];

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
