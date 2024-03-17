import React, { useEffect } from 'react';
import { useAuthState, useData } from '../context';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { formatDataForChart, formatNumber } from '../utils/utils';
import { monthNames } from '../utils/constants';
import { AuthState, DataState } from '../type/types';

export default function YearAverageTrend() {
  const { data } = useData() as DataState;
  const { currency } = useAuthState() as AuthState;
  const items =
    data?.filtered?.totalsPerYearAndMonth || data?.totalsPerYearAndMonth;
  const totalPerYear = data?.filtered?.totalPerYear || data?.totalPerYear;

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [
    data?.totalsPerYearAndMonth,
    data?.filtered?.totalsPerYearAndMonth,
    data?.totalPerYear,
    data?.filtered?.totalPerYear,
  ]);

  const formattedData = formatDataForChart(items);

  const dailyAverageOptions = {
    chart: {
      type: 'line',
      zoomType: 'x',
    },
    boost: {
      useGPUTranslations: true,
    },
    title: {
      text: 'Years in review',
    },
    xAxis: {
      type: 'category',
      categories: monthNames,
      crosshair: true,
    },
    yAxis: {
      title: {
        text: currency,
      },
    },
    tooltip: {
      shared: true,
      split: true,
    },
    credits: {
      enabled: false,
    },
    series: formattedData,
  };

  return (
    <>
      <HighchartsReact highcharts={Highcharts} options={dailyAverageOptions} />
      <span className="heading">Total spent per year:</span>
      <table className="daily-average">
        <tbody>
          {Object.entries(totalPerYear).map((item, key) => {
            return (
              <tr key={key}>
                <td>{item[0]}</td>
                <td>
                  {formatNumber(item[1])} {currency}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </>
  );
}
