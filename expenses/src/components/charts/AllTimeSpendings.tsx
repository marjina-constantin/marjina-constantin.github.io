import React from 'react';
import { useAuthState, useData } from '../../context';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { AuthState, DataState } from '../../types/types';

const spendingPieColors: Record<string, string> = {
  '1': '#5b8def',
  '2': '#e06c9f',
  '3': '#e3a008',
  '4': '#8d6adf',
  '5': '#2f9d8f',
  '6': '#e07a3d',
  '7': '#d4656a',
  '8': '#7dae4a',
  '9': '#3d9ec4',
  '10': '#c9a227',
  '11': '#6e7fd6',
  '12': '#d47b6a',
  '13': '#3fafa8',
};

export default function AllTimeSpendings() {
  // All time section
  const { data } = useData() as DataState;
  const { currency } = useAuthState() as AuthState;

  const items = data.filtered || data;

  const firstDay = data.raw[data.raw.length - 1]?.dt;
  const daysPassed = parseInt(
    String((new Date().getTime() - new Date(firstDay).getTime()) / 86400000 + 1)
  );
  const monthsPassed = daysPassed
    ? parseFloat(String(daysPassed / 30.42))
    : 0;
  const yearsPassed = monthsPassed >= 12 ? Math.floor(monthsPassed / 12) : 0;
  const remainingMonths = monthsPassed >= 12 
    ? parseFloat((monthsPassed % 12).toFixed(2))
    : parseFloat(monthsPassed.toFixed(2));
  
  const timeDisplay = yearsPassed > 0
    ? `${yearsPassed} ${yearsPassed === 1 ? 'year' : 'years'}${remainingMonths > 0 ? ` and ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}` : ''}`
    : `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`;
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
        data: Object.entries(items.categoryTotals || {}).map(([id, point]) => ({
          name: point.name,
          y: point.y,
          color: spendingPieColors[id] || '#8d99ae',
        })),
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
        in {timeDisplay}
      </div>
    </>
  );
}
