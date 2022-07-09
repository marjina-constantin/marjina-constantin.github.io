import React, {useEffect} from "react";
import {useAuthState, useData} from "../context";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export default function LastMonth() {
  // Last month section
  const { data } = useData();
  const { currency } = useAuthState();

  // Re-render the component only when dependencies are changed.
  useEffect(() => {}, [data.raw, currency]);

  const lastMonthOptions = {
    chart: {
      type: 'pie'
    },
    title: {
      text: 'Last 30 days spendings'
    },
    plotOptions: {
      pie: {
        borderWidth: 0
      },

    },
    series: [{
      name: currency,
      colorByPoint: true,
      data: Object.values(data.lastMonthTotals)
    }],
    credits: {
      enabled: false
    },
  };

  return (
    <HighchartsReact
      highcharts={Highcharts}
      options={lastMonthOptions}
    />
  )
}
