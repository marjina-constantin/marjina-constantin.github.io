import React, { useEffect } from 'react';
import { useAuthState, useData } from '../context';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { categories } from '../utils/constants';
import { AuthState, DataState } from '../type/types';

export default function MonthlyTotals() {
  const { data } = useData() as DataState;
  const items = data.filtered || data;
  const { currency } = useAuthState() as AuthState;

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data, currency]);

  const firstDay = data.raw[data.raw.length - 1]?.dt;
  const daysPassed: number =
    (new Date().getTime() - new Date(firstDay).getTime()) / 86400000 + 1;
  const monthsPassed: number = daysPassed / 30.42;
  const monthlyAverage: number = items.totalSpent / monthsPassed;

  const allTimeOptions = {
    chart: {
      type: 'column',
      zoomType: 'x',
    },
    title: {
      text: 'Monthly Totals',
    },
    xAxis: {
      categories: items.totals ? Object.keys(items.totals).reverse() : [],
      crosshair: true,
    },
    yAxis: {
      min: 0,
      title: {
        text: currency,
      },
      stackLabels: {
        style: {
          color: '#FFFFFF',
          fontWeight: 'bold',
        },
        enabled: true,
        verticalAlign: 'top',
      },
      plotLines: [
        {
          color: '#00a8ad',
          value: monthlyAverage,
          width: '1',
          zIndex: 4,
          dashStyle: 'ShortDot',
        },
      ],
    },
    plotOptions: {
      column: {
        pointPadding: 0.2,
        borderWidth: 0,
        stacking: 'normal',
        groupPadding: 0,
      },
    },
    credits: {
      enabled: false,
    },
    tooltip: {
      shared: true,
    },
    series: [
      {
        name: data.category
          ? categories.find((element) => element.value === data.category)?.label
          : 'Monthly totals',
        data: items.totals ? Object.values(items.totals).reverse() : [],
        colorByPoint: true,
      },
      {
        name: 'Income',
        type: 'spline',
        color: '#4DD0E1',
        visible: false,
        data: items.incomeTotals
          ? Object.values(items.incomeTotals)
              .reverse()
              .map(function (item) {
                return item;
              })
          : [],
      },
    ],
  };

  return <HighchartsReact highcharts={Highcharts} options={allTimeOptions} />;
}
