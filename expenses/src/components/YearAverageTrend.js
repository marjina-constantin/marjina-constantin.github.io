import React, {useEffect} from "react";
import {useAuthState, useData} from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {formatDataForChart} from "../utils/utils";

export default function YearAverageTrend() {
  const { data } = useData();
  const { currency } = useAuthState();
  const items = data?.filtered?.totalsPerYearAndMonth || data?.totalsPerYearAndMonth;

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data?.totalsPerYearAndMonth, data?.filtered?.totalsPerYearAndMonth]);

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
      text: 'Monthly average trends',
    },
    xAxis: {
      type: "category",
      categories: formattedData.monthOrder,
    },
    yAxis: {
      title: {
        text: 'Money',
      },
    },
    tooltip: {
      shared: true,
    },
    credits: {
      enabled: false
    },
    series: formattedData.seriesData,
  };

  return (
    <>
      <HighchartsReact
        highcharts={Highcharts}
        options={dailyAverageOptions}
      />
      <span className="heading">Total spent per year:</span>
      <table className="daily-average">
        <tbody>
        {Object.entries(items).map((item, key) => {
          const sum = Object.values(item[1]).reduce((total, value) => total + value, 0);
          return (
          <tr key={key}>
            <td>{item[0]}</td>
            <td>{sum} {currency}</td>
          </tr>
        )})}
        </tbody>
      </table>
    </>
  );
}
