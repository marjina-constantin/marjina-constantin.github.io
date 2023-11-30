import React, {useEffect} from "react";
import {useAuthState, useData} from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function AllTimeSpendings() {
  // All time section
  const { data } = useData();
  const { currency } = useAuthState();

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data.groupedData, data.categoryTotals, data.totalSpent, currency]);

  const firstDay = data.raw[data.raw.length - 1]?.dt;
  const daysPassed = parseInt((new Date().getTime() - new Date(firstDay).getTime()) / 86400000 + 1);
  const monthsPassed = daysPassed ? parseFloat(daysPassed / 30.42).toFixed(2) : 0;
  const allTimeSpendings = {
    chart: {
      type: 'pie'
    },
    title: {
      text: 'All time spendings'
    },
    tooltip: {
      pointFormat: `{point.y} {series.name} ({point.percentage:.2f})%`
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        borderWidth: 0,
      },
    },
    series: [{
      name: currency,
      colorByPoint: true,
      data: Object.values(data.categoryTotals)
    }],
    credits: {
      enabled: false
    },
  };

  return (
    <>
      <HighchartsReact
        highcharts={Highcharts}
        options={allTimeSpendings}
      />
      <div className="average-spending">
        Total spent: {data.totalSpent} {currency} in {monthsPassed} months
      </div>
    </>
  );
}
