import React, {useEffect} from "react";
import {useAuthState, useData} from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {formatDataForChart} from "../utils/utils";

export default function YearAverageTrend() {
  const { data } = useData();
  const { currency } = useAuthState();
  const items = data?.filtered?.totalsPerYearAndMonth || data?.totalsPerYearAndMonth;
  const totalPerYear = data?.filtered?.totalPerYear || data?.totalPerYear;

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [
    data?.totalsPerYearAndMonth,
    data?.filtered?.totalsPerYearAndMonth,
    data?.totalPerYear,
    data?.filtered?.totalPerYear
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
        {Object.entries(totalPerYear).map((item, key) => {
          return (
          <tr key={key}>
            <td>{item[0]}</td>
            <td>{item[1]} {currency}</td>
          </tr>
        )})}
        </tbody>
      </table>
    </>
  );
}
