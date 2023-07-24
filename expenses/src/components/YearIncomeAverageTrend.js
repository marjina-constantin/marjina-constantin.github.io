import React from "react";
import {useAuthState, useData} from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {formatDataForChart} from "../utils/utils";

export default function YearIncomeAverageTrend() {
  const { data } = useData();
  const { currency } = useAuthState();

  const totalIncomePerYear = data?.totalIncomePerYear || {};

  const formattedIncomeData = formatDataForChart(data?.totalIncomePerYearAndMonth);

  const yearIncomeAverageOptions = {
    chart: {
      type: 'line',
      zoomType: 'x',
    },
    boost: {
      useGPUTranslations: true,
    },
    title: {
      text: 'Monthly income average trends',
    },
    xAxis: {
      type: "category",
      categories: formattedIncomeData.monthOrder,
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
    series: formattedIncomeData.seriesData,
  };

  return (
    <>
      <HighchartsReact
        highcharts={Highcharts}
        options={yearIncomeAverageOptions}
      />
      <span className="heading">Total income per year:</span>
      <table className="daily-average">
        <tbody>
        {Object.entries(totalIncomePerYear).map((item, key) => {
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
