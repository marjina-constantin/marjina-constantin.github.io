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

  const nrOfMonths = data.groupedData ? Object.keys(data.groupedData).length : 0;
  const allTimeSpendings = {
    chart: {
      type: 'pie'
    },
    title: {
      text: 'All time spendings'
    },
    plotOptions: {
      pie: {
        borderWidth: 0
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
        Total spent: {data.totalSpent} {currency} in {nrOfMonths} months
      </div>
    </>
  )
}
