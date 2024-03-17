import React, { useEffect } from 'react';
import { useAuthState, useData } from '../context';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { AuthState, DataState } from '../type/types';

export default function AllTimeSpendings() {
  // All time section
  const { data } = useData() as DataState;
  const { currency } = useAuthState() as AuthState;

  const items = data.filtered || data;

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data, currency]);

  const firstDay = data.raw[data.raw.length - 1]?.dt;
  const daysPassed = parseInt(
    String((new Date().getTime() - new Date(firstDay).getTime()) / 86400000 + 1)
  );
  const monthsPassed = daysPassed
    ? parseFloat(String(daysPassed / 30.42)).toFixed(2)
    : 0;
  const allTimeSpendings = {
    chart: {
      type: 'pie',
    },
    title: {
      text: "All Time Spending's",
    },
    tooltip: {
      pointFormat: '{point.y} {series.name} ({point.percentage:.2f})%',
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        borderWidth: 0,
      },
    },
    series: [
      {
        name: currency,
        colorByPoint: true,
        data: Object.values(items.categoryTotals),
      },
    ],
    credits: {
      enabled: false,
    },
  };

  return (
    <>
      <HighchartsReact highcharts={Highcharts} options={allTimeSpendings} />
      <div className="average-spending">
        Total spent: {parseFloat(items.totalSpent)?.toLocaleString()} {currency}{' '}
        in {monthsPassed} months
      </div>
    </>
  );
}
