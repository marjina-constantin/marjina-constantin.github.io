import React from "react";
import { useAuthState, useData } from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { formatDataForChart, formatNumber } from "../utils/utils";
import { monthNames } from "../utils/constants";

export default function YearIncomeAverageTrend() {
  const { data } = useData();
  const { currency } = useAuthState();

  const totalIncomePerYear = data?.totalIncomePerYear || {};
  const totalPerYear = data?.totalPerYear || {};
  const totalSpent = data?.totalSpent || 0;

  const formattedIncomeData = formatDataForChart(
    data?.totalIncomePerYearAndMonth,
  );

  const yearIncomeAverageOptions = {
    chart: {
      type: "line",
      zoomType: "x",
    },
    boost: {
      useGPUTranslations: true,
    },
    title: {
      text: "Years in review",
    },
    xAxis: {
      type: "category",
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
    series: formattedIncomeData,
  };

  let sumDiff = 0;
  let sumIncome = 0;
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
              const savingsPercent = parseFloat(
                parseFloat(
                  (totalPerYear[item[0]] / item[1] - 1) * -100,
                ).toFixed(2),
              );
              sumDiff += parseFloat(diff);
              sumIncome += parseFloat(item[1]);
              return (
                <tr key={key}>
                  <td>{item[0]}</td>
                  <td>
                    {formatNumber(item[1])} {currency}
                  </td>
                  <td>
                    {formatNumber(totalPerYear[item[0]])} {currency}
                  </td>
                  <td>
                    {isFinite(savingsPercent)
                      ? `${formatNumber(diff)} ${currency} (${savingsPercent}%)`
                      : `${formatNumber(diff)} ${currency}`}
                  </td>
                </tr>
              );
            })}
            <tr>
              <td>Total</td>
              <td>
                {formatNumber(sumIncome)} {currency}
              </td>
              <td>
                {formatNumber(totalSpent)} {currency}
              </td>
              <td>
                {formatNumber(sumDiff)} {currency} (
                {parseFloat(
                  parseFloat((totalSpent / sumIncome - 1) * -100).toFixed(2),
                )}
                %)
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
