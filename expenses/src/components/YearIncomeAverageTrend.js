import React from "react";
import {useAuthState, useData} from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import {formatDataForChart} from "../utils/utils";
import {monthNames} from "../utils/constants";

export default function YearIncomeAverageTrend() {
  const { data } = useData();
  const { currency } = useAuthState();

  const totalIncomePerYear = data?.totalIncomePerYear || {};
  const totalPerYear = data?.totalPerYear || {};

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
      text: 'Years in review',
    },
    xAxis: {
      type: "category",
      categories: monthNames,
    },
    yAxis: {
      title: {
        text: currency,
      },
    },
    tooltip: {
      shared: true,
    },
    credits: {
      enabled: false
    },
    series: formattedIncomeData,
  };

  return (
    <>
      <HighchartsReact
        highcharts={Highcharts}
        options={yearIncomeAverageOptions}
      />
      <span className="heading">Total income per year:</span>
      <div className="table-wrapper">
        <table className="expenses-table" cellSpacing="0" cellPadding="0">
          <thead>
            <tr>
              <th>Year</th>
              <th>Income</th>
              <th>Spent</th>
              <th>Savings</th>
            </tr>
          </thead>
          <tbody>
          {Object.entries(totalIncomePerYear).map((item, key) => {
            const diff = parseInt(item[1]) - parseInt(totalPerYear[item[0]]);
            const savingsPercent = parseFloat(parseFloat(((totalPerYear[item[0]] / item[1]) - 1) * -100).toFixed(2));
            return (
              <tr key={key}>
                <td>{item[0]}</td>
                <td>{item[1]} {currency}</td>
                <td>{totalPerYear[item[0]]} {currency}</td>
                <td>{diff} {currency} ({savingsPercent}%)</td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </>
  );
}
